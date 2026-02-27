// ====================================================================
// 📦 데이터 정의
// ====================================================================

const HIRAGANA = [
  [{jp:'あ',ro:'a'},{jp:'い',ro:'i'},{jp:'う',ro:'u'},{jp:'え',ro:'e'},{jp:'お',ro:'o'}],
  [{jp:'か',ro:'ka'},{jp:'き',ro:'ki'},{jp:'く',ro:'ku'},{jp:'け',ro:'ke'},{jp:'こ',ro:'ko'}],
  [{jp:'さ',ro:'sa'},{jp:'し',ro:'shi'},{jp:'す',ro:'su'},{jp:'せ',ro:'se'},{jp:'そ',ro:'so'}],
  [{jp:'た',ro:'ta'},{jp:'ち',ro:'chi'},{jp:'つ',ro:'tsu'},{jp:'て',ro:'te'},{jp:'と',ro:'to'}],
  [{jp:'な',ro:'na'},{jp:'に',ro:'ni'},{jp:'ぬ',ro:'nu'},{jp:'ね',ro:'ne'},{jp:'の',ro:'no'}],
  [{jp:'は',ro:'ha'},{jp:'ひ',ro:'hi'},{jp:'ふ',ro:'fu'},{jp:'へ',ro:'he'},{jp:'ほ',ro:'ho'}],
  [{jp:'ま',ro:'ma'},{jp:'み',ro:'mi'},{jp:'む',ro:'mu'},{jp:'め',ro:'me'},{jp:'も',ro:'mo'}],
  [{jp:'や',ro:'ya'},{jp:'ゆ',ro:'yu'},{jp:'よ',ro:'yo'}],
  [{jp:'ら',ro:'ra'},{jp:'り',ro:'ri'},{jp:'る',ro:'ru'},{jp:'れ',ro:'re'},{jp:'ろ',ro:'ro'}],
  [{jp:'わ',ro:'wa'},{jp:'を',ro:'wo'}],
  [{jp:'ん',ro:'n'}],
];

const KATAKANA = [
  [{jp:'ア',ro:'a'},{jp:'イ',ro:'i'},{jp:'ウ',ro:'u'},{jp:'エ',ro:'e'},{jp:'オ',ro:'o'}],
  [{jp:'カ',ro:'ka'},{jp:'キ',ro:'ki'},{jp:'ク',ro:'ku'},{jp:'ケ',ro:'ke'},{jp:'コ',ro:'ko'}],
  [{jp:'サ',ro:'sa'},{jp:'シ',ro:'shi'},{jp:'ス',ro:'su'},{jp:'セ',ro:'se'},{jp:'ソ',ro:'so'}],
  [{jp:'タ',ro:'ta'},{jp:'チ',ro:'chi'},{jp:'ツ',ro:'tsu'},{jp:'テ',ro:'te'},{jp:'ト',ro:'to'}],
  [{jp:'ナ',ro:'na'},{jp:'ニ',ro:'ni'},{jp:'ヌ',ro:'nu'},{jp:'ネ',ro:'ne'},{jp:'ノ',ro:'no'}],
  [{jp:'ハ',ro:'ha'},{jp:'ヒ',ro:'hi'},{jp:'フ',ro:'fu'},{jp:'ヘ',ro:'he'},{jp:'ホ',ro:'ho'}],
  [{jp:'マ',ro:'ma'},{jp:'ミ',ro:'mi'},{jp:'ム',ro:'mu'},{jp:'メ',ro:'me'},{jp:'モ',ro:'mo'}],
  [{jp:'ヤ',ro:'ya'},{jp:'ユ',ro:'yu'},{jp:'ヨ',ro:'yo'}],
  [{jp:'ラ',ro:'ra'},{jp:'リ',ro:'ri'},{jp:'ル',ro:'ru'},{jp:'レ',ro:'re'},{jp:'ロ',ro:'ro'}],
  [{jp:'ワ',ro:'wa'},{jp:'ヲ',ro:'wo'}],
  [{jp:'ン',ro:'n'}],
];

const ROW_IDS = ['a','ka','sa','ta','na','ha','ma','ya','ra','wa','n','all'];

  
// ====================================================================
// 🗂️ 게임 상태(State) 변수
// ====================================================================

// 뒤로가기용 스택: { fn, arg } 형태로 이전 페이지 함수와 인자를 저장
const pageStack = [];

// 현재 렌더링된 페이지 함수와 인자를 기억 (뒤로가기 시 스택에 넣기 위해)
let currentPage = { fn: page1, arg: '' };

