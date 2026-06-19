import { NextResponse } from "next/server";
import { ciscoDeviceTemplates } from "@/shared/cisco-catalog";

const ciscoImageSources = new Map(
  ciscoDeviceTemplates
    .filter((template) => template.officialImageUrl)
    .map((template) => [
      template.officialImageUrl as string,
      template.officialImageSourceUrl || template.sourceUrl
    ])
);

const browserImageHeaders = {
  accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
  "user-agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36"
};

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const imageUrl = requestUrl.searchParams.get("url");
  const referer = imageUrl ? ciscoImageSources.get(imageUrl) : null;

  if (!imageUrl || !referer) {
    return NextResponse.json({ error: "Unknown Cisco image" }, { status: 404 });
  }

  const parsedImageUrl = new URL(imageUrl);
  if (parsedImageUrl.hostname !== "www.cisco.com") {
    return NextResponse.json({ error: "Unsupported image host" }, { status: 400 });
  }

  const response = await fetch(imageUrl, {
    headers: {
      ...browserImageHeaders,
      referer
    },
    next: { revalidate: 60 * 60 * 24 }
  });

  if (!response.ok) {
    return NextResponse.json({ error: "Cisco image unavailable" }, { status: 502 });
  }

  const contentType = response.headers.get("content-type") || "image/jpeg";
  if (!contentType.startsWith("image/")) {
    return NextResponse.json({ error: "Cisco image response was not an image" }, { status: 502 });
  }

  return new NextResponse(await response.arrayBuffer(), {
    headers: {
      "cache-control": "public, max-age=86400, stale-while-revalidate=604800",
      "content-type": contentType,
      "x-content-type-options": "nosniff"
    }
  });
}
