const listings = [
  { id: 1, title: 'iPhone 17 Air 256GB', price: 20500, market: 23000, score: 88, risk: 18, condition: 'สภาพดีมาก', battery: 91, storage: '256GB', location: 'Bangkok', age: 1, seller: 'Nina Mobile', sellerTrust: 'บัญชีขายมา 3 ปี', color: '#c7b8dc', art: '#edf8f8', analysis: 'ราคาต่ำกว่าตลาดชัดเจน แบตเตอรี่ยังดี และประวัติผู้ขายดูน่าเชื่อถือ', warning: 'ตรวจ IMEI และทดลองใช้งานจริงก่อนชำระเงิน' },
  { id: 2, title: 'iPhone 17 Air 512GB', price: 24600, market: 27000, score: 84, risk: 19, condition: 'สภาพดีมาก', battery: 93, storage: '512GB', location: 'Bangkok', age: 2, seller: 'Pim Tech', sellerTrust: 'บัญชีขายมา 2 ปี', color: '#aebed8', art: '#edf3ff', analysis: 'ความจุสูง ราคาต่ำกว่ามูลค่าตลาด และแบตเตอรี่เหมาะกับการใช้งานระยะยาว', warning: 'สอบถามประวัติการซ่อมและอุปกรณ์ที่ได้รับเพิ่ม' },
  { id: 3, title: 'iPhone 17 256GB', price: 18400, market: 20500, score: 79, risk: 24, condition: 'สภาพดี', battery: 87, storage: '256GB', location: 'Nonthaburi', age: 3, seller: 'Krit Used', sellerTrust: 'ยืนยันตัวตนแล้ว', color: '#d9c7e6', art: '#faf1fb', analysis: 'ราคาเหมาะสำหรับงบจำกัด แต่ควรนำสุขภาพแบตเตอรี่มาคิดเป็นต้นทุนเพิ่ม', warning: 'แบตเตอรี่ต่ำกว่า 90% เล็กน้อย สามารถใช้ต่อรองได้' },
  { id: 4, title: 'iPhone 16 Pro 256GB', price: 22900, market: 26000, score: 76, risk: 35, condition: 'สภาพดี', battery: 89, storage: '256GB', location: 'Bangkok', age: 2, seller: 'M phone', sellerTrust: 'บัญชีใหม่', color: '#4b4858', art: '#f0eef7', analysis: 'ส่วนต่างราคาดี แต่ความน่าเชื่อถือผู้ขายยังมีข้อมูลไม่มาก', warning: 'ผู้ขายเป็นบัญชีใหม่ ควรนัดรับและไม่โอนเงินมัดจำ' },
  { id: 5, title: 'iPhone 17 Air 256GB', price: 21800, market: 23000, score: 74, risk: 12, condition: 'สภาพดีมาก', battery: 96, storage: '256GB', location: 'Chiang Mai', age: 4, seller: 'Apple Corner', sellerTrust: 'รีวิว 4.9 จาก 42 รายการ', color: '#e6b6bd', art: '#fff0f2', analysis: 'สภาพและแบตเตอรี่โดดเด่น เหมาะกับผู้ซื้อที่เน้นความมั่นใจมากกว่าราคาต่ำสุด', warning: 'ราคายังใกล้ตลาด ลองเจรจาราคาเพิ่มเติม' },
  { id: 6, title: 'iPhone 17 Air 128GB', price: 19900, market: 21400, score: 72, risk: 22, condition: 'สภาพดี', battery: 88, storage: '128GB', location: 'Samut Prakan', age: 3, seller: 'Mango Store', sellerTrust: 'รีวิว 4.7 จาก 18 รายการ', color: '#d5c6e0', art: '#f4f0fb', analysis: 'ราคาดีสำหรับรุ่นเริ่มต้น แต่ความจุและแบตเตอรี่อาจไม่เหมาะกับผู้ใช้หนัก', warning: 'เผื่องบสำหรับเปลี่ยนแบตเตอรี่ในอนาคต' }
];

