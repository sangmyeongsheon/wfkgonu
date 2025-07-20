// 게임 상수 및 설정
const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 600;
const RADIUS = 15;
const COLORS = {
    WHITE: '#ffffff',
    BLACK: '#000000',
    RED: '#dc3232',
    BLUE: '#3232dc',
    GRAY: '#b4b4b4',
    GREEN: '#32dc32'
};

// 노드 정의 (Python 코드와 동일)
const NODES = {
    '200,100': [[300, 100]],
    '300,100': [[200, 100], [400, 100], [300, 200]],
    '400,100': [[300, 100]],
    '300,200': [[300, 100], [300, 300], [200, 300], [400, 300]],
    '200,300': [[300, 300], [300, 200], [300, 400]],
    '300,300': [[200, 300], [400, 300], [300, 200], [300, 400]],
    '400,300': [[300, 300], [300, 200], [300, 400]],
    '300,400': [[300, 300], [200, 300], [400, 300]],
    '200,500': [[300, 500]],
    '300,500': [[200, 500], [400, 500], [300, 400]],
    '400,500': [[300, 500]]
};

const VALID_MOVES = {
    '200,100': [[300, 100]],
    '300,100': [[300, 200]],
    '400,100': [[300, 100]],
    '300,200': [[300, 300], [200, 300], [400, 300]],
    '200,300': [[300, 300], [300, 200], [300, 400]],
    '300,300': [[200, 300], [400, 300], [300, 200], [300, 400]],
    '400,300': [[300, 300], [300, 200], [300, 400]],
    '300,400': [[300, 300], [200, 300], [400, 300]],
    '200,500': [[300, 500]],
    '300,500': [[300, 400]],
    '400,500': [[300, 500]]
};

// 게임 상태
let gameState = {
    mode: 0, // 0: 모드 선택, 1: 1플레이어, 2: 2플레이어
    playerChoice: 0, // 0: 선택 안함, 1: 선공, 2: 후공
    player1: [[200, 100], [300, 100], [400, 100]], // 파란색
    player2: [[200, 500], [300, 500], [400, 500]], // 빨간색
    selected: null,
    turn: 1, // 1: 파란색, 2: 빨간색
    gameOver: false,
    isAiThinking: false,
    aiMoveTimeout: null,
    turnCount: 0, // 턴 수 카운트 (통계용)
    moveHistory: [], // 이동 기록 (무한루프 방지)
    maxHistorySize: 10 // 최근 이동 기록 개수
};

// DOM 요소들
let canvas, ctx;
let screens = {};
let buttons = {};
let modals = {};

// 초기화
document.addEventListener('DOMContentLoaded', function() {
    initializeDOM();
    initializeCanvas();
    setupEventListeners();
    showScreen('modeSelection');
});

function initializeDOM() {
    // 캔버스
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    // 화면들
    screens = {
        modeSelection: document.getElementById('modeSelection'),
        playerChoice: document.getElementById('playerChoice'),
        gameScreen: document.getElementById('gameScreen')
    };
    
    // 버튼들
    buttons = {
        rules: document.getElementById('rulesBtn'),
        singlePlayer: document.getElementById('singlePlayerBtn'),
        twoPlayer: document.getElementById('twoPlayerBtn'),
        firstPlayer: document.getElementById('firstPlayerBtn'),
        secondPlayer: document.getElementById('secondPlayerBtn'),
        backToMode: document.getElementById('backToModeBtn'),
        restart: document.getElementById('restartBtn'),
        backToMenu: document.getElementById('backToMenuBtn'),
        playAgain: document.getElementById('playAgainBtn'),
        menu: document.getElementById('menuBtn'),
        closeRules: document.getElementById('closeRulesBtn')
    };
    
    // 모달들
    modals = {
        rules: document.getElementById('rulesModal'),
        gameResult: document.getElementById('gameResult')
    };
}

function initializeCanvas() {
    // 캔버스 크기 설정
    const rect = canvas.getBoundingClientRect();
    const scale = Math.min(rect.width / CANVAS_WIDTH, rect.height / CANVAS_HEIGHT);
    
    // 고해상도 디스플레이 지원
    const dpr = window.devicePixelRatio || 1;
    canvas.width = CANVAS_WIDTH * dpr;
    canvas.height = CANVAS_HEIGHT * dpr;
    canvas.style.width = CANVAS_WIDTH + 'px';
    canvas.style.height = CANVAS_HEIGHT + 'px';
    ctx.scale(dpr, dpr);
}

