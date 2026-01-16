import { Metadata } from "next";
import { Toaster } from "sonner";
import { Analytics } from "@vercel/analytics/react";

import { Navbar } from "@/components/custom/navbar";
import { ProfileGate } from "@/components/custom/profile-gate";
import { StructuredData } from "@/components/custom/structured-data";
import { ThemeProvider } from "@/components/custom/theme-provider";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://lucidity.chat"),
  title: {
    default: "Lucidity - AI-Powered Chat Assistant",
    template: "%s | Lucidity",
  },
  description:
    "Advanced AI chatbot powered by Google Gemini. Get intelligent responses, have natural conversations, and boost your productivity with our cutting-edge chat assistant.",
  keywords: [
    "AI chatbot",
    "Google Gemini",
    "artificial intelligence",
    "chat assistant",
    "conversational AI",
    "productivity tool",
  ],
  authors: [{ name: "Lucidity Team" }],
  creator: "Lucidity",
  publisher: "Lucidity",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://lucidity.chat",
    title: "Lucidity - AI-Powered Chat Assistant",
    description:
      "Advanced AI chatbot powered by Google Gemini. Get intelligent responses, have natural conversations, and boost your productivity.",
    siteName: "Lucidity",
    images: [
      {
        url: "/og/default.png",
        width: 768,
        height: 480,
        alt: "Lucidity - AI Chat Assistant",
      },
    ],
  },
  verification: {
    google: "your-google-verification-code", // Add your Google Search Console verification
    yandex: "your-yandex-verification-code", // Optional
    yahoo: "your-yahoo-verification-code", // Optional
  },
  alternates: {
    canonical: "https://lucidity.chat",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#000000" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="subpixel-antialiased" suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <StructuredData />
          <ProfileGate />
          <Toaster position="top-center" />
          <Navbar />
          {children}
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  );
}
