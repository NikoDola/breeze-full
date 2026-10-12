import HomeContent from "@/components/sections/home/HomeContent";
import { getPublishedHome } from "@/lib/cms/public";
import { homeSeed } from "../../../cms/shared/home-seed";

export default async function HomePage() {
  const publication = await getPublishedHome();
  return <HomeContent document={publication?.document ?? homeSeed} publication={publication ?? undefined} />;
}