const storedPreferences = JSON.parse(localStorage.getItem('deal-preferences') || '{}');
const state = {
  view: 'home',
  category: 'All',
  query: '',
  maxPrice: 30000,
  minScore: 0,
  condition: 'all',
  sort: 'score',
  watch: new Set(JSON.parse(localStorage.getItem('deal-watch') || '[]')),
  compare: new Set(JSON.parse(localStorage.getItem('deal-compare') || '[]')),
  alert: JSON.parse(localStorage.getItem('deal-alert') || 'null'),
  preferences: { appearance: 'Light', notifications: true, ...storedPreferences },
  detailId: null
};

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const money = value => `฿${value.toLocaleString('th-TH')}`;
const savingsPercent = item => Math.round((item.market - item.price) / item.market * 100);

function icon(name) {
  const icons = {
    home: '<svg viewBox="0 0 24 24"><path d="m3 11 9-8 9 8v9h-6v-6H9v6H3z"/></svg>',
    search: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>',
    heart: '<svg viewBox="0 0 24 24"><path d="M20.8 4.7a5.5 5.5 0 0 0-7.8 0L12 5.8l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.4 1.1-1.1a5.5 5.5 0 0 0-.1-7.8z"/></svg>',
    bell: '<svg viewBox="0 0 24 24"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></svg>',
    settings: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.6v-.2h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1z"/></svg>'
  };
  return icons[name] || '';
}

function saveState() {
  localStorage.setItem('deal-watch', JSON.stringify([...state.watch]));
  localStorage.setItem('deal-compare', JSON.stringify([...state.compare]));
  localStorage.setItem('deal-preferences', JSON.stringify(state.preferences));
}

function filteredListings() {
  const results = listings.filter(item => {
    const matchesQuery = !state.query || item.title.toLowerCase().includes(state.query.toLowerCase());
    const matchesCategory = state.category === 'All' || state.category === 'iPhone' ||
      (state.category === 'Today' && item.age === 0);
    return matchesQuery && matchesCategory && item.price <= state.maxPrice &&
      item.score >= state.minScore && (state.condition === 'all' || item.condition === state.condition);
  });
  return results.sort((a, b) => {
    if (state.sort === 'price-asc') return a.price - b.price;
    if (state.sort === 'price-desc') return b.price - a.price;
    if (state.sort === 'discount') return savingsPercent(b) - savingsPercent(a);
    if (state.sort === 'newest') return a.age - b.age;
    return b.score - a.score;
  });
}

function phoneArt(item, mini = false) {
  return `<div class="${mini ? 'mini-art' : 'product-art'}" style="--art:${item.art}"><span class="phone" style="--phone:${item.color}"></span></div>`;
}

function favoriteButton(item) {
  return `<button class="favorite-button ${state.watch.has(item.id) ? 'saved' : ''}" data-watch="${item.id}" aria-label="${state.watch.has(item.id) ? 'ลบจาก' : 'เพิ่มใน'}รายการติดตาม">${icon('heart')}</button>`;
}

function dealCard(item) {
  return `<article class="deal-card">
    <div class="product-art" style="--art:${item.art}"><span class="phone" style="--phone:${item.color}"></span><span class="score-badge">◆ ${item.score}</span>${favoriteButton(item)}</div>
    <div class="card-body"><button class="card-open" data-detail="${item.id}"><h3>${item.title}</h3><span class="price-line"><span class="current-price">${money(item.price)}</span><span class="market-price">${money(item.market)}</span></span><span class="saving-pill">-${savingsPercent(item)}% savings</span><p class="card-meta">${item.battery}% battery · ${item.condition}<br>⌖ ${item.location} · ${item.age === 0 ? 'Today' : `${item.age}d`}</p></button></div>
    <button class="more-button" data-options="${item.id}" aria-label="ตัวเลือกเพิ่มเติม">•••</button>
  </article>`;
}

