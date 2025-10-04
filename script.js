// Game State Management
class GameState {
    constructor() {
        this.questions = [];
        this.currentQuestionIndex = 0;
        this.team1Name = '';
        this.team2Name = '';
        this.team1Score = 0;
        this.team2Score = 0;
        this.team1Wrong = 0;
        this.team2Wrong = 0;
        this.currentTeam = 1;
        this.gameStarted = false;
        this.timer = null;
        this.timeRemaining = 0;
        this.timerDuration = 60; // 60 seconds per question
        this.timerPaused = false;
        this.usedQuestions = new Set(); // Track used questions for random selection
        this.totalQuestionsPlayed = 0;
        this.totalCorrectAnswers = 0;
        
        // Load saved state on initialization
        this.loadState();
    }

    reset() {
        this.questions = [];
        this.currentQuestionIndex = 0;
        this.team1Score = 0;
        this.team2Score = 0;
        this.team1Wrong = 0;
        this.team2Wrong = 0;
        this.currentTeam = 1;
        this.gameStarted = false;
        this.timeRemaining = 0;
        this.timerPaused = false;
        this.usedQuestions = new Set();
        this.totalQuestionsPlayed = 0;
        this.totalCorrectAnswers = 0;
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    saveState() {
        const state = {
            team1Name: this.team1Name,
            team2Name: this.team2Name,
            team1Score: this.team1Score,
            team2Score: this.team2Score,
            team1Wrong: this.team1Wrong,
            team2Wrong: this.team2Wrong,
            currentTeam: this.currentTeam,
            gameStarted: this.gameStarted,
            currentQuestionIndex: this.currentQuestionIndex,
            totalQuestionsPlayed: this.totalQuestionsPlayed,
            totalCorrectAnswers: this.totalCorrectAnswers,
            questions: this.questions
        };
        localStorage.setItem('gameState', JSON.stringify(state));
    }

    loadState() {
        const savedState = localStorage.getItem('gameState');
        if (savedState) {
            try {
                const state = JSON.parse(savedState);
                this.team1Name = state.team1Name || '';
                this.team2Name = state.team2Name || '';
                this.team1Score = state.team1Score || 0;
                this.team2Score = state.team2Score || 0;
                this.team1Wrong = state.team1Wrong || 0;
                this.team2Wrong = state.team2Wrong || 0;
                this.currentTeam = state.currentTeam || 1;
                this.gameStarted = state.gameStarted || false;
                this.currentQuestionIndex = state.currentQuestionIndex || 0;
                this.totalQuestionsPlayed = state.totalQuestionsPlayed || 0;
                this.totalCorrectAnswers = state.totalCorrectAnswers || 0;
                this.questions = state.questions || [];
            } catch (e) {
                console.error('Error loading game state:', e);
            }
        }
    }

    clearState() {
        localStorage.removeItem('gameState');
    }

    getRandomQuestion() {
        if (this.usedQuestions.size >= this.questions.length) {
            return null; // All questions used
        }
        
        let randomIndex;
        do {
            randomIndex = Math.floor(Math.random() * this.questions.length);
        } while (this.usedQuestions.has(randomIndex));
        
        this.usedQuestions.add(randomIndex);
        this.currentQuestionIndex = randomIndex;
        return this.questions[randomIndex];
    }
}

// Question Parser
class QuestionParser {
    static parseQuestions(text) {
        const lines = text.split('\n').map(line => line.trim()).filter(line => line);
        const questions = [];
        let currentCategory = '';
        let currentQuestion = null;

        for (const line of lines) {
            // Check if line is a category (single word, no question mark, no http, and not a common answer word)
            if (line && !line.includes('؟') && !line.includes('؟') && !line.includes('.') && !line.startsWith('http') && 
                !this.isCommonAnswerWord(line)) {
                currentCategory = line;
                continue;
            }

            // Check if line is a question (contains question mark)
            if (line.includes('؟')) {
                if (currentQuestion) {
                    questions.push(currentQuestion);
                }
                currentQuestion = {
                    category: currentCategory,
                    text: line,
                    answer: '',
                    media: null
                };
                
                // Check for media URLs in question text
                const mediaMatch = this.extractMedia(line);
                if (mediaMatch) {
                    currentQuestion.media = mediaMatch;
                }
            }
            // Check if line is an answer (doesn't contain question mark, follows a question)
            else if (currentQuestion && !currentQuestion.answer) {
                currentQuestion.answer = line;
                
                // Check for media URLs in answer text (only if not already found in question)
                if (!currentQuestion.media) {
                    const mediaMatch = this.extractMedia(line);
                    if (mediaMatch) {
                        currentQuestion.media = mediaMatch;
                    }
                }
            }
            // Check if line is a media URL (starts with http and follows a question/answer)
            else if (currentQuestion && this.isMediaUrl(line)) {
                if (!currentQuestion.media) {
                    const mediaMatch = this.extractMedia(line);
                    if (mediaMatch) {
                        currentQuestion.media = mediaMatch;
                    }
                }
            }
        }

        // Add the last question
        if (currentQuestion) {
            questions.push(currentQuestion);
        }

        return questions;
    }

