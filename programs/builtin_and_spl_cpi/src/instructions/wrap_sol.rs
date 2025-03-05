use std::str::FromStr;
use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{self, Token, TokenAccount, Mint};
use anchor_lang::system_program;


pub const WSOL_MINT_ADDRESS: &str = "So11111111111111111111111111111111111111112";

#[derive(Accounts)]
pub struct WrapSol<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        init_if_needed,
        payer = payer,
        associated_token::mint = wsol_mint,
        associated_token::authority = payer
    )]
    pub payer_wsol_account: Account<'info, TokenAccount>,
    pub wsol_mint: Account<'info, Mint>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
}

pub fn handler(ctx: Context<WrapSol>, amount: u64) -> Result<()> {
    let cpi_context = CpiContext::new(
        ctx.accounts.system_program.to_account_info(),
        system_program::Transfer {
            from: ctx.accounts.payer.to_account_info(),
            to: ctx.accounts.payer_wsol_account.to_account_info(),
        });
    system_program::transfer(cpi_context, amount)?;

    // Sync the native token to reflect the new SOL balance as wSOL
    let cpi_accounts = token::SyncNative {
        account: ctx.accounts.payer_wsol_account.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
    token::sync_native(cpi_ctx)?;

    Ok(())
}
