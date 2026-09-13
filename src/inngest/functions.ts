import { inngest } from "./client";
import { repairImage } from "@/core/images/repair-service";
export const repairDegradedImage = inngest.createFunction({ id: "repair-degraded-image", retries: 4, triggers: [{ event: "image/repair.requested" }] }, async ({ event, step }) => step.run("repair-replicas", () => repairImage(event.data.imageId)));
