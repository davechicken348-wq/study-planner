// Study Planner - Utility Functions

const Utils = {
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    },

    formatDateShort(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        });
    },

    isToday(dateString) {
        const taskDate = new Date(dateString);
        const today = new Date();
        return taskDate.toDateString() === today.toDateString();
    },

    isUpcoming(dateString) {
        const taskDate = new Date(dateString);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return taskDate > today;
    },

    isOverdue(dateString) {
        const taskDate = new Date(dateString);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return taskDate < today;
    },

    getDaysUntil(dateString) {
        const taskDate = new Date(dateString);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const diffTime = taskDate - today;
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    },

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
};