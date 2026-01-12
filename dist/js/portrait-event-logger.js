/**
 * Portrait Mode Event Logger
 * DEBUG ONLY - Logs all events related to portrait orientation detection
 * Useful for debugging responsive behavior and device orientation
 * 
 * Enable debugging:
 * 1. Add ?debug=portrait to URL
 * 2. Or set localStorage.setItem('portraitDebug', 'true')
 * 3. Or set window.PORTRAIT_DEBUG = true before page load
 */

(function() {
    // Check if debugging is enabled
    const urlParams = new URLSearchParams(window.location.search);
    const isDebugMode = 
        window.PORTRAIT_DEBUG === true ||
        urlParams.get('debug') === 'portrait' ||
        localStorage.getItem('portraitDebug') === 'true';

    // Exit if not in debug mode
    if (!isDebugMode) {
        return;
    }

    // Configuration
    const config = {
        enableConsoleLogging: true,
        enableStorageLogging: true,
        maxStoredLogs: 100,
        logPrefix: '[PORTRAIT-DEBUG]',
        debugMode: true
    };

    // Storage key for persisting logs
    const STORAGE_KEY = 'portraitModeEventLogs';

    /**
     * Get current timestamp in HH:MM:SS.mmm format
     */
    function getTimestamp() {
        const now = new Date();
        return now.toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            fractionalSecondDigits: 3
        });
    }

    /**
     * Get device/viewport information
     */
    function getDeviceInfo() {
        return {
            width: window.innerWidth,
            height: window.innerHeight,
            orientation: window.innerHeight > window.innerWidth ? 'portrait' : 'landscape',
            aspectRatio: (window.innerWidth / window.innerHeight).toFixed(2),
            userAgent: navigator.userAgent,
            pixelRatio: window.devicePixelRatio
        };
    }

    /**
     * Create a log entry
     */
    function createLogEntry(eventType, data = {}) {
        return {
            timestamp: getTimestamp(),
            eventType: eventType,
            deviceInfo: getDeviceInfo(),
            data: data,
            url: window.location.href
        };
    }

    /**
     * Format log entry for console display
     */
    function formatForConsole(logEntry) {
        const { timestamp, eventType, deviceInfo, data } = logEntry;
        const baseMsg = `${config.logPrefix} [${timestamp}] ${eventType}`;
        const details = {
            ...deviceInfo,
            ...data
        };
        return [baseMsg, details];
    }

    /**
     * Log to browser console
     */
    function logToConsole(logEntry) {
        if (!config.enableConsoleLogging) return;

        const [message, details] = formatForConsole(logEntry);
        const style = 'color: #FEBC11; font-weight: bold; background: #201F20; padding: 4px 8px; border-radius: 3px;';

        console.log(`%c${message}`, style, details);
    }

    /**
     * Retrieve stored logs from localStorage
     */
    function getStoredLogs() {
        try {
            const logs = localStorage.getItem(STORAGE_KEY);
            return logs ? JSON.parse(logs) : [];
        } catch (e) {
            console.warn(`${config.logPrefix} Failed to retrieve stored logs:`, e.message);
            return [];
        }
    }

    /**
     * Save logs to localStorage
     */
    function saveLogsToStorage(logs) {
        if (!config.enableStorageLogging) return;

        try {
            // Keep only the most recent logs
            const recentLogs = logs.slice(-config.maxStoredLogs);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(recentLogs));
        } catch (e) {
            console.warn(`${config.logPrefix} Failed to save logs to storage:`, e.message);
        }
    }

    /**
     * Add a log entry
     */
    function addLog(eventType, data = {}) {
        const logEntry = createLogEntry(eventType, data);

        // Log to console
        logToConsole(logEntry);

        // Store in memory and localStorage
        if (window.portraitEventLogs === undefined) {
            window.portraitEventLogs = [];
        }

        window.portraitEventLogs.push(logEntry);

        // Save to storage
        if (config.enableStorageLogging) {
            saveLogsToStorage(window.portraitEventLogs);
        }

        // Emit custom event
        const event = new CustomEvent('portraitModeEvent', {
            detail: logEntry
        });
        document.dispatchEvent(event);

        return logEntry;
    }

    /**
     * Initialize event logging
     */
    function init() {
        // Initial state log
        addLog('INITIALIZED', {
            message: 'Portrait mode event logger initialized'
        });

        // Log initial device state
        const deviceInfo = getDeviceInfo();
        addLog('DEVICE_STATE', {
            initialOrientation: deviceInfo.orientation,
            initialDimensions: `${deviceInfo.width}x${deviceInfo.height}`
        });

        // Listen for orientation changes
        window.addEventListener('orientationchange', function(e) {
            addLog('ORIENTATION_CHANGE', {
                screenOrientation: window.screen.orientation?.type || 'unknown',
                angle: window.screen.orientation?.angle || 'unknown'
            });
        });

        // Listen for resize events with debouncing
        let resizeTimeout;
        window.addEventListener('resize', function(e) {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(function() {
                const deviceInfo = getDeviceInfo();
                const isPortrait = deviceInfo.orientation === 'portrait';

                addLog('RESIZE', {
                    newDimensions: `${deviceInfo.width}x${deviceInfo.height}`,
                    isPortrait: isPortrait
                });
            }, 100);
        });

        // Listen for viewport change via media query
        const portraitQuery = window.matchMedia('(orientation: portrait)');
        portraitQuery.addEventListener('change', function(e) {
            addLog('MEDIA_QUERY_CHANGE', {
                orientationPortrait: e.matches,
                mediaQueryResult: e.matches ? 'portrait' : 'landscape'
            });
        });

        // Listen for custom portrait mode class changes
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    const target = mutation.target;
                    const isPortraitClass = target.classList.contains('portrait-mode');
                    const timestamp = new Date().toLocaleTimeString('en-US', {
                        hour12: false,
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                    });

                    addLog('CLASS_MUTATION', {
                        element: target.tagName,
                        portraitClassApplied: isPortraitClass,
                        allClasses: Array.from(target.classList).join(', ')
                    });
                }
            });
        });

        observer.observe(document.documentElement, { attributes: true });
        observer.observe(document.body, { attributes: true });

        // Log visibility change
        document.addEventListener('visibilitychange', function(e) {
            addLog('VISIBILITY_CHANGE', {
                hidden: document.hidden,
                visibilityState: document.visibilityState
            });
        });
    }

    /**
     * Public API for debugging
     */
    window.portraitEventLogger = {
        /**
         * Get all logged events
         */
        getLogs: function() {
            return window.portraitEventLogs || [];
        },

        /**
         * Get logs filtered by event type
         */
        getLogsByType: function(eventType) {
            const logs = window.portraitEventLogs || [];
            return logs.filter(log => log.eventType === eventType);
        },

        /**
         * Clear all logs
         */
        clearLogs: function() {
            window.portraitEventLogs = [];
            localStorage.removeItem(STORAGE_KEY);
            console.log(`%c${config.logPrefix} Logs cleared`, 'color: #FEBC11; font-weight: bold;');
        },

        /**
         * Export logs as JSON
         */
        exportLogs: function() {
            const logs = window.portraitEventLogs || [];
            return JSON.stringify(logs, null, 2);
        },

        /**
         * Download logs as JSON file
         */
        downloadLogs: function() {
            const logs = window.portraitEventLogs || [];
            const dataStr = JSON.stringify(logs, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `portrait-event-logs-${new Date().getTime()}.json`;
            link.click();
            URL.revokeObjectURL(url);
            console.log(`${config.logPrefix} Logs downloaded`);
        },

        /**
         * Print logs to console in table format
         */
        printTable: function() {
            const logs = window.portraitEventLogs || [];
            const tableData = logs.map(log => ({
                Timestamp: log.timestamp,
                Event: log.eventType,
                Width: log.deviceInfo.width,
                Height: log.deviceInfo.height,
                Orientation: log.deviceInfo.orientation,
                AspectRatio: log.deviceInfo.aspectRatio
            }));
            console.table(tableData);
        },

        /**
         * Get current device info
         */
        getDeviceInfo: getDeviceInfo,

        /**
         * Configure logger
         */
        configure: function(options) {
            Object.assign(config, options);
            console.log(`${config.logPrefix} Configuration updated`, config);
        },

        /**
         * Get configuration
         */
        getConfig: function() {
            return { ...config };
        }
    };

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
