import Link from "next/link";
import Image from "next/image";

export function Footer() {
  return (
    <footer className="bg-primary text-white py-6 mt-auto">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <Image
              src="/img/logo1.png"
              alt="Infra Mais Logo"
              width={32}
              height={32}
              className="brightness-0 invert"
            />
            <span className="text-lg font-bold">
              Infra Mais
            </span>
          </div>
          <div className="text-sm opacity-90 text-center sm:text-right">
            <p>&copy; {new Date().getFullYear()} Infra Mais. Todos os direitos reservados.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