    static isMediaUrl(text) {
        return text.startsWith('http://') || text.startsWith('https://');
    }

    static isCommonAnswerWord(text) {
        // Common answer words that should not be treated as categories
        const commonAnswers = ['earth', 'oxygen', 'fahad', 'water', 'fire', 'air', 'sun', 'moon', 'star', 'planet', 'animal', 'plant', 'tree', 'flower', 'bird', 'fish', 'dog', 'cat', 'horse', 'cow', 'sheep', 'goat', 'chicken', 'duck', 'pig', 'lion', 'tiger', 'elephant', 'bear', 'wolf', 'fox', 'rabbit', 'mouse', 'snake', 'frog', 'spider', 'ant', 'bee', 'butterfly', 'dragonfly', 'mosquito', 'fly', 'beetle', 'ladybug', 'grasshopper', 'cricket', 'cicada', 'moth', 'wasp', 'hornet', 'yellowjacket', 'bumblebee', 'honeybee', 'waxwing', 'cardinal', 'robin', 'sparrow', 'finch', 'wren', 'thrush', 'mockingbird', 'bluebird', 'jay', 'crow', 'raven', 'magpie', 'starling', 'blackbird', 'thrush', 'warbler', 'vireo', 'tanager', 'grosbeak', 'bunting', 'sparrow', 'junco', 'towhee', 'cardinal', 'grosbeak', 'bunting', 'sparrow', 'junco', 'towhee', 'cardinal', 'grosbeak', 'bunting', 'sparrow', 'junco', 'towhee'];
        return commonAnswers.includes(text.toLowerCase());
    }

    static extractMedia(text) {
        // Check for image URLs
        const imageRegex = /(https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp))/i;
        const imageMatch = text.match(imageRegex);
        if (imageMatch) {
            return { type: 'image', url: imageMatch[1] };
        }

        // Check for video URLs
        const videoRegex = /(https?:\/\/[^\s]+\.(mp4|webm|ogg|avi|mov))/i;
        const videoMatch = text.match(videoRegex);
        if (videoMatch) {
            return { type: 'video', url: videoMatch[1] };
        }

        // Check for audio URLs
        const audioRegex = /(https?:\/\/[^\s]+\.(mp3|wav|ogg|m4a|aac))/i;
        const audioMatch = text.match(audioRegex);
        if (audioMatch) {
            return { type: 'audio', url: audioMatch[1] };
        }

        // Check for YouTube URLs
        const youtubeRegex = /(https?:\/\/(www\.)?(youtube\.com|youtu\.be)\/[^\s]+)/i;
        const youtubeMatch = text.match(youtubeRegex);
        if (youtubeMatch) {
            return { type: 'youtube', url: youtubeMatch[1] };
        }

        return null;
    }
}

// Timer Management
class TimerManager {
    constructor(gameState, updateCallback) {
        this.gameState = gameState;
        this.updateCallback = updateCallback;
    }

    startTimer() {
        this.gameState.timeRemaining = this.gameState.timerDuration;
        this.gameState.timerPaused = false;
        this.updateCallback();
        
        this.gameState.timer = setInterval(() => {
            if (!this.gameState.timerPaused) {
                this.gameState.timeRemaining--;
                this.updateCallback();
                
                if (this.gameState.timeRemaining <= 0) {
                    this.stopTimer();
                }
            }
        }, 1000);
    }

    pauseTimer() {
        this.gameState.timerPaused = true;
        this.updateCallback();
        this.updatePauseIndicator();
    }

