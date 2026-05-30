import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLogin } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Terminal, ShieldAlert, KeyRound } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useState } from "react";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export default function Login() {
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const loginMutation = useLogin();
  const [showDemo, setShowDemo] = useState(true);

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = (values: z.infer<typeof loginSchema>) => {
    loginMutation.mutate(
      { data: values },
      {
        onSuccess: (data) => {
          login(data.token, data.user);
          setLocation("/");
        },
        onError: (error: any) => {
          toast({
            title: "AUTH_FAILURE",
            description: error.message || "Invalid credentials provided.",
            variant: "destructive",
          });
        },
      }
    );
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4 font-mono relative overflow-hidden">
      {/* Decorative background grid */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none" 
        style={{
          backgroundImage: 'linear-gradient(rgba(0, 255, 128, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 128, 0.2) 1px, transparent 1px)',
          backgroundSize: '30px 30px'
        }}
      />
      
      <div className="w-full max-w-md z-10 space-y-6">
        <div className="flex flex-col items-center justify-center mb-8">
          <div className="h-16 w-16 bg-primary/10 border-2 border-primary flex items-center justify-center mb-4">
            <Terminal className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tighter text-primary">CYBERLAB_OS</h1>
          <p className="text-muted-foreground mt-2">SECURE_ACCESS_TERMINAL</p>
        </div>

        {showDemo && (
          <Alert className="border-primary/50 bg-primary/5">
            <ShieldAlert className="h-4 w-4 text-primary" />
            <AlertTitle className="text-primary font-bold flex justify-between items-center">
              DEMO_CREDENTIALS
              <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => setShowDemo(false)}>DISMISS</Button>
            </AlertTitle>
            <AlertDescription className="mt-2 text-xs opacity-80">
              <ul className="space-y-1">
                <li><span className="text-primary mr-2">&gt;</span>admin / admin123</li>
                <li><span className="text-primary mr-2">&gt;</span>test / test123</li>
                <li><span className="text-primary mr-2">&gt;</span>analyst / password123</li>
              </ul>
            </AlertDescription>
          </Alert>
        )}

        <Card className="border-border bg-card/80 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <KeyRound className="h-4 w-4" />
              AUTHENTICATION_REQUIRED
            </CardTitle>
            <CardDescription>Enter credentials to access the system.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>USERNAME</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter username..." className="bg-background" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>PASSWORD</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Enter password..." className="bg-background" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button 
                  type="submit" 
                  className="w-full font-bold tracking-widest" 
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? "AUTHENTICATING..." : "INITIALIZE_SESSION"}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex justify-center border-t border-border pt-4">
            <p className="text-xs text-muted-foreground">
              NO_ACCOUNT? <Link href="/register" className="text-primary hover:underline">REQUEST_ACCESS</Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
