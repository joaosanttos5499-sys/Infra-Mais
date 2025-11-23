import Link from "next/link";
import Image from "next/image";

export function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground mt-auto">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Image
              src="/img/logo1.png"
              alt="Infra Mais Logo"
              width={40}
              height={40}
            />
            <span className="text-xl font-bold font-headline">
              Infra Mais
            </span>
          </div>
          <div className="text-sm">
            <p>&copy; {new Date().getFullYear()} Infra Mais. Todos os direitos reservados.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
