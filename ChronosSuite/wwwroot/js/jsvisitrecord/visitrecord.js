/**
 * Script para manejar la tabla de registros de visitas utilizando Tabulator
 * Este archivo contiene todas las funciones necesarias para la gestión CRUD de registros de visitas
 * Autor: ChronosSuite Team
 * Fecha: 30 de abril de 2025
 */

// Variables globales
let visitRecordsTable;
let isEditing = false;
let visitors = []; // Para almacenar los visitantes disponibles
let locations = []; // Para almacenar las ubicaciones disponibles
let employees = []; // Para almacenar los empleados disponibles
let stream = null; // Para la cámara web

// Inicialización cuando el documento está listo
document.addEventListener('DOMContentLoaded', function() {
    // Cargar los datos para los selectores
    loadVisitors();
    loadLocations();
    loadEmployees();
    
    // Inicializar la tabla de registros de visitas con Tabulator
    initVisitRecordsTable();
    
    // Event listeners para elementos principales
    document.getElementById('quickFilter').addEventListener('keyup', filterTable);
    document.getElementById('btnAddVisitRecord').addEventListener('click', openCreateVisitRecordModal);
    document.getElementById('btnSaveVisitRecord').addEventListener('click', saveVisitRecord);
    document.getElementById('btnStartCamera').addEventListener('click', startCamera);
    document.getElementById('btnCapturePhoto').addEventListener('click', capturePhoto);
    document.getElementById('btnUploadPhoto').addEventListener('click', function() {
        document.getElementById('photoUpload').click();
    });
    document.getElementById('photoUpload').addEventListener('change', handlePhotoUpload);
    document.getElementById('btnEditFromDetails').addEventListener('click', openEditFromDetails);
    
    // Event listeners para nuevas funcionalidades
    document.getElementById('isImmediateVisit').addEventListener('change', toggleEntryTimeField);
    document.getElementById('btnRegisterExit').addEventListener('click', registerExitFromDetails);
    document.getElementById('btnToggleReport').addEventListener('click', toggleReportFromDetails);
    document.getElementById('visitorId').addEventListener('change', updateVisitorPreview);
    document.getElementById('btnQuickAddVisitor').addEventListener('click', showQuickAddVisitorModal);
    document.getElementById('visitPurpose').addEventListener('change', toggleOtherPurposeField);
    document.getElementById('useVisitorPhoto').addEventListener('change', toggleVisitorPhotoUsage);
    
    // Cerrar la transmisión de la cámara cuando se cierra el modal
    document.getElementById('visitRecordModal').addEventListener('hidden.bs.modal', stopCamera);
});

/**
 * Carga los visitantes desde el servidor para el selector
 */
function loadVisitors() {
    fetch('/Visitor/GetData')
        .then(response => {
            if (!response.ok) {
                throw new Error('Error en la solicitud: ' + response.status);
            }
            return response.json();
        })
        .then(data => {
            visitors = data;
            const visitorSelect = document.getElementById('visitorId');
            visitorSelect.innerHTML = '<option value="">Seleccione un visitante</option>';
            
            visitors.forEach(visitor => {
                const option = document.createElement('option');
                option.value = visitor.id;
                option.textContent = `${visitor.firstName} ${visitor.lastName} - ${visitor.identification}`;
                visitorSelect.appendChild(option);
            });
        })
        .catch(error => {
            console.error('Error al cargar los visitantes:', error);
            showNotification('Error al cargar datos de visitantes. Por favor, intente de nuevo.', 'error');
        });
}

/**
 * Carga las ubicaciones desde el servidor para el selector
 */
function loadLocations() {
    fetch('/Location/GetAll')
        .then(response => {
            if (!response.ok) {
                throw new Error('Error en la solicitud: ' + response.status);
            }
            return response.json();
        })
        .then(response => {
            if (response.success) {
                locations = response.data;
                const locationSelect = document.getElementById('locationId');
                locationSelect.innerHTML = '<option value="">Seleccione una ubicación</option>';
                
                locations.forEach(location => {
                    const option = document.createElement('option');
                    option.value = location.id
                    option.textContent = location.name;
                    locationSelect.appendChild(option);
                });
            } else {
                showNotification('Error: ' + response.message, 'error');
            }
        })
        .catch(error => {
            console.error('Error al cargar las ubicaciones:', error);
            showNotification('Error al cargar datos de ubicaciones. Por favor, intente de nuevo.', 'error');
        });
}

/**
 * Carga los empleados desde el servidor para el selector
 */
function loadEmployees() {
    fetch('/Employee/GetData')
        .then(response => {
            if (!response.ok) {
                throw new Error('Error en la solicitud: ' + response.status);
            }
            return response.json();
        })
        .then(data => {
            employees = data;
            const employeeSelect = document.getElementById('authorizedEmployeeId');
            employeeSelect.innerHTML = '<option value="">Seleccione un empleado</option>';
            
            employees.forEach(employee => {
                const option = document.createElement('option');
                option.value = employee.id;
                option.textContent = `${employee.firstName} ${employee.lastName} - ${employee.position || 'Sin cargo'}`;
                employeeSelect.appendChild(option);
            });
        })
        .catch(error => {
            console.error('Error al cargar los empleados:', error);
            showNotification('Error al cargar datos de empleados. Por favor, intente de nuevo.', 'error');
        });
}

/**
 * Inicializa la tabla Tabulator para mostrar registros de visitas
 */
