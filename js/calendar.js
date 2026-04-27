// Calendar Page JavaScript
// Handles calendar rendering, navigation, and event management

class Calendar {
    constructor() {
        this.currentDate = new Date();
        this.selectedDate = new Date();
        this.events = this.loadEvents();
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
        
        document.getElementById('deleteEvent').addEventListener('click', () => this.deleteCurrentEvent());
        document.getElementById('editEvent').addEventListener('click', () => this.editCurrentEvent());

        // Keyboard shortcuts
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
                <p style="text-align: center; color: var(--nature-500); padding: 2rem 0;">
                    No events scheduled for this day.
                </p>
                <div class="modal-actions" style="border-top: none; padding: 0 1.5rem 1.5rem; margin-top: 0;">
                    <button type="button" class="btn-primary" onclick="calendar.openEventModal(new Date(${date.getTime()}))">
                        <i class="ph ph-plus"></i> Add Event
                    </button>
                </div>
            `;
        } else {
            let html = '<div class="events-list">';
            dateEvents.forEach((event, index) => {
                html += `
                    <div class="event-detail-item" style="padding: 1rem 0; border-bottom: 1px solid var(--nature-100);">
                        <div style="display: flex; justify-content: space-between; align-items: start;">
                            <div>
                                <h4 style="color: var(--nature-800); margin-bottom: 0.25rem;">${this.escapeHtml(event.title)}</h4>
                                ${event.course ? `<p style="color: var(--nature-600); font-size: 0.9rem; margin-bottom: 0.5rem;">${this.escapeHtml(event.course)}</p>` : ''}
                                <div class="detail-category-badge category-badge-${event.category}">${event.category}</div>
                                ${event.startTime ? `<p style="color: var(--nature-600); font-size: 0.85rem; margin-top: 0.5rem;">
                                    <i class="ph ph-clock"></i> ${event.startTime}${event.endTime ? ' - ' + event.endTime : ''}
                                </p>` : ''}
                            </div>
                            <div style="display: flex; gap: 0.5rem;">
                                <button onclick="calendar.editEvent('${event.id}')" class="btn-secondary" style="padding: 0.4rem 0.75rem; font-size: 0.8rem;">Edit</button>
                                <button onclick="calendar.deleteEvent('${event.id}')" class="btn-secondary" style="padding: 0.4rem 0.75rem; font-size: 0.8rem; color: var(--priority-high);">Delete</button>
                            </div>
                        </div>
                        ${event.description ? `<p style="margin-top: 0.5rem; color: var(--nature-600); font-size: 0.9rem;">${this.escapeHtml(event.description)}</p>` : ''}
                    </div>
                `;
            });
            html += '</div>';
            html += `
                <div class="modal-actions" style="border-top: none; padding: 1rem 1.5rem 0;">
                    <button type="button" class="btn-primary" onclick="calendar.openEventModal(new Date(${date.getTime()}))">
                        <i class="ph ph-plus"></i> Add Another Event
                    </button>
                </div>
            `;
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
            list.innerHTML = todayEvents.map(event => `
                <div class="today-event-item">
                    <span class="event-category">${event.category}</span>
                    <div>
                        <div class="event-title">${this.escapeHtml(event.title)}</div>
                        ${event.startTime ? `<div class="event-time">${event.startTime}${event.endTime ? ' - ' + event.endTime : ''}</div>` : ''}
                    </div>
                </div>
            `).join('');
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
});
