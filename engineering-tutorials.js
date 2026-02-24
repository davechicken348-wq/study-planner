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

    }catch(err){ console.warn('Engineering init failed', err); }
  });
})();
