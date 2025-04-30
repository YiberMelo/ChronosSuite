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
    
    // Event listeners
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
                    option.value = location.id;
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
            { 
                title: "Fecha y Hora", 
                field: "formattedTimestamp", 
                sorter: function(a, b, aRow, bRow) {
                    // Ordenar por el timestamp real
                    var aTimestamp = aRow.getData().timestamp;
                    var bTimestamp = bRow.getData().timestamp;
                    return aTimestamp > bTimestamp ? 1 : -1;
                }, 
                headerFilter: true 
            },
            { title: "Ubicación", field: "locationName", sorter: "string", headerFilter: true },
            {
                title: "Acciones",
                formatter: function(cell, formatterParams, onRendered) {
                    return `<div class="text-center">
                        <button class="btn btn-sm btn-info btn-view-visit" data-id="${cell.getRow().getData().id}">
                            <i class="bi bi-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-primary ms-1 btn-edit-visit" data-id="${cell.getRow().getData().id}">
                            <i class="bi bi-pencil-square"></i>
                        </button>
                        <button class="btn btn-sm btn-danger ms-1 btn-delete-visit" data-id="${cell.getRow().getData().id}">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>`;
                },
                headerSort: false,
                hozAlign: "center",
                width: 150
            }
        ],
        ajaxURL: "/VisitRecord/GetData",
        ajaxResponse: function(url, params, response) {
            // Procesamos los datos para mostrar correctamente
            return response;
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
        }
    });
    
    // Añadir estilo para las imágenes de los visitantes
    const style = document.createElement('style');
    style.innerHTML = `
        .visitor-photo {
            width: 40px;
            height: 40px;
            object-fit: cover;
            border-radius: 50%;
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
    document.getElementById('visitRecordId').value = '0';
    document.getElementById('visitorId').value = '';
    document.getElementById('locationId').value = '';
    document.getElementById('authorizedEmployeeId').value = '';
    document.getElementById('carriedObjects').value = '';
    document.getElementById('photoBase64').value = '';
    document.getElementById('photoPreview').src = '/images/user-placeholde.png';
    
    isEditing = false;
    
    // Mostrar el modal
    const modal = new bootstrap.Modal(document.getElementById('visitRecordModal'));
    modal.show();
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
                
                // Mostrar la foto si existe
                if (visitRecord.photoBase64) {
                    document.getElementById('photoPreview').src = `data:image/jpeg;base64,${visitRecord.photoBase64}`;
                    document.getElementById('photoBase64').value = visitRecord.photoBase64;
                } else {
                    document.getElementById('photoPreview').src = '/images/user-placeholde.png';
                    document.getElementById('photoBase64').value = '';
                }
                
                isEditing = true;
                
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
                
                // Formatear la fecha y hora
                if (visitRecord.timestamp) {
                    const date = new Date(visitRecord.timestamp);
                    document.getElementById('detailsTimestamp').textContent = date.toLocaleString();
                } else {
                    document.getElementById('detailsTimestamp').textContent = 'No especificado';
                }
                
                document.getElementById('detailsLocation').textContent = visitRecord.locationName || 'No especificado';
                document.getElementById('detailsAuthorizedEmployee').textContent = visitRecord.authorizedEmployeeName || 'No especificado';
                document.getElementById('detailsUser').textContent = visitRecord.userName || 'No especificado';
                document.getElementById('detailsCarriedObjects').textContent = visitRecord.carriedObjects || 'No se registraron objetos';
                
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
    
    // Preparar datos para enviar
    const visitRecordData = {
        id: parseInt(visitRecordId) || 0,
        visitorId: parseInt(visitorId),
        locationId: locationId ? parseInt(locationId) : null,
        authorizedEmployeeId: authorizedEmployeeId ? parseInt(authorizedEmployeeId) : null,
        carriedObjects: carriedObjects || null,
        photoBase64: photoBase64 || null
    };
    
    // Determinar si es creación o actualización
    const isNew = visitRecordId === '0' || !visitRecordId;
    const url = isNew ? '/VisitRecord/Create' : '/VisitRecord/Update';
    
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
 * Evento para cargar la foto del visitante cuando se selecciona uno del dropdown
 */
document.getElementById('visitorId').addEventListener('change', function() {
    const visitorId = this.value;
    if (visitorId) {
        // Buscar el visitante seleccionado en el array de visitantes ya cargados
        const selectedVisitor = visitors.find(visitor => visitor.id == visitorId);
        if (selectedVisitor && selectedVisitor.photoBase64) {
            // Si tiene foto, mostrarla
            document.getElementById('photoPreview').src = `data:image/jpeg;base64,${selectedVisitor.photoBase64}`;
            document.getElementById('photoBase64').value = selectedVisitor.photoBase64;
        } else {
            // Si no tiene foto, mostrar la imagen predeterminada
            document.getElementById('photoPreview').src = '/images/user-placeholde.png';
            document.getElementById('photoBase64').value = '';
        }
    } else {
        // Si no hay visitante seleccionado, mostrar la imagen predeterminada
        document.getElementById('photoPreview').src = '/images/user-placeholde.png';
        document.getElementById('photoBase64').value = '';
    }
});