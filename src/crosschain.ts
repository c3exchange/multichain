import { ChainName, TransactionRef } from './references'
import { Blockchain, Block, TransactionRequest, TransactionType, TransactionStatus } from './blockchain'

export class CrossChain {
	public constructor(
		private readonly _blockchains: Record<ChainName, Blockchain>,
	) {}

	// TODO: Get blockchain by name
	
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
					// Load transaction data
					const { from, to, amount } = transaction

					// Validate sender, receiver, and instrument chains
					const chain = from.id.chain
					if (chain !== to.chain) {
						throw new Error(`Cross-chain transfers are not supported: source ${chain} -> destination ${to.chain}`)
					}

					if (amount.id.chain !== chain) {
						throw new Error(`Can't use instrument from chain ${amount.id.chain} on chain ${chain}`)
					}

					// Prepare transaction
					const preparedList = prepared.get(chain) ?? []
					preparedList.push({ transaction, index })
					prepared.set(chain, preparedList)
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
