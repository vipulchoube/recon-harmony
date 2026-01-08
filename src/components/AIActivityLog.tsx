import { useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, CheckCircle2, AlertCircle, Loader2, Clock } from "lucide-react";

export interface ActivityLogEntry {
  id: string;
  timestamp: Date;
  message: string;
  type: "info" | "success" | "error" | "processing";
}

interface AIActivityLogProps {
  logs: ActivityLogEntry[];
  title?: string;
}

export function AIActivityLog({ logs, title = "AI Agent Activity" }: AIActivityLogProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new logs are added
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const getIcon = (type: ActivityLogEntry["type"]) => {
    switch (type) {
      case "success":
        return <CheckCircle2 className="h-3 w-3 text-success shrink-0" />;
      case "error":
        return <AlertCircle className="h-3 w-3 text-destructive shrink-0" />;
      case "processing":
        return <Loader2 className="h-3 w-3 text-primary animate-spin shrink-0" />;
      default:
        return <Clock className="h-3 w-3 text-muted-foreground shrink-0" />;
    }
  };

  return (
    <Card className="glass-card">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Bot className="h-4 w-4 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[200px]" ref={scrollRef}>
          <div className="space-y-1 font-mono text-xs">
            {logs.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No activity yet. Start a process to see AI agent logs.
              </p>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-2 py-1 px-2 rounded hover:bg-muted/50 transition-colors"
                >
                  {getIcon(log.type)}
                  <span className="text-muted-foreground shrink-0">
                    [{log.timestamp.toLocaleTimeString()}]
                  </span>
                  <span
                    className={
                      log.type === "error"
                        ? "text-destructive"
                        : log.type === "success"
                        ? "text-success"
                        : log.type === "processing"
                        ? "text-primary"
                        : "text-foreground"
                    }
                  >
                    {log.message}
                  </span>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
