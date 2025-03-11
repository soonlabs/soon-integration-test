import * as anchor from "@coral-xyz/anchor";
import { Connection, Keypair } from "@solana/web3.js";
import { BuiltinAndSplCpi } from "../target/types/builtin_and_spl_cpi";
import { SplInstructions } from "./instructions/spl";
import { BuiltinInstructions } from "./instructions/builtin";
import {Wallet} from "@coral-xyz/anchor";

export class BuiltinAndSplCpiSDK {
  public connection: Connection;
  public provider: anchor.AnchorProvider;
  public program: anchor.Program<BuiltinAndSplCpi>;

  constructor(connection: Connection, wallet: anchor.Wallet) {
    this.connection = connection;
    this.provider = new anchor.AnchorProvider(connection, wallet, {});
    anchor.setProvider(this.provider);
    this.program = anchor.workspace
      .BuiltinAndSplCpi as anchor.Program<BuiltinAndSplCpi>;
  }

  public get builtin() {
    return new BuiltinInstructions(this.program, this.provider);
  }

  public get spl() {
    return new SplInstructions(this.program, this.provider);
  }
}
