// Smart Notification UI for Dashboard
function initNotificationUI() {
  if (!('Notification' in window)) return;

  const status = notificationManager.getStatus();
  
  if (status.permission === 'default') {
    showPermissionBanner();
  } else if (status.enabled) {
    checkAndShowDueSessions();
  }
  
  addNotificationControls();
}

function showPermissionBanner() {
  const banner = document.createElement('div');
  banner.className = 'notification-permission-banner';
  banner.innerHTML = `
    <div class="banner-content">
      <div class="banner-icon">🔔</div>
      <div class="banner-text">
        <strong>Enable Smart Notifications</strong>
        <p>Get reminded when study sessions are due</p>
      </div>
      <div class="banner-actions">
        <button class="btn-primary-modern" id="enableNotifications">Enable</button>
        <button class="btn-secondary-modern" id="dismissBanner">Later</button>
      </div>
    </div>
  `;
  
  document.querySelector('.dashboard-container').prepend(banner);
  
  document.getElementById('enableNotifications').onclick = async () => {
    const granted = await notificationManager.requestPermission();
    if (granted) {
      banner.remove();
      showToast('✅ Notifications enabled!', 'success');
      notificationManager.testNotification();
      checkAndShowDueSessions();
    } else {
      showToast('❌ Permission denied', 'error');
    }
  };
  
  document.getElementById('dismissBanner').onclick = () => {
    banner.remove();
    localStorage.setItem('notification_banner_dismissed', Date.now());
  };
}

function checkAndShowDueSessions() {
  const { overdue, today, tomorrow } = notificationManager.checkDueSessions();
  const total = overdue.length + today.length;
  
  if (total > 0) {
    showDueSessionsAlert(overdue, today);
    updatePageTitle(total);
  }
}

function showDueSessionsAlert(overdue, today) {
  const existing = document.querySelector('.due-sessions-alert');
  if (existing) existing.remove();
  
  const alert = document.createElement('div');
  alert.className = 'due-sessions-alert';
  
  const total = overdue.length + today.length;
  const isOverdue = overdue.length > 0;
  
  alert.innerHTML = `
    <div class="alert-content">
      <div class="alert-icon">${isOverdue ? '⚠️' : '📚'}</div>
      <div class="alert-text">
        <strong>${isOverdue ? 'Overdue Sessions!' : 'Sessions Due Today'}</strong>
        <p>${total} session${total > 1 ? 's' : ''} waiting for review</p>
      </div>
      <div class="alert-actions">
        <button class="btn-primary-modern btn-sm" onclick="document.getElementById('sessions').scrollIntoView({behavior:'smooth'})">View Sessions</button>
        <button class="btn-secondary-modern btn-sm" onclick="snoozeAllSessions()">Snooze 30m</button>
        <button class="alert-close" onclick="this.closest('.due-sessions-alert').remove()">&times;</button>
      </div>
    </div>
  `;
  
  document.querySelector('.dashboard-container').prepend(alert);
}

function updatePageTitle(count) {
  if (count > 0) {
    document.title = `(${count}) Dashboard - Study Planner`;
  }
}

function addNotificationControls() {
  const settingsBtn = document.createElement('button');
  settingsBtn.className = 'notification-settings-btn';
  settingsBtn.innerHTML = '<i class="fas fa-bell"></i>';
  settingsBtn.title = 'Notification Settings';
  settingsBtn.onclick = showNotificationSettings;
  
  const helpBtn = document.getElementById('helpBtn');
  if (helpBtn) helpBtn.parentElement.insertBefore(settingsBtn, helpBtn);
}