function resultCard(item) {
  return `<article class="result-card"><button class="card-open" data-detail="${item.id}">${phoneArt(item, true)}</button><div class="result-info"><button class="card-open" data-detail="${item.id}"><span class="score-inline">◆ ${item.score}</span><h3>${item.title}</h3><div class="price-line"><span class="current-price">${money(item.price)}</span><span class="market-price">${money(item.market)}</span><span class="saving-pill">-${savingsPercent(item)}%</span></div><p class="card-meta">${item.battery}% · ${item.location} · ${item.age}d</p></button></div><div class="result-actions">${favoriteButton(item)}<button class="more-button" data-options="${item.id}" aria-label="ตัวเลือกเพิ่มเติม">•••</button></div></article>`;
}

function renderCategories() {
  const categories = [['All', '◎'], ['iPhone', '▯'], ['Laptop', '▱'], ['GPU', '▣'], ['More', '•••']];
  $('#categoryGrid').innerHTML = categories.map(([name, symbol]) => `<button class="category-tile ${state.category === name ? 'active' : ''}" data-category="${name}"><span>${symbol}</span>${name}</button>`).join('');
  $('#categoryChips').innerHTML = ['All', 'iPhone', 'Laptop', 'GPU', 'Tablet'].map(name => `<button class="chip ${state.category === name ? 'active' : ''}" data-category="${name}">${name}</button>`).join('');
}

function renderHomeAndSearch() {
  const items = filteredListings();
  $('#listingGrid').innerHTML = items.map(dealCard).join('');
  $('#listingGrid').hidden = items.length === 0;
  $('#emptyState').hidden = items.length !== 0;
  $('#resultCount').textContent = `${items.length} curated mock deals`;
  $('#searchResults').innerHTML = items.length ? items.map(resultCard).join('') : '<div class="empty-state"><span class="empty-icon">⌕</span><h2>No deals found</h2><p>ลองเปลี่ยนคำค้นหาหรือตัวกรอง</p></div>';
  $('#searchResultCount').textContent = `${items.length} results`;
  $('#filterCount').textContent = state.maxPrice < 30000 || state.minScore || state.condition !== 'all' ? '•' : '';
}

function renderWatchlist() {
  const items = listings.filter(item => state.watch.has(item.id));
  $('#watchList').innerHTML = items.length ? items.map(item => `<article class="watch-row">${phoneArt(item, true)}<div class="watch-info"><span class="score-inline">◆ ${item.score}</span><h3>${item.title}</h3><span class="current-price">${money(item.price)}</span><small class="card-meta">Target: ≤ ${money(Math.max(item.price - 1500, 0))}</small></div><button class="row-menu" data-options="${item.id}" aria-label="ตัวเลือกเพิ่มเติม">⋮</button></article>`).join('') : '<div class="empty-state"><span class="empty-icon">♡</span><h2>Your watchlist is empty</h2><p>แตะรูปหัวใจบนดีลที่สนใจเพื่อบันทึกไว้ที่นี่</p><button class="primary-button" data-view="search">Explore deals</button></div>';
}

function renderAlerts() {
  const custom = state.alert ? `<article class="alert-row"><span class="alert-icon">♧</span><div class="alert-info"><strong>Price Alert</strong><small>${state.alert.model}<br>ราคา ≤ ${money(state.alert.price)} · Score ≥ ${state.alert.score}</small></div><button class="toggle ${state.preferences.notifications ? 'on' : ''}" data-toggle-notifications aria-label="เปิดปิดการแจ้งเตือน"></button></article>` : '';
  $('#alertsList').innerHTML = custom + `<article class="alert-row"><span class="alert-icon">ϟ</span><div class="alert-info"><strong>Deal Score Alert</strong><small>Any iPhone<br>Notify when score ≥ 90</small></div><button class="toggle ${state.preferences.notifications ? 'on' : ''}" data-toggle-notifications aria-label="เปิดปิดการแจ้งเตือน"></button></article><article class="alert-row"><span class="alert-icon">▣</span><div class="alert-info"><strong>Sold / Removed Alert</strong><small>Watched listings<br>Notify if no longer available</small></div><button class="toggle ${state.preferences.notifications ? 'on' : ''}" data-toggle-notifications aria-label="เปิดปิดการแจ้งเตือน"></button></article>`;
}

