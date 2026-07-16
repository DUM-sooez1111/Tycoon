const places = [...document.querySelectorAll('.place, .fountain')];
const selectedName = document.querySelector('#selected-name');
const selectedStars = document.querySelector('#selected-stars');
const selectedIncome = document.querySelector('#selected-income');
const selectedLevel = document.querySelector('#selected-level');
const selectedDescription = document.querySelector('#selected-description');
const upgradeButton = document.querySelector('#upgrade-button');
const gold = document.querySelector('#gold');
let selected = document.querySelector('.cafe');
let goldValue = 12345678;

function showPlace(place) {
  selected = place;
  const level = Number(place.dataset.level);
  selectedName.textContent = place.dataset.name;
  selectedLevel.textContent = `Lv.${level}`;
  selectedIncome.textContent = Number(place.dataset.income) ? `+${place.dataset.income}/분` : '만족도 +5%';
  selectedStars.textContent = '★'.repeat(Math.min(level, 5)) + '☆'.repeat(5 - Math.min(level, 5));
  selectedDescription.textContent = place.dataset.description;
  upgradeButton.disabled = place.classList.contains('fountain');
  upgradeButton.innerHTML = place.classList.contains('fountain') ? '중앙 장식 <small>업그레이드 불가</small>' : '↑ 업그레이드 <small>₩ 2,500</small>';
}

places.forEach(place => place.addEventListener('click', () => showPlace(place)));
upgradeButton.addEventListener('click', () => {
  if (!selected || selected.classList.contains('fountain') || goldValue < 2500) return;
  goldValue -= 2500;
  selected.dataset.level = String(Number(selected.dataset.level) + 1);
  selected.dataset.income = String(Math.round(Number(selected.dataset.income) * 1.25));
  gold.textContent = goldValue.toLocaleString('ko-KR');
  showPlace(selected);
});

document.querySelectorAll('.build-button, .side-button').forEach(button => button.addEventListener('click', () => {
  const group = button.parentElement;
  group.querySelector('.active')?.classList.remove('active');
  button.classList.add('active');
}));

showPlace(selected);
