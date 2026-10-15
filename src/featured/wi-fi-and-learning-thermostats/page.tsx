import ContentPage from "@/featured/content-page/Page";
import { contentMetadata } from "@/lib/cms/content";

export const generateMetadata = () => contentMetadata("wi-fi-and-learning-thermostats");
export default function Page() { return <ContentPage pageId="wi-fi-and-learning-thermostats" />; }
