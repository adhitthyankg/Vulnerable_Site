import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGetAnalyticsSummary, useGetRecentActivity, useGetVulnerabilityStats, useGetUserStats } from "@workspace/api-client-react";
import { Users, ShoppingCart, DollarSign, Ticket as TicketIcon, FileText, Upload as UploadIcon, User as UserIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { ActivityItem } from "@workspace/api-client-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar } from "recharts";

function StatCard({ title, value, icon: Icon, loading }: { title: string, value?: number, icon: any, loading: boolean }) {
  return (
    <Card className="bg-card/50 backdrop-blur border-border/50">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-primary" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-7 w-20" />
        ) : (
          <div className="text-2xl font-bold font-mono text-primary">{value}</div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { data: summary, isLoading: summaryLoading } = useGetAnalyticsSummary();
  const { data: activity, isLoading: activityLoading } = useGetRecentActivity();
  const { data: vulnStats, isLoading: vulnLoading } = useGetVulnerabilityStats();
  const { data: userStats, isLoading: userStatsLoading } = useGetUserStats();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-primary">SYSTEM_OVERVIEW</h2>
        <p className="text-muted-foreground">Welcome to CYBERLAB_OS control panel.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="TOTAL_USERS" value={summary?.totalUsers} icon={Users} loading={summaryLoading} />
        <StatCard title="ACTIVE_USERS" value={summary?.activeUsers} icon={Users} loading={summaryLoading} />
        <StatCard title="TOTAL_ORDERS" value={summary?.totalOrders} icon={ShoppingCart} loading={summaryLoading} />
        <StatCard title="TOTAL_REVENUE" value={summary?.totalRevenue} icon={DollarSign} loading={summaryLoading} />
        <StatCard title="OPEN_TICKETS" value={summary?.openTickets} icon={TicketIcon} loading={summaryLoading} />
        <StatCard title="TOTAL_POSTS" value={summary?.totalPosts} icon={FileText} loading={summaryLoading} />
        <StatCard title="TOTAL_UPLOADS" value={summary?.totalUploads} icon={UploadIcon} loading={summaryLoading} />
        <StatCard title="EMPLOYEES" value={summary?.totalEmployees} icon={UserIcon} loading={summaryLoading} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 bg-card/50 backdrop-blur border-border/50">
          <CardHeader>
            <CardTitle>USER_REGISTRATION_TREND</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            {userStatsLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={userStats}>
                    <defs>
                      <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis 
                      dataKey="month" 
                      stroke="hsl(var(--muted-foreground))" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false} 
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false} 
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                      itemStyle={{ color: 'hsl(var(--primary))' }}
                    />
                    <Area type="monotone" dataKey="count" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorCount)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-3 bg-card/50 backdrop-blur border-border/50">
          <CardHeader>
            <CardTitle>RECENT_ACTIVITY</CardTitle>
          </CardHeader>
          <CardContent>
            {activityLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {activity?.map((item: ActivityItem) => (
                  <div key={item.id} className="flex items-start gap-4 text-sm border-b border-border/30 pb-4 last:border-0 last:pb-0">
                    <div className="mt-0.5 h-2 w-2 rounded-full bg-primary" />
                    <div className="grid gap-1 flex-1">
                      <p className="text-sm font-medium leading-none flex justify-between">
                        <span>{item.type}</span>
                        <span className="text-xs text-muted-foreground">{new Date(item.timestamp).toLocaleString()}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.username ? <span className="text-primary">{item.username}: </span> : null}
                        {item.message}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-1">
        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardHeader>
            <CardTitle>VULNERABILITY_TRAINING_STATS</CardTitle>
          </CardHeader>
          <CardContent>
            {vulnLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={vulnStats}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis 
                      dataKey="category" 
                      stroke="hsl(var(--muted-foreground))" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false} 
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false} 
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                      itemStyle={{ color: 'hsl(var(--primary))' }}
                      cursor={{ fill: 'hsl(var(--muted))' }}
                    />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
