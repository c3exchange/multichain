export enum ChainName {
	Ethereum = 'ethereum',
	Algorand = 'algorand',
	Solana = 'solana',
	Arbitrum = 'arbitrum',
	Avalanche = 'avalanche',
	Binance = 'binance',
}

function checkChainName(value: string): value is ChainName {
	return Object.values(ChainName).includes(value as ChainName)
}

export enum InstrumentName {
	ALGO = 'algo',
	AVAX = 'avax',
	BTC = 'btc',
	ETH = 'eth',
	USDC = 'usdc',
	ARB = 'arb',
	BNB = 'bnb',
	SOL = 'sol',
	PYTH = 'pyth',
	W = 'w',
}

export function checkInstrumentName(value: string): value is InstrumentName {
	return Object.values(InstrumentName).includes(value as InstrumentName)
}

export class ChainRef {
	public static fromString(value: string): ChainRef {
		const [c3, chains, chain] = value.split(':')
		if (c3 !== 'c3' || chains !== 'chains' || !checkChainName(chain)) {
			throw new Error(`Invalid chain reference: ${value}`)
		}

		return new ChainRef(chain)
	}

	public constructor(
		public readonly chain: ChainName,
	) {}

	public toString(): string {
		return `c3:chains:${this.chain}`
	}
}

export class AccountRef {
	public static fromString(value: string): AccountRef {
		const [c3, chains, chain, accounts, account] = value.split(':')
		if (c3 !== 'c3' || chains !== 'chains' || !checkChainName(chain) || accounts !== 'accounts') {
			throw new Error(`Invalid account reference: ${value}`)
		}

		// TODO: Validate account per-chain format

		return new AccountRef(chain, account)
	}

	public constructor(
		public readonly chain: ChainName,
		public readonly account: string,
	) {}

	public toString(): string {
		return `c3:chains:${this.chain}:accounts:${this.account}`
	}
}

export class TransactionRef {
	public static fromString(value: string): TransactionRef {
		const [c3, chains, chain, transactions, transaction] = value.split(':')
		if (c3 !== 'c3' || chains !== 'chains' || !checkChainName(chain) || transactions !== 'transactions') {
			throw new Error(`Invalid transaction reference: ${value}`)
		}

		// TODO: Validate transaction per-chain format

		return new TransactionRef(chain, transaction)
	}

	public constructor(
		public readonly chain: ChainName,
		public readonly transaction: string,
	) {}

	public toString(): string {
		return `c3:chains:${this.chain}:transactions:${this.transaction}`
	}
}

export class BlockRef {
	public static fromString(value: string): BlockRef {
		const [c3, chains, chain, blocks, block] = value.split(':')
		if (c3 !== 'c3' || chains !== 'chains' || !checkChainName(chain) || blocks !== 'blocks') {
			throw new Error(`Invalid block reference: ${value}`)
		}

		// TODO: Validate block per-chain format

		return new BlockRef(chain, block)
	}

	public constructor(
		public readonly chain: ChainName,
		public readonly block: string,
	) {}

	public toString(): string {
		return `c3:chains:${this.chain}:blocks:${this.block}`
	}
}

export class InstrumentRef {
	public static fromString(value: string): InstrumentRef {
		const [c3, instruments, instrument] = value.split(':')
		if (c3 !== 'c3' || instruments !== 'instruments' || !checkInstrumentName(instrument)) {
			throw new Error(`Invalid instrument reference: ${value}`)
		}

		// TODO: Validate instrument format

		return new InstrumentRef(instrument)
	}

	public constructor(
		public readonly instrument: InstrumentName,
	) {}

	public toString(): string {
		return `c3:instruments:${this.instrument}`
	}
}

export class ChainInstrumentRef {
	public static fromString(value: string): ChainInstrumentRef {
		const [c3, chains, chain, instruments, instrument, instance] = value.split(':')
		if (c3 !== 'c3' || chains !== 'chains' || !checkChainName(chain) || instruments !== 'instruments' || !checkInstrumentName(instrument)) {
			throw new Error(`Invalid chain instrument reference: ${value}`)
		}

		return new ChainInstrumentRef(chain, instrument, instance)
	}

	public constructor(
		public readonly chain: ChainName,
		public readonly instrument: InstrumentName,
		public readonly instance: string = '',
	) {}

	public toString(): string {
		return `c3:chains:${this.chain}:instruments:${this.instrument}${this.instance === '' ? '' : `:${this.instance}`}`
	}
}
