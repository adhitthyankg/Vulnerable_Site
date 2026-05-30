import { useParams } from "wouter";
import { useGetPost, useListComments, useCreateComment, getGetPostQueryKey, getListCommentsQueryKey, useDeleteComment } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { User, Calendar, Eye, Terminal, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

export default function PostDetail() {
  const { id } = useParams();
  const postId = Number(id);
  const { data: post, isLoading: postLoading } = useGetPost(postId, { query: { enabled: !!postId, queryKey: getGetPostQueryKey(postId) } });
  const { data: comments, isLoading: commentsLoading } = useListComments({ postId }, { query: { enabled: !!postId, queryKey: getListCommentsQueryKey({ postId }) } });
  
  const createComment = useCreateComment();
  const deleteComment = useDeleteComment();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  const [newComment, setNewComment] = useState("");

  const handlePostComment = () => {
    if (!newComment.trim()) return;
    
    createComment.mutate(
      { data: { postId, content: newComment } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListCommentsQueryKey({ postId }) });
          setNewComment("");
          toast({ title: "COMMENT_POSTED", description: "Your input has been recorded." });
        }
      }
    );
  };

  const handleDeleteComment = (commentId: number) => {
    deleteComment.mutate(
      { id: commentId },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListCommentsQueryKey({ postId }) });
          toast({ title: "COMMENT_DELETED", description: "Record removed." });
        }
      }
    );
  };

  if (postLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-4 w-1/3" />
        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-4 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!post) {
    return <div>RECORD_NOT_FOUND</div>;
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Badge variant="outline" className="border-primary/50 text-primary bg-primary/10">
            {post.category}
          </Badge>
          {post.tags?.map(tag => (
            <Badge key={tag} variant="outline" className="border-border text-muted-foreground">
              #{tag}
            </Badge>
          ))}
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-primary mb-4">{post.title}</h1>
        <div className="flex items-center gap-6 text-sm text-muted-foreground font-mono pb-6 border-b border-border/50">
          <span className="flex items-center gap-2"><User className="h-4 w-4" /> {post.authorName}</span>
          <span className="flex items-center gap-2"><Calendar className="h-4 w-4" /> {new Date(post.createdAt).toLocaleString()}</span>
          <span className="flex items-center gap-2"><Eye className="h-4 w-4" /> {post.viewCount || 0} VIEWS</span>
        </div>
      </div>

      <div className="prose prose-invert max-w-none text-foreground prose-pre:bg-muted/30 prose-pre:border prose-pre:border-border">
        {post.content.split('\n').map((paragraph, idx) => (
          <p key={idx}>{paragraph}</p>
        ))}
      </div>

      <div className="pt-8 border-t border-border/50">
        <h3 className="text-xl font-bold text-primary mb-6 flex items-center gap-2">
          <Terminal className="h-5 w-5" /> 
          DISCUSSION_LOG
        </h3>

        <div className="space-y-6">
          <Card className="bg-muted/10 border-border/50">
            <CardContent className="p-4 space-y-4">
              <Textarea 
                placeholder="Enter input..." 
                className="bg-card min-h-[100px] font-mono"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
              />
              <div className="flex justify-end">
                <Button 
                  onClick={handlePostComment} 
                  disabled={!newComment.trim() || createComment.isPending}
                >
                  {createComment.isPending ? "TRANSMITTING..." : "SUBMIT_RECORD"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            {commentsLoading ? (
              <Skeleton className="h-24 w-full" />
            ) : comments?.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No discussion records found.</p>
            ) : (
              comments?.map((comment) => (
                <Card key={comment.id} className="bg-card/50 backdrop-blur border-border/50">
                  <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between space-y-0">
                    <div className="flex items-center gap-2 text-sm font-mono text-muted-foreground">
                      <User className="h-3 w-3 text-primary" />
                      <span className="text-primary font-bold">{comment.authorName}</span>
                      <span>•</span>
                      <span>{new Date(comment.createdAt).toLocaleString()}</span>
                    </div>
                    {user?.id === comment.authorId || user?.role === 'admin' ? (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleDeleteComment(comment.id)}
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    ) : null}
                  </CardHeader>
                  <CardContent className="p-4 pt-2">
                    <p className="text-sm">{comment.content}</p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
