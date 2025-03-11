import * as anchor from "@coral-xyz/anchor";
import {Program } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram, Keypair } from "@solana/web3.js";
import { NameRegistryState, getHashedName } from "@solana/spl-name-service"
import { BuiltinAndSplCpi } from "../../target/types/builtin_and_spl_cpi";
import BN from "bn.js";
import {
    getAssociatedTokenAddress,
    NATIVE_MINT,
} from "@solana/spl-token";

export class SplInstructions {
  constructor(
    private program: Program<BuiltinAndSplCpi>,
    private provider: anchor.AnchorProvider,
  ) {}

  async splMemo(): Promise<string> {
    const memoProgram = new PublicKey("Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo");
    const tx = await this.program.methods
      .invokeSplMemo()
      .accounts({
          memoProgram,
      })
      .rpc();
    return tx;
  }

  // async splCompression(): Promise<string> {
  //   const compressionProgram = new PublicKey("cmtDvXumGCrqC1Age74AVPhSRVXJMd8PJS91L8KbNCK");
  //   const compressedAccount = new PublicKey("cmtDvXumGCrqC1Age74AVPhSRVXJMd8PJS91L8KbNCK");
  //   const merkleTreeAccount = new PublicKey("cmtDvXumGCrqC1Age74AVPhSRVXJMd8PJS91L8KbNCK");
  //   const tx = await this.program.methods
  //       .invokeSplCompression()
  //       .accounts({
  //         compressionProgram,
  //         compressedAccount,
  //         merkleTreeAccount,
  //       })
  //       .rpc();
  //   return tx;
  // }

    async splToken(): Promise<string> {
        const [mintAddress, bump] = await PublicKey.findProgramAddress(
            [Buffer.from("mint"), this.provider.wallet.publicKey.toBuffer()],
            this.program.programId
        );

        const tx = await this.program.methods
            .createSplToken()
            .accounts({
                mint: mintAddress,
                payer: this.provider.wallet.publicKey,
                systemProgram: SystemProgram.programId,
                tokenProgram: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
                rent: anchor.web3.SYSVAR_RENT_PUBKEY,
            })
            .rpc();
        return tx;
    }

    async splToken2022(): Promise<string> {
        const [mintAddress, bump] = await PublicKey.findProgramAddress(
            [Buffer.from("mint2022"), this.provider.wallet.publicKey.toBuffer()],
            this.program.programId
        );

        const tx = await this.program.methods
            .createSplToken2022()
            .accounts({
                mint: mintAddress,
                payer: this.provider.wallet.publicKey,
                systemProgram: SystemProgram.programId,
                token2022Program: new PublicKey("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"),
                rent: anchor.web3.SYSVAR_RENT_PUBKEY,
            })
            .rpc();
        return tx;
    }

    // async splNameService(): Promise<string> {
    //     const name = "example.sol";
    //     const hashedName = await getHashedName(name);
    //     const nameAccount = Keypair.generate();
    //     const space = 20;
    //     const lamports = new BN(await this.provider.connection.getMinimumBalanceForRentExemption(
    //         space + NameRegistryState.HEADER_LEN,
    //     ));
    //
    //     const tx = await this.program.methods
    //         .createSplNameService(hashedName, space, lamports)
    //         .accounts({
    //             nameAccount: nameAccount.publicKey,
    //             owner: this.provider.wallet.publicKey,
    //             systemProgram: anchor.web3.SystemProgram.programId,
    //             splNameServiceProgram: new PublicKey(
    //                 "namesLPneVptA9Z5rqUDD9tMTWEJwofgaYwp8cawRkX"
    //             ),
    //         })
    //         .signers([nameAccount])
    //         .rpc();
    //     return tx;
    // }

    async wrapSOL(): Promise<string> {
        const payerWsolAccount = await getAssociatedTokenAddress(
            NATIVE_MINT,
            this.provider.wallet.publicKey,
            false
        );

        const tx = await this.program.methods
            .wrapSol(new BN(10000000)) // 0.01 SOL
            .accounts({
                payer: this.provider.wallet.publicKey,
                wsolMint: NATIVE_MINT,
                payerWsolAccount,
            })
            .rpc();
        return tx;
    }

    async splNoop(): Promise<string> {
        const noopProgramId = new PublicKey("noopb9bkMVfRPU8AsbpTUg8AQkHtKwMYZiFUjNRtMmV");

        const tx = await this.program.methods
            .callNoop()
            .accounts({
                noopProgram: noopProgramId,
            })
            .rpc();
        return tx;
    }



}

