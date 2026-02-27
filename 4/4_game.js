// ======================================================
// 🎮 1. Canvas 초기화
// ======================================================

// HTML에서 <canvas id="gameCanvas"> 요소를 가져온다
const canvas = document.getElementById("gameCanvas");

// 2D 그래픽을 그릴 수 있는 도구(Context)를 생성
// ctx를 이용해 이미지, 텍스트, 도형 등을 그릴 수 있다
const ctx = canvas.getContext("2d");

// 게임 화면 크기 설정
canvas.width = 480;
canvas.height = 640;



// ======================================================
// 🎯 2. 게임 상태 변수 (게임 전체 흐름을 관리)
// ======================================================

let lifes = 3;              // 플레이어 목숨
let score = 0;              // 현재 점수
let level = 1;              // 현재 레벨
let gameOver = false;       // 게임 종료 여부

let boss = null;            // 보스 객체 (없으면 null)
let bossActive = false;     // 보스 등장 여부
let bossBullets = [];       // 보스 총알 배열
let bossShootTimer = 0;     // 보스 발사 타이머

let nextBossScore = 300;    // 300점마다 보스 등장
let gameStarted = false;    // 게임 시작 여부

// 🔥 무적 시스템 (연속 데미지 방지)
let invincible = false;     // 무적 상태 여부
let invincibleTimer = 0;    // 무적 지속 시간

// ⚠ WARNING 시스템 (보스 등장 전 연출)
let warningActive = false;  // WARNING 화면 활성화 여부
let warningTimer = 0;       // WARNING 지속 시간



// ======================================================
// 🚀 3. 플레이어 설정
// ======================================================

// 플레이어 정보 객체
const player = {
    x: canvas.width / 2 - 30, // 화면 중앙 위치
    y: canvas.height - 80,    // 화면 아래 위치
    width: 60,
    height: 60,
    speed: 5                  // 이동 속도
};

// 이미지 불러오기
const playerImg = new Image();
playerImg.src = "img/user.png";

const enemyImg = new Image();
enemyImg.src = "img/enemy.png";

const bossImg = new Image();
bossImg.src = "img/boss.png";



// ======================================================
// 🔫 4. 플레이어 총알 시스템
// ======================================================

let bullets = []; // 플레이어 총알 저장 배열

// 총알 생성 함수
function shoot() {
    bullets.push({
        x: player.x + player.width / 2, // 플레이어 중앙에서 발사
        y: player.y,
        radius: 6,
        speed: 7
    });
}

// 총알 이동 함수
function moveBullets() {
    bullets.forEach(b => b.y -= b.speed); // 위로 이동

    // 화면 밖으로 나간 총알 제거
    bullets = bullets.filter(b => b.y > -10);
}

// 총알 그리기 함수
function drawBullets() {
    bullets.forEach(b => {
        ctx.beginPath();

        // 빛나는 효과
        ctx.shadowColor = "white";
        ctx.shadowBlur = 15;

        ctx.fillStyle = "white";
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0; // 그림자 초기화
    });
}



// ======================================================
// 👑 5. 보스 총알 시스템
// ======================================================

// 보스가 총을 발사하는 함수
function bossShoot() {
    if (!boss) return; // 보스가 없으면 실행 안 함

    bossBullets.push({
        x: boss.x + boss.width / 2,
        y: boss.y + boss.height,
        radius: 6,
        speed: 4
    });
}

// 보스 총알 이동
function moveBossBullets() {
    bossBullets.forEach(b => b.y += b.speed);

    // 화면 아래로 나가면 제거
    bossBullets = bossBullets.filter(b => b.y < canvas.height + 20);
}

// 보스 총알 그리기
function drawBossBullets() {
    bossBullets.forEach(b => {
        ctx.beginPath();

        ctx.shadowColor = "red";
        ctx.shadowBlur = 15;

        ctx.fillStyle = "red";
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0;
    });
}



// ======================================================
// ⌨ 6. 키보드 입력 처리
// ======================================================

let keys = {}; // 현재 눌린 키 저장

