
"use client";

import { useEffect, useState } from "react";
import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { FirebaseClientProvider } from "@/firebase";
import { ThemeProvider } from "@/components/theme-provider";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-poppins",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={cn("min-h-screen bg-background font-body antialiased flex flex-col", poppins.variable)}>
        <ThemeProvider>
          <FirebaseClientProvider>
            <div className={cn(
                "fixed top-0 left-0 w-full z-[2000] border-b border-border bg-background transition-shadow duration-300",
                scrolled ? "shadow-md" : ""
            )}>
              <Header />
            </div>
            <div className="flex-grow pt-20">
              {children}
            </div>
            <Toaster />
            <Footer />
          </FirebaseClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
