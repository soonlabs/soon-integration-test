use anchor_lang::prelude::*;
use anchor_lang::solana_program::instruction::Instruction;
use std::str::FromStr;

#[derive(Accounts)]
pub struct InvokeMemo<'info> {
    /// CHECK: This is the memo program, we don't need to verify it here
    #[account(address = Pubkey::from_str("Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo").unwrap())]
    pub memo_program: AccountInfo<'info>,
}

pub fn handler(ctx: Context<InvokeMemo>, message: &str) -> Result<()> {
    let memo_ix = Instruction {
        program_id: ctx.accounts.memo_program.key(),
        accounts: vec![],
        data: message.as_bytes().to_vec(),
    };

    anchor_lang::solana_program::program::invoke(
        &memo_ix,
        &[],
    )?;
    Ok(())
}
