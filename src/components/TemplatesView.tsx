import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Copy, Trash2, Loader2, Bookmark } from 'lucide-react';

interface Template {
  id: string;
  name: string;
  content: string;
}

export default function TemplatesView() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/templates');
      if (res.ok) {
        const data = await res.json();
        setTemplates(data.templates);
      }
    } catch (e) {
      // ignore network errors on init
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;
    try {
      await fetch(`/api/templates/${id}`, { method: 'DELETE' });
      setTemplates(templates.filter(t => t.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  const handleCopy = async (content: string) => {
    try {
      let copied = false;
      if (navigator.clipboard) {
        try {
          await navigator.clipboard.writeText(content);
          copied = true;
        } catch(e) {}
      }
      if (!copied) {
        const textArea = document.createElement("textarea");
        textArea.value = content;
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
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Your Templates</h2>
          <p className="text-gray-500">Manage and reuse your saved messages</p>
        </div>
      </div>

      {templates.length === 0 ? (
        <Card className="bg-gray-50 border-dashed">
          <CardContent className="flex flex-col items-center justify-center h-64 text-center">
            <Bookmark className="w-12 h-12 text-gray-300 mb-4" />
            <h3 className="font-semibold text-lg text-gray-700">No Templates Yet</h3>
            <p className="text-gray-500 max-w-sm">
              You haven't saved any templates. Go to the AI Generator to draft and save your first reusable template.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map(template => (
            <Card key={template.id} className="flex flex-col">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5 text-emerald-600" />
                  <span className="truncate">{template.name}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 py-4">
                <p className="text-sm text-gray-600 whitespace-pre-wrap line-clamp-6">
                  {template.content}
                </p>
              </CardContent>
              <CardFooter className="pt-3 border-t bg-gray-50 gap-2 flex justify-end">
                <Button variant="outline" size="sm" onClick={() => handleCopy(template.content)}>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </Button>
                <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(template.id)}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
