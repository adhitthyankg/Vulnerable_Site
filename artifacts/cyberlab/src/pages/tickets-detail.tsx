import { useParams } from "wouter";
import { useGetTicket, useUpdateTicket, getGetTicketQueryKey, getListTicketsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, User, Clock, AlertTriangle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function TicketDetail() {
  const { id } = useParams();
  const ticketId = Number(id);
  const { data: ticket, isLoading } = useGetTicket(ticketId, { query: { enabled: !!ticketId, queryKey: getGetTicketQueryKey(ticketId) } });
  
  const updateTicket = useUpdateTicket();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleStatusChange = (status: string) => {
    updateTicket.mutate(
      { id: ticketId, data: { status } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetTicketQueryKey(ticketId) });
          queryClient.invalidateQueries({ queryKey: getListTicketsQueryKey() });
          toast({ title: "STATUS_UPDATED", description: `Ticket marked as ${status}.` });
        }
      }
    );
  };

  const getPriorityColor = (priority: string) => {
    switch(priority) {
      case 'critical': return 'bg-destructive/20 text-destructive border-destructive/50';
      case 'high': return 'bg-orange-500/20 text-orange-500 border-orange-500/50';
      case 'medium': return 'bg-chart-5/20 text-chart-5 border-chart-5/50';
      default: return 'bg-muted/20 text-muted-foreground border-border';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <Skeleton className="h-8 w-1/2" />
        <Card className="bg-card/50">
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!ticket) return <div>RECORD_NOT_FOUND</div>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="font-mono text-muted-foreground">TKT-{ticket.id.toString().padStart(4, '0')}</span>
            <Badge variant="outline" className={`font-mono text-[10px] uppercase ${getPriorityColor(ticket.priority)}`}>
              {ticket.priority} PRIORITY
            </Badge>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-primary">{ticket.title}</h2>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-mono">STATUS:</span>
          <Select defaultValue={ticket.status} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-[160px] font-mono text-xs uppercase bg-card/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="open">OPEN</SelectItem>
              <SelectItem value="in_progress">IN PROGRESS</SelectItem>
              <SelectItem value="resolved">RESOLVED</SelectItem>
              <SelectItem value="closed">CLOSED</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="md:col-span-3 bg-card/50 backdrop-blur border-border/50">
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-primary" />
              INCIDENT_REPORT
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted/10 border border-border/50 p-4 rounded-md font-mono text-sm whitespace-pre-wrap text-foreground/90">
              {ticket.description}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardHeader className="py-4">
              <CardTitle className="text-xs text-muted-foreground">METADATA</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pb-4">
              <div className="space-y-1">
                <span className="text-[10px] text-muted-foreground font-mono uppercase flex items-center gap-1">
                  <User className="h-3 w-3" /> REPORTER
                </span>
                <p className="text-sm font-medium">User {ticket.userId}</p>
              </div>
              
              <div className="space-y-1">
                <span className="text-[10px] text-muted-foreground font-mono uppercase flex items-center gap-1">
                  <User className="h-3 w-3" /> ASSIGNEE
                </span>
                <p className="text-sm font-medium">{ticket.assignedTo ? `Agent ${ticket.assignedTo}` : "UNASSIGNED"}</p>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-muted-foreground font-mono uppercase flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> CREATED
                </span>
                <p className="text-xs font-mono">{new Date(ticket.createdAt).toLocaleString()}</p>
              </div>

              {ticket.resolvedAt && (
                <div className="space-y-1">
                  <span className="text-[10px] text-primary font-mono uppercase flex items-center gap-1">
                    <Clock className="h-3 w-3" /> RESOLVED
                  </span>
                  <p className="text-xs font-mono">{new Date(ticket.resolvedAt).toLocaleString()}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
