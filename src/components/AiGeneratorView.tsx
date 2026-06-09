import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Sparkles, Send, Copy, BookmarkPlus, Loader2, Paperclip, Link, Image as ImageIcon, Video } from 'lucide-react';

export default function AiGeneratorView() {
  const [topic, setTopic] = useState('');
  const [tone, setTone] = useState('professional');
  const [length, setLength] = useState('medium');
  const [keywords, setKeywords] = useState('');
  
  const [generatedMessage, setGeneratedMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  
  const [chats, setChats] = useState<{id: string, name: string}[]>([]);
  const [selectedChats, setSelectedChats] = useState<string[]>([]);
  
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [attachmentType, setAttachmentType] = useState('link');
  
  useEffect(() => {
    fetch('/api/chats')
      .then(res => res.json())
      .then(data => {
        if (data.chats) setChats(data.chats);
      })
      .catch(() => {});
  }, []);

  const handleSend = async () => {
    if (selectedChats.length === 0) {
      alert("Please select at least one target chat.");
      return;
    }
    setIsSending(true);
    try {
      const res = await fetch('/api/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          chatIds: selectedChats, 
          message: generatedMessage,
          attachmentUrl: (attachmentUrl || '').trim() ? attachmentUrl : undefined,
          attachmentType
        })
      });
      const data = await res.json();
      if (data.success) {
        alert("Messages sent successfully!");
        setGeneratedMessage('');
        setAttachmentUrl('');
      } else {
        alert("Notice: " + (data.error || "Failed to send messages."));
      }
    } catch (e) {
      alert("An error occurred while sending.");
    }
    setIsSending(false);
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          tone,
          length,
          keywords: (keywords || '').split(',').map(k => k.trim()).filter(k => k)
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Server error");
      }
      setGeneratedMessage(data.text || '');
    } catch (e: any) {
      console.error(e);
      alert(e.message || 'Failed to generate message. The model might be experiencing high demand. Please try again later.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Controls */}
      <div className="lg:col-span-5 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>AI Instructions</CardTitle>
            <CardDescription>Tell the AI what you want to communicate</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Topic or Subject</label>
              <Textarea 
                placeholder="e.g. Weekly team sync schedule update..."
                className="resize-none h-24"
                value={topic}
                onChange={e => setTopic(e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Desired Tone</label>
                <select 
                  className="flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={tone}
                  onChange={e => setTone(e.target.value)}
                >
                  <option value="professional">Professional</option>
                  <option value="friendly">Friendly & Casual</option>
                  <option value="urgent">Urgent</option>
                  <option value="motivational">Motivational</option>
                  <option value="marketing">Marketing/Sales</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Length</label>
                <select 
                  className="flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={length}
                  onChange={e => setLength(e.target.value)}
                >
                  <option value="short">Short</option>
                  <option value="medium">Medium</option>
                  <option value="long">Long & Detailed</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Keywords (comma separated)</label>
              <Input 
                placeholder="e.g. deadline, Friday, mandatory" 
                value={keywords}
                onChange={e => setKeywords(e.target.value)}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleGenerate} disabled={isGenerating || !(topic || '').trim()} className="w-full bg-emerald-600 hover:bg-emerald-700">
              {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
              Generate Draft
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Editor/Result */}
      <div className="lg:col-span-7 h-full">
        <Card className="h-full flex flex-col">
          <CardHeader className="border-b">
            <CardTitle>Draft Composition</CardTitle>
            <CardDescription>Review, edit, and attach media before sending.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 p-0 flex flex-col">
            <div className="bg-gray-50 flex-1 p-4 flex flex-col gap-4">
              <textarea 
                className="w-full flex-1 min-h-[250px] bg-white border border-gray-200 rounded-lg p-4 resize-none focus:ring-2 focus:ring-emerald-500 focus:outline-none shadow-sm"
                placeholder="Your generated message will appear here..."
                value={generatedMessage}
                onChange={e => setGeneratedMessage(e.target.value)}
              ></textarea>
              
              {/* Attachment Section */}
              <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <Paperclip className="w-4 h-4 text-gray-500" />
                  <h4 className="font-semibold text-sm text-gray-700">Add Media / Link Attachment</h4>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <select 
                    className="flex h-10 w-full sm:w-[150px] items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
                    value={attachmentType}
                    onChange={(e) => { setAttachmentType(e.target.value); setAttachmentUrl(''); }}
                  >
                    <option value="link">Public Link</option>
                    <option value="image">Image URL</option>
                    <option value="video">Video URL</option>
                    <option value="document_url">Document URL</option>
                    <option value="file">File Upload</option>
                  </select>
                  <div className="relative flex-1">
                    {attachmentType !== 'file' ? (
                      <>
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          {attachmentType === 'image' ? <ImageIcon className="h-4 w-4 text-gray-400" /> : 
                           attachmentType === 'video' ? <Video className="h-4 w-4 text-gray-400" /> : 
                           <Link className="h-4 w-4 text-gray-400" />}
                        </div>
                        <Input 
                          className="pl-9"
                          placeholder={
                            attachmentType === 'image' ? "https://example.com/image.jpg" :
                            attachmentType === 'video' ? "https://example.com/video.mp4" :
                            attachmentType === 'document_url' ? "https://example.com/doc.pdf" :
                            "https://example.com/article"
                          }
                          value={attachmentUrl}
                          onChange={(e) => setAttachmentUrl(e.target.value)}
                        />
                      </>
                    ) : (
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
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="border-t bg-gray-50 flex-col gap-4 p-4">
            {/* Target Selection */}
            <div className="w-full space-y-2">
              <label className="text-sm font-medium">Select Target Groups / Contacts</label>
              <div className="border border-gray-200 rounded-md max-h-32 overflow-y-auto bg-white p-2 text-sm">
                {chats.length > 0 ? (
                  chats.map(chat => (
                    <label key={chat.id} className="flex items-center gap-2 p-1 hover:bg-gray-50 cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                        checked={selectedChats.includes(chat.id)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedChats([...selectedChats, chat.id]);
                          else setSelectedChats(selectedChats.filter(id => id !== chat.id));
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
            
            <div className="flex justify-between items-center w-full">
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={async () => {
                  if (!generatedMessage.trim()) {
                     alert("Nothing to copy! Please write or generate a message first.");
                     return;
                  }
                  if (generatedMessage) {
                    try {
                      let copied = false;
                      if (navigator.clipboard) {
                        try {
                          await navigator.clipboard.writeText(generatedMessage);
                          copied = true;
                        } catch(e) {}
                      }
                      if (!copied) {
                        const textArea = document.createElement("textarea");
                        textArea.value = generatedMessage;
                        textArea.style.position = "fixed";
                        textArea.style.left = "-999999px";
                        textArea.style.top = "-999999px";
                        document.body.appendChild(textArea);
                        textArea.focus();
                        textArea.select();
                        try {
                          if (document.execCommand('copy')) {
                            copied = true;
                          }
                        } catch(e) {}
                        textArea.remove();
                      }
                      if (copied) {
                         alert("Copied to clipboard!");
                      } else {
                         alert("Please manually copy the text.");
                      }
                    } catch(err) {
                      alert("Please manually copy the text.");
                    }
                  }
                }}>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </Button>
                <Button variant="outline" size="sm" onClick={async () => {
                   if (!generatedMessage.trim()) {
                      alert("Nothing to save! Please write or generate a message first.");
                      return;
                   }
                   if (generatedMessage) {
                     try {
                       const res = await fetch('/api/templates', {
                         method: 'POST',
                         headers: { 'Content-Type': 'application/json' },
                         body: JSON.stringify({ name: topic || 'New AI Template', content: generatedMessage })
                       });
                       if (res.ok) {
                         alert("Template saved!");
                       } else {
                         alert("Failed to save template.");
                       }
                     } catch(e) { 
                       alert("Error saving template.");
                     }
                   }
                }}>
                  <BookmarkPlus className="w-4 h-4 mr-2" />
                  Save Template
                </Button>
              </div>
              <Button onClick={() => {
                if (!(generatedMessage || '').trim() && !attachmentUrl) {
                  alert("Please generate a message or add an attachment first!");
                  return;
                }
                handleSend();
              }} disabled={isSending} className="bg-blue-600 hover:bg-blue-700">
                {isSending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                Send to {selectedChats.length} Targets
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