    resumeTimer() {
        this.gameState.timerPaused = false;
        this.updateCallback();
        this.updatePauseIndicator();
    }

    updatePauseIndicator() {
        // Update pause indicators for both timers
        const timerCircles = document.querySelectorAll('.timer-circle');
        timerCircles.forEach(circle => {
            if (this.gameState.timerPaused) {
                circle.classList.add('paused');
            } else {
                circle.classList.remove('paused');
            }
        });
    }

    stopTimer() {
        if (this.gameState.timer) {
            clearInterval(this.gameState.timer);
            this.gameState.timer = null;
        }
        this.gameState.timerPaused = false;
        this.updatePauseIndicator();
    }

    resetTimer() {
        this.stopTimer();
        this.gameState.timeRemaining = 0;
        this.updateCallback();
    }

    getFormattedTime() {
        const minutes = Math.floor(this.gameState.timeRemaining / 60);
        const seconds = this.gameState.timeRemaining % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    isPaused() {
        return this.gameState.timerPaused;
    }
}

// UI Manager
class UIManager {
    constructor() {
        this.screens = {
            home: document.getElementById('home-screen'),
            game: document.getElementById('game-screen'),
            question: document.getElementById('question-screen'),
            answer: document.getElementById('answer-screen'),
            results: document.getElementById('results-screen')
        };
        
        this.currentMedia = null;
        this.currentAnswerMedia = null;
        
        this.elements = {
            // Home screen
            team1Name: document.getElementById('team1-name'),
            team2Name: document.getElementById('team2-name'),
            startGame: document.getElementById('start-game'),
            
            // Game screen (public display)
            currentTeamDisplay: document.getElementById('current-team-display'),
            team1Score: document.getElementById('team1-score'),
            team2Score: document.getElementById('team2-score'),
            team1Wrong: document.getElementById('team1-wrong'),
            team2Wrong: document.getElementById('team2-wrong'),
            team1NameDisplay: document.getElementById('team1-name-display'),
            team2NameDisplay: document.getElementById('team2-name-display'),
            team1ScoreDisplay: document.getElementById('team1-score-display'),
            team2ScoreDisplay: document.getElementById('team2-score-display'),
            currentQuestionNumber: document.getElementById('current-question-number'),
            totalQuestions: document.getElementById('total-questions'),
            timerDisplay: document.getElementById('timer-display'),
            pauseIndicator: document.getElementById('pause-indicator'),
            
            // Question screen (moderator)
            questionTeamDisplay: document.getElementById('question-team-display'),
            questionCategory: document.getElementById('question-category'),
            questionNumber: document.getElementById('question-number'),
            totalQuestionsDisplay: document.getElementById('total-questions-display'),
            timerDisplayQuestion: document.getElementById('timer-display-question'),
            pauseIndicatorQuestion: document.getElementById('pause-indicator-question'),
            pauseTimerBtn: document.getElementById('pause-timer-btn'),
            questionText: document.getElementById('question-text'),
            questionMedia: document.getElementById('question-media'),
            correctBtn: document.getElementById('correct-btn'),
            incorrectBtn: document.getElementById('incorrect-btn'),
            endGameBtn: document.getElementById('end-game-btn'),
            
            // Answer screen
            answerCategory: document.getElementById('answer-category'),
            answerQuestionText: document.getElementById('answer-question-text'),
            answerText: document.getElementById('answer-text'),
            answerMedia: document.getElementById('answer-media'),
            nextQuestionBtn: document.getElementById('next-question-btn'),
            
            // Results screen
            winnerTeam: document.getElementById('winner-team'),
            loserTeam: document.getElementById('loser-team'),
            winnerScore: document.getElementById('winner-score'),
            loserScore: document.getElementById('loser-score'),
            playAgainBtn: document.getElementById('play-again-btn'),
            newGameBtn: document.getElementById('new-game-btn')
        };
    }

    showScreen(screenName) {
        // Always hide all screens first
        Object.values(this.screens).forEach(screen => {
            screen.classList.remove('active');
        });
        
        // Show only the specified screen
        if (this.screens[screenName]) {
            this.screens[screenName].classList.add('active');
        }
    }

    showPublicDisplay() {
        // Show the public game screen (for audience display)
        this.showScreen('game');
    }

