
import type { Metadata } from "next";
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn("min-h-screen bg-background font-body antialiased flex flex-col", poppins.variable)}>
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
