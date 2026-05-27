import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRegister } from "@workspace/api-client-react";
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
import { Terminal, ShieldPlus } from "lucide-react";

const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export default function Register() {
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const registerMutation = useRegister();

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
    },
  });

  const onSubmit = (values: z.infer<typeof registerSchema>) => {
    registerMutation.mutate(
      { data: values },
      {
        onSuccess: (data) => {
          login(data.token, data.user);
          setLocation("/");
        },
        onError: (error: any) => {
          toast({
            title: "REGISTRATION_FAILED",
            description: error.message || "Could not create account.",
            variant: "destructive",
          });
        },
      }
    );
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4 font-mono relative overflow-hidden">
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
          <p className="text-muted-foreground mt-2">NEW_USER_REGISTRATION</p>
        </div>

        <Card className="border-border bg-card/80 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShieldPlus className="h-4 w-4" />
              CREATE_ACCOUNT
            </CardTitle>
            <CardDescription>Enter details to provision a new user access token.</CardDescription>
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
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>EMAIL_ADDRESS</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="Enter email..." className="bg-background" {...field} />
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
                        <Input type="password" placeholder="Enter secure password..." className="bg-background" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button 
                  type="submit" 
                  className="w-full font-bold tracking-widest mt-2" 
                  disabled={registerMutation.isPending}
                >
                  {registerMutation.isPending ? "PROVISIONING..." : "PROVISION_ACCOUNT"}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex justify-center border-t border-border pt-4">
            <p className="text-xs text-muted-foreground">
              HAS_ACCOUNT? <Link href="/login" className="text-primary hover:underline">RETURN_TO_LOGIN</Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