    updateHomeScreen(gameState) {
        this.elements.startGame.disabled = !gameState.team1Name || !gameState.team2Name || gameState.questions.length === 0;
    }

    updateGameScreen(gameState) {
        // Update team info
        const currentTeamName = gameState.currentTeam === 1 ? gameState.team1Name : gameState.team2Name;
        if (this.elements.currentTeamDisplay) {
            this.elements.currentTeamDisplay.textContent = `دور ${currentTeamName}`;
        }
        if (this.elements.questionTeamDisplay) {
            this.elements.questionTeamDisplay.textContent = `دور ${currentTeamName}`;
        }

        // Update team scores
        if (this.elements.team1Score) {
            this.elements.team1Score.textContent = gameState.team1Score;
        }
        if (this.elements.team2Score) {
            this.elements.team2Score.textContent = gameState.team2Score;
        }
        if (this.elements.team1Wrong) {
            this.elements.team1Wrong.textContent = gameState.team1Wrong;
        }
        if (this.elements.team2Wrong) {
            this.elements.team2Wrong.textContent = gameState.team2Wrong;
        }

        // Update team names
        if (this.elements.team1NameDisplay) {
            this.elements.team1NameDisplay.textContent = gameState.team1Name;
        }
        if (this.elements.team2NameDisplay) {
            this.elements.team2NameDisplay.textContent = gameState.team2Name;
        }

        // Update progress
        if (this.elements.currentQuestionNumber) {
            this.elements.currentQuestionNumber.textContent = gameState.totalQuestionsPlayed + 1;
        }
        if (this.elements.totalQuestions) {
            this.elements.totalQuestions.textContent = gameState.questions.length;
        }

        // Update timer
        if (this.elements.timerDisplay) {
            this.elements.timerDisplay.textContent = this.timerManager ? this.timerManager.getFormattedTime().replace(':', '') : '60';
        }

        // Update active team score display (highlight current team)
        if (this.elements.team1ScoreDisplay) {
            this.elements.team1ScoreDisplay.classList.toggle('active', gameState.currentTeam === 1);
        }
        if (this.elements.team2ScoreDisplay) {
            this.elements.team2ScoreDisplay.classList.toggle('active', gameState.currentTeam === 2);
        }
    }

    updateQuestionScreen(gameState) {
        // Update question info
        if (this.elements.questionNumber) {
            this.elements.questionNumber.textContent = gameState.totalQuestionsPlayed + 1;
        }
        if (this.elements.totalQuestionsDisplay) {
            this.elements.totalQuestionsDisplay.textContent = gameState.questions.length;
        }

        // Update timer
        if (this.elements.timerDisplayQuestion) {
            this.elements.timerDisplayQuestion.textContent = this.timerManager ? this.timerManager.getFormattedTime().replace(':', '') : '60';
        }

        // Update question
        if (gameState.questions.length > 0 && gameState.currentQuestionIndex < gameState.questions.length) {
            const question = gameState.questions[gameState.currentQuestionIndex];
            if (this.elements.questionCategory) {
                this.elements.questionCategory.textContent = question.category;
            }
            
            // Clean URLs from question text for display
            let displayText = question.text;
            if (question.media) {
                displayText = displayText.replace(question.media.url, '').trim();
            }
            if (this.elements.questionText) {
                this.elements.questionText.textContent = displayText;
            }
            
            // Update media
            this.updateMedia(question.media);
        }
    }

