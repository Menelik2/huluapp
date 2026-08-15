// ===== Kulu Web Config =====
// This file is public - NEVER put secrets here.
// All secrets stay on the Laravel backend.

(function() {
  'use strict';

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

    // Laravel Echo / Pusher (optional - chat works without it)
    PUSHER: {
      key: '',
      cluster: 'mt1',
    },
  };
})();
