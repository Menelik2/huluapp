/**
 * Laravel Echo bootstrap for Kulu chat.
 * CDN globals: Pusher, Echo (laravel-echo iife)
 */
(function () {
  function getToken() {
    try {
      var raw = localStorage.getItem('kulu_token');
      if (!raw) return '';
      // token stored as JSON string from storageSet
      try {
        var parsed = JSON.parse(raw);
        return typeof parsed === 'string' ? parsed : (parsed || '');
      } catch (e) {
        return raw;
      }
    } catch (e) {
      return '';
    }
  }

  window.kuluCreateEcho = function () {
    var cfg = window.KULU_CONFIG || {};
    var pusherCfg = cfg.PUSHER || {};
    var api = (cfg.API_BASE_URL || '').replace(/\/$/, '');
    var EchoLib = window.Echo;

    if (!EchoLib || !window.Pusher) {
      console.warn('Echo/Pusher libraries not loaded');
      return null;
    }
    if (!pusherCfg.key || pusherCfg.key === 'YOUR_PUSHER_KEY') {
      console.warn('Pusher key not configured — chat will use polling only');
      return null;
    }

    var options = {
      broadcaster: 'pusher',
      key: pusherCfg.key,
      cluster: pusherCfg.cluster || 'mt1',
      forceTLS: pusherCfg.forceTLS !== false,
      authEndpoint: api + '/broadcasting/auth',
      auth: {
        headers: {
          Authorization: 'Bearer ' + getToken(),
          Accept: 'application/json',
        },
      },
    };

    if (pusherCfg.wsHost) {
      options.wsHost = pusherCfg.wsHost;
      options.wsPort = pusherCfg.wsPort || 6001;
      options.wssPort = pusherCfg.wssPort || 6001;
      options.enabledTransports = pusherCfg.enabledTransports || ['ws', 'wss'];
      options.forceTLS = !!pusherCfg.forceTLS;
    }

    return new EchoLib(options);
  };

  window.kuluConversationChannel = function (userA, userB) {
    var a = Number(userA);
    var b = Number(userB);
    var low = Math.min(a, b);
    var high = Math.max(a, b);
    return 'chat.' + low + '.' + high;
  };
})();