document.addEventListener("keydown", (e) => {

    // 엔터 키 처리
    if (e.key === "Enter") {

        // 게임 시작
        if (!gameStarted) {
            gameStarted = true;
            spawnEnemies();
            return;
        }

        // 게임 오버 시 재시작
        if (gameOver) {
            restartGame();
            return;
        }
    }

    if (!gameStarted) return;

    keys[e.key] = true;

    // 스페이스바 누르면 총 발사
    if (e.key === " " && !gameOver) shoot();
});

// 키에서 손을 떼면 false로 변경
document.addEventListener("keyup", (e) => {
    keys[e.key] = false;
});



// ======================================================
// 🏃 7. 플레이어 이동
// ======================================================

function movePlayer() {
    if (keys["ArrowLeft"]) player.x -= player.speed;
    if (keys["ArrowRight"]) player.x += player.speed;

    // 화면 밖으로 못 나가게 제한
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > canvas.width)
        player.x = canvas.width - player.width;
}

// 플레이어 그리기 (무적 시 깜빡임)
function drawPlayer() {
    if (invincible && invincibleTimer % 10 < 5) return;
    ctx.drawImage(playerImg, player.x, player.y, player.width, player.height);
}



// ======================================================
// 👾 8. 일반 적 시스템
// ======================================================

let enemies = [];
let enemyCount = 3;

// 적 하나 생성
function createEnemy() {
    return {
        x: Math.random() * (canvas.width - 60),
        y: 0,
        width: 60,
        height: 60,
        speed: 2 + level * 0.3 // 레벨이 오르면 빨라짐
    };
}

// 여러 적 생성
function spawnEnemies() {
    enemies = [];
    for (let i = 0; i < enemyCount; i++) {
        enemies.push(createEnemy());
    }
}

// 적 이동
function moveEnemy() {
    enemies.forEach(enemy => enemy.y += enemy.speed);
}

// 적 그리기
function drawEnemy() {
    enemies.forEach(enemy => {
        ctx.drawImage(enemyImg, enemy.x, enemy.y, enemy.width, enemy.height);
    });
}

// 적 위치 초기화
function resetEnemy(enemy) {
    enemy.y = 0;
    enemy.x = Math.random() * (canvas.width - enemy.width);
}



// ======================================================
// 👑 9. 보스 시스템
// ======================================================

function createBoss() {
    return {
        x: canvas.width / 2 - 100,
        y: 60,
        width: 200,
        height: 120,
        hp: 100 + level * 20,
        maxHp: 100 + level * 20,
        speed: 3 + level * 0.3,
        dir: 1
    };
}

function moveBoss() {
    boss.x += boss.speed * boss.dir;

    // 벽에 닿으면 방향 반전
    if (boss.x <= 0 || boss.x + boss.width >= canvas.width)
        boss.dir *= -1;
}

function drawBoss() {
    ctx.drawImage(bossImg, boss.x, boss.y, boss.width, boss.height);

    // 체력바 배경
    ctx.fillStyle = "black";
    ctx.fillRect(boss.x, boss.y - 20, boss.width, 10);

    // 체력바 (비율 계산)
    ctx.fillStyle = "red";
    ctx.fillRect(
        boss.x,
        boss.y - 20,
        boss.width * (boss.hp / boss.maxHp),
        10
    );
}



// ======================================================
// 💥 10. 충돌 판정 함수
// ======================================================

function isColliding(a, b) {

    // 원형 충돌 (총알)
    if (a.radius) {
        return (
            a.x + a.radius > b.x &&
            a.x - a.radius < b.x + b.width &&
            a.y + a.radius > b.y &&
            a.y - a.radius < b.y + b.height
        );
    }

    // 사각형 충돌
    return (
        a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y
    );
}



// ======================================================
// 🔁 11. 게임 루프 (게임의 핵심 반복 구조)
// ======================================================

