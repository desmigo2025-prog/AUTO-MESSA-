import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Play, Pause, Trash2, Calendar, Loader2, Sparkles } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

export default function CampaignsView() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [chats, setChats] = useState<{id: string, name: string}[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCampaigns = () => {
    fetch('/api/campaigns')
      .then(res => res.json())
      .then(data => {
        if (data.campaigns) setCampaigns(data.campaigns);
        setIsLoading(false);
      })
      .catch(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchCampaigns();
    fetch('/api/chats')
      .then(res => res.json())
      .then(data => {
        if (data.chats) setChats(data.chats);
      })
      .catch(() => {});
  }, []);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // New campaign form state
  const [newName, setNewName] = useState('');
  const [newTargets, setNewTargets] = useState<string[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [attachmentType, setAttachmentType] = useState('none');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [newScheduleType, setNewScheduleType] = useState('Daily');
  const [newScheduleTime, setNewScheduleTime] = useState('09:00');
  const [isCreating, setIsCreating] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const toggleCampaignStatus = async (id: string) => {
    // Optimistic UI update
    setCampaigns(campaigns.map(c => 
      c.id === id 
        ? { ...c, status: c.status === 'active' ? 'paused' : 'active' }
        : c
    ));
    await fetch(`/api/campaigns/${id}/toggle`, { method: 'PUT' });
    fetchCampaigns();
  };

  const removeCampaign = async (id: string) => {
    if (!confirm('Are you sure you want to delete this campaign?')) return;
    setCampaigns(campaigns.filter(c => c.id !== id));
    await fetch(`/api/campaigns/${id}`, { method: 'DELETE' });
  };

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':');
    const h = parseInt(hours);
    const suffix = h >= 12 ? 'PM' : 'AM';
    const formattedH = h % 12 || 12;
    return `${formattedH.toString().padStart(2, '0')}:${minutes} ${suffix}`;
  };

  const handleGenerateMessage = async () => {
    if (!(newName || '').trim()) {
      alert("Please enter a campaign name first so AI knows what to write about.");
      return;
    }
    setIsGenerating(true);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          topic: newName, 
          context: 'An automated recurring campaign message', 
          audience: 'Customers or Team', 
          tone: 'Professional and engaging' 
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Server error");
      }
      if (data.text) {
        setNewMessage(data.text);
      }
    } catch(e: any) {
      console.error(e);
      alert(e.message || "Failed to generate message. The model might be experiencing high demand. Please try again later.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCreateCampaign = async () => {
    if (!(newName || '').trim() || newTargets.length === 0 || !newScheduleTime || !(newMessage || '').trim()) return;
    
    setIsCreating(true);
    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          scheduleType: newScheduleType,
          scheduleTime: newScheduleTime,
          targets: newTargets,
          message: newMessage,
          attachmentType: attachmentType,
          attachmentUrl: (attachmentUrl || '').trim() ? attachmentUrl : undefined
        })
      });
      if (res.ok) {
        fetchCampaigns();
        setNewName('');
        setNewTargets([]);
        setNewMessage('');
        setAttachmentType('none');
        setAttachmentUrl('');
        setNewScheduleType('Daily');
        setNewScheduleTime('09:00');
        setIsDialogOpen(false);
      }
    } catch(e) {
      alert("Failed to create campaign");
    }
    setIsCreating(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">Manage Campaigns</h2>
          <p className="text-gray-500 text-sm">Automate your messaging across multiple segments</p>
        </div>
        
        <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setIsDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Campaign
        </Button>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create Campaign</DialogTitle>
              <DialogDescription>
                Set up a new automated messaging schedule.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
              <div className="grid gap-2">
                <Label htmlFor="name">Campaign Name</Label>
                <Input 
                  id="name" 
                  placeholder="e.g. Daily Standup Prompt" 
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Repeat Frequency</Label>
                  <Select value={newScheduleType} onValueChange={setNewScheduleType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Daily">Daily</SelectItem>
                      <SelectItem value="Weekdays">Weekdays</SelectItem>
                      <SelectItem value="Weekends">Weekends</SelectItem>
                      <SelectItem value="Mondays">Mondays</SelectItem>
                      <SelectItem value="Fridays">Fridays</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="time">Time</Label>
                  <Input 
                    id="time" 
                    type="time" 
                    value={newScheduleTime}
                    onChange={e => setNewScheduleTime(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Target Groups / Contacts</Label>
                <div className="border border-gray-200 rounded-md max-h-32 overflow-y-auto bg-gray-50 p-2 text-sm">
                  {chats.length > 0 ? (
                    chats.map(chat => (
                      <label key={chat.id} className="flex items-center gap-2 p-1 hover:bg-gray-100 cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                          checked={newTargets.includes(chat.id)}
                          onChange={(e) => {
                            if (e.target.checked) setNewTargets([...newTargets, chat.id]);
                            else setNewTargets(newTargets.filter(id => id !== chat.id));
                          }}
                        />
                        <span>{chat.name}</span>
                      </label>
                    ))
                  ) : (
                    <div className="text-gray-500 italic p-2 text-xs">No chats found. Please connect WhatsApp first in the connection tab.</div>
                  )}
                </div>
              </div>
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label>Message Content</Label>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-7 text-xs text-purple-600 bg-purple-50 border-purple-200 hover:bg-purple-100 hover:text-purple-700"
                    onClick={handleGenerateMessage}
                    disabled={isGenerating || !(newName || '').trim()}
                  >
                    {isGenerating ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Sparkles className="w-3 h-3 mr-1" />}
                    Auto-Generate
                  </Button>
                </div>
                <Textarea 
                  placeholder="Message to be sent automatically..."
                  className="h-24 resize-none mb-3"
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                />
                <div className="flex flex-col sm:flex-row gap-2">
                  <Select value={attachmentType} onValueChange={v => { setAttachmentType(v); setAttachmentUrl(''); }}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="Attachment" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Media</SelectItem>
                      <SelectItem value="image">Image URL</SelectItem>
                      <SelectItem value="video">Video URL</SelectItem>
                      <SelectItem value="document_url">Document URL</SelectItem>
                      <SelectItem value="link">Link</SelectItem>
                      <SelectItem value="file">File Upload</SelectItem>
                    </SelectContent>
                  </Select>
                  {attachmentType !== 'none' && attachmentType !== 'file' && (
                    <div className="flex-1">
                      <Input
                        placeholder={`Enter ${attachmentType} URL...`}
                        value={attachmentUrl}
                        onChange={e => setAttachmentUrl(e.target.value)}
                        className="w-full"
                      />
                    </div>
                  )}
                  {attachmentType === 'file' && (
                    <div className="flex-1">
                      <Input
                        type="file"
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (file) {
                             if (file.size > 15 * 1024 * 1024) {
                               alert("File size must be less than 15MB");
                               e.target.value = '';
                               return;
                             }
                             const reader = new FileReader();
                             reader.onload = () => {
                               setAttachmentUrl(reader.result as string);
                             };
                             reader.readAsDataURL(file);
                          } else {
                             setAttachmentUrl('');
                          }
                        }}
                        className="w-full"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateCampaign} disabled={isCreating || !(newName || '').trim() || newTargets.length === 0 || !(newMessage || '').trim()} className="bg-emerald-600 hover:bg-emerald-700">
                {isCreating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Save Campaign
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Campaign Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Targets</TableHead>
              <TableHead>Schedule</TableHead>
              <TableHead className="text-right">Sent</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4 text-gray-500">Loading campaigns...</TableCell>
              </TableRow>
            )}
            {!isLoading && campaigns.map((camp) => (
              <TableRow key={camp.id}>
                <TableCell className="font-medium">{camp.name}</TableCell>
                <TableCell>
                  {camp.status === 'active' ? (
                    <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-none">Active</Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-gray-100 text-gray-800 border-none">Paused</Badge>
                  )}
                </TableCell>
                <TableCell className="text-gray-600">
                  {camp.targets.length} {camp.targets.length === 1 ? 'Target' : 'Targets'}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    {camp.scheduleType} at {formatTime(camp.scheduleTime)}
                  </div>
                </TableCell>
                <TableCell className="text-right font-medium">{camp.messagesSent}</TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => toggleCampaignStatus(camp.id)}
                      className="h-8 w-8 text-gray-500 hover:text-emerald-600"
                      title={camp.status === 'active' ? "Pause Campaign" : "Resume Campaign"}
                    >
                      {camp.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => removeCampaign(camp.id)}
                      className="h-8 w-8 text-gray-500 hover:text-red-500"
                      title="Delete Campaign"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {!isLoading && campaigns.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  No campaigns created yet. Click "Create Campaign" to get started.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
      
    </div>
  );
}
