import { afterEach, describe, expect, test } from "bun:test";
import { getRuntimeConfig } from "./runtime";

const previousWindow = globalThis.window;

describe("runtime config", () => {
  afterEach(() => {
    Object.assign(globalThis, { window: previousWindow });
  });

  test("prefers deployment runtime values", () => {
    Object.assign(globalThis, {
      window: {
        __MYAI_CONFIG__: {
          tenantId: "runtime-tenant",
          coreApiBaseUrl: "https://core.example.test",
          coreFrontendUrl: "https://core-ui.example.test",
        },
      },
    });
    expect(getRuntimeConfig()).toMatchObject({
      tenantId: "runtime-tenant",
      coreApiBaseUrl: "https://core.example.test",
      coreFrontendUrl: "https://core-ui.example.test",
    });
  });

  test("does not treat empty deployment placeholders as configured values", () => {
    Object.assign(globalThis, { window: { __MYAI_CONFIG__: { tenantId: "", coreApiBaseUrl: "" } } });
    expect(getRuntimeConfig().tenantId).toBeTruthy();
    expect(getRuntimeConfig().coreApiBaseUrl).not.toBe("");
  });
});
