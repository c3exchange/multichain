import { setupMultiChain } from "."
import { encodeBase64 } from "./base64"
import { TransactionStatus, TransactionType } from "./blockchain"
import { AccountRef, AssetInstanceRef, ChainName, AssetName, TransactionRef } from "./references"

async function test(): Promise<void> {
	const multiChain = setupMultiChain()

	const fromPrivateKey = new Uint8Array(32)

	const [txId] = await multiChain.sendTransactions([
		{
			type: TransactionType.Transfer,
			from: {
				id: AccountRef.fromString('c3:accounts:ethereum:0xabcdef1234567890'),
				privateKey: encodeBase64(fromPrivateKey),
			},
			to: new AccountRef(ChainName.Ethereum, '0xabcdef1234567890'),
			amount: {
				id: new AssetInstanceRef(ChainName.Ethereum, AssetName.ETH),
				amount: '1000000',
			},
		}
	])

	const [result] = await multiChain.getTransactionsStatuses([txId])
	if (result === TransactionStatus.Confirmed) {
		console.log('Transaction confirmed')
	}


	const [randomTxnResult] = await multiChain.getTransactionsStatuses([
		TransactionRef.fromString('c3:chains:ethereum:transactions:0xabcdef1234567890')
	])
}

test().catch(console.error)
