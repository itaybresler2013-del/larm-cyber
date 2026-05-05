/* ============================================================
   CYBER LEARN — MAIN APPLICATION (Part 1: Core + Auth + Router)
   ============================================================ */

// ===== FIREBASE CONFIG =====
const firebaseConfig = {
    apiKey: "AIzaSyBboyiqvQCc3j0TSV28mUKAUunJ6ANLW5A",
    authDomain: "larm-cyber.firebaseapp.com",
    databaseURL: "https://larm-cyber-default-rtdb.firebaseio.com",
    projectId: "larm-cyber",
    storageBucket: "larm-cyber.firebasestorage.app",
    messagingSenderId: "511914130904",
    appId: "1:511914130904:web:fa36f55153b93e338646ad",
    measurementId: "G-CE0BWBJ6DJ"
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// ===== STATE =====
let currentUser = null;
let userData = null;
let currentPage = 'home';
let currentCat = 'html';
let currentLessonIndex = 0;
let currentStepIndex = 0;
let quizQuestions = [];
let quizIndex = 0;
let quizScore = 0;
let quizTimer = null;
let quizTimeLeft = 30;
let quizCat = 'all';
let quizAnsweredThisQ = false;
let studyTimer = null;
let studySeconds = 0;
let unsubLeaderboard = null;
let adminCharts = {};
let selectedAvatar = '🚀';
let aiOpen = false;
let antiCheatActive = false;
let pendingRegData = null; // holds registration fields across the auth state observer race

const AVATARS = ['🚀', '⚡', '🔥', '💎', '🌟', '🎮', '🤖', '👾', '🦊', '🐉', '🎯', '💜', '🌙', '☀️', '🏆'];

const RANKS = [
    { min: 0, name: 'ROOKIE', badge: '🌱' },
    { min: 100, name: 'WARRIOR', badge: '⚔️' },
    { min: 300, name: 'KNIGHT', badge: '🛡️' },
    { min: 600, name: 'MAGE', badge: '🔮' },
    { min: 1000, name: 'CHAMPION', badge: '🏆' },
    { min: 1500, name: 'LEGEND', badge: '🌟' },
    { min: 2500, name: 'MASTER', badge: '💎' },
    { min: 4000, name: 'GRANDMASTER', badge: '👑' },
];

function getRankInfo(xp) {
    let r = RANKS[0];
    for (const rank of RANKS) { if (xp >= rank.min) r = rank; }
    const idx = RANKS.indexOf(r);
    const next = RANKS[idx + 1];
    const level = idx + 1;
    const progress = next ? Math.round(((xp - r.min) / (next.min - r.min)) * 100) : 100;
    return { ...r, level, next: next ? next.name : 'MAX', nextXP: next ? next.min : r.min, progress };
}

// ===== PARTICLES =====
const canvas = document.getElementById('particles-canvas');
const ctx = canvas.getContext('2d');
let particles = [];

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

function createParticle() {
    return {
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        r: Math.random() * 2 + 0.5,
        a: Math.random() * 0.6 + 0.1,
        color: Math.random() > 0.5 ? '#00d4ff' : '#b400ff'
    };
}

function initParticles() {
    resizeCanvas();
    particles = Array.from({ length: 80 }, createParticle);
    animParticles();
}

function animParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.a;
        ctx.fill();
        ctx.globalAlpha = 1;
    });
    // draw connections
    for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 100) {
                ctx.beginPath();
                ctx.moveTo(particles[i].x, particles[i].y);
                ctx.lineTo(particles[j].x, particles[j].y);
                ctx.strokeStyle = '#00d4ff';
                ctx.globalAlpha = (1 - dist / 100) * 0.08;
                ctx.lineWidth = 0.5;
                ctx.stroke();
                ctx.globalAlpha = 1;
            }
        }
    }
    requestAnimationFrame(animParticles);
}

window.addEventListener('resize', resizeCanvas);

// ===== LOADING SCREEN =====
function showLoading(msg) {
    document.getElementById('loading-screen').style.display = 'flex';
    if (msg) document.getElementById('loader-status').textContent = msg;
}

function updateLoader(pct, msg) {
    document.getElementById('loader-fill').style.width = pct + '%';
    if (msg) document.getElementById('loader-status').textContent = msg;
}

function hideLoading() {
    const ls = document.getElementById('loading-screen');
    ls.style.opacity = '0';
    ls.style.transition = 'opacity 0.5s';
    setTimeout(() => ls.style.display = 'none', 500);
}

// ===== NOTIFICATIONS =====
function showNotif(msg, type = 'info') {
    const n = document.getElementById('notif');
    n.textContent = msg;
    n.className = 'notif';
    n.classList.remove('hidden');
    setTimeout(() => n.classList.add('hidden'), 3000);
}

function showXPFloat(amount) {
    const el = document.getElementById('xp-float');
    el.textContent = '+' + amount + ' XP!';
    el.className = 'xp-float';
    el.classList.remove('hidden');
    setTimeout(() => el.classList.add('hidden'), 1600);
}

function showAchToast(ach) {
    document.getElementById('ach-toast-icon').textContent = ach.icon;
    document.getElementById('ach-toast-name').textContent = ach.name;
    document.getElementById('ach-toast-xp').textContent = '+' + ach.xp + ' XP';
    const t = document.getElementById('ach-toast');
    t.classList.remove('hidden');
    setTimeout(() => t.classList.add('hidden'), 4000);
}

// ===== AUTH TAB =====
function showTab(tab) {
    document.getElementById('login-form').classList.toggle('hidden', tab !== 'login');
    document.getElementById('reg-form').classList.toggle('hidden', tab !== 'register');
    document.getElementById('tab-login').classList.toggle('active', tab === 'login');
    document.getElementById('tab-reg').classList.toggle('active', tab === 'register');
}

// ===== AVATAR PICKER =====
function initAvatarPicker() {
    const grid = document.getElementById('avatar-grid');
    if (!grid) return;
    grid.innerHTML = '';
    AVATARS.forEach(a => {
        const el = document.createElement('div');
        el.className = 'avatar-opt' + (a === selectedAvatar ? ' selected' : '');
        el.textContent = a;
        el.onclick = () => {
            selectedAvatar = a;
            grid.querySelectorAll('.avatar-opt').forEach(o => o.classList.remove('selected'));
            el.classList.add('selected');
        };
        grid.appendChild(el);
    });
}

// ===== HELPERS =====
function makeUserDoc(name) {
    const now = new Date();
    return {
        name: name || 'Player',
        xp: 0, level: 1,
        completedLessons: { html: [], css: [], js: [] },
        quizResults: [],
        lastLogin: now.toISOString(),
        lastLoginDate: now.toDateString(),
        loginStreak: 1,
        totalStudyTime: 0,
        isAdmin: false,
        achievements: [],
        dailyMissions: null,
        rank: '#--',
        createdAt: now.toISOString()
    };
}

function authErr(errEl, msg) {
    errEl.textContent = msg;
    errEl.classList.remove('hidden');
}

function resetBtn(btn, text) {
    if (!btn) return;
    btn.disabled = false;
    const sp = btn.querySelector('span');
    if (sp) sp.textContent = text; else btn.textContent = text;
}

function setBtnLoading(btn, text) {
    if (!btn) return;
    btn.disabled = true;
    const sp = btn.querySelector('span');
    if (sp) sp.textContent = text; else btn.textContent = text;
}

// ===== LOCAL STORAGE =====
function _lsGet(k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch { return null; } }
function _lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { } }
function _lsDel(k) { try { localStorage.removeItem(k); } catch { } }

function getLocalUser(uid) { const d = _lsGet('cl_user'); return (d && d.id === uid) ? d : null; }
function setLocalUser(data) { if (data) _lsSet('cl_user', data); }
function clearLocalUser() { _lsDel('cl_user'); }
function getLocalSession() { return _lsGet('cl_session'); }
function localLogout() { _lsDel('cl_session'); _lsDel('cl_user'); }
function localAccounts() { return _lsGet('cl_accounts') || {}; }
function saveAccounts(a) { _lsSet('cl_accounts', a); }

// The 6-char code is the unique key (stored as base64)
function codeKey(code) { return btoa(code); }

// ===== LOCAL REGISTER =====
// Returns full user object, or { error } on failure
function localRegister(name, code) {
    const key = codeKey(code);
    const acc = localAccounts();
    if (acc[key]) return { error: 'code-taken' };
    const doc = makeUserDoc(name);
    const full = { id: key, ...doc };
    acc[key] = { name };
    saveAccounts(acc);
    setLocalUser(full);
    _lsSet('cl_session', { uid: key, name });
    // Sync to Firestore in background — won't block login
    db.collection('users').doc(key).set(doc).catch(e => console.warn('Firestore:', e.code));
    return full;
}

// ===== LOCAL LOGIN =====
// Returns full user object, or { error } on failure
async function localLogin(code) {
    const key = codeKey(code);
    const acc = localAccounts();

    // Check local cache first
    if (acc[key]) {
        const stored = getLocalUser(key);
        if (stored) { _lsSet('cl_session', { uid: key, name: stored.name }); return stored; }
        const doc = makeUserDoc(acc[key].name);
        const full = { id: key, ...doc };
        setLocalUser(full);
        _lsSet('cl_session', { uid: key, name: acc[key].name });
        return full;
    }

    // Not in local cache — try Firestore (e.g. user registered on another device)
    try {
        const snap = await withTimeout(db.collection('users').doc(key).get(), 4000);
        if (snap.exists) {
            const data = { id: key, ...snap.data() };
            acc[key] = { name: data.name };
            saveAccounts(acc);
            setLocalUser(data);
            _lsSet('cl_session', { uid: key, name: data.name });
            return data;
        }
    } catch (_) { }

    return { error: 'not-found' };
}

// ===== ENTER APP =====
function enterApp() {
    const ls = qs('#loading-screen');
    ls.style.display = 'flex';
    ls.style.opacity = '1';
    ls.style.transition = '';
    updateLoader(85, 'מכין סביבה...');
    qs('#auth-section').classList.add('hidden');
    qs('#main-app').classList.remove('hidden');
    if (userData && userData.isAdmin)
        document.querySelectorAll('.admin-link').forEach(el => el.classList.remove('hidden'));
    updateXPDisplay();
    updateLoader(100, 'מוכן!');
    setTimeout(hideLoading, 500);
    startStudyTimer();
    const hash = location.hash.replace('#', '').toLowerCase();
    const aliases = { larn: 'learn', qoiz: 'quiz' };
    const target = aliases[hash] || hash || 'home';
    go(['home', 'learn', 'quiz', 'sandbox', 'admin', 'profile', 'achievements'].includes(target) ? target : 'home');
}

// ===== LOGIN =====
async function doLogin(e) {
    e.preventDefault();
    const code = qs('#l-pass').value;
    const errEl = qs('#l-err');
    const btn = e.target.querySelector('button[type="submit"]');

    errEl.classList.add('hidden');
    if (code.length !== 6) { authErr(errEl, 'הקוד חייב להיות בדיוק 6 תווים'); return; }

    setBtnLoading(btn, 'מתחבר...');
    let result;
    try { result = await localLogin(code); } catch (err) {
        resetBtn(btn, 'כנס למערכת ⚡');
        authErr(errEl, 'שגיאה: ' + (err.message || err));
        return;
    }

    if (result.error) {
        resetBtn(btn, 'כנס למערכת ⚡');
        authErr(errEl, 'קוד גישה שגוי — בדוק ונסה שוב');
        return;
    }

    currentUser = { uid: result.id };
    userData = result;
    try { await handleDailyLogin(); } catch (_) { }
    try { enterApp(); } catch (err) {
        resetBtn(btn, 'כנס למערכת ⚡');
        authErr(errEl, 'שגיאה בטעינה: ' + (err.message || err));
        console.error('enterApp error:', err);
    }
}

// ===== REGISTER =====
function doRegister(e) {
    e.preventDefault();
    const name = qs('#r-name').value.trim();
    const code = qs('#r-pass').value;
    const errEl = qs('#r-err');
    const btn = e.target.querySelector('button[type="submit"]');

    errEl.classList.add('hidden');
    if (!name) { authErr(errEl, 'נא להזין שם משתמש'); return; }
    if (code.length !== 6) { authErr(errEl, 'הקוד חייב להיות בדיוק 6 תווים'); return; }
    if (!/^[\x20-\x7E]{6}$/.test(code)) { authErr(errEl, 'השתמש רק באותיות לטיניות ומספרים בקוד'); return; }

    setBtnLoading(btn, 'יוצר חשבון...');

    let result;
    try { result = localRegister(name, code); } catch (err) {
        resetBtn(btn, 'הצטרף לקרב! 🚀');
        authErr(errEl, 'שגיאה: ' + (err.message || err));
        return;
    }

    if (result.error) {
        resetBtn(btn, 'הצטרף לקרב! 🚀');
        authErr(errEl, 'הקוד הזה כבר בשימוש — בחר קוד אחר');
        return;
    }

    currentUser = { uid: result.id };
    userData = result;
    try { enterApp(); } catch (err) {
        resetBtn(btn, 'הצטרף לקרב! 🚀');
        authErr(errEl, 'שגיאה בטעינה: ' + (err.message || err));
        console.error('enterApp error:', err);
    }
}

// ===== LOGOUT =====
async function doLogout() {
    stopStudyTimer();
    if (unsubLeaderboard) { unsubLeaderboard(); unsubLeaderboard = null; }
    currentUser = null;
    userData = null;
    localLogout();
    qs('#main-app').classList.add('hidden');
    showAuth();
    try { await auth.signOut(); } catch (_) { }
}

function translateAuthError(code) {
    const map = {
        'auth/user-not-found': 'משתמש לא קיים — בדוק את האימייל',
        'auth/wrong-password': 'סיסמה שגויה — נסה שוב',
        'auth/email-already-in-use': 'האימייל כבר רשום — עבור לכניסה',
        'auth/weak-password': 'הסיסמה קצרה מדי (מינימום 6 תווים)',
        'auth/invalid-email': 'כתובת האימייל לא תקינה',
        'auth/too-many-requests': 'יותר מדי ניסיונות — המתן מספר דקות',
        'auth/invalid-credential': 'אימייל או סיסמה שגויים',
        'auth/operation-not-allowed': 'כניסה באימייל לא מופעלת — הפעל ב-Firebase Console',
        'auth/network-request-failed': 'בעיית חיבור לאינטרנט — בדוק את החיבור',
        'auth/timeout': 'השרת לא ענה — בדוק חיבור אינטרנט ונסה שוב',
        'auth/popup-closed-by-user': 'החלון נסגר לפני השלמה',
        'auth/requires-recent-login': 'נדרשת כניסה מחדש לפעולה זו',
    };
    return map[code] || 'שגיאה: ' + code;
}

function switchToLogin(email) {
    showTab('login');
    if (email) document.getElementById('l-email').value = email;
    document.getElementById('l-pass').focus();
    showNotif('📧 הזן את הסיסמה שלך להתחברות');
}

// ===== STUDY TIMER =====
function startStudyTimer() {
    stopStudyTimer();
    studySeconds = 0;
    studyTimer = setInterval(() => {
        studySeconds++;
        if (studySeconds % 60 === 0) {
            db.collection('users').doc(currentUser.uid).update({
                totalStudyTime: firebase.firestore.FieldValue.increment(1)
            }).catch(() => { });
        }
    }, 1000);
}
function stopStudyTimer() {
    if (studyTimer) { clearInterval(studyTimer); studyTimer = null; }
}


function updateUser(data) {
    if (!currentUser || !userData) return;
    userData = { ...userData, ...data };
    setLocalUser(userData);
    // Fire-and-forget — never await Firestore so callers don't hang if offline
    db.collection('users').doc(currentUser.uid).update(data)
        .catch(e => console.warn('Firestore update skipped:', e.code || e.message));
}

// ===== XP SYSTEM =====
async function addXP(amount, source = '') {
    if (!currentUser || !userData) return;
    const oldXP = userData.xp || 0;
    const newXP = oldXP + amount;
    const oldRank = getRankInfo(oldXP);
    const newRank = getRankInfo(newXP);

    updateUser({ xp: newXP, level: newRank.level });
    userData.xp = newXP;
    userData.level = newRank.level;

    showXPFloat(amount);
    updateXPDisplay();

    if (newRank.level > oldRank.level) {
        showNotif('🎉 LEVEL UP! ברוך הבא לרמה ' + newRank.level + ' — ' + newRank.name, 'success');
        setTimeout(() => {
            document.getElementById('xp-float').textContent = '⚡ LEVEL UP!';
            document.getElementById('xp-float').classList.remove('hidden');
            setTimeout(() => document.getElementById('xp-float').classList.add('hidden'), 2000);
        }, 1700);
    }

    // Log to Firebase
    db.collection('logs').add({
        uid: currentUser.uid,
        name: userData.name,
        type: 'xp',
        amount,
        source,
        xpTotal: newXP,
        ts: new Date().toISOString()
    }).catch(() => { });
}

function updateXPDisplay() {
    if (!userData) return;
    const xp = userData.xp || 0;
    const info = getRankInfo(xp);

    // Nav
    qs('#nav-lv').textContent = 'LV.' + info.level;
    qs('#nav-xpfill').style.width = info.progress + '%';

    // Home
    qs('#h-lv-badge').textContent = 'LV.' + info.level;
    qs('#h-rank-title').textContent = info.name;
    qs('#h-xp').textContent = xp;
    qs('#h-xp-max').textContent = info.nextXP;
    qs('#h-xpfill').style.width = info.progress + '%';
    qs('#h-next-rank').textContent = info.next;
}

