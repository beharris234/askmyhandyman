import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://foothold.health"),
  title: {
    default: "Foothold — Lasting ground for your GLP-1 journey",
    template: "%s · Foothold",
  },
  description:
    "The GLP-1 companion built for every dose — and the days you're off it. Doctor-ready reports, real-time pharmacy shortage tracking, and the off-ramp nobody else covers.",
  keywords: [
    "GLP-1 app",
    "Ozempic tracker",
    "Wegovy tracker",
    "Mounjaro tracker",
    "Zepbound tracker",
    "GLP-1 companion",
    "GLP-1 maintenance",
    "GLP-1 off-ramp",
  ],
  openGraph: {
    type: "website",
    title: "Foothold — Lasting ground for your GLP-1 journey",
    description:
      "Doctor-ready reports, pharmacy shortage tracking, and life after the drug. Built for every phase of your GLP-1 journey.",
    url: "https://foothold.health",
    siteName: "Foothold",
  },
  twitter: {
    card: "summary_large_image",
    title: "Foothold — Lasting ground for your GLP-1 journey",
    description:
      "The GLP-1 companion that doesn't quit when your shots do.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Fraunces:opsz,wght@9..144,500;9..144,600&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
