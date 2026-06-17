import { useState, useRef, useEffect } from "react";
import { Bell, Check, X, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useNotifications } from "@/hooks/useNotifications";
import { useMarkAllNotificationsRead } from "@/hooks/useMarkAllNotificationsRead";
import { useDeleteNotification } from "@/hooks/useDeleteNotification";
import { cn } from "@/lib/utils";

const BellIcon = ({ className }: { className?: string }) => (
  <Bell className={cn("h-5 w-5", className)} />
);

const CheckIcon = ({ className }: { className?: string }) => (
  <Check className={cn("h-4 w-4", className)} />
);

const XIcon = ({ className }: { className?: string }) => (
  <X className={cn("h-4 w-4", className)} />
);

const BanIcon = ({ className }: { className?: string }) => (
  <Ban className={cn("h-4 w-4", className)} />
);

const IconMap = {
  check: CheckIcon,
  x: XIcon,
  ban: BanIcon,
  bell: BellIcon,
};

function NotificationItem({
  notification,
  relativeTime,
  onDelete,
}: {
  notification: ReturnType<typeof useNotifications>["notifications"] extends (infer T)[] ? T : never;
  relativeTime: string;
  onDelete: (id: string) => void;
}) {
  const [isDeleting, setIsDeleting] = useState(false);
  const IconComponent = IconMap[notification.icon];

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleting(true);
    await onDelete(notification.id);
    setIsDeleting(false);
  };

  return (
    <div
      className={cn(
        "group flex items-start gap-3 px-3 py-3 transition-colors hover:bg-muted/50 rounded-lg",
        !notification.is_read && "bg-muted/30",
        isDeleting && "opacity-50 pointer-events-none"
      )}
    >
      <div
        className={cn(
          "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted",
          notification.iconColor
        )}
      >
        <IconComponent />
      </div>
      <div className="min-w-0 flex-1">
        <p className={cn("text-sm", !notification.is_read && "font-medium")}>
          {notification.message}
        </p>
        {notification.owner_message && (
          <p className="mt-1 text-xs text-muted-foreground italic border-l-2 border-muted-foreground/30 pl-2">
            {notification.owner_message}
          </p>
        )}
        <p className="mt-1 text-xs text-muted-foreground">{relativeTime}</p>
      </div>
      <div className="flex items-center gap-1">
        {!notification.is_read && (
          <div className="h-2 w-2 shrink-0 rounded-full bg-blue-500" />
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={handleDelete}
          disabled={isDeleting}
        >
          <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
        </Button>
      </div>
    </div>
  );
}

export function NotificationBell() {
  const { notifications, unreadCount, isLoading, refetch, getRelativeTime } =
    useNotifications();
  const { markAllRead } = useMarkAllNotificationsRead();
  const { deleteNotification } = useDeleteNotification();
  const [open, setOpen] = useState(false);
  const prevUnreadRef = useRef(unreadCount);

  // Refetch when popover opens to get fresh data
  useEffect(() => {
    if (open) {
      refetch();
    }
  }, [open]);

  useEffect(() => {
    prevUnreadRef.current = unreadCount;
  }, [unreadCount]);

  const handleMarkAllRead = async () => {
    await markAllRead();
    refetch();
  };

  const handleDelete = async (id: string) => {
    await deleteNotification(id);
    refetch();
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <BellIcon className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="font-semibold text-sm">Notificaciones</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
              onClick={handleMarkAllRead}
            >
              Marcar todas como leídas
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Cargando...
          </div>
        ) : !notifications || notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 px-4">
            <div className="rounded-full bg-muted p-3">
              <BellIcon className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              No tienes notificaciones
            </p>
          </div>
        ) : (
          <ScrollArea className="max-h-96">
            <div className="flex flex-col gap-1 p-2">
              {notifications.map((n) => (
                <NotificationItem
                  key={n.id}
                  notification={n}
                  relativeTime={getRelativeTime(n.created_at)}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </ScrollArea>
        )}
      </PopoverContent>
    </Popover>
  );
}
