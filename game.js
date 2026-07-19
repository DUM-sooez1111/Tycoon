const park = document.querySelector('.park');
const selectedName = document.querySelector('#selected-name');
const selectedStars = document.querySelector('#selected-stars');
const selectedIncome = document.querySelector('#selected-income');
const selectedLevel = document.querySelector('#selected-level');
const selectedDescription = document.querySelector('#selected-description');
const upgradeButton = document.querySelector('#upgrade-button');
const gold = document.querySelector('#gold');
const population = document.querySelector('#population');
const happiness = document.querySelector('#happiness');
const goalCount = document.querySelector('#goal-count');
const unlockedCount = document.querySelector('#unlocked-count');
const constructionToast = document.querySelector('#construction-toast');
const walkerLayer = document.querySelector('#walker-layer');
const featurePanel = document.querySelector('#feature-panel');
const featureContent = document.querySelector('#feature-content');
const featureClose = document.querySelector('#feature-close');

const buildingData = {
  road: { name: '산책로', icon: '🧱', income: 0, cost: 400, description: '방문객이 이동하는 길을 넓힙니다.' },
  facility: { name: '휴게 시설', icon: '🪑', income: 300, cost: 900, description: '방문객이 잠시 쉬어갈 수 있는 공간입니다.' },
  shop: { name: '작은 상점', icon: '🎁', income: 600, cost: 1500, description: '첫 수익을 만드는 기념품 상점입니다.' },
  ride: { name: '미니 놀이기구', icon: '🎠', income: 1200, cost: 5000, description: '즐거운 놀이기구가 새로운 손님을 부릅니다.' },
  decor: { name: '작은 분수', icon: '⛲', income: 0, cost: 1200, description: '파크의 만족도를 높이는 장식입니다.' },
  other: { name: '간이 매점', icon: '🥖', income: 450, cost: 1100, description: '간단한 간식을 판매하는 작은 매점입니다.' },
};
const buildingThemes = { road: 'road-building', facility: 'cafe', shop: 'shop', ride: 'ride-building', decor: 'decor-building', other: 'bakery' };
let selected = null;
let selectedKind = 'shop';
let goldValue = 20000;
let visitors = 0;
let unlockedLots = 1;
let employees = 0;
let incomeMultiplier = 1;
let satisfactionBonus = 0;
let currentPanel = null;
let toastTimer;
const completedResearch = new Set();
const walkerIcons = ['🧑', '👩', '👨', '👧', '👨‍🦱', '🧑‍🦰'];

function format(value) { return Math.round(value).toLocaleString('ko-KR'); }
function buildingCount() { return document.querySelectorAll('.place').length; }
function incomePerMinute() {
  const base = [...document.querySelectorAll('.place')].reduce((sum, place) => sum + Number(place.dataset.income || 0), 0);
  return Math.round(base * incomeMultiplier * (1 + employees * 0.05));
}

function updateStats() {
  gold.textContent = format(goldValue);
  population.textContent = format(visitors);
  happiness.textContent = `${Math.min(50 + satisfactionBonus + Math.floor(visitors / 8), 99)}%`;
  goalCount.textContent = `${format(visitors)} / 1000`;
  unlockedCount.textContent = unlockedLots;
  document.querySelector('.goal i').style.width = `${Math.min(visitors / 10, 100)}%`;
  syncWalkers();
  if (currentPanel) renderFeaturePanel(currentPanel);
}

function makeWalker() {
  const walker = document.createElement('span');
  walker.className = 'park-walker';
  walker.textContent = walkerIcons[Math.floor(Math.random() * walkerIcons.length)];
  walker.style.setProperty('--x', `${6 + Math.random() * 82}%`);
  walker.style.setProperty('--y', `${8 + Math.random() * 78}%`);
  walker.style.setProperty('--dx-one', `${Math.round(-32 + Math.random() * 64)}px`);
  walker.style.setProperty('--dy-one', `${Math.round(-24 + Math.random() * 48)}px`);
  walker.style.setProperty('--dx-two', `${Math.round(-32 + Math.random() * 64)}px`);
  walker.style.setProperty('--dy-two', `${Math.round(-24 + Math.random() * 48)}px`);
  walker.style.setProperty('--duration', `${5 + Math.random() * 5}s`);
  walker.style.setProperty('--delay', `${-Math.random() * 6}s`);
  walkerLayer.append(walker);
}

function syncWalkers() {
  const target = Math.min(12, Math.floor(visitors / 10));
  while (walkerLayer.children.length < target) makeWalker();
  while (walkerLayer.children.length > target) walkerLayer.lastElementChild.remove();
}

function showToast(message) {
  constructionToast.textContent = message;
  constructionToast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => constructionToast.classList.remove('show'), 1700);
}

function showEmptyState() {
  selected = null;
  selectedName.textContent = '새 파크';
  selectedStars.textContent = '☆☆☆☆☆';
  selectedIncome.textContent = '+0/분';
  selectedLevel.textContent = 'Lv.1';
  selectedDescription.textContent = '열린 시작 부지에 첫 상점을 짓거나, 잠긴 칸을 해금해 파크를 넓혀보세요.';
  upgradeButton.disabled = true;
  upgradeButton.textContent = '건물을 선택하세요';
}

