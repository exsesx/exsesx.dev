"use client";

import { useReportWebVitals } from "next/web-vitals";

const shouldLogWebVitals = process.env.NODE_ENV !== "production" || process.env.NEXT_PUBLIC_DEBUG_WEB_VITALS === "1";

const reportWebVitals: Parameters<typeof useReportWebVitals>[0] = metric => {
  if (!shouldLogWebVitals) {
    return;
  }

  console.info("[web-vitals]", {
    attribution: metric.attribution,
    id: metric.id,
    name: metric.name,
    navigationType: metric.navigationType,
    rating: metric.rating,
    value: metric.value,
  });
};

export default function WebVitals() {
  useReportWebVitals(reportWebVitals);

  return null;
}
