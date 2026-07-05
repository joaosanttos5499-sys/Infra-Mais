"use client";

import Link from "next/link";
import Image from "next/image";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "./ui/button";
import { Menu, Home, FileText, LifeBuoy, User, LogOut, ShieldCheck, Plus, Briefcase, Users, Trash2, Palette, Sun, Moon, CheckCircle2, UserPlus } from "lucide-react";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { AuthForm } from "./auth-form";
import { useUser, useAuth } from "@/firebase";
import { signOut } from "firebase/auth";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuPortal, DropdownMenuSubContent } from "./ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { createAvatarSvg } from "@/lib/avatar";
import { useRouter } from "next/navigation";
import { isEmailEmployee } from "@/lib/config";
import { NotificationsDropdown } from "./notifications-dropdown";
import { cn } from "@/lib/utils";
import { ScrollArea } from "./ui/scroll-area";
import { useTheme } from "./theme-provider";
import { useToast } from "@/hooks/use-toast";

const navLinks = [
  { href: "/", label: "Início", icon: Home, public: true },
  { href: "/dashboard", label: "Relatos", icon: FileText, public: true },
  { href: "/support", label: "Suporte", icon: LifeBuoy, public: true },
];

const LOCAL_STORAGE_ACCOUNTS_KEY = 'infra_mais_saved_accounts';

interface SavedAccount {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
}

