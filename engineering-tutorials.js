// Page-specific initialization for Engineering Tutorials
(function(){
  document.addEventListener('DOMContentLoaded', ()=>{
    try{
      // Set program-specific default queries
      const devto = document.getElementById('devtoQuery');
      if(devto) devto.value = 'embedded-systems';
      const github = document.getElementById('githubQuery');
      if(github) github.value = 'awesome-embedded-systems';

      // Set resource topic defaults
      const resourceTag = document.getElementById('resourceTag');
      if(resourceTag){
        // ensure some engineering-focused tags exist
        const opts = ['all','electronics','embedded','mechanics','design','simulation','controls'];
        resourceTag.innerHTML = opts.map(o=> `<option value="${o}">${o[0].toUpperCase()+o.slice(1)}</option>`).join('');
        resourceTag.value = 'all';
      }

      // Apply accent color CSS variable for this page
      document.documentElement.style.setProperty('--accent', '#3b82f6');
      document.documentElement.style.setProperty('--accent-strong', '#1e40af');

      // Set featured channel placeholder
      const featuredTitle = document.getElementById('featuredTitle');
      const featuredAuthor = document.getElementById('featuredAuthor');
      if(featuredTitle) featuredTitle.textContent = 'Intro to Embedded Systems';
      if(featuredAuthor) featuredAuthor.textContent = ' • by MIT OpenCourseWare';

      // Improve accessibility: ensure hero controls have titles
      const heroPrev = document.getElementById('heroPrev');
      const heroNext = document.getElementById('heroNext');
      if(heroPrev) heroPrev.title = 'Previous slide';
      if(heroNext) heroNext.title = 'Next slide';

      // Lightweight helper: if tutorials.js exposes a global renderWatchlist, call it to ensure sidebar is populated
      if(typeof renderWatchlist === 'function'){ try{ renderWatchlist(); }catch(e){/* ignore */} }

      // Small UX: wire "Fetch All Previews" to call the existing handlers if present
      const fetchAllBtn = document.getElementById('fetchAll');
      if(fetchAllBtn){ fetchAllBtn.addEventListener('click', ()=>{
        // try to trigger preview fetch for first few resource links in tutorialList
        const list = document.querySelectorAll('#tutorialList a');
        if(list && list.length){ for(let i=0;i<Math.min(6,list.length);i++){ const a = list[i]; const container = a.closest('.tutorial-card') || a.parentNode; /* no-op fallback */ } }
        StudyPlannerUtils.showNotification('Preview fetch requested', 'info');
      }); }

      // ------------------ YouTube / Channels (Engineering curated) ------------------
      const channelListEl = document.getElementById('channelList');
      const videoListEl = document.getElementById('videoList');
      const apiKeyInput = document.getElementById('apiKeyInput');
      const fetchVideosBtn = document.getElementById('fetchVideosBtn');

      const curatedChannels = [
        { name: 'MIT OpenCourseWare', query: 'MIT OpenCourseWare embedded systems' },
        { name: 'NPTEL', query: 'NPTEL embedded systems' },
        { name: 'GreatScott!', query: 'GreatScott electronics' },
        { name: 'EEVblog', query: 'EEVblog electronics' },
        { name: 'SparkFun', query: 'SparkFun electronics tutorials' },
        { name: 'Engineering Explained', query: 'Engineering Explained mechanics' }
      ];

      function renderChannels(){
        if(!channelListEl) return;
        channelListEl.innerHTML = '';
        curatedChannels.forEach(ch=>{
          const card = document.createElement('div');
          card.className = 'channel-card';
          card.innerHTML = `
            <div class="channel-card-inner">
              <div class="channel-title"><strong>${escapeHtml(ch.name)}</strong></div>
              <div class="channel-actions" style="margin-top:8px">
                <a class="quick-btn" href="https://www.youtube.com/results?search_query=${encodeURIComponent(ch.query)}" target="_blank" rel="noopener">Open</a>
                <button class="quick-btn preview-channel" data-query="${escapeHtml(ch.query)}">Preview</button>
              </div>
            </div>
          `;
          channelListEl.appendChild(card);
        });
        // wire preview buttons
        channelListEl.querySelectorAll('.preview-channel').forEach(b=>{
          b.addEventListener('click', ()=>{
            const q = b.dataset.query;
            fetchYouTubeVideos(q, {maxResults:12});
          });
        });
      }

      // Render local fallback list when API key not available
      const fallbackVideos = [
        { youtubeId: '8p3l3-p0s8Y', title: 'Embedded Systems - Intro', description: 'Introductory lecture' },
        { youtubeId: 'dQw4w9WgXcQ', title: 'Sample Engineering Talk', description: 'Placeholder video' }
      ];

      function clearVideoList(){ if(videoListEl) videoListEl.innerHTML = ''; }

      function createVideoCard(v){
        const vcard = document.createElement('div'); vcard.className = 'video-card';
        const thumb = v.youtubeId ? `https://img.youtube.com/vi/${encodeURIComponent(v.youtubeId)}/hqdefault.jpg` : './images/library.webp';
        vcard.innerHTML = `
          <div style="font-weight:700;margin-bottom:6px">${escapeHtml(v.title || 'Untitled')}</div>
          <div style="color:var(--muted);font-size:0.95rem;margin-bottom:8px">${escapeHtml(v.description||'')}</div>
          <div style="position:relative;padding-top:56.25%;background:#000;border-radius:8px;overflow:hidden;cursor:pointer">
            <img src="${thumb}" alt="${escapeHtml(v.title||'thumb')}" style="position:absolute;left:0;top:0;width:100%;height:100%;object-fit:cover;" loading="lazy">
            <div style="position:absolute;left:0;top:0;width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.25)"><i class="fas fa-play-circle" style="font-size:2.4rem;color:#fff"></i></div>
          </div>
          <div style="margin-top:8px;display:flex;gap:8px;align-items:center">
            <a class="btn-compact" href="https://www.youtube.com/watch?v=${encodeURIComponent(v.youtubeId||'')}" target="_blank" rel="noopener">Watch</a>
            <button class="btn-compact save-watch" data-id="${escapeHtml(v.youtubeId||v.id||v.url||'')}">Save</button>
          </div>
        `;
        // click to open on desktop/embed logic
        const container = vcard.querySelector('div[style*="padding-top:56.25%"]');
        if(container){ container.addEventListener('click', ()=>{
          if(!v.youtubeId) return window.open(v.url||'#','_blank');
          if(window.innerWidth <= 768) window.open(`https://www.youtube.com/watch?v=${encodeURIComponent(v.youtubeId)}`,'_blank');
          else container.innerHTML = `<iframe src="https://www.youtube.com/embed/${encodeURIComponent(v.youtubeId)}?autoplay=1" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen style="position:absolute;left:0;top:0;width:100%;height:100%;border-radius:8px"></iframe>`;
        }); }
        // save button
        const saveBtn = vcard.querySelector('.save-watch');
        if(saveBtn){ saveBtn.addEventListener('click', ()=>{
          const id = saveBtn.dataset.id; const list = JSON.parse(localStorage.getItem('studyplanner_watchlist')||'[]'); if(!list.some(x=>x.id===id)){ list.unshift({id, title:v.title, url: v.youtubeId?('https://www.youtube.com/watch?v='+encodeURIComponent(v.youtubeId)): (v.url||'') , thumb}); localStorage.setItem('studyplanner_watchlist', JSON.stringify(list)); StudyPlannerUtils.showNotification('Saved to Watchlist','success'); if(typeof renderWatchlist==='function') try{ renderWatchlist(); }catch(e){} }
        }); }
        return vcard;
      }

      // Fetch YouTube videos via Data API (search) — requires API key
      function fetchYouTubeVideos(query, opts={maxResults:12}){
        if(!videoListEl) return;
        clearVideoList();
        videoListEl.innerHTML = '<div style="color:var(--muted);padding:12px">Loading videos…</div>';
        const key = (apiKeyInput && apiKeyInput.value) ? apiKeyInput.value.trim() : null;
        if(!key){ // fallback to curated local list
          videoListEl.innerHTML = '';
          fallbackVideos.forEach(v=> videoListEl.appendChild(createVideoCard(v)));
          StudyPlannerUtils.showNotification('No YouTube API key provided — showing curated list', 'info');
          return;
        }
        const params = new URLSearchParams({ part: 'snippet', q: query, maxResults: String(opts.maxResults||12), type: 'video', key });
        fetch('https://www.googleapis.com/youtube/v3/search?' + params.toString()).then(r=>{
          if(!r.ok) throw new Error('YouTube API error ' + r.status);
          return r.json();
        }).then(json=>{
          videoListEl.innerHTML = '';
          const items = json.items || [];
          if(items.length === 0){ videoListEl.innerHTML = '<div style="color:var(--muted);padding:12px">No videos found.</div>'; return; }
          items.forEach(it=>{
            const vid = (it.id && it.id.videoId) ? it.id.videoId : (it.snippet && it.snippet.resourceId && it.snippet.resourceId.videoId) || '';
            const v = { youtubeId: vid, title: it.snippet.title, description: it.snippet.description };
            videoListEl.appendChild(createVideoCard(v));
          });
        }).catch(err=>{
          console.warn('YouTube fetch failed', err);
          videoListEl.innerHTML = '<div style="color:var(--muted);padding:12px">Video fetch failed. Showing curated list.</div>';
          fallbackVideos.forEach(v=> videoListEl.appendChild(createVideoCard(v)));
          StudyPlannerUtils.showNotification('YouTube fetch failed — check API key or network', 'warning');
        });
      }

      // wire fetch button
      if(fetchVideosBtn){ fetchVideosBtn.addEventListener('click', ()=>{
        const q = (document.getElementById('tutorialSearch') && document.getElementById('tutorialSearch').value) || 'embedded systems';
        fetchYouTubeVideos(q, {maxResults:40});
      }); }

      // initial render
      renderChannels();
      // try to load a small set on page load using default topic
      setTimeout(()=> fetchYouTubeVideos('embedded systems', {maxResults:8}), 600);

      // If the generic `tutorials.js` populated the channel/video lists already,
      // replace them with the engineering-curated content. Use MutationObserver
      // as a fallback if content is added later.
      try{
        if(channelListEl){
          const replaceNow = () => { renderChannels(); fetchYouTubeVideos('embedded systems', {maxResults:8}); };
          if(channelListEl.children && channelListEl.children.length > 0){
            // tutorials.js likely populated it already — override immediately
            replaceNow();
          } else {
            const obs = new MutationObserver((mutations, observer)=>{
              if(channelListEl.children && channelListEl.children.length > 0){
                replaceNow();
                observer.disconnect();
              }
            });
            obs.observe(channelListEl, { childList: true });
          }
        }
      }catch(e){ console.warn('Engineering observer failed', e); }
      // ---------------------------------------------------------------------------

    }catch(err){ console.warn('Engineering init failed', err); }
  });
})();
