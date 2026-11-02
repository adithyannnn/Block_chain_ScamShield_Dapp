/**
 * ScamShield URL Normalization and Cryptographic Fingerprinting Engine
 * 
 * MSc Cyber Security Blockchain Threat Intelligence Protocol:
 * 
 * Threat Model & Normalization Policy:
 * 1. Protocol Schemes:
 *    Only 'http:' and 'https:' are accepted. Non-web schemes (e.g., javascript:, data:, ftp:, file:)
 *    are rejected to prevent XSS payloads and non-applicable reports.
 * 
 * 2. Embedded Authentication (Credentials):
 *    URLs containing userinfo (username or password, e.g., 'https://admin:secret@domain.com')
 *    are strictly REJECTED. Phishing adversaries frequently use userinfo to deceive victims
 *    into misreading the destination domain.
 * 
 * 3. Hostname Normalization:
 *    Hostnames are converted to lowercase. Trailing domain dots (e.g., 'example.com.') are stripped.
 * 
 * 4. Default Port Stripping:
 *    Default ports (80 for HTTP, 443 for HTTPS) are removed as redundant. Non-standard ports
 *    (e.g., 8080, 8443, 3000) are preserved because malicious services frequently operate
 *    on alternate ports.
 * 
 * 5. Pathname Canonicalization:
 *    - An empty path is normalized to root '/'.
 *    - Duplicate slashes are collapsed (e.g., '//path' -> '/path').
 *    - Trailing slashes on non-root paths are stripped (e.g., '/login/' -> '/login') so that
 *      minor client-side discrepancies result in the same deterministic on-chain hash.
 * 
 * 6. Query Parameter Canonicalization:
 *    Query parameters are parsed, sorted alphabetically by parameter key, and reassembled.
 *    This ensures that 'https://site.com?b=2&a=1' produces the exact same fingerprint as
 *    'https://site.com?a=1&b=2'.
 * 
 * 7. Fragment Handling:
 *    URL fragments (#) are preserved. In modern Single Page Applications (SPAs) and Web3 phishing
 *    dapps, routing and credential targeting often rely on the fragment (e.g., '#/connect-wallet').
 * 
 * 8. Cryptographic Fingerprint (SHA-256):
 *    The normalized UTF-8 string is digested once using SHA-256 via the Web Crypto API.
 *    The resulting 32-byte digest is represented as a '0x'-prefixed 64-character lowercase hex string.
 *    IMPORTANT: The hex representation must NEVER be hashed a second time.
 * 
 * Caveat:
 * Different threat intelligence platforms may apply different normalization policies.
 * Consuming applications must apply identical normalization rules to match on-chain fingerprints.
 */

export interface URLValidationResult {
  isValid: boolean;
  error?: string;
  normalizedUrl?: string;
  hash?: string;
}

export interface ThreatCategory {
  id: number;
  name: string;
  description: string;
  color: string;
  badgeBg: string;
}

export const THREAT_CATEGORIES: Record<number, ThreatCategory> = {
  1: {
    id: 1,
    name: 'Phishing',
    description: 'Fake login portals, deceptive banking or Web3 wallet mimics designed to steal credentials.',
    color: 'text-rose-400',
    badgeBg: 'bg-rose-500/10 border-rose-500/30 text-rose-300',
  },
  2: {
    id: 2,
    name: 'Malware / Drive-by',
    description: 'Hosts delivering ransomware, spyware, trojans, or exploit kits.',
    color: 'text-purple-400',
    badgeBg: 'bg-purple-500/10 border-purple-500/30 text-purple-300',
  },
  3: {
    id: 3,
    name: 'Scam / Drainer',
    description: 'Crypto doubler scams, Ponzi schemes, fake airdrops, and ERC20 permit drainers.',
    color: 'text-amber-400',
    badgeBg: 'bg-amber-500/10 border-amber-500/30 text-amber-300',
  },
  4: {
    id: 4,
    name: 'Credential Harvester',
    description: 'Deceptive forms and phishing kits harvesting 2FA tokens, seed phrases, or private keys.',
    color: 'text-orange-400',
    badgeBg: 'bg-orange-500/10 border-orange-500/30 text-orange-300',
  },
  5: {
    id: 5,
    name: 'Brand Impersonation',
    description: 'Typosquatting and punycode attacks visually mimicking legitimate organizations.',
    color: 'text-cyan-400',
    badgeBg: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300',
  },
};

/**
 * Validates and normalizes an input URL according to the ScamShield threat intelligence specification.
 * 
 * @param input Raw URL entered by the user
 * @returns Clean normalized URL string
 * @throws Error with a human-readable security explanation if validation fails
 */
