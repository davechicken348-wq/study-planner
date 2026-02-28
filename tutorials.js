// Tutorials Page JavaScript
const ITEMS_PER_PAGE = 20;

const TutorialsApp = {
  savedResources: [],
  currentTab: 'videos',
  channels: [],
  resources: [],
  videos: [],
  articles: [],
  pagination: {
    channels: { page: 1 },
    videos: { page: 1 },
    resources: { page: 1 },
    articles: { page: 1 }
  },
  slideshowIntervals: {},

  init() {
    this.loadSavedResources();
    this.setupTabs();
    this.setupSearch();
    this.setupHeroSlideshow();
    this.setupChannelsHeroSlideshow();
    this.setupMobile();
    this.loadDefaultData();
    this.setupEventListeners();
    this.setupSavedFilters();
  },

  // Tab Management
  setupTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');

    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        
        tabBtns.forEach(b => b.classList.remove('active'));
        tabPanes.forEach(p => p.classList.remove('active'));
        
        btn.classList.add('active');
        document.getElementById(`${tab}-tab`).classList.add('active');
        
        this.currentTab = tab;
      });
    });
  },

  // Search Functionality
  setupSearch() {
    const searchInput = document.getElementById('searchInput');
    let timeout;

    searchInput.addEventListener('input', (e) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        this.filterContent(e.target.value);
      }, 500);
    });
  },

  filterContent(query) {
    const lowerQuery = query.toLowerCase();
    const cards = document.querySelectorAll('.resource-card, .channel-card, .video-card, .article-card');
    
    cards.forEach(card => {
      const text = card.textContent.toLowerCase();
      card.style.display = text.includes(lowerQuery) ? 'block' : 'none';
    });
  },

  // Channels Hero Slideshow
  setupChannelsHeroSlideshow() {
    const slides = [
      {
        bg: 'images/Computer_images/code.webp',
        title: '100+ Top CS YouTube Channels',
        desc: 'Curated collection of the best computer science channels covering web development, algorithms, AI, cybersecurity, and more.',
        channel: { name: 'freeCodeCamp', subs: '8.5M', desc: 'Free coding bootcamp with full-length courses on web development, Python, data science, and more.', tags: ['courses', 'web', 'python'], url: 'https://youtube.com/@freecodecamp' }
      },
      {
        bg: 'images/Computer_images/keyboard.webp',
        title: 'Learn from Industry Experts',
        desc: 'Watch tutorials from experienced developers and tech professionals who share real-world knowledge and best practices.',
        channel: { name: 'Fireship', subs: '3M', desc: 'Fast-paced tech tutorials covering the latest in web development, AI, and software engineering.', tags: ['web', 'ai', 'javascript'], url: 'https://youtube.com/@Fireship' }
      },
      {
        bg: 'images/Computer_images/computer_wires.webp',
        title: 'Master Algorithms & Data Structures',
        desc: 'Deep dive into computer science fundamentals with channels dedicated to algorithms, problem-solving, and interview prep.',
        channel: { name: 'NeetCode', subs: '500K', desc: 'LeetCode solutions and coding interview preparation with clear explanations and optimal approaches.', tags: ['algorithms', 'leetcode', 'interviews'], url: 'https://youtube.com/@NeetCode' }
      },
      {
        bg: 'images/Computer_images/gaming_laptop.webp',
        title: 'Build Real-World Projects',
        desc: 'Follow along with project-based tutorials that teach you how to build complete applications from scratch.',
        channel: { name: 'JavaScript Mastery', subs: '1.2M', desc: 'Modern JavaScript projects using React, Next.js, and the latest web technologies.', tags: ['react', 'javascript', 'web'], url: 'https://youtube.com/@javascriptmastery' }
      }
    ];

    let currentSlide = 0;

    const updateSlide = (index) => {
      const slide = slides[index];
      const hero = document.getElementById('channelsHero');
      
      hero.classList.add('transitioning');
      
      setTimeout(() => {
        document.getElementById('heroBgImage').style.backgroundImage = `url('${slide.bg}')`;
        document.getElementById('heroTitle').textContent = slide.title;
        document.getElementById('heroDesc').textContent = slide.desc;
        document.getElementById('featuredName').textContent = slide.channel.name;
        document.getElementById('featuredSubs').textContent = slide.channel.subs;
        document.getElementById('featuredDesc').textContent = slide.channel.desc;
        document.getElementById('featuredTags').innerHTML = slide.channel.tags.map(tag => `<span class="tag">${tag}</span>`).join('');
        document.getElementById('featuredLink').href = slide.channel.url;

        document.querySelectorAll('.hero-dot').forEach((dot, i) => {
          dot.classList.toggle('active', i === index);
        });
        
        setTimeout(() => hero.classList.remove('transitioning'), 50);
      }, 300);
    };

    document.querySelectorAll('.hero-dot').forEach((dot, i) => {
      dot.onclick = () => {
        currentSlide = i;
        updateSlide(i);
        clearInterval(this.slideshowIntervals.channels);
        startSlideshow();
      };
    });

    const startSlideshow = () => {
      this.slideshowIntervals.channels = setInterval(() => {
        currentSlide = (currentSlide + 1) % slides.length;
        updateSlide(currentSlide);
      }, 5000);
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          startSlideshow();
        } else {
          clearInterval(this.slideshowIntervals.channels);
        }
      });
    }, { threshold: 0.1 });

    const heroSection = document.getElementById('channelsHero');
    if (heroSection) observer.observe(heroSection);

    updateSlide(0);
  },

  // Hero Slideshow
  setupHeroSlideshow() {
    const bgSlider = document.getElementById('heroBgSlider');
    const dotsContainer = document.getElementById('heroDots');
    
    if (!bgSlider || !dotsContainer) return;

    const slides = [
      { 
        bg: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200&h=600&fit=crop',
        emoji: '🚀',
        title: 'Welcome to CS Learning Hub',
        subtitle: 'Your journey to mastery starts here'
      },
      { 
        bg: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1200&h=600&fit=crop',
        emoji: '📚',
        title: 'Learn. Build. Grow.',
        subtitle: '100+ resources to accelerate your learning'
      },
      { 
        bg: 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=1200&h=600&fit=crop',
        emoji: '💡',
        title: 'Master Computer Science',
        subtitle: 'From fundamentals to advanced topics'
      },
      { 
        bg: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&h=600&fit=crop',
        emoji: '🎯',
        title: 'Build Amazing Projects',
        subtitle: 'Turn your ideas into reality'
      },
      { 
        bg: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=1200&h=600&fit=crop',
        emoji: '✨',
        title: 'Join Thousands of Learners',
        subtitle: 'Start your coding journey today'
      }
    ];

    let currentSlide = 0;

    // Create background slides
    slides.forEach((slide, i) => {
      const bgSlide = document.createElement('div');
      bgSlide.className = `hero-bg-slide ${i === 0 ? 'active' : ''}`;
      bgSlide.style.backgroundImage = `url('${slide.bg}')`;
      bgSlider.appendChild(bgSlide);

      const dot = document.createElement('div');
      dot.className = `hero-dot ${i === 0 ? 'active' : ''}`;
      dot.onclick = () => goToSlide(i);
      dotsContainer.appendChild(dot);
    });

    const updateContent = (index) => {
      const slide = slides[index];
      document.getElementById('heroEmoji').textContent = slide.emoji;
      document.getElementById('heroTitle').textContent = slide.title;
      document.getElementById('heroSubtitle').textContent = slide.subtitle;
    };

    const goToSlide = (n) => {
      document.querySelectorAll('.hero-bg-slide').forEach((s, i) => {
        s.classList.toggle('active', i === n);
      });
      document.querySelectorAll('.hero-dot').forEach((d, i) => {
        d.classList.toggle('active', i === n);
      });
      updateContent(n);
      currentSlide = n;
    };

    document.getElementById('heroPrev').onclick = () => {
      currentSlide = (currentSlide - 1 + slides.length) % slides.length;
      goToSlide(currentSlide);
    };

    document.getElementById('heroNext').onclick = () => {
      currentSlide = (currentSlide + 1) % slides.length;
      goToSlide(currentSlide);
    };

    // Pause when not visible
    const startSlideshow = () => {
      this.slideshowIntervals.hero = setInterval(() => {
        currentSlide = (currentSlide + 1) % slides.length;
        goToSlide(currentSlide);
      }, 5000);
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          startSlideshow();
        } else {
          clearInterval(this.slideshowIntervals.hero);
        }
      });
    }, { threshold: 0.1 });

    observer.observe(document.getElementById('mainHero'));
  },

  // Mobile Setup
  setupMobile() {
    const savedSidebar = document.querySelector('.saved-sidebar');
    const mobileSavedBtn = document.createElement('button');
    mobileSavedBtn.className = 'mobile-saved-btn';
    mobileSavedBtn.innerHTML = '<i class="fas fa-bookmark"></i>';
    mobileSavedBtn.style.display = window.innerWidth <= 768 ? 'flex' : 'none';

    const overlay = document.createElement('div');
    overlay.className = 'sidebar-overlay';

    mobileSavedBtn.onclick = () => {
      savedSidebar.classList.add('open');
      overlay.classList.add('active');
    };

    overlay.onclick = () => {
      savedSidebar.classList.remove('open');
      overlay.classList.remove('active');
    };

    document.body.appendChild(mobileSavedBtn);
    document.body.appendChild(overlay);

    // Swipe to close
    let touchStart = 0;
    savedSidebar.addEventListener('touchstart', e => touchStart = e.touches[0].clientX);
    savedSidebar.addEventListener('touchend', e => {
      if (e.changedTouches[0].clientX - touchStart > 100) {
        savedSidebar.classList.remove('open');
        overlay.classList.remove('active');
      }
    });

    window.addEventListener('resize', () => {
      mobileSavedBtn.style.display = window.innerWidth <= 768 ? 'flex' : 'none';
      if (window.innerWidth > 768) {
        savedSidebar.classList.remove('open');
        overlay.classList.remove('active');
      }
    });
  },

  // Load Default Data
  loadDefaultData() {
    this.loadChannels();
    this.loadResources();
    this.loadVideos();
    this.loadArticles();
  },

  // Channels Data
  loadChannels() {
    this.channels = [
      { name: 'freeCodeCamp', subscribers: '8.5M', tags: ['courses', 'web', 'python'], url: 'https://youtube.com/@freecodecamp', description: 'Free coding bootcamp courses' },
      { name: 'Traversy Media', subscribers: '2.2M', tags: ['web', 'javascript'], url: 'https://youtube.com/@TraversyMedia', description: 'Web development tutorials' },
      { name: 'Programming with Mosh', subscribers: '3.2M', tags: ['courses', 'python', 'java'], url: 'https://youtube.com/@programmingwithmosh', description: 'Programming courses' },
      { name: 'Fireship', subscribers: '3M', tags: ['web', 'ai', 'javascript'], url: 'https://youtube.com/@Fireship', description: 'Fast-paced tech tutorials' },
      { name: 'CS Dojo', subscribers: '2M', tags: ['algorithms', 'python'], url: 'https://youtube.com/@CSDojo', description: 'Computer science fundamentals' },
      { name: 'The Net Ninja', subscribers: '1.2M', tags: ['web', 'javascript', 'react'], url: 'https://youtube.com/@NetNinja', description: 'Modern web development' },
      { name: 'Tech With Tim', subscribers: '1.6M', tags: ['python', 'ai', 'machine-learning'], url: 'https://youtube.com/@TechWithTim', description: 'Python & AI tutorials' },
      { name: 'Web Dev Simplified', subscribers: '1.5M', tags: ['web', 'javascript', 'css'], url: 'https://youtube.com/@WebDevSimplified', description: 'Simplified web development' },
      { name: 'Corey Schafer', subscribers: '1.1M', tags: ['python', 'web', 'django'], url: 'https://youtube.com/@coreyms', description: 'Python programming tutorials' },
      { name: 'Academind', subscribers: '950K', tags: ['web', 'angular', 'react'], url: 'https://youtube.com/@academind', description: 'Web development courses' },
      { name: 'Clever Programmer', subscribers: '1.4M', tags: ['web', 'python', 'react'], url: 'https://youtube.com/@CleverProgrammer', description: 'Project-based learning' },
      { name: 'Dev Ed', subscribers: '1.1M', tags: ['web', 'javascript', 'design'], url: 'https://youtube.com/@DevEd', description: 'Creative web development' },
      { name: 'The Coding Train', subscribers: '1.6M', tags: ['javascript', 'creative-coding'], url: 'https://youtube.com/@TheCodingTrain', description: 'Creative coding tutorials' },
      { name: 'Sentdex', subscribers: '1.3M', tags: ['python', 'machine-learning', 'ai'], url: 'https://youtube.com/@sentdex', description: 'Python & machine learning' },
      { name: 'Derek Banas', subscribers: '1.2M', tags: ['courses', 'python', 'java'], url: 'https://youtube.com/@derekbanas', description: 'Programming language tutorials' },
      { name: 'Kevin Powell', subscribers: '1M', tags: ['css', 'web', 'design'], url: 'https://youtube.com/@KevinPowell', description: 'CSS master tutorials' },
      { name: 'Ben Awad', subscribers: '500K', tags: ['web', 'react', 'graphql'], url: 'https://youtube.com/@bawad', description: 'Full-stack development' },
      { name: 'Coding Tech', subscribers: '800K', tags: ['conferences', 'talks'], url: 'https://youtube.com/@CodingTech', description: 'Tech conference talks' },
      { name: 'Computerphile', subscribers: '2.3M', tags: ['computer-science', 'theory'], url: 'https://youtube.com/@Computerphile', description: 'Computer science concepts' },
      { name: 'MIT OpenCourseWare', subscribers: '5.5M', tags: ['courses', 'algorithms', 'theory'], url: 'https://youtube.com/@mitocw', description: 'MIT university courses' },
      { name: 'Stanford Online', subscribers: '2M', tags: ['courses', 'ai', 'algorithms'], url: 'https://youtube.com/@stanfordonline', description: 'Stanford university courses' },
      { name: 'Caleb Curry', subscribers: '600K', tags: ['python', 'java', 'sql'], url: 'https://youtube.com/@calebthecurry', description: 'Programming fundamentals' },
      { name: 'Programming Knowledge', subscribers: '1.5M', tags: ['android', 'java', 'python'], url: 'https://youtube.com/@ProgrammingKnowledge', description: 'Programming tutorials' },
      { name: 'Telusko', subscribers: '2M', tags: ['java', 'python', 'android'], url: 'https://youtube.com/@Telusko', description: 'Java & Python tutorials' },
      { name: 'thenewboston', subscribers: '2.6M', tags: ['python', 'java', 'web'], url: 'https://youtube.com/@thenewboston', description: 'Programming tutorials' },
      { name: 'Edureka', subscribers: '3.5M', tags: ['courses', 'devops', 'cloud'], url: 'https://youtube.com/@edurekaIN', description: 'Professional IT courses' },
      { name: 'Simplilearn', subscribers: '3.2M', tags: ['courses', 'cloud', 'cybersecurity'], url: 'https://youtube.com/@SimplilearnOfficial', description: 'Professional certifications' },
      { name: 'Intellipaat', subscribers: '1.8M', tags: ['courses', 'data-science', 'cloud'], url: 'https://youtube.com/@Intellipaat', description: 'Tech training courses' },
      { name: 'Kudvenkat', subscribers: '1.2M', tags: ['dotnet', 'csharp', 'sql'], url: 'https://youtube.com/@Csharp-video-tutorialsBlogspot', description: '.NET & C# tutorials' },
      { name: 'LearnCode.academy', subscribers: '700K', tags: ['web', 'javascript', 'react'], url: 'https://youtube.com/@learncodeacademy', description: 'Web development academy' },
      { name: 'LevelUpTuts', subscribers: '400K', tags: ['web', 'design', 'javascript'], url: 'https://youtube.com/@LevelUpTuts', description: 'Web design & development' },
      { name: 'Fun Fun Function', subscribers: '260K', tags: ['javascript', 'functional'], url: 'https://youtube.com/@funfunfunction', description: 'JavaScript deep dives' },
      { name: 'Wes Bos', subscribers: '400K', tags: ['javascript', 'web', 'react'], url: 'https://youtube.com/@WesBos', description: 'JavaScript tutorials' },
      { name: 'Florin Pop', subscribers: '200K', tags: ['web', 'javascript', 'projects'], url: 'https://youtube.com/@FlorinPop', description: '100 Days of Code' },
      { name: 'DesignCourse', subscribers: '1.1M', tags: ['design', 'web', 'ui-ux'], url: 'https://youtube.com/@DesignCourse', description: 'UI/UX & web design' },
      { name: 'Flux', subscribers: '300K', tags: ['design', 'web'], url: 'https://youtube.com/@FluxWithRanSegall', description: 'Design & development' },
      { name: 'Chris Courses', subscribers: '200K', tags: ['javascript', 'canvas', 'games'], url: 'https://youtube.com/@ChrisCourses', description: 'Game development with JS' },
      { name: 'Ania Kubów', subscribers: '350K', tags: ['javascript', 'games', 'projects'], url: 'https://youtube.com/@AniaKubow', description: 'JavaScript game tutorials' },
      { name: 'Code with Ania Kubów', subscribers: '350K', tags: ['javascript', 'web', 'projects'], url: 'https://youtube.com/@AniaKubow', description: 'Coding projects' },
      { name: 'Sonny Sangha', subscribers: '600K', tags: ['react', 'nextjs', 'web'], url: 'https://youtube.com/@SonnySangha', description: 'React & Next.js projects' },
      { name: 'JavaScript Mastery', subscribers: '1.2M', tags: ['react', 'javascript', 'web'], url: 'https://youtube.com/@javascriptmastery', description: 'Modern JavaScript projects' },
      { name: 'Coding Addict', subscribers: '300K', tags: ['react', 'javascript', 'web'], url: 'https://youtube.com/@CodingAddict', description: 'React tutorials' },
      { name: 'Lama Dev', subscribers: '500K', tags: ['react', 'nodejs', 'web'], url: 'https://youtube.com/@LamaDev', description: 'Full-stack projects' },
      { name: 'PedroTech', subscribers: '400K', tags: ['react', 'nodejs', 'web'], url: 'https://youtube.com/@PedroTechnologies', description: 'Full-stack development' },
      { name: 'Codevolution', subscribers: '800K', tags: ['react', 'angular', 'web'], url: 'https://youtube.com/@Codevolution', description: 'Frontend frameworks' },
      { name: 'Hitesh Choudhary', subscribers: '1.5M', tags: ['web', 'python', 'javascript'], url: 'https://youtube.com/@HiteshChoudharydotcom', description: 'Programming tutorials' },
      { name: 'CodeWithHarry', subscribers: '4M', tags: ['python', 'web', 'java'], url: 'https://youtube.com/@CodeWithHarry', description: 'Hindi programming tutorials' },
      { name: 'Apna College', subscribers: '5M', tags: ['courses', 'dsa', 'java'], url: 'https://youtube.com/@ApnaCollegeOfficial', description: 'College CS courses' },
      { name: 'Jenny\'s Lectures', subscribers: '2M', tags: ['theory', 'algorithms', 'dbms'], url: 'https://youtube.com/@JennyslecturesCSIT', description: 'CS theory lectures' },
      { name: 'Abdul Bari', subscribers: '1.5M', tags: ['algorithms', 'theory'], url: 'https://youtube.com/@abdul_bari', description: 'Algorithm tutorials' },
      { name: 'Gate Smashers', subscribers: '2M', tags: ['theory', 'gate', 'os'], url: 'https://youtube.com/@GateSmashers', description: 'CS fundamentals' },
      { name: 'Neso Academy', subscribers: '2.5M', tags: ['theory', 'electronics', 'cs'], url: 'https://youtube.com/@nesoacademy', description: 'Academic tutorials' },
      { name: 'mycodeschool', subscribers: '700K', tags: ['dsa', 'algorithms', 'c'], url: 'https://youtube.com/@mycodeschool', description: 'Data structures & algorithms' },
      { name: 'Back To Back SWE', subscribers: '200K', tags: ['algorithms', 'interviews'], url: 'https://youtube.com/@BackToBackSWE', description: 'Interview preparation' },
      { name: 'Clément Mihailescu', subscribers: '200K', tags: ['algorithms', 'interviews'], url: 'https://youtube.com/@clem', description: 'Coding interview prep' },
      { name: 'NeetCode', subscribers: '500K', tags: ['algorithms', 'leetcode', 'interviews'], url: 'https://youtube.com/@NeetCode', description: 'LeetCode solutions' },
      { name: 'Nick White', subscribers: '400K', tags: ['algorithms', 'leetcode'], url: 'https://youtube.com/@NickWhite', description: 'LeetCode walkthroughs' },
      { name: 'Errichto', subscribers: '200K', tags: ['competitive', 'algorithms'], url: 'https://youtube.com/@Errichto', description: 'Competitive programming' },
      { name: 'William Fiset', subscribers: '300K', tags: ['algorithms', 'dsa'], url: 'https://youtube.com/@WilliamFiset-videos', description: 'Algorithm implementations' },
      { name: 'Tushar Roy', subscribers: '400K', tags: ['algorithms', 'interviews'], url: 'https://youtube.com/@tusharroy2525', description: 'Coding interview problems' },
      { name: 'Tech Dummies', subscribers: '300K', tags: ['system-design', 'interviews'], url: 'https://youtube.com/@TechDummiesNarendraL', description: 'System design tutorials' },
      { name: 'Gaurav Sen', subscribers: '500K', tags: ['system-design', 'interviews'], url: 'https://youtube.com/@gkcs', description: 'System design concepts' },
      { name: 'Success in Tech', subscribers: '200K', tags: ['system-design', 'career'], url: 'https://youtube.com/@SuccessinTech', description: 'Tech career guidance' },
      { name: 'Exponent', subscribers: '400K', tags: ['interviews', 'career'], url: 'https://youtube.com/@tryexponent', description: 'Tech interview prep' },
      { name: 'Byte by Byte', subscribers: '150K', tags: ['algorithms', 'interviews'], url: 'https://youtube.com/@ByteByByte', description: 'Interview questions' },
      { name: 'Rachit Jain', subscribers: '200K', tags: ['competitive', 'algorithms'], url: 'https://youtube.com/@RachitJain', description: 'Competitive programming' },
      { name: 'CodeChef', subscribers: '300K', tags: ['competitive', 'algorithms'], url: 'https://youtube.com/@CodeChefVids', description: 'Competitive programming' },
      { name: 'Pepcoding', subscribers: '800K', tags: ['dsa', 'java', 'interviews'], url: 'https://youtube.com/@Pepcoding', description: 'DSA & interview prep' },
      { name: 'Aditya Verma', subscribers: '500K', tags: ['dsa', 'algorithms'], url: 'https://youtube.com/@TheAdityaVerma', description: 'Dynamic programming' },
      { name: 'take U forward', subscribers: '600K', tags: ['dsa', 'algorithms', 'interviews'], url: 'https://youtube.com/@takeUforward', description: 'DSA complete course' },
      { name: 'CodeHelp', subscribers: '1M', tags: ['dsa', 'cpp', 'interviews'], url: 'https://youtube.com/@CodeHelp', description: 'DSA with C++' },
      { name: 'Kunal Kushwaha', subscribers: '400K', tags: ['dsa', 'java', 'devops'], url: 'https://youtube.com/@KunalKushwaha', description: 'DSA & DevOps' },
      { name: 'WilliamFiset', subscribers: '300K', tags: ['algorithms', 'graph'], url: 'https://youtube.com/@WilliamFiset-videos', description: 'Graph algorithms' },
      { name: 'Reducible', subscribers: '300K', tags: ['theory', 'algorithms'], url: 'https://youtube.com/@Reducible', description: 'CS theory animations' },
      { name: 'Spanning Tree', subscribers: '200K', tags: ['theory', 'cs'], url: 'https://youtube.com/@SpanningTree', description: 'CS concepts explained' },
      { name: 'CodeAesthetic', subscribers: '400K', tags: ['theory', 'best-practices'], url: 'https://youtube.com/@CodeAesthetic', description: 'Code quality & design' },
      { name: 'ArjanCodes', subscribers: '300K', tags: ['python', 'design-patterns'], url: 'https://youtube.com/@ArjanCodes', description: 'Python best practices' },
      { name: 'mCoding', subscribers: '200K', tags: ['python', 'advanced'], url: 'https://youtube.com/@mCoding', description: 'Advanced Python' },
      { name: 'Real Python', subscribers: '200K', tags: ['python', 'tutorials'], url: 'https://youtube.com/@realpython', description: 'Python tutorials' },
      { name: 'Socratica', subscribers: '1M', tags: ['python', 'theory'], url: 'https://youtube.com/@Socratica', description: 'Python & CS theory' },
      { name: 'Python Engineer', subscribers: '300K', tags: ['python', 'machine-learning'], url: 'https://youtube.com/@patloeber', description: 'Python & ML tutorials' },
      { name: 'Keith Galli', subscribers: '300K', tags: ['python', 'data-science'], url: 'https://youtube.com/@KeithGalli', description: 'Python data science' },
      { name: 'Krish Naik', subscribers: '1M', tags: ['machine-learning', 'data-science'], url: 'https://youtube.com/@krishnaik06', description: 'ML & data science' },
      { name: 'StatQuest', subscribers: '1.2M', tags: ['machine-learning', 'statistics'], url: 'https://youtube.com/@statquest', description: 'ML concepts explained' },
      { name: 'Andrej Karpathy', subscribers: '500K', tags: ['ai', 'deep-learning'], url: 'https://youtube.com/@AndrejKarpathy', description: 'AI & neural networks' },
      { name: '3Blue1Brown', subscribers: '5.5M', tags: ['math', 'theory'], url: 'https://youtube.com/@3blue1brown', description: 'Math visualizations' },
      { name: 'Two Minute Papers', subscribers: '1.5M', tags: ['ai', 'research'], url: 'https://youtube.com/@TwoMinutePapers', description: 'AI research papers' },
      { name: 'Lex Fridman', subscribers: '3M', tags: ['ai', 'interviews'], url: 'https://youtube.com/@lexfridman', description: 'AI & tech interviews' },
      { name: 'Yannic Kilcher', subscribers: '300K', tags: ['ai', 'research'], url: 'https://youtube.com/@YannicKilcher', description: 'ML paper reviews' },
      { name: 'Siraj Raval', subscribers: '700K', tags: ['ai', 'blockchain'], url: 'https://youtube.com/@SirajRaval', description: 'AI & blockchain' },
      { name: 'NetworkChuck', subscribers: '3M', tags: ['networking', 'cybersecurity'], url: 'https://youtube.com/@NetworkChuck', description: 'Networking & security' },
      { name: 'David Bombal', subscribers: '2M', tags: ['networking', 'cybersecurity'], url: 'https://youtube.com/@davidbombal', description: 'Network engineering' },
      { name: 'John Hammond', subscribers: '1M', tags: ['cybersecurity', 'ctf'], url: 'https://youtube.com/@_JohnHammond', description: 'Cybersecurity & CTF' },
      { name: 'LiveOverflow', subscribers: '500K', tags: ['cybersecurity', 'hacking'], url: 'https://youtube.com/@LiveOverflow', description: 'Security research' },
      { name: 'IppSec', subscribers: '400K', tags: ['cybersecurity', 'pentesting'], url: 'https://youtube.com/@ippsec', description: 'Penetration testing' },
      { name: 'The Cyber Mentor', subscribers: '800K', tags: ['cybersecurity', 'ethical-hacking'], url: 'https://youtube.com/@TCMSecurityAcademy', description: 'Ethical hacking' },
      { name: 'TechWorld with Nana', subscribers: '1M', tags: ['devops', 'cloud', 'docker'], url: 'https://youtube.com/@TechWorldwithNana', description: 'DevOps tutorials' },
      { name: 'DevOps Toolkit', subscribers: '200K', tags: ['devops', 'kubernetes'], url: 'https://youtube.com/@DevOpsToolkit', description: 'DevOps tools' },
      { name: 'Cloud Advocate', subscribers: '150K', tags: ['cloud', 'azure'], url: 'https://youtube.com/@CloudAdvocate', description: 'Cloud computing' },
      { name: 'AWS Online Tech Talks', subscribers: '300K', tags: ['cloud', 'aws'], url: 'https://youtube.com/@AWSOnlineTechTalks', description: 'AWS tutorials' }
    ];

    this.renderChannels();
    this.setupChannelFilters();
  },

  renderChannels(page = 1) {
    const grid = document.getElementById('channelGrid');
    const start = (page - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    const items = this.channels.slice(start, end);
    
    const html = items.map(ch => `
      <div class="channel-card" data-tags="${ch.tags.join(',')}">
        <div class="channel-thumbnail">
          <div class="yt-icon"><i class="fab fa-youtube"></i></div>
          <div class="subscriber-badge">${ch.subscribers}</div>
        </div>
        <div class="channel-content">
          <h3 class="channel-title">${ch.name}</h3>
          <p class="channel-description">${ch.description}</p>
          <div class="channel-tags">
            ${ch.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
          </div>
          <div class="channel-actions">
            <a href="${ch.url}" target="_blank" class="btn-visit">
              <i class="fas fa-play"></i> Watch Now
            </a>
            <button class="btn-save" onclick="TutorialsApp.saveResource('${ch.name}', 'channel')">
              <i class="far fa-bookmark"></i>
            </button>
          </div>
        </div>
      </div>
    `).join('');

    if (page === 1) {
      grid.innerHTML = html;
    } else {
      grid.insertAdjacentHTML('beforeend', html);
    }

    this.updateLoadMoreButton('channelGrid', page, this.channels.length, 'channels');
  },

  setupChannelFilters() {
    const allTags = [...new Set(this.channels.flatMap(ch => ch.tags))];
    const filtersContainer = document.getElementById('channelFilters');
    
    filtersContainer.innerHTML = `
      <div class="filter-tag active" data-filter="all">All Channels (${this.channels.length})</div>
      ${allTags.map(tag => {
        const count = this.channels.filter(ch => ch.tags.includes(tag)).length;
        return `<div class="filter-tag" data-filter="${tag}">${tag} (${count})</div>`;
      }).join('')}
    `;

    filtersContainer.querySelectorAll('.filter-tag').forEach(tag => {
      tag.onclick = () => {
        filtersContainer.querySelectorAll('.filter-tag').forEach(t => t.classList.remove('active'));
        tag.classList.add('active');
        
        const filter = tag.dataset.filter;
        document.querySelectorAll('.channel-card').forEach(card => {
          if (filter === 'all' || card.dataset.tags.includes(filter)) {
            card.style.display = 'block';
          } else {
            card.style.display = 'none';
          }
        });
      };
    });

    // Search & Sort
    document.getElementById('channelSearch').addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase();
      document.querySelectorAll('.channel-card').forEach(card => {
        const text = card.textContent.toLowerCase();
        card.style.display = text.includes(query) ? 'block' : 'none';
      });
    });

    document.getElementById('channelSort').addEventListener('change', (e) => {
      const sortBy = e.target.value;
      if (sortBy === 'name') {
        this.channels.sort((a, b) => a.name.localeCompare(b.name));
      } else {
        this.channels.sort((a, b) => {
          const aNum = parseFloat(a.subscribers);
          const bNum = parseFloat(b.subscribers);
          return bNum - aNum;
        });
      }
      this.renderChannels();
      this.setupChannelFilters();
    });
  },

  // Resources Data
  loadResources() {
    this.resources = [
      // Web Development
      { title: 'MDN Web Docs', type: 'documentation', category: 'web', url: 'https://developer.mozilla.org', description: 'Comprehensive web development documentation', rating: 5.0 },
      { title: 'W3Schools', type: 'tutorial', category: 'web', url: 'https://w3schools.com', description: 'Easy web development tutorials', rating: 4.5 },
      { title: 'freeCodeCamp', type: 'course', category: 'web', url: 'https://freecodecamp.org', description: 'Free coding bootcamp', rating: 5.0 },
      { title: 'The Odin Project', type: 'course', category: 'web', url: 'https://theodinproject.com', description: 'Full-stack web development curriculum', rating: 4.8 },
      { title: 'CSS-Tricks', type: 'tutorial', category: 'web', url: 'https://css-tricks.com', description: 'CSS tips, tricks, and techniques', rating: 4.7 },
      { title: 'Can I Use', type: 'tool', category: 'web', url: 'https://caniuse.com', description: 'Browser support tables', rating: 4.9 },
      { title: 'Frontend Mentor', type: 'platform', category: 'web', url: 'https://frontendmentor.io', description: 'Frontend coding challenges', rating: 4.6 },
      { title: 'Web.dev', type: 'tutorial', category: 'web', url: 'https://web.dev', description: 'Modern web development by Google', rating: 4.8 },
      
      // JavaScript
      { title: 'JavaScript.info', type: 'tutorial', category: 'javascript', url: 'https://javascript.info', description: 'Modern JavaScript tutorial', rating: 5.0 },
      { title: 'Eloquent JavaScript', type: 'book', category: 'javascript', url: 'https://eloquentjavascript.net', description: 'Free JavaScript book', rating: 4.8 },
      { title: 'You Don\'t Know JS', type: 'book', category: 'javascript', url: 'https://github.com/getify/You-Dont-Know-JS', description: 'Deep dive into JavaScript', rating: 4.9 },
      { title: 'JavaScript30', type: 'course', category: 'javascript', url: 'https://javascript30.com', description: '30 vanilla JS projects', rating: 4.7 },
      { title: 'ES6 Features', type: 'documentation', category: 'javascript', url: 'https://es6-features.org', description: 'ES6 feature overview', rating: 4.5 },
      
      // React
      { title: 'React Docs', type: 'documentation', category: 'react', url: 'https://react.dev', description: 'Official React documentation', rating: 5.0 },
      { title: 'React Tutorial', type: 'tutorial', category: 'react', url: 'https://react-tutorial.app', description: 'Interactive React tutorial', rating: 4.6 },
      { title: 'React Patterns', type: 'tutorial', category: 'react', url: 'https://reactpatterns.com', description: 'React design patterns', rating: 4.7 },
      { title: 'Scrimba React', type: 'course', category: 'react', url: 'https://scrimba.com/learn/learnreact', description: 'Interactive React course', rating: 4.8 },
      
      // Python
      { title: 'Python.org', type: 'documentation', category: 'python', url: 'https://python.org', description: 'Official Python documentation', rating: 5.0 },
      { title: 'Real Python', type: 'tutorial', category: 'python', url: 'https://realpython.com', description: 'Python tutorials and articles', rating: 4.8 },
      { title: 'Automate the Boring Stuff', type: 'book', category: 'python', url: 'https://automatetheboringstuff.com', description: 'Practical Python programming', rating: 4.9 },
      { title: 'Python Tutor', type: 'tool', category: 'python', url: 'https://pythontutor.com', description: 'Visualize code execution', rating: 4.7 },
      { title: 'Learn Python', type: 'course', category: 'python', url: 'https://learnpython.org', description: 'Interactive Python tutorial', rating: 4.5 },
      { title: 'Full Stack Python', type: 'tutorial', category: 'python', url: 'https://fullstackpython.com', description: 'Python web development', rating: 4.6 },
      
      // Data Science & AI
      { title: 'Kaggle', type: 'platform', category: 'data-science', url: 'https://kaggle.com', description: 'Data science competitions', rating: 4.9 },
      { title: 'Fast.ai', type: 'course', category: 'ai', url: 'https://fast.ai', description: 'Practical deep learning', rating: 4.8 },
      { title: 'TensorFlow', type: 'documentation', category: 'ai', url: 'https://tensorflow.org', description: 'Machine learning framework', rating: 4.7 },
      { title: 'PyTorch', type: 'documentation', category: 'ai', url: 'https://pytorch.org', description: 'Deep learning framework', rating: 4.8 },
      { title: 'Scikit-learn', type: 'documentation', category: 'data-science', url: 'https://scikit-learn.org', description: 'Machine learning in Python', rating: 4.7 },
      { title: 'Pandas Docs', type: 'documentation', category: 'data-science', url: 'https://pandas.pydata.org', description: 'Data analysis library', rating: 4.6 },
      { title: 'DataCamp', type: 'course', category: 'data-science', url: 'https://datacamp.com', description: 'Data science courses', rating: 4.5 },
      
      // Algorithms & DSA
      { title: 'LeetCode', type: 'platform', category: 'algorithms', url: 'https://leetcode.com', description: 'Coding interview practice', rating: 4.9 },
      { title: 'HackerRank', type: 'platform', category: 'algorithms', url: 'https://hackerrank.com', description: 'Coding challenges', rating: 4.7 },
      { title: 'Codeforces', type: 'platform', category: 'algorithms', url: 'https://codeforces.com', description: 'Competitive programming', rating: 4.8 },
      { title: 'GeeksforGeeks', type: 'tutorial', category: 'algorithms', url: 'https://geeksforgeeks.org', description: 'DSA tutorials', rating: 4.6 },
      { title: 'VisuAlgo', type: 'tool', category: 'algorithms', url: 'https://visualgo.net', description: 'Algorithm visualizations', rating: 4.8 },
      { title: 'Algorithm Visualizer', type: 'tool', category: 'algorithms', url: 'https://algorithm-visualizer.org', description: 'Interactive algorithm visualization', rating: 4.7 },
      { title: 'Big-O Cheat Sheet', type: 'documentation', category: 'algorithms', url: 'https://bigocheatsheet.com', description: 'Time complexity reference', rating: 4.5 },
      
      // Git & GitHub
      { title: 'Git Documentation', type: 'documentation', category: 'git', url: 'https://git-scm.com/doc', description: 'Official Git docs', rating: 4.8 },
      { title: 'GitHub Docs', type: 'documentation', category: 'git', url: 'https://docs.github.com', description: 'GitHub documentation', rating: 4.7 },
      { title: 'Learn Git Branching', type: 'tutorial', category: 'git', url: 'https://learngitbranching.js.org', description: 'Interactive Git tutorial', rating: 4.9 },
      { title: 'Oh My Git!', type: 'tool', category: 'git', url: 'https://ohmygit.org', description: 'Git learning game', rating: 4.6 },
      { title: 'Git Explorer', type: 'tool', category: 'git', url: 'https://gitexplorer.com', description: 'Find Git commands', rating: 4.5 },
      
      // DevOps & Cloud
      { title: 'Docker Docs', type: 'documentation', category: 'devops', url: 'https://docs.docker.com', description: 'Docker documentation', rating: 4.8 },
      { title: 'Kubernetes Docs', type: 'documentation', category: 'devops', url: 'https://kubernetes.io/docs', description: 'Kubernetes documentation', rating: 4.7 },
      { title: 'AWS Documentation', type: 'documentation', category: 'cloud', url: 'https://docs.aws.amazon.com', description: 'AWS cloud services', rating: 4.6 },
      { title: 'Azure Docs', type: 'documentation', category: 'cloud', url: 'https://docs.microsoft.com/azure', description: 'Microsoft Azure docs', rating: 4.5 },
      { title: 'Google Cloud Docs', type: 'documentation', category: 'cloud', url: 'https://cloud.google.com/docs', description: 'GCP documentation', rating: 4.6 },
      { title: 'DevOps Roadmap', type: 'tutorial', category: 'devops', url: 'https://roadmap.sh/devops', description: 'DevOps learning path', rating: 4.8 },
      
      // Databases
      { title: 'PostgreSQL Docs', type: 'documentation', category: 'database', url: 'https://postgresql.org/docs', description: 'PostgreSQL documentation', rating: 4.7 },
      { title: 'MongoDB University', type: 'course', category: 'database', url: 'https://university.mongodb.com', description: 'Free MongoDB courses', rating: 4.6 },
      { title: 'MySQL Tutorial', type: 'tutorial', category: 'database', url: 'https://mysqltutorial.org', description: 'MySQL tutorials', rating: 4.5 },
      { title: 'Redis Docs', type: 'documentation', category: 'database', url: 'https://redis.io/docs', description: 'Redis documentation', rating: 4.6 },
      { title: 'SQL Zoo', type: 'tutorial', category: 'database', url: 'https://sqlzoo.net', description: 'Interactive SQL tutorial', rating: 4.7 },
      
      // Design & UI/UX
      { title: 'Figma', type: 'tool', category: 'design', url: 'https://figma.com', description: 'Collaborative design tool', rating: 4.9 },
      { title: 'Dribbble', type: 'platform', category: 'design', url: 'https://dribbble.com', description: 'Design inspiration', rating: 4.7 },
      { title: 'Behance', type: 'platform', category: 'design', url: 'https://behance.net', description: 'Creative portfolios', rating: 4.6 },
      { title: 'Awwwards', type: 'platform', category: 'design', url: 'https://awwwards.com', description: 'Web design awards', rating: 4.8 },
      { title: 'UI Design Daily', type: 'platform', category: 'design', url: 'https://uidesigndaily.com', description: 'Free UI resources', rating: 4.5 },
      { title: 'Laws of UX', type: 'tutorial', category: 'design', url: 'https://lawsofux.com', description: 'UX design principles', rating: 4.7 },
      
      // General Programming
      { title: 'Stack Overflow', type: 'platform', category: 'general', url: 'https://stackoverflow.com', description: 'Q&A for developers', rating: 4.9 },
      { title: 'GitHub', type: 'platform', category: 'general', url: 'https://github.com', description: 'Code hosting platform', rating: 5.0 },
      { title: 'Dev.to', type: 'platform', category: 'general', url: 'https://dev.to', description: 'Developer community', rating: 4.7 },
      { title: 'Codecademy', type: 'course', category: 'general', url: 'https://codecademy.com', description: 'Interactive coding courses', rating: 4.6 },
      { title: 'Coursera', type: 'course', category: 'general', url: 'https://coursera.org', description: 'University-level courses', rating: 4.7 },
      { title: 'edX', type: 'course', category: 'general', url: 'https://edx.org', description: 'Online learning platform', rating: 4.6 },
      { title: 'Udemy', type: 'course', category: 'general', url: 'https://udemy.com', description: 'Online course marketplace', rating: 4.5 },
      { title: 'Pluralsight', type: 'course', category: 'general', url: 'https://pluralsight.com', description: 'Tech skills platform', rating: 4.6 },
      
      // Tools & Utilities
      { title: 'VS Code', type: 'tool', category: 'tools', url: 'https://code.visualstudio.com', description: 'Code editor', rating: 5.0 },
      { title: 'Postman', type: 'tool', category: 'tools', url: 'https://postman.com', description: 'API testing tool', rating: 4.8 },
      { title: 'Regex101', type: 'tool', category: 'tools', url: 'https://regex101.com', description: 'Regex tester', rating: 4.7 },
      { title: 'JSON Formatter', type: 'tool', category: 'tools', url: 'https://jsonformatter.org', description: 'Format and validate JSON', rating: 4.5 },
      { title: 'CodePen', type: 'tool', category: 'tools', url: 'https://codepen.io', description: 'Frontend playground', rating: 4.8 },
      { title: 'JSFiddle', type: 'tool', category: 'tools', url: 'https://jsfiddle.net', description: 'Online code editor', rating: 4.6 },
      { title: 'Replit', type: 'tool', category: 'tools', url: 'https://replit.com', description: 'Online IDE', rating: 4.7 },
      
      // Cybersecurity
      { title: 'OWASP', type: 'documentation', category: 'security', url: 'https://owasp.org', description: 'Web security resources', rating: 4.8 },
      { title: 'HackTheBox', type: 'platform', category: 'security', url: 'https://hackthebox.com', description: 'Penetration testing labs', rating: 4.9 },
      { title: 'TryHackMe', type: 'platform', category: 'security', url: 'https://tryhackme.com', description: 'Cybersecurity training', rating: 4.8 },
      { title: 'PortSwigger Academy', type: 'course', category: 'security', url: 'https://portswigger.net/web-security', description: 'Web security training', rating: 4.7 },
      
      // Mobile Development
      { title: 'React Native Docs', type: 'documentation', category: 'mobile', url: 'https://reactnative.dev', description: 'React Native documentation', rating: 4.7 },
      { title: 'Flutter Docs', type: 'documentation', category: 'mobile', url: 'https://flutter.dev', description: 'Flutter documentation', rating: 4.8 },
      { title: 'Swift Docs', type: 'documentation', category: 'mobile', url: 'https://swift.org/documentation', description: 'Swift programming language', rating: 4.6 },
      { title: 'Android Developers', type: 'documentation', category: 'mobile', url: 'https://developer.android.com', description: 'Android development', rating: 4.7 },
      
      // Backend
      { title: 'Node.js Docs', type: 'documentation', category: 'backend', url: 'https://nodejs.org/docs', description: 'Node.js documentation', rating: 4.8 },
      { title: 'Express.js', type: 'documentation', category: 'backend', url: 'https://expressjs.com', description: 'Node.js web framework', rating: 4.7 },
      { title: 'Django Docs', type: 'documentation', category: 'backend', url: 'https://docs.djangoproject.com', description: 'Python web framework', rating: 4.8 },
      { title: 'Flask Docs', type: 'documentation', category: 'backend', url: 'https://flask.palletsprojects.com', description: 'Python micro framework', rating: 4.7 },
      { title: 'Spring Docs', type: 'documentation', category: 'backend', url: 'https://spring.io/guides', description: 'Java framework', rating: 4.6 },
      
      // Career & Interview
      { title: 'Cracking the Coding Interview', type: 'book', category: 'career', url: 'https://crackingthecodinginterview.com', description: 'Interview preparation book', rating: 4.9 },
      { title: 'Pramp', type: 'platform', category: 'career', url: 'https://pramp.com', description: 'Mock interviews', rating: 4.6 },
      { title: 'Interviewing.io', type: 'platform', category: 'career', url: 'https://interviewing.io', description: 'Anonymous interviews', rating: 4.7 },
      { title: 'Levels.fyi', type: 'platform', category: 'career', url: 'https://levels.fyi', description: 'Tech compensation data', rating: 4.8 }
    ];

    this.renderResources();
    this.setupResourceFilters();
  },

  renderResources(page = 1) {
    const grid = document.getElementById('resourceGrid');
    if (!grid) return;
    
    const start = (page - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    const items = this.resources.slice(start, end);
    
    const html = items.map(r => `
      <div class="resource-card" data-type="${r.type}" data-category="${r.category}">
        <div class="resource-header">
          <div class="resource-icon"><i class="fas fa-${this.getResourceIcon(r.type)}"></i></div>
          <div class="resource-rating">
            <i class="fas fa-star"></i> ${r.rating}
          </div>
        </div>
        <h3 class="resource-title">${r.title}</h3>
        <p class="resource-type">${r.type}</p>
        <p class="resource-description">${r.description}</p>
        <div class="resource-footer">
          <a href="${r.url}" target="_blank" class="btn-visit-resource">
            <i class="fas fa-external-link-alt"></i> Visit
          </a>
          <button class="btn-save-resource" onclick="TutorialsApp.saveResource('${r.title}', 'resource')">
            <i class="far fa-bookmark"></i>
          </button>
        </div>
      </div>
    `).join('');

    if (page === 1) {
      grid.innerHTML = html;
    } else {
      grid.insertAdjacentHTML('beforeend', html);
    }

    this.updateLoadMoreButton('resourceGrid', page, this.resources.length, 'resources');
  },

  setupResourceFilters() {
    const filtersContainer = document.getElementById('resourceCategoryFilters');
    if (!filtersContainer) return;
    
    const categories = [...new Set(this.resources.map(r => r.category))];
    
    filtersContainer.innerHTML = `
      <div class="filter-tag active" data-filter="all">All (${this.resources.length})</div>
      ${categories.map(cat => {
        const count = this.resources.filter(r => r.category === cat).length;
        return `<div class="filter-tag" data-filter="${cat}">${cat} (${count})</div>`;
      }).join('')}
    `;

    filtersContainer.querySelectorAll('.filter-tag').forEach(tag => {
      tag.onclick = () => {
        filtersContainer.querySelectorAll('.filter-tag').forEach(t => t.classList.remove('active'));
        tag.classList.add('active');
        
        const filter = tag.dataset.filter;
        document.querySelectorAll('.resource-card').forEach(card => {
          if (filter === 'all' || card.dataset.category === filter) {
            card.style.display = 'block';
          } else {
            card.style.display = 'none';
          }
        });
      };
    });

    const filterSelect = document.getElementById('resourceFilter');
    filterSelect.innerHTML = '<option value="all">All Categories</option>' + 
      categories.map(c => `<option value="${c}">${c}</option>`).join('');

    filterSelect.onchange = () => this.filterResources();
    document.getElementById('resourceType').onchange = () => this.filterResources();
    document.getElementById('resourceSearch').oninput = (e) => {
      const query = e.target.value.toLowerCase();
      document.querySelectorAll('.resource-card').forEach(card => {
        card.style.display = card.textContent.toLowerCase().includes(query) ? 'block' : 'none';
      });
    };
  },

  getResourceIcon(type) {
    const icons = {
      documentation: 'file-alt',
      tutorial: 'book',
      course: 'graduation-cap',
      tool: 'tools',
      platform: 'layer-group',
      book: 'book-open'
    };
    return icons[type] || 'link';
  },

  filterResources() {
    const category = document.getElementById('resourceFilter').value;
    const type = document.getElementById('resourceType').value;

    document.querySelectorAll('.resource-card').forEach(card => {
      const matchCategory = category === 'all' || card.dataset.category === category;
      const matchType = type === 'all' || card.dataset.type === type;
      card.style.display = matchCategory && matchType ? 'block' : 'none';
    });
  },

  // Videos Data
  loadVideos() {
    this.videos = [
      // Web Development Fundamentals
      { title: 'HTML Full Course - Build a Website Tutorial', channel: 'freeCodeCamp', playlist: 'web-fundamentals', duration: '2:04:18', views: '3.2M', likes: '85K', url: 'https://youtube.com/@freecodecamp', description: 'Learn HTML from scratch with this complete tutorial.' },
      { title: 'CSS Tutorial - Zero to Hero', channel: 'freeCodeCamp', playlist: 'web-fundamentals', duration: '11:00:00', views: '2.8M', likes: '72K', url: 'https://youtube.com/@freecodecamp', description: 'Complete CSS course covering all fundamentals and advanced topics.' },
      { title: 'Responsive Web Design Tutorial', channel: 'Traversy Media', playlist: 'web-fundamentals', duration: '1:15:23', views: '1.5M', likes: '45K', url: 'https://youtube.com/@TraversyMedia', description: 'Master responsive design with modern CSS techniques.' },
      { title: 'Flexbox CSS In 20 Minutes', channel: 'Traversy Media', playlist: 'web-fundamentals', duration: '20:32', views: '890K', likes: '28K', url: 'https://youtube.com/@TraversyMedia', description: 'Quick guide to CSS Flexbox layout.' },
      { title: 'CSS Grid Layout Crash Course', channel: 'Traversy Media', playlist: 'web-fundamentals', duration: '28:52', views: '1.2M', likes: '38K', url: 'https://youtube.com/@TraversyMedia', description: 'Learn CSS Grid in under 30 minutes.' },
      { title: 'Build a Portfolio Website', channel: 'Web Dev Simplified', playlist: 'web-fundamentals', duration: '45:12', views: '650K', likes: '22K', url: 'https://youtube.com/@WebDevSimplified', description: 'Create a professional portfolio from scratch.' },
      { title: 'HTML & CSS Project - Restaurant Website', channel: 'Dev Ed', playlist: 'web-fundamentals', duration: '1:32:45', views: '780K', likes: '25K', url: 'https://youtube.com/@DevEd', description: 'Build a complete restaurant website.' },
      { title: 'Modern CSS Techniques', channel: 'Kevin Powell', playlist: 'web-fundamentals', duration: '35:18', views: '420K', likes: '18K', url: 'https://youtube.com/@KevinPowell', description: 'Latest CSS features and best practices.' },
      { title: 'Web Accessibility Tutorial', channel: 'freeCodeCamp', playlist: 'web-fundamentals', duration: '1:28:30', views: '310K', likes: '12K', url: 'https://youtube.com/@freecodecamp', description: 'Make your websites accessible to everyone.' },
      { title: 'CSS Animations Tutorial', channel: 'Dev Ed', playlist: 'web-fundamentals', duration: '42:15', views: '520K', likes: '19K', url: 'https://youtube.com/@DevEd', description: 'Create smooth CSS animations.' },
      { title: 'Sass Tutorial for Beginners', channel: 'The Net Ninja', playlist: 'web-fundamentals', duration: '2:15:40', views: '680K', likes: '23K', url: 'https://youtube.com/@NetNinja', description: 'Learn Sass CSS preprocessor.' },
      { title: 'Bootstrap 5 Crash Course', channel: 'Traversy Media', playlist: 'web-fundamentals', duration: '1:05:22', views: '950K', likes: '32K', url: 'https://youtube.com/@TraversyMedia', description: 'Master Bootstrap 5 framework.' },
      { title: 'Tailwind CSS Tutorial', channel: 'The Net Ninja', playlist: 'web-fundamentals', duration: '3:12:18', views: '1.1M', likes: '41K', url: 'https://youtube.com/@NetNinja', description: 'Complete Tailwind CSS course.' },

      // JavaScript Mastery
      { title: 'JavaScript Full Course for Beginners', channel: 'freeCodeCamp', playlist: 'javascript', duration: '3:26:42', views: '5.2M', likes: '120K', url: 'https://youtube.com/@freecodecamp', description: 'Complete JavaScript tutorial from basics to advanced.' },
      { title: 'JavaScript ES6 Tutorial', channel: 'Traversy Media', playlist: 'javascript', duration: '1:42:15', views: '2.1M', likes: '68K', url: 'https://youtube.com/@TraversyMedia', description: 'Modern JavaScript ES6+ features.' },
      { title: 'Async JavaScript Crash Course', channel: 'Traversy Media', playlist: 'javascript', duration: '25:45', views: '890K', likes: '31K', url: 'https://youtube.com/@TraversyMedia', description: 'Master async/await and promises.' },
      { title: 'JavaScript DOM Manipulation', channel: 'Web Dev Simplified', playlist: 'javascript', duration: '35:28', views: '1.3M', likes: '42K', url: 'https://youtube.com/@WebDevSimplified', description: 'Learn to manipulate the DOM effectively.' },
      { title: 'JavaScript Projects for Beginners', channel: 'freeCodeCamp', playlist: 'javascript', duration: '8:15:30', views: '3.8M', likes: '95K', url: 'https://youtube.com/@freecodecamp', description: '40 JavaScript projects to build.' },
      { title: 'Object Oriented JavaScript', channel: 'The Net Ninja', playlist: 'javascript', duration: '1:18:45', views: '720K', likes: '26K', url: 'https://youtube.com/@NetNinja', description: 'OOP concepts in JavaScript.' },
      { title: 'JavaScript Design Patterns', channel: 'Fireship', playlist: 'javascript', duration: '12:38', views: '650K', likes: '28K', url: 'https://youtube.com/@Fireship', description: 'Common JavaScript design patterns.' },
      { title: 'Functional Programming in JS', channel: 'Fun Fun Function', playlist: 'javascript', duration: '45:22', views: '480K', likes: '19K', url: 'https://youtube.com/@funfunfunction', description: 'Functional programming concepts.' },
      { title: 'JavaScript Testing Tutorial', channel: 'Traversy Media', playlist: 'javascript', duration: '55:18', views: '420K', likes: '16K', url: 'https://youtube.com/@TraversyMedia', description: 'Learn JavaScript testing with Jest.' },
      { title: 'JavaScript Algorithms', channel: 'freeCodeCamp', playlist: 'javascript', duration: '5:12:40', views: '1.9M', likes: '58K', url: 'https://youtube.com/@freecodecamp', description: 'Data structures and algorithms in JS.' },
      { title: 'TypeScript Crash Course', channel: 'Traversy Media', playlist: 'javascript', duration: '52:15', views: '1.5M', likes: '48K', url: 'https://youtube.com/@TraversyMedia', description: 'Learn TypeScript fundamentals.' },
      { title: 'JavaScript Performance Tips', channel: 'Fireship', playlist: 'javascript', duration: '8:42', views: '380K', likes: '15K', url: 'https://youtube.com/@Fireship', description: 'Optimize JavaScript performance.' },
      { title: 'Build a JavaScript Game', channel: 'Ania Kubów', playlist: 'javascript', duration: '1:25:30', views: '620K', likes: '22K', url: 'https://youtube.com/@AniaKubow', description: 'Create a game with vanilla JavaScript.' },

      // React & Frontend Frameworks
      { title: 'React Course - Beginner to Advanced', channel: 'freeCodeCamp', playlist: 'react', duration: '11:55:23', views: '4.5M', likes: '110K', url: 'https://youtube.com', description: 'Complete React course with projects.' },
      { title: 'React Hooks Tutorial', channel: 'Web Dev Simplified', playlist: 'react', duration: '48:32', views: '1.8M', likes: '56K', url: 'https://youtube.com', description: 'Master React Hooks.' },
      { title: 'Next.js 14 Full Course', channel: 'JavaScript Mastery', playlist: 'react', duration: '4:12:18', views: '2.3M', likes: '72K', url: 'https://youtube.com', description: 'Build apps with Next.js 14.' },
      { title: 'React Redux Tutorial', channel: 'The Net Ninja', playlist: 'react', duration: '2:35:45', views: '1.2M', likes: '38K', url: 'https://youtube.com', description: 'State management with Redux.' },
      { title: 'React Router Tutorial', channel: 'Web Dev Simplified', playlist: 'react', duration: '35:18', views: '890K', likes: '29K', url: 'https://youtube.com', description: 'Routing in React applications.' },
      { title: 'React Context API', channel: 'Traversy Media', playlist: 'react', duration: '28:45', views: '720K', likes: '24K', url: 'https://youtube.com', description: 'Global state with Context API.' },
      { title: 'Build a React App', channel: 'Clever Programmer', playlist: 'react', duration: '3:45:22', views: '1.5M', likes: '48K', url: 'https://youtube.com', description: 'Full React project tutorial.' },
      { title: 'React Testing Library', channel: 'Codevolution', playlist: 'react', duration: '1:42:15', views: '420K', likes: '16K', url: 'https://youtube.com', description: 'Test React components.' },
      { title: 'Vue.js 3 Tutorial', channel: 'The Net Ninja', playlist: 'react', duration: '3:28:40', views: '980K', likes: '35K', url: 'https://youtube.com', description: 'Complete Vue.js 3 course.' },
      { title: 'Angular Full Course', channel: 'freeCodeCamp', playlist: 'react', duration: '5:15:30', views: '1.1M', likes: '42K', url: 'https://youtube.com', description: 'Learn Angular framework.' },
      { title: 'Svelte Tutorial', channel: 'Fireship', playlist: 'react', duration: '12:15', views: '650K', likes: '28K', url: 'https://youtube.com', description: 'Quick Svelte introduction.' },
      { title: 'React Native Crash Course', channel: 'Traversy Media', playlist: 'react', duration: '2:05:18', views: '1.3M', likes: '45K', url: 'https://youtube.com', description: 'Build mobile apps with React Native.' },

      // Python Programming
      { title: 'Python Full Course for Beginners', channel: 'freeCodeCamp', playlist: 'python', duration: '4:26:52', views: '6.8M', likes: '145K', url: 'https://youtube.com', description: 'Complete Python programming course.' },
      { title: 'Python OOP Tutorial', channel: 'Corey Schafer', playlist: 'python', duration: '1:35:22', views: '2.1M', likes: '68K', url: 'https://youtube.com', description: 'Object-oriented programming in Python.' },
      { title: 'Python Django Tutorial', channel: 'Traversy Media', playlist: 'python', duration: '1:18:45', views: '1.5M', likes: '48K', url: 'https://youtube.com', description: 'Build web apps with Django.' },
      { title: 'Flask Tutorial', channel: 'Corey Schafer', playlist: 'python', duration: '2:42:18', views: '1.2M', likes: '42K', url: 'https://youtube.com', description: 'Python Flask web framework.' },
      { title: 'Python Data Science Tutorial', channel: 'freeCodeCamp', playlist: 'python', duration: '12:15:40', views: '3.5M', likes: '88K', url: 'https://youtube.com', description: 'Data science with Python.' },
      { title: 'Python Automation Tutorial', channel: 'Tech With Tim', playlist: 'python', duration: '2:28:35', views: '980K', likes: '35K', url: 'https://youtube.com', description: 'Automate tasks with Python.' },
      { title: 'Python FastAPI Tutorial', channel: 'freeCodeCamp', playlist: 'python', duration: '3:45:22', views: '720K', likes: '28K', url: 'https://youtube.com', description: 'Modern Python web APIs.' },
      { title: 'Python Pandas Tutorial', channel: 'Corey Schafer', playlist: 'python', duration: '1:55:18', views: '1.8M', likes: '56K', url: 'https://youtube.com', description: 'Data analysis with Pandas.' },
      { title: 'Python Web Scraping', channel: 'freeCodeCamp', playlist: 'python', duration: '1:42:30', views: '1.1M', likes: '38K', url: 'https://youtube.com', description: 'Web scraping with Python.' },
      { title: 'Python Testing Tutorial', channel: 'Corey Schafer', playlist: 'python', duration: '52:15', views: '620K', likes: '22K', url: 'https://youtube.com', description: 'Unit testing in Python.' },
      { title: 'Python Async Programming', channel: 'Tech With Tim', playlist: 'python', duration: '1:15:40', views: '480K', likes: '18K', url: 'https://youtube.com', description: 'Asynchronous Python programming.' },

      // Data Structures & Algorithms
      { title: 'Data Structures Full Course', channel: 'freeCodeCamp', playlist: 'algorithms', duration: '8:18:52', views: '2.8M', likes: '75K', url: 'https://youtube.com', description: 'Complete DSA course.' },
      { title: 'Algorithms Explained', channel: 'Abdul Bari', playlist: 'algorithms', duration: '5:42:30', views: '1.9M', likes: '58K', url: 'https://youtube.com', description: 'Algorithm design and analysis.' },
      { title: 'LeetCode Solutions', channel: 'NeetCode', playlist: 'algorithms', duration: '45:22', views: '1.2M', likes: '42K', url: 'https://youtube.com', description: 'Top LeetCode problems solved.' },
      { title: 'Dynamic Programming Tutorial', channel: 'Aditya Verma', playlist: 'algorithms', duration: '3:15:40', views: '890K', likes: '32K', url: 'https://youtube.com', description: 'Master dynamic programming.' },
      { title: 'Graph Algorithms', channel: 'William Fiset', playlist: 'algorithms', duration: '4:28:18', views: '720K', likes: '28K', url: 'https://youtube.com', description: 'Complete graph algorithms course.' },
      { title: 'Binary Trees Tutorial', channel: 'mycodeschool', playlist: 'algorithms', duration: '2:35:45', views: '1.5M', likes: '48K', url: 'https://youtube.com', description: 'Binary tree data structure.' },
      { title: 'Sorting Algorithms', channel: 'Reducible', playlist: 'algorithms', duration: '18:42', views: '650K', likes: '25K', url: 'https://youtube.com', description: 'Visualizing sorting algorithms.' },
      { title: 'Recursion Tutorial', channel: 'Aditya Verma', playlist: 'algorithms', duration: '1:45:30', views: '980K', likes: '35K', url: 'https://youtube.com', description: 'Master recursion concepts.' },
      { title: 'System Design Interview', channel: 'Gaurav Sen', playlist: 'algorithms', duration: '2:12:18', views: '1.8M', likes: '56K', url: 'https://youtube.com', description: 'System design fundamentals.' },
      { title: 'Competitive Programming', channel: 'Errichto', playlist: 'algorithms', duration: '1:28:45', views: '420K', likes: '16K', url: 'https://youtube.com', description: 'Competitive programming tips.' },

      // AI & Machine Learning
      { title: 'Machine Learning Full Course', channel: 'freeCodeCamp', playlist: 'ai-ml', duration: '10:05:22', views: '3.2M', likes: '82K', url: 'https://youtube.com', description: 'Complete ML course with Python.' },
      { title: 'Deep Learning Tutorial', channel: 'Sentdex', playlist: 'ai-ml', duration: '6:42:18', views: '1.5M', likes: '48K', url: 'https://youtube.com', description: 'Neural networks and deep learning.' },
      { title: 'TensorFlow Tutorial', channel: 'freeCodeCamp', playlist: 'ai-ml', duration: '7:15:30', views: '1.8M', likes: '55K', url: 'https://youtube.com', description: 'TensorFlow for beginners.' },
      { title: 'PyTorch Tutorial', channel: 'Python Engineer', playlist: 'ai-ml', duration: '5:28:40', views: '1.2M', likes: '42K', url: 'https://youtube.com', description: 'Deep learning with PyTorch.' },
      { title: 'Natural Language Processing', channel: 'freeCodeCamp', playlist: 'ai-ml', duration: '4:35:22', views: '890K', likes: '32K', url: 'https://youtube.com', description: 'NLP with Python.' },
      { title: 'Computer Vision Tutorial', channel: 'Sentdex', playlist: 'ai-ml', duration: '3:45:18', views: '720K', likes: '28K', url: 'https://youtube.com', description: 'Computer vision with OpenCV.' },
      { title: 'ChatGPT API Tutorial', channel: 'Tech With Tim', playlist: 'ai-ml', duration: '1:15:30', views: '1.5M', likes: '52K', url: 'https://youtube.com', description: 'Build AI apps with OpenAI API.' },
      { title: 'LangChain Tutorial', channel: 'freeCodeCamp', playlist: 'ai-ml', duration: '2:42:15', views: '980K', likes: '38K', url: 'https://youtube.com', description: 'AI applications with LangChain.' },

      // DevOps & Cloud
      { title: 'Docker Tutorial for Beginners', channel: 'TechWorld with Nana', playlist: 'devops', duration: '3:10:22', views: '2.1M', likes: '68K', url: 'https://youtube.com', description: 'Complete Docker course.' },
      { title: 'Kubernetes Tutorial', channel: 'TechWorld with Nana', playlist: 'devops', duration: '4:05:18', views: '1.8M', likes: '58K', url: 'https://youtube.com', description: 'Kubernetes from basics to advanced.' },
      { title: 'AWS Tutorial for Beginners', channel: 'freeCodeCamp', playlist: 'devops', duration: '10:28:40', views: '2.5M', likes: '72K', url: 'https://youtube.com', description: 'Complete AWS cloud course.' },
      { title: 'CI/CD Pipeline Tutorial', channel: 'TechWorld with Nana', playlist: 'devops', duration: '2:15:30', views: '890K', likes: '32K', url: 'https://youtube.com', description: 'Build CI/CD pipelines.' },
      { title: 'Linux Tutorial', channel: 'freeCodeCamp', playlist: 'devops', duration: '5:12:18', views: '1.5M', likes: '48K', url: 'https://youtube.com', description: 'Linux for beginners.' },
      { title: 'Git & GitHub Tutorial', channel: 'freeCodeCamp', playlist: 'devops', duration: '1:08:42', views: '3.2M', likes: '85K', url: 'https://youtube.com', description: 'Version control with Git.' },
      { title: 'Terraform Tutorial', channel: 'TechWorld with Nana', playlist: 'devops', duration: '2:45:22', views: '720K', likes: '28K', url: 'https://youtube.com', description: 'Infrastructure as code.' },
      { title: 'Jenkins Tutorial', channel: 'Simplilearn', playlist: 'devops', duration: '1:52:15', views: '620K', likes: '22K', url: 'https://youtube.com', description: 'CI/CD with Jenkins.' },

      // Backend Development
      { title: 'Node.js Full Course', channel: 'freeCodeCamp', playlist: 'backend', duration: '8:16:48', views: '2.8M', likes: '75K', url: 'https://youtube.com', description: 'Complete Node.js course.' },
      { title: 'Express.js Tutorial', channel: 'Traversy Media', playlist: 'backend', duration: '1:42:30', views: '1.5M', likes: '48K', url: 'https://youtube.com', description: 'Build APIs with Express.' },
      { title: 'REST API Tutorial', channel: 'freeCodeCamp', playlist: 'backend', duration: '3:28:18', views: '1.8M', likes: '56K', url: 'https://youtube.com', description: 'RESTful API design.' },
      { title: 'GraphQL Tutorial', channel: 'Ben Awad', playlist: 'backend', duration: '2:15:40', views: '890K', likes: '32K', url: 'https://youtube.com', description: 'GraphQL API development.' },
      { title: 'MongoDB Tutorial', channel: 'Traversy Media', playlist: 'backend', duration: '1:35:22', views: '1.2M', likes: '42K', url: 'https://youtube.com', description: 'NoSQL database with MongoDB.' },
      { title: 'PostgreSQL Tutorial', channel: 'freeCodeCamp', playlist: 'backend', duration: '4:18:52', views: '980K', likes: '35K', url: 'https://youtube.com', description: 'SQL database fundamentals.' },
      { title: 'Authentication Tutorial', channel: 'Web Dev Simplified', playlist: 'backend', duration: '52:15', views: '720K', likes: '28K', url: 'https://youtube.com', description: 'User authentication and security.' },
      { title: 'Microservices Tutorial', channel: 'freeCodeCamp', playlist: 'backend', duration: '5:42:30', views: '1.1M', likes: '38K', url: 'https://youtube.com', description: 'Microservices architecture.' }
    ];

    this.renderVideos();
    this.setupVideoFilters();
  },

  renderVideos(page = 1) {
    const grid = document.getElementById('videoGrid');
    const start = (page - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    const items = this.videos.slice(start, end);
    
    const html = items.map(v => `
      <div class="video-card" data-playlist="${v.playlist}" data-duration="${this.getDurationCategory(v.duration)}">
        <div class="video-thumbnail">
          <div class="video-play-icon"><i class="fas fa-play-circle"></i></div>
          <div class="video-duration-badge">${v.duration}</div>
          <div class="video-playlist-badge">${v.playlist.replace('-', ' ')}</div>
        </div>
        <div class="video-content">
          <h3 class="video-title">${v.title}</h3>
          <p class="video-channel"><i class="fab fa-youtube"></i> ${v.channel}</p>
          <p class="video-description">${v.description}</p>
          <div class="video-stats">
            <span><i class="fas fa-eye"></i> ${v.views}</span>
            <span><i class="fas fa-thumbs-up"></i> ${v.likes}</span>
          </div>
          <div class="video-actions">
            <a href="${v.url}" target="_blank" class="btn-watch">
              <i class="fas fa-play"></i> Watch
            </a>
            <button class="btn-save-video" onclick="TutorialsApp.saveResource('${v.title}', 'video')">
              <i class="far fa-bookmark"></i>
            </button>
          </div>
        </div>
      </div>
    `).join('');

    if (page === 1) {
      grid.innerHTML = html;
    } else {
      grid.insertAdjacentHTML('beforeend', html);
    }

    this.updateLoadMoreButton('videoGrid', page, this.videos.length, 'videos');
  },

  setupVideoFilters() {
    const playlists = [...new Set(this.videos.map(v => v.playlist))];
    const filtersContainer = document.getElementById('playlistFilters');
    
    filtersContainer.innerHTML = `
      <div class="filter-tag active" data-filter="all">All Videos (${this.videos.length})</div>
      ${playlists.map(p => {
        const count = this.videos.filter(v => v.playlist === p).length;
        return `<div class="filter-tag" data-filter="${p}">${p.replace('-', ' ')} (${count})</div>`;
      }).join('')}
    `;

    filtersContainer.querySelectorAll('.filter-tag').forEach(tag => {
      tag.onclick = () => {
        filtersContainer.querySelectorAll('.filter-tag').forEach(t => t.classList.remove('active'));
        tag.classList.add('active');
        
        const filter = tag.dataset.filter;
        document.querySelectorAll('.video-card').forEach(card => {
          if (filter === 'all' || card.dataset.playlist === filter) {
            card.style.display = 'block';
          } else {
            card.style.display = 'none';
          }
        });
      };
    });

    const playlistSelect = document.getElementById('playlistFilter');
    playlistSelect.innerHTML = '<option value="all">All Playlists</option>' + 
      playlists.map(p => `<option value="${p}">${p.replace('-', ' ')}</option>`).join('');

    playlistSelect.onchange = () => this.filterVideos();
    document.getElementById('durationFilter').onchange = () => this.filterVideos();
    document.getElementById('videoSearch').oninput = (e) => {
      const query = e.target.value.toLowerCase();
      document.querySelectorAll('.video-card').forEach(card => {
        card.style.display = card.textContent.toLowerCase().includes(query) ? 'block' : 'none';
      });
    };

    document.getElementById('fetchVideos').onclick = () => {
      StudyPlannerUtils.showNotification('YouTube API integration coming soon!', 'info');
    };
  },

  getDurationCategory(duration) {
    const parts = duration.split(':').map(Number);
    let minutes = 0;
    if (parts.length === 3) minutes = parts[0] * 60 + parts[1];
    else if (parts.length === 2) minutes = parts[0];
    
    if (minutes < 10) return 'short';
    if (minutes < 30) return 'medium';
    return 'long';
  },

  filterVideos() {
    const playlist = document.getElementById('playlistFilter').value;
    const duration = document.getElementById('durationFilter').value;

    document.querySelectorAll('.video-card').forEach(card => {
      const matchPlaylist = playlist === 'all' || card.dataset.playlist === playlist;
      const matchDuration = duration === 'all' || card.dataset.duration === duration;
      card.style.display = matchPlaylist && matchDuration ? 'block' : 'none';
    });
  },

  // Articles Data
  loadArticles() {
    this.articles = [
      // JavaScript
      { title: '10 Modern JavaScript Tricks Every Developer Should Know', source: 'devto', category: 'javascript', author: 'Alex Rivera', readTime: 8, views: '24K', date: '2 days ago', url: 'https://dev.to', excerpt: 'Discover powerful JavaScript techniques that will make your code cleaner and more efficient.', image: 'https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?w=400&h=250&fit=crop' },
      { title: 'Understanding JavaScript Closures Once and For All', source: 'medium', category: 'javascript', author: 'Emma Watson', readTime: 12, views: '18K', date: '3 days ago', url: 'https://medium.com', excerpt: 'A deep dive into one of JavaScript\'s most powerful and misunderstood features.', image: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=400&h=250&fit=crop' },
      { title: 'Async/Await vs Promises: Which Should You Use?', source: 'hashnode', category: 'javascript', author: 'Mike Johnson', readTime: 10, views: '15K', date: '5 days ago', url: 'https://hashnode.com', excerpt: 'Compare async patterns in JavaScript and learn when to use each approach.', image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&h=250&fit=crop' },
      { title: 'ES2024 Features You Need to Know', source: 'devto', category: 'javascript', author: 'Sarah Chen', readTime: 7, views: '22K', date: '1 week ago', url: 'https://dev.to', excerpt: 'Explore the latest JavaScript features landing in 2024.', image: 'https://images.unsplash.com/photo-1593720213428-28a5b9e94613?w=400&h=250&fit=crop' },
      { title: 'JavaScript Performance Optimization Tips', source: 'medium', category: 'javascript', author: 'Ryan Cooper', readTime: 11, views: '19K', date: '2 weeks ago', url: 'https://medium.com', excerpt: 'Boost your JavaScript application performance with these proven techniques.', image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&h=250&fit=crop' },
      { title: 'Functional Programming in JavaScript', source: 'devto', category: 'javascript', author: 'Maya Singh', readTime: 14, views: '17K', date: '2 weeks ago', url: 'https://dev.to', excerpt: 'Learn functional programming concepts and apply them in JavaScript.', image: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=400&h=250&fit=crop' },
      
      // React
      { title: 'React Server Components: A Complete Guide', source: 'medium', category: 'react', author: 'Dan Abramov', readTime: 15, views: '45K', date: '1 day ago', url: 'https://medium.com', excerpt: 'Everything you need to know about React Server Components and how they change the game.', image: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=250&fit=crop' },
      { title: 'Building Scalable React Applications in 2024', source: 'devto', category: 'react', author: 'Lisa Park', readTime: 11, views: '28K', date: '4 days ago', url: 'https://dev.to', excerpt: 'Best practices and architecture patterns for large-scale React apps.', image: 'https://images.unsplash.com/photo-1633356122102-3fe601e05bd2?w=400&h=250&fit=crop' },
      { title: 'React Hooks: Advanced Patterns and Best Practices', source: 'hashnode', category: 'react', author: 'Tom Wilson', readTime: 13, views: '19K', date: '6 days ago', url: 'https://hashnode.com', excerpt: 'Master advanced React Hooks patterns for better component design.', image: 'https://images.unsplash.com/photo-1618477388954-7852f32655ec?w=400&h=250&fit=crop' },
      { title: 'State Management in React: Redux vs Zustand vs Context', source: 'medium', category: 'react', author: 'Nina Patel', readTime: 14, views: '31K', date: '1 week ago', url: 'https://medium.com', excerpt: 'Compare popular state management solutions and choose the right one.', image: 'https://images.unsplash.com/photo-1587620962725-abab7fe55159?w=400&h=250&fit=crop' },
      { title: 'Next.js 14: What\'s New and Exciting', source: 'devto', category: 'react', author: 'Oliver James', readTime: 10, views: '33K', date: '1 week ago', url: 'https://dev.to', excerpt: 'Explore the latest features in Next.js 14 and how to use them.', image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400&h=250&fit=crop' },
      { title: 'React Testing Library: Complete Guide', source: 'hashnode', category: 'react', author: 'Sophie Chen', readTime: 16, views: '21K', date: '2 weeks ago', url: 'https://hashnode.com', excerpt: 'Master React testing with this comprehensive guide.', image: 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=400&h=250&fit=crop' },
      
      // Python
      { title: 'Python Type Hints: A Practical Guide', source: 'devto', category: 'python', author: 'James Lee', readTime: 9, views: '16K', date: '2 days ago', url: 'https://dev.to', excerpt: 'Learn how to use Python type hints to write more maintainable code.', image: 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=400&h=250&fit=crop' },
      { title: 'FastAPI vs Flask: Which Framework to Choose?', source: 'medium', category: 'python', author: 'Rachel Green', readTime: 10, views: '21K', date: '5 days ago', url: 'https://medium.com', excerpt: 'A comprehensive comparison of two popular Python web frameworks.', image: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=400&h=250&fit=crop' },
      { title: 'Mastering Python Decorators', source: 'hashnode', category: 'python', author: 'Kevin Zhang', readTime: 11, views: '14K', date: '1 week ago', url: 'https://hashnode.com', excerpt: 'Deep dive into Python decorators with practical examples.', image: 'https://images.unsplash.com/photo-1649180556628-9ba704115795?w=400&h=250&fit=crop' },
      { title: 'Python Async Programming: From Basics to Advanced', source: 'devto', category: 'python', author: 'Maria Garcia', readTime: 16, views: '19K', date: '1 week ago', url: 'https://dev.to', excerpt: 'Master asynchronous programming in Python with asyncio.', image: 'https://images.unsplash.com/photo-1587620962725-abab7fe55159?w=400&h=250&fit=crop' },
      { title: 'Django vs FastAPI: Modern Python Web Development', source: 'medium', category: 'python', author: 'Ahmed Hassan', readTime: 13, views: '25K', date: '2 weeks ago', url: 'https://medium.com', excerpt: 'Compare Django and FastAPI for your next Python project.', image: 'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=400&h=250&fit=crop' },
      { title: 'Python Data Classes: A Complete Guide', source: 'hashnode', category: 'python', author: 'Linda Park', readTime: 8, views: '12K', date: '2 weeks ago', url: 'https://hashnode.com', excerpt: 'Simplify your Python code with data classes.', image: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=400&h=250&fit=crop' },
      
      // Web Development
      { title: 'CSS Grid vs Flexbox: When to Use Each', source: 'medium', category: 'webdev', author: 'Chris Anderson', readTime: 8, views: '27K', date: '3 days ago', url: 'https://medium.com', excerpt: 'Learn the differences and use cases for CSS Grid and Flexbox.', image: 'https://images.unsplash.com/photo-1507721999472-8ed4421c4af2?w=400&h=250&fit=crop' },
      { title: 'Building Progressive Web Apps in 2024', source: 'devto', category: 'webdev', author: 'Sophie Turner', readTime: 12, views: '23K', date: '4 days ago', url: 'https://dev.to', excerpt: 'Complete guide to creating modern PWAs with offline support.', image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=250&fit=crop' },
      { title: 'Web Performance Optimization: The Ultimate Guide', source: 'hashnode', category: 'webdev', author: 'David Kim', readTime: 18, views: '35K', date: '6 days ago', url: 'https://hashnode.com', excerpt: 'Techniques to make your websites blazingly fast.', image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=250&fit=crop' },
      { title: 'Responsive Design Patterns for 2024', source: 'medium', category: 'webdev', author: 'Anna Schmidt', readTime: 10, views: '20K', date: '1 week ago', url: 'https://medium.com', excerpt: 'Modern approaches to building responsive web interfaces.', image: 'https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?w=400&h=250&fit=crop' },
      { title: 'Modern CSS Features You Should Be Using', source: 'devto', category: 'webdev', author: 'Tyler Brooks', readTime: 9, views: '18K', date: '1 week ago', url: 'https://dev.to', excerpt: 'Discover the latest CSS features that will improve your workflow.', image: 'https://images.unsplash.com/photo-1523437113738-bbd3cc89fb19?w=400&h=250&fit=crop' },
      { title: 'Tailwind CSS vs Bootstrap: Which to Choose?', source: 'hashnode', category: 'webdev', author: 'Grace Liu', readTime: 11, views: '22K', date: '2 weeks ago', url: 'https://hashnode.com', excerpt: 'Compare two popular CSS frameworks for your next project.', image: 'https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=400&h=250&fit=crop' },
      
      // AI/ML
      { title: 'Getting Started with Machine Learning in Python', source: 'devto', category: 'ai', author: 'Robert Chen', readTime: 14, views: '32K', date: '2 days ago', url: 'https://dev.to', excerpt: 'A beginner-friendly introduction to ML with practical examples.', image: 'https://images.unsplash.com/photo-1555255707-c07966088b7b?w=400&h=250&fit=crop' },
      { title: 'Building AI Applications with OpenAI API', source: 'medium', category: 'ai', author: 'Emily Brown', readTime: 13, views: '41K', date: '3 days ago', url: 'https://medium.com', excerpt: 'Learn how to integrate AI capabilities into your applications.', image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=250&fit=crop' },
      { title: 'Understanding Neural Networks from Scratch', source: 'hashnode', category: 'ai', author: 'Michael Wong', readTime: 20, views: '26K', date: '5 days ago', url: 'https://hashnode.com', excerpt: 'Build neural networks from first principles to understand how they work.', image: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=400&h=250&fit=crop' },
      { title: 'LangChain Tutorial: Building AI-Powered Apps', source: 'devto', category: 'ai', author: 'Jessica Liu', readTime: 15, views: '38K', date: '1 week ago', url: 'https://dev.to', excerpt: 'Create powerful AI applications using LangChain framework.', image: 'https://images.unsplash.com/photo-1655720828018-edd2daec9349?w=400&h=250&fit=crop' },
      { title: 'TensorFlow vs PyTorch: Which to Learn First?', source: 'medium', category: 'ai', author: 'Daniel Park', readTime: 12, views: '29K', date: '1 week ago', url: 'https://medium.com', excerpt: 'Compare the two leading deep learning frameworks.', image: 'https://images.unsplash.com/photo-1591453089816-0fbb971b454c?w=400&h=250&fit=crop' },
      { title: 'Prompt Engineering: Best Practices for AI', source: 'hashnode', category: 'ai', author: 'Sophia Martinez', readTime: 10, views: '34K', date: '2 weeks ago', url: 'https://hashnode.com', excerpt: 'Master the art of crafting effective AI prompts.', image: 'https://images.unsplash.com/photo-1676277791608-ac5c30f8b1b7?w=400&h=250&fit=crop' },
      
      // Career
      { title: 'How I Got My First Developer Job in 6 Months', source: 'medium', category: 'career', author: 'John Smith', readTime: 9, views: '52K', date: '1 day ago', url: 'https://medium.com', excerpt: 'My journey from bootcamp graduate to employed developer.', image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&h=250&fit=crop' },
      { title: 'Salary Negotiation Tips for Software Engineers', source: 'devto', category: 'career', author: 'Amanda Taylor', readTime: 11, views: '44K', date: '4 days ago', url: 'https://dev.to', excerpt: 'Strategies to negotiate better compensation packages.', image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400&h=250&fit=crop' },
      { title: 'Remote Work Best Practices for Developers', source: 'hashnode', category: 'career', author: 'Carlos Rodriguez', readTime: 8, views: '29K', date: '6 days ago', url: 'https://hashnode.com', excerpt: 'Tips for staying productive and balanced while working remotely.', image: 'https://images.unsplash.com/photo-1588196749597-9ff075ee6b5b?w=400&h=250&fit=crop' },
      { title: 'Building a Strong Developer Portfolio', source: 'medium', category: 'career', author: 'Laura Martinez', readTime: 10, views: '36K', date: '1 week ago', url: 'https://medium.com', excerpt: 'What to include in your portfolio to stand out to employers.', image: 'https://images.unsplash.com/photo-1487017159836-4e23ece2e4cf?w=400&h=250&fit=crop' },
      { title: 'Technical Interview Preparation Guide', source: 'devto', category: 'career', author: 'Marcus Johnson', readTime: 17, views: '48K', date: '1 week ago', url: 'https://dev.to', excerpt: 'Everything you need to ace your next technical interview.', image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=250&fit=crop' },
      { title: 'Freelancing as a Developer: Complete Guide', source: 'hashnode', category: 'career', author: 'Isabella Wong', readTime: 14, views: '31K', date: '2 weeks ago', url: 'https://hashnode.com', excerpt: 'Start your freelance developer career with confidence.', image: 'https://images.unsplash.com/photo-1556761175-4b46a572b786?w=400&h=250&fit=crop' },
      
      // TypeScript
      { title: 'TypeScript Best Practices for 2024', source: 'medium', category: 'javascript', author: 'Nathan Gray', readTime: 12, views: '27K', date: '3 days ago', url: 'https://medium.com', excerpt: 'Write better TypeScript code with these proven practices.', image: 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=400&h=250&fit=crop' },
      { title: 'Migrating from JavaScript to TypeScript', source: 'devto', category: 'javascript', author: 'Victoria Lee', readTime: 15, views: '23K', date: '1 week ago', url: 'https://dev.to', excerpt: 'Step-by-step guide to migrating your JavaScript project to TypeScript.', image: 'https://images.unsplash.com/photo-1555099962-4199c345e5dd?w=400&h=250&fit=crop' },
      
      // Node.js
      { title: 'Building RESTful APIs with Node.js and Express', source: 'hashnode', category: 'webdev', author: 'Brandon Scott', readTime: 13, views: '26K', date: '5 days ago', url: 'https://hashnode.com', excerpt: 'Create robust APIs with Node.js and Express framework.', image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&h=250&fit=crop' },
      { title: 'Node.js Performance Optimization Techniques', source: 'medium', category: 'webdev', author: 'Eric Thompson', readTime: 14, views: '21K', date: '1 week ago', url: 'https://medium.com', excerpt: 'Boost your Node.js application performance.', image: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=400&h=250&fit=crop' },
      
      // DevOps
      { title: 'Docker for Developers: A Practical Guide', source: 'devto', category: 'webdev', author: 'Samuel Kim', readTime: 16, views: '30K', date: '4 days ago', url: 'https://dev.to', excerpt: 'Master Docker containerization for your development workflow.', image: 'https://images.unsplash.com/photo-1605745341112-85968b19335b?w=400&h=250&fit=crop' },
      { title: 'CI/CD Pipeline Best Practices', source: 'hashnode', category: 'webdev', author: 'Rachel Adams', readTime: 11, views: '24K', date: '1 week ago', url: 'https://hashnode.com', excerpt: 'Build efficient CI/CD pipelines for your projects.', image: 'https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?w=400&h=250&fit=crop' },
      
      // Mobile
      { title: 'React Native vs Flutter: Which to Choose in 2024?', source: 'medium', category: 'webdev', author: 'Jennifer White', readTime: 13, views: '35K', date: '2 days ago', url: 'https://medium.com', excerpt: 'Compare the top cross-platform mobile frameworks.', image: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&h=250&fit=crop' },
      { title: 'Building Your First Mobile App with React Native', source: 'devto', category: 'webdev', author: 'Kevin Brown', readTime: 18, views: '28K', date: '6 days ago', url: 'https://dev.to', excerpt: 'Complete guide to creating mobile apps with React Native.', image: 'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=400&h=250&fit=crop' },
      
      // freeCodeCamp
      { title: 'Learn JavaScript - Full Course for Beginners', source: 'freecodecamp', category: 'javascript', author: 'Quincy Larson', readTime: 25, views: '120K', date: '1 day ago', url: 'https://freecodecamp.org', excerpt: 'Complete JavaScript course from basics to advanced concepts.', image: 'https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?w=400&h=250&fit=crop' },
      { title: 'How to Build a Full Stack App with React and Node', source: 'freecodecamp', category: 'webdev', author: 'Beau Carnes', readTime: 30, views: '95K', date: '3 days ago', url: 'https://freecodecamp.org', excerpt: 'Build a complete full-stack application from scratch.', image: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=250&fit=crop' },
      { title: 'Python for Data Science - Complete Tutorial', source: 'freecodecamp', category: 'python', author: 'Dr. Angela Yu', readTime: 28, views: '88K', date: '5 days ago', url: 'https://freecodecamp.org', excerpt: 'Master Python for data analysis and machine learning.', image: 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=400&h=250&fit=crop' },
      { title: 'Git and GitHub for Beginners - Crash Course', source: 'freecodecamp', category: 'webdev', author: 'Gwen Faraday', readTime: 12, views: '76K', date: '1 week ago', url: 'https://freecodecamp.org', excerpt: 'Learn version control with Git and GitHub.', image: 'https://images.unsplash.com/photo-1556075798-4825dfaaf498?w=400&h=250&fit=crop' },
      { title: 'Responsive Web Design Certification', source: 'freecodecamp', category: 'css', author: 'freeCodeCamp Team', readTime: 20, views: '110K', date: '2 weeks ago', url: 'https://freecodecamp.org', excerpt: 'Complete certification course for responsive web design.', image: 'https://images.unsplash.com/photo-1507721999472-8ed4421c4af2?w=400&h=250&fit=crop' },
      
      // Smashing Magazine
      { title: 'Modern CSS Solutions for Old CSS Problems', source: 'smashing', category: 'css', author: 'Stephanie Eckles', readTime: 15, views: '42K', date: '2 days ago', url: 'https://smashingmagazine.com', excerpt: 'Solve common CSS challenges with modern techniques.', image: 'https://images.unsplash.com/photo-1523437113738-bbd3cc89fb19?w=400&h=250&fit=crop' },
      { title: 'Designing Better Mobile Navigation', source: 'smashing', category: 'webdev', author: 'Vitaly Friedman', readTime: 18, views: '38K', date: '4 days ago', url: 'https://smashingmagazine.com', excerpt: 'Best practices for mobile navigation patterns.', image: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&h=250&fit=crop' },
      { title: 'A Complete Guide to CSS Grid', source: 'smashing', category: 'css', author: 'Rachel Andrew', readTime: 22, views: '55K', date: '1 week ago', url: 'https://smashingmagazine.com', excerpt: 'Everything you need to know about CSS Grid layout.', image: 'https://images.unsplash.com/photo-1507721999472-8ed4421c4af2?w=400&h=250&fit=crop' },
      { title: 'Accessibility in JavaScript Applications', source: 'smashing', category: 'javascript', author: 'Sara Soueidan', readTime: 16, views: '31K', date: '1 week ago', url: 'https://smashingmagazine.com', excerpt: 'Make your JavaScript apps accessible to everyone.', image: 'https://images.unsplash.com/photo-1593720213428-28a5b9e94613?w=400&h=250&fit=crop' },
      { title: 'Performance Optimization Techniques', source: 'smashing', category: 'webdev', author: 'Addy Osmani', readTime: 20, views: '47K', date: '2 weeks ago', url: 'https://smashingmagazine.com', excerpt: 'Advanced techniques for optimizing web performance.', image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=250&fit=crop' },
      
      // More variety
      { title: 'Understanding Webpack 5: A Complete Guide', source: 'medium', category: 'webdev', author: 'Sean Larkin', readTime: 17, views: '29K', date: '3 days ago', url: 'https://medium.com', excerpt: 'Master Webpack 5 configuration and optimization.', image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&h=250&fit=crop' },
      { title: 'GraphQL vs REST: Making the Right Choice', source: 'devto', category: 'webdev', author: 'Ben Halpern', readTime: 12, views: '33K', date: '4 days ago', url: 'https://dev.to', excerpt: 'Compare GraphQL and REST APIs for your next project.', image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&h=250&fit=crop' },
      { title: 'Vue 3 Composition API Deep Dive', source: 'hashnode', category: 'javascript', author: 'Evan You', readTime: 14, views: '27K', date: '5 days ago', url: 'https://hashnode.com', excerpt: 'Explore Vue 3 Composition API with practical examples.', image: 'https://images.unsplash.com/photo-1633356122102-3fe601e05bd2?w=400&h=250&fit=crop' },
      { title: 'Svelte for Beginners: Getting Started', source: 'freecodecamp', category: 'javascript', author: 'Rich Harris', readTime: 16, views: '41K', date: '6 days ago', url: 'https://freecodecamp.org', excerpt: 'Learn Svelte, the radical new approach to building UIs.', image: 'https://images.unsplash.com/photo-1618477388954-7852f32655ec?w=400&h=250&fit=crop' },
      { title: 'Microservices Architecture Explained', source: 'medium', category: 'webdev', author: 'Martin Fowler', readTime: 19, views: '52K', date: '1 week ago', url: 'https://medium.com', excerpt: 'Understanding microservices architecture patterns.', image: 'https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=400&h=250&fit=crop' },
      { title: 'Deno vs Node.js: The Future of JavaScript Runtime', source: 'devto', category: 'nodejs', author: 'Ryan Dahl', readTime: 13, views: '38K', date: '1 week ago', url: 'https://dev.to', excerpt: 'Compare Deno and Node.js for server-side JavaScript.', image: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=400&h=250&fit=crop' },
      { title: 'Advanced TypeScript Patterns', source: 'smashing', category: 'javascript', author: 'Basarat Ali Syed', readTime: 21, views: '34K', date: '2 weeks ago', url: 'https://smashingmagazine.com', excerpt: 'Master advanced TypeScript patterns and techniques.', image: 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=400&h=250&fit=crop' },
      { title: 'Building Serverless Applications with AWS Lambda', source: 'hashnode', category: 'webdev', author: 'Yan Cui', readTime: 18, views: '31K', date: '2 weeks ago', url: 'https://hashnode.com', excerpt: 'Create scalable serverless apps with AWS Lambda.', image: 'https://images.unsplash.com/photo-1605745341112-85968b19335b?w=400&h=250&fit=crop' },
      { title: 'CSS Animation Techniques', source: 'smashing', category: 'css', author: 'Val Head', readTime: 14, views: '36K', date: '3 weeks ago', url: 'https://smashingmagazine.com', excerpt: 'Create smooth and performant CSS animations.', image: 'https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?w=400&h=250&fit=crop' },
      { title: 'MongoDB Best Practices for Production', source: 'medium', category: 'webdev', author: 'Eliot Horowitz', readTime: 16, views: '28K', date: '3 weeks ago', url: 'https://medium.com', excerpt: 'Optimize MongoDB for production environments.', image: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=400&h=250&fit=crop' },
      { title: 'Introduction to WebAssembly', source: 'freecodecamp', category: 'webdev', author: 'Lin Clark', readTime: 20, views: '45K', date: '3 weeks ago', url: 'https://freecodecamp.org', excerpt: 'Learn WebAssembly and its use cases for web development.', image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&h=250&fit=crop' },
      { title: 'Kubernetes for Developers', source: 'devto', category: 'webdev', author: 'Kelsey Hightower', readTime: 22, views: '40K', date: '3 weeks ago', url: 'https://dev.to', excerpt: 'Deploy and manage containerized applications with Kubernetes.', image: 'https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?w=400&h=250&fit=crop' },
      { title: 'Web Security Fundamentals', source: 'smashing', category: 'webdev', author: 'Troy Hunt', readTime: 17, views: '49K', date: '1 month ago', url: 'https://smashingmagazine.com', excerpt: 'Essential web security practices every developer should know.', image: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=400&h=250&fit=crop' },
      { title: 'Progressive Enhancement in Modern Web Apps', source: 'hashnode', category: 'webdev', author: 'Jeremy Keith', readTime: 13, views: '26K', date: '1 month ago', url: 'https://hashnode.com', excerpt: 'Build resilient web applications with progressive enhancement.', image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400&h=250&fit=crop' },
      { title: 'Jamstack Architecture Explained', source: 'medium', category: 'webdev', author: 'Matt Biilmann', readTime: 15, views: '37K', date: '1 month ago', url: 'https://medium.com', excerpt: 'Understanding the Jamstack architecture and its benefits.', image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=250&fit=crop' },
      { title: 'Testing JavaScript Applications', source: 'freecodecamp', category: 'javascript', author: 'Kent C. Dodds', readTime: 24, views: '58K', date: '1 month ago', url: 'https://freecodecamp.org', excerpt: 'Comprehensive guide to testing JavaScript applications.', image: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=400&h=250&fit=crop' }
    ];

    this.renderArticles();
    this.setupArticleFilters();
    this.setupArticlesSlider();
  },

  setupArticlesSlider() {
    const slider = document.getElementById('featuredSlider');
    if (!slider) return;

    const getRandomArticles = () => {
      const shuffled = [...this.articles].sort(() => 0.5 - Math.random());
      return shuffled.slice(0, 5);
    };

    const featuredArticles = getRandomArticles();
    const dotsContainer = document.getElementById('sliderDots');
    let currentSlide = 0;

    const renderSlides = (articles) => {
      slider.innerHTML = articles.map((article, i) => `
        <div class="slider-slide ${i === 0 ? 'active' : ''}" style="background-image: url('${article.image}');">
          <div class="slider-overlay"></div>
          <div class="slider-content">
            <div class="slider-meta" style="color: #ffffff !important;">
              <span class="slider-badge" style="color: #ffffff !important;"><i class="fas fa-fire"></i> Trending</span>
              <span class="slider-date" style="color: #ffffff !important; text-shadow: 0 2px 6px rgba(0,0,0,0.8);">${article.date}</span>
            </div>
            <h2 style="color: #ffffff !important; text-shadow: 0 3px 10px rgba(0,0,0,0.9);">${article.title}</h2>
            <p style="color: #ffffff !important; text-shadow: 0 2px 6px rgba(0,0,0,0.8);">${article.excerpt}</p>
            <div class="slider-author" style="color: #ffffff !important;">
              <div class="author-avatar" style="color: #ffffff !important;"><i class="fas fa-user-circle"></i></div>
              <div class="author-info" style="color: #ffffff !important;">
                <div class="author-name" style="color: #ffffff !important; text-shadow: 0 2px 6px rgba(0,0,0,0.8);">${article.author}</div>
                <div class="author-stats" style="color: #ffffff !important; text-shadow: 0 2px 6px rgba(0,0,0,0.8);">${article.readTime} min read • ${article.views} views</div>
              </div>
            </div>
            <a href="${article.url}" target="_blank" class="btn-read-slider">Read Article <i class="fas fa-arrow-right"></i></a>
          </div>
        </div>
      `).join('');

      dotsContainer.innerHTML = articles.map((_, i) => 
        `<div class="slider-dot ${i === 0 ? 'active' : ''}"></div>`
      ).join('');

      document.querySelectorAll('.slider-dot').forEach((dot, i) => {
        dot.onclick = () => updateSlide(i);
      });
    };

    renderSlides(featuredArticles);

    const updateSlide = (index) => {
      document.querySelectorAll('.slider-slide').forEach((s, i) => {
        s.classList.toggle('active', i === index);
      });
      document.querySelectorAll('.slider-dot').forEach((d, i) => {
        d.classList.toggle('active', i === index);
      });
      currentSlide = index;
    };

    document.getElementById('sliderPrev').onclick = () => {
      currentSlide = (currentSlide - 1 + 5) % 5;
      updateSlide(currentSlide);
    };

    document.getElementById('sliderNext').onclick = () => {
      currentSlide = (currentSlide + 1) % 5;
      updateSlide(currentSlide);
    };

    // Pause when not visible
    const startSlideshow = () => {
      this.slideshowIntervals.articles = setInterval(() => {
        currentSlide = (currentSlide + 1) % 5;
        updateSlide(currentSlide);
      }, 6000);
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          startSlideshow();
        } else {
          clearInterval(this.slideshowIntervals.articles);
        }
      });
    }, { threshold: 0.1 });

    const sliderSection = document.querySelector('.featured-articles-slider');
    if (sliderSection) observer.observe(sliderSection);
  },

  renderArticles() {
    const container = document.getElementById('articlesContainer');
    if (!container) return;
    
    container.innerHTML = this.articles.map(article => `
      <article class="article-card">
        <div class="article-image" style="background-image: url('${article.image}');"></div>
        <div class="article-content">
          <div class="article-source-badge ${article.source}">
            <i class="fab fa-${article.source === 'devto' ? 'dev' : article.source === 'medium' ? 'medium' : 'hashtag'}"></i>
            ${article.source}
          </div>
          <h3 class="article-title">${article.title}</h3>
          <p class="article-excerpt">${article.excerpt}</p>
          <div class="article-meta">
            <div class="article-author">
              <i class="fas fa-user-circle"></i>
              <span>${article.author}</span>
            </div>
            <div class="article-stats">
              <span><i class="far fa-clock"></i> ${article.readTime} min</span>
              <span><i class="far fa-eye"></i> ${article.views}</span>
              <span><i class="far fa-calendar"></i> ${article.date}</span>
            </div>
          </div>
          <div class="article-footer">
            <a href="${article.url}" target="_blank" class="btn-read-article">
              Read More <i class="fas fa-arrow-right"></i>
            </a>
            <button class="btn-save-article" onclick="TutorialsApp.saveResource('${article.title}', 'article')">
              <i class="far fa-bookmark"></i>
            </button>
          </div>
        </div>
      </article>
    `).join('');
  },

  setupArticleFilters() {
    const sourceTabs = document.querySelectorAll('.source-tab');
    sourceTabs.forEach(tab => {
      tab.onclick = () => {
        sourceTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        const source = tab.dataset.source;
        document.querySelectorAll('.article-card').forEach(card => {
          const badge = card.querySelector('.article-source-badge');
          if (source === 'all' || badge.classList.contains(source)) {
            card.style.display = 'block';
          } else {
            card.style.display = 'none';
          }
        });
      };
    });

    document.getElementById('articleSearch').oninput = (e) => {
      const query = e.target.value.toLowerCase();
      document.querySelectorAll('.article-card').forEach(card => {
        card.style.display = card.textContent.toLowerCase().includes(query) ? 'block' : 'none';
      });
    };

    document.getElementById('articleCategory').onchange = (e) => {
      const category = e.target.value;
      const filtered = category === 'all' ? this.articles : this.articles.filter(a => a.category === category);
      document.getElementById('articlesContainer').innerHTML = filtered.map(article => `
        <article class="article-card">
          <div class="article-image" style="background-image: url('${article.image}');"></div>
          <div class="article-content">
            <div class="article-source-badge ${article.source}">
              <i class="fab fa-${article.source === 'devto' ? 'dev' : article.source === 'medium' ? 'medium' : 'hashtag'}"></i>
              ${article.source}
            </div>
            <h3 class="article-title">${article.title}</h3>
            <p class="article-excerpt">${article.excerpt}</p>
            <div class="article-meta">
              <div class="article-author">
                <i class="fas fa-user-circle"></i>
                <span>${article.author}</span>
              </div>
              <div class="article-stats">
                <span><i class="far fa-clock"></i> ${article.readTime} min</span>
                <span><i class="far fa-eye"></i> ${article.views}</span>
                <span><i class="far fa-calendar"></i> ${article.date}</span>
              </div>
            </div>
            <div class="article-footer">
              <a href="${article.url}" target="_blank" class="btn-read-article">
                Read More <i class="fas fa-arrow-right"></i>
              </a>
              <button class="btn-save-article" onclick="TutorialsApp.saveResource('${article.title}', 'article')">
                <i class="far fa-bookmark"></i>
              </button>
            </div>
          </div>
        </article>
      `).join('');
    };
  },

  // Save/Remove Resources
  saveResource(title, type) {
    const existing = this.savedResources.find(r => r.title === title);
    if (existing) {
      StudyPlannerUtils.showNotification('Already saved!', 'info');
      return;
    }

    this.savedResources.push({ title, type, date: new Date().toISOString() });
    localStorage.setItem('tutorials_saved', JSON.stringify(this.savedResources));
    this.renderSavedList();
    StudyPlannerUtils.showNotification('Saved successfully!', 'success');
  },

  removeResource(title) {
    this.savedResources = this.savedResources.filter(r => r.title !== title);
    localStorage.setItem('tutorials_saved', JSON.stringify(this.savedResources));
    this.renderSavedList();
    StudyPlannerUtils.showNotification('Removed from saved', 'success');
  },

  loadSavedResources() {
    const saved = localStorage.getItem('tutorials_saved');
    this.savedResources = saved ? JSON.parse(saved) : [];
    this.renderSavedList();
  },

  renderSavedList() {
    const list = document.getElementById('savedList');
    
    if (this.savedResources.length === 0) {
      list.innerHTML = '<div class="empty-saved"><i class="fas fa-bookmark"></i><p>No saved resources yet</p><p style="font-size:0.8rem;margin-top:4px;">Save videos, channels, resources, and articles to access them later</p></div>';
      this.updateSavedStats();
      return;
    }

    list.innerHTML = this.savedResources.map(r => {
      const icons = {
        video: 'fa-video',
        channel: 'fa-youtube',
        resource: 'fa-book',
        article: 'fa-newspaper'
      };
      const date = new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      return `
        <div class="saved-item" data-type="${r.type}" data-title="${r.title.toLowerCase()}">
          <div class="saved-item-icon ${r.type}">
            <i class="fas ${icons[r.type]}"></i>
          </div>
          <div class="saved-item-info">
            <h4 class="saved-item-title">${r.title}</h4>
            <div class="saved-item-meta">
              <span class="saved-item-type">${r.type}</span>
              <span class="saved-item-date"><i class="far fa-calendar"></i> ${date}</span>
            </div>
          </div>
          <div class="saved-item-actions">
            <button class="btn-action remove" onclick="TutorialsApp.removeResource('${r.title.replace(/'/g, "\\'")}')"
              title="Remove">
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>
      `;
    }).join('');
    
    this.updateSavedStats();
  },

  updateSavedStats() {
    const total = this.savedResources.length;
    const videos = this.savedResources.filter(r => r.type === 'video').length;
    const channels = this.savedResources.filter(r => r.type === 'channel').length;
    
    document.getElementById('totalSaved').textContent = total;
    document.getElementById('videosSaved').textContent = videos;
    document.getElementById('channelsSaved').textContent = channels;
  },

  setupSavedFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
      btn.onclick = () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        const type = btn.dataset.type;
        document.querySelectorAll('.saved-item').forEach(item => {
          if (type === 'all' || item.dataset.type === type) {
            item.style.display = 'flex';
          } else {
            item.style.display = 'none';
          }
        });
      };
    });

    document.getElementById('savedSearch').oninput = (e) => {
      const query = e.target.value.toLowerCase();
      document.querySelectorAll('.saved-item').forEach(item => {
        item.style.display = item.dataset.title.includes(query) ? 'flex' : 'none';
      });
    };

    document.getElementById('exportSaved').onclick = () => {
      if (this.savedResources.length === 0) {
        StudyPlannerUtils.showNotification('No saved resources to export', 'info');
        return;
      }
      
      const data = JSON.stringify(this.savedResources, null, 2);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `saved-resources-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      StudyPlannerUtils.showNotification('Exported successfully!', 'success');
    };
  },

  // Load More Button Helper
  updateLoadMoreButton(gridId, currentPage, totalItems, type) {
    const grid = document.getElementById(gridId);
    const container = grid.parentElement;
    let btnContainer = container.querySelector('.load-more-container');
    
    if (!btnContainer) {
      btnContainer = document.createElement('div');
      btnContainer.className = 'load-more-container';
      container.appendChild(btnContainer);
    }
    
    const hasMore = currentPage * ITEMS_PER_PAGE < totalItems;
    
    if (hasMore) {
      const remaining = totalItems - (currentPage * ITEMS_PER_PAGE);
      btnContainer.innerHTML = `
        <button class="load-more-btn" onclick="TutorialsApp.loadMore('${type}')">
          <i class="fas fa-plus"></i> Load More (${Math.min(remaining, ITEMS_PER_PAGE)} of ${remaining})
        </button>
      `;
    } else {
      btnContainer.innerHTML = '';
    }
  },

  loadMore(type) {
    this.pagination[type].page++;
    const methodName = 'render' + type.charAt(0).toUpperCase() + type.slice(1);
    this[methodName](this.pagination[type].page);
  },

  // API Integration
  async fetchArticlesFromAPIs() {
    const btn = document.getElementById('fetchArticlesBtn');
    const originalHTML = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Fetching...';
    btn.disabled = true;

    try {
      const [devto, hashnode] = await Promise.all([
        APIService.fetchDevToArticles('javascript'),
        APIService.fetchHashnodeArticles('javascript')
      ]);
      
      const newArticles = [];
      
      if (devto.length) {
        newArticles.push(...devto.map(a => ({
          title: a.title,
          source: 'devto',
          category: a.tag_list[0] || 'webdev',
          author: a.user.name,
          readTime: a.reading_time_minutes,
          views: `${Math.floor(a.public_reactions_count / 10)}K`,
          date: new Date(a.published_at).toLocaleDateString(),
          url: a.url,
          excerpt: a.description || a.title,
          image: a.cover_image || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&h=250&fit=crop'
        })));
      }
      
      if (hashnode.length) {
        newArticles.push(...hashnode.map(edge => {
          const a = edge.node;
          return {
            title: a.title,
            source: 'hashnode',
            category: 'webdev',
            author: a.author.name,
            readTime: a.readTime || 5,
            views: '0',
            date: new Date(a.dateAdded).toLocaleDateString(),
            url: `https://hashnode.com/post/${a.slug}`,
            excerpt: a.brief,
            image: a.coverImage || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&h=250&fit=crop'
          };
        }));
      }
      
      if (newArticles.length) {
        this.articles = [...newArticles, ...this.articles];
        this.renderArticles();
        StudyPlannerUtils.showNotification(`Fetched ${newArticles.length} new articles!`, 'success');
      } else {
        StudyPlannerUtils.showNotification('No new articles found', 'info');
      }
    } catch (error) {
      StudyPlannerUtils.showNotification('Failed to fetch articles', 'error');
    } finally {
      btn.innerHTML = originalHTML;
      btn.disabled = false;
    }
  },

  async fetchYouTubeChannels() {
    const btn = document.getElementById('fetchChannelsBtn');
    const originalHTML = btn.innerHTML;
    
    try {
      if (!APIService.keys.youtube) {
        APIKeyModal.show('youtube', async () => {
          StudyPlannerUtils.showNotification('API key saved! Click Fetch again.', 'success');
        });
        return;
      }
      
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Fetching...';
      btn.disabled = true;
      
      const channels = await APIService.fetchYouTubeChannels('programming tutorial');
      
      if (channels.length) {
        const newChannels = channels.map(c => ({
          name: c.snippet.channelTitle,
          subscribers: 'N/A',
          tags: ['programming'],
          url: `https://youtube.com/channel/${c.snippet.channelId}`,
          description: c.snippet.description.substring(0, 100)
        }));
        
        this.channels = [...newChannels, ...this.channels];
        this.renderChannels();
        StudyPlannerUtils.showNotification(`Fetched ${channels.length} channels!`, 'success');
      }
    } catch (error) {
      if (error.message === 'API_KEY_REQUIRED') {
        APIKeyModal.show('youtube', () => {
          StudyPlannerUtils.showNotification('API key saved!', 'success');
        });
      } else {
        StudyPlannerUtils.showNotification('Failed to fetch channels', 'error');
      }
    } finally {
      btn.innerHTML = originalHTML;
      btn.disabled = false;
    }
  },

  async fetchYouTubeVideos() {
    const btn = document.getElementById('fetchVideos');
    if (!btn) return;
    
    const originalHTML = btn.innerHTML;
    
    try {
      if (!APIService.keys.youtube) {
        APIKeyModal.show('youtube', () => {
          StudyPlannerUtils.showNotification('API key saved! Click Fetch again.', 'success');
        });
        return;
      }
      
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Fetching...';
      btn.disabled = true;
      
      const videos = await APIService.fetchYouTubeVideos('programming tutorial');
      
      if (videos.length) {
        const newVideos = videos.map(v => ({
          title: v.snippet.title,
          channel: v.snippet.channelTitle,
          playlist: 'api-fetched',
          duration: 'N/A',
          views: 'N/A',
          likes: 'N/A',
          url: `https://youtube.com/watch?v=${v.id.videoId}`,
          description: v.snippet.description.substring(0, 100)
        }));
        
        this.videos = [...newVideos, ...this.videos];
        this.renderVideos();
        StudyPlannerUtils.showNotification(`Fetched ${videos.length} videos!`, 'success');
      }
    } catch (error) {
      StudyPlannerUtils.showNotification('Failed to fetch videos', 'error');
    } finally {
      btn.innerHTML = originalHTML;
      btn.disabled = false;
    }
  },

  async fetchGitHubResources() {
    try {
      const repos = await APIService.fetchGitHubRepos('javascript');
      
      if (repos.length) {
        const newResources = repos.slice(0, 10).map(r => ({
          title: r.name,
          type: 'platform',
          category: 'tools',
          url: r.html_url,
          description: r.description || 'GitHub repository',
          rating: Math.min(5, (r.stargazers_count / 10000) + 3.5)
        }));
        
        this.resources = [...newResources, ...this.resources];
        this.renderResources();
        StudyPlannerUtils.showNotification(`Added ${newResources.length} GitHub resources!`, 'success');
      }
    } catch (error) {
      StudyPlannerUtils.showNotification('Failed to fetch GitHub resources', 'error');
    }
  },

  // Event Listeners
  setupEventListeners() {
    document.getElementById('clearSaved').onclick = () => {
      if (this.savedResources.length === 0) {
        StudyPlannerUtils.showNotification('No saved resources to clear', 'info');
        return;
      }
      if (confirm('Clear all saved resources?')) {
        this.savedResources = [];
        localStorage.removeItem('tutorials_saved');
        this.renderSavedList();
        StudyPlannerUtils.showNotification('Cleared!', 'success');
      }
    };

    document.getElementById('fetchChannelsBtn').onclick = () => {
      this.fetchYouTubeChannels();
    };

    document.getElementById('fetchArticlesBtn').onclick = async () => {
      await this.fetchArticlesFromAPIs();
    };
    
    const fetchVideosBtn = document.getElementById('fetchVideos');
    if (fetchVideosBtn) {
      fetchVideosBtn.onclick = () => this.fetchYouTubeVideos();
    }
  }
};

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
  TutorialsApp.init();
});
