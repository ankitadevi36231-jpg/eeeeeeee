/* ============================================================
   isaiyaa.bd — Main Frontend Logic (shared across pages)
   ============================================================ */
'use strict';

/* ---------- global state ---------- */
const ISA = {
  cfg: { payments: [], whatsapp: '8801824554565', whatsappDisplay: '01824554565', telegram: 'Devoloper_Emon', siteName: 'isaiyaa.bd' },
  rates: { BTCUSDT: 97000, LTCUSDT: 105, usdRate: 122 },
  products: [],
  ready: false
};

const CATS = {
  vpn:     { label: 'Premium VPN',    icon: '🛡️' },
  account: { label: 'Premium Accounts', icon: '👤' },
  card:    { label: 'Visa / Master Cards', icon: '💳' },
  apps:    { label: 'Premium Apps',   icon: '📱' },
  social:  { label: 'Social Media',   icon: '🌐' },
  course:  { label: 'Premium Courses', icon: '🎓' },
  other:   { label: 'Other',          icon: '✨' }
};

const WA_ICON = '<svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>';
const TG_ICON = '<svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>';

/* ---------- tiny helpers ---------- */
const $  = (s, c) => (c || document).querySelector(s);
const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));
const esc = s => String(s ?? '').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
const fmtBDT = n => '৳' + Number(n || 0).toLocaleString('en-US');
const catInfo = c => CATS[c] || CATS.other;

function toast(msg, type) {
  const t = $('#toast');
  if (!t) return;
  t.textContent = msg;
  t.className = 'toast show ' + (type || '');
  clearTimeout(t._tm);
  t._tm = setTimeout(() => t.classList.remove('show'), 3400);
}

function waLink(number, text) {
  let n = String(number || '').replace(/[^\d]/g, '');
  if (n.startsWith('0')) n = '88' + n;
  return `https://wa.me/${n}` + (text ? `?text=${encodeURIComponent(text)}` : '');
}
const tgLink = username => 'https://t.me/' + String(username || '').replace(/^@/, '');
/* ---------- boot: config + rates + shared UI ---------- */
async function loadConfig() {
  try {
    const r = await fetch('/api/config', { cache: 'no-store' });
    ISA.cfg = await r.json();
  } catch { /* keep defaults */ }
  try {
    const r = await fetch('/api/rates', { cache: 'no-store' });
    const d = await r.json();
    Object.assign(ISA.rates, d);
  } catch { /* keep fallback rates */ }

  /* contact links everywhere */
  const waMsg = `Hello ${ISA.cfg.siteName}! I need help with a product.`;
  $$('#heroWa, #fabWa, #footWa').forEach(a => { if (a) a.href = waLink(ISA.cfg.whatsapp, waMsg); });
  $$('#fabTg, #footTg').forEach(a => { if (a) a.href = tgLink(ISA.cfg.telegram); });

  /* footer payment logos + contact cards */
  const fp = $('#fPay');
  if (fp) fp.innerHTML = ISA.cfg.payments.map(p => `<img src="${esc(p.logo)}" alt="${esc(p.label)}" title="${esc(p.label)}">`).join('');
  const fc = $('#fContact');
  if (fc) fc.innerHTML = `
    <a class="wa" id="footWa" href="${waLink(ISA.cfg.whatsapp, waMsg)}" target="_blank" rel="noopener">${WA_ICON}<span>WhatsApp</span></a>
    <a class="tg" id="footTg" href="${tgLink(ISA.cfg.telegram)}" target="_blank" rel="noopener">${TG_ICON}<span>Telegram</span></a>`;

  const y = $('#year');
  if (y) y.textContent = new Date().getFullYear();
  ISA.ready = true;
}

/* ---------- header: mobile nav + search + fab + lightbox ---------- */
function initHeader() {
  const ham = $('#hamburger'), nav = $('#nav');
  if (ham && nav) ham.addEventListener('click', () => nav.classList.toggle('open'));
}

