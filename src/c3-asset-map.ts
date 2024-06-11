import { SystemProgram } from '@solana/web3.js'
import { AssetMap } from './blockchain'
import { AssetName, ChainName } from './references'

export const C3_ASSET_MAP: AssetMap = {
	[AssetName.ALGO]: {
		chains: {
			[ChainName.Algorand]: {
				'': {
					id: '0',
					decimals: 6,
				},
			},
		},
	},
	[AssetName.ARB]: {
		chains: {
			[ChainName.Algorand]: {
				'wormhole': {
					id: '1221549217',
					decimals: 8,
				}
			},
			[ChainName.Arbitrum]: {
				'': {
					id: '0x0000000000000000000000000000000000000000',
					decimals: 18,
				},
			},
		},
	},
	[AssetName.AVAX]: {
		chains: {
			[ChainName.Algorand]: {
				'wormhole': {
					id: '893309613',
					decimals: 8,
				},
			},
			[ChainName.Avalanche]: {
				'': {
					id: '0x0000000000000000000000000000000000000000',
					decimals: 18,
				},
			},
		},
	},
	[AssetName.BNB]: {
		chains: {
			[ChainName.Algorand]: {
				'wormhole': {
					id: '891648844',
					decimals: 8,
				},
			},
			[ChainName.Binance]: {
				'': {
					id: '0x0000000000000000000000000000000000000000',
					decimals: 18,
				},
			},
		},
	},
	[AssetName.BTC]: {
		chains: {
			[ChainName.Algorand]: {
				'wormhole': {
					id: '1058926737',
					decimals: 8,
				},
			},
		},
	},
	[AssetName.ETH]: {
		chains: {
			[ChainName.Algorand]: {
				'wormhole': {
					id: '887406851',
					decimals: 8,
				},
			},
			[ChainName.Ethereum]: {
				'': {
					id: '0x0000000000000000000000000000000000000000',
					decimals: 18,
				},
				'wrapped': {
					id: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
					decimals: 18,
				},
			},
		},
	},
	[AssetName.PYTH]: {
		chains: {
			[ChainName.Algorand]: {
				'wormhole': {
					id: '1684682524',
					decimals: 6,
				},
			},
		},
	},
	[AssetName.SOL]: {
		chains: {
			[ChainName.Algorand]: {
				'wormhole': {
					id: '887648583',
					decimals: 8,
				},
			},
			[ChainName.Solana]: {
				'': {
					id: SystemProgram.programId.toBase58(),
					decimals: 9,
				},
			},
		},
	},
	[AssetName.USDC]: {
		chains: {
			[ChainName.Algorand]: {
				'wormhole': {
					id: '1007352535',
					decimals: 6,
				},
			},
		},
	},
	[AssetName.W]: {
		chains: {
			[ChainName.Algorand]: {
				'wormhole': {
					id: '1703994770',
					decimals: 6,
				},
			},
		},
	},
}
