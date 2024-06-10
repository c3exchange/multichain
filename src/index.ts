import { InstrumentMap } from './blockchain'
import { AlgorandBlockchain } from './blockchains/algorand'
import { EthereumBlockchain } from './blockchains/ethereum'
import { SolanaBlockchain } from './blockchains/solana'
import { CrossChain } from './crosschain'
import { ChainName } from './references'

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

export interface CrossChainConfig {
	instruments: InstrumentMap,
	chains?: ChainConfigData,
}

export function setupCrossChain(config: CrossChainConfig): CrossChain {
	const blockchains = {
		[ChainName.Algorand]: new AlgorandBlockchain(ChainName.Algorand, config.instruments, config.chains?.algorand?.apiUrl, config.chains?.algorand?.indexerUrl),
		[ChainName.Arbitrum]: new EthereumBlockchain(ChainName.Arbitrum, config.instruments, config.chains?.arbitrum?.apiUrl, config.chains?.arbitrum?.roundsToFinalize),
		[ChainName.Avalanche]: new EthereumBlockchain(ChainName.Avalanche, config.instruments, config.chains?.avalanche?.apiUrl, config.chains?.avalanche?.roundsToFinalize),
		[ChainName.Binance]: new EthereumBlockchain(ChainName.Binance, config.instruments, config.chains?.binance?.apiUrl, config.chains?.binance?.roundsToFinalize),
		[ChainName.Ethereum]: new EthereumBlockchain(ChainName.Ethereum, config.instruments, config.chains?.ethereum?.apiUrl, config.chains?.ethereum?.roundsToFinalize),
		[ChainName.Solana]: new SolanaBlockchain(ChainName.Solana, config.instruments, config.chains?.solana?.apiUrl, config.chains?.solana?.priorityRate),
	}

	return new CrossChain(blockchains)
}