function showPlace(place) {
  document.querySelectorAll('.place.selected').forEach(item => item.classList.remove('selected'));
  place.classList.add('selected');
  selected = place;
  const level = Number(place.dataset.level);
  selectedName.textContent = place.dataset.name;
  selectedLevel.textContent = `Lv.${level}`;
  selectedIncome.textContent = Number(place.dataset.income) ? `+${format(Number(place.dataset.income) * incomeMultiplier * (1 + employees * .05))}/분` : '만족도 +5%';
  selectedStars.textContent = '★'.repeat(Math.min(level, 5)) + '☆'.repeat(5 - Math.min(level, 5));
  selectedDescription.textContent = place.dataset.description;
  upgradeButton.disabled = false;
  upgradeButton.innerHTML = '↑ 업그레이드 <small>₩ 2,500</small>';
}

function updateLotPreviews() {
  const data = buildingData[selectedKind];
  document.querySelectorAll('.empty-lot').forEach(lot => {
    lot.classList.add('ready-to-build');
    lot.setAttribute('aria-label', `${data.name} 건설 · ${format(data.cost)}원`);
    lot.innerHTML = `<span class="lot-icon">${data.icon}</span><span class="lot-name">${data.name}</span><small>₩ ${format(data.cost)}</small>`;
  });
}

function bindEmptyLot(lot) { lot.addEventListener('click', () => createBuilding(lot)); }

function unlockLot(lot) {
  const cost = Number(lot.dataset.cost);
  if (goldValue < cost) { showToast(`해금 자금이 ₩${format(cost)} 필요합니다.`); return; }
  goldValue -= cost;
  unlockedLots += 1;
  const emptyLot = document.createElement('button');
  emptyLot.type = 'button';
  emptyLot.className = `empty-lot ${[...lot.classList].filter(name => name !== 'locked-lot').join(' ')}`;
  emptyLot.dataset.lot = lot.dataset.lot;
  bindEmptyLot(emptyLot);
  lot.replaceWith(emptyLot);
  updateLotPreviews();
  updateStats();
  showToast('새 개발 구역을 해금했습니다!');
}

function createBuilding(lot) {
  const data = buildingData[selectedKind];
  if (goldValue < data.cost) { showToast(`건설 자금이 ₩${format(data.cost)} 필요합니다.`); return; }
  goldValue -= data.cost;
  visitors += selectedKind === 'ride' ? 30 : selectedKind === 'decor' || selectedKind === 'road' ? 2 : 12;
  const building = document.createElement('button');
  building.type = 'button';
  building.className = `place plot-${lot.dataset.lot} ${buildingThemes[selectedKind]} placing`;
  building.dataset.name = data.name;
  building.dataset.level = '1';
  building.dataset.income = String(data.income);
  building.dataset.description = data.description;
  building.classList.add('compact-building');
  building.innerHTML = `<span class="compact-icon">${data.icon}</span><span class="compact-name">${data.name}</span><small class="compact-level">Lv.1</small>`;
  building.addEventListener('click', () => showPlace(building));
  park.append(building);
  lot.remove();
  updateStats();
  showPlace(building);
  showToast(`${data.name} 건설 완료!`);
}

function chooseBuildKind(kind) {
  selectedKind = kind;
  document.querySelector('.build-button.active')?.classList.remove('active');
  document.querySelector(`.build-button[data-kind="${kind}"]`)?.classList.add('active');
  updateLotPreviews();
  selectedDescription.textContent = `${buildingData[kind].name} 선택됨 · 열린 부지를 눌러 ₩${format(buildingData[kind].cost)}에 건설하세요.`;
}

function actionButton(label, action, disabled = false) {
  return `<button class="feature-action" type="button" data-action="${action}" ${disabled ? 'disabled' : ''}>${label}</button>`;
}