function initVisitRecordsTable() {
    visitRecordsTable = new Tabulator("#visitRecordsTable", {
        height: "450px",
        layout: "fitColumns",
        responsiveLayout: "collapse",
        pagination: true,
        paginationSize: 10,
        paginationSizeSelector: [5, 10, 20, 50],
        movableColumns: true,
        resizableRows: true,
        initialSort: [
            { column: "timestamp", dir: "desc" }
        ],
        columns: [
            { 
                title: "Foto", 
                field: "photoBase64", 
                formatter: function(cell, formatterParams, onRendered) {
                    const value = cell.getValue();
                    if (value) {
                        return `<img src="data:image/jpeg;base64,${value}" class="visitor-photo" alt="Foto de visitante" />`;
                    } else {
                        return `<img src="/images/user-placeholde.png" class="visitor-photo" alt="Sin foto" />`;
                    }
                },
                headerSort: false,
                width: 80
            },
            { title: "Visitante", field: "visitorName", sorter: "string", headerFilter: true },
            { title: "Identificación", field: "visitorIdentification", sorter: "string", headerFilter: true },
            { title: "Ubicación", field: "locationName", sorter: "string", headerFilter: true },
            { 
                title: "Entrada", 
                field: "formattedEntryTime", 
                sorter: "datetime", 
                headerFilter: true,
                formatter: function(cell) {
                    const value = cell.getValue();
                    if (value) {
                        // Resaltar la fecha y hora para mejor visibilidad
                        return `<span class="badge bg-light text-dark">${value}</span>`;
                    }
                    return "<span class='text-muted'>No registrada</span>";
                }
            },
            { 
                title: "Salida", 
                field: "formattedExitTime", 
                sorter: "datetime", 
                headerFilter: true,
                formatter: function(cell) {
                    const value = cell.getValue();
                    if (value) {
                        // Resaltar la fecha y hora para mejor visibilidad
                        return `<span class="badge bg-light text-dark">${value}</span>`;
                    }
                    return "<span class='text-muted'>No registrada</span>";
                }
            },
            { 
                title: "Estado", 
                field: "hasEntered", 
                formatter: function(cell) {
                    const row = cell.getRow().getData();
                    let html = '';
                    
                    if (row.hasEntered && !row.hasExited) {
                        html = '<span class="badge bg-success">En visita</span>';
                    } else if (row.hasEntered && row.hasExited) {
                        html = '<span class="badge bg-secondary">Completada</span>';
                    } else {
                        html = '<span class="badge bg-info">Programada</span>';
                    }
                    
                    if (row.reportFlag) {
                        html += ' <span class="badge bg-warning"><i class="bi bi-flag-fill"></i></span>';
                    }
                    
                    return html;
                },
                headerFilter: "select",
                headerFilterParams: {
                    values: {
                        "": "Todos",
                        "true": "En visita/Completadas",
                        "false": "Programadas"
                    }
                },
                width: 140,
                hozAlign: "center"
            },
            {
                title: "Acciones",
                formatter: function(cell, formatterParams, onRendered) {
                    const rowData = cell.getRow().getData();
                    let buttons = `<div class="action-buttons">`;
                    
                    // Botón Ver detalles
                    buttons += `<button class="btn btn-sm btn-icon btn-info btn-view-visit" data-id="${rowData.id}" data-bs-toggle="tooltip" title="Ver detalles">
                        <i class="bi bi-eye"></i>
                    </button>`;
                    
                    // Botón de entrada (solo si no ha entrado todavía)
                    if (!rowData.hasEntered) {
                        buttons += `<button class="btn btn-sm btn-icon btn-success btn-entry" data-id="${rowData.id}" data-bs-toggle="tooltip" title="Registrar entrada">
                            <i class="bi bi-box-arrow-in-right"></i>
                        </button>`;
                    }
                    
                    // Botón de salida (solo si tiene entrada pero no salida)
                    if (rowData.hasEntered && !rowData.hasExited) {
                        buttons += `<button class="btn btn-sm btn-icon btn-danger btn-exit" data-id="${rowData.id}" data-bs-toggle="tooltip" title="Registrar salida">
                            <i class="bi bi-box-arrow-right"></i>
                        </button>`;
                    }
                    
                    // Botón para marcar/desmarcar reporte
                    const reportIconClass = rowData.reportFlag ? "bi-flag-fill" : "bi-flag";
                    const reportBtnClass = rowData.reportFlag ? "btn-warning" : "btn-outline-warning";
                    buttons += `<button class="btn btn-sm btn-icon ${reportBtnClass} btn-report" data-id="${rowData.id}" data-bs-toggle="tooltip" title="${rowData.reportFlag ? 'Quitar reporte' : 'Reportar'}">
                        <i class="bi ${reportIconClass}"></i>
                    </button>`;
                    
                    // Botones de editar y eliminar
                    buttons += `<button class="btn btn-sm btn-icon btn-primary btn-edit-visit" data-id="${rowData.id}" data-bs-toggle="tooltip" title="Editar registro">
                        <i class="bi bi-pencil-square"></i>
                    </button>
                    <button class="btn btn-sm btn-icon btn-outline-danger btn-delete-visit" data-id="${rowData.id}" data-bs-toggle="tooltip" title="Eliminar registro">
                        <i class="bi bi-trash"></i>
                    </button>`;
                    
                    buttons += `</div>`;
                    
                    // Inicializar tooltips después de renderizar
                    onRendered(function(){
                        // Iniciar tooltips en los botones
                        const tooltipTriggerList = cell.getElement().querySelectorAll('[data-bs-toggle="tooltip"]');
                        [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl, {
                            container: 'body',
                            trigger: 'hover',
                            placement: 'top'
                        }));
                    });
                    
                    return buttons;
                },
                headerSort: false,
                hozAlign: "center",
                width: 220
            }
        ],
        ajaxURL: "/VisitRecord/GetData",
        ajaxResponse: function(url, params, response) {
            return response;
        },
        rowClick: function(e, row) {
            // Al hacer clic en cualquier parte de la fila (excepto en los botones de acción)
            if (!e.target.closest('button')) {
                openViewVisitRecordModal(row.getData().id);
            }
        }
    });
    
    // Event listeners para los botones de acción en la tabla
    document.addEventListener('click', function(e) {
        if (e.target.closest('.btn-view-visit')) {
            const id = e.target.closest('.btn-view-visit').getAttribute('data-id');
            openViewVisitRecordModal(id);
        } else if (e.target.closest('.btn-edit-visit')) {
            const id = e.target.closest('.btn-edit-visit').getAttribute('data-id');
            openEditVisitRecordModal(id);
        } else if (e.target.closest('.btn-delete-visit')) {
            const id = e.target.closest('.btn-delete-visit').getAttribute('data-id');
            confirmDeleteVisitRecord(id);
        } else if (e.target.closest('.btn-entry')) {
            const id = e.target.closest('.btn-entry').getAttribute('data-id');
            registerEntry(id);
        } else if (e.target.closest('.btn-exit')) {
            const id = e.target.closest('.btn-exit').getAttribute('data-id');
            registerExit(id);
        } else if (e.target.closest('.btn-report')) {
            const id = e.target.closest('.btn-report').getAttribute('data-id');
            toggleReport(id);
        }
    });
    
    // Añadir estilos para las imágenes y botones
    const style = document.createElement('style');
    style.innerHTML = `
        .visitor-photo {
            width: 40px;
            height: 40px;
            object-fit: cover;
            border-radius: 50%;
        }
        .action-buttons {
            display: flex;
            justify-content: center;
            gap: 4px;
        }
        .btn-icon {
            padding: 0.25rem;
            width: 30px;
            height: 30px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            border-radius: 4px;
        }
        .btn-icon i {
            font-size: 14px;
        }
    `;
    document.head.appendChild(style);
}

