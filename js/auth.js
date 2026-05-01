import { auth, db, firebaseConfig } from './firebase-init.js';
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword 
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { 
    doc, 
    setDoc, 
    getDoc 
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
    const tabLogin = document.getElementById('tab-login');
    const tabRegister = document.getElementById('tab-register');
    const formLogin = document.getElementById('login-form');
    const formRegister = document.getElementById('register-form');
    const errorMsg = document.getElementById('auth-error');
    const loader = document.getElementById('auth-loader');

    // Tab Switching
    tabLogin.addEventListener('click', () => {
        tabLogin.classList.add('active');
        tabRegister.classList.remove('active');
        formLogin.classList.remove('hidden');
        formRegister.classList.add('hidden');
        errorMsg.classList.add('hidden');
    });

    tabRegister.addEventListener('click', () => {
        tabRegister.classList.add('active');
        tabLogin.classList.remove('active');
        formRegister.classList.remove('hidden');
        formLogin.classList.add('hidden');
        errorMsg.classList.add('hidden');
    });

    // Helper functions
    const showLoader = () => loader.classList.remove('hidden');
    const hideLoader = () => loader.classList.add('hidden');
    const showError = (msg) => {
        errorMsg.textContent = msg;
        errorMsg.classList.remove('hidden');
    };

    // Register
    formRegister.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorMsg.classList.add('hidden');
        
        const name = document.getElementById('register-name').value;
        const phone = document.getElementById('register-phone').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;

        showLoader();

        // MOCK MODE fallback if Firebase isn't configured
        if (firebaseConfig.apiKey === "YOUR_API_KEY") {
            setTimeout(() => {
                const user = { name, email, phone, level: 1, xp: 0 };
                localStorage.setItem('neon_user', JSON.stringify(user));
                window.location.href = '/larn';
            }, 1500);
            return;
        }

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Save additional user info to Firestore
            await setDoc(doc(db, "users", user.uid), {
                name: name,
                phone: phone,
                email: email,
                level: 1,
                xp: 0,
                createdAt: new Date()
            });

            window.location.href = '/larn';
        } catch (error) {
            hideLoader();
            showError("שגיאה בהרשמה: " + error.message);
        }
    });

    // Login
    formLogin.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorMsg.classList.add('hidden');

        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        showLoader();

        // MOCK MODE fallback if Firebase isn't configured
        if (firebaseConfig.apiKey === "YOUR_API_KEY") {
            setTimeout(() => {
                const user = { name: "Player1", email, level: 5, xp: 1200 };
                localStorage.setItem('neon_user', JSON.stringify(user));
                window.location.href = '/larn';
            }, 1500);
            return;
        }

        try {
            await signInWithEmailAndPassword(auth, email, password);
            window.location.href = '/larn';
        } catch (error) {
            hideLoader();
            showError("אימייל או סיסמה שגויים.");
        }
    });
});
