// Shared navigation functionality
function initNavigation() {
  // Mobile menu toggle with overlay
  const mobileMenuToggle = document.getElementById('mobileMenuToggle');
  const navActions = document.getElementById('navActions');
  
  if (mobileMenuToggle && navActions) {
    // Create overlay element
    let overlay = document.querySelector('.menu-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'menu-overlay';
      document.body.appendChild(overlay);
    }

    // Toggle menu
    const toggleMenu = () => {
      const isActive = navActions.classList.contains('active');
      navActions.classList.toggle('active');
      overlay.classList.toggle('active');
      mobileMenuToggle.classList.toggle('active');
      document.body.style.overflow = isActive ? '' : 'hidden';
      
      const icon = mobileMenuToggle.querySelector('i');
      icon.className = isActive ? 'fas fa-bars' : 'fas fa-times';
    };

    mobileMenuToggle.addEventListener('click', toggleMenu);
    
    // Close on overlay click
    overlay.addEventListener('click', toggleMenu);
    
    // Close on link click
    navActions.querySelectorAll('.nav-link, .btn-nav').forEach(link => {
      link.addEventListener('click', () => {
        if (navActions.classList.contains('active')) {
          toggleMenu();
        }
      });
    });
    
    // Close on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && navActions.classList.contains('active')) {
        toggleMenu();
      }
    });
  }

  // FAB menu toggle
  const fabMain = document.getElementById('fabMain');
  const fabMenu = document.getElementById('fabMenu');
  
  if (fabMain && fabMenu) {
    fabMain.addEventListener('click', (e) => {
      e.stopPropagation();
      fabMenu.classList.toggle('active');
      fabMain.classList.toggle('active');
    });

    // Close FAB when clicking outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.fab-container')) {
        fabMenu.classList.remove('active');
        fabMain.classList.remove('active');
      }
    });
  }
}

// Initialize on DOM load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initNavigation);
} else {
  initNavigation();
}