function UserButton({ onLoginClick, scrolled }: { onLoginClick: () => void, scrolled: boolean }) {
  const { user, isUserLoading } = useUser();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const auth = useAuth();
  const router = useRouter();
  const [isSwitchAccountOpen, setIsSwitchAccountOpen] = useState(false);
  const [savedAccounts, setSavedAccounts] = useState<SavedAccount[]>([]);
  const [isSwitching, setIsSwitching] = useState(false);

  const dynamicOffset = scrolled ? 18 : 26;

  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_ACCOUNTS_KEY);
    if (saved) {
      try {
        setSavedAccounts(JSON.parse(saved));
      } catch (e) {
        console.error("Erro ao carregar contas salvas", e);
      }
    }
  }, [isSwitchAccountOpen]);

  useEffect(() => {
    if (user) {
      const saved = localStorage.getItem(LOCAL_STORAGE_ACCOUNTS_KEY);
      let accounts: SavedAccount[] = [];
      if (saved) {
        try {
          accounts = JSON.parse(saved);
        } catch (e) {}
      }

      const currentProfile: SavedAccount = {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || 'Usuário',
        photoURL: user.photoURL || createAvatarSvg(user.email || 'U')
      };

      const exists = accounts.find(a => a.uid === user.uid);
      if (!exists) {
        accounts.unshift(currentProfile);
        localStorage.setItem(LOCAL_STORAGE_ACCOUNTS_KEY, JSON.stringify(accounts.slice(0, 5)));
        setSavedAccounts(accounts);
      }
    }
  }, [user]);

  const handleSwitchAccount = async (account: SavedAccount) => {
    setIsSwitching(true);
    try {
        await signOut(auth);
        setIsSwitchAccountOpen(false);
        router.push(`/report/auth?email=${encodeURIComponent(account.email)}`);
        toast({ title: "Quase lá!", description: `Informe a senha para acessar a conta ${account.displayName}.` });
    } catch (error) {
        console.error("Erro ao trocar conta:", error);
        toast({ title: "Erro na troca", description: "Não foi possível preparar a troca de conta.", variant: "destructive" });
    } finally {
        setIsSwitching(false);
    }
  };

  const handleAddNewAccount = async () => {
    setIsSwitching(true);
    try {
      await signOut(auth);
      setIsSwitchAccountOpen(false);
      router.push('/report/auth');
    } catch (error) {
      console.error("Erro ao sair para adicionar conta:", error);
    } finally {
      setIsSwitching(false);
    }
  };

  const removeAccount = (uid: string) => {
    const updated = savedAccounts.filter(a => a.uid !== uid);
    setSavedAccounts(updated);
    localStorage.setItem(LOCAL_STORAGE_ACCOUNTS_KEY, JSON.stringify(updated));
  };

  if (isUserLoading) {
    return <Button variant="ghost" size="icon" disabled className="animate-pulse" aria-label="Carregando usuário"><User className="h-5 w-5" /></Button>;
  }

  if (user) {
    const avatarSrc = user.photoURL || createAvatarSvg(user.email || user.displayName || 'U');
    const userInitial = (user.email || user.displayName || 'U').charAt(0).toUpperCase();
    const isEmployee = isEmailEmployee(user.email);

    return (
      <>
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full border border-border hover:bg-primary/10 transition-all p-0 focus-visible:ring-0" aria-label="Menu do usuário">
              <Avatar className="h-10 w-10">
                <AvatarImage src={avatarSrc} alt={user.displayName || user.email || 'User'} />
                <AvatarFallback className="bg-primary/10 text-primary font-bold">{userInitial}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            className="w-[300px] rounded-2xl border-border bg-card p-2 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200" 
            align="end" 
            sideOffset={dynamicOffset}
            forceMount
          >
            <div className="flex flex-col items-center p-6 pb-4">
              <Avatar className="h-16 w-16 mb-3 shadow-md border-2 border-background">
                <AvatarImage src={avatarSrc} alt={user.displayName || user.email || 'User'} />
                <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">{userInitial}</AvatarFallback>
              </Avatar>
              <div className="text-center">
                <p className="text-base font-bold text-foreground leading-tight truncate max-w-[240px]">
                  {user.displayName || 'Usuário'}
                </p>
                <p className="text-xs text-muted-foreground mt-1 truncate max-w-[240px]">
                  {user.email}
                </p>
              </div>
            </div>
            
            <DropdownMenuSeparator className="mx-2 bg-border" />
            
            <div className="py-1">
              <DropdownMenuItem asChild className="h-11 rounded-xl cursor-pointer px-3 group">
                <Link href="/minha-conta" className="flex items-center w-full">
                  <User className="mr-3 h-5 w-5 text-muted-foreground group-hover:text-primary" />
                  <span className="font-semibold text-sm">Meu Perfil</span>
                </Link>
              </DropdownMenuItem>

              {!isEmployee && (
                <DropdownMenuItem asChild className="h-11 rounded-xl cursor-pointer px-3 group">
                  <Link href="/minha-conta#meus-relatorios" className="flex items-center w-full">
                    <Briefcase className="mr-3 h-5 w-5 text-muted-foreground group-hover:text-primary" />
                    <span className="font-semibold text-sm">Meus Relatos</span>
                  </Link>
                </DropdownMenuItem>
              )}

              <DropdownMenuSub>
                <DropdownMenuSubTrigger hideChevron className="h-11 rounded-xl cursor-pointer px-3 group">
                  <Palette className="mr-3 h-5 w-5 text-muted-foreground group-hover:text-primary" />
                  <span className="font-semibold text-sm">Tema</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent className="bg-card border-border p-1 rounded-xl shadow-xl min-w-[140px]" sideOffset={10}>
                    <DropdownMenuItem onClick={() => setTheme('light')} className={cn("h-10 rounded-lg cursor-pointer px-3 gap-3", theme === 'light' && "bg-primary/10 text-primary")}>
                      <Sun className="h-4 w-4" />
                      <span className="font-semibold text-sm">Claro</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTheme('dark')} className={cn("h-10 rounded-lg cursor-pointer px-3 gap-3", theme === 'dark' && "bg-primary/10 text-primary")}>
                      <Moon className="h-4 w-4" />
                      <span className="font-semibold text-sm">Escuro</span>
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>

              <DropdownMenuItem 
                onSelect={(e) => { e.preventDefault(); setIsSwitchAccountOpen(true); }}
                className="h-11 rounded-xl cursor-pointer px-3 group"
              >
                <Users className="mr-3 h-5 w-5 text-muted-foreground group-hover:text-primary" />
                <span className="font-semibold text-sm">Trocar de Conta</span>
              </DropdownMenuItem>
            </div>

            <DropdownMenuSeparator className="mx-2 bg-border" />
            
            <div className="py-1">
              <DropdownMenuItem 
                onClick={() => signOut(auth)} 
                className="h-11 rounded-xl cursor-pointer px-3 group text-destructive hover:bg-destructive/10"
              >
                <LogOut className="mr-3 h-5 w-5 text-destructive" />
                <span className="font-semibold text-sm">Sair</span>
              </DropdownMenuItem>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <Dialog open={isSwitchAccountOpen} onOpenChange={setIsSwitchAccountOpen}>
          <DialogContent className="rounded-2xl sm:max-w-md p-6 bg-card border-border">
            <DialogHeader className="mb-4 text-left">
              <DialogTitle className="text-xl font-bold">Gerenciar Contas</DialogTitle>
              <DialogDescription>
                Selecione uma conta salva ou adicione uma nova.
              </DialogDescription>
            </DialogHeader>

            <ScrollArea className="max-h-[300px] pr-2 mb-4">
              <div className="space-y-3">
                {savedAccounts.length > 0 ? (
                  savedAccounts.map((account) => {
                    const isActive = user?.uid === account.uid;
                    return (
                      <div 
                        key={account.uid} 
                        className={cn(
                          "flex items-center justify-between p-3 rounded-xl border transition-all group",
                          isActive 
                            ? "bg-primary/5 border-primary/30 ring-1 ring-primary/20" 
                            : "border-border hover:bg-muted/50 hover:border-primary/20"
                        )}
                      >
                        <button 
                          onClick={() => !isActive && handleSwitchAccount(account)}
                          className={cn(
                            "flex items-center gap-3 flex-grow text-left",
                            isActive ? "cursor-default" : "cursor-pointer"
                          )}
                          disabled={isActive || isSwitching}
                        >
                          <Avatar className="h-11 w-11 shadow-sm">
                            <AvatarImage src={account.photoURL} alt={account.displayName} />
                            <AvatarFallback className="bg-primary/10 text-primary font-bold">
                              {account.displayName.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <p className="text-sm font-bold truncate">{account.displayName}</p>
                                {isActive && <CheckCircle2 className="h-3.5 w-3.5 text-primary" />}
                            </div>
                            <p className="text-xs text-muted-foreground truncate">{account.email}</p>
                          </div>
                        </button>
                        
                        {!isActive && !isSwitching && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                            onClick={(e) => { e.stopPropagation(); removeAccount(account.uid); }}
                            aria-label={`Remover conta ${account.displayName}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <p className="text-center py-8 text-sm text-muted-foreground">Nenhuma conta salva.</p>
                )}
              </div>
            </ScrollArea>

            <Button 
              variant="outline" 
              className="w-full h-12 rounded-xl font-bold border-dashed border-2 hover:bg-primary/5 hover:border-primary/50 text-primary group"
              onClick={handleAddNewAccount}
              disabled={isSwitching}
            >
              <UserPlus className="mr-2 h-5 w-5 transition-transform group-hover:scale-110" />
              Entrar com outra conta
            </Button>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <Button variant="default" className="h-10 rounded-xl px-6 font-bold shadow-md" onClick={onLoginClick}>
      Entrar
    </Button>
  );
}

export function Header() {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user } = useUser();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
    <header className={cn(
      "fixed top-0 left-0 w-full z-[2000] bg-card border-b border-border transition-[height] duration-300",
      mounted && scrolled ? "h-16" : "h-20"
    )}>
      <div className="max-w-[1750px] mx-auto px-4 sm:px-8 h-full flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group" aria-label="Ir para o início">
            <Image
              src="/img/logo1.png"
              alt="Infra Mais Logo"
              width={36}
              height={36}
              className="object-contain"
              priority
            />
            <span className="text-xl font-bold tracking-tight text-foreground">
              Infra <span className="text-primary">Mais</span>
            </span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-5 text-sm font-semibold">
            <div className="flex items-center gap-5">
                {filteredNavLinks.map((link) => (
                    <Link
                    key={link.href}
                    href={link.href}
                    className="text-muted-foreground hover:text-primary transition-colors relative group"
                    >
                    {link.label}
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
                    </Link>
                ))}
            </div>
            
            <div className="h-6 w-px bg-border" aria-hidden="true" />
            
            <div className="flex items-center gap-5">
              {user && !isEmployee && (
                <Button asChild size="sm" className="h-10 rounded-lg font-bold shadow-sm">
                  <Link href="/report/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Relatar
                  </Link>
                </Button>
              )}
              <NotificationsDropdown scrolled={scrolled} />
              <UserButton onLoginClick={() => setIsAuthModalOpen(true)} scrolled={scrolled} />
            </div>
          </nav>

          <div className="md:hidden flex items-center gap-2">
            <NotificationsDropdown scrolled={scrolled} />
            <UserButton onLoginClick={() => setIsAuthModalOpen(true)} scrolled={scrolled} />
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-xl" aria-label="Abrir menu de navegação">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="bg-card border-border" sideOffset={0}>
                <SheetHeader className="text-left mb-8">
                    <SheetTitle className="text-2xl font-bold">Navegação</SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-2">
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
                  {user && !isEmployee && (
                    <Link
                      href="/report/new"
                      className="flex items-center gap-4 p-4 rounded-xl bg-primary text-white text-lg font-bold mt-4"
                      onClick={() => setIsSheetOpen(false)}
                    >
                      <Plus className="h-5 w-5" />
                      Novo Relato
                    </Link>
                  )}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
      </div>

      <Dialog open={isAuthModalOpen} onOpenChange={setIsAuthModalOpen}>
        <DialogContent className="rounded-2xl sm:max-w-md p-8 bg-card border-border">
          <DialogHeader className="mb-6 text-left">
            <DialogTitle className="text-2xl font-bold">Acessar Plataforma</DialogTitle>
            <DialogDescription>
              Seja bem-vindo(a) de volta ao Infra Mais.
            </DialogDescription>
          </DialogHeader>
          <AuthForm 
            onAuthSuccess={handleLoginSuccess} 
            onSignupClick={() => setIsAuthModalOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </header>
  );
}
