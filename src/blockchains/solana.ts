import {
	createTransferInstruction,
	getAssociatedTokenAddress,
	ACCOUNT_SIZE,
	getMinimumBalanceForRentExemptAccount,
	TOKEN_PROGRAM_ID,
	createInitializeAccountInstruction,
} from '@solana/spl-token'

import {
	Connection,
	PublicKey,
	TransactionMessage,
	VersionedTransaction,
	Keypair,
	ComputeBudgetProgram,
	SystemProgram,
	Signer,
	TransactionInstruction,
} from '@solana/web3.js'

import { ChainName, BlockRef, TransactionRef } from '../references'
import { Blockchain, InstrumentMap, Block, TransactionStatus, BlockchainInternalTransferRequest } from '../blockchain'
import { decodeBase64 } from '../base64'

export class SolanaBlockchain extends Blockchain {
	private _connection: Connection

	public constructor(
		chain: ChainName,
		instruments: InstrumentMap,
		baseURL = 'https://api.mainnet-beta.solana.com',
		private readonly _priorityRate = 12345,
	) {
		super(chain, instruments)

		this._connection = new Connection(baseURL)
	}

	public async getCurrentBlock(): Promise<Block> {
		const round = await this._connection.getBlockHeight()

		return {
			id: new BlockRef(this.id.chain, round.toString()),
			round,
		}
	}

	public async getTransactionsStatus(transactions: TransactionRef[]): Promise<TransactionStatus[]> {
		const results = await this._connection.getSignatureStatuses(transactions.map((tx) => tx.transaction), { searchTransactionHistory: true })

		return results.value.map((result) => {
			if (result === null || result.err !== null) {
				return TransactionStatus.Failed
			} else if (result.confirmationStatus === 'finalized') {
				return TransactionStatus.Confirmed
			} else {
				return TransactionStatus.Pending
			}
		})
	}

	protected async sendTransferTransactions(transfers: BlockchainInternalTransferRequest[]): Promise<TransactionRef[]> {
		const getTA = async (payer: Signer, owner: PublicKey, instrument: PublicKey, tokenAccount?: PublicKey): Promise<{ key: PublicKey, instructions: TransactionInstruction[] }> => {
			// If the token account is not provided, use the ATA for the owner
			if (tokenAccount === undefined) {
				tokenAccount = await getAssociatedTokenAddress(instrument, owner, true)
			}

			// Check if the token account exists
			try {
				await this._connection.getAccountInfo(tokenAccount)
			} catch (error) {
				// If the token account does not exist, create it
				const createAccountInstruction = SystemProgram.createAccount({
					fromPubkey: payer.publicKey,
					newAccountPubkey: tokenAccount,
					space: ACCOUNT_SIZE,
					lamports: await getMinimumBalanceForRentExemptAccount(this._connection),
					programId: TOKEN_PROGRAM_ID,
				})

				const initTokenAccountInstruction = createInitializeAccountInstruction(
					tokenAccount,
					instrument,
					owner,
				)

				return {
					key: tokenAccount,
					instructions: [createAccountInstruction, initTokenAccountInstruction],
				}
			}

			// No need to create it, just return the token account
			return {
				key: tokenAccount,
				instructions: [],
			}
		}

		const genericTransfer = (fromTA: PublicKey, toTA: PublicKey, from: PublicKey, instrument: string, amount: number | bigint) => {
			if (instrument === SystemProgram.programId.toBase58()) {
				return SystemProgram.transfer({
					fromPubkey: fromTA,
					toPubkey: toTA,
					lamports: amount,
				})
			} else {
				return createTransferInstruction(
					fromTA,
					toTA,
					new PublicKey(from),
					amount,
				)
			}
		}

		const blockhash = await this._connection.getLatestBlockhash()
		const priorityInstruction = ComputeBudgetProgram.setComputeUnitPrice({ microLamports: this._priorityRate })

		return Promise.all(transfers.map(async (transfer) => {
			// Extract transfer info
			const payer = Keypair.fromSecretKey(decodeBase64(transfer.fromPrivateKey))
			const fromAccount = payer.publicKey
			const toAccount = new PublicKey(transfer.to)
			const instrument = new PublicKey(transfer.instrument)
			const fromTABase = transfer.fromTokenAccount ? new PublicKey(transfer.fromTokenAccount) : undefined

			// Get/create relevant TAs
			const { key: fromTA, instructions: fromTAInstructions } = await getTA(payer, fromAccount, instrument, fromTABase)
			const { key: toTA, instructions: toTAInstructions } = await getTA(payer, toAccount, instrument)

			// Create transfer instruction
			const transferInstruction = genericTransfer(fromTA, toTA, new PublicKey(transfer.from), transfer.instrument, transfer.amount)

			// Create message
			const message = new TransactionMessage({
				payerKey: new PublicKey(transfer.from),
				recentBlockhash: blockhash.blockhash,
				instructions: [priorityInstruction, ...fromTAInstructions, ...toTAInstructions, transferInstruction],
			})

			// Create transaction
			const txn = new VersionedTransaction(message.compileToV0Message())

			// Sign transaction
			txn.sign([Keypair.fromSecretKey(decodeBase64(transfer.fromPrivateKey))])

			// Send transaction
			const signature = await this._connection.sendRawTransaction(txn.serialize())

			// Encode result
			return new TransactionRef(ChainName.Solana, signature)
		}))
	}
}
