import type { NextApiRequest, NextApiResponse } from "next";

const DEFAULT_RXRESUME_BASE_URL = "https://rxresu.me";
const DEFAULT_RESUME_ID = "019befbe-521d-71d8-ad3b-f1610eda247a";
const PDF_FILENAME = "Oleh-Vanin-CV.pdf";

export default async function handler(request: NextApiRequest, response: NextApiResponse) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    response.status(405).json({ error: "Method not allowed" });
    return;
  }

  const apiKey = process.env.RXRESUME_API_KEY;

  if (!apiKey) {
    response.status(500).json({ error: "RXResume API key is not configured" });
    return;
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
    response.status(502).json({ error: "Unable to fetch the latest resume PDF" });
    return;
  }

  const pdf = Buffer.from(await upstreamResponse.arrayBuffer());

  response.setHeader("Cache-Control", "no-store, max-age=0");
  response.setHeader("Content-Type", upstreamResponse.headers.get("content-type") || "application/pdf");
  response.setHeader("Content-Length", String(pdf.byteLength));
  response.setHeader("Content-Disposition", `attachment; filename="${PDF_FILENAME}"`);
  response.status(200).send(pdf);
}
