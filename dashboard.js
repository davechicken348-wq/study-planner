// Dashboard interaction enhancements
(function(){
  function el(id){return document.getElementById(id)}

  function toast(msg, type='info'){
    const t = document.createElement('div');
    t.className = 'dashboard-toast '+type;
    t.textContent = msg;
    Object.assign(t.style,{position:'fixed',right:'20px',bottom:'20px',background:'#111',color:'#fff',padding:'10px 14px',borderRadius:'8px',zIndex:12000,boxShadow:'0 6px 18px rgba(0,0,0,0.2)'});
    document.body.appendChild(t);
    setTimeout(()=>{t.style.transition='opacity 300ms';t.style.opacity='0';setTimeout(()=>t.remove(),320)},3000);
  }

  function startQuickTimer(){
    const minutes = 25;
    const timerMinutes = el('timerMinutes');
    const timerDisplay = el('timerDisplay');
    if(timerMinutes) timerMinutes.value = minutes;
    if(timerDisplay) timerDisplay.textContent = minutes.toString().padStart(2,'0')+':00';
    const startBtn = el('startTimer');
    if(startBtn) startBtn.click();
    toast('Started quick 25-minute timer');
  }

  function makeSessionItemsDraggable(){
    const list = el('sessionList');
    if(!list) return;
    [...list.children].forEach((li, idx)=>{
      li.draggable = true;
      li.setAttribute('data-idx', idx);
    });
  }

  function persistSessionOrder(){
    const list = el('sessionList');
    if(!list) return;
    const ids = [...list.children].map((li, i)=>li.id||li.getAttribute('data-id')||('s-'+i));
    try{localStorage.setItem('session_order', JSON.stringify(ids))}catch(e){}
  }

  function enableDragReorder(){
    const list = el('sessionList');
    if(!list) return;
    let dragging = null;
    list.addEventListener('dragstart', (e)=>{
      dragging = e.target;
      e.dataTransfer.effectAllowed = 'move';
      e.target.classList.add('dragging');
    });
    list.addEventListener('dragend', (e)=>{
      if(dragging) dragging.classList.remove('dragging');
      dragging = null;
      makeSessionItemsDraggable();
      persistSessionOrder();
    });
    list.addEventListener('dragover', (e)=>{
      e.preventDefault();
      const after = getDragAfterElement(list, e.clientY);
      const draggingEl = document.querySelector('.dragging');
      if(!draggingEl) return;
      if(after == null) list.appendChild(draggingEl);
      else list.insertBefore(draggingEl, after);
    });
  }

  function getDragAfterElement(container, y){
    const draggableElements = [...container.querySelectorAll('li:not(.dragging)')];
    return draggableElements.reduce((closest, child)=>{
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height/2;
      if(offset < 0 && offset > closest.offset) return {offset, element: child};
      return closest;
    }, {offset: Number.NEGATIVE_INFINITY}).element;
  }

  function enableInlineEdit(){
    const list = el('sessionList');
    if(!list) return;
    list.addEventListener('dblclick', (e)=>{
      const li = e.target.closest('li');
      if(!li) return;
      // find likely title element
      const titleEl = li.querySelector('.session-title') || li.querySelector('h3') || li.querySelector('h2') || li.querySelector('strong') || li.querySelector('span');
      if(!titleEl) return;
      const current = titleEl.textContent.trim();
      const input = document.createElement('input');
      input.type = 'text';
      input.value = current;
      input.className = 'editable-input';
      input.style.padding = '6px 8px';
      input.style.borderRadius = '6px';
      input.style.fontSize = '0.95rem';
      titleEl.replaceWith(input);
      input.focus(); input.select();
      function commit(){
        const span = document.createElement('span');
        span.className = titleEl.className || 'session-title';
        span.textContent = input.value.trim() || current;
        input.replaceWith(span);
        toast('Session title updated');
        // optional: persist change using StudyPlannerUtils if available
        try{ if(window.StudyPlannerUtils && StudyPlannerUtils.saveSessionTitle) StudyPlannerUtils.saveSessionTitle(li.id || li.getAttribute('data-id'), span.textContent)}catch(e){}
      }
      input.addEventListener('blur', commit);
      input.addEventListener('keydown', (ev)=>{ if(ev.key==='Enter') input.blur(); if(ev.key==='Escape'){ input.value = current; input.blur(); }});
    });
  }

  function observeSessionList(){
    const list = el('sessionList');
    if(!list) return;
    const mo = new MutationObserver(()=>{ makeSessionItemsDraggable(); });
    mo.observe(list, {childList:true, subtree:false});
    makeSessionItemsDraggable();
  }

  // Keyboard shortcuts
  function enableShortcuts(){
    document.addEventListener('keydown', (e)=>{
      if(e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if(e.key === 'n'){
        const subj = el('subject'); if(subj){subj.focus(); e.preventDefault(); toast('Focus: New session subject (n)');}
      }
      if(e.key === 't'){
        startQuickTimer(); e.preventDefault();
      }
      if(e.key === '?'){
        const welcome = el('welcomeModal'); if(welcome) welcome.classList.toggle('active');
      }
    });
  }

  // Init
  document.addEventListener('DOMContentLoaded', ()=>{
    const quick = el('startQuickTimer'); if(quick) quick.addEventListener('click', startQuickTimer);
    enableShortcuts();
    observeSessionList();
    enableDragReorder();
    enableInlineEdit();
    // welcome personalization & progress
    try{ updateWelcomeGreeting(); updateProgressRing(); }catch(e){}
  });
  // refresh progress ring periodically and on storage events
  setInterval(()=>{ try{ updateProgressRing(); }catch(e){} }, 5000);
  window.addEventListener('storage', (e)=>{
    if(e.key === StudyPlannerUtils.STORAGE_KEY || e.key === 'daily_goal' || e.key === StudyPlannerUtils.BADGES_KEY) {
      try{ updateProgressRing(); }catch(err){}
    }
  });
  
  // Welcome greeting based on time
  function updateWelcomeGreeting(){
    const title = el('welcomeTitle');
    const subtitle = el('welcomeSubtitle');
    if(!title) return;
    const now = new Date();
    const h = now.getHours();
    const name = (window.StudyPlannerUtils && StudyPlannerUtils.getItem && StudyPlannerUtils.getItem('user_name')) || '';
    let greet = 'Welcome back';
    if(h < 12) greet = 'Good morning';
    else if(h < 18) greet = 'Good afternoon';
    else greet = 'Good evening';
    title.textContent = name ? `${greet}, ${name.split(' ')[0]}!` : `${greet}!`;
    if(subtitle) subtitle.textContent = 'Keep the momentum — small steps add up.';
  }

  // Update progress ring from session list / saved goal
  function updateProgressRing(){
    const todayCountEl = el('todayCount');
    const goalText = el('goalText');
    const ring = document.querySelector('.progress-ring .ring');
    // settings removed, default daily goal is fixed
    const dailyGoal = 5;
    let completedToday = 0;
    try{
      const raw = (window.StudyPlannerUtils && StudyPlannerUtils.getItem) ? StudyPlannerUtils.getItem(StudyPlannerUtils.STORAGE_KEY) : null;
      const sessions = raw ? JSON.parse(raw) : [];
      const today = new Date().toISOString().slice(0,10);
      completedToday = sessions.reduce((acc, s) => {
        if(s && (s.completedDate === today)) return acc+1;
        return acc;
      }, 0);
    }catch(e){
      // fallback: try DOM-based count
      const list = el('sessionList');
      if(list){
        const today = new Date().toISOString().slice(0,10);
        [...list.children].forEach(li=>{
          const d = li.getAttribute('data-date') || li.querySelector('.meta')?.textContent || '';
          const done = li.classList.contains('completed');
          if(d && d.indexOf(today) === 0) completedToday += done ? 1 : 0;
        });
      }
    }
    if(todayCountEl) todayCountEl.textContent = String(completedToday);
    if(goalText) goalText.textContent = `${completedToday} / ${dailyGoal}`;
    if(ring){
      const circumference = 2 * Math.PI * 36; // r=36
      const pct = Math.max(0, Math.min(1, completedToday / dailyGoal));
      const offset = Math.round(circumference * (1 - pct));
      ring.style.strokeDashoffset = offset;
    }
  }

  // ========== NEW FEATURES: Streak, Quotes, Weekly Progress, Achievements ==========

  // Quotes for daily inspiration
  const quotes = [
    { text: 'Success is the sum of small efforts repeated day in and day out.', author: '— James Clear' },
    { text: 'The only way to do great work is to love what you do.', author: '— Steve Jobs' },
    { text: 'Education is the most powerful weapon which you can use to change the world.', author: '— Nelson Mandela' },
    { text: 'Learning never exhausts the mind.', author: '— Leonardo da Vinci' },
    { text: 'An investment in knowledge pays the best interest.', author: '— Benjamin Franklin' },
    { text: 'The beautiful thing about learning is that no one can take it away from you.', author: '— B.B. King' },
    { text: 'Knowledge is power.', author: '— Francis Bacon' },
    { text: 'The expert in anything was once a beginner.', author: '— Helen Hayes' },
    { text: 'Your limitation—its only your imagination.', author: '— Unknown' },
    { text: 'Push yourself, because no one else is going to do it for you.', author: '— Unknown' }
  ];

  // Study Tips for context-aware guidance
  const studyTips = [
    '💡 Use the Pomodoro Technique: Study for 25 minutes, then take a 5-minute break.',
    '🎯 Set specific, measurable learning goals for each session.',
    '📝 Take active notes—don\'t just passively read. Write in your own words.',
    '🔄 Review material multiple times. Spaced repetition is key to long-term retention.',
    '📚 Break complex topics into smaller, manageable chunks.',
    '🧠 Teach someone else what you\'ve learned. If you can explain it, you understand it.',
    '💤 Get enough sleep. Your brain consolidates memories while you sleep.',
    '🚶 Take breaks and move around. Physical activity boosts focus and memory.',
    '🔇 Minimize distractions. Turn off notifications and find a quiet study space.',
    '✅ Track your progress. Celebrate small wins to stay motivated.',
    '🎓 Ask questions when confused. Don\'t just skip over hard concepts.',
    '📖 Read ahead before class or lectures to prime your brain.',
    '🎵 Experiment with background music or silence to find your ideal environment.',
    '🎨 Use colors, diagrams, and mind maps to visualize concepts.',
    '⏰ Study when you\'re most alert. Find your peak learning hours.'
  ];

  let currentTipIndex = 0;

  function initializeNewFeatures(){
    updateStreakBanner();
    updateWeeklyProgress();
    setupAchievements();
    setupUpcomingSessions();
    loadDailyQuote();
    setupStudyTips();
    setupImportExport();
    updateLastSessionSummary();
  }

  function updateStreakBanner(){
    try{
      const raw = (window.StudyPlannerUtils && StudyPlannerUtils.getItem) ? StudyPlannerUtils.getItem(StudyPlannerUtils.STORAGE_KEY) : null;
      const sessions = raw ? JSON.parse(raw) : [];
      if(!sessions || sessions.length === 0) return;

      const streaks = calculateStreak(sessions);
      if(streaks.currentStreak > 0){
        el('streakBanner').style.display = 'flex';
        el('streakValue').textContent = streaks.currentStreak;
        const msg = streaks.currentStreak === 1 ? 'Great start!' : streaks.currentStreak >= 7 ? 'Incredible dedication!' : 'Keep it going!';
        el('streakMessage').textContent = msg;
      }
    }catch(e){ console.error('Streak calc error:', e); }
  }

  function calculateStreak(sessions){
    if(!sessions || sessions.length === 0) return {currentStreak: 0, longestStreak: 0};
    
    const dates = [...new Set(sessions.map(s => s.completedDate || s.date?.split('T')[0]).filter(Boolean))].sort().reverse();
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    const today = new Date().toISOString().slice(0,10);
    
    for(let i = 0; i < dates.length; i++){
      const currDate = new Date(dates[i]);
      const prevDate = i === 0 ? new Date() : new Date(dates[i-1]);
      const dayDiff = Math.floor((prevDate - currDate) / (1000*60*60*24));
      
      if(dayDiff <= 1){
        tempStreak++;
        if(dates[i] === today || dayDiff === 0) currentStreak = tempStreak;
      }else{
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak);
    return {currentStreak, longestStreak};
  }

  function updateWeeklyProgress(){
    try{
      const raw = (window.StudyPlannerUtils && StudyPlannerUtils.getItem) ? StudyPlannerUtils.getItem(StudyPlannerUtils.STORAGE_KEY) : null;
      const sessions = raw ? JSON.parse(raw) : [];
      
      const today = new Date();
      const weekStart = new Date(today.setDate(today.getDate() - today.getDay()));
      const weekStartStr = weekStart.toISOString().slice(0,10);
      
      const weekSessions = sessions.filter(s => {
        const sessDate = s.completedDate || s.date?.split('T')[0];
        return sessDate && sessDate >= weekStartStr;
      }).length;
      
      const weeklyGoal = 20;
      const pct = Math.max(0, Math.min(100, (weekSessions / weeklyGoal) * 100));
      
      el('weekInfo').textContent = `${weekSessions} / ${weeklyGoal} sessions`;
      el('weeklyProgressBar').style.width = pct + '%';
      el('weekProgress').textContent = `${weekSessions}/${weeklyGoal}`;
      el('avgPerDay').textContent = (weekSessions / 7).toFixed(1);
      
      let pace = '—';
      if(weekSessions >= 15) pace = '🔥 On Fire!';
      else if(weekSessions >= 10) pace = '⚡ Great!';
      else if(weekSessions >= 5) pace = '👍 Good';
      else pace = '📈 Keep it up';
      el('paceTrend').textContent = pace;
    }catch(e){ console.error('Weekly progress error:', e); }
  }

  function setupAchievements(){
    try{
      const raw = (window.StudyPlannerUtils && StudyPlannerUtils.getItem) ? StudyPlannerUtils.getItem(StudyPlannerUtils.BADGES_KEY) : null;
      const badges = raw ? JSON.parse(raw) : {};
      const container = el('achievementsContainer');
      if(!container) return;

      const badgeDefinitions = {
        'first-session': { name: 'First Step', icon: '👣' },
        'week-warrior': { name: 'Week Warrior', icon: '⚔️' },
        'streak-7': { name: '7-Day Streak', icon: '🔥' },
        'streak-30': { name: 'Unstoppable', icon: '💪' },
        'dedicated': { name: 'Dedicated Learner', icon: '📚' },
        'mentor': { name: 'Knowledge Mentor', icon: '🎓' },
        'early-bird': { name: 'Early Bird', icon: '🌅' },
        'night-owl': { name: 'Night Owl', icon: '🦉' }
      };

      const recentBadges = Object.entries(badges).filter(([_, v]) => v).map(([k]) => k).slice(-3);
      
      if(recentBadges.length === 0){
        container.innerHTML = '<div class="no-achievements">No new achievements yet. Keep studying!</div>';
        return;
      }

      container.innerHTML = recentBadges.map(badgeKey => {
        const badge = badgeDefinitions[badgeKey] || { name: badgeKey, icon: '⭐' };
        return `<div class="achievement-badge">
          <div class="achievement-icon">${badge.icon}</div>
          <div class="achievement-name">${badge.name}</div>
        </div>`;
      }).join('');
    }catch(e){ console.error('Achievements error:', e); }
  }

  function updateLastSessionSummary(){
    try{
      const raw = (window.StudyPlannerUtils && StudyPlannerUtils.getItem) ? StudyPlannerUtils.getItem(StudyPlannerUtils.STORAGE_KEY) : null;
      const sessions = raw ? JSON.parse(raw) : [];
      
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().slice(0,10);
      
      const yesterdaySessions = sessions.filter(s => (s.completedDate || s.date?.split('T')[0]) === yesterdayStr);
      
      if(yesterdaySessions.length > 0){
        el('lastSessionSection').style.display = 'block';
        el('lastSessCount').textContent = yesterdaySessions.length;
        
        const totalMins = yesterdaySessions.reduce((acc, s) => acc + (s.duration || 30), 0);
        el('lastSessHours').textContent = (totalMins / 60).toFixed(1) + 'h';
        
        const subjects = [...new Set(yesterdaySessions.map(s => s.subject))];
        el('lastSessSubjects').textContent = subjects.length;
      }
    }catch(e){ console.error('Last session error:', e); }
  }

  function setupUpcomingSessions(){
    try{
      const raw = (window.StudyPlannerUtils && StudyPlannerUtils.getItem) ? StudyPlannerUtils.getItem(StudyPlannerUtils.STORAGE_KEY) : null;
      const sessions = raw ? JSON.parse(raw) : [];
      const today = new Date().toISOString().slice(0,10);
      
      const upcomingSessions = sessions.filter(s => {
        const sessDate = s.date?.split('T')[0] || s.completedDate;
        return sessDate && sessDate > today;
      }).sort((a, b) => (a.date || a.completedDate).localeCompare(b.date || b.completedDate)).slice(0, 3);
      
      if(upcomingSessions.length > 0){
        el('upcomingSessions').style.display = 'block';
        const list = el('upcomingList');
        list.innerHTML = upcomingSessions.map(s => {
          const dateObj = new Date(s.date);
          const time = dateObj.toLocaleTimeString('en-US', {hour: '2-digit', minute: '2-digit'});
          const date = dateObj.toLocaleDateString('en-US', {month: 'short', day: 'numeric'});
          return `<div class="upcoming-item">
            <div class="upcoming-time">${date}</div>
            <div class="upcoming-details">
              <div class="upcoming-subject">${s.subject}</div>
              <div class="upcoming-meta">${time} • ${s.duration} mins</div>
            </div>
          </div>`;
        }).join('');
      }
    }catch(e){ console.error('Upcoming sessions error:', e); }
  }

  function loadDailyQuote(){
    const quoteEl = el('dailyQuote');
    const authorEl = el('quoteAuthor');
    if(!quoteEl) return;
    
    const dayOfYear = new Date().toISOString().slice(0,10);
    const quoteIndex = dayOfYear.split('-').reduce((acc, n) => acc + parseInt(n), 0) % quotes.length;
    const quote = quotes[quoteIndex];
    
    quoteEl.textContent = `"${quote.text}"`;
    authorEl.textContent = quote.author;
  }

  function setupStudyTips(){
    const btn = el('nextTip');
    const prevBtn = el('prevTip');
    const counter = el('tipCounter');
    
    if(!btn) return;
    
    currentTipIndex = Math.floor(Math.random() * studyTips.length);
    displayTip();
    
    btn.addEventListener('click', () => {
      currentTipIndex = (currentTipIndex + 1) % studyTips.length;
      displayTip();
    });
    
    if(prevBtn){
      prevBtn.addEventListener('click', () => {
        currentTipIndex = (currentTipIndex - 1 + studyTips.length) % studyTips.length;
        displayTip();
      });
    }
    
    function displayTip(){
      el('tipText').textContent = studyTips[currentTipIndex];
      if(counter) counter.textContent = (currentTipIndex + 1) + '/' + studyTips.length;
    }
  }

  function setupImportExport(){
    const exportBtn = el('exportSessions');
    const exportPrefsBtn = el('exportPrefs');
    const exportAllBtn = el('exportAll');
    const importFile = el('importFile');
    const clearBtn = el('clearAllData');
    const newQuoteBtn = el('newQuoteBtn');
    
    if(exportBtn) exportBtn.addEventListener('click', exportSessionsData);
    if(exportPrefsBtn) exportPrefsBtn.addEventListener('click', exportPreferences);
    if(exportAllBtn) exportAllBtn.addEventListener('click', exportEverything);
    if(importFile) importFile.addEventListener('change', handleImport);
    if(clearBtn) clearBtn.addEventListener('click', clearAllData);
    if(newQuoteBtn) newQuoteBtn.addEventListener('click', () => {
      const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
      el('dailyQuote').textContent = `"${randomQuote.text}"`;
      el('quoteAuthor').textContent = randomQuote.author;
    });
  }

  function exportSessionsData(){
    try{
      const raw = (window.StudyPlannerUtils && StudyPlannerUtils.getItem) ? StudyPlannerUtils.getItem(StudyPlannerUtils.STORAGE_KEY) : null;
      const data = raw ? JSON.parse(raw) : [];
      const json = JSON.stringify({type: 'sessions', data, exported: new Date().toISOString()}, null, 2);
      downloadFile(json, 'study-sessions-' + new Date().toISOString().slice(0,10) + '.json');
      toast('Sessions exported successfully!');
    }catch(e){ toast('Export failed: ' + e.message, 'error'); }
  }

  function exportPreferences(){
    try{
      const prefs = {};
      ['home_accent', 'home_accent2', 'base_font', 'theme_mode', 'home_accent_intensity', 'home_density', 'home_contrast', 'home_font_size', 'home_line_height', 'home_focus_mode'].forEach(key => {
        const val = (window.StudyPlannerUtils && StudyPlannerUtils.getItem) ? StudyPlannerUtils.getItem(key) : null;
        if(val) prefs[key] = val;
      });
      const json = JSON.stringify({type: 'preferences', data: prefs, exported: new Date().toISOString()}, null, 2);
      downloadFile(json, 'study-preferences-' + new Date().toISOString().slice(0,10) + '.json');
      toast('Settings exported successfully!');
    }catch(e){ toast('Export failed: ' + e.message, 'error'); }
  }

  function exportEverything(){
    try{
      const sessions = (window.StudyPlannerUtils && StudyPlannerUtils.getItem) ? StudyPlannerUtils.getItem(StudyPlannerUtils.STORAGE_KEY) : null;
      const badges = (window.StudyPlannerUtils && StudyPlannerUtils.getItem) ? StudyPlannerUtils.getItem(StudyPlannerUtils.BADGES_KEY) : null;
      const prefs = {};
      ['home_accent', 'home_accent2', 'base_font', 'theme_mode'].forEach(key => {
        const val = (window.StudyPlannerUtils && StudyPlannerUtils.getItem) ? StudyPlannerUtils.getItem(key) : null;
        if(val) prefs[key] = val;
      });
      const data = {type: 'full-backup', sessions: sessions ? JSON.parse(sessions) : [], badges: badges ? JSON.parse(badges) : {}, preferences: prefs, exported: new Date().toISOString()};
      const json = JSON.stringify(data, null, 2);
      downloadFile(json, 'study-planner-backup-' + new Date().toISOString().slice(0,10) + '.json');
      toast('Full backup exported successfully!');
    }catch(e){ toast('Export failed: ' + e.message, 'error'); }
  }

  function handleImport(e){
    const file = e.target.files[0];
    if(!file) return;
    
    // Validate file size (max 5MB)
    if(file.size > 5 * 1024 * 1024){
      toast('File too large. Maximum size is 5MB', 'error');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try{
        const text = event.target.result;
        
        // Validate JSON structure before parsing
        if(typeof text !== 'string' || text.length === 0){
          throw new Error('Invalid file content');
        }
        
        const imported = JSON.parse(text);
        
        // Validate imported object structure
        if(!imported || typeof imported !== 'object' || !imported.type){
          throw new Error('Invalid backup format');
        }
        if(imported.type === 'sessions' && imported.data){
          const sanitized = Array.isArray(imported.data) ? imported.data.map(s => ({
            id: (s.id || '').toString().substring(0, 50),
            subject: (s.subject || '').toString().substring(0, 100),
            date: (s.date || '').toString().substring(0, 10),
            time: (s.time || '').toString().substring(0, 5),
            duration: Math.min(480, Math.max(1, parseInt(s.duration) || 30)),
            notes: (s.notes || '').toString().substring(0, 500),
            level: Math.max(0, parseInt(s.level) || 0),
            tags: Array.isArray(s.tags) ? s.tags.map(t => t.toString().substring(0, 50)).slice(0, 10) : [],
            createdAt: s.createdAt || new Date().toISOString()
          })) : [];
          localStorage.setItem(StudyPlannerUtils.STORAGE_KEY, JSON.stringify(sanitized));
          toast('Sessions imported! Refreshing...', 'success');
          setTimeout(() => location.reload(), 1000);
        } else if(imported.type === 'preferences' && imported.data){
          const allowedKeys = ['home_accent', 'home_accent2', 'base_font', 'theme_mode', 'home_accent_intensity', 'home_density', 'home_contrast', 'home_font_size', 'home_line_height', 'home_focus_mode'];
          Object.entries(imported.data).forEach(([k, v]) => {
            if(allowedKeys.includes(k)) localStorage.setItem(k, v.toString().substring(0, 100));
          });
          toast('Preferences imported! Refreshing...', 'success');
          setTimeout(() => location.reload(), 1000);
        } else if(imported.type === 'full-backup'){
          if(imported.sessions){
            const sanitized = Array.isArray(imported.sessions) ? imported.sessions.map(s => ({
              id: (s.id || '').toString().substring(0, 50),
              subject: (s.subject || '').toString().substring(0, 100),
              date: (s.date || '').toString().substring(0, 10),
              time: (s.time || '').toString().substring(0, 5),
              duration: Math.min(480, Math.max(1, parseInt(s.duration) || 30)),
              notes: (s.notes || '').toString().substring(0, 500),
              level: Math.max(0, parseInt(s.level) || 0),
              tags: Array.isArray(s.tags) ? s.tags.map(t => t.toString().substring(0, 50)).slice(0, 10) : [],
              createdAt: s.createdAt || new Date().toISOString()
            })) : [];
            localStorage.setItem(StudyPlannerUtils.STORAGE_KEY, JSON.stringify(sanitized));
          }
          if(imported.badges) localStorage.setItem(StudyPlannerUtils.BADGES_KEY, JSON.stringify(imported.badges));
          if(imported.preferences){
            const allowedKeys = ['home_accent', 'home_accent2', 'base_font', 'theme_mode'];
            Object.entries(imported.preferences).forEach(([k, v]) => {
              if(allowedKeys.includes(k)) localStorage.setItem(k, v.toString().substring(0, 100));
            });
          }
          toast('Full backup restored! Refreshing...', 'success');
          setTimeout(() => location.reload(), 1000);
        }
      }catch(e){ toast('Import failed: Invalid file format', 'error'); }
    };
    reader.readAsText(file);
  }

  function clearAllData(){
    const confirmed = window.confirm('⚠️ Are you sure? This will delete all your sessions, badges, and custom settings. This cannot be undone.');
    if(!confirmed) return;
    try{
      localStorage.clear();
      sessionStorage.clear();
      toast('All data cleared. Refreshing...', 'success');
      setTimeout(() => location.reload(), 800);
    }catch(e){ toast('Clear failed: ' + e.message, 'error'); }
  }

  function downloadFile(content, filename){
    const blob = new Blob([content], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(url); document.body.removeChild(a); }, 100);
  }

  // Initialize new features on page load
  window.addEventListener('load', () => {
    try{ initializeNewFeatures(); }catch(e){ console.error('Feature init error:', e); }
  });

  // Also update periodically
  setInterval(() => {
    try{ updateStreakBanner(); updateWeeklyProgress(); setupAchievements(); }catch(e){}
  }, 10000);
})();
