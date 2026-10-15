import ContentPage from "@/featured/content-page/Page";
import { contentMetadata } from "@/lib/cms/content";

export const generateMetadata = () => contentMetadata("indoor-quality");
export default function Page() { return <ContentPage pageId="indoor-quality" />; }
