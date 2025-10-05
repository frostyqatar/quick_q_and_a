// Admin Page Controller
class AdminController {
    constructor() {
        this.elements = {
            questionsInput: document.getElementById('questions-input'),
            questionsCount: document.getElementById('questions-count'),
            saveQuestions: document.getElementById('save-questions'),
            chatgptButton: document.getElementById('chatgpt-questions'),
            chatgptModal: document.getElementById('chatgpt-modal'),
            chatgptModalClose: document.getElementById('chatgpt-modal-close'),
            categoriesInput: document.getElementById('categories-input'),
            chatgptPrompt: document.getElementById('chatgpt-prompt'),
            copyPromptBtn: document.getElementById('copy-prompt'),
            chatgptResult: document.getElementById('chatgpt-result'),
            useResultBtn: document.getElementById('use-result'),
            cancelChatGPTBtn: document.getElementById('cancel-chatgpt'),
            selectAllCategories: document.getElementById('select-all-categories'),
            clearCategories: document.getElementById('clear-categories')
        };
        
        this.selectedCategories = new Set();
        
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

        // ChatGPT modal event listeners
        this.elements.chatgptButton.addEventListener('click', () => {
            this.showChatGPTModal();
        });

        this.elements.chatgptModalClose.addEventListener('click', () => {
            this.hideChatGPTModal();
        });

        this.elements.categoriesInput.addEventListener('input', () => {
            this.updateChatGPTPrompt();
        });

        this.elements.copyPromptBtn.addEventListener('click', () => {
            this.copyPromptToClipboard();
        });

        this.elements.useResultBtn.addEventListener('click', () => {
            this.useChatGPTResult();
        });

        this.elements.cancelChatGPTBtn.addEventListener('click', () => {
            this.cancelChatGPTModal();
        });

        // Close modal when clicking outside
        this.elements.chatgptModal.addEventListener('click', (e) => {
            if (e.target === this.elements.chatgptModal) {
                this.hideChatGPTModal();
            }
        });

        // Category selection event listeners
        this.elements.selectAllCategories.addEventListener('click', () => {
            this.selectAllCategories();
        });

        this.elements.clearCategories.addEventListener('click', () => {
            this.clearAllCategories();
        });

        // Add click listeners to category boxes
        this.initializeCategoryBoxes();
    }

    updateQuestionsPreview() {
        const text = this.elements.questionsInput.value;
        const questions = this.parseQuestions(text);
        
        this.elements.questionsCount.textContent = questions.length;
        this.elements.saveQuestions.disabled = questions.length === 0;
    }

