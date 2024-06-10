import { setupCrossChain } from "."
import { encodeBase64 } from "./base64"
import { TransactionStatus, TransactionType } from "./blockchain"
import { AccountRef, ChainInstrumentRef, ChainName, InstrumentName, TransactionRef } from "./references"

const crossChain = setupCrossChain({
	instruments: {
		[InstrumentName.ETH]: {
			chains: {
				[ChainName.Ethereum]: {
					'': {
						id: '0xabcdef1234567890',
						decimals: 18,
					},
				},
			},
		},
	},
	chains: {
		[ChainName.Ethereum]: {
			apiUrl: 'https://ethereum-rpc.publicnode.com',
			roundsToFinalize: 12,
		},
		[ChainName.Solana]: {
			apiUrl: 'https://api.mainnet-beta.solana.com',
			priorityRate: 12345,
		},
		[ChainName.Algorand]: {
			apiUrl: 'https://mainnet-api.algonode.cloud',
			indexerUrl: 'https://mainnet-idx.algonode.cloud',
		},
		[ChainName.Arbitrum]: {
			apiUrl: 'https://arbitrum-rpc.publicnode.com',
			roundsToFinalize: 12,
		},
		// ...
	},
})

const fromPrivateKey = new Uint8Array(32)

const [txId] = await crossChain.sendTransactions([
	{
		type: TransactionType.Transfer,
		from: {
			id: AccountRef.fromString('c3:accounts:ethereum:0xabcdef1234567890'),
			privateKey: encodeBase64(fromPrivateKey),
		},
		to: new AccountRef(ChainName.Ethereum, '0xabcdef1234567890'),
		amount: {
			id: new ChainInstrumentRef(ChainName.Ethereum, InstrumentName.ETH),
			amount: '1000000',
		},
	}
])

const [result] = await crossChain.getTransactionsStatuses([txId])
if (result === TransactionStatus.Confirmed) {
	console.log('Transaction confirmed')
}


const [randomTxnResult] = await crossChain.getTransactionsStatuses([
	TransactionRef.fromString('c3:chains:ethereum:transactions:0xabcdef1234567890')
])