function initSearch() {
  const input = $('#searchInput'), drop = $('#searchDrop');
  if (!input || !drop) return;
  const render = () => {
    const q = input.value.trim().toLowerCase();
    if (!q) { drop.classList.remove('open'); return; }
    const matches = ISA.products.filter(p => p.title.toLowerCase().includes(q)).slice(0, 8);
    drop.innerHTML = matches.length
      ? matches.map(p => {
          const c = catInfo(p.category);
          const img = p.image ? `<img src="${esc(p.image)}" alt="">` : `<span>${c.icon}</span>`;
          return `<a class="sd-item" href="/product.html?id=${esc(p.id)}"><div class="sd-thumb">${img}</div><div class="sd-info"><b>${esc(p.title)}</b><span>${fmtBDT(p.price)}</span></div></a>`;
        }).join('')
      : `<div class="sd-empty">No products found for "${esc(input.value.trim())}"</div>`;
    drop.classList.add('open');
  };
  input.addEventListener('input', render);
  input.addEventListener('focus', render);
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      const first = $('.sd-item', drop);
      if (first) location.href = first.getAttribute('href');
    }
    if (e.key === 'Escape') drop.classList.remove('open');
  });
  document.addEventListener('click', e => {
    if (!e.target.closest('.search-wrap')) drop.classList.remove('open');
  });
}

function initFab() {
  const wrap = $('#fabWrap'), btn = $('#fabBtn'), menu = $('#fabMenu');
  if (!wrap || !btn || !menu) return;
  menu.innerHTML = `
    <a class="fab-item wa" id="fabWa" href="#" target="_blank" rel="noopener">${WA_ICON}<span>WhatsApp</span></a>
    <a class="fab-item tg" id="fabTg" href="#" target="_blank" rel="noopener">${TG_ICON}<span>Telegram</span></a>`;
  btn.addEventListener('click', () => wrap.classList.toggle('open'));
  document.addEventListener('click', e => {
    if (!e.target.closest('.fab-wrap')) wrap.classList.remove('open');
  });
}

function initLightbox() {
  const lb = $('#lightbox'), img = $('#lightboxImg');
  if (!lb) return;
  document.addEventListener('click', e => {
    const t = e.target.closest('[data-lightbox]');
    if (t) { img.src = t.getAttribute('data-lightbox'); lb.classList.add('open'); }
    else if (e.target.closest('.lightbox')) lb.classList.remove('open');
  });
}

/* ---------- telegram join popup ---------- */
const TG_CHANNEL_URL = 'https://t.me/isaiyaa_bd';

function injectJoinPopup() {
  if ($('#joinOverlay')) return;
  document.body.insertAdjacentHTML('beforeend', `
  <div class="join-overlay" id="joinOverlay">
    <div class="join-card">
      <div class="join-orb join-orb-1"></div>
      <div class="join-orb join-orb-2"></div>
      <button class="join-close" id="joinClose" aria-label="Close">✕</button>
      <div class="join-badge">${TG_ICON}</div>
      <h3 class="join-title">Join Our <span class="grad">Telegram Channel</span></h3>
      <p class="join-sub">Be part of our community! Get every store update instantly — new arrivals, exclusive offers and restock alerts, before anyone else.</p>
      <div class="join-feats">
        <div class="join-feat"><span class="fi">🚀</span><span><b>New products</b> — know first, buy first</span></div>
        <div class="join-feat"><span class="fi">🎁</span><span><b>Exclusive deals</b> &amp; secret discount codes</span></div>
        <div class="join-feat"><span class="fi">⚡</span><span><b>Instant restock alerts</b> for sold-out items</span></div>
      </div>
      <a class="join-btn" id="joinBtn" href="${TG_CHANNEL_URL}" target="_blank" rel="noopener">${TG_ICON}<span>Join Channel Now</span>
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
      </a>
      <div class="join-handle">t.me/isaiyaa_bd</div>
      <button class="join-later" id="joinLater">Maybe later</button>
    </div>
  </div>`);
}