let currentType = 'hira';
let clearedRows  = { hira: new Set(), kata: new Set() };
let unlockedRows = { hira: new Set([0]), kata: new Set([0]) };

let currentRowIndex = 0;
let currentRowData  = [];
let promptList      = [];
let promptIndex     = 0;
let floatingChars   = [];
let timerVal        = 10;
let timerInterval   = null;
let gameRunning     = false;
let animFrames      = [];


// ====================================================================
// 🖼️ 페이지 HTML 반환 함수들
// ====================================================================

// 각 함수는 HTML 문자열만 반환
// 실제 DOM 교체는 render()가 담당

function page1() {
  return `
    <div class="page">
      <span class="kana-deco a">あ</span>
      <span class="kana-deco b">ア</span>
      <span class="kana-deco c">い</span>
      <span class="kana-deco d">ウ</span>
      <div class="game-title">かな<br>学習ゲーム</div>
      <div class="game-subtitle">가나 학습 게임</div>
      <div class="btn-row">
        <button class="btn btn-outline" onclick="showPopup()">📖 설명</button>
        <button class="btn btn-primary" onclick="render(page2)">▶ 시작</button>
      </div>
    </div>
    <div class="popup-overlay" id="popup">
      <div class="popup-box">
        <h3>🎮 게임 설명</h3>
        <p>
          히라가나 또는 가타카나를 선택하고<br>
          원하는 행을 골라보세요!<br><br>
          제시어로 나타나는 문자를<br>
          <strong style="color:var(--accent2)">10초 안에</strong> 화면에서 찾아 클릭하세요.<br><br>
          틀리면 <strong style="color:var(--accent1)">1초 차감</strong>됩니다.<br>
          모두 맞추면 다음 행이 열립니다! 🎉
        </p>
        <button class="btn btn-primary" onclick="hidePopup()">알겠어요!</button>
      </div>
    </div>
  `;
}

function page2() {
  return `
    <div class="page">
      <div class="page-title">문자 선택</div>
      <div class="page-sub">학습할 문자를 선택하세요</div>
      <div class="select-row">
        <div class="select-card">
          <div class="kana-preview" style="color:var(--accent1)">あ</div>
          <button class="btn btn-hira" onclick="render(page3, 'hira')">히라가나</button>
        </div>
        <div class="select-card">
          <div class="kana-preview" style="color:var(--accent4)">ア</div>
          <button class="btn btn-kata" onclick="render(page3, 'kata')">가타카나</button>
        </div>
      </div>
      <button class="btn btn-back" onclick="goBack()">← 뒤로</button>
    </div>
  `;
}

// page3는 type 인자에 따라 히라가나/가타카나 행 버튼을 생성
// 버튼은 innerHTML로 못 만들고 appendChild로 만들어야 이벤트를 붙일 수 있어서
// render() 후 buildRowGrid()를 별도 호출
function page3(type) {
  currentType = type;
  const title = type === 'hira' ? '히라가나 행 선택' : '가타카나 행 선택';
  return `
    <div class="page">
      <div class="section-header">${title}</div>
      <div class="section-sub">행을 선택하세요</div>
      <div class="row-grid" id="row-grid"></div>
      <button class="btn btn-back" onclick="goBack()">← 뒤로</button>
    </div>
  `;
}

function page4() {
  return `
    <div class="page fourth-page">
      <div class="fp-top">
        <div class="prompt-boxes" id="prompt-boxes"></div>
        <div class="fp-right">
          <div class="timer-display" id="timer-display">10</div>
          <button class="btn-start" id="btn-start" onclick="startGame()">▶ 시작</button>
        </div>
      </div>
      <div class="progress-row">
        <span id="progress-text">0 / 0</span>
        <div class="progress-bar">
          <div class="progress-fill" id="progress-fill" style="width:0%"></div>
        </div>
      </div>
      <div class="game-field" id="game-field"></div>
      <button class="btn btn-back" onclick="goBack()">← 뒤로</button>
    </div>
  `;
}


// ====================================================================
// 🧭 페이지 네비게이션 (render + 스택 기반 goBack)
// ====================================================================

/**
 * 페이지 교체 함수
 * 1. 현재 페이지를 스택에 저장
 * 2. game-container 내용을 새 페이지 HTML로 교체
 * 3. page3일 경우 행 버튼을 DOM에 추가 (buildRowGrid)
 * 4. page4일 경우 게임 필드 초기화 (initFourthPage)
 * @param {Function} fn  - 페이지 HTML을 반환하는 함수
 * @param {string}   arg - 함수에 전달할 인자 (기본값 빈 문자열)
 */
