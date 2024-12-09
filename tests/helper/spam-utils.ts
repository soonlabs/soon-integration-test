import { Keypair } from "@solana/web3.js";
import { EVM_CONTEXT } from "soon-birdge-tool/src/helper/evm_context";
import { SVM_CONTEXT } from "soon-birdge-tool/src/helper/svm_context";
import { sleep } from "soon-birdge-tool/src/helper/tool";
import { ethers } from "ethers";

export async function spamL2Tx(svmContext: SVM_CONTEXT, loopNum: number) {
  // Allocate Account Data
  let allocatedAccount = Keypair.generate();

  for (let i = 0; i < loopNum; i++) {
    await svmContext.SVM_Connection.requestAirdrop(
      allocatedAccount.publicKey,
      100000,
    );

    await sleep(60);
  }
}

export async function spamL1Tx(evmContext: EVM_CONTEXT, loopNum: number) {
  for (let i = 0; i < loopNum; i++) {
    await evmContext.EVM_USER.sendTransaction({
      to: "0x92d3267215Ec56542b985473E73C8417403B15ac",
      value: ethers.utils.parseUnits("0.00000001", "ether"),
    });

    await sleep(30);
  }
}
