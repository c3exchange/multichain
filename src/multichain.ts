import { AccountRef, AssetInstanceRef, ChainName, TransactionRef } from './references'
import { Blockchain, Block, TransactionRequest, TransactionType, TransactionStatus } from './blockchain'

export class MultiChain {
	public constructor(
		private readonly _blockchains: Record<ChainName, Blockchain>,
	) {}

	public getBlockchain(chain: ChainName): Blockchain {
		const blockchain = this._blockchains[chain]
		if (!blockchain) {
			throw new Error(`Blockchain not found: ${chain}`)
		}

		return blockchain
	}
	
	public async getCurrentBlocks(): Promise<Record<ChainName, Block>> {
		const entries = Object.entries(this._blockchains)
		const statuses = await Promise.all(entries.map(async ([name, blockchain]) => [name, await blockchain.getCurrentBlock()]))
		return Object.fromEntries(statuses)
	}

	public async sendTransactions(transactions: TransactionRequest[]): Promise<TransactionRef[]> {
		// Prepare transactions for each chain
		const prepared = new Map<ChainName, { transaction: TransactionRequest, index: number }[]>()

		for (let index = 0; index < transactions.length; index++) {
			const transaction = transactions[index]

			switch (transaction.type) {
				case TransactionType.Transfer: {
					// Validate transaction from, to, and asset are all on the same chain
					const from = AccountRef.fromString(transaction.from.id)
					const to = AccountRef.fromString(transaction.to)
					if (from.chain !== to.chain) {
						throw new Error(`Cannot transfer from ${from.chain} to ${to.chain}. Ensure both accounts are on the same chain.`)
					}

					const asset = AssetInstanceRef.fromString(transaction.amount.id)
					if (asset.chain !== from.chain) {
						throw new Error(`Cannot transfer asset instance ${asset.toString()} on chain ${asset.chain}, from and to accounts are on chain ${from.chain}`)
					}

					// Prepare transaction
					const preparedList = prepared.get(from.chain) ?? []
					preparedList.push({ transaction, index })
					prepared.set(from.chain, preparedList)
					break
				}
				default: {
					throw new Error('Unknown transaction type')
				}
			}
		}

		// Send transactions for each chain
		const results = new Array<TransactionRef>(transactions.length)
		await Promise.all([...prepared.entries()].map(async ([chain, transactions]) => {
			const blockchain = this._blockchains[chain]
			if (!blockchain) {
				throw new Error(`Blockchain not found: ${chain}`)
			}

			const result = await blockchain.sendTransactions(transactions.map(({ transaction }) => transaction))

			for (let index = 0; index < result.length; index++) {
				results[transactions[index].index] = result[index]
			}
		}))

		return results
	}

	public async getTransactionsStatuses(transactions: TransactionRef[]): Promise<TransactionStatus[]> {
		// Sort transations by chain
		const prepared = new Map<ChainName, { ref: TransactionRef, index: number }[]>()
		for (let index = 0; index < transactions.length; index++) {
			const ref = transactions[index]

			const chain = ref.chain
			const preparedList = prepared.get(chain) ?? []
			preparedList.push({ ref, index })
			prepared.set(chain, preparedList)
		}

		// Get transactions status for each chain
		const results = new Array<TransactionStatus>(transactions.length)
		await Promise.all([...prepared.entries()].map(async ([chain, transactions]) => {
			const blockchain = this._blockchains[chain]
			if (!blockchain) {
				throw new Error(`Blockchain not found: ${chain}`)
			}

			const result = await blockchain.getTransactionsStatus(transactions.map(({ ref }) => ref))

			for (let index = 0; index < result.length; index++) {
				results[transactions[index].index] = result[index]
			}
		}))

		return results
	}
}
