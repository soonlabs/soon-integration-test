import { beforeAll } from 'vitest';
import fs from 'fs';
import path from 'path';

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
    const deploymentPath = path.join(process.cwd(), 'deployments', 'it-deploy.json');
    const rawData = fs.readFileSync(deploymentPath, 'utf8');
    deploymentData = JSON.parse(rawData);
    
    console.log('Loaded deployment data:');
    console.log(JSON.stringify(deploymentData, null, 2));
});