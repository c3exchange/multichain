import { SystemProgram } from '@solana/web3.js'
import { AssetMap } from './blockchain'
import { AssetName, ChainName } from './references'

export const C3_ASSET_MAP: AssetMap = {
	[AssetName.ALGO]: {
		chains: {
			
		},
	},
	[AssetName.ARB]: {
		chains: {
			
		},
	},
	[AssetName.AVAX]: {
		chains: {
			
		},
	},
	[AssetName.BNB]: {
		chains: {
			
		},
	},
	[AssetName.BTC]: {
		chains: {
			
		},
	},
	[AssetName.ETH]: {
		chains: {
			[ChainName.Ethereum]: {
				'': {
					id: '0x0000000000000000000000000000000000000000',
					decimals: 18,
				},
			},
		},
	},
	[AssetName.PYTH]: {
		chains: {
			
		},
	},
	[AssetName.SOL]: {
		chains: {
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
			
		},
	},
	[AssetName.W]: {
		chains: {
			
		},
	},
}
