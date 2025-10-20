import Link from "next/link";
import { Building } from "lucide-react";

export function Header() {
  return (
    <header className="bg-card border-b sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center gap-2">
            <Building className="h-7 w-7 text-primary" />
            <span className="text-2xl font-bold font-headline text-foreground">
              CityFix
            </span>
          </Link>
          <nav className="flex items-center gap-4 text-sm font-medium">
            <Link
              href="/"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Home
            </Link>
            <Link
              href="/report/new"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              New Report
            </Link>
            <Link
              href="/dashboard"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Dashboard
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
