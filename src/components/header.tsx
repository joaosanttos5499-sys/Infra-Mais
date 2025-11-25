
"use client";

import Link from "next/link";
import Image from "next/image";
import { Separator } from "./ui/separator";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "./ui/button";
import { Menu, Home, FileText, Users, LifeBuoy, User } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { AuthForm } from "./auth-form";

const navLinks = [
  { href: "/", label: "Início", icon: Home },
  { href: "/dashboard", label: "Relatos", icon: FileText },
  { href: "/funcionarios", label: "Funcionários", icon: Users },
  { href: "/support", label: "Suporte", icon: LifeBuoy },
];

export function Header() {
  const [isSheetOpen, setIsSheetOpen] = useState(false);

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
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-4 text-sm font-medium">
            {navLinks.map((link, index) => (
                <div key={link.href} className="flex items-center gap-4">
                    <Link
                    href={link.href}
                    className="opacity-90 hover:opacity-100 transition-opacity"
                    >
                    {link.label}
                    </Link>
                    {index < navLinks.length - 1 && <Separator orientation="vertical" className="h-4 bg-primary/50" />}
                </div>
            ))}
             <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon">
                  <User className="h-5 w-5" />
                  <span className="sr-only">Login</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Acessar Plataforma</DialogTitle>
                  <DialogDescription>
                    Use seu e-mail e senha para entrar ou criar uma conta.
                  </DialogDescription>
                </DialogHeader>
                <AuthForm />
              </DialogContent>
            </Dialog>
          </nav>

          {/* Mobile Navigation */}
          <div className="md:hidden flex items-center">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon">
                  <User className="h-5 w-5" />
                  <span className="sr-only">Login</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                 <DialogHeader>
                  <DialogTitle>Acessar Plataforma</DialogTitle>
                  <DialogDescription>
                    Use seu e-mail e senha para entrar ou criar uma conta.
                  </DialogDescription>
                </DialogHeader>
                <AuthForm />
              </DialogContent>
            </Dialog>
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Abrir menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <nav className="flex flex-col gap-4 mt-8">
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="flex items-center gap-3 p-2 rounded-md hover:bg-muted text-base font-medium"
                      onClick={() => setIsSheetOpen(false)}
                    >
                      <link.icon className="h-5 w-5" />
                      {link.label}
                    </Link>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
