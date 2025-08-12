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

let app, database;
let isFirebaseConnected = false;

try {
    app = initializeApp(firebaseConfig);
    database = getDatabase(app);
    isFirebaseConnected = true;
} catch (error) {
    console.error('Error Firebase:', error);
}

const exchangeRates = {
    USD: 20.0,
    EUR: 21.5,
    CHF: 22.0,
    MXN: 1.0
};

// Datos iniciales - VACÍO para que el usuario llene su información
const initialData = {
    fechaInicio: "2025-12-19",
    fechaFin: "2026-01-07",
    estancias: [],
    presupuesto: {
        ingresos: [],
        totalDisponible: 0
    }
};

let viajeData = {};
let selectedStartDate = null;
let selectedEndDate = null;
let currentView = 'list'; // Nueva vista de lista por defecto
let expandedRows = new Set(); // Para controlar filas expandidas

async function saveData(path, data) {
    if (isFirebaseConnected) {
        try {
            await set(ref(database, path), data);
        } catch (error) {
            console.error('Error guardando:', error);
        }
    }
}

async function loadData(path) {
    if (isFirebaseConnected) {
        try {
            const snapshot = await get(ref(database, path));
            return snapshot.exists() ? snapshot.val() : null;
        } catch (error) {
            console.error('Error cargando:', error);
        }
    }
    return null;
}

window.addEventListener('DOMContentLoaded', async function() {
    const savedData = await loadData('viajeData');
    viajeData = savedData || initialData;
    
    if (!savedData) {
        await saveData('viajeData', viajeData);
    }

    renderApp();
    
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            closeModal();
        }
    });
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeModal();
        }
    });
});

function renderApp() {
    const app = document.getElementById('app');
    const totalDias = calcularDiasViaje();
    const totalEstancias = (viajeData.estancias || []).length;
    const totalCosto = calcularCostoTotal();
    
    app.innerHTML = `
        <div class="header">
            <h1>🗺️ Organizador de Viaje Europa 2025-2026</h1>
            <div class="info-viaje">
                <span class="fecha-viaje">📅 19 Dic 2025 - 7 Ene 2026</span>
                <span class="duracion">${totalDias} días en Europa</span>
                <span class="total-costo">💰 $${totalCosto.toLocaleString()} MXN</span>
                <span class="status ${isFirebaseConnected ? 'online' : 'offline'}">
                    ${isFirebaseConnected ? '🟢 Conectado' : '🔴 Offline'}
                </span>
            </div>
        </div>

        <div class="tabs">
            <button class="tab-btn active" onclick="showTab('itinerario')">📋 Itinerario</button>
            <button class="tab-btn" onclick="showTab('calendario')">📅 Calendario</button>
            <button class="tab-btn" onclick="showTab('transportes')">✈️ Transportes</button>
            <button class="tab-btn" onclick="showTab('hoteles')">🏨 Hoteles</button>
            <button class="tab-btn" onclick="showTab('actividades')">🎯 Actividades</button>
            <button class="tab-btn" onclick="showTab('presupuesto')">💰 Presupuesto</button>
        </div>

        <div id="itinerario" class="tab-content active">
            ${renderItinerario()}
        </div>
        
        <div id="calendario" class="tab-content">
            ${renderCalendario()}
        </div>
        
        <div id="transportes" class="tab-content">
            ${renderTransportes()}
        </div>
        
        <div id="hoteles" class="tab-content">
            ${renderHoteles()}
        </div>
        
        <div id="actividades" class="tab-content">
            ${renderActividades()}
        </div>
        
        <div id="presupuesto" class="tab-content">
            ${renderPresupuesto()}
        </div>
    `;
}

function renderItinerario() {
    const estancias = viajeData.estancias || [];
    
    return `
        <div class="itinerario-container">
            <div class="itinerario-header">
                <h3>📋 Planificación del Viaje</h3>
                <div class="view-toggle">
                    <button class="btn ${currentView === 'list' ? 'active' : ''}" 
                            onclick="toggleView('list')">📋 Lista</button>
                    <button class="btn ${currentView === 'cards' ? 'active' : ''}" 
                            onclick="toggleView('cards')">📊 Cards</button>
                </div>
                <button onclick="addEstancia()" class="btn-primary">➕ Nueva Estancia</button>
            </div>
            
            ${estancias.length > 0 ? (
                currentView === 'list' ? renderEstanciasLista(estancias) : renderEstanciasCards(estancias)
            ) : `
                <div class="estado-vacio">
                    <div class="icono-vacio">📅</div>
                    <h3>¡Comienza a planificar tu viaje!</h3>
                    <p>Agrega estancias a tu itinerario para organizar tu aventura por Europa</p>
                    <button onclick="addEstancia()" class="btn-primary">➕ Crear primera estancia</button>
                </div>
            `}
        </div>
    `;
}

// NUEVA FUNCIÓN - Vista de lista compacta
function renderEstanciasLista(estancias) {
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
            ${estancias.map((estancia, index) => renderEstanciaRow(estancia, index)).join('')}
        </div>
    `;
}

// NUEVA FUNCIÓN - Renderizar fila de estancia
function renderEstanciaRow(estancia, index) {
    const isExpanded = expandedRows.has(index);
    const costoTotal = calcularCostoEstancia(estancia);
    const hoteles = (estancia.hoteles || []).length;
    const transportes = (estancia.transportes || []).length;
    const actividades = (estancia.actividades || []).length;

    return `
        <div class="estancia-row" data-index="${index}">
            <div class="estancia-destino">
                <h4>${estancia.destino}</h4>
                <div class="estancia-fechas">${formatDateRange(estancia.fechaInicio, estancia.fechaFin)}</div>
            </div>
            <div class="estancia-duracion">
                <span class="duracion-badge">${calcularDias(estancia.fechaInicio, estancia.fechaFin)} días</span>
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
                <button onclick="toggleExpandRow(${index})" class="btn-tiny">
                    ${isExpanded ? '🔼' : '🔽'}
                </button>
                <button onclick="editEstancia(${index})" class="btn-tiny">✏️</button>
                <button onclick="deleteEstancia(${index})" class="btn-tiny btn-danger">🗑️</button>
            </div>
        </div>
        ${isExpanded ? renderEstanciaExpanded(estancia, index) : ''}
    `;
}

// NUEVA FUNCIÓN - Renderizar estancia expandida
function renderEstanciaExpanded(estancia, index) {
    return `
        <div class="estancia-expandida">
            <div class="estancia-expanded-content">
                <div class="categoria-expandida">
                    <h5>
                        🏨 Hoteles (${(estancia.hoteles || []).length})
                        <button onclick="addHotelToEstancia(${index})" class="btn-tiny">➕</button>
                    </h5>
                    <div class="elementos-compactos">
                        ${(estancia.hoteles || []).map((hotel, hotelIndex) => `
                            <div class="elemento-compacto">
                                <div class="elemento-compacto-info">
                                    <strong>${hotel.nombre}</strong>
                                    <span>${formatDateShort(hotel.fechaInicio)} - ${formatDateShort(hotel.fechaFin)}</span>
                                    <span>${hotel.desayunoIncluido ? '🍳 Con desayuno' : '❌ Sin desayuno'}</span>
                                </div>
                                <div class="precio-compacto">${hotel.moneda} ${hotel.costo.toLocaleString()}</div>
                                <div class="elemento-compacto-acciones">
                                    <button onclick="editHotelInEstancia(${index}, ${hotelIndex})" class="btn-tiny">✏️</button>
                                    <button onclick="deleteHotelFromEstancia(${index}, ${hotelIndex})" class="btn-tiny btn-danger">🗑️</button>
                                </div>
                            </div>
                        `).join('')}
                        ${(estancia.hoteles || []).length === 0 ? '<p class="no-elementos">No hay hoteles</p>' : ''}
                    </div>
                </div>

                <div class="categoria-expandida">
                    <h5>
                        ✈️ Transportes (${(estancia.transportes || []).length})
                        <button onclick="addTransporteToEstancia(${index})" class="btn-tiny">➕</button>
                    </h5>
                    <div class="elementos-compactos">
                        ${(estancia.transportes || []).map((transporte, transporteIndex) => `
                            <div class="elemento-compacto">
                                <div class="elemento-compacto-info">
                                    <strong>${getTransporteIcon(transporte.tipo)} ${transporte.origen} → ${transporte.destino}</strong>
                                    <span>${formatDateShort(transporte.fecha)} ${transporte.hora ? '- ' + transporte.hora : ''}</span>
                                </div>
                                <div class="precio-compacto">${transporte.moneda} ${transporte.costo.toLocaleString()}</div>
                                <div class="elemento-compacto-acciones">
                                    <button onclick="editTransporteInEstancia(${index}, ${transporteIndex})" class="btn-tiny">✏️</button>
                                    <button onclick="deleteTransporteFromEstancia(${index}, ${transporteIndex})" class="btn-tiny btn-danger">🗑️</button>
                                </div>
                            </div>
                        `).join('')}
                        ${(estancia.transportes || []).length === 0 ? '<p class="no-elementos">No hay transportes</p>' : ''}
                    </div>
                </div>

                <div class="categoria-expandida">
                    <h5>
                        🎯 Actividades (${(estancia.actividades || []).length})
                        <button onclick="addActividadToEstancia(${index})" class="btn-tiny">➕</button>
                    </h5>
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
                                        '<span class="gratis">Gratis</span>'
                                    }
                                </div>
                                <div class="elemento-compacto-acciones">
                                    <button onclick="editActividadInEstancia(${index}, ${actividadIndex})" class="btn-tiny">✏️</button>
                                    <button onclick="deleteActividadFromEstancia(${index}, ${actividadIndex})" class="btn-tiny btn-danger">🗑️</button>
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

