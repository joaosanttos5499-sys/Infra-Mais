import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { SocialsHeader } from "@/components/socials-header";
import { FirebaseClientProvider } from "@/firebase";
import { ThemeProvider } from "@/components/theme-provider";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "Infra Mais",
  description: "Report infrastructure issues in your city.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={cn("min-h-screen bg-background font-body antialiased flex flex-col", poppins.variable)}>
        <ThemeProvider>
          <FirebaseClientProvider>
            <div className="fixed top-0 left-0 w-full z-[2000]">
              <SocialsHeader />
              <Header />
            </div>
            <div className="flex-grow pt-16 sm:pt-[84px]">
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
