// Simple logger utility with colored output

class Logger {
    constructor(element) {
        this.element = element;
        this.maxEntries = 50;
    }

    log(componentOrMessage, messageOrType, type = 'info') {
        // Support both signatures:
        // log(message, type) - old signature
        // log(component, message, type/data) - new signature for components
        let component = '';
        let message = '';
        let logType = type;
        let data = null;

        if (typeof messageOrType === 'string') {
            // New signature: log('Component', 'message', dataOrType)
            component = componentOrMessage;
            message = messageOrType;
            if (typeof type === 'string') {
                logType = type;
            } else {
                data = type;
                logType = 'info';
            }
        } else {
            // Old signature: log('message', type)
            message = componentOrMessage;
            logType = messageOrType || 'info';
        }

        const timestamp = new Date().toLocaleTimeString();
        const fullMessage = component ? `[${component}] ${message}` : message;
        const entry = document.createElement('div');
        entry.className = `log-entry log-${logType}`;
        entry.textContent = `[${timestamp}] ${fullMessage}`;

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
        if (data) {
            console.log(`[BBAS ${logType.toUpperCase()}]`, fullMessage, data);
        } else {
            console.log(`[BBAS ${logType.toUpperCase()}]`, fullMessage);
        }
    }

    info(componentOrMessage, messageOrData, data) {
        if (typeof messageOrData === 'string') {
            this.log(componentOrMessage, messageOrData, data || 'info');
        } else {
            this.log(componentOrMessage, 'info');
        }
    }

    success(componentOrMessage, messageOrData, data) {
        if (typeof messageOrData === 'string') {
            this.log(componentOrMessage, messageOrData, data || 'success');
        } else {
            this.log(componentOrMessage, 'success');
        }
    }

    warning(componentOrMessage, messageOrData, data) {
        if (typeof messageOrData === 'string') {
            this.log(componentOrMessage, messageOrData, data || 'warning');
        } else {
            this.log(componentOrMessage, 'warning');
        }
    }

    error(componentOrMessage, messageOrData, data) {
        if (typeof messageOrData === 'string') {
            this.log(componentOrMessage, messageOrData, data || 'error');
        } else {
            this.log(componentOrMessage, 'error');
        }
    }

    debug(componentOrMessage, messageOrData, data) {
        if (typeof messageOrData === 'string') {
            this.log(componentOrMessage, messageOrData, data || 'info');
        } else {
            this.log(componentOrMessage, 'info');
        }
    }

    warn(componentOrMessage, messageOrData, data) {
        this.warning(componentOrMessage, messageOrData, data);
    }

    clear() {
        if (this.element) {
            this.element.innerHTML = '';
        }
    }
}

// Create a default console-only logger for use in components
const defaultLogger = new Logger(null);

export default defaultLogger;
export { Logger };
