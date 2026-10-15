import ContentPage from "@/featured/content-page/Page";
import { contentMetadata } from "@/lib/cms/content";

export const generateMetadata = () => contentMetadata("residential");
export default function Page() { return <ContentPage pageId="residential" />; }
