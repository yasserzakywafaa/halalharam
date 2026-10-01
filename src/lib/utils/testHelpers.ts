import assert from 'node:assert/strict'
import seedJson from '../server/data/seed-rulings.json' with { type: 'json' }
import type { CodedError, SeedFile, VerdictErrorPayload, VerdictResponse, VerdictResult } from '../application/shared/types.ts'

/** Typed view of the curated seed for tests. */
export const seedFile = seedJson as unknown as SeedFile

/** Narrow `T | null | undefined` to `T`, failing the test otherwise. */
export function must<T>(value: T | null | undefined, label = 'value'): T {
  assert.ok(value != null, `${label} should be present`)
  return value
}

/** Narrow a verdict lookup to the success shape, failing the test on an error payload. */
export function expectVerdict(result: VerdictResult): VerdictResponse {
  assert.equal((result as VerdictErrorPayload).error, undefined, 'expected a verdict, got an error payload')
  return result as VerdictResponse
}

/** Narrow a verdict lookup to the error shape. */
export function expectVerdictError(result: VerdictResult): VerdictErrorPayload {
  assert.equal(typeof (result as VerdictErrorPayload).error, 'string', 'expected an error payload')
  return result as VerdictErrorPayload
}

/** `assert.rejects` hands validators `unknown`; tests read our coded fields. */
export function asCoded(error: unknown): CodedError {
  return error as CodedError
}