function renderCompare() {
  const items = listings.filter(item => state.compare.has(item.id));
  $('#comparePageCount').textContent = items.length;
  if (!items.length) {
    $('#compareContent').innerHTML = '<div class="empty-state"><span class="empty-icon">⇄</span><h2>No items selected</h2><p>เลือกสินค้าจากเมนู ••• เพื่อเปรียบเทียบ</p><button class="primary-button" data-view="search">Find deals</button></div>';
    return;
  }
  const best = [...items].sort((a, b) => b.score - a.score)[0];
  const rows = [
    ['Price', item => money(item.price)], ['Market Price', item => money(item.market)], ['Savings', item => `-${savingsPercent(item)}%`],
    ['Deal Score', item => item.score], ['Risk Score', item => item.risk], ['Battery', item => `${item.battery}%`], ['Storage', item => item.storage], ['Condition', item => item.condition]
  ];
  $('#compareContent').innerHTML = `<div class="compare-grid">${items.map(item => `<article class="compare-product"><button class="remove-compare" data-compare="${item.id}" aria-label="ลบจากการเปรียบเทียบ">×</button>${phoneArt(item)}<h3>${item.title}</h3><strong>${money(item.price)}</strong> <span class="score-inline">◆ ${item.score}</span></article>`).join('')}</div><table class="compare-table"><tbody>${rows.map(([label, value]) => `<tr><th>${label}</th>${items.map(item => `<td>${value(item)}</td>`).join('')}</tr>`).join('')}</tbody></table><p class="recommendation">♛ <strong>Best Deal: ${best.title}</strong><br>คะแนนดีลสูงสุด โดยยังพิจารณาความเสี่ยงแยกต่างหาก</p>`;
}

function renderCompareTray() {
  const count = state.compare.size;
  $('#compareTray').hidden = count === 0 || state.view === 'compare' || state.detailId !== null;
  $('#compareCount').textContent = `${count} selected`;
}

function renderSettings() {
  $('#appearanceValue').textContent = state.preferences.appearance;
  $('#notificationValue').textContent = state.preferences.notifications ? 'On' : 'Off';
}

function render() {
  renderCategories();
  renderHomeAndSearch();
  renderWatchlist();
  renderAlerts();
  renderCompare();
  renderCompareTray();
  renderSettings();
  saveState();
}

function switchView(view) {
  state.view = view;
  $$('.view').forEach(section => section.classList.toggle('active', section.dataset.page === view));
  $$('.bottom-nav [data-view]').forEach(button => button.classList.toggle('active', button.dataset.view === view));
  const simpleHeader = view === 'home';
  $('#topbar').hidden = !simpleHeader;
  window.scrollTo({ top: 0, behavior: 'instant' });
  renderCompareTray();
  if (view === 'search') requestAnimationFrame(() => $('#searchPageInput').focus({ preventScroll: true }));
}