/**
 * Filtra la tabla según el texto ingresado
 */
function filterTable() {
    const value = document.getElementById('quickFilter').value;
    visitRecordsTable.setFilter([
        [
            { field: "visitorName", type: "like", value: value },
            { field: "visitorIdentification", type: "like", value: value },
            { field: "formattedTimestamp", type: "like", value: value },
            { field: "locationName", type: "like", value: value }
        ]
    ]);
}

/**
 * Abre el modal para crear un nuevo registro de visita
 */
function openCreateVisitRecordModal() {
    document.getElementById('visitRecordModalLabel').textContent = 'Nuevo Registro de Visita';
    
    // Limpiar el formulario
    document.getElementById('visitRecordForm').reset();
    document.getElementById('visitRecordId').value = '0';
    document.getElementById('photoBase64').value = '';
    
    if (document.getElementById('photoPreview')) {
        document.getElementById('photoPreview').src = '/images/user-placeholde.png';
    }
    
    // Ocultar la vista previa del visitante
    const visitorPreviewContainer = document.getElementById('visitorPreviewContainer');
    if (visitorPreviewContainer) {
        visitorPreviewContainer.style.display = 'none';
    }
    
    // Establecer estado por defecto para el modal por pestañas
    const tabButton = document.querySelector('#visitTabs button[data-bs-target="#visitor-info"]');
    if (tabButton) {
        tabButton.click();
    }
    
    // Ocultar el contenedor de "otro motivo"
    const otherPurposeContainer = document.getElementById('otherPurposeContainer');
    if (otherPurposeContainer) {
        otherPurposeContainer.style.display = 'none';
    }
    
    // Configurar el modo de visita inmediata
    toggleEntryTimeField();
    
    isEditing = false;
    
    // Mostrar el modal
    const modalElement = document.getElementById('visitRecordModal');
    if (modalElement) {
        const modal = new bootstrap.Modal(modalElement);
        modal.show();
    } else {
        console.error('Error: No se encontró el elemento del modal');
        showNotification('Error al abrir el modal. Por favor, recargue la página e intente nuevamente.', 'error');
    }
}

/**
 * Abre el modal para editar un registro de visita existente
 * @param {string} id - ID del registro a editar
 */
