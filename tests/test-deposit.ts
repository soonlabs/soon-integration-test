import { describe, it, test, expect, beforeAll } from "vitest";
import {
  L1StandardBridge,
  L1StandardBridge__factory,
} from "soon-birdge-tool/typechain-types";
import {
  createEVMContext,
  EVM_CONTEXT,
} from "soon-birdge-tool/src/helper/evm_context";
import {
  SVM_CONTEXT,
  createSVMContext,
} from "soon-birdge-tool/src/helper/svm_context";
import { base58PublicKeyToHex, sleep } from "soon-birdge-tool/src/helper/tool";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";

const gasLimit = 100000;
const tenthETH: bigint = 100_000_000_000_000_000n;
const oneSol = LAMPORTS_PER_SOL;

describe("test deposit", () => {
  let EVMContext: EVM_CONTEXT;
  let SVMContext: SVM_CONTEXT;
  let L1Bridge: L1StandardBridge;

  beforeAll(async function () {
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
  });

  it("deposit", async function () {
    const startingBalance = await EVMContext.EVM_USER.getBalance();
    const accountInfo = await SVMContext.SVM_Connection.getAccountInfo(
      SVMContext.SVM_USER.publicKey
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
        }
      )
    ).wait(1);

    console.log(`Deposit ETH success. txHash: ${receipt.transactionHash}`);

    const endBalance = await EVMContext.EVM_PROVIDER.getBalance(
      EVMContext.EVM_USER.address
    );
    // check that balances on L1 match
    expect(
      startingBalance
        .sub(tenthETH)
        .sub(receipt.cumulativeGasUsed.mul(receipt.effectiveGasPrice))
    ).toEqual(endBalance);

    // wait sequencer to track.
    await sleep(1000);

    // check balance on SOON
    const endingAccount = await SVMContext.SVM_Connection.getAccountInfo(
      SVMContext.SVM_USER.publicKey
    );
    expect(endingAccount).not.toBeNull();
    const endSol = endingAccount?.lamports;

    console.log(`start: ${startingSol}, end: ${endSol}`);
    expect(startingSol + oneSol * 0.1).toEqual(endSol);
  });
});
