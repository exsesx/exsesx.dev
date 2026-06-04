const DEFAULT_RXRESUME_BASE_URL = "https://rxresu.me";
const DEFAULT_RESUME_ID = "019befbe-521d-71d8-ad3b-f1610eda247a";
const PDF_FILENAME = "Oleh Vanin CV.pdf";
const RESUME_PDF_BROWSER_CACHE_SECONDS = 60 * 60;
const RESUME_PDF_STALE_SECONDS = 60 * 60 * 24;
export const runtime = "nodejs";
export const revalidate = 21600;

const RESUME_PDF_REVALIDATE_SECONDS = revalidate;
const RESUME_PDF_CACHE_CONTROL = [
  "public",
  `max-age=${RESUME_PDF_BROWSER_CACHE_SECONDS}`,
  `s-maxage=${RESUME_PDF_REVALIDATE_SECONDS}`,
  `stale-while-revalidate=${RESUME_PDF_STALE_SECONDS}`,
].join(", ");

export async function GET(request: Request) {
  const apiKey = process.env.RXRESUME_API_KEY;

  if (!apiKey) {
    return Response.json({ error: "RXResume API key is not configured" }, { status: 500 });
  }

  const baseUrl = (process.env.RXRESUME_BASE_URL || DEFAULT_RXRESUME_BASE_URL).replace(/\/+$/, "");
  const resumeId = process.env.RXRESUME_RESUME_ID || DEFAULT_RESUME_ID;
  const pdfUrl = `${baseUrl}/api/openapi/resumes/${encodeURIComponent(resumeId)}/pdf`;

  const upstreamResponse = await fetch(pdfUrl, {
    headers: {
      "x-api-key": apiKey,
    },
    next: {
      revalidate: RESUME_PDF_REVALIDATE_SECONDS,
    },
  });

  if (!upstreamResponse.ok) {
    return Response.json({ error: "Unable to fetch the latest resume PDF" }, { status: 502 });
  }

  const pdf = await upstreamResponse.arrayBuffer();
  const shouldDownload = new URL(request.url).searchParams.has("download");

  return new Response(pdf, {
    headers: {
      "Cache-Control": RESUME_PDF_CACHE_CONTROL,
      "Content-Type": upstreamResponse.headers.get("content-type") || "application/pdf",
      "Content-Length": String(pdf.byteLength),
      "Content-Disposition": `${shouldDownload ? "attachment" : "inline"}; filename="${PDF_FILENAME}"`,
    },
  });
}
