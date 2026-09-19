/* ===== 畫面切換與登入 ===== */

const loginScreen = document.getElementById('screen-login');
const welcomeScreen = document.getElementById('screen-welcome');
const loginForm = document.getElementById('login-form');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const togglePassword = document.getElementById('toggle-password');
const welcomeName = document.getElementById('welcome-name');
const welcomeAvatar = document.getElementById('welcome-avatar');
const logoutButton = document.getElementById('logout');
const datetimeDate = document.getElementById('datetime-date');
const datetimeTime = document.getElementById('datetime-time');
const showCalendarBtn = document.getElementById('show-calendar');
const calendarScreen = document.getElementById('screen-calendar');
const calendarBack = document.getElementById('calendar-back');
const prevMonthBtn = document.getElementById('prev-month');
const nextMonthBtn = document.getElementById('next-month');
const goTodayBtn = document.getElementById('go-today');
const calendarCurrentMonth = document.getElementById('calendar-current-month');
const calendarGrid = document.getElementById('calendar-grid');
const selectedDateTitle = document.getElementById('selected-date-title');
const selectedEvents = document.getElementById('selected-events');

// 初始化檢查
console.log('Checking DOM elements:');
console.log('- loginScreen:', loginScreen ? '✅' : '❌');
console.log('- welcomeScreen:', welcomeScreen ? '✅' : '❌');
console.log('- loginForm:', loginForm ? '✅' : '❌');
console.log('- usernameInput:', usernameInput ? '✅' : '❌');
console.log('- passwordInput:', passwordInput ? '✅' : '❌');

if (!loginForm || !usernameInput || !passwordInput || !loginScreen || !welcomeScreen) {
  console.error('❌ Critical elements missing! Check HTML structure.');
}

function showScreen(next, current) {
  current.classList.add('screen--leaving');
  next.classList.add('screen--active');

  next.addEventListener('transitionend', function handler() {
    current.classList.remove('screen--active', 'screen--leaving');
    next.removeEventListener('transitionend', handler);
  });
}

loginForm.addEventListener('submit', (event) => {
  event.preventDefault();
  try {
    console.log('Login form submitted');
    const name = usernameInput.value.trim() || '使用者';
    welcomeName.textContent = name;
    welcomeAvatar.textContent = name.charAt(0);
    console.log('Switching to welcome screen');
    showScreen(welcomeScreen, loginScreen);
  } catch (err) {
    console.error('Login error:', err);
    alert('登入時發生錯誤：' + err.message);
  }
});

logoutButton.addEventListener('click', () => {
  showScreen(loginScreen, welcomeScreen);
  passwordInput.value = '';
  usernameInput.focus();
});

togglePassword.addEventListener('click', () => {
  const showing = passwordInput.type === 'text';
  passwordInput.type = showing ? 'password' : 'text';
  togglePassword.setAttribute('aria-pressed', String(!showing));
  togglePassword.setAttribute('aria-label', showing ? '顯示密碼' : '隱藏密碼');
});

/* ===== 巴士到站查詢 ===== */

const busScreen = document.getElementById('screen-bus');
const busBack = document.getElementById('bus-back');
const busRoute = document.getElementById('bus-route');
const busSearch = document.getElementById('bus-search');
const busStatus = document.getElementById('bus-status');
const stopList = document.getElementById('bus-stops');
const segButtons = Array.from(document.querySelectorAll('.seg[data-bound]'));
const companyButtons = Array.from(document.querySelectorAll('.seg[data-company]'));
const tileBus = document.getElementById('tile-bus');
const tileFav = document.getElementById('tile-fav');
const favScreen = document.getElementById('screen-fav');
const favBack = document.getElementById('fav-back');
const favList = document.getElementById('fav-list');
const favEmpty = document.getElementById('fav-empty');

const KMB_BASE = 'https://data.etabus.gov.hk/v1/transport/kmb';
const CTB_BASE = 'https://rt.data.gov.hk/v2/transport/citybus';

