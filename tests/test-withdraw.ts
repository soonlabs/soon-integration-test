import { describe, it, test, expect, beforeAll } from "vitest";
import { L1StandardBridge, L1StandardBridge__factory, OptimismPortal__factory, L2OutputOracle__factory} from 'soon-birdge-tool/typechain-types';
import { createEVMContext, EVM_CONTEXT } from 'soon-birdge-tool/src/helper/evm_context';
import { Numberu128, Numberu64 } from 'soon-birdge-tool/src/helper/number.utils';
import {
    BridgeInstructionIndex,
    createSVMContext,
    SVM_CONTEXT,
    DEFAULT_BRIDGE_PROGRAM,
    genProgramDataAccountKey,
    sendTransaction,
    SYSTEM_PROGRAM,
} from 'soon-birdge-tool/src/helper/svm_context';
import { ethers } from 'ethers';
import {
  PublicKey,
  SYSVAR_RENT_PUBKEY,
  TransactionInstruction,
  LAMPORTS_PER_SOL,
  Keypair,
} from '@solana/web3.js';
import axios from "axios";

import { base58PublicKeyToHex, sleep} from 'soon-birdge-tool/src/helper/tool';

const gasLimit = 100000;
const oneSol = LAMPORTS_PER_SOL;

describe('test withdraw', () => {
    let EVMContext: EVM_CONTEXT;
    let SVMContext: SVM_CONTEXT;
    let withdrawHeight: number;
    let svmAccount: Keypair;

    beforeAll(async function () {
        svmAccount = Keypair.generate();
        process.env.SVM_USER_KEY = `[${svmAccount.secretKey.toString()}]`;
        process.env.SVM_USER_ADDRESS = svmAccount.publicKey.toBase58();

        EVMContext = await createEVMContext();
        SVMContext = await createSVMContext();

        // init account space on SOON.
        const accountInfo = await SVMContext.SVM_Connection.getAccountInfo(
            SVMContext.SVM_USER.publicKey
        );
        if (!accountInfo || accountInfo.lamports < oneSol) {
            await SVMContext.SVM_Connection.requestAirdrop(
                SVMContext.SVM_USER.publicKey,
                oneSol * 1.1
            );
        }
    })

    // sequential test for each step of withdraw process
    it.sequential('initiate withdraw', async function () {
        const l1Target = EVMContext.EVM_USER.address;
        console.log(`key: ${SVMContext.SVM_USER.publicKey.toBase58()}`);

        const counterKey = genProgramDataAccountKey(
            'svm-withdraw-counter',
            SVMContext.SVM_BRIDGE_PROGRAM_ID,
        );
        console.log(`Counter key: ${counterKey.toString()}`);

        const accountInfo =
            await SVMContext.SVM_Connection.getAccountInfo(counterKey);

        const startingInfo = await SVMContext.SVM_Connection.getAccountInfo(
            SVMContext.SVM_USER.publicKey
        );
        const startingSol = (startingInfo)? startingInfo.lamports: 0;

        const withdrawTxSeed = accountInfo!.data.slice(0, 8);
        const counter = Numberu64.fromBuffer(withdrawTxSeed);
        console.log(`counter: ${counter}`);

        //get withdraw tx key
        const [withdrawTxKey] = PublicKey.findProgramAddressSync(
            [withdrawTxSeed],
            SVMContext.SVM_BRIDGE_PROGRAM_ID,
        );
        console.log(`Withdraw ID: ${withdrawTxKey.toString()}`);

        //get vault key
        const vaultKey = genProgramDataAccountKey('vault', DEFAULT_BRIDGE_PROGRAM);
        console.log(`vaultKey key: ${vaultKey.toString()}`);

        //get bridge config key
        const bridgeConfigKey = genProgramDataAccountKey(
            'bridge-config',
            DEFAULT_BRIDGE_PROGRAM,
        );
        console.log(`bridgeConfigKey key: ${bridgeConfigKey.toString()}`);

        const instructionIndex = Buffer.from(
            Int8Array.from([BridgeInstructionIndex.WithdrawETH]),
        );
        const instruction = new TransactionInstruction({
            data: Buffer.concat([
            instructionIndex,
            Buffer.concat([ethers.getBytes(l1Target)]),
            new Numberu128(oneSol).toBuffer(),
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

        sleep(100);
        const status = await SVMContext.SVM_Connection.getSignatureStatus(signature);
        const maybeWithdrawHeight = status!.value?.slot;
        if (maybeWithdrawHeight) {
            withdrawHeight = maybeWithdrawHeight;
        }

        console.log(`Withdraw Height: ${withdrawHeight}`);

        const txInfo = await SVMContext.SVM_Connection.getParsedTransaction(signature);
        let feePaid = txInfo?.meta?.fee;
        feePaid ??= 0;

        const endingInfo =
            await SVMContext.SVM_Connection.getAccountInfo(
                SVMContext.SVM_USER.publicKey
            );
        const endingSol = (endingInfo)? endingInfo.lamports: 0;

        console.log(`start SOL: ${startingSol} ending SOL: ${endingSol}`);
    });

    it.sequential('propose withdrawal: ', async function () {
        let svmContext = await createSVMContext();

        // fast foward l2
        await spamL2Tx(SVMContext, 30);

        //get output root proof
        const response = await axios.post(svmContext.SVM_SOON_RPC_URL, {
            jsonrpc: '2.0',
            id: 1,
            method: 'outputAtBlock',
            params: [Number(withdrawHeight)],
        });
        console.log('response data:', response.data);

        let EVMContext = await createEVMContext();
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
        console.log(`response.data.outputRoot: ${response.data.result.outputRoot}`);
        console.log(`withdrawHeight: ${withdrawHeight}`);

        // fast foward l2
        await spamL2Tx(SVMContext, 500);

        const receipt = await (
            await L2OutputOracle.proposeL2Output(
            response.data.result.outputRoot,
            withdrawHeight,
            '0x0000000000000000000000000000000000000000000000000000000000000000',
            0,
            {
                gasLimit: 1000000,
            },
            )
        ).wait(1);

        console.log(`Propose withdraw success. txHash: ${receipt.transactionHash}`);
    })
})

async function spamL2Tx(svmContext: SVM_CONTEXT, loopNum: number) {
    // Allocate Account Data
    let allocatedAccount = Keypair.generate();

    for (let i = 0; i < loopNum; i++) {
        await svmContext.SVM_Connection.requestAirdrop(
            allocatedAccount.publicKey,
            100000
        );

        await sleep(30);
    }
}

async function spamL1Tx(evmContext: EVM_CONTEXT, loopNum: number) {

}