function initJoinPopup() {
  const KEY = 'isa_tg_popup_shown';
  try { if (sessionStorage.getItem(KEY)) return; } catch {}
  injectJoinPopup();
  const ov = $('#joinOverlay');
  const close = () => { ov.classList.remove('open'); try { sessionStorage.setItem(KEY, '1'); } catch {} };
  setTimeout(() => ov.classList.add('open'), 900);
  $('#joinClose').addEventListener('click', close);
  $('#joinLater').addEventListener('click', close);
  $('#joinBtn').addEventListener('click', () => { try { sessionStorage.setItem(KEY, '1'); } catch {} });
  ov.addEventListener('click', e => { if (e.target === ov) close(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && ov.classList.contains('open')) close(); });
}
/* ---------- product card renderer ---------- */
function productCard(p, i) {
  const c = catInfo(p.category);
  const img = p.image
    ? `<img src="${esc(p.image)}" alt="${esc(p.title)}" loading="lazy">`
    : `<div class="ph ph-${esc(p.category)}">${c.icon}<span>${esc(c.label)}</span></div>`;
  const badge = p.badge ? `<div class="pbadge">${esc(p.badge)}</div>` : '';
  const stock = (p.stock > 0 && p.stock <= 10) ? `<div class="stock-low">Only ${p.stock} left</div>` : '';
  const old = p.oldPrice > p.price ? `<span class="old">${fmtBDT(p.oldPrice)}</span>` : '';
  const feat = (p.features && p.features[0]) ? `<div class="feat">✓ ${esc(p.features[0])}</div>` : '';
  return `
  <article class="prod-card" style="animation-delay:${(i || 0) * 0.06}s">
    ${badge}${stock}
    <a class="thumb" href="/product.html?id=${esc(p.id)}">${img}</a>
    <div class="body">
      <span class="cat">${esc(c.label)}</span>
      <h3 onclick="location.href='/product.html?id=${esc(p.id)}'">${esc(p.title)}</h3>
      ${feat}
      <div class="foot">
        <div class="price-box"><span class="p">${fmtBDT(p.price)}<small>BDT</small></span>${old}</div>
        <button class="buy-btn" data-buy="${esc(p.id)}">Buy Now
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
        </button>
      </div>
    </div>
  </article>`;
}

function renderGrid(list, container) {
  if (!container) return;
  container.innerHTML = list.length
    ? list.map((p, i) => productCard(p, i)).join('')
    : `<div class="empty-note"><div class="big">🔍</div><b>No products found</b><br>Try a different category or search term.</div>`;
}

/* global Buy button handler (event delegation) */
document.addEventListener('click', e => {
  const btn = e.target.closest('[data-buy]');
  if (!btn) return;
  e.preventDefault();
  const p = ISA.products.find(x => x.id === btn.getAttribute('data-buy'));
  if (p && typeof openCheckout === 'function') openCheckout(p);
});

