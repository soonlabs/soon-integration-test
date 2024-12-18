import { describe, it, expect, beforeAll } from "vitest";
import {
  L1StandardBridge,
  L1StandardBridge__factory,
  OptimismPortal__factory,
  L2OutputOracle__factory,
} from "soon-bridge-tool/typechain-types";
import {
  createEVMContext,
  EVM_CONTEXT,
} from "soon-bridge-tool/src/helper/evm_context";
import {
  BridgeInstructionIndex,
  createSVMContext,
  SVM_CONTEXT,
  DEFAULT_BRIDGE_PROGRAM,
  genProgramDataAccountKey,
  sendTransaction,
  SYSTEM_PROGRAM,
} from "soon-bridge-tool/src/helper/svm_context";
import {
  PublicKey,
  SYSVAR_RENT_PUBKEY,
  TransactionInstruction,
  LAMPORTS_PER_SOL,
  Keypair,
} from "@solana/web3.js";
import {
  Numberu128,
  Numberu64,
} from "soon-bridge-tool/src/helper/number.utils";
import { ethers } from "ethers";
import {
  base58PublicKeyToHex,
  isValidEthereumAddress,
  parseWithdrawTxInfo,
  sleep,
} from "soon-bridge-tool/src/helper/tool";
import { spamL2Tx } from "./helper/spam-utils";
import axios from "axios";
import bs58 from "bs58";

const gasLimit = 100000;
const tenthETH: bigint = 100_000_000_000_000_000n;
const oneSol = LAMPORTS_PER_SOL;
const zeroBuffer: Buffer = Buffer.from([0, 0, 0, 0, 0, 0, 0, 0]);

