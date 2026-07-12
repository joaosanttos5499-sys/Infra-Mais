"use client";

import { useEffect, useState, useTransition, useCallback } from "react";
import { Bell, Info, Check, ArrowRight, MessageSquare, Clock, FileText, CheckCircle2, TrafficCone, Wrench, Edit, Trash2, Flag, Loader2 } from "lucide-react";
import { useUser } from "@/firebase";
import { markAsReadAction, markAllAsReadAction } from "@/lib/actions";
import { getNotifications } from "@/lib/data";
import { type Notification } from "@/lib/types";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { ReportTime } from "./report-time";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function NotificationsDropdown({ scrolled = false }: { scrolled?: boolean }) {
  const { user } = useUser();
  const pathname = usePathname();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  const dynamicOffset = scrolled ? 22 : 30;

  const fetchNotificationsData = useCallback(async () => {
    if (user) {
      setIsLoading(true);
      try {
        const data = await getNotifications(user.uid);
        setNotifications(data);
      } catch (error) {
        console.error("Erro ao carregar notificações no cliente:", error);
      } finally {
        setIsLoading(false);
      }
    }
  }, [user]);

  useEffect(() => {
    fetchNotificationsData();
  }, [fetchNotificationsData, pathname]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleMarkAsRead = (id: string) => {
    startTransition(async () => {
        await markAsReadAction(id);
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    });
  };

  const handleMarkAllAsRead = () => {
    if (!user) return;
    startTransition(async () => {
        await markAllAsReadAction(user.uid);
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    });
  };

  const handleOpenChange = (open: boolean) => {
    if (open) {
      fetchNotificationsData();
    }
  };

  if (!user) return null;

  return (
    <DropdownMenu onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-10 w-10 rounded-xl hover:bg-primary/10 transition-colors group">
          <Bell className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-primary" />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground ring-2 ring-background animate-in zoom-in">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
          <span className="sr-only">Notificações</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        className="w-[calc(100vw-32px)] sm:w-[380px] md:w-[400px] rounded-2xl shadow-2xl border-border bg-card p-0 overflow-hidden" 
        align="end" 
        sideOffset={dynamicOffset}
        collisionPadding={16}
      >
        <div className="p-5 bg-muted/30 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="bg-primary/10 p-2 rounded-lg">
                <MessageSquare className="h-4 w-4 text-primary" />
            </div>
            <h3 className="font-black text-xs text-foreground tracking-widest uppercase">Central de Avisos</h3>
          </div>
          {unreadCount > 0 && (
            <Button 
                variant="ghost" 
                size="sm" 
                className="h-auto p-0 text-[10px] font-bold text-primary hover:bg-transparent hover:underline uppercase tracking-widest"
                onClick={handleMarkAllAsRead}
            >
                Marcar tudo como lido
            </Button>
          )}
        </div>

        <ScrollArea className="max-h-[min(400px,60vh)] overflow-y-auto">
          <div className="p-4 space-y-4">
            {isLoading && notifications.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary opacity-50" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center px-8">
                <div className="bg-muted p-6 rounded-full mb-5 shadow-inner">
                  <Bell className="h-10 w-10 text-muted-foreground/30" />
                </div>
                <p className="text-base font-bold text-foreground">Sua caixa está vazia</p>
                <p className="text-xs text-muted-foreground mt-2 max-w-[240px] leading-relaxed font-medium">
                  Você receberá atualizações aqui assim que seus relatos forem analisados.
                </p>
              </div>
            ) : (
              notifications.map((notification) => {
                return (
                  <DropdownMenuItem 
                    key={notification.id} 
                    className={cn(
                        "flex flex-col items-start gap-0 p-0 cursor-pointer focus:bg-transparent bg-transparent transition-all group/item outline-none select-none",
                    )}
                    onSelect={(e) => {
                        if ((e.target as HTMLElement).closest('a')) return;
                        handleMarkAsRead(notification.id);
                    }}
                  >
                    <div className={cn(
                        "w-full rounded-2xl border transition-all duration-300 p-4 relative overflow-hidden",
                        notification.isRead 
                            ? "bg-card border-border hover:border-primary/30" 
                            : "bg-primary/5 border-primary/20 shadow-md"
                    )}>
                      <div className={cn(
                          "absolute left-0 top-0 bottom-0 w-1.5",
                          notification.isRead ? "bg-transparent" : "bg-primary"
                      )} />

                      <div className="flex flex-col gap-2 min-w-0 flex-grow">
                          <div className="flex justify-between items-start gap-2">
                              <h4 className={cn(
                                  "text-sm font-bold leading-tight",
                                  !notification.isRead ? "text-foreground" : "text-muted-foreground"
                              )}>
                                  {notification.title}
                              </h4>
                              {!notification.isRead && (
                                  <div className="h-2.5 w-2.5 rounded-full bg-primary animate-pulse shrink-0 mt-1" />
                              )}
                          </div>
                          
                          <p className={cn(
                              "text-xs leading-relaxed font-medium whitespace-pre-wrap", 
                              !notification.isRead ? "text-foreground" : "text-muted-foreground"
                          )}>
                              {notification.message}
                          </p>
                          
                          <div className="flex items-center justify-between gap-2 mt-4 pt-2 border-t border-border/40">
                              <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                  <Clock className="h-3.5 w-3.5" />
                                  <ReportTime date={new Date(notification.createdAt)} />
                              </div>
                              
                              <Link 
                                  href="/minha-conta#meus-relatorios"
                                  className="text-[10px] font-black text-primary hover:text-primary/80 flex items-center gap-1.5 group/link transition-colors bg-primary/10 px-3 py-1.5 rounded-lg uppercase tracking-tighter"
                                  onClick={() => {
                                      handleMarkAsRead(notification.id);
                                  }}
                              >
                                  Relato Relacionado
                                  <ArrowRight className="h-3 w-3 group-hover/link:translate-x-1 transition-transform" />
                              </Link>
                          </div>
                      </div>
                    </div>
                  </DropdownMenuItem>
                );
              })
            )}
          </div>
        </ScrollArea>
        
        {notifications.length > 0 && (
           <div className="p-4 border-t border-border bg-muted/5 text-center">
              <Link 
                href="/minha-conta#meus-relatorios" 
                className="text-[10px] font-black text-muted-foreground hover:text-primary transition-colors uppercase tracking-[0.2em]"
              >
                Gerenciar Histórico Completo
              </Link>
           </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}