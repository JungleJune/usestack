"use client";

import { createClient } from "@supabase/supabase-js";

let adminClient;
const storage = {
  from(bucket) {
    return {
      async upload(path, file, options = {}) {
        const formData = new FormData();
        formData.set("bucket", bucket);
        formData.set("path", path);
        formData.set("file", file);
        formData.set("cacheControl", options.cacheControl || "3600");
        formData.set("upsert", String(options.upsert === true));

        const response = await fetch("/api/admin/storage", {
          method: "POST",
          body: formData,
        });
        const payload = await response.json();
        return response.ok
          ? { data: payload.data, error: null }
          : { data: null, error: new Error(payload.error) };
      },
      getPublicUrl(path) {
        const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const encodedPath = String(path)
          .split("/")
          .map(encodeURIComponent)
          .join("/");
        return {
          data: {
            publicUrl: `${baseUrl}/storage/v1/object/public/${encodeURIComponent(bucket)}/${encodedPath}`,
          },
        };
      },
      async remove(paths) {
        const response = await fetch("/api/admin/storage", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bucket, paths }),
        });
        const payload = await response.json();
        return response.ok
          ? { data: payload.data, error: null }
          : { data: null, error: new Error(payload.error) };
      },
    };
  },
};

function getAdminClient() {
  if (adminClient) return adminClient;
  if (typeof window === "undefined") {
    throw new Error("The admin database client is only available in the browser");
  }

  adminClient = createClient(
    `${window.location.origin}/api/admin/supabase`,
    "authenticated-admin-proxy",
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    }
  );

  return adminClient;
}

export const supabase = new Proxy(
  {},
  {
    get(_, property) {
      if (property === "storage") return storage;

      const client = getAdminClient();
      const value = client[property];
      return typeof value === "function" ? value.bind(client) : value;
    },
  }
);
