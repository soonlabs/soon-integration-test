use anchor_lang::prelude::*;
use anchor_lang::solana_program::instruction::Instruction;
use anchor_spl::token::{self, InitializeMint, Mint, Token};

#[derive(Accounts)]
pub struct CreateSplToken<'info> {
    #[account(
        init,
        seeds = [b"mint", payer.key().as_ref()],
        bump,
        payer = payer,
        mint::decimals = 6,
        mint::authority = payer,
    )]
    pub mint: Box<Account<'info, Mint>>,
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(address = anchor_lang::solana_program::system_program::ID)]
    pub system_program: Program<'info, System>,
    #[account(address = anchor_spl::token::ID)]
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn handler(_ctx: Context<CreateSplToken>) -> Result<()> {

    Ok(())
}
