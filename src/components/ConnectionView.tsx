import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { QrCode, RefreshCcw, CheckCircle2, Phone } from 'lucide-react';

export default function ConnectionView() {
  const [status, setStatus] = useState<{connected: boolean, qr: string | null}>({ connected: false, qr: null });
  const [loading, setLoading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [pairingCode, setPairingCode] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/status');
      const data = await res.json();
      setStatus(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  const initiateConnection = async () => {
    setLoading(true);
    try {
      await fetch('/api/connect', { method: 'POST' });
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const initiatePhoneConnection = async () => {
    if (!phoneNumber.trim()) return;
    setLoading(true);
    setPairingCode(null);
    try {
      const res = await fetch('/api/connect-number', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber })
      });
      const data = await res.json();
      if (data.code) {
         setPairingCode(data.code.match(/.{1,4}/g)?.join('-') || data.code);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>WhatsApp Connection</CardTitle>
          <CardDescription>Link your WhatsApp account using Baileys to send automated messages safely.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center p-8 text-center space-y-6">
          
          {status.connected ? (
            <>
              <div className="w-24 h-24 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="w-12 h-12" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Successfully Connected</h3>
              <p className="text-gray-500 mb-4">Your WhatsApp account is active and ready to process campaigns.</p>
              <Button onClick={async () => {
                setLoading(true);
                setPairingCode(null);
                try { await fetch('/api/disconnect', { method: 'POST' }); } catch(e){}
                setTimeout(() => { setLoading(false); fetchStatus(); }, 1500); 
              }} disabled={loading} variant="outline" className="text-red-500 hover:text-red-600 hover:bg-red-50 border-red-200">
                {loading ? <RefreshCcw className="w-4 h-4 mr-2 animate-spin" /> : null}
                Disconnect Account
              </Button>
            </>
          ) : status.qr ? (
            <>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <img src={status.qr} alt="WhatsApp QR Code" className="w-64 h-64" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Scan to Link Device</h3>
              <p className="text-gray-500">Open WhatsApp on your phone &gt; Linked Devices &gt; Link a Device.</p>
            </>
          ) : pairingCode ? (
             <>
               <div className="w-24 h-24 bg-blue-100 text-blue-500 rounded-full flex items-center justify-center mb-4">
                 <Phone className="w-10 h-10" />
               </div>
               <h3 className="text-lg font-bold text-gray-900">Pairing Code Generated</h3>
               <div className="bg-gray-100 p-4 rounded-lg my-4 text-3xl font-mono tracking-widest font-bold text-gray-800">
                 {pairingCode}
               </div>
               <p className="text-gray-500 text-sm max-w-sm">
                 Open WhatsApp &gt; Linked Devices &gt; Link a Device &gt; Link with phone number instead. Enter this code to pair your device.
               </p>
               <Button onClick={() => setPairingCode(null)} variant="ghost" className="mt-4">Back</Button>
             </>
          ) : (
            <Tabs defaultValue="qr" className="w-full max-w-md">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="qr">QR Code</TabsTrigger>
                <TabsTrigger value="phone">Phone Number</TabsTrigger>
              </TabsList>
              
              <TabsContent value="qr" className="flex flex-col items-center justify-center space-y-4">
                <div className="w-24 h-24 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mb-2">
                  <QrCode className="w-12 h-12" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Not Connected</h3>
                <p className="text-gray-500 mb-4">You need to link your account before scheduling attributes.</p>
                <Button onClick={initiateConnection} disabled={loading} size="lg" className="bg-emerald-600 hover:bg-emerald-700">
                  {loading ? <RefreshCcw className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Generate QR Code
                </Button>
              </TabsContent>
              
              <TabsContent value="phone" className="flex flex-col items-center justify-center space-y-4">
                <h3 className="text-xl font-bold text-gray-900">Link with Phone Number</h3>
                <p className="text-gray-500 mb-2">Enter your WhatsApp number including the country code (e.g. 15551234567).</p>
                <Input 
                  type="tel" 
                  placeholder="e.g. 1234567890" 
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="mb-4 text-center text-lg"
                />
                <Button onClick={initiatePhoneConnection} disabled={loading || !phoneNumber.trim()} size="lg" className="w-full bg-blue-600 hover:bg-blue-700">
                  {loading ? <RefreshCcw className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Request Pairing Code
                </Button>
              </TabsContent>
            </Tabs>
          )}

        </CardContent>
      </Card>
      
      <div className="mt-8 bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-lg text-sm">
        <strong>Security Notice:</strong> The session data is only kept in an isolated volume. Ensure you regularly monitor your linked devices from your iOS/Android WhatsApp client.
      </div>
    </div>
  );
}
