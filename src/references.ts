export enum ChainName {
	Ethereum = 'ethereum',
	Algorand = 'algorand',
	Solana = 'solana',
	Arbitrum = 'arbitrum',
	Avalanche = 'avalanche',
	Binance = 'bsc',
}

export function checkChainName(value: string): value is ChainName {
	return Object.values(ChainName).includes(value.toLowerCase() as ChainName)
}

export function normalizeChainName(value: string): ChainName {
	if (!checkChainName(value)) {
		throw new Error(`Invalid chain name: ${value}`)
	}

	return value.toLowerCase() as ChainName
}

export enum AssetName {
	ALGO = 'algo',
	AVAX = 'avax',
	WBTC = 'wbtc',
	ETH = 'eth',
	USDC = 'usdc',
	ARB = 'arb',
	BNB = 'bnb',
	SOL = 'sol',
	PYTH = 'pyth',
	W = 'w',
}

export function checkAssetName(value: string): value is AssetName {
	return Object.values(AssetName).includes(value.toLowerCase() as AssetName)
}

export function normalizeAssetName(value: string): AssetName {
	if (!checkAssetName(value)) {
		throw new Error(`Invalid asset name: ${value}`)
	}

	return value.toLowerCase() as AssetName
}

export class ChainRef {
	public static fromString(value: string): ChainRef {
		const [c3, chains, chain] = value.split(':')
		if (c3 !== 'c3' || chains !== 'chains' || !checkChainName(chain)) {
			throw new Error(`Invalid chain reference: ${value}`)
		}

		return new ChainRef(normalizeChainName(chain))
	}

	public constructor(
		public readonly chain: ChainName,
	) {}

	public toString(): string {
		return `c3:chains:${this.chain}`
	}
}

export type AccountRefString = string

export class AccountRef {
	public static fromString(value: AccountRefString): AccountRef {
		const [c3, chains, chain, accounts, account] = value.split(':')
		if (c3 !== 'c3' || chains !== 'chains' || !checkChainName(chain) || accounts !== 'accounts') {
			throw new Error(`Invalid account reference: ${value}`)
		}

		// TODO: Validate account per-chain format

		return new AccountRef(normalizeChainName(chain), account)
	}

	public constructor(
		public readonly chain: ChainName,
		public readonly account: string,
	) {}

	public toString(): AccountRefString {
		return `c3:chains:${this.chain}:accounts:${this.account}`
	}
}

export type TransactionRefString = string

export class TransactionRef {
	public static fromString(value: TransactionRefString): TransactionRef {
		const [c3, chains, chain, transactions, transaction] = value.split(':')
		if (c3 !== 'c3' || chains !== 'chains' || !checkChainName(chain) || transactions !== 'transactions') {
			throw new Error(`Invalid transaction reference: ${value}`)
		}

		// TODO: Validate transaction per-chain format

		return new TransactionRef(normalizeChainName(chain), transaction)
	}

	public constructor(
		public readonly chain: ChainName,
		public readonly transaction: string,
	) {}

	public toString(): TransactionRefString {
		return `c3:chains:${this.chain}:transactions:${this.transaction}`
	}
}

export type BlockRefString = string

export class BlockRef {
	public static fromString(value: BlockRefString): BlockRef {
		const [c3, chains, chain, blocks, block] = value.split(':')
		if (c3 !== 'c3' || chains !== 'chains' || !checkChainName(chain) || blocks !== 'blocks') {
			throw new Error(`Invalid block reference: ${value}`)
		}

		// TODO: Validate block per-chain format

		return new BlockRef(normalizeChainName(chain), block)
	}

	public constructor(
		public readonly chain: ChainName,
		public readonly block: string,
	) {}

	public toString(): BlockRefString {
		return `c3:chains:${this.chain}:blocks:${this.block}`
	}
}

export type AssetRefString = string

export class AssetRef {
	public static fromString(value: AssetRefString): AssetRef {
		const [c3, assets, asset] = value.split(':')
		if (c3 !== 'c3' || assets !== 'assets' || !checkAssetName(asset)) {
			throw new Error(`Invalid asset reference: ${value}`)
		}

		// TODO: Validate asset ID format

		return new AssetRef(normalizeAssetName(asset))
	}

	public constructor(
		public readonly asset: AssetName,
	) {}

	public toString(): AssetRefString {
		return `c3:assets:${this.asset}`
	}
}

export type AssetInstanceRefString = string

export class AssetInstanceRef {
	public static fromString(value: AssetInstanceRefString): AssetInstanceRef {
		const [c3, chains, chain, assets, asset, instance] = value.split(':')
		if (c3 !== 'c3' || chains !== 'chains' || !checkChainName(chain) || assets !== 'assets' || !checkAssetName(asset)) {
			throw new Error(`Invalid chain asset reference: ${value}`)
		}

		return new AssetInstanceRef(normalizeChainName(chain), normalizeAssetName(asset), instance)
	}

	public constructor(
		public readonly chain: ChainName,
		public readonly asset: AssetName,
		public readonly instance: string = '',
	) {}

	public toString(): AssetInstanceRefString {
		return `c3:chains:${this.chain}:assets:${this.asset}${this.instance === '' ? '' : `:${this.instance}`}`
	}
}
