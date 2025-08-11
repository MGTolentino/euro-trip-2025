// Euro Trip 2025 - Aplicación simple sin Firebase
console.log('🚀 Iniciando aplicación Euro Trip 2025...');

// Estado global de la aplicación
const AppState = {
    currentView: 'list',
    expandedRows: new Set(),
    filters: {
        search: '',
        sortBy: 'fecha',
        filterBy: 'all'
    },
    viajeData: {
        fechaInicio: "2025-12-19",
        fechaFin: "2026-01-07",
        estancias: [
            {
                destino: "Zurich, Suiza",
                fechaInicio: "2025-12-19",
                fechaFin: "2025-12-22",
                notas: "Ciudad de entrada a Europa",
                hoteles: [
                    {
                        nombre: "Hotel Schweizerhof Zurich",
                        tipoHabitacion: "Doble",
                        fechaInicio: "2025-12-19",
                        fechaFin: "2025-12-22",
                        cantidadHabitaciones: 2,
                        desayunoIncluido: true,
                        costo: 450,
                        moneda: "CHF",
                        notas: "Centro de la ciudad"
                    }
                ],
                transportes: [
                    {
                        tipo: "Avión",
                        origen: "Ciudad de México",
                        destino: "Zurich",
                        fecha: "2025-12-19",
                        hora: "14:30",
                        costo: 850,
                        moneda: "USD",
                        notas: "Vuelo directo Swiss Air"
                    }
                ],
                actividades: [
                    {
                        nombre: "Visita al Lago de Zurich",
                        descripcion: "Paseo en barco por el lago",
                        duracion: "2 horas",
                        costo: 25,
                        moneda: "CHF"
                    },
                    {
                        nombre: "Caminata por el Casco Histórico",
                        descripcion: "Tour autoguiado por la ciudad vieja",
                        duracion: "3 horas",
                        costo: 0,
                        moneda: "CHF"
                    }
                ]
            },
            {
                destino: "Milán, Italia",
                fechaInicio: "2025-12-23",
                fechaFin: "2025-12-26",
                notas: "Compras y cultura italiana",
                hoteles: [
                    {
                        nombre: "Hotel Spadari al Duomo",
                        tipoHabitacion: "Triple",
                        fechaInicio: "2025-12-23",
                        fechaFin: "2025-12-26",
                        cantidadHabitaciones: 2,
                        desayunoIncluido: false,
                        costo: 320,
                        moneda: "EUR",
                        notas: "Cerca del Duomo"
                    }
                ],
                transportes: [
                    {
                        tipo: "Tren",
                        origen: "Zurich",
                        destino: "Milán",
                        fecha: "2025-12-23",
                        hora: "09:15",
                        costo: 89,
                        moneda: "EUR",
                        notas: "Tren directo 3.5 horas"
                    }
                ],
                actividades: [
                    {
                        nombre: "Tour del Duomo de Milán",
                        descripcion: "Visita a la catedral y terrazas",
                        duracion: "2 horas",
                        costo: 15,
                        moneda: "EUR"
                    },
                    {
                        nombre: "Teatro La Scala",
                        descripcion: "Visita al famoso teatro de ópera",
                        duracion: "1.5 horas",
                        costo: 12,
                        moneda: "EUR"
                    }
                ]
            },
            {
                destino: "Roma, Italia",
                fechaInicio: "2025-12-27",
                fechaFin: "2026-01-02",
                notas: "La Ciudad Eterna",
                hoteles: [
                    {
                        nombre: "Hotel Artemide",
                        tipoHabitacion: "Familiar",
                        fechaInicio: "2025-12-27",
                        fechaFin: "2026-01-02",
                        cantidadHabitaciones: 2,
                        desayunoIncluido: true,
                        costo: 180,
                        moneda: "EUR",
                        notas: "Cerca de la Fontana di Trevi"
                    }
                ],
                transportes: [
                    {
                        tipo: "Tren",
                        origen: "Milán",
                        destino: "Roma",
                        fecha: "2025-12-27",
                        hora: "11:30",
                        costo: 59,
                        moneda: "EUR",
                        notas: "Trenitalia Alta Velocidad"
                    },
                    {
                        tipo: "Avión",
                        origen: "Roma",
                        destino: "Ciudad de México",
                        fecha: "2026-01-02",
                        hora: "16:45",
                        costo: 720,
                        moneda: "USD",
                        notas: "Vuelo de regreso Alitalia"
                    }
                ],
                actividades: [
                    {
                        nombre: "Coliseo Romano",
                        descripcion: "Tour guiado por el anfiteatro",
                        duracion: "3 horas",
                        costo: 25,
                        moneda: "EUR"
                    },
                    {
                        nombre: "Museos Vaticanos y Capilla Sixtina",
                        descripcion: "Visita completa al Vaticano",
                        duracion: "4 horas",
                        costo: 35,
                        moneda: "EUR"
                    }
                ]
            }
        ],
        presupuesto: {
            ingresos: [
                {
                    id: "1",
                    descripcion: "Ahorro familiar",
                    monto: 150000
                },
                {
                    id: "2",
                    descripcion: "Bono navideño",
                    monto: 50000
                }
            ],
            totalDisponible: 200000
        }
    }
};

