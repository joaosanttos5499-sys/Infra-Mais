
"use client";

import Link from "next/link";
import Image from "next/image";
import { Separator } from "./ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "./ui/button";
import { Menu, Home, FileText, Users, LifeBuoy, User, LogOut } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { AuthForm } from "./auth-form";
import { useUser, useAuth } from "@/firebase";
import { signOut } from "firebase/auth";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

const navLinks = [
  { href: "/", label: "Início", icon: Home, public: true },
  { href: "/dashboard", label: "Relatos", icon: FileText, public: true },
  { href: "/support", label: "Suporte", icon: LifeBuoy, public: true },
];

function UserButton({ onLoginClick }: { onLoginClick: () => void }) {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();

  if (isUserLoading) {
    return <Button variant="ghost" size="icon" disabled><User className="h-5 w-5 animate-pulse" /></Button>;
  }

  if (user) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.photoURL || undefined} alt={user.displayName || user.email || 'User'} />
              <AvatarFallback>{user.email?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">Minha Conta</p>
              <p className="text-xs leading-none text-muted-foreground">
                {user.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/minha-conta">
              <User className="mr-2 h-4 w-4" />
              <span>Ver Minha Conta</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => signOut(auth)}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Sair</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Button variant="ghost" size="icon" onClick={onLoginClick}>
      <User className="h-5 w-5" />
      <span className="sr-only">Login</span>
    </Button>
  );
}

export function Header() {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const { user } = useUser();

  const filteredNavLinks = navLinks.filter(link => link.public || !!user);

  return (
    <header className="bg-card text-primary sticky top-0 z-50 shadow-md">
      <Dialog open={isAuthModalOpen} onOpenChange={setIsAuthModalOpen}>
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
              {filteredNavLinks.map((link, index) => (
                  <div key={link.href} className="flex items-center gap-4">
                      <Link
                      href={link.href}
                      className="opacity-90 hover:opacity-100 transition-opacity"
                      >
                      {link.label}
                      </Link>
                      {index < filteredNavLinks.length - 1 && <Separator orientation="vertical" className="h-4 bg-primary/50" />}
                  </div>
              ))}
              <UserButton onLoginClick={() => setIsAuthModalOpen(true)} />
            </nav>

            {/* Mobile Navigation */}
            <div className="md:hidden flex items-center">
              <UserButton onLoginClick={() => setIsAuthModalOpen(true)} />
              <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-6 w-6" />
                    <span className="sr-only">Abrir menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right">
                    <SheetHeader>
                        <SheetTitle className="sr-only">Navegação</SheetTitle>
                    </SheetHeader>
                  <nav className="flex flex-col gap-4 mt-8">
                    {filteredNavLinks.map((link) => (
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Acessar Plataforma</DialogTitle>
            <DialogDescription>
              Use seu e-mail e senha para entrar.
            </DialogDescription>
          </DialogHeader>
          <AuthForm onAuthSuccess={() => setIsAuthModalOpen(false)} />
        </DialogContent>
      </Dialog>
    </header>
  );
}
