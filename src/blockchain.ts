import BigNumber from 'bignumber.js'

import { Base64String } from './base64'
import { ChainName, AssetName, AssetRef, AssetInstanceRef, AccountRef, BlockRef, ChainRef, TransactionRef } from './references'

export type RawChainRef = string

export interface AssetInstanceData {
	decimals: number
	id: RawChainRef
}

export interface AssetData {
	chains: Partial<Record<ChainName, Record<string, AssetInstanceData>>>
}

export type AssetMap = Record<AssetName, AssetData>

export type DecimalString = string

export interface AssetAmount {
	id: AssetRef
	amount: DecimalString
}

export interface ChainAssetAmount {
	id: AssetInstanceRef
	amount: DecimalString
}

export interface Account {
	id: AccountRef
	privateKey: Base64String
}

export enum TransactionType {
	Transfer = 'transfer',
}

export interface TransferTransaction {
	type: TransactionType.Transfer
	from: Account
	to: AccountRef
	amount: ChainAssetAmount

	[ChainName.Solana]?: {
		accountCreationPayer: Account
		fromTokenAccount: AccountRef
		toTokenAccount: AccountRef
	}
}

export type TransactionRequest = TransferTransaction

export enum TransactionStatus {
	Pending = 'pending',
	Confirmed = 'confirmed',
	Failed = 'failed',
}

export interface Block {
	id: BlockRef
	round: number
}

export interface BlockchainInternalTransferRequest {
	from: string
	fromPrivateKey: Base64String
	to: string
	amount: bigint
	asset: string

	[ChainName.Solana]?: {
		creationPayerPrivateKey?: string
		fromTokenAccount?: string
		toTokenAccount?: string
	}
}

export abstract class Blockchain {
	private readonly _id: ChainRef

	public constructor(
		chain: ChainName,
		protected readonly _assets: AssetMap,
	) {
		this._id = new ChainRef(chain)
	}

	public get id(): ChainRef {
		return this._id
	}

	public abstract getCurrentBlock(): Promise<Block>
	public abstract getTransactionsStatus(transactions: TransactionRef[]): Promise<TransactionStatus[]>

	public sendTransactions(transactions: TransactionRequest[]): Promise<TransactionRef[]> {
		const pending: BlockchainInternalTransferRequest[] = []

		for (let baseTx of transactions) {
			// Load and unref transaction data
			const { type, from, to, amount } = baseTx

			switch (type) {
				case TransactionType.Transfer: {
					// Verify sender is on the same chain
					const localChain = this.id.chain
					const fromChain = from.id.chain
					if (fromChain !== localChain) {
						throw new Error(`Sender account is on ${fromChain}, but transaction is being processed by ${this.id}`)
					}

					// Verify receiver is on the same chain
					const toChain = to.chain
					if (toChain !== localChain) {
						throw new Error(`Receiver account is on ${toChain}, but transaction is being processed by ${this.id}`)
					}

					// Verify sender and receiver are different
					if (from.id.account === to.account) {
						throw new Error(`Both sender and receiver are the same: ${from.id.account}`)
					}

					// Load asset amount data
					const { id, amount: amountValue } = amount

					// Unref asset data
					const assetData = this._assets[id.asset]
					if (!assetData) {
						throw new Error(`Asset ${id.asset} not found`)
					}

					// Unref chain asset data
					const chainData = assetData.chains[localChain]
					if (!chainData) {
						throw new Error(`Asset ${id.asset} not found on ${this.id}`)
					}

					// Get instance data
					const instanceData = chainData[id.instance]

					// Scale amount based on decimals
					const scale = new BigNumber(10).exponentiatedBy(instanceData.decimals)
					const amountScaled = BigInt(new BigNumber(amountValue).multipliedBy(scale).toFixed())

					// Create transfer request
					const request: BlockchainInternalTransferRequest = {
						from: from.id.account,
						fromPrivateKey: from.privateKey,
						to: to.account,
						amount: amountScaled,
						asset: instanceData.id,
					}

					// Set chain-specific fields
					this.setChainSpecificFields(request, baseTx)

					// Add to pending list
					pending.push(request)
				}
			}
		}

		return this.sendTransferTransactions(pending)
	}

	protected abstract setChainSpecificFields(request: BlockchainInternalTransferRequest, baseTx: TransferTransaction): void
	protected abstract sendTransferTransactions(transfers: BlockchainInternalTransferRequest[]): Promise<TransactionRef[]>
}
