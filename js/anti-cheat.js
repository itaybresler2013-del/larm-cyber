document.addEventListener('DOMContentLoaded', () => {
    // 1. Watermark
    const addWatermark = () => {
        const watermark = document.createElement('div');
        const user = JSON.parse(localStorage.getItem('neon_user')) || { name: 'Unknown' };
        watermark.textContent = `Protected - User: ${user.name} - ${new Date().toLocaleTimeString()}`;
        watermark.style.position = 'fixed';
        watermark.style.bottom = '10px';
        watermark.style.right = '10px';
        watermark.style.opacity = '0.1';
        watermark.style.pointerEvents = 'none';
        watermark.style.color = 'white';
        watermark.style.zIndex = '9999';
        document.body.appendChild(watermark);
    };
    addWatermark();

    // 2. Anti Copy / Context Menu
    document.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        showCheatWarning("קליק ימני חסום בזמן מבחן!");
    });

    document.addEventListener('selectstart', (e) => {
        e.preventDefault();
    });

    document.addEventListener('copy', (e) => {
        e.preventDefault();
        showCheatWarning("העתקת תוכן אסורה!");
    });

    // Prevent Ctrl+C, Ctrl+X, F12
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey && (e.key === 'c' || e.key === 'x' || e.key === 'a')) || e.key === 'F12') {
            e.preventDefault();
            showCheatWarning("פעולה לא חוקית!");
        }
    });

    // 3. Anti Tab Switch / Blur
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            logSuspiciousActivity("משתמש עבר טאב או מזער חלון");
            document.body.style.filter = 'blur(15px)';
        } else {
            document.body.style.filter = 'none';
            showCheatWarning("עזיבת המסך נרשמה במערכת!");
        }
    });

    // 4. DevTools Detection (Basic)
    const detectDevTools = () => {
        const widthThreshold = window.outerWidth - window.innerWidth > 160;
        const heightThreshold = window.outerHeight - window.innerHeight > 160;
        if (widthThreshold || heightThreshold) {
            logSuspiciousActivity("DevTools נפתח");
            document.body.innerHTML = "<h1 style='color:red; text-align:center; margin-top:20%'>מערכת הפכה לנעולה עקב פתיחת DevTools. אירוע נרשם.</h1>";
        }
    };
    window.addEventListener('resize', detectDevTools);

    // Helpers
    function showCheatWarning(msg) {
        const alertBox = document.createElement('div');
        alertBox.textContent = msg;
        alertBox.style.position = 'fixed';
        alertBox.style.top = '20px';
        alertBox.style.left = '50%';
        alertBox.style.transform = 'translateX(-50%)';
        alertBox.style.background = 'rgba(255, 0, 127, 0.9)';
        alertBox.style.color = '#fff';
        alertBox.style.padding = '15px 30px';
        alertBox.style.borderRadius = '8px';
        alertBox.style.zIndex = '10000';
        alertBox.style.fontWeight = 'bold';
        document.body.appendChild(alertBox);

        setTimeout(() => alertBox.remove(), 3000);
        logSuspiciousActivity(msg);
    }

    function logSuspiciousActivity(action) {
        // Here we would sync with Firebase Admin DB
        const user = JSON.parse(localStorage.getItem('neon_user')) || { name: 'Unknown' };
        console.warn(`[ANTI-CHEAT LOG] ${user.name}: ${action}`);
        
        let logs = JSON.parse(localStorage.getItem('admin_logs')) || [];
        logs.push({ user: user.name, action, time: new Date().toLocaleString() });
        localStorage.setItem('admin_logs', JSON.stringify(logs));
    }
});
