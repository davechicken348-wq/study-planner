// StudyPlanner Homepage - Main Script
(function() {
  'use strict';

  // Particle System
  const canvas = document.getElementById('particleCanvas');
  const ctx = canvas?.getContext('2d');
  let particles = [];

  function resizeCanvas() {
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  
  if (canvas) {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
  }

  class Particle {
    constructor(x, y, isDark) {
      this.x = x;
      this.y = y;
      this.size = Math.random() * 3 + 1;
      this.speedX = (Math.random() - 0.5) * 2;
      this.speedY = (Math.random() - 0.5) * 2;
      this.life = 1;
      this.decay = Math.random() * 0.02 + 0.01;
      this.color = isDark ? `rgba(147, 197, 253, ${this.life})` : `rgba(251, 191, 36, ${this.life})`;
    }
    update() {
      this.x += this.speedX;
      this.y += this.speedY;
      this.life -= this.decay;
      this.color = document.body.classList.contains('dark-mode') 
        ? `rgba(147, 197, 253, ${this.life})` 
        : `rgba(251, 191, 36, ${this.life})`;
    }
    draw() {
      if (!ctx) return;
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function animateParticles() {
    if (!ctx || !canvas) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles = particles.filter(p => p.life > 0);
    particles.forEach(p => {
      p.update();
      p.draw();
    });
    requestAnimationFrame(animateParticles);
  }
  
  if (canvas) animateParticles();

  // Customization Module
  const CustomizationManager = {
    init() {
      this.cacheDom();
      this.bindEvents();
      this.applyPreferences();
      this.buildColorPalette();
      if (window.location.hash === '#customize') {
        this.openModal();
      }
    },

    cacheDom() {
      this.modal = document.getElementById('homeCustModal');
      this.closeBtn = document.getElementById('homeCustClose');
      this.fabCustomize = document.getElementById('fabCustomize');
      this.accentPicker = document.getElementById('accentColorPicker');
      this.accentIndicator = document.getElementById('currentAccent');
      this.programSelect = document.getElementById('programSelect');
      this.themeRadios = document.querySelectorAll('input[name="homeTheme"]');
    },

    bindEvents() {
      this.fabCustomize?.addEventListener('click', () => this.openModal());
      this.closeBtn?.addEventListener('click', () => this.closeModal());
      this.programSelect?.addEventListener('change', (e) => this.handleProgramChange(e));
      this.themeRadios?.forEach(r => r.addEventListener('change', () => this.handleThemeChange()));
      this.accentPicker?.addEventListener('input', (e) => this.handleAccentChange(e));
      
      // Additional controls
      this.bindAdditionalControls();
    },

    bindAdditionalControls() {
      const controls = {
        accent2ColorPicker: (e) => this.handleSecondaryAccent(e),
        useGradient: (e) => this.handleGradient(e),
        fontSelect: (e) => this.handleFontChange(e),
        motionToggle: (e) => this.handleMotion(e),
        dataSaverToggle: (e) => this.handleDataSaver(e),
        contrastToggle: (e) => this.handleContrast(e),
        accentIntensity: (e) => this.handleIntensity(e),
        densitySelect: (e) => this.handleDensity(e),
        fontSizeRange: (e) => this.handleFontSize(e),
        lineHeightRange: (e) => this.handleLineHeight(e),
        focusToggle: (e) => this.handleFocus(e),
        heroUpload: (e) => this.handleHeroUpload(e),
        removeHero: () => this.removeHero(),
        exportPrefs: () => this.exportPreferences(),
        importPrefs: () => document.getElementById('importFile')?.click(),
        importFile: (e) => this.importPreferences(e),
        randomizeBtn: () => this.randomize(),
        saveProfile: () => this.saveProfile(),
        deleteProfile: () => this.deleteProfile(),
        profileSelect: () => this.loadProfile()
      };

      Object.entries(controls).forEach(([id, handler]) => {
        const el = document.getElementById(id);
        if (el) {
          const event = el.type === 'range' || el.type === 'file' ? 'change' : 
                       el.type === 'color' || id.includes('Range') ? 'input' : 'click';
          el.addEventListener(event, handler.bind(this));
        }
      });

      // Layout radios
      document.querySelectorAll('input[name="homeLayout"]').forEach(r => {
        r.addEventListener('change', (e) => this.handleLayout(e));
      });
    },

    openModal() {
      document.getElementById('fabMenu')?.classList.remove('active');
      document.getElementById('fabMain')?.classList.remove('active');
      if (this.modal) this.modal.style.display = 'flex';
      window.history.replaceState(null, '', window.location.pathname);
    },

    closeModal() {
      if (this.modal) this.modal.style.display = 'none';
    },

    applyAccent(hex) {
      document.documentElement.style.setProperty('--primary', hex);
      const rgb = this.hexToRgb(hex);
      if (rgb) {
        document.documentElement.style.setProperty('--primary-rgb', `${rgb.r},${rgb.g},${rgb.b}`);
        document.documentElement.style.setProperty('--primary-light', `rgba(${rgb.r},${rgb.g},${rgb.b},0.08)`);
        const darker = this.shadeColor(hex, -20);
        document.documentElement.style.setProperty('--primary-dark', darker);
      }
      this.updateThemeColor(hex);
    },

    hexToRgb(hex) {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : null;
    },

    shadeColor(color, percent) {
      const num = parseInt(color.replace('#', ''), 16);
      const amt = Math.round(2.55 * percent);
      const R = (num >> 16) + amt;
      const G = (num >> 8 & 0x00FF) + amt;
      const B = (num & 0x0000FF) + amt;
      return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
        (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
        (B < 255 ? B < 1 ? 0 : B : 255))
        .toString(16).slice(1);
    },

    updateThemeColor(color) {
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute('content', color);
    },

    buildColorPalette() {
      const colors = [
        '#ff4757','#ff6b81','#ff7f50','#ff6348','#ff4500',
        '#ffa500','#ffc107','#ffd700','#fffb00','#c0ff00',
        '#76ff03','#00e676','#1de9b6','#00bfa5','#00e5ff',
        '#2979ff','#536dfe','#7c4dff','#d500f9','#f50057',
        '#ff80ab','#ff4081','#e040fb','#7c4dff','#536dfe',
        '#448aff','#40c4ff','#18ffff','#64ffda','#69f0ae',
        '#b2ff59','#eeff41','#ffff00','#ffd740','#ffab40',
        '#ff6e40','#ff3d00','#dd2c00','#bf360c','#3e2723'
      ];

      const palette = document.getElementById('colorPalette');
      if (!palette) return;

      palette.innerHTML = '';
      colors.forEach(color => {
        const swatch = document.createElement('div');
        swatch.className = 'color-swatch';
        swatch.style.background = color;
        swatch.dataset.color = color;
        swatch.addEventListener('click', () => {
          this.accentPicker.value = color;
          this.applyAccent(color);
          if (this.accentIndicator) this.accentIndicator.style.background = color;
          localStorage.setItem('home_accent', color);
          document.querySelectorAll('.color-swatch').forEach(el => 
            el.classList.toggle('selected', el.dataset.color === color)
          );
        });
        palette.appendChild(swatch);
      });
    },

    applyPreferences() {
      // Theme
      const theme = localStorage.getItem('home_theme');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (theme === 'dark' || (!theme && prefersDark)) {
        document.body.classList.add('dark-mode');
        this.themeRadios?.forEach(r => { if (r.value === 'dark') r.checked = true; });
      }

      // Accent
      const accent = localStorage.getItem('home_accent') || '#16a34a';
      this.applyAccent(accent);
      if (this.accentPicker) this.accentPicker.value = accent;
      if (this.accentIndicator) this.accentIndicator.style.background = accent;

      // Load all other preferences
      this.loadAllPreferences();
    },

    loadAllPreferences() {
      const prefs = {
        home_accent2: (v) => {
          document.documentElement.style.setProperty('--primary2', v);
          const el = document.getElementById('accent2ColorPicker');
          if (el) el.value = v;
        },
        home_useGradient: (v) => {
          const checked = v === 'true';
          document.body.classList.toggle('use-gradient', checked);
          const el = document.getElementById('useGradient');
          if (el) el.checked = checked;
        },
        home_font: (v) => {
          document.documentElement.style.setProperty('--base-font', v);
          const el = document.getElementById('fontSelect');
          if (el) el.value = v;
        },
        home_layout: (v) => {
          document.body.classList.toggle('compact-mode', v === 'compact');
          const el = document.querySelector(`input[name="homeLayout"][value="${v}"]`);
          if (el) el.checked = true;
        },
        home_motion: (v) => {
          const checked = v === 'true';
          document.body.classList.toggle('reduced-motion', checked);
          const el = document.getElementById('motionToggle');
          if (el) el.checked = checked;
        },
        home_dataSaver: (v) => {
          const checked = v === 'true';
          document.body.classList.toggle('data-saver', checked);
          const el = document.getElementById('dataSaverToggle');
          if (el) el.checked = checked;
        },
        home_contrast: (v) => {
          const checked = v === 'true';
          document.body.classList.toggle('high-contrast', checked);
          const el = document.getElementById('contrastToggle');
          if (el) el.checked = checked;
        },
        home_accentIntensity: (v) => {
          document.documentElement.style.setProperty('--accent-intensity', v + '%');
          const el = document.getElementById('accentIntensity');
          if (el) el.value = v;
        },
        home_density: (v) => {
          document.body.classList.toggle('dense-mode', v === 'dense');
          const el = document.getElementById('densitySelect');
          if (el) el.value = v;
        },
        home_fontSize: (v) => {
          document.documentElement.style.setProperty('--base-font-size', v + 'px');
          const el = document.getElementById('fontSizeRange');
          if (el) el.value = v;
        },
        home_lineHeight: (v) => {
          document.documentElement.style.setProperty('--base-line-height', parseInt(v) / 100);
          const el = document.getElementById('lineHeightRange');
          if (el) el.value = v;
        },
        home_focus: (v) => {
          const checked = v === 'true';
          document.body.classList.toggle('focus-mode', checked);
          const el = document.getElementById('focusToggle');
          if (el) el.checked = checked;
        },
        home_hero: (v) => {
          const img = document.getElementById('custHeroImg');
          if (img) img.src = v;
          const bg = document.querySelector('.hero-bg-image');
          if (bg) bg.style.backgroundImage = `url('${v}')`;
        }
      };

      Object.entries(prefs).forEach(([key, handler]) => {
        const value = localStorage.getItem(key);
        if (value) handler(value);
      });

      this.loadProfiles();
    },

    loadProfiles() {
      const profiles = JSON.parse(localStorage.getItem('home_profiles') || '{}');
      const select = document.getElementById('profileSelect');
      if (!select) return;
      
      select.innerHTML = '<option value="">-- choose profile --</option>';
      Object.keys(profiles).forEach(name => {
        const opt = document.createElement('option');
        opt.value = name;
        opt.textContent = name;
        select.appendChild(opt);
      });
    },

    // Event Handlers
    handleProgramChange(e) {
      const programs = {
        engineering: {
          images: ['images/Enginereeing_images/pexels-ahmedmuntasir-912050.jpg'],
          color: '#2563eb'
        },
        business: {
          images: ['images/Businees_images/pexels-cottonbro-3205568.jpg'],
          color: '#16a34a'
        },
        pharmacy: {
          images: ['images/Pharmacy_images/pexels-n-voitkevich-7526061.jpg'],
          color: '#dc2626'
        },
        tutorials: {
          images: ['images/Tutorials_images/code_tutorial.webp'],
          color: '#ea580c'
        }
      };

      const val = e.target.value;
      const program = programs[val];
      if (!program) return;

      localStorage.setItem('home_program', val);
      localStorage.removeItem('home_hero');
      
      const img = program.images[0];
      document.getElementById('custHeroImg').src = img;
      const bg = document.querySelector('.hero-bg-image');
      if (bg) bg.style.backgroundImage = `url('${img}')`;
      
      this.applyAccent(program.color);
      this.accentPicker.value = program.color;
      if (this.accentIndicator) this.accentIndicator.style.background = program.color;
      localStorage.setItem('home_accent', program.color);
    },

    handleThemeChange() {
      const checked = document.querySelector('input[name="homeTheme"]:checked');
      if (!checked) return;
      const val = checked.value;
      localStorage.setItem('home_theme', val);
      document.body.classList.toggle('dark-mode', val === 'dark');
    },

    handleAccentChange(e) {
      const color = e.target.value;
      this.applyAccent(color);
      if (this.accentIndicator) this.accentIndicator.style.background = color;
      localStorage.setItem('home_accent', color);
    },

    handleSecondaryAccent(e) {
      const color = e.target.value;
      document.documentElement.style.setProperty('--primary2', color);
      localStorage.setItem('home_accent2', color);
    },

    handleGradient(e) {
      const checked = e.target.checked;
      document.body.classList.toggle('use-gradient', checked);
      localStorage.setItem('home_useGradient', checked);
    },

    handleFontChange(e) {
      const font = e.target.value;
      document.documentElement.style.setProperty('--base-font', font);
      localStorage.setItem('home_font', font);
    },

    handleLayout(e) {
      const val = e.target.value;
      document.body.classList.toggle('compact-mode', val === 'compact');
      localStorage.setItem('home_layout', val);
    },

    handleMotion(e) {
      const checked = e.target.checked;
      document.body.classList.toggle('reduced-motion', checked);
      localStorage.setItem('home_motion', checked);
    },

    handleDataSaver(e) {
      const checked = e.target.checked;
      document.body.classList.toggle('data-saver', checked);
      localStorage.setItem('home_dataSaver', checked);
    },

    handleContrast(e) {
      const checked = e.target.checked;
      document.body.classList.toggle('high-contrast', checked);
      localStorage.setItem('home_contrast', checked);
    },

    handleIntensity(e) {
      const val = e.target.value;
      document.documentElement.style.setProperty('--accent-intensity', val + '%');
      localStorage.setItem('home_accentIntensity', val);
    },

    handleDensity(e) {
      const val = e.target.value;
      document.body.classList.toggle('dense-mode', val === 'dense');
      localStorage.setItem('home_density', val);
    },

    handleFontSize(e) {
      const val = e.target.value;
      document.documentElement.style.setProperty('--base-font-size', val + 'px');
      localStorage.setItem('home_fontSize', val);
    },

    handleLineHeight(e) {
      const val = e.target.value;
      document.documentElement.style.setProperty('--base-line-height', parseInt(val) / 100);
      localStorage.setItem('home_lineHeight', val);
    },

    handleFocus(e) {
      const checked = e.target.checked;
      document.body.classList.toggle('focus-mode', checked);
      localStorage.setItem('home_focus', checked);
    },

    handleHeroUpload(e) {
      const file = e.target.files[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (evt) => {
        const url = evt.target.result;
        document.getElementById('custHeroImg').src = url;
        const bg = document.querySelector('.hero-bg-image');
        if (bg) bg.style.backgroundImage = `url('${url}')`;
        localStorage.setItem('home_hero', url);
      };
      reader.readAsDataURL(file);
    },

    removeHero() {
      localStorage.removeItem('home_hero');
      document.getElementById('custHeroImg').src = 'images/library_books.webp';
      const bg = document.querySelector('.hero-bg-image');
      if (bg) bg.style.backgroundImage = '';
    },

    exportPreferences() {
      const prefs = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('home_')) prefs[key] = localStorage.getItem(key);
      }
      const blob = new Blob([JSON.stringify(prefs, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'studyplanner-prefs.json';
      a.click();
      URL.revokeObjectURL(url);
    },

    importPreferences(e) {
      const file = e.target.files[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const obj = JSON.parse(evt.target.result);
          Object.entries(obj).forEach(([k, v]) => localStorage.setItem(k, v));
          this.applyPreferences();
        } catch (err) {
          alert('Failed to import preferences');
        }
      };
      reader.readAsText(file);
    },

    randomize() {
      const colors = Array.from(document.querySelectorAll('.color-swatch')).map(s => s.dataset.color);
      if (colors.length) {
        const color = colors[Math.floor(Math.random() * colors.length)];
        this.accentPicker.value = color;
        this.applyAccent(color);
        if (this.accentIndicator) this.accentIndicator.style.background = color;
        localStorage.setItem('home_accent', color);
      }
    },

    saveProfile() {
      const name = prompt('Profile name:');
      if (!name) return;
      
      const prefs = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('home_')) prefs[key] = localStorage.getItem(key);
      }
      const profiles = JSON.parse(localStorage.getItem('home_profiles') || '{}');
      profiles[name] = prefs;
      localStorage.setItem('home_profiles', JSON.stringify(profiles));
      this.loadProfiles();
    },

    deleteProfile() {
      const select = document.getElementById('profileSelect');
      const name = select?.value;
      if (!name) return;
      
      const profiles = JSON.parse(localStorage.getItem('home_profiles') || '{}');
      delete profiles[name];
      localStorage.setItem('home_profiles', JSON.stringify(profiles));
      this.loadProfiles();
    },

    loadProfile() {
      const select = document.getElementById('profileSelect');
      const name = select?.value;
      if (!name) return;
      
      const profiles = JSON.parse(localStorage.getItem('home_profiles') || '{}');
      const prefs = profiles[name];
      if (prefs) {
        Object.entries(prefs).forEach(([k, v]) => localStorage.setItem(k, v));
        this.applyPreferences();
      }
    }
  };

  // UI Enhancements
  const UIManager = {
    init() {
      this.initPreloader();
      this.initScrollEffects();
      this.initSlideshow();
      this.initMobileCarousel();
      this.initStars();
      this.initObserver();
    },

    initPreloader() {
      const preloader = document.getElementById('preloader');
      const progressBar = document.getElementById('progressBar');
      if (!preloader || !progressBar) return;

      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 30;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          setTimeout(() => {
            preloader.classList.add('fade-out');
            setTimeout(() => preloader.style.display = 'none', 500);
          }, 300);
        }
        progressBar.style.width = progress + '%';
      }, 200);

      window.addEventListener('load', () => {
        progress = 100;
        progressBar.style.width = '100%';
        clearInterval(interval);
        setTimeout(() => {
          preloader.classList.add('fade-out');
          setTimeout(() => preloader.style.display = 'none', 500);
        }, 300);
      });
    },

    initScrollEffects() {
      const backToTop = document.getElementById('backToTop');
      if (backToTop) {
        window.addEventListener('scroll', () => {
          backToTop.classList.toggle('visible', window.scrollY > 300);
        });
        backToTop.addEventListener('click', () => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        });
      }

      // Smooth scroll for anchors
      document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', (e) => {
          e.preventDefault();
          const target = document.querySelector(anchor.getAttribute('href'));
          target?.scrollIntoView({ behavior: 'smooth' });
        });
      });
    },

    initSlideshow() {
      const slides = document.querySelectorAll('.slide');
      const indicators = document.querySelectorAll('.indicator');
      const prevBtn = document.getElementById('prevSlide');
      const nextBtn = document.getElementById('nextSlide');
      
      if (!slides.length) return;

      let currentSlide = 0;
      let slideInterval;

      const showSlide = (index) => {
        slides.forEach(s => s.classList.remove('active'));
        indicators.forEach(i => i.classList.remove('active'));
        if (slides[index]) slides[index].classList.add('active');
        if (indicators[index]) indicators[index].classList.add('active');
      };

      const nextSlide = () => {
        currentSlide = (currentSlide + 1) % slides.length;
        showSlide(currentSlide);
      };

      const prevSlide = () => {
        currentSlide = (currentSlide - 1 + slides.length) % slides.length;
        showSlide(currentSlide);
      };

      const startAuto = () => {
        slideInterval = setInterval(nextSlide, 8000);
      };

      const stopAuto = () => {
        clearInterval(slideInterval);
      };

      showSlide(0);
      startAuto();

      nextBtn?.addEventListener('click', () => {
        stopAuto();
        nextSlide();
        startAuto();
      });

      prevBtn?.addEventListener('click', () => {
        stopAuto();
        prevSlide();
        startAuto();
      });

      indicators.forEach((indicator, index) => {
        indicator.addEventListener('click', () => {
          stopAuto();
          currentSlide = index;
          showSlide(currentSlide);
          startAuto();
        });
      });

      const container = document.querySelector('.slideshow-container');
      if (container) {
        container.addEventListener('mouseenter', stopAuto);
        container.addEventListener('mouseleave', startAuto);
      }
    },

    initMobileCarousel() {
      if (window.innerWidth > 768) return;

      const slides = document.querySelectorAll('.mobile-slide');
      const dots = document.querySelectorAll('.dot-mobile');
      if (!slides.length) return;

      let currentSlide = 0;

      const showSlide = (index) => {
        slides.forEach(s => s.classList.remove('active'));
        dots.forEach(d => d.classList.remove('active'));
        slides[index].classList.add('active');
        dots[index].classList.add('active');
      };

      const nextSlide = () => {
        currentSlide = (currentSlide + 1) % slides.length;
        showSlide(currentSlide);
      };

      setInterval(nextSlide, 5000);

      dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
          currentSlide = index;
          showSlide(currentSlide);
        });
      });
    },

    initStars() {
      const createStars = () => {
        const container = document.getElementById('starsContainer');
        if (!container) return;

        const starCount = 50;
        for (let i = 0; i < starCount; i++) {
          const star = document.createElement('div');
          star.className = 'star';
          star.style.left = Math.random() * 100 + '%';
          star.style.top = Math.random() * 100 + '%';
          star.style.width = star.style.height = (Math.random() * 2 + 1) + 'px';
          star.style.animationDelay = Math.random() * 3 + 's';
          container.appendChild(star);
        }
      };

      if ('requestIdleCallback' in window) {
        requestIdleCallback(createStars);
      } else {
        setTimeout(createStars, 1000);
      }
    },

    initObserver() {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) entry.target.classList.add('visible');
        });
      }, { threshold: 0.1 });

      document.querySelectorAll('.feature-modern, .step-modern, .testimonial-modern').forEach(el => {
        observer.observe(el);
      });
    }
  };

  // Initialize
  document.addEventListener('DOMContentLoaded', () => {
    CustomizationManager.init();
    UIManager.init();
  });

  // Service Worker Registration
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/study-planner/sw.js')
        .then(reg => console.log('SW registered:', reg))
        .catch(err => console.log('SW registration failed:', err));
    });
  }

})();
