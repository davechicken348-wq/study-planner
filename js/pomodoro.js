// Pomodoro Timer Module
// Handles focus/break timer sessions for study planning

const Pomodoro = {
    // State
    currentMode: 'focus', // 'focus' or 'break'
    timeLeft: 0,
    isRunning: false,
    intervalId: null,
    focusTime: 25 * 60,
    breakTime: 5 * 60,
    
    // Stats
    focusSessions: 0,
    breakSessions: 0,
    
    // DOM elements
    elements: {},
    
    // Initialize
    init() {
        // Cache DOM elements
        this.elements = {
            timerDisplay: document.getElementById('pomodoro-timer'),
            modeLabel: document.getElementById('pomodoro-mode'),
            startBtn: document.getElementById('pomodoro-start'),
            pauseBtn: document.getElementById('pomodoro-pause'),
            resetBtn: document.getElementById('pomodoro-reset'),
            modeIndicator: document.getElementById('pomodoro-mode-indicator'),
            focusDurationInput: document.getElementById('focus-duration'),
            breakDurationInput: document.getElementById('break-duration'),
            focusCount: document.getElementById('pomodoro-focus-count'),
            breakCount: document.getElementById('pomodoro-break-count')
        };
        
        // Check if elements exist
        if (!this.elements.timerDisplay) return;
        
        // Load saved settings
        this.loadSettings();
        
        // Load stats
        this.loadStats();
        
        // Set initial time based on current mode
        this.timeLeft = this.currentMode === 'focus' ? this.focusTime : this.breakTime;
        this.updateDisplay();
        
        // Attach event listeners
        this.setupEventListeners();
    },
    
    // Load settings from localStorage
    loadSettings() {
        const savedFocus = localStorage.getItem('pomodoro-focus');
        const savedBreak = localStorage.getItem('pomodoro-break');
        
        if (savedFocus) {
            this.focusTime = parseInt(savedFocus) * 60;
        }
        if (savedBreak) {
            this.breakTime = parseInt(savedBreak) * 60;
        }
        
        // Update input fields
        if (this.elements.focusDurationInput) {
            this.elements.focusDurationInput.value = this.focusTime / 60;
        }
        if (this.elements.breakDurationInput) {
            this.elements.breakDurationInput.value = this.breakTime / 60;
        }
    },
    
    // Save settings to localStorage
    saveSettings() {
        if (this.elements.focusDurationInput) {
            localStorage.setItem('pomodoro-focus', this.elements.focusDurationInput.value);
        }
        if (this.elements.breakDurationInput) {
            localStorage.setItem('pomodoro-break', this.elements.breakDurationInput.value);
        }
        // Also save to Storage module for export/import consistency
        if (typeof Storage !== 'undefined') {
            Storage.savePomodoro({
                focusTime: this.focusTime,
                breakTime: this.breakTime,
                focusSessions: this.focusSessions,
                breakSessions: this.breakSessions
            });
        }
    },
    
    // Load stats from localStorage
    loadStats() {
        const savedFocus = localStorage.getItem('pomodoro-focus-sessions');
        const savedBreak = localStorage.getItem('pomodoro-break-sessions');
        
        this.focusSessions = savedFocus ? parseInt(savedFocus) : 0;
        this.breakSessions = savedBreak ? parseInt(savedBreak) : 0;
        this.updateStats();
    },
    
    // Save stats to localStorage
    saveStats() {
        localStorage.setItem('pomodoro-focus-sessions', this.focusSessions);
        localStorage.setItem('pomodoro-break-sessions', this.breakSessions);
        // Also save to Storage module for export/import consistency
        if (typeof Storage !== 'undefined') {
            Storage.savePomodoro({
                focusTime: this.focusTime,
                breakTime: this.breakTime,
                focusSessions: this.focusSessions,
                breakSessions: this.breakSessions
            });
        }
    },
    
    // Update stats display
    updateStats() {
        if (this.elements.focusCount) {
            this.elements.focusCount.textContent = this.focusSessions;
        }
        if (this.elements.breakCount) {
            this.elements.breakCount.textContent = this.breakSessions;
        }
    },
    
    // Setup event listeners
    setupEventListeners() {
        if (this.elements.startBtn) {
            this.elements.startBtn.addEventListener('click', () => this.start());
        }
        if (this.elements.pauseBtn) {
            this.elements.pauseBtn.addEventListener('click', () => this.pause());
        }
        if (this.elements.resetBtn) {
            this.elements.resetBtn.addEventListener('click', () => this.reset());
        }
        
        // Settings change listeners
        if (this.elements.focusDurationInput) {
            this.elements.focusDurationInput.addEventListener('change', (e) => {
                const value = parseInt(e.target.value) || 25;
                e.target.value = Math.max(1, Math.min(60, value));
                this.focusTime = parseInt(e.target.value) * 60;
                this.saveSettings();
                
                // If not running, update time based on current mode
                if (!this.isRunning && this.currentMode === 'focus') {
                    this.timeLeft = this.focusTime;
                    this.updateDisplay();
                }
            });
        }
        
        if (this.elements.breakDurationInput) {
            this.elements.breakDurationInput.addEventListener('change', (e) => {
                const value = parseInt(e.target.value) || 5;
                e.target.value = Math.max(1, Math.min(30, value));
                this.breakTime = parseInt(e.target.value) * 60;
                this.saveSettings();
                
                // If not running, update time based on current mode
                if (!this.isRunning && this.currentMode === 'break') {
                    this.timeLeft = this.breakTime;
                    this.updateDisplay();
                }
            });
        }
    },
    
    // Start the timer
    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.updateButtonStates();
        
        this.intervalId = setInterval(() => {
            this.tick();
        }, 1000);
    },
    
    // Pause the timer
    pause() {
        if (!this.isRunning) return;
        
        this.isRunning = false;
        clearInterval(this.intervalId);
        this.intervalId = null;
        this.updateButtonStates();
    },
    
    // Reset the timer
    reset() {
        this.pause();
        this.currentMode = 'focus';
        this.timeLeft = this.focusTime;
        this.updateDisplay();
        this.updateModeIndicator();
    },
    
    // Timer tick (every second)
    tick() {
        this.timeLeft--;
        this.updateDisplay();
        
        if (this.timeLeft <= 0) {
            this.completeSession();
        }
    },
    
    // Complete current session
    completeSession() {
        this.pause();
        this.playNotificationSound();
        this.showNotification();
        
        // Update stats
        if (this.currentMode === 'focus') {
            this.focusSessions++;
        } else {
            this.breakSessions++;
        }
        this.saveStats();
        this.updateStats();
        
        // Switch mode
        if (this.currentMode === 'focus') {
            this.currentMode = 'break';
            this.timeLeft = this.breakTime;
        } else {
            this.currentMode = 'focus';
            this.timeLeft = this.focusTime;
        }
        
        this.updateDisplay();
        this.updateModeIndicator();
    },
    
    // Play notification sound
    playNotificationSound() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            gainNode.gain.value = 0.3;
            
            oscillator.start();
            gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 1);
            oscillator.stop(audioContext.currentTime + 1);
        } catch (e) {
            // Fallback: no sound if not supported
        }
    },
    
    // Show visual notification
    showNotification() {
        const modeText = this.currentMode === 'focus' ? 'Focus Time!' : 'Break Time!';
        const message = this.currentMode === 'focus' 
            ? 'Break time! Take a rest.'
            : 'Focus time! Back to work.';
        
        // Remove existing notification if any
        const existing = document.querySelector('.pomodoro-notification');
        if (existing) {
            existing.remove();
        }
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'pomodoro-notification';
        notification.innerHTML = `
            <strong>${modeText}</strong>
            <p>${message}</p>
        `;
        
        // Add to pomodoro card
        const card = this.elements.timerDisplay.closest('.pomodoro-card');
        if (card) {
            card.appendChild(notification);
            
            // Remove after animation
            setTimeout(() => {
                notification.remove();
            }, 3000);
        }
    },
    
    // Update timer display
    updateDisplay() {
        if (!this.elements.timerDisplay) return;
        
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;
        this.elements.timerDisplay.textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        // Update mode label
        if (this.elements.modeLabel) {
            this.elements.modeLabel.textContent = 
                this.currentMode === 'focus' ? 'Focus Session' : 'Break Time';
        }
        
        this.updateModeIndicator();
    },
    
    // Update mode indicator
    updateModeIndicator() {
        if (!this.elements.modeIndicator) return;
        
        this.elements.modeIndicator.className = 'pomodoro-mode-indicator';
        this.elements.modeIndicator.classList.add(
            this.currentMode === 'focus' ? 'mode-focus' : 'mode-break'
        );
    },
    
    // Update button states
    updateButtonStates() {
        if (this.elements.startBtn) {
            this.elements.startBtn.disabled = this.isRunning;
        }
        if (this.elements.pauseBtn) {
            this.elements.pauseBtn.disabled = !this.isRunning;
        }
    }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Pomodoro.init());
} else {
    Pomodoro.init();
}