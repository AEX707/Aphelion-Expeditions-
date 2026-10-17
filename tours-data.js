// Shared tour data loader — fetches tours from the Supabase database.
// Used by index.html, tours.html, tour.html, booking.html.

const SUPABASE_URL = "https://agjmcokrlftutvnddohv.supabase.co";
const SUPABASE_KEY = "sb_publishable_vsbAvQlf9in0HDYZeP8asQ_znoG1onN";

let _toursCache = null;

// Aphelion's commission, added on top of the partner's price.
// Also used by admin.html when it creates the payment link.
const COMMISSION_RATE = 0.10;

function publicPrice(basePrice) {
  return Math.round(Number(basePrice) * (1 + COMMISSION_RATE));
}

// Public-facing: only tours that have been approved by an admin.
// This is what the storefront (index/tours/tour/booking pages) uses.
async function getTours() {
  if (_toursCache) return _toursCache;
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/tours?select=*&status=eq.approved&order=id.asc`, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`
      }
    });
    if (!res.ok) throw new Error('Supabase request failed: ' + res.status);
    const data = await res.json();
    // map group_size (database column name) back to "group" so existing
    // page code (t.group) keeps working unchanged.
    // Visitors see the price WITH Aphelion's commission already included:
    // price = partner's price + 10%, rounded to a whole yen. The partner's
    // own price is kept as base_price (admin panel and partner dashboard
    // load tours separately and keep showing the partner's price).
    _toursCache = data.map(t => ({
      ...t,
      group: t.group_size,
      base_price: t.price,
      price: publicPrice(t.price)
    }));
    registerTourTranslations(_toursCache);
    return _toursCache;
  } catch (err) {
    console.error('Failed to load tours from database:', err);
    return [];
  }
}

// Admin-facing: every tour regardless of status (pending/approved/rejected),
// so the admin panel can review and moderate everything. Never cached.
// Pass the signed-in admin's access token; without it the database only
// returns approved tours (same as the public site).
async function getAllToursAdmin(accessToken) {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/tours?select=*&order=id.asc`, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${accessToken || SUPABASE_KEY}`
      }
    });
    if (!res.ok) throw new Error('Supabase request failed: ' + res.status);
    const data = await res.json();
    return data.map(t => ({ ...t, group: t.group_size }));
  } catch (err) {
    console.error('Failed to load tours from database:', err);
    return [];
  }
}

// --- Automatic tour translations ---
// When the admin approves a tour, the "translate-tour" function stores
// translations of its text in tours.translations, e.g.
//   { "ja": { "title": "...", "description": "..." }, "fr": {...}, "_lang": "en" }
// Here we hand them to the language switcher (i18n.js), which swaps the
// partner's original text for the visitor's language on the page.
const TOUR_TEXT_FIELDS = ['title', 'description', 'location', 'duration', 'group_size', 'tag'];
// Some fields are shown with an icon in front, e.g. "⏱ 3 hours".
const TOUR_FIELD_PREFIXES = { duration: ['⏱ '], group_size: ['👥 '], location: ['📍 '] };

function registerTourTranslations(tours) {
  const all = window.AEX_TOUR_I18N = window.AEX_TOUR_I18N || {};
  window.AEX_TOUR_TRANSLATED_IDS = window.AEX_TOUR_TRANSLATED_IDS || {};
  tours.forEach(t => {
    const tr = t.translations;
    if (!tr || typeof tr !== 'object') return;
    Object.keys(tr).forEach(lang => {
      if (lang.startsWith('_') || !tr[lang]) return;
      const dict = all[lang] = all[lang] || {};
      TOUR_TEXT_FIELDS.forEach(f => {
        const original = (t[f] == null ? '' : String(t[f])).replace(/\s+/g, ' ').trim();
        const translated = tr[lang][f];
        if (!original || !translated) return;
        dict[original] = translated;
        (TOUR_FIELD_PREFIXES[f] || []).forEach(p => { dict[p + original] = p + translated; });
      });
      (window.AEX_TOUR_TRANSLATED_IDS[lang] = window.AEX_TOUR_TRANSLATED_IDS[lang] || {})[t.id] = true;
    });
  });
  if (window.AEX_refreshTranslations) window.AEX_refreshTranslations();
}
