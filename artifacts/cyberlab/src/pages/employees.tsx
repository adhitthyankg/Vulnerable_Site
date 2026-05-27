import { useState } from "react";
import { useListEmployees } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function Employees() {
  const [search, setSearch] = useState("");
  const { data: employees, isLoading } = useListEmployees({ search });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-primary">PERSONNEL_DIRECTORY</h2>
          <p className="text-muted-foreground">Internal corporate directory (Classification: CONFIDENTIAL).</p>
        </div>
      </div>

      <Alert variant="destructive" className="border-destructive/50 bg-destructive/10 text-destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>SECURITY_WARNING</AlertTitle>
        <AlertDescription className="text-xs opacity-90 mt-1">
          This endpoint exposes sensitive PII and compensation data. Intended for administrative use only.
        </AlertDescription>
      </Alert>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search personnel..."
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
              <TableHead>EMP_ID</TableHead>
              <TableHead>NAME</TableHead>
              <TableHead>ROLE</TableHead>
              <TableHead>DEPARTMENT</TableHead>
              <TableHead>EMAIL</TableHead>
              <TableHead className="text-right text-destructive">COMPENSATION</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : employees?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  NO_PERSONNEL_MATCHES
                </TableCell>
              </TableRow>
            ) : (
              employees?.map((employee) => (
                <TableRow key={employee.id} className="border-border/50">
                  <TableCell className="font-mono text-muted-foreground">E-{employee.id.toString().padStart(4, '0')}</TableCell>
                  <TableCell className="font-bold">{employee.name}</TableCell>
                  <TableCell className="text-xs">{employee.role}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono text-[10px] bg-muted/20 border-border">
                      {employee.department.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{employee.email}</TableCell>
                  <TableCell className="text-right font-mono text-destructive font-bold">
                    ${employee.salary.toLocaleString()}
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
