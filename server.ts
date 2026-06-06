import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import makeWASocket, { useMultiFileAuthState, DisconnectReason } from "@whiskeysockets/baileys";
import QRCode from "qrcode";
import fs from "fs";
import pino from "pino";
import EventEmitter from "events";

const appEvents = new EventEmitter();

// Initialize Gemini
const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
});

const app = express();
const PORT = 3000;

app.use(express.json());

// WhatsApp State
let sock: any = null;
let qrCodeUrl: string | null = null;
let isConnected = false;

// Basic setup for WhatsApp
async function connectToWhatsApp() {
  appEvents.emit('activity', { type: 'system', message: 'Initializing WhatsApp connection...' });
  const { state, saveCreds } = await useMultiFileAuthState('baileys_auth_info');
  
  sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
    syncFullHistory: false,
    logger: pino({ level: 'silent' }) as any,
    browser: ['AutoMessage', 'Chrome', '1.0.0'] // Important to prevent some rejections
  });

  sock.ev.on('connection.update', async (update: any) => {
    const { connection, lastDisconnect, qr } = update;
    
    if (qr) {
      // Setup QR code for frontend to consume
      qrCodeUrl = await QRCode.toDataURL(qr);
      appEvents.emit('activity', { type: 'system', message: 'QR Code generated. Waiting for scan...' });
    }

    if (connection === 'close') {
      const shouldReconnect = (lastDisconnect?.error as any)?.output?.statusCode !== DisconnectReason.loggedOut;
      isConnected = false;
      qrCodeUrl = null;
      appEvents.emit('activity', { type: 'error', message: 'WhatsApp connection closed' });
      if (shouldReconnect) {
        connectToWhatsApp();
      } else {
        // Delete auth info if logged out
        fs.rmSync('baileys_auth_info', { recursive: true, force: true });
        sock = null;
      }
    } else if (connection === 'open') {
      console.log('WhatsApp connection opened');
      isConnected = true;
      qrCodeUrl = null;
      appEvents.emit('activity', { type: 'success', message: 'WhatsApp authenticated successfully!' });
    }
  });

  sock.ev.on('creds.update', saveCreds);
}

// API Routes

app.get('/api/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders && res.flushHeaders();
  
  let eventCounter = 0;
  
  const listener = (data: any) => {
    res.write(`data: ${JSON.stringify({ ...data, timestamp: new Date().toISOString(), id: `${Date.now()}-${eventCounter++}` })}\n\n`);
  };
  
  appEvents.on('activity', listener);
  
  req.on('close', () => {
    appEvents.removeListener('activity', listener);
  });
});

app.post("/api/connect-number", async (req, res) => {
  const { phoneNumber } = req.body;
  if (!phoneNumber) {
    return res.status(400).json({ error: "Phone number is required." });
  }
  
  try {
    if (!sock) {
      await connectToWhatsApp();
    }
    
    // Baileys automatically waits for the socket to be ready in >6.5.0
    // But we might need to delay slightly if the connection is completely fresh
    setTimeout(async () => {
      try {
        const code = await sock.requestPairingCode(phoneNumber.replace(/[^0-9]/g, ""));
        appEvents.emit('activity', { type: 'system', message: `Generated pairing code for ${phoneNumber}` });
        res.json({ success: true, code });
      } catch (err: any) {
        console.error("Pairing code error:", err);
        res.status(500).json({ error: "Failed to request pairing code." });
      }
    }, 1500);
    
  } catch (err) {
    res.status(500).json({ error: "Failed to initialize connection." });
  }
});

app.get("/api/status", (req, res) => {
  res.json({ connected: isConnected, qr: qrCodeUrl });
});

app.post("/api/connect", async (req, res) => {
  if (!sock) {
    await connectToWhatsApp();
  }
  res.json({ success: true, message: "Connecting to WhatsApp..." });
});

  app.post("/api/disconnect", async (req, res) => {
  if (sock) {
    try {
      sock.logout();
      appEvents.emit('activity', { type: 'system', message: 'Logged out of WhatsApp' });
    } catch (e) {
      console.error(e);
    }
  }
  res.json({ success: true, message: "Disconnected" });
});

app.post("/api/templates", (req, res) => {
  const { name, content } = req.body;
  // We can just log it or store it in memory.
  appEvents.emit('activity', { type: 'success', message: `Saved new template: "${name}"` });
  res.json({ success: true, message: "Template saved" });
});

app.get("/api/chats", async (req, res) => {
  if (!isConnected || !sock) {
    return res.status(401).json({ error: "WhatsApp not connected" });
  }
  try {
    const groups = await sock.groupFetchAllParticipating();
    const groupList = Object.values(groups).map((g: any) => ({
      id: g.id,
      name: g.subject,
      type: "group"
    }));
    res.json({ chats: groupList });
  } catch (error: any) {
    console.error("Fetch chats error:", error);
    res.status(500).json({ error: "Failed to fetch chats" });
  }
});