function setupEventListeners() {
    // 버튼 이벤트
    buttons.rules.addEventListener('click', () => showModal('rules'));
    buttons.closeRules.addEventListener('click', () => hideModal('rules'));
    
    buttons.singlePlayer.addEventListener('click', () => {
        gameState.mode = 1;
        showScreen('playerChoice');
    });
    
    buttons.twoPlayer.addEventListener('click', () => {
        gameState.mode = 2;
        resetGame();
        showScreen('gameScreen');
        renderGame();
    });
    
    buttons.firstPlayer.addEventListener('click', () => {
        gameState.playerChoice = 1; // 선공
        resetGame();
        showScreen('gameScreen');
        renderGame();
    });
    
    buttons.secondPlayer.addEventListener('click', () => {
        gameState.playerChoice = 2; // 후공
        resetGame();
        showScreen('gameScreen');
        renderGame();
        // AI가 선공이므로 AI 턴 시작
        setTimeout(startAiTurn, 500);
    });
    
    buttons.backToMode.addEventListener('click', () => {
        gameState.mode = 0;
        gameState.playerChoice = 0;
        showScreen('modeSelection');
    });
    
    buttons.restart.addEventListener('click', () => {
        if (gameState.mode === 1) {
            gameState.playerChoice = 0;
            showScreen('playerChoice');
        } else {
            resetGame();
            renderGame();
        }
    });
    
    buttons.backToMenu.addEventListener('click', () => {
        gameState.mode = 0;
        gameState.playerChoice = 0;
        showScreen('modeSelection');
    });
    
    buttons.playAgain.addEventListener('click', () => {
        hideModal('gameResult');
        if (gameState.mode === 1) {
            gameState.playerChoice = 0;
            showScreen('playerChoice');
        } else {
            resetGame();
            renderGame();
        }
    });
    
    buttons.menu.addEventListener('click', () => {
        hideModal('gameResult');
        gameState.mode = 0;
        gameState.playerChoice = 0;
        showScreen('modeSelection');
    });
    
    // 캔버스 클릭 이벤트
    canvas.addEventListener('click', handleCanvasClick);
    
    // 모달 외부 클릭으로 닫기
    modals.rules.addEventListener('click', (e) => {
        if (e.target === modals.rules) hideModal('rules');
    });
    
    // 반응형 처리
    window.addEventListener('resize', () => {
        if (gameState.mode > 0 && screens.gameScreen.classList.contains('active')) {
            renderGame();
        }
    });
}

function showScreen(screenName) {
    // 모든 화면 숨기기
    Object.values(screens).forEach(screen => screen.classList.remove('active'));
    // 선택된 화면 보이기
    screens[screenName].classList.add('active');
}

function showModal(modalName) {
    modals[modalName].classList.remove('hidden');  // hidden 클래스 제거 먼저!
    modals[modalName].classList.add('active');
}

function hideModal(modalName) {
    modals[modalName].classList.remove('active');
    modals[modalName].classList.add('hidden');  // hidden 클래스 다시 추가
}

function resetGame() {
    gameState.player1 = [[200, 100], [300, 100], [400, 100]];
    gameState.player2 = [[200, 500], [300, 500], [400, 500]];
    gameState.selected = null;
    gameState.turn = 1;
    gameState.gameOver = false;
    gameState.isAiThinking = false;
    gameState.turnCount = 0;
    gameState.moveHistory = [];
    
    if (gameState.aiMoveTimeout) {
        clearTimeout(gameState.aiMoveTimeout);
        gameState.aiMoveTimeout = null;
    }
    
    updateTurnIndicator();
    hideAiStatus();
}

function renderGame() {
    // 캔버스 초기화
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // 배경
    ctx.fillStyle = '#f7fafc';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // 보드 그리기
    drawBoard();
    drawPieces();
}

