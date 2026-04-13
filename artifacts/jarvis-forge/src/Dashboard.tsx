import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import {
  useListProjects,
  useCreateProject,
  useGetProjectStats,
  useGetProject,
  getListProjectsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { SidebarLeft } from "./components/SidebarLeft";
import { CommandBar } from "./components/CommandBar";
import { JarvisChat } from "./components/JarvisChat";
import { DesignTab } from "./components/DesignTab";
import { SimulateTab } from "./components/SimulateTab";
import { ComponentsTab } from "./components/ComponentsTab";
import { DocumentationTab } from "./components/DocumentationTab";
import { Loader2 } from "lucide-react";

export type TabType = "DESIGN" | "SIMULATE" | "COMPONENTS" | "DOCUMENTATION";

export function Dashboard() {
  const [activeTab, setActiveTab] = useState<TabType>("DESIGN");
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  
  const queryClient = useQueryClient();

  const { data: projectsData, isLoading: isLoadingProjects } = useListProjects({
    query: { queryKey: getListProjectsQueryKey() }
  });
  
  const createProject = useCreateProject();

  useEffect(() => {
    if (!isLoadingProjects && projectsData?.projects) {
      if (projectsData.projects.length > 0) {
        if (!currentProjectId) {
          setCurrentProjectId(projectsData.projects[0].id);
        }
      } else {
        // Auto-create a demo project
        createProject.mutate({
          data: {
            name: "Alpha Prototype Mk1",
            description: "Next-gen off-grid solar streetlight concept.",
            componentIds: []
          }
        }, {
          onSuccess: (newProject) => {
            setCurrentProjectId(newProject.id);
            queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() });
          }
        });
      }
    }
  }, [isLoadingProjects, projectsData, currentProjectId, createProject, queryClient]);

  const { data: project } = useGetProject(currentProjectId || "", {
    query: { enabled: !!currentProjectId }
  });

  if (isLoadingProjects || (!currentProjectId && createProject.isPending)) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary neon-text mb-4" />
        <div className="text-primary font-mono animate-pulse uppercase tracking-widest text-sm">Initializing JARVIS Forge...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground selection:bg-primary/30">
      <SidebarLeft projectId={currentProjectId} />
      
      <div className="flex flex-col flex-1 border-r border-border/50 relative z-10">
        <CommandBar activeTab={activeTab} onTabChange={setActiveTab} />
        
        <main className="flex-1 overflow-y-auto relative glass-panel m-4 rounded-md border border-border/50 shadow-lg shadow-black/50">
          <div className="absolute inset-0 pointer-events-none opacity-20" 
               style={{ 
                 backgroundImage: 'radial-gradient(circle at 50% 50%, hsl(var(--primary)) 0%, transparent 60%)',
                 mixBlendMode: 'screen' 
               }} 
          />
          
          <div className="h-full relative z-10">
            {activeTab === "DESIGN" && <DesignTab projectId={currentProjectId} />}
            {activeTab === "SIMULATE" && <SimulateTab projectId={currentProjectId} />}
            {activeTab === "COMPONENTS" && <ComponentsTab projectId={currentProjectId} />}
            {activeTab === "DOCUMENTATION" && <DocumentationTab projectId={currentProjectId} />}
          </div>
        </main>
      </div>

      <JarvisChat projectId={currentProjectId} />
    </div>
  );
}
