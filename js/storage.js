// Study Planner - Storage Module

const Storage = {
    TASKS_KEY: 'study_planner_tasks',
    TIMETABLE_KEY: 'study_planner_timetable',
    POMODORO_KEY: 'study_planner_pomodoro',
    EXPORT_VERSION: '1.1',
    
    // Safe JSON parse with error handling
    _parseJSON(jsonString, fallback = null) {
        if (!jsonString) return fallback;
        try {
            return JSON.parse(jsonString);
        } catch (e) {
            console.error('Storage parse error:', e);
            return fallback;
        }
    },
    
    // Validate task object structure
    _validateTask(task) {
        if (!task || typeof task !== 'object') return false;
        const required = ['id', 'title', 'date', 'category', 'priority', 'completed'];
        for (const key of required) {
            if (!(key in task)) return false;
        }
        return typeof task.id === 'string' &&
               typeof task.title === 'string' &&
               typeof task.date === 'string' &&
               typeof task.category === 'string' &&
               typeof task.priority === 'string' &&
               typeof task.completed === 'boolean';
    },
    
    // Validate timetable entry structure
    _validateTimetableEntry(entry) {
        if (!entry || typeof entry !== 'object') return false;
        return typeof entry.day === 'string' &&
               typeof entry.subject === 'string';
    },
    
    // Validate pomodoro settings structure
    _validatePomodoroSettings(settings) {
        if (!settings || typeof settings !== 'object') return false;
        return typeof settings.focusTime === 'number' &&
               typeof settings.breakTime === 'number' &&
               typeof settings.focusSessions === 'number' &&
               typeof settings.breakSessions === 'number';
    },
    
    // Import validation result
    _createImportResult() {
        return {
            success: false,
            version: null,
            importedAt: null,
            tasks: { imported: 0, skipped: 0, errors: [] },
            timetable: { imported: 0, skipped: 0, errors: [] },
            pomodoro: { imported: 0, skipped: 0, errors: [] },
            warnings: [],
            errors: []
        };
    },

    // Tasks
    getTasks() {
        const tasks = localStorage.getItem(this.TASKS_KEY);
        return this._parseJSON(tasks, []);
    },
    
    saveTasks(tasks) {
        try {
            localStorage.setItem(this.TASKS_KEY, JSON.stringify(tasks));
            return true;
        } catch (e) {
            console.error('Failed to save tasks:', e);
            alert('Failed to save tasks. Storage may be full.');
            return false;
        }
    },
    
    clearTasks() {
        localStorage.removeItem(this.TASKS_KEY);
    },

    // Timetable
    getTimetable() {
        const timetable = localStorage.getItem(this.TIMETABLE_KEY);
        return this._parseJSON(timetable, []);
    },
    
    saveTimetable(classes) {
        try {
            localStorage.setItem(this.TIMETABLE_KEY, JSON.stringify(classes));
            return true;
        } catch (e) {
            console.error('Failed to save timetable:', e);
            return false;
        }
    },
    
    clearTimetable() {
        localStorage.removeItem(this.TIMETABLE_KEY);
    },
    
    // Pomodoro settings and stats
    getPomodoro() {
        const data = localStorage.getItem(this.POMODORO_KEY);
        return this._parseJSON(data, null);
    },
    
    savePomodoro(data) {
        try {
            localStorage.setItem(this.POMODORO_KEY, JSON.stringify(data));
            return true;
        } catch (e) {
            console.error('Failed to save pomodoro data:', e);
            return false;
        }
    },
    
    clearPomodoro() {
        localStorage.removeItem(this.POMODORO_KEY);
    },

    // Export all data as JSON with type information
    exportData() {
        const data = {
            version: this.EXPORT_VERSION,
            type: 'study-planner-backup',
            exportedAt: new Date().toISOString(),
            data: {
                tasks: {
                    type: 'array',
                    itemType: 'task',
                    itemCount: this.getTasks().length,
                    items: this.getTasks()
                },
                timetable: {
                    type: 'array',
                    itemType: 'timetable-entry',
                    itemCount: this.getTimetable().length,
                    items: this.getTimetable()
                },
                pomodoro: {
                    type: 'object',
                    itemType: 'pomodoro-settings',
                    items: this.getPomodoro()
                }
            }
        };
        return JSON.stringify(data, null, 2);
    },
    
    // Import data from JSON with type validation
    importData(jsonString) {
        const result = this._createImportResult();
        
        try {
            const data = JSON.parse(jsonString);
            
            // Validate export structure
            if (!data.type || data.type !== 'study-planner-backup') {
                result.errors.push('Invalid file format: Not a study planner backup');
                return result;
            }
            
            result.version = data.version || 'unknown';
            result.importedAt = new Date().toISOString();
            
            // Import tasks with validation
            if (data.data && data.data.tasks && Array.isArray(data.data.tasks.items)) {
                const tasks = data.data.tasks.items;
                tasks.forEach((task, index) => {
                    if (this._validateTask(task)) {
                        result.tasks.imported++;
                    } else {
                        result.tasks.skipped++;
                        result.tasks.errors.push(`Task at index ${index}: Invalid structure`);
                        result.warnings.push(`Skipped invalid task at index ${index}`);
                    }
                });
                
                if (result.tasks.imported > 0) {
                    const validTasks = tasks.filter(t => this._validateTask(t));
                    this.saveTasks(validTasks);
                }
            } else if (!data.tasks) {
                result.warnings.push('No tasks found in backup');
            }
            
            // Import timetable with validation
            if (data.data && data.data.timetable && Array.isArray(data.data.timetable.items)) {
                const entries = data.data.timetable.items;
                entries.forEach((entry, index) => {
                    if (this._validateTimetableEntry(entry)) {
                        result.timetable.imported++;
                    } else {
                        result.timetable.skipped++;
                        result.timetable.errors.push(`Timetable entry at index ${index}: Invalid structure`);
                        result.warnings.push(`Skipped invalid timetable entry at index ${index}`);
                    }
                });
                
                if (result.timetable.imported > 0) {
                    const validEntries = entries.filter(e => this._validateTimetableEntry(e));
                    this.saveTimetable(validEntries);
                }
            } else if (!data.timetable) {
                result.warnings.push('No timetable found in backup');
            }
            
            // Import pomodoro settings with validation
            const pomodoroItems = data.data && data.data.pomodoro ? data.data.pomodoro.items : null;
            if (pomodoroItems) {
                if (this._validatePomodoroSettings(pomodoroItems)) {
                    this.savePomodoro(pomodoroItems);
                    result.pomodoro.imported = 1;
                } else {
                    result.pomodoro.skipped = 1;
                    result.pomodoro.errors.push('Pomodoro settings: Invalid structure');
                    result.warnings.push('Skipped invalid pomodoro settings');
                }
            }
            
            result.success = result.tasks.imported > 0 || 
                            result.timetable.imported > 0 || 
                            result.pomodoro.imported > 0;
            
            return result;
            
        } catch (e) {
            result.errors.push(`Parse error: ${e.message}`);
            console.error('Import failed:', e);
            return result;
        }
    }
};