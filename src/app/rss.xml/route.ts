import { siteUrl } from "@/lib/metadata";

export function GET() {
  return Response.redirect(`${siteUrl}/blog/en/rss.xml`, 308);
}
