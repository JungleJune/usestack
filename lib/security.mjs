import dns from "node:dns/promises";
import { timingSafeEqual } from "node:crypto";
import { isIP } from "node:net";

const BLOCKED_HOST_SUFFIXES = [
  ".internal",
  ".intranet",
  ".lan",
  ".local",
  ".localhost",
];

function normalizeHostname(value) {
  return value
    .toLowerCase()
    .replace(/\.$/, "")
    .replace(/^\[|\]$/g, "");
}

function isPrivateIpv4(address) {
  const octets = address.split(".").map(Number);
  if (octets.length !== 4 || octets.some((part) => Number.isNaN(part))) {
    return true;
  }

  const [a, b] = octets;
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 0) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224
  );
}

function isPrivateIpv6(address) {
  const normalized = address.toLowerCase();
  const mappedIpv4 = normalized.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/)?.[1];
  if (mappedIpv4) return isPrivateIpv4(mappedIpv4);

  return (
    normalized === "::" ||
    normalized === "::1" ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    normalized.startsWith("fe8") ||
    normalized.startsWith("fe9") ||
    normalized.startsWith("fea") ||
    normalized.startsWith("feb")
  );
}

export function isPrivateIp(address) {
  const version = isIP(address);
  if (version === 4) return isPrivateIpv4(address);
  if (version === 6) return isPrivateIpv6(address);
  return true;
}

export function parsePublicHttpUrl(value) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error("A valid URL is required");
  }

  let url;
  try {
    url = new URL(value.trim());
  } catch {
    throw new Error("URL is invalid");
  }

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Only HTTP and HTTPS URLs are allowed");
  }

  if (url.username || url.password) {
    throw new Error("URLs containing credentials are not allowed");
  }

  if (url.port && !["80", "443"].includes(url.port)) {
    throw new Error("Non-standard URL ports are not allowed");
  }

  const hostname = normalizeHostname(url.hostname);
  if (
    hostname === "localhost" ||
    BLOCKED_HOST_SUFFIXES.some((suffix) => hostname.endsWith(suffix)) ||
    (isIP(hostname) && isPrivateIp(hostname))
  ) {
    throw new Error("Private or local network URLs are not allowed");
  }

  return url;
}

export async function assertPublicHttpUrl(value) {
  const url = parsePublicHttpUrl(value);
  const hostname = normalizeHostname(url.hostname);

  if (!isIP(hostname)) {
    let addresses;
    try {
      addresses = await dns.lookup(hostname, { all: true, verbatim: true });
    } catch {
      throw new Error("URL hostname could not be resolved");
    }

    if (!addresses.length || addresses.some(({ address }) => isPrivateIp(address))) {
      throw new Error("URL resolves to a private or local network");
    }
  }

  return url;
}

export async function fetchPublicResource(
  value,
  {
    timeoutMs = 10_000,
    maxBytes = 2_000_000,
    maxRedirects = 3,
    headers = {},
  } = {}
) {
  let url = await assertPublicHttpUrl(value);

  for (let redirects = 0; redirects <= maxRedirects; redirects += 1) {
    const response = await fetch(url, {
      redirect: "manual",
      headers,
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location || redirects === maxRedirects) {
        throw new Error("URL redirected too many times");
      }
      url = await assertPublicHttpUrl(new URL(location, url).toString());
      continue;
    }

    if (!response.ok) {
      throw new Error(`Remote server returned status ${response.status}`);
    }

    const contentLength = Number(response.headers.get("content-length") || 0);
    if (contentLength > maxBytes) {
      throw new Error("Remote response is too large");
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.byteLength > maxBytes) {
      throw new Error("Remote response is too large");
    }

    return {
      buffer,
      contentType: response.headers.get("content-type") || "",
      url,
    };
  }

  throw new Error("Unable to fetch remote URL");
}

export function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function normalizeEmail(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export function isValidEmail(value) {
  const email = normalizeEmail(value);
  return (
    email.length > 3 &&
    email.length <= 254 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  );
}

export function isValidPassword(value) {
  return typeof value === "string" && value.length >= 10 && value.length <= 128;
}

export function secureCompare(left, right) {
  if (typeof left !== "string" || typeof right !== "string") return false;
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) return false;
  return timingSafeEqual(leftBuffer, rightBuffer);
}

export function getBearerToken(request) {
  const header = request.headers.get("authorization") || "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || "";
}

export function authenticateBearerRequest(request, expectedToken) {
  if (!expectedToken) return false;
  return secureCompare(getBearerToken(request), expectedToken);
}

export function boundedString(value, maxLength, { required = false } = {}) {
  const normalized = typeof value === "string" ? value.trim() : "";
  if (required && !normalized) {
    throw new Error("Required text value is missing");
  }
  if (normalized.length > maxLength) {
    throw new Error(`Text value exceeds ${maxLength} characters`);
  }
  return normalized;
}
