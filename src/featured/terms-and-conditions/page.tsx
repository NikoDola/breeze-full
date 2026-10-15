import ContentPage from "@/featured/content-page/Page";
import { contentMetadata } from "@/lib/cms/content";

export const generateMetadata = () => contentMetadata("terms-and-conditions");
export default function Page() { return <ContentPage pageId="terms-and-conditions" />; }
