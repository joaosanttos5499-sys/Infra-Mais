
import Link from "next/link";
import Image from "next/image";

export function Footer() {
  return (
    <footer className="bg-primary text-white py-8 mt-auto">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="bg-white p-1.5 rounded-lg shadow-sm">
              <Image
                src="/img/logo1.png"
                alt="Infra Mais Logo"
                width={32}
                height={32}
                className="object-contain"
                priority
              />
            </div>
            <span className="text-xl font-bold tracking-tight">
              Infra <span className="opacity-80">Mais</span>
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
