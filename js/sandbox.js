// ==============================
// SANDBOX ENGINE
// ==============================

document.addEventListener('DOMContentLoaded', () => {
    // 1. Editor Tabs
    const tabBtns = document.querySelectorAll('.editor-area .tab-btn');
    const editors = document.querySelectorAll('.code-input');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active from all tabs & editors
            tabBtns.forEach(t => t.classList.remove('active'));
            editors.forEach(e => e.classList.remove('active'));

            // Add active to clicked tab
            btn.classList.add('active');
            const targetId = btn.getAttribute('data-target');
            document.getElementById(targetId).classList.add('active');
        });
    });

    // 2. Run Code Logic
    const btnRun = document.getElementById('btn-run');
    const btnReset = document.getElementById('btn-reset');
    const htmlEditor = document.getElementById('html-editor');
    const cssEditor = document.getElementById('css-editor');
    const jsEditor = document.getElementById('js-editor');
    const previewFrame = document.getElementById('preview-frame');

    const updatePreview = () => {
        if (!previewFrame) return;
        
        const html = htmlEditor.value;
        const css = `<style>${cssEditor.value}</style>`;
        const js = `<script>${jsEditor.value}<\/script>`;

        const iframeDoc = previewFrame.contentDocument || previewFrame.contentWindow.document;
        
        iframeDoc.open();
        iframeDoc.write(`
            <!DOCTYPE html>
            <html>
                <head>
                    <meta charset="UTF-8">
                    ${css}
                </head>
                <body>
                    ${html}
                    ${js}
                </body>
            </html>
        `);
        iframeDoc.close();
    };

    if (btnRun) {
        btnRun.addEventListener('click', () => {
            updatePreview();
            
            // Add a cool run effect
            btnRun.classList.add('pulse');
            setTimeout(() => btnRun.classList.remove('pulse'), 1000);
            
            if(window.showAchievement) {
                // Show achievement randomly or first time
                if(!window.ranSandboxOnce) {
                    window.showAchievement('First Code!', 'הרצת את הקוד הראשון שלך ב-Sandbox!');
                    window.ranSandboxOnce = true;
                }
            }
        });
    }

    if (btnReset) {
        btnReset.addEventListener('click', () => {
            htmlEditor.value = `<h1>Hello Cyber World</h1>`;
            cssEditor.value = `h1 { color: #00f3ff; text-shadow: 0 0 10px #00f3ff; font-family: sans-serif; text-align: center; margin-top: 50px; }`;
            jsEditor.value = `console.log('System ready.');`;
            updatePreview();
        });
    }

    // Initialize preview on load
    if (htmlEditor && cssEditor && previewFrame) {
        setTimeout(updatePreview, 500);
    }

    // 3. Fake AI Assistant
    const aiInput = document.getElementById('ai-input');
    const aiSend = document.getElementById('ai-send');
    const aiChat = document.getElementById('ai-chat');

    const addAIMessage = (text, isUser = false) => {
        if (!aiChat) return;
        const div = document.createElement('div');
        div.className = `message ${isUser ? 'user-msg' : 'ai-msg'} fade-in`;
        div.innerText = text;
        aiChat.appendChild(div);
        aiChat.scrollTop = aiChat.scrollHeight;
    };

    const handleAISend = () => {
        const text = aiInput.value.trim();
        if (text === '') return;
        
        addAIMessage(text, true);
        aiInput.value = '';

        // Fake AI response delay
        setTimeout(() => {
            const responses = [
                "קוד מעולה! נסה להוסיף אנימציות עם CSS.",
                "שגיאה? תבדוק שסגרת את כל התגיות ב-HTML.",
                "JavaScript נראה מצוין. תשתמש ב-console.log כדי לדבג.",
                "אני רק עוזר חכם זמני, בקרוב יחברו אותי ל-API אמיתי! 🤖"
            ];
            const randomRes = responses[Math.floor(Math.random() * responses.length)];
            addAIMessage(randomRes, false);
        }, 1000);
    };

    if (aiSend && aiInput) {
        aiSend.addEventListener('click', handleAISend);
        aiInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleAISend();
        });
    }
});
