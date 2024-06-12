import algosdk from 'algosdk'
import axios, { AxiosInstance } from 'axios'

import { decodeBase64 } from '../base64'
import { ChainName, BlockRef, TransactionRef } from '../references'
import { Blockchain, Block, BlockchainInternalTransferRequest, TransactionStatus, TransferTransaction, PartialAssetMap } from '../blockchain'

interface AlgorandParams {
	fee: number
	flatFee?: boolean
	firstRound: number
	lastRound: number
	genesisID: string
	genesisHash: string
}

export class AlgorandBlockchain extends Blockchain {
	private readonly _api: AxiosInstance
	private readonly _indexer: AxiosInstance

	public constructor(
		chain: ChainName,
		assets: PartialAssetMap,
		apiUrl: string,
		indexerUrl: string,
	) {
		super(chain, assets)

		this._api = axios.create({
			baseURL: apiUrl,
		})

		this._indexer = axios.create({
			baseURL: indexerUrl,
		})
	}

	public async getCurrentBlock(): Promise<Block> {
		const result = await this._api.get('/v2/status')
		const round = result.data['last-round']

		return {
			id: new BlockRef(ChainName.Algorand, round.toString()),
			round,
		}
	}

	public async getTransactionsStatus(transactions: TransactionRef[]): Promise<TransactionStatus[]> {
		return Promise.all(transactions.map(async (ref) => {
			// First check API pending tx list
			const apiResult = await this._api.get(`/v2/transactions/pending/${ref.transaction}`)
			const apiStatus = apiResult.status
			const apiRound = apiResult.data['confirmed-round']
			const apiPoolError = apiResult.data['pool-error']
			if (apiStatus === 200) {
				if (apiRound > 0) {
					return TransactionStatus.Confirmed
				} else if (apiRound === 0 && apiPoolError === '') {
					return TransactionStatus.Pending
				}
			}

			// Then check indexer for older transactions
			const indexerResult = await this._indexer.get(`/v2/transactions/${ref.transaction}`)
			const indexerStatus = indexerResult.status
			const indexerRound = indexerResult.data.transaction['confirmed-round']
			if (indexerStatus === 200 && indexerRound > 0) {
				return TransactionStatus.Confirmed
			}

			return TransactionStatus.Failed
		}))
	}
	
	protected setChainSpecificFields(request: BlockchainInternalTransferRequest, baseTx: TransferTransaction): void {
		// Algorand does not require any chain-specific fields
	}

	protected async sendTransferTransactions(transfers: BlockchainInternalTransferRequest[]): Promise<TransactionRef[]> {
		const paramsResult = await this._api.get('/v2/transactions/params')
		
		const params: AlgorandParams = {
			fee: 1000,
			flatFee: true,
			firstRound: paramsResult.data['last-round'],
			lastRound: paramsResult.data['last-round'] + 1000,
			genesisID: paramsResult.data['genesis-id'],
			genesisHash: paramsResult.data['genesis-hash'],
		}

		const preparePayTxn = (from: string, to: string, amount: number | bigint, assetId: number) => {
			if (assetId === 0) {
				return algosdk.makePaymentTxnWithSuggestedParams(from, to, amount, undefined, undefined, params)
			} else {
				return algosdk.makeAssetTransferTxnWithSuggestedParams(from, to, undefined, undefined, amount, undefined, assetId, params)
			}
		}

		const results: TransactionRef[] = []
		for (const transfer of transfers) {
			// Prepare transaction
			const assetId = parseInt(transfer.asset)
			const txn = preparePayTxn(transfer.from, transfer.to, transfer.amount, assetId)
			const signedTxn = txn.signTxn(decodeBase64(transfer.fromPrivateKey))

			// Send transaction
			const result = await this._api.post('/v2/transactions', signedTxn, {
				headers: { 'Content-Type': 'application/x-binary' },
			})

			// Push transaction reference
			results.push(new TransactionRef(ChainName.Algorand, result.data.txId))
		}

		return results
	}
}
