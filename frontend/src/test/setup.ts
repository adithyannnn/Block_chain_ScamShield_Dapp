import '@testing-library/jest-dom';
import { webcrypto } from 'node:crypto';

// Ensure Web Crypto API is available in test environment
if (!globalThis.crypto || !globalThis.crypto.subtle) {
  // @ts-ignore
  globalThis.crypto = webcrypto;
}
