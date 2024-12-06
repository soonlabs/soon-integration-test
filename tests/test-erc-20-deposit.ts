import { describe, it, expect, beforeAll } from "vitest";
import {
  L1StandardBridge,
  L1StandardBridge__factory,
} from "soon-birdge-tool/typechain-types";
import {
  createEVMContext,
  EVM_CONTEXT,
} from "soon-birdge-tool/src/helper/evm_context";
import {
  BridgeInstructionIndex,
  createSVMContext,
  SVM_CONTEXT,
  sendTransaction,
  SYSTEM_PROGRAM,
} from "soon-birdge-tool/src/helper/svm_context";
import { ethers } from "ethers";
import { base58PublicKeyToHex, sleep } from "soon-birdge-tool/src/helper/tool";
import { Keypair, LAMPORTS_PER_SOL, PublicKey, TransactionInstruction, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import { getAssociatedTokenAddressSync, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { TestERC20__factory } from "../typechain/factories/TestERC20__factory";
import { TestERC20 } from "../typechain/TestERC20";

const gasLimit = 100000;
const tenthERC: bigint = 100_000_000_000_000_000n;
const oneERC: bigint = 1_000_000_000_000_000_000n;
const billionERC: bigint = 1_000_000_000_000_000_000_000_000_000n;

const oneSol = LAMPORTS_PER_SOL;

describe("test deposit", () => {
  let EVMContext: EVM_CONTEXT;
  let SVMContext: SVM_CONTEXT;
  let L1Bridge: L1StandardBridge;
  let svmAccount: Keypair;
  let ERC20Contract: TestERC20;
  let l2Token: string;

  beforeAll(async function () {
    svmAccount = Keypair.generate();
    process.env.SVM_USER_KEY = `[${svmAccount.secretKey.toString()}]`;
    process.env.SVM_USER_ADDRESS = svmAccount.publicKey.toBase58();

    EVMContext = await createEVMContext();
    SVMContext = await createSVMContext();
    L1Bridge = L1StandardBridge__factory.connect(
      EVMContext.EVM_STANDARD_BRIDGE,
      EVMContext.EVM_USER,
    );

    // init account space on SOON.
    const accountInfo = await SVMContext.SVM_Connection.getAccountInfo(
      SVMContext.SVM_USER.publicKey,
    );
    if (!accountInfo) {
      await SVMContext.SVM_Connection.requestAirdrop(
        SVMContext.SVM_USER.publicKey,
        oneSol,
      );
    }

    const tokenContractFactory = new TestERC20__factory(EVMContext.EVM_USER);
    ERC20Contract = await tokenContractFactory.deploy();

    const l1Address = ERC20Contract.address;
    const name = await ERC20Contract.name();
    const symbol = await ERC20Contract.symbol();
    const decimals = await ERC20Contract.decimals();

    console.log(`token addr: ${ERC20Contract.address}`);
    console.log(`token bal: ${await ERC20Contract.balanceOf(EVMContext.EVM_USER.address)}`);

    l2Token = await createSpl(SVMContext, l1Address, name, symbol, decimals);


  });

  it("deposit erc-20", async function () {
    await (
        await ERC20Contract.approve(EVMContext.EVM_STANDARD_BRIDGE, tenthERC)
    ).wait(1);

    const receipt = await (
        await L1Bridge.bridgeERC20To(
        ERC20Contract.address,
        base58PublicKeyToHex(l2Token),
        base58PublicKeyToHex(SVMContext.SVM_USER.publicKey.toBase58()),
        tenthERC,
        gasLimit,
        '0x',
        {
            gasLimit: gasLimit,
        },
        )
    ).wait(1);

    console.log(`Deposit ERC20 success. txHash: ${receipt.transactionHash}`);
  })
});

async function createSpl(context: SVM_CONTEXT, l1Token: string, name: string, symbol: string, decimals: number): Promise<string> {
    const [splTokenOwnerKey] = PublicKey.findProgramAddressSync(
        [Buffer.from('spl-owner'), ethers.utils.arrayify(l1Token)],
        context.SVM_BRIDGE_PROGRAM_ID,
    );
    console.log(`splTokenOwnerKey: ${splTokenOwnerKey.toString()}`);

    const [splTokenMintKey] = PublicKey.findProgramAddressSync(
        [Buffer.from('spl-mint'), ethers.utils.arrayify(l1Token)],
        context.SVM_BRIDGE_PROGRAM_ID,
    );
    console.log(`splTokenMintKey: ${splTokenMintKey.toString()}`);

    const instructionIndex = Buffer.from(
        Int8Array.from([BridgeInstructionIndex.CreateSPL]),
    );
    const instruction = new TransactionInstruction({
        data: Buffer.concat([
        instructionIndex,
        ethers.utils.arrayify(l1Token),
        Buffer.from(Int8Array.from([name.length])),
        Buffer.from(name, 'utf8'),
        Buffer.from(Int8Array.from([symbol.length])),
        Buffer.from(symbol, 'utf8'),
        Buffer.from(Int8Array.from([decimals])),
        ]),
        keys: [
        { pubkey: SYSTEM_PROGRAM, isSigner: false, isWritable: false },
        { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: splTokenOwnerKey, isSigner: false, isWritable: true },
        { pubkey: splTokenMintKey, isSigner: false, isWritable: true },
        {
            pubkey: context.SVM_USER.publicKey,
            isSigner: true,
            isWritable: false,
        },
        ],
        programId: context.SVM_BRIDGE_PROGRAM_ID,
    });

    await sendTransaction(context, [instruction]);

    return splTokenMintKey.toBase58();
}

