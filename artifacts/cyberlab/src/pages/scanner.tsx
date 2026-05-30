import { useState } from "react";
import { useListFindings, useCreateFinding, useUpdateFinding, useDeleteFinding, useGetScannerSummary } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import {
  Bug,
  Plus,
  Search,
  Trash2,
  Pencil,
  AlertTriangle,
  ShieldCheck,
  Target,
  BarChart3,
} from "lucide-react";

const OWASP_CATEGORIES = [
  "A01:2021",
  "A02:2021",
  "A03:2021",
  "A04:2021",
  "A05:2021",
  "A06:2021",
  "A07:2021",
  "A08:2021",
  "A09:2021",
  "A10:2021",
];

const SEVERITIES = ["critical", "high", "medium", "low", "informational"];
const STATUSES = ["open", "confirmed", "remediated", "false-positive", "accepted"];

function severityColor(severity: string) {
  switch (severity) {
    case "critical": return "border-red-500/50 bg-red-500/10 text-red-400";
    case "high": return "border-orange-500/50 bg-orange-500/10 text-orange-400";
    case "medium": return "border-yellow-500/50 bg-yellow-500/10 text-yellow-400";
    case "low": return "border-blue-500/50 bg-blue-500/10 text-blue-400";
    default: return "border-muted bg-muted/10 text-muted-foreground";
  }
}

function statusColor(status: string) {
  switch (status) {
    case "confirmed": return "border-red-500/50 bg-red-500/10 text-red-400";
    case "remediated": return "border-primary/50 bg-primary/10 text-primary";
    case "false-positive": return "border-muted bg-muted/20 text-muted-foreground";
    case "accepted": return "border-yellow-500/50 bg-yellow-500/10 text-yellow-400";
    default: return "border-orange-500/50 bg-orange-500/10 text-orange-400";
  }
}

type FindingForm = {
  title: string;
  category: string;
  severity: string;
  description: string;
  affectedEndpoint: string;
  cweId: string;
  cvssScore: string;
  evidence: string;
  remediation: string;
};

const emptyForm: FindingForm = {
  title: "",
  category: "A03:2021",
  severity: "medium",
  description: "",
  affectedEndpoint: "",
  cweId: "",
  cvssScore: "",
  evidence: "",
  remediation: "",
};

