import { useState } from "react";
import { useListComponents, useGetProject } from "@workspace/api-client-react";
import { CheckCircle2, ShieldAlert, Cpu, Search, Plus, X, LayoutList } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export function ComponentsTab({ projectId }: { projectId: string | null }) {
  const [search, setSearch] = useState("");
  const { toast } = useToast();

  const { data: project } = useGetProject(projectId || "", {
    query: { enabled: !!projectId }
  });

  const { data: componentsData, isLoading } = useListComponents();

  const handleToggleComponent = (componentId: string, isAdded: boolean) => {
    // TODO: Wire up when update project API exists
    toast({
      title: isAdded ? "Component Removed" : "Component Added",
      description: "Project update API not yet implemented.",
      variant: "default",
    });
  };

  const filteredComponents = componentsData?.components.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.category.toLowerCase().includes(search.toLowerCase())
  ) || [];

  if (isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <div className="relative w-24 h-24 flex items-center justify-center mb-4">
          <div className="absolute inset-0 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
          <Cpu className="w-8 h-8 text-primary animate-pulse" />
        </div>
        <h3 className="font-display text-primary tracking-widest animate-pulse text-sm">FETCHING INVENTORY</h3>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background/50">
      <div className="p-6 border-b border-border/50 bg-card/30 flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-xl text-primary flex items-center gap-2">
            <LayoutList className="w-5 h-5" />
            COMPONENT LIBRARY
          </h2>
          <p className="text-sm text-muted-foreground font-mono mt-1">Browse and select hardware modules</p>
        </div>
        
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search database..." 
            className="pl-9 bg-black/50 border-primary/30 text-foreground font-mono focus-visible:ring-primary/50"
          />
        </div>
      </div>

      <ScrollArea className="flex-1 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredComponents.map(component => {
            const isAdded = project?.componentIds.includes(component.id) || false;
            
            return (
              <div 
                key={component.id} 
                className={cn(
                  "p-4 rounded-lg border flex flex-col transition-all duration-300 relative overflow-hidden group",
                  isAdded 
                    ? "bg-primary/10 border-primary/50 neon-border shadow-[0_0_15px_rgba(0,255,255,0.1)]" 
                    : "bg-card/30 border-border/50 hover:border-primary/30"
                )}
              >
                {/* Background decorative elements */}
                <div className="absolute -right-4 -top-4 text-primary/5 opacity-50 group-hover:opacity-100 transition-opacity">
                  <Cpu className="w-24 h-24" />
                </div>

                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <Badge variant="outline" className="mb-2 font-mono text-[10px] uppercase bg-background/50 border-primary/30 text-primary">
                        {component.category}
                      </Badge>
                      <h3 className="font-display font-bold text-foreground text-lg group-hover:text-primary transition-colors">
                        {component.name}
                      </h3>
                    </div>
                    <Button 
                      size="icon"
                      variant="outline"
                      onClick={() => handleToggleComponent(component.id, isAdded)}
                      className={cn(
                        "w-8 h-8 rounded shrink-0",
                        isAdded 
                          ? "bg-red-500/20 text-red-500 border-red-500/50 hover:bg-red-500/30 hover:text-red-400" 
                          : "bg-primary/20 text-primary border-primary/50 hover:bg-primary/30 hover:text-primary neon-border"
                      )}
                    >
                      {isAdded ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    </Button>
                  </div>
                  
                  <p className="text-xs text-muted-foreground font-mono leading-relaxed mb-4 flex-1">
                    {component.description}
                  </p>

                  <div className="space-y-2 mt-auto pt-4 border-t border-border/50">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-muted-foreground font-mono">SPECIFICATION</span>
                      <span className="text-xs text-foreground font-mono">{component.spec}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-muted-foreground font-mono">ESTIMATED COST</span>
                      <span className="text-xs text-primary font-mono">${component.estimatedCost}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-muted-foreground font-mono">INVENTORY STATUS</span>
                      <div className="flex items-center gap-1">
                        {component.inStock ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-green-500" />
                            <span className="text-[10px] text-green-500 font-mono">IN STOCK</span>
                          </>
                        ) : (
                          <>
                            <ShieldAlert className="w-3 h-3 text-yellow-500" />
                            <span className="text-[10px] text-yellow-500 font-mono">BACKORDERED</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
