use anchor_lang::prelude::*;
use instructions::*;

declare_id!("5c7ieGcQcqaGFCBJzHUwYEvcqhdiZAVZb3sfwWwFvCse");

pub mod instructions;
pub mod errors;

#[program]
pub mod builtin_and_spl_cpi {
    use super::*;

    pub fn invoke_spl_memo(ctx: Context<InvokeMemo>) -> Result<()> {
        let message = "This is a test memo message.";
        return spl_memo::handler(ctx, message);
    }

    pub fn invoke_spl_compression(ctx: Context<InvokeCompression>) -> Result<()> {
        return spl_compression::handler(ctx);
    }

    pub fn create_spl_token(ctx: Context<CreateSplToken>) -> Result<()> {
        return spl_token::handler(ctx);
    }

    pub fn wrap_sol(ctx: Context<WrapSol>, amount: u64) -> Result<()> {
        return wrap_sol::handler(ctx, amount);
    }

    pub fn create_spl_token_2022(ctx: Context<CreateSplToken2022>) -> Result<()> {
        return spl_token_2022::handler(ctx);
    }

    pub fn create_spl_name_service(ctx: Context<CreateNameService>, name: Vec<u8>, space: u32, lamports: u64,) -> Result<()> {
        return spl_name_service::handler(ctx, name, space, lamports);
    }

    pub fn call_noop(ctx: Context<CallNoop>) -> Result<()> {
        return spl_noop::handler(ctx);
    }

}