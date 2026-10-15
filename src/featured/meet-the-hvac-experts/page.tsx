import ContentPage from "@/featured/content-page/Page";
import { contentMetadata } from "@/lib/cms/content";

export const generateMetadata = () => contentMetadata("meet-the-hvac-experts");
export default function Page() { return <ContentPage pageId="meet-the-hvac-experts" />; }
