import { authorizeAdminRequest } from "@/lib/server/admin-auth";

const ALLOWED_TABLES = new Set([
  "ads",
  "blogs",
  "categories",
  "companies",
  "company_ads",
  "label_thumbnails",
  "product_category_jnc",
  "product_stack_jnc",
  "product_subcategory_jnc",
  "products",
  "reports",
  "stacks",
  "sub_categories",
  "submissions",
  "tags",
  "users",
  "waitlist",
]);
const ALLOWED_METHODS = new Set(["GET", "HEAD", "POST", "PATCH", "DELETE"]);
const FORWARDED_REQUEST_HEADERS = [
  "accept",
  "accept-profile",
  "content-profile",
  "content-type",
  "prefer",
  "range",
  "range-unit",
];
const FORWARDED_RESPONSE_HEADERS = [
  "content-range",
  "content-type",
  "location",
  "preference-applied",
  "range-unit",
];

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function proxyAdminRequest(request, context) {
  if (!(await authorizeAdminRequest(request))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { path = [] } = await context.params;
  if (
    path.length !== 3 ||
    path[0] !== "rest" ||
    path[1] !== "v1" ||
    !ALLOWED_TABLES.has(path[2]) ||
    !ALLOWED_METHODS.has(request.method)
  ) {
    return Response.json({ error: "Unsupported admin operation" }, { status: 404 });
  }
  if (path[2] === "users" && request.method !== "HEAD") {
    return Response.json({ error: "Unsupported admin operation" }, { status: 405 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return Response.json({ error: "Server configuration error" }, { status: 500 });
  }

  const incomingUrl = new URL(request.url);
  const upstreamUrl = new URL(
    `/rest/v1/${encodeURIComponent(path[2])}${incomingUrl.search}`,
    supabaseUrl
  );
  const headers = new Headers({
    apikey: serviceRoleKey,
    authorization: `Bearer ${serviceRoleKey}`,
  });

  for (const headerName of FORWARDED_REQUEST_HEADERS) {
    const value = request.headers.get(headerName);
    if (value) headers.set(headerName, value);
  }

  let body;
  if (!["GET", "HEAD"].includes(request.method)) {
    const buffer = await request.arrayBuffer();
    if (buffer.byteLength > 2_000_000) {
      return Response.json({ error: "Request body is too large" }, { status: 413 });
    }
    body = buffer;
  }

  const upstream = await fetch(upstreamUrl, {
    method: request.method,
    headers,
    body,
    cache: "no-store",
  });
  const responseHeaders = new Headers({
    "Cache-Control": "no-store",
  });

  for (const headerName of FORWARDED_RESPONSE_HEADERS) {
    const value = upstream.headers.get(headerName);
    if (value) responseHeaders.set(headerName, value);
  }

  return new Response(await upstream.arrayBuffer(), {
    status: upstream.status,
    headers: responseHeaders,
  });
}

export const GET = proxyAdminRequest;
export const HEAD = proxyAdminRequest;
export const POST = proxyAdminRequest;
export const PATCH = proxyAdminRequest;
export const DELETE = proxyAdminRequest;