const PROVIDERS = {
  kmb: {
    char: '九',
    name: '九巴',
    routeStop: (route, bound) =>
      `${KMB_BASE}/route-stop/${encodeURIComponent(route)}/${bound}/1`,
    stop: (stopId) => `${KMB_BASE}/stop/${stopId}`,
    eta: (stopId, route) =>
      `${KMB_BASE}/eta/${stopId}/${encodeURIComponent(route)}/1`,
    stopName: (data) => data.name_tc,
  },
  ctb: {
    char: '城',
    name: '城巴',
    routeStop: (route, bound) =>
      `${CTB_BASE}/route-stop/CTB/${encodeURIComponent(route)}/${bound}`,
    stop: (stopId) => `${CTB_BASE}/stop/${stopId}`,
    eta: (stopId, route) =>
      `${CTB_BASE}/eta/CTB/${stopId}/${encodeURIComponent(route)}`,
    stopName: (data) => data.name_tc,
    dirFilter: true,
  },
};

const FAV_KEY = 'kmb-fav-stops';
const STAR_SVG =
  '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="m12 3 2.7 5.6 6.1.8-4.5 4.3 1.1 6-5.4-2.9-5.4 2.9 1.1-6L3.2 9.4l6.1-.8L12 3Z"/></svg>';

const REFRESH_SVG =
  '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-2.6-6.4"/><path d="M21 3v6h-6"/></svg>';

