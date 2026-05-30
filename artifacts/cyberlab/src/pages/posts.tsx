import { useState } from "react";
import { useListPosts } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, MessageSquare, Eye, Calendar, User } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";

export default function Posts() {
  const [search, setSearch] = useState("");
  const { data: posts, isLoading } = useListPosts({ search });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-primary">PUBLICATIONS</h2>
          <p className="text-muted-foreground">Internal security advisories and research.</p>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search publications..."
            className="pl-8 bg-card/50"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-6">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="bg-card/50 backdrop-blur border-border/50">
              <CardHeader>
                <Skeleton className="h-6 w-2/3" />
                <Skeleton className="h-4 w-1/4 mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))
        ) : posts?.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground border border-border bg-card/50 backdrop-blur rounded-lg">
            NO_PUBLICATIONS_FOUND
          </div>
        ) : (
          posts?.map((post) => (
            <Link key={post.id} href={`/posts/${post.id}`}>
              <Card className="bg-card/50 backdrop-blur border-border/50 hover:border-primary/50 transition-colors cursor-pointer group">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="group-hover:text-primary transition-colors">{post.title}</CardTitle>
                      <CardDescription className="flex items-center gap-4 mt-2 text-xs font-mono">
                        <span className="flex items-center gap-1"><User className="h-3 w-3" /> {post.authorName}</span>
                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(post.createdAt).toLocaleDateString()}</span>
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="border-primary/50 text-primary bg-primary/10">
                      {post.category}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {post.content}
                  </p>
                  {post.tags && post.tags.length > 0 && (
                    <div className="flex gap-2 mt-4">
                      {post.tags.map(tag => (
                        <span key={tag} className="text-xs bg-muted/50 px-2 py-1 rounded text-muted-foreground">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </CardContent>
                <CardFooter className="text-xs text-muted-foreground flex gap-4 border-t border-border/50 pt-4">
                  <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {post.viewCount || 0} VIEWS</span>
                </CardFooter>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