/* ---------- checkout modal (injected on every page) ---------- */
function injectCheckoutModal() {
  if ($('#checkoutModal')) return;
  document.body.insertAdjacentHTML('beforeend', `
  <div class="modal-overlay" id="checkoutModal">
    <div class="modal">
      <button class="modal-close" id="ckClose" aria-label="Close">✕</button>
      <div class="ck-head">
        <img src="https://i.postimg.cc/h4NZkpY8/image.png" alt="">
        <div><div class="t">Complete your order — <b id="ckProduct">Product</b></div><div class="t" style="margin-top:3px;">No account needed • Fast WhatsApp delivery</div></div>
      </div>
      <div class="ck-body">
        <div class="ck-step" id="ckStepMethods">
          <h3>1. Select Payment Method</h3>
          <div class="pm-grid" id="pmGrid"></div>
        </div>
        <div class="ck-step" id="ckStepPay" hidden>
          <button class="ck-back" id="ckBack">← Change payment method</button>
          <div class="pay-amount"><div class="a" id="payAmount">৳0</div><div class="h" id="payAmountHint"></div></div>
          <div class="pay-account">
            <div class="ac-box"><div class="ac-l" id="payAccLabel">Account</div><div class="ac-v" id="payAccValue">—</div></div>
            <button class="copy-btn" id="payCopy">Copy</button>
          </div>
          <ul class="pay-instr" id="payInstr"></ul>
          <form class="order-form" id="orderForm">
            <div class="field">
              <label>Your WhatsApp Number <span class="req">*</span></label>
              <input type="tel" name="whatsapp" id="fWa" placeholder="01XXXXXXXXX" required>
            </div>
            <div class="field" id="trxWrap" hidden>
              <label>Transaction ID (TrxID) <span class="req">*</span></label>
              <input type="text" name="trxId" id="fTrx" placeholder="e.g. 8N7DXXA1ZM" maxlength="40">
            </div>
            <div class="field">
              <label>Payment Screenshot <span class="req">*</span></label>
              <div class="drop" id="payDrop">
                <div class="ic">📤</div>
                <div class="t"><b>Click to upload</b> or drag &amp; drop<br><small style="color:#6b7793">PNG, JPG, WEBP — max 5MB</small></div>
                <input type="file" id="fShot" accept="image/png,image/jpeg,image/webp" required>
              </div>
              <img class="drop-preview" id="payPreview" alt="" style="display:none;">
            </div>
            <button class="btn-primary" type="submit" id="ckSubmit">✔ Confirm Order</button>
          </form>
        </div>
        <div class="ck-step ck-done" id="ckStepDone" hidden>
          <div class="big">🎉</div>
          <h3>Order Placed Successfully!</h3>
          <div class="oid" id="doneOrderId">ORD-000</div>
          <p>We have received your payment proof.<br>Our team will verify it and send your product to your <b>WhatsApp</b> shortly.</p>
          <a class="btn-primary" id="doneWaBtn" href="#" target="_blank" rel="noopener">Contact on WhatsApp
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
          </a>
        </div>
      </div>
    </div>
  </div>`);
}
/* ---------- checkout logic ---------- */
let CK = { product: null, method: null };

const METHOD_META = {
  bkash:   { desc: 'Pay with bKash (BDT)',        trx: true  },
  nagad:   { desc: 'Pay with Nagad (BDT)',        trx: true  },
  binance: { desc: 'Pay with Binance Pay (USDT)', trx: false },
  btc:     { desc: 'Pay with Bitcoin (BTC)',      trx: false },
  ltc:     { desc: 'Pay with Litecoin (LTC)',     trx: false }
};

function cryptoAmount(method, bdt) {
  const usd = bdt / (Number(ISA.rates.usdRate) || 122);
  if (method === 'binance') return { display: usd.toFixed(2) + ' USDT', usd };
  if (method === 'btc') {
    const amt = usd / (Number(ISA.rates.BTCUSDT) || 97000);
    return { display: amt.toFixed(7) + ' BTC', usd };
  }
  if (method === 'ltc') {
    const amt = usd / (Number(ISA.rates.LTCUSDT) || 105);
    return { display: amt.toFixed(4) + ' LTC', usd };
  }
  return { display: fmtBDT(bdt), usd };
}

