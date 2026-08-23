import { beforeEach, describe, expect, test } from "bun:test";
import { getAccessToken, getRefreshToken, saveSessionDuringInitialization } from "./auth-session";

const values = new Map<string, string>();

Object.assign(globalThis, {
  localStorage: {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  },
  window: {
    dispatchEvent: () => true,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  },
});

describe("post-login initialization", () => {
  beforeEach(() => values.clear());

  test("keeps the session after initialization succeeds", async () => {
    await saveSessionDuringInitialization({ accessToken: "access", refreshToken: "refresh" }, async () => "ready");
    expect(getAccessToken()).toBe("access");
    expect(getRefreshToken()).toBe("refresh");
  });

  test("clears all tokens when initialization fails", async () => {
    expect(saveSessionDuringInitialization({ accessToken: "access", refreshToken: "refresh" }, async () => {
      throw new Error("me failed");
    })).rejects.toThrow("me failed");
    expect(getAccessToken()).toBe("");
    expect(getRefreshToken()).toBe("");
  });
});
