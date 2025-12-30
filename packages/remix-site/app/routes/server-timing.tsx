import type { MetaFunction } from "react-router";
import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/Table";
import { toast } from "sonner";
import { useLocalStorage } from "~/hooks/useLocalStorage.client";

export const meta: MetaFunction = () => {
  return [
    { title: "Server Timing" },
    { name: "description", content: "Performance timing data from server-timing headers" }
  ];
};

interface TimingEntry {
  name: string;
  duration: number | null;
  description: string | null;
  path?: string;
}

interface ServerTimingPerformanceEntry {
  name: string;
  duration: number;
  description: string;
}

interface AuthMetrics {
  authV1DurationMs: number | null;
  authV2DurationMs: number | null;
  authV2MigrationShadowMode: string | null;
}

function ServerTimingTable() {
  const [timings, setTimings] = useState<TimingEntry[]>([]);
  const [pageLoad, setPageLoad] = useState<PerformanceNavigationTiming | null>(null);
  const [authMetrics, setAuthMetrics] = useState<AuthMetrics>({
    authV1DurationMs: null,
    authV2DurationMs: null,
    authV2MigrationShadowMode: null,
  });

  const [authV1Average, setAuthV1Average] = useLocalStorage('authV1Average', { sum: 0, count: 0 });
  const [authV2Average, setAuthV2Average] = useLocalStorage('authV2Average', { sum: 0, count: 0 });

  useEffect(() => {
    // Get server-timing from performance entries
    const perfEntries = performance.getEntriesByType("navigation");
    if (perfEntries.length > 0) {
      const navTiming = perfEntries[0] as PerformanceNavigationTiming;
      setPageLoad(navTiming);
    }

    // Parse Server-Timing headers from performance API
    // The performance API captures Server-Timing via PerformanceServerTiming
    const serverTimingEntries = performance.getEntriesByType("navigation")
      .concat(performance.getEntriesByType("measure"))
      .concat(performance.getEntriesByType("resource"))
      .concat(performance.getEntriesByType("taskattribution"))
      .flatMap(entry => {
        if ("serverTiming" in entry && Array.isArray(entry.serverTiming)) {
          return (entry.serverTiming as ServerTimingPerformanceEntry[]).map(st => ({
            name: st.name,
            duration: st.duration,
            description: st.description || null,
            path: "name" in entry ? entry.name : undefined,
          }));
        }
        return [];
      });

    if (serverTimingEntries.length > 0) {
      setTimings(serverTimingEntries);

      // Extract auth metrics from serverTimingEntries
      const authV1Entries = serverTimingEntries.filter(st => st.name === "authV1");
      const authV2Entries = serverTimingEntries.filter(st => st.name === "authV2");
      const shadowModeEntries = serverTimingEntries.filter(st => st.name === "shadow");

      const authV1Avg = authV1Entries.length > 0
        ? authV1Entries.reduce((sum, entry) => sum + entry.duration, 0) / authV1Entries.length
        : null;

      const authV2Avg = authV2Entries.length > 0
        ? authV2Entries.reduce((sum, entry) => sum + entry.duration, 0) / authV2Entries.length
        : null;

      // Update long-running averages
      if (authV1Avg !== null) {
        setAuthV1Average(prev => ({
          sum: prev.sum + authV1Avg,
          count: prev.count + 1
        }));
      }

      if (authV2Avg !== null) {
        setAuthV2Average(prev => ({
          sum: prev.sum + authV2Avg,
          count: prev.count + 1
        }));
      }

      const allShadowSuccess = shadowModeEntries.length > 0 &&
        shadowModeEntries.every(entry => entry.duration === 1);

      setAuthMetrics({
        authV1DurationMs: authV1Avg,
        authV2DurationMs: authV2Avg,
        authV2MigrationShadowMode: shadowModeEntries.length > 0
          ? (allShadowSuccess ? "success" : "failure")
          : null,
      });
    } else {
      // Fallback: Try to parse Server-Timing header from response
      // Note: Direct header access isn't available in browser, but we can check performance entries
      // If that fails, show message
      toast.info("No Server-Timing entries found in Performance API");
      if (timings.length === 0) {
        // Try to get from latest navigation
        const nav = performance.getEntriesByType("navigation")[0] as any;
        if (nav && nav.serverTiming) {
          setTimings(nav.serverTiming);
        }
      }
    }
  }, []);

  // Group timings by path
  const groupedTimings = timings.reduce((acc, timing) => {
    const path = timing.path || "unknown";
    if (!acc[path]) {
      acc[path] = [];
    }
    acc[path].push(timing);
    return acc;
  }, {} as Record<string, TimingEntry[]>);

  const sortedPaths = Object.keys(groupedTimings).sort();

  return (
    <div className="w-full max-w-4xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Server Timing</h1>
        <p className="text-muted-foreground">
          Performance timing data from server-timing headers and performance API.   Mainly doing this to see specific function performance data from the backend.
        </p>
      </div>

      {timings && timings.length > 0 ? (
        <div className="space-y-4">
          {(authMetrics.authV1DurationMs !== null || authMetrics.authV2DurationMs !== null) && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Auth Performance Comparison</h2>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Metric</TableHead>
                      <TableHead className="text-right">Duration (ms)</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-mono text-sm">Auth V1 Average</TableCell>
                      <TableCell className="text-right">
                        {authMetrics.authV1DurationMs !== null
                          ? authMetrics.authV1DurationMs.toFixed(2)
                          : "-"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">Current</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-mono text-sm">Auth V2 Average</TableCell>
                      <TableCell className="text-right">
                        {authMetrics.authV2DurationMs !== null
                          ? authMetrics.authV2DurationMs.toFixed(2)
                          : "-"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">Migration</TableCell>
                    </TableRow>
                    <TableRow >
                      <TableCell className="font-mono text-sm">Auth V1 Long-Running Avg</TableCell>
                      <TableCell className="text-right">
                        {authV1Average.count > 0
                          ? (authV1Average.sum / authV1Average.count).toFixed(2)
                          : "-"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">({authV1Average.count} samples)</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-mono text-sm">Auth V2 Long-Running Avg</TableCell>
                      <TableCell className="text-right">
                        {authV2Average.count > 0
                          ? (authV2Average.sum / authV2Average.count).toFixed(2)
                          : "-"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">({authV2Average.count} samples)</TableCell>
                    </TableRow>
                    {authMetrics.authV1DurationMs !== null && authMetrics.authV2DurationMs !== null && (
                      <TableRow className="bg-muted/50">
                        <TableCell className="font-mono text-sm font-semibold">Average</TableCell>
                        <TableCell className="text-right font-semibold">
                          {((authMetrics.authV1DurationMs + authMetrics.authV2DurationMs) / 2).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-sm">
                          <span className={`font-semibold ${authMetrics.authV2MigrationShadowMode === 'success'
                              ? 'text-green-600'
                              : 'text-red-600'
                            }`}>
                            {authMetrics.authV2MigrationShadowMode === 'success' ? '✓ Match' : '✗ Mismatch'}
                          </span>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
          <div>
            <h2 className="text-xl font-semibold mb-4">Server Timing Entries</h2>
            <div className="space-y-6">
              {sortedPaths.map((path) => (
                <div key={path} className="border rounded-lg overflow-hidden">
                  <div className="bg-muted px-4 py-2 border-b">
                    <p className="text-sm font-semibold text-muted-foreground">{path}</p>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead className="text-right">Duration (ms)</TableHead>
                        <TableHead>Description</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {groupedTimings[path].map((entry, idx) => (
                        <TableRow key={`${entry.name}-${idx}`}>
                          <TableCell className="font-mono text-sm">{entry.name}</TableCell>
                          <TableCell className="text-right">
                            {entry.duration !== null ? entry.duration.toFixed(2) : "-"}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {entry.description || "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ))}
            </div>
          </div>

          {pageLoad && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Page Load Metrics</h2>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Metric</TableHead>
                      <TableHead className="text-right">Time (ms)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-mono text-sm">DNS Lookup</TableCell>
                      <TableCell className="text-right">
                        {(pageLoad.domainLookupEnd - pageLoad.domainLookupStart).toFixed(2)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-mono text-sm">TCP Connection</TableCell>
                      <TableCell className="text-right">
                        {(pageLoad.connectEnd - pageLoad.connectStart).toFixed(2)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-mono text-sm">Request Time</TableCell>
                      <TableCell className="text-right">
                        {(pageLoad.responseStart - pageLoad.requestStart).toFixed(2)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-mono text-sm">Response Time</TableCell>
                      <TableCell className="text-right">
                        {(pageLoad.responseEnd - pageLoad.responseStart).toFixed(2)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-mono text-sm">DOM Content Loaded</TableCell>
                      <TableCell className="text-right">
                        {(pageLoad.domContentLoadedEventEnd - pageLoad.domContentLoadedEventStart).toFixed(2)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-mono text-sm">Load Event</TableCell>
                      <TableCell className="text-right">
                        {(pageLoad.loadEventEnd - pageLoad.loadEventStart).toFixed(2)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-mono text-sm">Total Navigation Time</TableCell>
                      <TableCell className="text-right">
                        {(pageLoad.loadEventEnd - pageLoad.fetchStart).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="border border-dashed rounded-lg p-8 text-center">
          <p className="text-muted-foreground">
            No server timing data available yet.
          </p>
          <p className="text-xs text-muted-foreground mt-4">
            Server-Timing headers are captured by the browser automatically. Try clicking around some, mainly the server page returns them
          </p>
        </div>
      )}

      <div className="bg-muted p-4 rounded-lg">
        <h3 className="font-semibold mb-2">About Server Timing</h3>
        <p className="text-sm text-muted-foreground">
          The Server-Timing header is used to communicate one or more metrics and descriptions for the request-response cycle.
          This page displays those metrics along with standard page load performance metrics from the Performance API.
        </p>
      </div>
    </div>
  );
}

export default ServerTimingTable;
