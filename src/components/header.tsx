import Link from "next/link";
import { Building } from "lucide-react";

export function Header() {
  return (
    <header className="bg-primary text-primary-foreground sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center gap-2">
            <Building className="h-7 w-7" />
            <span className="text-2xl font-bold font-headline">
              Infra Mais
            </span>
          </Link>
          <nav className="flex items-center gap-4 text-sm font-medium">
            <Link
              href="/"
              className="opacity-90 hover:opacity-100 transition-opacity"
            >
              Home
            </Link>
            <Link
              href="/dashboard"
              className="opacity-90 hover:opacity-100 transition-opacity"
            >
              Funcionários
            </Link>
            <Link
              href="/support"
              className="opacity-90 hover:opacity-100 transition-opacity"
            >
              Suporte
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