// ===== ROUTER =====
function go(page) {
    if (page === currentPage && page !== 'learn') return;
    currentPage = page;

    // Update hash
    const hashMap = { home: 'home', learn: 'learn', quiz: 'quiz', sandbox: 'sandbox', admin: 'admin', profile: 'profile', achievements: 'achievements' };
    window.location.hash = hashMap[page] || page;

    // Hide all pages
    document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));

    // Show target
    const target = document.getElementById('page-' + page);
    if (target) target.classList.remove('hidden');

    // Update nav active
    document.querySelectorAll('.nlink').forEach(l => {
        l.classList.toggle('active', l.dataset.page === page);
    });

    // Page-specific setup
    switch (page) {
        case 'home': setupHome(); break;
        case 'learn': setupLearn(); break;
        case 'quiz': setupQuiz(); break;
        case 'sandbox': setupSandbox(); break;
        case 'admin': setupAdmin(); break;
        case 'profile': setupProfile(); break;
        case 'achievements': setupAchievements(); break;
    }

    window.scrollTo(0, 0);
}

function handleHash() {
    const hash = window.location.hash.replace('#', '').toLowerCase();
    const validPages = ['home', 'learn', 'quiz', 'sandbox', 'admin', 'profile', 'achievements'];
    // support typo routes from spec
    const aliases = { larn: 'learn', qoiz: 'quiz' };
    const page = aliases[hash] || (validPages.includes(hash) ? hash : null);
    if (page && currentUser) go(page);
    else if (!currentUser && hash !== 'login') showAuth();
}

function toggleNav() {
    qs('#nav-links').classList.toggle('open');
}

// ===== AUTH STATE =====
// Used only for page-reload session restore (login/register go through doLogin/doRegister)
auth.onAuthStateChanged(async () => {
    if (currentUser) return; // already handled by doLogin / doRegister
    const session = getLocalSession();
    if (session) {
        const localData = getLocalUser(session.uid);
        if (localData) {
            currentUser = { uid: session.uid };
            userData = localData;
            try { await handleDailyLogin(); } catch (_) { }
            enterApp();
            return;
        }
    }
    // No session — show auth
    stopStudyTimer();
    qs('#main-app').classList.add('hidden');
    showAuth();
});

function showAuth() {
    qs('#auth-section').classList.remove('hidden');
    hideLoading();
}

async function handleDailyLogin() {
    if (!userData) return;
    const now = new Date();
    const todayStr = now.toDateString();
    const lastStr = userData.lastLoginDate || '';
    const yesterday = new Date(now - 86400000).toDateString();

    let streak = userData.loginStreak || 1;
    if (lastStr === todayStr) {
        // same day, no change
    } else if (lastStr === yesterday) {
        streak++;
    } else if (lastStr !== todayStr) {
        streak = 1;
    }

    updateUser({
        lastLogin: now.toISOString(),
        lastLoginDate: todayStr,
        loginStreak: streak
    });
    userData.loginStreak = streak;
    userData.lastLoginDate = todayStr;

    // Generate daily missions if needed
    if (!userData.dailyMissions || userData.dailyMissions.date !== todayStr) {
        const missions = generateDailyMissions();
        updateUser({ dailyMissions: { date: todayStr, missions } });
        userData.dailyMissions = { date: todayStr, missions };
    }
}

// ===== HOME =====
function setupHome() {
    if (!userData) return;
    const xp = userData.xp || 0;
    const info = getRankInfo(xp);

    qs('#h-name').textContent = (userData.name || 'Player').split(' ')[0];
    qs('#h-streak').textContent = userData.loginStreak || 1;

    const completed = getAllCompletedCount();
    qs('#h-lessons').textContent = completed;

    // Avatar in nav
    qs('#nav-avatar').textContent = userData.avatar || '🚀';

    // Progress bars
    const htmlDone = (userData.completedLessons?.html || []).length;
    const cssDone = (userData.completedLessons?.css || []).length;
    const jsDone = (userData.completedLessons?.js || []).length;
    const htmlTotal = COURSES.html.length;
    const cssTotal = COURSES.css.length;
    const jsTotal = COURSES.js.length;

    const hp = Math.round(htmlDone / htmlTotal * 100);
    const cp = Math.round(cssDone / cssTotal * 100);
    const jp = Math.round(jsDone / jsTotal * 100);

    qs('#prog-html').style.width = hp + '%';
    qs('#prog-css').style.width = cp + '%';
    qs('#prog-js').style.width = jp + '%';
    qs('#prog-html-pct').textContent = hp + '%';
    qs('#prog-css-pct').textContent = cp + '%';
    qs('#prog-js-pct').textContent = jp + '%';

    renderDailyMissions();
    renderAchievements();
    loadLeaderboard();
    startMissionTimer();
}

function getAllCompletedCount() {
    if (!userData) return 0;
    const h = (userData.completedLessons?.html || []).length;
    const c = (userData.completedLessons?.css || []).length;
    const j = (userData.completedLessons?.js || []).length;
    return h + c + j;
}

// ===== DAILY MISSIONS =====
const MISSION_TEMPLATES = [
    { id: 'm1', icon: '📚', name: 'לומד נמרץ', desc: 'השלם שיעור אחד', xp: 30, type: 'lesson', target: 1 },
    { id: 'm2', icon: '⚔️', name: 'לוחם בוס', desc: 'עבור מבחן ב-70%+', xp: 50, type: 'quiz70', target: 1 },
    { id: 'm3', icon: '🔧', name: 'מפתח', desc: 'כתוב קוד ב-Sandbox', xp: 20, type: 'sandbox', target: 1 },
    { id: 'm4', icon: '🎯', name: 'מדויק', desc: 'ענה נכון על 5 שאלות', xp: 40, type: 'correct5', target: 5 },
    { id: 'm5', icon: '🔥', name: 'על הגל', desc: 'השלם 3 שיעורים היום', xp: 70, type: 'lesson3', target: 3 },
];

function generateDailyMissions() {
    const shuffled = [...MISSION_TEMPLATES].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 3).map(m => ({ ...m, done: false, progress: 0 }));
}

function renderDailyMissions() {
    const el = qs('#missions-list');
    if (!el || !userData?.dailyMissions) return;
    const missions = userData.dailyMissions.missions || [];
    el.innerHTML = missions.map(m => `
    <div class="mission-item ${m.done ? 'done' : ''}">
      <div class="mission-icon">${m.icon}</div>
      <div class="mission-text">
        <div class="mission-name">${m.name}</div>
        <div class="mission-desc">${m.desc}</div>
      </div>
      <div class="mission-xp">+${m.xp} XP</div>
      <div class="mission-check">${m.done ? '✓' : ''}</div>
    </div>
  `).join('');
}

function startMissionTimer() {
    const el = qs('#mission-timer');
    if (!el) return;
    function update() {
        const now = new Date();
        const midnight = new Date(now);
        midnight.setHours(24, 0, 0, 0);
        const diff = midnight - now;
        const h = Math.floor(diff / 3600000).toString().padStart(2, '0');
        const m = Math.floor((diff % 3600000) / 60000).toString().padStart(2, '0');
        const s = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0');
        if (el) el.textContent = h + ':' + m + ':' + s;
    }
    update();
    setInterval(update, 1000);
}

async function completeMission(type) {
    if (!userData?.dailyMissions) return;
    const missions = userData.dailyMissions.missions;
    let changed = false;
    for (const m of missions) {
        if (m.type === type && !m.done) {
            m.progress = (m.progress || 0) + 1;
            if (m.progress >= m.target) {
                m.done = true;
                changed = true;
                await addXP(m.xp, 'daily_mission');
                showNotif('🎯 Mission Complete: ' + m.name + ' +' + m.xp + ' XP!');
            }
        }
    }
    if (changed) {
        updateUser({ dailyMissions: userData.dailyMissions });
        renderDailyMissions();
        checkAchievements();
    }
}

// ===== LEADERBOARD =====
function loadLeaderboard() {
    const el = qs('#lb-list');
    if (!el) return;
    if (unsubLeaderboard) unsubLeaderboard();
    unsubLeaderboard = db.collection('users').orderBy('xp', 'desc').limit(10)
        .onSnapshot(snap => {
            let html = '';
            let rank = 1;
            snap.forEach(doc => {
                const d = doc.data();
                const isMe = doc.id === currentUser?.uid;
                const rankClass = rank <= 3 ? 'r' + rank : '';
                html += `<div class="lb-item ${isMe ? 'me' : ''}">
          <div class="lb-rank ${rankClass}">${rank <= 3 ? ['🥇', '🥈', '🥉'][rank - 1] : rank}</div>
          <div class="lb-avatar">${d.avatar || '🚀'}</div>
          <div class="lb-name">${d.name || 'Player'}${isMe ? ' (אתה)' : ''}</div>
          <div class="lb-xp">⚡ ${d.xp || 0}</div>
        </div>`;
                rank++;
            });
            if (el) el.innerHTML = html || '<div class="tc">אין שחקנים עדיין</div>';

            // Update user rank
            if (userData) {
                const myRank = snap.docs.findIndex(d => d.id === currentUser?.uid) + 1;
                if (myRank > 0 && qs('#h-rank')) qs('#h-rank').textContent = '#' + myRank;
            }
        }, () => {
            if (el) el.innerHTML = '<div class="tc">שגיאה בטעינה</div>';
        });
}

// ===== ACHIEVEMENTS =====
const ACHIEVEMENTS_LIST = [
    { id: 'first_lesson', icon: '📚', name: 'First Step', desc: 'השלם שיעור ראשון', xp: 50, check: d => getAllCompletedCount() >= 1 },
    { id: 'lesson_5', icon: '🎓', name: 'Student', desc: 'השלם 5 שיעורים', xp: 100, check: d => getAllCompletedCount() >= 5 },
    { id: 'lesson_20', icon: '🏆', name: 'Scholar', desc: 'השלם 20 שיעורים', xp: 200, check: d => getAllCompletedCount() >= 20 },
    { id: 'html_done', icon: '🌐', name: 'HTML Master', desc: 'סיים את כל שיעורי HTML', xp: 150, check: d => (d.completedLessons?.html || []).length >= COURSES.html.length },
    { id: 'css_done', icon: '🎨', name: 'CSS Master', desc: 'סיים את כל שיעורי CSS', xp: 150, check: d => (d.completedLessons?.css || []).length >= COURSES.css.length },
    { id: 'js_done', icon: '⚡', name: 'JS Master', desc: 'סיים את כל שיעורי JS', xp: 150, check: d => (d.completedLessons?.js || []).length >= COURSES.js.length },
    { id: 'quiz_first', icon: '⚔️', name: 'First Blood', desc: 'עבור מבחן ראשון', xp: 75, check: d => (d.quizResults || []).length >= 1 },
    { id: 'quiz_100', icon: '💯', name: 'Perfect Score', desc: 'קבל 100% במבחן', xp: 200, check: d => (d.quizResults || []).some(r => r.score === r.total) },
    { id: 'xp_500', icon: '💎', name: 'XP Hunter', desc: 'צבור 500 XP', xp: 50, check: d => (d.xp || 0) >= 500 },
    { id: 'xp_1000', icon: '👑', name: 'Legend', desc: 'צבור 1000 XP', xp: 100, check: d => (d.xp || 0) >= 1000 },
    { id: 'streak_3', icon: '🔥', name: 'On Fire', desc: '3 ימים רצופים', xp: 60, check: d => (d.loginStreak || 0) >= 3 },
    { id: 'streak_7', icon: '🌟', name: 'Dedicated', desc: '7 ימים רצופים', xp: 120, check: d => (d.loginStreak || 0) >= 7 },
    { id: 'sandbox', icon: '🔧', name: 'Builder', desc: 'השתמש ב-Sandbox', xp: 30, check: d => d.usedSandbox === true },
    {
        id: 'all_master', icon: '🚀', name: 'CYBER MASTER', desc: 'סיים את כל הקורסים', xp: 500, check: d =>
            (d.completedLessons?.html || []).length >= COURSES.html.length &&
            (d.completedLessons?.css || []).length >= COURSES.css.length &&
            (d.completedLessons?.js || []).length >= COURSES.js.length
    },
];

function renderAchievements() {
    const el = qs('#ach-grid');
    if (!el || !userData) return;
    const earned = userData.achievements || [];
    el.innerHTML = ACHIEVEMENTS_LIST.slice(0, 8).map(a => `
    <div class="ach-badge ${earned.includes(a.id) ? 'earned' : ''}" data-tip="${a.name}: ${a.desc}">${a.icon}</div>
  `).join('');
}

function setupAchievements() {
    const el = qs('#ach-full-grid');
    if (!el || !userData) return;
    const earned = userData.achievements || [];
    el.innerHTML = ACHIEVEMENTS_LIST.map(a => `
    <div class="ach-card-full ${earned.includes(a.id) ? 'earned' : ''}">
      <div class="icon">${a.icon}</div>
      <div class="name">${a.name}</div>
      <div class="desc">${a.desc}</div>
      <div style="font-family:var(--font-code);color:var(--neon-yellow);font-size:0.75rem;margin-top:0.4rem">+${a.xp} XP</div>
      ${earned.includes(a.id) ? '<div style="color:var(--neon-green);font-size:0.75rem;margin-top:0.4rem">✓ הושג</div>' : ''}
    </div>
  `).join('');
}

async function checkAchievements() {
    if (!userData) return;
    const earned = userData.achievements || [];
    const newOnes = [];
    for (const a of ACHIEVEMENTS_LIST) {
        if (!earned.includes(a.id) && a.check(userData)) {
            newOnes.push(a);
        }
    }
    if (newOnes.length > 0) {
        const newEarned = [...earned, ...newOnes.map(a => a.id)];
        updateUser({ achievements: newEarned });
        userData.achievements = newEarned;
        for (const a of newOnes) {
            await addXP(a.xp, 'achievement_' + a.id);
            showAchToast(a);
            await new Promise(r => setTimeout(r, 4500));
        }
    }
}

// ===== PROFILE =====
function setupProfile() {
    if (!userData) return;
    qs('#pf-avatar').textContent = userData.avatar || '🚀';
    qs('#pf-name').textContent = userData.name || 'Player';
    qs('#pf-email').textContent = userData.email || '';
    const info = getRankInfo(userData.xp || 0);
    qs('#pf-lv').textContent = info.level;
    qs('#pf-xp').textContent = userData.xp || 0;
    qs('#pf-lessons').textContent = getAllCompletedCount();
    qs('#pf-quizzes').textContent = (userData.quizResults || []).length;
    // achievements
    const el = qs('#pf-ach-grid');
    if (el) {
        const earned = userData.achievements || [];
        el.innerHTML = ACHIEVEMENTS_LIST.map(a => `
      <div class="ach-badge ${earned.includes(a.id) ? 'earned' : ''}" data-tip="${a.name}">${a.icon}</div>
    `).join('');
    }
}

// ===== LEARN PAGE =====
function setupLearn() {
    showCoursesView();
    showCat(currentCat, null);
}

function showCoursesView() {
    qs('#courses-view').classList.remove('hidden');
    qs('#lesson-view').classList.add('hidden');
}

function backToCourses() {
    antiCheatActive = false;
    document.body.classList.remove('quiz-mode');
    showCoursesView();
}

function showCat(cat, btn) {
    currentCat = cat;
    if (btn) {
        document.querySelectorAll('.ctab').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    } else {
        document.querySelectorAll('.ctab').forEach((b, i) => {
            b.classList.toggle('active', ['html', 'css', 'js'][i] === cat);
        });
    }
    renderLessonsGrid(cat);
}

function renderLessonsGrid(cat) {
    const grid = qs('#lessons-grid');
    if (!grid) return;
    const lessons = COURSES[cat] || [];
    const completed = userData?.completedLessons?.[cat] || [];
    grid.innerHTML = lessons.map((l, i) => `
    <div class="lesson-card ${completed.includes(l.id) ? 'completed' : ''}" onclick="openLesson('${cat}',${i})">
      <div class="lc-num">${cat.toUpperCase()} · ${String(i + 1).padStart(2, '0')}</div>
      <div class="lc-title">${l.title}</div>
      <div class="lc-desc">${l.desc || ''}</div>
      <div class="lc-xp">+${l.xp} XP</div>
    </div>
  `).join('');
}

function openLesson(cat, index) {
    currentCat = cat;
    currentLessonIndex = index;
    currentStepIndex = 0;
    qs('#courses-view').classList.add('hidden');
    qs('#lesson-view').classList.remove('hidden');
    renderLesson();
}

function renderLesson() {
    const lesson = COURSES[currentCat][currentLessonIndex];
    if (!lesson) return;

    qs('#lesson-ttl').textContent = lesson.title;
    qs('#lesson-cat-badge').textContent = currentCat.toUpperCase();
    qs('#lesson-cat-badge').className = 'cat-badge ' + currentCat;
    qs('#lesson-xp-badge').textContent = '+' + lesson.xp + ' XP';
    qs('#ls-cur').textContent = currentLessonIndex + 1;
    qs('#ls-tot').textContent = COURSES[currentCat].length;

    renderLessonStep();
    renderStepDots();
}

