const statusLog = (typeof HouseLog !== "undefined") ? HouseLog : {
    info() {},
    warn() {},
    error() {}
};

// Configuration
const CONFIG = {
    API_URL: 'http://localhost:3000',
    REFRESH_INTERVAL: 5000,
    STATUS: {
        CHECKING: 'Checking...',
        ONLINE: 'Funcionando',
        OFFLINE: 'Desconectado'
    },
    SOCKET_OPTIONS: {
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        autoConnect: true
    }
};

// State Management
class SystemStateManager {
    constructor() {
        this.state = {
            api: this.createInitialComponentState(),
            database: this.createInitialComponentState(),
            sensors: this.createInitialComponentState(),
            incidents: [] // Iniciar con array vacío
        };
        this.isConnected = false;
    }

    createInitialComponentState() {
        return {
            status: CONFIG.STATUS.CHECKING,
            lastCheck: new Date(),
            responseTime: '--'
        };
    }

    updateState(newState) {
        this.state = {
            ...this.state,
            ...newState
        };
        UIManager.updateAll(this.state);
    }

    addIncident(incident) {
        this.state.incidents.unshift(incident);
        UIManager.handleNewIncident(incident);
    }
}

// API Service
class APIService {
    static socket = null;

    static initializeWebSocket() {
        statusLog.info("Initializing WebSocket connection");
        
        // Initialize socket with proper options
        this.socket = io(CONFIG.API_URL, CONFIG.SOCKET_OPTIONS);

        this.socket.on('connect', () => {
            statusLog.info("WebSocket connected", { id: this.socket.id });
            this.fetchStatus().then(({data}) => {
                window.statusMonitor.stateManager.updateState({
                    ...data,
                    incidents: data.incidents || []
                });
                window.statusMonitor.stateManager.isConnected = true;
            });
        });

        this.socket.on('disconnect', (reason) => {
            statusLog.info("WebSocket disconnected", { reason });
            window.statusMonitor.stateManager.isConnected = false;
            window.statusMonitor.handleDisconnection();
        });

        this.socket.on('connect_error', (error) => {
            statusLog.error("Connection error", { error: error.message });
            window.statusMonitor.handleDisconnection();
        });

        this.socket.on('newIncident', (incident) => {
            // No formatear el estado, usar el incidente tal cual viene
            window.statusMonitor.stateManager.addIncident(incident);
        });

        this.socket.on('sensorUpdate', (data) => {
            statusLog.info("Received sensor update");
        });

        this.socket.on('incidentsCleared', () => {
            window.statusMonitor.stateManager.updateState({
                ...window.statusMonitor.stateManager.state,
                incidents: []
            });
            UIManager.handleIncidentsCleared();
        });

        // Solicitar estado inicial
        this.socket.emit('getStatus');
    }

    static async fetchStatus() {
        try {
            const startTime = performance.now();
            const response = await fetch(`${CONFIG.API_URL}/status`);
            const responseTime = Math.round(performance.now() - startTime);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return { data, responseTime };
        } catch (error) {
            statusLog.error("Error fetching status", { error: error.message });
            throw error;
        }
    }

    static async reportIncident(title, description, success) {
        const incident = {
            title,
            description,
            success, // Mantener el valor exacto que se pasa
            date: new Date().toISOString()
        };

        // Enviar el incidente sin modificar
        this.socket.emit('publish', {
            topic: '/report-incident',
            message: JSON.stringify(incident)
        });

        // Enviar por HTTP también sin modificar
        const response = await fetch(`${CONFIG.API_URL}/report-incident`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(incident)
        });

        if (!response.ok) throw new Error('Error al reportar incidente');
        return response.json();
    }

    static async clearIncidents() {
        try {
            statusLog.info("Sending clear incidents request");
            const response = await fetch(`${CONFIG.API_URL}/clear-incidents`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                statusLog.error("Server responded with an error", { status: response.status });
                throw new Error('Error al limpiar incidentes');
            }

            const data = await response.json();
            statusLog.info("Clear incidents response", { success: Boolean(data && data.success) });
            return data;
        } catch (error) {
            statusLog.error("Error in clearIncidents", { error: error.message });
            throw error;
        }
    }
}


