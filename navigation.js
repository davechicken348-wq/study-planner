// Shared navigation functionality
function initNavigation() {
  // apply persistent home preferences (theme & accent) on every page
  try {
    const storedAccent = localStorage.getItem('home_accent');
    if (storedAccent) {
      // helper to apply hex to CSS vars
      function applyAccentColors(hex) {
        document.documentElement.style.setProperty('--primary', hex);
        const comps = hex.replace('#','').match(/.{2}/g);
        if (comps) {
          const [r,g,b] = comps.map(h=>parseInt(h,16));
          document.documentElement.style.setProperty('--primary-rgb', `${r},${g},${b}`);
          document.documentElement.style.setProperty('--primary-light', `rgba(${r},${g},${b},0.08)`);
          // use existing global shadeColor if available
          const darker = (typeof shadeColor === 'function') ? shadeColor(hex, -20) : hex;
          document.documentElement.style.setProperty('--primary-dark', darker);
        }
      }

      applyAccentColors(storedAccent);

      // accent indicator in header
      let accentIndicator = document.getElementById('currentAccent');
      if (!accentIndicator) {
        const toggleWrapper = document.querySelector('.theme-toggle-wrapper');
        if (toggleWrapper) {
          accentIndicator = document.createElement('div');
          accentIndicator.id = 'currentAccent';
          accentIndicator.style.cssText = 'width:16px;height:16px;border-radius:50%;margin-left:8px;border:1px solid #ccc;display:inline-block;vertical-align:middle';
          toggleWrapper.appendChild(accentIndicator);
        }
      }
      if (accentIndicator) accentIndicator.style.background = storedAccent;

      // update theme-color meta tag
      const themeMeta = document.querySelector('meta[name="theme-color"]');
      if (themeMeta) themeMeta.setAttribute('content', storedAccent);

      // dynamically adjust manifest theme_color if manifest link exists
      const manifestLink = document.querySelector('link[rel="manifest"]');
      if (manifestLink) {
        fetch(manifestLink.href).then(r=>r.json()).then(manifest => {
          manifest.theme_color = storedAccent;
          const blob = new Blob([JSON.stringify(manifest)], {type:'application/json'});
          manifestLink.href = URL.createObjectURL(blob);
        }).catch(()=>{});
      }

      // secondary accent
      const storedAccent2 = localStorage.getItem('home_accent2');
      if(storedAccent2){
        document.documentElement.style.setProperty('--primary2', storedAccent2);
        const comps2 = storedAccent2.replace('#','').match(/.{2}/g);
        if(comps2){
          const [r2,g2,b2] = comps2.map(h=>parseInt(h,16));
          document.documentElement.style.setProperty('--primary2-rgb', `${r2},${g2},${b2}`);
        }
      }

      // apply other prefs
      const font = localStorage.getItem('home_font');
      if(font) document.documentElement.style.setProperty('--base-font', font);
      const layout = localStorage.getItem('home_layout');
      if(layout === 'compact') document.body.classList.add('compact-mode');
      const motion = localStorage.getItem('home_motion') === 'true';
      if(motion) document.body.classList.add('reduced-motion');
      const dataSaver = localStorage.getItem('home_dataSaver') === 'true';
      if(dataSaver) document.body.classList.add('data-saver');
      const useGrad = localStorage.getItem('home_useGradient') === 'true';
      if(useGrad) document.body.classList.add('use-gradient');
      const hero = localStorage.getItem('home_hero');
      if(hero){
        const heroBg = document.querySelector('.hero-bg-image');
        if(heroBg) heroBg.style.backgroundImage = `url('${hero}')`;
      }
    }
    const storedTheme = localStorage.getItem('home_theme');
    if(storedTheme === 'dark' || (!storedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.body.classList.add('dark-mode');
    }
  } catch (err) {
    // ignore if localStorage unavailable
    console.warn('pref load failed', err);
  }

  // Mobile menu toggle with overlay
  const mobileMenuToggle = document.getElementById('mobileMenuToggle');
  const navActions = document.getElementById('navActions');
  
  // Ensure menu starts closed
  if (navActions) {
    navActions.classList.remove('active');
  }
  
  if (mobileMenuToggle && navActions) {
    // Create overlay element
    let overlay = document.querySelector('.menu-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'menu-overlay';
      document.body.appendChild(overlay);
    }
    
    // Ensure overlay starts hidden
    overlay.classList.remove('active');
    document.body.style.overflow = '';

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
