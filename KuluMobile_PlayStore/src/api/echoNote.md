# Real-time chat on mobile

The API broadcasts `message.sent` on private channel `chat.{lowUserId}.{highUserId}` via Pusher.

Web uses Laravel Echo. For React Native, use `pusher-js` / `@pusher/pusher-websocket-react-native`:

1. Auth: POST `{API}/broadcasting/auth` with Bearer token and body `socket_id`, `channel_name`
2. Subscribe to `private-chat.{min(myId,otherId)}.{max(...)}`
3. Bind event `message.sent`

Until integrated, ChatScreen continues to refresh via pull/load after send.
