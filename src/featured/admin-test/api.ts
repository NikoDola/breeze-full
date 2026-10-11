import { protectEditor } from "@/lib/cms/access";
import { workerAdmin } from "@/lib/cms/worker";
import { deliverPublication, preflight } from "@/lib/cms/delivery";
import { InputError, LEGACY_URL, importLegacy, readBody, record } from "../../../cms/shared/contract";
const json = (value: unknown, status = 200) => Response.json(value, { status, headers: { "Cache-Control": "no-store" } });
export async function GET(request: Request) {
  const denied = protectEditor(request); if (denied) return denied;
  try {
    const response = await workerAdmin("proof");
    return json(await response.json(), response.status);
  } catch { return json({ error: "Cannot reach the test Worker. Check CMS_WORKER_URL and the local Worker process." }, 502); }
}
export async function POST(request: Request) {
  const denied = protectEditor(request); if (denied) return denied;
  try {
    if (!request.headers.get("content-type")?.startsWith("application/json")) throw new InputError("Expected JSON.");
    const input = record(JSON.parse(await readBody(request)));
    if (!["import", "draft", "publish", "retry", "preflight"].includes(String(input.action))) throw new InputError("Unknown action.");
    if (input.action === "preflight") return json(await preflight());
    if (input.action === "retry") return json(await deliverPublication());
    let body: unknown = input;
    if (input.action === "import") {
      const legacy = await fetch(LEGACY_URL, { cache: "no-store", redirect: "error", signal: AbortSignal.timeout(15000) });
      if (!legacy.ok) throw new Error("Legacy read failed.");
      const source = JSON.parse(await readBody(legacy));
      importLegacy(source);
      body = { source };
    }
    const response = await workerAdmin(String(input.action), body);
    if (input.action === "publish" && response.ok) return json(await deliverPublication());
    return json(await response.json(), response.status);
  } catch (error) {
    if (error instanceof InputError || error instanceof SyntaxError) return json({ error: error instanceof InputError ? error.message : "Invalid JSON." }, 400);
    return json({ error: "CMS request could not complete. Refresh status before retrying; a draft or publication may already have been saved." }, 502);
  }
}