function render(fn, arg = '') {
  stopGame(); // 게임 진행 중이면 정지

  pageStack.push(currentPage);            // 현재 페이지를 스택에 저장
  currentPage = { fn, arg };              // 새 페이지를 현재로 업데이트

  document.getElementById('game-container').innerHTML = fn(arg); // DOM 교체

  // page3: 행 버튼은 appendChild로 붙여야 이벤트가 살아있음
  if (fn === page3) buildRowGrid(arg);

  // page4: 제시어 박스 등 초기화
  if (fn === page4) initFourthPage();
}

/**
 * 스택에서 이전 페이지를 꺼내 복귀 (뒤로가기)
 * render()와 달리 스택에 push하지 않음
 */
function goBack() {
  if (pageStack.length === 0) return;
  stopGame();

  const prev = pageStack.pop();
  currentPage = prev;

  document.getElementById('game-container').innerHTML = prev.fn(prev.arg);

  if (prev.fn === page3) buildRowGrid(prev.arg);
  if (prev.fn === page4) initFourthPage();
}


// ====================================================================
// 💬 팝업
// ====================================================================

function showPopup() {
  document.getElementById('popup').style.display = 'flex'; //page1안에 존재하지만 보이지 않았던 팝업창을 보이게 함
}
function hidePopup() {
  document.getElementById('popup').style.display = 'none'; // 팝업창을 보이지 않게 함 
}


// ====================================================================
// 📋 page3: 행 버튼 생성 (appendChild 방식)
// ====================================================================

/**
 * row-grid에 행 버튼 12개를 appendChild로 생성
 * innerHTML 방식으로는 클릭 이벤트에 rowIdx 클로저를 제대로 넘기기 어려움
 * @param {string} type - 'hira' 또는 'kata'
 */
function buildRowGrid(type) {
  const grid    = document.getElementById('row-grid'); // page3안에 있는 row-grid라는 id를 가진 div 태그 선택 
  const dataArr = type === 'hira' ? HIRAGANA : KATAKANA; //type의 값이 hira면 HIRAGANA 배열을, 아니면 KATAKANA 배열을 선택 
  const unlocked = unlockedRows[type]; // unlockedRows.hira와 동일한 것
  const cleared  = clearedRows[type]; 

  ROW_IDS.forEach((id, i) => {
    const btn    = document.createElement('button');
    const isAll  = id === 'all'; //id는 ROW_IDS의 한 요소. all인지 아닌지 판별. all이 아닌 경우 
    const rowIdx = i; // 0~10은 배열 인덱스, 11은 all

    btn.id = id;
    btn.classList.add('row-btn', type);
    btn.innerHTML = `<span class="jp">${id}</span>`;

    // disabled 처리
    if (isAll) { //따로 처리해야 함. all은  unlockedRows[type]으로 접근불가하기 때문 
      const allCleared = [0,1,2,3,4,5,6,7,8,9,10].every(x => cleared.has(x)); //모든 인덱스가 clear되면 all도 버튼 클릭 가능 
      btn.disabled = !allCleared;
    } else {
      btn.disabled = !unlocked.has(rowIdx);
    }

    // 클리어 표시
    if (!isAll && cleared.has(rowIdx))  btn.classList.add('cleared'); //cleard 클래스를 추가함으로써 테두리 색 바꿈 
    if (isAll  && cleared.has(11))      btn.classList.add('cleared');

    // 클릭 이벤트: fourth_page로 이동
    btn.addEventListener('click', () => {
      if (btn.disabled) return;
      fourth_page(isAll ? -1 : rowIdx); 
    });

    grid.appendChild(btn);
  });
}


// ====================================================================
// 🔓 행 잠금 해제
// ====================================================================

function unlockNext(type, justClearedIdx) {
  clearedRows[type].add(justClearedIdx);
  const next = justClearedIdx + 1;
  if (next <= 10) unlockedRows[type].add(next);
}


// ====================================================================
// 🎮 page4: 게임 화면 초기화 및 진입
// ====================================================================

/**
 * page3의 행 버튼 클릭 시 호출
 * currentRowData를 설정하고 page4로 이동
 * @param {number} rowIndex - 선택한 행 인덱스 (-1이면 all 모드)
 */
