import ContentPage from "@/featured/content-page/Page";
import { contentMetadata } from "@/lib/cms/content";

export const generateMetadata = () => contentMetadata("mini-split-systems");
export default function Page() { return <ContentPage pageId="mini-split-systems" />; }
