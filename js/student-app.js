import { auth, db, firebaseConfig } from './firebase-init.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
    
    // UI Elements
    const userNameEl = document.getElementById('user-name');
    const userLevelEl = document.getElementById('user-level');
    const userXpEl = document.getElementById('user-xp');
    const nextLevelXpEl = document.getElementById('next-level-xp');
    const xpFillEl = document.getElementById('xp-fill');
    const avatarEl = document.getElementById('user-avatar');

    const btnLogout = document.getElementById('btn-logout');
    const btnLearn = document.getElementById('btn-learn');
    const btnQuiz = document.getElementById('btn-quiz');
    const btnSandbox = document.getElementById('btn-sandbox');
    
    const dashboardView = document.getElementById('dashboard-view');
    const learningView = document.getElementById('learning-view');
    const backToDashboard = document.getElementById('back-to-dashboard');
    const claimDailyBtn = document.getElementById('claim-daily');

    let currentUserData = null;

    // Load User Data
    const loadUserData = async (user) => {
        if (firebaseConfig.apiKey === "YOUR_API_KEY") {
            // Mock Mode
            const mockUser = JSON.parse(localStorage.getItem('neon_user')) || { name: "Guest", level: 1, xp: 0 };
            updateUI(mockUser);
            return;
        }

        try {
            const docRef = doc(db, "users", user.uid);
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists()) {
                currentUserData = docSnap.data();
                updateUI(currentUserData);
            } else {
                console.log("No such document!");
            }
        } catch (error) {
            console.error("Error getting document:", error);
        }
    };

    const updateUI = (data) => {
        userNameEl.textContent = data.name || "CyberPlayer";
        userLevelEl.textContent = data.level || 1;
        
        // Calculate XP Progress
        const currentXP = data.xp || 0;
        const level = data.level || 1;
        const nextLevelXP = level * 1000; // Formula for next level
        
        userXpEl.textContent = currentXP;
        nextLevelXpEl.textContent = nextLevelXP;
        
        const percent = Math.min((currentXP / nextLevelXP) * 100, 100);
        xpFillEl.style.width = `${percent}%`;

        // Update avatar seed
        avatarEl.src = `https://api.dicebear.com/7.x/bottts/svg?seed=${data.name}&backgroundColor=00f3ff`;
    };

    // Auth Listener
    if (firebaseConfig.apiKey !== "YOUR_API_KEY") {
        onAuthStateChanged(auth, (user) => {
            if (user) {
                loadUserData(user);
            } else {
                window.location.href = '/login'; // Redirect to login
            }
        });
    } else {
        // MOCK mode
        if(!localStorage.getItem('neon_user')) {
             window.location.href = '/login';
        } else {
             loadUserData(null);
        }
    }

    // Logout
    btnLogout.addEventListener('click', () => {
        if (firebaseConfig.apiKey !== "YOUR_API_KEY") {
            signOut(auth).then(() => {
                window.location.href = '/login';
            });
        } else {
            localStorage.removeItem('neon_user');
            window.location.href = '/login';
        }
    });

    // Navigation
    btnLearn.addEventListener('click', () => {
        dashboardView.classList.add('hidden');
        learningView.classList.remove('hidden');
    });

    btnSandbox.addEventListener('click', () => {
        window.location.href = '/sandbox';
    });

    btnQuiz.addEventListener('click', () => {
        window.location.href = '/quiz';
    });

    backToDashboard.addEventListener('click', () => {
        learningView.classList.add('hidden');
        dashboardView.classList.remove('hidden');
    });

    // Daily Reward
    claimDailyBtn.addEventListener('click', () => {
        showAchievement("התחברות יומית", "+50 XP");
        claimDailyBtn.disabled = true;
        claimDailyBtn.textContent = "נאסף";
        claimDailyBtn.classList.add('text-muted');
        
        // Add XP logic here (MOCK for now)
        if(firebaseConfig.apiKey === "YOUR_API_KEY") {
            let user = JSON.parse(localStorage.getItem('neon_user'));
            user.xp += 50;
            if(user.xp >= user.level * 1000) {
                user.level++;
                user.xp = 0; // simplistic wrap
                showAchievement("רמה חדשה!", `הגעת לרמה ${user.level}`);
            }
            localStorage.setItem('neon_user', JSON.stringify(user));
            updateUI(user);
        }
    });

    // Achievement System
    window.showAchievement = (title, subtitle) => {
        const popup = document.getElementById('achievement-popup');
        const textEl = document.getElementById('achievement-text');
        
        popup.querySelector('h4').textContent = title;
        textEl.textContent = subtitle;
        
        popup.classList.remove('hidden');
        // small delay to allow display block to render before animation
        setTimeout(() => popup.classList.add('show'), 50);

        setTimeout(() => {
            popup.classList.remove('show');
            setTimeout(() => popup.classList.add('hidden'), 500);
        }, 3000);
    };
});
