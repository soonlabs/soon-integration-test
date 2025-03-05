use anchor_lang::prelude::*;
use anchor_lang::solana_program::instruction::Instruction;
use anchor_lang::solana_program::program::invoke;
use std::str::FromStr;

#[derive(Accounts)]
pub struct CallNoop<'info> {
    /// CHECK: This is the noop program ID
    #[account(address = Pubkey::from_str("noopb9bkMVfRPU8AsbpTUg8AQkHtKwMYZiFUjNRtMmV").unwrap())]
    pub noop_program: AccountInfo<'info>,
}

pub fn handler(ctx: Context<CallNoop>) -> Result<()> {
    let noop_instruction = Instruction {
        program_id: ctx.accounts.noop_program.key(),
        accounts: vec![],
        data: vec![],
    };

    invoke(
        &noop_instruction,
        &[]
    )?;

    Ok(())
}
