import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "接线镜 | TraceEveryLink",
  description: "Network cabling trace visualizer from site to port"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
