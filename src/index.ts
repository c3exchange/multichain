import { PartialAssetMap } from './blockchain'
import { AlgorandBlockchain } from './blockchains/algorand'
import { EthereumBlockchain } from './blockchains/ethereum'
import { SolanaBlockchain } from './blockchains/solana'
import { ChainConfigData, DEFAULT_MULTI_CHAIN_CONFIG } from './config'
import { MultiChain } from './multichain'
import { ChainName } from './references'

type PartialRec<T> = { [K in keyof T]?: PartialRec<T[K]> }

export type PartialConfig = {
	assets?: PartialAssetMap
	chains?: PartialRec<ChainConfigData>
}

export * from "./blockchain"
export * from "./multichain"
export * from "./references"
export * from "./base64"

export function setupMultiChain(config?: PartialConfig): MultiChain {
	const assets = config?.assets ?? DEFAULT_MULTI_CHAIN_CONFIG.assets
	const chains = config?.chains ?? DEFAULT_MULTI_CHAIN_CONFIG.chains

	const algorandApiUrl = chains.algorand?.apiUrl ?? DEFAULT_MULTI_CHAIN_CONFIG.chains.algorand.apiUrl
	const algorandIndexerUrl = chains.algorand?.indexerUrl ?? DEFAULT_MULTI_CHAIN_CONFIG.chains.algorand.indexerUrl

	const arbitrumApiUrl = chains.arbitrum?.apiUrl ?? DEFAULT_MULTI_CHAIN_CONFIG.chains.arbitrum.apiUrl
	const arbitrumRoundsToFinalize = chains.arbitrum?.roundsToFinalize ?? DEFAULT_MULTI_CHAIN_CONFIG.chains.arbitrum.roundsToFinalize

	const avalancheApiUrl = chains.avalanche?.apiUrl ?? DEFAULT_MULTI_CHAIN_CONFIG.chains.avalanche.apiUrl
	const avalancheRoundsToFinalize = chains.avalanche?.roundsToFinalize ?? DEFAULT_MULTI_CHAIN_CONFIG.chains.avalanche.roundsToFinalize

	const binanceApiUrl = chains.bsc?.apiUrl ?? DEFAULT_MULTI_CHAIN_CONFIG.chains.bsc.apiUrl
	const binanceRoundsToFinalize = chains.bsc?.roundsToFinalize ?? DEFAULT_MULTI_CHAIN_CONFIG.chains.bsc.roundsToFinalize

	const ethereumApiUrl = chains.ethereum?.apiUrl ?? DEFAULT_MULTI_CHAIN_CONFIG.chains.ethereum.apiUrl
	const ethereumRoundsToFinalize = chains.ethereum?.roundsToFinalize ?? DEFAULT_MULTI_CHAIN_CONFIG.chains.ethereum.roundsToFinalize

	const solanaApiUrl = chains.solana?.apiUrl ?? DEFAULT_MULTI_CHAIN_CONFIG.chains.solana.apiUrl

	const blockchains = {
		[ChainName.Algorand]: new AlgorandBlockchain(ChainName.Algorand, assets, algorandApiUrl, algorandIndexerUrl),
		[ChainName.Arbitrum]: new EthereumBlockchain(ChainName.Arbitrum, assets, arbitrumApiUrl, arbitrumRoundsToFinalize),
		[ChainName.Avalanche]: new EthereumBlockchain(ChainName.Avalanche, assets, avalancheApiUrl, avalancheRoundsToFinalize),
		[ChainName.Binance]: new EthereumBlockchain(ChainName.Binance, assets, binanceApiUrl, binanceRoundsToFinalize),
		[ChainName.Ethereum]: new EthereumBlockchain(ChainName.Ethereum, assets, ethereumApiUrl, ethereumRoundsToFinalize),
		[ChainName.Solana]: new SolanaBlockchain(ChainName.Solana, assets, solanaApiUrl),
	}

	return new MultiChain(blockchains)
}
