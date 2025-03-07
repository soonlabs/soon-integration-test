import { describe, it, expect, beforeAll } from "vitest";
import {
  L1StandardBridge,
  L1StandardBridge__factory,
  OptimismPortal__factory,
  L2OutputOracle__factory,
} from "soon-bridge-tool/typechain-types";
import {
  Numberu128,
  Numberu64,
} from "soon-bridge-tool/src/helper/number.utils";
import {
  createEVMContext,
  EVM_CONTEXT,
} from "soon-bridge-tool/src/helper/evm_context";
import {
  BridgeInstructionIndex,
  createSVMContext,
  SVM_CONTEXT,
  sendTransaction,
  genProgramDataAccountKey,
} from "soon-bridge-tool/src/helper/svm_context";
import { SYSTEM_PROGRAM, DEFAULT_BRIDGE_PROGRAM } from "soon-bridge-tool/src/helper/tool";
import { ethers } from "ethers";
import {
  base58PublicKeyToHex,
  sleep,
  isValidEthereumAddress,
  parseWithdrawTxInfo,
} from "soon-bridge-tool/src/helper/tool";
import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  TransactionInstruction,
  SYSVAR_RENT_PUBKEY,
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import { PROGRAM_ID as mplProgramId } from "@metaplex-foundation/mpl-token-metadata";
import { TestERC20__factory } from "../typechain/factories/TestERC20__factory";
import { TestERC20 } from "../typechain/TestERC20";
import { spamL2Tx, spamL1Tx } from "./helper/spam-utils";
import axios from "axios";
import bs58 from "bs58";

const oneERC: bigint = 1_000_000_000_000_000_000n;
const halfERC: bigint = 500_000_000_000_000_000n;
// solana representation with 8 decimals
const oneERCSol: bigint = 100_000_000n;
const halfERCSol: bigint = 50_000_000n;
const gasLimit: number = 1_000_000;
const oneSol = LAMPORTS_PER_SOL;
const zeroBuffer: Buffer = Buffer.from([0, 0, 0, 0, 0, 0, 0, 0]);

