import { useListOrders } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function Orders() {
  const { data: orders, isLoading } = useListOrders();
  const [search, setSearch] = useState("");

  const filteredOrders = orders?.filter(order => 
    order.id.toString().includes(search) || 
    order.status.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-primary">ORDER_MANAGEMENT</h2>
          <p className="text-muted-foreground">View and manage hardware/software procurement.</p>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search orders by ID or status..."
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
              <TableHead>ORDER_ID</TableHead>
              <TableHead>USER_ID</TableHead>
              <TableHead>ITEMS</TableHead>
              <TableHead>TOTAL</TableHead>
              <TableHead>STATUS</TableHead>
              <TableHead>TIMESTAMP</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                </TableRow>
              ))
            ) : filteredOrders?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  NO_ORDERS_FOUND
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders?.map((order) => (
                <TableRow key={order.id} className="border-border/50">
                  <TableCell className="font-mono text-muted-foreground">#{order.id}</TableCell>
                  <TableCell className="font-mono">{order.userId}</TableCell>
                  <TableCell className="text-xs">
                    {order.items.map(item => `${item.quantity}x ${item.productName}`).join(", ")}
                  </TableCell>
                  <TableCell className="font-mono text-primary font-bold">
                    ${order.total.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className={
                        order.status === 'completed' ? 'text-primary border-primary' : 
                        order.status === 'pending' ? 'text-chart-4 border-chart-4' : 
                        'text-muted-foreground border-muted'
                      }
                    >
                      {order.status.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs font-mono">
                    {new Date(order.createdAt).toLocaleString()}
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
