import { Inngest } from "inngest";
import { getConfig } from "@/core/config";
export const inngest = new Inngest({ id: "image-url-fallback", eventKey: getConfig().INNGEST_EVENT_KEY });
