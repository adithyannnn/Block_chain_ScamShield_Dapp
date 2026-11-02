# ScamShield Screenshot & Verification Guide

This directory contains visual captures demonstrating the operation of the ScamShield decentralized threat intelligence application across its lifecycle.

> **Integrity Note**: In accordance with academic honesty standards, screenshots must document actual local or Sepolia testnet execution. Never fabricate transaction hashes, receipts, or blockchain events.

---

## Required Screenshots for Academic Evaluation

| Filename | View / Workflow | Key Elements to Verify |
| :--- | :--- | :--- |
| `01-dashboard.png` | **Dashboard** | Total unique URL counter, total submissions, category distribution, connected network status, latest reports table. |
| `02-report-submission.png` | **Report URL Page** | Suspicious URL input, category selection, client-side normalized URL preview, SHA-256 (bytes32) fingerprint preview, pre-check status. |
| `03-metamask-signature.png` | **MetaMask Prompt** | Real wallet transaction approval popup showing contract method `reportURL`, estimated gas, and target network. |
| `04-transaction-confirmed.png` | **Confirmed Transaction** | Success banner, real Ethereum transaction hash, block confirmation details, Etherscan Sepolia link. |
| `05-check-reported-url.png` | **Check URL (Flagged)** | `PREVIOUSLY REPORTED` status badge, report count, original timestamp, original reporter address, threat category. |
| `06-check-clean-url.png` | **Check URL (Clean)** | `NO REPORT FOUND` status, SHA-256 fingerprint, security caveat explaining zero-day discovery latency. |
| `07-my-reports.png` | **My Reports Page** | Personal indicator portfolio displaying records where connected address was original reporter. |
| `08-threat-reports.png` | **Threat Reports Table** | Full table of on-chain community indicators with category badges, pagination controls, and "View Details" modal. |

---

## How to Capture Real Application Screenshots

### Step 1: Start the Local Hardhat Node and Deploy

In terminal 1:
```bash
npx hardhat node
```

In terminal 2, deploy the smart contract to localhost:
```bash
npx hardhat run scripts/deploy.ts --network localhost
```

### Step 2: Launch the Frontend

```bash
npm run frontend:dev
```
Open [http://localhost:3000](http://localhost:3000) in Chrome with MetaMask installed.

### Step 3: Connect MetaMask to Localhost or Sepolia

- For Localhost: Network Name: `Hardhat Localhost`, RPC: `http://127.0.0.1:8545`, Chain ID: `31337`, Currency: `ETH`. Import one of Hardhat's test private keys.
- For Sepolia: Ensure your wallet has Sepolia test ETH from a faucet.

### Step 4: Execute Test Reports and Take Screenshots

1. **Dashboard**: Navigate to [http://localhost:3000](http://localhost:3000) and capture `01-dashboard.png`.
2. **Report URL**: Enter `https://evil-phishing-bank.com/login`, select **Phishing**, observe the real-time SHA-256 digest (`0x8a9cf296...`), and capture `02-report-submission.png`.
3. **MetaMask Prompt**: Click **Register On-Chain Report**, capture `03-metamask-signature.png` showing the MetaMask modal.
4. **Transaction Confirmed**: After block confirmation, capture `04-transaction-confirmed.png` with the confirmed transaction hash.
5. **Check URL**: Navigate to **Check URL**, enter `https://evil-phishing-bank.com/login`, click **Check Fingerprint**, and capture `05-check-reported-url.png`.
6. **Check Unreported URL**: Enter `https://innocent-fresh-domain.org/about`, verify `NO REPORT FOUND`, and capture `06-check-clean-url.png`.
7. **Threat Reports & My Reports**: Navigate to respective tabs to capture `07-my-reports.png` and `08-threat-reports.png`.
