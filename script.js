// ---------- Тост ----------
const toastEl = document.getElementById('toast');
let toastTimer;
function toast(text) {
  toastEl.textContent = text;
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2200);
}

// ---------- Статус по московскому времени ----------
function updateStatus() {
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Moscow' }));
  const h = now.getHours();
  const weekend = now.getDay() === 0 || now.getDay() === 6;
  let text, state = '';

  if (h < 6) { text = 'Ночь. Вайбкодит. Ответит быстро'; }
  else if (h < 8) { text = 'Утро. Пытается проснуться'; state = 'off'; }
  else if (h < 12 && weekend) { text = 'Выходной. Спит до обеда, не будите'; state = 'off'; }
  else if (h < 15 && !weekend) { text = 'На уроках. Ответит на перемене (может быть)'; state = 'busy'; }
  else if (h < 19) { text = 'После уроков. Готов обсудить сайт'; }
  else { text = 'Вечер. Катка или код — 50 на 50'; state = 'busy'; }

  const mm = String(now.getMinutes()).padStart(2, '0');
  document.getElementById('status-text').textContent = `${h}:${mm} по Москве · ${text}`;
  document.getElementById('status-dot').className = 'status-dot ' + state;
}
updateStatus();
setInterval(updateStatus, 30000);

// ---------- Копирование тега ----------
document.querySelectorAll('.copy-tag').forEach(btn => {
  btn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText('@ntechno_a');
      btn.textContent = 'Скопировано';
      toast('@ntechno_a в буфере. Жду сообщение');
    } catch {
      toast('Не вышло скопировать. Тег: @ntechno_a');
    }
    setTimeout(() => { btn.textContent = btn.dataset.label; }, 2000);
  });
});

// ---------- Плеер ----------
const audio = document.getElementById('bg-audio');
const player = document.getElementById('player');
const playBtn = document.getElementById('play-btn');
const statusEl = document.getElementById('track-status');
const vCanvas = document.getElementById('visualizer');
const vCtx = vCanvas.getContext('2d');

let audioCtx = null, analyser = null, freq = null;
let isPlaying = false, fallbackTimer = null, usingFallback = false;

function ensureCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    // Анализатор только для запасного бита: mp3 через граф при открытии с file:// может заглушиться
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 64;
    freq = new Uint8Array(analyser.frequencyBinCount);
    analyser.connect(audioCtx.destination);
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
}

