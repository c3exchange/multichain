import { setupMultiChain } from '../src'
import { TransactionRequest, TransactionType } from '../src/blockchain'
import { MultiChain } from '../src/multichain'
import { ChainName, TransactionRef } from '../src/references'

async function testGetCurrentBlocks(multi: MultiChain): Promise<void> {
	const blocks = await multi.getCurrentBlocks()
	console.log(blocks)
}

async function testSendTransactions(multi: MultiChain): Promise<TransactionRef[]> {
	const transactions: TransactionRequest[] = [
		{
			type: TransactionType.Transfer,
			from: {
				id: 'c3:chains:avalanche:0xf2e791718CF3659e7629F738A8e479d8c59C6581',
				privateKey: '<REDACTED>',
			},
			to: `c3:chains:avalanche:0xEEE612a77e786b14d8BA8180507c9504BcD84846`,
			amount: {
				id: 'c3:chains:avalanche:avax',
				amount: '1.00',
			},
		},
	]

	const results = await multi.sendTransactions(transactions)
	return results
}

async function testGetTransactionStatus(multi: MultiChain, transactions: TransactionRef[]): Promise<void> {
	const results = await multi.getTransactionsStatuses(transactions)
	console.log(results)
}

async function main(): Promise<void> {
	const multi = setupMultiChain({
		chains: {
			[ChainName.Avalanche]: {
				apiUrl: 'https://avalanche-fuji.blockpi.network/v1/rpc/public',
				roundsToFinalize: 12,
			},
		},
	})

	await testGetCurrentBlocks(multi)
	const txs = await testSendTransactions(multi)
	console.log(txs.map(tx => tx.toString()))
	await testGetTransactionStatus(multi, txs)
}

main().catch(console.error)
