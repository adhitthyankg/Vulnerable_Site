import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const ENDPOINTS = [
  { method: "GET", path: "/api/healthz", desc: "System health check" },
  { method: "POST", path: "/api/auth/login", desc: "Authenticate user and get token" },
  { method: "POST", path: "/api/auth/register", desc: "Provision new user account" },
  { method: "GET", path: "/api/auth/me", desc: "Get current user profile" },
  { method: "GET", path: "/api/users", desc: "List all users (Admin only)" },
  { method: "GET", path: "/api/products", desc: "List catalog products" },
  { method: "GET", path: "/api/orders", desc: "List user orders" },
  { method: "POST", path: "/api/orders", desc: "Create a new order" },
  { method: "GET", path: "/api/posts", desc: "List publications" },
  { method: "GET", path: "/api/posts/:id", desc: "Get specific publication" },
  { method: "GET", path: "/api/tickets", desc: "List support tickets" },
  { method: "GET", path: "/api/employees", desc: "Search personnel directory" },
  { method: "GET", path: "/api/audit-logs", desc: "Retrieve system audit logs" },
];

export default function ApiDocs() {
  const getMethodColor = (method: string) => {
    switch(method) {
      case 'GET': return 'text-chart-2 border-chart-2 bg-chart-2/10';
      case 'POST': return 'text-chart-4 border-chart-4 bg-chart-4/10';
      case 'PUT': 
      case 'PATCH': return 'text-orange-500 border-orange-500 bg-orange-500/10';
      case 'DELETE': return 'text-destructive border-destructive bg-destructive/10';
      default: return 'text-muted-foreground border-border';
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-primary">API_DOCUMENTATION</h2>
        <p className="text-muted-foreground">REST interface specification for CYBERLAB_OS v0.1.0.</p>
      </div>

      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">AUTHENTICATION</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 font-mono text-sm">
          <p className="text-muted-foreground font-sans">
            All secured endpoints require a valid JWT passed via the Authorization header:
          </p>
          <div className="bg-black p-4 rounded-md border border-border">
            <code className="text-primary">Authorization: Bearer &lt;token&gt;</code>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h3 className="text-xl font-bold text-primary border-b border-border/50 pb-2">ENDPOINTS</h3>
        
        {ENDPOINTS.map((endpoint, i) => (
          <Card key={i} className="bg-card/30 backdrop-blur border-border/30 hover:border-border/80 transition-colors">
            <CardContent className="p-4 flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex items-center gap-4 min-w-[250px]">
                <Badge variant="outline" className={`w-16 justify-center font-mono rounded-sm ${getMethodColor(endpoint.method)}`}>
                  {endpoint.method}
                </Badge>
                <code className="text-foreground font-bold">{endpoint.path}</code>
              </div>
              <div className="text-muted-foreground text-sm flex-1 md:text-right">
                {endpoint.desc}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
