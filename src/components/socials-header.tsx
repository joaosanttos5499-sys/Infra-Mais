
import Link from "next/link";
import { Facebook, Instagram, MessageCircle, Mail } from "lucide-react";

export function SocialsHeader() {
  return (
    <div className="bg-primary text-primary-foreground hidden sm:block">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-end items-center h-5 gap-4">
          <Link href="#" className="hover:opacity-80 transition-opacity" aria-label="Facebook">
            <Facebook className="h-3.5 w-3.5" />
            <span className="sr-only">Facebook</span>
          </Link>
          <Link href="#" className="hover:opacity-80 transition-opacity" aria-label="Gmail">
            <Mail className="h-3.5 w-3.5" />
            <span className="sr-only">Gmail</span>
          </Link>
          <Link href="#" className="hover:opacity-80 transition-opacity" aria-label="Instagram">
            <Instagram className="h-3.5 w-3.5" />
            <span className="sr-only">Instagram</span>
          </Link>
          <Link href="#" className="hover:opacity-80 transition-opacity" aria-label="WhatsApp">
            <MessageCircle className="h-3.5 w-3.5" />
            <span className="sr-only">WhatsApp</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