async function openCheckout(product) {
  injectCheckoutModal();
  await loadConfig(); /* always refresh payment info before checkout */
  CK = { product, method: null };

  $('#ckProduct').textContent = product.title;
  $('#pmGrid').innerHTML = ISA.cfg.payments.map(p => {
    const m = METHOD_META[p.key] || { desc: '', trx: false };
    return `<button class="pm-card" data-method="${esc(p.key)}">
      <img src="${esc(p.logo)}" alt="${esc(p.label)}">
      <div><div class="n">${esc(p.label)}</div><div class="d">${esc(m.desc)}</div></div>
      <span class="arrow">→</span>
    </button>`;
  }).join('');

  showStep('methods');
  $('#checkoutModal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeCheckout() {
  $('#checkoutModal').classList.remove('open');
  document.body.style.overflow = '';
}

function showStep(step) {
  $('#ckStepMethods').hidden = step !== 'methods';
  $('#ckStepPay').hidden = step !== 'pay';
  $('#ckStepDone').hidden = step !== 'done';
  const body = $('.modal .ck-body');
  if (body) body.scrollTop = 0;
}
function selectMethod(key) {
  const pm = ISA.cfg.payments.find(p => p.key === key);
  const meta = METHOD_META[key];
  if (!pm || !meta || !CK.product) return;
  CK.method = key;

  const isCrypto = !meta.trx;
  const amt = cryptoAmount(key, CK.product.price);
  $('#payAmount').textContent = amt.display;
  $('#payAmountHint').textContent = isCrypto
    ? `Live rate: ৳${CK.product.price} ≈ ${amt.display} (1 USD = ৳${ISA.rates.usdRate}) — send the EXACT amount`
    : `Pay exactly ${fmtBDT(CK.product.price)} to the ${pm.label} number below`;

  $('#payAccLabel').textContent = (pm.label || key) + (pm.accountType ? ' — ' + pm.accountType : ' Number');
  $('#payAccValue').textContent = pm.number || '—';
  $('#payCopy').textContent = 'Copy';
  $('#payCopy').classList.remove('done');

  $('#payInstr').innerHTML = String(pm.instructions || '')
    .split('\n').filter(Boolean)
    .map(l => `<li>• ${esc(l)}</li>`).join('');

  $('#trxWrap').hidden = !meta.trx;
  $('#fTrx').required = meta.trx;
  $('#fWa').value = '';
  $('#fTrx').value = '';
  resetFileDrop();
  showStep('pay');
}

function resetFileDrop() {
  const drop = $('#payDrop'), prev = $('#payPreview');
  $('#fShot').value = '';
  if (prev) { prev.style.display = 'none'; prev.src = ''; }
  const t = $('.t', drop);
  if (t) t.innerHTML = '<b>Click to upload</b> or drag &amp; drop<br><small style="color:#6b7793">PNG, JPG, WEBP — max 5MB</small>';
}

function initCheckoutEvents() {
  injectCheckoutModal();
  $('#ckClose').addEventListener('click', closeCheckout);
  $('#checkoutModal').addEventListener('click', e => { if (e.target.id === 'checkoutModal') closeCheckout(); });
  $('#ckBack').addEventListener('click', () => showStep('methods'));
  $('#pmGrid').addEventListener('click', e => {
    const card = e.target.closest('[data-method]');
    if (card) selectMethod(card.getAttribute('data-method'));
  });
  $('#payCopy').addEventListener('click', () => {
    const val = $('#payAccValue').textContent;
    navigator.clipboard.writeText(val).then(() => {
      const b = $('#payCopy');
      b.textContent = 'Copied ✓';
      b.classList.add('done');
      toast('Copied to clipboard!', 'ok');
    }).catch(() => toast('Copy failed — please copy manually', 'err'));
  });
  $('#fShot').addEventListener('change', () => {
    const f = $('#fShot').files[0];
    if (!f) return;
    const prev = $('#payPreview');
    prev.src = URL.createObjectURL(f);
    prev.style.display = 'block';
    const t = $('.t', $('#payDrop'));
    if (t) t.innerHTML = `<b style="color:#00d68f">✓ ${esc(f.name)}</b> — tap to change`;
  });
}
/* ---------- order submit ---------- */
async function submitOrder(e) {
  e.preventDefault();
  if (!CK.product || !CK.method) return;
  const shot = $('#fShot').files[0];
  const wa = $('#fWa').value.trim();
  const trx = $('#fTrx').value.trim();
  if (!shot) return toast('Please upload your payment screenshot', 'err');
  if (wa.replace(/\D/g, '').length < 10) return toast('Please enter a valid WhatsApp number', 'err');

  const meta = METHOD_META[CK.method];
  if (meta.trx && !trx) return toast('Please enter your Transaction ID', 'err');

  const amt = cryptoAmount(CK.method, CK.product.price);
  const fd = new FormData();
  fd.append('productId', CK.product.id || '');
  fd.append('productTitle', CK.product.title);
  fd.append('priceBDT', CK.product.price);
  fd.append('paymentMethod', CK.method);
  fd.append('amountDisplay', amt.display);
  fd.append('amountUSD', amt.usd.toFixed(2));
  fd.append('trxId', trx);
  fd.append('whatsapp', wa);
  fd.append('screenshot', shot);

  const btn = $('#ckSubmit');
  btn.disabled = true;
  btn.textContent = 'Placing order...';
  try {
    const res = await fetch('/api/orders', { method: 'POST', body: fd });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Order failed');
    $('#doneOrderId').textContent = data.orderId;
    $('#doneWaBtn').href = waLink(ISA.cfg.whatsapp, `Hello ${ISA.cfg.siteName}! I just placed order ${data.orderId} for "${CK.product.title}". Please verify my payment.`);
    showStep('done');
  } catch (err) {
    toast(err.message || 'Something went wrong', 'err');
  } finally {
    btn.disabled = false;
    btn.textContent = '✔ Confirm Order';
  }
}

/* ---------- reviews ---------- */
function starRow(n) {
  let h = '<div class="stars">';
  for (let i = 1; i <= 5; i++) h += `<span class="${i <= n ? 'on' : ''}">★</span>`;
  return h + '</div>';
}

async function loadReviews() {
  const grid = $('#revGrid');
  if (!grid) return;
  try {
    const res = await fetch('/api/reviews');
    const list = await res.json();
    grid.innerHTML = list.length ? list.map(r => `
      <div class="rev-card glass">
        ${starRow(r.rating)}
        <p>"${esc(r.text)}"</p>
        <div class="who">
          <div class="ava">${esc((r.name || 'U').charAt(0).toUpperCase())}</div>
          <div><b>${esc(r.name)}</b><span>Verified Customer</span></div>
        </div>
      </div>`).join('')
    : `<div class="empty-note" style="grid-column:1/-1;">No reviews yet — be the first to review us!</div>`;
  } catch { grid.innerHTML = ''; }
}

function initReviewForm() {
  const form = $('#revForm');
  if (!form) return;
  let rating = 5;
  const stars = $$('#starPick span');
  const paint = () => stars.forEach(s => s.classList.toggle('on', +s.dataset.v <= rating));
  paint();
  stars.forEach(s => s.addEventListener('click', () => { rating = +s.dataset.v; paint(); }));
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const fd = new FormData(form);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: fd.get('name'), rating, text: fd.get('text') })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      toast(data.message || 'Review submitted!', 'ok');
      form.reset();
      rating = 5; paint();
    } catch (err) {
      toast(err.message || 'Failed to submit review', 'err');
    }
  });
}

