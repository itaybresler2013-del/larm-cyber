document.addEventListener('DOMContentLoaded', () => {
    const handleRoute = () => {
        const hash = window.location.hash || '#promo';
        const views = document.querySelectorAll('.app-view');
        
        // Hide all views
        views.forEach(view => view.classList.add('hidden'));
        
        // Show the target view
        if (hash === '#login') {
            document.getElementById('view-login').classList.remove('hidden');
        } else if (hash === '#larn') {
            document.getElementById('view-larn').classList.remove('hidden');
        } else if (hash === '#quiz' || hash === '#qoiz') {
            document.getElementById('view-quiz').classList.remove('hidden');
        } else if (hash === '#sandbox') {
            document.getElementById('view-sandbox').classList.remove('hidden');
        } else if (hash === '#admin') {
            document.getElementById('view-admin').classList.remove('hidden');
        } else {
            // Default to promo
            const promo = document.getElementById('view-promo');
            if(promo) promo.classList.remove('hidden');
        }
    };

    window.addEventListener('hashchange', handleRoute);
    handleRoute(); // Call once on load

    // Special logic for promo button
    const startBtn = document.getElementById('start-btn');
    if (startBtn) {
        startBtn.addEventListener('click', () => {
            window.location.hash = '#login';
        });
    }
});
