import { useListUploads, useCreateUpload, useDeleteUpload, getListUploadsQueryKey } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FileCode, Trash2, UploadCloud, File as FileIcon, FileArchive, Image as ImageIcon } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";

export default function Uploads() {
  const { data: uploads, isLoading } = useListUploads();
  const createUpload = useCreateUpload();
  const deleteUpload = useDeleteUpload();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleSimulateUpload = () => {
    const exts = ['.pdf', '.exe', '.zip', '.sh', '.jpg', '.php'];
    const names = ['report', 'update', 'backup', 'script', 'profile', 'shell'];
    const ext = exts[Math.floor(Math.random() * exts.length)];
    const name = names[Math.floor(Math.random() * names.length)];
    
    createUpload.mutate(
      { 
        data: {
          filename: `${name}_${Date.now()}${ext}`,
          originalName: `${name}${ext}`,
          mimeType: ext === '.jpg' ? 'image/jpeg' : 'application/octet-stream',
          size: Math.floor(Math.random() * 5000000) + 1024
        } 
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListUploadsQueryKey() });
          toast({ title: "UPLOAD_COMPLETE", description: "File successfully stored in repository." });
        }
      }
    );
  };

  const handleDelete = (id: number) => {
    deleteUpload.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListUploadsQueryKey() });
          toast({ title: "FILE_DELETED", description: "Record purged from system." });
        }
      }
    );
  };

  const getFileIcon = (mimeType: string, filename: string) => {
    if (mimeType.includes('image')) return <ImageIcon className="h-4 w-4 text-blue-400" />;
    if (filename.endsWith('.zip') || filename.endsWith('.tar')) return <FileArchive className="h-4 w-4 text-orange-400" />;
    if (filename.endsWith('.exe') || filename.endsWith('.sh') || filename.endsWith('.php')) return <FileCode className="h-4 w-4 text-destructive" />;
    return <FileIcon className="h-4 w-4 text-primary" />;
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-primary">SECURE_UPLOADS</h2>
          <p className="text-muted-foreground">File repository and asset management.</p>
        </div>
      </div>

      <Card className="bg-card/50 backdrop-blur border-border/50 border-dashed">
        <CardContent className="p-8 flex flex-col items-center justify-center text-center space-y-4">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <UploadCloud className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h3 className="font-bold">UPLOAD_INTERFACE</h3>
            <p className="text-sm text-muted-foreground max-w-sm mt-1">
              Drag and drop files here, or click to browse. Max file size: 50MB.
            </p>
          </div>
          <Button onClick={handleSimulateUpload} disabled={createUpload.isPending} variant="outline" className="border-primary text-primary hover:bg-primary/10">
            {createUpload.isPending ? "UPLOADING..." : "SIMULATE_UPLOAD"}
          </Button>
        </CardContent>
      </Card>

      <div className="rounded-md border border-border bg-card/50 backdrop-blur overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border/50 hover:bg-transparent">
              <TableHead className="w-12">TYPE</TableHead>
              <TableHead>FILENAME</TableHead>
              <TableHead>SIZE</TableHead>
              <TableHead>OWNER</TableHead>
              <TableHead>UPLOAD_DATE</TableHead>
              <TableHead className="text-right">ACTIONS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : uploads?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  REPOSITORY_EMPTY
                </TableCell>
              </TableRow>
            ) : (
              uploads?.map((upload) => (
                <TableRow key={upload.id} className="border-border/50">
                  <TableCell>
                    {getFileIcon(upload.mimeType, upload.filename)}
                  </TableCell>
                  <TableCell className="font-mono font-medium">
                    {upload.filename}
                    {upload.filename.match(/\.(php|sh|exe)$/) && (
                      <span className="ml-2 text-[10px] text-destructive border border-destructive/50 px-1 rounded bg-destructive/10">SUSPICIOUS</span>
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-xs">{formatBytes(upload.size)}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">USR_{upload.userId}</TableCell>
                  <TableCell className="text-muted-foreground text-xs font-mono">
                    {new Date(upload.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(upload.id)} className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10">
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