function renderFeaturePanel(panelName) {
  currentPanel = panelName;
  const common = `<p class="feature-subtitle">타이쿤 파크 운영 센터</p>`;
  if (panelName === 'stats') {
    featureContent.innerHTML = `${common}<h2>통계</h2><div class="stat-grid"><div><span>분당 수익</span><b>₩ ${format(incomePerMinute())}</b></div><div><span>운영 건물</span><b>${buildingCount()}개</b></div><div><span>개발 구역</span><b>${unlockedLots} / 25</b></div><div><span>직원 수</span><b>${employees}명</b></div></div><p class="feature-tip">수익은 5초마다 자동으로 정산됩니다.</p>`;
  } else if (panelName === 'research') {
    const efficient = completedResearch.has('efficient');
    const welcome = completedResearch.has('welcome');
    featureContent.innerHTML = `${common}<h2>연구</h2><article class="feature-card"><b>⚙ 효율적 운영</b><p>모든 건물 수익 +20%</p>${actionButton(efficient ? '연구 완료' : '연구하기 · ₩ 3,000', 'research-efficient', efficient)}</article><article class="feature-card"><b>☺ 환영 서비스</b><p>파크 만족도 +8%</p>${actionButton(welcome ? '연구 완료' : '연구하기 · ₩ 2,500', 'research-welcome', welcome)}</article>`;
  } else if (panelName === 'marketing') {
    featureContent.innerHTML = `${common}<h2>마케팅</h2><article class="feature-card"><b>📣 지역 전단지</b><p>방문객 +40명</p>${actionButton('진행하기 · ₩ 1,000', 'marketing-flyer')}</article><article class="feature-card"><b>🎉 주말 축제</b><p>방문객 +120명 · 만족도 +3%</p>${actionButton('진행하기 · ₩ 3,500', 'marketing-festival')}</article>`;
  } else if (panelName === 'staff') {
    featureContent.innerHTML = `${common}<h2>직원</h2><div class="staff-summary">현재 직원 <b>${employees}명</b><span>직원 1명당 수익 +5%</span></div><article class="feature-card"><b>🧑‍💼 운영 직원 채용</b><p>건물 관리와 손님 응대를 담당합니다.</p>${actionButton('채용하기 · ₩ 2,000', 'hire-staff')}</article>`;
  } else if (panelName === 'shop') {
    const choices = ['shop', 'facility', 'ride', 'decor', 'other'];
    featureContent.innerHTML = `${common}<h2>상점</h2><p class="feature-tip">건물을 고르고 열린 부지를 선택하세요.</p><div class="shop-choices">${choices.map(kind => actionButton(`${buildingData[kind].icon} ${buildingData[kind].name}<small>₩ ${format(buildingData[kind].cost)}</small>`, `build-${kind}`)).join('')}</div>`;
  } else {
    const achievements = [
      ['첫 건물', buildingCount() >= 1, '첫 번째 건물 건설'],
      ['개발가', unlockedLots >= 5, '개발 구역 5칸 해금'],
      ['인기 파크', visitors >= 100, '방문객 100명 달성'],
      ['연구 책임자', completedResearch.size >= 2, '연구 2개 완료'],
    ];
    featureContent.innerHTML = `${common}<h2>업적</h2><div class="achievement-list">${achievements.map(([title, done, text]) => `<div class="achievement ${done ? 'done' : ''}"><b>${done ? '★' : '☆'} ${title}</b><span>${text}</span></div>`).join('')}</div>`;
  }
  featurePanel.classList.add('open');
}

function spend(cost) {
  if (goldValue < cost) { showToast(`자금이 ₩${format(cost)} 부족합니다.`); return false; }
  goldValue -= cost;
  return true;
}

function handleFeatureAction(action) {
  if (action === 'research-efficient' && spend(3000)) { completedResearch.add('efficient'); incomeMultiplier += .2; showToast('효율적 운영 연구 완료!'); }
  if (action === 'research-welcome' && spend(2500)) { completedResearch.add('welcome'); satisfactionBonus += 8; showToast('환영 서비스 연구 완료!'); }
  if (action === 'marketing-flyer' && spend(1000)) { visitors += 40; showToast('전단지 마케팅 완료! 방문객 +40'); }
  if (action === 'marketing-festival' && spend(3500)) { visitors += 120; satisfactionBonus += 3; showToast('주말 축제가 성공했습니다!'); }
  if (action === 'hire-staff' && spend(2000)) { employees += 1; showToast('운영 직원을 채용했습니다!'); }
  if (action.startsWith('build-')) { chooseBuildKind(action.replace('build-', '')); featurePanel.classList.remove('open'); currentPanel = null; showToast('건물을 선택했습니다. 열린 부지를 클릭하세요.'); }
  updateStats();
  if (currentPanel) renderFeaturePanel(currentPanel);
}

document.querySelectorAll('.empty-lot').forEach(bindEmptyLot);
document.querySelectorAll('.locked-lot').forEach(lot => lot.addEventListener('click', () => unlockLot(lot)));
document.querySelectorAll('.build-button').forEach(button => button.addEventListener('click', () => chooseBuildKind(button.dataset.kind)));
document.querySelectorAll('.side-button').forEach(button => button.addEventListener('click', () => {
  document.querySelector('.side-button.active')?.classList.remove('active');
  button.classList.add('active');
  renderFeaturePanel(button.dataset.panel);
}));
featureClose.addEventListener('click', () => { featurePanel.classList.remove('open'); currentPanel = null; });
featureContent.addEventListener('click', event => {
  const button = event.target.closest('[data-action]');
  if (button && !button.disabled) handleFeatureAction(button.dataset.action);
});
upgradeButton.addEventListener('click', () => {
  if (!selected || !spend(2500)) return;
  selected.dataset.level = String(Number(selected.dataset.level) + 1);
  selected.dataset.income = String(Math.round(Number(selected.dataset.income) * 1.25));
  visitors += 8;
  updateStats();
  showPlace(selected);
  showToast('건물을 업그레이드했습니다!');
});

setInterval(() => {
  const income = incomePerMinute();
  if (income > 0) { goldValue += income / 12; updateStats(); }
}, 5000);

updateStats();
showEmptyState();
updateLotPreviews();
