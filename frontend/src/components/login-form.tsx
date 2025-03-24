// LoginForm.tsx - This replaces your current login form component
import { useState, FormEvent } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface LoginFormProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

const API_URL = "http://localhost:8000/api";

export function LoginForm({
  className,
  ...props
}: LoginFormProps) {
  const [loading, setLoading] = useState<boolean>(false);
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSignUp, setIsSignUp] = useState<boolean>(false);

  const handleSignUp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    try {
      const response = await fetch(`${API_URL}/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Sign-up failed");
      }
      alert(data.message || "Check your email to complete sign-up!");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  // Password-based login
  const handlePasswordLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    
    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      // First check if the response is ok
      if (!response.ok) {
        // Always try to parse error response as JSON, but have a fallback
        try {
          const errorData = await response.json();
          throw new Error(errorData.detail?.message || errorData.detail || "Login failed");
        } catch (jsonError) {
          // If JSON parsing fails, use the status text
          throw new Error(`Login failed: ${response.statusText}`);
        }
      }
      
      // If response is ok, safely parse the JSON
      const data = await response.json();
      
      // Store tokens and redirect
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      window.location.href = '/dashboard'; // Or use your router
      
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Magic link login
  const handleMagicLinkLogin = async () => {
    if (!email) {
      setErrorMessage("Please enter your email");
      return;
    }
    
    setLoading(true);
    setErrorMessage(null);
    
    try {
      const response = await fetch(`${API_URL}/magic-link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || "Failed to send magic link");
      }
      
      alert(data.message || 'Check your email for the login link!');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Password reset
  const handlePasswordReset = async () => {
    if (!email) {
      setErrorMessage("Please enter your email to reset your password");
      return;
    }
    
    setLoading(true);
    setErrorMessage(null);
    
    try {
      const response = await fetch(`${API_URL}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || "Failed to send reset email");
      }
      
      alert(data.message || 'Check your email for the password reset link!');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col w-full h-full items-center justify-center">
      <img src="/childrens-white.png" alt="Logo" className="fixed top-0 left-0 p-4 w-48" />
      <h1 className="font-bold mb-10">Welcome to Brain Visualizer</h1>
      <div className={cn("flex flex-col", className)} {...props}>
        <Card>
          <CardHeader>
            <CardTitle>
              {isSignUp? "Sign up with your email" : "Log In using Children's National Hospital Credentials"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={isSignUp? handleSignUp: handlePasswordLogin}>
              <div className="flex flex-col gap-6">
                <div className="grid gap-3">
                  <Label htmlFor="email">Username:</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="grid gap-3">
                  <div className="flex items-center">
                    <Label htmlFor="password">Password:</Label>
                  </div>
                  <Input 
                    id="password" 
                    type="password" 
                    required 
                    placeholder="************" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                
                {errorMessage && (
                  <div className="text-red-500 text-sm">{errorMessage}</div>
                )}
                
                <div className="flex flex-col gap-3">
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Loading..." : isSignUp ? "Sign up" : "Login"}
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
        <div className="text-center text-sm bg-[#0177CD] p-2 rounded-b-xl shadow-2xl">
          <a
            href="#"
            className="ml-auto inline-block text-sm underline underline-offset-4 hover:underline text-white"
            onClick={(e) => {
              e.preventDefault();
              handlePasswordReset();
            }}
          >
            Forgot your password?
          </a>
          <br></br>
          <a 
          href="#"
          className="ml-auto inline-block text-sm underline underline-offset-4 hover:underline text-white"
          onClick={(e) => { 
            e.preventDefault();
            setIsSignUp(!isSignUp);
            setErrorMessage(null);
          }}>
            {isSignUp ? "Back to login" : "Sign up"}
          </a>
        </div>
      </div>
    </div>
  );
}