export function normalizeURL(input: string): string {
  if (!input || typeof input !== 'string' || input.trim().length === 0) {
    throw new Error('URL cannot be blank.');
  }

  const trimmed = input.trim();

  // Pre-check for raw spaces or non-URL control characters
  if (/\s/.test(trimmed)) {
    throw new Error('URL cannot contain unencoded whitespace.');
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new Error('Malformed URL syntax. Ensure you include a valid protocol (e.g., https://).');
  }

  // 1. Strict Protocol Validation: Only HTTP and HTTPS
  const scheme = parsed.protocol.toLowerCase();
  if (scheme !== 'http:' && scheme !== 'https:') {
    throw new Error(`Unsupported protocol: "${parsed.protocol}". Only "http:" and "https:" URLs are permitted.`);
  }

  // 2. Reject Embedded Credentials (Userinfo)
  if (parsed.username || parsed.password) {
    throw new Error('Security violation: URLs with embedded credentials (username/password) are rejected.');
  }

  // 3. Hostname Normalization
  let hostname = parsed.hostname.toLowerCase();
  if (!hostname) {
    throw new Error('Invalid URL: Hostname is missing.');
  }
  // Strip trailing domain dot if present (e.g., "google.com." -> "google.com")
  if (hostname.endsWith('.')) {
    hostname = hostname.slice(0, -1);
  }

  // 4. Port Normalization: Strip default ports
  let port = parsed.port;
  if ((scheme === 'http:' && port === '80') || (scheme === 'https:' && port === '443')) {
    port = '';
  }

  const hostWithPort = port ? `${hostname}:${port}` : hostname;

  // 5. Pathname Normalization
  let pathname = parsed.pathname;
  if (!pathname || pathname === '') {
    pathname = '/';
  } else {
    // Collapse duplicate consecutive slashes: "/a///b" -> "/a/b"
    pathname = pathname.replace(/\/+/g, '/');
    // Strip trailing slash if pathname is not the root "/"
    if (pathname.length > 1 && pathname.endsWith('/')) {
      pathname = pathname.slice(0, -1);
    }
  }

  // 6. Query Parameter Canonicalization (Sort alphabetically by key)
  let search = '';
  const searchParams = Array.from(parsed.searchParams.entries());
  if (searchParams.length > 0) {
    searchParams.sort(([keyA, valA], [keyB, valB]) => {
      if (keyA === keyB) {
        return valA.localeCompare(valB);
      }
      return keyA.localeCompare(keyB);
    });

    const canonicalParams = new URLSearchParams();
    for (const [key, value] of searchParams) {
      canonicalParams.append(key, value);
    }
    search = `?${canonicalParams.toString()}`;
  }

  // 7. Fragment Handling: Preserve hash if present
  const hash = parsed.hash || '';

  // Reassemble canonical normalized URL
  return `${scheme}//${hostWithPort}${pathname}${search}${hash}`;
}

/**
 * Computes the SHA-256 cryptographic digest of a string using the Web Crypto API.
 * Converts the 32-byte digest into a standard EVM bytes32 hex string ("0x" + 64 hex characters).
 * 
 * @param text The normalized string to digest
 * @returns bytes32 formatted hexadecimal string
 */
export async function computeSHA256Bytes32(text: string): Promise<string> {
  const subtle = getSubtleCrypto();
  if (!subtle) {
    throw new Error('Web Crypto API is not available in this browser environment. Secure hashing requires HTTPS or localhost.');
  }

  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    return `0x${hex}`;
  } catch (err: any) {
    throw new Error(`Cryptographic hashing failed: ${err.message || 'Unknown error'}`);
  }
}

/**
 * Validates, normalizes, and computes the bytes32 SHA-256 fingerprint of a URL in one step.
 * 
 * @param input Raw URL input
 * @returns Validation result with normalized URL and computed hash
 */
export async function processURLFingerprint(input: string): Promise<URLValidationResult> {
  try {
    const normalized = normalizeURL(input);
    const hash = await computeSHA256Bytes32(normalized);
    return {
      isValid: true,
      normalizedUrl: normalized,
      hash,
    };
  } catch (err: any) {
    return {
      isValid: false,
      error: err.message || 'Invalid URL',
    };
  }
}

/**
 * Helper to obtain SubtleCrypto in modern browsers or Node test environments.
 */
function getSubtleCrypto(): SubtleCrypto | null {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    return window.crypto.subtle;
  }
  if (typeof globalThis !== 'undefined' && globalThis.crypto && globalThis.crypto.subtle) {
    return globalThis.crypto.subtle;
  }
  return null;
}

/**
 * Formats a long Ethereum address for clean visual display (e.g. 0x1234...abcd).
 */
export function formatAddress(address: string): string {
  if (!address || address.length < 10) return address || '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Formats a bytes32 hash for display (e.g. 0x8a9c...dbec).
 */
export function formatHash(hash: string): string {
  if (!hash || hash.length < 12) return hash || '';
  return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
}

/**
 * Formats a Unix timestamp into a readable date and time.
 */
export function formatTimestamp(timestampInSeconds: number | bigint): string {
  const ts = typeof timestampInSeconds === 'bigint' ? Number(timestampInSeconds) : timestampInSeconds;
  if (!ts || isNaN(ts)) return 'N/A';
  return new Date(ts * 1000).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}
