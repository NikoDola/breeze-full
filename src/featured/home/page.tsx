import HomeContent from "@/components/sections/home/HomeContent";
import { getPublishedHome, getPublishedReviews } from "@/lib/cms/public";
import { getSite } from "@/lib/cms/site";
import { homeSeed } from "../../../cms/shared/home-seed";

export default async function HomePage() {
  const [publication, reviews, site] = await Promise.all([getPublishedHome(), getPublishedReviews(), getSite()]);
  return <HomeContent document={publication?.document ?? homeSeed} publication={publication ?? undefined} reviews={reviews?.document} site={site} />;
}