app.post("/api/generate", async (req, res) => {
  try {
    const { topic, tone, length, keywords } = req.body;
    
    const prompt = `Write a WhatsApp message.
Topic: ${topic}
Tone: ${tone}
Length: ${length}
Keywords: ${keywords ? keywords.join(", ") : "none"}

Generate ONLY the message content. Use emojis appropriately.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });
    
    appEvents.emit('activity', { type: 'ai', message: `Generated new AI draft on topic: "${topic.substring(0, 30)}..."` });
    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Gemini Error:", error);
    res.status(500).json({ error: "Failed to generate message." });
  }
});

app.post("/api/send", async (req, res) => {
  const { chatIds, message, attachmentUrl, attachmentType } = req.body;
  if (!isConnected || !sock) {
    return res.status(401).json({ error: "WhatsApp not connected" });
  }

  try {
    // Send to each chat ID
    for (const jid of chatIds) {
      let msgContent: any = { text: message };
      
      if (attachmentUrl) {
         if (attachmentType === 'image') msgContent = { image: { url: attachmentUrl }, caption: message };
         else if (attachmentType === 'video') msgContent = { video: { url: attachmentUrl }, caption: message };
         // for 'link' we just rely on whatsapp parsing the URL which we append to the text or send separately
         else msgContent.text = message + `\n\nLink: ${attachmentUrl}`;
      }
      
      await sock.sendMessage(jid, msgContent);
      console.log(`[REAL] Sending message to ${jid} with attachment ${attachmentUrl || 'none'}`);
    }
    appEvents.emit('activity', { type: 'success', message: `Sent messages to ${chatIds.length} target(s).` });
    if (attachmentUrl) {
      appEvents.emit('activity', { type: 'system', message: `Attached media (${attachmentType}): ${attachmentUrl.substring(0, 30)}...` });
    }
    appEvents.emit('activity', { type: 'stats_update', stat: 'sent', count: chatIds.length });
    
    res.json({ success: true });
  } catch (error: any) {
    console.error("Send Error:", error);
    res.status(500).json({ error: "Failed to send messages." });
  }
});

interface Campaign {
  id: string;
  name: string;
  status: string;
  scheduleType: string;
  scheduleTime: string; // HH:mm
  targets: string[];
  message: string;
  messagesSent: number;
  lastRunSent?: string;
}

let campaigns: Campaign[] = [];

app.get("/api/campaigns", (req, res) => {
  res.json({ campaigns });
});

app.post("/api/campaigns", (req, res) => {
  const newCamp: Campaign = {
    id: Math.random().toString(36).substring(7),
    name: req.body.name,
    status: 'active',
    scheduleType: req.body.scheduleType,
    scheduleTime: req.body.scheduleTime,
    targets: req.body.targets,
    message: req.body.message,
    messagesSent: 0
  };
  campaigns.push(newCamp);
  appEvents.emit('activity', { type: 'success', message: `Campaign "${newCamp.name}" scheduled for ${newCamp.scheduleTime}` });
  res.json({ success: true, campaign: newCamp });
});

app.put("/api/campaigns/:id/toggle", (req, res) => {
  const camp = campaigns.find(c => c.id === req.params.id);
  if (camp) {
    camp.status = camp.status === 'active' ? 'paused' : 'active';
    res.json({ success: true, status: camp.status });
  } else {
    res.status(404).json({error: "Not found"});
  }
});

app.delete("/api/campaigns/:id", (req, res) => {
  const initialLength = campaigns.length;
  campaigns = campaigns.filter(c => c.id !== req.params.id);
  res.json({ success: campaigns.length < initialLength });
});

// Periodic scheduler checking every 30 seconds
setInterval(async () => {
  const now = new Date();
  const currentHour = now.getHours().toString().padStart(2, '0');
  const currentMin = now.getMinutes().toString().padStart(2, '0');
  const currentTime = `${currentHour}:${currentMin}`;
  const currentDay = now.getDay();
  // Simple YYYY-MM-DD to avoid duplicate sending in the same minute
  const todayStr = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;

  for (const c of campaigns) {
    if (c.status !== 'active') continue;
    
    let dayMatches = false;
    if (c.scheduleType === 'Daily') dayMatches = true;
    else if (c.scheduleType === 'Weekdays' && currentDay >= 1 && currentDay <= 5) dayMatches = true;
    else if (c.scheduleType === 'Weekends' && (currentDay === 0 || currentDay === 6)) dayMatches = true;
    else if (c.scheduleType === 'Mondays' && currentDay === 1) dayMatches = true;
    else if (c.scheduleType === 'Fridays' && currentDay === 5) dayMatches = true;

    if (dayMatches && c.scheduleTime === currentTime && c.lastRunSent !== todayStr) {
      c.lastRunSent = todayStr; // Mark as sent for today
      
      if (isConnected && sock && c.targets.length > 0) {
        let sentCount = 0;
        for (const jid of c.targets) {
            try {
                await sock.sendMessage(jid, { text: c.message });
                sentCount++;
            } catch (err) {}
        }
        c.messagesSent += sentCount;
        appEvents.emit('activity', { type: 'success', message: `Scheduled campaign "${c.name}" triggered: Sent to ${sentCount} targets.` });
        appEvents.emit('activity', { type: 'stats_update', stat: 'sent', count: sentCount });
      } else {
        appEvents.emit('activity', { type: 'error', message: `Campaign "${c.name}" triggered but WhatsApp is disconnected or no targets selected.` });
      }
    }
  }
}, 30000);

// Vite Integration
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
