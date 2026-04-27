// Study Planner - Planner Module
// Handles task management, filtering, and UI updates

document.addEventListener('DOMContentLoaded', () => {
    // DOM element references
    const elements = {
        taskTitle: document.getElementById('taskTitle'),
        taskCourse: document.getElementById('taskCourse'),
        taskCategory: document.getElementById('taskCategory'),
        taskDate: document.getElementById('taskDate'),
        taskPriority: document.getElementById('taskPriority'),
        addTaskBtn: document.getElementById('addTaskBtn'),
        taskList: document.getElementById('taskList'),
        emptyState: document.getElementById('emptyState'),
        filterBtns: document.querySelectorAll('.filter-btn'),
        taskSearch: document.getElementById('taskSearch'),
        categoryFilters: document.querySelectorAll('.category-filter'),
        selectAllBtn: document.getElementById('selectAllBtn'),
        completeSelectedBtn: document.getElementById('completeSelectedBtn'),
        deleteSelectedBtn: document.getElementById('deleteSelectedBtn'),
        selectedCount: document.getElementById('selectedCount'),
        bulkActions: document.querySelector('.bulk-actions')
    };

    // Application state
    let tasks = [];
    let currentFilter = 'all';
    let currentCategoryFilter = 'all';
    let searchQuery = '';

    // Initialize app
    init();

    function init() {
        // Load saved tasks from localStorage
        tasks = Storage.getTasks() || [];
        
        // Sort tasks by date and priority
        sortTasks();
        
        // Set default date to today
        elements.taskDate.valueAsDate = new Date();
        
        // Setup event listeners
        setupEventListeners();
        
        // Initial render
        renderTasks();
    }

    function setupEventListeners() {
        // Add task button click
        elements.addTaskBtn.addEventListener('click', addTask);
        
        // Enter key on title input
        elements.taskTitle.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') addTask();
        });

        // Filter button clicks
        elements.filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                // Update active state
                elements.filterBtns.forEach(b => {
                    b.classList.remove('active');
                    b.setAttribute('aria-pressed', 'false');
                });
                btn.classList.add('active');
                btn.setAttribute('aria-pressed', 'true');
                
                // Update filter and re-render
                currentFilter = btn.dataset.filter;
                renderTasks();
            });
        });

        // Category filter clicks
        elements.categoryFilters.forEach(btn => {
            btn.addEventListener('click', () => {
                // Update active state
                elements.categoryFilters.forEach(b => {
                    b.classList.remove('active');
                });
                btn.classList.add('active');
                
                // Update category filter and re-render
                currentCategoryFilter = btn.dataset.category;
                renderTasks();
            });
        });

        // Search input
        if (elements.taskSearch) {
            elements.taskSearch.addEventListener('input', (e) => {
                searchQuery = e.target.value.toLowerCase();
                renderTasks();
            });
        }

        // Bulk action buttons
        if (elements.selectAllBtn) {
            elements.selectAllBtn.addEventListener('click', selectAllTasks);
        }
        if (elements.completeSelectedBtn) {
            elements.completeSelectedBtn.addEventListener('click', completeSelectedTasks);
        }
        if (elements.deleteSelectedBtn) {
            elements.deleteSelectedBtn.addEventListener('click', deleteSelectedTasks);
        }

        // Export/Import buttons
        const exportBtn = document.getElementById('exportBtn');
        const importBtn = document.getElementById('importBtn');
        const importFile = document.getElementById('importFile');

        if (exportBtn) {
            exportBtn.addEventListener('click', exportTasks);
        }
        if (importBtn && importFile) {
            importBtn.addEventListener('click', () => importFile.click());
            importFile.addEventListener('change', importTasks);
        }
    }

    // Export tasks to JSON file
    function exportTasks() {
        const data = Storage.exportData();
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `study-planner-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        // Show export summary
        const parsed = JSON.parse(data);
        const taskCount = parsed.data.tasks.itemCount;
        const timetableCount = parsed.data.timetable.itemCount;
        const hasPomodoro = !!parsed.data.pomodoro.items;
        
        alert(`Export complete!\n\nTasks: ${taskCount}\nTimetable entries: ${timetableCount}\nPomodoro settings: ${hasPomodoro ? 'Included' : 'None'}`);
    }

    // Import tasks from JSON file
    function importTasks(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        // Validate file type
        if (!file.name.endsWith('.json')) {
            alert('Please select a valid JSON file.');
            event.target.value = '';
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const result = Storage.importData(e.target.result);
            
            if (result.success) {
                // Show detailed import summary
                let summary = `Import successful!\n\n`;
                summary += `Version: ${result.version}\n`;
                summary += `Imported at: ${new Date(result.importedAt).toLocaleString()}\n\n`;
                summary += `Tasks: ${result.tasks.imported} imported${result.tasks.skipped > 0 ? `, ${result.tasks.skipped} skipped` : ''}\n`;
                summary += `Timetable: ${result.timetable.imported} imported${result.timetable.skipped > 0 ? `, ${result.timetable.skipped} skipped` : ''}\n`;
                
                if (result.pomodoro.imported > 0) {
                    summary += `Pomodoro settings: ${result.pomodoro.imported} imported\n`;
                }
                
                if (result.warnings.length > 0) {
                    summary += `\nWarnings:\n${result.warnings.map(w => `  - ${w}`).join('\n')}\n`;
                }
                
                alert(summary);
                
                // Reload data and render
                tasks = Storage.getTasks() || [];
                sortTasks();
                renderTasks();
                
            } else {
                // Show error details
                let errorMsg = 'Import failed:\n\n';
                errorMsg += result.errors.join('\n');
                if (result.warnings.length > 0) {
                    errorMsg += '\n\nWarnings:\n' + result.warnings.join('\n');
                }
                alert(errorMsg);
            }
        };
        reader.readAsText(file);
        event.target.value = ''; // Reset for re-import
    }

    // Add a new task
    function addTask() {
        const title = elements.taskTitle.value.trim();
        const course = elements.taskCourse.value.trim();
        const category = elements.taskCategory.value;
        const date = elements.taskDate.value;
        const priority = elements.taskPriority.value;

        // Validation with visual feedback
        let isValid = true;
        const errors = [];
        
        // Clear previous errors
        elements.taskTitle.classList.remove('input-error');
        elements.taskDate.classList.remove('input-error');
        elements.taskCourse.classList.remove('input-error');
        
        // Validate title
        if (!title) {
            elements.taskTitle.classList.add('input-error');
            errors.push('Task title is required');
            isValid = false;
        } else if (title.length > 200) {
            elements.taskTitle.classList.add('input-error');
            errors.push('Task title must be 200 characters or less');
            isValid = false;
        }
        
        // Validate date
        if (!date) {
            elements.taskDate.classList.add('input-error');
            errors.push('Due date is required');
            isValid = false;
        } else {
            const selectedDate = new Date(date);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            if (selectedDate < today) {
                elements.taskDate.classList.add('input-error');
                errors.push('Due date cannot be in the past');
                isValid = false;
            }
        }
        
        // Validate course length (optional but check if provided)
        if (course && course.length > 100) {
            elements.taskCourse.classList.add('input-error');
            errors.push('Course name must be 100 characters or less');
            isValid = false;
        }
        
        if (!isValid) {
            // Focus on first error field
            if (errors.some(e => e.includes('title'))) {
                elements.taskTitle.focus();
            } else if (errors.some(e => e.includes('date'))) {
                elements.taskDate.focus();
            } else if (errors.some(e => e.includes('Course'))) {
                elements.taskCourse.focus();
            }
            
            // Show error to user
            alert('Please fix the following:\n\n' + errors.join('\n'));
            return;
        }

        // Create task object
        const task = {
            id: Utils.generateId(),
            title: title,
            course: course || 'Uncategorized',
            category: category,
            date: date,
            completed: false,
            priority: priority
        };

        // Add to tasks array
        tasks.push(task);
        
        // Sort, save, and render
        sortTasks();
        saveAndRender();

        // Clear form and focus on title for rapid entry
        elements.taskTitle.value = '';
        elements.taskCourse.value = '';
        elements.taskCategory.value = 'general';
        elements.taskDate.valueAsDate = new Date();
        elements.taskPriority.value = 'medium';
        elements.taskTitle.focus();
    }

    // Sort tasks by date (ascending) then by priority (high > medium > low)
    function sortTasks() {
        tasks.sort((a, b) => {
            const dateCompare = new Date(a.date) - new Date(b.date);
            if (dateCompare !== 0) return dateCompare;
            
            const priorityOrder = { high: 0, medium: 1, low: 2 };
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        });
    }

    // Persist tasks to localStorage
    function saveTasks() {
        Storage.saveTasks(tasks);
    }

    // Combine save + render
    function saveAndRender() {
        saveTasks();
        renderTasks();
    }

    // Get tasks filtered by current filter
    function getFilteredTasks() {
        let filtered = [...tasks];
        
        // Apply time filter
        switch (currentFilter) {
            case 'today':
                filtered = filtered.filter(task => Utils.isToday(task.date));
                break;
            case 'upcoming':
                filtered = filtered.filter(task => Utils.isUpcoming(task.date));
                break;
        }
        
        // Apply category filter
        if (currentCategoryFilter !== 'all') {
            filtered = filtered.filter(task => task.category === currentCategoryFilter);
        }
        
        // Apply search filter
        if (searchQuery) {
            filtered = filtered.filter(task => 
                task.title.toLowerCase().includes(searchQuery) ||
                task.course.toLowerCase().includes(searchQuery) ||
                task.category.toLowerCase().includes(searchQuery)
            );
        }
        
        return filtered;
    }

    // Bulk action functions
    function updateSelectedCount() {
        const checkedCount = document.querySelectorAll('.task-item input[type="checkbox"]:checked').length;
        if (elements.selectedCount) {
            elements.selectedCount.textContent = `${checkedCount} selected`;
        }
        if (elements.bulkActions) {
            elements.bulkActions.classList.toggle('visible', checkedCount > 0);
        }
    }

    function selectAllTasks() {
        const checkboxes = document.querySelectorAll('.task-item input[type="checkbox"]');
        const allChecked = Array.from(checkboxes).every(cb => cb.checked);
        checkboxes.forEach(cb => cb.checked = !allChecked);
        updateSelectedCount();
    }

    function completeSelectedTasks() {
        const selectedTasks = document.querySelectorAll('.task-item input[type="checkbox"]:checked');
        selectedTasks.forEach(checkbox => {
            const taskItem = checkbox.closest('.task-item');
            const taskId = taskItem.dataset.id;
            const task = tasks.find(t => t.id === taskId);
            if (task) {
                task.completed = true;
            }
        });
        saveAndRender();
    }

    function deleteSelectedTasks() {
        if (!confirm(`Delete ${document.querySelectorAll('.task-item input[type="checkbox"]:checked').length} selected tasks?`)) return;
        
        const selectedTasks = document.querySelectorAll('.task-item input[type="checkbox"]:checked');
        selectedTasks.forEach(checkbox => {
            const taskItem = checkbox.closest('.task-item');
            const taskId = taskItem.dataset.id;
            tasks = tasks.filter(t => t.id !== taskId);
        });
        saveAndRender();
    }

    // Render task list to DOM
    function renderTasks() {
        const filteredTasks = getFilteredTasks();

        // Handle empty state
        if (filteredTasks.length === 0) {
            elements.emptyState.style.display = 'block';
            elements.taskList.style.display = 'none';
            return;
        }

        elements.emptyState.style.display = 'none';
        elements.taskList.style.display = 'flex';

        // Build task HTML
        elements.taskList.innerHTML = filteredTasks.map(task => `
            <div class="task-item priority-${task.priority} ${task.completed ? 'completed' : ''}" data-id="${task.id}">
                <div class="task-checkbox">
                    <input type="checkbox" 
                           ${task.completed ? 'checked' : ''} 
                           onchange="handleCheckboxChange('${task.id}')">
                </div>
                <div class="task-details">
                    <div class="task-title">${escapeHtml(task.title)}</div>
                    <div class="task-meta">
                        <span class="task-category-badge category-${task.category}">${task.category}</span>
                        <span class="task-course">${escapeHtml(task.course)}</span>
                        <span class="task-date">
                            <i class="ph ph-calendar-blank"></i> 
                            ${Utils.formatDate(task.date)}
                        </span>
                    </div>
                    ${task.note ? `<div class="task-note has-content">${escapeHtml(task.note)}</div>` : ''}
                </div>
                <div class="task-actions">
                    <button class="edit-btn" onclick="editTask('${task.id}')" aria-label="Edit task">
                        <i class="ph ph-pencil"></i>
                    </button>
                    <button class="delete-btn" 
                            onclick="deleteTask('${task.id}')" 
                            aria-label="Delete task">×</button>
                </div>
            </div>
        `).join('');
    }

    // Escape HTML to prevent XSS
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Toggle task completion status
    window.toggleComplete = function(id) {
        const task = tasks.find(t => t.id === id);
        if (!task) return;

        task.completed = !task.completed;
        sortTasks();
        saveAndRender();
    };

    function handleCheckboxChange(id) {
        toggleComplete(id);
        updateSelectedCount();
    }

    // Make handlers available globally for onclick handlers
    window.handleCheckboxChange = handleCheckboxChange;

    function editTask(id) {
        const task = tasks.find(t => t.id === id);
        if (!task) return;

        const newNote = prompt('Add/edit task note (leave empty to remove):', task.note || '');
        if (newNote !== null) {
            task.note = newNote.trim() || '';
            saveAndRender();
        }
    }

    // Make editTask available globally for onclick handlers
    window.editTask = editTask;

    // Delete a task
    window.deleteTask = function(id) {
        if (!confirm('Delete this task?')) return;

        tasks = tasks.filter(t => t.id !== id);
        sortTasks();
        saveAndRender();
    };
});
