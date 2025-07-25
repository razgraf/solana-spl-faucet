![SPL Faucet](/assets/banner.png)

# Solana SPL Token Faucet

Mint SPL tokens under the same symbol and access them through an infinite faucet.

## Resources 📦

This implementations follows QuickNode's [tutorials](https://www.quicknode.com/guides/solana-development/anchor/create-tokens) as well as the official docs on solana project and workspace [configurations](https://solana.com/docs/intro/installation).

It adds some new features on top of the tutorial:

- Creates multiple tokens, characterised by their tokens symbol (everyone uses the same `USDC` from a given faucet)
- Allows someone to mint tokens **to** another account

## Tapping the faucet 💧

Access the AI generated UI on [solana-spl-faucet.vercel.app](https://solana-spl-faucet.vercel.app/). Switch your wallet to **devnet** and initialize or mint tokens. 

To access the faucet programatically check the resources folder for an IDL and the tests folder for a very rough example. 

## Deployments and tokens 📚

| Cluster | Program Id                                     |
| ------- | ---------------------------------------------- |
| Devnet  | `DVE8KdM7uEPts5E6SHg6MnHKx6MHxtb8EwMbg7SU4Eba` |

| Cluster | Symbol  | Mint Address                                   |
| ------- | ------- | ---------------------------------------------- |
| Devnet  | `USDCD` | `6SNumpJmqb1CAKsxxiVqXxjTUXe1TxPbUi9jd7wG4a1P` |
| Devnet  | `AAVED` | `5tR9VDncEekQ2Y4ufEiokS6fKEXW2v16zGJKFVXuJNwj` |

## Deploying your own new Faucet ⚙️

To deploy a new faucet on `devnet` one should:

1. Install the solana CLI, anchor CLI, rust etc.
2. Create a wallet to be stored in `~/.config/solana/id.json` so [`Anchor.toml`](./Anchor.toml) can see it.
   ```sh
   solana-keygen-new
   ```
3. Generate a new keypair and replace it in [`Anchor.toml`](./Anchor.toml) and [`lib.rs`](./programs/solana-spl-faucet/src/lib.rs)
   ```sh
   solana-keygen new --outfile target/deploy/solana_spl_faucet-keypair.json # Generate a new key pair
   solana-keygen pubkey target/deploy/solana_spl_faucet-keypair.json # Extract that keypar
   ... # Replace it in the two files
   ```
4. Fund your wallet from step 2 with the CLI or using a public online [faucet](https://faucet.solana.com/)
   ```sh
   solana airdrop 2
   ```
5. Build and deploy the contract (already set towards devnet)
   ```sh
   ancho build
   anchor deploy
   ```
6. Test the faucet
   ```sh
   anchor test --skip-deploy
   ```
   This creates `$USDCD` (if not created yet) and tests the mint capabilities using the wallet from step 2.
