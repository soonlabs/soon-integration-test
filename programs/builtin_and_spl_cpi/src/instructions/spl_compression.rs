use anchor_lang::prelude::*;
use anchor_lang::solana_program::instruction::Instruction;
use std::str::FromStr;

#[derive(Accounts)]
pub struct InvokeCompression<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    // #[account(
    //     init,
    //     payer = authority,
    //     space = 8 + 1024, // 自定义账户大小
    //     seeds = [b"tree_account", authority.key().as_ref()],
    //     bump,
    // )]
    //pub tree_account: Account<'info, TreeConfig>,
    //pub compression_program: Program<'info, SplAccountCompression>,
    //pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<InvokeCompression>) -> Result<()> {
    /*
    let compression_ix = Instruction {
        program_id: ctx.accounts.compression_program.key(),
        accounts: vec![
            AccountMeta::new(ctx.accounts.compressed_account.key(), false),
            AccountMeta::new(ctx.accounts.merkle_tree_account.key(), false),
        ],
        data: vec![],
    };

    anchor_lang::solana_program::program::invoke(
        &compression_ix,
        &[
            ctx.accounts.compressed_account.to_account_info(),
            ctx.accounts.merkle_tree_account.to_account_info(),
        ],
    )?;
     */
    Ok(())
}
