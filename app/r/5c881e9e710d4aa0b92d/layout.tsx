import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Review Drop // 13th Oni",
  robots: { index: false, follow: false },
};

export default function ReviewLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
