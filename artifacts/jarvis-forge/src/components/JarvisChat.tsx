import { useState, useRef, useEffect } from "react";
import { useJarvisChat, useGetProject } from "@workspace/api-client-react";
import { Send, Bot, User, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function JarvisChat({ projectId }: { projectId: string | null }) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const { data: project } = useGetProject(projectId || "", {
    query: { enabled: !!projectId }
  });

  const chatMutation = useJarvisChat();
  const [localMessages, setLocalMessages] = useState<{ id: string, role: string, content: string, timestamp: string }[]>([]);

  // Sync with project history when loaded
  useEffect(() => {
    if (project?.chatHistory) {
      setLocalMessages(project.chatHistory);
    } else if (localMessages.length === 0) {
      setLocalMessages([{
        id: "init",
        role: "jarvis",
        content: "JARVIS online. How can I assist with your hardware design today?",
        timestamp: new Date().toISOString()
      }]);
    }
  }, [project?.chatHistory]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [localMessages]);

  const handleSend = async () => {
    if (!input.trim() || !projectId) return;

    const userMsg = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date().toISOString()
    };

    setLocalMessages(prev => [...prev, userMsg]);
    setInput("");

    try {
      const response = await chatMutation.mutateAsync({
        data: {
          message: userMsg.content,
          projectId: projectId
        }
      });

      const jarvisMsg = {
        id: response.id,
        role: "jarvis",
        content: response.message,
        timestamp: response.timestamp
      };

      setLocalMessages(prev => [...prev, jarvisMsg]);
    } catch (error) {
      // Handle error silently or show toast
    }
  };

  return (
    <aside className="w-80 lg:w-96 border-l border-border/50 bg-sidebar flex flex-col z-20 relative">
      <div className="p-4 border-b border-border/50 flex items-center justify-between bg-background/50 backdrop-blur">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Bot className="w-5 h-5 text-primary neon-text" />
            {chatMutation.isPending && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-primary animate-ping" />
            )}
          </div>
          <span className="font-display font-bold text-sm tracking-widest text-primary">JARVIS</span>
        </div>
        <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
          AI Copilot
        </div>
      </div>

      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-6 pb-4">
          {localMessages.map((msg) => (
            <div key={msg.id} className={cn("flex flex-col gap-1", msg.role === "user" ? "items-end" : "items-start")}>
              <div className="flex items-center gap-2 px-1">
                <span className="text-[10px] font-mono text-muted-foreground uppercase">
                  {msg.role === "user" ? "User" : "JARVIS"}
                </span>
                <span className="text-[10px] font-mono text-muted-foreground/50">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div 
                className={cn(
                  "p-3 rounded-md max-w-[85%] text-sm leading-relaxed",
                  msg.role === "user" 
                    ? "bg-secondary text-secondary-foreground border border-secondary-border"
                    : "bg-primary/10 text-primary-foreground border border-primary/30 neon-border shadow-[0_0_15px_rgba(0,255,255,0.1)]"
                )}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {chatMutation.isPending && (
            <div className="flex flex-col gap-1 items-start">
              <div className="flex items-center gap-2 px-1">
                <span className="text-[10px] font-mono text-muted-foreground uppercase">JARVIS</span>
              </div>
              <div className="p-3 rounded-md bg-primary/5 border border-primary/20 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <span className="text-xs text-primary font-mono animate-pulse uppercase tracking-wider">Processing...</span>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-border/50 bg-background/50 backdrop-blur">
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="flex items-center gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a command..."
            className="flex-1 bg-black/50 border-primary/30 text-foreground font-mono text-sm focus-visible:ring-primary/50 focus-visible:border-primary placeholder:text-muted-foreground/50 h-10"
            disabled={!projectId || chatMutation.isPending}
          />
          <Button 
            type="submit" 
            size="icon" 
            disabled={!input.trim() || !projectId || chatMutation.isPending}
            className="bg-primary/20 text-primary border border-primary/50 hover:bg-primary/30 hover:text-primary transition-all neon-border h-10 w-10 shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </aside>
  );
}
