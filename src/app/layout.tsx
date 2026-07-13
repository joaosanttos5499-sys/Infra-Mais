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
  display: "swap",
});

export const metadata: Metadata = {
  title: "Infra Mais - Zeladoria Urbana",
  description: "Plataforma independente para relatos e acompanhamento de problemas de infraestrutura urbana em Picuí-PB.",
  keywords: ["infraestrutura", "zeladoria", "cidadania", "Picuí", "relatos urbanos", "manutenção urbana"],
  authors: [{ name: "Infra Mais" }],
  openGraph: {
    title: "Infra Mais - Zeladoria Urbana",
    description: "Relate e acompanhe problemas de infraestrutura na sua cidade.",
    url: "https://inframais.com.br",
    siteName: "Infra Mais",
    locale: "pt_BR",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#3b82f6" },
    { media: "(prefers-color-scheme: dark)", color: "#1e293b" },
  ],
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
            <Header />
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
