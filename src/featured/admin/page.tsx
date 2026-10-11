import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { authorized } from "@/lib/cms/access";
export default async function AdminPage() {
  if (!authorized(await headers())) notFound();
  redirect("/admin-test");
}
