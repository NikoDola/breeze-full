import ContentPage from "@/featured/content-page/Page";
import { contentMetadata } from "@/lib/cms/content";

export const generateMetadata = () => contentMetadata("promotions", "summer-promotions");
export default function Page() { return <ContentPage pageId="promotions" offerSlug="summer-promotions" />; }