describe("test erc-20", () => {
  let EVMContext: EVM_CONTEXT;
  let SVMContext: SVM_CONTEXT;
  let L1Bridge: L1StandardBridge;
  let svmAccount: Keypair;
  let ERC20Contract: TestERC20;
  let l2Token: PublicKey;
  let l1Token: string;
  let withdrawTxKey: PublicKey;
  let withdrawHeight: number;

  beforeAll(async function () {
    svmAccount = Keypair.generate();
    process.env.SVM_USER_KEY = `[${svmAccount.secretKey.toString()}]`;
    process.env.SVM_USER_ADDRESS = svmAccount.publicKey.toBase58();

    EVMContext = await createEVMContext();
    SVMContext = await createSVMContext();
    L1Bridge = L1StandardBridge__factory.connect(
      EVMContext.EVM_STANDARD_BRIDGE,
      EVMContext.EVM_USER
    );

    // init account space on SOON.
    const accountInfo = await SVMContext.SVM_Connection.getAccountInfo(
      SVMContext.SVM_USER.publicKey
    );
    if (!accountInfo) {
      await SVMContext.SVM_Connection.requestAirdrop(
        SVMContext.SVM_USER.publicKey,
        oneSol
      );
    }

    // init bridge admin
    await SVMContext.SVM_Connection.requestAirdrop(
      SVMContext.SVM_BRIDGE_ADMIN.publicKey,
      oneSol
    );

    let user_balance = await SVMContext.SVM_Connection.getBalance(
      SVMContext.SVM_USER.publicKey
    );
    let admin_balance = await SVMContext.SVM_Connection.getBalance(
      SVMContext.SVM_BRIDGE_ADMIN.publicKey
    );
    console.log(
      `before erc-20 test: admin balance: ${admin_balance}, user_balance: ${user_balance}`
    );

    const tokenContractFactory = new TestERC20__factory(EVMContext.EVM_USER);
    ERC20Contract = await tokenContractFactory.deploy();

    l1Token = ERC20Contract.address;
    const name = await ERC20Contract.name();
    const symbol = await ERC20Contract.symbol();
    const mockURI =
      "https://ipfs.io/ipfs/QmXRVXSRbH9nKYPgVfakXRhDhEaXWs6QYu3rToadXhtHPr";
    // must be less than 10, use 8
    const decimals = 8;

    console.log(`token name: ${name}`);
    console.log(`token addr: ${ERC20Contract.address}`);

    l2Token = await createSpl(
      SVMContext,
      l1Token,
      name,
      symbol,
      mockURI,
      decimals
    );
    await sleep(100);
  });

  it.sequential("deposit erc-20", async function () {
    const startingL1Balance = await ERC20Contract.balanceOf(
      EVMContext.EVM_USER.address
    );
    const startingL2Balance = await getSplTokenBalance(
      SVMContext,
      l2Token,
      SVMContext.SVM_USER.publicKey
    );

    await (
      await ERC20Contract.approve(EVMContext.EVM_STANDARD_BRIDGE, oneERC)
    ).wait(1);

    const receipt = await (
      await L1Bridge.bridgeERC20To(
        ERC20Contract.address,
        base58PublicKeyToHex(l2Token.toBase58()),
        base58PublicKeyToHex(SVMContext.SVM_USER.publicKey.toBase58()),
        oneERC,
        10_000,
        "0x",
        {
          gasLimit: 1_000_000n,
        }
      )
    ).wait(1);

    await spamL1Tx(EVMContext, 5);
    // wait sequencer to track.
    await sleep(30000);

    const endingL2Balance = await getSplTokenBalance(
      SVMContext,
      l2Token,
      SVMContext.SVM_USER.publicKey
    );
    const endingL1Balance = await ERC20Contract.balanceOf(
      EVMContext.EVM_USER.address
    );
    console.log(`Deposit ERC20 success. txHash: ${receipt.transactionHash}`);
    console.log(
      `starting l1 amount: ${startingL1Balance}, ending l1 amount: ${endingL1Balance}`
    );
    console.log(
      `starting l2 amount: ${startingL2Balance}, ending l2 balance: ${endingL2Balance}`
    );

    expect(startingL1Balance.sub(oneERC)).toEqual(endingL1Balance);
    expect(startingL2Balance + oneERCSol).toEqual(endingL2Balance);
  });

  it.sequential("initiate withdraw erc-20", async function () {
    const l1Target = EVMContext.EVM_USER.address;
    expect(isValidEthereumAddress(l1Target)).toBeTruthy();

    console.log(
      `withdrawal from ${SVMContext.SVM_USER.publicKey.toBase58()} to ${l1Target}`
    );

    const [counterKey] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("svm-withdraw-counter"),
        SVMContext.SVM_USER.publicKey.toBuffer(),
      ],
      SVMContext.SVM_BRIDGE_PROGRAM_ID
    );
    console.log(`Counter key: ${counterKey.toString()}`);

    const accountInfo =
      await SVMContext.SVM_Connection.getAccountInfo(counterKey);

    const startingBalance = await getSplTokenBalance(
      SVMContext,
      l2Token,
      SVMContext.SVM_USER.publicKey
    );
    expect(startingBalance).toEqual(oneERCSol);

    const createUserCounterIndex = Buffer.from(
      Int8Array.from([
        BridgeInstructionIndex.CreateUserWithdrawalCounterAccount,
      ])
    );
    const userCounterInstruction = new TransactionInstruction({
      data: Buffer.concat([createUserCounterIndex]),
      keys: [
        { pubkey: SYSTEM_PROGRAM, isSigner: false, isWritable: false },
        { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
        { pubkey: counterKey, isSigner: false, isWritable: true },
        {
          pubkey: SVMContext.SVM_USER.publicKey,
          isSigner: true,
          isWritable: false,
        },
      ],
      programId: SVMContext.SVM_BRIDGE_PROGRAM_ID,
    });

    const withdrawTxSeed = accountInfo?.data.slice(0, 8) ?? zeroBuffer;
    const counter = Numberu64.fromBuffer(withdrawTxSeed);
    console.log(`counter: ${counter}`);

    //get bridge config key
    const bridgeConfigKey = genProgramDataAccountKey(
      "bridge-config",
      DEFAULT_BRIDGE_PROGRAM
    );
    console.log(`bridgeConfigKey key: ${bridgeConfigKey.toString()}`);

    //get withdraw tx key
    [withdrawTxKey] = PublicKey.findProgramAddressSync(
      [SVMContext.SVM_USER.publicKey.toBuffer(), withdrawTxSeed.reverse()],
      SVMContext.SVM_BRIDGE_PROGRAM_ID
    );

    const [splTokenOwnerKey] = PublicKey.findProgramAddressSync(
      [Buffer.from("spl-owner"), ethers.utils.arrayify(l1Token)],
      SVMContext.SVM_BRIDGE_PROGRAM_ID
    );
    console.log(`splTokenOwnerKey: ${splTokenOwnerKey.toString()}`);

    const [splTokenMintKey] = PublicKey.findProgramAddressSync(
      [Buffer.from("spl-mint"), ethers.utils.arrayify(l1Token)],
      SVMContext.SVM_BRIDGE_PROGRAM_ID
    );
    console.log(`splTokenMintKey: ${splTokenMintKey.toString()}`);

    const userATAKey = getAssociatedTokenAddressSync(
      splTokenMintKey,
      SVMContext.SVM_USER.publicKey
    );
    console.log(`userATAKey: ${userATAKey.toString()}`);

    const instructionIndex = Buffer.from(
      Int8Array.from([BridgeInstructionIndex.WithdrawSPL])
    );
    const instruction = new TransactionInstruction({
      data: Buffer.concat([
        instructionIndex,
        Buffer.concat([ethers.utils.arrayify(l1Token)]),
        Buffer.concat([ethers.utils.arrayify(l1Target)]),
        new Numberu128(halfERCSol.toString()).toBuffer(),
        new Numberu128(gasLimit).toBuffer(),
      ]),
      keys: [
        { pubkey: SYSTEM_PROGRAM, isSigner: false, isWritable: false },
        { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: counterKey, isSigner: false, isWritable: true },
        { pubkey: withdrawTxKey, isSigner: false, isWritable: true },
        { pubkey: splTokenOwnerKey, isSigner: false, isWritable: false },
        { pubkey: splTokenMintKey, isSigner: false, isWritable: true },
        { pubkey: userATAKey, isSigner: false, isWritable: true },
        { pubkey: bridgeConfigKey, isSigner: false, isWritable: false },
        {
          pubkey: SVMContext.SVM_USER.publicKey,
          isSigner: true,
          isWritable: false,
        },
      ],
      programId: SVMContext.SVM_BRIDGE_PROGRAM_ID,
    });
    console.log(`Withdraw ID: ${withdrawTxKey.toString()}`);
    const signature = await sendTransaction(SVMContext, [
      userCounterInstruction,
      instruction,
    ]);

    await sleep(200);
    const status =
      await SVMContext.SVM_Connection.getSignatureStatus(signature);
    console.log(`Withdraw Height: ${status!.value?.slot}`);
    withdrawHeight = status!.value?.slot ?? -1;
    const endingBalance = await getSplTokenBalance(
      SVMContext,
      l2Token,
      SVMContext.SVM_USER.publicKey
    );
    console.log(
      `starting erc-20: ${startingBalance}, ending erc-20: ${endingBalance}`
    );
    expect(startingBalance - halfERCSol).toEqual(endingBalance);
  });

  it.sequential("prove withdraw erc-20", async function () {
    // 1. fast forward l2, let proposer propose withdraw root.
    // 2. check proposer height larger than withdraw height.
    // 3. generate proof and verify.
    const OptimismPortal = OptimismPortal__factory.connect(
      EVMContext.EVM_OP_PORTAL,
      EVMContext.EVM_USER
    );
    const l2OutputOracleAddress = await OptimismPortal.l2Oracle();
    console.log(`l2OutputOracleAddress: ${l2OutputOracleAddress}`);
    const L2OutputOracle = L2OutputOracle__factory.connect(
      l2OutputOracleAddress,
      EVMContext.EVM_PROPOSER!
    );

    let proposedHeight;
    while (true) {
      proposedHeight = await L2OutputOracle.latestBlockNumber();
      if (proposedHeight >= withdrawHeight) {
        break;
      }
      console.log(
        `not proposed yet. current proposed l2 height: ${proposedHeight}, withdraw height: ${withdrawHeight}`
      );
      spamL2Tx(SVMContext, 10);
      await sleep(3000);
      continue;
    }

    //get output root proof
    const response0 = await axios.post(SVMContext.SVM_RPC_URL, {
      jsonrpc: "2.0",
      id: 1,
      method: "outputAtBlock",
      params: [proposedHeight.toNumber()],
    });
    console.log("outputAtBlock response data:", response0.data);

    //get withdraw proof
    const response1 = await axios.post(SVMContext.SVM_RPC_URL, {
      jsonrpc: "2.0",
      id: 1,
      method: "getSoonWithdrawalProof",
      params: [withdrawTxKey, proposedHeight.toNumber()],
    });
    console.log("getSoonWithdrawalProof response data:", response1.data);

    const withdrawInfo = await SVMContext.SVM_Connection.getAccountInfo(
      new PublicKey(withdrawTxKey)
    );
    expect(withdrawInfo).not.toBeNull();
    expect(withdrawInfo?.data.length).toBeGreaterThan(148);
    const withdrawTx = parseWithdrawTxInfo(
      withdrawInfo?.data ?? Buffer.from("")
    );
    console.log("withdrawTx:", withdrawTx);

    const l2OutputIndex =
      await L2OutputOracle.getL2OutputIndexAfter(proposedHeight);
    const hexPubkey = ethers.utils.hexlify(
      bs58.decode(withdrawTxKey.toString())
    );
    const receipt = await (
      await OptimismPortal.connect(
        EVMContext.EVM_USER
      ).proveWithdrawalTransaction(
        withdrawTx,
        l2OutputIndex,
        hexPubkey,
        {
          version:
            "0x0000000000000000000000000000000000000000000000000000000000000000",
          stateRoot: response0.data.result.stateRoot,
          messagePasserStorageRoot: response0.data.result.withdrawalRoot,
          latestBlockhash: response0.data.result.blockHash,
        },
        response1.data.result.withdrawalProof,
        {
          gasLimit: 1000000,
        }
      )
    ).wait(1);

    console.log(
      `Withdraw tx prove success. txHash: ${receipt.transactionHash}`
    );
  });

  it.sequential("finalize withdraw erc-20", async function () {
    const startingBalance = await ERC20Contract.balanceOf(
      EVMContext.EVM_USER.address
    );
    const withdrawInfo = await SVMContext.SVM_Connection.getAccountInfo(
      new PublicKey(withdrawTxKey)
    );
    if (!withdrawInfo || withdrawInfo.data.length < 148) {
      throw new Error("invalid withdraw Id.");
    }
    //get withdraw tx
    const withdrawTx = parseWithdrawTxInfo(withdrawInfo.data);
    console.log(withdrawTx);

    const OptimismPortal = OptimismPortal__factory.connect(
      EVMContext.EVM_OP_PORTAL,
      EVMContext.EVM_USER
    );

    // must wait for finalization period
    await sleep(3000);

    const receipt = await (
      await OptimismPortal.connect(
        EVMContext.EVM_USER
      ).finalizeWithdrawalTransaction(withdrawTx, {
        gasLimit: 10000000,
      })
    ).wait(1);
    console.log(
      `Finalize withdraw success. txHash: ${receipt.transactionHash}`
    );

    const endingBalance = await ERC20Contract.balanceOf(
      EVMContext.EVM_USER.address
    );
    console.log(
      `start erc-20: ${startingBalance}, end erc-20: ${endingBalance}`
    );

    // check erc-20 balances on L1 match
    expect(startingBalance.add(halfERC)).toEqual(endingBalance);
  });
});

