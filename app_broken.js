// Euro Trip 2025 - Aplicación de gestión de viajes
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js';
import { getDatabase, ref, set, get } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js';

// Configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyAI2ofzM5BdlqK7glDAz5OPZ-L5Oslf_28",
    authDomain: "euro-trip-2025.firebaseapp.com",
    databaseURL: "https://euro-trip-2025-default-rtdb.firebaseio.com/",
    projectId: "euro-trip-2025",
    storageBucket: "euro-trip-2025.firebasestorage.app",
    messagingSenderId: "218713594766",
    appId: "1:218713594766:web:e84557d13d976e327d62df"
};

// Estado global de la aplicación
const AppState = {
    app: null,
    database: null,
    isFirebaseConnected: false,
    viajeData: {},
    selectedStartDate: null,
    selectedEndDate: null,
    currentView: 'list', // 'list' o 'cards'
    expandedRows: new Set(),
    filters: {
        search: '',
        sortBy: 'fecha',
        filterBy: 'all'
    }
};

// Tipos de cambio
const exchangeRates = {
    USD: 20.0,
    EUR: 21.5,
    CHF: 22.0,
    MXN: 1.0
};

// Datos iniciales
const initialData = {
    fechaInicio: "2025-12-19",
    fechaFin: "2026-01-07",
    estancias: [],
    presupuesto: {
        ingresos: [],
        totalDisponible: 0
    }
};

// Inicialización de la aplicación
class TripApp {
    constructor() {
        this.initFirebase();
        this.bindEvents();
    }

    async initFirebase() {
        try {
            AppState.app = initializeApp(firebaseConfig);
            AppState.database = getDatabase(AppState.app);
            AppState.isFirebaseConnected = true;
            console.log('Firebase conectado exitosamente');
        } catch (error) {
            console.error('Error Firebase:', error);
            AppState.isFirebaseConnected = false;
        }
    }

    async loadData() {
        const savedData = await this.getData('viajeData');
        AppState.viajeData = savedData || initialData;
        
        if (!savedData) {
            await this.saveData('viajeData', AppState.viajeData);
        }
    }

    async saveData(path, data) {
        if (AppState.isFirebaseConnected) {
            try {
                await set(ref(AppState.database, path), data);
                return true;
            } catch (error) {
                console.error('Error guardando:', error);
                return false;
            }
        }
        return false;
    }

    async getData(path) {
        if (AppState.isFirebaseConnected) {
            try {
                const snapshot = await get(ref(AppState.database, path));
                return snapshot.exists() ? snapshot.val() : null;
            } catch (error) {
                console.error('Error cargando:', error);
            }
        }
        return null;
    }

    bindEvents() {
        document.addEventListener('DOMContentLoaded', async () => {
            await this.loadData();
            this.render();
            this.setupEventListeners();
        });
    }