function fourth_page(rowIndex) {
  currentRowIndex = rowIndex;
  const dataArr   = currentType === 'hira' ? HIRAGANA : KATAKANA;

  if (rowIndex === -1) {
    const all = dataArr.flat();
    all.sort(() => Math.random() - 0.5);
    currentRowData = all.slice(0, 5);
  } else {
    currentRowData = dataArr[rowIndex];
  }

  promptList  = [...currentRowData]; //spread복사: 배열 복사(= 사용시 같은 곳을 가리키는 것이기 때문)
  promptIndex = 0;

  render(page4); // page4 HTML 교체 → initFourthPage() 자동 호출
}

/**
 * page4 DOM이 생성된 직후 호출
 * 제시어 박스, 타이머, 진행 바 초기화
 */
function initFourthPage() {
  renderPromptBoxes();
  document.getElementById('timer-display').textContent = '10';
  document.getElementById('timer-display').classList.remove('danger');
  document.getElementById('btn-start').disabled = false;
  updateProgress();
}

function renderPromptBoxes() { //제시어 생성
  const container = document.getElementById('prompt-boxes');
  container.innerHTML = '';
  promptList.forEach((ch, i) => {
    const box = document.createElement('div');
    box.classList.add('prompt-box');
    box.id = 'prompt-' + i;
    box.innerHTML = `<span class="jp">${ch.ro}</span>`;
    if (i === 0) box.classList.add('current');
    container.appendChild(box);
  });
}

function updatePromptBoxes() {
  promptList.forEach((_, i) => {
    const box = document.getElementById('prompt-' + i);
    if (!box) return;
    box.classList.remove('current', 'done');
    if (i < promptIndex)        box.classList.add('done');
    else if (i === promptIndex) box.classList.add('current');
  });
}

function updateProgress() {
  const total = promptList.length;
  const done  = promptIndex;
  document.getElementById('progress-text').textContent = `${done} / ${total}`;
  document.getElementById('progress-fill').style.width = total > 0 ? `${(done/total)*100}%` : '0%';
}


// ====================================================================
// ▶️ 게임 시작 / 정지 / 리셋
// ====================================================================

function startGame() {
  document.getElementById('btn-start').disabled = true;
  gameRunning = true;
  promptIndex = 0;
  updatePromptBoxes();
  updateProgress();
  createChars();
  startTimer();
}

function stopGame() {
  gameRunning = false;
  clearInterval(timerInterval);
  timerInterval = null;
  animFrames.forEach(id => cancelAnimationFrame(id));
  animFrames    = [];
  floatingChars = [];
}

function startTimer() {
  timerVal = 10;
  document.getElementById('timer-display').textContent = timerVal;
  document.getElementById('timer-display').classList.remove('danger');
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    timerVal--;
    const disp = document.getElementById('timer-display');
    if (disp) {
      disp.textContent = timerVal;
      disp.classList.toggle('danger', timerVal <= 3);
    }
    if (timerVal <= 0) {
      clearInterval(timerInterval);
      gameOver();
    }
  }, 1000);
}

function gameOver() {
  gameRunning = false;
  stopGame();
  setTimeout(() => {
    const retry = confirm('⏰ 시간이 초과되었습니다!\n다시 시작하시겠습니까?');
    if (retry) resetRound();
    else goBack();
  }, 100);
}

function resetRound() {
  if (currentRowIndex === -1) {
    const dataArr = currentType === 'hira' ? HIRAGANA : KATAKANA;
    const all = dataArr.flat();
    all.sort(() => Math.random() - 0.5);
    currentRowData = all.slice(0, 5);
    promptList = [...currentRowData];
  }

  promptIndex = 0;
  renderPromptBoxes();
  updateProgress();
  document.getElementById('timer-display').textContent = '10';
  document.getElementById('timer-display').classList.remove('danger');
  document.getElementById('btn-start').disabled = false;
  document.getElementById('game-field').innerHTML = '';
  floatingChars = [];
}


// ====================================================================
// 🎴 떠다니는 글자 카드
// ====================================================================

function getCharPool() {
  const dataArr    = currentType === 'hira' ? HIRAGANA : KATAKANA;
  const rowChars   = [...currentRowData];
  const allChars   = dataArr.flat(); //2차원 배열 -> 1차원 배열
  const otherChars = allChars.filter(c => !rowChars.find(r => r.jp === c.jp)); //랜덤 문자 뽑기 
  otherChars.sort(() => Math.random() - 0.5);
  const extras = otherChars.slice(0, Math.max(0, 10 - rowChars.length));
  const pool = [...rowChars, ...extras];
  pool.sort(() => Math.random() - 0.5);
  return pool.slice(0, 10);
}

