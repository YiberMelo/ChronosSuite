/**
 * Script para manejar la tabla de visitantes utilizando Tabulator
 * Este archivo contiene todas las funciones necesarias para la gestión CRUD de visitantes
 * Autor: ChronosSuite Team
 * Fecha: 30 de abril de 2025
 */

// Variables globales
let visitorsTable;
let isEditing = false;
let companies = []; // Para almacenar las empresas disponibles
let stream = null; // Para la cámara web

// Inicialización cuando el documento está listo
document.addEventListener('DOMContentLoaded', function() {
    // Cargar las compañías para el selector
    loadCompanies();
    
    // Inicializar la tabla de visitantes con Tabulator
    initVisitorsTable();
    
    // Event listeners
    document.getElementById('quickFilter').addEventListener('keyup', filterTable);
    document.getElementById('btnAddVisitor').addEventListener('click', openCreateVisitorModal);
    document.getElementById('btnSaveVisitor').addEventListener('click', saveVisitor);
    document.getElementById('btnStartCamera').addEventListener('click', startCamera);
    document.getElementById('btnCapturePhoto').addEventListener('click', capturePhoto);
    document.getElementById('btnUploadPhoto').addEventListener('click', function() {
        document.getElementById('photoUpload').click();
    });
    document.getElementById('photoUpload').addEventListener('change', handlePhotoUpload);
    document.getElementById('btnEditFromDetails').addEventListener('click', openEditFromDetails);
    
    // Cerrar la transmisión de la cámara cuando se cierra el modal
    document.getElementById('visitorModal').addEventListener('hidden.bs.modal', stopCamera);
});

/**
 * Carga las empresas desde el servidor para el selector
 */
function loadCompanies() {
    fetch('/Company/GetData')
        .then(response => {
            if (!response.ok) {
                throw new Error('Error en la solicitud: ' + response.status);
            }
            return response.json();
        })
        .then(data => {
            companies = data;
            const companySelect = document.getElementById('companyId');
            companySelect.innerHTML = '<option value="">Seleccione una empresa</option>';
            
            companies.forEach(company => {
                const option = document.createElement('option');
                option.value = company.id;
                option.textContent = company.name;
                companySelect.appendChild(option);
            });
        })
        .catch(error => {
            console.error('Error al cargar las empresas:', error);
            showNotification('Error al cargar datos de empresas. Por favor, intente de nuevo.', 'error');
        });
}

/**
 * Inicializa la tabla Tabulator para mostrar visitantes
 */