async function createSpl(
  context: SVM_CONTEXT,
  l1Token: string,
  name: string,
  symbol: string,
  uri: string,
  decimals: number
): Promise<PublicKey> {
  const [splTokenOwnerKey] = PublicKey.findProgramAddressSync(
    [Buffer.from("spl-owner"), ethers.utils.arrayify(l1Token)],
    context.SVM_BRIDGE_PROGRAM_ID
  );
  console.log(`splTokenOwnerKey: ${splTokenOwnerKey.toString()}`);

  const [splTokenMintKey] = PublicKey.findProgramAddressSync(
    [Buffer.from("spl-mint"), ethers.utils.arrayify(l1Token)],
    context.SVM_BRIDGE_PROGRAM_ID
  );
  console.log(`splTokenMintKey: ${splTokenMintKey.toString()}`);

  const [vaultKey] = PublicKey.findProgramAddressSync(
    [Buffer.from("vault")],
    context.SVM_BRIDGE_PROGRAM_ID
  );
  console.log(`vaultKey key: ${vaultKey.toString()}`);

  const [bridgeOwnerKey] = PublicKey.findProgramAddressSync(
    [Buffer.from("bridge-owner")],
    context.SVM_BRIDGE_PROGRAM_ID
  );
  console.log(`bridgeOwnerKey: ${bridgeOwnerKey.toString()}`);

  const [metadataKey] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("metadata"),
      mplProgramId.toBuffer(),
      splTokenMintKey.toBuffer(),
    ],
    mplProgramId
  );
  console.log(`metadataKey: ${metadataKey.toString()}`);

  const instructionIndex = Buffer.from(
    Int8Array.from([BridgeInstructionIndex.CreateSPL])
  );
  const instruction = new TransactionInstruction({
    data: Buffer.concat([
      instructionIndex,
      ethers.utils.arrayify(l1Token),
      Buffer.from(Int8Array.from([name.length])),
      Buffer.from(name, "utf8"),
      Buffer.from(Int8Array.from([symbol.length])),
      Buffer.from(symbol, "utf8"),
      Buffer.from(Int8Array.from([uri.length])),
      Buffer.from(uri, "utf8"),
      Buffer.from(Int8Array.from([decimals])),
    ]),
    keys: [
      { pubkey: SYSTEM_PROGRAM, isSigner: false, isWritable: false },
      { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: splTokenOwnerKey, isSigner: false, isWritable: false },
      { pubkey: splTokenMintKey, isSigner: false, isWritable: true },
      { pubkey: vaultKey, isSigner: false, isWritable: true },
      { pubkey: bridgeOwnerKey, isSigner: false, isWritable: false },
      {
        pubkey: context.SVM_BRIDGE_ADMIN.publicKey,
        isSigner: true,
        isWritable: true,
      },
      { pubkey: mplProgramId, isSigner: false, isWritable: false },
      { pubkey: metadataKey, isSigner: false, isWritable: true },
    ],
    programId: context.SVM_BRIDGE_PROGRAM_ID,
  });
  console.log(`system: ${SYSTEM_PROGRAM}`);
  console.log(JSON.stringify(instruction));

  await sendTransaction(context, [instruction], true);

  console.log(`l2Token: ${splTokenMintKey.toBase58()}`);
  return splTokenMintKey;
}

async function getSplTokenBalance(
  context: SVM_CONTEXT,
  l2Token: PublicKey,
  account: PublicKey
): Promise<bigint> {
  const info = await context.SVM_Connection.getParsedTokenAccountsByOwner(
    account,
    { mint: l2Token }
  );
  const amount = info.value[0]?.account.data.parsed.info.tokenAmount.amount;

  if (amount) {
    return BigInt(amount);
  } else {
    return 0n;
  }
}
