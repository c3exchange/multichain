import { SystemProgram } from '@solana/web3.js'
import { AssetMap } from './blockchain'
import { AssetName, ChainName } from './references'

export interface ChainConfigData {
	[ChainName.Algorand]: {
		apiUrl: string
		indexerUrl: string
	}
	[ChainName.Arbitrum]: {
		apiUrl: string
		roundsToFinalize: number
	}
	[ChainName.Avalanche]: {
		apiUrl: string
		roundsToFinalize: number
	}
	[ChainName.Binance]: {
		apiUrl: string
		roundsToFinalize: number
	}
	[ChainName.Ethereum]: {
		apiUrl: string
		roundsToFinalize: number
	}
	[ChainName.Solana]: {
		apiUrl: string
	}
}

export interface MultiChainConfig {
	assets: AssetMap
	chains: ChainConfigData
}

export const DEFAULT_MULTI_CHAIN_CONFIG: MultiChainConfig = {
	assets: {
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
						id: '0x912CE59144191C1204E64559FE8253a0e49E6548',
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
					'wrapped': {
						id: '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7',
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
					'wrapped': {
						id: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
						decimals: 18,
					}
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
				[ChainName.Ethereum]: {
					'wrapped': {
						id: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
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
						id: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
						decimals: 18,
					},
				},
				[ChainName.Arbitrum]: {
					'': {
						id: '0x0000000000000000000000000000000000000000',
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
				[ChainName.Solana]: {
					'': {
						id: 'HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3',
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
					'wrapped': {
						id: 'So11111111111111111111111111111111111111112',
						decimals: 9,
					}
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
				[ChainName.Avalanche]: {
					'': {
						id: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E',
						decimals: 6,
					}
				}
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
				[ChainName.Solana]: {
					'': {
						id: '85VBFQZC9TZkfaptBWjvUw7YbZjy52A6mjtPGjstQAmQ',
						decimals: 6,
					},
				},
			},
		},
	},
	chains: {
		[ChainName.Algorand]: {
			apiUrl: 'https://mainnet-api.algonode.cloud',
			indexerUrl: 'https://mainnet-idx.algonode.cloud',
		},
		[ChainName.Arbitrum]: {
			apiUrl: 'https://arbitrum-one.publicnode.com',
			roundsToFinalize: 12,
		},
		[ChainName.Avalanche]: {
			apiUrl: 'https://avalanche-c-chain-rpc.publicnode.com',
			roundsToFinalize: 12,
		},
		[ChainName.Binance]: {
			apiUrl: 'https://bsc-rpc.publicnode.com',
			roundsToFinalize: 12,
		},
		[ChainName.Ethereum]: {
			apiUrl: 'https://ethereum-rpc.publicnode.com',
			roundsToFinalize: 12,
		},
		[ChainName.Solana]: {
			apiUrl: 'https://solana-rpc.publicnode.com',
		},
	}
}
