/* =========================================================
   啰啰咚 · 数字微体验
   文件：js/app.js
   说明：翻页、音频字幕、方言听译、打卡集章、海报生成
   ========================================================= */

/* ---------- 1. 翻页逻辑 ---------- */
const app = document.getElementById('app');
const pages = [...document.querySelectorAll('.page')];
let current = 0;
let isAnimating = false;
let startY = 0;

// 初始化：把5个页面按顺序上下排好
pages.forEach((page, i) => {
  page.style.transform = `translateY(${i * 100}%)`;
});

function goTo(index) {
  if (index < 0 || index >= pages.length || isAnimating) return;
  isAnimating = true;
  current = index;
  pages.forEach((page, i) => {
    page.style.transform = `translateY(${(i - current) * 100}%)`;
  });
  setTimeout(() => { isAnimating = false; }, 460);
}

app.addEventListener('touchstart', (e) => {
  startY = e.touches[0].clientY;
}, { passive: true });

app.addEventListener('touchend', (e) => {
  const deltaY = e.changedTouches[0].clientY - startY;
  if (Math.abs(deltaY) < 60) return;
  if (deltaY < 0) goTo(current + 1);
  else goTo(current - 1);
});

/* --- 电脑端：鼠标滚轮翻页 --- */
let wheelLock = false;
app.addEventListener('wheel', (e) => {
  if (wheelLock || isAnimating) return;
  wheelLock = true;
  setTimeout(() => { wheelLock = false; }, 500);

  if (e.deltaY > 20) goTo(current + 1);
  else if (e.deltaY < -20) goTo(current - 1);
}, { passive: true });

/* --- 电脑端：键盘方向键翻页 --- */
document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowDown' || e.key === 'PageDown') {
    e.preventDefault();
    goTo(current + 1);
  }
  if (e.key === 'ArrowUp' || e.key === 'PageUp') {
    e.preventDefault();
    goTo(current - 1);
  }
});

document.getElementById('enterBtn').addEventListener('click', () => goTo(1));

/* ---------- 2. 音频与字幕 ---------- */
const audio = new Audio('audio/luoluodong-15s.mp3');
audio.preload = 'auto';

const playBtn = document.getElementById('playBtn');
const stopBtn = document.getElementById('stopBtn');
const subtitle = document.getElementById('subtitle');
const disc = document.getElementById('disc');

const lines = [
  { t: 0,    text: '（水田里的号子，从远处传来……）' },
  { t: 2.5,  text: '“啰啰咚——啰啰咚——”' },
  { t: 5.5,  text: '一人领，众人和，节奏跟着插秧的手。' },
  { t: 9,    text: '“秧歌一唱啰啰咚，金谷比山多。”' },
  { t: 12.5, text: '15秒体验结束。完整唱段需经传承人授权。' }
];

let timer = null;

function renderSubtitle(time) {
  let currentText = lines[0].text;
  for (const line of lines) {
    if (time >= line.t) currentText = line.text;
  }
  if (subtitle.textContent !== currentText) {
    subtitle.textContent = currentText;
    subtitle.classList.remove('subtitle-pop');
    void subtitle.offsetWidth;
    subtitle.classList.add('subtitle-pop');
  }
}

playBtn.addEventListener('click', () => {
  audio.currentTime = 0;
  audio.play().then(() => {
    playBtn.disabled = true;
    stopBtn.disabled = false;
    disc.classList.add('spinning');
    clearInterval(timer);
    timer = setInterval(() => renderSubtitle(audio.currentTime), 150);
  }).catch(() => {
    subtitle.textContent = '音频未加载：请检查 audio/luoluodong-15s.mp3 是否存在。';
  });
});

stopBtn.addEventListener('click', () => {
  audio.pause();
  clearInterval(timer);
  playBtn.disabled = false;
  stopBtn.disabled = true;
  disc.classList.remove('spinning');
});

audio.addEventListener('ended', () => {
  clearInterval(timer);
  playBtn.disabled = false;
  stopBtn.disabled = true;
  disc.classList.remove('spinning');
  subtitle.textContent = '听完了。滑到下一页，听懂一句。';
});

/* ---------- 3. 方言听译 ---------- */
const translateData = [
  {
    dialect: '“啰吔啰吔啰哩个咚啊”',
    meaning: '衬词，没有具体词义。作用是统一节奏，一人领、众人和。',
    tag: '衬词'
  },
  {
    dialect: '“秧歌一唱啰啰咚”',
    meaning: '插秧时唱起号子，越唱越有劲。',
    tag: '正词'
  },
  {
    dialect: '“金谷比山多”',
    meaning: '盼谷子堆成山，是农人对丰收最直白的念想。',
    tag: '正词'
  }
];

