// Study Planner - Main Application

document.addEventListener('DOMContentLoaded', () => {
    console.log('Study Planner loaded');
    
    // Initialize active navigation highlighting
    setActiveNavLink();
});

function setActiveNavLink() {
    // Get current page filename
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    // Find all nav links
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        const linkPage = link.getAttribute('href');
        if (linkPage === currentPage) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}
