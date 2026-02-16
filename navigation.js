// Shared navigation functionality
function initNavigation() {
  // Mobile menu toggle
  const mobileMenuToggle = document.getElementById('mobileMenuToggle');
  const navActions = document.getElementById('navActions');
  
  if (mobileMenuToggle && navActions) {
    mobileMenuToggle.addEventListener('click', () => {
      navActions.classList.toggle('active');
      const icon = mobileMenuToggle.querySelector('i');
      icon.className = navActions.classList.contains('active') ? 'fas fa-times' : 'fas fa-bars';
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
