import { useState, useEffect } from "react";
import { useRunSimulation, useGetProject, useListComponents, getGetProjectQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Activity, Zap, Battery, Thermometer, Clock, AlertTriangle, CheckCircle2, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export function SimulateTab({ projectId }: { projectId: string | null }) {
  const [duration, setDuration] = useState(24);
  const queryClient = useQueryClient();

  const { data: project } = useGetProject(projectId || "", {
    query: { enabled: !!projectId }
  });

  const { data: componentsData } = useListComponents();

  const simulateMutation = useRunSimulation();

  const handleRunSimulation = () => {
    if (!projectId || !project) return;
    
    simulateMutation.mutate({
      data: {
        projectId,
        componentIds: project.componentIds,
        durationHours: duration
      }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetProjectQueryKey(projectId) });
      }
    });
  };

  const projectComponents = componentsData?.components.filter(c => project?.componentIds.includes(c.id)) || [];
  const hasComponents = projectComponents.length > 0;

  // Find the most recent simulation result from chat history or project if available?
  // Wait, the API returns a SimulationResult but where does it save it? 
  // Let's just store the last result in state.
  const [lastResult, setLastResult] = useState<any>(null);

  useEffect(() => {
    if (simulateMutation.data) {
      setLastResult(simulateMutation.data);
    }
  }, [simulateMutation.data]);

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "low": return "text-green-500";
      case "medium": return "text-yellow-500";
      case "high": return "text-orange-500";
      case "critical": return "text-red-500";
      default: return "text-muted-foreground";
    }
  };

  return (
    <div className="h-full flex flex-col bg-background/50">
      <div className="p-6 border-b border-border/50 bg-card/30 flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-xl text-primary flex items-center gap-2">
            <Activity className="w-5 h-5" />
            SYSTEM SIMULATION
          </h2>
          <p className="text-sm text-muted-foreground font-mono mt-1">Run environmental and load stress tests</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-black/50 p-1 rounded-md border border-border">
            {[12, 24, 48, 72].map(hrs => (
              <button
                key={hrs}
                onClick={() => setDuration(hrs)}
                className={cn(
                  "px-3 py-1 text-xs font-mono rounded transition-colors",
                  duration === hrs ? "bg-primary/20 text-primary border border-primary/50" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {hrs}H
              </button>
            ))}
          </div>
          
          <Button
            onClick={handleRunSimulation}
            disabled={simulateMutation.isPending || !hasComponents}
            className={cn(
              "font-mono font-bold tracking-wider relative overflow-hidden group",
              hasComponents ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-muted text-muted-foreground"
            )}
          >
            {simulateMutation.isPending ? (
              <>
                <Activity className="w-4 h-4 mr-2 animate-pulse" />
                SIMULATING...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                RUN SIMULATION
              </>
            )}
            
            {hasComponents && !simulateMutation.isPending && (
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out" />
            )}
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1 p-6">
        {!hasComponents ? (
          <div className="h-64 flex flex-col items-center justify-center border border-dashed border-border/50 rounded-lg bg-card/10">
            <AlertTriangle className="w-8 h-8 text-yellow-500 mb-4" />
            <h3 className="font-display text-lg text-foreground mb-2">NO COMPONENTS SELECTED</h3>
            <p className="text-muted-foreground text-sm font-mono text-center max-w-md">
              Add components to your project from the COMPONENTS tab before running a simulation.
            </p>
          </div>
        ) : simulateMutation.isPending ? (
          <div className="h-64 flex flex-col items-center justify-center">
            <div className="relative w-32 h-32 flex items-center justify-center mb-8">
              <div className="absolute inset-0 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
              <div className="absolute inset-2 rounded-full border-2 border-secondary/20 border-b-secondary animate-[spin_1.5s_linear_infinite_reverse]" />
              <Activity className="w-8 h-8 text-primary animate-pulse" />
            </div>
            <h3 className="font-display text-primary tracking-widest animate-pulse">RUNNING DIAGNOSTICS</h3>
            <div className="w-64 mt-4 h-1 bg-muted rounded overflow-hidden">
              <div className="h-full bg-primary animate-[pulse_1s_ease-in-out_infinite] w-[60%]" />
            </div>
          </div>
        ) : lastResult ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg border border-border/50 bg-card/30 flex flex-col">
                <div className="text-xs text-muted-foreground font-mono mb-2 flex items-center gap-2">
                  <Zap className="w-3 h-3 text-primary" /> OUTPUT
                </div>
                <div className="text-3xl font-display text-foreground">{lastResult.powerOutput}<span className="text-sm text-primary ml-1">W</span></div>
              </div>
              
              <div className="p-4 rounded-lg border border-border/50 bg-card/30 flex flex-col">
                <div className="text-xs text-muted-foreground font-mono mb-2 flex items-center gap-2">
                  <Battery className="w-3 h-3 text-green-500" /> BATTERY LIFE
                </div>
                <div className="text-3xl font-display text-foreground">{lastResult.batteryLifeHours}<span className="text-sm text-green-500 ml-1">HRS</span></div>
              </div>
              
              <div className="p-4 rounded-lg border border-border/50 bg-card/30 flex flex-col">
                <div className="text-xs text-muted-foreground font-mono mb-2 flex items-center gap-2">
                  <Activity className="w-3 h-3 text-blue-500" /> EFFICIENCY
                </div>
                <div className="text-3xl font-display text-foreground">{lastResult.efficiency}<span className="text-sm text-blue-500 ml-1">%</span></div>
              </div>
              
              <div className="p-4 rounded-lg border border-border/50 bg-card/30 flex flex-col">
                <div className="text-xs text-muted-foreground font-mono mb-2 flex items-center gap-2">
                  <Thermometer className={cn("w-3 h-3", getRiskColor(lastResult.thermalRisk))} /> THERMAL
                </div>
                <div className={cn("text-xl font-display uppercase mt-1", getRiskColor(lastResult.thermalRisk))}>
                  {lastResult.thermalRisk} RISK
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-5 rounded-lg border border-border/50 bg-card/30 space-y-4">
                <h3 className="font-display text-sm tracking-wider text-primary border-b border-border/50 pb-2">LOAD ANALYSIS</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs font-mono mb-1">
                      <span className="text-muted-foreground">PEAK LOAD</span>
                      <span className="text-foreground">{lastResult.peakLoad}W</span>
                    </div>
                    <Progress value={Math.min(100, (lastResult.peakLoad / 500) * 100)} className="h-1 bg-muted" indicatorClassName="bg-orange-500" />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-mono mb-1">
                      <span className="text-muted-foreground">AVG LOAD</span>
                      <span className="text-foreground">{lastResult.avgLoad}W</span>
                    </div>
                    <Progress value={Math.min(100, (lastResult.avgLoad / 500) * 100)} className="h-1 bg-muted" indicatorClassName="bg-blue-500" />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-mono mb-1">
                      <span className="text-muted-foreground">UPTIME PROBABILITY</span>
                      <span className="text-foreground">{lastResult.uptime}%</span>
                    </div>
                    <Progress value={lastResult.uptime} className="h-1 bg-muted" indicatorClassName="bg-green-500" />
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-lg border border-border/50 bg-card/30 flex flex-col">
                <h3 className="font-display text-sm tracking-wider text-primary border-b border-border/50 pb-2 mb-4">SYSTEM DIAGNOSTICS</h3>
                {lastResult.warnings && lastResult.warnings.length > 0 ? (
                  <div className="space-y-2 flex-1">
                    {lastResult.warnings.map((warning: string, i: number) => (
                      <div key={i} className="flex items-start gap-2 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded">
                        <AlertTriangle className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
                        <span className="text-xs text-yellow-500/90 font-mono leading-relaxed">{warning}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center opacity-70">
                    <CheckCircle2 className="w-8 h-8 text-green-500 mb-2" />
                    <span className="text-xs text-green-500 font-mono tracking-wider">ALL SYSTEMS NOMINAL</span>
                    <span className="text-[10px] text-muted-foreground mt-1">No warnings detected during simulation</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="h-64 flex flex-col items-center justify-center border border-dashed border-border/50 rounded-lg bg-card/5">
            <Activity className="w-8 h-8 text-muted-foreground mb-4 opacity-50" />
            <h3 className="font-display text-lg text-muted-foreground mb-2">READY TO SIMULATE</h3>
            <p className="text-muted-foreground/70 text-sm font-mono text-center max-w-md">
              Select duration and click Run Simulation to analyze {projectComponents.length} components.
            </p>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
