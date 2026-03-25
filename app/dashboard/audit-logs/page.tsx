"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ShieldAlert, User, Activity, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { useSession } from "@/lib/auth-client";

interface AuditLog {
  id: string;
  userId: string;
  action: "CREATE" | "UPDATE" | "DELETE";
  entity: string;
  entityId: string | null;
  details: string | null;
  createdAt: string;
  user: {
    name: string | null;
    email: string;
  };
}

export default function AuditLogsPage() {
  const { data: session } = useSession();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const activeBusinessId = (session?.user as any)?.activeBusinessId;
    if (!activeBusinessId) return;

    const fetchLogs = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/audit-logs?businessId=${activeBusinessId}`);
        if (!res.ok) {
          if (res.status === 403) throw new Error("You do not have permission to view audit logs.");
          throw new Error("Failed to fetch audit logs");
        }
        const data = await res.json();
        setLogs(data.data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [session]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          <p className="font-medium">{error}</p>
        </div>
      </div>
    );
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case "CREATE": return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "UPDATE": return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      case "DELETE": return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      default: return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400";
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4 border-b border-border pb-6">
        <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-xl">
          <ShieldAlert className="w-6 h-6 text-red-600 dark:text-red-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Security Audit Logs</h1>
          <p className="text-muted-foreground">Monitor critical system actions and staff activity.</p>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden text-card-foreground">
        {logs.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground flex flex-col items-center gap-3">
            <Activity className="w-10 h-10 opacity-50" />
            <p>No audit logs recorded yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {logs.map((log) => (
              <div key={log.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4 hover:bg-muted/50 transition-colors">
                
                {/* User Info */}
                <div className="flex items-center gap-3 w-full sm:w-1/4">
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center shrink-0">
                    <User className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-sm font-semibold truncate">{log.user?.name || "Unknown User"}</p>
                    <p className="text-xs text-muted-foreground truncate">{log.user?.email}</p>
                  </div>
                </div>

                {/* Arrow spacer for desktop */}
                <ArrowRight className="hidden sm:block w-4 h-4 text-muted-foreground shrink-0 opacity-50" />

                {/* Action & Entity */}
                <div className="flex items-center gap-3 w-full sm:w-auto shrink-0">
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider ${getActionColor(log.action)}`}>
                    {log.action}
                  </span>
                  <span className="text-xs font-medium px-2 py-1 rounded-md bg-secondary text-secondary-foreground uppercase border border-border">
                    {log.entity}
                  </span>
                </div>

                {/* Details */}
                <div className="w-full sm:flex-1 text-sm text-foreground my-2 sm:my-0">
                  {log.details ? (
                    <span className="break-words">{log.details.replace(/"/g, '')}</span>
                  ) : (
                    <span className="italic text-muted-foreground">No additional details recorded.</span>
                  )}
                </div>

                {/* Timestamp */}
                <div className="text-xs text-muted-foreground whitespace-nowrap sm:w-32 sm:text-right shrink-0">
                  {format(new Date(log.createdAt), "MMM d, h:mm a")}
                </div>

              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
