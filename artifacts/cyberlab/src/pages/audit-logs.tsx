import { useState } from "react";
import { useListAuditLogs } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function AuditLogs() {
  const [search, setSearch] = useState("");
  const { data: logs, isLoading } = useListAuditLogs();

  const filteredLogs = logs?.filter(log => 
    log.action.toLowerCase().includes(search.toLowerCase()) || 
    log.username?.toLowerCase().includes(search.toLowerCase()) ||
    log.ipAddress.includes(search)
  );

  const getActionColor = (action: string) => {
    if (action.includes('delete') || action.includes('fail')) return 'text-destructive border-destructive/50 bg-destructive/10';
    if (action.includes('create') || action.includes('login')) return 'text-primary border-primary/50 bg-primary/10';
    if (action.includes('update')) return 'text-chart-4 border-chart-4/50 bg-chart-4/10';
    return 'text-muted-foreground border-border bg-muted/20';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-primary flex items-center gap-2">
            <ShieldAlert className="h-6 w-6" />
            SYSTEM_AUDIT_LOGS
          </h2>
          <p className="text-muted-foreground">Immutable record of system activities.</p>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search logs by action, user, or IP..."
            className="pl-8 bg-card/50"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-md border border-border bg-card/50 backdrop-blur overflow-hidden font-mono text-xs">
        <Table>
          <TableHeader>
            <TableRow className="border-border/50 hover:bg-transparent">
              <TableHead>TIMESTAMP</TableHead>
              <TableHead>USER</TableHead>
              <TableHead>ACTION</TableHead>
              <TableHead>RESOURCE</TableHead>
              <TableHead>IP_ADDRESS</TableHead>
              <TableHead>DETAILS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 10 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                </TableRow>
              ))
            ) : filteredLogs?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground text-sm font-sans">
                  NO_LOG_ENTRIES_FOUND
                </TableCell>
              </TableRow>
            ) : (
              filteredLogs?.map((log) => (
                <TableRow key={log.id} className="border-border/50 hover:bg-muted/10">
                  <TableCell className="text-muted-foreground whitespace-nowrap">
                    {new Date(log.createdAt).toISOString().replace('T', ' ').substring(0, 19)}
                  </TableCell>
                  <TableCell>
                    {log.username ? (
                      <span className="font-bold text-foreground">{log.username}</span>
                    ) : (
                      <span className="text-muted-foreground italic">SYSTEM</span>
                    )}
                    <span className="text-[10px] text-muted-foreground ml-1">({log.userId})</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-[9px] uppercase tracking-wider px-1.5 py-0 rounded-sm ${getActionColor(log.action)}`}>
                      {log.action}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{log.resource}</TableCell>
                  <TableCell className={`${log.ipAddress.startsWith('10.') || log.ipAddress.startsWith('192.') || log.ipAddress === '::1' ? 'text-chart-2' : 'text-primary'}`}>
                    {log.ipAddress}
                  </TableCell>
                  <TableCell className="text-muted-foreground max-w-xs truncate" title={log.details}>
                    {log.details}
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
