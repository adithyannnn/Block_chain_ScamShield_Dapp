import { ethers, network } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("==================================================");
  console.log("       ScamShield Smart Contract Deployment       ");
  console.log("==================================================");

  const [deployer] = await ethers.getSigners();
  const balance = await ethers.provider.getBalance(deployer.address);
  const netInfo = await ethers.provider.getNetwork();

  console.log(`Network Name : ${network.name}`);
  console.log(`Chain ID     : ${netInfo.chainId.toString()}`);
  console.log(`Deployer     : ${deployer.address}`);
  console.log(`Balance      : ${ethers.formatEther(balance)} ETH`);

  console.log("\nDeploying ScamShield contract...");
  const ScamShieldFactory = await ethers.getContractFactory("ScamShield");
  const scamShield = await ScamShieldFactory.deploy();
  await scamShield.waitForDeployment();

  const deployedAddress = await scamShield.getAddress();
  const deployTx = scamShield.deploymentTransaction();
  const txHash = deployTx ? deployTx.hash : "N/A";

  console.log(`\n Contract deployed successfully!`);
  console.log(`Deployed Address : ${deployedAddress}`);
  console.log(`Transaction Hash : ${txHash}`);

  // Export contract address and ABI for frontend integration
  const artifactPath = path.join(__dirname, "../artifacts/contracts/ScamShield.sol/ScamShield.json");
  let contractArtifact: any = null;

  if (fs.existsSync(artifactPath)) {
    const raw = fs.readFileSync(artifactPath, "utf-8");
    contractArtifact = JSON.parse(raw);
  }

  const frontendConfigDir = path.join(__dirname, "../frontend/src/contracts");
  if (!fs.existsSync(frontendConfigDir)) {
    fs.mkdirSync(frontendConfigDir, { recursive: true });
  }

  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const deploymentData = {
    address: deployedAddress,
    network: network.name,
    chainId: Number(netInfo.chainId),
    deployedAt: new Date().toISOString(),
    transactionHash: txHash,
    deployer: deployer.address,
    abi: contractArtifact ? contractArtifact.abi : [],
  };

  // Write deployment record to deployments/
  const networkDeploymentFile = path.join(deploymentsDir, `${network.name}.json`);
  fs.writeFileSync(networkDeploymentFile, JSON.stringify(deploymentData, null, 2));
  console.log(`Saved deployment info to: ${networkDeploymentFile}`);

  // Write frontend config file
  const frontendConfigFile = path.join(frontendConfigDir, "contractConfig.json");
  fs.writeFileSync(frontendConfigFile, JSON.stringify(deploymentData, null, 2));
  console.log(`Updated frontend config at: ${frontendConfigFile}`);

  console.log("==================================================");
}

main().catch((error) => {
  console.error("Deployment failed:", error);
  process.exitCode = 1;
});

