const questions = [
    // HTML
    { q: "מה התגית של כותרת ראשית?", options: ["<head>", "<h1>", "<title>", "<header>"], answer: 1 },
    { q: "איך מוסיפים תמונה?", options: ["<image src='...'>", "<img href='...'>", "<img src='...'>", "<picture src='...'>"], answer: 2 },
    { q: "מה עושה תגית a?", options: ["מדגישה טקסט", "יוצרת אנימציה", "יוצרת קישור", "מוסיפה אודיו"], answer: 2 },
    { q: "איך יוצרים רשימה עם תבליטים?", options: ["<ul>", "<ol>", "<list>", "<li>"], answer: 0 },
    { q: "מה התפקיד של body?", options: ["עיצוב האתר", "הגדרות הדפדפן", "מכיל את התוכן שמוצג באתר", "הפעלת סקריפטים"], answer: 2 },
    // CSS
    { q: "איך משנים צבע טקסט?", options: ["text-color: red;", "color: red;", "font-color: red;", "background: red;"], answer: 1 },
    { q: "מה עושה Flexbox?", options: ["עושה אנימציות", "מסדר אלמנטים על המסך", "משנה פונטים", "מצייר חלקיקים"], answer: 1 },
    { q: "איך מוסיפים Hover?", options: ["element:hover {}", "element.hover {}", "hover:element {}", "element::hover {}"], answer: 0 },
    { q: "מה זה Margin?", options: ["מרווח פנימי", "גבול", "מרווח חיצוני", "רוחב"], answer: 2 },
    { q: "איך עושים Gradient ברקע?", options: ["background-color: gradient(...);", "background: linear-gradient(...);", "color: gradient(...);", "gradient: linear(...);"], answer: 1 },
    // JS
    { q: "איך יוצרים משתנה שניתן לשינוי?", options: ["const", "var", "let", "int"], answer: 2 },
    { q: "מה עושה ()alert?", options: ["מדפיס לקונסול", "מקפיץ חלונית הודעה", "משנה צבע", "מפעיל סאונד"], answer: 1 },
    { q: "איך מגיבים ללחיצה על כפתור?", options: ["onHover", "onClick", "addEventListener('click', ...)", "ב ו-ג נכונות"], answer: 3 },
    { q: "מה זה Function?", options: ["משתנה מיוחד", "בלוק קוד שאפשר להפעיל מתי שרוצים", "תגית HTML", "סוג של לולאה"], answer: 1 },
    { q: "איך בוחרים אלמנט מ-HTML ב-JS?", options: ["document.getElementById(...)", "select(...)", "getElement(...)", "find(...)"], answer: 0 }
];

let currentQuestionIndex = 0;
let score = 0;
let timeLeft = 300; // 5 minutes
let timerInterval;

document.addEventListener('DOMContentLoaded', () => {
    const introScreen = document.getElementById('quiz-intro');
    const quizArea = document.getElementById('quiz-area');
    const resultScreen = document.getElementById('quiz-result');
    const startBtn = document.getElementById('start-quiz-btn');
    
    const qText = document.getElementById('question-text');
    const optionsContainer = document.getElementById('options-container');
    const currentQEl = document.getElementById('current-q');
    const scoreVal = document.getElementById('score-val');
    const timerEl = document.getElementById('timer');
    const feedbackEl = document.getElementById('feedback');

    startBtn.addEventListener('click', () => {
        introScreen.classList.add('hidden');
        quizArea.classList.remove('hidden');
        startTimer();
        loadQuestion();
    });

    function startTimer() {
        timerInterval = setInterval(() => {
            timeLeft--;
            let m = Math.floor(timeLeft / 60);
            let s = timeLeft % 60;
            timerEl.textContent = `${m < 10 ? '0'+m : m}:${s < 10 ? '0'+s : s}`;
            
            if(timeLeft <= 0) {
                clearInterval(timerInterval);
                endQuiz();
            }
        }, 1000);
    }

    function loadQuestion() {
        feedbackEl.classList.add('hidden');
        const q = questions[currentQuestionIndex];
        qText.textContent = q.q;
        currentQEl.textContent = currentQuestionIndex + 1;
        
        optionsContainer.innerHTML = '';
        q.options.forEach((opt, index) => {
            const btn = document.createElement('button');
            btn.className = 'option-btn';
            btn.textContent = opt;
            btn.onclick = () => checkAnswer(index, btn);
            optionsContainer.appendChild(btn);
        });
    }

    function checkAnswer(selectedIndex, btnElement) {
        // Disable all options
        const allBtns = optionsContainer.querySelectorAll('.option-btn');
        allBtns.forEach(b => b.disabled = true);

        const correctIndex = questions[currentQuestionIndex].answer;
        
        feedbackEl.classList.remove('hidden');

        if (selectedIndex === correctIndex) {
            btnElement.classList.add('correct');
            score += 10;
            scoreVal.textContent = score;
            feedbackEl.textContent = "פגיעה בול! +10 נק'";
            feedbackEl.className = 'feedback correct';
        } else {
            btnElement.classList.add('wrong');
            allBtns[correctIndex].classList.add('correct');
            feedbackEl.textContent = "פספסת...";
            feedbackEl.className = 'feedback wrong';
        }

        setTimeout(() => {
            currentQuestionIndex++;
            if (currentQuestionIndex < questions.length) {
                loadQuestion();
            } else {
                endQuiz();
            }
        }, 1500);
    }

    function endQuiz() {
        clearInterval(timerInterval);
        quizArea.classList.add('hidden');
        resultScreen.classList.remove('hidden');

        const finalScorePercent = Math.round((score / (questions.length * 10)) * 100);
        document.getElementById('final-score').textContent = finalScorePercent;
        
        const earnedXP = score * 5; // 50 XP per correct answer essentially
        document.getElementById('earned-xp').textContent = earnedXP;

        // Update mock user XP
        const userStr = localStorage.getItem('neon_user');
        if (userStr) {
            let user = JSON.parse(userStr);
            user.xp += earnedXP;
            if (user.xp >= user.level * 1000) {
                user.level++;
                user.xp = 0; // simple wrap
            }
            localStorage.setItem('neon_user', JSON.stringify(user));
        }

        if (finalScorePercent > 80) {
            document.getElementById('result-title').textContent = "ניצחון מוחץ! 🏆";
        } else if (finalScorePercent > 50) {
            document.getElementById('result-title').textContent = "כל הכבוד, אבל יש מקום לשיפור ⚔️";
        } else {
            document.getElementById('result-title').textContent = "הובסת... נסה שוב! 💀";
        }
    }
});