/* ===== 學校行事曆事件 ===== */
const CALENDAR_EVENTS = [
  // 九月
  { date: '2025-09-01', title: '開學禮、第一學段 (第 1-11 周)', type: 'important' },
  { range: ['2025-09-01', '2025-09-09'], title: '適應週', type: 'period' },
  { date: '2025-09-19', title: '小一入學資訊日 (升小)', type: 'important' },
  { date: '2025-09-26', title: '中秋節翌日', type: 'holiday' },
  { date: '2025-09-30', title: '國慶日升旗禮及慶祝活動', type: 'event' },
  
  // 十月
  { date: '2025-10-01', title: '國慶日', type: 'holiday' },
  { date: '2025-10-02', title: '防疫針注射 (第 1 針)、全年課外活動開展', type: 'medical' },
  { date: '2025-10-10', title: '期初家長會、小一自行分配學位申請交學位分配組', type: 'important' },
  { date: '2025-10-10', subtitle: '(5/10 紙本)・(9/10 電子)', type: 'note' },
  { date: '2025-10-19', title: '重陽節翌日', type: 'holiday' },
  { date: '2025-10-23', title: '流感疫苗注射 (第 1 針)', type: 'medical' },
  
  // 十一月
  { range: ['2025-11-05', '2025-11-06'], title: '期初考試 (P6 呈分試)', type: 'exam' },
  { range: ['2025-11-09', '2025-11-10'], title: '期初考試 (P6 呈分試)', type: 'exam' },
  { date: '2025-11-13', title: '九東遊戲比賽', type: 'sport' },
  { date: '2025-11-20', title: '教師發展日 (全日)', type: 'event' },
  { date: '2025-11-21', title: '第二學段 (第 12-27 周)', type: 'important' },
  { date: '2025-11-23', title: '更換冬季校服', type: 'notice' },
  { date: '2025-11-30', title: '小一百日宴', type: 'event' },
  
  // 十二月
  { date: '2025-12-04', title: '戶外學習日', type: 'event' },
  { date: '2025-12-08', title: '九東田徑比賽', type: 'sport' },
  { date: '2025-12-12', title: '家長日', type: 'meeting' },
  { date: '2025-12-14', title: '家長日後補假', type: 'holiday' },
  { date: '2025-12-15', title: '流感疫苗注射 (第 2 針)', type: 'medical' },
  { date: '2025-12-22', title: '才藝 (歌唱) 比賽暨聖誕聯歡會', type: 'event' },
  { range: ['2025-12-23', '2026-01-02'], title: '聖誕及新年假期', type: 'holiday' },
  
  // 一月
  { range: ['2026-01-04', '2026-01-18'], title: 'P6 家長遞交自行選校 (電子平台/紙本)', type: 'important' },
  { date: '2026-01-23', title: '家教會親子旅行', type: 'event' },
  { range: ['2026-01-29', '2026-02-01'], title: '全方位學習 (我愛中華文化)', type: 'learning' },
  
  // 二月
  { date: '2026-02-02', title: '教師發展日 (全日)', type: 'event' },
  { range: ['2026-02-03', '2026-02-13'], title: '農曆新年假期', type: 'holiday' },
  { range: ['2026-02-25', '2026-02-26'], title: '期中考試 (P6 呈分試)', type: 'exam' },
  { range: ['2026-03-01', '2026-03-02'], title: '期中考試 (P6 呈分試)', type: 'exam' },
  
  // 三月
  { date: '2026-03-08', title: 'P1 學習成果展、第三學段 (第 28-41 周) 開始', type: 'important' },
  { range: ['2026-03-15', '2026-03-17'], title: '全方位學習 (樂學與創新)', type: 'learning' },
  { range: ['2026-03-22', '2026-03-30'], title: '復活節假期', type: 'holiday' },
  
  // 四月
  { date: '2026-04-01', title: 'P1-6 校運會', type: 'sport' },
  { date: '2026-04-02', title: '校運會後補假、P6 自行分配學位正取生名單', type: 'holiday' },
  { date: '2026-04-05', title: '清明節', type: 'holiday' },
  { date: '2026-04-17', title: '家長日', type: 'meeting' },
  { date: '2026-04-19', title: '家長日後補假', type: 'holiday' },
  { date: '2026-04-26', title: '更換夏季校服', type: 'notice' },
  { date: '2026-04-30', title: '26 周年校慶開放日', type: 'event' },
  
  // 五月
  { date: '2026-05-01', title: '勞動節', type: 'holiday' },
  { date: '2026-05-04', title: 'P3 TSA 視聽及說話評估', type: 'exam', note: '或 5/5' },
  { date: '2026-05-11', title: 'P5 家長會', type: 'meeting' },
  { date: '2026-05-13', title: '佛誕', type: 'holiday' },
  { range: ['2026-05-19', '2026-05-21'], title: 'P6 畢業營', type: 'event' },
  
  // 六月
  { date: '2026-06-02', title: '公佈小一統一派位結果 (電子/郵遞/短訊)', type: 'important' },
  { range: ['2026-06-03', '2026-06-04'], title: '期末考試 (P5 呈分試)', type: 'exam' },
  { range: ['2026-06-07', '2026-06-08'], title: '期末考試 (P5 呈分試)', type: 'exam' },
  { date: '2026-06-09', title: '端午節', type: 'holiday' },
  { date: '2026-06-10', title: '小一註冊', type: 'important' },
  { date: '2026-06-14', title: 'P3、P6 TSA 紙筆評估', type: 'exam' },
  { date: '2026-06-15', title: 'P3、P6 TSA 紙筆評估', type: 'exam' },
  { date: '2026-06-15', title: '試後學段 (第 42-45 周) 開始', type: 'important' },
  { date: '2026-06-18', title: '防疫針注射 (第 2 針)', type: 'medical' },
  { date: '2026-06-26', title: '小一體驗日 (升小)', type: 'important' },
  
  // 七月及八月
  { date: '2026-07-01', title: '香港特別行政區成立紀念日', type: 'holiday' },
  { date: '2026-07-03', title: 'P6 畢業禮 (一至五年級不用上課)', type: 'event' },
  { date: '2026-07-06', title: '升中派位公佈', type: 'important' },
  { date: '2026-07-07', title: '結業禮', type: 'event' },
  { range: ['2026-07-08', '2026-07-09'], title: '全方位學習日', type: 'learning' },
  { date: '2026-07-13', title: 'P6 參與 Pre-S1 試', type: 'important' },
  { range: ['2026-07-12', '2026-08-31'], title: '學生暑假', type: 'holiday' },
];

let favorites = loadFavorites();

function loadFavorites() {
  try {
    return JSON.parse(localStorage.getItem(FAV_KEY)) || [];
  } catch {
    return [];
  }
}

function saveFavorites() {
  localStorage.setItem(FAV_KEY, JSON.stringify(favorites));
}