function drawBoard() {
    ctx.strokeStyle = COLORS.BLACK;
    ctx.lineWidth = 3;
    
    // 원 그리기
    ctx.beginPath();
    ctx.arc(300, 300, 100, 0, Math.PI * 2);
    ctx.stroke();
    
    // 선 그리기
    ctx.beginPath();
    // 세로선
    ctx.moveTo(300, 100);
    ctx.lineTo(300, 500);
    // 상단 가로선
    ctx.moveTo(200, 100);
    ctx.lineTo(400, 100);
    // 중앙 가로선
    ctx.moveTo(200, 300);
    ctx.lineTo(400, 300);
    // 하단 가로선
    ctx.moveTo(200, 500);
    ctx.lineTo(400, 500);
    ctx.stroke();
    
    // 노드 표시
    ctx.fillStyle = COLORS.BLACK;
    ctx.strokeStyle = COLORS.BLACK;
    ctx.lineWidth = 2;
    
    Object.keys(NODES).forEach(nodeKey => {
        const [x, y] = nodeKey.split(',').map(Number);
        ctx.beginPath();
        ctx.arc(x, y, RADIUS, 0, Math.PI * 2);
        ctx.stroke();
    });
}

function drawPieces() {
    // 파란색 말 (player1)
    ctx.fillStyle = COLORS.BLUE;
    gameState.player1.forEach(([x, y]) => {
        ctx.beginPath();
        ctx.arc(x, y, RADIUS - 3, 0, Math.PI * 2);
        ctx.fill();
    });
    
    // 빨간색 말 (player2)
    ctx.fillStyle = COLORS.RED;
    gameState.player2.forEach(([x, y]) => {
        ctx.beginPath();
        ctx.arc(x, y, RADIUS - 3, 0, Math.PI * 2);
        ctx.fill();
    });
    
    // 선택된 말 강조
    if (gameState.selected) {
        ctx.strokeStyle = COLORS.GRAY;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(gameState.selected[0], gameState.selected[1], RADIUS, 0, Math.PI * 2);
        ctx.stroke();
    }
}

function handleCanvasClick(event) {
    if (gameState.gameOver) return;
    
    // 1플레이어 모드에서 AI 턴이거나 AI가 생각 중이면 무시
    if (gameState.mode === 1 && (gameState.turn !== gameState.playerChoice || gameState.isAiThinking)) {
        return;
    }
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;
    
    // 가장 가까운 노드 찾기
    let closestNode = null;
    let minDistance = Infinity;
    
    Object.keys(NODES).forEach(nodeKey => {
        const [nodeX, nodeY] = nodeKey.split(',').map(Number);
        const distance = Math.sqrt((x - nodeX) ** 2 + (y - nodeY) ** 2);
        if (distance < minDistance && distance < RADIUS * 2) {
            minDistance = distance;
            closestNode = [nodeX, nodeY];
        }
    });
    
    if (!closestNode) return;
    
    // 말 선택
    const currentPlayer = gameState.turn === 1 ? gameState.player1 : gameState.player2;
    const isOwnPiece = currentPlayer.some(([px, py]) => px === closestNode[0] && py === closestNode[1]);
    
    if (isOwnPiece) {
        gameState.selected = closestNode;
        renderGame();
        return;
    }
    
    // 말 이동
    if (gameState.selected && isValidMove(gameState.selected, closestNode)) {
        movePiece(gameState.selected, closestNode, gameState.turn);
        gameState.selected = null;
        gameState.turnCount++;
        addMoveToHistory();
        
        const nextTurn = gameState.turn === 1 ? 2 : 1;
        
        // 게임 오버 체크
        if (checkGameOver(nextTurn)) {
            gameState.gameOver = true;
            showGameResult(gameState.turn); // 현재 플레이어가 승리
        } else {
            gameState.turn = nextTurn;
            updateTurnIndicator();
            
            // 1플레이어 모드에서 AI 턴 시작
            if (gameState.mode === 1 && gameState.turn !== gameState.playerChoice) {
                setTimeout(startAiTurn, 500);
            }
        }
        
        renderGame();
    }
}

function isValidMove(start, end) {
    // 이동할 위치에 말이 있는지 확인
    const allPieces = [...gameState.player1, ...gameState.player2];
    if (allPieces.some(([px, py]) => px === end[0] && py === end[1])) {
        return false;
    }
    
    // 유효한 이동인지 확인
    const startKey = `${start[0]},${start[1]}`;
    const validMoves = VALID_MOVES[startKey] || [];
    return validMoves.some(([mx, my]) => mx === end[0] && my === end[1]);
}

