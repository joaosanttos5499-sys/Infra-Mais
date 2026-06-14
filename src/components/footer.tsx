import Link from "next/link";
import Image from "next/image";

export function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground py-8 mt-auto border-t border-primary/20">
      <div className="w-full max-w-full mx-auto px-6">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <Image
              src="/img/logo1.png"
              alt="Infra Mais Logo"
              width={36}
              height={36}
              className="object-contain"
              priority
            />
            <span className="text-xl font-bold tracking-tight text-white">
              Infra Mais
            </span>
          </div>
          <div className="text-sm opacity-80 text-center sm:text-right">
            <p>&copy; {new Date().getFullYear()} Infra Mais. Todos os direitos reservados.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
