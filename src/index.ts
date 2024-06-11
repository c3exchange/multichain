import { AssetMap } from './blockchain'
import { AlgorandBlockchain } from './blockchains/algorand'
import { EthereumBlockchain } from './blockchains/ethereum'
import { SolanaBlockchain } from './blockchains/solana'
import { MultiChain } from './multichain'
import { ChainName } from './references'
import { C3_ASSET_MAP } from './c3-asset-map'

export interface ChainConfigData {
	[ChainName.Algorand]?: {
		apiUrl?: string
		indexerUrl?: string
	}
	[ChainName.Arbitrum]?: {
		apiUrl?: string
		roundsToFinalize?: number
	}
	[ChainName.Avalanche]?: {
		apiUrl?: string
		roundsToFinalize?: number
	}
	[ChainName.Binance]?: {
		apiUrl?: string
		roundsToFinalize?: number
	}
	[ChainName.Ethereum]?: {
		apiUrl?: string
		roundsToFinalize?: number
	}
	[ChainName.Solana]?: {
		apiUrl?: string
		priorityRate?: number
	}
}

export interface MultiChainConfig {
	assets?: AssetMap,
	chains?: ChainConfigData,
}

export function setupMultiChain(config?: MultiChainConfig): MultiChain {
	config ??= {}
	config.assets ??= C3_ASSET_MAP
	config.chains ??= {}

	const blockchains = {
		[ChainName.Algorand]: new AlgorandBlockchain(ChainName.Algorand, config.assets, config.chains.algorand?.apiUrl, config.chains.algorand?.indexerUrl),
		[ChainName.Arbitrum]: new EthereumBlockchain(ChainName.Arbitrum, config.assets, config.chains.arbitrum?.apiUrl, config.chains.arbitrum?.roundsToFinalize),
		[ChainName.Avalanche]: new EthereumBlockchain(ChainName.Avalanche, config.assets, config.chains.avalanche?.apiUrl, config.chains.avalanche?.roundsToFinalize),
		[ChainName.Binance]: new EthereumBlockchain(ChainName.Binance, config.assets, config.chains.binance?.apiUrl, config.chains.binance?.roundsToFinalize),
		[ChainName.Ethereum]: new EthereumBlockchain(ChainName.Ethereum, config.assets, config.chains.ethereum?.apiUrl, config.chains.ethereum?.roundsToFinalize),
		[ChainName.Solana]: new SolanaBlockchain(ChainName.Solana, config.assets, config.chains.solana?.apiUrl, config.chains.solana?.priorityRate),
	}

	return new MultiChain(blockchains)
}
