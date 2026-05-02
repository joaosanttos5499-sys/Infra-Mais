
"use client";

import { useEffect, useState, useTransition } from "react";
import { Bell, Info, Check } from "lucide-react";
import { useUser } from "@/firebase";
import { getNotificationsAction, markAsReadAction, markAllAsReadAction } from "@/lib/actions";
import { type Notification } from "@/lib/types";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { ReportTime } from "./report-time";
import { cn } from "@/lib/utils";
import Link from "next/link";

export function NotificationsDropdown() {
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
        <Button variant="ghost" size="icon" className="relative h-8 w-8 rounded-full">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
          <span className="sr-only">Notificações</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notificações</span>
          {unreadCount > 0 && (
            <Button 
                variant="ghost" 
                size="sm" 
                className="h-auto p-0 text-xs font-normal text-primary"
                onClick={handleMarkAllAsRead}
            >
                Marcar todas como lidas
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ScrollArea className="h-80">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Info className="h-8 w-8 text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">Nenhuma notificação por enquanto.</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <DropdownMenuItem 
                key={notification.id} 
                className={cn(
                    "flex flex-col items-start gap-1 p-4 cursor-default focus:bg-accent/50",
                    !notification.isRead && "bg-primary/5 border-l-4 border-l-primary"
                )}
              >
                <div className="flex justify-between w-full gap-2">
                    <p className={cn("text-xs leading-relaxed", !notification.isRead ? "font-semibold text-foreground" : "text-muted-foreground")}>
                    {notification.message}
                    </p>
                    {!notification.isRead && (
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-5 w-5 shrink-0" 
                            onClick={() => handleMarkAsRead(notification.id)}
                        >
                            <Check className="h-3 w-3" />
                            <span className="sr-only">Lida</span>
                        </Button>
                    )}
                </div>
                <div className="flex items-center justify-between w-full mt-1">
                    <span className="text-[10px] text-muted-foreground">
                        <ReportTime date={new Date(notification.createdAt)} />
                    </span>
                    <Link 
                        href={`/dashboard#report-${notification.reportId}`}
                        className="text-[10px] font-medium text-primary hover:underline"
                        onClick={() => handleMarkAsRead(notification.id)}
                    >
                        Ver relato
                    </Link>
                </div>
              </DropdownMenuItem>
            ))
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
