import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import "./globals.css";

const mono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://13thoni.com"),
  title: "13th Oni — Personal Terminal",
  description: "The 13th Oni personal terminal: renders, wallpapers, tools, and signal archives.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "13th Oni — Personal Terminal",
    description: "Renders, wallpapers, tools, and the current signal.",
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