    updateMedia(media) {
        // Only update if media has changed
        if (this.currentMedia && this.currentMedia.url === media?.url) {
            return; // Media hasn't changed, don't recreate
        }
        
        this.elements.questionMedia.innerHTML = '';
        this.currentMedia = media;
        
        if (media) {
            if (media.type === 'image') {
                const img = document.createElement('img');
                img.src = media.url;
                img.alt = 'Question Image';
                img.style.maxWidth = '400px';
                img.style.maxHeight = '400px';
                img.style.width = 'auto';
                img.style.height = 'auto';
                img.style.objectFit = 'contain';
                img.onerror = () => {
                    console.log('Failed to load image:', media.url);
                    this.elements.questionMedia.innerHTML = '<p style="color: #e53e3e; text-align: center;">فشل في تحميل الصورة</p>';
                };
                this.elements.questionMedia.appendChild(img);
            } else if (media.type === 'video') {
                const video = document.createElement('video');
                video.src = media.url;
                video.controls = true;
                video.style.maxWidth = '100%';
                video.style.height = 'auto';
                video.onerror = () => {
                    console.log('Failed to load video:', media.url);
                    this.elements.questionMedia.innerHTML = '<p style="color: #e53e3e; text-align: center;">فشل في تحميل الفيديو</p>';
                };
                this.elements.questionMedia.appendChild(video);
            } else if (media.type === 'youtube') {
                // Convert YouTube URL to embed format
                let embedUrl = media.url;
                if (media.url.includes('youtu.be/')) {
                    const videoId = media.url.split('youtu.be/')[1].split('?')[0];
                    embedUrl = `https://www.youtube.com/embed/${videoId}`;
                } else if (media.url.includes('youtube.com/watch')) {
                    const videoId = media.url.split('v=')[1].split('&')[0];
                    embedUrl = `https://www.youtube.com/embed/${videoId}`;
                }
                
                const iframe = document.createElement('iframe');
                iframe.src = embedUrl;
                iframe.width = '560';
                iframe.height = '315';
                iframe.style.border = 'none';
                iframe.allowFullscreen = true;
                iframe.style.maxWidth = '100%';
                iframe.onerror = () => {
                    console.log('Failed to load YouTube video:', media.url);
                    this.elements.questionMedia.innerHTML = '<p style="color: #e53e3e; text-align: center;">فشل في تحميل فيديو يوتيوب</p>';
                };
                this.elements.questionMedia.appendChild(iframe);
            } else if (media.type === 'audio') {
                const audio = document.createElement('audio');
                audio.src = media.url;
                audio.controls = true;
                audio.preload = 'metadata';
                audio.style.maxWidth = '100%';
                audio.style.width = '100%';
                audio.style.pointerEvents = 'auto';
                audio.style.userSelect = 'auto';
                audio.style.touchAction = 'manipulation';
                audio.onerror = () => {
                    console.log('Failed to load audio:', media.url);
                    this.elements.questionMedia.innerHTML = '<p style="color: #e53e3e; text-align: center;">فشل في تحميل الملف الصوتي</p>';
                };
                this.elements.questionMedia.appendChild(audio);
            }
        }
    }

    updateAnswerScreen(gameState, isCorrect) {
        const question = gameState.questions[gameState.currentQuestionIndex];
        
        // Update question info
        if (this.elements.answerCategory) {
            this.elements.answerCategory.textContent = question.category;
        }
        
        // Clean URLs from question and answer text for display
        let displayQuestionText = question.text;
        let displayAnswerText = question.answer;
        if (question.media) {
            displayQuestionText = displayQuestionText.replace(question.media.url, '').trim();
            displayAnswerText = displayAnswerText.replace(question.media.url, '').trim();
        }
        
        if (this.elements.answerQuestionText) {
            this.elements.answerQuestionText.textContent = displayQuestionText;
        }
        if (this.elements.answerText) {
            this.elements.answerText.textContent = displayAnswerText;
        }
        
        // Update media
        this.updateAnswerMedia(question.media);
    }

