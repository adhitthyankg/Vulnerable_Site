import { useListNotifications, useMarkNotificationRead, getListNotificationsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell, ShieldAlert, Info, CheckCircle2, Check } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export default function Notifications() {
  const { data: notifications, isLoading } = useListNotifications();
  const markRead = useMarkNotificationRead();
  const queryClient = useQueryClient();

  const handleMarkRead = (id: number) => {
    markRead.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey() });
        }
      }
    );
  };

  const getIcon = (type: string) => {
    switch(type) {
      case 'security': return <ShieldAlert className="h-5 w-5 text-destructive" />;
      case 'system': return <Info className="h-5 w-5 text-chart-2" />;
      case 'success': return <CheckCircle2 className="h-5 w-5 text-primary" />;
      default: return <Bell className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const unreadCount = notifications?.filter(n => !n.isRead).length || 0;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-primary flex items-center gap-2">
            SYSTEM_ALERTS
            {unreadCount > 0 && (
              <span className="flex items-center justify-center bg-destructive text-destructive-foreground text-xs font-bold rounded-full h-5 w-5">
                {unreadCount}
              </span>
            )}
          </h2>
          <p className="text-muted-foreground">Important system notifications and security alerts.</p>
        </div>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="bg-card/50 backdrop-blur border-border/50">
              <CardContent className="p-4 flex gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : notifications?.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground border border-border bg-card/50 backdrop-blur rounded-lg">
            NO_ACTIVE_ALERTS
          </div>
        ) : (
          notifications?.map((notification) => (
            <Card 
              key={notification.id} 
              className={`backdrop-blur transition-colors ${
                notification.isRead 
                  ? 'bg-card/30 border-border/30 opacity-70' 
                  : 'bg-card/80 border-border shadow-sm'
              }`}
            >
              <CardContent className="p-4 flex gap-4 items-start">
                <div className={`p-2 rounded-full ${notification.isRead ? 'bg-muted/10' : 'bg-muted/30'}`}>
                  {getIcon(notification.type)}
                </div>
                <div className="flex-1 grid gap-1">
                  <div className="flex items-center justify-between">
                    <h4 className={`font-bold ${notification.isRead ? 'text-muted-foreground' : 'text-foreground'}`}>
                      {notification.title}
                    </h4>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {new Date(notification.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {notification.message}
                  </p>
                </div>
                {!notification.isRead && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleMarkRead(notification.id)}
                    className="h-8 px-2 text-xs border border-primary/20 text-primary hover:bg-primary/10"
                    disabled={markRead.isPending}
                  >
                    <Check className="h-3 w-3 mr-1" /> ACKNOWLEDGE
                  </Button>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
