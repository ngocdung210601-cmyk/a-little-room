# a little room — private chat

A warm, glassy, private two-person chat app. React + TypeScript + Vite + Tailwind.

## Run it right now (no setup)

```bash
npm install
npm run dev
```

Open the URL it prints. **It already works end to end** — create a chat, copy the
invite link, open that link in a second tab (or another browser), pick a name,
and chat in real time. No account, no Supabase project, no env vars needed.

This works because the app ships with a **mock backend** (`src/services/mockChatService.ts`)
that persists to `localStorage` and syncs across tabs/windows in the same browser
via `BroadcastChannel` — genuinely real-time, just scoped to your machine instead
of the internet.

## Connecting real Supabase (for real cross-device chat)

1. Create a project at [supabase.com](https://supabase.com).
2. In the SQL editor, run `supabase/schema.sql` from this repo. It creates the
   `rooms` / `participants` / `messages` tables, enables Realtime on `messages`,
   creates the `chat-images` storage bucket, and sets up Row Level Security.
3. In **Authentication → Providers**, enable **Anonymous Sign-Ins**. The app
   uses this so every browser gets a real, unspoofable `auth.uid()` — RLS
   policies check `session_id = auth.uid()` rather than trusting anything the
   client sends.
4. Copy `.env.example` to `.env.local` and fill in your project's URL and anon
   key (Project Settings → API).
5. Restart `npm run dev`. The app detects the env vars and automatically
   switches from the mock backend to `src/services/supabaseChatService.ts` —
   nothing else changes, because both implement the same `ChatService`
   contract (see `src/services/chatService.ts`).

You'll now have real cross-device, cross-network private chat with persistent
history, real image storage, and real presence.

## What's implemented

- Landing page → create a room → shareable invite link (`/chat/:code`)
- Join flow for the second person (name + optional avatar, no account)
- Real-time text messages, with optimistic sending + failed/retry states
- Image messages: click-to-upload, clipboard paste, drag-and-drop, client-side
  compression, lightbox viewer
- Emoji-based sticker picker (5 categories) — swap in real art later without
  touching the picker UI, see `src/components/stickers/stickerData.ts`
- Automatic URL detection → clickable links / link-preview card
- Presence ("2 people online")
- Share button using the native Web Share sheet where available, clipboard
  copy otherwise
- Mobile-safe layout (safe-area insets, keyboard-safe composer, no horizontal
  scroll)
- Error states for a missing room, failed uploads, and failed sends

## Project structure

```
src/
  components/
    chat/        ChatHeader, MessageList, ChatBubble, ImageMessage, LinkPreview, Lightbox, EmptyState
    composer/     MessageComposer, AttachPopover
    stickers/     StickerPicker, sticker data
    onboarding/   NameEntry (shared by create + join)
    ui/           GlassCard, GlassButton, Avatar, Toast
  hooks/          useChatRoom (send/receive/retry/presence), useLocalSession
  services/       ChatService interface + mock and Supabase implementations
  lib/supabase/   Supabase client + anonymous-auth session helper
  pages/          Landing, ChatRoomPage
  types/          shared domain types
  utils/          id generation, formatting, linkify, image handling
supabase/
  schema.sql      tables, indexes, realtime, storage bucket, RLS policies
```

## Notes / tradeoffs

- Link **previews** show the domain and URL in a glass card; fetching real
  page titles/OG images would require a server-side fetch (to avoid CORS and
  to avoid leaking the visitor's IP to arbitrary sites), which is intentionally
  left out of this MVP.
- The mock backend keeps everything in `localStorage`, including image data
  URLs — fine for local testing, but not meant for production use. Connect
  Supabase for anything real.
