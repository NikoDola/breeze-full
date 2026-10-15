import ContentPage from "@/featured/content-page/Page";
import { contentMetadata } from "@/lib/cms/content";

export const generateMetadata = () => contentMetadata("commercial-industrial");
export default function Page() { return <ContentPage pageId="commercial-industrial" />; }