function openDetail(id) {
  const item = listings.find(listing => listing.id === id);
  if (!item) return;
  state.detailId = id;
  const saved = state.watch.has(id);
  $('#detailScreen').innerHTML = `<header class="detail-topbar"><button class="detail-close" data-close-detail aria-label="ปิดรายละเอียด">‹</button><div><button class="detail-action" data-watch="${id}" aria-label="เพิ่มในรายการติดตาม">${saved ? '♥' : '♡'}</button><button class="detail-action" data-share="${id}" aria-label="แชร์รายการ">↥</button></div></header><div class="detail-hero" style="--art:${item.art}"><span class="phone" style="--phone:${item.color}"></span><span class="image-count">1/5</span></div><div class="detail-body"><div class="detail-score-row"><span class="score-inline">◆ ${item.score}</span><span class="saving-pill">Great Deal</span></div><h1>${item.title}</h1><div class="detail-price">${money(item.price)} <span class="market-price">${money(item.market)}</span> <span class="saving-pill">-${savingsPercent(item)}%</span></div><div class="detail-stats"><div>Battery<strong>${item.battery}%</strong></div><div>Storage<strong>${item.storage}</strong></div><div>Condition<strong>${item.condition === 'สภาพดีมาก' ? 'Excellent' : 'Good'}</strong></div></div><div class="detail-tabs"><button class="active">Overview</button><button>Price History</button><button>Analysis</button><button>Seller</button></div><article class="analysis-card"><h3>✦ AI Summary <span class="score-inline">Mock</span></h3><p>${item.analysis}</p><strong>Recommendation: ${item.score >= 80 ? 'Buy after inspection' : 'Negotiate'}</strong></article><article class="detail-section"><h3>Risk · ${item.risk}/100</h3><p>${item.warning}</p></article><article class="detail-section"><h3>Seller & location</h3><p>${item.seller} · ${item.sellerTrust}<br>⌖ ${item.location} · ${item.age === 0 ? 'Today' : `${item.age} day${item.age > 1 ? 's' : ''} ago`}</p></article><article class="detail-section"><h3>Price history <span class="score-inline">Mock 30D</span></h3><p>Low ${money(item.price - 500)} · Average ${money(item.market - 400)} · High ${money(item.market + 800)}<br>แนวโน้มราคาลดลงเล็กน้อย</p></article></div><footer class="detail-actions"><button class="options-button" data-options="${id}" aria-label="ตัวเลือกเพิ่มเติม">•••</button><button class="primary-button" data-watch="${id}">${saved ? '♥ Added to Watchlist' : '♡ Add to Watchlist'}</button></footer>`;
  $('#detailScreen').hidden = false;
  document.body.style.overflow = 'hidden';
  $('#detailScreen').scrollTop = 0;
  renderCompareTray();
}

function closeDetail() {
  state.detailId = null;
  $('#detailScreen').hidden = true;
  document.body.style.overflow = '';
  renderCompareTray();
}

function openOptions(id) {
  const item = listings.find(listing => listing.id === id);
  const sheet = $('#optionsSheet');
  sheet.innerHTML = `<div class="sheet-content"><div class="sheet-handle"></div><div class="sheet-header"><h2>More options</h2><button class="sheet-close" data-close-sheet aria-label="ปิดเมนู">×</button></div><div class="option-list"><button data-watch="${id}"><span class="option-icon">♡</span>${state.watch.has(id) ? 'Remove from Watchlist' : 'Add to Watchlist'}</button><button data-compare="${id}"><span class="option-icon">⇄</span>${state.compare.has(id) ? 'Remove from Compare' : 'Compare'}</button><button data-alert-for="${id}"><span class="option-icon">♧</span>Set Price Alert</button><button data-share="${id}"><span class="option-icon">↥</span>Share Listing</button><a href="https://example.com/listing/${id}" target="_blank" rel="noopener"><span class="option-icon">↗</span>View on Original Platform</a><button data-report="${id}"><span class="option-icon">!</span>Report Listing</button></div><button class="cancel-sheet" data-close-sheet>Cancel</button></div>`;
  sheet.setAttribute('aria-label', `ตัวเลือกสำหรับ ${item.title}`);
  sheet.showModal();
}

function openAlertSheet(id) {
  const item = id ? listings.find(listing => listing.id === id) : null;
  const alert = state.alert;
  const sheet = $('#alertSheet');
  sheet.innerHTML = `<div class="sheet-content"><div class="sheet-handle"></div><div class="sheet-header"><h2>Set Price Alert</h2><button class="sheet-close" data-close-sheet aria-label="ปิดการตั้งค่า">×</button></div><p class="notice">Local prototype — ตรวจเงื่อนไขกับข้อมูลตัวอย่างในแอปเท่านั้น</p><form class="alert-form" id="alertForm"><label>Product<input name="model" required value="${item ? item.title : alert?.model || 'iPhone 17 Air'}"></label><label>Maximum price<input name="price" type="number" min="0" required value="${item ? item.price : alert?.price || 20500}"></label><label>Minimum Deal Score<input name="score" type="number" min="0" max="100" required value="${alert?.score || 80}"></label><button class="primary-button">Save Alert</button></form></div>`;
  sheet.showModal();
}

