// Study Planner - Timetable Module
// Handles weekly schedule management with localStorage persistence

document.addEventListener('DOMContentLoaded', () => {
    const timetableGrid = document.getElementById('timetableGrid');
    const btnAddClass = document.getElementById('btnAddClass');
    const modal = document.getElementById('classModal');
    const modalTitle = document.getElementById('modalTitle');
    const form = document.getElementById('classForm');
    const btnClose = document.getElementById('modalClose');
    const btnCancel = document.getElementById('btnCancel');
    const backdrop = document.querySelector('.modal-backdrop');

    // Form fields
    const fields = {
        id: null, // hidden, for editing
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

    // Configuration
    const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
    const TIME_SLOTS = [];
    for (let h = 8; h <= 18; h++) {
        const hour = h.toString().padStart(2, '0');
        TIME_SLOTS.push(`${hour}:00`);
    }

    // Initialize
    init();

    function init() {
        // Load saved classes
        classes = Storage.getTimetable() || [];
        
        // Build grid structure
        buildGrid();
        
        // Render all classes
        renderClasses();
        
        // Setup event listeners
        setupEventListeners();
    }

    function setupEventListeners() {
        // Add class button
        btnAddClass.addEventListener('click', () => openClassModal());

        // Modal close buttons
        btnClose.addEventListener('click', closeModal);
        btnCancel.addEventListener('click', closeModal);
        backdrop.addEventListener('click', closeModal);

        // Form submission
        form.addEventListener('submit', handleSubmit);

        // Close modal on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('active')) {
                closeModal();
            }
        });
    }

    // Build the complete timetable grid
    function buildGrid() {
        let html = '';

        // Time column header
        html += '<div class="time-column"><div class="time-header">Time</div>';

        // Generate time slots
        TIME_SLOTS.forEach(time => {
            html += `
                <div class="time-slot">
                    <span class="time-label">${formatTime12h(time)}</span>
                </div>
            `;
        });

        html += '</div>';

        // Day columns
        DAYS.forEach(day => {
            const dayName = capitalizeFirst(day);
            html += `<div class="day-column" data-day="${day}">`;
            html += `<div class="day-header">${dayName}</div>`;

            // Time slots for this day
            TIME_SLOTS.forEach(time => {
                html += `<div class="time-slot" data-time="${time}" data-day="${day}"></div>`;
            });

            html += '</div>';
        });

        timetableGrid.innerHTML = html;
    }

    // Render all classes onto the grid
    function renderClasses() {
        // Clear all slots first
        document.querySelectorAll('.time-slot').forEach(slot => {
            slot.innerHTML = '';
        });

        // Place each class
        classes.forEach(cls => {
            const slot = document.querySelector(
                `.time-slot[data-time="${cls.startTime}"][data-day="${cls.day}"]`
            );
            if (slot) {
                slot.appendChild(createClassElement(cls));
            }
        });
    }

    // Create class card element
    function createClassElement(cls) {
        const el = document.createElement('div');
        el.className = `class-card priority-${cls.priority}`;
        el.dataset.id = cls.id;
        
        // Calculate duration in pixels (1 hour = 60px height)
        const startMinutes = parseTime(cls.startTime);
        const endMinutes = parseTime(cls.endTime);
        const duration = (endMinutes - startMinutes) / 60 * 60; // 60px per hour

        el.style.minHeight = `${duration}px`;
        el.innerHTML = `
            <div class="class-content">
                <div class="class-subject">${escapeHtml(cls.name)}</div>
                ${cls.room ? `<div class="class-room"><i class="ph ph-map-pin"></i> ${escapeHtml(cls.room)}</div>` : ''}
                <div class="class-time">${formatTime12h(cls.startTime)} - ${formatTime12h(cls.endTime)}</div>
            </div>
            <div class="class-actions">
                <button class="btn-edit" onclick="editClass('${cls.id}')" aria-label="Edit class">
                    <i class="ph ph-pencil"></i>
                </button>
                <button class="btn-delete" onclick="deleteClass('${cls.id}')" aria-label="Delete class">
                    <i class="ph ph-trash"></i>
                </button>
            </div>
        `;

        return el;
    }

    // Open modal for add/edit
    window.openClassModal = function(id = null) {
        editingId = id;
        
        if (id) {
            // Edit mode - populate form
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
            // Add mode - reset form
            modalTitle.textContent = 'Add Class';
            form.reset();
            fields.startTime.value = '09:00';
            fields.endTime.value = '10:00';
            fields.priority.value = 'medium';
        }

        modal.classList.add('active');
        fields.name.focus();
    };

    function closeModal() {
        modal.classList.remove('active');
        editingId = null;
        form.reset();
    }

    // Handle form submission
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

        // Validate times
        if (classData.startTime >= classData.endTime) {
            alert('End time must be after start time');
            return;
        }

        // Check for conflicts
        if (hasConflict(classData)) {
            alert('This time slot is already occupied');
            return;
        }

        if (editingId) {
            // Update existing
            const index = classes.findIndex(c => c.id === editingId);
            if (index !== -1) {
                classes[index] = classData;
            }
        } else {
            // Add new
            classes.push(classData);
        }

        // Sort and save
        sortClasses();
        saveAndRender();
        closeModal();
    }

    // Check if class conflicts with existing (same day & time overlap)
    function hasConflict(newClass) {
        return classes.some(cls => {
            if (cls.id === editingId) return false; // Skip self
            if (cls.day !== newClass.day) return false;
            
            const newStart = parseTime(newClass.startTime);
            const newEnd = parseTime(newClass.endTime);
            const clsStart = parseTime(cls.startTime);
            const clsEnd = parseTime(cls.endTime);

            return (newStart < clsEnd && newEnd > clsStart);
        });
    }

    // Sort classes by day and start time
    function sortClasses() {
        const dayOrder = { monday: 0, tuesday: 1, wednesday: 2, thursday: 3, friday: 4 };
        classes.sort((a, b) => {
            const dayCompare = dayOrder[a.day] - dayOrder[b.day];
            if (dayCompare !== 0) return dayCompare;
            return parseTime(a.startTime) - parseTime(b.startTime);
        });
    }

    // Save to localStorage
    function saveTimetable() {
        Storage.saveTimetable(classes);
    }

    function saveAndRender() {
        saveTimetable();
        renderClasses();
    }

    // Delete class
    window.deleteClass = function(id) {
        if (!confirm('Delete this class?')) return;
        classes = classes.filter(c => c.id !== id);
        saveAndRender();
    };

    // Edit class
    window.editClass = function(id) {
        openClassModal(id);
    };

    // Helper: parse "HH:MM" to minutes since midnight
    function parseTime(timeStr) {
        const [h, m] = timeStr.split(':').map(Number);
        return h * 60 + m;
    }

    // Format "14:00" to "2:00 PM"
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
