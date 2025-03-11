use anchor_lang::prelude::*;
use anchor_spl::token_2022::{self, InitializeMint2, Token2022};
use anchor_spl::token::Mint;

#[derive(Accounts)]
pub struct CreateSplToken2022<'info> {
    #[account(
        init,
        payer = payer,
        space = Mint::LEN,
        seeds = [b"mint_2022", payer.key().as_ref()],
        bump,
    )]
    pub mint: Account<'info, Mint>,
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(address = anchor_lang::solana_program::system_program::ID)]
    pub system_program: Program<'info, System>,
    #[account(address = anchor_spl::token_2022::ID)]
    pub token_2022_program: Program<'info, Token2022>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn handler(ctx: Context<CreateSplToken2022>) -> Result<()> {
    let cpi_program = ctx.accounts.token_2022_program.to_account_info();
    let cpi_accounts = InitializeMint2 {
        mint: ctx.accounts.mint.to_account_info(),
    };

    let cpi_context = CpiContext::new(cpi_program, cpi_accounts);

    token_2022::initialize_mint2(
        cpi_context,
        6,
        &ctx.accounts.payer.key(),
        None,
    )?;

    Ok(())
}