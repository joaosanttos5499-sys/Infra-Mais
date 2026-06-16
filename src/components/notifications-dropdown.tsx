"use client";

import { useEffect, useState, useTransition } from "react";
import { Bell, Info, Check, ArrowRight } from "lucide-react";
import { useUser } from "@/firebase";
import { getNotificationsAction, markAsReadAction, markAllAsReadAction } from "@/lib/actions";
import { type Notification } from "@/lib/types";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { ReportTime } from "./report-time";
import { cn } from "@/lib/utils";
import Link from "next/link";

export function NotificationsDropdown({ scrolled = false }: { scrolled?: boolean }) {
  const { user } = useUser();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (user) {
      getNotificationsAction(user.uid).then(result => {
        if (result.success && result.data) {
          setNotifications(result.data);
        }
      });
    }
  }, [user]);

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

  if (!user) return null;

  return (
    <DropdownMenu>
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
        className="w-80 sm:w-96 rounded-2xl shadow-2xl border-border bg-card p-0 overflow-hidden" 
        align="end" 
        sideOffset={10}
      >
        <div className="p-4 bg-muted/30 border-b border-border flex items-center justify-between">
          <h3 className="font-bold text-lg text-foreground tracking-tight">Notificações</h3>
          {unreadCount > 0 && (
            <Button 
                variant="ghost" 
                size="sm" 
                className="h-auto p-0 text-xs font-bold text-primary hover:bg-transparent hover:underline"
                onClick={handleMarkAllAsRead}
            >
                Marcar todas como lidas
            </Button>
          )}
        </div>

        <ScrollArea className="h-[400px]">
          <div className="divide-y divide-border">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                <div className="bg-muted p-4 rounded-full mb-4">
                  <Bell className="h-8 w-8 text-muted-foreground/30" />
                </div>
                <p className="text-sm font-bold text-foreground">Nada por aqui</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
                  Avisaremos você assim que houver atualizações nos seus relatos.
                </p>
              </div>
            ) : (
              notifications.map((notification) => (
                <DropdownMenuItem 
                  key={notification.id} 
                  className={cn(
                      "flex flex-col items-start gap-1 p-4 cursor-pointer focus:bg-muted/50 transition-all border-l-4",
                      notification.isRead ? "border-l-transparent" : "bg-primary/5 border-l-primary"
                  )}
                  onSelect={(e) => {
                      if ((e.target as HTMLElement).closest('a')) return;
                      handleMarkAsRead(notification.id);
                  }}
                >
                  <div className="flex justify-between w-full gap-3">
                    <div className="flex gap-3">
                        <div className={cn(
                            "mt-1.5 h-2 w-2 rounded-full shrink-0",
                            notification.isRead ? "bg-muted" : "bg-primary"
                        )} />
                        <p className={cn(
                            "text-sm leading-relaxed", 
                            !notification.isRead ? "font-bold text-foreground" : "text-muted-foreground"
                        )}>
                            {notification.message}
                        </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between w-full mt-3 pl-5">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                          <ReportTime date={new Date(notification.createdAt)} />
                      </span>
                      <Link 
                          href={`/dashboard#report-${notification.reportId}`}
                          className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1 group/link"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkAsRead(notification.id);
                          }}
                      >
                          Ver detalhes
                          <ArrowRight className="h-3 w-3 group-hover/link:translate-x-0.5 transition-transform" />
                      </Link>
                  </div>
                </DropdownMenuItem>
              ))
            )}
          </div>
        </ScrollArea>
        
        {notifications.length > 0 && (
           <div className="p-3 border-t border-border bg-muted/10 text-center">
              <Link 
                href="/minha-conta#meus-relatorios" 
                className="text-xs font-bold text-muted-foreground hover:text-primary transition-colors"
              >
                Gerenciar todos os relatos
              </Link>
           </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
