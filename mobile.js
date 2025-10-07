// Mobile-Optimized JavaScript for Quick Q&A Game
// Touch-optimized interactions and mobile-specific features

// Game State Management (Mobile Version)
class MobileGameState {
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
        this.usedQuestions = new Set();
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
            questions: this.questions,
            usedQuestions: Array.from(this.usedQuestions)
        };
        localStorage.setItem('mobileGameState', JSON.stringify(state));
    }

    loadState() {
        const savedState = localStorage.getItem('mobileGameState');
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
                this.usedQuestions = new Set(state.usedQuestions || []);
            } catch (e) {
                console.error('Error loading mobile game state:', e);
            }
        }
    }

    clearState() {
        localStorage.removeItem('mobileGameState');
    }

    getRandomQuestion() {
        if (this.usedQuestions.size >= this.questions.length) {
            return null;
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

// Question Parser (Reuse from main script)
class QuestionParser {
    static parseQuestions(text) {
        const lines = text.split('\n').map(line => line.trim()).filter(line => line);
        const questions = [];
        let currentCategory = '';
        let currentQuestion = null;

        for (const line of lines) {
            if (line && !line.includes('؟') && !line.includes('؟') && !line.includes('.') && !line.startsWith('http') && 
                !this.isCommonAnswerWord(line)) {
                currentCategory = line;
                continue;
            }

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
                
                const mediaMatch = this.extractMedia(line);
                if (mediaMatch) {
                    currentQuestion.media = mediaMatch;
                }
            }
            else if (currentQuestion && !currentQuestion.answer) {
                currentQuestion.answer = line;
                
                if (!currentQuestion.media) {
                    const mediaMatch = this.extractMedia(line);
                    if (mediaMatch) {
                        currentQuestion.media = mediaMatch;
                    }
                }
            }
            else if (currentQuestion && this.isMediaUrl(line)) {
                if (!currentQuestion.media) {
                    const mediaMatch = this.extractMedia(line);
                    if (mediaMatch) {
                        currentQuestion.media = mediaMatch;
                    }
                }
            }
        }

        if (currentQuestion) {
            questions.push(currentQuestion);
        }

        return questions;
    }

    static isMediaUrl(text) {
        return text.startsWith('http://') || text.startsWith('https://');
    }

    static isCommonAnswerWord(text) {
        const commonAnswers = ['earth', 'oxygen', 'fahad', 'water', 'fire', 'air', 'sun', 'moon', 'star', 'planet'];
        return commonAnswers.includes(text.toLowerCase());
    }

    static extractMedia(text) {
        const imageRegex = /(https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp))/i;
        const imageMatch = text.match(imageRegex);
        if (imageMatch) {
            return { type: 'image', url: imageMatch[1] };
        }

        const videoRegex = /(https?:\/\/[^\s]+\.(mp4|webm|ogg|avi|mov))/i;
        const videoMatch = text.match(videoRegex);
        if (videoMatch) {
            return { type: 'video', url: videoMatch[1] };
        }

        const audioRegex = /(https?:\/\/[^\s]+\.(mp3|wav|ogg|m4a|aac))/i;
        const audioMatch = text.match(audioRegex);
        if (audioMatch) {
            return { type: 'audio', url: audioMatch[1] };
        }

        const youtubeRegex = /(https?:\/\/(www\.)?(youtube\.com|youtu\.be)\/[^\s]+)/i;
        const youtubeMatch = text.match(youtubeRegex);
        if (youtubeMatch) {
            return { type: 'youtube', url: youtubeMatch[1] };
        }

        return null;
    }
}

