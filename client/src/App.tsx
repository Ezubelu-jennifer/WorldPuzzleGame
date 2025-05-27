import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Game from "@/pages/game";
import { DragProvider } from "@/context/drag-context";
import { GameProvider } from "@/context/game-context";
import { ScrollProvider } from "@/context/scrollcontext"; // ← import your ScrollProvider
import { LevelSelection } from "./components/home/level-selection";


function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/game/:id" component={Game} />
      <Route path="/level-selection/:countryId" component={LevelSelection} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {

  /*useEffect(() => {
    let lastUpdate = Date.now();
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && Date.now() - lastUpdate > 5000) {
        forceRefresh();
        lastUpdate = Date.now();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);*/
  
  return (
    <QueryClientProvider client={queryClient}>
      <DragProvider>
        <GameProvider>
        <ScrollProvider> {/* ← Wrap everything here */}
          <Router />
          <Toaster />
          </ScrollProvider>
        </GameProvider>
      </DragProvider>
    </QueryClientProvider>
  );
}

export default App;
