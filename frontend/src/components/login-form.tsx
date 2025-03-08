import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div className = "flex flex-col w-full h-full items-center justify-center">
    <img src="/childrens-white.png" alt="Logo" className="fixed top-0 left-0 p-4 w-48" />
      <h1 className = "font-bold mb-10"> Welcome to Brain Visualizer</h1>

    <div className={cn("flex flex-col", className)} {...props}>

      <Card>
        <CardHeader>
          <CardTitle>Log In using Children's National Hospital Credentials</CardTitle>
          {/* <CardDescription>
            Enter your email below to login to your account
          </CardDescription> */}
        </CardHeader>
        <CardContent>
          <form>
            <div className="flex flex-col gap-6">
              <div className="grid gap-3">
                <Label htmlFor="email">Username:</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@example.com"
                  required
                />
              </div>
              <div className="grid gap-3">
                <div className="flex items-center">
                  <Label htmlFor="password">Password:</Label>
                  
                </div>
                <Input id="password" type="password" required placeholder="************" />
              </div>
              <div className="flex flex-col gap-3">
                <Button type="submit" className="w-full">
                  Login
                </Button>
                {/* <Button variant="outline" className="w-full">
                  Login with Google
                </Button> */}
              </div>
            </div>
            
          </form>
          
        </CardContent>
      </Card>
      <div className="text-center text-sm bg-[#0177CD] p-2 rounded-b-xl shadow-2xl">
    <a
    href="#"
    className="ml-auto inline-block text-sm underline underline-offset-4 hover:underline text-white"
  >
    Forgot your password?
  </a>
  </div>
    </div>
    
  </div>
  )
}
