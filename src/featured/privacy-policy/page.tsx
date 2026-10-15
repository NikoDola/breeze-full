import ContentPage from "@/featured/content-page/Page";
import { contentMetadata } from "@/lib/cms/content";

export const generateMetadata = () => contentMetadata("privacy-policy");
export default function Page() { return <ContentPage pageId="privacy-policy" />; }
