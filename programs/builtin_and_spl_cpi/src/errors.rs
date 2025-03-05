use anchor_lang::prelude::*;

#[error_code]
#[derive(PartialEq)]
pub enum ErrorCode {
    #[msg("Insufficient funds to wrap SOL.")]
    InsufficientFunds,
    #[msg("Wrong wrapped sol mint")]
    WrongWSOLMint,
}