// Tipos de cambio
const exchangeRates = {
    USD: 20.0,
    EUR: 21.5,
    CHF: 22.0,
    MXN: 1.0
};

// Clase principal de la aplicación
class TripApp {
    constructor() {
        console.log('🎯 Inicializando TripApp...');
        this.bindEvents();
    }

    bindEvents() {
        document.addEventListener('DOMContentLoaded', () => {
            console.log('📄 DOM cargado, renderizando aplicación...');
            this.render();
            this.setupEventListeners();
        });
    }

    setupEventListeners() {
        console.log('🔧 Configurando event listeners...');
        
        // Event listeners para filtros
        document.addEventListener('input', (e) => {
            if (e.target.classList.contains('search-input')) {
                AppState.filters.search = e.target.value;
                this.renderItinerario();
            }
        });

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
        console.log('🖼️ Renderizando aplicación principal...');
        const app = document.getElementById('app');
        const totalDias = this.calcularDiasViaje();
        const totalCosto = this.calcularCostoTotal();
        
        app.innerHTML = `
            <div class="header">
                <h1>🗺️ Organizador de Viaje Europa 2025-2026</h1>
                <div class="info-viaje">
                    <span class="fecha-viaje">📅 19 Dic 2025 - 7 Ene 2026</span>
                    <span class="duracion">${totalDias} días en Europa</span>
                    <span class="total-costo">💰 $${totalCosto.toLocaleString()} MXN</span>
                    <span class="status online">🟢 Conectado</span>
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
                <div class="section-container">
                    <h3>📅 Calendario - En desarrollo</h3>
                    <p>Esta funcionalidad estará disponible pronto.</p>
                </div>
            </div>
            
            <div id="transportes" class="tab-content">
                <div class="section-container">
                    <h3>✈️ Transportes - En desarrollo</h3>
                    <p>Esta funcionalidad estará disponible pronto.</p>
                </div>
            </div>
            
            <div id="hoteles" class="tab-content">
                <div class="section-container">
                    <h3>🏨 Hoteles - En desarrollo</h3>
                    <p>Esta funcionalidad estará disponible pronto.</p>
                </div>
            </div>
            
            <div id="actividades" class="tab-content">
                <div class="section-container">
                    <h3>🎯 Actividades - En desarrollo</h3>
                    <p>Esta funcionalidad estará disponible pronto.</p>
                </div>
            </div>
            
            <div id="presupuesto" class="tab-content">
                <div class="section-container">
                    <h3>💰 Presupuesto - En desarrollo</h3>
                    <p>Esta funcionalidad estará disponible pronto.</p>
                </div>
            </div>
        `;
        
        console.log('✅ Aplicación renderizada exitosamente');
    }

