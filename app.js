(() => {
  const STORAGE_KEY = StudyPlannerUtils.STORAGE_KEY;
  const THEME_KEY = StudyPlannerUtils.THEME_KEY;
  const TIMER_KEY = 'study_planner_timer';
  const BADGES_KEY = StudyPlannerUtils.BADGES_KEY;

  function qs(id){return document.getElementById(id)}

  const form = qs('sessionForm');
  const subject = qs('subject');
  const dateInput = qs('date');
  const timeInput = qs('time');
  const duration = qs('duration');
  const notes = qs('notes');
  const tagsInput = qs('tags');
  const importFile = qs('importFile');
  const exportCsvBtn = qs('exportCsv');
  const tagFiltersContainer = document.getElementById('tagFilters');
  const sessionList = qs('sessionList');
  const importSample = qs('importSample');

  let sessions = [];
  let currentFilter = 'all';
  let currentFilterTag = null;
  let timerInterval = null;
  let timerSeconds = 0;

  // Badge definitions
  const BADGE_DEFINITIONS = [
    {id: 'first_session', name: 'First Step', iconClass: 'fa-leaf', description: 'Complete your first session', check: () => sessions.filter(s => s.level > 0).length >= 1},
    {id: 'five_sessions', name: 'On Fire', iconClass: 'fa-fire', description: 'Complete 5 sessions', check: () => sessions.filter(s => s.level > 0).length >= 5},
    {id: 'ten_sessions', name: 'Dedicated', iconClass: 'fa-dumbbell', description: 'Complete 10 sessions', check: () => sessions.filter(s => s.level > 0).length >= 10},
    {id: 'level_two', name: 'Level Master', iconClass: 'fa-chart-line', description: 'Reach level 2', check: () => sessions.some(s => s.level >= 2)},
    {id: 'hundred_hours', name: 'Century', iconClass: 'fa-trophy', description: '100+ hours studied', check: () => {const total = sessions.filter(s => s.level > 0).reduce((sum, s) => sum + (s.duration || 30), 0); return total >= 6000}},
    {id: 'speed_runner', name: 'Speed Runner', iconClass: 'fa-bolt', description: 'Use timer for 5+ sessions', check: () => parseInt(StudyPlannerUtils.getItem('timer_uses') || '0', 10) >= 5}
  ];

  function save(){ 
    if(!StudyPlannerUtils.setItem(STORAGE_KEY, JSON.stringify(sessions))){
      StudyPlannerUtils.showNotification('Failed to save data. Storage may be full.', 'error');
    }
  }
  function load(){ 
    const raw = StudyPlannerUtils.getItem(STORAGE_KEY); 
    try{
      sessions = raw ? JSON.parse(raw) : [];
    } catch(e){
      console.error('Failed to parse sessions:', e);
      sessions = [];
      StudyPlannerUtils.showNotification('Failed to load saved data', 'error');
    }
  }

  function uid(){ return Date.now().toString(36) + Math.round(Math.random()*36).toString(36) }

  // Dark mode
  function initTheme(){
    const saved = localStorage.getItem(THEME_KEY);
    if(saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)){
      document.body.classList.add('dark-mode');
    }
  }

  // Spaced repetition: base * 2^level days
  function scheduleNext(session){
    const base = 1;
    const nextDays = base * Math.pow(2, session.level || 0);
    const next = new Date(session.date);
    next.setDate(next.getDate() + Math.max(1, Math.round(nextDays)));
    return next.toISOString().slice(0,10);
  }

  function addSession(s){ sessions.push(s); sessions.sort((a,b)=> new Date(a.date) - new Date(b.date)); save(); updateStats(); render(); }

  function updateStats(){
    const completed = sessions.filter(s => s.level > 0).length;
    const now = new Date();
    const today = now.toISOString().slice(0,10);
    const upcomingSessions = sessions.filter(s => s.date >= today && s.level === 0);
    const nextDate = upcomingSessions.length > 0 ? upcomingSessions[0].date : 'None';
    const totalMinutes = sessions.filter(s => s.level > 0).reduce((sum, s) => sum + (s.duration || 30), 0);
    const totalHours = Math.round(totalMinutes / 60 * 10) / 10;
    
    const streak = calculateStreak();
    
    qs('stat-completed').textContent = completed;
    qs('stat-streak').textContent = streak > 0 ? streak + (streak === 1 ? ' day' : ' days') : '0 days';
    qs('stat-next').textContent = nextDate !== 'None' ? nextDate : 'None';
    qs('stat-hours').textContent = totalHours + 'h';
    
    updateBadges();
  }

  function calculateStreak(){
    const completedSessions = sessions.filter(s => s.level > 0 && s.completedDate);
    if(completedSessions.length === 0) return 0;
    
    const dates = [...new Set(completedSessions.map(s => s.completedDate))].sort().reverse();
    const today = new Date().toISOString().slice(0,10);
    
    if(dates[0] !== today && dates[0] !== new Date(Date.now() - 86400000).toISOString().slice(0,10)) return 0;
    
    let streak = 1;
    for(let i = 1; i < dates.length; i++){
      const prev = new Date(dates[i-1]);
      const curr = new Date(dates[i]);
      const diff = Math.floor((prev - curr) / 86400000);
      if(diff === 1) streak++;
      else break;
    }
    return streak;
  }

  function updateBadges(){
    let unlockedBadges = [];
    try{
      unlockedBadges = JSON.parse(StudyPlannerUtils.getItem(BADGES_KEY) || '[]');
    } catch(e){
      console.error('Failed to parse badges:', e);
    }
    BADGE_DEFINITIONS.forEach(badge => {
      if(badge.check() && !unlockedBadges.includes(badge.id)){
        unlockedBadges.push(badge.id);
      }
    });
    StudyPlannerUtils.setItem(BADGES_KEY, JSON.stringify(unlockedBadges));
    qs('stat-badges').textContent = unlockedBadges.length;
    renderBadges(unlockedBadges);
  }

  function renderBadges(unlockedIds){
    const grid = qs('badges-grid');
    grid.innerHTML = '';
    BADGE_DEFINITIONS.forEach(badge => {
      const div = document.createElement('div');
      div.className = 'badge' + (unlockedIds.includes(badge.id) ? ' unlocked' : ' locked');
      div.title = badge.description;
      div.innerHTML = `<div class="badge-icon"><i class="fas ${badge.iconClass}"></i></div><div class="badge-name">${badge.name}</div>`;
      grid.appendChild(div);
    });
  }

  function render(){
    sessionList.innerHTML = '';
    const now = new Date();
    const today = now.toISOString().slice(0,10);
    
    let filtered = sessions;
    if(currentFilter === 'upcoming') filtered = sessions.filter(s => s.date >= today && s.level === 0);
    if(currentFilter === 'completed') filtered = sessions.filter(s => s.level > 0);
    if(currentFilterTag) filtered = filtered.filter(s => (s.tags||[]).includes(currentFilterTag));
    
    if(filtered.length===0){
      const li = document.createElement('li');
      li.className = 'empty-state';
      li.innerHTML = `
        <i class="fas fa-calendar-plus" style="font-size:48px;opacity:0.3;margin-bottom:16px"></i>
        <h3 style="margin:0 0 8px 0;font-size:18px">${currentFilter === 'completed' ? 'No completed sessions yet' : 'No sessions scheduled'}</h3>
        <p style="margin:0;opacity:0.7;font-size:14px">${currentFilter === 'completed' ? 'Mark sessions as done to see them here' : 'Click "Add Session" above to create your first study session'}</p>
      `;
      sessionList.appendChild(li);
      return;
    }
    
    filtered.forEach(s => {
      const li = document.createElement('li');
      if(s.level > 0) li.classList.add('completed');
      const left = document.createElement('div');
      left.innerHTML = `<strong>${escapeHtml(s.subject)}</strong><div class="meta">${s.date}${s.time ? ' '+s.time : ''} • ${s.duration} mins${s.level > 0 ? ' • Level ' + s.level : ''}</div>`;
      if(s.tags && s.tags.length){
        const tagWrap = document.createElement('div');
        tagWrap.style.marginTop = '8px';
        s.tags.forEach(t=>{
          const chip = document.createElement('button');
          chip.className = 'tag-chip';
          chip.textContent = t;
          chip.title = 'Filter by ' + t;
          chip.onclick = () => { currentFilterTag = t; updateTagFilters(); render(); };
          tagWrap.appendChild(chip);
        });
        left.appendChild(tagWrap);
      }
      const right = document.createElement('div');
      right.className = 'session-actions';

      const noteBtn = document.createElement('button');
      noteBtn.className = 'btn ghost';
      noteBtn.textContent = 'Notes';
      noteBtn.setAttribute('aria-label', 'View notes for ' + s.subject);
      noteBtn.onclick = () => StudyPlannerUtils.showNotification(s.notes || 'No notes', 'info');

      const doneBtn = document.createElement('button');
      doneBtn.className = 'btn ghost';
      doneBtn.setAttribute('aria-label', 'Mark session as done');
      if(s.level > 0){
        doneBtn.textContent = 'Level ' + s.level;
        doneBtn.disabled = true;
        doneBtn.style.opacity = '0.5';
      } else {
        doneBtn.textContent = 'Mark Done';
        doneBtn.onclick = () => {
          s.level = (s.level || 0) + 1;
          s.completedDate = new Date().toISOString().slice(0,10);
          s.date = scheduleNext(s);
          save();
          updateStats();
          render();
          StudyPlannerUtils.showNotification('Session completed! Next review: ' + s.date, 'success');
        };
      }

      const delBtn = document.createElement('button');
      delBtn.className = 'btn ghost';
      delBtn.textContent = 'Delete';
      delBtn.style.color = '#dc2626';
      delBtn.setAttribute('aria-label', 'Delete session');
      delBtn.onclick = () => {
        const modal = confirm('Delete this session?');
        if(modal){
          sessions = sessions.filter(x=>x.id!==s.id);
          save();
          updateStats();
          render();
          StudyPlannerUtils.showNotification('Session deleted', 'info');
        }
      };

      right.appendChild(noteBtn);
      right.appendChild(doneBtn);
      right.appendChild(delBtn);
      li.appendChild(left);
      li.appendChild(right);
      sessionList.appendChild(li);
    });
    // update tag filters after render
    updateTagFilters();
  }

  function escapeHtml(str){ return (str||'').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"})[c]) }

  // Timer
  function formatTime(seconds){
    return StudyPlannerUtils.formatTime(seconds);
  }

  function updateTimerDisplay(){
    qs('timerDisplay').textContent = formatTime(timerSeconds);
  }

  function startTimer(){
    if(timerInterval) return;
    const mins = parseInt(qs('timerMinutes').value, 10) || 25;
    if(timerSeconds === 0) timerSeconds = mins * 60;
    const btn = qs('startTimer');
    const pauseBtn = qs('pauseTimer');
    btn.disabled = true;
    pauseBtn.disabled = false;
    btn.classList.add('loading');
    setTimeout(() => btn.classList.remove('loading'), 500);
    timerInterval = setInterval(() => {
      timerSeconds--;
      updateTimerDisplay();
      if(timerSeconds <= 0){
        clearInterval(timerInterval);
        timerInterval = null;
        btn.disabled = false;
        pauseBtn.disabled = true;
        StudyPlannerUtils.showNotification('Time\'s up! Great study session!', 'success');
        const uses = parseInt(StudyPlannerUtils.getItem('timer_uses') || '0', 10) + 1;
        StudyPlannerUtils.setItem('timer_uses', uses.toString());
        updateBadges();
        timerSeconds = 0;
        updateTimerDisplay();
      }
    }, 1000);
  }

  function pauseTimer(){
    if(timerInterval){
      clearInterval(timerInterval);
      timerInterval = null;
      qs('startTimer').disabled = false;
      qs('pauseTimer').disabled = true;
    }
  }

  function resetTimer(){
    pauseTimer();
    timerSeconds = 0;
    updateTimerDisplay();
    qs('startTimer').disabled = false;
    qs('pauseTimer').disabled = true;
  }

  // Set today's date as default and min date
  const today = new Date();
  const todayStr = today.toISOString().slice(0,10);
  dateInput.value = todayStr;
  dateInput.setAttribute('min', todayStr);

  form.addEventListener('submit', (e)=>{
    e.preventDefault();
    
    // Enhanced validation
    const subjectVal = subject.value.trim();
    const durationVal = parseInt(duration.value, 10);
    const dateVal = dateInput.value;
    const notesVal = notes.value.trim();
    
    // Subject validation
    if(!subjectVal || subjectVal.length < 2){
      StudyPlannerUtils.showNotification('Subject must be at least 2 characters', 'warning');
      subject.focus();
      return;
    }
    if(subjectVal.length > 100){
      StudyPlannerUtils.showNotification('Subject must be less than 100 characters', 'warning');
      subject.focus();
      return;
    }
    
    // Duration validation
    if(!durationVal || durationVal < 1){
      StudyPlannerUtils.showNotification('Duration must be at least 1 minute', 'warning');
      duration.focus();
      return;
    }
    if(durationVal > 480){
      StudyPlannerUtils.showNotification('Duration cannot exceed 8 hours (480 minutes)', 'warning');
      duration.focus();
      return;
    }
    
    // Date validation
    if(!dateVal){
      StudyPlannerUtils.showNotification('Please select a date', 'warning');
      dateInput.focus();
      return;
    }
    const selectedDate = new Date(dateVal);
    const today = new Date();
    today.setHours(0,0,0,0);
    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() + 1);
    if(selectedDate < today){
      StudyPlannerUtils.showNotification('Cannot schedule sessions in the past', 'warning');
      dateInput.focus();
      return;
    }
    if(selectedDate > maxDate){
      StudyPlannerUtils.showNotification('Cannot schedule more than 1 year ahead', 'warning');
      dateInput.focus();
      return;
    }
    
    // Notes validation
    if(notesVal.length > 500){
      StudyPlannerUtils.showNotification('Notes must be less than 500 characters', 'warning');
      notes.focus();
      return;
    }
    
    const s = {
      id: uid(),
      subject: subjectVal,
      date: dateVal,
      time: timeInput.value,
      duration: durationVal,
      notes: notesVal,
      tags: (tagsInput && tagsInput.value) ? tagsInput.value.split(',').map(t=>t.trim()).filter(Boolean) : [],
      level: 0,
      createdAt: new Date().toISOString()
    };
    addSession(s);
    form.reset();
    dateInput.value = new Date().toISOString().slice(0,10);
    StudyPlannerUtils.showNotification('Session added successfully!', 'success');
  });

  importSample.addEventListener('click', ()=>{
    const sample = [
      {id:uid(),subject:'Biology - Chapter 4: Cells',date:today.toISOString().slice(0,10),time:'18:00',duration:45,notes:'Focus on mitochondria and cell structure',level:0,createdAt:new Date().toISOString()},
      {id:uid(),subject:'Spanish Vocabulary - Food',date:new Date(today.getTime()+86400000).toISOString().slice(0,10),time:'16:00',duration:60,notes:'Learn 20 new food-related words',level:0,createdAt:new Date().toISOString()}
    ];
    sessions = sessions.concat(sample);
    save();
    updateStats();
    render();
    StudyPlannerUtils.showNotification('Sample sessions loaded!', 'success');
  });

  // Filter buttons
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      render();
    });
  });

  // Tag filters: build dynamic filters from session tags
  function updateTagFilters(){
    if(!tagFiltersContainer) return;
    const tags = new Set();
    sessions.forEach(s=> (s.tags||[]).forEach(t=> tags.add(t)));
    tagFiltersContainer.innerHTML = '';
    const allBtn = document.createElement('button');
    allBtn.className = 'tab-btn' + (currentFilterTag? '' : ' active');
    allBtn.textContent = 'All Tags';
    allBtn.onclick = () => { currentFilterTag = null; updateTagFilters(); render(); };
    tagFiltersContainer.appendChild(allBtn);
    Array.from(tags).sort().forEach(t => {
      const b = document.createElement('button');
      b.className = 'tab-btn' + (currentFilterTag===t ? ' active' : '');
      b.textContent = t;
      b.onclick = () => { currentFilterTag = (currentFilterTag===t? null : t); updateTagFilters(); render(); };
      tagFiltersContainer.appendChild(b);
    });
  }

  // Timer presets
  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if(timerInterval) pauseTimer();
      const mins = parseInt(btn.dataset.minutes);
      timerSeconds = mins * 60;
      qs('timerMinutes').value = mins;
      updateTimerDisplay();
      qs('startTimer').disabled = false;
    });
  });

  // Quick timer
  qs('startQuickTimer')?.addEventListener('click', () => {
    if(timerInterval) pauseTimer();
    timerSeconds = 25 * 60;
    qs('timerMinutes').value = 25;
    updateTimerDisplay();
    startTimer();
  });

  // CSV export
  function sessionsToCsv(arr){
    const headers = ['id','subject','date','time','duration','notes','level','tags'];
    const esc = v => '"'+String(v||'').replace(/"/g,'""')+'"';
    const rows = arr.map(s=>[
      s.id, s.subject, s.date, s.time || '', s.duration || '', s.notes || '', s.level || 0, (s.tags||[]).join(';')
    ].map(esc).join(','));
    return headers.join(',') + '\n' + rows.join('\n');
  }

  exportCsvBtn?.addEventListener('click', ()=>{
    try{
      const csv = sessionsToCsv(sessions);
      const blob = new Blob([csv], {type:'text/csv'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `studyplanner-sessions-${new Date().toISOString().slice(0,10)}.csv`; a.click(); URL.revokeObjectURL(url);
      StudyPlannerUtils.showNotification('CSV exported', 'success');
    }catch(e){
      console.error(e); StudyPlannerUtils.showNotification('Failed to export CSV', 'error');
    }
  });

  // CSV import (simple parser)
  importFile?.addEventListener('change', (e)=>{
    const file = e.target.files && e.target.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = (ev)=>{
      const text = ev.target.result;
      try{
        const lines = text.split(/\r?\n/).filter(Boolean);
        const header = lines.shift().split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/).map(h=>h.replace(/"/g,'').trim());
        const parsed = lines.map(line=>{
          const cols = line.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/).map(c=>c.replace(/^"|"$/g,'').replace(/""/g,'"'));
          const obj = {};
          header.forEach((h,i)=> obj[h]=cols[i]||'');
          return obj;
        });
        const toSessions = parsed.map(p=>({
          id: p.id || uid(),
          subject: p.subject || 'Untitled',
          date: p.date || new Date().toISOString().slice(0,10),
          time: p.time || '',
          duration: parseInt(p.duration,10) || 30,
          notes: p.notes || '',
          level: parseInt(p.level,10) || 0,
          tags: (p.tags||'').split(';').map(t=>t.trim()).filter(Boolean),
          createdAt: new Date().toISOString()
        }));
        // merge, avoid duplicates by id
        const existingIds = new Set(sessions.map(s=>s.id));
        toSessions.forEach(s=>{ if(!existingIds.has(s.id)) sessions.push(s); });
        save(); updateStats(); render(); StudyPlannerUtils.showNotification('CSV imported', 'success');
      }catch(err){ console.error(err); StudyPlannerUtils.showNotification('Failed to parse CSV', 'error'); }
    };
    reader.readAsText(file);
    e.target.value = '';
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', (ev)=>{
    const active = document.activeElement;
    const ignore = active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable);
    if(ignore) return;
    if(ev.key === 'n' || ev.key === 'N'){
      ev.preventDefault(); subject.focus(); StudyPlannerUtils.showNotification('Focus: New Session', 'info');
    }
    if(ev.key === 't' || ev.key === 'T'){
      ev.preventDefault(); if(timerInterval) pauseTimer(); else startTimer(); StudyPlannerUtils.showNotification('Timer toggled', 'info');
    }
    if(ev.key === 'e' || ev.key === 'E'){
      ev.preventDefault(); qs('exportData')?.click();
    }
    if(ev.key === 'c' || ev.key === 'C'){
      ev.preventDefault(); exportCsvBtn?.click();
    }
    if(ev.key === 'i' || ev.key === 'I'){
      ev.preventDefault(); importFile?.click();
    }
  });

  // Timer events
  qs('startTimer').addEventListener('click', startTimer);
  qs('pauseTimer').addEventListener('click', pauseTimer);
  qs('resetTimer').addEventListener('click', resetTimer);

  // Init
  initTheme();
  load();
  updateStats();
  render();
  updateTimerDisplay();
  qs('pauseTimer').disabled = true;
  StudyPlannerUtils.lazyLoadImages();

  // Welcome Modal
  const TOUR_KEY = 'study_planner_tour_completed';
  let demoStep = 1;
  let demoInterval;

  function showWelcome(){
    qs('welcomeModal').classList.add('active');
    startDemo();
  }

  function hideWelcome(){
    qs('welcomeModal').classList.remove('active');
    stopDemo();
    StudyPlannerUtils.setItem(TOUR_KEY, 'true');
  }

  function startDemo(){
    demoStep = 1;
    updateDemoStep();
    demoInterval = setInterval(() => {
      demoStep = demoStep >= 3 ? 1 : demoStep + 1;
      updateDemoStep();
    }, 3000);
  }

  function stopDemo(){
    if(demoInterval) clearInterval(demoInterval);
  }

  function updateDemoStep(){
    document.querySelectorAll('.demo-step').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.dot').forEach(d => d.classList.remove('active'));
    document.querySelector(`.demo-step[data-step="${demoStep}"]`)?.classList.add('active');
    document.querySelector(`.dot[data-step="${demoStep}"]`)?.classList.add('active');
  }

  qs('welcomeClose')?.addEventListener('click', hideWelcome);
  qs('skipWelcome')?.addEventListener('click', hideWelcome);
  qs('startWelcome')?.addEventListener('click', hideWelcome);
  qs('welcomeModal')?.addEventListener('click', (e) => {
    if(e.target.id === 'welcomeModal') hideWelcome();
  });

  document.querySelectorAll('.dot').forEach(dot => {
    dot.addEventListener('click', () => {
      demoStep = parseInt(dot.dataset.step);
      updateDemoStep();
      stopDemo();
      startDemo();
    });
  });

  qs('helpBtn')?.addEventListener('click', showWelcome);

  // Auto-show for first-time users
  setTimeout(() => {
    if(!StudyPlannerUtils.getItem(TOUR_KEY) && sessions.length === 0){
      showWelcome();
    }
  }, 1000);

  // Export Data Functionality
  qs('exportData')?.addEventListener('click', () => {
    const exportData = {
      version: '1.2',
      exportDate: new Date().toISOString(),
      sessions: sessions,
      stats: {
        totalSessions: sessions.length,
        completedSessions: sessions.filter(s => s.level > 0).length,
        totalMinutes: sessions.filter(s => s.level > 0).reduce((sum, s) => sum + (s.duration || 30), 0),
        currentStreak: calculateStreak()
      },
      badges: BADGE_DEFINITIONS.filter(b => b.check()).map(b => ({id: b.id, name: b.name, description: b.description}))
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `studyplanner-export-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    StudyPlannerUtils.showNotification('Data exported successfully!', 'success');
  });

})();
