import { vi } from 'vitest';

// Provide jest compatibility alias for legacy tests written with jest.fn()
if (typeof globalThis.jest === 'undefined') {
  (globalThis as any).jest = vi;
}
