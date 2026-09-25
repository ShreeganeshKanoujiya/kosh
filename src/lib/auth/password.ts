import "server-only";
import { hash, parseOptions, verify } from "@node-rs/argon2";

// OWASP-recommended Argon2id parameters (m=19 MiB, t=2, p=1). The library defaults to Argon2id.
const ARGON2_OPTIONS = { memoryCost: 19_456, timeCost: 2, parallelism: 1 } as const;

// Hash of a random throwaway password, verified when a user doesn't exist so the
// response time does not reveal whether a username is registered.
let dummyHash: Promise<string> | undefined;
function getDummyHash() {
  dummyHash ??= hash(`dummy-${Math.random()}-${Date.now()}`, ARGON2_OPTIONS);
  return dummyHash;
}

export function hashPassword(password: string): Promise<string> {
  return hash(password, ARGON2_OPTIONS);
}

/** Constant-work verification. Pass `null` when the user was not found. */
export async function verifyPassword(passwordHash: string | null, password: string): Promise<boolean> {
  try {
    return await verify(passwordHash ?? (await getDummyHash()), password);
  } catch {
    return false;
  }
}

/** True when a stored hash was created with weaker parameters than the current policy. */
export function needsRehash(passwordHash: string): boolean {
  try {
    const opts = parseOptions(passwordHash);
    return (
      opts.memoryCost < ARGON2_OPTIONS.memoryCost ||
      opts.timeCost < ARGON2_OPTIONS.timeCost ||
      opts.algorithm !== 2 // Argon2id
    );
  } catch {
    return true;
  }
}
