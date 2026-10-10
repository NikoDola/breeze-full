import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "breeze-admin";
const IMAGES_DIR = path.join(process.cwd(), "public", "images");
const MAX_BYTES = 8 * 1024 * 1024; // 8 MB

const ALLOWED: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};

function authorized(request: NextRequest): boolean {
  const provided = request.headers.get("x-admin-password") ?? "";
  return provided.length > 0 && provided === ADMIN_PASSWORD;
}

// Turn an original filename into a safe, unique basename under /public/images.
function safeName(original: string, ext: string): string {
  const base = original
    .replace(/\.[^.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  const stamp = Date.now().toString(36);
  return `${base || "upload"}-${stamp}.${ext}`;
}

export async function POST(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Expected multipart/form-data" },
      { status: 400 }
    );
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const ext = ALLOWED[file.type];
  if (!ext) {
    return NextResponse.json(
      { error: `Unsupported image type: ${file.type || "unknown"}` },
      { status: 400 }
    );
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "Image too large (max 8 MB)" },
      { status: 400 }
    );
  }

  const name = safeName(file.name, ext);
  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    await writeFile(path.join(IMAGES_DIR, name), buffer);
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to save image", detail: String(err) },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, path: `/images/${name}` });
}
