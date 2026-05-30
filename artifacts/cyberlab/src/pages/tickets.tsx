import { useState } from "react";
import { useListTickets, useCreateTicket, getListTicketsQueryKey } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const ticketSchema = z.object({
  title: z.string().min(5, "Title requires minimum 5 characters"),
  description: z.string().min(10, "Description requires minimum 10 characters"),
  priority: z.enum(["low", "medium", "high", "critical"]),
});

export default function Tickets() {
  const { data: tickets, isLoading } = useListTickets();
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const createTicket = useCreateTicket();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof ticketSchema>>({
    resolver: zodResolver(ticketSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: "medium",
    },
  });

  const filteredTickets = tickets?.filter(ticket => 
    ticket.title.toLowerCase().includes(search.toLowerCase()) || 
    ticket.id.toString().includes(search)
  );

  const onSubmit = (values: z.infer<typeof ticketSchema>) => {
    createTicket.mutate(
      { data: values },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListTicketsQueryKey() });
          setIsOpen(false);
          form.reset();
          toast({ title: "TICKET_CREATED", description: "Support request registered." });
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

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'open': return 'border-chart-4 text-chart-4';
      case 'in_progress': return 'border-chart-2 text-chart-2';
      case 'resolved': return 'border-primary text-primary';
      default: return 'border-border text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-primary">HELPDESK_TICKETS</h2>
          <p className="text-muted-foreground">System issues and support requests.</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              NEW_TICKET
            </Button>
          </DialogTrigger>
          <DialogContent className="border-border bg-card/95 backdrop-blur font-mono">
            <DialogHeader>
              <DialogTitle className="text-primary tracking-wider">INITIALIZE_SUPPORT_REQUEST</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SUBJECT</FormLabel>
                      <FormControl>
                        <Input placeholder="Brief description..." className="bg-background" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>PRIORITY_LEVEL</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-background">
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="low">LOW</SelectItem>
                          <SelectItem value="medium">MEDIUM</SelectItem>
                          <SelectItem value="high">HIGH</SelectItem>
                          <SelectItem value="critical">CRITICAL</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>INCIDENT_DETAILS</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Provide reproduction steps..." className="bg-background min-h-[100px]" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={createTicket.isPending}>
                  {createTicket.isPending ? "TRANSMITTING..." : "SUBMIT_TICKET"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tickets by ID or title..."
            className="pl-8 bg-card/50"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-md border border-border bg-card/50 backdrop-blur overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border/50 hover:bg-transparent">
              <TableHead>ID</TableHead>
              <TableHead>SUBJECT</TableHead>
              <TableHead>PRIORITY</TableHead>
              <TableHead>STATUS</TableHead>
              <TableHead>CREATED</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                </TableRow>
              ))
            ) : filteredTickets?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  NO_RECORDS_FOUND
                </TableCell>
              </TableRow>
            ) : (
              filteredTickets?.map((ticket) => (
                <TableRow key={ticket.id} className="border-border/50 hover:bg-muted/10 transition-colors">
                  <TableCell className="font-mono text-muted-foreground">
                    <Link href={`/tickets/${ticket.id}`} className="hover:text-primary">
                      TKT-{ticket.id.toString().padStart(4, '0')}
                    </Link>
                  </TableCell>
                  <TableCell className="font-medium">
                    <Link href={`/tickets/${ticket.id}`} className="hover:underline">
                      {ticket.title}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`font-mono text-[10px] uppercase ${getPriorityColor(ticket.priority)}`}>
                      {ticket.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`font-mono text-[10px] uppercase ${getStatusColor(ticket.status)}`}>
                      {ticket.status.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs font-mono">
                    {new Date(ticket.createdAt).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