function movePiece(start, end, player) {
    const pieces = player === 1 ? gameState.player1 : gameState.player2;
    const index = pieces.findIndex(([px, py]) => px === start[0] && py === start[1]);
    if (index !== -1) {
        pieces[index] = end;
    }
}

function getAllPossibleMoves(player) {
    const pieces = player === 1 ? gameState.player1 : gameState.player2;
    const moves = [];
    const allPieces = [...gameState.player1, ...gameState.player2];
    
    pieces.forEach(piece => {
        const pieceKey = `${piece[0]},${piece[1]}`;
        const validMoves = VALID_MOVES[pieceKey] || [];
        
        validMoves.forEach(move => {
            if (!allPieces.some(([px, py]) => px === move[0] && py === move[1])) {
                moves.push([piece, move]);
            }
        });
    });
    
    return moves;
}

function checkGameOver(player) {
    // 이동할 수 없으면 게임 오버 (고누 게임의 유일한 승부 조건)
    return getAllPossibleMoves(player).length === 0;
}

// 게임 상태를 문자열로 변환 (이동 기록용)
function getGameStateString() {
    const p1 = gameState.player1.map(p => `${p[0]},${p[1]}`).sort().join(';');
    const p2 = gameState.player2.map(p => `${p[0]},${p[1]}`).sort().join(';');
    return `${p1}|${p2}`;
}

// 이동 기록 추가
function addMoveToHistory() {
    const stateString = getGameStateString();
    gameState.moveHistory.push(stateString);
    
    // 최대 기록 수 초과시 오래된 것 제거
    if (gameState.moveHistory.length > gameState.maxHistorySize) {
        gameState.moveHistory.shift();
    }
}

// 무한루프 감지 (같은 상태가 3번 이상 나타나면 무한루프로 판단)
function detectInfiniteLoop() {
    if (gameState.moveHistory.length < 6) return false;
    
    const currentState = getGameStateString();
    let count = 0;
    
    for (const state of gameState.moveHistory) {
        if (state === currentState) {
            count++;
        }
    }
    
    return count >= 3;
}

// 특정 이동이 반복 패턴을 만드는지 체크
function wouldCauseLoop(start, end, player) {
    // 임시로 이동해서 새로운 게임 상태 생성
    const pieces = player === 1 ? gameState.player1 : gameState.player2;
    const index = pieces.findIndex(([px, py]) => px === start[0] && py === start[1]);
    const originalPos = pieces[index];
    pieces[index] = end;
    
    // 새로운 상태 문자열 생성
    const newState = getGameStateString();
    
    // 이동 복구
    pieces[index] = originalPos;
    
    // 이 상태가 이전에 몇 번 나타났는지 확인
    let count = 0;
    for (const state of gameState.moveHistory) {
        if (state === newState) {
            count++;
        }
    }
    
    return count >= 2; // 2번 이상 나타났다면 3번째가 되므로 반복으로 판단
}

// AI를 위한 향상된 이동 평가 (반복 방지 포함)
function getEnhancedMoveScore(start, end, aiPlayer) {
    // 기본 미니맥스 점수 계산
    const pieces = aiPlayer === 1 ? gameState.player1 : gameState.player2;
    const index = pieces.findIndex(([px, py]) => px === start[0] && py === start[1]);
    const originalPos = pieces[index];
    pieces[index] = end;
    
    const nextTurn = aiPlayer === 1 ? 2 : 1;
    const baseScore = minimax(4, aiPlayer, -Infinity, Infinity, nextTurn);
    
    // 이동 복구
    pieces[index] = originalPos;
    
    let finalScore = baseScore;
    
    // 반복 패턴 페널티
    if (wouldCauseLoop(start, end, aiPlayer)) {
        finalScore -= 200; // 큰 페널티 부여
    }
    
    // 다양성 보너스 - 최근에 사용하지 않은 이동에 보너스
    const moveString = `${start[0]},${start[1]}->${end[0]},${end[1]}`;
    const recentMoves = gameState.moveHistory.slice(-6); // 최근 6개 상태
    let diversityBonus = 10;
    
    recentMoves.forEach(state => {
        if (state.includes(moveString)) {
            diversityBonus -= 2;
        }
    });
    
    finalScore += Math.max(0, diversityBonus);
    
    return finalScore;
}

