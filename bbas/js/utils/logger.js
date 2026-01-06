// Simple logger utility with colored output

class Logger {
    constructor(element) {
        this.element = element;
        this.maxEntries = 50;
    }
    
    log(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const entry = document.createElement('div');
        entry.className = `log-entry log-${type}`;
        entry.textContent = `[${timestamp}] ${message}`;
        
        if (this.element) {
            this.element.appendChild(entry);
            this.element.scrollTop = this.element.scrollHeight;
            
            // Keep only last N entries
            const entries = this.element.querySelectorAll('.log-entry');
            if (entries.length > this.maxEntries) {
                entries[0].remove();
            }
        }
        
        // Also log to console
        console.log(`[BBAS ${type.toUpperCase()}]`, message);
    }
    
    info(message) {
        this.log(message, 'info');
    }
    
    success(message) {
        this.log(message, 'success');
    }
    
    warning(message) {
        this.log(message, 'warning');
    }
    
    error(message) {
        this.log(message, 'error');
    }
    
    clear() {
        if (this.element) {
            this.element.innerHTML = '';
        }
    }
}

export default Logger;
