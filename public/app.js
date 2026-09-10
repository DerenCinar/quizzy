// Default Seed Community Quizzes for immediate rich experience
const defaultCommunityQuizzes = [
    {
        id: 'seed-world-capitals',
        title: 'World Capitals Challenge',
        description: 'Test your knowledge of capital cities around the globe!',
        category: 'Geography',
        author: 'Alex Explorer',
        playCount: 142,
        questions: [
            { question: 'What is the capital of France?', answer: 'Paris' },
            { question: 'What is the capital of Japan?', answer: 'Tokyo' },
            { question: 'What is the capital of Germany?', answer: 'Berlin' },
            { question: 'What is the capital of Australia?', answer: 'Canberra' },
            { question: 'What is the capital of Canada?', answer: 'Ottawa' }
        ]
    },
    {
        id: 'seed-german-vocab',
        title: 'German Vocabulary - A1 Basics',
        description: 'Essential German words for beginners!',
        category: 'Languages',
        author: 'Frau Schmidt',
        playCount: 98,
        questions: [
            { question: 'What is "Hello" in German?', answer: 'Hallo' },
            { question: 'What is "Thank you" in German?', answer: 'Danke' },
            { question: 'What is "Goodbye" in German?', answer: 'Tschüss' },
            { question: 'What is "Please" in German?', answer: 'Bitte' }
        ]
    },
    {
        id: 'seed-solar-system',
        title: 'Solar System Trivia',
        description: 'Fun facts about planets, stars, and space exploration.',
        category: 'Science',
        author: 'AstroKid',
        playCount: 76,
        questions: [
            { question: 'Which planet is known as the Red Planet?', answer: 'Mars' },
            { question: 'What is the largest planet in our solar system?', answer: 'Jupiter' },
            { question: 'Which planet is closest to the Sun?', answer: 'Mercury' },
            { question: 'What gas makes up most of Earth\'s atmosphere?', answer: 'Nitrogen' }
        ]
    },
    {
        id: 'seed-us-history',
        title: 'US History Milestones',
        description: 'Key events and figures from American History.',
        category: 'History',
        author: 'HistoryBuff99',
        playCount: 53,
        questions: [
            { question: 'In what year was the Declaration of Independence signed?', answer: '1776' },
            { question: 'Who was the first President of the United States?', answer: 'George Washington' },
            { question: 'Which war was fought between the Northern and Southern states?', answer: 'Civil War' }
        ]
    }
];

// Firebase Firestore instance helper
let dbInstance = null;
function getFirestore() {
    if (dbInstance) return dbInstance;
    try {
        if (typeof firebase !== 'undefined') {
            if (!firebase.apps.length) {
                firebase.initializeApp({ projectId: "quizzy-online" });
            }
            dbInstance = firebase.firestore();
            return dbInstance;
        }
    } catch (e) {
        console.warn("Firestore initialization fallback:", e);
    }
    return null;
}

// Synthesized Audio chime / feedback (Web Audio API)
let audioCtx = null;
function playSound(type) {
    try {
        if (!audioCtx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) audioCtx = new AudioContext();
        }
        if (!audioCtx) return;
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        const now = audioCtx.currentTime;
        if (type === 'correct') {
            // Ascending major chime (C5 -> E5 -> G5)
            const freqs = [523.25, 659.25, 783.99];
            freqs.forEach((freq, idx) => {
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, now + idx * 0.07);
                gain.gain.setValueAtTime(0, now + idx * 0.07);
                gain.gain.linearRampToValueAtTime(0.18, now + idx * 0.07 + 0.02);
                gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.22);
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                osc.start(now + idx * 0.07);
                osc.stop(now + idx * 0.07 + 0.24);
            });
        } else if (type === 'incorrect') {
            // Soft double low tone (260Hz -> 196Hz)
            const freqs = [260, 196];
            freqs.forEach((freq, idx) => {
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, now + idx * 0.12);
                gain.gain.setValueAtTime(0, now + idx * 0.12);
                gain.gain.linearRampToValueAtTime(0.18, now + idx * 0.12 + 0.02);
                gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.18);
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                osc.start(now + idx * 0.12);
                osc.stop(now + idx * 0.12 + 0.2);
            });
        }
    } catch (e) {
        console.warn("Audio feedback error:", e);
    }
}

