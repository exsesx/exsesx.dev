const DEFAULT_RXRESUME_BASE_URL = "https://rxresu.me";
const DEFAULT_RESUME_ID = "019befbe-521d-71d8-ad3b-f1610eda247a";
const PDF_FILENAME = "Oleh Vanin CV.pdf";
const MAX_RESUME_PDF_BYTES = 10 * 1024 * 1024;
const RESUME_PDF_FETCH_TIMEOUT_MS = 10_000;
const RESUME_PDF_BROWSER_CACHE_SECONDS = 60 * 60;
const RESUME_PDF_STALE_SECONDS = 60 * 60 * 24;

const RESUME_PDF_REVALIDATE_SECONDS = 21_600;
const RESUME_PDF_CACHE_CONTROL = [
  "public",
  `max-age=${RESUME_PDF_BROWSER_CACHE_SECONDS}`,
  `s-maxage=${RESUME_PDF_REVALIDATE_SECONDS}`,
  `stale-while-revalidate=${RESUME_PDF_STALE_SECONDS}`,
].join(", ");

const RESPONSE_SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
} as const;

function createResumePdfUrl() {
  const baseUrl = new URL(process.env.RXRESUME_BASE_URL || DEFAULT_RXRESUME_BASE_URL);

  if (baseUrl.protocol !== "https:") {
    throw new Error("RXResume base URL must use HTTPS");
  }

  const resumeId = process.env.RXRESUME_RESUME_ID || DEFAULT_RESUME_ID;

  return new URL(`/api/openapi/resumes/${encodeURIComponent(resumeId)}/pdf`, baseUrl);
}

function createUpstreamErrorResponse() {
  return Response.json(
    { error: "Unable to fetch the latest resume PDF" },
    {
      status: 502,
      headers: {
        ...RESPONSE_SECURITY_HEADERS,
        "Cache-Control": "no-store",
      },
    },
  );
}

function hasPdfSignature(bytes: Uint8Array) {
  return (
    bytes.length >= 5 &&
    bytes[0] === 0x25 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x44 &&
    bytes[3] === 0x46 &&
    bytes[4] === 0x2d
  );
}

async function readPdfBody(upstreamResponse: Response) {
  const declaredLength = upstreamResponse.headers.get("content-length");

  if (declaredLength !== null) {
    const byteLength = Number.parseInt(declaredLength, 10);

    if (Number.isFinite(byteLength) && byteLength > MAX_RESUME_PDF_BYTES) {
      throw new Error("RXResume PDF is too large");
    }
  }

  if (!upstreamResponse.body) {
    const fallbackBuffer = await upstreamResponse.arrayBuffer();

    if (fallbackBuffer.byteLength > MAX_RESUME_PDF_BYTES) {
      throw new Error("RXResume PDF is too large");
    }

    return fallbackBuffer;
  }

  const reader = upstreamResponse.body.getReader();
  const chunks: Uint8Array[] = [];
  let receivedBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      if (!value) {
        continue;
      }

      receivedBytes += value.byteLength;

      if (receivedBytes > MAX_RESUME_PDF_BYTES) {
        throw new Error("RXResume PDF is too large");
      }

      chunks.push(value);
    }
  } catch (error) {
    await reader.cancel(error).catch(() => {});
    throw error;
  }

  const pdf = new Uint8Array(receivedBytes);
  let offset = 0;

  for (const chunk of chunks) {
    pdf.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return pdf.buffer;
}

export async function GET(request: Request) {
  const apiKey = process.env.RXRESUME_API_KEY;

  if (!apiKey) {
    return Response.json(
      { error: "Resume PDF is not configured" },
      {
        status: 500,
        headers: {
          ...RESPONSE_SECURITY_HEADERS,
          "Cache-Control": "no-store",
        },
      },
    );
  }

  let upstreamResponse: Response;

  try {
    upstreamResponse = await fetch(createResumePdfUrl(), {
      headers: {
        Accept: "application/pdf",
        "x-api-key": apiKey,
      },
      next: {
        revalidate: RESUME_PDF_REVALIDATE_SECONDS,
      },
      redirect: "manual",
      signal: AbortSignal.timeout(RESUME_PDF_FETCH_TIMEOUT_MS),
    });
  } catch {
    return createUpstreamErrorResponse();
  }

  if (!upstreamResponse.ok) {
    return createUpstreamErrorResponse();
  }

  let pdf: ArrayBuffer;

  try {
    pdf = await readPdfBody(upstreamResponse);
  } catch {
    return createUpstreamErrorResponse();
  }

  const shouldDownload = new URL(request.url).searchParams.has("download");

  if (!hasPdfSignature(new Uint8Array(pdf))) {
    return createUpstreamErrorResponse();
  }

  return new Response(pdf, {
    headers: {
      ...RESPONSE_SECURITY_HEADERS,
      "Cache-Control": RESUME_PDF_CACHE_CONTROL,
      "Content-Type": "application/pdf",
      "Content-Length": String(pdf.byteLength),
      "Content-Disposition": `${shouldDownload ? "attachment" : "inline"}; filename="${PDF_FILENAME}"`,
    },
  });
}
