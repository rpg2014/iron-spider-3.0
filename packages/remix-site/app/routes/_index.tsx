import type { MetaFunction } from "react-router";
import { Suspense, useEffect, useState } from "react";
import { Link, useRevalidator } from "react-router";
import { Activity, CheckCircle, ExternalLink } from "lucide-react";
import { ProjectsNavItems, mainNavItems } from "~/components/NavMenu/navLinkConfig";
import { toast } from "sonner";
import { Skeleton } from "~/components/ui";
import { useFetcher } from "react-router";
import { Spinner } from "~/components/ui/Spinner";
import { useAuth } from "~/hooks/useAuth";

export const meta: MetaFunction = () => {
  return [
    { title: "Parker's Tools" },
    { name: "description", content: "Tool Hub & Playground" }
  ];
};

type CacheUpdate = {
  url: string;
  status: number;
};

function ServiceWorkerIndicator() {
  const [swStatus, setSwStatus] = useState('checking...');

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then(reg => {
        setSwStatus(reg?.active ? 'active' : 'inactive');
      });
    } else {
      setSwStatus('not supported');
    }
  }, []);

  return (
    <div className="flex items-center gap-2 text-xs my-1">
      <Activity size={14} className={swStatus === 'active' ? 'text-success' : 'text-muted-foreground'} />
      <span className="text-muted-foreground">SW: {swStatus}</span>
    </div>
  );
}

function ToolsSection() {
  // Combine all nav items from config
  const allTools = [...mainNavItems, ...ProjectsNavItems];

  const tools = allTools
    .filter(item => item.to !== '/') // Exclude home from tools list
    .map(item => {
      const label = 'text' in item ? item.text : item.label;
      const IconComponent = item.icon;
      return {
        name: label,
        description: item.description || `Access ${label}`,
        icon: IconComponent ? <IconComponent size={24} /> : <ExternalLink size={24} />,
        href: item.to,
        color: item.color || 'from-slate-500 to-slate-600'
      };
    });

  return (
    <section className="mb-6">
      <h2 className="text-2xl font-bold mb-6">Tools</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {tools.map((tool, i) => (
          <Link
            key={i}
            to={tool.href}
            prefetch="intent"
            className="group p-6 bg-secondary border border-border rounded-xl hover:border-accent hover:scale-105 transition-all"
          >
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-lg bg-gradient-to-br ${tool.color}  transition-transform`}>
                {tool.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold">{tool.name}</h3>
                  
                </div>
                <p className="text-sm text-muted-foreground">{tool.description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}



function ServiceWorkerStatusSection() {
  const [isClient, setIsClient] = useState(false);
  const [cacheUpdates, setCacheUpdates] = useState<CacheUpdate[]>([]);
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const cacheUpdateEventListener = (event: MessageEvent<any>) => {
      const cacheUpdate: CacheUpdate & { type: string } = event.data;
      if (cacheUpdate.type === "cache-update") {
        const urlToShow = cacheUpdate.url.replace(window.location.origin, "");
        setCacheUpdates(list => list.concat({ ...cacheUpdate, url: urlToShow }));

        // Show toast notification using sonner
        toast.success("Cache Updated", {
          description: `${urlToShow} (Status: ${cacheUpdate.status})`,
          duration: 5000,
        });
      }
    };

    const swStatusEventListener = (event: MessageEvent<any>) => {
      if (event.data?.type === 'sw-status') {
        // Handle the cache update event
        // Show toast notification using sonner
        if (event.data.status === 'ready') {
          toast.success("Service worker ready", {
            description: `Service worker is ready for ${event.data.url}`,
            duration: 2000,
          });
        } else {
          toast.error("Service worker error", {
            description: `Service worker error for ${event.data.url}: ${event.data.message}`,
            duration: 5000,
          });
        }
      }
    }

    if (typeof navigator !== 'undefined' && navigator.serviceWorker) {
      // When page loads
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'page-loaded' });
        navigator.serviceWorker.addEventListener('message', swStatusEventListener);
      }
      // setup cache update listener
      navigator.serviceWorker.addEventListener("message", cacheUpdateEventListener);
      return () => {
        navigator.serviceWorker.removeEventListener("message", cacheUpdateEventListener);
        navigator.serviceWorker.removeEventListener('message', swStatusEventListener);
      }
    }
  }, []);

  return (
    <section className="my-6">
      <h2 className="text-2xl font-bold mb-6">Service Worker Status</h2>
      {isClient ? (
        <>
          <ServiceWorkerIndicator />
          <div className="p-6 bg-secondary border border-border rounded-xl">
            <div className="space-y-4">
              {cacheUpdates && cacheUpdates.length > 0 ? cacheUpdates.map(cacheUpdate => {
                return (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{cacheUpdate.url}</span>
                    <span className="font-mono text-sm text-muted-foreground">
                      {cacheUpdate.status}
                    </span>
                  </div>
                )
              }) : <span className="font-mono text-sm text-muted-foreground" >Waiting for cache updates</span>}

            </div>
          </div>
        </>
      ) : (
        <div className="p-6 bg-card border border-border rounded-xl">
          <div className="space-y-4">
            
          </div>
        </div>
      )}
    </section>
  );
}

function LambdaStatusSection({ revalidated }: { revalidated: boolean }) {
 
  return (
    <section className="my-6">
      <h2 className="text-2xl font-bold mb-6">Lambda Status</h2>
      <div className="p-6 bg-secondary border border-border rounded-xl">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-lg bg-gradient-to-br ${revalidated ? 'from-green-500 to-emerald-500' : 'from-orange-500 to-yellow-500'} transition-all`}>
            {revalidated ? <CheckCircle size={24} /> : <Spinner scale={0.8} />}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold mb-1">
              {revalidated ? 'Lambda Ready' : 'Initializing Lambda'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {revalidated ? 'Edge function is warmed up and ready' : 'Warming up edge function...'}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}


export default function Index() {
  const fetcher = useFetcher()
  const revalidator = useRevalidator();
  const [revalidated, setRevalidated] = useState(false);
  const [triggeredRevalidation, setTriggeredRevalidation] = useState(false);
  

  // wake the edge lambda by loading the dates index
  useEffect(() => {
    // if on client, load
    console.log("Index route useEffect running");
    if(typeof window !== 'undefined') {
      console.log("Loading /dates to wake both lambdas");
      fetcher.load("/dates")

      revalidator.revalidate();
      setTriggeredRevalidation(true);
    }
  }, []);

  useEffect(() => {
    if (revalidator.state === 'idle' && triggeredRevalidation) {
      setRevalidated(true);
    }
  },[revalidator.state, triggeredRevalidation])



  const auth =useAuth();
  return (
    <div className="min-h-screen text-foreground">
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Parker's Tools</h1>
          
        </div> */}

        <ToolsSection />

        <ServiceWorkerStatusSection />
         <LambdaStatusSection revalidated={revalidated} />
         
          <div className="flex items-center gap-2 text-xs my-1">
            <Activity size={14} className={auth.isAuthenticated  ? 'text-success' : 'text-muted-foreground'} />
            <span className="text-muted-foreground">isAuthenticated: {auth.isAuthenticated ? "Yes" : 'No'}</span>
         </div>
        </main>
    </div>
  );
}
