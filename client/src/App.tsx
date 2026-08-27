/*
 * Pulcherrima official site router
 * The public shell is split into an evergreen home, a future-facing archive, and a separate
 * recruiting guide. All routes share the fixed full-logo header.
 */
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import Archive from "@/pages/Archive";
import Home from "@/pages/Home";
import Recruiting from "@/pages/Recruiting";
import Videos from "@/pages/Videos";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/archive" component={Archive} />
      <Route path="/recruiting" component={Recruiting} />
      <Route path="/videos" component={Videos} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
