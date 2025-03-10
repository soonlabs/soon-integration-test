import { beforeAll } from "vitest";
import fs from "fs";
import path from "path";

interface DeploymentData {
  AddressManager: string;
  AnchorStateRegistry: string;
  AnchorStateRegistryProxy: string;
  DelayedWETH: string;
  DelayedWETHProxy: string;
  DisputeGameFactory: string;
  DisputeGameFactoryProxy: string;
  L1CrossDomainMessenger: string;
  L1CrossDomainMessengerProxy: string;
  L1ERC721Bridge: string;
  L1ERC721BridgeProxy: string;
  L1StandardBridge: string;
  L1StandardBridgeProxy: string;
  L2OutputOracle: string;
  L2OutputOracleProxy: string;
  Mips: string;
  OptimismMintableERC20Factory: string;
  OptimismMintableERC20FactoryProxy: string;
  OptimismPortal: string;
  OptimismPortal2: string;
  OptimismPortalProxy: string;
  PermissionedDelayedWETHProxy: string;
  PreimageOracle: string;
  ProtocolVersions: string;
  ProtocolVersionsProxy: string;
  ProxyAdmin: string;
  SafeProxyFactory: string;
  SafeSingleton: string;
  SuperchainConfig: string;
  SuperchainConfigProxy: string;
  SystemConfig: string;
  SystemConfigProxy: string;
  SystemOwnerSafe: string;
}

export let deploymentData: DeploymentData;

beforeAll(() => {
  const deploymentPath = path.join(
    process.cwd(),
    "deployments",
    "it-deploy.json",
  );
  const rawData = fs.readFileSync(deploymentPath, "utf8");
  deploymentData = JSON.parse(rawData);

  // Initialize contract addresses from deployment
  process.env.L2OO_ADDRESS = deploymentData.L2OutputOracleProxy;
  process.env.L1_STANDARD_BRIDGE_PROXY = deploymentData.L1StandardBridgeProxy;
  process.env.EVM_STANDARD_BRIDGE = deploymentData.L1StandardBridgeProxy;
  process.env.SYSTEM_CONFIG_PROXY = deploymentData.SystemConfigProxy;
  process.env.L1_CROSS_DOMAIN_PROXY =
    deploymentData.L1CrossDomainMessengerProxy;
  process.env.SOON_NODE_DEPOSIT_CONTRACT = deploymentData.OptimismPortalProxy;

  // Log environment variables to confirm they are set correctly
  console.log("Environment variables set from deployment:");
  console.log("L2OO_ADDRESS:", process.env.L2OO_ADDRESS);
  console.log("EVM_STANDARD_BRIDGE:", process.env.EVM_STANDARD_BRIDGE);
  console.log("SYSTEM_CONFIG_PROXY:", process.env.SYSTEM_CONFIG_PROXY);
  console.log("L1_CROSS_DOMAIN_PROXY:", process.env.L1_CROSS_DOMAIN_PROXY);
  console.log(
    "SOON_NODE_DEPOSIT_CONTRACT",
    process.env.SOON_NODE_DEPOSIT_CONTRACT,
  );

  console.log("Loaded deployment data:");
  console.log(JSON.stringify(deploymentData, null, 2));
});
