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
let toastTimer;

function updateStats() {
  gold.textContent = goldValue.toLocaleString('ko-KR');
  population.textContent = visitors.toLocaleString('ko-KR');
  happiness.textContent = `${Math.min(50 + Math.floor(visitors / 8), 99)}%`;
  goalCount.textContent = `${visitors} / 1000`;
  unlockedCount.textContent = unlockedLots;
  document.querySelector('.goal i').style.width = `${Math.min(visitors / 10, 100)}%`;
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
  selectedIncome.textContent = Number(place.dataset.income) ? `+${Number(place.dataset.income).toLocaleString('ko-KR')}/분` : '만족도 +5%';
  selectedStars.textContent = '★'.repeat(Math.min(level, 5)) + '☆'.repeat(5 - Math.min(level, 5));
  selectedDescription.textContent = place.dataset.description;
  upgradeButton.disabled = false;
  upgradeButton.innerHTML = '↑ 업그레이드 <small>₩ 2,500</small>';
}

function showToast(message) {
  constructionToast.textContent = message;
  constructionToast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => constructionToast.classList.remove('show'), 1700);
}

function updateLotPreviews() {
  const data = buildingData[selectedKind];
  document.querySelectorAll('.empty-lot').forEach(lot => {
    lot.classList.add('ready-to-build');
    lot.setAttribute('aria-label', `${data.name} 건설 · ${data.cost.toLocaleString('ko-KR')}원`);
    lot.innerHTML = `<span class="lot-icon">${data.icon}</span><span class="lot-name">${data.name}</span><small>₩ ${data.cost.toLocaleString('ko-KR')}</small>`;
  });
}

function bindEmptyLot(lot) { lot.addEventListener('click', () => createBuilding(lot)); }

function unlockLot(lot) {
  const cost = Number(lot.dataset.cost);
  if (goldValue < cost) { selectedDescription.textContent = `자금이 부족합니다. 이 구역 해금에는 ₩${cost.toLocaleString('ko-KR')}이 필요합니다.`; return; }
  goldValue -= cost;
  unlockedLots += 1;
  const emptyLot = document.createElement('button');
  emptyLot.type = 'button';
  emptyLot.className = `empty-lot ${[...lot.classList].filter(name => name !== 'locked-lot').join(' ')}`;
  emptyLot.dataset.lot = lot.dataset.lot;
  emptyLot.innerHTML = '＋<span>건설 부지</span>';
  bindEmptyLot(emptyLot);
  lot.replaceWith(emptyLot);
  updateStats();
  updateLotPreviews();
  showToast('새 개발 구역을 해금했습니다!');
  selectedDescription.textContent = `새 개발 구역을 해금했습니다. ${buildingData[selectedKind].name}을 지을 수 있습니다.`;
}

function createBuilding(lot) {
  const data = buildingData[selectedKind];
  if (goldValue < data.cost) { selectedDescription.textContent = `자금이 부족합니다. ₩${data.cost.toLocaleString('ko-KR')}이 필요합니다.`; return; }
  goldValue -= data.cost;
  visitors += selectedKind === 'ride' ? 30 : selectedKind === 'decor' || selectedKind === 'road' ? 2 : 12;
  const building = document.createElement('button');
  building.type = 'button';
  building.className = `place plot-${lot.dataset.lot} ${buildingThemes[selectedKind]}`;
  building.dataset.name = data.name;
  building.dataset.level = '1';
  building.dataset.income = String(data.income);
  building.dataset.description = data.description;
  building.innerHTML = `<span class="building roof"></span><span class="building-body">${data.icon}</span><span class="awning"></span><span class="shop-label">${data.name} <b>Lv.1 ★☆☆☆☆</b></span>`;
  building.addEventListener('click', () => showPlace(building));
  building.classList.add('placing');
  park.append(building);
  lot.remove();
  updateStats();
  showPlace(building);
  showToast(`${data.name} 건설 완료!`);
}

document.querySelectorAll('.empty-lot').forEach(bindEmptyLot);
document.querySelectorAll('.locked-lot').forEach(lot => lot.addEventListener('click', () => unlockLot(lot)));
document.querySelectorAll('.build-button').forEach(button => button.addEventListener('click', () => {
  document.querySelector('.build-button.active')?.classList.remove('active');
  button.classList.add('active');
  selectedKind = button.dataset.kind;
  updateLotPreviews();
  selectedDescription.textContent = `${buildingData[selectedKind].name} 선택됨 · 열린 부지를 눌러 ₩${buildingData[selectedKind].cost.toLocaleString('ko-KR')}에 건설하세요.`;
}));
document.querySelectorAll('.side-button').forEach(button => button.addEventListener('click', () => {
  document.querySelector('.side-button.active')?.classList.remove('active');
  button.classList.add('active');
}));
upgradeButton.addEventListener('click', () => {
  if (!selected || goldValue < 2500) return;
  goldValue -= 2500;
  selected.dataset.level = String(Number(selected.dataset.level) + 1);
  selected.dataset.income = String(Math.round(Number(selected.dataset.income) * 1.25));
  visitors += 8;
  updateStats();
  showPlace(selected);
});

updateStats();
showEmptyState();
updateLotPreviews();