    renderItinerario() {
        console.log('📋 Renderizando sección de itinerario...');
        const container = document.getElementById('itinerario');
        if (!container) {
            console.error('❌ No se encontró el contenedor del itinerario');
            return;
        }

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
        
        console.log(`✅ Itinerario renderizado con ${estancias.length} estancias`);
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
                    <select class="filter-select">
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
                        <h5>🏨 Hoteles (${(estancia.hoteles || []).length})</h5>
                        <div class="elementos-compactos">
                            ${(estancia.hoteles || []).map((hotel, hotelIndex) => `
                                <div class="elemento-compacto">
                                    <div class="elemento-compacto-info">
                                        <strong>${hotel.nombre}</strong>
                                        <span>${this.formatDateShort(hotel.fechaInicio)} - ${this.formatDateShort(hotel.fechaFin)}</span>
                                    </div>
                                    <div class="precio-compacto">${hotel.moneda} ${hotel.costo.toLocaleString()}</div>
                                </div>
                            `).join('')}
                            ${(estancia.hoteles || []).length === 0 ? '<p class="no-elementos">No hay hoteles</p>' : ''}
                        </div>
                    </div>

                    <div class="categoria-expandida">
                        <h5>✈️ Transportes (${(estancia.transportes || []).length})</h5>
                        <div class="elementos-compactos">
                            ${(estancia.transportes || []).map((transporte, transporteIndex) => `
                                <div class="elemento-compacto">
                                    <div class="elemento-compacto-info">
                                        <strong>${transporte.origen} → ${transporte.destino}</strong>
                                        <span>${this.formatDateShort(transporte.fecha)} ${transporte.hora || ''}</span>
                                    </div>
                                    <div class="precio-compacto">${transporte.moneda} ${transporte.costo.toLocaleString()}</div>
                                </div>
                            `).join('')}
                            ${(estancia.transportes || []).length === 0 ? '<p class="no-elementos">No hay transportes</p>' : ''}
                        </div>
                    </div>

                    <div class="categoria-expandida">
                        <h5>🎯 Actividades (${(estancia.actividades || []).length})</h5>
                        <div class="elementos-compactos">
                            ${(estancia.actividades || []).map((actividad, actividadIndex) => `
                                <div class="elemento-compacto">
                                    <div class="elemento-compacto-info">
                                        <strong>${actividad.nombre}</strong>
                                        <span>${actividad.duracion || ''}</span>
                                    </div>
                                    <div class="precio-compacto">
                                        ${actividad.costo > 0 ? 
                                            `${actividad.moneda} ${actividad.costo.toLocaleString()}` : 
                                            'Gratis'
                                        }
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
                ${estancias.map((estancia, index) => `
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
                        <div class="estancia-total">
                            <strong>Total estancia: $${this.calcularCostoEstancia(estancia).toLocaleString()} MXN</strong>
                        </div>
                    </div>
                `).join('')}
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

        if (AppState.filters.search) {
            estancias = estancias.filter(estancia => 
                estancia.destino.toLowerCase().includes(AppState.filters.search.toLowerCase())
            );
        }

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
        console.log('🔄 Cambiando vista a:', view);
        AppState.currentView = view;
        this.renderItinerario();
    }

    toggleExpandRow(index) {
        console.log('📖 Toggle expand row:', index);
        if (AppState.expandedRows.has(index)) {
            AppState.expandedRows.delete(index);
        } else {
            AppState.expandedRows.add(index);
        }
        this.renderItinerario();
    }

    clearFilters() {
        console.log('🧹 Limpiando filtros');
        AppState.filters = {
            search: '',
            sortBy: 'fecha',
            filterBy: 'all'
        };
        this.renderItinerario();
    }

    showTab(tabName) {
        console.log('📑 Mostrando tab:', tabName);
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

        const clickedTab = document.querySelector(`[onclick="tripApp.showTab('${tabName}')"]`);
        if (clickedTab) clickedTab.classList.add('active');
        
        const tabContent = document.getElementById(tabName);
        if (tabContent) tabContent.classList.add('active');

        if (tabName === 'itinerario') {
            this.renderItinerario();
        }
    }

    // Métodos de gestión de estancias
    addEstancia() {
        console.log('➕ Agregando nueva estancia');
        const nuevaEstancia = {
            destino: "Nueva Estancia",
            fechaInicio: "2025-12-20",
            fechaFin: "2025-12-23",
            notas: "",
            hoteles: [],
            transportes: [],
            actividades: []
        };
        
        AppState.viajeData.estancias.push(nuevaEstancia);
        this.renderItinerario();
    }
    
    editEstancia(index) {
        console.log('✏️ Editando estancia:', index);
        alert(`Funcionalidad de edición en desarrollo. Estancia: ${AppState.viajeData.estancias[index]?.destino}`);
    }
    
    deleteEstancia(index) {
        console.log('🗑️ Eliminando estancia:', index);
        if (confirm('¿Estás seguro de eliminar esta estancia?')) {
            AppState.viajeData.estancias.splice(index, 1);
            AppState.expandedRows.delete(index);
            this.renderItinerario();
        }
    }

    // Métodos de utilidad
    calcularDiasViaje() {
        const inicio = new Date(AppState.viajeData.fechaInicio);
        const fin = new Date(AppState.viajeData.fechaFin);
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
}

// Inicializar aplicación
console.log('🚀 Creando instancia de TripApp...');
const tripApp = new TripApp();

// Exponer globalmente para compatibilidad con onclick handlers
window.tripApp = tripApp;

console.log('✅ Aplicación Euro Trip 2025 inicializada correctamente');