function openEditVisitRecordModal(id) {
    fetch(`/VisitRecord/GetById?id=${id}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Error al obtener los datos del registro');
            }
            return response.json();
        })
        .then(response => {
            if (response.success) {
                const visitRecord = response.data;
                document.getElementById('visitRecordModalLabel').textContent = 'Editar Registro de Visita';
                document.getElementById('visitRecordId').value = visitRecord.id;
                document.getElementById('visitorId').value = visitRecord.visitorId || '';
                document.getElementById('locationId').value = visitRecord.locationId || '';
                document.getElementById('authorizedEmployeeId').value = visitRecord.authorizedEmployeeId || '';
                document.getElementById('carriedObjects').value = visitRecord.carriedObjects || '';
                
                // Manejar campos adicionales
                if (visitRecord.visitPurpose) {
                    document.getElementById('visitPurpose').value = visitRecord.visitPurpose;
                    if (visitRecord.visitPurpose === 'Otro') {
                        document.getElementById('otherPurposeContainer').style.display = 'block';
                        document.getElementById('otherPurpose').value = visitRecord.otherPurpose || '';
                    } else {
                        document.getElementById('otherPurposeContainer').style.display = 'none';
                    }
                } else {
                    document.getElementById('visitPurpose').value = '';
                    document.getElementById('otherPurposeContainer').style.display = 'none';
                }
                
                // Configurar entrada programada
                const hasEntryTime = visitRecord.entryTime !== null;
                document.getElementById('isImmediateVisit').checked = !hasEntryTime;
                toggleEntryTimeField();
                
                if (hasEntryTime) {
                    const entryDateTime = new Date(visitRecord.entryTime);
                    const formattedEntryTime = entryDateTime.toISOString().slice(0, 16);
                    document.getElementById('entryTime').value = formattedEntryTime;
                }
                
                if (visitRecord.exitTime) {
                    const exitDateTime = new Date(visitRecord.exitTime);
                    const formattedExitTime = exitDateTime.toISOString().slice(0, 16);
                    document.getElementById('exitTime').value = formattedExitTime;
                }
                
                // Actualizar la vista previa del visitante
                updateVisitorPreview();
                
                // Mostrar la foto si existe
                if (visitRecord.photoBase64) {
                    document.getElementById('photoPreview').src = `data:image/jpeg;base64,${visitRecord.photoBase64}`;
                    document.getElementById('photoBase64').value = visitRecord.photoBase64;
                } else {
                    document.getElementById('photoPreview').src = '/images/user-placeholde.png';
                    document.getElementById('photoBase64').value = '';
                }
                
                isEditing = true;
                
                // Establecer la primera pestaña como activa
                document.querySelector('#visitTabs button[data-bs-target="#visitor-info"]').click();
                
                // Mostrar el modal
                const modal = new bootstrap.Modal(document.getElementById('visitRecordModal'));
                modal.show();
            } else {
                showNotification('Error: ' + response.message, 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showNotification('Error al cargar la información del registro', 'error');
        });
}

/**
 * Abre el modal para ver los detalles de un registro de visita
 * @param {string} id - ID del registro a visualizar
 */
function openViewVisitRecordModal(id) {
    fetch(`/VisitRecord/GetById?id=${id}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Error al obtener los datos del registro');
            }
            return response.json();
        })
        .then(response => {
            if (response.success) {
                const visitRecord = response.data;
                
                // Llenar datos en el modal de detalles
                document.getElementById('detailsVisitorName').textContent = visitRecord.visitorName || 'No especificado';
                document.getElementById('detailsVisitorIdentification').textContent = visitRecord.visitorIdentification || '';
                
                // Formatear la fecha y hora del registro
                if (visitRecord.timestamp) {
                    const date = new Date(visitRecord.timestamp);
                    document.getElementById('detailsTimestamp').textContent = date.toLocaleString();
                } else {
                    document.getElementById('detailsTimestamp').textContent = 'No especificado';
                }
                
                // Mostrar información de ubicación y autorización
                document.getElementById('detailsLocation').textContent = visitRecord.locationName || 'No especificado';
                document.getElementById('detailsAuthorizedEmployee').textContent = visitRecord.authorizedEmployeeName || 'No especificado';
                document.getElementById('detailsUser').textContent = visitRecord.userName || 'No especificado';
                document.getElementById('detailsCarriedObjects').textContent = visitRecord.carriedObjects || 'No se registraron objetos';
                
                // Mostrar propósito de la visita
                document.getElementById('detailsVisitPurpose').textContent = visitRecord.visitPurpose || 'No especificado';
                
                // Mostrar información de entrada y salida
                document.getElementById('detailsEntryTime').textContent = visitRecord.formattedEntryTime || 'No registrado';
                document.getElementById('detailsExitTime').textContent = visitRecord.formattedExitTime || 'No registrado';
                
                // Calcular duración si hay entrada y salida
                if (visitRecord.entryTime && visitRecord.exitTime) {
                    const entryTime = new Date(visitRecord.entryTime);
                    const exitTime = new Date(visitRecord.exitTime);
                    const duration = Math.floor((exitTime - entryTime) / (1000 * 60)); // minutos
                    
                    let durationText = '';
                    if (duration < 60) {
                        durationText = `${duration} minutos`;
                    } else {
                        const hours = Math.floor(duration / 60);
                        const mins = duration % 60;
                        durationText = `${hours} horas ${mins} minutos`;
                    }
                    
                    document.getElementById('detailsDuration').textContent = durationText;
                } else {
                    document.getElementById('detailsDuration').textContent = 'No calculable';
                }
                
                // Configurar los badges de estado
                document.getElementById('detailsEntryBadge').style.display = visitRecord.hasEntered ? 'inline-block' : 'none';
                document.getElementById('detailsExitBadge').style.display = visitRecord.hasExited ? 'inline-block' : 'none';
                document.getElementById('detailsReportBadge').style.display = visitRecord.reportFlag ? 'inline-block' : 'none';
                
                // Configurar el botón de registrar entrada/salida
                const btnRegisterEntry = document.getElementById('btnRegisterEntry');
                const btnRegisterExit = document.getElementById('btnRegisterExit');
                const activeVisitActions = document.getElementById('activeVisitActions');
                const btnConfirmExit = document.getElementById('btnConfirmExit');
                
                // Configurar botones según el estado
                if (btnRegisterEntry) {
                    btnRegisterEntry.setAttribute('data-id', visitRecord.id);
                    btnRegisterEntry.style.display = !visitRecord.hasEntered ? 'inline-block' : 'none';
                }
                
                if (btnRegisterExit) {
                    btnRegisterExit.setAttribute('data-id', visitRecord.id);
                    btnRegisterExit.style.display = (visitRecord.hasEntered && !visitRecord.hasExited) ? 'inline-block' : 'none';
                }
                
                // Configurar la sección de visita activa y el botón de confirmar salida
                if (visitRecord.hasEntered && !visitRecord.hasExited) {
                    activeVisitActions.style.display = 'block';
                    btnConfirmExit.setAttribute('data-id', visitRecord.id);
                    btnConfirmExit.addEventListener('click', function() {
                        registerExitFromDetails();
                    });
                } else {
                    activeVisitActions.style.display = 'none';
                }
                
                // Configurar el botón de reporte
                const btnToggleReport = document.getElementById('btnToggleReport');
                btnToggleReport.setAttribute('data-id', visitRecord.id);
                document.getElementById('btnReportText').textContent = visitRecord.reportFlag ? 
                    'Desmarcar de Reporte' : 'Marcar para Reporte';
                
                // Mostrar la foto si existe
                if (visitRecord.photoBase64) {
                    document.getElementById('detailsPhoto').src = `data:image/jpeg;base64,${visitRecord.photoBase64}`;
                } else {
                    document.getElementById('detailsPhoto').src = '/images/user-placeholde.png';
                }
                
                // Para abrir el modal de edición desde el de detalles
                document.getElementById('btnEditFromDetails').setAttribute('data-id', visitRecord.id);
                
                // Mostrar el modal
                const modal = new bootstrap.Modal(document.getElementById('visitRecordDetailsModal'));
                modal.show();
            } else {
                showNotification('Error: ' + response.message, 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showNotification('Error al cargar la información del registro', 'error');
        });
}

/**
 * Abre el modal de edición desde el modal de detalles
 */
function openEditFromDetails() {
    const id = document.getElementById('btnEditFromDetails').getAttribute('data-id');
    // Cerrar el modal de detalles
    bootstrap.Modal.getInstance(document.getElementById('visitRecordDetailsModal')).hide();
    // Abrir el modal de edición
    openEditVisitRecordModal(id);
}

/**
 * Actualiza la vista previa del visitante seleccionado
 */
function updateVisitorPreview() {
    const visitorId = document.getElementById('visitorId').value;
    const previewContainer = document.getElementById('visitorPreviewContainer');
    
    if (visitorId) {
        // Buscar el visitante seleccionado en el array de visitantes ya cargados
        const selectedVisitor = visitors.find(visitor => visitor.id == visitorId);
        if (selectedVisitor) {
            // Mostrar los datos del visitante
            document.getElementById('selectedVisitorName').textContent = `${selectedVisitor.firstName} ${selectedVisitor.lastName}`;
            document.getElementById('selectedVisitorId').textContent = selectedVisitor.identification;
            
            // Mostrar la foto si existe
            if (selectedVisitor.photoBase64) {
                document.getElementById('selectedVisitorPhoto').src = `data:image/jpeg;base64,${selectedVisitor.photoBase64}`;
                
                // Si está marcada la opción de usar la foto del visitante, actualizamos la foto del registro
                if (document.getElementById('useVisitorPhoto').checked) {
                    document.getElementById('photoPreview').src = `data:image/jpeg;base64,${selectedVisitor.photoBase64}`;
                    document.getElementById('photoBase64').value = selectedVisitor.photoBase64;
                }
            } else {
                document.getElementById('selectedVisitorPhoto').src = '/images/user-placeholde.png';
            }
            
            // Mostrar el contenedor de vista previa
            previewContainer.style.display = 'block';
        } else {
            previewContainer.style.display = 'none';
        }
    } else {
        previewContainer.style.display = 'none';
    }
}

/**
 * Muestra u oculta el campo de hora de entrada programada según el estado del switch de visita inmediata
 */
function toggleEntryTimeField() {
    const isImmediateVisit = document.getElementById('isImmediateVisit').checked;
    const scheduledEntryContainer = document.getElementById('scheduledEntryContainer');
    
    if (isImmediateVisit) {
        scheduledEntryContainer.style.display = 'none';
    } else {
        scheduledEntryContainer.style.display = 'flex';
    }
}

/**
 * Muestra u oculta el campo de otro propósito cuando se selecciona "Otro" en el motivo de visita
 */
function toggleOtherPurposeField() {
    const visitPurpose = document.getElementById('visitPurpose').value;
    const otherPurposeContainer = document.getElementById('otherPurposeContainer');
    
    if (visitPurpose === 'Otro') {
        otherPurposeContainer.style.display = 'block';
    } else {
        otherPurposeContainer.style.display = 'none';
    }
}

/**
 * Controla si se usa la foto del perfil del visitante o una nueva foto
 */
function toggleVisitorPhotoUsage() {
    const useVisitorPhoto = document.getElementById('useVisitorPhoto').checked;
    const visitorId = document.getElementById('visitorId').value;
    
    if (useVisitorPhoto && visitorId) {
        // Buscar el visitante seleccionado
        const selectedVisitor = visitors.find(visitor => visitor.id == visitorId);
        if (selectedVisitor && selectedVisitor.photoBase64) {
            // Usar la foto del visitante
            document.getElementById('photoPreview').src = `data:image/jpeg;base64,${selectedVisitor.photoBase64}`;
            document.getElementById('photoBase64').value = selectedVisitor.photoBase64;
        }
    }
}

/**
 * Muestra un modal rápido para añadir un nuevo visitante
 */
function showQuickAddVisitorModal() {
    Swal.fire({
        title: 'Añadir Visitante Rápido',
        html: `
            <form id="quickVisitorForm" class="text-start">
                <div class="mb-3">
                    <label class="form-label">Nombre <span class="text-danger">*</span></label>
                    <input id="quickFirstName" class="swal2-input" placeholder="Nombre">
                </div>
                <div class="mb-3">
                    <label class="form-label">Apellidos <span class="text-danger">*</span></label>
                    <input id="quickLastName" class="swal2-input" placeholder="Apellidos">
                </div>
                <div class="mb-3">
                    <label class="form-label">Identificación <span class="text-danger">*</span></label>
                    <input id="quickIdentification" class="swal2-input" placeholder="Número de identificación">
                </div>
                <div class="mb-3">
                    <label class="form-label">Teléfono</label>
                    <input id="quickPhone" class="swal2-input" placeholder="Teléfono">
                </div>
            </form>
        `,
        showCancelButton: true,
        confirmButtonText: 'Guardar',
        cancelButtonText: 'Cancelar',
        focusConfirm: false,
        preConfirm: () => {
            const firstName = document.getElementById('quickFirstName').value;
            const lastName = document.getElementById('quickLastName').value;
            const identification = document.getElementById('quickIdentification').value;
            
            if (!firstName || !lastName || !identification) {
                Swal.showValidationMessage('Por favor, complete los campos obligatorios');
                return false;
            }
            
            return {
                firstName,
                lastName,
                identification,
                phoneNumber: document.getElementById('quickPhone').value
            };
        }
    }).then((result) => {
        if (result.isConfirmed) {
            // Enviar datos para crear el visitante
            fetch('/Visitor/QuickCreate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(result.value)
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Error en la solicitud');
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    showNotification('Visitante creado con éxito', 'success');
                    
                    // Recargar lista de visitantes y seleccionar el nuevo
                    loadVisitors().then(() => {
                        if (data.id) {
                            document.getElementById('visitorId').value = data.id;
                            updateVisitorPreview();
                        }
                    });
                } else {
                    showNotification('Error: ' + data.message, 'error');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showNotification('Error al crear el visitante', 'error');
            });
        }
    });
}