// Main Application
class StatusMonitor {
    constructor() {
        this.stateManager = new SystemStateManager();
        this.setupEventListeners();
        APIService.initializeWebSocket();
        this.setupDevTools();
        
        window.statusMonitor = this;
    }

    setupDevTools() {
        // Exponer el método de limpieza en la consola
        window.clearAllIncidents = async () => {
            try {
                await APIService.clearIncidents();
                statusLog.info("Incidentes limpiados exitosamente");
            } catch (error) {
                statusLog.error("Error al limpiar incidentes", { error: error.message });
            }
        };

        // Añadir atajo de teclado (Ctrl+Shift+C) - solo funciona en modo desarrollador
        document.addEventListener('keydown', async (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'C' && 
                (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
                await window.clearAllIncidents();
            }
        });
    }

    checkDeveloperMode() {
        // Verificar si estamos en modo desarrollador
        const isDeveloper = window.location.hostname === 'localhost' || 
                          window.location.hostname === '127.0.0.1' ||
                          localStorage.getItem('devMode') === 'true';
        
        if (isDeveloper) {
            document.body.setAttribute('data-mode', 'developer');
        }
    }

    setupEventListeners() {
        document.addEventListener('DOMContentLoaded', () => {
            statusLog.info("Iniciando sistema de monitoreo");
            UIManager.initializeAnimations();
            this.monitorStatus();
            
            // Solo configurar el botón si estamos en modo desarrollador
            if (document.body.getAttribute('data-mode') === 'developer') {
                const clearButton = document.getElementById('clear-incidents');
                if (clearButton) {
                    clearButton.addEventListener('click', async () => {
                        try {
                            await APIService.clearIncidents();
                            statusLog.info("Incidentes limpiados exitosamente");
                        } catch (error) {
                            statusLog.error("Error al limpiar incidentes", { error: error.message });
                        }
                    });
                }
            }
        });
    }

    async monitorStatus() {
        try {
            const { data, responseTime } = await APIService.fetchStatus();
            const wasOffline = !this.stateManager.isConnected;
            this.stateManager.isConnected = true;

            this.updateOnlineStatus(data, responseTime);
            if (wasOffline) this.handleReconnection();

        } catch (error) {
            statusLog.error("Error fetching status", { error: error.message });
            if (this.stateManager.isConnected) {
                this.handleDisconnection();
            }
        } finally {
            setTimeout(() => this.monitorStatus(), CONFIG.REFRESH_INTERVAL);
        }
    }

    updateOnlineStatus(data, responseTime) {
        this.stateManager.updateState({
            api: {
                status: CONFIG.STATUS.ONLINE,
                lastCheck: new Date(),
                responseTime: `${responseTime}ms`
            },
            database: {
                status: CONFIG.STATUS.ONLINE,
                lastCheck: new Date(),
                connections: data.database?.connections || 0
            },
            sensors: {
                status: CONFIG.STATUS.ONLINE,
                activeSensors: data.sensors?.activeSensors || 0,
                lastUpdate: new Date()
            }
        });
    }

    handleReconnection() {
        this.stateManager.addIncident({
            title: 'Conexión restaurada',
            description: 'La conexión con el servidor ha sido restablecida',
            success: true
        });
    }

    handleDisconnection() {
        this.stateManager.isConnected = false;
        this.stateManager.addIncident({
            title: 'Pérdida de conexión',
            description: 'Se perdió la conexión con el servidor',
            success: false
        });

        this.stateManager.updateState({
            api: { ...this.stateManager.state.api, status: CONFIG.STATUS.OFFLINE, responseTime: 'N/A' },
            database: { ...this.stateManager.state.database, status: CONFIG.STATUS.OFFLINE, connections: 0 },
            sensors: { ...this.stateManager.state.sensors, status: CONFIG.STATUS.OFFLINE, activeSensors: 0 }
        });
    }
}

// Initialize application
new StatusMonitor();
