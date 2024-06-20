import {
	createTransferInstruction,
	getAssociatedTokenAddress,
	ACCOUNT_SIZE,
	getMinimumBalanceForRentExemptAccount,
	TOKEN_PROGRAM_ID,
	createInitializeAccountInstruction,
} from '@solana/spl-token'

import {
	Connection,
	PublicKey,
	TransactionMessage,
	VersionedTransaction,
	Keypair,
	ComputeBudgetProgram,
	SystemProgram,
	Signer,
	TransactionInstruction,
} from '@solana/web3.js'

import { ChainName, BlockRef, TransactionRef } from '../references'
import { Blockchain, Block, TransactionStatus, BlockchainInternalTransferRequest, TransferTransaction, PartialAssetMap } from '../blockchain'
import { decodeBase64 } from '../base64'

export class SolanaBlockchain extends Blockchain {
	private _connection: Connection

	public constructor(
		chain: ChainName,
		assets: PartialAssetMap,
		baseURL = 'https://api.mainnet-beta.solana.com',
	) {
		super(chain, assets)

		this._connection = new Connection(baseURL)
	}

	public async getCurrentBlock(): Promise<Block> {
		const round = await this._connection.getBlockHeight()

		return {
			id: new BlockRef(this.id.chain, round.toString()),
			round,
		}
	}

	public async getTransactionsStatus(transactions: TransactionRef[]): Promise<TransactionStatus[]> {
		const results = await this._connection.getSignatureStatuses(transactions.map((tx) => tx.transaction), { searchTransactionHistory: true })

		return results.value.map((result) => {
			if (result === null || result.err !== null) {
				return TransactionStatus.Failed
			} else if (result.confirmationStatus === 'finalized') {
				return TransactionStatus.Confirmed
			} else {
				return TransactionStatus.Pending
			}
		})
	}

	protected setChainSpecificFields(request: BlockchainInternalTransferRequest, baseTx: TransferTransaction): void {
		// TODO: Perform validation on each field
		request.solana = {
			creationPayerPrivateKey: baseTx.solana?.accountCreationPayer.privateKey,
			fromTokenAccount: baseTx.solana?.fromTokenAccount,
			toTokenAccount: baseTx.solana?.toTokenAccount,
		}
	}

	protected async sendTransferTransactions(transfers: BlockchainInternalTransferRequest[], timeoutMs = 30_000): Promise<TransactionRef[]> {
		// TODO: Handle timeout
		const getTA = async (payer: Signer, owner: PublicKey, asset: PublicKey, tokenAccount?: PublicKey): Promise<{ key: PublicKey, instructions: TransactionInstruction[] }> => {
			// If the token account is not provided, use the ATA for the owner
			if (tokenAccount === undefined) {
				tokenAccount = await getAssociatedTokenAddress(asset, owner, true)
			}

			// Check if the token account exists
			try {
				await this._connection.getAccountInfo(tokenAccount)
			} catch (error) {
				// If the token account does not exist, create it
				const createAccountInstruction = SystemProgram.createAccount({
					fromPubkey: payer.publicKey,
					newAccountPubkey: tokenAccount,
					space: ACCOUNT_SIZE,
					lamports: await getMinimumBalanceForRentExemptAccount(this._connection),
					programId: TOKEN_PROGRAM_ID,
				})

				const initTokenAccountInstruction = createInitializeAccountInstruction(
					tokenAccount,
					asset,
					owner,
				)

				return {
					key: tokenAccount,
					instructions: [createAccountInstruction, initTokenAccountInstruction],
				}
			}

			// No need to create it, just return the token account
			return {
				key: tokenAccount,
				instructions: [],
			}
		}

		const genericTransfer = (fromTA: PublicKey, toTA: PublicKey, from: PublicKey, asset: string, amount: number | bigint) => {
			if (asset === SystemProgram.programId.toBase58()) {
				return SystemProgram.transfer({
					fromPubkey: fromTA,
					toPubkey: toTA,
					lamports: amount,
				})
			} else {
				return createTransferInstruction(
					fromTA,
					toTA,
					new PublicKey(from),
					amount,
				)
			}
		}

		const blockhash = await this._connection.getLatestBlockhash()

		return Promise.all(transfers.map(async (transfer) => {
			// Extract transfer info
			const payer = Keypair.fromSecretKey(decodeBase64(transfer.fromPrivateKey))
			const fromAccount = payer.publicKey
			const toAccount = new PublicKey(transfer.to)
			const asset = new PublicKey(transfer.asset)
			
			// Extract token accounts
			const mapTA = (ta?: string) => ta ? new PublicKey(ta) : undefined
			const fromTABase = mapTA(transfer.solana?.fromTokenAccount)
			const toTABase = mapTA(transfer.solana?.toTokenAccount)

			// Get/create relevant TAs
			const { key: fromTA, instructions: fromTAInstructions } = await getTA(payer, fromAccount, asset, fromTABase)
			const { key: toTA, instructions: toTAInstructions } = await getTA(payer, toAccount, asset, toTABase)

			// Create priority instruction
			const getNetworkPriorityRate = async () => {
				const fees = await this._connection.getRecentPrioritizationFees({ lockedWritableAccounts: [fromTA, toTA, asset] })
				
				// Average fees with an exponential moving average
				const alpha = 0.9

				let sum = 0
				let weight = 0
				let scale = 1
				for (let i = fees.length - 1; i >= 0; i--) {
					sum += fees[i].prioritizationFee * scale
					weight += scale
					scale *= alpha
				}

				return sum / weight
			}

			const priorityRate = transfer.solana?.priorityRate ?? await getNetworkPriorityRate()
			const priorityInstruction = ComputeBudgetProgram.setComputeUnitPrice({ microLamports: priorityRate })

			// Create transfer instruction
			const transferInstruction = genericTransfer(fromTA, toTA, new PublicKey(transfer.from), transfer.asset, transfer.amount)

			// Create message
			const message = new TransactionMessage({
				payerKey: new PublicKey(transfer.from),
				recentBlockhash: blockhash.blockhash,
				instructions: [priorityInstruction, ...fromTAInstructions, ...toTAInstructions, transferInstruction],
			})

			// Create transaction
			const txn = new VersionedTransaction(message.compileToV0Message())

			// Sign transaction
			txn.sign([Keypair.fromSecretKey(decodeBase64(transfer.fromPrivateKey))])

			// Send transaction
			const signature = await this._connection.sendRawTransaction(txn.serialize())

			// Encode result
			return new TransactionRef(ChainName.Solana, signature)
		}))
	}
}
