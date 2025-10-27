// Global Simulation Status - Single source of truth for simulation state

export const SimulationStatus = {
    // Status constants
    STATUS: {
        IDLE: 'idle',
        RUNNING: 'running',
        PAUSED: 'paused',
        STOPPED: 'stopped'
    },

    // Current status
    currentStatus: 'idle',

    // Status change callbacks
    statusChangeCallbacks: [],

    // Initialize status
    initialize() {
        this.currentStatus = this.STATUS.IDLE;
        this.notifyStatusChange();
    },

    // Set status
    setStatus(newStatus) {
        if (!Object.values(this.STATUS).includes(newStatus)) {
            console.error('[SimulationStatus] Invalid status:', newStatus);
            return false;
        }

        const oldStatus = this.currentStatus;
        this.currentStatus = newStatus;

        console.log(`[SimulationStatus] Status changed: ${oldStatus} → ${newStatus}`);
        this.notifyStatusChange();
        return true;
    },

    // Get current status
    getStatus() {
        return this.currentStatus;
    },

    // Check status helpers
    isIdle() {
        return this.currentStatus === this.STATUS.IDLE;
    },

    isRunning() {
        return this.currentStatus === this.STATUS.RUNNING;
    },

    isPaused() {
        return this.currentStatus === this.STATUS.PAUSED;
    },

    isStopped() {
        return this.currentStatus === this.STATUS.STOPPED;
    },

    // Can transition to running?
    canStart() {
        return this.isIdle() || this.isStopped() || this.isPaused();
    },

    // Can pause?
    canPause() {
        return this.isRunning();
    },

    // Can resume?
    canResume() {
        return this.isPaused();
    },

    // Can stop?
    canStop() {
        return this.isRunning() || this.isPaused();
    },

    // Register status change callback
    onStatusChange(callback) {
        if (typeof callback === 'function') {
            this.statusChangeCallbacks.push(callback);
        }
    },

    // Remove status change callback
    offStatusChange(callback) {
        const index = this.statusChangeCallbacks.indexOf(callback);
        if (index > -1) {
            this.statusChangeCallbacks.splice(index, 1);
        }
    },

    // Notify all callbacks of status change
    notifyStatusChange() {
        this.statusChangeCallbacks.forEach(callback => {
            try {
                callback(this.currentStatus);
            } catch (error) {
                console.error('[SimulationStatus] Error in status change callback:', error);
            }
        });
    },

    // Reset to initial state
    reset() {
        this.setStatus(this.STATUS.IDLE);
    },

    // Get status display text
    getDisplayText() {
        switch (this.currentStatus) {
            case this.STATUS.IDLE:
                return 'Ready';
            case this.STATUS.RUNNING:
                return 'Running';
            case this.STATUS.PAUSED:
                return 'Paused';
            case this.STATUS.STOPPED:
                return 'Stopped';
            default:
                return 'Unknown';
        }
    }
};

// Initialize on import
SimulationStatus.initialize();