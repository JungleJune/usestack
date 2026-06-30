import { authorizeAdminRequest } from "@/lib/server/admin-auth";
import { getSupabaseAdmin } from "@/lib/server/supabase-admin";

const ALLOWED_BUCKETS = new Set(["product-images", "label_thumbnails"]);
const ALLOWED_IMAGE_TYPES = new Set([
  "image/gif",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export const runtime = "nodejs";

function isValidPath(path) {
  return (
    typeof path === "string" &&
    path.length > 0 &&
    path.length <= 500 &&
    !path.includes("..") &&
    !path.includes("\\") &&
    !path.includes("\0")
  );
}

export async function POST(request) {
  if (!(await authorizeAdminRequest(request))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const bucket = formData.get("bucket");
  const path = formData.get("path");
  const file = formData.get("file");
  const cacheControl = formData.get("cacheControl") || "3600";
  const upsert = formData.get("upsert") === "true";

  if (
    !ALLOWED_BUCKETS.has(bucket) ||
    !isValidPath(path) ||
    !(file instanceof File) ||
    !ALLOWED_IMAGE_TYPES.has(file.type) ||
    file.size > 5_000_000
  ) {
    return Response.json({ error: "Invalid image upload" }, { status: 400 });
  }

  const { data, error } = await getSupabaseAdmin()
    .storage
    .from(bucket)
    .upload(path, Buffer.from(await file.arrayBuffer()), {
      cacheControl: String(cacheControl).slice(0, 10),
      contentType: file.type,
      upsert,
    });

  if (error) {
    console.error("Admin storage upload error:", error);
    return Response.json({ error: "Unable to upload image" }, { status: 502 });
  }

  return Response.json({ data });
}

export async function DELETE(request) {
  if (!(await authorizeAdminRequest(request))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const bucket = body.bucket;
  const paths = Array.isArray(body.paths) ? body.paths.slice(0, 20) : [];
  if (
    !ALLOWED_BUCKETS.has(bucket) ||
    paths.length === 0 ||
    !paths.every(isValidPath)
  ) {
    return Response.json({ error: "Invalid storage request" }, { status: 400 });
  }

  const { data, error } = await getSupabaseAdmin()
    .storage
    .from(bucket)
    .remove(paths);

  if (error) {
    console.error("Admin storage delete error:", error);
    return Response.json({ error: "Unable to delete image" }, { status: 502 });
  }

  return Response.json({ data });
}