export default function Scanner() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterSeverity, setFilterSeverity] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [showDialog, setShowDialog] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<FindingForm>(emptyForm);
  const [editStatus, setEditStatus] = useState<{ id: number; status: string } | null>(null);

  const { data: findings, isLoading } = useListFindings({
    severity: filterSeverity !== "all" ? filterSeverity : undefined,
    status: filterStatus !== "all" ? filterStatus : undefined,
  });
  const { data: summary } = useGetScannerSummary();
  const createFinding = useCreateFinding();
  const updateFinding = useUpdateFinding();
  const deleteFinding = useDeleteFinding();

  const filteredFindings = findings?.filter((f) =>
    !search ||
    f.title.toLowerCase().includes(search.toLowerCase()) ||
    f.affectedEndpoint.toLowerCase().includes(search.toLowerCase()) ||
    (f.cweId ?? "").toLowerCase().includes(search.toLowerCase())
  );

  function openCreate() {
    setEditId(null);
    setForm(emptyForm);
    setShowDialog(true);
  }

  function openEdit(f: NonNullable<typeof findings>[0]) {
    setEditId(f.id);
    setForm({
      title: f.title,
      category: f.category,
      severity: f.severity,
      description: f.description,
      affectedEndpoint: f.affectedEndpoint,
      cweId: f.cweId ?? "",
      cvssScore: f.cvssScore?.toString() ?? "",
      evidence: f.evidence ?? "",
      remediation: f.remediation ?? "",
    });
    setShowDialog(true);
  }

  async function handleSubmit() {
    const payload = {
      ...form,
      cvssScore: form.cvssScore ? parseFloat(form.cvssScore) : undefined,
      cweId: form.cweId || undefined,
      evidence: form.evidence || undefined,
      remediation: form.remediation || undefined,
    };
    try {
      if (editId != null) {
        await updateFinding.mutateAsync({ id: editId, data: payload });
        toast({ title: "FINDING_UPDATED", description: `Finding #${editId} has been updated.` });
      } else {
        await createFinding.mutateAsync({ data: payload });
        toast({ title: "FINDING_REPORTED", description: "New vulnerability finding submitted." });
      }
      setShowDialog(false);
      queryClient.invalidateQueries({ queryKey: ["/findings"] });
      queryClient.invalidateQueries({ queryKey: ["/scanner/summary"] });
    } catch {
      toast({ title: "ERROR", description: "Failed to save finding.", variant: "destructive" });
    }
  }

  async function handleDelete(id: number) {
    try {
      await deleteFinding.mutateAsync({ id });
      toast({ title: "FINDING_DELETED", description: `Finding #${id} removed.` });
      queryClient.invalidateQueries({ queryKey: ["/findings"] });
      queryClient.invalidateQueries({ queryKey: ["/scanner/summary"] });
    } catch {
      toast({ title: "ERROR", description: "Failed to delete finding.", variant: "destructive" });
    }
  }

  async function handleStatusChange(id: number, status: string) {
    try {
      await updateFinding.mutateAsync({ id, data: { status } });
      toast({ title: "STATUS_UPDATED", description: `Finding #${id} → ${status}` });
      queryClient.invalidateQueries({ queryKey: ["/findings"] });
      queryClient.invalidateQueries({ queryKey: ["/scanner/summary"] });
    } catch {
      toast({ title: "ERROR", description: "Failed to update status.", variant: "destructive" });
    } finally {
      setEditStatus(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-primary flex items-center gap-2">
            <Bug className="h-6 w-6" />
            SECURITY_SCANNER
          </h2>
          <p className="text-muted-foreground">Report and track vulnerability findings across the lab environment.</p>
        </div>
        <Button onClick={openCreate} className="bg-primary/90 hover:bg-primary text-primary-foreground font-mono">
          <Plus className="mr-2 h-4 w-4" />
          REPORT_FINDING
        </Button>
      </div>

      {/* Educational alert */}
      <Alert className="border-yellow-500/40 bg-yellow-500/5 text-yellow-400">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle className="font-mono">IDOR_VULNERABILITY_DEMO</AlertTitle>
        <AlertDescription className="text-xs opacity-90 mt-1">
          This module intentionally has no ownership checks. Any authenticated user can view, edit, or delete
          findings submitted by others — demonstrating CWE-284 (Insecure Direct Object Reference).
          In a real platform, findings would be scoped to the user's assigned engagement.
        </AlertDescription>
      </Alert>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "TOTAL", value: summary?.totalFindings ?? 0, icon: Target, color: "text-primary" },
          { label: "CRITICAL", value: summary?.criticalCount ?? 0, icon: AlertTriangle, color: "text-red-400" },
          { label: "HIGH", value: summary?.highCount ?? 0, icon: ShieldCheck, color: "text-orange-400" },
          { label: "OPEN", value: summary?.openCount ?? 0, icon: Bug, color: "text-yellow-400" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-md border border-border bg-card/50 p-4 flex flex-col gap-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{stat.label}</span>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
            <div className={`text-3xl font-bold font-mono ${stat.color}`}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* OWASP Coverage */}
      {summary && summary.owaspCoverage.length > 0 && (
        <div className="rounded-md border border-border bg-card/50 p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <BarChart3 className="h-4 w-4" />
            OWASP_TOP10_COVERAGE
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
            {summary.owaspCoverage.map((item) => (
              <div key={item.category} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground truncate max-w-[200px]">{item.category}</span>
                  <span className={`font-mono font-bold ${item.percentage >= 80 ? "text-primary" : item.percentage >= 40 ? "text-yellow-400" : "text-muted-foreground"}`}>
                    {item.found}/{item.total}
                  </span>
                </div>
                <Progress value={item.percentage} className="h-1.5" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search findings..."
            className="pl-8 bg-card/50"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={filterSeverity} onValueChange={setFilterSeverity}>
          <SelectTrigger className="w-[140px] bg-card/50 font-mono text-xs">
            <SelectValue placeholder="All Severities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severities</SelectItem>
            {SEVERITIES.map((s) => <SelectItem key={s} value={s}>{s.toUpperCase()}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[140px] bg-card/50 font-mono text-xs">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {STATUSES.map((s) => <SelectItem key={s} value={s}>{s.toUpperCase()}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Findings table */}
      <div className="rounded-md border border-border bg-card/50 backdrop-blur overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border/50 hover:bg-transparent">
              <TableHead className="w-12">ID</TableHead>
              <TableHead>TITLE</TableHead>
              <TableHead>CATEGORY</TableHead>
              <TableHead>SEVERITY</TableHead>
              <TableHead>STATUS</TableHead>
              <TableHead>ENDPOINT</TableHead>
              <TableHead>CWE</TableHead>
              <TableHead>CVSS</TableHead>
              <TableHead>REPORTED_BY</TableHead>
              <TableHead className="text-right">ACTIONS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 10 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : filteredFindings?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="h-24 text-center text-muted-foreground">
                  NO_FINDINGS — use REPORT_FINDING to log your first discovery.
                </TableCell>
              </TableRow>
            ) : (
              filteredFindings?.map((f) => (
                <TableRow key={f.id} className="border-border/50 hover:bg-muted/10">
                  <TableCell className="font-mono text-muted-foreground text-xs">#{f.id}</TableCell>
                  <TableCell className="font-semibold max-w-[160px] truncate" title={f.title}>{f.title}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono text-[10px] bg-muted/10 border-border whitespace-nowrap">
                      {f.category}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`font-mono text-[10px] ${severityColor(f.severity)}`}>
                      {f.severity.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <button
                      onClick={() => setEditStatus({ id: f.id, status: f.status })}
                      className="cursor-pointer"
                      title="Click to change status"
                    >
                      <Badge variant="outline" className={`font-mono text-[10px] ${statusColor(f.status)}`}>
                        {f.status.toUpperCase()}
                      </Badge>
                    </button>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground max-w-[120px] truncate" title={f.affectedEndpoint}>
                    {f.affectedEndpoint}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {f.cweId ? (
                      <a
                        href={`https://cwe.mitre.org/data/definitions/${f.cweId.replace("CWE-", "")}.html`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {f.cweId}
                      </a>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {f.cvssScore != null ? (
                      <span className={f.cvssScore >= 9 ? "text-red-400" : f.cvssScore >= 7 ? "text-orange-400" : f.cvssScore >= 4 ? "text-yellow-400" : "text-blue-400"}>
                        {f.cvssScore.toFixed(1)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{f.reportedBy}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-primary" onClick={() => openEdit(f)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-destructive" onClick={() => handleDelete(f.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create/Edit dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-mono text-primary">
              {editId != null ? `EDIT_FINDING_#${editId}` : "REPORT_NEW_FINDING"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs font-mono">TITLE *</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. SQL Injection in login endpoint"
                className="bg-card/50 font-mono text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-mono">OWASP_CATEGORY *</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger className="bg-card/50 font-mono text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {OWASP_CATEGORIES.map((c) => <SelectItem key={c} value={c} className="font-mono text-xs">{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-mono">SEVERITY *</Label>
              <Select value={form.severity} onValueChange={(v) => setForm({ ...form, severity: v })}>
                <SelectTrigger className="bg-card/50 font-mono text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SEVERITIES.map((s) => <SelectItem key={s} value={s} className="font-mono text-xs">{s.toUpperCase()}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs font-mono">AFFECTED_ENDPOINT *</Label>
              <Input
                value={form.affectedEndpoint}
                onChange={(e) => setForm({ ...form, affectedEndpoint: e.target.value })}
                placeholder="e.g. POST /api/auth/login"
                className="bg-card/50 font-mono text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-mono">CWE_ID</Label>
              <Input
                value={form.cweId}
                onChange={(e) => setForm({ ...form, cweId: e.target.value })}
                placeholder="e.g. CWE-89"
                className="bg-card/50 font-mono text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-mono">CVSS_SCORE (0-10)</Label>
              <Input
                type="number"
                min="0"
                max="10"
                step="0.1"
                value={form.cvssScore}
                onChange={(e) => setForm({ ...form, cvssScore: e.target.value })}
                placeholder="e.g. 9.8"
                className="bg-card/50 font-mono text-sm"
              />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs font-mono">DESCRIPTION *</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Describe the vulnerability, how it was discovered, and its impact..."
                className="bg-card/50 font-mono text-sm min-h-[80px]"
              />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs font-mono">EVIDENCE / PROOF_OF_CONCEPT</Label>
              <Textarea
                value={form.evidence}
                onChange={(e) => setForm({ ...form, evidence: e.target.value })}
                placeholder="Paste payload, request/response, or PoC steps..."
                className="bg-card/50 font-mono text-sm min-h-[60px]"
              />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs font-mono">REMEDIATION</Label>
              <Textarea
                value={form.remediation}
                onChange={(e) => setForm({ ...form, remediation: e.target.value })}
                placeholder="Describe how to fix or mitigate this vulnerability..."
                className="bg-card/50 font-mono text-sm min-h-[60px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)} className="font-mono">
              CANCEL
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!form.title || !form.description || !form.affectedEndpoint || createFinding.isPending || updateFinding.isPending}
              className="bg-primary/90 hover:bg-primary text-primary-foreground font-mono"
            >
              {editId != null ? "UPDATE_FINDING" : "SUBMIT_FINDING"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Inline status change dialog */}
      <Dialog open={editStatus !== null} onOpenChange={() => setEditStatus(null)}>
        <DialogContent className="bg-card border-border max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-mono text-primary">UPDATE_STATUS</DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-2">
            <Label className="text-xs font-mono">New status for Finding #{editStatus?.id}</Label>
            <Select
              value={editStatus?.status ?? "open"}
              onValueChange={(v) => setEditStatus((s) => s ? { ...s, status: v } : s)}
            >
              <SelectTrigger className="bg-card/50 font-mono text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => <SelectItem key={s} value={s} className="font-mono text-xs">{s.toUpperCase()}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditStatus(null)} className="font-mono">CANCEL</Button>
            <Button
              onClick={() => editStatus && handleStatusChange(editStatus.id, editStatus.status)}
              className="bg-primary/90 hover:bg-primary font-mono"
            >
              CONFIRM
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
