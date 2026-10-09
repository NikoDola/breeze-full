import { NextRequest, NextResponse } from "next/server";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

// This route reads/writes the editable content files under /content.
// It runs at request time and touches the filesystem, so keep it on the
// Node.js runtime and never cache it.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "breeze-admin";

const CONTENT_DIR = path.join(process.cwd(), "content");
const SITE_PATH = path.join(CONTENT_DIR, "site.json");
const PROMOS_PATH = path.join(CONTENT_DIR, "promotions.json");

function authorized(request: NextRequest): boolean {
  const provided = request.headers.get("x-admin-password") ?? "";
  return provided.length > 0 && provided === ADMIN_PASSWORD;
}

async function readJson(file: string) {
  const raw = await readFile(file, "utf8");
  return JSON.parse(raw);
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [site, promotions] = await Promise.all([
      readJson(SITE_PATH),
      readJson(PROMOS_PATH),
    ]);
    return NextResponse.json({ site, promotions });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to read content", detail: String(err) },
      { status: 500 }
    );
  }
}

// Very small structural guards — enough to avoid writing obvious garbage,
// without pretending this is a full schema validator.
function isValidSite(site: unknown): boolean {
  if (typeof site !== "object" || site === null) return false;
  const s = site as Record<string, unknown>;
  const stringKeys = ["name", "tagline", "phone", "email"];
  if (!stringKeys.every((k) => typeof s[k] === "string")) return false;
  if (typeof s.address !== "object" || s.address === null) return false;
  if (!Array.isArray(s.socials)) return false;
  return true;
}

function isValidPromotions(promotions: unknown): boolean {
  if (typeof promotions !== "object" || promotions === null) return false;
  const p = promotions as Record<string, unknown>;
  if (!Array.isArray(p.items)) return false;
  return p.items.every(
    (item) =>
      typeof item === "object" &&
      item !== null &&
      typeof (item as Record<string, unknown>).slug === "string"
  );
}

export async function POST(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { site?: unknown; promotions?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const writes: Promise<void>[] = [];

  if (body.site !== undefined) {
    if (!isValidSite(body.site)) {
      return NextResponse.json(
        { error: "Invalid site content" },
        { status: 400 }
      );
    }
    writes.push(
      writeFile(SITE_PATH, JSON.stringify(body.site, null, 2) + "\n", "utf8")
    );
  }

  if (body.promotions !== undefined) {
    if (!isValidPromotions(body.promotions)) {
      return NextResponse.json(
        { error: "Invalid promotions content" },
        { status: 400 }
      );
    }
    writes.push(
      writeFile(
        PROMOS_PATH,
        JSON.stringify(body.promotions, null, 2) + "\n",
        "utf8"
      )
    );
  }

  if (writes.length === 0) {
    return NextResponse.json(
      { error: "Nothing to save" },
      { status: 400 }
    );
  }

  try {
    await Promise.all(writes);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to write content", detail: String(err) },
      { status: 500 }
    );
  }
}
