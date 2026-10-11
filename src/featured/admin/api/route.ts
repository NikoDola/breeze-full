// The old filesystem editor cannot persist content on Vercel. Retired in every environment.
export async function GET() {
  return Response.json({ error: "The file editor is retired. Use the protected /admin-test workflow." }, {
    status: 410, headers: { "Cache-Control": "no-store" },
  });
}
export const POST = GET;
