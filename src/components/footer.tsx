
import Link from "next/link";
import { Construction } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-primary text-white py-8 mt-auto">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="bg-white/10 p-2 rounded-xl border border-white/20">
              <Construction className="h-6 w-6 text-white" />
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