/* ---------- page boot ---------- */
document.addEventListener('DOMContentLoaded', async () => {
  initHeader();
  initFab();
  initLightbox();
  initCheckoutEvents();
  initJoinPopup();
  await loadConfig();

  const page = document.body.dataset.page;
  try {
    const res = await fetch('/api/products', { cache: 'no-store' });
    ISA.products = await res.json();
  } catch { ISA.products = []; }

  if (page === 'home' || page === 'cards') {
    const grid = $('#grid');
    const filtered = page === 'cards' ? ISA.products.filter(p => p.category === 'card') : ISA.products;
    renderGrid(filtered, grid);
    initSearch();

    if (page === 'home') {
      /* category chips */
      const chips = $('#chips');
      if (chips) {
        const used = [...new Set(ISA.products.map(p => p.category))];
        chips.innerHTML = `<button class="chip active" data-cat="all">All</button>` +
          used.map(c => `<button class="chip" data-cat="${esc(c)}">${catInfo(c).icon} ${esc(catInfo(c).label)}</button>`).join('');
        chips.addEventListener('click', e => {
          const chip = e.target.closest('.chip');
          if (!chip) return;
          $$('.chip', chips).forEach(x => x.classList.remove('active'));
          chip.classList.add('active');
          const cat = chip.dataset.cat;
          renderGrid(cat === 'all' ? ISA.products : ISA.products.filter(p => p.category === cat), grid);
        });
      }
      loadReviews();
      initReviewForm();
    }
  } else {
    initSearch();
  }

  /* hook order form submit (modal exists after initCheckoutEvents) */
  const of = $('#orderForm');
  if (of) of.addEventListener('submit', submitOrder);
});