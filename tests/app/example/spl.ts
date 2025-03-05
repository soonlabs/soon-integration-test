import {
  Connection,
  Keypair,
  PublicKey,
  LAMPORTS_PER_SOL,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import { BuiltinAndSplCpiSDK } from "../index";

const connection = new Connection("https://rpc.testnet.soo.network/rpc", "confirmed");

const mainWallet = new anchor.Wallet(
  Keypair.fromSecretKey(
    Uint8Array.from(
      JSON.parse(
        require("fs").readFileSync(
          require("os").homedir() + "/.config/solana/id.json",
          "utf8",
        ),
      ),
    ),
  ),
);

const sdk = new BuiltinAndSplCpiSDK(connection, mainWallet);

async function invokeSplProgramCpi() {
  try {
    console.log("Invoking spl memo...");
    const invokeSplMemoTxSig = await sdk.spl.splMemo();
    console.log(
        "Invoke spl memo successfully. Transaction signature:",
        invokeSplMemoTxSig,
    );

    // console.log("Invoking spl compression...");
    // const invokeSplCompressionTxSig = await sdk.spl.();
    // console.log(
    //     "Invoke spl memo successfully. Transaction signature:",
    //     invokeSplMemoTxSig,
    // );

    console.log("Invoking spl token...");
    const invokeSplTokenTxSig = await sdk.spl.splToken();
    console.log(
        "Invoke spl token successfully. Transaction signature:",
        invokeSplTokenTxSig,
    );

    // console.log("Invoking spl token 2022...");
    // const invokeSplToken2022TxSig = await sdk.spl.splToken2022();
    // console.log(
    //     "Invoke spl token 2022 successfully. Transaction signature:",
    //     invokeSplToken2022TxSig,
    // );

    // console.log("Invoking spl name service...");
    // const invokeSplNameServiceTxSig = await sdk.spl.splNameService();
    // console.log(
    //     "Invoke spl name service successfully. Transaction signature:",
    //     invokeSplNameServiceTxSig,
    // );

    console.log("Wrapping SOL...");
    const wrapSOLTxSig = await sdk.spl.wrapSOL();
    console.log(
        "Wrap SOL successfully. Transaction signature:",
        wrapSOLTxSig,
    );

    console.log("Invoking spl noop...");
    const invokeSplNoopTxSig = await sdk.spl.splNoop();
    console.log(
        "Invoke spl noop successfully. Transaction signature:",
        invokeSplNoopTxSig,
    );


  } catch (error) {
    console.error("Error in admin operations:", error);
  }
}

invokeSplProgramCpi();