function favKey(route, bound, stop, company) {
  return `${company || 'kmb'}|${route}|${bound}|${stop}`;
}

function isFav(item) {
  const key = favKey(currentRoute, currentBound, item.stop, currentCompany);
  return favorites.some((f) => f.key === key);
}

let currentCompany = 'kmb';
let currentBound = 'outbound';
let currentRoute = '';
let stops = [];
let searchToken = 0;
let etaToken = 0;

/* 遷移舊收藏（無 company 欄位） */
favorites.forEach((f) => { if (!f.company) f.company = 'kmb'; });
saveFavorites();

async function fetchJson(url, attempts = 3) {
  for (let i = 0; i < attempts; i++) {
    const res = await fetch(url);
    if (res.status === 429) {
      await new Promise((r) => setTimeout(r, 1200 * (i + 1)));
      continue;
    }
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return res.json();
  }
  throw new Error('HTTP 429');
}

async function mapPool(items, limit, fn) {
  const results = new Array(items.length);
  let cursor = 0;
  const workers = Array.from(
    { length: Math.min(limit, items.length) },
    async () => {
      while (cursor < items.length) {
        const i = cursor++;
        results[i] = await fn(items[i], i);
      }
    }
  );
  await Promise.all(workers);
  return results;
}

function boundLabel() {
  return currentBound === 'outbound' ? '出站' : '進站';
}

function setBound(bound) {
  currentBound = bound;
  segButtons.forEach((b) =>
    b.classList.toggle('seg--active', b.dataset.bound === bound)
  );
}

function setCompany(company) {
  currentCompany = company;
  companyButtons.forEach((b) =>
    b.classList.toggle('seg--active', b.dataset.company === company)
  );
}

segButtons.forEach((btn) => {
  btn.addEventListener('click', () => setBound(btn.dataset.bound));
});

companyButtons.forEach((btn) => {
  btn.addEventListener('click', () => setCompany(btn.dataset.company));
});

tileBus.addEventListener('click', () => showScreen(busScreen, welcomeScreen));
tileFav.addEventListener('click', () => {
  renderFavorites();
  showScreen(favScreen, welcomeScreen);
});
busBack.addEventListener('click', () => showScreen(welcomeScreen, busScreen));
favBack.addEventListener('click', () => showScreen(welcomeScreen, favScreen));
busRoute.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') runSearch();
});
busSearch.addEventListener('click', runSearch);

function setStatus(msg) {
  busStatus.textContent = msg;
  busStatus.hidden = !msg;
}

function renderStops() {
  stopList.innerHTML = '';
  stops.forEach((item) => {
    const li = document.createElement('li');
    li.className = 'stop-row';

    const line = document.createElement('div');
    line.className = 'stop-line';

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'stop-item';

    const seq = document.createElement('span');
    seq.className = 'stop-seq';
    seq.textContent = item.seq;

    const name = document.createElement('span');
    name.className = 'stop-name stop-name--loading';
    name.dataset.nameFor = item.stop;
    name.textContent = '載入站名中…';

    btn.append(seq, name);
    btn.addEventListener('click', () => selectStop(item, btn));

    const star = document.createElement('button');
    star.type = 'button';
    star.className = 'stop-fav';
    star.innerHTML = STAR_SVG;
    star.setAttribute('aria-label', '標記為常用站點');
    star.setAttribute('aria-pressed', String(isFav(item)));
    star.classList.toggle('stop-fav--active', isFav(item));
    star.addEventListener('click', () => toggleFav(item, star));

    line.append(btn, star);
    li.appendChild(line);
    stopList.appendChild(li);
  });
}

function toggleFav(item, star) {
  const key = favKey(currentRoute, currentBound, item.stop, currentCompany);
  const idx = favorites.findIndex((f) => f.key === key);
  if (idx >= 0) {
    favorites.splice(idx, 1);
  } else {
    favorites.push({
      key,
      company: currentCompany,
      route: currentRoute,
      bound: currentBound,
      seq: item.seq,
      stop: item.stop,
      name: item.name,
    });
  }
  saveFavorites();
  const active = idx < 0;
  star.classList.toggle('stop-fav--active', active);
  star.setAttribute('aria-pressed', String(active));
}

