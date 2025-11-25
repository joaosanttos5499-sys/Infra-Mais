import Link from "next/link";
import { Facebook, Instagram, Twitter } from "lucide-react";

export function SocialsHeader() {
  return (
    <div className="bg-primary text-primary-foreground hidden sm:block">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-end items-center h-6 gap-4">
          <Link href="#" className="hover:opacity-80 transition-opacity" aria-label="Facebook">
            <Facebook className="h-4 w-4" />
            <span className="sr-only">Facebook</span>
          </Link>
          <Link href="#" className="hover:opacity-80 transition-opacity" aria-label="Instagram">
            <Instagram className="h-4 w-4" />
            <span className="sr-only">Instagram</span>
          </Link>
          <Link href="#" className="hover:opacity-80 transition-opacity" aria-label="Twitter">
            <Twitter className="h-4 w-4" />
            <span className="sr-only">Twitter</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
