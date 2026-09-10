/* ============================================================
   isaiyaa.bd — Product Detail Page Logic
   ============================================================ */
'use strict';

function getParam(name) {
  return new URLSearchParams(location.search).get(name);
}

function renderDetail(p) {
  const c = CATS[p.category] || CATS.other;
  const img = p.image
    ? `<img src="${esc(p.image)}" alt="${esc(p.title)}">`
    : `<div class="ph ph-${esc(p.category)}">${c.icon}<span>${esc(c.label)}</span></div>`;

  const old = p.oldPrice > p.price ? `<span class="old">${fmtBDT(p.oldPrice)}</span>` : '';
  const feats = (p.features || []).length
    ? `<ul class="pd-feats">${p.features.map(f => `<li><span class="tick">✓</span>${esc(f)}</li>`).join('')}</ul>`
    : '';

  const stockTxt = p.stock > 0
    ? `<div class="pd-badges"><span class="pd-tag ok">● In Stock</span><span class="pd-tag">${c.icon} ${esc(c.label)}</span>${p.badge ? `<span class="pd-tag">🏅 ${esc(p.badge)}</span>` : ''}</div>`
    : `<div class="pd-badges"><span class="pd-tag" style="color:#ff8ba0;border-color:rgba(255,77,106,0.4);background:rgba(255,77,106,0.08);">● Out of Stock</span></div>`;

  document.title = `${p.title} — isaiyaa.bd`;
  $('#breadcrumb').innerHTML = `
    <a href="/">Home</a> <span>›</span>
    <a href="/#products">Products</a> <span>›</span>
    <span style="color:#c9d2e8;">${esc(p.title)}</span>`;

  $('#pdWrap').innerHTML = `
  <div class="pd">
    <div class="pd-img">${img}</div>
    <div class="pd-info">
      <span class="cat">${esc(c.label)}</span>
      <h1>${esc(p.title)}</h1>
      ${stockTxt}
      <p class="pd-desc">${esc(p.description)}</p>
      ${feats}
      <div class="pd-buy">
        <div class="row">
          <span class="lbl">Price</span>
          <div><span class="price">${fmtBDT(p.price)} <small>BDT</small></span>${old}</div>
        </div>
        <button class="btn-primary" data-buy="${esc(p.id)}">🛒 Buy Now — Pay Online
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
        </button>
        <div class="pd-note">
          <span>💬</span>
          <span><b>How it works:</b> Click Buy Now → select payment method (bKash/Nagad = ৳ price, Binance/BTC/LTC = live crypto amount) → pay → upload screenshot + your WhatsApp number → we verify &amp; deliver your product on WhatsApp.</span>
        </div>
      </div>
    </div>
  </div>`;
}

function renderRelated(p) {
  const section = $('#relatedSection'), grid = $('#relatedGrid');
  if (!section || !grid) return;
  const related = ISA.products.filter(x => x.category === p.category && x.id !== p.id).slice(0, 4);
  const fallback = ISA.products.filter(x => x.id !== p.id).slice(0, 4);
  const list = related.length ? related : fallback;
  if (!list.length) return;
  section.style.display = 'block';
  renderGrid(list, grid);
}

document.addEventListener('DOMContentLoaded', async () => {
  const id = getParam('id');
  const wrap = $('#pdWrap');
  if (!id) {
    wrap.innerHTML = `<div class="empty-note" style="padding:100px 20px;"><div class="big">🛒</div><b>No product selected</b><br><a href="/" class="btn-primary" style="margin-top:18px;">Go to Homepage</a></div>`;
    return;
  }
  try {
    const res = await fetch(`/api/products/${encodeURIComponent(id)}`);
    if (!res.ok) throw new Error();
    const p = await res.json();
    /* ensure buy-handler finds the product even if list hasn't loaded */
    if (!ISA.products.find(x => x.id === p.id)) ISA.products.push(p);
    renderDetail(p);
    renderRelated(p);
  } catch {
    wrap.innerHTML = `<div class="empty-note" style="padding:100px 20px;"><div class="big">😕</div><b>Product not found</b><br>It may have been removed.<br><a href="/" class="btn-primary" style="margin-top:18px;">Go to Homepage</a></div>`;
  }
});