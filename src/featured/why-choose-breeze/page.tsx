import ContentPage from "@/featured/content-page/Page";
import { contentMetadata } from "@/lib/cms/content";

export const generateMetadata = () => contentMetadata("why-choose-breeze");
export default function Page() { return <ContentPage pageId="why-choose-breeze" />; }
