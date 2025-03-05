import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function App() {
  return (
    <div className="min-h-screen bg-background">
      <div className="flex flex-col gap-4 p-8">
        <h1 className="text-4xl font-bold">Dashboard</h1>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="p-4">
            <h2 className="text-lg font-semibold mb-2">Overview</h2>
            <p className="text-muted-foreground">
              Welcome to your dashboard. This is a basic layout using shadcn/ui
              components.
            </p>
            <Button className="mt-4">Get Started</Button>
          </Card>

          <Card className="p-4">
            <h2 className="text-lg font-semibold mb-2">Statistics</h2>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Total Users: 1,234
              </p>
              <p className="text-sm text-muted-foreground">
                Active Projects: 56
              </p>
              <p className="text-sm text-muted-foreground">Revenue: $45,678</p>
            </div>
          </Card>

          <Card className="p-4">
            <h2 className="text-lg font-semibold mb-2">Quick Actions</h2>
            <div className="flex flex-col gap-2">
              <Button variant="outline" className="text-white">
                Create New Project
              </Button>
              <Button variant="outline" className="text-white">
                View Reports
              </Button>
              <Button variant="outline" className="text-white">
                Manage Team
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default App;