// Vista de cards original (mantenida para compatibilidad)
function renderEstanciasCards(estancias) {
    return `
        <div class="estancias-lista">
            ${estancias.map((estancia, index) => `
                <div class="estancia-card-completa">
                    <div class="estancia-header-main">
                        <div class="estancia-info-principal">
                            <h4>${formatDateRange(estancia.fechaInicio, estancia.fechaFin)}</h4>
                            <span class="duracion">${calcularDias(estancia.fechaInicio, estancia.fechaFin)} días</span>
                            <h3>${estancia.destino}</h3>
                        </div>
                        <div class="estancia-acciones-main">
                            <button onclick="editEstancia(${index})" class="btn-edit">✏️ Editar</button>
                            <button onclick="deleteEstancia(${index})" class="btn-delete">🗑️ Eliminar</button>
                        </div>
                    </div>
                    
                    <!-- Hoteles de esta estancia -->
                    <div class="categoria-section">
                        <div class="categoria-header">
                            <h5>🏨 Hoteles</h5>
                            <button onclick="addHotelToEstancia(${index})" class="btn-small-add">➕</button>
                        </div>
                        <div class="elementos-mini">
                            ${(estancia.hoteles || []).map((hotel, hotelIndex) => `
                                <div class="elemento-mini hotel-mini">
                                    <div class="elemento-mini-info">
                                        <strong>${hotel.nombre}</strong>
                                        <span>${formatDateShort(hotel.fechaInicio)} - ${formatDateShort(hotel.fechaFin)}</span>
                                        <span class="precio-mini">${hotel.moneda} ${hotel.costo.toLocaleString()}</span>
                                        <span class="desayuno-mini ${hotel.desayunoIncluido ? 'incluido' : 'no-incluido'}">
                                            ${hotel.desayunoIncluido ? '🍳 Con desayuno' : '❌ Sin desayuno'}
                                        </span>
                                    </div>
                                    <div class="elemento-mini-acciones">
                                        <button onclick="editHotelInEstancia(${index}, ${hotelIndex})" class="btn-tiny">✏️</button>
                                        <button onclick="deleteHotelFromEstancia(${index}, ${hotelIndex})" class="btn-tiny btn-danger">🗑️</button>
                                    </div>
                                </div>
                            `).join('')}
                            ${(estancia.hoteles || []).length === 0 ? '<p class="no-elementos">No hay hoteles</p>' : ''}
                        </div>
                    </div>
                    
                    <!-- Transportes de esta estancia -->
                    <div class="categoria-section">
                        <div class="categoria-header">
                            <h5>✈️ Transportes</h5>
                            <button onclick="addTransporteToEstancia(${index})" class="btn-small-add">➕</button>
                        </div>
                        <div class="elementos-mini">
                            ${(estancia.transportes || []).map((transporte, transporteIndex) => `
                                <div class="elemento-mini transporte-mini">
                                    <div class="elemento-mini-info">
                                        <strong>${getTransporteIcon(transporte.tipo)} ${transporte.origen} → ${transporte.destino}</strong>
                                        <span>${formatDateShort(transporte.fecha)} ${transporte.hora ? '- ' + transporte.hora : ''}</span>
                                        <span class="precio-mini">${transporte.moneda} ${transporte.costo.toLocaleString()}</span>
                                    </div>
                                    <div class="elemento-mini-acciones">
                                        <button onclick="editTransporteInEstancia(${index}, ${transporteIndex})" class="btn-tiny">✏️</button>
                                        <button onclick="deleteTransporteFromEstancia(${index}, ${transporteIndex})" class="btn-tiny btn-danger">🗑️</button>
                                    </div>
                                </div>
                            `).join('')}
                            ${(estancia.transportes || []).length === 0 ? '<p class="no-elementos">No hay transportes</p>' : ''}
                        </div>
                    </div>
                    
                    <!-- Actividades de esta estancia -->
                    <div class="categoria-section">
                        <div class="categoria-header">
                            <h5>🎯 Actividades</h5>
                            <button onclick="addActividadToEstancia(${index})" class="btn-small-add">➕</button>
                        </div>
                        <div class="elementos-mini">
                            ${(estancia.actividades || []).map((actividad, actividadIndex) => `
                                <div class="elemento-mini actividad-mini">
                                    <div class="elemento-mini-info">
                                        <strong>${actividad.nombre}</strong>
                                        ${actividad.duracion ? `<span>⏱️ ${actividad.duracion}</span>` : ''}
                                        ${actividad.costo > 0 ? `<span class="precio-mini">${actividad.moneda} ${actividad.costo.toLocaleString()}</span>` : '<span class="gratis">Gratis</span>'}
                                    </div>
                                    <div class="elemento-mini-acciones">
                                        <button onclick="editActividadInEstancia(${index}, ${actividadIndex})" class="btn-tiny">✏️</button>
                                        <button onclick="deleteActividadFromEstancia(${index}, ${actividadIndex})" class="btn-tiny btn-danger">🗑️</button>
                                    </div>
                                </div>
                            `).join('')}
                            ${(estancia.actividades || []).length === 0 ? '<p class="no-elementos">No hay actividades</p>' : ''}
                        </div>
                    </div>
                    
                    <!-- Costo total de la estancia -->
                    <div class="estancia-total">
                        <strong>Total estancia: $${calcularCostoEstancia(estancia).toLocaleString()} MXN</strong>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function renderCalendario() {
    return `
        <div class="calendario-container">
            <div class="calendario-header-main">
                <h3>📅 Calendario del Viaje</h3>
                <div class="calendario-info">
                    <p>Haz clic para seleccionar fechas de tu nueva estancia</p>
                    <div class="leyenda">
                        <span class="leyenda-item"><span class="color-viaje"></span> Período del viaje</span>
                        <span class="leyenda-item"><span class="color-ocupado"></span> Días ocupados</span>
                        <span class="leyenda-item"><span class="color-seleccionado"></span> Selección actual</span>
                    </div>
                </div>
            </div>
            
            <div class="calendario-principal">
                <div class="meses-grid">
                    ${renderMesCompleto("2025-12", "Diciembre 2025")}
                    ${renderMesCompleto("2026-01", "Enero 2026")}
                </div>
                
                <div class="seleccion-fechas">
                    <div class="fechas-seleccionadas">
                        <h4>Fechas seleccionadas:</h4>
                        <div class="fechas-display">
                            <span id="fecha-inicio-display">Selecciona fecha inicio</span>
                            <span class="separador">→</span>
                            <span id="fecha-fin-display">Selecciona fecha fin</span>
                        </div>
                    </div>
                    
                    <div class="calendario-acciones">
                        <button onclick="limpiarSeleccion()" class="btn-secondary">🗑️ Limpiar</button>
                        <button onclick="crearEstanciaFromCalendar()" class="btn-primary" id="btn-crear-estancia" disabled>➕ Crear Estancia</button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderTransportes() {
    const todosTransportes = getAllTransportes();
    return `
        <div class="section-container">
            <div class="section-header">
                <h3>✈️ Todos los Transportes</h3>
                <p class="section-subtitle">Gestiona los transportes de todas tus estancias</p>
            </div>
            
            <div class="elementos-grid">
                ${todosTransportes.map(item => `
                    <div class="elemento-card transporte-card">
                        <div class="elemento-header">
                            <div class="tipo-badge ${item.transporte.tipo.toLowerCase()}">
                                ${getTransporteIcon(item.transporte.tipo)} ${item.transporte.tipo}
                            </div>
                            <div class="precios">
                                <div class="precio-original">${item.transporte.moneda} ${item.transporte.costo.toLocaleString()}</div>
                                <div class="precio-mxn">$${convertirAMXN(item.transporte.costo, item.transporte.moneda).toLocaleString()} MXN</div>
                            </div>
                        </div>
                        
                        <div class="elemento-contenido">
                            <h4>${item.transporte.origen} → ${item.transporte.destino}</h4>
                            <div class="detalles">
                                <span>📅 ${formatDateLong(item.transporte.fecha)}</span>
                                ${item.transporte.hora ? `<span>🕐 ${item.transporte.hora}</span>` : ''}
                                <span>🏷️ ${getEstanciaNombre(item.estanciaIndex)}</span>
                            </div>
                            ${item.transporte.notas ? `<p class="notas">${item.transporte.notas}</p>` : ''}
                        </div>
                        
                        <div class="elemento-acciones">
                            <button onclick="editTransporteInEstancia(${item.estanciaIndex}, ${item.transporteIndex})" class="btn-small">✏️ Editar</button>
                            <button onclick="deleteTransporteFromEstancia(${item.estanciaIndex}, ${item.transporteIndex})" class="btn-small btn-danger">🗑️ Eliminar</button>
                        </div>
                    </div>
                `).join('')}
                
                ${todosTransportes.length === 0 ? 
                    '<div class="empty-message">No hay transportes registrados<br><small>Agrega transportes desde las estancias en el itinerario</small></div>' : ''
                }
            </div>
        </div>
    `;
}

function renderHoteles() {
    const todosHoteles = getAllHoteles();
    return `
        <div class="section-container">
            <div class="section-header">
                <h3>🏨 Todos los Hoteles</h3>
                <p class="section-subtitle">Gestiona los hoteles de todas tus estancias</p>
            </div>
            
            <div class="elementos-grid">
                ${todosHoteles.map(item => `
                    <div class="elemento-card hotel-card">
                        <div class="elemento-header">
                            <div class="hotel-info">
                                <h4>${item.hotel.nombre}</h4>
                                <span class="ciudad">${getEstanciaNombre(item.estanciaIndex)}</span>
                                <span class="fechas">${formatDateShort(item.hotel.fechaInicio)} - ${formatDateShort(item.hotel.fechaFin)}</span>
                            </div>
                            <div class="precios">
                                <div class="precio-original">${item.hotel.moneda} ${item.hotel.costo.toLocaleString()}</div>
                                <div class="precio-mxn">$${convertirAMXN(item.hotel.costo, item.hotel.moneda).toLocaleString()} MXN</div>
                            </div>
                        </div>
                        
                        <div class="elemento-contenido">
                            <div class="detalles">
                                <span>🛏️ ${item.hotel.tipoHabitacion}</span>
                                <span>📦 ${item.hotel.cantidadHabitaciones} habitación(es)</span>
                                <span class="desayuno ${item.hotel.desayunoIncluido ? 'incluido' : 'no-incluido'}">
                                    🍳 ${item.hotel.desayunoIncluido ? 'Con desayuno' : 'Sin desayuno'}
                                </span>
                            </div>
                            ${item.hotel.notas ? `<p class="notas">${item.hotel.notas}</p>` : ''}
                        </div>
                        
                        <div class="elemento-acciones">
                            <button onclick="editHotelInEstancia(${item.estanciaIndex}, ${item.hotelIndex})" class="btn-small">✏️ Editar</button>
                            <button onclick="deleteHotelFromEstancia(${item.estanciaIndex}, ${item.hotelIndex})" class="btn-small btn-danger">🗑️ Eliminar</button>
                        </div>
                    </div>
                `).join('')}
                
                ${todosHoteles.length === 0 ? 
                    '<div class="empty-message">No hay hoteles registrados<br><small>Agrega hoteles desde las estancias en el itinerario</small></div>' : ''
                }
            </div>
        </div>
    `;
}

function renderActividades() {
    const todasActividades = getAllActividades();
    return `
        <div class="section-container">
            <div class="section-header">
                <h3>🎯 Todas las Actividades</h3>
                <p class="section-subtitle">Gestiona las actividades de todas tus estancias</p>
            </div>
            
            <div class="elementos-grid">
                ${todasActividades.map(item => `
                    <div class="elemento-card actividad-card">
                        <div class="elemento-header">
                            <div class="actividad-info">
                                <h4>${item.actividad.nombre}</h4>
                                <span class="ciudad">${getEstanciaNombre(item.estanciaIndex)}</span>
                            </div>
                            ${item.actividad.costo > 0 ? `
                                <div class="precios">
                                    <div class="precio-original">${item.actividad.moneda} ${item.actividad.costo.toLocaleString()}</div>
                                    <div class="precio-mxn">$${convertirAMXN(item.actividad.costo, item.actividad.moneda).toLocaleString()} MXN</div>
                                </div>
                            ` : '<div class="precio-gratis">Gratis</div>'}
                        </div>
                        
                        <div class="elemento-contenido">
                            ${item.actividad.descripcion ? `<p class="descripcion">${item.actividad.descripcion}</p>` : ''}
                            <div class="detalles">
                                <span>👥 Para 4 personas</span>
                                ${item.actividad.duracion ? `<span>⏱️ ${item.actividad.duracion}</span>` : ''}
                            </div>
                        </div>
                        
                        <div class="elemento-acciones">
                            <button onclick="editActividadInEstancia(${item.estanciaIndex}, ${item.actividadIndex})" class="btn-small">✏️ Editar</button>
                            <button onclick="deleteActividadFromEstancia(${item.estanciaIndex}, ${item.actividadIndex})" class="btn-small btn-danger">🗑️ Eliminar</button>
                        </div>
                    </div>
                `).join('')}
                
                ${todasActividades.length === 0 ? 
                    '<div class="empty-message">No hay actividades registradas<br><small>Agrega actividades desde las estancias en el itinerario</small></div>' : ''
                }
            </div>
        </div>
    `;
}

function renderPresupuesto() {
    const totalIngresos = calcularTotalIngresos();
    const totalEgresos = calcularCostoTotal();
    const balance = totalIngresos - totalEgresos;
    
    const costoTransportes = calcularCostoTransportes();
    const costoHoteles = calcularCostoHoteles();
    const costoActividades = calcularCostoActividades();
    
    return `
        <div class="section-container">
            <div class="section-header">
                <h3>💰 Control de Presupuesto</h3>
                <button onclick="addIngreso()" class="btn-primary">➕ Agregar Dinero</button>
            </div>
            
            <div class="presupuesto-resumen">
                <div class="balance-card ${balance >= 0 ? 'positivo' : 'negativo'}">
                    <h4>💰 Balance</h4>
                    <div class="monto">${balance >= 0 ? '+' : ''}$${balance.toLocaleString()} MXN</div>
                    <p>${balance >= 0 ? 'Dinero disponible' : 'Presupuesto excedido'}</p>
                </div>
                
                <div class="resumen-card">
                    <h4>📈 Dinero disponible</h4>
                    <div class="monto positivo">$${totalIngresos.toLocaleString()} MXN</div>
                </div>
                
                <div class="resumen-card">
                    <h4>📉 Total planificado</h4>
                    <div class="monto negativo">$${totalEgresos.toLocaleString()} MXN</div>
                </div>
            </div>
            
            <div class="presupuesto-detalles">
                <div class="ingresos-seccion">
                    <h4>💰 Dinero Disponible</h4>
                    <div class="lista-ingresos">
                        ${(viajeData.presupuesto.ingresos || []).map(ingreso => `
                            <div class="ingreso-item">
                                <span class="descripcion">${ingreso.descripcion}</span>
                                <span class="monto">$${ingreso.monto.toLocaleString()} MXN</span>
                                <button onclick="deleteIngreso('${ingreso.id}')" class="btn-tiny btn-danger">🗑️</button>
                            </div>
                        `).join('')}
                        ${(viajeData.presupuesto.ingresos || []).length === 0 ? 
                            '<div class="empty-ingresos">No hay ingresos registrados</div>' : ''
                        }
                    </div>
                </div>
                
                <div class="gastos-seccion">
                    <h4>📊 Distribución de Gastos</h4>
                    <div class="gastos-breakdown">
                        <div class="gasto-categoria">
                            <span class="icono">🏨</span>
                            <span class="nombre">Hoteles</span>
                            <span class="monto">$${costoHoteles.toLocaleString()} MXN</span>
                        </div>
                        <div class="gasto-categoria">
                            <span class="icono">✈️</span>
                            <span class="nombre">Transportes</span>
                            <span class="monto">$${costoTransportes.toLocaleString()} MXN</span>
                        </div>
                        <div class="gasto-categoria">
                            <span class="icono">🎯</span>
                            <span class="nombre">Actividades</span>
                            <span class="monto">$${costoActividades.toLocaleString()} MXN</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="presupuesto-por-estancia">
                <h4>💵 Gastos por Estancia</h4>
                <div class="estancias-costos">
                    ${(viajeData.estancias || []).map(estancia => `
                        <div class="estancia-costo">
                            <div>
                                <div class="estancia-nombre">${estancia.destino}</div>
                                <div class="estancia-fechas">${formatDateRange(estancia.fechaInicio, estancia.fechaFin)}</div>
                            </div>
                            <div class="estancia-monto">$${calcularCostoEstancia(estancia).toLocaleString()} MXN</div>
                        </div>
                    `).join('')}
                    ${(viajeData.estancias || []).length === 0 ? 
                        '<div class="empty-message">No hay estancias registradas</div>' : ''
                    }
                </div>
            </div>
        </div>
    `;
}

// Continúa con TODAS las funciones del archivo original...
// [INCLUIR TODAS LAS FUNCIONES RESTANTES DEL ARCHIVO ORIGINAL]

// Funciones para renderizar meses del calendario
function renderMesCompleto(mesAno, titulo) {
    const [ano, mes] = mesAno.split('-').map(Number);
    const primerDia = new Date(ano, mes - 1, 1);
    const ultimoDia = new Date(ano, mes, 0);
    const diasEnMes = ultimoDia.getDate();
    const diaSemanaInicio = primerDia.getDay();
    
    let calendario = `
        <div class="mes-completo">
            <h4 class="mes-titulo">${titulo}</h4>
            <div class="dias-semana-header">
                <span>Dom</span><span>Lun</span><span>Mar</span><span>Mié</span><span>Jue</span><span>Vie</span><span>Sáb</span>
            </div>
            <div class="dias-mes-grid">
    `;
    
    // Días vacíos al inicio
    for (let i = 0; i < diaSemanaInicio; i++) {
        calendario += '<div class="dia-vacio"></div>';
    }
    
    // Días del mes
    for (let dia = 1; dia <= diasEnMes; dia++) {
        const fecha = `${ano}-${mes.toString().padStart(2, '0')}-${dia.toString().padStart(2, '0')}`;
        const esViaje = esFechaDeViaje(fecha);
        const tieneEstancia = tieneEstanciaEnFecha(fecha);
        
        calendario += `
            <div class="dia-clickeable ${esViaje ? 'dia-viaje' : ''} ${tieneEstancia ? 'dia-ocupado' : ''}" 
                 data-fecha="${fecha}" onclick="selectFecha('${fecha}')">
                ${dia}
            </div>
        `;
    }
    
    calendario += `
            </div>
        </div>
    `;
    
    return calendario;
}

// Funciones de gestión de estancias
window.addEstancia = function() {
    openEstanciaModal();
};

function openEstanciaModal(estanciaIndex = null, fechaInicio = null, fechaFin = null) {
    const estancia = estanciaIndex !== null ? viajeData.estancias[estanciaIndex] : null;
    
    // Estado del calendario en el modal
    let modalSelectedStart = fechaInicio || estancia?.fechaInicio || null;
    let modalSelectedEnd = fechaFin || estancia?.fechaFin || null;
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content estancia-modal">
            <h3>${estancia ? '✏️ Editar' : '➕ Nueva'} Estancia</h3>
            
            <div class="estancia-form-container">
                <!-- Calendario integrado -->
                <div class="calendario-integrado">
                    <h4>📅 Selecciona las fechas de la estancia</h4>
                    <div class="mini-calendario-completo">
                        ${renderCalendarioModal()}
                    </div>
                    <div class="fechas-seleccionadas-modal">
                        <div class="fecha-display">
                            <span class="fecha-label">Inicio:</span>
                            <span id="modal-inicio" class="fecha-value">${modalSelectedStart ? formatDateLong(modalSelectedStart) : 'Selecciona fecha'}</span>
                        </div>
                        <div class="fecha-display">
                            <span class="fecha-label">Fin:</span>
                            <span id="modal-fin" class="fecha-value">${modalSelectedEnd ? formatDateLong(modalSelectedEnd) : 'Selecciona fecha'}</span>
                        </div>
                        <div class="duracion-display">
                            <strong id="duracion-calculada">${modalSelectedStart && modalSelectedEnd ? calcularDias(modalSelectedStart, modalSelectedEnd) + ' días' : ''}</strong>
                        </div>
                    </div>
                </div>
                
                <!-- Información básica -->
                <div class="info-basica">
                    <h4>🏙️ Información de la estancia</h4>
                    <div class="form-group">
                        <label>Destino/Ciudad:</label>
                        <input type="text" id="destino" value="${estancia?.destino || ''}" placeholder="Ej: Zurich, Milan, Roma..." required>
                    </div>
                    <div class="form-group">
                        <label>Notas (opcional):</label>
                        <textarea id="notas" rows="2" placeholder="Información adicional sobre esta estancia...">${estancia?.notas || ''}</textarea>
                    </div>
                </div>
                
                <!-- Hoteles -->
                <div class="seccion-elementos">
                    <div class="seccion-header">
                        <h4>🏨 Hoteles</h4>
                        <button type="button" onclick="agregarHotelEnModal()" class="btn-agregar">➕ Agregar Hotel</button>
                    </div>
                    <div id="hoteles-lista" class="elementos-lista">
                        ${renderHotelesEnModal(estancia?.hoteles || [])}
                    </div>
                </div>
                
                <!-- Transportes -->
                <div class="seccion-elementos">
                    <div class="seccion-header">
                        <h4>✈️ Transportes</h4>
                        <button type="button" onclick="agregarTransporteEnModal()" class="btn-agregar">➕ Agregar Transporte</button>
                    </div>
                    <div id="transportes-lista" class="elementos-lista">
                        ${renderTransportesEnModal(estancia?.transportes || [])}
                    </div>
                </div>
                
                <!-- Actividades -->
                <div class="seccion-elementos">
                    <div class="seccion-header">
                        <h4>🎯 Actividades</h4>
                        <button type="button" onclick="agregarActividadEnModal()" class="btn-agregar">➕ Agregar Actividad</button>
                    </div>
                    <div id="actividades-lista" class="elementos-lista">
                        ${renderActividadesEnModal(estancia?.actividades || [])}
                    </div>
                </div>
                
                <!-- Botones principales -->
                <div class="form-buttons">
                    <button type="button" onclick="guardarEstancia()" class="btn-primary">💾 Guardar Estancia</button>
                    <button type="button" onclick="closeModal()" class="btn-secondary">❌ Cancelar</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Variables para el modal actual
    window.modalSelectedStart = modalSelectedStart;
    window.modalSelectedEnd = modalSelectedEnd;
    window.modalEstancia = estancia;
    window.modalEstanciaIndex = estanciaIndex;
    window.modalHoteles = [...(estancia?.hoteles || [])];
    window.modalTransportes = [...(estancia?.transportes || [])];
    window.modalActividades = [...(estancia?.actividades || [])];
    
    // Actualizar calendario después de renderizar
    setTimeout(updateModalCalendar, 100);
}

// Funciones de utilidad
function calcularDiasViaje() {
    const inicio = new Date(viajeData.fechaInicio || "2025-12-19");
    const fin = new Date(viajeData.fechaFin || "2026-01-07");
    return Math.ceil((fin - inicio) / (1000 * 60 * 60 * 24));
}

function calcularDias(fechaInicio, fechaFin) {
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    return Math.ceil((fin - inicio) / (1000 * 60 * 60 * 24)) + 1;
}

function calcularCostoTotal() {
    return (viajeData.estancias || []).reduce((total, estancia) => {
        return total + calcularCostoEstancia(estancia);
    }, 0);
}

function calcularCostoEstancia(estancia) {
    let total = 0;
    
    (estancia.hoteles || []).forEach(hotel => {
        total += convertirAMXN(hotel.costo, hotel.moneda);
    });
    
    (estancia.transportes || []).forEach(transporte => {
        total += convertirAMXN(transporte.costo, transporte.moneda);
    });
    
    (estancia.actividades || []).forEach(actividad => {
        total += convertirAMXN(actividad.costo, actividad.moneda);
    });
    
    return Math.round(total);
}

function convertirAMXN(cantidad, moneda) {
    return cantidad * (exchangeRates[moneda] || 1);
}

function calcularTotalIngresos() {
    return (viajeData.presupuesto.ingresos || []).reduce((total, ingreso) => {
        return total + (ingreso.monto || 0);
    }, 0);
}

function calcularCostoTransportes() {
    let total = 0;
    (viajeData.estancias || []).forEach(estancia => {
        (estancia.transportes || []).forEach(transporte => {
            total += convertirAMXN(transporte.costo, transporte.moneda);
        });
    });
    return Math.round(total);
}

function calcularCostoHoteles() {
    let total = 0;
    (viajeData.estancias || []).forEach(estancia => {
        (estancia.hoteles || []).forEach(hotel => {
            total += convertirAMXN(hotel.costo, hotel.moneda);
        });
    });
    return Math.round(total);
}

function calcularCostoActividades() {
    let total = 0;
    (viajeData.estancias || []).forEach(estancia => {
        (estancia.actividades || []).forEach(actividad => {
            total += convertirAMXN(actividad.costo, actividad.moneda);
        });
    });
    return Math.round(total);
}

// Funciones de formato
function formatDateShort(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

function formatDateLong(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatDateRange(start, end) {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const startStr = startDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    const endStr = endDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    return `${startStr} - ${endStr}`;
}

// Funciones auxiliares
function getAllTransportes() {
    const transportes = [];
    (viajeData.estancias || []).forEach((estancia, estanciaIndex) => {
        (estancia.transportes || []).forEach((transporte, transporteIndex) => {
            transportes.push({ transporte, estanciaIndex, transporteIndex });
        });
    });
    return transportes;
}

function getAllHoteles() {
    const hoteles = [];
    (viajeData.estancias || []).forEach((estancia, estanciaIndex) => {
        (estancia.hoteles || []).forEach((hotel, hotelIndex) => {
            hoteles.push({ hotel, estanciaIndex, hotelIndex });
        });
    });
    return hoteles;
}

function getAllActividades() {
    const actividades = [];
    (viajeData.estancias || []).forEach((estancia, estanciaIndex) => {
        (estancia.actividades || []).forEach((actividad, actividadIndex) => {
            actividades.push({ actividad, estanciaIndex, actividadIndex });
        });
    });
    return actividades;
}

function getEstanciaNombre(estanciaIndex) {
    return viajeData.estancias[estanciaIndex]?.destino || 'Estancia';
}

function getTransporteIcon(tipo) {
    const iconos = {
        'Avión': '✈️',
        'Tren': '🚆',
        'Autobús': '🚌',
        'Auto': '🚗'
    };
    return iconos[tipo] || '🚗';
}

function esFechaDeViaje(fecha) {
    const date = new Date(fecha);
    const inicio = new Date(viajeData.fechaInicio);
    const fin = new Date(viajeData.fechaFin);
    return date >= inicio && date <= fin;
}

function tieneEstanciaEnFecha(fecha) {
    return (viajeData.estancias || []).some(estancia => {
        const date = new Date(fecha);
        const inicio = new Date(estancia.fechaInicio);
        const fin = new Date(estancia.fechaFin);
        return date >= inicio && date <= fin;
    });
}

// Funciones de UI/Modales
window.showTab = function(tabName) {
    // Remover clase active de todos los tabs y contenido
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

    // Activar el tab seleccionado
    event.target.classList.add('active');
    document.getElementById(tabName).classList.add('active');
};

window.closeModal = function() {
    const modal = document.querySelector('.modal');
    if (modal) modal.remove();
};

// NUEVAS funciones para la vista de lista
window.toggleView = function(view) {
    currentView = view;
    renderApp();
};

window.toggleExpandRow = function(index) {
    if (expandedRows.has(index)) {
        expandedRows.delete(index);
    } else {
        expandedRows.add(index);
    }
    renderApp();
};

// Todas las demás funciones del archivo original continúan igual...
// [INCLUIR TODAS LAS FUNCIONES DE GESTIÓN DE HOTELES, TRANSPORTES, ACTIVIDADES, ETC.]

// Funciones de calendario
window.selectFecha = function(fecha) {
    if (!esFechaDeViaje(fecha)) return;
    
    if (!selectedStartDate) {
        selectedStartDate = fecha;
        selectedEndDate = null;
    } else if (!selectedEndDate && fecha > selectedStartDate) {
        selectedEndDate = fecha;
    } else {
        selectedStartDate = fecha;
        selectedEndDate = null;
    }
    
    updateCalendarioDisplay();
};

function updateCalendarioDisplay() {
    document.querySelectorAll('.dia-clickeable').forEach(dia => {
        const fecha = dia.getAttribute('data-fecha');
        dia.classList.remove('dia-seleccionado', 'dia-en-rango');
        
        if (esFechaSeleccionada(fecha)) {
            dia.classList.add('dia-seleccionado');
        } else if (esFechaEnRango(fecha)) {
            dia.classList.add('dia-en-rango');
        }
    });
    
    const inicioDisplay = document.getElementById('fecha-inicio-display');
    const finDisplay = document.getElementById('fecha-fin-display');
    const btnCrear = document.getElementById('btn-crear-estancia');
    
    if (inicioDisplay) {
        inicioDisplay.textContent = selectedStartDate ? formatDateLong(selectedStartDate) : 'Selecciona fecha inicio';
    }
    
    if (finDisplay) {
        finDisplay.textContent = selectedEndDate ? formatDateLong(selectedEndDate) : 'Selecciona fecha fin';
    }
    
    if (btnCrear) {
        btnCrear.disabled = !selectedStartDate || !selectedEndDate;
    }
}

function esFechaSeleccionada(fecha) {
    return fecha === selectedStartDate || fecha === selectedEndDate;
}

function esFechaEnRango(fecha) {
    if (!selectedStartDate || !selectedEndDate) return false;
    return fecha > selectedStartDate && fecha < selectedEndDate;
}

window.limpiarSeleccion = function() {
    selectedStartDate = null;
    selectedEndDate = null;
    updateCalendarioDisplay();
};

window.crearEstanciaFromCalendar = function() {
    if (selectedStartDate && selectedEndDate) {
        openEstanciaModal(null, selectedStartDate, selectedEndDate);
    }
};

// Renderizar elementos en modal
function renderCalendarioModal() {
    return `
        <div class="meses-modal-grid">
            ${renderMesModal("2025-12", "Diciembre 2025")}
            ${renderMesModal("2026-01", "Enero 2026")}
        </div>
    `;
}

function renderMesModal(mesAno, titulo) {
    const [ano, mes] = mesAno.split('-').map(Number);
    const primerDia = new Date(ano, mes - 1, 1);
    const ultimoDia = new Date(ano, mes, 0);
    const diasEnMes = ultimoDia.getDate();
    const diaSemanaInicio = primerDia.getDay();
    
    let calendario = `
        <div class="mes-modal">
            <h5 class="mes-modal-titulo">${titulo}</h5>
            <div class="dias-semana-modal">
                <span>Dom</span><span>Lun</span><span>Mar</span><span>Mié</span><span>Jue</span><span>Vie</span><span>Sáb</span>
            </div>
            <div class="dias-modal-grid">
    `;
    
    for (let i = 0; i < diaSemanaInicio; i++) {
        calendario += '<div class="dia-modal-vacio"></div>';
    }
    
    for (let dia = 1; dia <= diasEnMes; dia++) {
        const fecha = `${ano}-${mes.toString().padStart(2, '0')}-${dia.toString().padStart(2, '0')}`;
        const esViaje = esFechaDeViaje(fecha);
        const tieneEstancia = tieneEstanciaEnFecha(fecha);
        
        calendario += `
            <div class="dia-modal ${esViaje ? 'dia-modal-viaje' : ''} ${tieneEstancia ? 'dia-modal-ocupado' : ''}" 
                 data-fecha="${fecha}" onclick="selectFechaModal('${fecha}')">
                ${dia}
            </div>
        `;
    }
    
    calendario += `
            </div>
        </div>
    `;
    
    return calendario;
}

function renderHotelesEnModal(hoteles) {
    if (hoteles.length === 0) {
        return '<p class="no-elementos-modal">No hay hoteles agregados</p>';
    }
    
    return hoteles.map((hotel, index) => `
        <div class="elemento-modal hotel-modal">
            <div class="elemento-modal-info">
                <strong>${hotel.nombre}</strong>
                <span>${hotel.tipoHabitacion} - ${hotel.cantidadHabitaciones} hab.</span>
                <span>${formatDateShort(hotel.fechaInicio)} - ${formatDateShort(hotel.fechaFin)}</span>
                <span class="precio-modal">${hotel.moneda} ${hotel.costo.toLocaleString()}</span>
                <span class="desayuno-modal ${hotel.desayunoIncluido ? 'incluido' : 'no-incluido'}">
                    ${hotel.desayunoIncluido ? '🍳 Con desayuno' : '❌ Sin desayuno'}
                </span>
            </div>
            <div class="elemento-modal-acciones">
                <button onclick="editarHotelEnModal(${index})" class="btn-modal-edit">✏️</button>
                <button onclick="eliminarHotelEnModal(${index})" class="btn-modal-delete">🗑️</button>
            </div>
        </div>
    `).join('');
}

function renderTransportesEnModal(transportes) {
    if (transportes.length === 0) {
        return '<p class="no-elementos-modal">No hay transportes agregados</p>';
    }
    
    return transportes.map((transporte, index) => `
        <div class="elemento-modal transporte-modal">
            <div class="elemento-modal-info">
                <strong>${getTransporteIcon(transporte.tipo)} ${transporte.origen} → ${transporte.destino}</strong>
                <span>${formatDateShort(transporte.fecha)} ${transporte.hora ? '- ' + transporte.hora : ''}</span>
                <span class="precio-modal">${transporte.moneda} ${transporte.costo.toLocaleString()}</span>
                <span>${transporte.tipo}</span>
            </div>
            <div class="elemento-modal-acciones">
                <button onclick="editarTransporteEnModal(${index})" class="btn-modal-edit">✏️</button>
                <button onclick="eliminarTransporteEnModal(${index})" class="btn-modal-delete">🗑️</button>
            </div>
        </div>
    `).join('');
}

function renderActividadesEnModal(actividades) {
    if (actividades.length === 0) {
        return '<p class="no-elementos-modal">No hay actividades agregadas</p>';
    }
    
    return actividades.map((actividad, index) => `
        <div class="elemento-modal actividad-modal">
            <div class="elemento-modal-info">
                <strong>${actividad.nombre}</strong>
                ${actividad.duracion ? `<span>⏱️ ${actividad.duracion}</span>` : ''}
                ${actividad.costo > 0 ? 
                    `<span class="precio-modal">${actividad.moneda} ${actividad.costo.toLocaleString()}</span>` : 
                    '<span class="gratis-modal">Gratis</span>'
                }
                ${actividad.descripcion ? `<span class="descripcion-modal">${actividad.descripcion}</span>` : ''}
            </div>
            <div class="elemento-modal-acciones">
                <button onclick="editarActividadEnModal(${index})" class="btn-modal-edit">✏️</button>
                <button onclick="eliminarActividadEnModal(${index})" class="btn-modal-delete">🗑️</button>
            </div>
        </div>
    `).join('');
}

// Funciones del calendario en modal
window.selectFechaModal = function(fecha) {
    if (!esFechaDeViaje(fecha)) return;
    
    if (!window.modalSelectedStart) {
        window.modalSelectedStart = fecha;
        window.modalSelectedEnd = null;
    } else if (!window.modalSelectedEnd && fecha > window.modalSelectedStart) {
        window.modalSelectedEnd = fecha;
    } else {
        window.modalSelectedStart = fecha;
        window.modalSelectedEnd = null;
    }
    
    updateModalCalendar();
};

function updateModalCalendar() {
    // Actualizar clases de los días
    document.querySelectorAll('.dia-modal').forEach(dia => {
        const fecha = dia.getAttribute('data-fecha');
        dia.classList.remove('dia-modal-seleccionado', 'dia-modal-en-rango');
        
        if (fecha === window.modalSelectedStart || fecha === window.modalSelectedEnd) {
            dia.classList.add('dia-modal-seleccionado');
        } else if (window.modalSelectedStart && window.modalSelectedEnd && 
                  fecha > window.modalSelectedStart && fecha < window.modalSelectedEnd) {
            dia.classList.add('dia-modal-en-rango');
        }
    });
    
    // Actualizar displays
    const inicioElement = document.getElementById('modal-inicio');
    const finElement = document.getElementById('modal-fin');
    const duracionElement = document.getElementById('duracion-calculada');
    
    if (inicioElement) {
        inicioElement.textContent = window.modalSelectedStart ? 
            formatDateLong(window.modalSelectedStart) : 'Selecciona fecha';
    }
    
    if (finElement) {
        finElement.textContent = window.modalSelectedEnd ? 
            formatDateLong(window.modalSelectedEnd) : 'Selecciona fecha';
    }
    
    if (duracionElement) {
        duracionElement.textContent = window.modalSelectedStart && window.modalSelectedEnd ? 
            calcularDias(window.modalSelectedStart, window.modalSelectedEnd) + ' días' : '';
    }
}

// Guardar estancia
window.guardarEstancia = function() {
    const destino = document.getElementById('destino').value.trim();
    
    if (!destino) {
        alert('Por favor ingresa el destino de la estancia');
        return;
    }
    
    if (!window.modalSelectedStart || !window.modalSelectedEnd) {
        alert('Por favor selecciona las fechas de inicio y fin');
        return;
    }
    
    const estancia = {
        destino: destino,
        fechaInicio: window.modalSelectedStart,
        fechaFin: window.modalSelectedEnd,
        notas: document.getElementById('notas').value.trim(),
        hoteles: window.modalHoteles || [],
        transportes: window.modalTransportes || [],
        actividades: window.modalActividades || []
    };
    
    if (window.modalEstanciaIndex !== null) {
        // Editar estancia existente
        viajeData.estancias[window.modalEstanciaIndex] = estancia;
    } else {
        // Nueva estancia
        viajeData.estancias.push(estancia);
    }
    
    saveData('viajeData', viajeData);
    closeModal();
    renderApp();
};

// Gestión de estancias
window.editEstancia = function(index) {
    openEstanciaModal(index);
};

window.deleteEstancia = function(index) {
    if (confirm('¿Estás seguro de eliminar esta estancia?')) {
        viajeData.estancias.splice(index, 1);
        saveData('viajeData', viajeData);
        renderApp();
    }
};

// Agregar hoteles, transportes y actividades...
// [CONTINUAR CON TODAS LAS FUNCIONES DE GESTIÓN]

// Funciones para agregar elementos en el modal
window.agregarHotelEnModal = function() {
    if (!window.modalSelectedStart || !window.modalSelectedEnd) {
        alert('Primero selecciona las fechas de la estancia');
        return;
    }
    
    const miniModal = document.createElement('div');
    miniModal.className = 'mini-modal';
    miniModal.innerHTML = `
        <div class="mini-modal-content">
            <h4>🏨 Agregar Hotel</h4>
            <form id="hotelMiniForm">
                <div class="form-row">
                    <div class="form-group">
                        <label>Nombre del hotel:</label>
                        <input type="text" id="hotelNombre" placeholder="Ej: Holiday Inn Airport" required>
                    </div>
                    <div class="form-group">
                        <label>Tipo de habitación:</label>
                        <select id="hotelTipo">
                            <option value="Estándar">Estándar</option>
                            <option value="Doble">Doble</option>
                            <option value="Triple">Triple</option>
                            <option value="Familiar">Familiar</option>
                            <option value="Suite">Suite</option>
                        </select>
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label>Check-in:</label>
                        <input type="date" id="hotelCheckIn" value="${window.modalSelectedStart}" min="${window.modalSelectedStart}" max="${window.modalSelectedEnd}" required>
                    </div>
                    <div class="form-group">
                        <label>Check-out:</label>
                        <input type="date" id="hotelCheckOut" value="${window.modalSelectedEnd}" min="${window.modalSelectedStart}" max="${window.modalSelectedEnd}" required>
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label>Habitaciones:</label>
                        <input type="number" id="hotelCantidad" value="1" min="1" required>
                    </div>
                    <div class="form-group">
                        <label>Desayuno:</label>
                        <select id="hotelDesayuno">
                            <option value="true">✅ Sí incluido</option>
                            <option value="false">❌ No incluido</option>
                        </select>
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label>Moneda:</label>
                        <select id="hotelMoneda" onchange="calcularConversionMini()">
                            <option value="MXN">🇲🇽 Pesos MXN</option>
                            <option value="USD">🇺🇸 Dólares USD</option>
                            <option value="EUR">🇪🇺 Euros EUR</option>
                            <option value="CHF">🇨🇭 Francos CHF</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Costo total:</label>
                        <input type="number" id="hotelCosto" required onchange="calcularConversionMini()">
                        <div id="conversionMini" class="conversion-preview"></div>
                    </div>
                </div>
                
                <div class="form-group">
                    <label>Notas (opcional):</label>
                    <input type="text" id="hotelNotas" placeholder="WiFi gratis, piscina, etc.">
                </div>
                
                <div class="form-buttons">
                    <button type="button" onclick="guardarHotelMini()" class="btn-primary">💾 Guardar</button>
                    <button type="button" onclick="closeMiniModal()" class="btn-secondary">❌ Cancelar</button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(miniModal);
};

window.guardarHotelMini = function() {
    const hotel = {
        nombre: document.getElementById('hotelNombre').value,
        tipoHabitacion: document.getElementById('hotelTipo').value,
        fechaInicio: document.getElementById('hotelCheckIn').value,
        fechaFin: document.getElementById('hotelCheckOut').value,
        cantidadHabitaciones: parseInt(document.getElementById('hotelCantidad').value),
        desayunoIncluido: document.getElementById('hotelDesayuno').value === 'true',
        costo: parseFloat(document.getElementById('hotelCosto').value),
        moneda: document.getElementById('hotelMoneda').value,
        notas: document.getElementById('hotelNotas').value
    };
    
    window.modalHoteles.push(hotel);
    document.getElementById('hoteles-lista').innerHTML = renderHotelesEnModal(window.modalHoteles);
    closeMiniModal();
};

window.closeMiniModal = function() {
    const miniModal = document.querySelector('.mini-modal');
    if (miniModal) miniModal.remove();
};

window.calcularConversionMini = function() {
    const moneda = document.getElementById('hotelMoneda').value;
    const costo = parseFloat(document.getElementById('hotelCosto').value) || 0;
    const conversionDiv = document.getElementById('conversionMini');
    
    if (costo > 0 && moneda !== 'MXN') {
        const costoMXN = convertirAMXN(costo, moneda);
        conversionDiv.innerHTML = `≈ $${costoMXN.toLocaleString()} MXN`;
    } else {
        conversionDiv.innerHTML = '';
    }
};

// Funciones similares para transportes y actividades...
window.agregarTransporteEnModal = function() {
    const miniModal = document.createElement('div');
    miniModal.className = 'mini-modal';
    miniModal.innerHTML = `
        <div class="mini-modal-content">
            <h4>✈️ Agregar Transporte</h4>
            <form id="transporteMiniForm">
                <div class="form-row">
                    <div class="form-group">
                        <label>Tipo de transporte:</label>
                        <select id="transporteTipo">
                            <option value="Avión">✈️ Avión</option>
                            <option value="Tren">🚆 Tren</option>
                            <option value="Autobús">🚌 Autobús</option>
                            <option value="Auto">🚗 Auto</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Fecha:</label>
                        <input type="date" id="transporteFecha" required>
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label>Origen:</label>
                        <input type="text" id="transporteOrigen" placeholder="Ciudad de salida" required>
                    </div>
                    <div class="form-group">
                        <label>Destino:</label>
                        <input type="text" id="transporteDestino" placeholder="Ciudad de llegada" required>
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label>Hora (opcional):</label>
                        <input type="time" id="transporteHora">
                    </div>
                    <div class="form-group">
                        <label>Moneda:</label>
                        <select id="transporteMoneda" onchange="calcularConversionTransporteMini()">
                            <option value="MXN">🇲🇽 Pesos MXN</option>
                            <option value="USD">🇺🇸 Dólares USD</option>
                            <option value="EUR">🇪🇺 Euros EUR</option>
                            <option value="CHF">🇨🇭 Francos CHF</option>
                        </select>
                    </div>
                </div>
                
                <div class="form-group">
                    <label>Costo:</label>
                    <input type="number" id="transporteCosto" required onchange="calcularConversionTransporteMini()">
                    <div id="conversionTransporteMini" class="conversion-preview"></div>
                </div>
                
                <div class="form-group">
                    <label>Notas (opcional):</label>
                    <input type="text" id="transporteNotas" placeholder="Número de vuelo, asiento, etc.">
                </div>
                
                <div class="form-buttons">
                    <button type="button" onclick="guardarTransporteMini()" class="btn-primary">💾 Guardar</button>
                    <button type="button" onclick="closeMiniModal()" class="btn-secondary">❌ Cancelar</button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(miniModal);
};

window.guardarTransporteMini = function() {
    const transporte = {
        tipo: document.getElementById('transporteTipo').value,
        fecha: document.getElementById('transporteFecha').value,
        origen: document.getElementById('transporteOrigen').value,
        destino: document.getElementById('transporteDestino').value,
        hora: document.getElementById('transporteHora').value,
        costo: parseFloat(document.getElementById('transporteCosto').value),
        moneda: document.getElementById('transporteMoneda').value,
        notas: document.getElementById('transporteNotas').value
    };
    
    window.modalTransportes.push(transporte);
    document.getElementById('transportes-lista').innerHTML = renderTransportesEnModal(window.modalTransportes);
    closeMiniModal();
};

window.calcularConversionTransporteMini = function() {
    const moneda = document.getElementById('transporteMoneda').value;
    const costo = parseFloat(document.getElementById('transporteCosto').value) || 0;
    const conversionDiv = document.getElementById('conversionTransporteMini');
    
    if (costo > 0 && moneda !== 'MXN') {
        const costoMXN = convertirAMXN(costo, moneda);
        conversionDiv.innerHTML = `≈ $${costoMXN.toLocaleString()} MXN`;
    } else {
        conversionDiv.innerHTML = '';
    }
};

// Agregar actividad
window.agregarActividadEnModal = function() {
    const miniModal = document.createElement('div');
    miniModal.className = 'mini-modal';
    miniModal.innerHTML = `
        <div class="mini-modal-content">
            <h4>🎯 Agregar Actividad</h4>
            <form id="actividadMiniForm">
                <div class="form-group">
                    <label>Nombre:</label>
                    <input type="text" id="actividadNombre" placeholder="Ej: Tour del Coliseo" required>
                </div>
                
                <div class="form-group">
                    <label>Descripción (opcional):</label>
                    <textarea id="actividadDescripcion" rows="2" placeholder="Detalles de la actividad..."></textarea>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label>Duración (opcional):</label>
                        <input type="text" id="actividadDuracion" placeholder="Ej: 2 horas">
                    </div>
                    <div class="form-group">
                        <label>Moneda:</label>
                        <select id="actividadMoneda" onchange="calcularConversionActividadMini()">
                            <option value="MXN">🇲🇽 Pesos MXN</option>
                            <option value="USD">🇺🇸 Dólares USD</option>
                            <option value="EUR">🇪🇺 Euros EUR</option>
                            <option value="CHF">🇨🇭 Francos CHF</option>
                        </select>
                    </div>
                </div>
                
                <div class="form-group">
                    <label>Costo (por persona):</label>
                    <input type="number" id="actividadCosto" value="0" required onchange="calcularConversionActividadMini()">
                    <div id="conversionActividadMini" class="conversion-preview"></div>
                    <small>Deja en 0 si es gratis</small>
                </div>
                
                <div class="form-buttons">
                    <button type="button" onclick="guardarActividadMini()" class="btn-primary">💾 Guardar</button>
                    <button type="button" onclick="closeMiniModal()" class="btn-secondary">❌ Cancelar</button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(miniModal);
};

window.guardarActividadMini = function() {
    const actividad = {
        nombre: document.getElementById('actividadNombre').value,
        descripcion: document.getElementById('actividadDescripcion').value,
        duracion: document.getElementById('actividadDuracion').value,
        costo: parseFloat(document.getElementById('actividadCosto').value),
        moneda: document.getElementById('actividadMoneda').value
    };
    
    window.modalActividades.push(actividad);
    document.getElementById('actividades-lista').innerHTML = renderActividadesEnModal(window.modalActividades);
    closeMiniModal();
};

window.calcularConversionActividadMini = function() {
    const moneda = document.getElementById('actividadMoneda').value;
    const costo = parseFloat(document.getElementById('actividadCosto').value) || 0;
    const conversionDiv = document.getElementById('conversionActividadMini');
    
    if (costo > 0 && moneda !== 'MXN') {
        const costoMXN = convertirAMXN(costo, moneda);
        conversionDiv.innerHTML = `≈ $${costoMXN.toLocaleString()} MXN por persona<br>Total 4 personas: $${(costoMXN * 4).toLocaleString()} MXN`;
    } else {
        conversionDiv.innerHTML = '';
    }
};

// Funciones para eliminar elementos en modal
window.eliminarHotelEnModal = function(index) {
    window.modalHoteles.splice(index, 1);
    document.getElementById('hoteles-lista').innerHTML = renderHotelesEnModal(window.modalHoteles);
};

window.eliminarTransporteEnModal = function(index) {
    window.modalTransportes.splice(index, 1);
    document.getElementById('transportes-lista').innerHTML = renderTransportesEnModal(window.modalTransportes);
};

window.eliminarActividadEnModal = function(index) {
    window.modalActividades.splice(index, 1);
    document.getElementById('actividades-lista').innerHTML = renderActividadesEnModal(window.modalActividades);
};

// Funciones placeholder para editar elementos en modal
window.editarHotelEnModal = function(index) {
    alert('Funcionalidad de edición en desarrollo');
};

window.editarTransporteEnModal = function(index) {
    alert('Funcionalidad de edición en desarrollo');
};

window.editarActividadEnModal = function(index) {
    alert('Funcionalidad de edición en desarrollo');
};

// Funciones de gestión directa desde las vistas
window.addHotelToEstancia = function(estanciaIndex) {
    openHotelModal(estanciaIndex);
};

window.addTransporteToEstancia = function(estanciaIndex) {
    openTransporteModal(estanciaIndex);
};

window.addActividadToEstancia = function(estanciaIndex) {
    openActividadModal(estanciaIndex);
};

// Funciones para abrir modales de elementos individuales
function openHotelModal(estanciaIndex, hotelIndex = null) {
    const estancia = viajeData.estancias[estanciaIndex];
    const hotel = hotelIndex !== null ? estancia.hoteles[hotelIndex] : null;
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h3>${hotel ? '✏️ Editar' : '➕ Agregar'} Hotel</h3>
            <form id="hotelForm">
                <div class="form-row">
                    <div class="form-group">
                        <label>Nombre del hotel:</label>
                        <input type="text" id="hotelNombre" value="${hotel?.nombre || ''}" placeholder="Ej: Holiday Inn Airport" required>
                    </div>
                    <div class="form-group">
                        <label>Tipo de habitación:</label>
                        <select id="hotelTipo">
                            <option value="Estándar" ${hotel?.tipoHabitacion === 'Estándar' ? 'selected' : ''}>Estándar</option>
                            <option value="Doble" ${hotel?.tipoHabitacion === 'Doble' ? 'selected' : ''}>Doble</option>
                            <option value="Triple" ${hotel?.tipoHabitacion === 'Triple' ? 'selected' : ''}>Triple</option>
                            <option value="Familiar" ${hotel?.tipoHabitacion === 'Familiar' ? 'selected' : ''}>Familiar</option>
                            <option value="Suite" ${hotel?.tipoHabitacion === 'Suite' ? 'selected' : ''}>Suite</option>
                        </select>
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label>Check-in:</label>
                        <input type="date" id="hotelCheckIn" value="${hotel?.fechaInicio || estancia.fechaInicio}" min="${estancia.fechaInicio}" max="${estancia.fechaFin}" required>
                    </div>
                    <div class="form-group">
                        <label>Check-out:</label>
                        <input type="date" id="hotelCheckOut" value="${hotel?.fechaFin || estancia.fechaFin}" min="${estancia.fechaInicio}" max="${estancia.fechaFin}" required>
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label>Cantidad de habitaciones:</label>
                        <input type="number" id="hotelCantidad" value="${hotel?.cantidadHabitaciones || 1}" min="1" required>
                    </div>
                    <div class="form-group">
                        <label>Desayuno incluido:</label>
                        <select id="hotelDesayuno">
                            <option value="true" ${hotel?.desayunoIncluido === true ? 'selected' : ''}>✅ Sí</option>
                            <option value="false" ${hotel?.desayunoIncluido === false ? 'selected' : ''}>❌ No</option>
                        </select>
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label>Moneda:</label>
                        <select id="hotelMoneda" onchange="calcularConversionHotel()">
                            <option value="MXN" ${hotel?.moneda === 'MXN' ? 'selected' : ''}>🇲🇽 Pesos MXN</option>
                            <option value="USD" ${hotel?.moneda === 'USD' ? 'selected' : ''}>🇺🇸 Dólares USD</option>
                            <option value="EUR" ${hotel?.moneda === 'EUR' ? 'selected' : ''}>🇪🇺 Euros EUR</option>
                            <option value="CHF" ${hotel?.moneda === 'CHF' ? 'selected' : ''}>🇨🇭 Francos CHF</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Costo total:</label>
                        <input type="number" id="hotelCosto" value="${hotel?.costo || ''}" required onchange="calcularConversionHotel()">
                        <div id="conversionHotel" class="conversion-preview"></div>
                    </div>
                </div>
                
                <div class="form-group">
                    <label>Notas (opcional):</label>
                    <textarea id="hotelNotas" rows="2" placeholder="Información adicional...">${hotel?.notas || ''}</textarea>
                </div>
                
                <div class="form-buttons">
                    <button type="button" onclick="guardarHotel(${estanciaIndex}, ${hotelIndex})" class="btn-primary">💾 Guardar</button>
                    <button type="button" onclick="closeModal()" class="btn-secondary">❌ Cancelar</button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    if (hotel) {
        calcularConversionHotel();
    }
}

function openTransporteModal(estanciaIndex, transporteIndex = null) {
    const estancia = viajeData.estancias[estanciaIndex];
    const transporte = transporteIndex !== null ? estancia.transportes[transporteIndex] : null;
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h3>${transporte ? '✏️ Editar' : '➕ Agregar'} Transporte</h3>
            <form id="transporteForm">
                <div class="form-row">
                    <div class="form-group">
                        <label>Tipo de transporte:</label>
                        <select id="transporteTipo">
                            <option value="Avión" ${transporte?.tipo === 'Avión' ? 'selected' : ''}>✈️ Avión</option>
                            <option value="Tren" ${transporte?.tipo === 'Tren' ? 'selected' : ''}>🚆 Tren</option>
                            <option value="Autobús" ${transporte?.tipo === 'Autobús' ? 'selected' : ''}>🚌 Autobús</option>
                            <option value="Auto" ${transporte?.tipo === 'Auto' ? 'selected' : ''}>🚗 Auto</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Fecha:</label>
                        <input type="date" id="transporteFecha" value="${transporte?.fecha || ''}" required>
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label>Origen:</label>
                        <input type="text" id="transporteOrigen" value="${transporte?.origen || ''}" placeholder="Ciudad de salida" required>
                    </div>
                    <div class="form-group">
                        <label>Destino:</label>
                        <input type="text" id="transporteDestino" value="${transporte?.destino || ''}" placeholder="Ciudad de llegada" required>
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label>Hora (opcional):</label>
                        <input type="time" id="transporteHora" value="${transporte?.hora || ''}">
                    </div>
                    <div class="form-group">
                        <label>Moneda:</label>
                        <select id="transporteMoneda" onchange="calcularConversionTransporte()">
                            <option value="MXN" ${transporte?.moneda === 'MXN' ? 'selected' : ''}>🇲🇽 Pesos MXN</option>
                            <option value="USD" ${transporte?.moneda === 'USD' ? 'selected' : ''}>🇺🇸 Dólares USD</option>
                            <option value="EUR" ${transporte?.moneda === 'EUR' ? 'selected' : ''}>🇪🇺 Euros EUR</option>
                            <option value="CHF" ${transporte?.moneda === 'CHF' ? 'selected' : ''}>🇨🇭 Francos CHF</option>
                        </select>
                    </div>
                </div>
                
                <div class="form-group">
                    <label>Costo:</label>
                    <input type="number" id="transporteCosto" value="${transporte?.costo || ''}" required onchange="calcularConversionTransporte()">
                    <div id="conversionTransporte" class="conversion-preview"></div>
                </div>
                
                <div class="form-group">
                    <label>Notas (opcional):</label>
                    <textarea id="transporteNotas" rows="2" placeholder="Número de vuelo, confirmación, etc...">${transporte?.notas || ''}</textarea>
                </div>
                
                <div class="form-buttons">
                    <button type="button" onclick="guardarTransporte(${estanciaIndex}, ${transporteIndex})" class="btn-primary">💾 Guardar</button>
                    <button type="button" onclick="closeModal()" class="btn-secondary">❌ Cancelar</button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    if (transporte) {
        calcularConversionTransporte();
    }
}

function openActividadModal(estanciaIndex, actividadIndex = null) {
    const estancia = viajeData.estancias[estanciaIndex];
    const actividad = actividadIndex !== null ? estancia.actividades[actividadIndex] : null;
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h3>${actividad ? '✏️ Editar' : '➕ Agregar'} Actividad</h3>
            <form id="actividadForm">
                <div class="form-group">
                    <label>Nombre de la actividad:</label>
                    <input type="text" id="actividadNombre" value="${actividad?.nombre || ''}" placeholder="Ej: Tour del Coliseo" required>
                </div>
                
                <div class="form-group">
                    <label>Descripción (opcional):</label>
                    <textarea id="actividadDescripcion" rows="3" placeholder="Detalles de la actividad...">${actividad?.descripcion || ''}</textarea>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label>Duración (opcional):</label>
                        <input type="text" id="actividadDuracion" value="${actividad?.duracion || ''}" placeholder="Ej: 2 horas">
                    </div>
                    <div class="form-group">
                        <label>Moneda:</label>
                        <select id="actividadMoneda" onchange="calcularConversionActividad()">
                            <option value="MXN" ${actividad?.moneda === 'MXN' ? 'selected' : ''}>🇲🇽 Pesos MXN</option>
                            <option value="USD" ${actividad?.moneda === 'USD' ? 'selected' : ''}>🇺🇸 Dólares USD</option>
                            <option value="EUR" ${actividad?.moneda === 'EUR' ? 'selected' : ''}>🇪🇺 Euros EUR</option>
                            <option value="CHF" ${actividad?.moneda === 'CHF' ? 'selected' : ''}>🇨🇭 Francos CHF</option>
                        </select>
                    </div>
                </div>
                
                <div class="form-group">
                    <label>Costo por persona:</label>
                    <input type="number" id="actividadCosto" value="${actividad?.costo || 0}" required onchange="calcularConversionActividad()">
                    <div id="conversionActividad" class="conversion-preview"></div>
                    <small>Deja en 0 si la actividad es gratuita</small>
                </div>
                
                <div class="form-buttons">
                    <button type="button" onclick="guardarActividad(${estanciaIndex}, ${actividadIndex})" class="btn-primary">💾 Guardar</button>
                    <button type="button" onclick="closeModal()" class="btn-secondary">❌ Cancelar</button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    if (actividad) {
        calcularConversionActividad();
    }
}

// Funciones para guardar elementos
window.guardarHotel = function(estanciaIndex, hotelIndex) {
    const hotel = {
        nombre: document.getElementById('hotelNombre').value,
        tipoHabitacion: document.getElementById('hotelTipo').value,
        fechaInicio: document.getElementById('hotelCheckIn').value,
        fechaFin: document.getElementById('hotelCheckOut').value,
        cantidadHabitaciones: parseInt(document.getElementById('hotelCantidad').value),
        desayunoIncluido: document.getElementById('hotelDesayuno').value === 'true',
        costo: parseFloat(document.getElementById('hotelCosto').value),
        moneda: document.getElementById('hotelMoneda').value,
        notas: document.getElementById('hotelNotas').value
    };
    
    if (hotelIndex !== null) {
        viajeData.estancias[estanciaIndex].hoteles[hotelIndex] = hotel;
    } else {
        if (!viajeData.estancias[estanciaIndex].hoteles) {
            viajeData.estancias[estanciaIndex].hoteles = [];
        }
        viajeData.estancias[estanciaIndex].hoteles.push(hotel);
    }
    
    saveData('viajeData', viajeData);
    closeModal();
    renderApp();
};

window.guardarTransporte = function(estanciaIndex, transporteIndex) {
    const transporte = {
        tipo: document.getElementById('transporteTipo').value,
        fecha: document.getElementById('transporteFecha').value,
        origen: document.getElementById('transporteOrigen').value,
        destino: document.getElementById('transporteDestino').value,
        hora: document.getElementById('transporteHora').value,
        costo: parseFloat(document.getElementById('transporteCosto').value),
        moneda: document.getElementById('transporteMoneda').value,
        notas: document.getElementById('transporteNotas').value
    };
    
    if (transporteIndex !== null) {
        viajeData.estancias[estanciaIndex].transportes[transporteIndex] = transporte;
    } else {
        if (!viajeData.estancias[estanciaIndex].transportes) {
            viajeData.estancias[estanciaIndex].transportes = [];
        }
        viajeData.estancias[estanciaIndex].transportes.push(transporte);
    }
    
    saveData('viajeData', viajeData);
    closeModal();
    renderApp();
};

window.guardarActividad = function(estanciaIndex, actividadIndex) {
    const actividad = {
        nombre: document.getElementById('actividadNombre').value,
        descripcion: document.getElementById('actividadDescripcion').value,
        duracion: document.getElementById('actividadDuracion').value,
        costo: parseFloat(document.getElementById('actividadCosto').value),
        moneda: document.getElementById('actividadMoneda').value
    };
    
    if (actividadIndex !== null) {
        viajeData.estancias[estanciaIndex].actividades[actividadIndex] = actividad;
    } else {
        if (!viajeData.estancias[estanciaIndex].actividades) {
            viajeData.estancias[estanciaIndex].actividades = [];
        }
        viajeData.estancias[estanciaIndex].actividades.push(actividad);
    }
    
    saveData('viajeData', viajeData);
    closeModal();
    renderApp();
};

// Funciones de conversión en modales
window.calcularConversionHotel = function() {
    const moneda = document.getElementById('hotelMoneda').value;
    const costo = parseFloat(document.getElementById('hotelCosto').value) || 0;
    const conversionDiv = document.getElementById('conversionHotel');
    
    if (costo > 0 && moneda !== 'MXN') {
        const costoMXN = convertirAMXN(costo, moneda);
        conversionDiv.innerHTML = `≈ $${costoMXN.toLocaleString()} MXN`;
    } else {
        conversionDiv.innerHTML = '';
    }
};

window.calcularConversionTransporte = function() {
    const moneda = document.getElementById('transporteMoneda').value;
    const costo = parseFloat(document.getElementById('transporteCosto').value) || 0;
    const conversionDiv = document.getElementById('conversionTransporte');
    
    if (costo > 0 && moneda !== 'MXN') {
        const costoMXN = convertirAMXN(costo, moneda);
        conversionDiv.innerHTML = `≈ $${costoMXN.toLocaleString()} MXN`;
    } else {
        conversionDiv.innerHTML = '';
    }
};

window.calcularConversionActividad = function() {
    const moneda = document.getElementById('actividadMoneda').value;
    const costo = parseFloat(document.getElementById('actividadCosto').value) || 0;
    const conversionDiv = document.getElementById('conversionActividad');
    
    if (costo > 0 && moneda !== 'MXN') {
        const costoMXN = convertirAMXN(costo, moneda);
        conversionDiv.innerHTML = `≈ $${costoMXN.toLocaleString()} MXN por persona<br>Total 4 personas: $${(costoMXN * 4).toLocaleString()} MXN`;
    } else {
        conversionDiv.innerHTML = '';
    }
};

// Funciones para editar elementos desde las vistas
window.editHotelInEstancia = function(estanciaIndex, hotelIndex) {
    openHotelModal(estanciaIndex, hotelIndex);
};

window.editTransporteInEstancia = function(estanciaIndex, transporteIndex) {
    openTransporteModal(estanciaIndex, transporteIndex);
};

window.editActividadInEstancia = function(estanciaIndex, actividadIndex) {
    openActividadModal(estanciaIndex, actividadIndex);
};

// Funciones para eliminar elementos
window.deleteHotelFromEstancia = function(estanciaIndex, hotelIndex) {
    if (confirm('¿Estás seguro de eliminar este hotel?')) {
        viajeData.estancias[estanciaIndex].hoteles.splice(hotelIndex, 1);
        saveData('viajeData', viajeData);
        renderApp();
    }
};

window.deleteTransporteFromEstancia = function(estanciaIndex, transporteIndex) {
    if (confirm('¿Estás seguro de eliminar este transporte?')) {
        viajeData.estancias[estanciaIndex].transportes.splice(transporteIndex, 1);
        saveData('viajeData', viajeData);
        renderApp();
    }
};

window.deleteActividadFromEstancia = function(estanciaIndex, actividadIndex) {
    if (confirm('¿Estás seguro de eliminar esta actividad?')) {
        viajeData.estancias[estanciaIndex].actividades.splice(actividadIndex, 1);
        saveData('viajeData', viajeData);
        renderApp();
    }
};

// Funciones de presupuesto
window.addIngreso = function() {
    openIngresoModal();
};

function openIngresoModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h3>💰 Agregar Dinero Disponible</h3>
            <form id="ingresoForm">
                <div class="form-group">
                    <label>Descripción:</label>
                    <input type="text" id="descripcion" placeholder="Ej: Ahorro para el viaje" required>
                </div>
                <div class="form-group">
                    <label>Monto (MXN):</label>
                    <input type="number" id="monto" placeholder="0" required>
                </div>
                <div class="form-buttons">
                    <button type="button" onclick="guardarIngreso()" class="btn-primary">💾 Guardar</button>
                    <button type="button" onclick="closeModal()" class="btn-secondary">❌ Cancelar</button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
}

window.guardarIngreso = function() {
    const ingreso = {
        id: Date.now().toString(),
        descripcion: document.getElementById('descripcion').value,
        monto: parseInt(document.getElementById('monto').value)
    };
    
    if (!viajeData.presupuesto.ingresos) {
        viajeData.presupuesto.ingresos = [];
    }
    
    viajeData.presupuesto.ingresos.push(ingreso);
    saveData('viajeData', viajeData);
    closeModal();
    renderApp();
};

window.deleteIngreso = function(id) {
    if (confirm('¿Eliminar este ingreso?')) {
        viajeData.presupuesto.ingresos = viajeData.presupuesto.ingresos.filter(i => i.id !== id);
        saveData('viajeData', viajeData);
        renderApp();
    }
};