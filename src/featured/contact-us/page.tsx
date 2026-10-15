import ContentPage from "@/featured/content-page/Page";
import { contentMetadata } from "@/lib/cms/content";

export const generateMetadata = () => contentMetadata("contact-us");
export default function Page() { return <ContentPage pageId="contact-us" />; }
