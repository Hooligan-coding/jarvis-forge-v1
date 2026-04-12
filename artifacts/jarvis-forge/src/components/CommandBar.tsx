import React from "react";
import { TabType } from "../Dashboard";
import { Activity, LayoutList, FileText, Layers } from "lucide-react";
import { useHealthCheck } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";

interface CommandBarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export function CommandBar({ activeTab, onTabChange }: CommandBarProps) {
  const { data: health, isLoading } = useHealthCheck();

  const tabs: { id: TabType; label: string; icon: React.ElementType }[] = [
    { id: "DESIGN", label: "DESIGN", icon: Layers },
    { id: "SIMULATE", label: "SIMULATE", icon: Activity },
    { id: "COMPONENTS", label: "COMPONENTS", icon: LayoutList },
    { id: "DOCUMENTATION", label: "DOCUMENTATION", icon: FileText },
  ];

  return (
    <header className="h-14 border-b border-border/50 bg-background/80 backdrop-blur flex items-center justify-between px-4 z-20">
      <div className="flex items-center gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-mono tracking-wider transition-all duration-300 border border-transparent",
                isActive 
                  ? "bg-primary/10 text-primary border-primary/30 neon-text" 
                  : "text-muted-foreground hover:bg-primary/5 hover:text-primary/70"
              )}
            >
              <Icon className={cn("w-4 h-4", isActive ? "text-primary" : "text-muted-foreground")} />
              {tab.label}
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary shadow-[0_0_8px_hsl(var(--primary))]" />
              )}
            </button>
          );
        })}
      </div>
      
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1 rounded bg-card/50 border border-border/50">
          <div className={cn(
            "w-2 h-2 rounded-full",
            isLoading ? "bg-yellow-500 animate-pulse" : 
            health?.status === "ok" ? "bg-green-500 shadow-[0_0_8px_theme(colors.green.500)]" : "bg-red-500"
          )} />
          <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
            {isLoading ? "CONNECTING..." : health?.status === "ok" ? "SYSTEM ONLINE" : "OFFLINE"}
          </span>
        </div>
      </div>
    </header>
  );
}
