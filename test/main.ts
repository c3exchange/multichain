import { setupMultiChain } from '../src'
import { TransactionRequest, TransactionType } from '../src/blockchain'
import { MultiChain } from '../src/multichain'
import { AccountRef, AssetInstanceRef, AssetRef, ChainName, TransactionRef } from '../src/references'

async function testGetCurrentBlocks(multi: MultiChain): Promise<void> {
	const blocks = await multi.getCurrentBlocks()
	console.log(blocks)
}

async function testSendTransactions(multi: MultiChain): Promise<TransactionRef[]> {
	const algoFromAddress = ''
	const algoFromPrivateKey = ''
	const algoToAddress = ''

	const transactions: TransactionRequest[] = [
		{
			type: TransactionType.Transfer,
			from: {
				id: AccountRef.fromString(`c3:chains:algorand:${algoFromAddress}`),
				privateKey: algoFromPrivateKey,
			},
			to: AccountRef.fromString(`c3:chains:algorand:${algoToAddress}`),
			amount: {
				id: AssetInstanceRef.fromString('c3:chains:algorand:assets:algo'),
				amount: '1.00'
			},
		}
	]

	const results = await multi.sendTransactions(transactions)
	return results
}

async function testGetTransactionStatus(multi: MultiChain, transactions: TransactionRef[]): Promise<void> {
	const results = await multi.getTransactionsStatuses(transactions)
	console.log(results)
}

async function main(): Promise<void> {
	const multi = setupMultiChain()
	await testGetCurrentBlocks(multi)
	const txs = await testSendTransactions(multi)
	console.log(txs.map(tx => tx.toString()))
	await testGetTransactionStatus(multi, txs)
}

main().catch(console.error)