function createChars() {
  const field = document.getElementById('game-field');
  field.innerHTML = '';
  floatingChars   = [];

  const pool = getCharPool();

  pool.forEach(ch => {
    const el = document.createElement('div');
    el.classList.add('floating-char');
    el.innerHTML = `<span class="jp">${ch.jp}</span>`;

    const fw = field.clientWidth  || 400;
    const fh = field.clientHeight || 360;
    const x  = Math.random() * (fw - 70);
    const y  = Math.random() * (fh - 70);
    const vx = (Math.random() - 0.5) * 1.5;
    const vy = (Math.random() - 0.5) * 1.5;

    el.style.left = x + 'px';
    el.style.top  = y + 'px';

    const charData = { el, ch, x, y, vx, vy, wrongTimeout: null, originalJp: ch.jp };
    el.addEventListener('click', () => onCharClick(charData));
    field.appendChild(el);
    floatingChars.push(charData);
  });

  animate();
}

function onCharClick(charData) {
  if (!gameRunning) return;
  const target = promptList[promptIndex];

  if (charData.ch.jp === target.jp) {
    // ✅ 정답
    showScorePopup(charData.el, '✓', 'var(--accent3)');
    promptIndex++;
    updatePromptBoxes();
    updateProgress();

    if (promptIndex >= promptList.length) {
      // 🎉 전부 클리어
      stopGame();
      setTimeout(() => {
        const again = confirm('🎉 전부 성공하셨습니다!\n다시 시작하시겠습니까?');

        if (currentRowIndex === -1) {
          clearedRows[currentType].add(11);
        } else {
          unlockNext(currentType, currentRowIndex);
        }

        if (again) {
          resetRound();
        } else {
          // page3로 복귀 (스택에서 꺼내지 않고 직접 렌더링)
          // render()를 쓰면 스택에 또 쌓이므로 goBack() 사용
          goBack();
        }
      }, 200);
    } else {
      startTimer();
    }

  } else {
    // ❌ 오답
    timerVal = Math.max(0, timerVal - 1);
    const disp = document.getElementById('timer-display');
    if (disp) {
      disp.textContent = timerVal;
      disp.classList.toggle('danger', timerVal <= 3);
    }
    showScorePopup(charData.el, '✗', 'var(--accent1)');

    if (charData.wrongTimeout) clearTimeout(charData.wrongTimeout);
    charData.el.classList.add('wrong');
    const origEl  = charData.el.querySelector('.jp');
    origEl.textContent = '✗';
    charData.wrongTimeout = setTimeout(() => {
      charData.el.classList.remove('wrong');
      origEl.textContent = charData.originalJp;
    }, 1000);

    if (timerVal <= 0) {
      clearInterval(timerInterval);
      gameOver();
    }
  }
}

function showScorePopup(el, text, color) {
  const field = document.getElementById('game-field');
  const rect  = el.getBoundingClientRect();
  const fRect = field.getBoundingClientRect();
  const pop   = document.createElement('div');
  pop.classList.add('score-popup');
  pop.style.color = color;
  pop.style.left  = (rect.left - fRect.left + rect.width / 2) + 'px';
  pop.style.top   = (rect.top  - fRect.top) + 'px';
  pop.textContent = text;
  field.appendChild(pop);
  setTimeout(() => pop.remove(), 1000);
}


// ====================================================================
// 🔄 애니메이션 루프
// ====================================================================

function animate() {
  if (!gameRunning) return;
  const field = document.getElementById('game-field');
  if (!field) return;
  const fw = field.clientWidth;
  const fh = field.clientHeight;

  floatingChars.forEach(c => {
    c.x += c.vx;
    c.y += c.vy;
    if (c.x < 0)       { c.x = 0;       c.vx *= -1; }
    if (c.x > fw - 58) { c.x = fw - 58; c.vx *= -1; }
    if (c.y < 0)       { c.y = 0;       c.vy *= -1; }
    if (c.y > fh - 62) { c.y = fh - 62; c.vy *= -1; }
    c.el.style.left = c.x + 'px';
    c.el.style.top  = c.y + 'px';
  });

  const id = requestAnimationFrame(animate);
  animFrames.push(id);
}


// ====================================================================
// 🚀 시작
// ====================================================================

window.onload = function() {
  // 첫 페이지는 render()를 거치지 않고 직접 삽입
  // (첫 페이지는 스택에 쌓을 필요가 없음)
  document.getElementById('game-container').innerHTML = page1();
};
