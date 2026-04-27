// Navigation Active State Handler
// Sets the active class on the correct nav link based on current page

document.addEventListener('DOMContentLoaded', function() {
    const navLinks = document.querySelectorAll('.nav-link');
    const currentPath = window.location.pathname.split('/').pop();
    
    navLinks.forEach(link => {
        const linkPath = link.getAttribute('href');
        // Remove any existing active class
        link.classList.remove('active');
        
        // Check if this link points to the current page
        if (linkPath === currentPath || 
            (currentPath === '' && linkPath === 'index.html') ||
            (currentPath === linkPath.replace(/\.html$/, ''))) {
            link.classList.add('active');
        }
    });
});