const app = Vue.createApp({
    data() {
        return {
            test: 'hello world',
            questions: [
                { question: 'test', answer: 'test' },
                { question: 'test2', answer: 'test2' },
            ],
            input: '',
            points: 0,
            questionNumber: 0,
            completed: false,
            incorrect: 0,
            currentPage: 'home',
            searchClick: false,
            searchValue: '',
            quizzes: [
                { displayName: 'america', name: 'america', book: 'D' },
                { displayName: 'cats', name: 'cats', book: 'D' },
                { displayName: 'dogs', name: 'dogs', book: 'D' },
                { displayName: 'D2 - Besser Schreiben', name: 'french5', book: 'D' },
                { displayName: 'D2 - Besser Schreiben PT4', name: 'french_pt_4', book: 'D' },
                { displayName: 'A2 - 2/6/25', name: 'A1-SPA', book: 'D' },
                { displayName: 'FRA - Activities', name: 'active', book: 'D' },
                { displayName: 'FRA 8 - Test 1', name: 'french8test1', book: 'D' },
            ],
            currentQuiz: '',
            help: false,
            searchValueHome: '',
            
            // Quiz Creator Fields
            createTitle: '',
            createDescription: '',
            createCategory: 'General',
            createAuthor: '',
            createQuestion: '',
            createAnswer: '',
            createList: [],

            // Community Quizzes State
            communityQuizzes: [],
            searchCommunity: '',
            communityFilterCategory: 'All',
            activeCommunityQuiz: null,

            schools: [
                { displayName: 'German International School of Silicon Valley', name: 'GISSV' },
                { displayName: 'Quizzy Preview Quizzes', name: 'QPQ' },
            ],
            searchValueSchool: '',
            school: '',
            searched: false,
            books: [
                { displayName: 'Découvertes 2', displaySubtitle: 'Besser Schreiben', avalibility: 'GISSV', quiz: 'french5' },
                { displayName: 'Découvertes 2', displaySubtitle: 'Besser Schreiben', avalibility: 'GISSV', quiz: 'french5' },
                { displayName: 'Découvertes 2', displaySubtitle: 'Besser Schreiben', avalibility: 'GISSV', quiz: 'french5' },
                { displayName: 'Découvertes 2', displaySubtitle: 'Besser Schreiben', avalibility: 'GISSV', quiz: 'french5' },
                { displayName: 'FRA - AB', displaySubtitle: 'Activities', avalibility: 'GISSV', quiz: 'FRAactive' },

                { displayName: 'SPA - 2/6/25', avalibility: 'GISSV', quiz: 'A1-SPA' },
                { displayName: 'SPA - N/A', avalibility: 'GISSV', quiz: 'french5' },
                { displayName: 'SPA - N/A', avalibility: 'GISSV', quiz: 'french5' },
                { displayName: 'SPA - N/A', avalibility: 'GISSV', quiz: 'french5' },
            ],
            
            unitSelected: 'D',
            formAdd: false,

            // Profile State & Persistence
            userProfile: {
                displayName: 'Quizzy Learner',
                bio: 'Learning something new every day with Quizzy!',
                school: 'Self-Learner',
                memberSince: 'Feb 2025',
                avatar: 'Circle-icons-profile.svg.png'
            },
            showEditProfileModal: false,
            editProfileData: {
                displayName: '',
                bio: '',
                school: ''
            },

            // Lifetime User Stats
            userStats: {
                quizzesCompleted: 0,
                questionsAnswered: 0,
                correctAnswers: 0,
                incorrectAnswers: 0
            },

            // Settings State
            settings: {
                soundEnabled: true,
                caseSensitive: false,
                autoAdvance: true
            },
            settingsFeedback: ''
        };
    },
    mounted() {
        this.loadLocalData();
        this.fetchCommunityQuizzes();
    },
    watch: {
        incorrect(value) {
            if (this.questions && (value >= this.questions.length)) {
                if (!this.completed) {
                    this.completed = true;
                    this.userStats.quizzesCompleted += 1;
                    this.saveStats();
                }
            }
        },
        currentQuiz(value) {
            if (!this.activeCommunityQuiz && value) {
                fetch(`questions/${value}.json`)
                    .then(response => response.json())
                    .then(questions => {
                        this.questions = questions;
                    })
                    .catch(error => {
                        console.error(error);
                    });
            }
        },
    },
    computed: {
        question() {
            if (this.questions && this.questions[this.questionNumber]) {
                return this.questions[this.questionNumber].question;
            }
            return '';
        },
        rewardSentance() {
            const total = this.questions ? this.questions.length : 0;
            if (this.points === total && this.incorrect === 0) return 'You got everything correct! Good Job! :)';
            if (this.incorrect >= total) return 'Uh oh! Thats not good :(';
            else return 'Good! Practice makes perfect! :|';
        },
        showDropdown() {
            return this.searchValue !== '';
        },
        showDropdownHome() {
            return this.searchValueHome !== '';
        },
        showDropdownSchool() {
            return this.searchValueSchool !== '';
        },
        filteredItems() {
            if (!this.searchValue || this.searchValue.trim() === '') return [];
            const term = this.searchValue.toLowerCase();
            const presets = this.quizzes.filter(quiz => quiz.displayName.toLowerCase().includes(term));
            const communityMatches = this.communityQuizzes
                .filter(quiz => (quiz.title && quiz.title.toLowerCase().includes(term)) || (quiz.category && quiz.category.toLowerCase().includes(term)))
                .map(q => ({ displayName: '[Community] ' + q.title, isCommunity: true, quizObj: q }));
            return [...presets, ...communityMatches];
        },
        filteredItemsHome() {
            if (!this.searchValueHome || this.searchValueHome.trim() === '') return [];
            const term = this.searchValueHome.toLowerCase();
            const presets = this.quizzes.filter(quiz => quiz.displayName.toLowerCase().includes(term));
            const communityMatches = this.communityQuizzes
                .filter(quiz => (quiz.title && quiz.title.toLowerCase().includes(term)) || (quiz.category && quiz.category.toLowerCase().includes(term)))
                .map(q => ({ displayName: '[Community] ' + q.title, isCommunity: true, quizObj: q }));
            return [...presets, ...communityMatches];
        },
        filteredCommunityQuizzes() {
            return this.communityQuizzes.filter(quiz => {
                const matchesCategory = (this.communityFilterCategory === 'All') || (quiz.category === this.communityFilterCategory);
                if (!matchesCategory) return false;

                if (!this.searchCommunity || this.searchCommunity.trim() === '') return true;
                const term = this.searchCommunity.toLowerCase();
                const titleMatch = quiz.title && quiz.title.toLowerCase().includes(term);
                const descMatch = quiz.description && quiz.description.toLowerCase().includes(term);
                const authorMatch = quiz.author && quiz.author.toLowerCase().includes(term);
                const catMatch = quiz.category && quiz.category.toLowerCase().includes(term);
                return titleMatch || descMatch || authorMatch || catMatch;
            });
        },
        filteredItemsSchool() {
            if (this.searchValueSchool === '') return '';
            else {
                const term = this.searchValueSchool.toLowerCase();
                return this.schools.filter(school => school.displayName.toLowerCase().includes(term));
            }
        },
        bookSelector() {
            if (this.school === '') return '';
            else {
                const term = this.school.toLowerCase();
                return this.books.filter(book => book.avalibility.toLowerCase().includes(term));
            }
        },
        accuracyRate() {
            if (!this.userStats.questionsAnswered || this.userStats.questionsAnswered === 0) return 0;
            return Math.round((this.userStats.correctAnswers / this.userStats.questionsAnswered) * 100);
        },
        myCreatedQuizzes() {
            return JSON.parse(localStorage.getItem('quizzy_community_quizzes') || '[]');
        },
        userAchievements() {
            const qs = this.userStats.questionsAnswered || 0;
            const correct = this.userStats.correctAnswers || 0;
            const quizzes = this.userStats.quizzesCompleted || 0;
            const created = this.myCreatedQuizzes ? this.myCreatedQuizzes.length : 0;
            const acc = this.accuracyRate;

            return [
                {
                    id: 'first_quiz',
                    title: 'First Steps',
                    icon: '🌱',
                    desc: 'Complete your first quiz',
                    unlocked: quizzes >= 1
                },
                {
                    id: 'quiz_scholar',
                    title: 'Quiz Scholar',
                    icon: '🎓',
                    desc: 'Complete 3 or more quizzes',
                    unlocked: quizzes >= 3
                },
                {
                    id: 'sharpshooter',
                    title: 'Sharpshooter',
                    icon: '🎯',
                    desc: 'Maintain 80%+ accuracy (min 5 Qs)',
                    unlocked: qs >= 5 && acc >= 80
                },
                {
                    id: 'creator',
                    title: 'Quiz Creator',
                    icon: '💡',
                    desc: 'Create and publish a quiz',
                    unlocked: created >= 1
                },
                {
                    id: 'trivia_master',
                    title: 'Trivia Master',
                    icon: '⭐',
                    desc: 'Answer 15 correct questions',
                    unlocked: correct >= 15
                },
                {
                    id: 'dedicated',
                    title: 'Dedicated Learner',
                    icon: '📚',
                    desc: 'Answer 25 total questions',
                    unlocked: qs >= 25
                }
            ];
        }
    },
    methods: {
        loadLocalData() {
            try {
                const savedProfile = localStorage.getItem('quizzy_user_profile');
                if (savedProfile) {
                    this.userProfile = { ...this.userProfile, ...JSON.parse(savedProfile) };
                }
                const savedStats = localStorage.getItem('quizzy_user_stats');
                if (savedStats) {
                    this.userStats = { ...this.userStats, ...JSON.parse(savedStats) };
                }
                const savedSettings = localStorage.getItem('quizzy_settings');
                if (savedSettings) {
                    this.settings = { ...this.settings, ...JSON.parse(savedSettings) };
                }
            } catch (e) {
                console.warn("Could not load local profile/stats:", e);
            }
        },
        saveStats() {
            try {
                localStorage.setItem('quizzy_user_stats', JSON.stringify(this.userStats));
            } catch (e) {
                console.warn("Could not save user stats:", e);
            }
        },
        saveSettings() {
            try {
                localStorage.setItem('quizzy_settings', JSON.stringify(this.settings));
                this.settingsFeedback = 'Settings saved successfully!';
                setTimeout(() => {
                    this.settingsFeedback = '';
                }, 2500);
            } catch (e) {
                console.warn("Could not save settings:", e);
            }
        },
        openEditProfileModal() {
            this.editProfileData = {
                displayName: this.userProfile.displayName || '',
                bio: this.userProfile.bio || '',
                school: this.userProfile.school || ''
            };
            this.showEditProfileModal = true;
        },
        saveEditedProfile() {
            if (this.editProfileData.displayName.trim()) {
                this.userProfile.displayName = this.editProfileData.displayName.trim();
            }
            this.userProfile.bio = this.editProfileData.bio.trim();
            this.userProfile.school = this.editProfileData.school.trim() || 'Self-Learner';

            try {
                localStorage.setItem('quizzy_user_profile', JSON.stringify(this.userProfile));
            } catch (e) {
                console.warn("Could not save profile:", e);
            }
            this.showEditProfileModal = false;
        },
        resetStats() {
            if (confirm("Are you sure you want to reset your quiz stats? This cannot be undone.")) {
                this.userStats = {
                    quizzesCompleted: 0,
                    questionsAnswered: 0,
                    correctAnswers: 0,
                    incorrectAnswers: 0
                };
                this.saveStats();
                this.settingsFeedback = 'Stats have been reset.';
                setTimeout(() => { this.settingsFeedback = ''; }, 2500);
            }
        },
        resetAllData() {
            if (confirm("Reset ALL data (profile, stats, created quizzes, settings)? This will restore default settings.")) {
                localStorage.removeItem('quizzy_user_profile');
                localStorage.removeItem('quizzy_user_stats');
                localStorage.removeItem('quizzy_settings');
                localStorage.removeItem('quizzy_community_quizzes');

                this.userProfile = {
                    displayName: 'Quizzy Learner',
                    bio: 'Learning something new every day with Quizzy!',
                    school: 'Self-Learner',
                    memberSince: 'Feb 2025',
                    avatar: 'Circle-icons-profile.svg.png'
                };
                this.userStats = {
                    quizzesCompleted: 0,
                    questionsAnswered: 0,
                    correctAnswers: 0,
                    incorrectAnswers: 0
                };
                this.settings = {
                    soundEnabled: true,
                    caseSensitive: false,
                    autoAdvance: true
                };
                this.communityQuizzes = [...defaultCommunityQuizzes];
                this.settingsFeedback = 'All data reset to defaults!';
                setTimeout(() => { this.settingsFeedback = ''; }, 2500);
            }
        },
        exportQuizzes() {
            const quizzes = this.myCreatedQuizzes;
            if (!quizzes.length) {
                alert("You have not created any quizzes to export yet!");
                return;
            }
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(quizzes, null, 2));
            const dlAnchor = document.createElement('a');
            dlAnchor.setAttribute("href", dataStr);
            dlAnchor.setAttribute("download", "quizzy_my_quizzes.json");
            document.body.appendChild(dlAnchor);
            dlAnchor.click();
            dlAnchor.remove();
        },
        triggerImport() {
            const input = document.getElementById('importFileInput');
            if (input) input.click();
        },
        handleImportQuizzes(event) {
            const file = event.target.files && event.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const parsed = JSON.parse(e.target.result);
                    const list = Array.isArray(parsed) ? parsed : [parsed];
                    const localSaved = JSON.parse(localStorage.getItem('quizzy_community_quizzes') || '[]');
                    
                    list.forEach(item => {
                        if (item.title && item.questions && Array.isArray(item.questions)) {
                            item.id = item.id || ('imported_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5));
                            localSaved.unshift(item);
                            this.communityQuizzes.unshift(item);
                        }
                    });

                    localStorage.setItem('quizzy_community_quizzes', JSON.stringify(localSaved));
                    alert(`Successfully imported ${list.length} quiz(zes)!`);
                    event.target.value = '';
                } catch (err) {
                    alert("Invalid JSON file. Please check the file format.");
                }
            };
            reader.readAsText(file);
        },
        deleteMyQuiz(quizId) {
            if (confirm("Delete this created quiz?")) {
                let localSaved = JSON.parse(localStorage.getItem('quizzy_community_quizzes') || '[]');
                localSaved = localSaved.filter(q => q.id !== quizId);
                localStorage.setItem('quizzy_community_quizzes', JSON.stringify(localSaved));
                this.communityQuizzes = this.communityQuizzes.filter(q => q.id !== quizId);
            }
        },
        fetchCommunityQuizzes() {
            const firestore = getFirestore();
            const localSaved = JSON.parse(localStorage.getItem('quizzy_community_quizzes') || '[]');
            let allQuizzes = [...defaultCommunityQuizzes, ...localSaved];

            if (firestore) {
                firestore.collection('quizzes').get().then(snapshot => {
                    const remoteQuizzes = [];
                    snapshot.forEach(doc => {
                        remoteQuizzes.push({ id: doc.id, ...doc.data() });
                    });
                    if (remoteQuizzes.length > 0) {
                        const remoteIds = new Set(remoteQuizzes.map(q => q.id));
                        const uniqueLocal = allQuizzes.filter(q => !remoteIds.has(q.id));
                        this.communityQuizzes = [...remoteQuizzes, ...uniqueLocal];
                    } else {
                        this.communityQuizzes = allQuizzes;
                    }
                }).catch(err => {
                    console.warn("Firestore fetch warning (using fallback):", err);
                    this.communityQuizzes = allQuizzes;
                });
            } else {
                this.communityQuizzes = allQuizzes;
            }
        },
        checkAnswer() {
            if (!this.questions || !this.questions[this.questionNumber]) return;
            
            const rawUser = (this.input || '').trim();
            const rawCorrect = (this.questions[this.questionNumber].answer || '').trim();

            const isMatch = this.settings.caseSensitive 
                ? rawUser === rawCorrect 
                : rawUser.toLowerCase() === rawCorrect.toLowerCase();

            // Track lifetime stats
            this.userStats.questionsAnswered += 1;

            if (isMatch) {
                this.points = this.points + 1;
                this.userStats.correctAnswers += 1;
                if (this.settings.soundEnabled) {
                    playSound('correct');
                }
                this.input = '';

                if (this.questionNumber + 1 === this.questions.length) {
                    this.completed = true;
                    this.userStats.quizzesCompleted += 1;
                } else {
                    this.questionNumber = this.questionNumber + 1;
                }
            } else {
                this.incorrect = this.incorrect + 1;
                this.userStats.incorrectAnswers += 1;
                if (this.settings.soundEnabled) {
                    playSound('incorrect');
                }
                this.input = '';
            }
            this.saveStats();
        },
        switchQuiz(newQuiz) {
            this.activeCommunityQuiz = null;
            this.currentQuiz = newQuiz;
            this.searchValue = '';
            this.searchValueHome = '';
            this.currentPage = 'quiz';
            this.questionNumber = 0;
            this.points = 0;
            this.incorrect = 0;
            this.completed = false;
            this.input = '';
            this.help = false;
        },
        selectSearchItem(item) {
            this.searchValue = '';
            this.searchValueHome = '';
            if (item.isCommunity && item.quizObj) {
                this.playCommunityQuiz(item.quizObj);
            } else if (item.name) {
                this.switchQuiz(item.name);
            }
        },
        playCommunityQuiz(quiz) {
            this.activeCommunityQuiz = quiz;
            this.questions = quiz.questions || [];
            this.currentQuiz = quiz.title;
            this.currentPage = 'quiz';
            this.questionNumber = 0;
            this.points = 0;
            this.incorrect = 0;
            this.completed = false;
            this.input = '';
            this.help = false;

            // Increment play count
            quiz.playCount = (quiz.playCount || 0) + 1;
            const firestore = getFirestore();
            if (firestore && quiz.id && !quiz.id.startsWith('seed-') && !quiz.id.startsWith('local_') && !quiz.id.startsWith('imported_')) {
                firestore.collection('quizzes').doc(quiz.id).update({
                    playCount: firebase.firestore.FieldValue.increment(1)
                }).catch(e => console.warn("Play count update warning:", e));
            }
        },
        restartCurrentQuiz() {
            if (this.activeCommunityQuiz) {
                this.playCommunityQuiz(this.activeCommunityQuiz);
            } else {
                this.switchQuiz(this.currentQuiz);
            }
        },
        setSchool(newSchool) {
            this.school = newSchool;
            this.searchValueSchool = '';
            this.searched = true;
        },
        helpNeeded() {
            this.help = true;
        },
        addQuestion() {
            if (!this.createQuestion || !this.createAnswer) return;
            this.createList.push({
                question: this.createQuestion.trim(),
                answer: this.createAnswer.trim()
            });
            this.createQuestion = '';
            this.createAnswer = '';
        },
        removeQuestion(index) {
            this.createList.splice(index, 1);
        },
        publishQuiz() {
            if (!this.createTitle || this.createList.length === 0) return;
            const author = (this.createAuthor || '').trim() || this.userProfile.displayName || 'Anonymous';
            const newQuiz = {
                title: this.createTitle.trim(),
                description: (this.createDescription || '').trim(),
                category: this.createCategory || 'General',
                author: author,
                questions: [...this.createList],
                playCount: 0,
                createdAt: new Date().toISOString()
            };

            const firestore = getFirestore();
            if (firestore) {
                firestore.collection('quizzes').add(newQuiz).then(docRef => {
                    newQuiz.id = docRef.id;
                }).catch(err => {
                    console.error("Firestore publish error:", err);
                    newQuiz.id = 'local_' + Date.now();
                });
            } else {
                newQuiz.id = 'local_' + Date.now();
            }

            const localSaved = JSON.parse(localStorage.getItem('quizzy_community_quizzes') || '[]');
            localSaved.unshift(newQuiz);
            localStorage.setItem('quizzy_community_quizzes', JSON.stringify(localSaved));

            this.communityQuizzes.unshift(newQuiz);

            // Clear form
            this.createTitle = '';
            this.createDescription = '';
            this.createCategory = 'General';
            this.createAuthor = '';
            this.createList = [];

            // Play the quiz immediately
            this.playCommunityQuiz(newQuiz);
        },
        unitSelector(value) {
            this.unitSelected = value;
        }
    },
});

app.mount('#app');

document.addEventListener('DOMContentLoaded', () => {
    const $navbarBurgers = Array.prototype.slice.call(document.querySelectorAll('.navbar-burger'), 0);
    $navbarBurgers.forEach(el => {
        el.addEventListener('click', () => {
            const target = el.dataset.target;
            const $target = document.getElementById(target);
            el.classList.toggle('is-active');
            $target.classList.toggle('is-active');
        });
    });
});
