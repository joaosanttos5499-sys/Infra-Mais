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

export const metadata: Metadata = {
  title: "Infra Mais - Zeladoria Urbana",
  description: "Relate e acompanhe problemas de infraestrutura na sua cidade.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var savedTheme = localStorage.getItem('infra_mais_theme');
                  var theme = savedTheme;
                  if (!theme) {
                    theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  }
                  if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body 
        className={cn("min-h-screen bg-background font-body antialiased flex flex-col", poppins.variable)} 
        suppressHydrationWarning
      >
        <ThemeProvider>
          <FirebaseClientProvider>
            <div className="fixed top-0 left-0 w-full z-[2000] border-b border-border bg-card">
              <Header />
            </div>
            <div className="flex-grow pt-20 bg-background">
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