function renderLessonStep() {
    const lesson = COURSES[currentCat][currentLessonIndex];
    const step = lesson.steps[currentStepIndex];
    const body = qs('#lesson-body');

    qs('#btn-prev').disabled = currentStepIndex === 0;
    const isLast = currentStepIndex === lesson.steps.length - 1;
    qs('#btn-next').textContent = isLast ? '✓ סיים שיעור' : 'הבא →';

    renderStepDots();

    if (!step) return;

    let html = '';
    if (step.type === 'theory') {
        html = `<div class="glass-card lesson-theory">${step.content}</div>`;
    } else if (step.type === 'code') {
        html = `
      <div class="lesson-code-block">
        <div class="code-block-hdr">
          <span class="code-lang">${step.lang || 'html'}</span>
          ${step.runnable ? `<button class="code-run-btn" onclick="runCodeExample()">▶ הרץ קוד</button>` : ''}
        </div>
        <pre class="code-display">${escHtml(step.code)}</pre>
        ${step.runnable ? `<div class="code-preview" id="code-preview-area"><iframe id="code-preview-frame" sandbox="allow-scripts"></iframe></div>` : ''}
      </div>`;
    } else if (step.type === 'exercise') {
        html = `
      <div class="glass-card lesson-exercise">
        <div class="exercise-ttl">💪 תרגיל</div>
        <div class="exercise-instr">${step.instructions}</div>
        <div class="exercise-editor">
          <textarea id="exercise-ta" placeholder="כתוב את הקוד כאן...">${step.starter || ''}</textarea>
          <div class="exercise-btns">
            <button class="btn-neon btn-sm btn-green" onclick="checkExercise()">בדוק ✓</button>
            <button class="btn-hint" onclick="showExHint()">💡 רמז</button>
          </div>
          <div id="ex-feedback" class="exercise-feedback hidden"></div>
        </div>
      </div>`;
    } else if (step.type === 'question') {
        html = `
      <div class="glass-card lesson-question">
        <div class="lq-text">❓ ${step.q}</div>
        <div class="lq-options">
          ${step.options.map((o, i) => `<div class="lq-opt" onclick="answerLessonQ(this,${i},${step.correct},${step.xp || 10})">${o}</div>`).join('')}
        </div>
      </div>`;
    }

    body.innerHTML = html;
}

function renderStepDots() {
    const lesson = COURSES[currentCat][currentLessonIndex];
    const dots = qs('#step-dots');
    if (!dots || !lesson) return;
    dots.innerHTML = lesson.steps.map((_, i) => `
    <div class="step-dot ${i === currentStepIndex ? 'active' : i < currentStepIndex ? 'done' : ''}" onclick="goToStep(${i})"></div>
  `).join('');
}

function goToStep(i) {
    currentStepIndex = i;
    renderLessonStep();
}

function lessonNav(dir) {
    const lesson = COURSES[currentCat][currentLessonIndex];
    const newIdx = currentStepIndex + dir;
    if (newIdx < 0) return;
    if (newIdx >= lesson.steps.length) {
        completeLesson();
        return;
    }
    currentStepIndex = newIdx;
    renderLessonStep();
}

async function completeLesson() {
    if (!userData || !currentUser) return;
    const lesson = COURSES[currentCat][currentLessonIndex];
    const completed = userData.completedLessons?.[currentCat] || [];

    if (!completed.includes(lesson.id)) {
        completed.push(lesson.id);
        const update = {};
        update['completedLessons.' + currentCat] = completed;
        updateUser(update);
        userData.completedLessons = userData.completedLessons || { html: [], css: [], js: [] };
        userData.completedLessons[currentCat] = completed;

        await addXP(lesson.xp, 'lesson_' + lesson.id);
        completeMission('lesson');
        completeMission('lesson3');
        checkAchievements();
        showNotif('🎉 שיעור הושלם! +' + lesson.xp + ' XP');
    }

    // Go to next lesson or back
    const nextIdx = currentLessonIndex + 1;
    if (nextIdx < COURSES[currentCat].length) {
        currentLessonIndex = nextIdx;
        currentStepIndex = 0;
        renderLesson();
        showNotif('➡️ שיעור הבא: ' + COURSES[currentCat][nextIdx].title);
    } else {
        showNotif('🏆 סיימת את כל שיעורי ' + currentCat.toUpperCase() + '!');
        backToCourses();
        checkAchievements();
    }
}

function runCodeExample() {
    const step = COURSES[currentCat][currentLessonIndex].steps[currentStepIndex];
    const area = qs('#code-preview-area');
    const frame = qs('#code-preview-frame');
    if (!frame || !step || !area) return;
    if (!area.querySelector('.code-preview-hdr')) {
        const hdr = document.createElement('div');
        hdr.className = 'code-preview-hdr';
        hdr.textContent = '▶ OUTPUT — תצוגה מקדימה';
        area.insertBefore(hdr, frame);
    }
    frame.srcdoc = step.code;
    area.style.display = 'block';
}

function checkExercise() {
    const step = COURSES[currentCat][currentLessonIndex].steps[currentStepIndex];
    const code = (qs('#exercise-ta')?.value || '').trim();
    const fb = qs('#ex-feedback');
    if (!step || !fb) return;

    try {
        const ok = step.check(code);
        if (ok) {
            fb.className = 'exercise-feedback success';
            fb.textContent = '✅ מעולה! התרגיל הצליח! +' + (step.xp || 15) + ' XP';
            fb.classList.remove('hidden');
            addXP(step.xp || 15, 'exercise');
            completeMission('correct5');
        } else {
            fb.className = 'exercise-feedback error';
            fb.textContent = '❌ לא בדיוק. בדוק שוב את הקוד ונסה שוב.';
            fb.classList.remove('hidden');
        }
    } catch (e) {
        fb.className = 'exercise-feedback error';
        fb.textContent = '❌ שגיאה בקוד: ' + e.message;
        fb.classList.remove('hidden');
    }
}

function showExHint() {
    const step = COURSES[currentCat][currentLessonIndex].steps[currentStepIndex];
    const fb = qs('#ex-feedback');
    if (!step || !fb) return;
    fb.className = 'exercise-feedback hint';
    fb.textContent = '💡 ' + (step.hint || 'בדוק את הדוגמה מעל');
    fb.classList.remove('hidden');
}

function answerLessonQ(el, chosen, correct, xp) {
    const parent = el.parentElement;
    if (parent.querySelector('.correct') || parent.querySelector('.wrong')) return;
    parent.querySelectorAll('.lq-opt').forEach((o, i) => {
        o.classList.add(i === correct ? 'correct' : (i === chosen ? 'wrong' : ''));
    });
    if (chosen === correct) {
        addXP(xp, 'quiz_question');
        completeMission('correct5');
    }
}

function escHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ===== QUIZ PAGE =====
function setupQuiz() {
    qs('#quiz-start').classList.remove('hidden');
    qs('#quiz-active').classList.add('hidden');
    qs('#quiz-results').classList.add('hidden');
}

function setQCat(btn, cat) {
    quizCat = cat;
    document.querySelectorAll('.qcat').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
}

function buildQuizQuestions() {
    let pool = [];
    if (quizCat === 'all') {
        pool = [...QUIZ_QUESTIONS.html, ...QUIZ_QUESTIONS.css, ...QUIZ_QUESTIONS.js];
    } else {
        pool = [...(QUIZ_QUESTIONS[quizCat] || [])];
    }
    const shuffled = pool.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 15);
}

function startQuiz() {
    quizQuestions = buildQuizQuestions();
    quizIndex = 0;
    quizScore = 0;
    quizAnsweredThisQ = false;

    qs('#quiz-start').classList.add('hidden');
    qs('#quiz-active').classList.remove('hidden');
    qs('#quiz-results').classList.add('hidden');

    // Anti-cheat
    antiCheatActive = true;
    document.body.classList.add('quiz-mode');
    initAntiCheat();

    renderQuestion();
}

function renderQuestion() {
    const q = quizQuestions[quizIndex];
    if (!q) { endQuiz(); return; }

    qs('#q-num').textContent = quizIndex + 1;
    qs('#q-tot').textContent = quizQuestions.length;
    qs('#q-score').textContent = quizScore;
    qs('#qhud-score') && (qs('#qhud-score').textContent = quizScore);
    qs('#q-progfill').style.width = (quizIndex / quizQuestions.length * 100) + '%';
    qs('#q-cat-tag').textContent = q.cat?.toUpperCase() || 'Q';
    qs('#q-cat-tag').style.background = q.cat === 'html' ? 'rgba(255,107,107,0.2)' : q.cat === 'css' ? 'rgba(180,0,255,0.2)' : 'rgba(255,221,0,0.2)';
    qs('#q-cat-tag').style.color = q.cat === 'html' ? '#ff6b6b' : q.cat === 'css' ? '#b400ff' : '#ffdd00';
    qs('#q-text').textContent = q.q;

    const shuffledOpts = q.options.map((o, i) => ({ o, i })).sort(() => Math.random() - 0.5);

    qs('#q-answers').innerHTML = shuffledOpts.map(item => `
    <div class="q-ans" data-correct="${item.i === q.correct ? 1 : 0}" onclick="answerQ(this,'${escHtml(q.explain || '')}')">${escHtml(item.o)}</div>
  `).join('');

    qs('#q-feedback').classList.add('hidden');
    qs('#q-next-btn').classList.add('hidden');
    quizAnsweredThisQ = false;

    startQTimer();
}

function answerQ(el, explain) {
    if (quizAnsweredThisQ) return;
    quizAnsweredThisQ = true;
    clearInterval(quizTimer);

    const isCorrect = el.dataset.correct === '1';
    document.querySelectorAll('.q-ans').forEach(a => {
        a.classList.add('disabled');
        if (a.dataset.correct === '1') a.classList.add('correct');
    });

    const fb = qs('#q-feedback');
    if (isCorrect) {
        quizScore++;
        qs('#q-score').textContent = quizScore;
        fb.className = 'q-feedback cf';
        fb.textContent = '✅ נכון! ' + (explain || '');
    } else {
        el.classList.add('wrong');
        fb.className = 'q-feedback wf';
        fb.textContent = '❌ לא נכון. ' + (explain || '');
    }
    fb.classList.remove('hidden');
    qs('#q-next-btn').classList.remove('hidden');
}

function nextQ() {
    quizIndex++;
    if (quizIndex >= quizQuestions.length) {
        endQuiz();
    } else {
        renderQuestion();
    }
}

function startQTimer() {
    clearInterval(quizTimer);
    quizTimeLeft = 30;
    const timerEl = qs('#q-timer');
    updateTimerDisplay(timerEl, 30);
    quizTimer = setInterval(() => {
        quizTimeLeft--;
        updateTimerDisplay(timerEl, quizTimeLeft);
        if (quizTimeLeft <= 0) {
            clearInterval(quizTimer);
            if (!quizAnsweredThisQ) {
                quizAnsweredThisQ = true;
                document.querySelectorAll('.q-ans').forEach(a => a.classList.add('disabled'));
                const fb = qs('#q-feedback');
                fb.className = 'q-feedback wf';
                fb.textContent = '⏱️ הזמן נגמר!';
                fb.classList.remove('hidden');
                qs('#q-next-btn').classList.remove('hidden');
            }
        }
    }, 1000);
}

function updateTimerDisplay(el, t) {
    if (!el) return;
    el.textContent = t;
    el.classList.toggle('danger', t <= 10);
}

async function endQuiz() {
    clearInterval(quizTimer);
    antiCheatActive = false;
    document.body.classList.remove('quiz-mode');

    const total = quizQuestions.length;
    const pct = Math.round(quizScore / total * 100);
    const xpEarned = Math.round(quizScore * 10);

    qs('#quiz-active').classList.add('hidden');
    qs('#quiz-results').classList.remove('hidden');

    let grade = 'TRY AGAIN 😤';
    if (pct >= 90) grade = 'LEGENDARY! 🏆';
    else if (pct >= 70) grade = 'EXCELLENT! ⭐';
    else if (pct >= 50) grade = 'GOOD JOB! 👍';

    qs('#res-grade').textContent = grade;
    qs('#res-correct').textContent = quizScore;
    qs('#res-total').textContent = total;
    qs('#res-pct').textContent = pct + '%';
    qs('#res-xp').textContent = xpEarned;

    await addXP(xpEarned, 'quiz');

    const result = { score: quizScore, total, pct, xp: xpEarned, cat: quizCat, date: new Date().toISOString() };
    const results = [...(userData?.quizResults || []), result];
    updateUser({ quizResults: results });
    userData.quizResults = results;

    if (pct >= 70) completeMission('quiz70');
    checkAchievements();
}

function restartQuiz() {
    setupQuiz();
}

// ===== SANDBOX =====
const SB_DEFAULTS = {
    html: `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="UTF-8">
  <style>
    body { background: #0a0a1a; color: #00ffff; font-family: Arial; padding: 20px; }
    h1 { color: #ff00ff; text-shadow: 0 0 10px #ff00ff; }
    button { background: #00ffff; border: none; padding: 10px 20px; cursor: pointer; border-radius: 5px; font-weight: bold; }
  </style>
</head>
<body>
  <h1>שלום עולם! 🚀</h1>
  <p>ברוך הבא ל-Sandbox. כתוב קוד ולחץ Run!</p>
  <button onclick="alert('שלום!')">לחץ עלי!</button>
</body>
</html>`,
    css: `body {
  background: #0a0a1a;
  color: #00ffff;
  font-family: Arial;
  padding: 20px;
}
h1 {
  color: #ff00ff;
  text-shadow: 0 0 10px #ff00ff;
}`,
    js: `// JavaScript Sandbox
console.log('שלום מ-JavaScript!');
document.body.style.border = '2px solid cyan';`
};

let currentSbTab = 'html';

function setupSandbox() {
    const html = qs('#sb-html');
    const css = qs('#sb-css');
    const js = qs('#sb-js');
    if (html && !html.value) html.value = SB_DEFAULTS.html;
    if (css && !css.value) css.value = SB_DEFAULTS.css;
    if (js && !js.value) js.value = SB_DEFAULTS.js;
    sbTab('html', document.querySelector('.sbtab'));
    runSandbox();

    // Mark sandbox used for achievement
    if (userData && !userData.usedSandbox) {
        updateUser({ usedSandbox: true });
        userData.usedSandbox = true;
        checkAchievements();
        completeMission('sandbox');
    }
}

function sbTab(tab, btn) {
    currentSbTab = tab;
    document.querySelectorAll('.sbtab').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    document.querySelectorAll('.sbe').forEach(e => e.classList.add('hidden'));
    qs('#sbe-' + tab)?.classList.remove('hidden');
}

function runSandbox() {
    const htmlCode = qs('#sb-html')?.value || '';
    const cssCode = qs('#sb-css')?.value || '';
    const jsCode = qs('#sb-js')?.value || '';

    const combined = htmlCode.includes('<html')
        ? htmlCode.replace('</head>', `<style>${cssCode}</style></head>`).replace('</body>', `<script>${jsCode}<\/script></body>`)
        : `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>${cssCode}</style></head><body>${htmlCode}<script>${jsCode}<\/script></body></html>`;

    const frame = qs('#sb-frame');
    if (!frame) return;
    frame.srcdoc = combined;
    showNotif('▶ קוד הורץ בהצלחה!');
}

function resetSandbox() {
    qs('#sb-html').value = SB_DEFAULTS.html;
    qs('#sb-css').value = SB_DEFAULTS.css;
    qs('#sb-js').value = SB_DEFAULTS.js;
    runSandbox();
}

function saveSandbox() {
    const data = {
        html: qs('#sb-html')?.value || '',
        css: qs('#sb-css')?.value || '',
        js: qs('#sb-js')?.value || ''
    };
    localStorage.setItem('sandbox_save', JSON.stringify(data));
    showNotif('💾 הקוד נשמר!');
}

function fullPreview() {
    const frame = qs('#sb-frame');
    if (!frame) return;
    const win = window.open('', '_blank');
    win.document.write(frame.contentDocument.documentElement.outerHTML);
}

// ===== ADMIN =====
async function setupAdmin() {
    if (!userData) { qs('#admin-wall')?.classList.remove('hidden'); qs('#admin-dash')?.classList.add('hidden'); return; }
    if (!userData.isAdmin) {
        qs('#admin-wall')?.classList.remove('hidden');
        qs('#admin-dash')?.classList.add('hidden');
        return;
    }
    qs('#admin-wall')?.classList.add('hidden');
    qs('#admin-dash')?.classList.remove('hidden');
    adTab('overview', document.querySelector('.adtab'));
}

function adTab(tab, btn) {
    document.querySelectorAll('.adtab').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    document.querySelectorAll('.adt').forEach(el => el.classList.add('hidden'));
    qs('#adt-' + tab)?.classList.remove('hidden');

    if (tab === 'overview') loadAdminOverview();
    else if (tab === 'users') loadAdminUsers();
    else if (tab === 'logs') loadAdminLogs();
}

async function loadAdminOverview() {
    try {
        const snap = await db.collection('users').get();
        let totalXP = 0, totalQuizzes = 0, totalTime = 0;
        snap.forEach(d => {
            const data = d.data();
            totalXP += data.xp || 0;
            totalQuizzes += (data.quizResults || []).length;
            totalTime += data.totalStudyTime || 0;
        });
        qs('#ad-users').textContent = snap.size;
        qs('#ad-time').textContent = Math.round(totalTime / snap.size || 0) + 'm';
        qs('#ad-score').textContent = totalQuizzes > 0 ? Math.round(totalXP / snap.size) : '0';

        // Real-time online count
        const nowMinus10 = new Date(Date.now() - 600000).toISOString();
        db.collection('users').where('lastLogin', '>=', nowMinus10).get().then(s => {
            qs('#ad-online').textContent = s.size;
        });

        drawAdminCharts(snap);
    } catch (e) {
        showNotif('שגיאה בטעינת נתונים');
    }
}