function gameLoop() {

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 시작 화면
    if (!gameStarted) {
        ctx.textAlign = "center";
        ctx.fillStyle = "white";
        ctx.font = "bold 45px Arial";
        ctx.fillText("🚀 SPACE BATTLE 🚀", canvas.width / 2, canvas.height / 2);
        requestAnimationFrame(gameLoop);
        return;
    }

    // 게임 오버 화면
    if (gameOver) {
        ctx.textAlign = "center";
        ctx.fillStyle = "white";
        ctx.font = "bold 45px Arial";
        ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2);
        requestAnimationFrame(gameLoop);
        return;
    }

    // ⚠ WARNING 화면
    if (warningActive) {
        warningTimer--;

        ctx.textAlign = "center";
        ctx.fillStyle = "red";
        ctx.font = "bold 60px Arial";

        if (warningTimer % 30 < 15) {
            ctx.fillText("⚠ WARNING ⚠", canvas.width / 2, canvas.height / 2);
        }

        if (warningTimer <= 0) {
            warningActive = false;
            boss = createBoss();
            bossActive = true;
        }

        requestAnimationFrame(gameLoop);
        return;
    }

    // 기본 이동
    movePlayer();
    moveBullets();
    moveBossBullets();

    if (!bossActive) moveEnemy();

    // 무적 시간 감소
    if (invincible) {
        invincibleTimer--;
        if (invincibleTimer <= 0) invincible = false;
    }

    // 일반 적 충돌 처리
    for (let e = enemies.length - 1; e >= 0; e--) {

        let enemy = enemies[e];

        // 플레이어 충돌
        if (isColliding(player, enemy) && !invincible) {
            lifes--;
            invincible = true;
            invincibleTimer = 60;
            resetEnemy(enemy);
        }

        // 총알 충돌
        for (let i = bullets.length - 1; i >= 0; i--) {
            if (isColliding(bullets[i], enemy)) {
                score += 10;
                bullets.splice(i, 1);
                resetEnemy(enemy);
                break;
            }
        }

        // 적이 화면 아래로 나가면 목숨 감소
        if (enemy.y > canvas.height) {
            lifes--;
            resetEnemy(enemy);
        }
    }

    // 보스 등장 조건
    if (!bossActive && !warningActive && score >= nextBossScore) {
        warningActive = true;
        warningTimer = 120;
        enemies = [];
    }

    // 보스 전투
    if (bossActive && boss) {

        moveBoss();

        bossShootTimer++;
        if (bossShootTimer > 60) {
            bossShoot();
            bossShootTimer = 0;
        }

        // 플레이어 총알 vs 보스
        for (let i = bullets.length - 1; i >= 0; i--) {
            if (isColliding(bullets[i], boss)) {
                boss.hp--;
                bullets.splice(i, 1);
            }
        }

        // 보스 총알 vs 플레이어
        for (let i = bossBullets.length - 1; i >= 0; i--) {
            if (isColliding(bossBullets[i], player) && !invincible) {
                lifes--;
                invincible = true;
                invincibleTimer = 60;
                bossBullets.splice(i, 1);
            }
        }

        // 보스 처치
        if (boss.hp <= 0) {
            bossActive = false;
            boss = null;
            bossBullets = [];
            level++;
            nextBossScore += 300;
            //보상 시스템 추가
            if (lifes < 5) {         // 최대 라이프 제한 (예: 5)
            lifes++;             // 라이프 +1
            }
            spawnEnemies();
        }
    }

    if (lifes <= 0) gameOver = true;

    // 화면 그리기
    drawPlayer();
    drawBullets();
    drawBossBullets();

    if (!bossActive) drawEnemy();
    if (bossActive && boss) drawBoss();

    ctx.textAlign = "left";
    ctx.fillStyle = "white";
    ctx.font = "18px Arial";
    ctx.fillText("Level: " + level, 10, 80);
    ctx.fillText("Score: " + score, 10, 55);
    ctx.fillText("Lifes: " + lifes, 10, 30);

    requestAnimationFrame(gameLoop);
}



// ======================================================
// 🔄 12. 게임 재시작
// ======================================================

function restartGame() {
    lifes = 3;
    score = 0;
    level = 1;
    boss = null;
    bossActive = false;
    bossBullets = [];
    nextBossScore = 300;
    gameOver = false;
    spawnEnemies();
}



// ======================================================
// 🚀 13. 게임 시작
// ======================================================

playerImg.onload = function () {
    spawnEnemies();
    gameLoop();
};