function updateStopName(item) {
  const el = stopList.querySelector(`[data-name-for="${item.stop}"]`);
  if (!el) return;
  el.textContent = item.name || '（無站名）';
  el.classList.remove('stop-name--loading');
}

function buildEtaPanel(item) {
  const panel = document.createElement('div');
  panel.className = 'eta-card';

  const head = document.createElement('div');
  head.className = 'eta-head';

  const dest = document.createElement('p');
  dest.className = 'eta-dest';
  dest.textContent = '查詢到站時間中…';

  const refresh = document.createElement('button');
  refresh.type = 'button';
  refresh.className = 'icon-btn';
  refresh.setAttribute('aria-label', '重新整理');
  refresh.innerHTML = REFRESH_SVG;
  refresh.addEventListener('click', () => loadEta(item, panel));

  head.append(dest, refresh);

  const list = document.createElement('ul');
  list.className = 'eta-list';

  panel.append(head, list);
  return panel;
}

function selectStop(item, btn) {
  stopList.querySelectorAll('.stop-item').forEach((b) => {
    const nameEl = b.querySelector('.stop-name');
    b.classList.toggle('stop-item--selected', nameEl.dataset.nameFor === item.stop);
  });
  stopList.querySelectorAll('.eta-card').forEach((el) => el.remove());
  const panel = buildEtaPanel(item);
  btn.closest('li').appendChild(panel);
  loadEta(item, panel);
}

async function runSearch() {
  const route = busRoute.value.trim().toUpperCase();
  if (!route) {
    busRoute.focus();
    return;
  }
  currentRoute = route;
  stops = [];
  stopList.innerHTML = '';
  busSearch.disabled = true;

  const token = ++searchToken;
  setStatus('查詢中…');

  const prov = PROVIDERS[currentCompany];

  try {
    const routeStop = await fetchJson(prov.routeStop(route, currentBound));
    if (token !== searchToken) return;

    const ordered = (routeStop.data || []).slice().sort((a, b) => Number(a.seq) - Number(b.seq));
    if (!ordered.length) {
      setStatus('查無此路線或方向，請確認路線編號與方向。');
      return;
    }

    stops = ordered.map((s) => ({ seq: s.seq, stop: s.stop, name: null }));
    renderStops();
    setStatus(`共 ${stops.length} 站，載入站名中…`);

    await mapPool(stops, 6, async (item) => {
      const detail = await fetchJson(prov.stop(item.stop));
      if (token !== searchToken) return;
      item.name = prov.stopName(detail.data);
      updateStopName(item);
    });

    if (token !== searchToken) return;
    setStatus(`${prov.name} ${route}・${boundLabel()}・共 ${stops.length} 站，點選站點查看到站時間`);
  } catch (err) {
    if (token !== searchToken) return;
    setStatus('查詢失敗：' + err.message);
  } finally {
    if (token === searchToken) busSearch.disabled = false;
  }
}

