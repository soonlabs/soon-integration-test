use anchor_lang::prelude::*;
use anchor_lang::solana_program::system_program;
use anchor_lang::solana_program::program::invoke;
use spl_name_service::instruction::NameRegistryInstruction;

#[derive(Accounts)]
pub struct CreateNameService<'info> {
    #[account(mut)]
    pub name_account: Signer<'info>,
    pub owner: Signer<'info>,
    #[account(address = system_program::ID)]
    pub system_program: Program<'info, System>,
    /// CHECK: This is the spl name service program ID
    #[account(address = spl_name_service::ID)]
    pub spl_name_service_program: AccountInfo<'info>,
}

pub fn handler(
    ctx: Context<CreateNameService>,
    hashed_name: Vec<u8>,
    space: u32,
    lamports: u64,
) -> Result<()> {
    let instruction_data = NameRegistryInstruction::Create {
        hashed_name,
        lamports,
        space,
    };

    let ix = spl_name_service::instruction::create(
        *ctx.accounts.spl_name_service_program.key,
        instruction_data,
        *ctx.accounts.name_account.key,
        *ctx.accounts.owner.key,
        *ctx.accounts.owner.key,
        None,
        None,
        None,
    )?;

    invoke(
        &ix,
        &[
            ctx.accounts.owner.to_account_info(),
            ctx.accounts.name_account.to_account_info(),
            ctx.accounts.spl_name_service_program.to_account_info(),
            ctx.accounts.owner.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
        ],
    )?;

    Ok(())
}