import { useListApiKeys, useCreateApiKey, useDeleteApiKey, getListApiKeysQueryKey } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Key, Trash2, Copy, Eye, Plus } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const keySchema = z.object({
  name: z.string().min(3, "Identifier must be at least 3 characters"),
});

export default function ApiKeys() {
  const { data: apiKeys, isLoading } = useListApiKeys();
  const createKey = useCreateApiKey();
  const deleteKey = useDeleteApiKey();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);

  const form = useForm<z.infer<typeof keySchema>>({
    resolver: zodResolver(keySchema),
    defaultValues: { name: "" },
  });

  const onSubmit = (values: z.infer<typeof keySchema>) => {
    createKey.mutate(
      { data: values },
      {
        onSuccess: (res) => {
          queryClient.invalidateQueries({ queryKey: getListApiKeysQueryKey() });
          setNewlyCreatedKey(res.key || "UNKNOWN_ERROR_NO_KEY");
          form.reset();
        }
      }
    );
  };

  const handleRevoke = (id: number) => {
    if (confirm("Revoke this credential? Any systems using it will lose access immediately.")) {
      deleteKey.mutate(
        { id },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListApiKeysQueryKey() });
            toast({ title: "CREDENTIAL_REVOKED", description: "API key has been deactivated and removed." });
          }
        }
      );
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "COPIED_TO_CLIPBOARD", description: "Credential copied securely." });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-primary">API_CREDENTIALS</h2>
          <p className="text-muted-foreground">Manage programmatic access tokens.</p>
        </div>
        <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if(!open) setNewlyCreatedKey(null); }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              GENERATE_KEY
            </Button>
          </DialogTrigger>
          <DialogContent className="border-border bg-card/95 backdrop-blur font-mono">
            <DialogHeader>
              <DialogTitle className="text-primary tracking-wider">PROVISION_NEW_CREDENTIAL</DialogTitle>
            </DialogHeader>
            
            {newlyCreatedKey ? (
              <div className="space-y-4 pt-4">
                <Alert className="border-primary/50 bg-primary/10">
                  <AlertDescription className="text-primary font-bold">
                    WARNING: Copy this key now. It will not be shown again.
                  </AlertDescription>
                </Alert>
                <div className="flex items-center gap-2 bg-black p-3 rounded border border-border">
                  <code className="text-primary break-all flex-1">{newlyCreatedKey}</code>
                  <Button variant="ghost" size="icon" onClick={() => copyToClipboard(newlyCreatedKey)} className="shrink-0 text-muted-foreground hover:text-primary">
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <Button className="w-full" onClick={() => { setIsOpen(false); setNewlyCreatedKey(null); }}>
                  ACKNOWLEDGE_AND_CLOSE
                </Button>
              </div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>IDENTIFIER</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Production CI Server" className="bg-background" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={createKey.isPending}>
                    {createKey.isPending ? "GENERATING..." : "PROVISION_KEY"}
                  </Button>
                </form>
              </Form>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border border-border bg-card/50 backdrop-blur overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border/50 hover:bg-transparent">
              <TableHead>IDENTIFIER</TableHead>
              <TableHead>PREFIX</TableHead>
              <TableHead>CREATED</TableHead>
              <TableHead>LAST_USED</TableHead>
              <TableHead className="text-right">ACTIONS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : apiKeys?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  NO_CREDENTIALS_FOUND
                </TableCell>
              </TableRow>
            ) : (
              apiKeys?.map((apiKey) => (
                <TableRow key={apiKey.id} className="border-border/50">
                  <TableCell className="font-medium flex items-center gap-2">
                    <Key className="h-3 w-3 text-muted-foreground" />
                    {apiKey.name}
                  </TableCell>
                  <TableCell className="font-mono text-muted-foreground">{apiKey.keyPrefix}****************</TableCell>
                  <TableCell className="text-muted-foreground text-xs font-mono">
                    {new Date(apiKey.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs font-mono">
                    {apiKey.lastUsed ? new Date(apiKey.lastUsed).toLocaleString() : "NEVER"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleRevoke(apiKey.id)} className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10">
                      <Trash2 className="h-4 w-4" />
                    </Button>
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