function fallbackBeat() {
  const t = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(110, t);
  osc.frequency.exponentialRampToValueAtTime(42, t + 0.25);
  gain.gain.setValueAtTime(0.3, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
  osc.connect(gain);
  gain.connect(analyser || audioCtx.destination);
  osc.start(t);
  osc.stop(t + 0.3);
}

function setPlaying(on) {
  isPlaying = on;
  player.classList.toggle('playing', on);
  playBtn.setAttribute('aria-label', on ? 'Пауза' : 'Включить трек');
}

playBtn.addEventListener('click', () => {
  ensureCtx();
  if (!isPlaying) {
    audio.play().then(() => {
      usingFallback = false;
      setPlaying(true);
      statusEl.textContent = 'Играет. Соседи уже в курсе';
    }).catch(() => {
      usingFallback = true;
      setPlaying(true);
      statusEl.textContent = 'track.mp3 не нашёлся, играет запасной бас';
      fallbackBeat();
      fallbackTimer = setInterval(fallbackBeat, 460);
    });
  } else {
    audio.pause();
    clearInterval(fallbackTimer);
    setPlaying(false);
    statusEl.textContent = 'На паузе. Тишина тоже жанр';
  }
});

let phase = 0;
function drawVisualizer() {
  const w = vCanvas.width, h = vCanvas.height, bars = 24, bw = w / bars;
  vCtx.clearRect(0, 0, w, h);
  let real = false;
  if (analyser && isPlaying) {
    analyser.getByteFrequencyData(freq);
    real = freq.some(v => v > 0);
  }
  phase += 0.08;
  const color = getComputedStyle(document.body).getPropertyValue('--accent').trim() || '#ff5b36';
  for (let i = 0; i < bars; i++) {
    let v;
    if (!isPlaying) v = 0.06;
    else if (real) v = freq[Math.min(freq.length - 1, i + 1)] / 255;
    else v = 0.25 + 0.6 * Math.abs(Math.sin(phase + i * 0.45)) * (0.6 + 0.4 * Math.sin(phase * 0.7 + i));
    const bh = Math.max(3, v * h);
    vCtx.fillStyle = i % 3 === 0 ? color : 'rgba(236,235,232,0.55)';
    vCtx.fillRect(i * bw + 1, h - bh, bw - 3, bh);
  }
  requestAnimationFrame(drawVisualizer);
}
drawVisualizer();

// ---------- Сутки ----------
const dayData = {
  real: [
    ['Школа', 6, '#ff5b36'],
    ['Сон', 5, '#8b8984'],
    ['Код', 6, '#ecebe8'],
    ['Катки с друзьями', 3, '#e6b84f'],
    ['ЕГЭ', 2, '#7bd88f'],
    ['Еда и дорога', 2, '#5f7fd1']
  ],
  parents: [
    ['Школа', 6, '#ff5b36'],
    ['Сон', 9, '#8b8984'],
    ['Код', 1, '#ecebe8'],
    ['Катки с друзьями', 0, '#e6b84f'],
    ['ЕГЭ', 6, '#7bd88f'],
    ['Еда и дорога', 2, '#5f7fd1']
  ]
};
const notes = {
  real: 'По данным самонаблюдения. Погрешность — плюс-минус ЕГЭ.',
  parents: 'Официальная версия. Согласовано, подписано, верить обязательно.'
};
const bar = document.getElementById('day-bar');
const legend = document.getElementById('day-legend');
dayData.real.forEach(([name, , color]) => {
  const s = document.createElement('span');
  s.style.background = color;
  s.title = name;
  bar.appendChild(s);
  const li = document.createElement('li');
  li.innerHTML = `<i style="background:${color}"></i>${name}<b></b>`;
  legend.appendChild(li);
});
function renderDay(mode) {
  dayData[mode].forEach(([, hours], i) => {
    const s = bar.children[i];
    s.style.flexGrow = hours;
    s.style.flexBasis = '0';
    s.textContent = hours >= 2 ? hours + 'ч' : '';
    legend.children[i].querySelector('b').textContent = hours + ' ч';
  });
  document.getElementById('day-note').textContent = notes[mode];
}
renderDay('real');
const parentsBtn = document.getElementById('parents-btn');
parentsBtn.addEventListener('click', () => {
  const on = parentsBtn.getAttribute('aria-pressed') !== 'true';
  parentsBtn.setAttribute('aria-pressed', on);
  parentsBtn.textContent = on ? 'Честная версия' : 'Версия для родителей';
  renderDay(on ? 'parents' : 'real');
});

// ---------- До ЕГЭ ----------
(function () {
  const target = new Date('2027-06-01T10:00:00+03:00');
  const days = Math.max(0, Math.ceil((target - Date.now()) / 86400000));
  document.getElementById('ege-days').textContent = days;
})();

// ---------- Генератор отмазок ----------
const excuses = [
  'Домашку съел кот. Кота у меня нет, поэтому это особенно странно.',
  'Я сделал, но нейросеть сказала, что это конфиденциально.',
  'Тетрадь осталась в облаке, а облако — в другом часовом поясе.',
  'Я решил её в уме. Ум, к сожалению, не сохраняет.',
  'Писал до трёх ночи, но в фонке не было паузы, чтобы остановиться.',
  'Задание было с ошибкой, и я ждал, пока её исправят. Ждал до сих пор.',
  'Сделал сайт с ответами, но он ещё деплоится.',
  'Ноутбук обновлялся. Сорок процентов. Уже третий день.',
  'Это не домашка не сделана, это я протестировал вашу реакцию.',
  'Я всё сделал, но троллфейс закрыл мне тетрадь.',
  'Сделал на листочке, а листочек ушёл на фото для портфолио.',
  'Меня позвали в катку, а друзей бросать нельзя — это тоже воспитание.'
];
let lastExcuse = -1;
const excuseEl = document.getElementById('excuse');
document.getElementById('excuse-btn').addEventListener('click', () => {
  let i;
  do { i = Math.floor(Math.random() * excuses.length); } while (i === lastExcuse);
  lastExcuse = i;
  excuseEl.textContent = excuses[i];
  excuseEl.classList.remove('pop');
  void excuseEl.offsetWidth;
  excuseEl.classList.add('pop');
});

// ---------- Не нажимать ----------
const dangerMsgs = [
  [1, 'Ну вот. Нажал.'],
  [2, 'Это было предупреждение, а не приглашение.'],
  [3, 'Ладно, ты упорный. Это хорошее качество для заказчика.'],
  [5, 'Пять раз. Мама бы уже позвала ужинать.'],
  [8, 'Кнопка устала. Дай ей отдохнуть.'],
  [12, 'Окей, ты победил. Секрет: напиши мне в Telegram, и я сделаю тебе такую же.'],
  [20, 'Двадцать. Это уже не любопытство, это хобби.'],
  [50, 'Пятьдесят нажатий. Ты официально самый упорный посетитель сайта.']
];
let presses = 0;
const dangerBtn = document.getElementById('danger-btn');
const dangerMsg = document.getElementById('danger-msg');
dangerBtn.addEventListener('click', () => {
  presses++;
  let msg = '';
  dangerMsgs.forEach(([n, m]) => { if (presses >= n) msg = m; });
  dangerMsg.textContent = `Нажатий: ${presses}. ${msg}`;
  const card = dangerBtn.closest('.toy');
  card.classList.remove('shake');
  void card.offsetWidth;
  card.classList.add('shake');
  if (presses === 12) trollRain(8);
});

// ---------- Корпоративный режим ----------
const corpBanner = document.getElementById('corp-banner');
const corpEls = document.querySelectorAll('[data-corp]');
corpEls.forEach(el => { el.dataset.orig = el.innerHTML; });
function setCorp(on) {
  document.body.classList.toggle('corp', on);
  corpBanner.hidden = !on;
  corpEls.forEach(el => { el.innerHTML = on ? el.dataset.corp : el.dataset.orig; });
  if (on) window.scrollTo({ top: 0, behavior: 'smooth' });
}
document.getElementById('corp-on').addEventListener('click', () => setCorp(true));
document.getElementById('corp-off').addEventListener('click', () => {
  setCorp(false);
  toast('Фух. Так-то лучше');
});

// ---------- Пасхалка: Konami code ----------
function trollRain(n = 18) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) { toast('Троллфейс одобряет'); return; }
  for (let i = 0; i < n; i++) {
    const img = document.createElement('img');
    img.src = 'me.png';
    img.alt = '';
    img.className = 'troll-drop';
    img.style.left = Math.random() * 95 + 'vw';
    img.style.width = 50 + Math.random() * 70 + 'px';
    img.style.setProperty('--rot', (Math.random() * 720 - 360) + 'deg');
    img.style.animationDuration = 2 + Math.random() * 2.5 + 's';
    img.style.animationDelay = Math.random() * 1.2 + 's';
    document.body.appendChild(img);
    img.addEventListener('animationend', () => img.remove());
  }
}
const konami = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
let kPos = 0;
window.addEventListener('keydown', e => {
  const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  const alt = { 'и': 'b', 'ф': 'a' }[key] || key;
  kPos = alt === konami[kPos] ? kPos + 1 : (alt === konami[0] ? 1 : 0);
  if (kPos === konami.length) {
    kPos = 0;
    trollRain();
    toast('Пасхалка найдена. Ты свой человек');
  }
});
document.querySelector('.konami-hint').addEventListener('click', () => trollRain());
