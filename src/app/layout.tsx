import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { SocialsHeader } from "@/components/socials-header";
import { FirebaseClientProvider } from "@/firebase";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "Infra Mais",
  description: "Report infrastructure issues in your city.",
  other: {
    "color-scheme": "light"
  }
};

export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning className="light">
      <head>
        <meta name="color-scheme" content="light" />
      </head>
      <body className={cn("min-h-screen bg-white font-body antialiased flex flex-col", poppins.variable)}>
        <FirebaseClientProvider>
          <SocialsHeader />
          <Header />
          <div className="flex-grow">
            {children}
          </div>
          <Toaster />
          <Footer />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
