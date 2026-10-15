import ContentPage from "@/featured/content-page/Page";
import { contentMetadata } from "@/lib/cms/content";

export const generateMetadata = () => contentMetadata("comfort-club");
export default function Page() { return <ContentPage pageId="comfort-club" />; }