function showNotificationSettings() {
  const s = notificationManager.settings;
  const modal = document.createElement('div');
  modal.className = 'notification-settings-modal';
  modal.innerHTML = `
    <div class="settings-card">
      <div class="settings-header">
        <h2><i class="fas fa-bell"></i> Smart Notifications</h2>
        <button class="close-btn" onclick="this.closest('.notification-settings-modal').remove()">&times;</button>
      </div>
      
      <div class="settings-body">
        <!-- Master Toggle -->
        <div class="setting-row master-toggle">
          <div class="setting-info">
            <i class="fas fa-power-off"></i>
            <div>
              <strong>Enable Notifications</strong>
              <small>Get reminded when sessions are due</small>
            </div>
          </div>
          <label class="toggle-switch">
            <input type="checkbox" id="notifEnabled" ${s.enabled ? 'checked' : ''}>
            <span class="toggle-slider"></span>
          </label>
        </div>

        <div class="settings-divider"></div>

        <!-- Timing Section -->
        <div class="setting-section">
          <h3><i class="fas fa-clock"></i> When to Notify</h3>
          
          <div class="setting-row">
            <div class="setting-info">
              <strong>Frequency</strong>
              <small>How often to check for due sessions</small>
            </div>
            <select id="notifFrequency" class="select-input">
              <option value="smart" ${s.frequency === 'smart' ? 'selected' : ''}>Smart (9AM, 2PM, 7PM)</option>
              <option value="hourly" ${s.frequency === 'hourly' ? 'selected' : ''}>Every Hour</option>
              <option value="twice-daily" ${s.frequency === 'twice-daily' ? 'selected' : ''}>Twice Daily</option>
              <option value="daily" ${s.frequency === 'daily' ? 'selected' : ''}>Once Daily</option>
            </select>
          </div>

          <div class="setting-row">
            <div class="setting-info">
              <strong>Quiet Hours</strong>
              <small>No notifications during this time</small>
            </div>
            <div class="time-inputs">
              <input type="number" id="quietStart" min="0" max="23" value="${s.quietHours.start}" class="time-input">:00
              <span>—</span>
              <input type="number" id="quietEnd" min="0" max="23" value="${s.quietHours.end}" class="time-input">:00
            </div>
          </div>
        </div>

        <div class="settings-divider"></div>

        <!-- Priority Section -->
        <div class="setting-section">
          <h3><i class="fas fa-flag"></i> What to Notify</h3>
          
          <div class="priority-options">
            <label class="priority-option high ${s.priority.high ? 'active' : ''}">
              <input type="checkbox" id="notifHigh" ${s.priority.high ? 'checked' : ''}>
              <div class="priority-content">
                <span class="priority-badge">🔴</span>
                <div>
                  <strong>Overdue</strong>
                  <small>Sessions past due date</small>
                </div>
              </div>
            </label>
            
            <label class="priority-option medium ${s.priority.medium ? 'active' : ''}">
              <input type="checkbox" id="notifMedium" ${s.priority.medium ? 'checked' : ''}>
              <div class="priority-content">
                <span class="priority-badge">🟡</span>
                <div>
                  <strong>Due Today</strong>
                  <small>Sessions scheduled for today</small>
                </div>
              </div>
            </label>
            
            <label class="priority-option low ${s.priority.low ? 'active' : ''}">
              <input type="checkbox" id="notifLow" ${s.priority.low ? 'checked' : ''}>
              <div class="priority-content">
                <span class="priority-badge">🟢</span>
                <div>
                  <strong>Tomorrow</strong>
                  <small>Upcoming sessions</small>
                </div>
              </div>
            </label>
          </div>
        </div>

        <div class="settings-divider"></div>

        <!-- Behavior Section -->
        <div class="setting-section">
          <h3><i class="fas fa-sliders-h"></i> Behavior</h3>
          
          <div class="setting-row">
            <div class="setting-info">
              <strong>Daily Limit</strong>
              <small>Maximum notifications per day</small>
            </div>
            <input type="number" id="maxPerDay" min="1" max="20" value="${s.maxPerDay}" class="number-input">
          </div>

          <div class="setting-row">
            <div class="setting-info">
              <strong>Snooze Duration</strong>
              <small>Minutes to postpone reminders</small>
            </div>
            <input type="number" id="snoozeDuration" min="5" max="120" step="5" value="${s.snoozeMinutes}" class="number-input">
          </div>

          <div class="setting-row">
            <div class="setting-info">
              <i class="fas fa-volume-up"></i>
              <strong>Sound</strong>
            </div>
            <label class="toggle-switch">
              <input type="checkbox" id="notifSound" ${s.sound ? 'checked' : ''}>
              <span class="toggle-slider"></span>
            </label>
          </div>

          <div class="setting-row">
            <div class="setting-info">
              <i class="fas fa-mobile-alt"></i>
              <strong>Vibrate</strong>
            </div>
            <label class="toggle-switch">
              <input type="checkbox" id="notifVibrate" ${s.vibrate ? 'checked' : ''}>
              <span class="toggle-slider"></span>
            </label>
          </div>
        </div>
      </div>
      
      <div class="settings-footer">
        <button class="btn-test" onclick="notificationManager.testNotification()">
          <i class="fas fa-vial"></i> Test
        </button>
        <button class="btn-save" onclick="saveNotificationSettings()">
          <i class="fas fa-check"></i> Save Settings
        </button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
  
  // Add interactivity to priority options
  modal.querySelectorAll('.priority-option input').forEach(input => {
    input.onchange = () => {
      input.closest('.priority-option').classList.toggle('active', input.checked);
    };
  });
}

function saveNotificationSettings() {
  const newSettings = {
    enabled: document.getElementById('notifEnabled').checked,
    frequency: document.getElementById('notifFrequency').value,
    quietHours: {
      start: parseInt(document.getElementById('quietStart').value),
      end: parseInt(document.getElementById('quietEnd').value)
    },
    priority: {
      high: document.getElementById('notifHigh').checked,
      medium: document.getElementById('notifMedium').checked,
      low: document.getElementById('notifLow').checked
    },
    snoozeMinutes: parseInt(document.getElementById('snoozeDuration').value),
    maxPerDay: parseInt(document.getElementById('maxPerDay').value),
    smartTiming: document.getElementById('notifFrequency').value === 'smart',
    sound: document.getElementById('notifSound').checked,
    vibrate: document.getElementById('notifVibrate').checked
  };
  
  notificationManager.saveSettings(newSettings);
  notificationManager.stopDailyCheck();
  if (newSettings.enabled) notificationManager.startSmartCheck();
  
  document.querySelector('.notification-settings-modal').remove();
  showToast('✅ Settings saved!', 'success');
}

function snoozeAllSessions() {
  const { overdue, today } = notificationManager.checkDueSessions();
  [...overdue, ...today].forEach(s => notificationManager.snoozeSession(s.id));
  showToast('🔔 Snoozed for 30 minutes', 'success');
  document.querySelector('.due-sessions-alert')?.remove();
}

function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  toast.style.cssText = 'position:fixed;bottom:20px;right:20px;padding:12px 20px;background:#111;color:#fff;border-radius:8px;z-index:10000;box-shadow:0 4px 12px rgba(0,0,0,0.3)';
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.transition = 'opacity 300ms';
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initNotificationUI);
} else {
  initNotificationUI();
}
