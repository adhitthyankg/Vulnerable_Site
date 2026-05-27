import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarTrigger,
  SidebarFooter,
} from "@/components/ui/sidebar";
import {
  Activity,
  AlertCircle,
  BookOpen,
  Box,
  FileText,
  Key,
  LayoutDashboard,
  LogOut,
  ShieldAlert,
  ShoppingCart,
  Ticket,
  Upload,
  User,
  Users,
  Bell,
  Terminal,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/users", label: "Users", icon: Users },
  { href: "/products", label: "Products", icon: Box },
  { href: "/orders", label: "Orders", icon: ShoppingCart },
  { href: "/posts", label: "Posts", icon: FileText },
  { href: "/tickets", label: "Tickets", icon: Ticket },
  { href: "/uploads", label: "Uploads", icon: Upload },
  { href: "/employees", label: "Employees", icon: User },
  { href: "/api-keys", label: "API Keys", icon: Key },
  { href: "/audit-logs", label: "Audit Logs", icon: Activity },
  { href: "/api-docs", label: "API Docs", icon: BookOpen },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background font-mono text-sm">
        <Sidebar className="border-r border-border bg-sidebar">
          <SidebarHeader className="border-b border-border p-4 flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-primary">
              <Terminal className="h-5 w-5" />
              <span>CYBERLAB_OS</span>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {NAV_ITEMS.map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={
                          location === item.href ||
                          (item.href !== "/" && location.startsWith(item.href))
                        }
                      >
                        <Link href={item.href} className="flex items-center gap-3 py-2 text-muted-foreground hover:text-primary transition-colors">
                          <item.icon className="h-4 w-4" />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter className="border-t border-border p-4">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                  <span>{user?.username} ({user?.role})</span>
                </div>
                <Link href="/notifications">
                  <Bell className="h-4 w-4 hover:text-primary transition-colors cursor-pointer" />
                </Link>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive border-border"
                onClick={() => logout()}
              >
                <LogOut className="mr-2 h-4 w-4" />
                TERMINATE_SESSION
              </Button>
            </div>
          </SidebarFooter>
        </Sidebar>
        <main className="flex-1 overflow-auto flex flex-col">
          <header className="h-14 border-b border-border flex items-center px-4 md:hidden">
             <SidebarTrigger />
             <div className="ml-4 font-bold text-primary">CYBERLAB_OS</div>
          </header>
          <div className="flex-1 p-6 lg:p-8 w-full max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
