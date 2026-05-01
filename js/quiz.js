// ==============================
// QUIZ ENGINE (BOSS FIGHT)
// ==============================

document.addEventListener('DOMContentLoaded', () => {
    const startQuizBtn = document.getElementById('start-quiz-btn');
    const quizIntro = document.getElementById('quiz-intro');
    const quizArea = document.getElementById('quiz-area');
    const quizResult = document.getElementById('quiz-result');
    
    const questionText = document.getElementById('question-text');
    const optionsContainer = document.getElementById('options-container');
    const currentQSpan = document.getElementById('current-q');
    const scoreValSpan = document.getElementById('score-val');
    const timerSpan = document.getElementById('timer');
    const feedbackDiv = document.getElementById('feedback');
    const finalScoreSpan = document.getElementById('final-score');
    const earnedXpSpan = document.getElementById('earned-xp');

    let currentQuestionIndex = 0;
    let score = 0;
    let timerInterval;
    let timeLeft = 300; // 5 minutes total
    let isAnswering = false;

    // Database of questions
    const questions = [
        // HTML
        { q: "מה התגית של כותרת ראשית ב-HTML?", options: ["<title>", "<h1>", "<head>", "<header>"], answer: 1 },
        { q: "איך מוסיפים תמונה?", options: ["<image src='...'>", "<img href='...'>", "<img src='...'>", "<pic src='...'>"], answer: 2 },
        { q: "מה התפקיד של תגית <a>?", options: ["להוסיף פסקה", "להוסיף קישור", "להדגיש טקסט", "ליצור טבלה"], answer: 1 },
        { q: "איך יוצרים רשימה עם תבליטים (לא ממוספרת)?", options: ["<ol>", "<li>", "<list>", "<ul>"], answer: 3 },
        { q: "איזה חלק מכיל את התוכן שמוצג על המסך?", options: ["<head>", "<body>", "<html>", "<title>"], answer: 1 },
        // CSS
        { q: "איך משנים צבע טקסט ב-CSS?", options: ["text-color: red;", "font-color: red;", "color: red;", "background: red;"], answer: 2 },
        { q: "מה תפקידו של Flexbox?", options: ["לשנות צבעים", "לסדר אלמנטים בצורה גמישה", "להוסיף תמונות", "ליצור לולאות"], answer: 1 },
        { q: "איך מוסיפים אפקט כשמעבירים את העכבר (Hover)?", options: [":hover", ":active", "onHover", ":focus"], answer: 0 },
        { q: "מה זה Margin ב-CSS?", options: ["מרווח פנימי", "גודל גופן", "מרווח חיצוני", "צבע גבול"], answer: 2 },
        { q: "איך עושים מעבר צבעים (Gradient) ברקע?", options: ["background-color", "linear-gradient", "color-transition", "gradient-bg"], answer: 1 },
        // JS
        { q: "איך מגדירים משתנה שאי אפשר לשנות ב-JavaScript?", options: ["var", "let", "const", "static"], answer: 2 },
        { q: "מה הפקודה alert() עושה?", options: ["מדפיסה ללוג", "מקפיצה חלונית למשתמש", "מוחקת משתנה", "טוענת מחדש את הדף"], answer: 1 },
        { q: "איך מגיבים ללחיצה של משתמש על כפתור?", options: ["onHover", "onSubmit", "onClick", "onPress"], answer: 2 },
        { q: "מהי פונקציה (Function)?", options: ["סוג של משתנה", "בלוק קוד שמבצע משימה ספציפית", "תגית HTML", "סגנון CSS"], answer: 1 },
        { q: "איך משנים טקסט של אלמנט דרך JS?", options: ["element.text", "element.innerHTML", "element.changeText", "element.css"], answer: 1 }
    ];

    function startQuiz() {
        if (!quizIntro || !quizArea) return;
        
        quizIntro.classList.add('hidden');
        quizArea.classList.remove('hidden');
        
        currentQuestionIndex = 0;
        score = 0;
        timeLeft = 300;
        scoreValSpan.innerText = score;
        
        // Trigger Anti-Cheat if exists
        if(window.activateAntiCheat) window.activateAntiCheat();
        
        startTimer();
        loadQuestion();
    }

    function startTimer() {
        clearInterval(timerInterval);
        timerInterval = setInterval(() => {
            timeLeft--;
            let m = Math.floor(timeLeft / 60);
            let s = timeLeft % 60;
            timerSpan.innerText = `0${m}:${s < 10 ? '0'+s : s}`;
            
            if (timeLeft <= 0) {
                endQuiz();
            }
        }, 1000);
    }

    function loadQuestion() {
        isAnswering = false;
        feedbackDiv.classList.add('hidden');
        feedbackDiv.className = 'feedback hidden'; // reset classes
        
        if (currentQuestionIndex >= questions.length) {
            endQuiz();
            return;
        }

        const qData = questions[currentQuestionIndex];
        currentQSpan.innerText = currentQuestionIndex + 1;
        questionText.innerText = qData.q;
        
        optionsContainer.innerHTML = '';
        
        qData.options.forEach((opt, index) => {
            const btn = document.createElement('div');
            btn.className = 'option-btn fade-in';
            btn.style.animationDelay = `${index * 0.1}s`;
            btn.innerText = opt;
            
            btn.addEventListener('click', () => {
                if(isAnswering) return;
                checkAnswer(index, btn);
            });
            
            optionsContainer.appendChild(btn);
        });
    }

    function checkAnswer(selectedIndex, btnElement) {
        isAnswering = true;
        const qData = questions[currentQuestionIndex];
        const isCorrect = selectedIndex === qData.answer;
        
        // Highlight correct/wrong
        if (isCorrect) {
            btnElement.classList.add('correct');
            score += 10;
            scoreValSpan.innerText = score;
            feedbackDiv.innerText = "מעולה! תשובה נכונה +10 נק'";
            feedbackDiv.classList.add('correct');
        } else {
            btnElement.classList.add('wrong');
            // Show correct one
            optionsContainer.children[qData.answer].classList.add('correct');
            feedbackDiv.innerText = "טעות! התשובה הנכונה סומנה בירוק.";
            feedbackDiv.classList.add('wrong');
        }
        
        feedbackDiv.classList.remove('hidden');
        
        setTimeout(() => {
            currentQuestionIndex++;
            loadQuestion();
        }, 2000);
    }

    function endQuiz() {
        clearInterval(timerInterval);
        quizArea.classList.add('hidden');
        quizResult.classList.remove('hidden');
        
        // Disable Anti-Cheat
        if(window.deactivateAntiCheat) window.deactivateAntiCheat();
        
        const maxScore = questions.length * 10;
        const percent = Math.round((score / maxScore) * 100);
        const xpEarned = score * 5; // 50 XP per question
        
        finalScoreSpan.innerText = percent;
        earnedXpSpan.innerText = xpEarned;
        
        if (window.updateXP) window.updateXP(xpEarned);
        if (window.showAchievement) {
            window.showAchievement('Boss Defeated!', `סיימת את המבחן והרווחת ${xpEarned} XP!`);
        }
    }

    if (startQuizBtn) {
        startQuizBtn.addEventListener('click', startQuiz);
    }
});
