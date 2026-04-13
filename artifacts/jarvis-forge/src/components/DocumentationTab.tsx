import { useState, useEffect } from "react";
import { useGenerateDocumentation, useGetProject, useListComponents } from "@workspace/api-client-react";
import { FileText, Download, CheckCircle2, AlertTriangle, FileCode2, Loader2, Table2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

export function DocumentationTab({ projectId }: { projectId: string | null }) {
  const [options, setOptions] = useState({
    specSheet: true,
    bom: true,
    summary: true
  });
  
  const [docResult, setDocResult] = useState<any>(null);

  const { data: project } = useGetProject(projectId || "", {
    query: { enabled: !!projectId }
  });

  const { data: componentsData } = useListComponents();
  const generateDocsMutation = useGenerateDocumentation();

  const handleGenerate = () => {
    if (!projectId) return;
    
    generateDocsMutation.mutate({
      data: {
        projectId,
        includeSpecSheet: options.specSheet,
        includeBOM: options.bom,
        includeSummary: options.summary
      }
    }, {
      onSuccess: (data) => {
        setDocResult(data);
      }
    });
  };

  const projectComponents = componentsData?.components.filter(c => project?.componentIds.includes(c.id)) || [];
  const hasComponents = projectComponents.length > 0;

  return (
    <div className="h-full flex flex-col bg-background/50">
      <div className="p-6 border-b border-border/50 bg-card/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-bold text-xl text-primary flex items-center gap-2">
            <FileText className="w-5 h-5" />
            TECHNICAL DOCUMENTATION
          </h2>
          <p className="text-sm text-muted-foreground font-mono mt-1">Generate spec sheets, BOM, and reports</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-4 p-2 bg-black/30 rounded border border-border/50">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="specSheet" 
                checked={options.specSheet}
                onCheckedChange={(c) => setOptions(prev => ({ ...prev, specSheet: c as boolean }))}
                className="border-primary/50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
              />
              <Label htmlFor="specSheet" className="text-xs font-mono cursor-pointer">SPEC SHEET</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="bom" 
                checked={options.bom}
                onCheckedChange={(c) => setOptions(prev => ({ ...prev, bom: c as boolean }))}
                className="border-primary/50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
              />
              <Label htmlFor="bom" className="text-xs font-mono cursor-pointer">BOM</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="summary" 
                checked={options.summary}
                onCheckedChange={(c) => setOptions(prev => ({ ...prev, summary: c as boolean }))}
                className="border-primary/50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
              />
              <Label htmlFor="summary" className="text-xs font-mono cursor-pointer">SUMMARY</Label>
            </div>
          </div>
          
          <Button
            onClick={handleGenerate}
            disabled={generateDocsMutation.isPending || !hasComponents || (!options.specSheet && !options.bom && !options.summary)}
            className={cn(
              "font-mono font-bold tracking-wider relative overflow-hidden group",
              hasComponents ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-muted text-muted-foreground"
            )}
          >
            {generateDocsMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                GENERATING...
              </>
            ) : (
              <>
                <FileCode2 className="w-4 h-4 mr-2" />
                GENERATE DOCS
              </>
            )}
            
            {hasComponents && !generateDocsMutation.isPending && (
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out" />
            )}
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1 p-6">
        {!hasComponents ? (
          <div className="h-64 flex flex-col items-center justify-center border border-dashed border-border/50 rounded-lg bg-card/10">
            <AlertTriangle className="w-8 h-8 text-yellow-500 mb-4" />
            <h3 className="font-display text-lg text-foreground mb-2">INCOMPLETE PROJECT</h3>
            <p className="text-muted-foreground text-sm font-mono text-center max-w-md">
              Documentation requires at least one component to be added to the project.
            </p>
          </div>
        ) : generateDocsMutation.isPending ? (
          <div className="h-64 flex flex-col items-center justify-center">
            <div className="relative w-24 h-24 flex items-center justify-center mb-6">
              <div className="absolute inset-0 rounded border border-primary/30 animate-[spin_3s_linear_infinite]" />
              <div className="absolute inset-2 rounded border border-primary/50 animate-[spin_2s_linear_infinite_reverse]" />
              <FileCode2 className="w-8 h-8 text-primary animate-pulse" />
            </div>
            <h3 className="font-display text-primary tracking-widest animate-pulse">COMPILING DOCUMENTATION</h3>
            <div className="flex gap-1 mt-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        ) : docResult ? (
          <div className="max-w-5xl mx-auto space-y-8 pb-12">
            <div className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground font-mono">
                GENERATED: {new Date(docResult.generatedAt).toLocaleString()}
              </div>
              <Button variant="outline" size="sm" className="font-mono text-xs border-primary/50 text-primary hover:bg-primary/10">
                <Download className="w-3 h-3 mr-2" /> EXPORT PDF
              </Button>
            </div>

            {docResult.specSheet && (
              <div className="border border-border/50 rounded-lg bg-black/40 overflow-hidden">
                <div className="bg-card/80 border-b border-border/50 p-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  <h3 className="font-display font-bold text-sm tracking-wider text-foreground">TECHNICAL SPECIFICATION</h3>
                </div>
                <div className="p-6 prose prose-invert prose-p:text-muted-foreground prose-headings:text-primary max-w-none font-mono text-sm leading-relaxed">
                  <ReactMarkdown>{docResult.specSheet}</ReactMarkdown>
                </div>
              </div>
            )}

            {docResult.bom && docResult.bom.length > 0 && (
              <div className="border border-border/50 rounded-lg bg-black/40 overflow-hidden">
                <div className="bg-card/80 border-b border-border/50 p-3 flex items-center gap-2">
                  <Table2 className="w-4 h-4 text-primary" />
                  <h3 className="font-display font-bold text-sm tracking-wider text-foreground">BILL OF MATERIALS (BOM)</h3>
                </div>
                <div className="p-0 overflow-x-auto">
                  <table className="w-full text-left text-sm font-mono">
                    <thead className="bg-card/40 text-muted-foreground text-xs">
                      <tr>
                        <th className="p-4 font-normal">COMPONENT</th>
                        <th className="p-4 font-normal">SPEC</th>
                        <th className="p-4 font-normal text-right">QTY</th>
                        <th className="p-4 font-normal text-right">UNIT COST</th>
                        <th className="p-4 font-normal text-right text-primary">TOTAL</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {docResult.bom.map((item: any, i: number) => (
                        <tr key={i} className="hover:bg-primary/5 transition-colors">
                          <td className="p-4 text-foreground">{item.name}</td>
                          <td className="p-4 text-muted-foreground text-xs truncate max-w-[200px]" title={item.spec}>{item.spec}</td>
                          <td className="p-4 text-right">{item.quantity}</td>
                          <td className="p-4 text-right text-muted-foreground">${item.unitCost.toFixed(2)}</td>
                          <td className="p-4 text-right text-primary">${item.totalCost.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-card/60 font-bold border-t-2 border-primary/30">
                      <tr>
                        <td colSpan={4} className="p-4 text-right text-primary/70">TOTAL SYSTEM COST:</td>
                        <td className="p-4 text-right text-primary text-lg">
                          ${docResult.bom.reduce((acc: number, item: any) => acc + item.totalCost, 0).toFixed(2)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            {docResult.summaryReport && (
              <div className="border border-border/50 rounded-lg bg-black/40 overflow-hidden">
                <div className="bg-card/80 border-b border-border/50 p-3 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  <h3 className="font-display font-bold text-sm tracking-wider text-foreground">EXECUTIVE SUMMARY</h3>
                </div>
                <div className="p-6 prose prose-invert prose-p:text-muted-foreground prose-headings:text-primary max-w-none font-mono text-sm leading-relaxed">
                  <ReactMarkdown>{docResult.summaryReport}</ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="h-64 flex flex-col items-center justify-center border border-dashed border-border/50 rounded-lg bg-card/5">
            <FileText className="w-8 h-8 text-muted-foreground mb-4 opacity-50" />
            <h3 className="font-display text-lg text-muted-foreground mb-2">READY TO GENERATE</h3>
            <p className="text-muted-foreground/70 text-sm font-mono text-center max-w-md">
              Select desired documents above and click Generate Docs to compile technical documentation for your project.
            </p>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