    setupEventListeners() {
        // Eventos de teclado para navegación
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
            }
        });

        // Eventos de clic para cerrar modales
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModal();
            }
        });

        // Eventos para filtros y búsqueda
        this.setupFilterEvents();
    }

    setupFilterEvents() {
        // Debounce para búsqueda
        let searchTimeout;
        document.addEventListener('input', (e) => {
            if (e.target.classList.contains('search-input')) {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    AppState.filters.search = e.target.value;
                    this.renderItinerario();
                }, 300);
            }
        });

        // Filtros de ordenamiento
        document.addEventListener('change', (e) => {
            if (e.target.classList.contains('sort-select')) {
                AppState.filters.sortBy = e.target.value;
                this.renderItinerario();
            }
            if (e.target.classList.contains('filter-select')) {
                AppState.filters.filterBy = e.target.value;
                this.renderItinerario();
            }
        });
    }

    render() {
        const app = document.getElementById('app');
        const totalDias = this.calcularDiasViaje();
        const totalEstancias = (AppState.viajeData.estancias || []).length;
        const totalCosto = this.calcularCostoTotal();
        
        app.innerHTML = `
            <div class="header">
                <h1>🗺️ Organizador de Viaje Europa 2025-2026</h1>
                <div class="info-viaje">
                    <span class="fecha-viaje">📅 19 Dic 2025 - 7 Ene 2026</span>
                    <span class="duracion">${totalDias} días en Europa</span>
                    <span class="total-costo">💰 $${totalCosto.toLocaleString()} MXN</span>
                    <span class="status ${AppState.isFirebaseConnected ? 'online' : 'offline'}">
                        ${AppState.isFirebaseConnected ? '🟢 Conectado' : '🔴 Offline'}
                    </span>
                </div>
            </div>

            <div class="tabs">
                <button class="tab-btn active" onclick="tripApp.showTab('itinerario')">📋 Itinerario</button>
                <button class="tab-btn" onclick="tripApp.showTab('calendario')">📅 Calendario</button>
                <button class="tab-btn" onclick="tripApp.showTab('transportes')">✈️ Transportes</button>
                <button class="tab-btn" onclick="tripApp.showTab('hoteles')">🏨 Hoteles</button>
                <button class="tab-btn" onclick="tripApp.showTab('actividades')">🎯 Actividades</button>
                <button class="tab-btn" onclick="tripApp.showTab('presupuesto')">💰 Presupuesto</button>
            </div>

            <div id="itinerario" class="tab-content active">
                ${this.renderItinerario()}
            </div>
            
            <div id="calendario" class="tab-content">
                ${this.renderCalendario()}
            </div>
            
            <div id="transportes" class="tab-content">
                ${this.renderTransportes()}
            </div>
            
            <div id="hoteles" class="tab-content">
                ${this.renderHoteles()}
            </div>
            
            <div id="actividades" class="tab-content">
                ${this.renderActividades()}
            </div>
            
            <div id="presupuesto" class="tab-content">
                ${this.renderPresupuesto()}
            </div>
        `;
    }

    renderItinerario() {
        const container = document.getElementById('itinerario');
        if (!container) return;

        const estancias = this.getFilteredEstancias();
        
        container.innerHTML = `
            <div class="itinerario-container">
                <div class="itinerario-header">
                    <h3>📋 Planificación del Viaje</h3>
                    <div class="view-toggle">
                        <button class="btn ${AppState.currentView === 'list' ? 'active' : ''}" 
                                onclick="tripApp.toggleView('list')">📋 Lista</button>
                        <button class="btn ${AppState.currentView === 'cards' ? 'active' : ''}" 
                                onclick="tripApp.toggleView('cards')">📊 Cards</button>
                    </div>
                    <button onclick="tripApp.addEstancia()" class="btn-primary">➕ Nueva Estancia</button>
                </div>
                
                ${this.renderFiltros()}
                
                ${estancias.length > 0 ? 
                    this.renderEstancias(estancias) : 
                    this.renderEstadoVacio()
                }
            </div>
        `;
    }

    renderFiltros() {
        return `
            <div class="filtros-container">
                <div class="filtros-header">
                    <h4>🔍 Filtros y Búsqueda</h4>
                </div>
                <div class="filtros-controles">
                    <div class="search-box">
                        <span class="search-icon">🔍</span>
                        <input type="text" class="search-input" placeholder="Buscar por destino..." 
                               value="${AppState.filters.search}">
                    </div>
                    <select class="filter-select sort-select">
                        <option value="fecha" ${AppState.filters.sortBy === 'fecha' ? 'selected' : ''}>📅 Por fecha</option>
                        <option value="destino" ${AppState.filters.sortBy === 'destino' ? 'selected' : ''}>🏙️ Por destino</option>
                        <option value="costo" ${AppState.filters.sortBy === 'costo' ? 'selected' : ''}>💰 Por costo</option>
                        <option value="duracion" ${AppState.filters.sortBy === 'duracion' ? 'selected' : ''}>⏱️ Por duración</option>
                    </select>
                    <select class="filter-select filter-select">
                        <option value="all" ${AppState.filters.filterBy === 'all' ? 'selected' : ''}>Todas</option>
                        <option value="hoteles" ${AppState.filters.filterBy === 'hoteles' ? 'selected' : ''}>Con hoteles</option>
                        <option value="transportes" ${AppState.filters.filterBy === 'transportes' ? 'selected' : ''}>Con transportes</option>
                        <option value="actividades" ${AppState.filters.filterBy === 'actividades' ? 'selected' : ''}>Con actividades</option>
                    </select>
                    <button class="btn-clear-filters" onclick="tripApp.clearFilters()">🗑️ Limpiar</button>
                </div>
            </div>
        `;
    }

    renderEstancias(estancias) {
        if (AppState.currentView === 'list') {
            return this.renderEstanciasLista(estancias);
        } else {
            return this.renderEstanciasCards(estancias);
        }
    }

    renderEstanciasLista(estancias) {
        return `
            <div class="estancias-lista-compacta">
                <div class="estancias-table-header">
                    <div>Destino</div>
                    <div>Duración</div>
                    <div>Hoteles</div>
                    <div>Transportes</div>
                    <div>Costo</div>
                    <div>Acciones</div>
                </div>
                ${estancias.map((estancia, index) => this.renderEstanciaRow(estancia, index)).join('')}
            </div>
        `;
    }

    renderEstanciaRow(estancia, index) {
        const isExpanded = AppState.expandedRows.has(index);
        const costoTotal = this.calcularCostoEstancia(estancia);
        const hoteles = (estancia.hoteles || []).length;
        const transportes = (estancia.transportes || []).length;
        const actividades = (estancia.actividades || []).length;

        return `
            <div class="estancia-row" data-index="${index}">
                <div class="estancia-destino">
                    <h4>${estancia.destino}</h4>
                    <div class="estancia-fechas">${this.formatDateRange(estancia.fechaInicio, estancia.fechaFin)}</div>
                </div>
                <div class="estancia-duracion">
                    <span class="duracion-badge">${this.calcularDias(estancia.fechaInicio, estancia.fechaFin)} días</span>
                </div>
                <div class="estancia-elementos">
                    <div class="elemento-count">🏨 ${hoteles}</div>
                </div>
                <div class="estancia-elementos">
                    <div class="elemento-count">✈️ ${transportes}</div>
                </div>
                <div class="estancia-costo">
                    <div class="costo-principal">$${costoTotal.toLocaleString()}</div>
                    <div class="costo-secundario">MXN</div>
                </div>
                <div class="estancia-acciones">
                    <button onclick="tripApp.toggleExpandRow(${index})" class="btn-tiny">
                        ${isExpanded ? '🔼' : '🔽'}
                    </button>
                    <button onclick="tripApp.editEstancia(${index})" class="btn-tiny">✏️</button>
                    <button onclick="tripApp.deleteEstancia(${index})" class="btn-tiny btn-danger">🗑️</button>
                </div>
            </div>
            ${isExpanded ? this.renderEstanciaExpanded(estancia, index) : ''}
        `;
    }

    renderEstanciaExpanded(estancia, index) {
        return `
            <div class="estancia-expandida">
                <div class="estancia-expanded-content">
                    <div class="categoria-expandida">
                        <h5>
                            🏨 Hoteles (${(estancia.hoteles || []).length})
                            <button onclick="tripApp.addHotelToEstancia(${index})" class="btn-tiny">➕</button>
                        </h5>
                        <div class="elementos-compactos">
                            ${(estancia.hoteles || []).map((hotel, hotelIndex) => `
                                <div class="elemento-compacto">
                                    <div class="elemento-compacto-info">
                                        <strong>${hotel.nombre}</strong>
                                        <span>${this.formatDateShort(hotel.fechaInicio)} - ${this.formatDateShort(hotel.fechaFin)}</span>
                                        <span>${hotel.desayunoIncluido ? '🍳 Con desayuno' : '❌ Sin desayuno'}</span>
                                    </div>
                                    <div class="precio-compacto">${hotel.moneda} ${hotel.costo.toLocaleString()}</div>
                                    <div class="elemento-compacto-acciones">
                                        <button onclick="tripApp.editHotelInEstancia(${index}, ${hotelIndex})" class="btn-tiny">✏️</button>
                                        <button onclick="tripApp.deleteHotelFromEstancia(${index}, ${hotelIndex})" class="btn-tiny btn-danger">🗑️</button>
                                    </div>
                                </div>
                            `).join('')}
                            ${(estancia.hoteles || []).length === 0 ? '<p class="no-elementos">No hay hoteles</p>' : ''}
                        </div>
                    </div>

                    <div class="categoria-expandida">
                        <h5>
                            ✈️ Transportes (${(estancia.transportes || []).length})
                            <button onclick="tripApp.addTransporteToEstancia(${index})" class="btn-tiny">➕</button>
                        </h5>
                        <div class="elementos-compactos">
                            ${(estancia.transportes || []).map((transporte, transporteIndex) => `
                                <div class="elemento-compacto">
                                    <div class="elemento-compacto-info">
                                        <strong>${this.getTransporteIcon(transporte.tipo)} ${transporte.origen} → ${transporte.destino}</strong>
                                        <span>${this.formatDateShort(transporte.fecha)} ${transporte.hora ? '- ' + transporte.hora : ''}</span>
                                    </div>
                                    <div class="precio-compacto">${transporte.moneda} ${transporte.costo.toLocaleString()}</div>
                                    <div class="elemento-compacto-acciones">
                                        <button onclick="tripApp.editTransporteInEstancia(${index}, ${transporteIndex})" class="btn-tiny">✏️</button>
                                        <button onclick="tripApp.deleteTransporteFromEstancia(${index}, ${transporteIndex})" class="btn-tiny btn-danger">🗑️</button>
                                    </div>
                                </div>
                            `).join('')}
                            ${(estancia.transportes || []).length === 0 ? '<p class="no-elementos">No hay transportes</p>' : ''}
                        </div>
                    </div>

                    <div class="categoria-expandida">
                        <h5>
                            🎯 Actividades (${(estancia.actividades || []).length})
                            <button onclick="tripApp.addActividadToEstancia(${index})" class="btn-tiny">➕</button>
                        </h5>
                        <div class="elementos-compactos">
                            ${(estancia.actividades || []).map((actividad, actividadIndex) => `
                                <div class="elemento-compacto">
                                    <div class="elemento-compacto-info">
                                        <strong>${actividad.nombre}</strong>
                                        ${actividad.duracion ? `<span>⏱️ ${actividad.duracion}</span>` : ''}
                                    </div>
                                    <div class="precio-compacto">
                                        ${actividad.costo > 0 ? 
                                            `${actividad.moneda} ${actividad.costo.toLocaleString()}` : 
                                            '<span class="gratis">Gratis</span>'
                                        }
                                    </div>
                                    <div class="elemento-compacto-acciones">
                                        <button onclick="tripApp.editActividadInEstancia(${index}, ${actividadIndex})" class="btn-tiny">✏️</button>
                                        <button onclick="tripApp.deleteActividadFromEstancia(${index}, ${actividadIndex})" class="btn-tiny btn-danger">🗑️</button>
                                    </div>
                                </div>
                            `).join('')}
                            ${(estancia.actividades || []).length === 0 ? '<p class="no-elementos">No hay actividades</p>' : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderEstanciasCards(estancias) {
        return `
            <div class="estancias-lista">
                ${estancias.map((estancia, index) => this.renderEstanciaCard(estancia, index)).join('')}
            </div>
        `;
    }

    renderEstanciaCard(estancia, index) {
        // Mantener el código original de las cards para compatibilidad
        return `
            <div class="estancia-card-completa">
                <div class="estancia-header-main">
                    <div class="estancia-info-principal">
                        <h4>${this.formatDateRange(estancia.fechaInicio, estancia.fechaFin)}</h4>
                        <span class="duracion-badge">${this.calcularDias(estancia.fechaInicio, estancia.fechaFin)} días</span>
                        <h3>${estancia.destino}</h3>
                    </div>
                    <div class="estancia-acciones-main">
                        <button onclick="tripApp.editEstancia(${index})" class="btn-edit">✏️ Editar</button>
                        <button onclick="tripApp.deleteEstancia(${index})" class="btn-delete">🗑️ Eliminar</button>
                    </div>
                </div>
                
                <div class="categoria-section">
                    <div class="categoria-header">
                        <h5>🏨 Hoteles</h5>
                        <button onclick="tripApp.addHotelToEstancia(${index})" class="btn-small-add">➕</button>
                    </div>
                    <div class="elementos-mini">
                        ${(estancia.hoteles || []).map((hotel, hotelIndex) => `
                            <div class="elemento-mini hotel-mini">
                                <div class="elemento-mini-info">
                                    <strong>${hotel.nombre}</strong>
                                    <span>${this.formatDateShort(hotel.fechaInicio)} - ${this.formatDateShort(hotel.fechaFin)}</span>
                                    <span class="precio-mini">${hotel.moneda} ${hotel.costo.toLocaleString()}</span>
                                    <span class="desayuno-mini ${hotel.desayunoIncluido ? 'incluido' : 'no-incluido'}">
                                        ${hotel.desayunoIncluido ? '🍳 Con desayuno' : '❌ Sin desayuno'}
                                    </span>
                                </div>
                                <div class="elemento-mini-acciones">
                                    <button onclick="tripApp.editHotelInEstancia(${index}, ${hotelIndex})" class="btn-tiny">✏️</button>
                                    <button onclick="tripApp.deleteHotelFromEstancia(${index}, ${hotelIndex})" class="btn-tiny btn-danger">🗑️</button>
                                </div>
                            </div>
                        `).join('')}
                        ${(estancia.hoteles || []).length === 0 ? '<p class="no-elementos">No hay hoteles</p>' : ''}
                    </div>
                </div>
                
                <div class="estancia-total">
                    <strong>Total estancia: $${this.calcularCostoEstancia(estancia).toLocaleString()} MXN</strong>
                </div>
            </div>
        `;
    }

    renderEstadoVacio() {
        return `
            <div class="estado-vacio">
                <div class="icono-vacio">📅</div>
                <h3>¡Comienza a planificar tu viaje!</h3>
                <p>Agrega estancias a tu itinerario para organizar tu aventura por Europa</p>
                <button onclick="tripApp.addEstancia()" class="btn-primary">➕ Crear primera estancia</button>
            </div>
        `;
    }

    // Métodos de filtrado y ordenamiento
    getFilteredEstancias() {
        let estancias = [...(AppState.viajeData.estancias || [])];

        // Filtrar por búsqueda
        if (AppState.filters.search) {
            estancias = estancias.filter(estancia => 
                estancia.destino.toLowerCase().includes(AppState.filters.search.toLowerCase())
            );
        }

        // Filtrar por tipo
        if (AppState.filters.filterBy !== 'all') {
            estancias = estancias.filter(estancia => {
                switch (AppState.filters.filterBy) {
                    case 'hoteles':
                        return (estancia.hoteles || []).length > 0;
                    case 'transportes':
                        return (estancia.transportes || []).length > 0;
                    case 'actividades':
                        return (estancia.actividades || []).length > 0;
                    default:
                        return true;
                }
            });
        }

        // Ordenar
        estancias.sort((a, b) => {
            switch (AppState.filters.sortBy) {
                case 'destino':
                    return a.destino.localeCompare(b.destino);
                case 'costo':
                    return this.calcularCostoEstancia(b) - this.calcularCostoEstancia(a);
                case 'duracion':
                    return this.calcularDias(b.fechaInicio, b.fechaFin) - this.calcularDias(a.fechaInicio, a.fechaFin);
                case 'fecha':
                default:
                    return new Date(a.fechaInicio) - new Date(b.fechaInicio);
            }
        });

        return estancias;
    }

    // Métodos de interacción
    toggleView(view) {
        AppState.currentView = view;
        this.renderItinerario();
    }

    toggleExpandRow(index) {
        if (AppState.expandedRows.has(index)) {
            AppState.expandedRows.delete(index);
        } else {
            AppState.expandedRows.add(index);
        }
        this.renderItinerario();
    }

    clearFilters() {
        AppState.filters = {
            search: '',
            sortBy: 'fecha',
            filterBy: 'all'
        };
        this.renderItinerario();
    }

    showTab(tabName) {
        // Remover clase active de todos los tabs y contenido
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

        // Activar el tab seleccionado
        event.target.classList.add('active');
        document.getElementById(tabName).classList.add('active');

        // Renderizar contenido específico si es necesario
        if (tabName === 'itinerario') {
            this.renderItinerario();
        }
    }

    closeModal() {
        const modal = document.querySelector('.modal');
        if (modal) modal.remove();
    }

    // Métodos de utilidad (mantener los existentes)
    calcularDiasViaje() {
        const inicio = new Date(AppState.viajeData.fechaInicio || "2025-12-19");
        const fin = new Date(AppState.viajeData.fechaFin || "2026-01-07");
        return Math.ceil((fin - inicio) / (1000 * 60 * 60 * 24));
    }

    calcularCostoTotal() {
        return (AppState.viajeData.estancias || []).reduce((total, estancia) => {
            return total + this.calcularCostoEstancia(estancia);
        }, 0);
    }

    calcularCostoEstancia(estancia) {
        let total = 0;
        
        (estancia.hoteles || []).forEach(hotel => {
            total += this.convertirAMXN(hotel.costo, hotel.moneda);
        });
        
        (estancia.transportes || []).forEach(transporte => {
            total += this.convertirAMXN(transporte.costo, transporte.moneda);
        });
        
        (estancia.actividades || []).forEach(actividad => {
            total += this.convertirAMXN(actividad.costo, actividad.moneda);
        });
        
        return Math.round(total);
    }

    convertirAMXN(monto, moneda) {
        return monto * (exchangeRates[moneda] || 1);
    }

    calcularDias(fechaInicio, fechaFin) {
        const inicio = new Date(fechaInicio);
        const fin = new Date(fechaFin);
        return Math.ceil((fin - inicio) / (1000 * 60 * 60 * 24)) + 1;
    }

    formatDateRange(fechaInicio, fechaFin) {
        const inicio = new Date(fechaInicio).toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'short'
        });
        const fin = new Date(fechaFin).toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'short'
        });
        return `${inicio} - ${fin}`;
    }

    formatDateShort(fecha) {
        return new Date(fecha).toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'short'
        });
    }

    getTransporteIcon(tipo) {
        const iconos = {
            'Avión': '✈️',
            'Tren': '🚆',
            'Autobús': '🚌',
            'Auto': '🚗'
        };
        return iconos[tipo] || '🚗';
    }

    // Métodos placeholder para mantener compatibilidad (implementar según necesidad)
    addEstancia() { console.log('addEstancia - implementar modal'); }
    editEstancia(index) { console.log('editEstancia', index); }
    deleteEstancia(index) { console.log('deleteEstancia', index); }
    addHotelToEstancia(index) { console.log('addHotelToEstancia', index); }
    editHotelInEstancia(estanciaIndex, hotelIndex) { console.log('editHotelInEstancia', estanciaIndex, hotelIndex); }
    deleteHotelFromEstancia(estanciaIndex, hotelIndex) { console.log('deleteHotelFromEstancia', estanciaIndex, hotelIndex); }
    addTransporteToEstancia(index) { console.log('addTransporteToEstancia', index); }
    editTransporteInEstancia(estanciaIndex, transporteIndex) { console.log('editTransporteInEstancia', estanciaIndex, transporteIndex); }
    deleteTransporteFromEstancia(estanciaIndex, transporteIndex) { console.log('deleteTransporteFromEstancia', estanciaIndex, transporteIndex); }
    addActividadToEstancia(index) { console.log('addActividadToEstancia', index); }
    editActividadInEstancia(estanciaIndex, actividadIndex) { console.log('editActividadInEstancia', estanciaIndex, actividadIndex); }
    deleteActividadFromEstancia(estanciaIndex, actividadIndex) { console.log('deleteActividadFromEstancia', estanciaIndex, actividadIndex); }

    // Métodos placeholder para otras secciones
    renderCalendario() { return '<div class="loading-state">Calendario - Implementar</div>'; }
    renderTransportes() { return '<div class="loading-state">Transportes - Implementar</div>'; }
    renderHoteles() { return '<div class="loading-state">Hoteles - Implementar</div>'; }
    renderActividades() { return '<div class="loading-state">Actividades - Implementar</div>'; }
    renderPresupuesto() { return '<div class="loading-state">Presupuesto - Implementar</div>'; }
}

// Inicializar aplicación
const tripApp = new TripApp();

// Exponer globalmente para compatibilidad con onclick handlers
window.tripApp = tripApp;