/**
 * Inicia la cámara para tomar una foto
 */
function startCamera() {
    const camera = document.getElementById('camera');
    const photoPreview = document.getElementById('photoPreview');
    const btnStartCamera = document.getElementById('btnStartCamera');
    const btnCapturePhoto = document.getElementById('btnCapturePhoto');
    
    // Ocultar la vista previa y mostrar la cámara
    photoPreview.classList.add('d-none');
    camera.classList.remove('d-none');
    btnStartCamera.classList.add('d-none');
    btnCapturePhoto.classList.remove('d-none');
    
    // Iniciar la cámara
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: true })
            .then(function(videoStream) {
                stream = videoStream;
                camera.srcObject = stream;
                camera.play();
            })
            .catch(function(error) {
                console.error('Error al acceder a la cámara:', error);
                showNotification('Error al acceder a la cámara. Por favor, verifique los permisos.', 'error');
                stopCamera();
            });
    } else {
        showNotification('Su navegador no soporta acceso a la cámara.', 'error');
        stopCamera();
    }
}

/**
 * Detiene la transmisión de la cámara
 */
function stopCamera() {
    const camera = document.getElementById('camera');
    const photoPreview = document.getElementById('photoPreview');
    const btnStartCamera = document.getElementById('btnStartCamera');
    const btnCapturePhoto = document.getElementById('btnCapturePhoto');
    const photoCanvas = document.getElementById('photoCanvas');
    
    // Detener la transmisión si existe
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
    }
    
    // Restablecer la interfaz
    camera.classList.add('d-none');
    photoCanvas.classList.add('d-none');
    photoPreview.classList.remove('d-none');
    btnCapturePhoto.classList.add('d-none');
    btnStartCamera.classList.remove('d-none');
}

/**
 * Captura una foto de la cámara
 */
function capturePhoto() {
    const camera = document.getElementById('camera');
    const photoCanvas = document.getElementById('photoCanvas');
    const photoPreview = document.getElementById('photoPreview');
    const photoBase64 = document.getElementById('photoBase64');
    
    // Tomar la foto
    const context = photoCanvas.getContext('2d');
    photoCanvas.width = camera.videoWidth;
    photoCanvas.height = camera.videoHeight;
    context.drawImage(camera, 0, 0, photoCanvas.width, photoCanvas.height);
    
    // Convertir a base64 y guardar en el campo oculto
    const dataURL = photoCanvas.toDataURL('image/jpeg');
    photoBase64.value = dataURL.split(',')[1]; // Guardar sin el prefijo
    
    // Mostrar la vista previa
    photoPreview.src = dataURL;
    photoPreview.classList.remove('d-none');
    photoCanvas.classList.add('d-none');
    camera.classList.add('d-none');
    
    // Detener la cámara
    stopCamera();
}

/**
 * Maneja la carga de una imagen desde el dispositivo
 */
function handlePhotoUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('photoPreview').src = e.target.result;
            document.getElementById('photoBase64').value = e.target.result.split(',')[1];
        };
        reader.readAsDataURL(file);
    }
}

/**
 * Guarda un registro de visita (crear o actualizar)
 */
function saveVisitRecord() {
    // Validar el formulario
    const visitRecordForm = document.getElementById('visitRecordForm');
    if (!visitRecordForm.checkValidity()) {
        visitRecordForm.reportValidity();
        return;
    }
    
    // Recopilar datos del formulario
    const visitRecordId = document.getElementById('visitRecordId').value;
    const visitorId = document.getElementById('visitorId').value;
    const locationId = document.getElementById('locationId').value;
    const authorizedEmployeeId = document.getElementById('authorizedEmployeeId').value;
    const carriedObjects = document.getElementById('carriedObjects').value.trim();
    const photoBase64 = document.getElementById('photoBase64').value;
    const visitPurpose = document.getElementById('visitPurpose').value;
    
    // Determinar si es un registro nuevo o una edición
    const isNew = visitRecordId === '0' || !visitRecordId;
    
    // Datos específicos de control de entrada/salida
    const isImmediateVisit = document.getElementById('isImmediateVisit').checked;
    const entryTimeElement = document.getElementById('entryTime');
    const entryTime = entryTimeElement ? entryTimeElement.value : null;
    
    // Capturar la hora de salida
    const exitTimeElement = document.getElementById('exitTime');
    const exitTime = exitTimeElement ? exitTimeElement.value : null;
    
    console.log("Valor del campo exitTime:", exitTime);
    
    // Preparar datos para enviar
    const visitRecordData = {
        id: parseInt(visitRecordId) || 0,
        visitorId: parseInt(visitorId),
        locationId: locationId ? parseInt(locationId) : null,
        authorizedEmployeeId: authorizedEmployeeId ? parseInt(authorizedEmployeeId) : null,
        carriedObjects: carriedObjects || null,
        photoBase64: photoBase64 || null,
        visitPurpose: visitPurpose || null,
        exitTime: exitTime || null // Asegurarse de que exitTime se incluya en los datos
    };

    // Si es visita inmediata, marcamos hasEntered como true y no enviamos entryTime 
    // para que el controlador use DateTime.Now automáticamente
    if (isImmediateVisit) {
        visitRecordData.isImmediateVisit = true;
        visitRecordData.hasEntered = true;
        // No enviamos entryTime, dejamos que el servidor use DateTime.Now
    } 
    // Si no es inmediata pero hay un valor de fecha programada, lo enviamos
    else if (entryTime) {
        visitRecordData.isImmediateVisit = false;
        visitRecordData.entryTime = entryTime;
        visitRecordData.hasEntered = false; // No ha entrado todavía, está programada
    }
    
    console.log("Tipo de visita:", isImmediateVisit ? "Inmediata" : "Programada");
    console.log("Datos completos a enviar:", visitRecordData);
    
    // Si estamos editando, verificar si hay datos de entrada/salida anteriores
    if (!isNew) {
        fetch(`/VisitRecord/GetById?id=${visitRecordId}`)
            .then(response => response.json())
            .then(response => {
                if (response.success) {
                    const existingRecord = response.data;
                    
                    // Si ya tenía registrada una entrada y no estamos en modo inmediato,
                    // mantenemos los datos de entrada existentes
                    if (existingRecord.hasEntered && !isImmediateVisit && !entryTime) {
                        visitRecordData.entryTime = existingRecord.entryTime;
                        visitRecordData.hasEntered = true;
                    }
                    
                    // Siempre preservamos los datos de salida si existen
                    if (existingRecord.hasExited) {
                        visitRecordData.exitTime = existingRecord.exitTime;
                        visitRecordData.hasExited = true;
                    }
                    
                    // Ahora enviamos los datos al servidor
                    sendSaveRequest(visitRecordData, isNew);
                }
            })
            .catch(error => {
                console.error("Error al obtener datos previos:", error);
                // Si falla la obtención de datos previos, enviar los actuales
                sendSaveRequest(visitRecordData, isNew);
            });
    } else {
        // Si es un registro nuevo, enviar directamente
        sendSaveRequest(visitRecordData, isNew);
    }
}

/**
 * Envía la petición para guardar el registro de visita
 * @param {Object} visitRecordData - Datos del registro a guardar
 * @param {boolean} isNew - Indica si es un registro nuevo o una actualización
 */
function sendSaveRequest(visitRecordData, isNew) {
    // Determinar la URL según si es creación o actualización
    const url = isNew ? '/VisitRecord/Create' : '/VisitRecord/Update';
    
    // Registrar los datos que se envían para depuración
    console.log("Enviando datos de registro:", JSON.stringify(visitRecordData));
    
    // Enviar petición al servidor
    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(visitRecordData)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Error en la solicitud: ' + response.status);
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            // Cerrar el modal
            bootstrap.Modal.getInstance(document.getElementById('visitRecordModal')).hide();
            
            // Mostrar mensaje de éxito
            showNotification(isNew ? 'Registro de visita creado con éxito.' : 'Registro de visita actualizado con éxito.', 'success');
            
            // Recargar la tabla
            visitRecordsTable.setData('/VisitRecord/GetData');
        } else {
            showNotification('Error: ' + data.message, 'error');
        }
    })
    .catch(error => {
        console.error('Error al guardar el registro:', error);
        showNotification('Error al guardar los datos. Por favor, intente de nuevo.', 'error');
    });
}

/**
 * Confirma la eliminación de un registro de visita
 * @param {string} id - ID del registro a eliminar
 */
function confirmDeleteVisitRecord(id) {
    Swal.fire({
        title: '¿Está seguro?',
        text: '¿Desea eliminar este registro de visita? Esta acción no se puede deshacer.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            deleteVisitRecord(id);
        }
    });
}

/**
 * Elimina un registro de visita
 * @param {string} id - ID del registro a eliminar
 */
function deleteVisitRecord(id) {
    fetch(`/VisitRecord/Delete?id=${id}`, {
        method: 'DELETE'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Error en la solicitud: ' + response.status);
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            showNotification('Registro de visita eliminado con éxito.', 'success');
            visitRecordsTable.setData('/VisitRecord/GetData');
        } else {
            showNotification('Error: ' + data.message, 'error');
        }
    })
    .catch(error => {
        console.error('Error al eliminar el registro:', error);
        showNotification('Error al eliminar los datos. Por favor, intente de nuevo.', 'error');
    });
}

