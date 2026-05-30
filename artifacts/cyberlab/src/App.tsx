import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { AuthProvider } from "@/hooks/use-auth";
import { ThemeProvider } from "@/components/theme-provider";
import { ProtectedRoute } from "@/components/protected-route";
import { AppLayout } from "@/components/layout";

import Login from "@/pages/login";
import Register from "@/pages/register";
import Dashboard from "@/pages/dashboard";
import Users from "@/pages/users";
import Products from "@/pages/products";
import Orders from "@/pages/orders";
import Posts from "@/pages/posts";
import PostDetail from "@/pages/posts-detail";
import Tickets from "@/pages/tickets";
import TicketDetail from "@/pages/tickets-detail";
import Uploads from "@/pages/uploads";
import Notifications from "@/pages/notifications";
import Employees from "@/pages/employees";
import ApiKeys from "@/pages/api-keys";
import AuditLogs from "@/pages/audit-logs";
import ApiDocs from "@/pages/api-docs";
import Scanner from "@/pages/scanner";
import Challenges from "@/pages/challenges";

const queryClient = new QueryClient();

function ProtectedRouter() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/users" component={Users} />
        <Route path="/products" component={Products} />
        <Route path="/orders" component={Orders} />
        <Route path="/posts" component={Posts} />
        <Route path="/posts/:id" component={PostDetail} />
        <Route path="/tickets" component={Tickets} />
        <Route path="/tickets/:id" component={TicketDetail} />
        <Route path="/uploads" component={Uploads} />
        <Route path="/notifications" component={Notifications} />
        <Route path="/employees" component={Employees} />
        <Route path="/api-keys" component={ApiKeys} />
        <Route path="/audit-logs" component={AuditLogs} />
        <Route path="/api-docs" component={ApiDocs} />
        <Route path="/scanner" component={Scanner} />
        <Route path="/challenges" component={Challenges} />
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="*">
        <ProtectedRoute>
          <ProtectedRouter />
        </ProtectedRoute>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="cyberlab-theme">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <AuthProvider>
              <Router />
            </AuthProvider>
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