    updateAnswerMedia(media) {
        // Only update if media has changed
        if (this.currentAnswerMedia && this.currentAnswerMedia.url === media?.url) {
            return; // Media hasn't changed, don't recreate
        }
        
        this.elements.answerMedia.innerHTML = '';
        this.currentAnswerMedia = media;
        
        if (media) {
            if (media.type === 'image') {
                const img = document.createElement('img');
                img.src = media.url;
                img.alt = 'Answer Image';
                img.style.maxWidth = '400px';
                img.style.maxHeight = '400px';
                img.style.width = 'auto';
                img.style.height = 'auto';
                img.style.objectFit = 'contain';
                img.onerror = () => {
                    console.log('Failed to load image:', media.url);
                    this.elements.answerMedia.innerHTML = '<p style="color: #e53e3e; text-align: center;">فشل في تحميل الصورة</p>';
                };
                this.elements.answerMedia.appendChild(img);
            } else if (media.type === 'video') {
                const video = document.createElement('video');
                video.src = media.url;
                video.controls = true;
                video.style.maxWidth = '100%';
                video.style.height = 'auto';
                video.onerror = () => {
                    console.log('Failed to load video:', media.url);
                    this.elements.answerMedia.innerHTML = '<p style="color: #e53e3e; text-align: center;">فشل في تحميل الفيديو</p>';
                };
                this.elements.answerMedia.appendChild(video);
            } else if (media.type === 'youtube') {
                // Convert YouTube URL to embed format
                let embedUrl = media.url;
                if (media.url.includes('youtu.be/')) {
                    const videoId = media.url.split('youtu.be/')[1].split('?')[0];
                    embedUrl = `https://www.youtube.com/embed/${videoId}`;
                } else if (media.url.includes('youtube.com/watch')) {
                    const videoId = media.url.split('v=')[1].split('&')[0];
                    embedUrl = `https://www.youtube.com/embed/${videoId}`;
                }
                
                const iframe = document.createElement('iframe');
                iframe.src = embedUrl;
                iframe.width = '560';
                iframe.height = '315';
                iframe.style.border = 'none';
                iframe.allowFullscreen = true;
                iframe.style.maxWidth = '100%';
                iframe.onerror = () => {
                    console.log('Failed to load YouTube video:', media.url);
                    this.elements.answerMedia.innerHTML = '<p style="color: #e53e3e; text-align: center;">فشل في تحميل فيديو يوتيوب</p>';
                };
                this.elements.answerMedia.appendChild(iframe);
            } else if (media.type === 'audio') {
                const audio = document.createElement('audio');
                audio.src = media.url;
                audio.controls = true;
                audio.preload = 'metadata';
                audio.style.maxWidth = '100%';
                audio.style.width = '100%';
                audio.style.pointerEvents = 'auto';
                audio.style.userSelect = 'auto';
                audio.style.touchAction = 'manipulation';
                audio.onerror = () => {
                    console.log('Failed to load audio:', media.url);
                    this.elements.answerMedia.innerHTML = '<p style="color: #e53e3e; text-align: center;">فشل في تحميل الملف الصوتي</p>';
                };
                this.elements.answerMedia.appendChild(audio);
            }
        }
    }

    updateResultsScreen(gameState) {
        // Determine winner
        let winner, loser, winnerScore, loserScore;
        if (gameState.team1Score > gameState.team2Score) {
            winner = gameState.team1Name;
            loser = gameState.team2Name;
            winnerScore = gameState.team1Score;
            loserScore = gameState.team2Score;
        } else if (gameState.team2Score > gameState.team1Score) {
            winner = gameState.team2Name;
            loser = gameState.team1Name;
            winnerScore = gameState.team2Score;
            loserScore = gameState.team1Score;
        } else {
            winner = 'تعادل';
            loser = 'تعادل';
            winnerScore = gameState.team1Score;
            loserScore = gameState.team2Score;
        }

        if (this.elements.winnerTeam) {
            this.elements.winnerTeam.textContent = winner;
        }
        if (this.elements.loserTeam) {
            this.elements.loserTeam.textContent = loser;
        }
        if (this.elements.winnerScore) {
            this.elements.winnerScore.textContent = winnerScore;
        }
        if (this.elements.loserScore) {
            this.elements.loserScore.textContent = loserScore;
        }
    }
}

// Game Controller
class GameController {
    constructor() {
        this.gameState = new GameState();
        this.uiManager = new UIManager();
        this.timerManager = new TimerManager(this.gameState, () => this.updateUI());
        this.uiManager.timerManager = this.timerManager;
        this.indicatorTimeout = null;
        
        this.initializeEventListeners();
        this.loadGameData();
    }

    loadGameData() {
        const savedData = localStorage.getItem('quickQAGameData');
        if (savedData) {
            try {
                const gameData = JSON.parse(savedData);
                if (gameData.questions && gameData.questions.length > 0) {
                    this.gameState.questions = gameData.questions;
                    this.uiManager.updateHomeScreen(this.gameState);
                }
            } catch (error) {
                console.log('Could not load saved game data:', error);
            }
        }
    }

