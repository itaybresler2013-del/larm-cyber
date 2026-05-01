// ==============================
// ANTI-CHEAT SYSTEM
// ==============================

// This system activates during quizzes to prevent cheating

window.antiCheatActive = false;

window.activateAntiCheat = function() {
    window.antiCheatActive = true;
    console.log("Anti-Cheat Enabled.");
    
    // Prevent Context Menu
    document.addEventListener('contextmenu', preventDefaultAction);
    
    // Prevent Copy/Paste/Cut
    document.addEventListener('copy', preventDefaultAction);
    document.addEventListener('cut', preventDefaultAction);
    document.addEventListener('paste', preventDefaultAction);
    
    // Prevent Keyboard Shortcuts (F12, Ctrl+Shift+I, Ctrl+C)
    document.addEventListener('keydown', handleKeyDown);
    
    // Tab visibility (detect if user leaves the tab)
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Add Watermark to screen
    addWatermark();
};

window.deactivateAntiCheat = function() {
    window.antiCheatActive = false;
    console.log("Anti-Cheat Disabled.");
    
    document.removeEventListener('contextmenu', preventDefaultAction);
    document.removeEventListener('copy', preventDefaultAction);
    document.removeEventListener('cut', preventDefaultAction);
    document.removeEventListener('paste', preventDefaultAction);
    document.removeEventListener('keydown', handleKeyDown);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    
    removeWatermark();
};

function preventDefaultAction(e) {
    if(!window.antiCheatActive) return;
    e.preventDefault();
    showCheatWarning("פעולה חסומה! מערכת הגנת העתקות פעילה.");
}

function handleKeyDown(e) {
    if(!window.antiCheatActive) return;
    
    // F12
    if (e.key === 'F12') {
        e.preventDefault();
        showCheatWarning("פתיחת DevTools חסומה במבחן!");
    }
    
    // Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C
    if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) {
        e.preventDefault();
        showCheatWarning("פתיחת DevTools חסומה במבחן!");
    }
    
    // Ctrl+U
    if (e.ctrlKey && e.key === 'U') {
        e.preventDefault();
        showCheatWarning("צפייה בקוד מקור חסומה!");
    }
    
    // Ctrl+C
    if (e.ctrlKey && e.key === 'c') {
        e.preventDefault();
        showCheatWarning("העתקה חסומה במבחן!");
    }
}

function handleVisibilityChange() {
    if(!window.antiCheatActive) return;
    if (document.hidden) {
        showCheatWarning("אזהרה: עזבת את עמוד המבחן! הפעולה נרשמה.");
        // Normally, here we would log this to Firebase for the admin
    }
}

function showCheatWarning(msg) {
    // Re-use achievement popup logic for warnings
    const popup = document.getElementById('achievement-popup');
    const popupText = document.getElementById('achievement-text');
    
    if (popup && popupText) {
        popup.querySelector('h4').innerText = "SYSTEM WARNING";
        popup.querySelector('h4').style.color = "red";
        popup.style.borderColor = "red";
        popup.querySelector('.icon').innerText = "⚠️";
        
        popupText.innerText = msg;
        popup.classList.remove('hidden');
        
        // Reset animation
        popup.style.animation = 'none';
        popup.offsetHeight; 
        popup.style.animation = 'slideInRight 0.5s forwards';
        
        setTimeout(() => {
            popup.classList.add('hidden');
            // reset styles
            popup.querySelector('h4').style.color = "";
            popup.style.borderColor = "";
            popup.querySelector('.icon').innerText = "🏆";
        }, 4000);
    } else {
        alert(msg);
    }
}

function addWatermark() {
    const wm = document.createElement('div');
    wm.id = 'anti-cheat-watermark';
    wm.style.position = 'fixed';
    wm.style.top = '0';
    wm.style.left = '0';
    wm.style.width = '100vw';
    wm.style.height = '100vh';
    wm.style.pointerEvents = 'none';
    wm.style.zIndex = '9999';
    wm.style.display = 'flex';
    wm.style.flexWrap = 'wrap';
    wm.style.opacity = '0.04';
    wm.style.overflow = 'hidden';
    
    const userName = document.getElementById('user-name') ? document.getElementById('user-name').innerText : 'Player';
    const text = `NEON CYBER - ${userName} - ${new Date().toLocaleDateString()} `;
    
    for(let i=0; i<100; i++) {
        const span = document.createElement('span');
        span.innerText = text;
        span.style.transform = 'rotate(-45deg)';
        span.style.padding = '20px';
        span.style.fontSize = '24px';
        span.style.fontFamily = 'monospace';
        span.style.whiteSpace = 'nowrap';
        wm.appendChild(span);
    }
    
    document.body.appendChild(wm);
}

function removeWatermark() {
    const wm = document.getElementById('anti-cheat-watermark');
    if (wm) wm.remove();
}
