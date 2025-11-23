import type { Metadata } from "next";
import { PT_Sans } from "next/font/google";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Header } from "@/components/header";
import { SocialsHeader } from "@/components/socials-header";
import { Footer } from "@/components/footer";

const ptSans = PT_Sans({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-pt-sans",
});

export const metadata: Metadata = {
  title: "Infra Mais",
  description: "Report infrastructure issues in your city.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn("min-h-screen bg-background font-body antialiased flex flex-col", ptSans.variable)}>
        <SocialsHeader />
        <div className="flex-grow">
          {children}
        </div>
        <Toaster />
        <Footer />
      </body>
    </html>
  );
}
