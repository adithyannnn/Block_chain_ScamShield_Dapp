import { expect } from "chai";
import { ethers } from "hardhat";
import { ScamShield } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("ScamShield Smart Contract", function () {
  let scamShield: ScamShield;
  let owner: HardhatEthersSigner;
  let reporter1: HardhatEthersSigner;
  let reporter2: HardhatEthersSigner;
  let nonReporter: HardhatEthersSigner;

  // Sample SHA-256 test hashes (bytes32 format)
  // sha256("https://evil-phishing-bank.com/login") = 0x8a9cf296bb731be7a13d39572b22ec68676be93dfa929fae8b090bc1b918dbec
  const HASH_PHISHING_1 = "0x8a9cf296bb731be7a13d39572b22ec68676be93dfa929fae8b090bc1b918dbec";
  // sha256("https://crypto-doubler-scam.xyz/claim") = 0x2424fa775d7cf14fa734b07fb8d3c52a2305a415a75fa76ab39d5e38148e02d6
  const HASH_SCAM_2 = "0x2424fa775d7cf14fa734b07fb8d3c52a2305a415a75fa76ab39d5e38148e02d6";
  // sha256("https://malware-drop.top/payload.exe") = 0x93798cf0f439369d2d0cbbfe24976451e04cf4c9aa4d41fa3c9cb5a420455018
  const HASH_MALWARE_3 = "0x93798cf0f439369d2d0cbbfe24976451e04cf4c9aa4d41fa3c9cb5a420455018";
  const ZERO_HASH = ethers.ZeroHash;

  beforeEach(async function () {
    [owner, reporter1, reporter2, nonReporter] = await ethers.getSigners();
    const ScamShieldFactory = await ethers.getContractFactory("ScamShield");
    scamShield = await ScamShieldFactory.deploy();
    await scamShield.waitForDeployment();
  });

  describe("Deployment", function () {
    it("should deploy with initial state of zero reports", async function () {
      expect(await scamShield.getTotalUniqueURLs()).to.equal(0);
      expect(await scamShield.getTotalSubmissions()).to.equal(0);
    });

    it("should define constant category bounds from 1 to 5", async function () {
      expect(await scamShield.MIN_CATEGORY()).to.equal(1);
      expect(await scamShield.MAX_CATEGORY()).to.equal(5);
    });
  });

  describe("reportURL() - First-Time Report Registration", function () {
    it("should successfully register a new URL fingerprint and emit URLReported event", async function () {
      const category = 1; // Phishing
      const tx = await scamShield.connect(reporter1).reportURL(HASH_PHISHING_1, category);

      await expect(tx)
        .to.emit(scamShield, "URLReported")
        .withArgs(HASH_PHISHING_1, reporter1.address, category, (await ethers.provider.getBlock("latest"))?.timestamp);

      expect(await scamShield.getTotalUniqueURLs()).to.equal(1);
      expect(await scamShield.getTotalSubmissions()).to.equal(1);
      expect(await scamShield.checkURL(HASH_PHISHING_1)).to.be.true;

      const report = await scamShield.getReport(HASH_PHISHING_1);
      expect(report.urlHash).to.equal(HASH_PHISHING_1);
      expect(report.reporter).to.equal(reporter1.address);
      expect(report.category).to.equal(category);
      expect(report.reportCount).to.equal(1);
      expect(report.exists).to.be.true;
    });

    it("should reject report with zero bytes32 hash", async function () {
      await expect(scamShield.connect(reporter1).reportURL(ZERO_HASH, 1)).to.be.revertedWithCustomError(
        scamShield,
        "ZeroHashNotAllowed"
      );
    });

    it("should reject report with category 0 (below minimum bound)", async function () {
      await expect(scamShield.connect(reporter1).reportURL(HASH_PHISHING_1, 0)).to.be.revertedWithCustomError(
        scamShield,
        "InvalidCategory"
      ).withArgs(0);
    });

    it("should reject report with category 6 (above maximum bound)", async function () {
      await expect(scamShield.connect(reporter1).reportURL(HASH_PHISHING_1, 6)).to.be.revertedWithCustomError(
        scamShield,
        "InvalidCategory"
      ).withArgs(6);
    });

    it("should accept all valid category numbers 1 through 5", async function () {
      for (let cat = 1; cat <= 5; cat++) {
        // create distinct hash for each category
        const hash = ethers.keccak256(ethers.toUtf8Bytes(`test-category-${cat}`));
        await expect(scamShield.connect(reporter1).reportURL(hash, cat)).to.not.be.reverted;
        const record = await scamShield.getReport(hash);
        expect(record.category).to.equal(cat);
      }
      expect(await scamShield.getTotalUniqueURLs()).to.equal(5);
    });
  });

  describe("reportURL() - Duplicate and Repeat Report Handling", function () {
    it("should increment reportCount and emit RepeatReport event upon duplicate submission", async function () {
      // First submission by reporter1
      await scamShield.connect(reporter1).reportURL(HASH_PHISHING_1, 1);

      const firstReport = await scamShield.getReport(HASH_PHISHING_1);
      const originalTimestamp = firstReport.reportedAt;
      const originalReporter = firstReport.reporter;

      // Second submission by reporter2
      const repeatTx = await scamShield.connect(reporter2).reportURL(HASH_PHISHING_1, 3);

      await expect(repeatTx)
        .to.emit(scamShield, "RepeatReport")
        .withArgs(
          HASH_PHISHING_1,
          reporter2.address,
          3,
          2, // new count
          (await ethers.provider.getBlock("latest"))?.timestamp
        );

      const updatedReport = await scamShield.getReport(HASH_PHISHING_1);

      // Verify reportCount incremented to 2
      expect(updatedReport.reportCount).to.equal(2);

      // Verify original reporter and original timestamp were NOT overwritten
      expect(updatedReport.reporter).to.equal(originalReporter);
      expect(updatedReport.reportedAt).to.equal(originalTimestamp);

      // Total unique URL count should still be 1, but totalSubmissions should be 2
      expect(await scamShield.getTotalUniqueURLs()).to.equal(1);
      expect(await scamShield.getTotalSubmissions()).to.equal(2);
    });

    it("should handle multiple repeat reports consecutively without modifying primary record integrity", async function () {
      await scamShield.connect(reporter1).reportURL(HASH_PHISHING_1, 1);

      for (let i = 2; i <= 5; i++) {
        await scamShield.connect(reporter2).reportURL(HASH_PHISHING_1, 2);
        const report = await scamShield.getReport(HASH_PHISHING_1);
        expect(report.reportCount).to.equal(i);
        expect(report.reporter).to.equal(reporter1.address);
      }

      expect(await scamShield.getTotalUniqueURLs()).to.equal(1);
      expect(await scamShield.getTotalSubmissions()).to.equal(5);
    });
  });

  describe("checkURL() and getReport()", function () {
    it("should return false for an unknown fingerprint", async function () {
      expect(await scamShield.checkURL(HASH_SCAM_2)).to.be.false;
    });

    it("should return true for a reported fingerprint", async function () {
      await scamShield.connect(reporter1).reportURL(HASH_SCAM_2, 3);
      expect(await scamShield.checkURL(HASH_SCAM_2)).to.be.true;
    });

    it("should revert with ReportNotFound when getReport() is called on non-existent fingerprint", async function () {
      await expect(scamShield.getReport(HASH_SCAM_2)).to.be.revertedWithCustomError(
        scamShield,
        "ReportNotFound"
      ).withArgs(HASH_SCAM_2);
    });
  });

  describe("History and Index Lookups: getURLByIndex()", function () {
    it("should accurately return URL fingerprint and report record by index in insertion order", async function () {
      await scamShield.connect(reporter1).reportURL(HASH_PHISHING_1, 1);
      await scamShield.connect(reporter2).reportURL(HASH_SCAM_2, 3);
      await scamShield.connect(reporter1).reportURL(HASH_MALWARE_3, 2);

      expect(await scamShield.getTotalUniqueURLs()).to.equal(3);

      const [hash0, report0] = await scamShield.getURLByIndex(0);
      expect(hash0).to.equal(HASH_PHISHING_1);
      expect(report0.reporter).to.equal(reporter1.address);
      expect(report0.category).to.equal(1);

      const [hash1, report1] = await scamShield.getURLByIndex(1);
      expect(hash1).to.equal(HASH_SCAM_2);
      expect(report1.reporter).to.equal(reporter2.address);
      expect(report1.category).to.equal(3);

      const [hash2, report2] = await scamShield.getURLByIndex(2);
      expect(hash2).to.equal(HASH_MALWARE_3);
      expect(report2.reporter).to.equal(reporter1.address);
      expect(report2.category).to.equal(2);
    });

    it("should revert with IndexOutOfBounds when querying invalid or out-of-range index", async function () {
      await scamShield.connect(reporter1).reportURL(HASH_PHISHING_1, 1);

      await expect(scamShield.getURLByIndex(1)).to.be.revertedWithCustomError(
        scamShield,
        "IndexOutOfBounds"
      ).withArgs(1, 1);

      await expect(scamShield.getURLByIndex(999)).to.be.revertedWithCustomError(
        scamShield,
        "IndexOutOfBounds"
      ).withArgs(999, 1);
    });
  });

  describe("Reporter Statistics: getMyReportCount() & getMyReportByIndex()", function () {
    it("should track the count of unique reports submitted by a specific address", async function () {
      expect(await scamShield.getMyReportCount(reporter1.address)).to.equal(0);
      expect(await scamShield.getMyReportCount(reporter2.address)).to.equal(0);

      await scamShield.connect(reporter1).reportURL(HASH_PHISHING_1, 1);
      await scamShield.connect(reporter1).reportURL(HASH_SCAM_2, 3);

      expect(await scamShield.getMyReportCount(reporter1.address)).to.equal(2);
      expect(await scamShield.getMyReportCount(reporter2.address)).to.equal(0);

      // Repeat report by reporter2 does NOT increase reporter2's unique reported URL list
      await scamShield.connect(reporter2).reportURL(HASH_PHISHING_1, 1);
      expect(await scamShield.getMyReportCount(reporter2.address)).to.equal(0);

      // New report by reporter2
      await scamShield.connect(reporter2).reportURL(HASH_MALWARE_3, 2);
      expect(await scamShield.getMyReportCount(reporter2.address)).to.equal(1);
    });

    it("should allow querying reporter's submitted fingerprints by index", async function () {
      await scamShield.connect(reporter1).reportURL(HASH_PHISHING_1, 1);
      await scamShield.connect(reporter1).reportURL(HASH_SCAM_2, 3);

      const [hash0, rep0] = await scamShield.getMyReportByIndex(reporter1.address, 0);
      expect(hash0).to.equal(HASH_PHISHING_1);
      expect(rep0.category).to.equal(1);

      const [hash1, rep1] = await scamShield.getMyReportByIndex(reporter1.address, 1);
      expect(hash1).to.equal(HASH_SCAM_2);
      expect(rep1.category).to.equal(3);

      await expect(
        scamShield.getMyReportByIndex(reporter1.address, 2)
      ).to.be.revertedWithCustomError(scamShield, "IndexOutOfBounds");
    });
  });

  describe("Pagination Helper: getBatchReports()", function () {
    it("should return correct batch of records within offset and limit", async function () {
      await scamShield.connect(reporter1).reportURL(HASH_PHISHING_1, 1);
      await scamShield.connect(reporter2).reportURL(HASH_SCAM_2, 3);
      await scamShield.connect(reporter1).reportURL(HASH_MALWARE_3, 2);

      const [batch, total] = await scamShield.getBatchReports(0, 2);
      expect(total).to.equal(3);
      expect(batch.length).to.equal(2);
      expect(batch[0].urlHash).to.equal(HASH_PHISHING_1);
      expect(batch[1].urlHash).to.equal(HASH_SCAM_2);

      const [batch2, total2] = await scamShield.getBatchReports(2, 5);
      expect(total2).to.equal(3);
      expect(batch2.length).to.equal(1);
      expect(batch2[0].urlHash).to.equal(HASH_MALWARE_3);

      const [emptyBatch] = await scamShield.getBatchReports(10, 5);
      expect(emptyBatch.length).to.equal(0);
    });
  });
});
