import * as anchor from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { BuiltinAndSplCpi } from "../../target/types/builtin_and_spl_cpi";

export class BuiltinInstructions {
  constructor(
    private program: anchor.Program<BuiltinAndSplCpi>,
    private provider: anchor.AnchorProvider,
  ) {}

}
