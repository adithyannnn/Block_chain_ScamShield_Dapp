import { ethers } from "hardhat";
import * as crypto from "crypto";

function computeHash(url: string): string {
  const hash = crypto.createHash("sha256").update(url, "utf8").digest("hex");
  return `0x${hash}`;
}

async function main() {
  console.log("Seeding on-chain threat records to local ScamShield contract...");
  const [deployer, reporter1, reporter2, reporter3] = await ethers.getSigners();

  const deployments = require("../deployments/localhost.json");
  const contractAddress = deployments.address;

  const ScamShieldFactory = await ethers.getContractFactory("ScamShield");
  const scamShield = ScamShieldFactory.attach(contractAddress) as any;

  const sampleReports = [
    {
      url: "https://metamask-security-alert.org/restore-seed",
      category: 4, // Credential Harvester
      signer: reporter1,
      repeats: 0,
    },
    {
      url: "https://uniswap-v4-airdrop-claim.xyz/permit",
      category: 3, // Scam / Drainer
      signer: reporter2,
      repeats: 2, // 2 extra repeat reports
    },
    {
      url: "https://binance-auth-security-update.net/verify",
      category: 1, // Phishing
      signer: reporter1,
      repeats: 1,
    },
    {
      url: "https://ledger-live-desktop-update.top/download.exe",
      category: 2, // Malware
      signer: reporter3,
      repeats: 0,
    },
    {
      url: "https://opensea-creator-rewards.co/claim",
      category: 5, // Brand Impersonation
      signer: deployer,
      repeats: 0,
    },
  ];

  for (const item of sampleReports) {
    const hash = computeHash(item.url);
    console.log(`Reporting: ${item.url} -> ${hash}`);
    const tx = await scamShield.connect(item.signer).reportURL(hash, item.category);
    await tx.wait(1);

    for (let r = 0; r < item.repeats; r++) {
      const repeatSigner = r % 2 === 0 ? reporter2 : reporter3;
      const rTx = await scamShield.connect(repeatSigner).reportURL(hash, item.category);
      await rTx.wait(1);
    }
  }

  const total = await scamShield.getTotalUniqueURLs();
  const totalSubmissions = await scamShield.getTotalSubmissions();
  console.log(`\n Successfully seeded ${total} unique threat indicators (${totalSubmissions} cumulative reports)!`);
}

main().catch((err) => {
  console.error("Seeding failed:", err);
  process.exitCode = 1;
});

