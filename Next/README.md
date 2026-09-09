# Next PWA

Next.js App Router frontend for the Hoshyar platform, including the realtime messenger experience.

## Stack

- Next.js 16 App Router
- React 19
- Socket.IO client for realtime messaging
- Axios proxy calls through `src/app/api/backend/[...path]/route.ts`

## Messenger Flow

- `src/app/messages/page.tsx` mounts the messenger shell
- `src/components/messenger/MessengerPage.tsx` coordinates chat state, sync, and composer actions
- `src/components/messenger/MessengerSidebar.tsx` renders the responsive chat list
- `src/components/messenger/MessengerThread.tsx` renders the active conversation and history loader
- `src/components/messenger/MessengerComposer.tsx` handles message composition

## Local Run

```bash
cp .env.example .env
npm install
npm run dev
```

Default env values:

- `NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/api/v1`
- `NEXT_PUBLIC_MESSENGER_API_BASE_URL=http://localhost:3004/api/v1`
- `INTERNAL_API_BASE_URL=http://backend:3001/api/v1`
- `INTERNAL_MESSENGER_API_BASE_URL=http://messenger-back:3004/api/v1`

## Notes

- Socket access tokens are refreshed through `src/app/api/messenger/socket-token/route.ts`
- Messenger REST calls route automatically to the messenger backend via `src/lib/server/backend.ts`
- The current UI supports realtime sync, direct chat start, pagination, typing indicators, and HTTP fallback when sockets are unavailable
