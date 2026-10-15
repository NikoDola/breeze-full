import ContentPage from "@/featured/content-page/Page";
import { contentMetadata } from "@/lib/cms/content";

export const generateMetadata = () => contentMetadata("about-us");
export default function Page() { return <ContentPage pageId="about-us" />; }
