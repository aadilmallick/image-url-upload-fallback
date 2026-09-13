import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Paywall } from "@/components/paywall";
import "./globals.css";

export const metadata: Metadata = { title: "Image Fallback", description: "Resilient, permanent image links." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><ClerkProvider>{children}<Paywall /></ClerkProvider></body></html>;
}