function showMessage(title, body) {
  const sheet = $('#messageSheet');
  sheet.innerHTML = `<div class="sheet-content"><div class="sheet-handle"></div><div class="sheet-header"><h2>${title}</h2><button class="sheet-close" data-close-sheet aria-label="ปิด">×</button></div><p class="notice">${body}</p><button class="cancel-sheet" data-close-sheet>Done</button></div>`;
  sheet.showModal();
}

let toastTimer;
function toast(message) {
  clearTimeout(toastTimer);
  $('#toast').textContent = message;
  $('#toast').classList.add('show');
  toastTimer = setTimeout(() => $('#toast').classList.remove('show'), 1800);
}

function toggleWatch(id) {
  state.watch.has(id) ? state.watch.delete(id) : state.watch.add(id);
  const saved = state.watch.has(id);
  render();
  if (state.detailId === id) openDetail(id);
  if ($('#optionsSheet').open) $('#optionsSheet').close();
  toast(saved ? 'Added to Watchlist' : 'Removed from Watchlist');
}

function toggleCompare(id) {
  if (state.compare.has(id)) {
    state.compare.delete(id);
  } else if (state.compare.size >= 4) {
    toast('Compare supports up to 4 items');
    return;
  } else {
    state.compare.add(id);
  }
  render();
  if ($('#optionsSheet').open) $('#optionsSheet').close();
  toast(state.compare.has(id) ? 'Added to Compare' : 'Removed from Compare');
}

function resetFilters() {
  Object.assign(state, { category: 'All', query: '', maxPrice: 30000, minScore: 0, condition: 'all' });
  $('#searchInput').value = '';
  $('#searchPageInput').value = '';
  $('#maxPrice').value = 30000;
  $('#minScore').value = 0;
  $('#conditionFilter').value = 'all';
  $('#maxPriceOutput').textContent = money(30000);
  $('#minScoreOutput').textContent = '0';
  render();
}

function closeSheet(target) {
  const dialog = target.closest('dialog');
  if (dialog?.open) dialog.close();
}

