const app = Vue.createApp({
    data() {
        return {
            test:'hello world',
            questions: [
                {
                    question: 'test',
                    answer: 'test'
                },
                {
                    question: 'test2',
                    answer: 'test2'
                },
            ],
            // questions: ['test','test2'],
            // answers: ['test', 'test2'],
            input:'',
            points: 0,
            questionNumber: 0,
            completed: false,
            incorrect: 0,
            currentPage: 'home',
            searchClick: false,
            searchValue: '',
            quizzes: [
                {displayName: 'america', name:'america', book: 'D'},
                {displayName: 'cats', name:'cats', book: 'D'},
                {displayName: 'dogs', name:'dogs', book: 'D'},
                {displayName: 'D2 - Besser Schreiben', name:'french5', book: 'D'},
                {displayName: 'D2 - Besser Schreiben PT4', name:'french_pt_4', book: 'D'},
                {displayName: 'A2 - 2/6/25', name:'A1-SPA', book: 'D'},
                {displayName: 'FRA - Activities', name:'active', book: 'D'},
                {displayName: 'FRA 8 - Test 1', name:'french8test1', book: 'D'},

                
            ],
            currentQuiz: '',
            help: false,
            searchValueHome: '',
            createQuestion: '',
            createAnswer: '',
            createList: [
                
            ],
            schools: [
                {displayName: 'German International School of Silicon Valley', name:'GISSV'},
                {displayName: 'Quizzy Preview Quizzes', name:'QPQ'},
            ],
            searchValueSchool: '',
            school: '',
            searched: false,
            books: [
                {displayName: 'Découvertes 2', displaySubtitle: 'Besser Schreiben', avalibility: 'GISSV', quiz: 'french5'},
                {displayName: 'Découvertes 2', displaySubtitle: 'Besser Schreiben', avalibility: 'GISSV', quiz: 'french5'},
                {displayName: 'Découvertes 2', displaySubtitle: 'Besser Schreiben', avalibility: 'GISSV', quiz: 'french5'},
                {displayName: 'Découvertes 2', displaySubtitle: 'Besser Schreiben', avalibility: 'GISSV', quiz: 'french5'},
                {displayName: 'FRA - AB', displaySubtitle: 'Activities', avalibility: 'GISSV', quiz: 'FRAactive'},

                {displayName: 'SPA - 2/6/25', avalibility: 'GISSV', quiz: 'A1-SPA'},
                {displayName: 'SPA - N/A', avalibility: 'GISSV', quiz: 'french5'},
                {displayName: 'SPA - N/A', avalibility: 'GISSV', quiz: 'french5'},
                {displayName: 'SPA - N/A', avalibility: 'GISSV', quiz: 'french5'},

            ],
            
            unitSelected: 'D',
            formAdd: false
           
        }
    },
    watch: {
        
        incorrect(value) {
            if (value > this.questions.length) {
                this.completed = true
            }
            if (value === this.questions.length) {
                this.completed = true
            }
        },
        currentQuiz(value) {
            fetch(`questions/${value}.json`)
                .then(response => response.json())
                .then(questions => {
                    this.questions = questions
                })
                .catch(error => {
                    console.error(error)
                })
        },
    },
    computed: {
        question() {
                return this.questions[this.questionNumber].question
        },
        rewardSentance() {
            if(this.points === this.questions.length && this.incorrect === 0) return 'You got everything correct! Good Job! :)'
            if(this.incorrect > this.questions.length) return 'Uh oh! Thats not good :('
            if(this.incorrect === this.questions.length) return 'Uh oh! Thats not good :('
            else return 'Good! Practice makes perfect! :|'

        },
        showDropdown() {
            if (this.searchValue != '') return true
            else return false
        },
        showDropdownHome() {
            if (this.searchValueHome != '') return true
            else return false
        },
        showDropdownSchool() {
            if (this.searchValueSchool != '') return true
            else return false
        },

        filteredItems() {
            if (this.searchValue === '') return ''
            else {
                const term = this.searchValue.toLowerCase(); // For case-insensitive search
                return this.quizzes.filter(quiz => {
                return quiz.displayName.toLowerCase().includes(term); // Check if item name contains the search term
             });
            }
        },
        filteredItemsHome() {
            if (this.searchValueHome === '') return ''
            else {
                const term = this.searchValueHome.toLowerCase(); // For case-insensitive search
                return this.quizzes.filter(quiz => {
                return quiz.displayName.toLowerCase().includes(term); // Check if item name contains the search term
             });
            }
        },
        filteredItemsSchool() {
            if (this.searchValueSchool === '') return ''
            else {
                const term = this.searchValueSchool.toLowerCase(); // For case-insensitive search
                return this.schools.filter(school => {
                return school.displayName.toLowerCase().includes(term); // Check if item name contains the search term
             });
            }
        },
        bookSelector() {
            if (this.school === '') return ''
            else {
                const term = this.school.toLowerCase(); // For case-insensitive search
                return this.books.filter(book => {
                if (book.avalibility.toLowerCase().includes(term)) {
                    return book
                } // Check if item name contains the search term
             });
            }
        },
        
        
      

    },
    methods: {
        formChange() {
            this.formAdd = true
        },
        checkAnswer() {
            if (this.input === this.questions[this.questionNumber].answer) {
                this.points = this.points + 1
                this.input = ''
                if (this.questionNumber + 1 === this.questions.length) {
                    this.completed = true
                }
                else this.questionNumber = this.questionNumber + 1
                
            }
            else {
                this.incorrect = this.incorrect + 1 
                this.input = ''
            }
        },
        switchQuiz(newQuiz) {
            this.currentQuiz = newQuiz
            this.searchValue = ''
            this.currentPage = 'quiz'
            this.questionNumber = 0
            this.points = 0
            this.incorrect = 0
            this.completed = 0
            this.input = ''
        },
        setSchool(newSchool) {
            this.school = newSchool
            this.searchValueSchool = ''
            this.searched = true
        },
        helpNeeded() {
            this.help = true
        },
        addQuestion() {
            this.createList.push(
                {
                    question: this.createQuestion,
                    answer: this.createAnswer
                }
            )
            this.createQuestion = ''
            this.createAnswer = ''
        },
        saveQuiz() {
            this.searchValue = ''
            this.currentPage = 'quiz'
            this.questionNumber = 0
            this.points = 0
            this.incorrect = 0
            this.completed = 0
            this.input = ''
            this.questions = this.createList
        },
        unitSelector(value) {
            this.unitSelected = value
        }
        
    },
        
});

app.mount('#app')

document.addEventListener('DOMContentLoaded', () => {

    // Get all "navbar-burger" elements
    const $navbarBurgers = Array.prototype.slice.call(document.querySelectorAll('.navbar-burger'), 0);
  
    // Add a click event on each of them
    $navbarBurgers.forEach( el => {
      el.addEventListener('click', () => {
  
        // Get the target from the "data-target" attribute
        const target = el.dataset.target;
        const $target = document.getElementById(target);
  
        // Toggle the "is-active" class on both the "navbar-burger" and the "navbar-menu"
        el.classList.toggle('is-active');
        $target.classList.toggle('is-active');
  
      });
    });
  
  });
  
