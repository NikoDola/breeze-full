import { revalidatePath, revalidateTag } from "next/cache";
import { testOrigin } from "@/lib/cms/access";
import { pages, InputError, readBody, validateEvent } from "../../../cms/shared/contract";
import { verify } from "../../../cms/shared/signature";
export async function POST(request: Request) {
  const secret = process.env.CMS_REVALIDATE_SECRET;
  const headers = { "Cache-Control": "no-store" };
  const origin = testOrigin();
  if (!origin || request.headers.get("host") !== new URL(origin).host || !secret || secret.length < 32) return Response.json({ error: "Not found." }, { status: 404, headers });
  try {
    const body = await readBody(request, 2048);
    if (!await verify(secret, request.headers.get("x-cms-timestamp") ?? "", body, request.headers.get("x-cms-signature") ?? "")) {
      return Response.json({ error: "Unauthorized." }, { status: 401, headers });
    }
    const input = JSON.parse(body);
    const event = validateEvent(input);
    if (input.dryRun === true) return Response.json({ ok: true, eventId: event.eventId }, { headers });
    // Duplicate events are safe. Only manifest-defined paths and tags are accepted.
    revalidateTag(pages[event.pageId].cacheTag, { expire: 0 });
    revalidatePath(event.path);
    return Response.json({ ok: true, eventId: event.eventId }, { headers });
  } catch (error) {
    if (error instanceof InputError || error instanceof SyntaxError) return Response.json({ error: "Invalid event." }, { status: 400, headers });
    return Response.json({ error: "Cache invalidation failed." }, { status: 500, headers });
  }
}
