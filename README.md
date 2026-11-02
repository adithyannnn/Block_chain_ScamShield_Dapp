# ScamShield: Blockchain-Based Phishing URL Threat Intelligence DApp

[![Solidity](https://img.shields.io/badge/Solidity-0.8.24-363636?logo=solidity)](https://soliditylang.org/)
[![Hardhat](https://img.shields.io/badge/Hardhat-2.22.2-FFF100?logo=ethereum)](https://hardhat.org/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![Ethers.js](https://img.shields.io/badge/Ethers.js-v6-2535A0)](https://docs.ethers.org/v6/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

An immutable, decentralized threat intelligence decentralized application (DApp) developed for an **MSc Cyber Security** blockchain assignment. **ScamShield** enables cybersecurity researchers, incident responders, and the Web3 community to submit, register, and verify cryptographic SHA-256 fingerprints of phishing and malicious URLs on an EVM-compatible blockchain.

---

## 1. Project Overview & Problem Statement

Phishing attacks and social engineering schemes in the decentralized ecosystem (fake wallet-connect portals, ERC-20 permit drainers, malicious airdrop impersonators, and typosquatted exchanges) cost users billions of dollars annually.

### The Centralized Dilemma
Traditional threat intelligence sharing repositories rely on centralized authorities (Google Safe Browsing, proprietary threat feeds, centralized blacklists). These present notable security and architectural vulnerabilities:
- **Single Point of Failure / Compromise:** Centralized repositories are vulnerable to downtime, insider tampering, and target suppression.
- **Censorship Vulnerability:** Central authorities hold discretionary power to modify, unlist, or suppress indicators without an auditable public trace.
- **Lack of Immutable Provenance:** Victims and forensic researchers cannot independently verify *when* an indicator was first observed or audit the chain of custody.

### The Decentralized Solution: ScamShield
ScamShield provides an open, tamper-evident, append-only threat indicator registry governed by smart contract logic:
1. **Client-Side Hashing:** Raw URLs are normalized and digested locally in the browser using the W3C Web Crypto API. Raw URLs and embedded credentials are **never broadcasted or stored on-chain**.
2. **Deterministic Fingerprints:** URL strings are normalized according to documented canonicalization rules to ensure matching hashes across disparate reporting sources.
3. **Smart Contract Registry:** An EVM contract records the first reporter address, block timestamp, threat category, and cumulative report count without administrative override keys.
4. **Live Decentralized Verification:** Any investigator can query an indicator in milliseconds without gas fees using standard read-only RPC calls.

---

## 2. Technology Stack

| Layer | Component | Version / Standard | Role |
| :--- | :--- | :--- | :--- |
| **Smart Contract** | Solidity | `^0.8.24` (Paris EVM) | Report registry, custom errors, events, zero-admin architecture. |
| **Development Suite** | Hardhat | `^2.22.2` | Contract compilation, testing, local node, and network deployment. |
| **Frontend Framework** | React + Vite | React 18, Vite 5, TypeScript 5 | Responsive, high-performance cybersecurity user interface. |
| **Web3 Library** | ethers.js | `v6.11.1` | JSON-RPC provider, MetaMask wallet signer, and contract binding. |
| **Styling & Icons** | Tailwind CSS + Lucide | Tailwind 3.4, Lucide React | Dark navy cyber theme, subtle cyan/teal borders, status badges. |
| **Cryptography** | Web Crypto API | `crypto.subtle.digest("SHA-256")` | Secure in-browser UTF-8 string digest generation. |
| **Automated Testing** | Mocha, Chai, Vitest | Hardhat Toolbox, Vitest 1.6 | Comprehensive smart contract and client-side unit test suites. |

---

## 3. System Architecture & Threat Flow

```mermaid
sequenceDiagram
    autonumber
    actor Investigator as Security Analyst / User
    participant Browser as Browser (Web Crypto API)
    participant MetaMask as MetaMask Wallet
    participant Node as Ethereum Node (RPC)
    participant Contract as ScamShield.sol (EVM)

    Investigator->>Browser: Enters Suspicious URL
    Note over Browser: Strict Normalization Policy<br/>(Lowercase host, strip default ports, sort query params)
    Browser->>Browser: Compute SHA-256 digest via Web Crypto API (bytes32)
    Browser->>Contract: checkURL(urlHash) (Read-only call)
    Contract-->>Browser: Returns exists flag (true/false)
    
    alt Indicator Already Exists
        Browser->>Investigator: Displays "URL Previously Reported" (+1 Repeat Report Warning)
    else Indicator Is New
        Browser->>Investigator: Displays "New Indicator Preview"
    end

    Investigator->>Browser: Confirms Submission & Threat Category
    Browser->>MetaMask: Requests Transaction Signature: reportURL(urlHash, category)
    MetaMask->>Investigator: Prompts Gas Approval
    Investigator->>MetaMask: Approves Transaction
    MetaMask->>Node: Broadcasts Signed Transaction
    Node->>Contract: Executes reportURL(bytes32, uint8)
    
    alt New Record
        Contract->>Contract: Store Report, Append uniqueURLHashes, Emit URLReported
    else Duplicate Record
        Contract->>Contract: reportCount += 1, Emit RepeatReport (Preserve original reporter)
    end
    
    Contract-->>Node: Transaction Mined in Block
    Node-->>Browser: Transaction Receipt (1 Block Confirmation)
    Browser->>Contract: getReport(urlHash)
    Contract-->>Browser: Returns Confirmed On-Chain Record
    Browser->>Investigator: Displays Verified Hash, Reporter, and Sepolia Explorer Link
```

---

## 4. Smart Contract Specification: `ScamShield.sol`

### Data Structures

```solidity
struct Report {
    bytes32 urlHash;      // SHA-256 digest of normalized URL
    address reporter;     // Address of initial submitter
    uint8 category;       // Threat category (1 to 5)
    uint256 reportedAt;   // First-seen Unix timestamp (block.timestamp)
    uint256 reportCount;  // Cumulative community submissions
    bool exists;          // Sentinel existence flag
}
```

### Threat Categories

| ID | Category Name | Description |
| :---: | :--- | :--- |
| **1** | **Phishing** | Fake login portals, deceptive banking or Web3 wallet mimics designed to steal credentials. |
| **2** | **Malware / Drive-by** | Hosts delivering ransomware, spyware, trojans, or exploit kits. |
| **3** | **Scam / Drainer** | Crypto doubler scams, Ponzi schemes, fake airdrops, and ERC-20 permit drainers. |
| **4** | **Credential Harvester** | Deceptive forms harvesting 2FA tokens, seed phrases, or private keys. |
| **5** | **Brand Impersonation** | Typosquatting and punycode attacks visually mimicking legitimate organizations. |

### Core Functions

- **`reportURL(bytes32 urlHash, uint8 category) external returns (bool isNewReport)`**  
  Registers a new URL fingerprint or increments the report counter of an existing record. Rejects zero hash (`0x00...00`) and out-of-bounds categories (`< 1` or `> 5`). Strictly preserves the original reporter address and original timestamp.
- **`checkURL(bytes32 urlHash) external view returns (bool)`**  
  Read-only verification of whether a fingerprint is registered.
- **`getReport(bytes32 urlHash) external view returns (Report memory)`**  
  Returns full report structure. Reverts with `ReportNotFound(bytes32)` if unrecorded.
- **`getTotalUniqueURLs() external view returns (uint256)`**  
  Returns total unique fingerprints registered on-chain.
- **`getTotalSubmissions() external view returns (uint256)`**  
  Returns total cumulative submissions (initial reports + duplicates).
- **`getURLByIndex(uint256 index) external view returns (bytes32, Report memory)`**  
  Chronological index retrieval with bounds checking (`IndexOutOfBounds`).
- **`getMyReportCount(address reporter) external view returns (uint256)`**  
  Returns total unique indicators originated by a specific address.
- **`getMyReportByIndex(address reporter, uint256 index) external view returns (bytes32, Report memory)`**  
  Indexed lookup of indicators originated by a specific reporter.
- **`getBatchReports(uint256 offset, uint256 limit) external view returns (Report[] memory, uint256)`**  
  Gas-efficient paginated data fetching for frontend threat tables.

---

## 5. URL Normalization & Hashing Policy

Minor syntactic differences in URLs must resolve to the identical cryptographic fingerprint. ScamShield enforces a documented normalization policy in `frontend/src/lib/urlUtils.ts`:

1. **Protocol Scheme:** Only `http:` and `https:` schemes are accepted. Non-web schemes (`ftp:`, `javascript:`, `data:`, `file:`) are rejected to neutralize potential XSS and non-standard payloads.
2. **Credential Rejection:** URLs containing embedded user credentials (e.g. `https://admin:pass@phish.com`) are **strictly rejected**. Phishing actors frequently employ userinfo syntax to deceive victims into misidentifying the destination host.
3. **Hostname Normalization:** Hostnames are converted to lowercase. Trailing domain root dots (e.g. `domain.com.`) are stripped.
4. **Default Port Stripping:** Default ports (`:80` for HTTP, `:443` for HTTPS) are removed. Non-standard ports (`:8080`, `:8443`) are retained.
5. **Path Canonicalization:**
   - Empty paths default to `/`.
   - Redundant consecutive slashes are collapsed (e.g. `///login///` $\to$ `/login`).
   - Trailing slashes on non-root paths are stripped (e.g. `/login/` $\to$ `/login`).
6. **Query Parameter Sorting:** Query parameters are parsed, sorted alphabetically by parameter key, and re-encoded (e.g. `?b=2&a=1` $\to$ `?a=1&b=2`).
7. **Fragment Retention:** Single Page Application (SPA) routing fragments (`#`) are retained, as Web3 phishing kits frequently isolate credential harvesting routes behind hash routes (`#/connect-wallet`).
8. **Cryptographic SHA-256 Digest:** The canonical string is passed to `crypto.subtle.digest('SHA-256', ...)`. The 32-byte digest is formatted as a `0x`-prefixed 64-character lowercase hex string (`bytes32`). **The hex string is never hashed a second time.**

---

## 6. Project Directory Structure

```
scamshield/
├── contracts/
│   └── ScamShield.sol           # Core Solidity smart contract
├── scripts/
│   └── deploy.ts                # Deployment script generating frontend config
├── test/
│   └── ScamShield.test.ts       # 17 Hardhat automated smart contract tests
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── CategoryBadge.tsx        # Threat category badge with cyber styles
│   │   │   ├── Navbar.tsx               # Navigation bar with wallet/network badge
│   │   │   ├── ReportDetailsModal.tsx   # Detailed on-chain indicator modal
│   │   │   └── StatCard.tsx             # Cyber metric card component
│   │   ├── contracts/
│   │   │   ├── contractConfig.json      # Auto-generated deployment address & ABI
│   │   │   └── contractConfig.ts        # Typed network configs & explorer helpers
│   │   ├── hooks/
│   │   │   ├── useMetaMask.ts           # MetaMask connection & network switching
│   │   │   └── useScamShield.ts         # Contract read/write methods & stats
│   │   ├── lib/
│   │   │   └── urlUtils.ts              # Normalization policy & Web Crypto SHA-256
│   │   ├── pages/
│   │   │   ├── About.tsx                # Threat model, architecture, MSc context
│   │   │   ├── CheckURL.tsx             # 4-state indicator verification page
│   │   │   ├── Dashboard.tsx            # Live on-chain statistics & latest reports
│   │   │   ├── MyReports.tsx            # Connected wallet indicator portfolio
│   │   │   ├── ReportURL.tsx            # Indicator submission pipeline with pre-check
│   │   │   └── ThreatReports.tsx        # Paginated on-chain threat registry
│   │   ├── test/
│   │   │   ├── setup.ts                 # Vitest crypto environment setup
│   │   │   ├── urlUtils.test.ts         # 21 URL normalization & hash unit tests
│   │   │   └── components.test.tsx      # 5 React component unit tests
│   │   ├── App.tsx                      # Root application container & router
│   │   ├── index.css                    # Tailwind CSS & cyber styling
│   │   └── main.tsx                     # React DOM entry point
│   ├── index.html                       # HTML template with cyber fonts & favicon
│   ├── package.json                     # Frontend dependencies & scripts
│   ├── tailwind.config.js               # Dark navy & cyan/teal theme config
│   ├── tsconfig.json                    # TypeScript compiler configuration
│   └── vite.config.ts                   # Vite bundler & Vitest test runner setup
├── screenshots/
│   └── README.md                        # Verification guide for live screenshots
├── deployments/                         # Deployment artifact records per network
├── hardhat.config.ts                    # Hardhat compiler & network configurations
├── package.json                         # Root project dependencies & scripts
├── tsconfig.json                        # Root TypeScript configuration
├── .env.example                         # Environment template for Sepolia RPC/keys
├── .gitignore                           # Git exclusion rules for secrets and builds
└── README.md                            # Comprehensive project documentation
```

---

## 7. Installation & Quickstart

### Prerequisites
- [Node.js](https://nodejs.org/) (v18, v20, or v24 LTS recommended)
- [MetaMask](https://metamask.io/) browser extension installed

### 1. Clone & Install Dependencies

```bash
# Clone the repository
git clone https://github.com/your-username/scamshield.git
cd scamshield

# Install root contract dependencies
npm install

# Install frontend dependencies
npm --prefix frontend install
```

---

## 8. Automated Testing

### Smart Contract Test Suite (Hardhat)
Executes 17 comprehensive unit tests covering deployment, duplicate handling, category boundaries, zero-hash rejection, reporter tracking, immutability, index lookups, and pagination:

```bash
npm run test
```

Expected Output:
```
  ScamShield Smart Contract
    Deployment
      √ should deploy with initial state of zero reports
      √ should define constant category bounds from 1 to 5
    reportURL() - First-Time Report Registration
      √ should successfully register a new URL fingerprint and emit URLReported event
      √ should reject report with zero bytes32 hash
      √ should reject report with category 0 (below minimum bound)
      √ should reject report with category 6 (above maximum bound)
      √ should accept all valid category numbers 1 through 5
    reportURL() - Duplicate and Repeat Report Handling
      √ should increment reportCount and emit RepeatReport event upon duplicate submission
      √ should handle multiple repeat reports consecutively without modifying primary record integrity
    checkURL() and getReport()
      √ should return false for an unknown fingerprint
      √ should return true for a reported fingerprint
      √ should revert with ReportNotFound when getReport() is called on non-existent fingerprint
    History and Index Lookups: getURLByIndex()
      √ should accurately return URL fingerprint and report record by index in insertion order
      √ should revert with IndexOutOfBounds when querying invalid or out-of-range index
    Reporter Statistics: getMyReportCount() & getMyReportByIndex()
      √ should track the count of unique reports submitted by a specific address
      √ should allow querying reporter's submitted fingerprints by index
    Pagination Helper: getBatchReports()
      √ should return correct batch of records within offset and limit

  17 passing (866ms)
```

### Frontend Unit & Component Test Suite (Vitest)
Executes 26 unit tests verifying the RFC 3986 normalization engine, security credential rejection, Web Crypto SHA-256 digest generation, and React component rendering:

```bash
npm run frontend:test
```

Expected Output:
```
 ✓ src/test/urlUtils.test.ts  (21 tests)
 ✓ src/test/components.test.tsx  (5 tests)

 Test Files  2 passed (2)
      Tests  26 passed (26)
```

### Run All Tests Simultaneously
```bash
npm run test:all
```

---

## 9. Local Deployment & Execution

You can test ScamShield locally with a simulated Hardhat node and MetaMask.

### Step 1: Start Local Hardhat Node
```bash
npx hardhat node
```
This spawns an EVM JSON-RPC server at `http://127.0.0.1:8545` with 20 funded test accounts.

### Step 2: Deploy Contract to Local Node
In a new terminal:
```bash
npm run deploy:local
```
The script compiles the contract, deploys `ScamShield.sol`, logs the deployment details, and updates `frontend/src/contracts/contractConfig.json`.

### Step 3: Start the Frontend Application
```bash
npm run frontend:dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Step 4: Configure MetaMask for Localhost
1. Open MetaMask $\to$ Networks $\to$ Add Network Manually:
   - **Network Name:** Hardhat Localhost
   - **New RPC URL:** `http://127.0.0.1:8545`
   - **Chain ID:** `31337`
   - **Currency Symbol:** `ETH`
2. Import one of Hardhat's private keys (printed in terminal 1) into MetaMask to receive 10,000 local test ETH.

---

## 10. Ethereum Sepolia Testnet Deployment

To deploy to public Ethereum Sepolia Testnet (Chain ID `11155111`):

### Step 1: Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Populate `.env` with your deployment credentials:
```env
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID
DEPLOYER_PRIVATE_KEY=0xYOUR_TESTNET_PRIVATE_KEY_HERE
ETHERSCAN_API_KEY=YOUR_ETHERSCAN_API_KEY
```
> **Security Notice:** Use a dedicated development wallet containing **only Sepolia testnet ETH** (obtainable from [Google Cloud Web3 Faucet](https://cloud.google.com/application/web3/faucet/ethereum/sepolia) or [Sepolia PoW Faucet](https://sepolia-faucet.pk910.de/)). Never commit `.env` or expose private keys with mainnet assets.

### Step 2: Execute Sepolia Deployment Script
```bash
npm run deploy:sepolia
```

Deployment Script Execution Log:
```
==================================================
       ScamShield Smart Contract Deployment       
==================================================
Network Name : sepolia
Chain ID     : 11155111
Deployer     : 0x...
Balance      : 0.52 ETH

Deploying ScamShield contract...

 Contract deployed successfully!
Deployed Address : 0x...
Transaction Hash : 0x...
Saved deployment info to: deployments/sepolia.json
Updated frontend config at: frontend/src/contracts/contractConfig.json
==================================================
```

### Step 3: Build & Host Frontend
```bash
npm run frontend:build
```
The optimized production bundle is generated in `frontend/dist/`.

---

## 11. Security Considerations & Threat Modeling

In accordance with MSc Cyber Security research standards, the following threat models and architectural defenses are implemented:

| Threat / Attack Vector | Risk Level | ScamShield Mitigation & Defense |
| :--- | :---: | :--- |
| **Userinfo Hostname Spoofing** (`user:pass@evil.com`) | High | **Strict Rejection:** `normalizeURL` immediately throws an exception if `url.username` or `url.password` is detected. |
| **Drive-by Execution / Iframe Phishing** | Critical | **Zero Navigation Policy:** ScamShield client code never issues HTTP fetch requests, opens links, or renders reported URLs in iframes. |
| **PII & Credential Leakage** | High | **Zero Plaintext Storage:** URLs, queries, and personal data are never placed on-chain. Only one-way SHA-256 hashes are recorded. |
| **Malicious Indicator Deletion** | Critical | **Zero Administrator Role:** The smart contract contains no `onlyOwner`, `destroy()`, or `deleteReport()` functions. Records are immutable. |
| **History Rewriting / Attribution Theft** | Medium | **Immutability of Origin:** When a duplicate report is received, `reportCount` increments, but original `reporter` and `reportedAt` are untouched. |
| **Sybil Attack / Report Count Inflation** | Medium | **Gas Cost Deterrent:** Each report submission requires an EVM transaction fee. In production, this can be combined with staking bonds. |
| **Pre-Image / Rainbow Table Attacks** | Low | SHA-256 has 256-bit pre-image resistance. However, investigators should know that predictable top-1000 domain names can be rainbow-checked. |

---

## 12. Academic Limitations & Future Enhancements

### Limitations
1. **Community Data Caveat:** A registered indicator is a crowd-sourced report and does not constitute formal judicial attribution or guarantee that a URL is 100% malicious.
2. **Zero-Day Latency:** Attackers can deploy fresh phishing infrastructure moments before a phishing email campaign. Absence of an on-chain record does **not** signify safety.
3. **Sybil Resistance:** While repeat reports increment the counter, users with sufficient testnet funds can submit multiple repeat reports.

### Future Enhancements
- **Stake-Weighted Reputation (Proof-of-Stake Reporting):** Require reporters to stake utility tokens or ERC-20 bonds. Frivolous or malicious reports would be slashed if arbitrated as false positives.
- **Decentralized Oracles (Chainlink CRE):** Integrate decentralized oracles to query WHOIS domain registration age and SSL certificate transparency logs.
- **EIP-712 Gasless Meta-Transactions:** Implement permit signatures to allow users to sign threat submissions without holding native gas tokens.
- **Zero-Knowledge Range Proofs:** Prove that a reported URL belongs to a specific targeted brand without disclosing the exact target URL until verified.

---

## 13. License

Distributed under the **MIT License**. See `LICENSE` for more information.

Developed for **MSc Cyber Security Blockchain Module**.