function drawAdminCharts(snap) {
    // Activity chart
    const actCtx = document.getElementById('chart-activity');
    if (actCtx) {
        if (adminCharts.activity) adminCharts.activity.destroy();
        const days = ['ש', 'א', 'ב', 'ג', 'ד', 'ה', 'ו'];
        adminCharts.activity = new Chart(actCtx, {
            type: 'line',
            data: {
                labels: days,
                datasets: [{
                    label: 'משתמשים פעילים',
                    data: [3, 5, 8, 6, 12, 9, 7].map(v => v + Math.floor(Math.random() * 3)),
                    borderColor: '#00d4ff',
                    backgroundColor: 'rgba(0,212,255,0.1)',
                    tension: 0.4, fill: true,
                    pointBackgroundColor: '#00d4ff'
                }]
            },
            options: { plugins: { legend: { labels: { color: '#7070aa' } } }, scales: { x: { ticks: { color: '#7070aa' }, grid: { color: 'rgba(255,255,255,0.05)' } }, y: { ticks: { color: '#7070aa' }, grid: { color: 'rgba(255,255,255,0.05)' } } } }
        });
    }

    // Scores chart
    const scCtx = document.getElementById('chart-scores');
    if (scCtx) {
        if (adminCharts.scores) adminCharts.scores.destroy();
        adminCharts.scores = new Chart(scCtx, {
            type: 'doughnut',
            data: {
                labels: ['90-100%', '70-89%', '50-69%', '<50%'],
                datasets: [{ data: [15, 35, 30, 20], backgroundColor: ['#00ff88', '#00d4ff', '#ffdd00', '#ff6b6b'], borderWidth: 0 }]
            },
            options: { plugins: { legend: { labels: { color: '#7070aa' } } } }
        });
    }
}

