import BigNumber from 'bignumber.js'

import { Base64String } from './base64'
import { ChainName, AssetName, AssetRef, AssetInstanceRef, AccountRef, BlockRef, ChainRef, TransactionRef, AccountRefString, AssetInstanceRefString } from './references'

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
	id: AssetInstanceRefString
	amount: DecimalString
}

export interface Account {
	id: AccountRefString
	privateKey: Base64String
}

export enum TransactionType {
	Transfer = 'transfer',
}

export interface TransferTransaction {
	type: TransactionType.Transfer
	from: Account
	to: AccountRefString
	amount: ChainAssetAmount

	[ChainName.Solana]?: {
		accountCreationPayer: Account
		fromTokenAccount: AccountRefString
		toTokenAccount: AccountRefString
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
			switch (baseTx.type) {
				case TransactionType.Transfer: {
					// Verify sender is on the same chain
					const localChain = this.id.chain
					const from = AccountRef.fromString(baseTx.from.id)
					if (from.chain !== localChain) {
						throw new Error(`Sender account is on ${from.chain}, but transaction is being processed by ${this.id}`)
					}

					// Verify receiver is on the same chain
					const to = AccountRef.fromString(baseTx.to)
					if (to.chain !== localChain) {
						throw new Error(`Receiver account is on ${to.chain}, but transaction is being processed by ${this.id}`)
					}

					// Verify sender and receiver are different
					if (from.account === to.account) {
						throw new Error(`Both sender and receiver are the same: ${from.account}`)
					}

					// Verify asset is on the same chain
					const asset = AssetInstanceRef.fromString(baseTx.amount.id)
					if (asset.chain !== localChain) {
						throw new Error(`Reference to asset ${asset.asset} is on ${asset.chain}, but transaction is being processed by ${this.id}`)
					}

					// Try to load the asset instance data
					const assetData = this._assets[asset.asset]
					if (!assetData) {
						throw new Error(`Entry for asset ${asset.asset} not found`)
					}

					const chainData = assetData.chains[localChain]
					if (!chainData) {
						throw new Error(`Entry for asset ${asset.asset} not found on chain ${localChain}`)
					}

					// Get instance data
					const instanceData = chainData[asset.instance]
					if (!instanceData) {
						const displayName = asset.instance == '' ? '[DEFAULT]' : asset.instance
						throw new Error(`Entry for asset ${asset.asset} instance ${displayName} not found on chain ${localChain}`)
					}

					// Scale amount based on decimals
					const scale = new BigNumber(10).exponentiatedBy(instanceData.decimals)
					const amountScaled = BigInt(new BigNumber(baseTx.amount.amount).multipliedBy(scale).toFixed())

					// Create transfer request
					const request: BlockchainInternalTransferRequest = {
						from: from.account,
						fromPrivateKey: baseTx.from.privateKey,
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