/**
 * Muestra notificaciones al usuario usando SweetAlert2
 * @param {string} message - Mensaje a mostrar
 * @param {string} type - Tipo de notificación (success, error, warning, info)
 */
function showNotification(message, type) {
    Swal.fire({
        title: type === 'error' ? 'Error' : type === 'warning' ? 'Advertencia' : 'Éxito',
        text: message,
        icon: type,
        confirmButtonColor: '#43a047',
        confirmButtonText: 'Aceptar'
    });
}

/**
 * Registra la entrada de un visitante
 * @param {string} id - El ID del registro de visita
 */
function registerEntry(id) {
    showLoadingOverlay('Registrando entrada...');
    
    fetch(`/VisitRecord/RegisterEntry/${id}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        hideLoadingOverlay();
        // Procesar la respuesta JSON con manejo de errores
        return response.json().catch(e => {
            console.error("Error parsing JSON response:", e);
            return { success: false, message: "Error al procesar la respuesta del servidor" };
        });
    })
    .then(data => {
        if (data && data.success !== false) {
            Swal.fire({
                title: 'Entrada registrada',
                text: 'La entrada ha sido registrada correctamente',
                icon: 'success',
                timer: 1500,
                showConfirmButton: false
            });
            
            // Refrescar la tabla
            visitRecordsTable.refreshData();
        } else {
            // Mostrar mensaje de error específico si lo hay
            const errorMsg = data && data.message ? data.message : 'Error al registrar entrada';
            console.error('Error al registrar entrada:', errorMsg);
            Swal.fire({
                title: 'Error',
                text: `Ha ocurrido un error: ${errorMsg}`,
                icon: 'error',
                confirmButtonColor: '#d33'
            });
            
            // Actualizar de todos modos, ya que podría haberse realizado el registro
            visitRecordsTable.refreshData();
        }
    })
    .catch(error => {
        hideLoadingOverlay();
        console.error('Error:', error);
        
        // En caso de error de red, verificar si el registro se realizó de todas formas
        Swal.fire({
            title: 'Advertencia',
            text: 'No se pudo confirmar si la entrada se registró correctamente. Verificando...',
            icon: 'warning',
            confirmButtonColor: '#ff9800',
            showConfirmButton: false,
            timer: 2000
        }).then(() => {
            // Refrescar la tabla para verificar el estado actual
            visitRecordsTable.refreshData();
        });
    });
}

/**
 * Registra la salida de un visitante desde la tabla
 * @param {string} id - El ID del registro de visita
 */
function registerExit(id) {
    Swal.fire({
        title: '¿Registrar salida?',
        text: '¿Desea registrar la salida de este visitante ahora?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sí, registrar salida',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6'
    }).then((result) => {
        if (result.isConfirmed) {
            showLoadingOverlay('Registrando salida...');
            
            fetch(`/VisitRecord/RegisterExit/${id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            .then(response => {
                hideLoadingOverlay();
                // Siempre verificamos si la respuesta es exitosa en formato
                return response.json().catch(e => {
                    console.error("Error parsing JSON response:", e);
                    return { success: false, message: "Error al procesar la respuesta del servidor" };
                });
            })
            .then(data => {
                // Verificar si la operación fue exitosa en el backend, independientemente de la respuesta HTTP
                if (data && (data.success === true || (data.hasExited === true || data.exitTime))) {
                    // Mostrar mensaje de éxito
                    Swal.fire({
                        title: '¡Salida registrada!',
                        text: 'La salida se ha registrado correctamente en la base de datos.',
                        icon: 'success',
                        confirmButtonColor: '#43a047',
                        timer: 2000,
                        showConfirmButton: false
                    });
                    
                    // Actualizar la tabla para reflejar los cambios
                    visitRecordsTable.refreshData();
                } else {
                    // Mostrar mensaje de error solo si realmente falló la operación
                    const errorMsg = data && data.message ? data.message : 'Error al registrar salida';
                    console.error('Error en registro de salida:', errorMsg);
                    Swal.fire({
                        title: 'Error',
                        text: `Ha ocurrido un error al registrar la salida: ${errorMsg}`,
                        icon: 'error',
                        confirmButtonColor: '#d33'
                    });
                    
                    // Recargar los datos de todos modos, ya que el cambio podría haberse realizado
                    visitRecordsTable.refreshData();
                }
            })
            .catch(error => {
                hideLoadingOverlay();
                console.error('Error:', error);
                // En caso de error de red, verificar si el cambio se realizó de todas formas
                Swal.fire({
                    title: 'Advertencia',
                    text: 'No se pudo confirmar si la salida se registró correctamente. Verificando...',
                    icon: 'warning',
                    confirmButtonColor: '#ff9800',
                    showConfirmButton: false,
                    timer: 2000
                }).then(() => {
                    // Recargar los datos para verificar si el cambio se realizó a pesar del error
                    visitRecordsTable.refreshData();
                });
            });
        }
    });
}

/**
 * Registra la salida de un visitante desde el modal de detalles
 */
