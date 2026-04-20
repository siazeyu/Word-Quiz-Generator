import { Switch, Route, Router as WouterRouter, Link, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home";
import DictationPage from "@/pages/dictation";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30000,
    },
  },
});

function NavBar() {
  const [location] = useLocation();
  return (
    <nav className="no-print bg-sidebar border-b border-sidebar-border sticky top-0 z-50">
      <div className="max-w-screen-xl mx-auto px-4 flex items-center h-14 gap-6">
        <span className="font-bold text-primary text-lg tracking-tight">单词默写生成器</span>
        <Link
          href="/"
          className={`text-sm font-medium px-3 py-1.5 rounded-md transition-colors ${
            location === "/" ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-sidebar-accent"
          }`}
        >
          单词管理
        </Link>
        <Link
          href="/dictation"
          className={`text-sm font-medium px-3 py-1.5 rounded-md transition-colors ${
            location === "/dictation" ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-sidebar-accent"
          }`}
        >
          生成默写
        </Link>
      </div>
    </nav>
  );
}

function Router() {
  return (
    <>
      <NavBar />
      <Switch>
        <Route path="/" component={HomePage} />
        <Route path="/dictation" component={DictationPage} />
        <Route component={NotFound} />
      </Switch>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
