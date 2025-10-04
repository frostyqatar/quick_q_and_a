// Admin Page Controller
class AdminController {
    constructor() {
        this.elements = {
            questionsInput: document.getElementById('questions-input'),
            questionsCount: document.getElementById('questions-count'),
            saveQuestions: document.getElementById('save-questions')
        };
        
        this.initializeEventListeners();
        this.loadSavedQuestions();
    }

    initializeEventListeners() {
        this.elements.questionsInput.addEventListener('input', () => {
            this.updateQuestionsPreview();
        });

        this.elements.saveQuestions.addEventListener('click', () => {
            this.saveQuestions();
        });
    }

    updateQuestionsPreview() {
        const text = this.elements.questionsInput.value;
        const questions = this.parseQuestions(text);
        
        this.elements.questionsCount.textContent = questions.length;
        this.elements.saveQuestions.disabled = questions.length === 0;
    }

    parseQuestions(text) {
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
                    // Remove URL from question text
                    currentQuestion.text = line.replace(mediaMatch.url, '').trim();
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
                        // Remove URL from answer text
                        currentQuestion.answer = line.replace(mediaMatch.url, '').trim();
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

    isMediaUrl(text) {
        return text.startsWith('http://') || text.startsWith('https://');
    }

    isCommonAnswerWord(text) {
        // Common answer words that should not be treated as categories
        const commonAnswers = ['earth', 'oxygen', 'fahad', 'water', 'fire', 'air', 'sun', 'moon', 'star', 'planet', 'animal', 'plant', 'tree', 'flower', 'bird', 'fish', 'dog', 'cat', 'horse', 'cow', 'sheep', 'goat', 'chicken', 'duck', 'pig', 'lion', 'tiger', 'elephant', 'bear', 'wolf', 'fox', 'rabbit', 'mouse', 'snake', 'frog', 'spider', 'ant', 'bee', 'butterfly', 'dragonfly', 'mosquito', 'fly', 'beetle', 'ladybug', 'grasshopper', 'cricket', 'cicada', 'moth', 'wasp', 'hornet', 'yellowjacket', 'bumblebee', 'honeybee', 'waxwing', 'cardinal', 'robin', 'sparrow', 'finch', 'wren', 'thrush', 'mockingbird', 'bluebird', 'jay', 'crow', 'raven', 'magpie', 'starling', 'blackbird', 'thrush', 'warbler', 'vireo', 'tanager', 'grosbeak', 'bunting', 'sparrow', 'junco', 'towhee', 'cardinal', 'grosbeak', 'bunting', 'sparrow', 'junco', 'towhee', 'cardinal', 'grosbeak', 'bunting', 'sparrow', 'junco', 'towhee'];
        return commonAnswers.includes(text.toLowerCase());
    }

    extractMedia(text) {
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

    saveQuestions() {
        const text = this.elements.questionsInput.value;
        const questions = this.parseQuestions(text);
        
        if (questions.length === 0) {
            alert('يرجى إدخال أسئلة صحيحة');
            return;
        }

        // Save questions to localStorage
        const gameData = {
            questions: questions,
            timestamp: Date.now()
        };
        
        localStorage.setItem('quickQAGameData', JSON.stringify(gameData));
        
        // Redirect to main game page
        window.location.href = 'index.html';
    }

    loadSavedQuestions() {
        const savedData = localStorage.getItem('quickQAGameData');
        if (savedData) {
            try {
                const gameData = JSON.parse(savedData);
                if (gameData.questions && gameData.questions.length > 0) {
                    // Reconstruct the text from saved questions
                    let text = '';
                    let currentCategory = '';
                    
                    for (const question of gameData.questions) {
                        if (question.category !== currentCategory) {
                            currentCategory = question.category;
                            text += currentCategory + '\n';
                        }
                        
                        // Add question text (clean, without URLs)
                        text += question.text + '\n';
                        
                        // Add answer text (clean, without URLs)
                        text += question.answer + '\n';
                        
                        // Add media URL on separate line if it exists
                        if (question.media?.url) {
                            text += question.media.url + '\n';
                        }
                        
                        text += '\n'; // Empty line between questions
                    }
                    
                    this.elements.questionsInput.value = text;
                    this.updateQuestionsPreview();
                }
            } catch (error) {
                console.log('Could not load saved questions:', error);
            }
        }
    }
}

// Initialize admin controller when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.adminController = new AdminController();
});
