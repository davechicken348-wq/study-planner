// Calendar Page JavaScript
// Handles calendar rendering, navigation, and event management

class Calendar {
    constructor() {
        this.currentDate = new Date();
        this.selectedDate = new Date();
        this.events = this.loadEvents();

        // Backward compatibility: ensure reminder field exists, default to true
        this.events = this.events.map(ev => ({
            ...ev,
            reminder: ev.reminder !== undefined ? ev.reminder : true
        }));

        this.categories = [
            { value: 'exam', label: 'Exam', color: '#ef4444' },
            { value: 'project', label: 'Project', color: '#be185d' },
            { value: 'homework', label: 'Homework', color: '#1d4ed8' },
            { value: 'lab', label: 'Lab', color: '#92400e' },
            { value: 'meeting', label: 'Meeting', color: '#7c3aed' },
            { value: 'other', label: 'Other', color: '#6b7280' }
        ];

        this.init();
    }

    init() {
        this.renderCalendar();
        this.bindEvents();
        this.updateTodaysEvents();
        this.updateHeader();
    }

    bindEvents() {
        document.getElementById('prevMonth').addEventListener('click', () => this.changeMonth(-1));
        document.getElementById('nextMonth').addEventListener('click', () => this.changeMonth(1));
        document.getElementById('todayBtn').addEventListener('click', () => this.goToToday());
        document.getElementById('addEventBtn').addEventListener('click', () => this.openEventModal());
        
        document.getElementById('closeModal').addEventListener('click', () => this.closeModal());
        document.getElementById('eventModal').addEventListener('click', (e) => {
            if (e.target.id === 'eventModal') this.closeModal();
        });
        
        document.getElementById('closeDetail').addEventListener('click', () => this.closeDetailModal());
        document.getElementById('detailModal').addEventListener('click', (e) => {
            if (e.target.id === 'detailModal') this.closeDetailModal();
        });

        document.getElementById('eventForm').addEventListener('submit', (e) => this.saveEvent(e));
        document.getElementById('cancelEvent').addEventListener('click', () => this.closeModal());
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
                this.closeDetailModal();
            }
        });
    }

    changeMonth(delta) {
        this.currentDate.setMonth(this.currentDate.getMonth() + delta);
        this.renderCalendar();
        this.updateHeader();
    }

    goToToday() {
        this.currentDate = new Date();
        this.selectedDate = new Date();
        this.renderCalendar();
        this.updateHeader();
        this.updateTodaysEvents();
        this.scrollToToday();
    }

    scrollToToday() {
        const todayCell = document.querySelector('.calendar-day.today');
        if (todayCell) {
            todayCell.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }

    updateHeader() {
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'];
        const monthName = monthNames[this.currentDate.getMonth()];
        const year = this.currentDate.getFullYear();
        document.getElementById('currentMonthYear').textContent = `${monthName} ${year}`;
    }

    renderCalendar() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();

        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const firstDayOfMonth = new Date(year, month, 1).getDay();

        const prevMonthDays = new Date(year, month, 0).getDate();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const calendarDays = document.getElementById('calendarDays');
        calendarDays.innerHTML = '';

        // Previous month days
        for (let i = firstDayOfMonth - 1; i >= 0; i--) {
            const day = prevMonthDays - i;
            const cell = this.createDayCell(day, month - 1, year, true);
            calendarDays.appendChild(cell);
        }

        // Current month days
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const isToday = date.getTime() === today.getTime();
            const cell = this.createDayCell(day, month, year, false, isToday);
            calendarDays.appendChild(cell);
        }

        // Next month days
        const totalCells = 42; // 6 rows x 7 days
        const remainingCells = totalCells - (firstDayOfMonth + daysInMonth);
        for (let day = 1; day <= remainingCells; day++) {
            const cell = this.createDayCell(day, month + 1, year, true);
            calendarDays.appendChild(cell);
        }
    }

    createDayCell(day, month, year, isOtherMonth, isToday = false) {
        const cell = document.createElement('div');
        cell.className = 'calendar-day';
        if (isOtherMonth) cell.classList.add('other-month');
        if (isToday) cell.classList.add('today');

        const dayNumber = document.createElement('div');
        dayNumber.className = 'day-number';
        dayNumber.textContent = day;
        cell.appendChild(dayNumber);

        const date = new Date(year, month, day);
        const dateStr = this.formatDate(date);
        const dayEvents = this.getEventsForDate(dateStr);

        if (dayEvents.length > 0) {
            cell.classList.add('has-event');
            const categories = [...new Set(dayEvents.map(e => e.category))];
            categories.forEach(cat => cell.classList.add(`event-${cat}`));

            const dayEventsContainer = document.createElement('div');
            dayEventsContainer.className = 'day-events';

            dayEvents.slice(0, 3).forEach(event => {
                const eventEl = document.createElement('div');
                eventEl.className = `day-event event-${event.category}`;
                eventEl.textContent = event.title;
                eventEl.title = `${event.title} - ${event.course || ''}`;
                dayEventsContainer.appendChild(eventEl);
            });

            if (dayEvents.length > 3) {
                const moreEl = document.createElement('div');
                moreEl.className = 'day-event event-other';
                moreEl.textContent = `+${dayEvents.length - 3} more`;
                dayEventsContainer.appendChild(moreEl);
            }

            cell.appendChild(dayEventsContainer);
        }

        cell.addEventListener('click', () => this.selectDate(date, cell));

        return cell;
    }

    selectDate(date, cell) {
        this.selectedDate = date;
        document.querySelectorAll('.calendar-day.selected').forEach(c => c.classList.remove('selected'));
        cell.classList.add('selected');
        this.openDetailModal(date);
    }

    openEventModal(date = null) {
        const dateToUse = date || this.selectedDate;
        document.getElementById('eventDate').value = this.formatDate(dateToUse);
        document.getElementById('eventTitle').value = '';
        document.getElementById('eventCourse').value = '';
        document.getElementById('eventStart').value = '';
        document.getElementById('eventEnd').value = '';
        document.getElementById('eventCategory').value = 'other';
        document.getElementById('eventDescription').value = '';
        document.getElementById('eventReminder').checked = true;
        
        document.getElementById('eventModal').classList.add('active');
        document.getElementById('eventTitle').focus();
    }

    closeModal() {
        document.getElementById('eventModal').classList.remove('active');
    }

    openDetailModal(date) {
        const dateStr = this.formatDate(date);
        const dateEvents = this.getEventsForDate(dateStr);
        
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'];
        const formatted = `${monthNames[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
        
        document.getElementById('detailTitle').textContent = formatted;
        
        const body = document.getElementById('detailBody');
        
        if (dateEvents.length === 0) {
            body.innerHTML = `
                <div class="no-events-detailed">
                    <i class="ph ph-calendar-x"></i>
                    <p>No events scheduled for this day.</p>
                    <button type="button" class="btn-primary" onclick="calendar.openEventModal(new Date(${date.getTime()}))">
                        <i class="ph ph-plus"></i> Add Event
                    </button>
                </div>
            `;
        } else {
            let html = '<div class="events-list">';
            dateEvents.forEach(event => {
                const timeLabel = event.startTime
                    ? `${event.startTime}${event.endTime ? ' – ' + event.endTime : ''}`
                    : 'All day';
                html += `
                    <div class="event-detail-item event-detail-${event.category}" data-event-id="${event.id}">
                        <div class="event-detail-top">
                            <div class="event-detail-title-row">
                                <h4>${this.escapeHtml(event.title)}</h4>
                                <span class="event-category-badge category-badge-${event.category}">${event.category}</span>
                            </div>
                            <div class="event-detail-meta">
                                <span class="event-time"><i class="ph ph-clock" aria-hidden="true"></i>${timeLabel}</span>
                                ${event.course ? `<span class="event-course-tag"><i class="ph ph-book-open" aria-hidden="true"></i>${this.escapeHtml(event.course)}</span>` : ''}
                            </div>
                            ${event.description ? `<p class="event-description">${this.escapeHtml(event.description)}</p>` : ''}
                        </div>
                        <div class="event-actions">
                            <button type="button" class="btn-edit-event" onclick="calendar.editEvent('${event.id}')" aria-label="Edit ${this.escapeHtml(event.title)}">
                                <i class="ph ph-pencil-simple" aria-hidden="true"></i> Edit
                            </button>
                            <button type="button" class="btn-delete-event" onclick="calendar.deleteEvent('${event.id}')" aria-label="Delete ${this.escapeHtml(event.title)}">
                                <i class="ph ph-trash" aria-hidden="true"></i> Delete
                            </button>
                        </div>
                    </div>
                `;
            });
            html += `</div>
                <div class="detail-add-btn">
                    <button type="button" class="btn-primary" onclick="calendar.openEventModal(new Date(${date.getTime()}))">
                        <i class="ph ph-plus"></i> Add Another Event
                    </button>
                </div>`;
            body.innerHTML = html;
        }
        
        document.getElementById('detailModal').classList.add('active');
    }

    closeDetailModal() {
        document.getElementById('detailModal').classList.remove('active');
    }

    saveEvent(e) {
        e.preventDefault();

        const event = {
            id: 'evt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            date: document.getElementById('eventDate').value,
            title: document.getElementById('eventTitle').value.trim(),
            course: document.getElementById('eventCourse').value.trim(),
            category: document.getElementById('eventCategory').value,
            startTime: document.getElementById('eventStart').value,
            endTime: document.getElementById('eventEnd').value,
            description: document.getElementById('eventDescription').value.trim(),
            reminder: document.getElementById('eventReminder').checked
        };

        if (!event.title) {
            alert('Please enter an event title.');
            return;
        }

        this.events.push(event);
        this.saveEvents();
        this.renderCalendar();
        this.updateTodaysEvents();
        this.closeModal();

        // Show success notification
        this.showNotification('Event saved successfully!');

        // Trigger reminder check
        this.triggerNotificationCheck();
    }

    editEvent(eventId) {
        const event = this.events.find(e => e.id === eventId);
        if (!event) return;

        const date = new Date(event.date);
        this.selectedDate = date;

        document.getElementById('eventDate').value = event.date;
        document.getElementById('eventTitle').value = event.title;
        document.getElementById('eventCourse').value = event.course;
        document.getElementById('eventCategory').value = event.category;
        document.getElementById('eventStart').value = event.startTime;
        document.getElementById('eventEnd').value = event.endTime;
        document.getElementById('eventDescription').value = event.description;
        document.getElementById('eventReminder').checked = event.reminder;

        this.closeDetailModal();
        document.getElementById('eventModal').classList.add('active');

        // Remove old event and add updated one on save
        document.getElementById('eventForm').onsubmit = (e) => {
            e.preventDefault();
            event.title = document.getElementById('eventTitle').value.trim();
            event.course = document.getElementById('eventCourse').value.trim();
            event.category = document.getElementById('eventCategory').value;
            event.startTime = document.getElementById('eventStart').value;
            event.endTime = document.getElementById('eventEnd').value;
            event.description = document.getElementById('eventDescription').value.trim();
            event.reminder = document.getElementById('eventReminder').checked;

            this.saveEvents();
            this.renderCalendar();
            this.updateTodaysEvents();
            this.closeModal();
            this.showNotification('Event updated successfully!');

            // Trigger reminder check
            this.triggerNotificationCheck();
        };
    }

    deleteEvent(eventId) {
        if (confirm('Are you sure you want to delete this event?')) {
            this.events = this.events.filter(e => e.id !== eventId);
            this.saveEvents();
            this.renderCalendar();
            this.updateTodaysEvents();
            this.closeDetailModal();
            this.showNotification('Event deleted successfully!');

            // Trigger reminder check
            this.triggerNotificationCheck();
        }
    }

    deleteCurrentEvent() {
        const eventId = document.getElementById('detailModal').dataset.editingId;
        if (eventId) {
            this.deleteEvent(eventId);
        }
    }

    showNotification(message) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, var(--green-600), var(--green-500));
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 10px;
            box-shadow: var(--shadow-lg);
            z-index: 10000;
            animation: slideInRight 0.3s ease;
            font-weight: 500;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    getEventsForDate(dateStr) {
        return this.events.filter(e => e.date === dateStr).sort((a, b) => {
            if (a.startTime && b.startTime) return a.startTime.localeCompare(b.startTime);
            return 0;
        });
    }

    updateTodaysEvents() {
        const todayStr = this.formatDate(new Date());
        const todayEvents = this.getEventsForDate(todayStr);
        const list = document.getElementById('todaysEventsList');

        if (todayEvents.length === 0) {
            list.innerHTML = '<p class="no-events">No events today</p>';
        } else {
            list.innerHTML = todayEvents.map(event => {
                const timeLabel = event.startTime ? `${event.startTime}${event.endTime ? ' - ' + event.endTime : ''}` : 'All day';
                return `
                <div class="today-event-item" role="button" tabindex="0" aria-label="${event.title}, ${event.category}, ${timeLabel}" onclick="calendar.openDetailModal(new Date())" onkeypress="if(event.key==='Enter'||event.key===' ') calendar.openDetailModal(new Date())">
                    <span class="event-category" aria-hidden="true">${event.category}</span>
                    <div class="event-details">
                        <div class="event-title">${this.escapeHtml(event.title)}</div>
                        ${event.startTime ? `<div class="event-time"><i class="ph ph-clock" aria-hidden="true"></i> ${event.startTime}${event.endTime ? ' - ' + event.endTime : ''}</div>` : ''}
                    </div>
                </div>
            `}).join('');
        }
    }

    formatDate(date) {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    triggerNotificationCheck() {
        if (typeof Notifications !== 'undefined') {
            Notifications.triggerImmediateCheck();
        }
    }

    loadEvents() {
        try {
            const stored = localStorage.getItem('studyPlanner_events');
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            console.error('Failed to load events:', e);
            return [];
        }
    }

    saveEvents() {
        try {
            localStorage.setItem('studyPlanner_events', JSON.stringify(this.events));
        } catch (e) {
            console.error('Failed to save events:', e);
        }
    }
}

// Initialize calendar when DOM is ready
let calendar;
document.addEventListener('DOMContentLoaded', () => {
    calendar = new Calendar();
    initHeroSlideshow();

    // Trigger initial notification check
    if (typeof Notifications !== 'undefined') {
        const reminderEvents = calendar.events.filter(e => e.reminder);
        Notifications.triggerImmediateCheck(reminderEvents, [], []);
    }
});

// ==========================================
// HERO SECTION SLIDESHOW
// ==========================================

class HeroSlideshow {
    constructor() {
        this.slides = document.querySelectorAll('.hero-slide');
        this.titleElement = document.getElementById('heroTitle');
        this.messageElement = document.getElementById('heroMessage');
        this.indicatorsContainer = document.querySelector('.hero-indicators');
        
        this.currentIndex = 0;
        this.slideInterval = null;
        this.slideDuration = 5000; // 5 seconds per slide
        
        this.titles = [
            "Study Calendar",
            "Plan Your Success",
            "Stay Organized",
            "Achieve Your Goals",
            "Master Your Time"
        ];
        
        this.messages = [
            "Organize your academic schedule and track important dates",
            "Turn your dreams into plans with smart scheduling",
            "A clear plan leads to better results",
            "Every goal needs a plan to achieve it",
            "Time management is the key to success"
        ];
        
        this.init();
    }
    
    init() {
        // Create indicators
        this.createIndicators();
        
        // Start slideshow
        this.startSlideshow();
        
        // Pause on hover
        const heroSection = document.querySelector('.hero-section');
        heroSection.addEventListener('mouseenter', () => this.pauseSlideshow());
        heroSection.addEventListener('mouseleave', () => this.startSlideshow());
        
        // Click on indicators to switch
        document.querySelectorAll('.hero-dot').forEach((dot, index) => {
            dot.addEventListener('click', () => {
                this.goToSlide(index);
                this.resetInterval();
            });
        });
    }
    
    createIndicators() {
        this.slides.forEach((_, index) => {
            const dot = document.createElement('div');
            dot.className = `hero-dot ${index === 0 ? 'active' : ''}`;
            dot.setAttribute('data-index', index);
            this.indicatorsContainer.appendChild(dot);
        });
    }
    
    updateIndicators() {
        document.querySelectorAll('.hero-dot').forEach((dot, index) => {
            dot.classList.toggle('active', index === this.currentIndex);
        });
    }
    
    goToSlide(index) {
        // Remove active from current slide
        this.slides[this.currentIndex].classList.remove('active');
        
        // Update index
        this.currentIndex = index;
        
        // Add active to new slide
        this.slides[this.currentIndex].classList.add('active');
        
        // Update indicators
        this.updateIndicators();
        
        // Update content with animation
        this.animateContentChange();
    }
    
    nextSlide() {
        const nextIndex = (this.currentIndex + 1) % this.slides.length;
        this.goToSlide(nextIndex);
    }
    
    startSlideshow() {
        this.slideInterval = setInterval(() => {
            this.nextSlide();
        }, this.slideDuration);
    }
    
    pauseSlideshow() {
        clearInterval(this.slideInterval);
    }
    
    resetInterval() {
        clearInterval(this.slideInterval);
        this.startSlideshow();
    }
    
    animateContentChange() {
        // Fade out
        this.titleElement.style.animation = 'none';
        this.messageElement.style.animation = 'none';
        
        // Trigger reflow
        void this.titleElement.offsetWidth;
        void this.messageElement.offsetWidth;
        
        // Use modulo to cycle through titles and messages
        const titleIndex = this.currentIndex % this.titles.length;
        const messageIndex = this.currentIndex % this.messages.length;
        
        // Update text
        this.titleElement.textContent = this.titles[titleIndex];
        this.messageElement.textContent = this.messages[messageIndex];
        
        // Fade in with animation
        this.titleElement.style.animation = 'fadeInUp 0.8s ease';
        this.messageElement.style.animation = 'fadeInUp 0.8s ease 0.2s both';
    }
}

function initHeroSlideshow() {
    new HeroSlideshow();
}
