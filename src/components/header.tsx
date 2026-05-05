"use client";

import Link from "next/link";
import Image from "next/image";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "./ui/button";
import { Menu, Home, FileText, LifeBuoy, User, LogOut, ShieldCheck, Plus } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { AuthForm } from "./auth-form";
import { useUser, useAuth } from "@/firebase";
import { signOut } from "firebase/auth";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { createAvatarSvg } from "@/lib/avatar";
import { useRouter } from "next/navigation";
import { isEmailEmployee } from "@/lib/config";
import { NotificationsDropdown } from "./notifications-dropdown";

const navLinks = [
  { href: "/", label: "Início", icon: Home, public: true },
  { href: "/dashboard", label: "Relatos", icon: FileText, public: true },
  { href: "/support", label: "Suporte", icon: LifeBuoy, public: true },
];

function UserButton({ onLoginClick }: { onLoginClick: () => void }) {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();

  if (isUserLoading) {
    return <Button variant="ghost" size="icon" disabled className="animate-pulse"><User className="h-5 w-5" /></Button>;
  }

  if (user) {
    const avatarSrc = user.photoURL || createAvatarSvg(user.email || user.displayName || 'U');
    const userInitial = (user.email || user.displayName || 'U').charAt(0).toUpperCase();

    return (
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-10 w-10 rounded-full border border-gray-100 hover:bg-primary/10 transition-colors p-0">
            <Avatar className="h-10 w-10">
              <AvatarImage src={avatarSrc} alt={user.displayName || user.email || 'User'} />
              <AvatarFallback className="bg-primary/10 text-primary font-bold">{userInitial}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56 rounded-xl shadow-xl" align="end" forceMount>
          <DropdownMenuLabel className="font-normal p-4">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-bold leading-none">Minha Conta</p>
              <p className="text-xs leading-none text-muted-foreground mt-1">
                {user.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild className="p-3 cursor-pointer">
            <Link href="/minha-conta" className="flex items-center">
              <User className="mr-3 h-4 w-4 text-primary" />
              <span className="font-medium">Ver Perfil</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => signOut(auth)} className="p-3 cursor-pointer text-destructive focus:text-destructive">
            <LogOut className="mr-3 h-4 w-4" />
            <span className="font-medium">Sair</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Button variant="default" className="h-10 rounded-xl px-6 font-bold shadow-md hover:scale-105 transition-all" onClick={onLoginClick}>
      Entrar
    </Button>
  );
}

export function Header() {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const { user } = useUser();
  const router = useRouter();

  const isEmployee = isEmailEmployee(user?.email);
  const filteredNavLinks = [...navLinks];
  
  if (isEmployee) {
    filteredNavLinks.push({ href: "/funcionarios", label: "Gestão", icon: ShieldCheck, public: false });
  }

  const handleLoginSuccess = () => {
    setIsAuthModalOpen(false);
    router.push('/');
  }

  return (
    <header className="sticky top-0 z-[1001] w-full bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-200 h-16 flex items-center">
      <Dialog open={isAuthModalOpen} onOpenChange={setIsAuthModalOpen}>
        <div className="max-w-7xl mx-auto px-6 w-full h-full flex items-center justify-between">
            {/* Desktop Logo */}
            <Link href="/" className="hidden md:flex items-center gap-2 group transition-transform hover:scale-105">
              <Image
                src="/img/logo1.png"
                alt="Infra Mais Logo"
                width={36}
                height={36}
                className="object-contain"
                priority
              />
              <span className="text-xl font-bold tracking-tight text-gray-900">
                Infra <span className="text-primary">Mais</span>
              </span>
            </Link>
            
            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-6 text-sm font-semibold">
              {filteredNavLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-gray-600 hover:text-primary transition-colors relative group"
                  >
                    {link.label}
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
                  </Link>
              ))}
              
              <div className="h-6 w-px bg-gray-200 mx-2" />
              
              <div className="flex items-center gap-4">
                <NotificationsDropdown />
                <UserButton onLoginClick={() => setIsAuthModalOpen(true)} />
                {user && !isEmployee && (
                  <Button asChild size="sm" className="h-10 rounded-lg font-bold shadow-sm bg-primary hover:bg-primary/90 hover:scale-[1.02] transition-all">
                    <Link href="/report/new">
                      <Plus className="mr-2 h-4 w-4" />
                      Relatar
                    </Link>
                  </Button>
                )}
              </div>
            </nav>

            {/* Mobile Layout: Menu Button and Logo on the left */}
            <div className="md:hidden flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-xl h-10 w-10">
                      <Menu className="h-6 w-6" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="rounded-r-3xl w-[280px]">
                      <SheetHeader className="text-left">
                          <SheetTitle className="text-2xl font-bold">Menu</SheetTitle>
                      </SheetHeader>
                    <nav className="flex flex-col gap-2 mt-8">
                      {filteredNavLinks.map((link) => (
                        <Link
                          key={link.href}
                          href={link.href}
                          className="flex items-center gap-4 p-4 rounded-xl hover:bg-primary/10 text-lg font-bold transition-all"
                          onClick={() => setIsSheetOpen(false)}
                        >
                          <link.icon className="h-5 w-5 text-primary" />
                          {link.label}
                        </Link>
                      ))}
                    </nav>
                  </SheetContent>
                </Sheet>

                <Link href="/" className="flex items-center gap-2 group">
                  <Image
                    src="/img/logo1.png"
                    alt="Infra Mais Logo"
                    width={32}
                    height={32}
                    className="object-contain"
                    priority
                  />
                  <span className="text-lg font-bold tracking-tight text-gray-900">
                    Infra <span className="text-primary">Mais</span>
                  </span>
                </Link>
              </div>

              <div className="flex items-center gap-2">
                <NotificationsDropdown />
                <UserButton onLoginClick={() => setIsAuthModalOpen(true)} />
              </div>
            </div>
        </div>
        <DialogContent className="rounded-2xl sm:max-w-md p-0 overflow-hidden">
          <div className="p-8">
            <DialogHeader className="mb-6">
              <DialogTitle className="text-2xl font-bold text-gray-900">Acessar Plataforma</DialogTitle>
              <DialogDescription className="text-base text-gray-500">
                Seja bem-vindo(a) de volta ao Infra Mais.
              </DialogDescription>
            </DialogHeader>
            <AuthForm onAuthSuccess={handleLoginSuccess} />
          </div>
        </DialogContent>
      </Dialog>
    </header>
  );
}
