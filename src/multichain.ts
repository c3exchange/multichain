import { AccountRef, AssetInstanceRef, ChainName, TransactionRef } from './references'
import { Blockchain, Block, TransactionRequest, TransactionType, TransactionStatus, TransactionStatusTag } from './blockchain'

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
		// Create index map
		const index = new Map(transactions.map((ref, index) => [ref, index]))

		// Sort transations by chain
		const prepared = new Map<ChainName, TransactionRef[]>()
		for (let i = 0; i < transactions.length; i++) {
			const ref = transactions[i]

			const preparedList = prepared.get(ref.chain) ?? []
			preparedList.push(ref)
			prepared.set(ref.chain, preparedList)
		}

		// Get transactions status for each chain
		const results = new Array<TransactionStatus>(transactions.length)
		await Promise.all([...prepared.entries()].map(async ([chain, transactions]) => {
			const blockchain = this._blockchains[chain]
			if (!blockchain) {
				throw new Error(`Blockchain not found: ${chain}`)
			}

			const result = await blockchain.getTransactionsStatus(transactions)

			for (let i = 0; i < result.length; i++) {
				results[index.get(transactions[i])!] = result[i]
			}
		}))

		return results
	}

	public async waitForTransactions(transactions: TransactionRef[], repeatMs = 5_000): Promise<TransactionStatus[]> {
		const result = new Array<TransactionStatus>(transactions.length)
		const index = new Map(transactions.map((ref, index) => [ref, index]))

		while (transactions.length > 0) {
			// Get transactions status
			const statuses = await this.getTransactionsStatuses(transactions)
			
			// Update pending list
			for (let i = transactions.length - 1; i >= 0; i--) {
				if (statuses[i].tag !== TransactionStatusTag.Pending) {
					const resultIndex = index.get(transactions[i])!
					result[resultIndex] = statuses[i]
					transactions.splice(i, 1)
				}
			}

			// Wait for next poll
			await new Promise((resolve) => setTimeout(resolve, repeatMs))
		}

		return result
	}
}
