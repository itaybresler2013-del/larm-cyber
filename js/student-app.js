// ==============================
// STUDENT APP LOGIC & PROMO ANIMATION
// ==============================

document.addEventListener('DOMContentLoaded', () => {
    // 1. Promo Animation Sequence
    const promo1 = document.getElementById('promo-text-1');
    const promo2 = document.getElementById('promo-text-2');
    const skills = document.getElementById('promo-skills');
    const promo3 = document.getElementById('promo-text-3');
    const startBtn = document.getElementById('start-btn');

    if (promo1 && window.location.hash === '' || window.location.hash === '#promo') {
        setTimeout(() => {
            if(promo2) promo2.classList.remove('hidden');
        }, 1500);

        setTimeout(() => {
            if(skills) skills.classList.remove('hidden');
        }, 3000);

        setTimeout(() => {
            if(promo3) promo3.classList.remove('hidden');
        }, 4500);

        setTimeout(() => {
            if(startBtn) startBtn.classList.remove('hidden');
        }, 5500);
    }

    // 2. Auth Tabs Switching
    const tabLogin = document.getElementById('tab-login');
    const tabRegister = document.getElementById('tab-register');
    const formLogin = document.getElementById('login-form');
    const formRegister = document.getElementById('register-form');

    if (tabLogin && tabRegister) {
        tabLogin.addEventListener('click', () => {
            tabLogin.classList.add('active');
            tabRegister.classList.remove('active');
            formLogin.classList.remove('hidden');
            formRegister.classList.add('hidden');
        });

        tabRegister.addEventListener('click', () => {
            tabRegister.classList.add('active');
            tabLogin.classList.remove('active');
            formRegister.classList.remove('hidden');
            formLogin.classList.add('hidden');
        });
    }

    // Temporary Auth Bypass (until Firebase is fully wired)
    // For demo purposes, allow clicking "Login" to go to dashboard
    if(formLogin) {
        formLogin.addEventListener('submit', (e) => {
            e.preventDefault();
            const btn = formLogin.querySelector('button');
            const originalText = btn.innerText;
            btn.innerText = 'מתחבר...';
            setTimeout(() => {
                btn.innerText = originalText;
                window.location.hash = '#larn';
                showAchievement('התחברות מוצלחת', 'ברוך הבא למערכת!');
            }, 1000);
        });
    }

    if(formRegister) {
        formRegister.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('register-name').value;
            const btn = formRegister.querySelector('button');
            const originalText = btn.innerText;
            btn.innerText = 'יוצר שחקן...';
            setTimeout(() => {
                btn.innerText = originalText;
                document.getElementById('user-name').innerText = name || 'CyberPlayer';
                window.location.hash = '#larn';
                showAchievement('שחקן חדש נולד', '+100 XP על ההרשמה');
                updateXP(100);
            }, 1000);
        });
    }

    // 3. Dashboard Logic
    const btnLearn = document.getElementById('btn-learn');
    const backToDash = document.getElementById('back-to-dashboard');
    const dashView = document.getElementById('dashboard-view');
    const learnView = document.getElementById('learning-view');

    if (btnLearn && backToDash) {
        btnLearn.addEventListener('click', () => {
            dashView.classList.add('hidden');
            learnView.classList.remove('hidden');
        });

        backToDash.addEventListener('click', () => {
            learnView.classList.add('hidden');
            dashView.classList.remove('hidden');
        });
    }

    // Daily Claim
    const claimDaily = document.getElementById('claim-daily');
    if (claimDaily) {
        claimDaily.addEventListener('click', () => {
            claimDaily.innerText = 'נאסף!';
            claimDaily.disabled = true;
            claimDaily.classList.remove('btn-neon');
            claimDaily.style.background = 'gray';
            claimDaily.style.borderColor = 'gray';
            updateXP(50);
            showAchievement('משימה יומית', 'אספת 50 XP יומי!');
        });
    }
});

// XP System
let currentXP = 0;
function updateXP(amount) {
    currentXP += amount;
    const xpElement = document.getElementById('user-xp');
    const xpFill = document.getElementById('xp-fill');
    if(xpElement) xpElement.innerText = currentXP;
    
    // Animate progress bar (max 1000 for level 1)
    if(xpFill) {
        let percent = (currentXP / 1000) * 100;
        if(percent > 100) percent = 100;
        xpFill.style.width = percent + '%';
    }
}

// Global Achievement System
window.showAchievement = function(title, text) {
    const popup = document.getElementById('achievement-popup');
    const popupText = document.getElementById('achievement-text');
    
    if (popup && popupText) {
        popup.querySelector('h4').innerText = title;
        popupText.innerText = text;
        popup.classList.remove('hidden');
        
        // Remove animation class to restart it if needed
        popup.style.animation = 'none';
        popup.offsetHeight; /* trigger reflow */
        popup.style.animation = null; 
        
        setTimeout(() => {
            popup.classList.add('hidden');
        }, 4000);
    }
}