const translateList = document.getElementById('translateList');
translateData.forEach((item) => {
  const card = document.createElement('button');
  card.className = 'translate-card';
  card.innerHTML = `
    <span class="translate-tag">${item.tag}</span>
    <span class="translate-dialect">${item.dialect}</span>
    <span class="translate-meaning">${item.meaning}</span>
  `;
  card.addEventListener('click', () => card.classList.toggle('open'));
  translateList.appendChild(card);
});

/* ---------- 4. 打卡集章 ---------- */
const stampNames = ['听', '译', '唱', '传'];
const stampDescriptions = ['听一段号子', '懂一句方言', '哼一个调子', '传一张海报'];
const STORAGE_KEY = 'luoluodong_stamps_v1';

function getStamps() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch (e) {
    return [];
  }
}

function saveStamps(arr) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
}

function renderStamps() {
  const done = getStamps();
  const grid = document.getElementById('stampGrid');
  grid.innerHTML = '';
  stampNames.forEach((name, i) => {
    const el = document.createElement('div');
    el.className = 'stamp' + (done.includes(i) ? ' done' : '');
    el.innerHTML = `<span>${name}</span><small>${stampDescriptions[i]}</small>`;
    grid.appendChild(el);
  });
  document.getElementById('stampCount').textContent = `已集 ${done.length} / 4`;
}

document.getElementById('stampBtn').addEventListener('click', () => {
  const done = getStamps();
  const next = stampNames.findIndex((_, i) => !done.includes(i));
  if (next === -1) {
    document.getElementById('stampCount').textContent = '四枚已集齐，去下一页生成海报。';
    return;
  }
  done.push(next);
  saveStamps(done);
  renderStamps();
  if (done.length === 4) {
    document.getElementById('stampCount').textContent = '四枚已集齐，去下一页生成海报。';
  }
});

renderStamps();

/* ---------- 5. 海报生成 ---------- */
const posterBtn = document.getElementById('posterBtn');
const canvas = document.getElementById('posterCanvas');
const ctx = canvas.getContext('2d');
const W = 750;
const H = 1000;

function wrapText(text, x, y, maxWidth, lineHeight) {
  let line = '';
  for (const char of text) {
    const test = line + char;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, y);
      line = char;
      y += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, y);
}

posterBtn.addEventListener('click', () => {
  const done = getStamps();

  // 底色
  ctx.fillStyle = '#F5EFE4';
  ctx.fillRect(0, 0, W, H);

  // 顶部朱砂条
  ctx.fillStyle = '#B03A2E';
  ctx.fillRect(0, 0, W, 16);

  // 标题
  ctx.fillStyle = '#2B2118';
  ctx.font = 'bold 64px "Songti SC", "STSong", serif';
  ctx.textAlign = 'left';
  ctx.fillText('啰啰咚', 60, 140);

  // 副标题
  ctx.font = '28px -apple-system, "PingFang SC", sans-serif';
  ctx.fillStyle = '#6B5D4F';
  ctx.fillText('国家级非遗 · 监利秧田号子', 60, 190);

  // 分隔线
  ctx.strokeStyle = 'rgba(184,146,90,0.4)';
  ctx.beginPath();
  ctx.moveTo(60, 230);
  ctx.lineTo(W - 60, 230);
  ctx.stroke();

  // 集章结果
  ctx.fillStyle = '#2B2118';
  ctx.font = 'bold 40px "Songti SC", serif';
  ctx.fillText(`我已集齐 ${done.length} / 4 枚农耕印记`, 60, 310);

  // 章列表
  const names = ['听一段号子', '懂一句方言', '哼一个调子', '传一张海报'];
  ctx.font = '30px -apple-system, "PingFang SC", sans-serif';
  names.forEach((n, i) => {
    ctx.fillStyle = done.includes(i) ? '#B03A2E' : '#B8A99A';
    ctx.fillText(done.includes(i) ? `● ${n}` : `○ ${n}`, 80, 390 + i * 56);
  });

  // 底部寄语
  ctx.fillStyle = '#6B5D4F';
  ctx.font = '28px "Songti SC", serif';
  wrapText('让水田里的号子，被更多人听见。', 60, 700, 520, 42);

  // 二维码位
  const qr = new Image();
  qr.onload = () => {
    ctx.drawImage(qr, W - 200, H - 220, 140, 140);
  };
  qr.onerror = () => {
    ctx.strokeStyle = '#B8A99A';
    ctx.strokeRect(W - 200, H - 220, 140, 140);
    ctx.fillStyle = '#B8A99A';
    ctx.font = '22px sans-serif';
    ctx.fillText('二维码位', W - 180, H - 140);
  };
  qr.src = 'images/qrcode.png';

  canvas.style.display = 'block';
  document.getElementById('posterHint').textContent = '海报已生成，微信内长按图片保存。';
});