describe("test deposit and withdraw", () => {
  let EVMContext: EVM_CONTEXT;
  let SVMContext: SVM_CONTEXT;
  let L1Bridge: L1StandardBridge;
  let svmAccount: Keypair;
  let withdrawTxKey: PublicKey;
  let withdrawalSignature: string;
  let withdrawHeight: number;

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
        oneSol * 2,
      );
    }
    await sleep(100);
  });

  it.sequential("deposit", async function () {
    const startingBalance = await EVMContext.EVM_USER.getBalance();
    const accountInfo = await SVMContext.SVM_Connection.getAccountInfo(
      SVMContext.SVM_USER.publicKey,
    );
    expect(accountInfo).not.toBeNull();
    const startingSol = accountInfo?.lamports ?? 0;

    const receipt = await (
      await L1Bridge.bridgeETHTo(
        base58PublicKeyToHex(SVMContext.SVM_USER.publicKey.toBase58()),
        gasLimit,
        "0x",
        {
          value: tenthETH,
          gasLimit: 1000000,
        },
      )
    ).wait(1);

    console.log(`Deposit ETH success. txHash: ${receipt.transactionHash}`);

    const endBalance = await EVMContext.EVM_PROVIDER.getBalance(
      EVMContext.EVM_USER.address,
    );
    // check that balances on L1 match
    expect(
      startingBalance
        .sub(tenthETH)
        .sub(receipt.cumulativeGasUsed.mul(receipt.effectiveGasPrice)),
    ).toEqual(endBalance);

    // wait sequencer to track.
    await sleep(1000);

    // check balance on SOON
    const endingAccount = await SVMContext.SVM_Connection.getAccountInfo(
      SVMContext.SVM_USER.publicKey,
    );
    expect(endingAccount).not.toBeNull();
    const endSol = endingAccount?.lamports;

    console.log(`start: ${startingSol}, end: ${endSol}`);
    expect(startingSol + oneSol * 0.1).toEqual(endSol);
  });

  // sequential test for each step of withdraw process
  it.sequential("initiate withdraw", async function () {
    const l1Target = EVMContext.EVM_USER.address;
    expect(isValidEthereumAddress(l1Target)).toBeTruthy();

    console.log(
      `withdrawal from ${SVMContext.SVM_USER.publicKey.toBase58()} to ${l1Target}`,
    );

    const [counterKey] = PublicKey.findProgramAddressSync(
      [Buffer.from("svm-withdraw-counter"), SVMContext.SVM_USER.publicKey.toBuffer()],
      SVMContext.SVM_BRIDGE_PROGRAM_ID,
    );
    console.log(`Counter key: ${counterKey.toString()}`);

    const startingInfo = await SVMContext.SVM_Connection.getAccountInfo(
      SVMContext.SVM_USER.publicKey,
    );
    expect(startingInfo).not.toBeNull();
    const startingSol = startingInfo?.lamports ?? 0;

    const accountInfo =
      await SVMContext.SVM_Connection.getAccountInfo(counterKey);

    const withdrawTxSeed = accountInfo?.data.slice(0, 8) ?? zeroBuffer;
    const counter = Numberu64.fromBuffer(withdrawTxSeed);
    console.log(`counter: ${counter}`);

    // get withdraw tx key
    let [key] = PublicKey.findProgramAddressSync(
      [SVMContext.SVM_USER.publicKey.toBuffer(), withdrawTxSeed],
      SVMContext.SVM_BRIDGE_PROGRAM_ID,
    );
    withdrawTxKey = key;
    console.log(`Withdraw ID: ${withdrawTxKey.toString()}`);

    // get vault key
    const vaultKey = genProgramDataAccountKey("vault", DEFAULT_BRIDGE_PROGRAM);
    console.log(`vaultKey key: ${vaultKey.toString()}`);

    // get bridge config key
    const bridgeConfigKey = genProgramDataAccountKey(
      "bridge-config",
      DEFAULT_BRIDGE_PROGRAM,
    );
    console.log(`bridgeConfigKey key: ${bridgeConfigKey.toString()}`);

    const withdrawalAmount = oneSol * 0.5;

    const instructionIndex = Buffer.from(
      Int8Array.from([BridgeInstructionIndex.WithdrawETH]),
    );
    const instruction = new TransactionInstruction({
      data: Buffer.concat([
        instructionIndex,
        Buffer.concat([ethers.utils.arrayify(l1Target)]),
        new Numberu128(withdrawalAmount).toBuffer(),
        new Numberu128(gasLimit).toBuffer(),
      ]),
      keys: [
        { pubkey: SYSTEM_PROGRAM, isSigner: false, isWritable: false },
        { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
        { pubkey: counterKey, isSigner: false, isWritable: true },
        { pubkey: withdrawTxKey, isSigner: false, isWritable: true },
        { pubkey: vaultKey, isSigner: false, isWritable: true },
        { pubkey: bridgeConfigKey, isSigner: false, isWritable: false },
        {
          pubkey: SVMContext.SVM_USER.publicKey,
          isSigner: true,
          isWritable: false,
        },
      ],
      programId: SVMContext.SVM_BRIDGE_PROGRAM_ID,
    });

    const signature = await sendTransaction(SVMContext, [instruction]);
    withdrawalSignature = signature;

    await sleep(100);
    const status =
      await SVMContext.SVM_Connection.getSignatureStatus(signature);
    withdrawHeight = status!.value?.slot ?? -1;
    expect(withdrawHeight).toBeGreaterThan(0);
    console.log(`Withdraw Height: ${withdrawHeight}`);

    const txInfo =
      await SVMContext.SVM_Connection.getParsedTransaction(signature);
    expect(txInfo).not.toBeNull();

    const newWithdrawalAccountIndex =
      txInfo?.transaction.message.accountKeys.findIndex(
        (acc) => acc.pubkey.toString() === withdrawTxKey.toString(),
      ) ?? -1;
    expect(newWithdrawalAccountIndex).toBeGreaterThanOrEqual(0);
    const after = txInfo?.meta?.postBalances?.[newWithdrawalAccountIndex] ?? 0;
    const before = txInfo?.meta?.preBalances?.[newWithdrawalAccountIndex] ?? 0;
    const rentPaid = after - before;

    console.log(`newWithdrawalAccountIndex: ${newWithdrawalAccountIndex}`);
    console.log(`after: ${after}`);
    console.log(`before: ${before}`);
    console.log(`rentPaid: ${rentPaid}`);

    let feePaid = txInfo?.meta?.fee;
    feePaid ??= 0;

    const endingInfo = await SVMContext.SVM_Connection.getAccountInfo(
      SVMContext.SVM_USER.publicKey,
    );
    expect(endingInfo).not.toBeNull();
    const endingSol = endingInfo?.lamports ?? 0;
    expect(startingSol - feePaid - rentPaid - withdrawalAmount).toEqual(
      endingSol,
    );
    console.log(`start SOL: ${startingSol} ending SOL: ${endingSol}`);
  });

  it.sequential("prove withdrawal: ", async function () {
    // 1. fast forward l2, let proposer propose withdraw root.
    // 2. check proposer height larger than withdraw height.
    // 3. generate proof and verify.
    const OptimismPortal = OptimismPortal__factory.connect(
      EVMContext.EVM_OP_PORTAL,
      EVMContext.EVM_USER,
    );
    const l2OutputOracleAddress = await OptimismPortal.l2Oracle();
    console.log(`l2OutputOracleAddress: ${l2OutputOracleAddress}`);
    const L2OutputOracle = L2OutputOracle__factory.connect(
      l2OutputOracleAddress,
      EVMContext.EVM_PROPOSER!,
    );

    let proposedHeight;
    while (true) {
      proposedHeight = await L2OutputOracle.latestBlockNumber();
      if (proposedHeight >= withdrawHeight) {
        break;
      }
      console.log(
        `not proposed yet. current proposed l2 height: ${proposedHeight}, withdraw height: ${withdrawHeight}`,
      );
      spamL2Tx(SVMContext, 10);
      await sleep(3000);
      continue;
    }

    //get output root proof
    const response0 = await axios.post(SVMContext.SVM_SOON_RPC_URL, {
      jsonrpc: "2.0",
      id: 1,
      method: "outputAtBlock",
      params: [proposedHeight.toNumber()],
    });
    console.log("outputAtBlock response data:", response0.data);

    //get withdraw proof
    const response1 = await axios.post(SVMContext.SVM_SOON_RPC_URL, {
      jsonrpc: "2.0",
      id: 1,
      method: "getSoonWithdrawalProof",
      params: [withdrawTxKey, proposedHeight.toNumber()],
    });
    console.log("getSoonWithdrawalProof response data:", response1.data);

    const withdrawInfo = await SVMContext.SVM_Connection.getAccountInfo(
      new PublicKey(withdrawTxKey),
    );
    expect(withdrawInfo).not.toBeNull();
    expect(withdrawInfo?.data.length).toBeGreaterThan(148);
    const withdrawTx = parseWithdrawTxInfo(
      withdrawInfo?.data ?? Buffer.from(""),
    );
    console.log("withdrawTx:", withdrawTx);

    const l2OutputIndex =
      await L2OutputOracle.getL2OutputIndexAfter(proposedHeight);
    const hexPubkey = ethers.utils.hexlify(
      bs58.decode(withdrawTxKey.toString()),
    );
    const receipt = await (
      await OptimismPortal.connect(
        EVMContext.EVM_USER,
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
          gasLimit: 10000000,
        },
      )
    ).wait(1);

    console.log(
      `Withdraw tx prove success. txHash: ${receipt.transactionHash}`,
    );
  });

  it.sequential("finalize withdraw", async function () {
    const startingBalance = await EVMContext.EVM_USER.getBalance();
    const withdrawInfo = await SVMContext.SVM_Connection.getAccountInfo(
      new PublicKey(withdrawTxKey),
    );
    if (!withdrawInfo || withdrawInfo.data.length < 148) {
      throw new Error("invalid withdraw Id.");
    }
    //get withdraw tx
    const withdrawTx = parseWithdrawTxInfo(withdrawInfo.data);
    console.log(withdrawTx);

    const OptimismPortal = OptimismPortal__factory.connect(
      EVMContext.EVM_OP_PORTAL,
      EVMContext.EVM_USER,
    );

    // must wait for finalization period
    await sleep(3000);

    const receipt = await (
      await OptimismPortal.connect(
        EVMContext.EVM_USER,
      ).finalizeWithdrawalTransaction(withdrawTx, {
        gasLimit: 10000000,
      })
    ).wait(1);
    console.log(
      `Finalize withdraw success. txHash: ${receipt.transactionHash}`,
    );

    const endingBalance = await EVMContext.EVM_USER.getBalance();
    console.log(`start eth: ${startingBalance}, end eth: ${endingBalance}`);

    // check that balances on L1 match
    expect(
      startingBalance.sub(
        receipt.cumulativeGasUsed.mul(receipt.effectiveGasPrice),
      ),
    ).toEqual(endingBalance);
  });
});