let allUsers = [];
async function loadAdminUsers() {
    const tbody = qs('#users-tbody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="7" class="tc"><div class="spin"></div></td></tr>';
    try {
        const snap = await db.collection('users').orderBy('xp', 'desc').get();
        allUsers = [];
        snap.forEach(d => allUsers.push({ id: d.id, ...d.data() }));
        renderUsersTable(allUsers);
    } catch (e) {
        tbody.innerHTML = '<tr><td colspan="7" class="tc">שגיאה בטעינה</td></tr>';
    }
}

function renderUsersTable(users) {
    const tbody = qs('#users-tbody');
    if (!tbody) return;
    if (users.length === 0) { tbody.innerHTML = '<tr><td colspan="7" class="tc">לא נמצאו משתמשים</td></tr>'; return; }
    tbody.innerHTML = users.map(u => `
    <tr>
      <td>${u.avatar || '🚀'} ${u.name || '-'}</td>
      <td>${u.email || '-'}</td>
      <td>LV.${getRankInfo(u.xp || 0).level}</td>
      <td>${u.xp || 0}</td>
      <td>${u.quizResults?.length ? Math.round(u.quizResults.reduce((a, r) => a + r.pct, 0) / u.quizResults.length) + '%' : '-'}</td>
      <td>${u.lastLogin ? new Date(u.lastLogin).toLocaleDateString('he') : '-'}</td>
      <td>
        <button class="btn-ban" onclick="banUser('${u.id}','${u.name}')">חסום</button>
        <button class="btn-del" onclick="deleteUser('${u.id}','${u.name}')">מחק</button>
      </td>
    </tr>
  `).join('');
}

function searchUsers(q) {
    const filtered = allUsers.filter(u => (u.name || '').toLowerCase().includes(q.toLowerCase()) || (u.email || '').toLowerCase().includes(q.toLowerCase()));
    renderUsersTable(filtered);
}

async function banUser(uid, name) {
    if (!confirm('לחסום את ' + name + '?')) return;
    await db.collection('users').doc(uid).update({ banned: true });
    showNotif('🚫 ' + name + ' חסום');
    loadAdminUsers();
}

async function deleteUser(uid, name) {
    if (!confirm('למחוק את ' + name + '? לא ניתן לשחזר!')) return;
    await db.collection('users').doc(uid).delete();
    showNotif('🗑️ ' + name + ' נמחק');
    loadAdminUsers();
}

async function loadAdminLogs() {
    const el = qs('#logs-box');
    if (!el) return;
    el.innerHTML = '<div class="spin"></div>';
    try {
        const snap = await db.collection('logs').orderBy('ts', 'desc').limit(50).get();
        if (snap.empty) { el.innerHTML = '<div class="tc">אין לוגים</div>'; return; }
        el.innerHTML = snap.docs.map(d => {
            const log = d.data();
            return `<div class="log-entry">
        <div class="log-time">${new Date(log.ts).toLocaleString('he')}</div>
        <div class="log-type info">${log.type || 'info'}</div>
        <div class="log-msg">${log.name || log.uid || '?'} — ${log.source || log.amount || ''}</div>
      </div>`;
        }).join('');
    } catch (e) {
        el.innerHTML = '<div class="tc">שגיאה בטעינת לוגים</div>';
    }
}

async function broadcastMsg() {
    const msg = qs('#bc-msg')?.value?.trim();
    if (!msg) return;
    await db.collection('broadcasts').add({
        message: msg, from: userData?.name || 'Admin',
        ts: new Date().toISOString()
    });
    qs('#bc-msg').value = '';
    showNotif('📢 הודעה נשלחה לכולם!');
}

// ===== ANTI-CHEAT =====
function initAntiCheat() {
    document.addEventListener('contextmenu', blockDefault);
    document.addEventListener('keydown', blockCheats);
    document.addEventListener('visibilitychange', onVisibilityChange);
}

function blockDefault(e) {
    if (antiCheatActive) { e.preventDefault(); showNotif('🛡️ לא ניתן לבצע פעולה זו במהלך מבחן'); }
}

function blockCheats(e) {
    if (!antiCheatActive) return;
    if (e.key === 'F12' || (e.ctrlKey && ['c', 'a', 'x', 'u', 's'].includes(e.key.toLowerCase()))) {
        e.preventDefault();
        showNotif('🛡️ Copy Protection Active');
        logSuspicious('keyboard_block', e.key);
    }
}

function onVisibilityChange() {
    if (antiCheatActive && document.hidden) {
        showNotif('⚠️ זוהתה יציאה מהמבחן!');
        logSuspicious('tab_switch', 'hidden');
    }
}

function logSuspicious(type, detail) {
    if (!currentUser) return;
    db.collection('logs').add({
        uid: currentUser.uid,
        name: userData?.name || '?',
        type: 'security',
        source: type,
        detail, ts: new Date().toISOString()
    }).catch(() => { });
}

// ===== AI ASSISTANT =====
const AI_KB = [
    { keys: ['html', 'מה זה'], resp: 'HTML = HyperText Markup Language. זוהי שפת הסימון שבה בונים את המבנה של דפי אינטרנט. כל תגית HTML היא הוראה לדפדפן!' },
    { keys: ['h1', 'כותרת'], resp: 'תגית <h1> היא הכותרת הראשית. יש h1 עד h6 — h1 הכי גדולה, h6 הכי קטנה. דוגמה: <h1>שלום!</h1>' },
    { keys: ['a', 'קישור'], resp: 'תגית <a href="..."> יוצרת קישור. דוגמה: <a href="https://google.com">לחץ כאן</a>' },
    { keys: ['img', 'תמונה'], resp: 'תגית <img src="url" alt="תיאור"> מוסיפה תמונה. src הוא הנתיב לתמונה, alt הוא תיאור נגישות.' },
    { keys: ['div', 'span'], resp: '<div> הוא מכל בלוק לקיבוץ אלמנטים. <span> הוא מכל שורתי לטקסט. div מתחיל שורה חדשה, span לא.' },
    { keys: ['class', 'id'], resp: 'class מאפשר לתת שם לקבוצת אלמנטים (ניתן לשימוש חוזר). id הוא ייחודי לאלמנט אחד. בCSS: .classname ו-#idname' },
    { keys: ['css', 'עיצוב'], resp: 'CSS = Cascading Style Sheets. עם CSS מעצבים את HTML — צבעים, גדלים, פונטים, אנימציות ועוד!' },
    { keys: ['color', 'צבע'], resp: 'ב-CSS: color לצבע טקסט, background-color לרקע. ניתן לכתוב שמות (red), hex (#ff0000) או rgb(255,0,0).' },
    { keys: ['flexbox', 'flex'], resp: 'Flexbox הוא מערכת סידור ב-CSS. display:flex הופך מכל לגמיש. justify-content מסדר אופקית, align-items אנכית.' },
    { keys: ['grid'], resp: 'CSS Grid הוא מערכת דו-ממדית. display:grid מפעיל אותו. grid-template-columns מגדיר עמודות. דוגמה: grid-template-columns: 1fr 1fr' },
    { keys: ['javascript', 'js', 'ג\'ייבסקריפט'], resp: 'JavaScript היא שפת תכנות לדפדפן. היא מוסיפה אינטראקטיביות לאתר — לחיצות, אנימציות, חישובים ועוד!' },
    { keys: ['let', 'const', 'var', 'משתנה'], resp: 'let: משתנה שניתן לשנות. const: ערך קבוע שלא משתנה. var: ישן ופחות מומלץ. דוגמה: let name = "שלום";' },
    { keys: ['function', 'פונקציה'], resp: 'function היא קטע קוד שניתן לקרוא שוב ושוב. דוגמה:\nfunction hello(name) {\n  alert("שלום " + name);\n}' },
    { keys: ['if', 'else', 'תנאי'], resp: 'if/else מאפשר קוד מותנה:\nif (score > 50) {\n  alert("עברת!");\n} else {\n  alert("נכשלת");\n}' },
    { keys: ['for', 'לולאה'], resp: 'לולאת for חוזרת מספר קבוע של פעמים:\nfor (let i = 0; i < 5; i++) {\n  console.log(i);\n}' },
    { keys: ['array', 'מערך'], resp: 'Array הוא רשימה של פריטים:\nlet fruits = ["תפוח", "בננה", "תפוז"];\nconsole.log(fruits[0]); // תפוח\nconsole.log(fruits.length); // 3' },
    { keys: ['dom', 'queryselector', 'getelementbyid'], resp: 'DOM מאפשר לJS לשנות HTML:\nconst el = document.querySelector("#myId");\nel.textContent = "טקסט חדש";\nel.style.color = "red";' },
    { keys: ['eventelistener', 'onclick', 'click', 'אירוע'], resp: 'אירועים מגיבים ללחיצות ועוד:\nconst btn = document.querySelector("button");\nbtn.addEventListener("click", function() {\n  alert("לחצת!");\n});' },
    { keys: ['firebase'], resp: 'Firebase הוא שירות של Google. הוא מאחסן נתונים בענן ומאפשר Authentication, Database, Hosting ועוד — בלי לכתוב Backend!' },
    { keys: ['console', 'שגיאה', 'debug'], resp: 'console.log() מדפיס לconsole של הדפדפן (F12). זה הכלי הכי חשוב לdebug. console.error() לשגיאות, console.warn() לאזהרות.' },
    { keys: ['responsive', 'מסך', 'mobile'], resp: 'Responsive Design = אתר שמסתגל לכל מסך. משתמשים ב-media queries ב-CSS: @media (max-width: 768px) { ... }' },
    { keys: ['רמז', 'hint', 'תרגיל'], resp: 'לא אגלה את התשובה, אבל רמז: קרא שוב את הדוגמה בשיעור ונסה לחקות את המבנה. כל שיעור מכיל את כל המידע הדרוש! 💪' },
];

function getAIResponse(msg) {
    const lower = msg.toLowerCase();
    for (const item of AI_KB) {
        if (item.keys.some(k => lower.includes(k))) {
            return item.resp;
        }
    }
    return 'שאלה מעניינת! 🤔 נסה לנסח אחרת או לציין את הנושא: HTML, CSS, JavaScript. אני כאן לעזור! אם את/ה בשיעור, הסתכל/י על הדוגמה שם.';
}

function toggleAI() {
    aiOpen = !aiOpen;
    qs('#ai-panel').classList.toggle('hidden', !aiOpen);
    if (aiOpen) qs('#ai-input')?.focus();
}

function sendAI() {
    const input = qs('#ai-input');
    const msg = input?.value?.trim();
    if (!msg) return;
    input.value = '';

    const msgs = qs('#ai-msgs');
    msgs.innerHTML += `<div class="ai-msg user">${escHtml(msg)}</div>`;

    setTimeout(() => {
        const resp = getAIResponse(msg);
        msgs.innerHTML += `<div class="ai-msg bot">${resp.replace(/\n/g, '<br>')}</div>`;
        msgs.scrollTop = msgs.scrollHeight;
    }, 600);
    msgs.scrollTop = msgs.scrollHeight;
}

// ===== COURSES DATA =====
const COURSES = {
    html: [
        {
            id: 'html-1', title: 'מה זה HTML?', desc: 'הבסיס של כל אתר', xp: 40, steps: [
                { type: 'theory', content: `<h3>מה זה HTML?</h3><p><strong>HTML = HyperText Markup Language</strong></p><p>זוהי שפת הסימון שבה בונים את מבנה דפי האינטרנט. כל אתר בעולם בנוי עליה!</p><ul><li><strong>HyperText</strong> — טקסט עם קישורים</li><li><strong>Markup</strong> — סימון עם תגיות</li><li><strong>Language</strong> — שפה סטנדרטית</li></ul><p>כל דפדפן (Chrome, Firefox) יודע לקרוא HTML ולהציג אתר יפה.</p>` },
                { type: 'code', lang: 'html', runnable: true, code: `<!DOCTYPE html>\n<html>\n  <head>\n    <title>הדף שלי</title>\n  </head>\n  <body>\n    <h1>שלום עולם!</h1>\n    <p>זה הפסקה הראשונה שלי.</p>\n  </body>\n</html>` },
                { type: 'exercise', instructions: 'כתוב דף HTML בסיסי עם תגית h1 שאומרת "שלום עולם"', hint: 'צריך: DOCTYPE, html, head, body, ואז h1', xp: 20, check: c => c.toLowerCase().includes('<h1>') && c.toLowerCase().includes('<body>') },
                { type: 'question', q: 'מה ראשי התיבות של HTML?', options: ['HyperText Markup Language', 'High Tech Modern Language', 'Hyper Template Multi List'], correct: 0, xp: 10 }
            ]
        },
        {
            id: 'html-2', title: 'מבנה דף HTML', desc: 'DOCTYPE, html, head, body', xp: 40, steps: [
                { type: 'theory', content: `<h3>מבנה הדף</h3><p>כל דף HTML חייב להיות בנוי כך:</p><ul><li><code>&lt;!DOCTYPE html&gt;</code> — מגדיר גרסת HTML5</li><li><code>&lt;html&gt;</code> — עוטף את הכל</li><li><code>&lt;head&gt;</code> — מידע על הדף (כותרת, CSS)</li><li><code>&lt;body&gt;</code> — מה המשתמש רואה</li></ul>` },
                { type: 'code', lang: 'html', runnable: true, code: `<!DOCTYPE html>\n<html lang="he" dir="rtl">\n  <head>\n    <meta charset="UTF-8">\n    <title>האתר שלי</title>\n  </head>\n  <body>\n    <h1>ברוכים הבאים!</h1>\n    <p>זה תוכן הדף.</p>\n  </body>\n</html>` },
                { type: 'exercise', instructions: 'הוסף תגית meta charset="UTF-8" בתוך head', hint: 'בתוך <head>: <meta charset="UTF-8">', xp: 20, check: c => c.toLowerCase().includes('charset') && c.toLowerCase().includes('utf-8') },
                { type: 'question', q: 'באיזו תגית נכתוב את מה שהמשתמש רואה?', options: ['<head>', '<body>', '<html>'], correct: 1, xp: 10 }
            ]
        },
        {
            id: 'html-3', title: 'כותרות h1–h6', desc: 'כותרות בגדלים שונים', xp: 35, steps: [
                { type: 'theory', content: `<h3>תגיות כותרת</h3><p>HTML מספק 6 רמות כותרת:</p><ul><li><code>&lt;h1&gt;</code> — הכי גדולה (כותרת ראשית)</li><li><code>&lt;h2&gt;</code> — כותרת משנה</li><li><code>&lt;h3&gt;–&lt;h6&gt;</code> — קטנות יותר</li></ul><p>בדרך כלל משתמשים בh1 פעם אחת בדף לSEO.</p>` },
                { type: 'code', lang: 'html', runnable: true, code: `<h1>כותרת ראשית</h1>\n<h2>כותרת משנה</h2>\n<h3>תת-כותרת</h3>\n<h4>קטנה יותר</h4>\n<h5>אפילו קטנה</h5>\n<h6>הכי קטנה</h6>` },
                { type: 'exercise', instructions: 'כתוב 3 כותרות: h1 עם "שם האתר", h2 עם "אודות", h3 עם "פרטים"', hint: '<h1>שם האתר</h1> ואז h2 ו-h3', xp: 18, check: c => c.includes('<h1>') && c.includes('<h2>') && c.includes('<h3>') },
                { type: 'question', q: 'כמה רמות כותרת יש ב-HTML?', options: ['4', '6', '8'], correct: 1, xp: 10 }
            ]
        },
        {
            id: 'html-4', title: 'פסקאות וטקסט', desc: 'p, br, strong, em', xp: 35, steps: [
                { type: 'theory', content: `<h3>תגיות טקסט</h3><ul><li><code>&lt;p&gt;</code> — פסקה (paragraph)</li><li><code>&lt;br&gt;</code> — שבירת שורה</li><li><code>&lt;strong&gt;</code> — טקסט מודגש</li><li><code>&lt;em&gt;</code> — טקסט נטוי</li><li><code>&lt;mark&gt;</code> — הדגשת רקע</li></ul>` },
                { type: 'code', lang: 'html', runnable: true, code: `<p>זוהי פסקה רגילה.</p>\n<p>כאן יש <strong>טקסט מודגש</strong> ו<em>נטוי</em>.</p>\n<p>שורה ראשונה<br>שורה שנייה</p>\n<p>מילה <mark>מסומנת</mark> ברקע.</p>` },
                { type: 'exercise', instructions: 'כתוב פסקה עם מילה אחת מודגשת (strong)', hint: '<p>טקסט <strong>מודגש</strong> כאן</p>', xp: 18, check: c => c.includes('<p>') && c.toLowerCase().includes('<strong>') },
                { type: 'question', q: 'איזו תגית עושה שבירת שורה?', options: ['<p>', '<br>', '<hr>'], correct: 1, xp: 10 }
            ]
        },
        {
            id: 'html-5', title: 'קישורים', desc: 'תגית a ו-href', xp: 40, steps: [
                { type: 'theory', content: `<h3>תגית הקישור — &lt;a&gt;</h3><p><code>&lt;a href="..."&gt;טקסט&lt;/a&gt;</code></p><ul><li><code>href</code> — כתובת הקישור</li><li><code>target="_blank"</code> — פתח בטאב חדש</li><li><code>href="tel:050-..."</code> — מתקשר</li><li><code>href="mailto:..."</code> — פותח אימייל</li></ul>` },
                { type: 'code', lang: 'html', runnable: true, code: `<a href="https://google.com">גוגל</a>\n<br>\n<a href="https://google.com" target="_blank">פתח גוגל בטאב חדש</a>\n<br>\n<a href="tel:050-0000000">התקשר אלינו</a>` },
                { type: 'exercise', instructions: 'צור קישור לאתר גוגל שנפתח בטאב חדש', hint: '<a href="https://google.com" target="_blank">גוגל</a>', xp: 22, check: c => c.includes('href') && c.toLowerCase().includes('target="_blank"') },
                { type: 'question', q: 'מה הAttribute שמגדיר לאן הקישור מוביל?', options: ['src', 'link', 'href'], correct: 2, xp: 10 }
            ]
        },
        {
            id: 'html-6', title: 'תמונות', desc: 'תגית img', xp: 35, steps: [
                { type: 'theory', content: `<h3>תגית תמונה — &lt;img&gt;</h3><p>תגית img היא self-closing (אין תגית סגירה).</p><ul><li><code>src</code> — נתיב/URL לתמונה</li><li><code>alt</code> — טקסט חלופי (נגישות + SEO)</li><li><code>width</code>, <code>height</code> — גודל</li></ul>` },
                { type: 'code', lang: 'html', runnable: true, code: `<img src="https://picsum.photos/200/150" alt="תמונה לדוגמה" width="200">\n<br>\n<img src="https://picsum.photos/100/100?random=2" alt="תמונה נוספת">` },
                { type: 'exercise', instructions: 'הוסף תמונה עם src ו-alt', hint: '<img src="https://picsum.photos/100" alt="תמונה">', xp: 18, check: c => c.toLowerCase().includes('<img') && c.includes('src') && c.includes('alt') },
                { type: 'question', q: 'מה ה-attribute החובה בתמונה לנגישות?', options: ['title', 'alt', 'class'], correct: 1, xp: 10 }
            ]
        },
        {
            id: 'html-7', title: 'רשימות', desc: 'ul, ol, li', xp: 35, steps: [
                { type: 'theory', content: `<h3>סוגי רשימות</h3><ul><li><code>&lt;ul&gt;</code> — Unordered List (נקודות •)</li><li><code>&lt;ol&gt;</code> — Ordered List (מספרים 1,2,3)</li><li><code>&lt;li&gt;</code> — פריט ברשימה</li></ul><p>ניתן לקנן רשימות בתוך רשימות!</p>` },
                { type: 'code', lang: 'html', runnable: true, code: `<h3>שפות תכנות:</h3>\n<ul>\n  <li>HTML</li>\n  <li>CSS</li>\n  <li>JavaScript</li>\n</ul>\n<h3>שלבי פרויקט:</h3>\n<ol>\n  <li>תכנון</li>\n  <li>עיצוב</li>\n  <li>פיתוח</li>\n</ol>` },
                { type: 'exercise', instructions: 'כתוב רשימה לא מסודרת (ul) עם 3 פריטים', hint: '<ul><li>פריט 1</li><li>פריט 2</li><li>פריט 3</li></ul>', xp: 18, check: c => c.includes('<ul>') && (c.match(/<li>/g) || []).length >= 3 },
                { type: 'question', q: 'איזו תגית יוצרת רשימה ממוספרת?', options: ['<ul>', '<ol>', '<dl>'], correct: 1, xp: 10 }
            ]
        },
        {
            id: 'html-8', title: 'כפתורים וטפסים', desc: 'button, form, input', xp: 45, steps: [
                { type: 'theory', content: `<h3>אלמנטי טופס</h3><ul><li><code>&lt;button&gt;</code> — כפתור</li><li><code>&lt;form&gt;</code> — מכל טופס</li><li><code>&lt;input type="text"&gt;</code> — שדה טקסט</li><li><code>&lt;input type="email"&gt;</code> — שדה אימייל</li><li><code>&lt;input type="password"&gt;</code> — סיסמה</li><li><code>&lt;label&gt;</code> — תווית לשדה</li></ul>` },
                { type: 'code', lang: 'html', runnable: true, code: `<form>\n  <label>שם:</label>\n  <input type="text" placeholder="הכנס שם"><br><br>\n  <label>אימייל:</label>\n  <input type="email" placeholder="your@email.com"><br><br>\n  <button type="submit">שלח</button>\n</form>` },
                { type: 'exercise', instructions: 'צור טופס עם input type="text" וכפתור submit', hint: '<form><input type="text"><button type="submit">שלח</button></form>', xp: 25, check: c => c.includes('<form>') && c.includes('input') && c.includes('button') },
                { type: 'question', q: 'מה type="password" עושה לשדה?', options: ['מסתיר את הטקסט כנקודות', 'מוסיף גבול אדום', 'מחייב מינימום 8 תווים'], correct: 0, xp: 10 }
            ]
        },
        {
            id: 'html-9', title: 'טבלאות', desc: 'table, tr, th, td', xp: 40, steps: [
                { type: 'theory', content: `<h3>טבלאות HTML</h3><ul><li><code>&lt;table&gt;</code> — מכל הטבלה</li><li><code>&lt;tr&gt;</code> — שורה (table row)</li><li><code>&lt;th&gt;</code> — כותרת עמודה (מודגשת)</li><li><code>&lt;td&gt;</code> — תא רגיל (table data)</li><li><code>&lt;thead&gt;</code>, <code>&lt;tbody&gt;</code> — אופציונלי לארגון</li></ul>` },
                { type: 'code', lang: 'html', runnable: true, code: `<table border="1">\n  <tr>\n    <th>שם</th>\n    <th>גיל</th>\n    <th>עיר</th>\n  </tr>\n  <tr>\n    <td>אייל</td>\n    <td>14</td>\n    <td>תל אביב</td>\n  </tr>\n  <tr>\n    <td>מיה</td>\n    <td>15</td>\n    <td>חיפה</td>\n  </tr>\n</table>` },
                { type: 'exercise', instructions: 'כתוב טבלה עם tr, th ו-td', hint: '<table><tr><th>כותרת</th></tr><tr><td>נתון</td></tr></table>', xp: 22, check: c => c.includes('<table') && c.includes('<tr>') && c.includes('<td>') },
                { type: 'question', q: 'מה ההבדל בין th ל-td?', options: ['th לשורות, td לעמודות', 'th כותרת מודגשת, td תא רגיל', 'אין הבדל'], correct: 1, xp: 10 }
            ]
        },
        {
            id: 'html-10', title: 'div ו-span', desc: 'מכלים לעיצוב', xp: 35, steps: [
                { type: 'theory', content: `<h3>div ו-span</h3><p><code>&lt;div&gt;</code> — Block element: תופס שורה שלמה. משמש לקיבוץ אלמנטים.</p><p><code>&lt;span&gt;</code> — Inline element: נשאר בתוך הטקסט. משמש לסגנון חלק מהטקסט.</p><p>שניהם אין להם משמעות עיצובית ברירת מחדל — מקבלים סגנון דרך CSS.</p>` },
                { type: 'code', lang: 'html', runnable: true, code: `<div style="background:lightblue; padding:10px; margin:5px;">\n  <h3>אני div</h3>\n  <p>div תופס שורה שלמה</p>\n</div>\n<p>טקסט רגיל עם <span style="color:red;">span אדום</span> בתוכו.</p>` },
                { type: 'exercise', instructions: 'עטוף 2 פסקאות בתוך div אחד', hint: '<div><p>פסקה 1</p><p>פסקה 2</p></div>', xp: 18, check: c => c.includes('<div>') && (c.match(/<p>/g) || []).length >= 2 },
                { type: 'question', q: 'מה ההבדל בין div ל-span?', options: ['div שורה שלמה, span בתוך טקסט', 'div לצבעים, span לגדלים', 'אין הבדל'], correct: 0, xp: 10 }
            ]
        },
        {
            id: 'html-11', title: 'Classes ו-IDs', desc: 'לזהות אלמנטים ב-CSS/JS', xp: 40, steps: [
                { type: 'theory', content: `<h3>class ו-id</h3><p><strong>class</strong> — שם לקבוצת אלמנטים. ניתן לשימוש חוזר. ב-CSS: <code>.classname</code></p><p><strong>id</strong> — מזהה ייחודי. רק אלמנט אחד. ב-CSS: <code>#idname</code>, ב-JS: <code>getElementById</code></p>` },
                { type: 'code', lang: 'html', runnable: true, code: `<style>\n  .card { background: #eee; padding: 10px; margin: 5px; border-radius: 5px; }\n  #special { color: blue; font-weight: bold; }\n</style>\n<div class="card">כרטיס 1</div>\n<div class="card">כרטיס 2</div>\n<p id="special">פסקה מיוחדת עם id</p>` },
                { type: 'exercise', instructions: 'הוסף class="box" לשני divים ו-id="main" לdiv אחד', hint: '<div class="box" id="main">...</div>', xp: 22, check: c => c.includes('class=') && c.includes('id=') },
                { type: 'question', q: 'כמה אלמנטים יכולים לשתף אותו id?', options: ['כמה שרוצים', '2', '1 בלבד'], correct: 2, xp: 10 }
            ]
        },
        {
            id: 'html-12', title: 'תגיות סמנטיות', desc: 'header, nav, main, footer', xp: 40, steps: [
                { type: 'theory', content: `<h3>HTML סמנטי</h3><p>תגיות סמנטיות מספרות לדפדפן ולגוגל מה תפקיד כל חלק:</p><ul><li><code>&lt;header&gt;</code> — ראש הדף</li><li><code>&lt;nav&gt;</code> — ניווט</li><li><code>&lt;main&gt;</code> — תוכן ראשי</li><li><code>&lt;section&gt;</code> — קטע</li><li><code>&lt;article&gt;</code> — מאמר</li><li><code>&lt;footer&gt;</code> — תחתית הדף</li></ul>` },
                { type: 'code', lang: 'html', runnable: true, code: `<header>\n  <h1>האתר שלי</h1>\n  <nav><a href="#">בית</a> | <a href="#">אודות</a></nav>\n</header>\n<main>\n  <section>\n    <h2>ברוכים הבאים</h2>\n    <p>תוכן ראשי כאן.</p>\n  </section>\n</main>\n<footer><p>© 2024 כל הזכויות שמורות</p></footer>` },
                { type: 'exercise', instructions: 'כתוב דף עם header, main, ו-footer', hint: '<header>...</header><main>...</main><footer>...</footer>', xp: 22, check: c => c.includes('<header>') && c.includes('<main>') && c.includes('<footer>') },
                { type: 'question', q: 'מה תפקיד תגית nav?', options: ['יוצרת ניווט', 'יוצרת כפתורים', 'מרכזת טקסט'], correct: 0, xp: 10 }
            ]
        },
        {
            id: 'html-13', title: 'iframe', desc: 'הטמעת תוכן חיצוני', xp: 30, steps: [
                { type: 'theory', content: `<h3>iframe</h3><p><code>&lt;iframe&gt;</code> מאפשר להטמיע אתר אחר בתוך האתר שלך!</p><p>שימושים: מפות גוגל, YouTube, מצגות.</p><code>&lt;iframe src="URL" width="600" height="400"&gt;&lt;/iframe&gt;</code>` },
                { type: 'code', lang: 'html', runnable: true, code: `<h3>מפה מוטמעת:</h3>\n<iframe \n  src="https://www.openstreetmap.org/export/embed.html?bbox=34.7,31.9,35.2,32.3" \n  width="400" \n  height="250"\n  title="מפה">\n</iframe>` },
                { type: 'exercise', instructions: 'כתוב iframe עם src ו-width', hint: '<iframe src="https://example.com" width="400" height="300"></iframe>', xp: 15, check: c => c.includes('<iframe') && c.includes('src') },
                { type: 'question', q: 'לשם מה משמש iframe?', options: ['ליצירת טפסים', 'להטמעת תוכן חיצוני', 'לצביעת טקסט'], correct: 1, xp: 10 }
            ]
        },
        {
            id: 'html-14', title: 'חיבור CSS לHTML', desc: 'link stylesheet', xp: 35, steps: [
                { type: 'theory', content: `<h3>חיבור CSS</h3><p>שתי דרכים עיקריות:</p><p><strong>1. קובץ חיצוני (מומלץ):</strong><br><code>&lt;link rel="stylesheet" href="style.css"&gt;</code><br>בתוך &lt;head&gt;</p><p><strong>2. style פנימי:</strong><br><code>&lt;style&gt; h1 { color: red; } &lt;/style&gt;</code><br>גם בתוך &lt;head&gt;</p><p><strong>3. Inline (לא מומלץ):</strong><br><code>&lt;h1 style="color:red;"&gt;</code></p>` },
                { type: 'code', lang: 'html', runnable: true, code: `<!DOCTYPE html>\n<html>\n<head>\n  <style>\n    body { background: #001; color: #0ff; font-family: Arial; }\n    h1 { text-shadow: 0 0 10px cyan; }\n    p { color: #aaf; }\n  </style>\n</head>\n<body>\n  <h1>CSS מחובר!</h1>\n  <p>הסגנון עובד!</p>\n</body>\n</html>` },
                { type: 'exercise', instructions: 'הוסף תגית style בתוך head עם צבע h1 כחול', hint: '<head><style>h1{color:blue;}</style></head>', xp: 18, check: c => c.includes('<style>') && c.includes('color') },
                { type: 'question', q: 'באיזה element שמים את תגית link לCSS?', options: ['<body>', '<head>', '<footer>'], correct: 1, xp: 10 }
            ]
        },
        {
            id: 'html-15', title: 'חיבור JavaScript לHTML', desc: 'תגית script', xp: 35, steps: [
                { type: 'theory', content: `<h3>חיבור JavaScript</h3><p>תגית <code>&lt;script&gt;</code> מוסיפה JavaScript.</p><p><strong>קובץ חיצוני (מומלץ):</strong><br><code>&lt;script src="app.js"&gt;&lt;/script&gt;</code><br>לפני &lt;/body&gt;</p><p><strong>Inline:</strong><br><code>&lt;script&gt; alert("שלום!"); &lt;/script&gt;</code></p><p>מניחים את script <em>לפני סוף body</em> כדי שה-HTML יטען קודם.</p>` },
                { type: 'code', lang: 'html', runnable: true, code: `<!DOCTYPE html>\n<html>\n<body>\n  <h1 id="title">לחץ על הכפתור</h1>\n  <button onclick="changeText()">לחץ!</button>\n  <script>\n    function changeText() {\n      document.getElementById('title').textContent = 'שינית את הטקסט! 🎉';\n    }\n  </script>\n</body>\n</html>` },
                { type: 'exercise', instructions: 'הוסף script עם alert("שלום!") שרץ כשלוחצים על כפתור', hint: '<button onclick="alert(\'שלום!\')">לחץ</button>', xp: 18, check: c => c.includes('<script') || c.includes('onclick') },
                { type: 'question', q: 'היכן מומלץ לשים את תגית script?', options: ['בhead', 'לפני /body', 'בתוך nav'], correct: 1, xp: 10 }
            ]
        },
    ],

    css: [
        {
            id: 'css-1', title: 'מה זה CSS?', desc: 'עיצוב הדף', xp: 40, steps: [
                { type: 'theory', content: `<h3>CSS — Cascading Style Sheets</h3><p>CSS מעצב את HTML. בלי CSS, אתרים יראו כמו מסמך טקסט רגיל.</p><p><strong>מבנה CSS:</strong></p><code>selector { property: value; }</code><ul><li><strong>selector</strong> — איזה אלמנט לעצב (h1, .class, #id)</li><li><strong>property</strong> — מה לשנות (color, size)</li><li><strong>value</strong> — הערך (red, 20px)</li></ul>` },
                { type: 'code', lang: 'html', runnable: true, code: `<style>\n  h1 { color: #ff00ff; font-size: 2em; }\n  p { color: #00ffff; background: #001; padding: 10px; }\n  .special { border: 2px solid gold; padding: 5px; }\n</style>\n<h1>כותרת מעוצבת</h1>\n<p>פסקה מעוצבת</p>\n<p class="special">פסקה מיוחדת</p>` },
                { type: 'exercise', instructions: 'כתוב CSS שמשנה צבע h1 לכחול', hint: 'h1 { color: blue; }', xp: 20, check: c => c.includes('color') && (c.includes('h1') || c.includes('<style>')) },
                { type: 'question', q: 'מה הסדר הנכון: selector, property, value?', options: ['h1 { color: blue; }', 'color: h1 { blue }', 'blue { h1: color }'], correct: 0, xp: 10 }
            ]
        },
        {
            id: 'css-2', title: 'צבעים', desc: 'color, background-color', xp: 35, steps: [
                { type: 'theory', content: `<h3>צבעים ב-CSS</h3><p>4 דרכים לציין צבע:</p><ul><li><strong>שם:</strong> red, blue, green</li><li><strong>HEX:</strong> #ff0000 (אדום), #00ffff (ציאן)</li><li><strong>RGB:</strong> rgb(255, 0, 0)</li><li><strong>RGBA:</strong> rgba(255, 0, 0, 0.5) — עם שקיפות</li></ul><p><code>color</code> לצבע טקסט, <code>background-color</code> לרקע.</p>` },
                { type: 'code', lang: 'html', runnable: true, code: `<style>\n  .r { color: red; }\n  .g { color: #00ff00; }\n  .b { color: rgb(0, 0, 255); }\n  .box { background-color: rgba(0,100,255,0.2); padding:10px; border-radius:5px; }\n</style>\n<p class="r">אדום</p>\n<p class="g">ירוק HEX</p>\n<p class="b">כחול RGB</p>\n<div class="box">רקע שקוף</div>` },
                { type: 'exercise', instructions: 'עצב div עם background-color ו-color שונים', hint: '.mybox { background-color: #001; color: #0ff; }', xp: 18, check: c => c.includes('background-color') && c.includes('color') },
                { type: 'question', q: 'איזה value נותן שקיפות חלקית?', options: ['rgb(255,0,0)', '#ff0000', 'rgba(255,0,0,0.5)'], correct: 2, xp: 10 }
            ]
        },
        {
            id: 'css-3', title: 'רקעים וגרדיאנטים', desc: 'background, gradient', xp: 40, steps: [
                { type: 'theory', content: `<h3>רקע ב-CSS</h3><ul><li><code>background-color</code> — צבע אחיד</li><li><code>background-image: url(...)</code> — תמונה</li><li><code>linear-gradient()</code> — מעבר ליניארי</li><li><code>radial-gradient()</code> — מעבר עגול</li></ul><p>דוגמת גרדיאנט: <code>background: linear-gradient(90deg, #00ffff, #ff00ff);</code></p>` },
                { type: 'code', lang: 'html', runnable: true, code: `<style>\n  .g1 { background: linear-gradient(90deg, #00d4ff, #b400ff); padding:20px; color:white; margin:5px; }\n  .g2 { background: linear-gradient(135deg, #ff6b6b, #ffd700); padding:20px; margin:5px; }\n  .g3 { background: radial-gradient(circle, #00ff88, #001); padding:20px; color:white; margin:5px; }\n</style>\n<div class="g1">Linear כחול-סגול</div>\n<div class="g2">Linear אדום-זהב</div>\n<div class="g3">Radial ירוק</div>` },
                { type: 'exercise', instructions: 'צור div עם linear-gradient בין שני צבעים לפי בחירתך', hint: 'div { background: linear-gradient(90deg, red, blue); }', xp: 22, check: c => c.includes('gradient') },
                { type: 'question', q: 'מה הפרמטר הראשון ב-linear-gradient?', options: ['הצבע הראשון', 'הכיוון (זווית)', 'המהירות'], correct: 1, xp: 10 }
            ]
        },
        {
            id: 'css-4', title: 'Padding ו-Margin', desc: 'מרווחים פנימיים וחיצוניים', xp: 40, steps: [
                { type: 'theory', content: `<h3>Box Model — מרווחים</h3><p><strong>Padding</strong> — מרווח פנימי (בין תוכן לגבול)</p><p><strong>Margin</strong> — מרווח חיצוני (בין אלמנט לשאר)</p><code>padding: 10px; /* כל הצדדים */\npadding: 10px 20px; /* עליון/תחתון ימין/שמאל */\npadding-top: 5px; /* רק למעלה */</code>` },
                { type: 'code', lang: 'html', runnable: true, code: `<style>\n  .box { \n    background: #00d4ff22;\n    border: 2px solid #00d4ff;\n    padding: 20px;\n    margin: 15px;\n    border-radius: 8px;\n  }\n  .no-pad { background: #ff00ff22; border: 2px solid #ff00ff; margin: 15px; }\n</style>\n<div class="box">עם padding=20px</div>\n<div class="no-pad">בלי padding</div>` },
                { type: 'exercise', instructions: 'צור div עם padding: 20px ו-margin: 10px', hint: '.mybox { padding: 20px; margin: 10px; }', xp: 22, check: c => c.includes('padding') && c.includes('margin') },
                { type: 'question', q: 'מה ההבדל בין padding ל-margin?', options: ['אין הבדל', 'padding פנימי, margin חיצוני', 'padding חיצוני, margin פנימי'], correct: 1, xp: 10 }
            ]
        },
        {
            id: 'css-5', title: 'גבולות ועיגולים', desc: 'border, border-radius', xp: 35, steps: [
                { type: 'theory', content: `<h3>Border</h3><p><code>border: עובי סגנון צבע;</code></p><p>דוגמה: <code>border: 2px solid red;</code></p><p>סגנונות: solid, dashed, dotted, double</p><p><strong>border-radius</strong> — עיגול פינות:<br><code>border-radius: 10px;</code> — פינות מעוגלות<br><code>border-radius: 50%;</code> — עיגול מושלם</p>` },
                { type: 'code', lang: 'html', runnable: true, code: `<style>\n  .b1 { border: 3px solid #00ffff; padding:10px; margin:8px; }\n  .b2 { border: 3px dashed #ff00ff; border-radius: 10px; padding:10px; margin:8px; }\n  .circle { border: 3px solid gold; border-radius: 50%; width:80px; height:80px; display:flex; align-items:center; justify-content:center; margin:8px; }\n</style>\n<div class="b1">Solid border</div>\n<div class="b2">Dashed + radius</div>\n<div class="circle">⭕</div>` },
                { type: 'exercise', instructions: 'צור div עם border מלא ו-border-radius: 10px', hint: 'div { border: 2px solid blue; border-radius: 10px; }', xp: 18, check: c => c.includes('border') && c.includes('border-radius') },
                { type: 'question', q: 'איזה border-radius יוצר עיגול?', options: ['10px', '0px', '50%'], correct: 2, xp: 10 }
            ]
        },
        {
            id: 'css-6', title: 'גופנים וטקסט', desc: 'font-size, font-family, text-align', xp: 35, steps: [
                { type: 'theory', content: `<h3>עיצוב טקסט</h3><ul><li><code>font-size: 20px</code> — גודל</li><li><code>font-weight: bold</code> — עובי</li><li><code>font-family: Arial, sans-serif</code> — גופן</li><li><code>text-align: center/right/left</code> — יישור</li><li><code>text-decoration: underline/none</code> — קו תחתון</li><li><code>letter-spacing: 2px</code> — רווח בין אותיות</li></ul>` },
                { type: 'code', lang: 'html', runnable: true, code: `<style>\n  .t1 { font-size: 28px; font-weight: bold; text-align: center; }\n  .t2 { font-family: 'Courier New', monospace; font-size: 14px; color: #0f0; background: #000; padding: 5px; }\n  .t3 { letter-spacing: 5px; text-transform: uppercase; color: #f0f; }\n</style>\n<p class="t1">כותרת גדולה מרוכזת</p>\n<p class="t2">קוד מונוספייס</p>\n<p class="t3">ספוייסד אפרקייס</p>` },
                { type: 'exercise', instructions: 'עצב h1 עם font-size: 32px ו-text-align: center', hint: 'h1 { font-size: 32px; text-align: center; }', xp: 18, check: c => c.includes('font-size') && c.includes('text-align') },
                { type: 'question', q: 'מה הproperty ליישור טקסט?', options: ['text-align', 'align', 'justify'], correct: 0, xp: 10 }
            ]
        },
        {
            id: 'css-7', title: 'Box Shadow ו-Text Shadow', desc: 'אפקטי גלו', xp: 40, steps: [
                { type: 'theory', content: `<h3>Shadows — אפקטי צל</h3><p><strong>box-shadow:</strong> X Y blur spread color</p><code>box-shadow: 0 0 20px #00ffff;</code><p><strong>text-shadow:</strong> X Y blur color</p><code>text-shadow: 0 0 15px #ff00ff;</code><p>לאפקט Neon: X=0, Y=0, blur גדול!</p>` },
                { type: 'code', lang: 'html', runnable: true, code: `<style>\n  body { background: #000; }\n  .neon-box { border: 2px solid #00ffff; box-shadow: 0 0 20px #00ffff, 0 0 40px rgba(0,255,255,0.3); padding: 20px; margin: 10px; }\n  .neon-text { font-size: 2em; color: #ff00ff; text-shadow: 0 0 10px #ff00ff, 0 0 30px rgba(255,0,255,0.5); text-align:center; }\n</style>\n<div class="neon-box">Neon Box!</div>\n<h1 class="neon-text">NEON TEXT!</h1>` },
                { type: 'exercise', instructions: 'הוסף box-shadow עם צבע לבחירתך לdiv', hint: 'div { box-shadow: 0 0 20px #00ffff; }', xp: 22, check: c => c.includes('box-shadow') },
                { type: 'question', q: 'מה גורם לאפקט neon glow ב-shadow?', options: ['X ו-Y גדולים', 'blur גדול עם X=Y=0', 'spread גדול'], correct: 1, xp: 10 }
            ]
        },
        {
            id: 'css-8', title: 'Hover ו-Transitions', desc: 'אנימציות בריחוף', xp: 45, steps: [
                { type: 'theory', content: `<h3>Hover ו-Transitions</h3><p><code>:hover</code> — סגנון כשהעכבר מרחף</p><code>button:hover { background: blue; }</code><p><code>transition</code> — מעבר חלק בין מצבים</p><code>transition: all 0.3s ease;</code><p>שים transition על האלמנט הבסיסי, לא על :hover!</p>` },
                { type: 'code', lang: 'html', runnable: true, code: `<style>\n  .btn {\n    background: transparent;\n    border: 2px solid #00ffff;\n    color: #00ffff;\n    padding: 10px 25px;\n    border-radius: 5px;\n    cursor: pointer;\n    font-size: 1em;\n    transition: all 0.3s ease;\n  }\n  .btn:hover {\n    background: #00ffff;\n    color: #000;\n    box-shadow: 0 0 20px #00ffff;\n    transform: translateY(-3px);\n  }\n</style>\n<button class="btn">ריחוף עלי!</button>` },
                { type: 'exercise', instructions: 'צור כפתור עם :hover שמשנה background וה transition', hint: 'button { transition: all 0.3s; } button:hover { background: blue; }', xp: 25, check: c => c.includes(':hover') && c.includes('transition') },
                { type: 'question', q: 'על מה שמים את ה-transition?', options: ['על :hover', 'על האלמנט הבסיסי', 'על body'], correct: 1, xp: 10 }
            ]
        },
        {
            id: 'css-9', title: 'Flexbox', desc: 'סידור גמיש', xp: 50, steps: [
                { type: 'theory', content: `<h3>Flexbox — סידור גמיש</h3><p><code>display: flex;</code> על המכל הורה</p><ul><li><code>justify-content</code> — ציר ראשי (אופקי): center, space-between, flex-start</li><li><code>align-items</code> — ציר שני (אנכי): center, flex-start, flex-end</li><li><code>flex-direction</code> — כיוון: row (ברירת מחדל), column</li><li><code>gap</code> — רווח בין פריטים</li><li><code>flex-wrap</code> — עטיפה לשורה חדשה</li></ul>` },
                { type: 'code', lang: 'html', runnable: true, code: `<style>\n  .flex-container {\n    display: flex;\n    justify-content: space-between;\n    align-items: center;\n    gap: 10px;\n    background: #001;\n    padding: 10px;\n    flex-wrap: wrap;\n  }\n  .flex-item {\n    background: #00d4ff22;\n    border: 1px solid #00d4ff;\n    padding: 15px;\n    border-radius: 5px;\n    flex: 1;\n    min-width: 80px;\n    text-align: center;\n  }\n</style>\n<div class="flex-container">\n  <div class="flex-item">פריט 1</div>\n  <div class="flex-item">פריט 2</div>\n  <div class="flex-item">פריט 3</div>\n</div>` },
                { type: 'exercise', instructions: 'צור flex container עם 3 פריטים ו-justify-content: center', hint: '.container { display: flex; justify-content: center; gap: 10px; }', xp: 28, check: c => c.includes('flex') && c.includes('justify-content') },
                { type: 'question', q: 'מה justify-content: space-between עושה?', options: ['ממרכז את הפריטים', 'מפזר שווה עם רווח קצה', 'מסדר לעמודה'], correct: 1, xp: 10 }
            ]
        },
        {
            id: 'css-10', title: 'Animations', desc: '@keyframes', xp: 50, steps: [
                { type: 'theory', content: `<h3>CSS Animations</h3><p>2 שלבים:</p><p><strong>1. הגדר keyframes:</strong></p><code>@keyframes myAnim {\n  0% { opacity: 0; }\n  100% { opacity: 1; }\n}</code><p><strong>2. הפעל על אלמנט:</strong></p><code>animation: myAnim 2s infinite;</code><p>פרמטרים: שם, משך, iterations (infinite), timing-function</p>` },
                { type: 'code', lang: 'html', runnable: true, code: `<style>\n  body { background: #000; display:flex; justify-content:center; align-items:center; height:100vh; margin:0; }\n  @keyframes neonPulse {\n    0%,100% { box-shadow: 0 0 10px #00ffff; text-shadow: 0 0 10px #00ffff; }\n    50% { box-shadow: 0 0 40px #00ffff, 0 0 80px rgba(0,255,255,0.5); text-shadow: 0 0 30px #00ffff; }\n  }\n  @keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-15px); } }\n  .neon {\n    color: #00ffff;\n    font-size: 2em;\n    border: 2px solid #00ffff;\n    padding: 20px 40px;\n    animation: neonPulse 2s infinite, float 3s infinite;\n  }\n</style>\n<div class="neon">NEON CYBER</div>` },
                { type: 'exercise', instructions: 'צור animation פשוטה עם @keyframes שמשנה opacity מ-0 ל-1', hint: '@keyframes fade { 0%{opacity:0} 100%{opacity:1} } div { animation: fade 1s; }', xp: 28, check: c => c.includes('@keyframes') && c.includes('animation') },
                { type: 'question', q: 'מה "infinite" עושה ב-animation?', options: ['מאיץ', 'חוזר לנצח', 'מפסיק אחרי שניה'], correct: 1, xp: 10 }
            ]
        },
        {
            id: 'css-11', title: 'Grid', desc: 'פריסה דו-ממדית', xp: 50, steps: [
                { type: 'theory', content: `<h3>CSS Grid</h3><p><code>display: grid;</code> יוצר גריד.</p><ul><li><code>grid-template-columns</code> — עמודות: <code>1fr 1fr 1fr</code> (3 שוות)</li><li><code>grid-template-rows</code> — שורות</li><li><code>gap</code> — מרווח בין תאים</li><li><code>grid-column: span 2</code> — תא שתופס 2 עמודות</li></ul><p><code>repeat(3, 1fr)</code> = <code>1fr 1fr 1fr</code></p>` },
                { type: 'code', lang: 'html', runnable: true, code: `<style>\n  .grid {\n    display: grid;\n    grid-template-columns: repeat(3, 1fr);\n    gap: 10px;\n    background: #001;\n    padding: 10px;\n  }\n  .cell {\n    background: #00d4ff22;\n    border: 1px solid #00d4ff;\n    padding: 20px;\n    text-align: center;\n    border-radius: 5px;\n  }\n  .wide { grid-column: span 2; background: #b400ff22; border-color: #b400ff; }\n</style>\n<div class="grid">\n  <div class="cell">1</div>\n  <div class="cell">2</div>\n  <div class="cell">3</div>\n  <div class="cell wide">תא רחב (span 2)</div>\n  <div class="cell">5</div>\n</div>` },
                { type: 'exercise', instructions: 'צור grid עם 2 עמודות שוות ו-gap', hint: '.grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }', xp: 28, check: c => c.includes('grid') && c.includes('grid-template-columns') },
                { type: 'question', q: 'מה repeat(3, 1fr) עושה?', options: ['חוזר animation 3 פעמים', 'יוצר 3 עמודות שוות', 'יוצר 3 שורות'], correct: 1, xp: 10 }
            ]
        },
        {
            id: 'css-12', title: 'Responsive Design', desc: 'Media Queries', xp: 50, steps: [
                { type: 'theory', content: `<h3>Responsive — עיצוב מגיב</h3><p>אתר שמסתגל לכל מסך (מחשב, טאבלט, נייד).</p><p><strong>Media Query:</strong></p><code>@media (max-width: 768px) {\n  /* CSS לנייד בלבד */\n}</code><p>Breakpoints נפוצים:</p><ul><li>480px — נייד קטן</li><li>768px — טאבלט</li><li>1024px — מחשב נייד</li></ul><p>Mobile First: כתוב ל-mobile קודם, אחר כך הוסף לגדול!</p>` },
                { type: 'code', lang: 'html', runnable: true, code: `<style>\n  .container {\n    display: grid;\n    grid-template-columns: repeat(3, 1fr);\n    gap: 10px;\n    padding: 10px;\n    background: #001;\n  }\n  .card {\n    background: #00d4ff22;\n    border: 1px solid #00d4ff;\n    padding: 15px;\n    border-radius: 8px;\n    text-align: center;\n  }\n  @media (max-width: 600px) {\n    .container { grid-template-columns: 1fr; }\n  }\n</style>\n<div class="container">\n  <div class="card">כרטיס 1<br><small>מסתגל לגודל מסך!</small></div>\n  <div class="card">כרטיס 2</div>\n  <div class="card">כרטיס 3</div>\n</div>` },
                { type: 'exercise', instructions: 'הוסף @media (max-width: 600px) שמשנה display לblock', hint: '@media (max-width: 600px) { .container { display: block; } }', xp: 28, check: c => c.includes('@media') && c.includes('max-width') },
                { type: 'question', q: 'מה @media (max-width: 768px) אומר?', options: ['רק למסכים מעל 768px', 'רק למסכים עד 768px', 'כל המסכים'], correct: 1, xp: 10 }
            ]
        },
    ],

    js: [
        {
            id: 'js-1', title: 'מה זה JavaScript?', desc: 'שפת התכנות של הדפדפן', xp: 40, steps: [
                { type: 'theory', content: `<h3>JavaScript — שפת הדפדפן</h3><p>JavaScript מוסיפה <strong>חיים</strong> לאתרים: לחיצות, אנימציות, בדיקות, תקשורת עם שרתים.</p><ul><li>HTML = שלד</li><li>CSS = בגדים</li><li>JavaScript = מוח</li></ul><p>JavaScript רצה <strong>בדפדפן</strong> — לא צריך התקנה!</p>` },
                { type: 'code', lang: 'html', runnable: true, code: `<button onclick="greet()">לחץ עלי!</button>\n<p id="output"></p>\n<script>\nfunction greet() {\n  const name = prompt('מה שמך?');\n  document.getElementById('output').textContent = 'שלום, ' + name + '! 🎉';\n}\n</script>` },
                { type: 'exercise', instructions: 'כתוב script עם alert("JavaScript עובד!")', hint: '<script>alert("JavaScript עובד!");</script>', xp: 20, check: c => c.includes('alert') && c.includes('script') },
                { type: 'question', q: 'מה מוסיפה JavaScript לאתר?', options: ['מבנה', 'עיצוב', 'אינטראקטיביות'], correct: 2, xp: 10 }
            ]
        },
        {
            id: 'js-2', title: 'משתנים', desc: 'let, const, var', xp: 40, steps: [
                { type: 'theory', content: `<h3>Variables — משתנים</h3><p>משתנה = קופסה לשמירת מידע.</p><code>let name = "אייל";    // ניתן לשנות\nconst age = 15;        // לא ניתן לשנות\nvar old = "ישן";      // דרך ישנה, לא מומלץ</code><p>חוקי שמות: מתחיל באות, ללא רווחים, camelCase.</p>` },
                { type: 'code', lang: 'html', runnable: true, code: `<script>\nlet score = 0;\nconst maxScore = 100;\nlet playerName = "שחקן";\n\nconsole.log("שחקן:", playerName);\nconsole.log("ניקוד:", score, "/", maxScore);\n\nscore = 50; // שינוי let — OK\nconsole.log("ניקוד חדש:", score);\n// maxScore = 200; // שגיאה! const לא משתנה\n</script>\n<p>פתח Console (F12) לראות תוצאות</p>` },
                { type: 'exercise', instructions: 'צור משתנה let בשם username עם הערך "Cyber" ו-const בשם level עם 5', hint: 'let username = "Cyber"; const level = 5;', xp: 22, check: c => c.includes('let') && c.includes('const') },
                { type: 'question', q: 'מה ההבדל בין let ל-const?', options: ['let לא ניתן לשנות, const כן', 'let ניתן לשנות, const לא', 'אין הבדל'], correct: 1, xp: 10 }
            ]
        },
        {
            id: 'js-3', title: 'סוגי נתונים', desc: 'String, Number, Boolean', xp: 35, steps: [
                { type: 'theory', content: `<h3>Data Types</h3><ul><li><strong>String</strong> — טקסט: <code>"שלום"</code>, <code>'hello'</code></li><li><strong>Number</strong> — מספר: <code>42</code>, <code>3.14</code></li><li><strong>Boolean</strong> — true/false: <code>true</code>, <code>false</code></li><li><strong>Array</strong> — רשימה: <code>[1, 2, 3]</code></li><li><strong>Object</strong> — אובייקט: <code>{name: "אייל"}</code></li><li><strong>null/undefined</strong> — ריק</li></ul><p><code>typeof x</code> — בדוק סוג</p>` },
                { type: 'code', lang: 'html', runnable: true, code: `<script>\nlet name = "אייל";    // String\nlet age = 15;         // Number\nlet isStudent = true; // Boolean\nlet grades = [90, 85, 95]; // Array\n\nconsole.log(typeof name);       // string\nconsole.log(typeof age);        // number\nconsole.log(typeof isStudent);  // boolean\nconsole.log("ממוצע:", (90+85+95)/3);\n</script>\n<p>פתח Console (F12)</p>` },
                { type: 'exercise', instructions: 'צור 3 משתנים: string, number, boolean', hint: 'let s="hello"; let n=42; let b=true;', xp: 18, check: c => { const h = c.includes('"') || c.includes("'"); const n = /\d/.test(c); const b = c.includes('true') || c.includes('false'); return h && n && b; } },
                { type: 'question', q: 'מה typeof "שלום" מחזיר?', options: ['text', 'string', 'word'], correct: 1, xp: 10 }
            ]
        },
        {
            id: 'js-4', title: 'פעולות חשבוניות', desc: 'חשבון ואופרטורים', xp: 35, steps: [
                { type: 'theory', content: `<h3>Operators</h3><p><strong>חשבוני:</strong> + - * / % **</p><code>10 + 5   // 15\n10 % 3   // 1 (שארית)\n2 ** 3   // 8 (2 בחזקת 3)</code><p><strong>השמה:</strong> += -= *= /=</p><code>let x = 5;\nx += 3; // x = 8</code><p><strong>String Concatenation:</strong></p><code>"שלום " + "עולם" // "שלום עולם"</code><p><strong>Template literals:</strong></p><code>\`שלום \${name}!\`</code>` },
                { type: 'code', lang: 'html', runnable: true, code: `<script>\nlet a = 10, b = 3;\nconsole.log(a + b);  // 13\nconsole.log(a - b);  // 7\nconsole.log(a * b);  // 30\nconsole.log(a / b);  // 3.33...\nconsole.log(a % b);  // 1\n\nlet name = "אייל";\nlet level = 5;\nconsole.log(\`שחקן \${name} ברמה \${level}\`);\n</script>\n<p>פתח F12</p>` },
                { type: 'exercise', instructions: 'חשב 7 כפול 8 ושמור ב-let בשם result', hint: 'let result = 7 * 8;', xp: 18, check: c => c.includes('*') && c.includes('result') && (c.includes('7') || c.includes('56')) },
                { type: 'question', q: 'מה % (modulo) מחזיר?', options: ['חלוקה', 'שארית חלוקה', 'כפל'], correct: 1, xp: 10 }
            ]
        },
        {
            id: 'js-5', title: 'Functions', desc: 'פונקציות ושימוש חוזר', xp: 50, steps: [
                { type: 'theory', content: `<h3>Functions — פונקציות</h3><p>פונקציה היא קטע קוד שנותנים לו שם וקוראים לו שוב ושוב.</p><code>function functionName(params) {\n  // קוד\n  return value;\n}</code><p><strong>Arrow Function (מודרני):</strong></p><code>const add = (a, b) => a + b;</code>` },
                { type: 'code', lang: 'html', runnable: true, code: `<script>\nfunction greet(name) {\n  return "שלום, " + name + "!";\n}\n\nfunction addXP(current, bonus) {\n  return current + bonus;\n}\n\nconsole.log(greet("אייל"));\nconsole.log(greet("מיה"));\nlet score = addXP(100, 50);\nconsole.log("ניקוד:", score);\n\n// Arrow function\nconst multiply = (a, b) => a * b;\nconsole.log(multiply(3, 4)); // 12\n</script>\n<p>פתח F12</p>` },
                { type: 'exercise', instructions: 'כתוב function בשם square שמקבל מספר ומחזיר את הריבוע שלו', hint: 'function square(n) { return n * n; }', xp: 28, check: c => c.includes('function') && c.includes('return') },
                { type: 'question', q: 'מה return עושה בפונקציה?', options: ['מתחיל הפונקציה', 'מחזיר ערך ומסיים', 'מדפיס לconsole'], correct: 1, xp: 10 }
            ]
        },
        {
            id: 'js-6', title: 'Conditions — if/else', desc: 'קבלת החלטות', xp: 45, steps: [
                { type: 'theory', content: `<h3>if / else if / else</h3><code>if (condition) {\n  // אם אמת\n} else if (other) {\n  // אחרת אם\n} else {\n  // אחרת\n}</code><p><strong>אופרטורי השוואה:</strong></p><ul><li><code>===</code> שווה בדיוק</li><li><code>!==</code> לא שווה</li><li><code>&gt; &lt; &gt;= &lt;=</code> גדול/קטן</li></ul><p><strong>לוגיים:</strong> <code>&amp;&amp;</code> (וגם), <code>||</code> (או), <code>!</code> (לא)</p>` },
                { type: 'code', lang: 'html', runnable: true, code: `<script>\nfunction checkScore(score) {\n  if (score >= 90) {\n    return "מצוין! 🏆";\n  } else if (score >= 70) {\n    return "טוב! 👍";\n  } else if (score >= 50) {\n    return "עבר 😊";\n  } else {\n    return "נכשל 😢";\n  }\n}\n\nconsole.log(checkScore(95));  // מצוין!\nconsole.log(checkScore(75));  // טוב!\nconsole.log(checkScore(45));  // נכשל\n</script>\n<p>פתח F12</p>` },
                { type: 'exercise', instructions: 'כתוב if שבודק אם מספר גדול מ-10 ומדפיס "גדול" או "קטן"', hint: 'if (num > 10) { console.log("גדול"); } else { console.log("קטן"); }', xp: 25, check: c => c.includes('if') && c.includes('else') },
                { type: 'question', q: 'מה === בודק?', options: ['שווה בערך בלבד', 'שווה בערך ובסוג', 'גדול מ'], correct: 1, xp: 10 }
            ]
        },
        {
            id: 'js-7', title: 'לולאות for ו-while', desc: 'חזרה על קוד', xp: 45, steps: [
                { type: 'theory', content: `<h3>Loops — לולאות</h3><p><strong>for loop:</strong></p><code>for (let i = 0; i < 5; i++) {\n  console.log(i); // 0,1,2,3,4\n}</code><p><strong>while loop:</strong></p><code>let i = 0;\nwhile (i < 5) {\n  console.log(i);\n  i++;\n}</code><p><strong>for...of (למערכים):</strong></p><code>for (const item of array) {\n  console.log(item);\n}</code>` },
                { type: 'code', lang: 'html', runnable: true, code: `<script>\n// for loop\nfor (let i = 1; i <= 5; i++) {\n  console.log("שלב " + i);\n}\n\n// for...of\nconst languages = ["HTML", "CSS", "JS"];\nfor (const lang of languages) {\n  console.log("שפה:", lang);\n}\n\n// while\nlet xp = 0;\nwhile (xp < 100) {\n  xp += 25;\n  console.log("XP:", xp);\n}\n</script>\n<p>פתח F12</p>` },
                { type: 'exercise', instructions: 'כתוב for loop שמדפיס מספרים 1 עד 10', hint: 'for (let i = 1; i <= 10; i++) { console.log(i); }', xp: 25, check: c => c.includes('for') && c.includes('i') && (c.includes('10') || c.includes('<= 10')) },
                { type: 'question', q: 'מה i++ עושה?', options: ['מחלק ב-1', 'מוסיף 1 ל-i', 'בודק אם i=0'], correct: 1, xp: 10 }
            ]
        },
        {
            id: 'js-8', title: 'Arrays — מערכים', desc: 'רשימות של נתונים', xp: 45, steps: [
                { type: 'theory', content: `<h3>Arrays</h3><code>let arr = [1, 2, 3, "hello", true];</code><p><strong>גישה:</strong> arr[0] — האינדקס מתחיל מ-0!</p><p><strong>מתודות שימושיות:</strong></p><ul><li><code>arr.push(x)</code> — הוסף לסוף</li><li><code>arr.pop()</code> — הסר מהסוף</li><li><code>arr.length</code> — אורך</li><li><code>arr.indexOf(x)</code> — מצא index</li><li><code>arr.filter(fn)</code> — סנן</li><li><code>arr.map(fn)</code> — שנה כל פריט</li></ul>` },
                { type: 'code', lang: 'html', runnable: true, code: `<script>\nlet scores = [85, 92, 78, 95, 60];\nconsole.log("ניקוד ראשון:", scores[0]);\nconsole.log("כמות:", scores.length);\n\nscores.push(100);\nconsole.log("אחרי push:", scores);\n\nconst passing = scores.filter(s => s >= 80);\nconsole.log("עברו:", passing);\n\nconst doubled = scores.map(s => s * 2);\nconsole.log("כפול:", doubled);\n</script>\n<p>פתח F12</p>` },
                { type: 'exercise', instructions: 'צור array עם 3 שמות ועשה push להוסיף שם רביעי', hint: 'let names = ["א","ב","ג"]; names.push("ד");', xp: 25, check: c => c.includes('[') && c.includes('push') },
                { type: 'question', q: 'מה האינדקס של הפריט הראשון במערך?', options: ['1', '0', '-1'], correct: 1, xp: 10 }
            ]
        },
        {
            id: 'js-9', title: 'Objects — אובייקטים', desc: 'נתונים מורכבים', xp: 45, steps: [
                { type: 'theory', content: `<h3>Objects</h3><p>Object הוא אוסף של key:value זוגות.</p><code>const player = {\n  name: "אייל",\n  level: 5,\n  xp: 1200,\n  isAdmin: false\n};</code><p><strong>גישה:</strong></p><code>player.name        // "אייל"\nplayer["level"]    // 5</code><p><strong>שינוי:</strong></p><code>player.xp += 100;</code>` },
                { type: 'code', lang: 'html', runnable: true, code: `<script>\nconst player = {\n  name: "CyberKnight",\n  level: 7,\n  xp: 2400,\n  skills: ["HTML", "CSS", "JS"]\n};\n\nconsole.log(player.name);\nconsole.log(\`Level: \${player.level}\`);\nconsole.log("Skills:", player.skills.join(", "));\n\nplayer.xp += 50;\nconsole.log("XP after:", player.xp);\n\nfor (const key in player) {\n  console.log(key, ":", player[key]);\n}\n</script>\n<p>פתח F12</p>` },
                { type: 'exercise', instructions: 'צור object בשם car עם name, year, color', hint: 'const car = { name: "BMW", year: 2024, color: "שחור" };', xp: 25, check: c => c.includes('{') && c.includes(':') && c.includes('}') },
                { type: 'question', q: 'איך ניגשים לשדה name באובייקט obj?', options: ['obj[name]', 'obj.name', 'obj->name'], correct: 1, xp: 10 }
            ]
        },
        {
            id: 'js-10', title: 'DOM — שינוי HTML', desc: 'querySelector ושינוי תוכן', xp: 50, steps: [
                { type: 'theory', content: `<h3>DOM — Document Object Model</h3><p>DOM מאפשר ל-JS לשנות את ה-HTML בזמן אמת!</p><code>// בחירת אלמנטים\nconst el = document.querySelector('#id');\nconst els = document.querySelectorAll('.class');\nconst el2 = document.getElementById('id');\n\n// שינוי תוכן\nel.textContent = "טקסט חדש";\nel.innerHTML = "<b>HTML חדש</b>";\n\n// שינוי סגנון\nel.style.color = "red";\nel.style.display = "none";\n\n// Classes\nel.classList.add("active");\nel.classList.remove("hidden");\nel.classList.toggle("active");</code>` },
                { type: 'code', lang: 'html', runnable: true, code: `<h1 id="title">לחץ כפתור</h1>\n<p id="score">ניקוד: 0</p>\n<button onclick="addPoint()">+1 נקודה</button>\n<button onclick="changeColor()">שנה צבע</button>\n<script>\nlet points = 0;\nfunction addPoint() {\n  points++;\n  document.getElementById('score').textContent = 'ניקוד: ' + points;\n  if (points >= 10) {\n    document.getElementById('title').textContent = '🏆 ניצחת!';\n    document.getElementById('title').style.color = 'gold';\n  }\n}\nfunction changeColor() {\n  document.body.style.background = \`hsl(\${Math.random()*360},50%,10%)\`;\n}\n</script>` },
                { type: 'exercise', instructions: 'השתמש ב-document.querySelector("#output") לשנות textContent', hint: 'document.querySelector("#output").textContent = "שלום!";', xp: 28, check: c => c.includes('querySelector') || c.includes('getElementById') },
                { type: 'question', q: 'מה textContent עושה?', options: ['מחזיר צבע', 'משנה/מחזיר טקסט', 'מוחק אלמנט'], correct: 1, xp: 10 }
            ]
        },
        {
            id: 'js-11', title: 'Events — אירועים', desc: 'click, input, keyboard', xp: 50, steps: [
                { type: 'theory', content: `<h3>Events</h3><p>Events מאפשרים לקוד להגיב לפעולות המשתמש.</p><code>// inline (פשוט)\n<button onclick="myFunc()">לחץ</button>\n\n// addEventListener (מומלץ)\nconst btn = document.querySelector('button');\nbtn.addEventListener('click', function() {\n  console.log("לחצו!");\n});\n\n// Arrow function\nbtn.addEventListener('click', () => {\n  console.log("לחצו!");\n});</code><p>אירועים נפוצים: click, mouseover, mouseout, input, keydown, submit, change</p>` },
                { type: 'code', lang: 'html', runnable: true, code: `<input id="myInput" placeholder="כתוב כאן...">\n<button id="myBtn">שלח</button>\n<div id="output" style="margin-top:10px;padding:10px;background:#eee;min-height:30px;"></div>\n<script>\nconst input = document.getElementById('myInput');\nconst btn = document.getElementById('myBtn');\nconst output = document.getElementById('output');\n\nbtn.addEventListener('click', () => {\n  output.textContent = "הכנסת: " + input.value;\n  output.style.color = "blue";\n});\n\ninput.addEventListener('input', () => {\n  output.textContent = "מקליד: " + input.value;\n});\n\ndocument.addEventListener('keydown', (e) => {\n  if (e.key === 'Enter') btn.click();\n});\n</script>` },
                { type: 'exercise', instructions: 'הוסף addEventListener("click") לכפתור שמציג alert', hint: 'btn.addEventListener("click", () => { alert("לחצת!"); });', xp: 28, check: c => c.includes('addEventListener') && c.includes('click') },
                { type: 'question', q: 'מה addEventListener עושה?', options: ['מחלישה אירוע', 'מאזינה ומגיבה לאירוע', 'מוחקת כפתור'], correct: 1, xp: 10 }
            ]
        },
        {
            id: 'js-12', title: 'console.log ו-Debugging', desc: 'מציאת ותיקון שגיאות', xp: 40, steps: [
                { type: 'theory', content: `<h3>Debugging</h3><p><code>console.log(x)</code> — הדפס ל-Console (F12)</p><p><code>console.error("שגיאה")</code> — הדפס שגיאה</p><p><code>console.warn("אזהרה")</code> — הדפס אזהרה</p><p><strong>שגיאות נפוצות:</strong></p><ul><li><strong>SyntaxError</strong> — טעות כתיב (שכחת ; או {)</li><li><strong>ReferenceError</strong> — משתנה לא הוגדר</li><li><strong>TypeError</strong> — סוג שגוי</li></ul><p><strong>טיפ:</strong> console.log לפני כל חלק כדי למצוא איפה נתקעת!</p>` },
                { type: 'code', lang: 'html', runnable: true, code: `<script>\n// console.log לדיבוג\nlet x = 10;\nconsole.log("x =", x);\n\nfunction divide(a, b) {\n  console.log("מחלק", a, "ב-", b);\n  if (b === 0) {\n    console.error("שגיאה: חלוקה באפס!");\n    return null;\n  }\n  const result = a / b;\n  console.log("תוצאה:", result);\n  return result;\n}\n\ndivide(10, 2);\ndivide(5, 0);\n\n// try-catch לתפיסת שגיאות\ntry {\n  let obj = null;\n  obj.name; // שגיאה!\n} catch (err) {\n  console.warn("נתפסה שגיאה:", err.message);\n}\n</script>\n<p>פתח F12 לראות</p>` },
                { type: 'exercise', instructions: 'כתוב console.log שמדפיס 3 משתנים שונים', hint: 'let a=1,b=2,c=3; console.log(a,b,c);', xp: 20, check: c => c.includes('console.log') },
                { type: 'question', q: 'איך פותחים את ה-Console בדפדפן?', options: ['Ctrl+S', 'F12 או Ctrl+Shift+I', 'Alt+F4'], correct: 1, xp: 10 }
            ]
        },
        {
            id: 'js-13', title: 'Frontend vs Backend', desc: 'הצד הנראה והנסתר', xp: 35, steps: [
                { type: 'theory', content: `<h3>Frontend ו-Backend</h3><p><strong>Frontend</strong> — מה המשתמש רואה ומרגיש:</p><ul><li>HTML, CSS, JavaScript</li><li>רץ בדפדפן של המשתמש</li><li>עיצוב, אנימציות, לחיצות</li></ul><p><strong>Backend</strong> — מה קורה מאחורי הקלעים:</p><ul><li>Node.js, Python, Java, PHP...</li><li>רץ על שרת</li><li>מסד נתונים, אבטחה, לוגיקה עסקית</li></ul><p><strong>Firebase</strong> — Backend as a Service! Google מנהלת את השרת, אתה רק כותב קוד Frontend.</p>` },
                { type: 'code', lang: 'html', runnable: true, code: `<style>\n  .diagram { display: flex; gap: 20px; justify-content: center; flex-wrap: wrap; padding: 20px; background: #001; }\n  .box { background: #00d4ff22; border: 2px solid #00d4ff; border-radius: 10px; padding: 20px; min-width: 140px; text-align: center; }\n  .box.backend { border-color: #b400ff; background: #b400ff22; }\n  .arrow { font-size: 2em; display: flex; align-items: center; }\n</style>\n<div class="diagram">\n  <div class="box"><h3>🖥️ Frontend</h3><p>HTML CSS JS<br>בדפדפן</p></div>\n  <div class="arrow">⟺</div>\n  <div class="box backend"><h3>🔧 Backend</h3><p>Firebase<br>Database</p></div>\n</div>` },
                { type: 'exercise', instructions: 'כתוב בHTML הסבר קצר (p) מה ההבדל בין frontend ל-backend', hint: '<p>Frontend הוא מה שרואים, Backend הוא השרת</p>', xp: 18, check: c => c.includes('<p>') && (c.includes('frontend') || c.includes('backend') || c.includes('פרונט') || c.includes('באקאנד')) },
                { type: 'question', q: 'ב-Firebase מי מנהל את השרת?', options: ['אתה', 'גוגל', 'המשתמש'], correct: 1, xp: 10 }
            ]
        },
    ]
};

// ===== QUIZ QUESTIONS =====
const QUIZ_QUESTIONS = {
    html: [
        { cat: 'html', q: 'מה ראשי התיבות HTML?', options: ['HyperText Markup Language', 'High Tech Modern Language', 'Hyper Template Multi Link', 'Hard Text Meta Language'], correct: 0, explain: 'HTML = HyperText Markup Language — שפת הסימון לבניית דפים' },
        { cat: 'html', q: 'איזו תגית יוצרת כותרת ראשית?', options: ['<h6>', '<header>', '<h1>', '<title>'], correct: 2, explain: '<h1> היא הכותרת הגדולה ביותר (h1-h6)' },
        { cat: 'html', q: 'כיצד מוסיפים תמונה ב-HTML?', options: ['<image src="">', '<img src="">', '<photo href="">', '<pic url="">'], correct: 1, explain: '<img src="path" alt="desc"> — תגית img עם src' },
        { cat: 'html', q: 'מה תפקיד תגית <a>?', options: ['מוסיפה תמונה', 'יוצרת טבלה', 'יוצרת קישור', 'מגדירה כותרת'], correct: 2, explain: '<a href="url"> יוצרת hyperlink לדף אחר' },
        { cat: 'html', q: 'איזה attribute פותח קישור בטאב חדש?', options: ['new-tab="true"', 'open="new"', 'target="_blank"', 'href="_new"'], correct: 2, explain: 'target="_blank" פותח הקישור בטאב חדש' },
        { cat: 'html', q: 'מה ההבדל בין <ul> ל-<ol>?', options: ['<ul> ממוספרת, <ol> בנקודות', '<ul> בנקודות, <ol> ממוספרת', 'שניהם זהים', '<ul> אופקית, <ol> אנכית'], correct: 1, explain: 'ul = unordered (נקודות), ol = ordered (מספרים)' },
        { cat: 'html', q: 'כמה רמות כותרת יש ב-HTML?', options: ['3', '4', '5', '6'], correct: 3, explain: 'h1 עד h6 — 6 רמות כותרת' },
        { cat: 'html', q: 'מה תגית <div>?', options: ['Block container לקיבוץ אלמנטים', 'תגית לכפתורים', 'תגית ל-links', 'תגית לרשימות'], correct: 0, explain: 'div הוא block element לקיבוץ אלמנטים' },
        { cat: 'html', q: 'איך ניתן לשייך CSS לHTML חיצוני?', options: ['<style src="file.css">', '<link rel="stylesheet" href="file.css">', '<css href="file.css">', '<import css="file.css">'], correct: 1, explain: '<link rel="stylesheet" href="file.css"> בתוך <head>' },
        { cat: 'html', q: 'מה attribute "alt" בתמונה?', options: ['אלטרנטיבי — טקסט חלופי לנגישות', 'גובה התמונה', 'זווית התמונה', 'צבע רקע'], correct: 0, explain: 'alt מספק טקסט חלופי לנגישות ו-SEO' },
        { cat: 'html', q: 'איזו תגית מגדירה את גוף הדף?', options: ['<html>', '<head>', '<body>', '<main>'], correct: 2, explain: '<body> מכיל את כל מה שהמשתמש רואה' },
        { cat: 'html', q: 'מה DOCTYPE html עושה?', options: ['מגדיר כותרת', 'מציין גרסת HTML5', 'מחבר CSS', 'מייבא JS'], correct: 1, explain: '<!DOCTYPE html> מודיע לדפדפן שזה HTML5' },
        { cat: 'html', q: 'איזה input type מסתיר את הטקסט?', options: ['type="hidden"', 'type="text"', 'type="password"', 'type="secret"'], correct: 2, explain: 'type="password" מציג נקודות במקום תווים' },
        { cat: 'html', q: 'מה ההבדל בין id ל-class?', options: ['id ייחודי, class לקבוצה', 'class ייחודי, id לקבוצה', 'אין הבדל', 'id לJS בלבד'], correct: 0, explain: 'id ייחודי לאלמנט אחד, class ניתן לחלוק' },
        { cat: 'html', q: 'מה תגית <iframe> עושה?', options: ['יוצרת פריים לתמונה', 'מטמיעה דף/תוכן חיצוני', 'יוצרת גבול', 'מגדירה ממשק'], correct: 1, explain: 'iframe מאפשר להטמיע אתר/מפה/video חיצוני' },
    ],
    css: [
        { cat: 'css', q: 'מה CSS מייצג?', options: ['Creative Style Script', 'Cascading Style Sheets', 'Computer Style System', 'Custom Styling Script'], correct: 1, explain: 'CSS = Cascading Style Sheets — שפת עיצוב' },
        { cat: 'css', q: 'איך בוחרים אלמנט לפי class ב-CSS?', options: ['.className', '#className', 'className', '@className'], correct: 0, explain: '.className בוחר class, #id בוחר id' },
        { cat: 'css', q: 'מה ההבדל בין padding ל-margin?', options: ['padding חיצוני, margin פנימי', 'padding פנימי, margin חיצוני', 'אין הבדל', 'padding לאנכי, margin לאופקי'], correct: 1, explain: 'padding מרווח פנימי, margin מרווח חיצוני' },
        { cat: 'css', q: 'איזה value של border-radius יוצר עיגול?', options: ['100px', '0px', '50%', 'auto'], correct: 2, explain: 'border-radius: 50% הופך ריבוע לעיגול' },
        { cat: 'css', q: 'מה display: flex עושה?', options: ['מסתיר אלמנט', 'יוצר פריסה גמישה', 'מוחק border', 'משנה font'], correct: 1, explain: 'display:flex מפעיל Flexbox לסידור גמיש' },
        { cat: 'css', q: 'מה justify-content: center עושה ב-Flexbox?', options: ['מרכז אנכית', 'מרכז אופקית', 'מפנה לשמאל', 'מגדיל'], correct: 1, explain: 'justify-content מתייחס לציר הראשי (אופקי ב-row)' },
        { cat: 'css', q: 'מה linear-gradient יוצר?', options: ['אנימציה', 'מעבר צבעים ליניארי', 'גבול', 'צל'], correct: 1, explain: 'linear-gradient(dir, color1, color2) יוצר מעבר צבע' },
        { cat: 'css', q: 'מה box-shadow: 0 0 20px cyan עושה?', options: ['מוסיף צל רחוק', 'יוצר glow ציאן', 'מסיר גבול', 'מרכז'], correct: 1, explain: 'X=0 Y=0 blur גדול יוצר אפקט neon glow' },
        { cat: 'css', q: 'על מה שמים transition?', options: ['על :hover', 'על האלמנט הבסיסי', 'על body', 'על html'], correct: 1, explain: 'transition על האלמנט, לא על :hover — כדי שיעבוד גם בהסרת hover' },
        { cat: 'css', q: 'מה @media (max-width: 768px) אומר?', options: ['רק למסכים גדולים', 'לכל המסכים', 'רק למסכים עד 768px', 'לפלאפונים בלבד'], correct: 2, explain: 'max-width: 768px מיישם CSS למסכים עד רוחב זה' },
        { cat: 'css', q: 'מה grid-template-columns: 1fr 1fr 1fr יוצר?', options: ['3 שורות', '3 עמודות שוות', 'שוlidat 1px', 'שינוי font'], correct: 1, explain: '1fr 1fr 1fr = 3 עמודות שוות ב-Grid' },
        { cat: 'css', q: 'מה :hover עושה?', options: ['עיצוב קבוע', 'עיצוב כשעכבר מרחף', 'אנימציה רציפה', 'transition'], correct: 1, explain: ':hover מפעיל CSS כשעכבר מרחף על האלמנט' },
        { cat: 'css', q: 'מה rgba(0,0,255,0.5) מגדיר?', options: ['צבע אדום', 'כחול עם 50% שקיפות', 'ירוק מלא', 'שקיפות מלאה'], correct: 1, explain: 'rgb(0,0,255) = כחול, a=0.5 = 50% אטימות' },
        { cat: 'css', q: 'מה @keyframes משמש ל?', options: ['הגדרת breakpoints', 'הגדרת animation', 'הגדרת variables', 'בחירת אלמנטים'], correct: 1, explain: '@keyframes מגדיר שלבי animation: 0%...100%' },
        { cat: 'css', q: 'מה ה-property לגודל גופן?', options: ['text-size', 'font-size', 'size', 'em'], correct: 1, explain: 'font-size: 16px/1em/1rem מגדיר גודל טקסט' },
    ],
    js: [
        { cat: 'js', q: 'איך מגדירים משתנה שלא ניתן לשנות?', options: ['let', 'var', 'const', 'fix'], correct: 2, explain: 'const מגדיר קבוע שלא ניתן להשמה חוזרת' },
        { cat: 'js', q: 'מה console.log() עושה?', options: ['מציג popup', 'מדפיס לconsole', 'מוחק אלמנט', 'שולח request'], correct: 1, explain: 'console.log() מדפיס ל-Developer Console (F12)' },
        { cat: 'js', q: 'מה הפונקציה alert() עושה?', options: ['שואלת שאלה', 'מציגה popup עם הודעה', 'מרעננת דף', 'שולחת אימייל'], correct: 1, explain: 'alert("msg") מציג חלון popup עם הודעה' },
        { cat: 'js', q: 'כיצד בוחרים אלמנט לפי id ב-JS?', options: ['document.getClass("id")', 'document.querySelector(".id")', 'document.getElementById("id")', 'document.find("#id")'], correct: 2, explain: 'getElementById("id") מחזיר אלמנט לפי ה-id שלו' },
        { cat: 'js', q: 'מה === בודק?', options: ['רק ערך', 'ערך וסוג', 'רק סוג', 'גדול/קטן'], correct: 1, explain: '=== בדיקת שוויון מדויקת (ערך + סוג), == רק ערך' },
        { cat: 'js', q: 'מה arr.push(x) עושה?', options: ['מסיר מהסוף', 'מוסיף לסוף', 'מוסיף לתחילה', 'מוצא אינדקס'], correct: 1, explain: 'push מוסיף פריט לסוף המערך' },
        { cat: 'js', q: 'מה ה-index של הפריט הראשון במערך?', options: ['1', '0', '-1', 'first'], correct: 1, explain: 'JavaScript arrays מתחילים מאינדקס 0' },
        { cat: 'js', q: 'מה typeof "hello" מחזיר?', options: ['"text"', '"string"', '"word"', '"char"'], correct: 1, explain: 'typeof operator מחזיר את סוג הנתון. string ל-String' },
        { cat: 'js', q: 'איך מוסיפים event listener?', options: ['element.on("click",fn)', 'element.click(fn)', 'element.addEventListener("click",fn)', 'element.listen("click",fn)'], correct: 2, explain: 'addEventListener("event", callback) הדרך המומלצת' },
        { cat: 'js', q: 'מה textContent עושה?', options: ['משנה HTML', 'משנה טקסט בלבד', 'מסיר אלמנט', 'מוסיף class'], correct: 1, explain: 'textContent משנה/מחזיר טקסט ללא HTML. innerHTML כולל HTML' },
        { cat: 'js', q: 'מה return בפונקציה?', options: ['מתחיל פונקציה', 'מחזיר ערך ומסיים', 'מדפיס ל-console', 'קורא לפונקציה'], correct: 1, explain: 'return מחזיר ערך מהפונקציה ומסיים הרצה שלה' },
        { cat: 'js', q: 'מה for (const x of arr) עושה?', options: ['עובר על keys', 'עובר על values של מערך', 'יוצר מערך חדש', 'מוחק פריטים'], correct: 1, explain: 'for...of עובר על ערכי המערך אחד אחד' },
        { cat: 'js', q: 'מה document.querySelector("#box") מחזיר?', options: ['כל האלמנטים עם id=box', 'האלמנט הראשון עם id=box', 'class=box', 'שגיאה'], correct: 1, explain: 'querySelector מחזיר את האלמנט הראשון התואם' },
        { cat: 'js', q: 'מה ה-DOM?', options: ['שפת תכנות', 'ייצוג HTML כאובייקטים שJS יכול לשנות', 'מסד נתונים', 'פרוטוקול רשת'], correct: 1, explain: 'DOM = Document Object Model — ייצוג HTML שJS עובד איתו' },
        { cat: 'js', q: 'מה firebase.auth() מספקת?', options: ['גרפיקה', 'אימות משתמשים (login/logout)', 'עיצוב', 'animations'], correct: 1, explain: 'Firebase Auth מנהלת הרשמה, כניסה, וניהול משתמשים' },
    ]
};

// ===== UTILS =====
function qs(sel) { return document.querySelector(sel); }

// Race any promise against a hard timeout — rejects with code 'auth/timeout' if too slow
function withTimeout(promise, ms = 8000) {
    const t = new Promise((_, rej) =>
        setTimeout(() => rej({ code: 'auth/timeout' }), ms)
    );
    return Promise.race([promise, t]);
}

// ===== INIT =====
window.onerror = () => {
    const ls = document.getElementById('loading-screen');
    if (ls && ls.style.display !== 'none') showAuth();
};

window.addEventListener('load', () => {
    initParticles();
    updateLoader(20, 'LOADING FIREBASE...');
    setTimeout(() => updateLoader(40, 'AUTHENTICATING...'), 300);
    // Failsafe: if Firebase never responds within 8 seconds, show auth
    setTimeout(() => {
        const ls = document.getElementById('loading-screen');
        if (ls && ls.style.display !== 'none') {
            console.warn('Firebase timeout — showing auth');
            showAuth();
        }
    }, 8000);
});

window.addEventListener('hashchange', handleHash);

