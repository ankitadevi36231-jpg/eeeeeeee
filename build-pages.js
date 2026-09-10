/* One-time page generator: builds cards.html and product.html from index.html parts */
const fs = require('fs');
const path = require('path');
const pub = path.join(__dirname, 'public');
const src = fs.readFileSync(path.join(pub, 'index.html'), 'utf8');

const headEnd = src.indexOf('<!-- ================= HERO ================= -->');
const footStart = src.indexOf('<!-- ================= FOOTER ================= -->');
if (headEnd === -1 || footStart === -1) { console.error('Markers missing'); process.exit(1); }

const headAndHeader = src.slice(0, headEnd);   // head + bg + header
const footerToEnd = src.slice(footStart);      // footer + fab + toast + scripts

/* ---------------- cards.html ---------------- */
let cards = headAndHeader
  .replace('<title>isaiyaa.bd — Premium Digital Store | VPN, Accounts, Cards, Apps & Courses</title>',
           '<title>Virtual Visa & Master Cards — isaiyaa.bd</title>')
  .replace('<body data-page="home">', '<body data-page="cards">')
  .replace('<a href="/" class="nav-link active">Home</a>\n        <a href="/cards.html" class="nav-link">Cards</a>',
           '<a href="/" class="nav-link">Home</a>\n        <a href="/cards.html" class="nav-link active">Cards</a>');

const cardsBody = `
  <!-- ================= CARDS HERO ================= -->
  <section class="hero hero-small">
    <div class="container hero-inner">
      <div class="hero-badge">✦ Visa &amp; Master Virtual Cards</div>
      <h1 class="hero-title"><span class="grad-text">Virtual Cards</span> For Every Payment</h1>
      <p class="hero-sub">Ready-to-use Visa &amp; Master virtual cards with balance. Works on subscriptions, ads &amp; all online payments. Card details delivered to your WhatsApp.</p>
    </div>
  </section>

  <!-- ================= CARDS LIST ================= -->
  <section class="section" id="products">
    <div class="container">
      <div class="product-grid" id="productGrid"></div>
      <div class="empty-state" id="emptyState" hidden>
        <div class="empty-ic">💳</div>
        <h3>No cards available right now</h3>
        <p>Please check back soon or contact us.</p>
      </div>
    </div>
  </section>

${footerToEnd.replace('<script src="/js/catalog.js"></script>',
  '<script>window.CATALOG_CONFIG={fixedCategory:"cards"};</script>\\n  <script src="/js/catalog.js"></script>')}
`;
fs.writeFileSync(path.join(pub, 'cards.html'), cards + cardsBody);

/* ---------------- product.html ---------------- */
let product = headAndHeader
  .replace('<title>isaiyaa.bd — Premium Digital Store | VPN, Accounts, Cards, Apps & Courses</title>',
           '<title>Product — isaiyaa.bd</title>')
  .replace('<body data-page="home">', '<body data-page="product">');

const productBody = `
  <!-- ================= PRODUCT DETAIL ================= -->
  <section class="section product-section">
    <div class="container">
      <nav class="breadcrumb" id="breadcrumb"></nav>
      <div id="detailWrap"><div class="loading">Loading product…</div></div>

      <div class="section-head" id="relatedHead" hidden><h2>You May <span class="grad-text">Also Like</span></h2></div>
      <div class="product-grid" id="relatedGrid"></div>
    </div>
  </section>

${footerToEnd.replace('<script src="/js/catalog.js"></script>', '<script src="/js/product.js"></script>')}
`;
fs.writeFileSync(path.join(pub, 'product.html'), product + productBody);

console.log('Generated cards.html and product.html');
