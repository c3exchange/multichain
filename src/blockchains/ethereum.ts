import { ContractAbi, Web3 } from 'web3'
import { Contract } from 'web3-eth-contract'

import { ChainName, BlockRef, TransactionRef } from '../references'
import { Blockchain, Block, TransactionStatus, BlockchainInternalTransferRequest, TransferTransaction, PartialAssetMap } from '../blockchain'

const ABI_ERC20 = [
	{
		constant: false,
		inputs: [
			{ name: 'to', type: 'address' },
			{ name: 'value', type: 'uint256' },
		],
		name: 'transfer',
		outputs: [
			{ name: '', type: 'bool' }
		],
		type: 'function',
	}
]

export class EthereumBlockchain extends Blockchain {
	private _web3: Web3
	private _sentPending = new Set<string>()
	private _contractCache: Record<string, Contract<ContractAbi>> = {}

	public constructor(
		chain: ChainName,
		assets: PartialAssetMap,
		rpcUrl: string,
		private readonly _roundsToFinalize = 12,
	) {
		super(chain, assets)

		this._web3 = new Web3(rpcUrl)

		// Extend the web3 object with the txpool method
		this._web3.extend({
			property: 'txpool',
			methods: [
				{
					name: 'content',
					call: 'txpool_content',
				},
			],	
		})
	}

	public async getCurrentBlock(): Promise<Block> {
		const round = await this._web3.eth.getBlockNumber()

		return {
			id: new BlockRef(this.id.chain, round.toString()),
			round: Number(round),
		}
	}

	public async getTransactionsStatus(transactions: TransactionRef[]): Promise<TransactionStatus[]> {
		const blockNumber = await this._web3.eth.getBlockNumber()

		// TODO: Use batching
		return Promise.all(transactions.map(async (ref) => {
			// If it's in the sent pending set, it's still pending
			if (this._sentPending.has(ref.transaction)) {
				return TransactionStatus.Pending
			}

			// Look up the transaction receipt
			const receipt = await this._web3.eth.getTransactionReceipt(ref.transaction)
			if (receipt === null) {
				// No receipt means it's still pending or failed, check pending transactions to be sure
				// NOTE: Strange interface because we're calling an extension method
				const pending = await (this._web3 as any).txpool.content()
			}

			// If the receipt is there, check the status
			if (receipt.status === 0n) {
				return TransactionStatus.Failed
			}

			// Check the block number to see if it's confirmed
			const confirmed = Number(receipt.blockNumber) + this._roundsToFinalize <= blockNumber
			return confirmed ? TransactionStatus.Confirmed : TransactionStatus.Pending
		}))
	}
	
	protected setChainSpecificFields(request: BlockchainInternalTransferRequest, baseTx: TransferTransaction): void {
		// Ethereum does not require any chain-specific fields	
	}

	protected sendTransferTransactions(transfers: BlockchainInternalTransferRequest[]): Promise<TransactionRef[]> {
		// TODO: Use batching
		return Promise.all(transfers.map(async (transfer) => {
			const createTransferTransaction = async (transfer: BlockchainInternalTransferRequest) => {
				const gasPrice = await this._web3.eth.getGasPrice()

				if (transfer.asset === '0x0000000000000000000000000000000000000000') {
					// Ether transfer
					return {
						from: transfer.from,
						to: transfer.to,
						value: transfer.amount,
						gasLimit: 21_000,
						gasPrice,
					}
				} else {
					// Token transfer

					// NOTE/FIXME: This will only work if address is actually an ERC20 token
					// TODO: Include other token types, somehow tag them or look up the token type
					const contract = this._contractCache[transfer.asset] ??= new this._web3.eth.Contract(ABI_ERC20, transfer.asset)
					const nonce = await this._web3.eth.getTransactionCount(transfer.from)

					return {
						from: transfer.from,
						to: transfer.asset,
						value: 0,
						data: contract.methods.transfer(transfer.to, transfer.amount).encodeABI(),
						nonce,
						gasLimit: 210_000, // TODO: Estimate gas?
						gasPrice,
					}
				}
			}
			
			const baseTxn = await createTransferTransaction(transfer)
			const signedTxn = await this._web3.eth.accounts.signTransaction(baseTxn, transfer.fromPrivateKey)
			const result = this._web3.eth.sendSignedTransaction(signedTxn.rawTransaction)

			return new Promise((resolve, reject) => {
				result.once('transactionHash', (hash) => {
					this._sentPending.add(hash)
					resolve(new TransactionRef(this.id.chain, hash))
				})

				const roundsToFinalize = this._roundsToFinalize
				const sentPending = this._sentPending
				result.on('confirmation', function confirmationCheck({ confirmations, receipt }) {
					// NOTE: The cache will only return up to 12 confirmations
					const CAHED_ROUNDS_MAX = 12
					const confirmRounds = Math.min(CAHED_ROUNDS_MAX, roundsToFinalize)

					// If we have enough confirmations or the transaction failed, remove it from the pending set
					if (confirmations >= confirmRounds || receipt.status === 0n) {
						sentPending.delete(receipt.transactionHash)
						result.off('confirmation', confirmationCheck)
					}
				})

				result.once('error', (error) => {
					reject(error)
				})
			})
		}))
	}
}
