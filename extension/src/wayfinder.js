/*
 * LifeMode Wayfinder — "the corpsman"
 *
 * Job: take what a person says in plain words and get them from
 *      point A (lost) to point B (the exact official place) fast,
 *      plus the one thing nobody told them.
 *
 * Design rules (do not break):
 *  1. NO hardcoded destination directory. Destinations are resolved live.
 *  2. The crisis net is hardcoded and local. It never depends on the
 *     network or the model. It runs BEFORE anything else, every time.
 *  3. The resolver may only return a URL under an official domain
 *     (validated server-side). If it can't, we route to a human.
 *  4. Failure is never a dead end. Unknown -> free VSO / human.
 *  5. Intent text only leaves the device. Never page contents, never PII.
 */

(function (global) {
  'use strict';

  // ---- (2) HARDCODED CRISIS NET — local, deterministic, first ----------
  var CRISIS_TERMS = [
    'kill myself', 'killing myself', 'suicide', 'suicidal', 'end it all',
    'end my life', 'want to die', 'wanna die', "don't want to be here",
    'dont want to be here', 'hurt myself', 'harm myself', 'no reason to live',
    'better off dead', "can't go on", 'cant go on', 'not worth living',
    'take my own life'
  ];

  function isCrisis(text) {
    var s = ' ' + String(text || '').toLowerCase()
      .replace(/[^a-z' ]/g, ' ').replace(/\s+/g, ' ') + ' ';
    for (var i = 0; i < CRISIS_TERMS.length; i++) {
      var t = CRISIS_TERMS[i];
      if (s.indexOf(' ' + t + ' ') !== -1 || s.indexOf(t) !== -1) return true;
    }
    return false;
  }

  // Crisis response is built from constants, not fetched.
  var CRISIS_RESPONSE = {
    crisis: true,
    title: "I'm staying right here with you.",
    presence: "You don't have to explain anything. One tap reaches a real " +
      "person trained for exactly this. Do that first. The rest can wait.",
    actions: [
      { label: 'Call 988, then press 1', sub: 'Veterans Crisis Line — 24/7, free, confidential', href: 'tel:988', primary: true },
      { label: 'Text 838255', sub: "Text a responder if you'd rather not talk", href: 'sms:838255' },
      { label: 'Chat online now', sub: 'veteranscrisisline.net', href: 'https://www.veteranscrisisline.net/get-help-now/chat/' },
      { label: 'Reach your person', sub: 'Call a battle buddy or someone you trust — right now', href: '#trusted' }
    ]
  };

  // ---- Human fallback (also local) — used on any resolver failure -------
  var HUMAN_FALLBACK = {
    fallback: true,
    title: "I don't have a clean route for that yet — but I'm not leaving you stuck.",
    dest: 'A VA-accredited rep can point you, free.',
    url: 'https://www.va.gov/get-help-from-accredited-representative/',
    clicks: 'Find a representative -> search by location -> request',
    fieldNote: "A VSO's help on your claim is always free. If anyone wants money upfront to file an initial claim, walk away."
  };

  // ---- (1)(3) DYNAMIC RESOLVER — no local directory ---------------------
  // Endpoint is configured at build/install time. Set RESOLVER_URL to your
  // Vercel route, e.g. https://your-app.vercel.app/api/wayfinder
  var RESOLVER_URL = (global.LIFEMODE_RESOLVER_URL) || '';

  function resolve(text) {
    // Crisis ALWAYS wins, before any network call.
    if (isCrisis(text)) return Promise.resolve(CRISIS_RESPONSE);

    var query = String(text || '').trim();
    if (!query) return Promise.resolve(null);
    if (!RESOLVER_URL) return Promise.resolve(HUMAN_FALLBACK);

    // 8s timeout — a lost vet should never wait on a spinner.
    var controller = new AbortController();
    var to = setTimeout(function () { controller.abort(); }, 8000);

    return fetch(RESOLVER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: query }),   // intent text only. no page, no PII.
      signal: controller.signal
    })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) {
        clearTimeout(to);
        // Server guarantees an official, validated URL or sets verified=false.
        if (!data || data.verified === false || !data.url) return HUMAN_FALLBACK;
        return data;
      })
      .catch(function () { clearTimeout(to); return HUMAN_FALLBACK; });
  }

  global.LifeModeWayfinder = {
    isCrisis: isCrisis,
    resolve: resolve,
    CRISIS_RESPONSE: CRISIS_RESPONSE,
    HUMAN_FALLBACK: HUMAN_FALLBACK
  };
})(typeof window !== 'undefined' ? window : this);