    initializeEventListeners() {
        // Home screen events
        this.uiManager.elements.team1Name.addEventListener('input', () => {
            this.gameState.team1Name = this.uiManager.elements.team1Name.value;
            this.uiManager.updateHomeScreen(this.gameState);
        });

        this.uiManager.elements.team2Name.addEventListener('input', () => {
            this.gameState.team2Name = this.uiManager.elements.team2Name.value;
            this.uiManager.updateHomeScreen(this.gameState);
        });

        this.uiManager.elements.startGame.addEventListener('click', () => {
            this.startGame();
        });

        // Question screen events
        this.uiManager.elements.correctBtn.addEventListener('click', () => {
            this.handleAnswer(true);
        });

        this.uiManager.elements.incorrectBtn.addEventListener('click', () => {
            this.handleAnswer(false);
        });

        // End game button
        this.uiManager.elements.endGameBtn.addEventListener('click', () => {
            this.endGame();
        });

        // Pause timer button
        this.uiManager.elements.pauseTimerBtn.addEventListener('click', () => {
            this.toggleTimer();
        });

        // Next question button
        this.uiManager.elements.nextQuestionBtn.addEventListener('click', () => {
            this.moveToNextQuestion();
        });


        // Results screen events
        this.uiManager.elements.playAgainBtn.addEventListener('click', () => {
            this.playAgain();
        });

        this.uiManager.elements.newGameBtn.addEventListener('click', () => {
            this.newGame();
        });

        // Add keyboard shortcut to toggle between moderator and public view
        document.addEventListener('keydown', (event) => {
            if (event.key === 'F11' || event.key === 'F12') {
                event.preventDefault();
                this.toggleDisplayMode();
            }
        });
    }

    startGame() {
        if (this.gameState.questions.length === 0) return;

        this.gameState.gameStarted = true;
        this.gameState.currentTeam = 1;
        this.gameState.totalQuestionsPlayed = 0;
        
        // Save state
        this.gameState.saveState();
        
        // Show only the question screen for the moderator
        this.uiManager.showScreen('question');
        
        // Show indicator when game starts
        this.showIndicator();
        
        // Update UI immediately to show initial team
        this.updateUI();
        
        // Get first random question
        this.nextQuestion();
    }

    nextQuestion() {
        const question = this.gameState.getRandomQuestion();
        
        if (!question) {
            this.endGame();
            return;
        }

        // Switch back to question screen
        this.uiManager.showScreen('question');
        
        this.timerManager.startTimer();
        this.updateUI();
    }

    handleAnswer(isCorrect) {
        this.timerManager.stopTimer();
        
        if (isCorrect) {
            if (this.gameState.currentTeam === 1) {
                this.gameState.team1Score++;
            } else {
                this.gameState.team2Score++;
            }
            this.gameState.totalCorrectAnswers++;
        } else if (this.gameState.currentTeam === 1) {
            this.gameState.team1Wrong++;
        } else {
            this.gameState.team2Wrong++;
        }

        // Increment questions played after answering
        this.gameState.totalQuestionsPlayed++;
        
        // Save state
        this.gameState.saveState();
        
        // Update UI to show new scores immediately
        this.updateUI();
        
        // Show answer screen
        this.showAnswerScreen(isCorrect);
    }

    showAnswerScreen(isCorrect) {
        // Update answer screen with current question and result
        this.uiManager.updateAnswerScreen(this.gameState, isCorrect);
        
        // Show answer screen
        this.uiManager.showScreen('answer');
    }

    moveToNextQuestion() {
        // Switch teams
        this.gameState.currentTeam = this.gameState.currentTeam === 1 ? 2 : 1;
        
        // Move to next question
        this.nextQuestion();
    }

    toggleTimer() {
        if (this.timerManager.isPaused()) {
            this.timerManager.resumeTimer();
            this.uiManager.elements.pauseTimerBtn.innerHTML = '<span>⏸️ إيقاف</span>';
        } else {
            this.timerManager.pauseTimer();
            this.uiManager.elements.pauseTimerBtn.innerHTML = '<span>▶️ استئناف</span>';
        }
        this.updateUI();
    }

    endGame() {
        this.timerManager.stopTimer();
        this.gameState.clearState(); // Clear saved state when game ends
        this.uiManager.showScreen('results');
        this.uiManager.updateResultsScreen(this.gameState);
    }

    playAgain() {
        // Reset game state but keep team names and questions
        const team1Name = this.gameState.team1Name;
        const team2Name = this.gameState.team2Name;
        const questions = this.gameState.questions;
        
        this.gameState.reset();
        this.gameState.team1Name = team1Name;
        this.gameState.team2Name = team2Name;
        this.gameState.questions = questions;
        
        this.startGame();
    }