function bindEvents() {
  document.addEventListener('click', async event => {
    const viewButton = event.target.closest('[data-view]');
    const categoryButton = event.target.closest('[data-category]');
    const detailButton = event.target.closest('[data-detail]');
    const watchButton = event.target.closest('[data-watch]');
    const compareButton = event.target.closest('[data-compare]');
    const optionsButton = event.target.closest('[data-options]');
    const alertButton = event.target.closest('[data-alert-for]');
    const settingButton = event.target.closest('[data-setting]');

    if (event.target.closest('[data-close-detail]')) return closeDetail();
    if (event.target.closest('[data-close-sheet]')) return closeSheet(event.target);
    if (viewButton) return switchView(viewButton.dataset.view);
    if (categoryButton) { state.category = categoryButton.dataset.category; render(); return; }
    if (watchButton) return toggleWatch(Number(watchButton.dataset.watch));
    if (compareButton) return toggleCompare(Number(compareButton.dataset.compare));
    if (optionsButton) return openOptions(Number(optionsButton.dataset.options));
    if (alertButton) { closeSheet(alertButton); return openAlertSheet(Number(alertButton.dataset.alertFor)); }
    if (detailButton) return openDetail(Number(detailButton.dataset.detail));
    if (event.target.closest('[data-toggle-notifications]')) {
      state.preferences.notifications = !state.preferences.notifications; render(); return;
    }
    if (event.target.closest('[data-share]')) {
      const item = listings.find(listing => listing.id === Number(event.target.closest('[data-share]').dataset.share));
      const shareData = { title: item.title, text: `${item.title} ${money(item.price)} · Deal Score ${item.score}` };
      if (navigator.share) await navigator.share(shareData).catch(() => {}); else { await navigator.clipboard?.writeText(shareData.text); toast('Listing details copied'); }
      return;
    }
    if (event.target.closest('[data-report]')) { closeSheet(event.target); return showMessage('Report Listing', 'รับรายงานแล้วในโหมดตัวอย่าง ไม่มีข้อมูลถูกส่งออกจากอุปกรณ์'); }
    if (settingButton) {
      if (settingButton.dataset.setting === 'appearance') { state.preferences.appearance = state.preferences.appearance === 'Light' ? 'System' : 'Light'; render(); toast(`Appearance: ${state.preferences.appearance}`); }
      else if (settingButton.dataset.setting === 'notifications') { state.preferences.notifications = !state.preferences.notifications; render(); toast(`Notifications ${state.preferences.notifications ? 'on' : 'off'}`); }
      else if (settingButton.dataset.setting === 'storage') showMessage('Data & Storage', 'Watchlist, compare, alerts และ preferences ถูกจัดเก็บใน localStorage ของอุปกรณ์นี้');
      else showMessage(settingButton.textContent.trim(), 'ฟังก์ชันตัวอย่างสำหรับ Phase 1 — ไม่มีบริการภายนอกหรือ backend');
    }
  });

  $('#searchInput').addEventListener('focus', () => switchView('search'));
  const syncSearch = event => {
    state.query = event.target.value;
    $('#searchInput').value = state.query;
    $('#searchPageInput').value = state.query;
    renderHomeAndSearch();
  };
  $('#searchInput').addEventListener('input', syncSearch);
  $('#searchPageInput').addEventListener('input', syncSearch);
  $('#clearSearch').addEventListener('click', event => { event.preventDefault(); state.query = ''; $('#searchInput').value = ''; $('#searchPageInput').value = ''; render(); });
  $('#clearPageSearch').addEventListener('click', () => { state.query = ''; $('#searchInput').value = ''; $('#searchPageInput').value = ''; render(); });
  $('#filterButton').addEventListener('click', () => { $('#filterPanel').hidden = !$('#filterPanel').hidden; });
  $('#sortSelect').addEventListener('change', event => { state.sort = event.target.value; render(); });
  $('#maxPrice').addEventListener('input', event => { state.maxPrice = Number(event.target.value); $('#maxPriceOutput').textContent = money(state.maxPrice); render(); });
  $('#minScore').addEventListener('input', event => { state.minScore = Number(event.target.value); $('#minScoreOutput').textContent = state.minScore; render(); });
  $('#conditionFilter').addEventListener('change', event => { state.condition = event.target.value; render(); });
  $('#resetFilters').addEventListener('click', resetFilters);
  $('#emptyReset').addEventListener('click', resetFilters);
  $('#compareTrayOpen').addEventListener('click', () => switchView('compare'));
  $('#clearCompare').addEventListener('click', () => { state.compare.clear(); render(); });
  $('#clearComparePage').addEventListener('click', () => { state.compare.clear(); render(); });
  $('#addAlertButton').addEventListener('click', () => openAlertSheet());
  $('#headerAction').addEventListener('click', () => switchView('alerts'));
  $('#alertSheet').addEventListener('submit', event => {
    if (event.target.id !== 'alertForm') return;
    event.preventDefault();
    const data = new FormData(event.target);
    state.alert = { model: data.get('model'), price: Number(data.get('price')), score: Number(data.get('score')) };
    localStorage.setItem('deal-alert', JSON.stringify(state.alert));
    $('#alertSheet').close(); render(); toast('Alert saved');
  });
  $$('.bottom-sheet').forEach(sheet => sheet.addEventListener('click', event => { if (event.target === sheet) sheet.close(); }));
}

function initialise() {
  $$('.nav-icon').forEach(element => { element.innerHTML = icon(element.dataset.icon); });
  $('#headerAction').innerHTML = icon('bell');
  bindEvents();
  render();
}

let installPrompt;
window.addEventListener('beforeinstallprompt', event => { event.preventDefault(); installPrompt = event; $('#installButton').hidden = false; });
$('#installButton').addEventListener('click', async () => { if (!installPrompt) return; installPrompt.prompt(); await installPrompt.userChoice; installPrompt = null; $('#installButton').hidden = true; });
if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js'));

initialise();
