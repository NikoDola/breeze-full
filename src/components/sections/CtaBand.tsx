import { getSite } from "@/lib/cms/site";
import CtaBandContent from "./CtaBandContent";

export default async function CtaBand() { return <CtaBandContent site={await getSite()} />; }
