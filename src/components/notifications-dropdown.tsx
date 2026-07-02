
"use client";

import { useEffect, useState, useTransition } from "react";
import { Bell, Info, Check, ArrowRight, MessageSquare, Clock, FileText, CheckCircle2, TrafficCone, Construction, Wrench, Edit, Trash2, Flag } from "lucide-react";
import { useUser } from "@/firebase";
import { getNotificationsAction, markAsReadAction, markAllAsReadAction } from "@/lib/actions";
import { type Notification, type NotificationType } from "@/lib/types";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { ReportTime } from "./report-time";
import { cn } from "@/lib/utils";
import Link from "next/link";

const notificationIcons: Record<NotificationType, any> = {
    SENT: FileText,
    APPROVED: CheckCircle2,
    PENDING: TrafficCone,
    IN_PROGRESS: Wrench,
    RESOLVED: Check,
    EDITED: Edit,
    EXCLUDED: Trash2,
    COMPLAINT: Flag,
};

const notificationColors: Record<NotificationType, string> = {
    SENT: "text-blue-500 bg-blue-50",
    APPROVED: "text-emerald-500 bg-emerald-50",
    PENDING: "text-amber-500 bg-amber-50",
    IN_PROGRESS: "text-primary bg-primary/10",
    RESOLVED: "text-emerald-600 bg-emerald-100",
    EDITED: "text-indigo-500 bg-indigo-50",
    EXCLUDED: "text-destructive bg-destructive/10",
    COMPLAINT: "text-orange-600 bg-orange-50",
};

export function NotificationsDropdown({ scrolled = false }: { scrolled?: boolean }) {
  const { user } = useUser();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isPending, startTransition] = useTransition();

  const dynamicOffset = scrolled ? 22 : 30;

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
        className="w-[340px] sm:w-[420px] rounded-2xl shadow-2xl border-border bg-card p-0 overflow-hidden" 
        align="end" 
        sideOffset={dynamicOffset}
      >
        <div className="p-4 bg-muted/30 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary" />
            <h3 className="font-bold text-sm text-foreground tracking-tight uppercase">Minhas Mensagens</h3>
          </div>
          {unreadCount > 0 && (
            <Button 
                variant="ghost" 
                size="sm" 
                className="h-auto p-0 text-[10px] font-bold text-primary hover:bg-transparent hover:underline uppercase tracking-tighter"
                onClick={handleMarkAllAsRead}
            >
                Marcar todas como lidas
            </Button>
          )}
        </div>

        <ScrollArea className="h-[450px]">
          <div className="divide-y divide-border">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center px-8">
                <div className="bg-muted p-5 rounded-full mb-4">
                  <Bell className="h-10 w-10 text-muted-foreground/30" />
                </div>
                <p className="text-base font-bold text-foreground">Nada por aqui</p>
                <p className="text-xs text-muted-foreground mt-2 max-w-[240px] leading-relaxed">
                  Avisaremos você assim que houver atualizações nos seus relatos.
                </p>
              </div>
            ) : (
              notifications.map((notification) => {
                const Icon = notificationIcons[notification.type] || Info;
                const colorClass = notificationColors[notification.type] || "text-muted-foreground bg-muted";

                return (
                  <DropdownMenuItem 
                    key={notification.id} 
                    className={cn(
                        "flex flex-col items-start gap-1 p-5 cursor-pointer focus:bg-muted/50 transition-all border-l-4",
                        notification.isRead ? "border-l-transparent" : "bg-primary/5 border-l-primary"
                    )}
                    onSelect={(e) => {
                        if ((e.target as HTMLElement).closest('a')) return;
                        handleMarkAsRead(notification.id);
                    }}
                  >
                    <div className="flex w-full gap-4">
                      <div className={cn(
                        "h-11 w-11 rounded-xl flex items-center justify-center shrink-0 border border-transparent shadow-sm",
                        colorClass
                      )}>
                        <Icon className="h-5 w-5" />
                      </div>
                      
                      <div className="flex flex-col gap-1 min-w-0">
                          <h4 className={cn(
                              "text-sm font-bold leading-none mb-1",
                              !notification.isRead ? "text-foreground" : "text-muted-foreground"
                          )}>
                              {notification.title}
                          </h4>
                          <p className={cn(
                              "text-xs leading-relaxed whitespace-pre-wrap", 
                              !notification.isRead ? "text-foreground/80" : "text-muted-foreground/70"
                          )}>
                              {notification.message}
                          </p>
                          
                          <div className="flex items-center gap-2 mt-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                            <Clock className="h-3.5 w-3.5" />
                            <ReportTime date={new Date(notification.createdAt)} />
                          </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-end w-full mt-4">
                        <Link 
                            href="/minha-conta#meus-relatorios"
                            className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1.5 group/link bg-primary/5 px-3 py-1.5 rounded-lg border border-primary/10"
                            onClick={() => {
                              handleMarkAsRead(notification.id);
                            }}
                        >
                            Ver relato relacionado
                            <ArrowRight className="h-3.5 w-3.5 group-hover/link:translate-x-1 transition-transform" />
                        </Link>
                    </div>
                  </DropdownMenuItem>
                );
              })
            )}
          </div>
        </ScrollArea>
        
        {notifications.length > 0 && (
           <div className="p-4 border-t border-border bg-muted/10 text-center">
              <Link 
                href="/minha-conta#meus-relatorios" 
                className="text-[10px] font-bold text-muted-foreground hover:text-primary transition-colors uppercase tracking-[0.1em]"
              >
                Gerenciar todos os meus relatos
              </Link>
           </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
