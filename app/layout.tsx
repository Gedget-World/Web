import type React from "react";
import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-roboto",
});

export const metadata: Metadata = {
  title: {
    default: "Gadgets Kabila - Your Ultimate Tech Destination",
    template: "%s | Gadgets Kabila",
  },
  description:
    "Discover the latest in tech at Gadgets Kabila. From daily life to smart home devices to gifts for your special ones, you have all under one roof. We offer a wide range of gadgets to enhance your lifestyle.",
  keywords: [
    "gadgets",
    "kabila",
    "gadgets kabila",
    "tech gadgets",
    "smart gadgets",
    "electronics",
    "smart home devices",
    "phones",
    "watches",
    "audio",
    "accessories",
    "buy gadgets online",
    "gadgets India",
    "best tech deals",
  ],
  metadataBase: new URL("https://gadgetskabila.com"),
  icons: {
    icon: [{ url: "/icon.png", type: "image/png" }],
    shortcut: "/icon.png",
    apple: "/icon.png",
  },
  openGraph: {
    type: "website",
    siteName: "Gadgets Kabila",
    title: "Gadgets Kabila - Your Ultimate Tech Destination",
    description:
      "Discover the latest in tech at Gadgets Kabila. From daily life to smart home devices to gifts for your special ones.",
    locale: "en_IN",
    url: "https://gadgetskabila.com",
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "https://gadgetskabila.com",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <html lang="en" className={`${roboto.variable} antialiased`}>
      <head>
        <script
          nonce={nonce}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "Gadgets Kabila",
              url: "https://gadgetskabila.com",
              potentialAction: {
                "@type": "SearchAction",
                target: {
                  "@type": "EntryPoint",
                  urlTemplate:
                    "https://gadgetskabila.com/products?search={search_term_string}",
                },
                "query-input": "required name=search_term_string",
              },
              sameAs: [],
            }),
          }}
        />
        <script
          nonce={nonce}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "Gadgets Kabila",
              url: "https://gadgetskabila.com",
              logo: "https://gadgetskabila.com/icon.png",
              description:
                "Your Ultimate Tech Destination. From daily life to smart home devices to gifts for your special ones.",
            }),
          }}
        />
        <script
          nonce={nonce}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SiteNavigationElement",
              name: [
                "Products",
                "Deals",
                "New Arrivals",
                "Bestsellers",
                "Contact Us",
                "About Us",
                "Help",
              ],
              url: [
                "https://gadgetskabila.com/products",
                "https://gadgetskabila.com/deals",
                "https://gadgetskabila.com/new-arrivals",
                "https://gadgetskabila.com/bestsellers",
                "https://gadgetskabila.com/contact-us",
                "https://gadgetskabila.com/about-us",
                "https://gadgetskabila.com/help",
              ],
            }),
          }}
        />
      </head>
      <body className="font-sans">{children}</body>
    </html>
  );
}