// Mobile Timer Management
class MobileTimerManager {
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
    }

    resumeTimer() {
        this.gameState.timerPaused = false;
        this.updateCallback();
    }

    stopTimer() {
        if (this.gameState.timer) {
            clearInterval(this.gameState.timer);
            this.gameState.timer = null;
        }
        this.gameState.timerPaused = false;
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

// Mobile UI Manager
class MobileUIManager {
    constructor() {
        this.screens = {
            home: document.getElementById('home-screen'),
            game: document.getElementById('game-screen-mobile'),
            question: document.getElementById('question-screen-mobile'),
            answer: document.getElementById('answer-screen-mobile'),
            results: document.getElementById('results-screen-mobile')
        };
        
        this.currentMedia = null;
        
        this.elements = {
            // Home screen
            team1Name: document.getElementById('team1-name-mobile'),
            team2Name: document.getElementById('team2-name-mobile'),
            startGame: document.getElementById('start-game-mobile'),
            
            // Game screen (public display)
            currentTeamDisplay: document.getElementById('current-team-display-mobile'),
            team1Score: document.getElementById('team1-score-mobile'),
            team2Score: document.getElementById('team2-score-mobile'),
            team1Wrong: document.getElementById('team1-wrong-mobile'),
            team2Wrong: document.getElementById('team2-wrong-mobile'),
            team1NameDisplay: document.getElementById('team1-name-display-mobile'),
            team2NameDisplay: document.getElementById('team2-name-display-mobile'),
            team1ScoreDisplay: document.getElementById('team1-score-display-mobile'),
            team2ScoreDisplay: document.getElementById('team2-score-display-mobile'),
            currentQuestionNumber: document.getElementById('current-question-number-mobile'),
            totalQuestions: document.getElementById('total-questions-mobile'),
            timerDisplay: document.getElementById('timer-display-mobile'),
            
            // Question screen (moderator)
            questionTeamDisplay: document.getElementById('question-team-display-mobile'),
            questionCategory: document.getElementById('question-category-mobile'),
            questionNumber: document.getElementById('question-number-mobile'),
            totalQuestionsDisplay: document.getElementById('total-questions-display-mobile'),
            timerDisplayQuestion: document.getElementById('timer-display-question-mobile'),
            pauseTimerBtn: document.getElementById('pause-timer-btn-mobile'),
            questionText: document.getElementById('question-text-mobile'),
            questionMedia: document.getElementById('question-media-mobile'),
            correctBtn: document.getElementById('correct-btn-mobile'),
            incorrectBtn: document.getElementById('incorrect-btn-mobile'),
            endGameBtn: document.getElementById('end-game-btn-mobile'),
            
            // Answer screen
            answerCategory: document.getElementById('answer-category-mobile'),
            answerQuestionText: document.getElementById('answer-question-text-mobile'),
            answerText: document.getElementById('answer-text-mobile'),
            nextQuestionBtn: document.getElementById('next-question-btn-mobile'),
            
            // Question scoreboard
            scoreboardTeam1Name: document.getElementById('scoreboard-team1-name-mobile'),
            scoreboardTeam2Name: document.getElementById('scoreboard-team2-name-mobile'),
            scoreboardTeam1Score: document.getElementById('scoreboard-team1-correct-mobile'),
            scoreboardTeam2Score: document.getElementById('scoreboard-team2-correct-mobile'),
            scoreboardTeam1: document.getElementById('scoreboard-team1-mobile'),
            scoreboardTeam2: document.getElementById('scoreboard-team2-mobile'),
            
            // Results screen
            winnerTeam: document.getElementById('winner-team-mobile'),
            loserTeam: document.getElementById('loser-team-mobile'),
            winnerScore: document.getElementById('winner-score-mobile'),
            loserScore: document.getElementById('loser-score-mobile'),
            playAgainBtn: document.getElementById('play-again-btn-mobile'),
            newGameBtn: document.getElementById('new-game-btn-mobile'),
            
            // Modal elements
            noQuestionsModal: document.getElementById('no-questions-modal-mobile'),
            modalClose: document.querySelector('.modal-close-mobile'),
            modalCloseBtn: document.querySelector('.modal-close-btn-mobile')
        };
    }

    showScreen(screenName) {
        Object.values(this.screens).forEach(screen => {
            screen.classList.remove('active');
        });
        
        if (this.screens[screenName]) {
            this.screens[screenName].classList.add('active');
        }
    }

    showPublicDisplay() {
        this.showScreen('game');
    }

    updateHomeScreen(gameState) {
        this.elements.startGame.disabled = !gameState.team1Name || !gameState.team2Name;
    }

    updateGameScreen(gameState) {
        const currentTeamName = gameState.currentTeam === 1 ? gameState.team1Name : gameState.team2Name;
        if (this.elements.currentTeamDisplay) {
            this.elements.currentTeamDisplay.textContent = `دور ${currentTeamName}`;
        }
        if (this.elements.questionTeamDisplay) {
            this.elements.questionTeamDisplay.textContent = `دور ${currentTeamName}`;
        }

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

        if (this.elements.team1NameDisplay) {
            this.elements.team1NameDisplay.textContent = gameState.team1Name;
        }
        if (this.elements.team2NameDisplay) {
            this.elements.team2NameDisplay.textContent = gameState.team2Name;
        }

        if (this.elements.currentQuestionNumber) {
            this.elements.currentQuestionNumber.textContent = gameState.totalQuestionsPlayed + 1;
        }
        if (this.elements.totalQuestions) {
            this.elements.totalQuestions.textContent = gameState.questions.length;
        }

        if (this.elements.timerDisplay) {
            this.elements.timerDisplay.textContent = this.timerManager ? this.timerManager.getFormattedTime().replace(':', '') : '60';
        }

        if (this.elements.team1ScoreDisplay) {
            this.elements.team1ScoreDisplay.classList.toggle('active', gameState.currentTeam === 1);
        }
        if (this.elements.team2ScoreDisplay) {
            this.elements.team2ScoreDisplay.classList.toggle('active', gameState.currentTeam === 2);
        }
    }

    updateQuestionScreen(gameState) {
        if (this.elements.questionNumber) {
            this.elements.questionNumber.textContent = gameState.totalQuestionsPlayed + 1;
        }
        if (this.elements.totalQuestionsDisplay) {
            this.elements.totalQuestionsDisplay.textContent = gameState.questions.length;
        }

        if (this.elements.timerDisplayQuestion) {
            this.elements.timerDisplayQuestion.textContent = this.timerManager ? this.timerManager.getFormattedTime().replace(':', '') : '60';
        }

        this.updateScoreboard(gameState);

        if (gameState.questions.length > 0 && gameState.currentQuestionIndex < gameState.questions.length) {
            const question = gameState.questions[gameState.currentQuestionIndex];
            if (this.elements.questionCategory) {
                this.elements.questionCategory.textContent = question.category;
            }
            
            let displayText = question.text;
            if (question.media) {
                displayText = displayText.replace(question.media.url, '').trim();
            }
            if (this.elements.questionText) {
                this.elements.questionText.textContent = displayText;
            }
            
            this.updateMedia(question.media);
        }
    }

    updateScoreboard(gameState) {
        if (this.elements.scoreboardTeam1Name) {
            this.elements.scoreboardTeam1Name.textContent = gameState.team1Name;
        }
        if (this.elements.scoreboardTeam2Name) {
            this.elements.scoreboardTeam2Name.textContent = gameState.team2Name;
        }

        if (this.elements.scoreboardTeam1Score) {
            this.elements.scoreboardTeam1Score.textContent = gameState.team1Score;
        }
        if (this.elements.scoreboardTeam2Score) {
            this.elements.scoreboardTeam2Score.textContent = gameState.team2Score;
        }

        if (this.elements.scoreboardTeam1) {
            this.elements.scoreboardTeam1.classList.toggle('active', gameState.currentTeam === 1);
        }
        if (this.elements.scoreboardTeam2) {
            this.elements.scoreboardTeam2.classList.toggle('active', gameState.currentTeam === 2);
        }
    }

    updateMedia(media) {
        if (this.currentMedia && this.currentMedia.url === media?.url) {
            return;
        }
        
        this.elements.questionMedia.innerHTML = '';
        this.elements.questionMedia.classList.remove('audio-container');
        this.currentMedia = media;
        
        if (media) {
            if (media.type === 'image') {
                const img = document.createElement('img');
                img.src = media.url;
                img.alt = 'Question Image';
                img.onerror = () => {
                    this.elements.questionMedia.innerHTML = '<p style="color: #e53e3e; text-align: center;">فشل في تحميل الصورة</p>';
                };
                img.onclick = () => {
                    this.showImageModal(media.url);
                };
                this.elements.questionMedia.appendChild(img);
            } else if (media.type === 'video') {
                const video = document.createElement('video');
                video.src = media.url;
                video.controls = true;
                video.style.maxWidth = '100%';
                video.style.height = 'auto';
                video.onerror = () => {
                    this.elements.questionMedia.innerHTML = '<p style="color: #e53e3e; text-align: center;">فشل في تحميل الفيديو</p>';
                };
                this.elements.questionMedia.appendChild(video);
            } else if (media.type === 'youtube') {
                let embedUrl = media.url;
                if (media.url.includes('youtu.be/')) {
                    const videoId = media.url.split('youtu.be/')[1].split('?')[0];
                    embedUrl = `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&fs=1&cc_load_policy=1`;
                } else if (media.url.includes('youtube.com/watch')) {
                    const videoId = media.url.split('v=')[1].split('&')[0];
                    embedUrl = `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&fs=1&cc_load_policy=1`;
                }
                
                const iframe = document.createElement('iframe');
                iframe.src = embedUrl;
                iframe.width = '100%';
                iframe.height = '200';
                iframe.style.border = 'none';
                iframe.allowFullscreen = true;
                iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
                iframe.setAttribute('frameborder', '0');
                iframe.setAttribute('title', 'YouTube video player');
                
                iframe.onerror = () => {
                    this.elements.questionMedia.innerHTML = `
                        <div style="text-align: center; padding: 20px; background: #f8f9fa; border-radius: 10px; border: 2px solid #e53e3e;">
                            <p style="color: #e53e3e; margin-bottom: 15px; font-size: 1.1rem;">فشل في تحميل فيديو يوتيوب</p>
                            <a href="${media.url}" target="_blank" style="color: #667eea; text-decoration: none; font-weight: 600;">
                                انقر هنا لمشاهدة الفيديو على يوتيوب
                            </a>
                        </div>
                    `;
                };
                
                this.elements.questionMedia.appendChild(iframe);
            } else if (media.type === 'audio') {
                this.elements.questionMedia.classList.add('audio-container');
                
                const audio = document.createElement('audio');
                audio.src = media.url;
                audio.controls = true;
                audio.preload = 'metadata';
                audio.style.maxWidth = '100%';
                audio.style.width = '100%';
                
                audio.onerror = () => {
                    this.elements.questionMedia.innerHTML = '<p style="color: #e53e3e; text-align: center;">فشل في تحميل الملف الصوتي</p>';
                };
                
                this.elements.questionMedia.appendChild(audio);
            }
        }
    }

    updateAnswerScreen(gameState, isCorrect) {
        const question = gameState.questions[gameState.currentQuestionIndex];
        
        if (this.elements.answerCategory) {
            this.elements.answerCategory.textContent = question.category;
        }
        
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
    }

    updateResultsScreen(gameState) {
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

    showImageModal(imageUrl) {
        const modal = document.getElementById('image-modal-mobile');
        const modalImage = document.getElementById('modal-image-mobile');
        const closeBtn = document.querySelector('.image-modal-close-mobile');
        
        if (modal && modalImage) {
            modalImage.src = imageUrl;
            modal.classList.add('active');
            
            if (closeBtn) {
                closeBtn.onclick = () => this.hideImageModal();
            }
            
            modal.onclick = (e) => {
                if (e.target === modal) {
                    this.hideImageModal();
                }
            };
        }
    }

    hideImageModal() {
        const modal = document.getElementById('image-modal-mobile');
        if (modal) {
            modal.classList.remove('active');
        }
    }

    showNoQuestionsModal() {
        if (this.elements.noQuestionsModal) {
            this.elements.noQuestionsModal.classList.add('active');
        }
    }

    hideNoQuestionsModal() {
        if (this.elements.noQuestionsModal) {
            this.elements.noQuestionsModal.classList.remove('active');
        }
    }
}

// Mobile Game Controller
class MobileGameController {
    constructor() {
        this.gameState = new MobileGameState();
        this.uiManager = new MobileUIManager();
        this.timerManager = new MobileTimerManager(this.gameState, () => this.updateUI());
        this.uiManager.timerManager = this.timerManager;
        
        this.initializeEventListeners();
        this.loadGameData();
        this.setupMobileFeatures();
    }

    setupMobileFeatures() {
        // Prevent zoom on double tap
        let lastTouchEnd = 0;
        document.addEventListener('touchend', function (event) {
            const now = (new Date()).getTime();
            if (now - lastTouchEnd <= 300) {
                event.preventDefault();
            }
            lastTouchEnd = now;
        }, false);

        // Prevent context menu on long press
        document.addEventListener('contextmenu', function(e) {
            e.preventDefault();
        });

        // Handle orientation change
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.updateUI();
            }, 100);
        });

        // Handle viewport changes
        window.addEventListener('resize', () => {
            this.updateUI();
        });
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

        this.uiManager.elements.endGameBtn.addEventListener('click', () => {
            this.endGame();
        });

        this.uiManager.elements.pauseTimerBtn.addEventListener('click', () => {
            this.toggleTimer();
        });

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

        // Modal close event listeners
        if (this.uiManager.elements.modalClose) {
            this.uiManager.elements.modalClose.addEventListener('click', () => {
                this.uiManager.hideNoQuestionsModal();
            });
        }

        if (this.uiManager.elements.modalCloseBtn) {
            this.uiManager.elements.modalCloseBtn.addEventListener('click', () => {
                this.uiManager.hideNoQuestionsModal();
            });
        }

        if (this.uiManager.elements.noQuestionsModal) {
            this.uiManager.elements.noQuestionsModal.addEventListener('click', (e) => {
                if (e.target === this.uiManager.elements.noQuestionsModal) {
                    this.uiManager.hideNoQuestionsModal();
                }
            });
        }

        // Add touch events for better mobile interaction
        this.addTouchEvents();
    }

    addTouchEvents() {
        // Add haptic feedback for supported devices
        const buttons = document.querySelectorAll('.btn-mobile');
        buttons.forEach(button => {
            button.addEventListener('touchstart', () => {
                if (navigator.vibrate) {
                    navigator.vibrate(50); // Short vibration
                }
            });
        });

        // Add swipe gestures for navigation
        let startX = 0;
        let startY = 0;
        
        document.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        });

        document.addEventListener('touchend', (e) => {
            if (!startX || !startY) return;
            
            const endX = e.changedTouches[0].clientX;
            const endY = e.changedTouches[0].clientY;
            
            const diffX = startX - endX;
            const diffY = startY - endY;
            
            // Only trigger if horizontal swipe is more significant than vertical
            if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
                if (diffX > 0) {
                    // Swipe left - could be used for next question
                    console.log('Swipe left detected');
                } else {
                    // Swipe right - could be used for previous question
                    console.log('Swipe right detected');
                }
            }
            
            startX = 0;
            startY = 0;
        });
    }

    startGame() {
        if (this.gameState.questions.length === 0) {
            this.uiManager.showNoQuestionsModal();
            return;
        }

        this.gameState.gameStarted = true;
        this.gameState.currentTeam = 1;
        this.gameState.totalQuestionsPlayed = 0;
        
        this.gameState.saveState();
        this.uiManager.showScreen('question');
        this.updateUI();
        this.nextQuestion();
    }

    nextQuestion() {
        if (this.gameState.totalQuestionsPlayed >= this.gameState.questions.length) {
            this.endGame();
            return;
        }
        
        const question = this.gameState.getRandomQuestion();
        
        if (!question) {
            this.endGame();
            return;
        }

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

        this.gameState.totalQuestionsPlayed++;
        this.gameState.saveState();
        this.updateUI();
        this.showAnswerScreen(isCorrect);
    }

    showAnswerScreen(isCorrect) {
        this.uiManager.updateAnswerScreen(this.gameState, isCorrect);
        this.uiManager.showScreen('answer');
    }

    moveToNextQuestion() {
        this.gameState.currentTeam = this.gameState.currentTeam === 1 ? 2 : 1;
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
        this.gameState.clearState();
        this.uiManager.showScreen('results');
        this.uiManager.updateResultsScreen(this.gameState);
    }

    playAgain() {
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

    updateUI() {
        this.uiManager.updateGameScreen(this.gameState);
        this.uiManager.updateQuestionScreen(this.gameState);
    }
}

// Initialize the mobile game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.mobileGameController = new MobileGameController();
    
    if (window.mobileGameController.gameState.gameStarted) {
        window.mobileGameController.uiManager.showScreen('question');
        window.mobileGameController.updateUI();
    } else {
        window.mobileGameController.uiManager.showScreen('home');
        window.mobileGameController.uiManager.updateHomeScreen(window.mobileGameController.gameState);
    }
});
