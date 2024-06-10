import BigNumber from 'bignumber.js'

import { Base64String } from './base64'
import { ChainName, InstrumentName, InstrumentRef, ChainInstrumentRef, AccountRef, BlockRef, ChainRef, TransactionRef } from './references'

export type RawChainRef = string

export interface InstrumentInstanceData {
	decimals: number
	id: RawChainRef
}

export interface InstrumentData {
	chains: Partial<Record<ChainName, Record<string, InstrumentInstanceData>>>
}

export type InstrumentMap = Record<InstrumentName, InstrumentData>

export type DecimalString = string

export interface InstrumentAmount {
	id: InstrumentRef
	amount: DecimalString
}

export interface ChainInstrumentAmount {
	id: ChainInstrumentRef
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
	amount: ChainInstrumentAmount
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
	fromTokenAccount?: string
	to: string
	toTokenAccount?: string
	amount: bigint
	instrument: string
}

export abstract class Blockchain {
	private readonly _id: ChainRef

	public constructor(
		name: ChainName,
		protected readonly _instruments: InstrumentMap,
	) {
		this._id = new ChainRef(name)
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
					const fromChain = from.id.chain
					const localChain = this.id.chain
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

					// Load instrument amount data
					const { id, amount: amountValue } = amount

					// Unref instrument data
					const instrumentData = this._instruments[id.instrument]
					if (!instrumentData) {
						throw new Error(`Instrument ${id.instrument} not found`)
					}

					// Unref chain instrument data
					const chainData = instrumentData.chains[localChain]
					if (!chainData) {
						throw new Error(`Instrument ${id.instrument} not found on ${this.id}`)
					}

					// Get instance data
					const instanceData = chainData[id.instance]

					// Scale amount based on decimals
					const scale = new BigNumber(10).exponentiatedBy(instanceData.decimals)
					const amountScaled = BigInt(new BigNumber(amountValue).multipliedBy(scale).toFixed())

					// Create transfer request
					pending.push({
						from: from.id.account,
						fromPrivateKey: from.privateKey,
						to: to.account,
						amount: amountScaled,
						instrument: instanceData.id,
					})
				}
			}
		}

		return this.sendTransferTransactions(pending)
	}

	protected abstract sendTransferTransactions(transfers: BlockchainInternalTransferRequest[]): Promise<TransactionRef[]>
}