function initVisitorsTable() {
    visitorsTable = new Tabulator("#visitorsTable", {
        height: "450px",
        layout: "fitColumns",
        responsiveLayout: "collapse",
        pagination: true,
        paginationSize: 10,
        paginationSizeSelector: [5, 10, 20, 50],
        movableColumns: true,
        resizableRows: true,
        initialSort: [
            { column: "lastName", dir: "asc" }
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
                        return `<img src="/images/user-placeholder.png" class="visitor-photo" alt="Sin foto" />`;
                    }
                },
                headerSort: false,
                width: 80
            },
            { title: "Nombre", field: "firstName", sorter: "string", headerFilter: true },
            { title: "Apellido", field: "lastName", sorter: "string", headerFilter: true },
            { title: "Identificación", field: "identification", sorter: "string", headerFilter: true },
            { title: "Empresa", field: "companyName", sorter: "string", headerFilter: true },
            {
                title: "Acciones",
                formatter: function(cell, formatterParams, onRendered) {
                    return `<div class="text-center">
                        <button class="btn btn-sm btn-info btn-view-visitor" data-id="${cell.getRow().getData().id}">
                            <i class="bi bi-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-primary ms-1 btn-edit-visitor" data-id="${cell.getRow().getData().id}">
                            <i class="bi bi-pencil-square"></i>
                        </button>
                        <button class="btn btn-sm btn-danger ms-1 btn-delete-visitor" data-id="${cell.getRow().getData().id}">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>`;
                },
                headerSort: false,
                hozAlign: "center",
                width: 150
            }
        ],
        ajaxURL: "/Visitor/GetData",
        ajaxResponse: function(url, params, response) {
            // Procesamos los datos para mostrar correctamente
            return response;
        }
    });
    
    // Event listeners para los botones de acción en la tabla
    document.addEventListener('click', function(e) {
        if (e.target.closest('.btn-view-visitor')) {
            const id = e.target.closest('.btn-view-visitor').getAttribute('data-id');
            openViewVisitorModal(id);
        } else if (e.target.closest('.btn-edit-visitor')) {
            const id = e.target.closest('.btn-edit-visitor').getAttribute('data-id');
            openEditVisitorModal(id);
        } else if (e.target.closest('.btn-delete-visitor')) {
            const id = e.target.closest('.btn-delete-visitor').getAttribute('data-id');
            confirmDeleteVisitor(id);
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
    visitorsTable.setFilter([
        [
            { field: "firstName", type: "like", value: value },
            { field: "lastName", type: "like", value: value },
            { field: "identification", type: "like", value: value },
            { field: "companyName", type: "like", value: value }
        ]
    ]);
}

/**
 * Abre el modal para crear un nuevo visitante
 */
function openCreateVisitorModal() {
    document.getElementById('visitorModalLabel').textContent = 'Nuevo Visitante';
    
    // Limpiar el formulario
    document.getElementById('visitorId').value = '0';
    document.getElementById('firstName').value = '';
    document.getElementById('lastName').value = '';
    document.getElementById('identification').value = '';
    document.getElementById('companyId').value = '';
    document.getElementById('gender').value = '';
    document.getElementById('bloodType').value = '';
    document.getElementById('phoneNumber').value = '';
    document.getElementById('email').value = '';
    document.getElementById('address').value = '';
    document.getElementById('dateOfBirth').value = '';
    document.getElementById('photoBase64').value = '';
    document.getElementById('photoPreview').src = '/images/user-placeholder.png';
    
    isEditing = false;
    
    // Mostrar el modal
    const modal = new bootstrap.Modal(document.getElementById('visitorModal'));
    modal.show();
}

/**
 * Abre el modal para editar un visitante existente
 * @param {string} id - ID del visitante a editar
 */
function openEditVisitorModal(id) {
    fetch(`/Visitor/GetById?id=${id}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Error al obtener los datos del visitante');
            }
            return response.json();
        })
        .then(response => {
            if (response.success) {
                const visitor = response.data;
                document.getElementById('visitorModalLabel').textContent = 'Editar Visitante';
                document.getElementById('visitorId').value = visitor.id;
                document.getElementById('firstName').value = visitor.firstName;
                document.getElementById('lastName').value = visitor.lastName;
                document.getElementById('identification').value = visitor.identification;
                document.getElementById('companyId').value = visitor.companyId || '';
                document.getElementById('gender').value = visitor.gender || '';
                document.getElementById('bloodType').value = visitor.bloodType || '';
                document.getElementById('phoneNumber').value = visitor.phoneNumber || '';
                document.getElementById('email').value = visitor.email || '';
                document.getElementById('address').value = visitor.address || '';
                
                // Formato de fecha para el input date
                if (visitor.dateOfBirth) {
                    const dateParts = visitor.dateOfBirth.split('T')[0];
                    document.getElementById('dateOfBirth').value = dateParts;
                } else {
                    document.getElementById('dateOfBirth').value = '';
                }
                
                // Mostrar la foto si existe
                if (visitor.photoBase64) {
                    document.getElementById('photoPreview').src = `data:image/jpeg;base64,${visitor.photoBase64}`;
                    document.getElementById('photoBase64').value = visitor.photoBase64;
                } else {
                    document.getElementById('photoPreview').src = '/images/user-placeholder.png';
                    document.getElementById('photoBase64').value = '';
                }
                
                isEditing = true;
                
                // Mostrar el modal
                const modal = new bootstrap.Modal(document.getElementById('visitorModal'));
                modal.show();
            } else {
                showNotification('Error: ' + response.message, 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showNotification('Error al cargar la información del visitante', 'error');
        });
}

/**
 * Abre el modal para ver los detalles de un visitante
 * @param {string} id - ID del visitante a visualizar
 */
function openViewVisitorModal(id) {
    fetch(`/Visitor/GetById?id=${id}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Error al obtener los datos del visitante');
            }
            return response.json();
        })
        .then(response => {
            if (response.success) {
                const visitor = response.data;
                
                // Llenar datos en el modal de detalles
                document.getElementById('detailsName').textContent = `${visitor.firstName} ${visitor.lastName}`;
                document.getElementById('detailsIdentification').textContent = visitor.identification;
                document.getElementById('detailsCompany').textContent = visitor.companyName || 'No especificada';
                document.getElementById('detailsGender').textContent = visitor.gender || 'No especificado';
                document.getElementById('detailsBloodType').textContent = visitor.bloodType || 'No especificado';
                document.getElementById('detailsPhone').textContent = visitor.phoneNumber || 'No especificado';
                document.getElementById('detailsEmail').textContent = visitor.email || 'No especificado';
                document.getElementById('detailsAddress').textContent = visitor.address || 'No especificado';
                
                // Formatear la fecha de nacimiento
                if (visitor.dateOfBirth) {
                    const date = new Date(visitor.dateOfBirth);
                    document.getElementById('detailsDateOfBirth').textContent = date.toLocaleDateString();
                } else {
                    document.getElementById('detailsDateOfBirth').textContent = 'No especificado';
                }
                
                // Mostrar la foto si existe
                if (visitor.photoBase64) {
                    document.getElementById('detailsPhoto').src = `data:image/jpeg;base64,${visitor.photoBase64}`;
                } else {
                    document.getElementById('detailsPhoto').src = '/images/user-placeholder.png';
                }
                
                // Para abrir el modal de edición desde el de detalles
                document.getElementById('btnEditFromDetails').setAttribute('data-id', visitor.id);
                
                // TODO: En el futuro, cargar el historial de visitas del visitante
                
                // Mostrar el modal
                const modal = new bootstrap.Modal(document.getElementById('visitorDetailsModal'));
                modal.show();
            } else {
                showNotification('Error: ' + response.message, 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showNotification('Error al cargar la información del visitante', 'error');
        });
}

/**
 * Abre el modal de edición desde el modal de detalles
 */
function openEditFromDetails() {
    const id = document.getElementById('btnEditFromDetails').getAttribute('data-id');
    // Cerrar el modal de detalles
    bootstrap.Modal.getInstance(document.getElementById('visitorDetailsModal')).hide();
    // Abrir el modal de edición
    openEditVisitorModal(id);
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
 * Guarda un visitante (crear o actualizar)
 */
function saveVisitor() {
    // Validar el formulario
    const visitorForm = document.getElementById('visitorForm');
    if (!visitorForm.checkValidity()) {
        visitorForm.reportValidity();
        return;
    }
    
    // Recopilar datos del formulario
    const visitorId = document.getElementById('visitorId').value;
    const firstName = document.getElementById('firstName').value.trim();
    const lastName = document.getElementById('lastName').value.trim();
    const identification = document.getElementById('identification').value.trim();
    const companyId = document.getElementById('companyId').value;
    const gender = document.getElementById('gender').value;
    const bloodType = document.getElementById('bloodType').value;
    const phoneNumber = document.getElementById('phoneNumber').value.trim();
    const email = document.getElementById('email').value.trim();
    const address = document.getElementById('address').value.trim();
    const dateOfBirth = document.getElementById('dateOfBirth').value;
    const photoBase64 = document.getElementById('photoBase64').value;
    
    // Preparar datos para enviar
    const visitorData = {
        id: parseInt(visitorId) || 0,
        firstName: firstName,
        lastName: lastName,
        identification: identification,
        companyId: companyId ? parseInt(companyId) : null,
        gender: gender || null,
        bloodType: bloodType || null,
        phoneNumber: phoneNumber || null,
        email: email || null,
        address: address || null,
        dateOfBirth: dateOfBirth || null,
        photoBase64: photoBase64 || null
    };
    
    // Determinar si es creación o actualización
    const isNew = visitorId === '0' || !visitorId;
    const url = isNew ? '/Visitor/Create' : '/Visitor/Update';
    
    // Enviar petición al servidor
    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(visitorData)
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
            bootstrap.Modal.getInstance(document.getElementById('visitorModal')).hide();
            
            // Mostrar mensaje de éxito
            showNotification(isNew ? 'Visitante creado con éxito.' : 'Visitante actualizado con éxito.', 'success');
            
            // Recargar la tabla
            visitorsTable.setData('/Visitor/GetData');
        } else {
            showNotification('Error: ' + data.message, 'error');
        }
    })
    .catch(error => {
        console.error('Error al guardar el visitante:', error);
        showNotification('Error al guardar los datos. Por favor, intente de nuevo.', 'error');
    });
}

/**
 * Confirma la eliminación de un visitante
 * @param {string} id - ID del visitante a eliminar
 */
function confirmDeleteVisitor(id) {
    Swal.fire({
        title: '¿Está seguro?',
        text: '¿Desea eliminar este visitante? Esta acción no se puede deshacer.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            deleteVisitor(id);
        }
    });
}

/**
 * Elimina un visitante
 * @param {string} id - ID del visitante a eliminar
 */
function deleteVisitor(id) {
    fetch(`/Visitor/Delete?id=${id}`, {
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
            showNotification('Visitante eliminado con éxito.', 'success');
            visitorsTable.setData('/Visitor/GetData');
        } else {
            showNotification('Error: ' + data.message, 'error');
        }
    })
    .catch(error => {
        console.error('Error al eliminar el visitante:', error);
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