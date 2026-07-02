import assert from "node:assert/strict";
import test from "node:test";

import {
  authenticateBearerRequest,
  boundedString,
  escapeHtml,
  isPrivateIp,
  isValidEmail,
  isValidPassword,
  parsePublicHttpUrl,
} from "../lib/security.mjs";

test("blocks local and private network URLs", () => {
  for (const value of [
    "http://localhost/admin",
    "http://127.0.0.1",
    "http://10.0.0.1",
    "http://169.254.169.254/latest/meta-data",
    "http://[::1]",
    "file:///etc/passwd",
  ]) {
    assert.throws(() => parsePublicHttpUrl(value));
  }
});

test("accepts ordinary public HTTP URLs", () => {
  assert.equal(
    parsePublicHttpUrl("https://example.com/product").toString(),
    "https://example.com/product"
  );
});

test("recognizes private IP ranges", () => {
  assert.equal(isPrivateIp("192.168.1.1"), true);
  assert.equal(isPrivateIp("172.20.0.1"), true);
  assert.equal(isPrivateIp("8.8.8.8"), false);
  assert.equal(isPrivateIp("::ffff:127.0.0.1"), true);
});

test("escapes untrusted HTML", () => {
  assert.equal(
    escapeHtml(`<img src=x onerror="alert(1)">`),
    "&lt;img src=x onerror=&quot;alert(1)&quot;&gt;"
  );
});

test("validates account input boundaries", () => {
  assert.equal(isValidEmail("person@example.com"), true);
  assert.equal(isValidEmail("not-an-email"), false);
  assert.equal(isValidPassword("long-enough"), true);
  assert.equal(isValidPassword("short"), false);
  assert.equal(boundedString("  value  ", 10), "value");
  assert.throws(() => boundedString("too long", 3));
});

test("authenticates an exact bearer token only", () => {
  const validRequest = new Request("https://example.com", {
    headers: { authorization: "Bearer secret-value" },
  });
  const invalidRequest = new Request("https://example.com", {
    headers: { authorization: "Bearer secret-valuE" },
  });

  assert.equal(
    authenticateBearerRequest(validRequest, "secret-value"),
    true
  );
  assert.equal(
    authenticateBearerRequest(invalidRequest, "secret-value"),
    false
  );
});
