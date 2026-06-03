const DEFAULT_RXRESUME_BASE_URL = "https://rxresu.me";
const DEFAULT_RESUME_ID = "019befbe-521d-71d8-ad3b-f1610eda247a";
const PDF_FILENAME = "Oleh Vanin CV.pdf";

export const runtime = "nodejs";

export async function GET() {
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
  });

  if (!upstreamResponse.ok) {
    return Response.json({ error: "Unable to fetch the latest resume PDF" }, { status: 502 });
  }

  const pdf = await upstreamResponse.arrayBuffer();

  return new Response(pdf, {
    headers: {
      "Cache-Control": "no-store, max-age=0",
      "Content-Type": upstreamResponse.headers.get("content-type") || "application/pdf",
      "Content-Length": String(pdf.byteLength),
      "Content-Disposition": `attachment; filename="${PDF_FILENAME}"`,
    },
  });
}
