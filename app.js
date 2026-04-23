/* ===========================
   아침의 발견 — app.js
=========================== */

let map = null;
let markers = [];
let currentFilter = 'all';
let activeMarkerId = null;
let panelOpen = false;

// ── Loading overlay ──────────────────────────────────────────
function showLoading() {
  const el = document.createElement('div');
  el.className = 'map-loading';
  el.id = 'mapLoading';
  el.innerHTML = `
    <p class="loading-text">morning find</p>
    <div class="loading-dots"><span></span><span></span><span></span></div>
  `;
  document.body.appendChild(el);
}

function hideLoading() {
  const el = document.getElementById('mapLoading');
  if (el) {
    el.classList.add('hidden');
    setTimeout(() => el.remove(), 500);
  }
}

// ── Map init (called by Naver SDK onload) ─────────────────────
function initMap() {
  const mapEl = document.getElementById('map');
  map = new naver.maps.Map(mapEl, {
    center: new naver.maps.LatLng(37.5624, 126.9698),
    zoom: 12,
    zoomControl: false,
    scaleControl: false,
    mapDataControl: false,
    logoControlOptions: {
      position: naver.maps.Position.BOTTOM_LEFT
    }
  });

  hideLoading();
  renderMarkers(CAFES);
  renderCafeList(CAFES);
  setupEvents();
}

// ── Markers ───────────────────────────────────────────────────
function renderMarkers(cafes) {
  // Remove old markers
  markers.forEach(m => m.marker.setMap(null));
  markers = [];

  cafes.forEach(cafe => {
    const markerEl = document.createElement('div');
    markerEl.className = 'custom-marker';
    markerEl.innerHTML = `
      <div class="marker-label">${cafe.name}</div>
      <div class="marker-dot"></div>
    `;

    const marker = new naver.maps.Marker({
      position: new naver.maps.LatLng(cafe.lat, cafe.lng),
      map: map,
      icon: {
        content: markerEl,
        anchor: new naver.maps.Point(6, 6)
      }
    });

    naver.maps.Event.addListener(marker, 'click', () => {
      openDetail(cafe);
      setActiveMarker(cafe.id);
    });

    markers.push({ id: cafe.id, marker, el: markerEl });
  });
}

function setActiveMarker(id) {
  markers.forEach(m => {
    m.el.classList.toggle('active', m.id === id);
  });
  activeMarkerId = id;
}

// ── Cafe list ─────────────────────────────────────────────────
function renderCafeList(cafes) {
  const list = document.getElementById('cafeList');
  const count = document.getElementById('cafeCount');
  count.textContent = cafes.length;

  list.innerHTML = cafes.map(c => `
    <div class="cafe-item" data-id="${c.id}" role="button" tabindex="0">
      <img class="cafe-thumb" src="${c.img}" alt="${c.name}" loading="lazy" />
      <div class="cafe-info">
        <div class="cafe-item-name">${c.name}</div>
        <div class="cafe-item-addr">${c.address}</div>
        <div class="cafe-item-tags">${c.tagLabels.map(t => `<span class="tag ${getTagClass(t)}">${t}</span>`).join('')}</div>
      </div>
    </div>
  `).join('');

  list.querySelectorAll('.cafe-item').forEach(item => {
    const handler = () => {
      const id = parseInt(item.dataset.id);
      const cafe = CAFES.find(c => c.id === id);
      if (!cafe) return;
      openDetail(cafe);
      setActiveMarker(cafe.id);
      panToMarker(cafe);
      // on mobile close panel
      if (window.innerWidth <= 768) closePanel();
    };
    item.addEventListener('click', handler);
    item.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') handler(); });
  });
}

function getTagClass(label) {
  if (label === '조용한') return 'quiet';
  if (label === '뷰맛집') return 'view';
  if (label === '자연') return 'nature';
  if (label === '이른 오픈') return 'early';
  return '';
}

// ── Detail card ───────────────────────────────────────────────
function openDetail(cafe) {
  const card = document.getElementById('detailCard');
  document.getElementById('detailImg').src = cafe.img;
  document.getElementById('detailImg').alt = cafe.name;
  document.getElementById('detailName').textContent = cafe.name;
  document.getElementById('detailAddress').textContent = cafe.address;
  document.getElementById('detailHours').querySelector('span').textContent = cafe.hours;
  document.getElementById('detailPrice').querySelector('span').textContent = cafe.price;
  document.getElementById('detailDesc').textContent = cafe.desc;
  document.getElementById('detailLink').href = cafe.naverUrl;
  document.getElementById('detailTags').innerHTML = cafe.tagLabels.map(t =>
    `<span class="tag ${getTagClass(t)}">${t}</span>`
  ).join('');

  card.classList.add('open');
  if (panelOpen) card.classList.add('panel-open');

  // Highlight list item
  document.querySelectorAll('.cafe-item').forEach(el => {
    el.classList.toggle('active', parseInt(el.dataset.id) === cafe.id);
  });
}