async function loadEta(item, panel) {
  const dest = panel.querySelector('.eta-dest');
  const list = panel.querySelector('.eta-list');
  dest.textContent = '查詢到站時間中…';
  list.innerHTML = '';

  const prov = PROVIDERS[currentCompany];
  const token = ++etaToken;
  try {
    const eta = await fetchJson(prov.eta(item.stop, currentRoute));
    if (token !== etaToken) return;

    let rows = (eta.data || []).slice();
    /* 城巴 ETA 回傳雙向，需按 dir 過濾 */
    if (prov.dirFilter) {
      const dirChar = currentBound === 'outbound' ? 'O' : 'I';
      rows = rows.filter((r) => r.dir === dirChar);
    }
    /* 過濾掉已過期超過 1 分鐘的班次，以及超過 3 小時後的排程（通常是隔天班次） */
    const now = Date.now();
    const THREE_HOURS = 3 * 60 * 60 * 1000;
    rows = rows.filter((r) => {
      const t = new Date(r.eta).getTime();
      return t > now - 60000 && t < now + THREE_HOURS;
    });
    rows.sort((a, b) => new Date(a.eta) - new Date(b.eta));
    if (!rows.length) {
      dest.textContent = '';
      const li = document.createElement('li');
      li.className = 'eta-empty';
      li.textContent = '目前無到站預報';
      list.appendChild(li);
      return;
    }

    dest.textContent = '往 ' + rows[0].dest_tc;
    rows.forEach((row) => {
      const time = new Date(row.eta);
      const hh = String(time.getHours()).padStart(2, '0');
      const mm = String(time.getMinutes()).padStart(2, '0');
      const mins = Math.round((time - Date.now()) / 60000);
      const minLabel = mins <= 0 ? '即將到站' : mins + ' 分鐘後';

      const li = document.createElement('li');
      li.className = 'eta-item';

      const left = document.createElement('span');
      const t = document.createElement('span');
      t.className = 'eta-time';
      t.textContent = `${hh}:${mm}`;
      const m = document.createElement('span');
      m.className = 'eta-min';
      m.textContent = minLabel;
      left.append(t, m);

      const rmk = document.createElement('span');
      rmk.className = 'eta-rmk';
      rmk.textContent = row.rmk_tc || '';

      li.append(left, rmk);
      list.appendChild(li);
    });
  } catch (err) {
    if (token !== etaToken) return;
    dest.textContent = '到站時間查詢失敗：' + err.message;
  }
}

/* ===== 常用站點 ===== */

async function loadFavEta(fav, el) {
  const prov = PROVIDERS[fav.company] || PROVIDERS.kmb;
  try {
    const eta = await fetchJson(prov.eta(fav.stop, fav.route));
    let rows = (eta.data || []).slice();
    if (prov.dirFilter) {
      const dirChar = fav.bound === 'outbound' ? 'O' : 'I';
      rows = rows.filter((r) => r.dir === dirChar);
    }
    const nowFav = Date.now();
    const THREE_H = 3 * 60 * 60 * 1000;
    const upcoming = rows
      .map((row) => new Date(row.eta))
      .filter((t) => {
        const ms = t.getTime();
        return ms > nowFav - 60000 && ms < nowFav + THREE_H;
      })
      .sort((a, b) => a - b);
    if (!upcoming.length) {
      el.textContent = '目前無到站預報';
      el.classList.add('fav-eta--empty');
      return;
    }
    const next = upcoming[0];
    const mins = Math.round((next - Date.now()) / 60000);
    const hh = String(next.getHours()).padStart(2, '0');
    const mm = String(next.getMinutes()).padStart(2, '0');
    el.textContent = `${hh}:${mm}・${mins <= 0 ? '即將到站' : mins + ' 分鐘後'}`;
  } catch {
    el.textContent = '—';
    el.classList.add('fav-eta--empty');
  }
}

function renderFavorites() {
  favList.innerHTML = '';
  favEmpty.hidden = favorites.length > 0;
  const etaTargets = [];
  favorites.forEach((fav) => {
    const li = document.createElement('li');
    li.className = 'stop-row';

    const line = document.createElement('div');
    line.className = 'stop-line';

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'stop-item';

    const company = document.createElement('span');
    company.className = `fav-company fav-company--${fav.company || 'kmb'}`;
    company.textContent = PROVIDERS[fav.company]?.char || '九';

    const route = document.createElement('span');
    route.className = 'fav-route';
    route.textContent = fav.route;

    const name = document.createElement('span');
    name.className = 'stop-name';
    name.textContent = `${fav.name || '（無站名）'}・${fav.bound === 'outbound' ? '出站' : '進站'}`;

    const eta = document.createElement('span');
    eta.className = 'fav-eta';
    eta.textContent = '更新中…';

    btn.append(company, route, name, eta);
    btn.addEventListener('click', () => openFavorite(fav));

    const star = document.createElement('button');
    star.type = 'button';
    star.className = 'stop-fav stop-fav--active';
    star.innerHTML = STAR_SVG;
    star.setAttribute('aria-label', '移除常用站點');
    star.setAttribute('aria-pressed', 'true');
    star.addEventListener('click', () => {
      favorites = favorites.filter((f) => f.key !== fav.key);
      saveFavorites();
      renderFavorites();
    });

    line.append(btn, star);
    li.appendChild(line);
    favList.appendChild(li);
    etaTargets.push({ fav, eta });
  });
  mapPool(etaTargets, 4, (target) => loadFavEta(target.fav, target.eta));
}

