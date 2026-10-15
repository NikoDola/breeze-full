import ContentPage from "@/featured/content-page/Page";
import { contentMetadata } from "@/lib/cms/content";

export const generateMetadata = () => contentMetadata("property-manager");
export default function Page() { return <ContentPage pageId="property-manager" />; }