function closeDetail() {
  document.getElementById('detailCard').classList.remove('open', 'panel-open');
  setActiveMarker(null);
  document.querySelectorAll('.cafe-item').forEach(el => el.classList.remove('active'));
}

// ── Panel ─────────────────────────────────────────────────────
function openPanel() {
  document.getElementById('sidePanel').classList.add('open');
  panelOpen = true;
  if (document.getElementById('detailCard').classList.contains('open')) {
    document.getElementById('detailCard').classList.add('panel-open');
  }
}

function closePanel() {
  document.getElementById('sidePanel').classList.remove('open');
  panelOpen = false;
  document.getElementById('detailCard').classList.remove('panel-open');
}

// ── Filter ────────────────────────────────────────────────────
function applyFilter(filter) {
  currentFilter = filter;
  const filtered = filter === 'all' ? CAFES : CAFES.filter(c => c.tags.includes(filter));
  renderMarkers(filtered);
  renderCafeList(filtered);
  closeDetail();
  if (filtered.length === 0) showToast('해당하는 카페가 없습니다');
}

// ── Pan to marker ─────────────────────────────────────────────
function panToMarker(cafe) {
  if (!map) return;
  map.panTo(new naver.maps.LatLng(cafe.lat, cafe.lng), { duration: 400, easing: 'easeOutCubic' });
}

// ── Toast ─────────────────────────────────────────────────────
let toastTimer = null;
function showToast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2500);
}

// ── Events ────────────────────────────────────────────────────
function setupEvents() {
  // Filter buttons
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      applyFilter(btn.dataset.filter);
    });
  });

  // List toggle
  document.getElementById('listToggle').addEventListener('click', () => {
    if (panelOpen) closePanel(); else openPanel();
  });

  // Panel close
  document.getElementById('panelClose').addEventListener('click', closePanel);

  // Detail close
  document.getElementById('detailClose').addEventListener('click', closeDetail);

  // Click map to close detail
  if (map) {
    naver.maps.Event.addListener(map, 'click', closeDetail);
  }

  // Swipe down to close detail on mobile
  setupSwipeClose();
}

function setupSwipeClose() {
  const card = document.getElementById('detailCard');
  let startY = 0;
  card.addEventListener('touchstart', e => { startY = e.touches[0].clientY; }, { passive: true });
  card.addEventListener('touchend', e => {
    const dy = e.changedTouches[0].clientY - startY;
    if (dy > 60) closeDetail();
  }, { passive: true });

  const panel = document.getElementById('sidePanel');
  panel.addEventListener('touchstart', e => { startY = e.touches[0].clientY; }, { passive: true });
  panel.addEventListener('touchend', e => {
    const dy = e.changedTouches[0].clientY - startY;
    if (dy > 80) closePanel();
  }, { passive: true });
}

// ── Fallback: if Naver SDK fails, show demo mode ──────────────
window.addEventListener('DOMContentLoaded', () => {
  showLoading();
  // Timeout fallback for when API key is not set
  setTimeout(() => {
    if (!map) {
      hideLoading();
      showDemoMode();
    }
  }, 5000);
});

function showDemoMode() {
  const mapEl = document.getElementById('map');
  mapEl.innerHTML = `
    <div style="
      width:100%; height:100%; display:flex; flex-direction:column;
      align-items:center; justify-content:center; gap:20px;
      background: linear-gradient(135deg, #f7f4ef 0%, #ede7dc 100%);
    ">
      <p style="font-family:'DM Serif Display',serif; font-size:28px; color:#2c1f14; opacity:0.5;">morning find</p>
      <p style="font-size:13px; color:#6b5c4f; text-align:center; max-width:300px; line-height:1.7;">
        네이버 지도 API 키를 설정하면<br/>지도가 활성화됩니다.<br/><br/>
        <code style="background:#ede7dc; padding:4px 10px; border-radius:6px; font-size:11px;">index.html</code> 의<br/>
        <code style="background:#ede7dc; padding:4px 10px; border-radius:6px; font-size:11px;">YOUR_CLIENT_ID</code> 를 교체해주세요.
      </p>
    </div>
  `;
  renderCafeList(CAFES);
  setupFilterEvents();
}

function setupFilterEvents() {
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.dataset.filter;
      const filtered = filter === 'all' ? CAFES : CAFES.filter(c => c.tags.includes(filter));
      renderCafeList(filtered);
    });
  });
  document.getElementById('listToggle').addEventListener('click', () => {
    if (panelOpen) closePanel(); else openPanel();
  });
  document.getElementById('panelClose').addEventListener('click', closePanel);
  document.getElementById('detailClose').addEventListener('click', closeDetail);
}
