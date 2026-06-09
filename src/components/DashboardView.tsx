import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Users, Send, Calendar, Clock, Activity, CheckCircle2, XCircle, Bot } from 'lucide-react';

interface LogEvent {
  id: string | number;
  timestamp: string;
  type: string;
  message?: string;
  stat?: string;
  count?: number;
}

export default function DashboardView() {
  const [stats, setStats] = useState({ sent: 0, scheduled: 0, groups: 0 });
  const [logs, setLogs] = useState<LogEvent[]>([]);

  useEffect(() => {
    // Fetch initial stats
    fetch('/api/dashboard-stats')
      .then(res => res.json())
      .then(data => {
        if (data) {
          setStats({ sent: data.sent || 0, scheduled: data.scheduled || 0, groups: data.groups || 0 });
        }
      })
      .catch(() => {});

    // Listen to real-time events from our SSE route
    const evtSource = new EventSource('/api/events');
    
    evtSource.onmessage = (event) => {
      try {
        const data: LogEvent = JSON.parse(event.data);
        if (data.type === 'stats_update') {
          if (data.stat && data.count !== undefined) {
             setStats(prev => ({ ...prev, [data.stat!]: prev[data.stat as keyof typeof prev] + data.count! }));
          }
        } else {
          setLogs(prev => [data, ...prev].slice(0, 20)); // Keep last 20 logs
        }
      } catch (e) {
        console.error("Error parsing event", e);
      }
    };

    return () => {
      evtSource.close();
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Messages Sent</CardTitle>
            <Send className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.sent.toLocaleString()}</div>
            <p className="text-xs text-gray-500 mt-1">+14% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Active Schedules</CardTitle>
            <Calendar className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.scheduled}</div>
            <p className="text-xs text-gray-500 mt-1">2 firing today</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Connected Groups</CardTitle>
            <Users className="w-4 h-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.groups}</div>
            <p className="text-xs text-gray-500 mt-1">Syncing optimally</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Activity Overview</CardTitle>
            <CardDescription>Message volume outbox over 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-48 flex items-end justify-between px-2">
              {/* Mock Bar Chart */}
              {[40, 70, 30, 90, 110, 50, 80].map((h, i) => (
                <div key={i} className="flex flex-col items-center gap-2 group">
                  <div 
                    style={{ height: `${h}%` }} 
                    className="w-12 bg-emerald-100 rounded-t-md group-hover:bg-emerald-500 transition-colors duration-300" 
                  />
                  <span className="text-sm text-gray-400 font-medium">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i]}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-500" />
              Real-time Activity Log
            </CardTitle>
            <CardDescription>Live events from backend services</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
            {logs.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">Waiting for events...</div>
            ) : (
              logs.map(log => (
                <div key={log.id} className="flex items-start gap-4 text-sm animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className={`p-2 rounded-md ${
                    log.type === 'success' ? 'bg-emerald-100 text-emerald-600' :
                    log.type === 'error' ? 'bg-red-100 text-red-600' :
                    log.type === 'ai' ? 'bg-purple-100 text-purple-600' :
                    'bg-blue-100 text-blue-600'
                  }`}>
                    {log.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> :
                     log.type === 'error' ? <XCircle className="w-4 h-4" /> :
                     log.type === 'ai' ? <Bot className="w-4 h-4" /> :
                     <Activity className="w-4 h-4" />}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-800 break-words">{log.message}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{new Date(log.timestamp).toLocaleTimeString()}</p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
