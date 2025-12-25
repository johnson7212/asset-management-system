import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Banks from "./pages/Banks";
import Funds from "./pages/Funds";
import FundsList from "./pages/FundsList";
import Stocks from "./pages/Stocks";
import Crypto from "./pages/Crypto";
import Analysis from "./pages/Analysis";
import AdminUsers from "./pages/AdminUsers";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/banks"} component={Banks} />
      <Route path={"/funds"} component={Funds} />
      <Route path={"/funds-list"} component={FundsList} />
      <Route path={"/stocks"} component={Stocks} />
      <Route path={"/crypto"} component={Crypto} />
      <Route path={"/analysis"} component={Analysis} />
      <Route path={"/admin/users"} component={AdminUsers} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
