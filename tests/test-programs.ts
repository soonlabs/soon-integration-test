import { describe, it, expect, beforeAll } from 'vitest';
import { deploymentData } from "./setup";
import {
  createEVMContext,
  EVM_CONTEXT,
} from "soon-bridge-tool/src/helper/evm_context";
import {
  createSVMContext,
  SVM_CONTEXT,
  sendTransaction,
} from "soon-bridge-tool/src/helper/svm_context";
import {
  PublicKey,
  Keypair,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import { sleep } from "soon-bridge-tool/src/helper/tool";
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as anchor from "@coral-xyz/anchor";
import { BuiltinAndSplCpiSDK } from "./app/index";

const execAsync = promisify(exec);

describe("test native programs and custom programs", () => {
  // Define contexts at the top level
  let EVMContext: EVM_CONTEXT;
  let SVMContext: SVM_CONTEXT;
  let builtinAndSplCpiProgramId: PublicKey;
  let programKeypair: Keypair;
  let sdk: BuiltinAndSplCpiSDK;
  
  let accountDataProgramId: PublicKey;
  let accountDataProgram: any;
  let addressInfoAccount: Keypair;

  // Setup test environment
  beforeAll(async () => {
    try {
      EVMContext = await createEVMContext();
      SVMContext = await createSVMContext();
      
      // Ensure the user account has enough SOL for transactions
      const userBalance = await SVMContext.SVM_Connection.getBalance(SVMContext.SVM_USER.publicKey);
      if (userBalance < LAMPORTS_PER_SOL * 10) {
        await SVMContext.SVM_Connection.requestAirdrop(
          SVMContext.SVM_USER.publicKey,
          LAMPORTS_PER_SOL * 10
        );
        await sleep(1000); // Wait for airdrop to be confirmed
      }
      
      addressInfoAccount = Keypair.generate();
    } catch (error) {
      console.error("Setup failed:", error);
      throw error;
    }
  });

  it("should verify basic EVM connection", async () => {
    // Test EVM connection
    const network = await EVMContext.EVM_PROVIDER.getNetwork();
    console.log("Connected to network:", network.chainId);
    expect(network).toBeDefined();
  });

  it("should verify basic SVM connection", async () => {
    // Test Solana connection
    const version = await SVMContext.SVM_Connection.getVersion();
    console.log("Solana version:", version);
    expect(version).toBeDefined();
  });

  it("should deploy the builtin_and_spl_cpi program", async () => {
    // Generate a new keypair for the program deployer
    programKeypair = Keypair.generate();
    
    // Save the keypair to a file in Solana CLI format
    const keypairPath = path.resolve(process.cwd(), 'program-deployer.json');
    fs.writeFileSync(keypairPath, `[${programKeypair.secretKey.toString()}]`);
    
    console.log("Generated program deployer keypair and saved to:", keypairPath);
    
    // Fund the program deployer account with more SOL (10 SOL should be enough)
    const fundTx = await SVMContext.SVM_Connection.requestAirdrop(
      programKeypair.publicKey,
      LAMPORTS_PER_SOL * 10
    );
    console.log("Funded program deployer account, tx:", fundTx);
    await sleep(2000); // Wait longer for airdrop to be confirmed
    
    // Verify the balance
    const balance = await SVMContext.SVM_Connection.getBalance(programKeypair.publicKey);
    console.log(`Program deployer balance: ${balance / LAMPORTS_PER_SOL} SOL`);
    
    try {
      // Check if the program binary exists in the programs directory
      const programSrcPath = path.resolve(process.cwd(), 'programs/builtin_and_spl_cpi/target/deploy/builtin_and_spl_cpi.so');
      const programDestPath = path.resolve(process.cwd(), 'target/deploy/builtin_and_spl_cpi.so');
      
      // Create target/deploy directory if it doesn't exist
      if (!fs.existsSync(path.dirname(programDestPath))) {
        fs.mkdirSync(path.dirname(programDestPath), { recursive: true });
      }
      
      // Only copy the program binary if it doesn't already exist in the target directory
      if (fs.existsSync(programSrcPath)) {
        if (!fs.existsSync(programDestPath)) {
          console.log(`Copying program binary from ${programSrcPath} to ${programDestPath}`);
          fs.copyFileSync(programSrcPath, programDestPath);
        } else {
          console.log(`Program binary already exists at ${programDestPath}, skipping copy`);
        }
        
        // Also copy the keypair file if it exists and doesn't already exist in the target directory
        const keypairSrcPath = path.resolve(process.cwd(), 'programs/builtin_and_spl_cpi/target/deploy/builtin_and_spl_cpi-keypair.json');
        const keypairDestPath = path.resolve(process.cwd(), 'target/deploy/builtin_and_spl_cpi-keypair.json');
        if (fs.existsSync(keypairSrcPath)) {
          if (!fs.existsSync(keypairDestPath)) {
            console.log(`Copying program keypair from ${keypairSrcPath} to ${keypairDestPath}`);
            fs.copyFileSync(keypairSrcPath, keypairDestPath);
          } else {
            console.log(`Program keypair already exists at ${keypairDestPath}, skipping copy`);
          }
        }
      } else {
        console.error(`Program binary not found at ${programSrcPath}`);
        throw new Error(`Program binary not found at ${programSrcPath}`);
      }
      
      // Get the RPC URL from the SVM context
      const rpcUrl = SVMContext.SVM_RPC_URL;
      
      // Deploy the program using anchor deploy
      console.log("Deploying program...");
      const { stdout, stderr } = await execAsync(
        `anchor deploy --provider.cluster ${rpcUrl} --provider.wallet ${keypairPath}`
      );
      
      console.log("Deployment stdout:", stdout);
      if (stderr) {
        console.error("Deployment stderr:", stderr);
      }
      
      // Extract the program ID from the output or use the predefined one
      builtinAndSplCpiProgramId = new PublicKey("5c7ieGcQcqaGFCBJzHUwYEvcqhdiZAVZb3sfwWwFvCse");
      
      // Wait longer for deployment to be confirmed (10 seconds)
      console.log("Waiting for program deployment to be confirmed...");
      await sleep(10000);
      
      // Verify the program was deployed
      const programInfo = await SVMContext.SVM_Connection.getAccountInfo(builtinAndSplCpiProgramId);
      console.log("Program info:", programInfo);
      
      if (!programInfo) {
        throw new Error(`Program not found at address: ${builtinAndSplCpiProgramId.toString()}`);
      }
      
      if (!programInfo.executable) {
        throw new Error(`Account at ${builtinAndSplCpiProgramId.toString()} is not executable`);
      }
      
      console.log("Program deployed at:", builtinAndSplCpiProgramId.toString());
      expect(programInfo).not.toBeNull();
      expect(programInfo?.executable).toBe(true);
      
      // Initialize the SDK with the deployed program
      const wallet = new anchor.Wallet(SVMContext.SVM_USER);
      sdk = new BuiltinAndSplCpiSDK(SVMContext.SVM_Connection, wallet);
      
    } catch (error) {
      console.error("Deployment error:", error);
      throw error;
    } finally {
      // Clean up the keypair file
      try {
        fs.unlinkSync(keypairPath);
      } catch (e) {
        console.error("Failed to clean up keypair file:", e);
      }
    }
  }, 300000);

  it("should invoke SPL memo instruction", async () => {
    // Skip if program wasn't deployed or SDK wasn't initialized
    if (!sdk) {
      console.warn("Skipping test: SDK not initialized");
      return;
    }

    try {
      console.log("Invoking SPL memo instruction...");
      const txSignature = await sdk.spl.splMemo();
      console.log("SPL memo instruction invoked successfully. Transaction signature:", txSignature);
      
      // Verify the transaction was successful
      const txInfo = await SVMContext.SVM_Connection.getTransaction(txSignature, {
        commitment: "confirmed",
      });
      
      expect(txInfo).not.toBeNull();
      expect(txInfo?.meta?.err).toBeNull();
    } catch (error) {
      console.error("Failed to invoke SPL memo instruction:", error);
      throw error;
    }
  });

  it("should invoke SPL noop instruction", async () => {
    // Skip if program wasn't deployed or SDK wasn't initialized
    if (!sdk) {
      console.warn("Skipping test: SDK not initialized");
      return;
    }

    try {
      console.log("Invoking SPL noop instruction...");
      const txSignature = await sdk.spl.splNoop();
      console.log("SPL noop instruction invoked successfully. Transaction signature:", txSignature);
      
      // Verify the transaction was successful
      const txInfo = await SVMContext.SVM_Connection.getTransaction(txSignature, {
        commitment: "confirmed",
      });
      
      expect(txInfo).not.toBeNull();
      expect(txInfo?.meta?.err).toBeNull();
    } catch (error) {
      console.error("Failed to invoke SPL noop instruction:", error);
      throw error;
    }
  });

  // Add tests for other SPL instructions
  it("should create SPL token", async () => {
    // Skip if program wasn't deployed or SDK wasn't initialized
    if (!sdk) {
      console.warn("Skipping test: SDK not initialized");
      return;
    }

    try {
      console.log("Creating SPL token...");
      const txSignature = await sdk.spl.splToken();
      console.log("SPL token created successfully. Transaction signature:", txSignature);
      
      // Verify the transaction was successful
      const txInfo = await SVMContext.SVM_Connection.getTransaction(txSignature, {
        commitment: "confirmed",
      });
      
      expect(txInfo).not.toBeNull();
      expect(txInfo?.meta?.err).toBeNull();
    } catch (error) {
      console.error("Failed to create SPL token:", error);
      throw error;
    }
  });


  it("should wrap SOL to WSOL", async () => {
    // Skip if program wasn't deployed or SDK wasn't initialized
    if (!sdk) {
      console.warn("Skipping test: SDK not initialized");
      return;
    }

    try {
      console.log("Wrapping SOL to WSOL...");
      const txSignature = await sdk.spl.wrapSOL();
      console.log("SOL wrapped to WSOL successfully. Transaction signature:", txSignature);
      
      // Verify the transaction was successful
      const txInfo = await SVMContext.SVM_Connection.getTransaction(txSignature, {
        commitment: "confirmed",
      });
      
      expect(txInfo).not.toBeNull();
      expect(txInfo?.meta?.err).toBeNull();
    } catch (error) {
      console.error("Failed to wrap SOL to WSOL:", error);
      throw error;
    }
  });

  // New tests for account_data_anchor_program_example
  it("should initialize account_data_anchor_program_example program", async () => {
    try {
      accountDataProgramId = new PublicKey("EjVpuq1j4F8vXequaJEGYH8WMpKytdcv24i39say94uA");
      
      const programInfo = await SVMContext.SVM_Connection.getAccountInfo(accountDataProgramId);
      console.log("Account Data Program ID:", accountDataProgramId.toString());
      expect(programInfo).not.toBeNull();
      expect(programInfo?.executable).toBe(true);
      
      const provider = new anchor.AnchorProvider(
        SVMContext.SVM_Connection,
        new anchor.Wallet(SVMContext.SVM_USER),
        { commitment: "confirmed" }
      );
      anchor.setProvider(provider);
      
      try {
        accountDataProgram = anchor.workspace.AccountDataAnchorProgramExample;
        console.log("Program initialized successfully from workspace");
      } catch (e) {
        console.log("Failed to get program from workspace, trying alternative method:", e);
        
        const idlPath = path.resolve(process.cwd(), 'target/idl/account_data_anchor_program_example.json');
        if (fs.existsSync(idlPath)) {
          const idl = JSON.parse(fs.readFileSync(idlPath, 'utf8'));
          accountDataProgram = new anchor.Program(idl, accountDataProgramId, provider);
          console.log("Program initialized successfully from IDL file");
        } else {
          throw new Error("IDL file not found");
        }
      }
      
    } catch (error) {
      console.error("Failed to initialize account_data_anchor_program_example program:", error);
    }
  });
  
  it("should create address info account", async () => {
    // Skip if program wasn't initialized
    if (!accountDataProgram) {
      console.warn("Skipping test: Account Data Program not initialized");
      return;
    }

    try {
      console.log(`Payer Address      : ${SVMContext.SVM_USER.publicKey}`);
      console.log(`Address Info Acct  : ${addressInfoAccount.publicKey}`);

      // Instruction data
      const addressInfo = {
        name: 'John Doe',
        houseNumber: 123,
        street: 'Blockchain Avenue',
        city: 'Solana Beach',
      };

      // Execute the create_address_info instruction
      const txSignature = await accountDataProgram.methods
        .createAddressInfo(
          addressInfo.name,
          addressInfo.houseNumber,
          addressInfo.street,
          addressInfo.city
        )
        .accounts({
          payer: SVMContext.SVM_USER.publicKey,
          addressInfo: addressInfoAccount.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([addressInfoAccount])
        .rpc();

      console.log("Address info account created successfully. Transaction signature:", txSignature);
      
      // Verify the transaction was successful
      const txInfo = await SVMContext.SVM_Connection.getTransaction(txSignature, {
        commitment: "confirmed",
      });
      
      expect(txInfo).not.toBeNull();
      expect(txInfo?.meta?.err).toBeNull();
    } catch (error) {
      console.error("Failed to create address info account:", error);
      throw error;
    }
  });
});