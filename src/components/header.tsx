import Link from "next/link";
import Image from "next/image";

export function Header() {
  return (
    <header className="bg-card text-primary sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center gap-3">
             <Image
                src="/img/logo1.png"
                alt="Infra Mais Logo"
                width={40}
                height={40}
              />
            <span className="text-2xl font-bold font-headline text-primary">
              Infra Mais
            </span>
          </Link>
          <nav className="flex items-center gap-4 text-sm font-medium">
            <Link
              href="/"
              className="opacity-90 hover:opacity-100 transition-opacity"
            >
              Início
            </Link>
            <Link
              href="/dashboard"
              className="opacity-90 hover:opacity-100 transition-opacity"
            >
              Relatos
            </Link>
            <Link
              href="/funcionarios"
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