    parseQuestions(text) {
        // Clean the input text first
        const cleanedText = this.cleanSpecialCharacters(text);
        
        // Only do basic validation, not strict validation
        if (!text || text.trim().length === 0) {
            return [];
        }

        const lines = cleanedText.split('\n').map(line => line.trim()).filter(line => line);
        const questions = [];
        let currentCategory = '';
        let currentQuestion = null;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
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
            // Check if line is a media URL (starts with http and follows a question/answer)
            else if (currentQuestion && this.isMediaUrl(line)) {
                if (!currentQuestion.media) {
                    const mediaMatch = this.extractMedia(line);
                    if (mediaMatch) {
                        currentQuestion.media = mediaMatch;
                    }
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
            // Check if line is a category (no question mark, no http, and not a common answer word)
            else if (line && !line.includes('؟') && !line.startsWith('http') && 
                !this.isCommonAnswerWord(line)) {
                currentCategory = line;
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

    cleanAndValidateText(text) {
        const errors = [];
        let cleanedText = text;

        // Check for empty input
        if (!text || text.trim().length === 0) {
            errors.push('النص فارغ. يرجى إدخال الأسئلة.');
            return { isValid: false, errors, text: '' };
        }

        // Clean special characters and excessive punctuation
        cleanedText = this.cleanSpecialCharacters(cleanedText);

        // Check for basic structure
        const lines = cleanedText.split('\n').map(line => line.trim()).filter(line => line);
        if (lines.length < 3) {
            errors.push('يجب أن يحتوي النص على فئة واحدة على الأقل مع سؤال وإجابة.');
            return { isValid: false, errors, text: cleanedText };
        }

        // Check for proper category-question-answer structure
        let hasValidStructure = false;
        let currentCategory = '';
        let questionCount = 0;
        let answerCount = 0;
        let expectingAnswer = false;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            // Check if line is a category
            if (line && !line.includes('؟') && !line.includes('.') && !line.startsWith('http') && 
                !this.isCommonAnswerWord(line)) {
                currentCategory = line;
                expectingAnswer = false;
                continue;
            }

            // Check if line is a question
            if (line.includes('؟')) {
                questionCount++;
                expectingAnswer = true;
                if (currentCategory) {
                    hasValidStructure = true;
                }
            }
            // Check if line is an answer (follows a question)
            else if (expectingAnswer && !line.includes('؟') && !line.startsWith('http')) {
                answerCount++;
                expectingAnswer = false;
            }
        }

        if (!hasValidStructure) {
            errors.push('لم يتم العثور على هيكل صحيح للأسئلة. تأكد من وجود فئات وأسئلة.');
        }

        if (questionCount === 0) {
            errors.push('لم يتم العثور على أي أسئلة صحيحة (يجب أن تحتوي على علامة استفهام).');
        }

        if (questionCount !== answerCount) {
            errors.push(`عدد الأسئلة (${questionCount}) لا يتطابق مع عدد الإجابات (${answerCount}).`);
        }

        return {
            isValid: errors.length === 0,
            errors,
            text: cleanedText
        };
    }

    cleanSpecialCharacters(text) {
        // Remove emojis and special symbols
        let cleaned = text.replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '');
        
        // Clean excessive punctuation
        cleaned = cleaned.replace(/[؟]{2,}/g, '؟'); // Multiple question marks to single
        cleaned = cleaned.replace(/[!]{2,}/g, '!'); // Multiple exclamation marks to single
        cleaned = cleaned.replace(/[.]{2,}/g, '.'); // Multiple periods to single
        
        // Remove leading/trailing special characters
        cleaned = cleaned.replace(/^[^\w\u0600-\u06FF\s]+|[^\w\u0600-\u06FF\s]+$/g, '');
        
        return cleaned;
    }

    validateQuestion(question) {
        // Check if question is too short
        if (question.length < 10) {
            return { isValid: false, error: 'السؤال قصير جداً' };
        }

        // Check if question has proper ending
        if (!question.includes('؟')) {
            return { isValid: false, error: 'السؤال يجب أن ينتهي بعلامة استفهام' };
        }

        // Check for excessive special characters
        const specialCharCount = (question.match(/[^\w\u0600-\u06FF\s؟]/g) || []).length;
        if (specialCharCount > question.length * 0.3) {
            return { isValid: false, error: 'السؤال يحتوي على أحرف خاصة كثيرة' };
        }

        return { isValid: true };
    }

    validateAnswer(answer) {
        // Check if answer is too short
        if (answer.length < 2) {
            return { isValid: false, error: 'الإجابة قصيرة جداً' };
        }

        // Check for excessive special characters
        const specialCharCount = (answer.match(/[^\w\u0600-\u06FF\s.]/g) || []).length;
        if (specialCharCount > answer.length * 0.3) {
            return { isValid: false, error: 'الإجابة تحتوي على أحرف خاصة كثيرة' };
        }

        return { isValid: true };
    }

    showValidationError(errors) {
        const errorMessage = errors.join('\n');
        alert(`أخطاء في التنسيق:\n\n${errorMessage}\n\nيرجى تصحيح هذه الأخطاء قبل الحفظ.`);
    }

    showChatGPTModal() {
        this.elements.chatgptModal.classList.add('active');
        this.updateChatGPTPrompt();
    }

    hideChatGPTModal() {
        this.elements.chatgptModal.classList.remove('active');
    }

    cancelChatGPTModal() {
        // Clear all inputs
        this.elements.categoriesInput.value = '';
        this.elements.chatgptPrompt.value = '';
        this.elements.chatgptResult.value = '';
        
        // Hide the modal
        this.hideChatGPTModal();
    }

    updateChatGPTPrompt() {
        const categories = this.elements.categoriesInput.value.trim();
        if (!categories) {
            this.elements.chatgptPrompt.value = '';
            return;
        }

        const prompt = this.generateChatGPTPrompt(categories);
        this.elements.chatgptPrompt.value = prompt;
    }

    generateChatGPTPrompt(categories) {
        return `أريد منك إنشاء أسئلة وأجوبة لعبة سؤال وجواب باللغة العربية. 

الفئات المطلوبة: ${categories}

التنسيق المطلوب:
- اكتب اسم الفئة في سطر منفصل
- اكتب السؤال في السطر التالي (يجب أن ينتهي بعلامة استفهام)
- اكتب الإجابة في السطر التالي
- اترك سطر فارغ بين كل سؤال
- لا تضع أي رؤوس أو تذييلات
- لا تستخدم رموز تعبيرية أو أحرف خاصة
- تأكد من أن الأسئلة واضحة ومفهومة
- تأكد من أن الإجابات دقيقة ومختصرة

مثال على التنسيق:
علوم
ما هو الكوكب الأحمر في المجموعة الشمسية؟
كوكب المريخ.

ما هو العنصر الكيميائي الذي رمزه O؟
الأكسجين.

تاريخ
من هو مؤسس الدولة العباسية؟
أبو العباس السفاح.

أريد 5 أسئلة لكل فئة. ابدأ الآن:`;
    }

    copyPromptToClipboard() {
        const promptText = this.elements.chatgptPrompt.value;
        if (!promptText) {
            alert('يرجى إدخال الفئات أولاً');
            return;
        }

        navigator.clipboard.writeText(promptText).then(() => {
            // Show success feedback
            const originalText = this.elements.copyPromptBtn.innerHTML;
            this.elements.copyPromptBtn.innerHTML = '<span>✅ تم النسخ!</span>';
            this.elements.copyPromptBtn.style.background = 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)';
            
            setTimeout(() => {
                this.elements.copyPromptBtn.innerHTML = originalText;
                this.elements.copyPromptBtn.style.background = '';
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy text: ', err);
            alert('فشل في نسخ النص. يرجى المحاولة مرة أخرى.');
        });
    }

    useChatGPTResult() {
        const result = this.elements.chatgptResult.value.trim();
        if (!result) {
            alert('يرجى إدخال النتيجة من ChatGPT أولاً');
            return;
        }

        // Replace the content instead of appending
        this.elements.questionsInput.value = result;
        
        // Update the preview
        this.updateQuestionsPreview();
        
        // Close the modal
        this.hideChatGPTModal();
        
        // Clear the result textarea
        this.elements.chatgptResult.value = '';
        
        // Stay on the admin page (إعداد الأسئلة) - no redirect needed
        // The user can now see the pasted questions in the textarea
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

    initializeCategoryBoxes() {
        const categoryBoxes = document.querySelectorAll('.category-box');
        categoryBoxes.forEach(box => {
            box.addEventListener('click', () => {
                this.toggleCategorySelection(box);
            });
        });
    }

    toggleCategorySelection(categoryBox) {
        const category = categoryBox.getAttribute('data-category');
        
        if (this.selectedCategories.has(category)) {
            // Remove from selection
            this.selectedCategories.delete(category);
            categoryBox.classList.remove('selected');
        } else {
            // Add to selection
            this.selectedCategories.add(category);
            categoryBox.classList.add('selected');
        }
        
        this.updateCategoriesInput();
    }

    selectAllCategories() {
        const categoryBoxes = document.querySelectorAll('.category-box');
        categoryBoxes.forEach(box => {
            const category = box.getAttribute('data-category');
            this.selectedCategories.add(category);
            box.classList.add('selected');
        });
        this.updateCategoriesInput();
    }

    clearAllCategories() {
        const categoryBoxes = document.querySelectorAll('.category-box');
        categoryBoxes.forEach(box => {
            box.classList.remove('selected');
        });
        this.selectedCategories.clear();
        this.updateCategoriesInput();
    }

    updateCategoriesInput() {
        const categoriesArray = Array.from(this.selectedCategories);
        this.elements.categoriesInput.value = categoriesArray.join('، ');
        this.updateChatGPTPrompt();
    }
}

// Initialize admin controller when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.adminController = new AdminController();
});
