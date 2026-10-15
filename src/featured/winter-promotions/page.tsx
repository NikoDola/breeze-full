import ContentPage from "@/featured/content-page/Page";
import { contentMetadata } from "@/lib/cms/content";

export const generateMetadata = () => contentMetadata("promotions", "winter-promotions");
export default function Page() { return <ContentPage pageId="promotions" offerSlug="winter-promotions" />; }