function registerExitFromDetails() {
    const id = document.getElementById('btnRegisterExit').getAttribute('data-id');
    if (!id) {
        console.error('ID de registro no proporcionado');
        showNotification('Error: No se pudo identificar el registro', 'error');
        return;
    }
    
    Swal.fire({
        title: '¿Registrar salida?',
        text: '¿Desea registrar la salida de este visitante ahora?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sí, registrar salida',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6'
    }).then((result) => {
        if (result.isConfirmed) {
            showLoadingOverlay('Registrando salida...');
            
            fetch(`/VisitRecord/RegisterExit/${id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            .then(response => {
                hideLoadingOverlay();
                // Siempre verificamos si la respuesta es exitosa en formato
                return response.json().catch(e => {
                    console.error("Error parsing JSON response:", e);
                    return { success: false, message: "Error al procesar la respuesta del servidor" };
                });
            })
            .then(data => {
                // Verificar si la operación fue exitosa en el backend, independientemente de la respuesta HTTP
                if (data && (data.success === true || (data.hasExited === true || data.exitTime))) {
                    // Mostrar mensaje de éxito
                    Swal.fire({
                        title: '¡Salida registrada!',
                        text: 'La salida se ha registrado correctamente en la base de datos.',
                        icon: 'success',
                        confirmButtonColor: '#43a047',
                        timer: 2000,
                        showConfirmButton: false
                    });
                    
                    // Cerrar el modal de detalles
                    bootstrap.Modal.getInstance(document.getElementById('visitRecordDetailsModal')).hide();
                    
                    // Recargar la tabla
                    visitRecordsTable.refreshData();
                } else {
                    // Mostrar mensaje de error solo si realmente falló la operación
                    const errorMsg = data && data.message ? data.message : 'Error al registrar salida';
                    console.error('Error en registro de salida:', errorMsg);
                    Swal.fire({
                        title: 'Error',
                        text: `Ha ocurrido un error al registrar la salida: ${errorMsg}`,
                        icon: 'error',
                        confirmButtonColor: '#d33'
                    });
                    
                    // Recargar los datos de todos modos, ya que el cambio podría haberse realizado
                    visitRecordsTable.refreshData();
                }
            })
            .catch(error => {
                hideLoadingOverlay();
                console.error('Error:', error);
                // En caso de error de red, verificar si el cambio se realizó de todas formas
                Swal.fire({
                    title: 'Advertencia',
                    text: 'No se pudo confirmar si la salida se registró correctamente. Verificando...',
                    icon: 'warning',
                    confirmButtonColor: '#ff9800',
                    showConfirmButton: false,
                    timer: 2000
                }).then(() => {
                    // Recargar los datos para verificar si el cambio se realizó a pesar del error
                    visitRecordsTable.refreshData();
                });
            });
        }
    });
}

/**
 * Mostrar overlay de carga
 */
function showLoadingOverlay(message = 'Procesando...') {
    const overlayHtml = `
        <div id="loadingOverlay" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 9999; display: flex; justify-content: center; align-items: center;">
            <div class="card p-4 shadow-lg" style="width: 300px; border-radius: 10px;">
                <div class="text-center mb-3">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Cargando...</span>
                    </div>
                </div>
                <h5 class="text-center">${message}</h5>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', overlayHtml);
}

/**
 * Ocultar overlay de carga
 */
function hideLoadingOverlay() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.remove();
    }
}

/**
 * Alterna el estado de reporte de un registro
 * @param {number} id - ID del registro
 */
function toggleReport(id) {
    if (!id) {
        console.error('ID de registro no proporcionado');
        return;
    }
    
    // Mostrar overlay de carga
    showLoadingOverlay('Procesando estado de reporte...');
    
    fetch(`/VisitRecord/ToggleReport/${id}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        hideLoadingOverlay();
        // Procesar la respuesta JSON con manejo de errores
        return response.json().catch(e => {
            console.error("Error parsing JSON response:", e);
            return { success: false, message: "Error al procesar la respuesta del servidor" };
        });
    })
    .then(data => {
        if (data && data.success) {
            const actionText = data.reportFlag ? 'marcado para reporte' : 'desmarcado de reporte';
            
            Swal.fire({
                title: 'Estado actualizado',
                text: `El registro ha sido ${actionText} correctamente`,
                icon: 'success',
                timer: 1500,
                showConfirmButton: false
            });
            
            // Refrescar la tabla para mostrar los cambios
            visitRecordsTable.refreshData();
        } else {
            // Mostrar mensaje de error específico si lo hay
            const errorMsg = data && data.message ? data.message : 'Error al cambiar estado de reporte';
            console.error('Error al cambiar estado de reporte:', errorMsg);
            Swal.fire({
                title: 'Error',
                text: `Ha ocurrido un error: ${errorMsg}`,
                icon: 'error',
                confirmButtonColor: '#d33'
            });
            
            // Actualizar la tabla de todos modos
            visitRecordsTable.refreshData();
        }
    })
    .catch(error => {
        hideLoadingOverlay();
        console.error('Error:', error);
        
        // En caso de error de red, verificar si el cambio se realizó de todas formas
        Swal.fire({
            title: 'Advertencia',
            text: 'No se pudo confirmar si el estado de reporte se actualizó correctamente. Verificando...',
            icon: 'warning',
            confirmButtonColor: '#ff9800',
            showConfirmButton: false,
            timer: 2000
        }).then(() => {
            // Refrescar la tabla para verificar el estado actual
            visitRecordsTable.refreshData();
        });
    });
}

/**
 * Alterna el estado de reporte de un registro desde el modal de detalles
 */
function toggleReportFromDetails() {
    const id = document.getElementById('btnToggleReport').getAttribute('data-id');
    if (!id) {
        console.error('ID de registro no proporcionado');
        showNotification('Error: No se pudo identificar el registro', 'error');
        return;
    }
    
    // Mostrar overlay de carga
    showLoadingOverlay('Procesando estado de reporte...');
    
    fetch(`/VisitRecord/ToggleReport/${id}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        hideLoadingOverlay();
        // Procesar la respuesta JSON con manejo de errores
        return response.json().catch(e => {
            console.error("Error parsing JSON response:", e);
            return { success: false, message: "Error al procesar la respuesta del servidor" };
        });
    })
    .then(data => {
        if (data && data.success) {
            const actionText = data.reportFlag ? 'marcado para reporte' : 'desmarcado de reporte';
            
            Swal.fire({
                title: 'Estado actualizado',
                text: `El registro ha sido ${actionText} correctamente`,
                icon: 'success',
                timer: 1500,
                showConfirmButton: false
            });
            
            // Cerrar el modal de detalles
            bootstrap.Modal.getInstance(document.getElementById('visitRecordDetailsModal')).hide();
            
            // Refrescar la tabla para mostrar los cambios
            visitRecordsTable.refreshData();
        } else {
            // Mostrar mensaje de error específico si lo hay
            const errorMsg = data && data.message ? data.message : 'Error al cambiar estado de reporte';
            console.error('Error al cambiar estado de reporte:', errorMsg);
            Swal.fire({
                title: 'Error',
                text: `Ha ocurrido un error: ${errorMsg}`,
                icon: 'error',
                confirmButtonColor: '#d33'
            });
            
            // Actualizar la tabla de todos modos
            visitRecordsTable.refreshData();
        }
    })
    .catch(error => {
        hideLoadingOverlay();
        console.error('Error:', error);
        
        // En caso de error de red, verificar si el cambio se realizó de todas formas
        Swal.fire({
            title: 'Advertencia',
            text: 'No se pudo confirmar si el estado de reporte se actualizó correctamente. Verificando...',
            icon: 'warning',
            confirmButtonColor: '#ff9800',
            showConfirmButton: false,
            timer: 2000
        }).then(() => {
            // Cerrar el modal de detalles
            bootstrap.Modal.getInstance(document.getElementById('visitRecordDetailsModal')).hide();
            
            // Refrescar la tabla para verificar el estado actual
            visitRecordsTable.refreshData();
        });
    });
}