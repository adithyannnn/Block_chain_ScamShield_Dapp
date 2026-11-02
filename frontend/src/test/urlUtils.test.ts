import { describe, it, expect } from 'vitest';
import {
  normalizeURL,
  computeSHA256Bytes32,
  processURLFingerprint,
  formatAddress,
  formatHash,
  formatTimestamp,
  THREAT_CATEGORIES,
} from '../lib/urlUtils';

describe('ScamShield URL Normalization Engine', () => {
  it('should normalize scheme and hostname to lowercase', () => {
    const raw = 'HTTPS://PhIsH-BaNk.ExAmPlE.CoM/LoGiN';
    const normalized = normalizeURL(raw);
    expect(normalized).toBe('https://phish-bank.example.com/LoGiN');
  });

  it('should strip trailing dot from hostname', () => {
    const raw = 'https://phishing-site.org./portal';
    const normalized = normalizeURL(raw);
    expect(normalized).toBe('https://phishing-site.org/portal');
  });

  it('should remove default port 80 for HTTP', () => {
    const raw = 'http://insecure-phish.net:80/verify';
    const normalized = normalizeURL(raw);
    expect(normalized).toBe('http://insecure-phish.net/verify');
  });

  it('should remove default port 443 for HTTPS', () => {
    const raw = 'https://fake-wallet-connect.io:443/session';
    const normalized = normalizeURL(raw);
    expect(normalized).toBe('https://fake-wallet-connect.io/session');
  });

  it('should preserve non-default ports', () => {
    const raw = 'https://stealth-phish.biz:8443/auth';
    const normalized = normalizeURL(raw);
    expect(normalized).toBe('https://stealth-phish.biz:8443/auth');
  });

  it('should normalize empty path to root slash "/"', () => {
    const raw = 'https://phishing-domain.com';
    const normalized = normalizeURL(raw);
    expect(normalized).toBe('https://phishing-domain.com/');
  });

  it('should collapse multiple duplicate slashes in pathname', () => {
    const raw = 'https://target-portal.com///account///security';
    const normalized = normalizeURL(raw);
    expect(normalized).toBe('https://target-portal.com/account/security');
  });

  it('should strip trailing slash from non-root paths', () => {
    const withSlash = 'https://target-portal.com/account/login/';
    const withoutSlash = 'https://target-portal.com/account/login';
    expect(normalizeURL(withSlash)).toBe('https://target-portal.com/account/login');
    expect(normalizeURL(withoutSlash)).toBe('https://target-portal.com/account/login');
  });

  it('should canonicalize and alphabetically sort query parameters', () => {
    const url1 = 'https://drainer.xyz/claim?token=ETH&ref=123&action=permit';
    const url2 = 'https://drainer.xyz/claim?action=permit&token=ETH&ref=123';
    const normalized1 = normalizeURL(url1);
    const normalized2 = normalizeURL(url2);

    expect(normalized1).toBe('https://drainer.xyz/claim?action=permit&ref=123&token=ETH');
    expect(normalized2).toBe('https://drainer.xyz/claim?action=permit&ref=123&token=ETH');
    expect(normalized1).toBe(normalized2);
  });

  it('should preserve SPA routing fragments (#)', () => {
    const raw = 'https://web3-drainer.app/app/#/connect-metamask';
    const normalized = normalizeURL(raw);
    expect(normalized).toBe('https://web3-drainer.app/app#/connect-metamask');
  });

  describe('Security Rejection Rules', () => {
    it('should reject URLs with embedded user credentials (userinfo attack)', () => {
      expect(() => normalizeURL('https://victim:secret@attacker-domain.com/login')).toThrow(
        /Security violation: URLs with embedded credentials/
      );
      expect(() => normalizeURL('https://admin@target-spoof.com')).toThrow(
        /Security violation: URLs with embedded credentials/
      );
    });

    it('should reject non-HTTP(S) schemes such as ftp, javascript, data, or file', () => {
      expect(() => normalizeURL('ftp://fileserver.com/trojan.exe')).toThrow(/Unsupported protocol/);
      expect(() => normalizeURL('javascript:alert(1)')).toThrow(/Unsupported protocol/);
      expect(() => normalizeURL('data:text/html,malicious')).toThrow(/Unsupported protocol/);
    });

    it('should reject malformed or blank inputs', () => {
      expect(() => normalizeURL('')).toThrow(/URL cannot be blank/);
      expect(() => normalizeURL('   ')).toThrow(/URL cannot be blank/);
      expect(() => normalizeURL('not a valid url')).toThrow();
    });
  });
});

describe('Web Crypto SHA-256 Fingerprinting Engine', () => {
  it('should generate a valid bytes32 hex string (0x-prefixed, 64 hex characters)', async () => {
    const sample = 'https://phishing-portal.com/login';
    const hash = await computeSHA256Bytes32(sample);

    expect(hash).toMatch(/^0x[a-f0-9]{64}$/);
    expect(hash.length).toBe(66);
  });

  it('should produce identical fingerprints for URLs that normalize to the same string', async () => {
    const urlA = 'HTTPS://Phishing-Portal.Com:443/login/?b=2&a=1';
    const urlB = 'https://phishing-portal.com/login?a=1&b=2';

    const normA = normalizeURL(urlA);
    const normB = normalizeURL(urlB);
    expect(normA).toBe(normB);

    const hashA = await computeSHA256Bytes32(normA);
    const hashB = await computeSHA256Bytes32(normB);
    expect(hashA).toBe(hashB);
  });

  it('should correctly process URL fingerprint in one pipeline via processURLFingerprint()', async () => {
    const res = await processURLFingerprint('https://malicious-airdrop.xyz/claim/');
    expect(res.isValid).toBe(true);
    expect(res.normalizedUrl).toBe('https://malicious-airdrop.xyz/claim');
    expect(res.hash).toMatch(/^0x[a-f0-9]{64}$/);
    expect(res.error).toBeUndefined();
  });

  it('should return error for invalid inputs in processURLFingerprint() without throwing', async () => {
    const res = await processURLFingerprint('ftp://invalid-protocol.com');
    expect(res.isValid).toBe(false);
    expect(res.error).toContain('Unsupported protocol');
    expect(res.hash).toBeUndefined();
  });
});

describe('Formatting Helpers and Category Constants', () => {
  it('should format Ethereum addresses correctly', () => {
    const addr = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';
    expect(formatAddress(addr)).toBe('0x7099...79C8');
    expect(formatAddress('')).toBe('');
  });

  it('should format bytes32 hashes correctly', () => {
    const hash = '0x8a9cf296bb731be7a13d39572b22ec68676be93dfa929fae8b090bc1b918dbec';
    expect(formatHash(hash)).toBe('0x8a9cf296...b918dbec');
  });

  it('should format Unix timestamps into readable date strings', () => {
    const ts = 1700000000;
    const formatted = formatTimestamp(ts);
    expect(typeof formatted).toBe('string');
    expect(formatted.length).toBeGreaterThan(5);
  });

  it('should define all 5 threat categories with valid IDs', () => {
    expect(Object.keys(THREAT_CATEGORIES).length).toBe(5);
    expect(THREAT_CATEGORIES[1].name).toBe('Phishing');
    expect(THREAT_CATEGORIES[2].name).toBe('Malware / Drive-by');
    expect(THREAT_CATEGORIES[3].name).toBe('Scam / Drainer');
    expect(THREAT_CATEGORIES[4].name).toBe('Credential Harvester');
    expect(THREAT_CATEGORIES[5].name).toBe('Brand Impersonation');
  });
});
