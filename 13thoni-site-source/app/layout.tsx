import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import "./globals.css";

const mono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://13thoni.com"),
  title: "13th Oni — External Terminal",
  description: "Access the 13th Oni external archive terminal.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "13th Oni — External Terminal",
    description: "Unlucky for most. Lucky for me.",
    url: "https://13thoni.com",
    siteName: "13th Oni",
    type: "website",
  },
  icons: {
    icon: "/brand/oni-emblem.png",
    shortcut: "/brand/oni-emblem.png",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={mono.variable}>{children}</body>
    </html>
  );
}