    newGame() {
        this.gameState.reset();
        this.uiManager.elements.team1Name.value = '';
        this.uiManager.elements.team2Name.value = '';
        this.uiManager.showScreen('home');
        this.uiManager.updateHomeScreen(this.gameState);
    }

    showIndicator() {
        // Clear any existing timeout first
        if (this.indicatorTimeout) {
            clearTimeout(this.indicatorTimeout);
            this.indicatorTimeout = null;
        }
        
        // Find the currently active screen and show its indicator
        const activeScreen = document.querySelector('.screen.active');
        if (activeScreen) {
            const indicator = activeScreen.querySelector('.display-mode-indicator');
            if (indicator) {
                console.log('Showing indicator for active screen');
                indicator.style.display = 'block';
                indicator.style.opacity = '1';
                
                // Set new timeout to hide after 20 seconds
                this.indicatorTimeout = setTimeout(() => {
                    console.log('Auto-hiding indicator after 20 seconds');
                    this.hideIndicator();
                }, 20000);
                console.log('Timeout set for 20 seconds');
            } else {
                console.log('Indicator element not found in active screen');
            }
        } else {
            console.log('No active screen found');
        }
    }

    hideIndicator() {
        const indicators = document.querySelectorAll('.display-mode-indicator');
        console.log('Found', indicators.length, 'indicator elements');
        
        if (indicators.length > 0) {
            console.log('Hiding all indicators');
            indicators.forEach((indicator, index) => {
                console.log(`Indicator ${index + 1} current display:`, indicator.style.display);
                console.log(`Indicator ${index + 1} current opacity:`, indicator.style.opacity);
                indicator.style.opacity = '0';
            });
            
            setTimeout(() => {
                indicators.forEach((indicator, index) => {
                    indicator.style.display = 'none';
                    console.log(`Indicator ${index + 1} hidden - display set to none`);
                });
                console.log('All indicators hidden');
            }, 300); // Wait for fade out animation
        } else {
            console.log('No indicator elements found');
        }
    }

    toggleDisplayMode() {
        // Toggle between question screen (moderator) and game screen (public)
        if (this.gameState.gameStarted) {
            const currentScreen = document.querySelector('.screen.active');
            if (currentScreen && currentScreen.id === 'question-screen') {
                this.uiManager.showPublicDisplay();
            } else {
                this.uiManager.showScreen('question');
            }
            // Show indicator when toggling
            this.showIndicator();
        }
    }

    // Method to manually hide indicator (can be called if needed)
    forceHideIndicator() {
        if (this.indicatorTimeout) {
            clearTimeout(this.indicatorTimeout);
            this.indicatorTimeout = null;
        }
        this.hideIndicator();
    }

    // Test method with shorter timeout for debugging
    showIndicatorTest() {
        const indicator = document.querySelector('.display-mode-indicator');
        if (indicator) {
            console.log('Showing indicator for test (5 seconds)');
            // Clear any existing timeout first
            if (this.indicatorTimeout) {
                clearTimeout(this.indicatorTimeout);
                this.indicatorTimeout = null;
            }
            
            // Show the indicator
            indicator.style.display = 'block';
            indicator.style.opacity = '1';
            
            // Set new timeout to hide after 5 seconds for testing
            this.indicatorTimeout = setTimeout(() => {
                console.log('Auto-hiding indicator after 5 seconds (test)');
                this.hideIndicator();
            }, 5000);
            console.log('Test timeout set for 5 seconds');
        } else {
            console.log('Indicator element not found for test');
        }
    }

    updateUI() {
        this.uiManager.updateGameScreen(this.gameState);
        this.uiManager.updateQuestionScreen(this.gameState);
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    // Initialize the game controller to start the application
    window.gameController = new GameController();
    
    // Restore game state if game was in progress
    if (window.gameController.gameState.gameStarted) {
        // Show only the question screen for the moderator
        window.gameController.uiManager.showScreen('question');
        window.gameController.updateUI();
        // Show indicator when reloading with active game
        window.gameController.showIndicator();
    } else {
        window.gameController.uiManager.showScreen('home');
        window.gameController.uiManager.updateHomeScreen(window.gameController.gameState);
    }
});
