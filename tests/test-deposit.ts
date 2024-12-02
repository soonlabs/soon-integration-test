import { describe, it, test, expect, beforeAll } from "vitest";
import { L1StandardBridge, L1StandardBridge__factory} from 'soon-birdge-tool/typechain-types';
import { createEVMContext, EVM_CONTEXT } from 'soon-birdge-tool/src/helper/evm_context';
import { SVM_CONTEXT, createSVMContext } from 'soon-birdge-tool/src/helper/svm_context';
import { base58PublicKeyToHex } from 'soon-birdge-tool/src/helper/tool';


const gasLimit = 100000;
const tenthETH: bigint = 100_000_000_000_000_000n;

describe('test deposit', () => {
    let EVMContext: EVM_CONTEXT;
    let SVMContext: SVM_CONTEXT;
    let L1Bridge: L1StandardBridge;

    beforeAll(async function () {
        EVMContext = await createEVMContext();
        SVMContext = await createSVMContext();
        L1Bridge = L1StandardBridge__factory.connect(
            EVMContext.EVM_STANDARD_BRIDGE,
            EVMContext.EVM_USER,
        );
    })

    it('deposit', async function () {
        const startingBalance = await EVMContext.EVM_USER.getBalance();
        const accountInfo = await SVMContext.SVM_Connection.getAccountInfo(SVMContext.SVM_USER.publicKey);
        const startingSol = (accountInfo)? accountInfo.lamports: 0;
        console.log(`key: ${SVMContext.SVM_USER.publicKey.toBase58()}`)

        const receipt = await (
            await L1Bridge.bridgeETHTo(
                base58PublicKeyToHex(SVMContext.SVM_USER.publicKey.toBase58()),
                gasLimit,
                '0x',
                {
                    value: tenthETH,
                    gasLimit: 1000000,
                },
            )
        ).wait(1);

        console.log(`Deposit ETH success. txHash: ${receipt.transactionHash}`);

        const endBalance = await EVMContext.EVM_PROVIDER.getBalance(EVMContext.EVM_USER.address);
        // check that balances on L1 match
        expect(startingBalance.sub(tenthETH).sub(receipt.cumulativeGasUsed.mul(receipt.effectiveGasPrice))).toEqual(endBalance);

        // check balance on SOON
        const endingAccount = await SVMContext.SVM_Connection.getAccountInfo(SVMContext.SVM_USER.publicKey);
        const endSol = (endingAccount)? accountInfo?.lamports: 0;

        console.log(`start: ${startingSol} end: ${endSol}`);
        expect(startingSol).toEqual(endSol);
    })
})
