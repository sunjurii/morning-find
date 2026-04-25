/* ===========================
   아침의 발견 — app.js
=========================== */

let map = null;
let markers = [];
let currentTimeFilter = 'all';   // 'all' | 'open8' | 'open9' | 'open10'
let mealFilterOn = false;         // 간단한 식사 서브 필터
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
  applyFilter();
  setupEvents();
}

// ── Filter logic ──────────────────────────────────────────────
function getFiltered() {
  let result = CAFES;
  if (currentTimeFilter !== 'all') {
    result = result.filter(c => c.tags.includes(currentTimeFilter));
  }
  if (mealFilterOn) {
    result = result.filter(c => c.tags.includes('meal'));
  }
  return result;
}

function applyFilter() {
  const filtered = getFiltered();
  if (map) renderMarkers(filtered);
  renderCafeList(filtered);
  closeDetail();
  if (CAFES.length > 0 && filtered.length === 0) showToast('해당하는 카페가 없습니다');
}

// ── Markers ───────────────────────────────────────────────────
function renderMarkers(cafes) {
  markers.forEach(m => m.marker.setMap(null));
  markers = [];

  cafes.forEach(cafe => {
    const timeTag = cafe.tags.find(t => t.startsWith('open')) || '';
    const markerEl = document.createElement('div');
    markerEl.className = `custom-marker${timeTag ? ' marker-' + timeTag : ''}`;
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
      openNaverPanel(cafe);
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

  if (cafes.length === 0) {
    list.innerHTML = `<p style="text-align:center; padding:40px 20px; font-size:13px; color:var(--gray-3); line-height:1.8;">
      등록된 카페가 없습니다.<br/>data.js에 카페를 추가해주세요.
    </p>`;
    return;
  }

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
      if (window.innerWidth <= 768) closePanel();
    };
    item.addEventListener('click', handler);
    item.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') handler(); });
  });
}

function getTagClass(label) {
  if (label === '8시 오픈') return 'open8';
  if (label === '9시 오픈') return 'open9';
  if (label === '10시 오픈') return 'open10';
  if (label === '식사 가능') return 'meal';
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

  document.querySelectorAll('.cafe-item').forEach(el => {
    el.classList.toggle('active', parseInt(el.dataset.id) === cafe.id);
  });
}

function closeDetail() {
  document.getElementById('detailCard').classList.remove('open', 'panel-open');
  setActiveMarker(null);
  document.querySelectorAll('.cafe-item').forEach(el => el.classList.remove('active'));
}

// ── Info panel (pin click) ────────────────────────────────────
function openNaverPanel(cafe) {
  document.getElementById('infoCafeName').textContent = cafe.name;
  document.getElementById('infoDesc').textContent = cafe.desc || '';

  const btn = document.getElementById('infoNaverBtn');
  if (cafe.naverUrl) {
    btn.href = cafe.naverUrl;
    btn.style.display = 'inline-flex';
  } else {
    btn.style.display = 'none';
  }

  const badges = document.getElementById('infoBadges');
  badges.innerHTML = cafe.tagLabels.map(t =>
    `<span class="tag ${getTagClass(t)}">${t}</span>`
  ).join('');

  document.getElementById('infoPanel').classList.add('open');
}

function closeNaverPanel() {
  document.getElementById('infoPanel').classList.remove('open');
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
  // Time filter buttons
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentTimeFilter = btn.dataset.time;
      applyFilter();
    });
  });

  // Meal sub-filter toggle
  const mealBtn = document.getElementById('mealToggle');
  mealBtn.addEventListener('click', () => {
    mealFilterOn = !mealFilterOn;
    mealBtn.classList.toggle('active', mealFilterOn);
    mealBtn.dataset.active = mealFilterOn;
    applyFilter();
  });

  // List toggle
  document.getElementById('listToggle').addEventListener('click', () => {
    if (panelOpen) closePanel(); else openPanel();
  });

  // Panel close
  document.getElementById('panelClose').addEventListener('click', closePanel);

  // Detail close
  document.getElementById('detailClose').addEventListener('click', closeDetail);

  // Info panel close
  document.getElementById('infoPanelClose').addEventListener('click', closeNaverPanel);

  // Click map to close detail and info panel
  if (map) {
    naver.maps.Event.addListener(map, 'click', () => {
      closeDetail();
      closeNaverPanel();
    });
  }

  // Swipe down to close on mobile
  setupSwipeClose();
}

function setupSwipeClose() {
  const card = document.getElementById('detailCard');
  let startY = 0;
  card.addEventListener('touchstart', e => { startY = e.touches[0].clientY; }, { passive: true });
  card.addEventListener('touchend', e => {
    if (e.changedTouches[0].clientY - startY > 60) closeDetail();
  }, { passive: true });

  const panel = document.getElementById('sidePanel');
  panel.addEventListener('touchstart', e => { startY = e.touches[0].clientY; }, { passive: true });
  panel.addEventListener('touchend', e => {
    if (e.changedTouches[0].clientY - startY > 80) closePanel();
  }, { passive: true });
}

// ── Fallback: API key 미설정 시 데모 모드 ─────────────────────
window.addEventListener('DOMContentLoaded', () => {
  showLoading();
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
        네이버 지도 API 키를 설정하면<br/>지도가 활성화됩니다.
      </p>
    </div>
  `;
  applyFilter();
  setupEvents();
}
