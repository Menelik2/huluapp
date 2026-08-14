# Kulu Admin Dashboard

Dedicated dark-theme admin SPA for the Kulu Laravel API.

## URL
Serve this folder (or open via `/admin/` if `web/` is the site root).

Uses parent config: `../config.js` and `../echo.js`.

## Features
- Google login (admin role only)
- Overview stats + analytics bars
- Orders status management
- Products create / delete
- Categories CRUD
- Inventory stock edit
- Customers + open chat
- Live chat (Laravel Echo / polling fallback)

## Setup
1. Configure `web/config.js` (API + Firebase + Pusher)
2. Sign in with the Google account matching `ADMIN_EMAIL`