function updateTurnIndicator() {
    const turnIndicator = document.getElementById('turnIndicator');
    const turnInfo = ` (Turn ${Math.ceil(gameState.turnCount / 2)})`;
    
    if (gameState.turn === 1) {
        turnIndicator.textContent = '🔵 Blue\'s Turn' + turnInfo;
        turnIndicator.style.color = COLORS.BLUE;
    } else {
        turnIndicator.textContent = '🔴 Red\'s Turn' + turnInfo;
        turnIndicator.style.color = COLORS.RED;
    }
}

function showAiStatus() {
    document.getElementById('aiStatus').classList.remove('hidden');
}

function hideAiStatus() {
    document.getElementById('aiStatus').classList.add('hidden');
}

function showGameResult(winner) {
    const resultText = document.getElementById('resultText');
    
    if (gameState.mode === 1) {
        if (winner === gameState.playerChoice) {
            resultText.textContent = '🎉 You Win!';
            resultText.style.color = COLORS.GREEN;
        } else {
            resultText.textContent = '😔 You Lose!';
            resultText.style.color = COLORS.RED;
        }
    } else {
        if (winner === 1) {
            resultText.textContent = '🔵 Blue Wins!';
            resultText.style.color = COLORS.BLUE;
        } else {
            resultText.textContent = '🔴 Red Wins!';
            resultText.style.color = COLORS.RED;
        }
    }
    
    showModal('gameResult');
}

// AI 관련 함수들
function startAiTurn() {
    gameState.isAiThinking = true;
    showAiStatus();
    
    gameState.aiMoveTimeout = setTimeout(() => {
        executeAiMove();
    }, 1000); // 1초 후 AI 이동
}

function executeAiMove() {
    const aiPlayer = gameState.playerChoice === 1 ? 2 : 1;
    const bestMove = getBestAiMove(aiPlayer);
    
    if (bestMove) {
        movePiece(bestMove[0], bestMove[1], aiPlayer);
        gameState.turn = aiPlayer;
        gameState.turnCount++;
        addMoveToHistory();
        
        const nextTurn = aiPlayer === 1 ? 2 : 1;
        
        // 게임 오버 체크
        if (checkGameOver(nextTurn)) {
            gameState.gameOver = true;
            showGameResult(aiPlayer); // AI가 승리
        } else {
            gameState.turn = nextTurn;
            updateTurnIndicator();
        }
    }
    
    gameState.isAiThinking = false;
    hideAiStatus();
    renderGame();
}

function getBestAiMove(aiPlayer) {
    let bestMove = null;
    let bestScore = -Infinity;
    const possibleMoves = getAllPossibleMoves(aiPlayer);
    
    // 모든 이동이 반복을 야기하는지 체크
    let hasNonLoopingMoves = false;
    const moveScores = [];
    
    possibleMoves.forEach(([start, end]) => {
        const score = getEnhancedMoveScore(start, end, aiPlayer);
        moveScores.push({ move: [start, end], score: score });
        
        // 반복을 야기하지 않는 이동이 있는지 체크
        if (!wouldCauseLoop(start, end, aiPlayer)) {
            hasNonLoopingMoves = true;
        }
    });
    
    // 점수 기준으로 정렬 (높은 점수부터)
    moveScores.sort((a, b) => b.score - a.score);
    
    // 만약 모든 이동이 반복을 야기한다면, 차선책으로 무작위성 추가
    if (!hasNonLoopingMoves && moveScores.length > 1) {
        console.log("AI detected infinite loop pattern, using alternative strategy");
        // 상위 2-3개 중에서 무작위 선택하여 예측 불가능성 추가
        const topMoves = moveScores.slice(0, Math.min(3, moveScores.length));
        const randomIndex = Math.floor(Math.random() * topMoves.length);
        bestMove = topMoves[randomIndex].move;
        console.log(`AI chose alternative move: ${bestMove[0]} -> ${bestMove[1]}`);
    } else {
        // 가장 좋은 점수의 이동 선택
        bestMove = moveScores[0].move;
    }
    
    return bestMove;
}

