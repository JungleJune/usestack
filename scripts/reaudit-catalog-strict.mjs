import fs from "node:fs/promises";
import path from "node:path";

const sourcePath =
  process.argv[2] ||
  path.join(
    process.cwd(),
    "outputs",
    "catalog-audit-2026-06-28",
    "previous-audit.json"
  );
const outputDir =
  process.argv[3] ||
  path.join(process.cwd(), "outputs", "catalog-audit-2026-07-09");

const strictPublicKeepIds = new Set([
  1, 3, 4, 5, 6, 8, 9, 15, 16, 19, 21, 22, 23, 24, 31, 32, 33, 36, 51, 54,
  55, 61, 64, 70, 79, 80, 81, 82, 83, 89, 91, 92, 93, 104, 122, 123, 126,
  151, 152, 154, 155, 157, 158, 160, 161, 164, 168, 175, 179, 180, 184,
  186, 192, 193, 194, 195, 196, 200, 201, 204, 207, 209, 210, 211, 215,
  216, 219, 225, 227, 242, 243, 247, 254, 258, 265, 274, 277, 278, 281,
  286, 291, 293, 294, 295, 296, 297, 298, 300, 303, 304, 316, 321, 331,
  345, 348, 349, 353, 355, 360, 364, 366, 367, 369, 375, 376, 377, 380,
  382, 386, 392, 395, 396, 397, 398, 399, 402, 405, 406, 408, 409, 411,
  412, 415, 419, 422, 423, 426, 431, 446, 447,
]);

const source = JSON.parse(await fs.readFile(sourcePath, "utf8"));
const rows = Array.isArray(source) ? source : source.rows || [];
const productIds = new Set(
  rows.map((row) => Number(row["Product ID"])).filter(Number.isInteger)
);

const missingKeepIds = [...strictPublicKeepIds].filter((id) => !productIds.has(id));
if (missingKeepIds.length) {
  throw new Error(`Strict keep IDs missing from audit: ${missingKeepIds.join(", ")}`);
}

function strictDecision(row) {
  const productId = Number(row["Product ID"]);
  const previousRecommendation = String(row.Recommendation || "").toLowerCase();

  if (previousRecommendation === "remove") {
    return {
      ...row,
      "Reviewer Decision": "strict-2026-07-09",
    };
  }

  if (strictPublicKeepIds.has(productId)) {
    return {
      ...row,
      "Reviewer Decision": "strict-2026-07-09",
      Recommendation: "keep",
      "DB Action": "retain",
      Visibility: "directory_and_stacks",
      Rule: "strict_public_keep",
      Reason:
        "Strict public catalog keep: AI-native, high-signal, current, or useful as a builder-stack anchor.",
    };
  }

  return {
    ...row,
    "Reviewer Decision": "strict-2026-07-09",
    Recommendation: "hide",
    "DB Action": "hide_from_directory",
    Visibility: "stacks_only",
    Rule: "strict_public_hide",
    Reason:
      previousRecommendation === "hide"
        ? row.Reason
        : "Strict public catalog hide: useful reference or stack-context product, but not needed in the main discovery directory.",
  };
}

const strictRows = rows.map(strictDecision);
const summary = strictRows.reduce(
  (acc, row) => {
    const recommendation = String(row.Recommendation || "unknown").toLowerCase();
    acc[recommendation] = (acc[recommendation] || 0) + 1;
    return acc;
  },
  { total: strictRows.length }
);

await fs.mkdir(outputDir, { recursive: true });
const auditPath = path.join(outputDir, "strict-audit.json");
const summaryPath = path.join(outputDir, "strict-summary.json");

await fs.writeFile(
  auditPath,
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      policy:
        "Public discovery keeps a compact set of AI-native, current, high-signal tools. The long tail remains hidden for stacks/admin review; true duplicates/directories/dead records remain remove candidates.",
      strictPublicKeepIds: [...strictPublicKeepIds].sort((a, b) => a - b),
      summary,
      rows: strictRows,
    },
    null,
    2
  )
);

await fs.writeFile(
  summaryPath,
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      sourcePath,
      auditPath,
      strictPublicKeepCount: strictPublicKeepIds.size,
      summary,
    },
    null,
    2
  )
);

console.log(
  JSON.stringify({
    auditPath,
    summaryPath,
    strictPublicKeepCount: strictPublicKeepIds.size,
    summary,
  })
);