async function openFavorite(fav) {
  showScreen(busScreen, favScreen);
  setCompany(fav.company || 'kmb');
  busRoute.value = fav.route;
  setBound(fav.bound);
  await runSearch();
  const nameEl = stopList.querySelector(`.stop-name[data-name-for="${fav.stop}"]`);
  if (!nameEl) return;
  const item = stops.find((s) => s.stop === fav.stop);
  const btn = nameEl.closest('.stop-item');
  if (item && btn) selectStop(item, btn);
}

/* ===== 日期時間 ===== */
function updateDateTime() {
  const now = new Date();
  
  // 更新日期
  const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
  const dateStr = now.toLocaleDateString('zh-HK', options);
  if (datetimeDate) {
    datetimeDate.textContent = dateStr;
  }
  
  // 更新時間
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const timeStr = `${hours}:${minutes}`;
  if (datetimeTime) {
    datetimeTime.textContent = timeStr;
  }
}

setInterval(updateDateTime, 1000); // 每秒更新
updateDateTime(); // 立即執行一次

/* ===== 月曆 ===== */
let currentMonth = new Date();
let selectedDate = null;

function renderCalendar() {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  
  // 更新月份標題
  const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];
  document.getElementById('calendar-current-month').textContent = `${year}年 ${monthNames[month]}`;
  
  // 計算月份的第一天和總天數
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const totalDays = lastDay.getDate();
  const startDayOfWeek = firstDay.getDay(); // 0 = Sunday, 1 = Monday, etc.
  
  // 清除現有網格
  const grid = document.getElementById('calendar-grid');
  grid.innerHTML = '';
  
  // 獲取當月的所有事件
  const monthEvents = getEventsForMonth(year, month);
  
  // 填充空白格子（上個月）
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const dayCell = createDayCell(null, true);
    grid.appendChild(dayCell);
  }
  
  // 填充當前月的日期
  const now = new Date();
  const isCurrentMonth = now.getMonth() === month && now.getFullYear() === year;
  
  for (let day = 1; day <= totalDays; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const cellDate = new Date(year, month, day);
    const isToday = isCurrentMonth && day === now.getDate();
    
    const events = monthEvents.filter(e => {
      if (e.range) {
        const [start, end] = e.range;
        return dateStr >= start && dateStr <= end;
      }
      return e.date === dateStr;
    });
    
    const cell = createDayCell(day, false, events, isToday);
    grid.appendChild(cell);
  }
  
  // 填充下一格的空白
  const remainingCells = 42 - (startDayOfWeek + totalDays); // 6 rows * 7 days = 42
  for (let i = 0; i < remainingCells; i++) {
    const dayCell = createDayCell(null, true);
    grid.appendChild(dayCell);
  }
}

function createDayCell(day, isEmpty, events = [], isToday = false) {
  const cell = document.createElement('div');
  cell.className = 'calendar-day';
  
  if (isEmpty) {
    cell.classList.add('empty');
    return cell;
  }
  
  if (isToday) {
    cell.classList.add('today');
  }
  
  // 數字
  const dayNum = document.createElement('span');
  dayNum.className = 'day-number';
  dayNum.textContent = day;
  if (isToday) {
    dayNum.style.fontWeight = 'bold';
  }
  cell.appendChild(dayNum);
  
  // 事件標記
  if (events.length > 0) {
    const icons = [];
    events.forEach(event => {
      icons.push(getEventIcon(event.type));
    });
    
    const eventContainer = document.createElement('div');
    eventContainer.className = 'day-events';
    eventContainer.title = events.map(e => e.title).join('; ');
    
    icons.slice(0, 5).forEach(icon => { // 最多顯示 5 個圖示
      const iconSpan = document.createElement('span');
      iconSpan.textContent = icon;
      iconSpan.className = 'event-chip';
      eventContainer.appendChild(iconSpan);
    });
    
    if (events.length > 5) {
      const more = document.createElement('span');
      more.textContent = '+' + (events.length - 5);
      more.className = 'event-chip event-chip-more';
      eventContainer.appendChild(more);
    }
    
    cell.appendChild(eventContainer);
  }
  
  // 點擊事件
  cell.addEventListener('click', () => selectDate(day));
  
  return cell;
}

