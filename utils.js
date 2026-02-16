// Shared utilities for Study Planner
const StudyPlannerUtils = {
  THEME_KEY: 'study_planner_theme',
  STORAGE_KEY: 'study_planner_sessions_v1',
  BADGES_KEY: 'study_planner_badges_v1',

  // Safe localStorage operations with quota handling
  setItem(key, value) {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (e) {
      if (e.name === 'QuotaExceededError') {
        this.showNotification('Storage quota exceeded. Please clear some data.', 'error');
      }
      console.error('Storage error:', e);
      return false;
    }
  },

  getItem(key, defaultValue = null) {
    try {
      return localStorage.getItem(key) || defaultValue;
    } catch (e) {
      console.error('Storage read error:', e);
      return defaultValue;
    }
  },

  // Show notification instead of alert
  showNotification(message, type = 'info') {
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
      <span>${message}</span>
      <button class="notification-close" aria-label="Close notification">&times;</button>
    `;
    document.body.appendChild(notification);

    setTimeout(() => notification.classList.add('show'), 10);

    notification.querySelector('.notification-close').onclick = () => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    };

    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 5000);
  },

  // Format time helper
  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');
  },

  // Lazy load images
  lazyLoadImages() {
    const images = document.querySelectorAll('img[data-src]');
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
          observer.unobserve(img);
        }
      });
    });

    images.forEach(img => imageObserver.observe(img));
  },

  // Smooth scroll to element
  smoothScrollTo(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  },

  // Debounce function
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  // Form validation helper
  validateForm(formId) {
    const form = document.getElementById(formId);
    if (!form) return false;

    const inputs = form.querySelectorAll('[required]');
    let isValid = true;

    inputs.forEach(input => {
      if (!input.value.trim()) {
        input.classList.add('error');
        isValid = false;
      } else {
        input.classList.remove('error');
      }
    });

    return isValid;
  }
};

// Add smooth scroll behavior globally
document.documentElement.style.scrollBehavior = 'smooth';

// Apply color theme globally
(function() {
  const theme = StudyPlannerUtils.getItem('color_theme', 'green');
  if (theme !== 'green') {
    document.body.classList.add('theme-' + theme);
  }
})();

// Handle skip link
document.addEventListener('DOMContentLoaded', () => {
  const skipLink = document.querySelector('.skip-link');
  if (skipLink) {
    skipLink.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.querySelector(skipLink.getAttribute('href'));
      if (target) {
        target.setAttribute('tabindex', '-1');
        target.focus();
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }
});
