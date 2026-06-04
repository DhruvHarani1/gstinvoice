import type { Metadata } from "next";
import { Inter } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import Analytics from "@/components/Analytics";
import Providers from "@/components/providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: {
    default: "InvoiceWala — GST Invoice Generator for Indian Freelancers",
    template: "%s | InvoiceWala"
  },
  description: "Professional GST invoice generator for Indian freelancers, consultants, and small businesses. Generate, download, and track GST invoices in 30 seconds.",
  keywords: [
    "GST Invoice Generator",
    "Freelancer Billing India",
    "GST Invoice Software",
    "Invoice Generator India",
    "InvoiceWala",
    "GST Billing App",
    "Indian Freelancers Software"
  ],
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  alternates: {
    canonical: "/"
  },
  openGraph: {
    title: "InvoiceWala — GST Invoice Generator for Indian Freelancers",
    description: "Professional GST invoice generator for Indian freelancers, consultants, and small businesses. Generate, download, and track GST invoices in 30 seconds.",
    url: "https://invoicewala.com",
    siteName: "InvoiceWala",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "InvoiceWala Preview"
      }
    ],
    locale: "en_IN",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "InvoiceWala — GST Invoice Generator for Indian Freelancers",
    description: "Professional GST invoice generator for Indian freelancers, consultants, and small businesses.",
    images: ["/og-image.png"]
  }
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "InvoiceWala",
  "operatingSystem": "All",
  "applicationCategory": "BusinessApplication",
  "offers": {
    "@type": "Offer",
    "price": "0.00",
    "priceCurrency": "INR"
  },
  "description": "GST Invoice Generator for Indian Freelancers, consultants, and small businesses.",
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.9",
    "ratingCount": "2048"
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${inter.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <Providers>
          {children}
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}

