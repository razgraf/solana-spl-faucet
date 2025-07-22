#![allow(unexpected_cfgs)]
#![allow(deprecated)]

use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    metadata::{
        create_metadata_accounts_v3, mpl_token_metadata::types::DataV2, CreateMetadataAccountsV3,
        Metadata as Metaplex,
    },
    token::{mint_to, Mint, MintTo, Token, TokenAccount},
};

declare_id!("DVE8KdM7uEPts5E6SHg6MnHKx6MHxtb8EwMbg7SU4Eba");

#[program]
pub mod solana_spl_faucet {
    use super::*;

    pub fn initialize_token(
        ctx: Context<InitializeToken>,
        metadata: InitializeTokenParams,
    ) -> Result<()> {
        let symbol = metadata.symbol;

        let signer_seeds = &["mint".as_bytes(), symbol.as_bytes(), &[ctx.bumps.mint]];
        let signer = [&signer_seeds[..]];

        let token_data: DataV2 = DataV2 {
            name: metadata.name,
            symbol: symbol.clone(),
            uri: metadata.uri,
            seller_fee_basis_points: 0,
            creators: None,
            collection: None,
            uses: None,
        };

        let metadata_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_metadata_program.to_account_info(),
            CreateMetadataAccountsV3 {
                payer: ctx.accounts.payer.to_account_info(),
                update_authority: ctx.accounts.mint.to_account_info(),
                mint: ctx.accounts.mint.to_account_info(),
                metadata: ctx.accounts.metadata.to_account_info(),
                mint_authority: ctx.accounts.mint.to_account_info(),
                system_program: ctx.accounts.system_program.to_account_info(),
                rent: ctx.accounts.rent.to_account_info(),
            },
            &signer,
        );

        create_metadata_accounts_v3(metadata_ctx, token_data, false, true, None)?;

        msg!("Token mint created successfully.");

        Ok(())
    }

    pub fn mint_token_to(ctx: Context<MintTokenTo>, symbol: String, quantity: u64) -> Result<()> {
        let seeds = &["mint".as_bytes(), symbol.as_bytes(), &[ctx.bumps.mint]];
        let signer = &[&seeds[..]];

        mint_to(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                MintTo {
                    authority: ctx.accounts.mint.to_account_info(),
                    to: ctx.accounts.recipient_ata.to_account_info(),
                    mint: ctx.accounts.mint.to_account_info(),
                },
                signer,
            ),
            quantity,
        )?;

        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(
    params: InitializeTokenParams
)]
pub struct InitializeToken<'info> {
    /// CHECK: New Metaplex Account being created
    #[account(mut)]
    pub metadata: UncheckedAccount<'info>,

    #[account(
        init,
        seeds = [b"mint", params.symbol.as_bytes()],
        bump,
        payer = payer,
        mint::decimals = params.decimals,
        mint::authority = mint,
    )]
    pub mint: Account<'info, Mint>,

    #[account(mut)]
    pub payer: Signer<'info>,
    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub token_metadata_program: Program<'info, Metaplex>,
}

#[derive(Accounts)]
#[instruction(symbol: String)]
pub struct MintTokenTo<'info> {
    #[account(
        mut,
        seeds = [b"mint", symbol.as_bytes()],
        bump,
    )]
    pub mint: Account<'info, Mint>,

    #[account(
        init_if_needed,
        payer = payer,
        associated_token::mint = mint,
        associated_token::authority = recipient,
    )]
    pub recipient_ata: Account<'info, TokenAccount>,

    /// CHECK: Any address can receive tokens
    pub recipient: UncheckedAccount<'info>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}
#[derive(AnchorSerialize, AnchorDeserialize, Debug, Clone)]
pub struct InitializeTokenParams {
    pub name: String,
    pub symbol: String,
    pub uri: String,
    pub decimals: u8,
}
