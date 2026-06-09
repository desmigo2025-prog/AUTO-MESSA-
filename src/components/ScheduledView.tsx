import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarClock, Clock, Users, MessageSquare } from 'lucide-react';

export default function ScheduledView() {
  const [scheduledCampaigns, setScheduledCampaigns] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/campaigns')
      .then(res => res.json())
      .then(data => {
        if (data.campaigns) {
          // Filter only active campaigns (those that are currently scheduled to run)
          const active = data.campaigns.filter((c: any) => c.status === 'active');
          setScheduledCampaigns(active);
        }
        setIsLoading(false);
      })
      .catch(() => {
        setIsLoading(false);
      });
  }, []);

  const formatTime = (timeStr: string) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    const h = parseInt(hours);
    const suffix = h >= 12 ? 'PM' : 'AM';
    const formattedH = h % 12 || 12;
    return `${formattedH.toString().padStart(2, '0')}:${minutes} ${suffix}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">Scheduled Appointments / Campaigns</h2>
          <p className="text-gray-500 text-sm">View currently active and scheduled automated runs.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-gray-500">Loading scheduled campaigns...</div>
      ) : scheduledCampaigns.length === 0 ? (
        <Card className="bg-gray-50 border-dashed">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <CalendarClock className="w-12 h-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-700">No Scheduled Campaigns</h3>
            <p className="text-gray-500 max-w-sm mt-2">
              You don't have any active campaigns. Go to the Campaigns tab to create and schedule one.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {scheduledCampaigns.map((camp) => (
            <Card key={camp.id} className="relative overflow-hidden border-emerald-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
              <CardHeader className="pb-3 border-b bg-emerald-50/30">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg font-semibold text-gray-800">{camp.name}</CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1.5 text-emerald-700 font-medium bg-emerald-100/50 w-fit px-2 py-0.5 rounded-sm">
                      <Clock className="w-3.5 h-3.5" />
                      {camp.scheduleType} at {formatTime(camp.scheduleTime)}
                    </CardDescription>
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-none">Active</Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-4 grid gap-4">
                <div className="flex gap-4">
                  <div className="flex-1 bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium mb-1 uppercase tracking-wider">
                      <Users className="w-3.5 h-3.5" /> Targets
                    </div>
                    <div className="font-semibold text-gray-800">
                      {camp.targets.length} {camp.targets.length === 1 ? 'Contact/Group' : 'Contacts/Groups'}
                    </div>
                  </div>
                  <div className="flex-1 bg-gray-50 rounded-lg p-3">
                     <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium mb-1 uppercase tracking-wider">
                      <MessageSquare className="w-3.5 h-3.5" /> Sent So Far
                    </div>
                    <div className="font-semibold text-gray-800">
                      {camp.messagesSent} Messages
                    </div>
                  </div>
                </div>
                <div>
                   <div className="text-xs text-gray-500 font-medium mb-1.5">Message Preview</div>
                   <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-600 line-clamp-3">
                     {camp.message}
                   </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
