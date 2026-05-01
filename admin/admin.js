document.addEventListener('DOMContentLoaded', () => {
    const loginContainer = document.getElementById('admin-login');
    const dashboardContainer = document.getElementById('admin-dashboard');
    const loginForm = document.getElementById('admin-form');
    const errorMsg = document.getElementById('admin-error');
    const logoutBtn = document.getElementById('admin-logout');

    const navLinks = document.querySelectorAll('.nav-links li');
    const views = document.querySelectorAll('.admin-view');

    // 1. Admin Login (Mock)
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const key = document.getElementById('admin-key').value;
        
        // Mock Admin Key: "admin123"
        if (key === 'admin123') {
            sessionStorage.setItem('neon_admin_logged_in', 'true');
            loginContainer.classList.add('hidden');
            dashboardContainer.classList.remove('hidden');
            loadDashboardData();
        } else {
            errorMsg.classList.remove('hidden');
        }
    });

    // Check session
    if (sessionStorage.getItem('neon_admin_logged_in') === 'true') {
        loginContainer.classList.add('hidden');
        dashboardContainer.classList.remove('hidden');
        loadDashboardData();
    }

    // Logout
    logoutBtn.addEventListener('click', () => {
        sessionStorage.removeItem('neon_admin_logged_in');
        window.location.reload();
    });

    // 2. Navigation
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            const target = link.dataset.target;
            views.forEach(v => v.classList.add('hidden'));
            
            if (target === 'dashboard') {
                document.getElementById('view-dashboard').classList.remove('hidden');
            } else if (target === 'logs') {
                document.getElementById('view-logs').classList.remove('hidden');
            } else {
                // "users" target not fully implemented, fall back to dashboard
                document.getElementById('view-dashboard').classList.remove('hidden');
            }
        });
    });

    // 3. Load Data
    function loadDashboardData() {
        // Mock Stats
        let usersCount = 0;
        let user = localStorage.getItem('neon_user');
        if (user) usersCount = 1;

        document.getElementById('stat-users').textContent = usersCount;

        // Load Logs
        const logs = JSON.parse(localStorage.getItem('admin_logs')) || [];
        document.getElementById('stat-cheats').textContent = logs.length;

        const tbody = document.getElementById('logs-body');
        tbody.innerHTML = '';
        
        if (logs.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;">אין אירועים חריגים</td></tr>';
        } else {
            // Reverse so newest is first
            [...logs].reverse().forEach(log => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td class="text-muted">${log.time}</td>
                    <td class="text-neon-blue">${log.user}</td>
                    <td class="text-neon-pink">${log.action}</td>
                `;
                tbody.appendChild(tr);
            });
        }
    }
});
