// R2 uploads follow after a bucket and authorization policy are configured.
export async function POST() {
  return Response.json({ error: "Uploads are disabled for this milestone." }, {
    status: 410, headers: { "Cache-Control": "no-store" },
  });
}
