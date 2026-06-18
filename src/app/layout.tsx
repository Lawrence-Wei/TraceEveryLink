import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "接线镜 | TraceEveryLink",
  description: "Network cabling trace visualizer from site to port"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem("traceeverylink-theme");if(t!=="dark"&&t!=="light")t="light";document.documentElement.dataset.theme=t;document.documentElement.style.colorScheme=t;}catch(e){document.documentElement.dataset.theme="light";document.documentElement.style.colorScheme="light";}`
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
