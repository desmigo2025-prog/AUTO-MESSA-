# AutoMessage: AI-Powered WhatsApp Auto Messenger Blueprint

## 1. App Overview
AutoMessage is a sophisticated web and mobile solution designed to automate WhatsApp communications. It leverages headless WhatsApp connections via WebSockets (Baileys), the Gemini 3.5 AI model for context-aware auto-generation of messages, and Firebase for scalable backend architecture. Individuals and businesses use AutoMessage to plan, generate, and blast messages securely without manual typing.

## 2. Core Features
- **Headless WhatsApp Integration:** Direct WebSocket linking (via QR) without relying on traditional phone-in-hand APIs.
- **Gemini-Powered Generation:** Translates brief intents, topics, and desired tones into full-featured, emoji-supported rich text messages.
- **Granular Scheduling Engine:** Time-zone aware CRON-based schedules for recurring dispatches (Daily, Weekly, Exact Date).
- **Campaign Manager:** Track analytics, grouped targets, and associated media attachments (PDFs, Images, Docs) for mass broadcasts.
- **Smart Templates:** Save high-performing AI queries as structured templates for one-click re-use.

## 3. Advanced Features
- **Spintax & AI Randomizer:** To avoid WhatsApp spam filters, the AI applies context-aware variations to each outgoing message.
- **Bulk Imports:** CSV syncing for mass targeting.
- **Auto-responder Mode:** Listens to incoming messages on selected intents and Auto-Replies using an AI Knowledge Base.
- **Real-Time Canvas Analytics:** Visual mapping of delivery success and failure rates.

## 4. UI/UX Design Structure
- **Theme:** Clean, modern "Slate & Emerald" palette reflecting trust and secure messaging. Tailored with Material Design 3 spacing and headless Radix-UI/Shadcn primitives.
- **Responsive Layout:** 
  - *Desktop*: Robust split-pane view (Navigation + Main Content + Side peek preview).
  - *Mobile*: Bottom-bar navigation with touch-optimized cards and swipe-to-delete campaigns.
- **Visuals:** Heavy use of empty states with guiding micro-copy, pulsating status indicators for the WebSocket connection, and fluid transitions.

## 5. Navigation Flow
1. **Authentication:** Google Sign-in -> Setup.
2. **Dashboard:** High-level metrics (Sent, Bounced, Active Schedules).
3. **Connection Wizard:** Interactive QR Code linking (socket listener).
4. **AI Generator:** Form input -> Draft Preview -> Edit -> Action (Send Now/Schedule).
5. **Campaigns:** Data-table view with Play/Pause state management.

## 6. Database Schema (Firestore)
- **`users/{userId}`:** Core profile, billing status.
  - **`connections/{connId}`:** Stores the multi-file auth state blob references or metadata indicating link status.
  - **`campaigns/{campId}`:** `name`, `status` (active/paused), `cronPattern`, `targetJids[]`, `templateRef`.
  - **`templates/{tempId}`:** `topic`, `tone`, `baseMessage`, `attachments[]`.
  - **`outbox/{messageId}`:** Ledger of sent items with `deliveryStatus` and `timestamp`.

## 7. Backend Architecture
- **Framework:** Express + Vite (Full-stack TypeScript configuration).
- **Agent Server:** An isolated Node process handling the `@whiskeysockets/baileys` lifecycle independently of HTTP routes to prevent request timeouts.
- **AI Processing:** Server-side secure bridging to the `@google/genai` API (Gemini-3.5-Flash).
- **Task Queue:** Cloud Tasks / Firebase Functions trigger CRON jobs that hydrate campaigns from Firestore and emit events to the Agent Server to dispatch.

## 8. Notification & Voice System Design
- **WebSockets / Server-Sent Events (SSE):** Provides real-time UI updates (e.g. "Message Sent", "QR Scanned!").
- **FCM (Firebase Cloud Messaging):** Dispatches push notifications to the user’s mobile client when a WhatsApp session drops or needs re-authentication.

## 9. AI Sequence Processing Logic
- The system doesn't just generate text; it acts dynamically.
- **Phase 1: Intent Extraction.** AI reads the user's brief.
- **Phase 2: Payload Construction.** AI applies the requested tone, injects dynamic placeholders (`{{FirstName}}`), and translates the content if required.
- **Phase 3: Validation.** A secondary LLM run checks for sensitive content or violating terms of service.

## 10. Security Architecture
- **Zero-Trust Storage:** WhatsApp Session keys (`baileys_auth_info`) are encrypted at rest and isolated per tenant.
- **Strict Network Egress:** API blocks cross-tenant reads; Firebase Security Rules encapsulate sub-collections tightly to the `request.auth.uid`.
- **API Key Masking:** Gemini API keys NEVER reach the client. All generative capabilities are proxied through rate-limited `/api/generate` Express endpoints.

## 11. Suggested Tech Stack
- **Frontend:** React 19, Tailwind CSS v4, Shadcn/UI, Lucide Icons, Vite.
- **Backend:** Node.js, Express.js.
- **WhatsApp Layer:** `@whiskeysockets/baileys`.
- **Database & Auth:** Firebase Auth, Firestore.
- **AI:** Google Gemini (via `@google/genai`).

## 12. Scalability Plan
- Scale Baileys instances by sharding accounts across localized container clusters (e.g., using Kubernetes StatefulSets) because WhatsApp sockets require persistent TCP connections.
- Shift scheduling logic to Google Cloud Tasks for infinite scaling without relying on Node's `setTimeout`.

## 13. Monetization Options
- **Freemium Tier:** Up to 100 auto-messages/month.
- **Pro Tier:** Unlimited campaigns, bulk imports, priority AI processing model (Gemini-1.5-Pro).
- **Enterprise:** Custom whitelabeled instances, SLA guarantees, multi-agent inbox support.

## 14. Future Expansion Ideas
- AI "Chatbot" mode: Responding to customer inquiries automatically by pulling from a unified business Knowledge Base.
- E-commerce integration: Connecting Shopify to auto-send abandoned cart reminders via WhatsApp.
- Omnichannel: Expanding to Telegram, Discord, and Slack via the same unified dashboard.
