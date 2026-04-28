// Study Planner - Timetable Module
// Handles weekly schedule management with localStorage persistence
// Mobile-first responsive: stacked cards on mobile, grid on desktop

document.addEventListener('DOMContentLoaded', () => {
    const timetableGrid = document.getElementById('timetableGrid');
    const btnAddClass = document.getElementById('btnAddClass');
    const modal = document.getElementById('classModal');
    const backdrop = document.getElementById('modalBackdrop');
    const modalTitle = document.getElementById('modalTitle');
    const form = document.getElementById('classForm');
    const btnClose = document.getElementById('modalClose');
    const btnCancel = document.getElementById('btnCancel');

    // Form fields
    const fields = {
        id: null,
        name: document.getElementById('className'),
        day: document.getElementById('classDay'),
        room: document.getElementById('classRoom'),
        startTime: document.getElementById('startTime'),
        endTime: document.getElementById('endTime'),
        priority: document.getElementById('classPriority')
    };

    // State
    let classes = [];
    let editingId = null;
    let pixelsPerHour = 60;
    let currentLayout = null; // 'mobile' | 'desktop'

    // Configuration
    const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
    const TIME_SLOTS = [];
    for (let h = 3; h <= 22; h++) {
        const hour = h.toString().padStart(2, '0');
        TIME_SLOTS.push(`${hour}:00`);
    }

    // Initialize
    init();

    function init() {
        classes = Storage.getTimetable() || [];
        
        buildGrid();
        updatePixelsPerHour();
        renderClasses();
        currentLayout = getLayoutMode();
        
        setupEventListeners();

        // Handle responsive layout switching on resize
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                const newLayout = getLayoutMode();
                if (newLayout !== currentLayout) {
                    currentLayout = newLayout;
                    buildGrid();
                }
                updatePixelsPerHour();
                renderClasses();
            }, 150);
        });
    }

    function getLayoutMode() {
        return window.innerWidth >= 768 ? 'desktop' : 'mobile';
    }

    function setupEventListeners() {
        btnAddClass.addEventListener('click', () => openClassModal());
        btnClose.addEventListener('click', closeModal);
        btnCancel.addEventListener('click', closeModal);
        backdrop.addEventListener('click', (e) => {
            // Only close if clicking directly on backdrop, not on modal content
            if (e.target === backdrop) {
                closeModal();
            }
        });
        form.addEventListener('submit', handleSubmit);

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('active')) {
                closeModal();
            }
        });
    }

    function updatePixelsPerHour() {
        const slot = document.querySelector('.time-slot');
        if (slot) {
            pixelsPerHour = slot.offsetHeight;
        }
    }

    // Build grid structure — mobile: day sections, desktop: grid columns
    function buildGrid() {
        const isDesktop = getLayoutMode() === 'desktop';
        const html = isDesktop ? buildDesktopGrid() : buildMobileGrid();
        timetableGrid.innerHTML = html;

        // Set appropriate ARIA role based on layout
        if (isDesktop) {
            timetableGrid.setAttribute('role', 'grid');
            timetableGrid.setAttribute('aria-label', 'Weekly timetable showing classes per day and time');
        } else {
            timetableGrid.setAttribute('role', 'region');
            timetableGrid.setAttribute('aria-label', 'Weekly timetable grouped by day');
        }
    }

    function buildDesktopGrid() {
        let html = '';

        // Time column header
        html += '<div class="time-column"><div class="time-header">Time</div>';

        TIME_SLOTS.forEach(time => {
            html += `
                <div class="time-slot" data-time="${time}">
                    <time class="time-label" datetime="${time}">${formatTime12h(time)}</time>
                </div>
            `;
        });

        html += '</div>';

        // Day columns
        DAYS.forEach(day => {
            const dayName = capitalizeFirst(day);
            html += `<div class="day-column" data-day="${day}">`;
            html += `<div class="day-header">${dayName}</div>`;

            TIME_SLOTS.forEach(time => {
                html += `<div class="time-slot" data-time="${time}" data-day="${day}"></div>`;
            });

            html += '</div>';
        });

        return html;
    }

    function buildMobileGrid() {
        let html = '';

        DAYS.forEach(day => {
            const dayName = capitalizeFirst(day);
            const dayClasses = classes.filter(c => c.day === day)
                .sort((a, b) => parseTime(a.startTime) - parseTime(b.startTime));

            html += `<section class="day-section" aria-labelledby="day-${day}">`;
            html += `<h3 class="day-section-header" id="day-${day}">`;
            html += `<span>${dayName}</span>`;
            html += `<span class="day-class-count">${dayClasses.length} class${dayClasses.length !== 1 ? 'es' : ''}</span>`;
            html += `</h3>`;
            html += `<div class="day-cards" data-day="${day}">`;

            if (dayClasses.length === 0) {
                html += `<p class="day-empty">No classes scheduled</p>`;
            } else {
                dayClasses.forEach(cls => {
                    const timeRange = `${formatTime12h(cls.startTime)} – ${formatTime12h(cls.endTime)}`;
                    const roomText = cls.room ? `<span class="mc-room"><i class="ph ph-map-pin"></i>${escapeHtml(cls.room)}</span>` : '';
                    html += `
                        <article class="mobile-class-card priority-${cls.priority}"
                                 data-id="${cls.id}"
                                 role="article"
                                 aria-label="${escapeHtml(cls.name)}, ${timeRange}${cls.room ? ', ' + escapeHtml(cls.room) : ''}, ${cls.priority} priority">
                            <div class="mc-body">
                                <span class="mc-subject">${escapeHtml(cls.name)}</span>
                                <div class="mc-meta">
                                    <span class="mc-time"><i class="ph ph-clock"></i>${timeRange}</span>
                                    ${roomText}
                                </div>
                            </div>
                            <div class="mc-actions">
                                <button class="btn-edit" onclick="editClass('${cls.id}')" aria-label="Edit ${escapeHtml(cls.name)}">
                                    <i class="ph ph-pencil"></i>
                                </button>
                                <button class="btn-delete" onclick="deleteClass('${cls.id}')" aria-label="Delete ${escapeHtml(cls.name)}">
                                    <i class="ph ph-trash"></i>
                                </button>
                            </div>
                        </article>
                    `;
                });
            }

            html += `</div></section>`;
        });

        return html;
    }

    // Render all classes onto the grid
    function renderClasses() {
        const isDesktop = getLayoutMode() === 'desktop';

        if (!isDesktop) {
            // Mobile: rebuild the whole mobile grid so day-empty / counts stay in sync
            timetableGrid.innerHTML = buildMobileGrid();
            return;
        }

        // Desktop: clear slots and re-place cards
        document.querySelectorAll('.time-slot').forEach(slot => {
            const time = slot.dataset.time;
            const day = slot.dataset.day;
            slot.innerHTML = '';
            if (time && !day) {
                slot.innerHTML = `<time class="time-label" datetime="${time}">${formatTime12h(time)}</time>`;
            }
        });

        classes.forEach(cls => {
            const slot = document.querySelector(
                `.time-slot[data-time="${cls.startTime}"][data-day="${cls.day}"]`
            );
            if (slot) {
                slot.appendChild(createClassElement(cls, true, slot));
            }
        });
    }

    // Create class card element for either layout
    function createClassElement(cls, isDesktop, slotEl) {
        const el = document.createElement('div');
        
        if (isDesktop) {
            el.className = `desktop-class-card priority-${cls.priority}`;
            el.dataset.id = cls.id;
            
            // Calculate duration in pixels
            const startMinutes = parseTime(cls.startTime);
            const endMinutes = parseTime(cls.endTime);
            const durationMinutes = endMinutes - startMinutes;
            const durationPixels = Math.max((durationMinutes / 60) * pixelsPerHour, 44);
            
            el.style.minHeight = `${durationPixels}px`;
            
            // Calculate top offset: difference between class start and slot start
            const slotTime = slotEl.dataset.time;
            const slotStartMinutes = parseTime(slotTime);
            const offsetMinutes = startMinutes - slotStartMinutes;
            const offsetPixels = (offsetMinutes / 60) * pixelsPerHour;
            el.style.top = `${offsetPixels}px`;
        } else {
            el.className = `mobile-class-card priority-${cls.priority}`;
            el.dataset.id = cls.id;
        }

        // Accessibility: ARIA label
        const timeRange = `${formatTime12h(cls.startTime)} - ${formatTime12h(cls.endTime)}`;
        const roomText = cls.room ? ` in ${cls.room}` : '';
        el.setAttribute('role', 'listitem');
        el.setAttribute('aria-label', `${cls.name}, ${timeRange}${roomText}, ${cls.priority} priority`);

        el.innerHTML = `
            <div class="card-content">
                <div class="card-subject">${escapeHtml(cls.name)}</div>
                ${cls.room ? `<div class="card-room"><i class="ph ph-map-pin"></i> ${escapeHtml(cls.room)}</div>` : ''}
                <div class="card-time"><i class="ph ph-clock"></i> ${timeRange}</div>
            </div>
            <div class="card-actions">
                <button class="btn-edit" onclick="editClass('${cls.id}')" aria-label="Edit ${escapeHtml(cls.name)}">
                    <i class="ph ph-pencil"></i>
                </button>
                <button class="btn-delete" onclick="deleteClass('${cls.id}')" aria-label="Delete ${escapeHtml(cls.name)}">
                    <i class="ph ph-trash"></i>
                </button>
            </div>
        `;

        return el;
    }

    // Modal operations
    window.openClassModal = function(id = null) {
        editingId = id;

        if (id) {
            const cls = classes.find(c => c.id === id);
            if (!cls) return;

            modalTitle.textContent = 'Edit Class';
            fields.name.value = cls.name;
            fields.day.value = cls.day;
            fields.room.value = cls.room || '';
            fields.startTime.value = cls.startTime;
            fields.endTime.value = cls.endTime;
            fields.priority.value = cls.priority;
        } else {
            modalTitle.textContent = 'Add Class';
            form.reset();
            fields.startTime.value = '09:00';
            fields.endTime.value = '10:00';
            fields.priority.value = 'medium';
        }

        modal.classList.add('active');
        backdrop.classList.add('active');
        fields.name.focus();
    };

    function closeModal() {
        modal.classList.remove('active');
        backdrop.classList.remove('active');
        editingId = null;
        form.reset();
    }

    // Form submission
    function handleSubmit(e) {
        e.preventDefault();

        const classData = {
            id: editingId || Utils.generateId(),
            name: fields.name.value.trim(),
            day: fields.day.value,
            room: fields.room.value.trim(),
            startTime: fields.startTime.value,
            endTime: fields.endTime.value,
            priority: fields.priority.value
        };

        // Validate
        if (classData.startTime >= classData.endTime) {
            alert('End time must be after start time');
            return;
        }

        if (hasConflict(classData)) {
            alert('This time slot is already occupied');
            return;
        }

        if (editingId) {
            const index = classes.findIndex(c => c.id === editingId);
            if (index !== -1) {
                classes[index] = classData;
            }
        } else {
            classes.push(classData);
        }

        sortClasses();
        saveAndRender();
        closeModal();
    }

    function hasConflict(newClass) {
        return classes.some(cls => {
            if (cls.id === editingId) return false;
            if (cls.day !== newClass.day) return false;

            const newStart = parseTime(newClass.startTime);
            const newEnd = parseTime(newClass.endTime);
            const clsStart = parseTime(cls.startTime);
            const clsEnd = parseTime(cls.endTime);

            return (newStart < clsEnd && newEnd > clsStart);
        });
    }

    function sortClasses() {
        const dayOrder = { monday: 0, tuesday: 1, wednesday: 2, thursday: 3, friday: 4 };
        classes.sort((a, b) => {
            const dayCompare = dayOrder[a.day] - dayOrder[b.day];
            if (dayCompare !== 0) return dayCompare;
            return parseTime(a.startTime) - parseTime(b.startTime);
        });
    }

    function saveTimetable() {
        Storage.saveTimetable(classes);
    }

    function saveAndRender() {
        saveTimetable();
        renderClasses();
    }

    window.deleteClass = function(id) {
        if (!confirm('Delete this class?')) return;
        classes = classes.filter(c => c.id !== id);
        saveAndRender();
    };

    window.editClass = function(id) {
        openClassModal(id);
    };

    function parseTime(timeStr) {
        const [h, m] = timeStr.split(':').map(Number);
        return h * 60 + m;
    }

    function formatTime12h(time24) {
        const [h, m] = time24.split(':').map(Number);
        const period = h >= 12 ? 'PM' : 'AM';
        const hour12 = h % 12 || 12;
        return `${hour12}:${m.toString().padStart(2, '0')} ${period}`;
    }

    function capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
});
