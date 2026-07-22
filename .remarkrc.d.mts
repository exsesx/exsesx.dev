import type { remark } from "remark";

declare const config: Parameters<ReturnType<typeof remark>["use"]>[0];

export default config;
