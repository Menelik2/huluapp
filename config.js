// ===== Kulu Web Config =====
window.KULU_CONFIG = {
  // Laravel API base (must include /api)
  API_BASE_URL: 'https://kulu.xo.je/api',

  // Firebase Web app config
  // Project: Kulu Online Shopping (kuluapps)
  FIREBASE: {
    apiKey: 'AIzaSyAegBLDUVmRIqvnvuectCmdiBgnHWzbVls',
    authDomain: 'kuluapps.firebaseapp.com',
    projectId: 'kuluapps',
    storageBucket: 'kuluapps.firebasestorage.app',
    messagingSenderId: '613404183294',
    appId: '1:613404183294:web:c78b288cbed871e68733af',
  },

  // Laravel Echo / Pusher (same keys as API .env PUSHER_*)
  // Optional — chat works without it (falls back to polling)
  PUSHER: {
    key: 'YOUR_PUSHER_KEY',
    cluster: 'mt1',
    // Optional self-hosted Soketi/Reverb:
    // wsHost: 'your-host',
    // wsPort: 6001,
    // wssPort: 6001,
    // forceTLS: false,
    // enabledTransports: ['ws', 'wss'],
  },
};
