import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SolanaSplFaucet } from "../target/types/solana_spl_faucet";
import { assert } from "chai";

describe("solana-spl-faucet", () => {
  anchor.setProvider(anchor.AnchorProvider.env());

  const CLUSTER = "devnet";

  const program = anchor.workspace.solanaSplFaucet as Program<SolanaSplFaucet>;

  const USDCD = {
    metadata: {
      name: "USDC Dev",
      symbol: "USDCD",
      uri: "https://files.sablier.com/tokens/USDC.png",
      decimals: 6,
    },

    get mint() {
      return anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("mint"), Buffer.from(USDCD.metadata.symbol)],
        program.programId
      )[0];
    },
  };

  const METAPLEX = {
    program: new anchor.web3.PublicKey(
      "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
    ),
    get metadata() {
      return anchor.web3.PublicKey.findProgramAddressSync(
        [
          Buffer.from("metadata"),
          METAPLEX.program.toBuffer(),
          USDCD.mint.toBuffer(),
        ],
        METAPLEX.program
      )[0];
    },
  };

  async function balance(mint, recipient) {
    const { connection } = program.provider;

    const recipientAta = await anchor.utils.token.associatedAddress({
      mint,
      owner: recipient,
    });
    const balance = await connection.getTokenAccountBalance(recipientAta);

    return balance.value.uiAmount;
  }

  it("Initializes", async () => {
    const { connection } = program.provider;

    const info = await connection.getAccountInfo(USDCD.mint);

    if (info) {
      console.log(
        `Mint found, already initialized ${USDCD.metadata.symbol} at ${USDCD.mint}`
      );
      return;
    }

    const transaction = await program.methods
      .initializeToken(USDCD.metadata)
      .accountsPartial({
        metadata: METAPLEX.metadata,
        mint: USDCD.mint,
        payer: program.provider.wallet.publicKey,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
        tokenMetadataProgram: METAPLEX.program,
      })
      .transaction();

    const hash = await anchor.web3.sendAndConfirmTransaction(
      connection,
      transaction,
      [program.provider.wallet.payer],
      { skipPreflight: true }
    );
    console.log(`Inialized ${USDCD.metadata.symbol} at ${USDCD.mint}!`);
    console.log(`Explorer: https://solscan.io/tx/${hash}?cluster=${CLUSTER}`);
  });

  it("Mints", async () => {
    const { connection } = program.provider;
    const recipient = program.provider.publicKey;

    const amount = 10000;

    const recipientAta = await anchor.utils.token.associatedAddress({
      mint: USDCD.mint,
      owner: recipient,
    });

    const pre_balance = await (async () => {
      try {
        return await balance(USDCD.mint, recipient);
      } catch {
        return 0;
      }
    })();

    const transaction = await program.methods
      .mintTokenTo(
        USDCD.metadata.symbol,
        new anchor.BN(amount * 10 ** USDCD.metadata.decimals)
      )
      .accountsPartial({
        mint: USDCD.mint,
        recipient,
        recipientAta,
        payer: program.provider.wallet.publicKey,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
        associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
      })
      .transaction();

    const hash = await anchor.web3.sendAndConfirmTransaction(
      connection,
      transaction,
      [program.provider.wallet.payer],
      { skipPreflight: true }
    );
    console.log(
      `Minted ${USDCD.metadata.symbol} ${amount} at ${USDCD.mint} for ${recipient} (ATA = ${recipientAta})!`
    );
    console.log(`Explorer: https://solscan.io/tx/${hash}?cluster=${CLUSTER}`);

    const post_balance = await (async () => {
      try {
        return await balance(USDCD.mint, recipient);
      } catch {
        return 0;
      }
    })();

    assert.equal(
      pre_balance + amount,
      post_balance,
      `Post balance should equal initial plus mint amount. ${post_balance} != ${pre_balance} + ${amount}`
    );

    console.log(
      `Post balance equals initial plus mint amount. ${post_balance} === ${pre_balance} + ${amount}`
    );
  });
});
