// Tutorials page script: loads tutorials.json and attempts to fetch simple previews
(function(){
  const listEl = document.getElementById('tutorialList');
  const fetchAllBtn = document.getElementById('fetchAll');
  const channelListEl = document.getElementById('channelList');
  const videoListEl = document.getElementById('videoList');
  const searchInput = document.getElementById('tutorialSearch');
  const searchBtn = document.getElementById('searchBtn');
  const apiKeyInput = document.getElementById('apiKeyInput');
  const fetchVideosBtn = document.getElementById('fetchVideosBtn');
  const heroSlidesEl = document.getElementById('heroSlides');
  const heroPrev = document.getElementById('heroPrev');
  const heroNext = document.getElementById('heroNext');
  const heroDots = document.getElementById('heroDots');
  
  // Dev.to and GitHub fetch
  const devtoQueryInput = document.getElementById('devtoQuery');
  const fetchDevtoBtn = document.getElementById('fetchDevtoBtn');
  const devtoListEl = document.getElementById('devtoList');
  const githubQueryInput = document.getElementById('githubQuery');
  const fetchGithubBtn = document.getElementById('fetchGithubBtn');
  const githubListEl = document.getElementById('githubList');
  const devtoToggleBtn = document.getElementById('devtoToggleLayout');
  const githubToggleBtn = document.getElementById('githubToggleLayout');

  // Icon mapping: tag/keyword -> Font Awesome icon class
  const tagIconMap = {
    'javascript': 'fa-js-square',
    'js': 'fa-js-square',
    'react': 'fa-code-branch',
    'vue': 'fa-code-branch',
    'node.js': 'fa-server',
    'nodejs': 'fa-server',
    'python': 'fa-python',
    'tutorial': 'fa-play',
    'courses': 'fa-graduation-cap',
    'course': 'fa-graduation-cap',
    'reference': 'fa-book',
    'articles': 'fa-newspaper',
    'article': 'fa-newspaper',
    'fullstack': 'fa-layer-group',
    'docker': 'fa-cube',
    'kubernetes': 'fa-cubes',
    'aws': 'fa-cloud',
    'devops': 'fa-cogs',
    'it': 'fa-cogs',
    'cybersecurity': 'fa-shield-alt',
    'security': 'fa-shield-alt',
    'design': 'fa-palette',
    'css': 'fa-paint-brush',
    'html': 'fa-code',
    'database': 'fa-database',
    'web': 'fa-globe',
    'frontend': 'fa-desktop',
    'backend': 'fa-server',
    'cloud': 'fa-cloud',
    'networking': 'fa-network-wired',
    'projects': 'fa-code',
    'csharp': 'fa-hashtag',
    'gaming': 'fa-gamepad',
    'testing': 'fa-check-square',
    'performance': 'fa-running',
    'computing': 'fa-laptop-code',
    'default': 'fa-book-open'
  };

  function getIconForTags(tags){
    if(!Array.isArray(tags)) tags = [];
    for(let tag of tags){
      const key = tag.toLowerCase().trim();
      if(tagIconMap[key]) return tagIconMap[key];
    }
    return tagIconMap.default;
  }

  function createItem(item){
    const card = document.createElement('div');
    card.className = 'tutorial-card';

    // Get icon based on tags
    const icon = getIconForTags(item.tags || []);

    // Build tags HTML
    const tagsHtml = ((item.tags || []).length > 0) 
      ? (item.tags || []).map(tag => `<span class="tutorial-card-tag">${escapeHtml(tag)}</span>`).join('')
      : '<span class="tutorial-card-tag">general</span>';

    card.innerHTML = `
      <div class="tutorial-card-icon">
        <i class="fas ${icon}"></i>
      </div>
      <div class="tutorial-card-title">${escapeHtml(item.title)}</div>
      <div class="tutorial-card-source">${escapeHtml(item.source)}</div>
      <div class="tutorial-card-tags">${tagsHtml}</div>
      <div class="tutorial-card-actions">
        <a href="${item.url}" target="_blank" rel="noopener noreferrer" title="Open tutorial">
          <i class="fas fa-external-link-alt"></i> Open
        </a>
      </div>
    `;

    return card;
  }

  function escapeHtml(str){ return (str||'').replace(/[&<>'"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"})[c]) }

  function fetchPreview(url, targetEl){
    targetEl.textContent = 'Fetching preview...';
    // Attempt to fetch page HTML (may fail due to CORS)
    fetch(url, {mode: 'cors'}).then(r=>{
      if(!r.ok) throw new Error('Network response not ok: '+r.status);
      return r.text();
    }).then(html => {
      try{
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const t = doc.querySelector('title') ? doc.querySelector('title').textContent : '';
        const desc = doc.querySelector('meta[name="description"]') ? doc.querySelector('meta[name="description"]').getAttribute('content') : (doc.querySelector('meta[property="og:description"]') ? doc.querySelector('meta[property="og:description"]').getAttribute('content') : '');
        const img = doc.querySelector('meta[property="og:image"]') ? doc.querySelector('meta[property="og:image"]').getAttribute('content') : '';
        targetEl.innerHTML = `<div style="font-weight:700">${escapeHtml(t || 'No title')}</div><div style="color:var(--muted);margin-top:6px">${escapeHtml(desc || 'No description')}</div>`;
        if(img){
          const im = document.createElement('img'); im.src = img; im.style.maxWidth = '220px'; im.style.marginTop = '8px'; targetEl.appendChild(im);
        }
      }catch(e){ targetEl.textContent = 'Preview parsing failed'; }
    }).catch(err=>{
      console.warn('Preview fetch failed', err);
      targetEl.innerHTML = '<div style="color:var(--muted)">Preview unavailable (CORS or network). Open link to view.</div>';
      StudyPlannerUtils.showNotification('Preview failed for ' + url + ' — likely blocked by CORS', 'warning');
    });
  }

  // Load local JSON and render list, channels, and videos
  fetch('tutorials.json').then(r=>r.json()).then(data=>{
    const tutorials = data.tutorials || [];
    const channels = data.channels || [];
    let videos = data.videos || [];

    // Load API key from localStorage if saved
    const savedApiKey = localStorage.getItem('youtube_api_key') || null;
    if(savedApiKey && apiKeyInput) apiKeyInput.value = savedApiKey;

    // ===== PERFORMANCE OPTIMIZATIONS =====
    // Debounce helper to prevent excessive filter updates
    function debounce(fn, delay = 100){
      let timeout;
      return function(...args){
        clearTimeout(timeout);
        timeout = setTimeout(()=> fn(...args), delay);
      };
    }

    // Lazy iframe loading: render thumbnail with play button, load iframe on click
    function createLazyVideoCard(v){
      const vcard = document.createElement('div');
      vcard.className = 'video-card';
      const baseId = encodeURIComponent(v.youtubeId || '');
      const thumbBase = id => `https://img.youtube.com/vi/${id}/`;
      const thumbUrl = thumbBase(baseId) + 'hqdefault.jpg';
      vcard.innerHTML = `
        <div style="font-weight:700;margin-bottom:6px">${escapeHtml(v.title)}</div>
        <div style="color:var(--muted);font-size:0.95rem;margin-bottom:8px">${escapeHtml(v.description || '')}</div>
        <div class="lazy-video-container" style="position:relative;padding-top:56.25%;background:#000;border-radius:8px;overflow:hidden;cursor:pointer">
          <img class="yt-thumb" src="${thumbUrl}" alt="${escapeHtml(v.title)}" style="position:absolute;left:0;top:0;width:100%;height:100%;object-fit:cover;" loading="lazy">
          <div style="position:absolute;left:0;top:0;width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.3);transition:background 200ms">
            <i class="fas fa-play-circle" style="font-size:3rem;color:#fff"></i>
          </div>
        </div>
        <div class="video-meta" style="display:flex;gap:8px;align-items:center;margin-top:8px">
          <button class="btn-compact watch-save" title="Save to Watchlist">Save</button>
        </div>
      `;
      // add robust thumbnail fallback: try several sizes then local placeholder
      const img = vcard.querySelector('img.yt-thumb');
      if(img){
        img.dataset.tryIndex = '0';
        img.dataset.vid = baseId;
        const sizes = ['maxresdefault.jpg','sddefault.jpg','hqdefault.jpg','default.jpg'];
        img.addEventListener('error', function onThumbError(){
          let idx = Number(this.dataset.tryIndex || 0);
          if(idx < sizes.length){
            // try next size
            this.src = thumbBase(this.dataset.vid) + sizes[idx];
            this.dataset.tryIndex = String(idx + 1);
            return;
          }
          // all YouTube sizes failed — use local placeholder
          this.removeEventListener('error', onThumbError);
          this.src = './images/library.webp';
        });
      }
      // wire click to load iframe
      const container = vcard.querySelector('.lazy-video-container');
      container.addEventListener('click', ()=>{
        // On mobile/small screens (≤768px), open fullscreen or new tab
        if(window.innerWidth <= 768){
          // Open YouTube in fullscreen/new tab with better viewing experience
          window.open(`https://www.youtube.com/watch?v=${encodeURIComponent(v.youtubeId)}`, '_blank', 'fullscreen=yes');
        } else {
          // On desktop, embed inline
          container.innerHTML = `<iframe src="https://www.youtube.com/embed/${encodeURIComponent(v.youtubeId)}?autoplay=1" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen style="position:absolute;left:0;top:0;width:100%;height:100%;border-radius:8px"></iframe>`;
        }
      });
      // watchlist save button
      const saveBtn = vcard.querySelector('.watch-save');
      if(saveBtn){
        const vidKey = v.youtubeId || v.id || (v.url || '') ;
        function updateSaveState(){
          const list = JSON.parse(localStorage.getItem('studyplanner_watchlist') || '[]');
          const found = list.some(x=> x.id === vidKey);
          saveBtn.textContent = found ? 'Saved' : 'Save';
          saveBtn.disabled = found;
        }
        saveBtn.addEventListener('click', ()=>{
          const list = JSON.parse(localStorage.getItem('studyplanner_watchlist') || '[]');
          if(!list.some(x=> x.id === vidKey)){
            list.unshift({ id: vidKey, title: v.title, url: v.youtubeId ? ('https://www.youtube.com/watch?v='+encodeURIComponent(v.youtubeId)) : (v.url||''), thumb: thumbUrl });
            localStorage.setItem('studyplanner_watchlist', JSON.stringify(list));
            StudyPlannerUtils.showNotification('Saved to Watchlist', 'success');
            renderWatchlist();
            updateSaveState();
          }
        });
        updateSaveState();
      }
      return vcard;
    }

  // Watchlist rendering
  const watchlistContainer = document.getElementById('watchlistList');
  function renderWatchlist(){
    if(!watchlistContainer) return;
    const list = JSON.parse(localStorage.getItem('studyplanner_watchlist') || '[]');
    watchlistContainer.innerHTML = '';
      if(list.length === 0){
        watchlistContainer.innerHTML = '<div style="color:var(--muted);padding:8px">No saved videos</div>';
        return;
      }
      list.forEach(item=>{
        const card = document.createElement('div');
        card.className = 'tutorial-card';
        const thumb = item.thumb ? `<img class="watch-thumb" src="${escapeHtml(item.thumb)}" alt="${escapeHtml(item.title)}">` : '';
        card.innerHTML = `
          <div style="display:flex;align-items:center;gap:8px;width:100%">
            ${thumb}
            <div style="flex:1;min-width:0">
              <div class="tutorial-card-title">${escapeHtml(item.title)}</div>
            </div>
            <div class="tutorial-card-actions" style="margin-left:8px;display:flex;gap:6px">
              <a href="${escapeHtml(item.url)}" target="_blank" rel="noopener" class="btn-compact">Open</a>
              <button class="btn-compact watch-remove" data-id="${escapeHtml(item.id)}">Remove</button>
            </div>
          </div>
        `;
        watchlistContainer.appendChild(card);
      });
    // wire remove buttons
    watchlistContainer.querySelectorAll('.watch-remove').forEach(b=>{
      b.addEventListener('click', ()=>{
        const id = b.dataset.id;
        const list = JSON.parse(localStorage.getItem('studyplanner_watchlist') || '[]').filter(x=> x.id !== id);
        localStorage.setItem('studyplanner_watchlist', JSON.stringify(list));
        renderWatchlist();
      });
    });
  }

  // initial render of watchlist
  renderWatchlist();

  // -------- Hero slideshow --------
  function initHeroSlideshow(){
    if(!heroSlidesEl) return;
    // Define slides (keyword -> description)
    const slides = [
      {keywords: ['technology','coding','computer'], title: 'Learn Modern Web Development', desc: 'Step-by-step tutorials for HTML, CSS, and JavaScript — from fundamentals to advanced patterns.'},
      {keywords: ['programming','python','developer'], title: 'Backend & Python Guides', desc: 'Backend development, APIs, automation, and Python projects to level up your server-side skills.'},
      {keywords: ['devops','cloud','docker'], title: 'DevOps & Cloud', desc: 'Containers, Kubernetes, serverless patterns, and cloud fundamentals for scalable systems.'},
      {keywords: ['design','ux','frontend'], title: 'Frontend Design & Accessibility', desc: 'UI best practices, responsive layouts, and accessibility guidelines for inclusive interfaces.'},
      {keywords: ['mobile','ios','android'], title: 'Mobile App Development', desc: 'Build cross-platform and native mobile apps with React Native, Flutter, Swift, and Kotlin.'},
      {keywords: ['database','sql','data'], title: 'Databases & Data Engineering', desc: 'Master SQL, NoSQL, data pipelines, and big data technologies for scalable applications.'},
      {keywords: ['ai','machine-learning','ml'], title: 'Machine Learning & AI', desc: 'Learn ML fundamentals, neural networks, NLP, and AI frameworks like TensorFlow and PyTorch.'},
      {keywords: ['community','collaboration','open-source'], title: 'Community & Open Source', desc: 'Contribute to open-source projects, collaborate with developers, and build in the open.'},
      {keywords: ['testing','qa','automation'], title: 'Testing & Quality Assurance', desc: 'Unit testing, integration testing, E2E testing, and CI/CD pipelines for reliable software.'},
      {keywords: ['security','cybersecurity','web'], title: 'Security & Cryptography', desc: 'Learn security best practices, authentication, encryption, and how to build secure applications.'},
      {keywords: ['performance','optimization','speed'], title: 'Performance & Optimization', desc: 'Master caching, bundling, profiling, and optimization techniques for lightning-fast apps.'},
      {keywords: ['career','growth','skills'], title: 'Career Growth & Soft Skills', desc: 'Level up your professional skills, improve communication, and advance your tech career.'},
      {keywords: ['web3','blockchain','crypto'], title: 'Web3 & Blockchain', desc: 'Explore decentralized apps, smart contracts, and blockchain technology with Solidity and Web3.js.'},
      {keywords: ['devtools','git','github'], title: 'Developer Tools & Git', desc: 'Master Git workflows, GitHub collaboration, debugging tools, and terminal productivity hacks.'},
      {keywords: ['css','styling','animation'], title: 'Advanced CSS & Animation', desc: 'Create stunning UIs with CSS Grid, Flexbox, animations, and modern styling frameworks.'},
      {keywords: ['accessibility','a11y','wcag'], title: 'Web Accessibility Mastery', desc: 'Build inclusive web experiences with WCAG standards, ARIA, and assistive technologies.'}
    ];

    // Build slides using local images from images/Tutorials_images
    const localImagesPath = './images/Tutorials_images/';
    const imgFiles = [
      'code_tutorial.webp',
      'programming.webp',
      'laptop_on_table.webp',
      'tutorial.webp',
      'code.webp',
      'computer.webp',
      'keyboard.webp',
      'message.webp',
      'black_laptop.webp',
      'office_computer.webp',
      'user.webp',
      'laptop.webp',
      'flowers.webp',
      'fun.webp',
      'happy.webp',
      'street (1).webp'
    ];
    slides.forEach((s, idx)=>{
      const slide = document.createElement('div');
      slide.className = 'hero-slide' + (idx===0? ' active':'');
      const imgUrl = localImagesPath + (imgFiles[idx] || imgFiles[0]);
      // preload image
      const _img = new Image(); _img.src = imgUrl;
      slide.innerHTML = `
        <img class="slide-img" src="${imgUrl}" alt="${escapeHtml(s.title)}" loading="lazy">
        <div class="slide-content">
          <h2>${escapeHtml(s.title)}</h2>
          <p>${escapeHtml(s.desc)}</p>
          <a class="slide-cta" href="#tutorialList">Browse Tutorials</a>
        </div>
      `;
      heroSlidesEl.appendChild(slide);
    });

    let current = 0;
    const allSlides = Array.from(heroSlidesEl.querySelectorAll('.hero-slide'));
    let timer = null;
    function show(n){
      allSlides[current].classList.remove('active');
      current = (n + allSlides.length) % allSlides.length;
      allSlides[current].classList.add('active');
    }
    function next(){ show(current+1); }
    function prev(){ show(current-1); }
    const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    function start(){ if(prefersReduced) return; timer = setInterval(next, 6000); }
    function stop(){ if(timer) { clearInterval(timer); timer = null; } }

    // play/pause control
    const playBtn = document.createElement('button'); playBtn.className = 'hero-play'; playBtn.id = 'heroPlayPause'; playBtn.setAttribute('aria-pressed','false'); playBtn.title = 'Pause slideshow'; playBtn.innerHTML = '<i class="fas fa-pause"></i>';
    heroSlidesEl.parentNode.appendChild(playBtn);
    function updatePlayButton(){ if(timer){ playBtn.setAttribute('aria-pressed','true'); playBtn.title='Pause slideshow'; playBtn.innerHTML = '<i class="fas fa-pause"></i>'; } else { playBtn.setAttribute('aria-pressed','false'); playBtn.title='Play slideshow'; playBtn.innerHTML = '<i class="fas fa-play"></i>'; } }
    playBtn.addEventListener('click', ()=>{ if(timer) { stop(); } else { start(); } updatePlayButton(); });

    heroNext?.addEventListener('click', ()=>{ stop(); next(); start(); updatePlayButton(); });
    heroPrev?.addEventListener('click', ()=>{ stop(); prev(); start(); updatePlayButton(); });
    // pause on hover/focus
    heroSlidesEl.addEventListener('mouseenter', ()=>{ stop(); updatePlayButton(); });
    heroSlidesEl.addEventListener('mouseleave', ()=>{ start(); updatePlayButton(); });
    heroSlidesEl.addEventListener('focusin', ()=>{ stop(); updatePlayButton(); });
    heroSlidesEl.addEventListener('focusout', ()=>{ start(); updatePlayButton(); });

    // keyboard navigation (left/right) and space to toggle play/pause
    document.addEventListener('keydown', (e)=>{
      if(document.activeElement && heroSlidesEl.contains(document.activeElement) || document.body.contains(heroSlidesEl)){
        if(e.key === 'ArrowLeft'){ e.preventDefault(); stop(); prev(); start(); updatePlayButton(); }
        if(e.key === 'ArrowRight'){ e.preventDefault(); stop(); next(); start(); updatePlayButton(); }
        if(e.key === ' ' || e.key === 'Spacebar'){ e.preventDefault(); if(timer) { stop(); } else { start(); } updatePlayButton(); }
      }
    });

    // pause when tab hidden
    document.addEventListener('visibilitychange', ()=>{ if(document.hidden) { stop(); updatePlayButton(); } else { start(); updatePlayButton(); } });

    // initialize
    start(); updatePlayButton();
  }

  // initialize hero slideshow after slides are built
  try{ initHeroSlideshow(); }catch(e){ console.warn('Hero init failed', e); }


    // Pagination: track current offset and render in batches
    let videoOffset = 0;
    const videoBatchSize = 15;

    function renderVideoList(list, reset = true){
      if(!videoListEl) return;
      if(reset){
        videoListEl.innerHTML = '';
        videoOffset = 0;
      }
      if(!list || list.length === 0){
        videoListEl.innerHTML = '<div style="color:var(--muted);padding:20px;text-align:center;grid-column:1/-1">No videos to display. Enter an API key and click Fetch 40 Videos.</div>';
        return;
      }
      // render next batch
      const batch = list.slice(videoOffset, videoOffset + videoBatchSize);
      batch.forEach(v=> videoListEl.appendChild(createLazyVideoCard(v)));
      videoOffset += videoBatchSize;
      // add "Load More" button if more videos available
      if(videoOffset < list.length){
        const loadMoreBtn = document.createElement('button');
        loadMoreBtn.style.cssText = 'grid-column:1/-1;padding:10px 18px;background:var(--primary);color:#fff;border:none;border-radius:6px;cursor:pointer;font-weight:600;margin-top:10px';
        loadMoreBtn.textContent = `Load More (${list.length - videoOffset} remaining)`;
        loadMoreBtn.addEventListener('click', ()=>{
          loadMoreBtn.remove();
          renderVideoList(list, false);
        });
        videoListEl.appendChild(loadMoreBtn);
      }
    }

    // helper: render a list of video objects into the video grid
    function renderVideoListOld(list){
      if(!videoListEl) return;
      videoListEl.innerHTML = '';
      if(!list || list.length === 0){
        videoListEl.innerHTML = '<div style="color:var(--muted);padding:20px;text-align:center;grid-column:1/-1">No videos to display. Enter an API key and click Fetch 40 Videos.</div>';
        return;
      }
      list.forEach(v=>{
        const vcard = document.createElement('div');
        vcard.className = 'video-card';
        vcard.innerHTML = `
          <div style="font-weight:700;margin-bottom:6px">${escapeHtml(v.title)}</div>
          <div style="color:var(--muted);font-size:0.95rem;margin-bottom:8px">${escapeHtml(v.description || '')}</div>
          <div style="position:relative;padding-top:56.25%">
            <iframe src="https://www.youtube.com/embed/${encodeURIComponent(v.youtubeId)}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen style="position:absolute;left:0;top:0;width:100%;height:100%;border-radius:8px"></iframe>
          </div>
        `;
        videoListEl.appendChild(vcard);
      });
    }

    // Fetch articles from Dev.to (free API, no key required). Returns up to `max` articles.
    async function fetchDevtoArticles(query = 'javascript', max = 20){
      try{
        const url = `https://dev.to/api/articles?tag=${encodeURIComponent(query)}&per_page=${Math.min(30, max)}`;
        const res = await fetch(url);
        if(!res.ok) throw new Error('Dev.to API error: ' + res.status);
        const articles = await res.json() || [];
        return articles.map(a=>({
          id: 'devto-' + a.id,
          title: a.title,
          url: a.url,
          source: 'Dev.to',
          tags: [a.tag_list ? a.tag_list[0] : 'articles', 'tutorial'],
          description: a.description || a.excerpt || '',
          author: a.user?.name || 'Unknown'
        }));
      }catch(err){
        console.warn('Dev.to fetch failed', err);
        StudyPlannerUtils.showNotification('Dev.to fetch failed: ' + err.message, 'error');
        return [];
      }
    }

    // Fetch repositories from GitHub API (free API, no key required). Returns up to `max` repos.
    async function fetchGithubRepos(query = 'awesome', max = 20){
      try{
        const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(query)} topic:awesome sort:stars&per_page=${Math.min(30, max)}`;
        const res = await fetch(url);
        if(!res.ok) throw new Error('GitHub API error: ' + res.status);
        const payload = await res.json();
        const repos = payload.items || [];
        return repos.map(r=>({
          id: 'github-' + r.id,
          title: r.name,
          url: r.html_url,
          source: 'GitHub',
          tags: ['github', 'repository', 'open-source'],
          description: r.description || 'No description',
          author: r.owner?.login || 'Unknown',
          stats: `⭐ ${r.stargazers_count} | 🍴 ${r.forks_count}`
        }));
      }catch(err){
        console.warn('GitHub fetch failed', err);
        StudyPlannerUtils.showNotification('GitHub fetch failed: ' + err.message, 'error');
        return [];
      }
    }

    // Helper: render fetched articles/repos as tutorial cards
    function renderFetchedItems(items, container){
      if(!container) return;
      // Respect user preference for layout (grid/scroll) saved in localStorage
      try{
        if(container.id === 'devtoList' || container.id === 'githubList'){
          const pref = localStorage.getItem(container.id + '_layout') || 'auto';
          // Only apply scroll layout on desktop widths
          if(pref === 'scroll' && window.innerWidth >= 769){
            container.classList.add('horizontal-scroll');
            container.classList.remove('tutorials-grid');
            // Use inline !important to override stylesheet ID-based !important rules
            try{
              container.style.setProperty('display', 'flex', 'important');
              container.style.setProperty('flex-wrap', 'nowrap', 'important');
              container.style.setProperty('gap', '12px', 'important');
              container.style.setProperty('overflow-x', 'auto', 'important');
              container.style.setProperty('overflow-y', 'hidden', 'important');
              container.style.setProperty('-webkit-overflow-scrolling', 'touch', 'important');
              container.style.setProperty('scroll-snap-type', 'x mandatory', 'important');
              // remove conflicting grid template if present
              container.style.removeProperty('grid-template-columns');
            }catch(e){ /* ignore */ }
          } else {
            container.classList.remove('horizontal-scroll');
            container.classList.add('tutorials-grid');
            // clear inline overrides so stylesheet rules apply
            try{
              container.style.removeProperty('display');
              container.style.removeProperty('flex-wrap');
              container.style.removeProperty('gap');
              container.style.removeProperty('overflow-x');
              container.style.removeProperty('overflow-y');
              container.style.removeProperty('-webkit-overflow-scrolling');
              container.style.removeProperty('scroll-snap-type');
            }catch(e){ /* ignore */ }
          }
        }
      }catch(e){ /* ignore */ }
      container.innerHTML = '';
      if(!items || items.length === 0){
        container.innerHTML = '<div style="color:var(--muted);padding:20px;text-align:center;grid-column:1/-1">No items found. Try another search.</div>';
        return;
      }
      items.forEach(item=>{
        const card = createItem({
          title: item.title,
          url: item.url,
          source: item.source,
          tags: item.tags || [],
          description: item.description,
          author: item.author,
          stats: item.stats
        });
        // For sidebar lists, respect layout preference when appending cards
        if(container && (container.id === 'devtoList' || container.id === 'githubList')){
          const pref = localStorage.getItem(container.id + '_layout') || 'auto';
          // Only size cards for scroll layout on desktop widths
          if(pref === 'scroll' && window.innerWidth >= 769){
            card.style.flex = '0 0 140px';
            card.style.minWidth = '140px';
            card.style.maxWidth = '140px';
            card.style.boxSizing = 'border-box';
            card.style.scrollSnapAlign = 'start';
            card.classList.add('compact-card');
          } else {
            card.style.flex = '';
            card.style.minWidth = '';
            card.style.maxWidth = '';
            card.style.boxSizing = '';
            card.style.scrollSnapAlign = '';
            card.classList.remove('compact-card');
          }
        }

        container.appendChild(card);
      });
    }

    // store tutorials globally for filtering and render helper
    window.allTutorials = tutorials.slice();
    function renderTutorials(list){
      listEl.innerHTML = '';
      if(!list || list.length === 0){
        listEl.innerHTML = '<div style="color:var(--muted);padding:20px;text-align:center;grid-column:1/-1">No tutorials match your search.</div>';
        return;
      }
      list.forEach(item=> listEl.appendChild(createItem(item)));
      const countEl = document.getElementById('tutorialCount'); if(countEl) countEl.textContent = `${list.length} resources`;
    }
    renderTutorials(window.allTutorials);

    // --- Featured Learning Resource (random) ---
    const resourceCountEl = document.getElementById('resourceCount');
    const resourceTagSelect = document.getElementById('resourceTag');
    let _resourceIntervalId = null;
    function stopResourceRotation(){ if(_resourceIntervalId){ clearInterval(_resourceIntervalId); _resourceIntervalId = null; } }
    function startResourceRotation(list, intervalMs = 14000){
      stopResourceRotation();
      if(!Array.isArray(list) || list.length === 0) return;
      updateFeaturedResource(list);
      _resourceIntervalId = setInterval(()=> updateFeaturedResource(list), intervalMs);
    }

    function updateFeaturedResource(list){
      try{
        const pool = Array.isArray(list) && list.length ? list : (Array.isArray(tutorials) ? tutorials : []);
        const titleEl = document.getElementById('featuredResourceTitle');
        const srcEl = document.getElementById('featuredResourceSource');
        const thumbEl = document.querySelector('.resource-thumb');
        const countEl = resourceCountEl;
        if(countEl) countEl.textContent = pool.length || '—';
        if(!thumbEl || !titleEl || !srcEl) return;

        // if a tag filter is selected, narrow pool
        const sel = resourceTagSelect?.value || 'all';
        const filteredPool = (sel && sel !== 'all') ? pool.filter(r => (r.tags||[]).map(t=>t.toLowerCase()).includes(sel.toLowerCase())) : pool;
        const pickPool = filteredPool.length ? filteredPool : pool;
        if(pickPool.length === 0){
          titleEl.textContent = 'No resources';
          srcEl.textContent = '';
          thumbEl.innerHTML = `<img src="./company.png" alt="No resources" loading="lazy">`;
          return;
        }

        const item = pickPool[Math.floor(Math.random() * pickPool.length)];
        const imgSrc = item.image || item.thumbnail || item.ogImage || item.cover || './company.png';
        thumbEl.innerHTML = `<img src="${escapeHtml(imgSrc)}" alt="${escapeHtml(item.title||'Featured resource')}" loading="lazy">`;
        titleEl.textContent = item.title || 'Featured resource';
        srcEl.textContent = item.source ? (' • ' + item.source) : (item.author ? (' • ' + item.author) : '');

        // click to open
        thumbEl.style.cursor = item.url ? 'pointer' : 'default';
        thumbEl.onclick = item.url ? (()=> window.open(item.url, '_blank', 'noopener')) : null;
      }catch(e){ console.warn('updateFeaturedResource failed', e); }
    }

    function populateResourceTags(){
      if(!resourceTagSelect) return;
      const tags = new Set();
      (tutorials||[]).forEach(t=> (t.tags||[]).forEach(tt=> tags.add(tt)));
      // clear, keep 'all'
      const current = resourceTagSelect.value || 'all';
      resourceTagSelect.innerHTML = '<option value="all">All</option>' + Array.from(tags).sort().map(t=> `<option value="${escapeHtml(t)}">${escapeHtml(t)}</option>`).join('');
      if(Array.from(resourceTagSelect.options).some(o => o.value === current)) resourceTagSelect.value = current;
    }

    // wire tag select
    if(resourceTagSelect){
      resourceTagSelect.addEventListener('change', ()=>{
        const sel = resourceTagSelect.value;
        const filtered = (sel && sel !== 'all') ? (tutorials||[]).filter(r=> (r.tags||[]).map(t=>t.toLowerCase()).includes(sel.toLowerCase())) : (tutorials||[]);
        // update list count and restart rotation within filtered set
        if(resourceCountEl) resourceCountEl.textContent = filtered.length;
        startResourceRotation(filtered.length ? filtered : tutorials);
      });
    }

    // initialize resource tags and rotation
    populateResourceTags();
    startResourceRotation(tutorials || []);

    // wire search input to filter tutorials
    if(searchInput){
      searchInput.addEventListener('input', debounce(function(){
        const q = (this.value || '').trim().toLowerCase();
        if(!q) return renderTutorials(window.allTutorials);
        const filtered = window.allTutorials.filter(t=>{
          const hay = ((t.title||'') + ' ' + (t.source||'') + ' ' + (t.tags||[]).join(' ') + ' ' + (t.description||'')).toLowerCase();
          return hay.indexOf(q) !== -1;
        });
        renderTutorials(filtered);
      }, 200));
    }

    /* Page navigation behavior: smooth scroll and active link on scroll */
    (function initPageNav(){
      const nav = document.getElementById('pageNav');
      if(!nav) return;
      const links = Array.from(nav.querySelectorAll('a'));
      const sections = links.map(a=> document.querySelector(a.getAttribute('href'))).filter(Boolean);

      function setActiveByScroll(){
        const offset = window.innerHeight * 0.25;
        let activeIndex = -1;
        for(let i=0;i<sections.length;i++){
          const r = sections[i].getBoundingClientRect();
          if(r.top <= offset) activeIndex = i;
        }
        links.forEach((l,idx)=> l.classList.toggle('active', idx === activeIndex));
      }

      links.forEach(a=> a.addEventListener('click', function(e){
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if(!target) return;
        target.scrollIntoView({behavior:'smooth',block:'start'});
        // update active class
        links.forEach(l=> l.classList.remove('active'));
        this.classList.add('active');
      }));

      window.addEventListener('scroll', debounce(setActiveByScroll, 100));
      setActiveByScroll();

      // Back to top button
      const back = document.createElement('button'); back.className = 'back-to-top'; back.innerHTML = '<i class="fas fa-arrow-up"></i>'; document.body.appendChild(back);
      back.addEventListener('click', ()=> window.scrollTo({top:0,behavior:'smooth'}));
      function toggleBack(){ if(window.scrollY > 300) back.classList.add('show'); else back.classList.remove('show'); }
      window.addEventListener('scroll', debounce(toggleBack, 100));
      toggleBack();
    })();

    // render channels with tags and 'Show Videos' action
    if(channelListEl){
      channelListEl.innerHTML = '';
      // helper: attempt to fetch channel og:image (may fail due to CORS)
      async function fetchChannelOgImage(url){
        if(!url) return null;
        try{
          const res = await fetch(url, {mode: 'cors'});
          if(!res.ok) return null;
          const html = await res.text();
          const doc = new DOMParser().parseFromString(html, 'text/html');
          return doc.querySelector('meta[property="og:image"]')?.getAttribute('content') || doc.querySelector('link[rel="image_src"]')?.getAttribute('href') || null;
        }catch(e){
          return null;
        }
      }
      // prepare filter container (moved out of grid)
      const filterContainer = document.getElementById('channelFilterBar') || channelListEl;
      filterContainer.innerHTML = '';
      const tagHeader = document.createElement('div');
      tagHeader.className = 'channel-filter-inner';
      const channelTags = new Set();
      channels.forEach(c=> (c.tags||[]).forEach(t=> channelTags.add(t)));

      // helper to apply tag filter (debounced to prevent excessive DOM queries)
      let activeTag = null;
      function applyFilterImmediate(tag){
        if(!tag){
          activeTag = null;
          document.querySelectorAll('.tab-btn').forEach(b=> b.classList.remove('active'));
          document.querySelectorAll('.channel-card').forEach(el=> el.style.display='block');
          return;
        }
        // toggle off if same tag clicked
        if(activeTag === tag){
          applyFilterImmediate(null);
          return;
        }
        activeTag = tag;
        document.querySelectorAll('.tab-btn').forEach(b=> b.classList.toggle('active', b.textContent === tag));
        document.querySelectorAll('.channel-card').forEach(el=>{
          const tags = (el.dataset.tags||'').split(',').map(s=>s.trim()).filter(Boolean);
          el.style.display = tags.includes(tag) ? 'block' : 'none';
        });
      }
      const applyFilter = debounce(applyFilterImmediate, 50);

      const clearBtn = document.createElement('button'); clearBtn.className='tab-btn'; clearBtn.textContent='All Topics'; clearBtn.addEventListener('click', ()=> applyFilter(null));
      tagHeader.appendChild(clearBtn);
      Array.from(channelTags).sort().forEach(t=>{
        const b = document.createElement('button'); b.className='tab-btn'; b.textContent = t; b.addEventListener('click', ()=> applyFilter(t));
        tagHeader.appendChild(b);
      });
      filterContainer.appendChild(tagHeader);

      channels.forEach(c => {
        const card = document.createElement('div');
        card.className = 'channel-card card-modern';
        card.dataset.tags = (c.tags||[]).join(',');

        const tagsHtml = (c.tags||[]).map(t=>`<button class="tag-chip" title="Filter by ${t}">${escapeHtml(t)}</button>`).join(' ');

        // build markup with semantic classes matching styles.css
        const avatarSrc = c.avatar ? escapeHtml(c.avatar) : './images/library.webp';
        const avatarHtml = `<img class="channel-avatar" src="${avatarSrc}" alt="${escapeHtml(c.title)} avatar" loading="lazy">`;
        card.innerHTML = `
          <div class="channel-meta">
            ${avatarHtml}
            <div class="channel-info">
              <div class="channel-title">${escapeHtml(c.title)}</div>
              <div class="channel-description">${escapeHtml(c.description || '')}</div>
              <div class="channel-tags">${tagsHtml}</div>
            </div>
          </div>
          <div class="channel-actions" style="margin-top:10px;display:flex;gap:8px;justify-content:flex-end">
            <a class="btn-secondary-modern" href="${escapeHtml(c.url)}" target="_blank">Visit Channel</a>
            <button class="btn-primary-modern show-videos-btn">Show Videos</button>
          </div>
        `;

        // wire tag chips inside card to use same filter and wire show videos
        setTimeout(()=>{
          card.querySelectorAll('.tag-chip').forEach(tc=>{
            tc.addEventListener('click', ()=>{
              const t = tc.textContent;
              applyFilter(t);
            });
          });

          const btn = card.querySelector('.show-videos-btn');
          btn.addEventListener('click', ()=> showVideosForChannel(c.title));
        }, 10);

        channelListEl.appendChild(card);
        // attempt to replace placeholder with a real image from several candidates
        (async ()=>{
          const imgEl = card.querySelector('.channel-avatar');
          if(!imgEl) return;
          // build candidate list
          const domain = c.url ? (new URL(c.url).origin) : null;
          const googleFav = domain ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=256` : null;
          const candidates = [];
          if(c.avatar) candidates.push(c.avatar);
          if(googleFav) candidates.push(googleFav);
          if(c.url) candidates.push((c.url.replace(/\/$/,'')) + '/favicon.ico');
          if(c.url) candidates.push((c.url.replace(/\/$/,'')) + '/apple-touch-icon.png');
          candidates.push('./images/library.webp');

          // set up onerror cycling
          let idx = 0;
          imgEl.addEventListener('error', function onErr(){
            idx++;
            if(idx < candidates.length) imgEl.src = candidates[idx];
            else imgEl.removeEventListener('error', onErr);
          });
          // start with first candidate
          if(candidates.length) imgEl.src = candidates[0];

          // also try fetching og:image and, if allowed, prefer it
          if(c.url){
            try{
              const origin = (new URL(c.url)).origin || '';
              // Skip fetching HTML for domains that commonly block CORS (YouTube)
              if(/youtube\.com|youtu\.be/i.test(origin)){
                // prefer avatar or favicon candidates already set
              } else {
                const og = await fetchChannelOgImage(c.url);
                if(og){ imgEl.src = og; }
              }
            }catch(e){ /* ignore invalid URLs or fetch failures */ }
          }
        })();
      });

      // render featured channel (most videos)
      try{
        const featuredEl = document.getElementById('featuredChannel');
        if(featuredEl){
          // compute counts by channel name
          const counts = {};
          videos.forEach(v=>{ const ch = (v.channel||'').trim(); if(ch) counts[ch] = (counts[ch]||0) + 1; });
          // fall back to channels list if no videos mapping
          channels.forEach(c=>{ if(!(c.title in counts)) counts[c.title] = counts[c.title] || 0 });
          const sorted = Object.keys(counts).sort((a,b)=>counts[b]-counts[a]);
          if(sorted.length){
            const top = sorted[0];
            const channelObj = channels.find(c=> (c.title||'').toLowerCase()===top.toLowerCase()) || channels[0];
            if(channelObj){
              featuredEl.innerHTML = `
                <div class="featured-channel card-modern">
                  ${channelObj.avatar ? `<img class="featured-avatar" src="${escapeHtml(channelObj.avatar)}" alt="${escapeHtml(channelObj.title)} avatar">` : ''}
                  <div class="featured-info">
                    <h3>${escapeHtml(channelObj.title)} <small style="color:var(--muted);font-weight:600">• ${counts[top] || 0} videos</small></h3>
                    <p>${escapeHtml(channelObj.description || '')}</p>
                    <div class="featured-actions">
                      <a class="btn-secondary-modern" href="${escapeHtml(channelObj.url)}" target="_blank">Visit Channel</a>
                      <button class="btn-primary-modern" id="featuredShowVideos">Show Videos</button>
                    </div>
                  </div>
                </div>
              `;
              document.getElementById('featuredShowVideos')?.addEventListener('click', ()=> showVideosForChannel(channelObj.title));
            }
          }
        }
      }catch(e){ console.warn('Featured render failed', e) }

      // helper to show videos for channel title
      function showVideosForChannel(title){
        const filtered = videos.filter(v => (v.channel||'').toLowerCase() === (title||'').toLowerCase());
        if(filtered.length === 0){
          StudyPlannerUtils.showNotification('No videos found for ' + title, 'info');
          return;
        }
        videoListEl.innerHTML = '';
        filtered.forEach(v=>{
          const vcard = document.createElement('div');
          vcard.className = 'video-card';
          vcard.innerHTML = `
            <div class="video-card-content">
              <div style="font-weight:700;margin-bottom:6px">${escapeHtml(v.title)}</div>
              <div style="color:var(--muted);font-size:0.95rem;margin-bottom:8px">${escapeHtml(v.description || '')}</div>
              <div style="position:relative;padding-top:56.25%">
                <iframe src="https://www.youtube.com/embed/${encodeURIComponent(v.youtubeId)}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen style="position:absolute;left:0;top:0;width:100%;height:100%;border-radius:8px"></iframe>
              </div>
            </div>
          `;
          videoListEl.appendChild(vcard);
        });
        StudyPlannerUtils.showNotification('Showing videos for ' + title, 'success');
        // rotate featured within this filtered set
        if(typeof startFeaturedRotation === 'function') startFeaturedRotation(filtered);
        window.location.hash = '#videos';
      }
    }

    // render bundled video list on page load
    if(videoListEl){
      renderVideoList(videos);
    }

    // Featured preview: choose a random video and optionally rotate periodically
    let _featuredIntervalId = null;
    function stopFeaturedRotation(){ if(_featuredIntervalId){ clearInterval(_featuredIntervalId); _featuredIntervalId = null; } }
    function startFeaturedRotation(list, intervalMs = 12000){
      stopFeaturedRotation();
      if(!Array.isArray(list) || list.length === 0) return;
      // show one immediately
      updateFeaturedVideo(list);
      // rotate periodically
      _featuredIntervalId = setInterval(()=> updateFeaturedVideo(list), intervalMs);
    }

    function updateFeaturedVideo(list){
      try{
        const featuredTitle = document.getElementById('featuredTitle');
        const featuredAuthor = document.getElementById('featuredAuthor');
        const previewThumb = document.querySelector('.preview-thumb');
        const playBtn = document.getElementById('playFeatured');
        if(!previewThumb) return;

        const pool = Array.isArray(list) && list.length ? list : (Array.isArray(videos) && videos.length ? videos : []);
        // clear existing click handlers
        previewThumb.replaceWith(previewThumb.cloneNode(true));
        const newPreview = document.querySelector('.preview-thumb');
        if(playBtn) { playBtn.replaceWith(playBtn.cloneNode(true)); }
        const newPlayBtn = document.getElementById('playFeatured');

        if(pool.length){
          const v = pool[Math.floor(Math.random() * pool.length)];
          const vid = v.youtubeId || v.id || '';
          const thumbUrl = vid ? `https://img.youtube.com/vi/${encodeURIComponent(vid)}/hqdefault.jpg` : './images/library.webp';
          newPreview.innerHTML = `\n            <img src="${thumbUrl}" alt="${escapeHtml(v.title || 'Featured tutorial')}" loading="lazy">\n            <div class="play-overlay"><i class="fas fa-play"></i></div>\n          `;
          if(featuredTitle) featuredTitle.textContent = v.title || 'Featured tutorial';
          if(featuredAuthor) featuredAuthor.textContent = v.channel ? (' • by ' + v.channel) : (v.author ? (' • by ' + v.author) : '');

          const playFeaturedHandler = ()=>{
            // On mobile/small screens, open YouTube in fullscreen
            if(window.innerWidth <= 768){
              window.open(`https://www.youtube.com/watch?v=${encodeURIComponent(vid)}`, '_blank', 'fullscreen=yes');
            } else {
              // On desktop, embed inline
              newPreview.innerHTML = `<iframe src="https://www.youtube.com/embed/${encodeURIComponent(vid)}?autoplay=1" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen style="position:absolute;left:0;top:0;width:100%;height:100%;border-radius:8px"></iframe>`;
            }
          };

          newPreview.style.cursor = vid ? 'pointer' : 'default';
          newPreview.addEventListener('click', playFeaturedHandler);
          newPlayBtn?.addEventListener('click', playFeaturedHandler);
        }else{
          // no videos — show placeholder
          newPreview.innerHTML = `\n            <img src="./images/library.webp" alt="No featured" loading="lazy">\n            <div class="play-overlay"><i class="fas fa-play"></i></div>\n          `;
          if(featuredTitle) featuredTitle.textContent = 'Featured tutorial';
          if(featuredAuthor) featuredAuthor.textContent = ' • by StudyPlanner';
        }
      }catch(e){ console.warn('updateFeaturedVideo failed', e); }
    }

    // start rotating featured using the bundled videos
    startFeaturedRotation(videos || []);

    // wire up search
    searchBtn?.addEventListener('click', ()=>{
      const q = (searchInput?.value||'').toLowerCase().trim();
      if(!q){
        listEl.innerHTML = '';
        tutorials.forEach(item=> listEl.appendChild(createItem(item)));
        return;
      }
      const filtered = tutorials.filter(t=> (t.title||'').toLowerCase().includes(q) || (t.tags||[]).join(' ').toLowerCase().includes(q) || (t.source||'').toLowerCase().includes(q));
      listEl.innerHTML = '';
      filtered.forEach(item=> listEl.appendChild(createItem(item)));
    });

    // wire up fetch YouTube videos button
    fetchVideosBtn?.addEventListener('click', async ()=>{
      const key = apiKeyInput?.value?.trim();
      if(!key){
        StudyPlannerUtils.showNotification('Please paste a YouTube API key first', 'warning');
        apiKeyInput?.focus();
        return;
      }
      // save key to localStorage
      localStorage.setItem('youtube_api_key', key);
      // show loading state
      fetchVideosBtn.disabled = true;
      fetchVideosBtn.textContent = 'Fetching 40 videos...';
      videoListEl.innerHTML = '<div style="color:var(--muted);padding:20px;text-align:center;grid-column:1/-1">Loading videos...</div>';
      try{
        const fetched = await fetchYouTubeVideos(key, 'I.T reload', 40);
        if(fetched && fetched.length){
          videos = fetched;
          renderVideoList(videos);
          // refresh featured rotation to use the newly fetched videos
          if(typeof startFeaturedRotation === 'function') startFeaturedRotation(videos);
          StudyPlannerUtils.showNotification(`Fetched ${fetched.length} videos — showing random selection`, 'success');
        } else {
          renderVideoList(videos);
          StudyPlannerUtils.showNotification('YouTube returned no matches — showing local videos', 'warning');
        }
      }catch(err){
        console.warn('YouTube fetch error', err);
        renderVideoList(videos);
        StudyPlannerUtils.showNotification('YouTube fetch failed: ' + err.message, 'error');
      }finally{
        fetchVideosBtn.disabled = false;
        fetchVideosBtn.textContent = 'Fetch 40 Videos';
      }
    });

    // wire up Dev.to fetch button
    fetchDevtoBtn?.addEventListener('click', async ()=>{
      const query = devtoQueryInput?.value?.trim() || 'javascript';
      devtoQueryInput.value = query;
      fetchDevtoBtn.disabled = true;
      fetchDevtoBtn.textContent = 'Fetching articles...';
      devtoListEl.innerHTML = '<div style="color:var(--muted);padding:20px;text-align:center;grid-column:1/-1">Loading Dev.to articles...</div>';
      try{
        const articles = await fetchDevtoArticles(query, 20);
        renderFetchedItems(articles, devtoListEl);
        StudyPlannerUtils.showNotification(`Fetched ${articles.length} articles from Dev.to`, 'success');
      }catch(err){
        console.warn('Dev.to fetch error', err);
        devtoListEl.innerHTML = '<div style="color:var(--muted);padding:20px;text-align:center;grid-column:1/-1">Failed to fetch articles.</div>';
      }finally{
        fetchDevtoBtn.disabled = false;
        fetchDevtoBtn.textContent = 'Fetch Articles';
      }
    });

    // wire up GitHub fetch button
    fetchGithubBtn?.addEventListener('click', async ()=>{
      const query = githubQueryInput?.value?.trim() || 'learning-resources';
      githubQueryInput.value = query;
      fetchGithubBtn.disabled = true;
      fetchGithubBtn.textContent = 'Fetching repositories...';
      githubListEl.innerHTML = '<div style="color:var(--muted);padding:20px;text-align:center;grid-column:1/-1">Loading GitHub repositories...</div>';
      try{
        const repos = await fetchGithubRepos(query, 20);
        renderFetchedItems(repos, githubListEl);
        StudyPlannerUtils.showNotification(`Fetched ${repos.length} repos from GitHub`, 'success');
      }catch(err){
        console.warn('GitHub fetch error', err);
        githubListEl.innerHTML = '<div style="color:var(--muted);padding:20px;text-align:center;grid-column:1/-1">Failed to fetch repositories.</div>';
      }finally{
        fetchGithubBtn.disabled = false;
        fetchGithubBtn.textContent = 'Fetch Repos';
      }
    });

    // layout toggle helpers
    function applyScrollLayout(container){
      if(!container) return;
      // Do not enable horizontal scroll on narrow/mobile screens
      if(window.innerWidth < 769){
        applyGridLayout(container);
        return;
      }
      container.classList.add('horizontal-scroll');
      container.classList.remove('tutorials-grid');
      // set inline !important styles to ensure they override CSS rules
      try{
        container.style.setProperty('display','flex','important');
        container.style.setProperty('flex-wrap','nowrap','important');
        container.style.setProperty('gap','12px','important');
        container.style.setProperty('overflow-x','auto','important');
        container.style.setProperty('overflow-y','hidden','important');
        container.style.setProperty('-webkit-overflow-scrolling','touch','important');
        container.style.setProperty('scroll-snap-type','x mandatory','important');
        container.style.removeProperty('grid-template-columns');
      }catch(e){ /* ignore */ }
      // update existing children widths
      Array.from(container.children).forEach(ch=>{
        ch.style.flex = '0 0 140px'; ch.style.minWidth = '140px'; ch.style.maxWidth = '140px'; ch.style.boxSizing = 'border-box'; ch.style.scrollSnapAlign = 'start';
      });
    }

    function applyGridLayout(container){
      if(!container) return;
      container.classList.remove('horizontal-scroll');
      container.classList.add('tutorials-grid');
      try{
        container.style.removeProperty('display');
        container.style.removeProperty('flex-wrap');
        container.style.removeProperty('gap');
        container.style.removeProperty('overflow-x');
        container.style.removeProperty('overflow-y');
        container.style.removeProperty('-webkit-overflow-scrolling');
        container.style.removeProperty('scroll-snap-type');
      }catch(e){ /* ignore */ }
      Array.from(container.children).forEach(ch=>{
        ch.style.flex = ''; ch.style.minWidth = ''; ch.style.maxWidth = ''; ch.style.boxSizing = ''; ch.style.scrollSnapAlign = '';
      });
    }

    // wire layout toggle buttons
    if(devtoToggleBtn){
      // initialize label from preference
      const init = localStorage.getItem('devtoList_layout') || 'auto';
      devtoToggleBtn.textContent = (init === 'scroll') ? 'Grid' : 'Scroll';
      devtoToggleBtn.addEventListener('click', ()=>{
        const cur = localStorage.getItem('devtoList_layout') || 'auto';
        const next = (cur === 'scroll') ? 'grid' : 'scroll';
        localStorage.setItem('devtoList_layout', next);
        if(next === 'scroll') applyScrollLayout(devtoListEl); else applyGridLayout(devtoListEl);
        devtoToggleBtn.textContent = (next === 'scroll') ? 'Grid' : 'Scroll';
      });
    }

    if(githubToggleBtn){
      const init2 = localStorage.getItem('githubList_layout') || 'auto';
      githubToggleBtn.textContent = (init2 === 'scroll') ? 'Grid' : 'Scroll';
      githubToggleBtn.addEventListener('click', ()=>{
        const cur = localStorage.getItem('githubList_layout') || 'auto';
        const next = (cur === 'scroll') ? 'grid' : 'scroll';
        localStorage.setItem('githubList_layout', next);
        if(next === 'scroll') applyScrollLayout(githubListEl); else applyGridLayout(githubListEl);
        githubToggleBtn.textContent = (next === 'scroll') ? 'Grid' : 'Scroll';
      });
    }

  }).catch(err=>{
    console.error('Failed to load tutorials.json', err);
    listEl.textContent = 'Failed to load tutorials list.';
  });

  // Fetch all previews (attempt)
  fetchAllBtn?.addEventListener('click', ()=>{
    document.querySelectorAll('.tutorial-item').forEach((el, idx)=>{
      const link = el.querySelector('a')?.href;
      const preview = el.querySelector('.tutorial-preview');
      if(link && preview) fetchPreview(link, preview);
    });
  });

  // Responsive behavior: move Featured and Watchlist into the main flow on small screens
  (function(){
    const MOBILE_BREAKPOINT = 600; // px
    const watchlist = document.getElementById('watchlist');
    const featuredInner = document.getElementById('featuredChannel');
    const channels = document.getElementById('channels');
    const tutorialsMain = document.querySelector('.tutorials-main');
    const tutorialsSidebar = document.querySelector('.tutorials-sidebar');
    if(!channels || !tutorialsMain || !tutorialsSidebar) return;

    const featuredSection = featuredInner ? featuredInner.closest('section') : null;

    // remember original placement so we can restore both
    const saved = {
      watch: watchlist ? { parent: watchlist.parentNode, next: watchlist.nextElementSibling } : null,
      featured: featuredSection ? { parent: featuredSection.parentNode, next: featuredSection.nextElementSibling } : null
    };

    function isMobile(){ return window.innerWidth <= MOBILE_BREAKPOINT; }

    function moveFeaturedBeforeChannels(){
      if(!featuredSection) return;
      // insert featured before channels
      channels.parentNode.insertBefore(featuredSection, channels);
    }

    function moveWatchlistAfterChannels(){
      if(!watchlist) return;
      const after = channels.nextElementSibling;
      if(after && after.parentNode === channels.parentNode){
        channels.parentNode.insertBefore(watchlist, after);
      } else {
        channels.parentNode.appendChild(watchlist);
      }
    }

    // small debounce to avoid thrashing on resize
    let _t = null;
    function onResize(){ clearTimeout(_t); _t = setTimeout(()=>{
      if(isMobile()){
        if(featuredSection && featuredSection.parentNode !== tutorialsMain) moveFeaturedBeforeChannels();
        if(watchlist && watchlist.parentNode !== tutorialsMain) moveWatchlistAfterChannels();
      } else {
        // restore featured
        if(featuredSection && saved.featured){
          const dest = saved.featured.parent;
          if(dest && featuredSection.parentNode !== dest){
            if(saved.featured.next && saved.featured.next.parentNode === dest){ dest.insertBefore(featuredSection, saved.featured.next); }
            else { dest.appendChild(featuredSection); }
          }
        }
        // restore watchlist
        if(watchlist && saved.watch){
          const dest2 = saved.watch.parent;
          if(dest2 && watchlist.parentNode !== dest2){
            if(saved.watch.next && saved.watch.next.parentNode === dest2){ dest2.insertBefore(watchlist, saved.watch.next); }
            else { dest2.appendChild(watchlist); }
          }
        }
      }
    }, 120); }

    // initial placement on DOM ready
    document.addEventListener('DOMContentLoaded', ()=>{
      if(isMobile()){
        if(featuredSection) moveFeaturedBeforeChannels();
        if(watchlist) moveWatchlistAfterChannels();
      }
    });
    window.addEventListener('resize', onResize);
  })();

})();