function minimax(depth, maximizingPlayer, alpha, beta, currentTurn) {
    if (depth === 0 || checkGameOver(currentTurn)) {
        return evaluateBoard(maximizingPlayer);
    }
    
    const possibleMoves = getAllPossibleMoves(currentTurn);
    
    if (currentTurn === maximizingPlayer) {
        let maxEval = -Infinity;
        
        for (const [start, end] of possibleMoves) {
            // 임시로 이동
            const pieces = currentTurn === 1 ? gameState.player1 : gameState.player2;
            const index = pieces.findIndex(([px, py]) => px === start[0] && py === start[1]);
            const originalPos = pieces[index];
            pieces[index] = end;
            
            const nextTurn = currentTurn === 1 ? 2 : 1;
            const evalScore = minimax(depth - 1, maximizingPlayer, alpha, beta, nextTurn);
            
            // 이동 복구
            pieces[index] = originalPos;
            
            maxEval = Math.max(maxEval, evalScore);
            alpha = Math.max(alpha, evalScore);
            if (beta <= alpha) break;
        }
        
        return maxEval;
    } else {
        let minEval = Infinity;
        
        for (const [start, end] of possibleMoves) {
            // 임시로 이동
            const pieces = currentTurn === 1 ? gameState.player1 : gameState.player2;
            const index = pieces.findIndex(([px, py]) => px === start[0] && py === start[1]);
            const originalPos = pieces[index];
            pieces[index] = end;
            
            const nextTurn = currentTurn === 1 ? 2 : 1;
            const evalScore = minimax(depth - 1, maximizingPlayer, alpha, beta, nextTurn);
            
            // 이동 복구
            pieces[index] = originalPos;
            
            minEval = Math.min(minEval, evalScore);
            beta = Math.min(beta, evalScore);
            if (beta <= alpha) break;
        }
        
        return minEval;
    }
}

function evaluateBoard(maximizingPlayer) {
    // 게임이 끝났는지 체크
    if (getAllPossibleMoves(1).length === 0) {
        return maximizingPlayer === 1 ? -1000 : 1000;
    }
    if (getAllPossibleMoves(2).length === 0) {
        return maximizingPlayer === 1 ? 1000 : -1000;
    }
    
    // 게임이 너무 길어지면 약간 부정적으로 평가 (150턴 이상)
    if (gameState.turnCount >= 150) {
        return -10; // 약한 페널티만 부여
    }
    
    let score = 0;
    
    // 이동 가능한 수의 개수로 기본 평가
    const player1Moves = getAllPossibleMoves(1).length;
    const player2Moves = getAllPossibleMoves(2).length;
    
    if (maximizingPlayer === 1) {
        score += (player1Moves - player2Moves) * 10;
    } else {
        score += (player2Moves - player1Moves) * 10;
    }
    
    // 중앙 제어 보너스 (더 공격적인 플레이 유도)
    const centerBonus = getCenterControlBonus(maximizingPlayer);
    score += centerBonus;
    
    // 적극적인 플레이 보너스 (상대방 집 근처로 이동 장려)
    const aggressiveBonus = getAggressiveBonus(maximizingPlayer);
    score += aggressiveBonus;
    
    return score;
}

// 중앙 제어 보너스 계산
function getCenterControlBonus(player) {
    const pieces = player === 1 ? gameState.player1 : gameState.player2;
    let bonus = 0;
    
    pieces.forEach(([x, y]) => {
        // 중앙 원 주변 (300,300 중심)의 위치에 보너스
        if (x === 300 && (y === 200 || y === 400)) bonus += 5;
        if (y === 300 && (x === 200 || x === 400)) bonus += 5;
        if (x === 300 && y === 300) bonus += 10; // 정중앙 최고 보너스
    });
    
    return bonus;
}

// 공격적 플레이 보너스 계산
function getAggressiveBonus(player) {
    const pieces = player === 1 ? gameState.player1 : gameState.player2;
    const opponentPieces = player === 1 ? gameState.player2 : gameState.player1;
    let bonus = 0;
    
    pieces.forEach(([x, y]) => {
        opponentPieces.forEach(([ox, oy]) => {
            const distance = Math.abs(x - ox) + Math.abs(y - oy);
            // 상대방과 가까울수록 보너스 (공격적 플레이 장려)
            if (distance <= 200) bonus += (200 - distance) / 20;
        });
    });
    
    return bonus;
} 