import { useGetProject, useListComponents, getGetComponentQueryKey } from "@workspace/api-client-react";
import { Cpu, Zap, Activity, CheckCircle2, CircleDashed, ShieldAlert, Cpu as Microchip } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

export function SidebarLeft({ projectId }: { projectId: string | null }) {
  const { data: project, isLoading: isLoadingProject } = useGetProject(projectId || "", {
    query: { enabled: !!projectId }
  });

  const { data: componentsData, isLoading: isLoadingComponents } = useListComponents();

  if (!projectId || isLoadingProject) {
    return (
      <aside className="w-80 border-r border-border/50 bg-sidebar flex flex-col z-20">
        <div className="p-4 border-b border-border/50 flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center border border-primary/50 animate-pulse">
            <Cpu className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h1 className="font-display font-bold text-primary tracking-wider text-sm">JARVIS FORGE</h1>
            <div className="h-3 w-24 bg-muted/50 rounded mt-1 animate-pulse" />
          </div>
        </div>
        <div className="p-4 space-y-4">
          <div className="h-4 w-32 bg-muted/50 rounded animate-pulse" />
          <div className="h-20 w-full bg-muted/50 rounded animate-pulse" />
          <div className="h-4 w-24 bg-muted/50 rounded animate-pulse mt-8" />
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-12 w-full bg-muted/50 rounded animate-pulse" />
            ))}
          </div>
        </div>
      </aside>
    );
  }

  const projectComponents = componentsData?.components.filter(c => 
    project?.componentIds.includes(c.id)
  ) || [];

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "concept": return "bg-blue-500/20 text-blue-400 border-blue-500/50";
      case "design": return "bg-primary/20 text-primary border-primary/50";
      case "simulation": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50";
      case "complete": return "bg-green-500/20 text-green-400 border-green-500/50";
      default: return "bg-muted text-muted-foreground border-border";
    }
  };

  return (
    <aside className="w-80 border-r border-border/50 bg-sidebar flex flex-col z-20 relative">
      {/* Decorative scanline */}
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_0%,rgba(0,255,255,0.05)_50%,transparent_100%)] bg-[length:100%_4px] animate-[scan_2s_linear_infinite] pointer-events-none opacity-50" />
      
      <div className="p-4 border-b border-border/50 flex items-center gap-3 bg-background/50 backdrop-blur">
        <div className="h-8 w-8 rounded bg-primary/20 flex items-center justify-center border border-primary/50 neon-border">
          <Cpu className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h1 className="font-display font-bold text-primary tracking-wider text-sm neon-text">JARVIS FORGE</h1>
          <div className="text-[10px] text-muted-foreground tracking-widest font-mono">SYS.VER_1.0.4</div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-xs text-primary/70 font-mono uppercase tracking-wider">Active Project</div>
              <Badge variant="outline" className={`font-mono text-[10px] uppercase uppercase ${getStatusColor(project?.status)}`}>
                {project?.status || "UNKNOWN"}
              </Badge>
            </div>
            <h2 className="text-lg font-display font-bold text-foreground">{project?.name}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{project?.description}</p>
          </div>

          <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs text-primary/70 font-mono uppercase tracking-wider flex items-center gap-2">
                <Microchip className="w-3 h-3" />
                System Components
              </div>
              <span className="text-xs font-mono text-muted-foreground">{project?.componentIds.length || 0}</span>
            </div>
            
            {projectComponents.length === 0 ? (
              <div className="text-sm text-muted-foreground italic border border-dashed border-border p-4 text-center rounded bg-muted/5">
                No components added yet.
              </div>
            ) : (
              <div className="space-y-2">
                {projectComponents.map(component => (
                  <div key={component.id} className="flex flex-col p-2 border border-border/50 rounded bg-card/30 hover:bg-primary/5 transition-colors group">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{component.name}</span>
                      {component.inStock ? (
                        <CheckCircle2 className="w-3 h-3 text-green-500" />
                      ) : (
                        <ShieldAlert className="w-3 h-3 text-yellow-500" />
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[10px] text-muted-foreground font-mono uppercase">{component.category}</span>
                      <span className="text-[10px] text-primary font-mono">${component.estimatedCost}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </ScrollArea>
    </aside>
  );
}
