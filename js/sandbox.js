document.addEventListener('DOMContentLoaded', () => {
    // Editor Tabs
    const tabBtns = document.querySelectorAll('.tab-btn');
    const editors = document.querySelectorAll('.code-input');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class
            tabBtns.forEach(b => b.classList.remove('active'));
            editors.forEach(e => e.classList.remove('active'));

            // Add active class
            btn.classList.add('active');
            document.getElementById(btn.dataset.target).classList.add('active');
        });
    });

    // Run Code
    const btnRun = document.getElementById('btn-run');
    const btnReset = document.getElementById('btn-reset');
    const iframe = document.getElementById('preview-frame');

    const htmlEditor = document.getElementById('html-editor');
    const cssEditor = document.getElementById('css-editor');
    const jsEditor = document.getElementById('js-editor');

    const runCode = () => {
        const html = htmlEditor.value;
        const css = `<style>${cssEditor.value}</style>`;
        const js = `<script>${jsEditor.value}<\/script>`;

        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
        iframeDoc.open();
        iframeDoc.write(html + css + js);
        iframeDoc.close();
    };

    btnRun.addEventListener('click', runCode);

    btnReset.addEventListener('click', () => {
        htmlEditor.value = '<h1>Hello Cyber World</h1>';
        cssEditor.value = 'h1 { color: #00f3ff; text-shadow: 0 0 10px #00f3ff; }';
        jsEditor.value = "console.log('System ready.');";
        runCode();
    });

    // Initial Run
    runCode();

    // AI Assistant Chat (Mock)
    const aiInput = document.getElementById('ai-input');
    const aiSend = document.getElementById('ai-send');
    const aiChat = document.getElementById('ai-chat');

    const addMessage = (text, isUser = false) => {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${isUser ? 'user-msg' : 'ai-msg'}`;
        msgDiv.textContent = text;
        aiChat.appendChild(msgDiv);
        aiChat.scrollTop = aiChat.scrollHeight;
    };

    const handleSend = () => {
        const text = aiInput.value.trim();
        if (!text) return;

        addMessage(text, true);
        aiInput.value = '';

        // Mock AI response
        setTimeout(() => {
            let response = "אני כאן כדי לעזור! אבל כרגע אני במצב סימולציה (Mock Mode). נסה לכתוב קוד בעורך וללחוץ על Run Code.";
            if (text.toLowerCase().includes('html')) {
                response = "HTML זו השפה שבזכותה האתר קיים. נסה להוסיף תגית <button> בעורך ה-HTML.";
            } else if (text.toLowerCase().includes('css')) {
                response = "כדי לעשות צבע Neon ב-CSS, השתמש ב-text-shadow יחד עם color.";
            } else if (text.toLowerCase().includes('js') || text.toLowerCase().includes('javascript')) {
                response = "JavaScript נותנת חיים לאתר! נסה לכתוב alert('Hello'); בעורך ה-JS.";
            }
            addMessage(response);
        }, 1000);
    };

    aiSend.addEventListener('click', handleSend);
    aiInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSend();
    });
});
