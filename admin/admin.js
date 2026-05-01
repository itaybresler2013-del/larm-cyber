// Admin Logic
document.addEventListener('DOMContentLoaded', () => {
    const adminLogin = document.getElementById('admin-login');
    const adminDash = document.getElementById('admin-dashboard');
    const adminForm = document.getElementById('admin-form');

    if(adminForm) {
        adminForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const key = document.getElementById('admin-key').value;
            if(key === '1234') { // Fake admin key
                adminLogin.classList.add('hidden');
                adminDash.classList.remove('hidden');
            } else {
                document.getElementById('admin-error').classList.remove('hidden');
            }
        });
    }

    const navLinks = document.querySelectorAll('.admin-sidebar .nav-links li');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            document.querySelectorAll('.admin-view').forEach(v => v.classList.add('hidden'));
            const target = 'view-' + link.getAttribute('data-target');
            const view = document.getElementById(target);
            if(view) view.classList.remove('hidden');
        });
    });
});
