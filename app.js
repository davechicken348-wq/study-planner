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
  const sessionList = qs('sessionList');
  const importSample = qs('importSample');

  let sessions = [];
  let currentFilter = 'all';
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

  // Set today's date as default
  const today = new Date();
  dateInput.value = today.toISOString().slice(0,10);

  form.addEventListener('submit', (e)=>{
    e.preventDefault();
    if(!StudyPlannerUtils.validateForm('sessionForm')){
      StudyPlannerUtils.showNotification('Please fill in all required fields', 'warning');
      return;
    }
    const s = {
      id: uid(),
      subject: subject.value.trim(),
      date: dateInput.value,
      time: timeInput.value,
      duration: parseInt(duration.value,10)||30,
      notes: notes.value.trim(),
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

})();
