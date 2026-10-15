import ContentPage from "@/featured/content-page/Page";
import { contentMetadata } from "@/lib/cms/content";

export const generateMetadata = () => contentMetadata("services");
export default function Page() { return <ContentPage pageId="services" />; }