function getEventsForMonth(year, month) {
  return CALENDAR_EVENTS.filter(event => {
    if (event.range) {
      const startDate = new Date(event.range[0]);
      const endDate = new Date(event.range[1]);
      return (startDate.getFullYear() === year && startDate.getMonth() === month) ||
             (endDate.getFullYear() === year && endDate.getMonth() === month) ||
             (startDate < currentMonth && endDate > currentMonth);
    } else {
      const eventDate = new Date(event.date);
      return eventDate.getFullYear() === year && eventDate.getMonth() === month;
    }
  });
}

function selectDate(day) {
  selectedDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
  updateSelectedDateDetails();
}

function updateSelectedDateDetails() {
  if (!selectedDate) return;
  
  const title = document.getElementById('selected-date-title');
  const eventsList = document.getElementById('selected-events');
  
  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth() + 1;
  const day = selectedDate.getDate();
  title.textContent = `${year}年${month}月${day}日`; 
  
  const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  
  const allEvents = CALENDAR_EVENTS.filter(event => {
    if (event.range) {
      return dateStr >= event.range[0] && dateStr <= event.range[1];
    }
    return event.date === dateStr;
  });
  
  if (allEvents.length === 0) {
    eventsList.innerHTML = '<p class="no-today-events">今天沒有安排任何活動。</p>';
    return;
  }
  
  let html = '';
  allEvents.forEach(event => {
    const typeColor = getEventColor(event.type);
    const icon = getEventIcon(event.type);
    
    html += `
      <div class="event-item" style="border-left: 3px solid ${typeColor};">
        <div class="event-header">
          <span class="event-icon">${icon}</span>
          <h4 class="event-name" style="color: ${typeColor};">${event.title}</h4>
        </div>
        ${event.subtitle ? `<p class="event-subtitle">${event.subtitle}</p>` : ''}
        ${event.note ? `<p class="event-note">⚠️ ${event.note}</p>` : ''}
      </div>
    `;
  });
  
  eventsList.innerHTML = html;
}

function getEventColor(type) {
  const colors = {
    important: '#ef4444',
    exam: '#f97316',
    holiday: '#22c55e',
    event: '#a855f7',
    sport: '#06b6d4',
    medical: '#ec4899',
    meeting: '#8b5cf6',
    learning: '#14b8a6',
    notice: '#f59e0b',
    period: '#6366f1'
  };
  return colors[type] || '#6b7280';
}

// 導航按鈕
const prevMonthBtn = document.getElementById('prev-month');
const nextMonthBtn = document.getElementById('next-month');
const goTodayBtn = document.getElementById('go-today');
const showCalendarBtn = document.getElementById('show-calendar');
const calendarScreen = document.getElementById('screen-calendar');
const calendarBack = document.getElementById('calendar-back');

prevMonthBtn.addEventListener('click', () => {
  currentMonth.setMonth(currentMonth.getMonth() - 1);
  renderCalendar();
});

nextMonthBtn.addEventListener('click', () => {
  currentMonth.setMonth(currentMonth.getMonth() + 1);
  renderCalendar();
});

goTodayBtn.addEventListener('click', () => {
  currentMonth = new Date();
  selectedDate = new Date();
  renderCalendar();
  updateSelectedDateDetails();
});

showCalendarBtn.addEventListener('click', () => {
  currentMonth = new Date();
  selectedDate = new Date();
  renderCalendar();
  updateSelectedDateDetails();
  showScreen(calendarScreen, welcomeScreen);
});

calendarBack.addEventListener('click', () => {
  showScreen(welcomeScreen, calendarScreen);
});

// 初始化
renderCalendar();
