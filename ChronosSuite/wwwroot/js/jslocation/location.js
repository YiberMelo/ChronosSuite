/**
 * Script para manejar la tabla de ubicaciones utilizando Tabulator
 * Este archivo contiene todas las funciones necesarias para la gestión CRUD de ubicaciones
 * Autor: ChronosSuite Team
 * Fecha: 30 de abril de 2025
 */

// Variables globales
let locationsTable;
let isEditing = false;

// Inicialización cuando el documento está listo
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar la tabla de ubicaciones con Tabulator
    initLocationsTable();
    
    // Configurar eventos de botones
    document.getElementById('btnAddLocation').addEventListener('click', openCreateLocationModal);
    document.getElementById('btnSaveLocation').addEventListener('click', saveLocation);
    
    // Configurar el filtro rápido
    document.getElementById('quickFilter').addEventListener('keyup', function() {
        locationsTable.setFilter([
            { field: "name", type: "like", value: this.value },
            { field: "description", type: "like", value: this.value }
        ]);
    });
});

// Inicializar la tabla de ubicaciones con Tabulator
function initLocationsTable() {
    locationsTable = new Tabulator("#locationsTable", {
        ajaxURL: "/Location/GetAll",
        layout: "fitColumns",
        height: "450px",
        responsiveLayout: "collapse",
        pagination: true,
        paginationSize: 10,
        paginationSizeSelector: [5, 10, 20, 50],
        movableColumns: true,
        resizableRows: true,
        initialSort: [
            { column: "name", dir: "asc" }
        ],
        columns: [
            { title: "ID", field: "id", sorter: "number", headerFilter: true, width: 80 },
            { title: "Nombre", field: "name", sorter: "string", headerFilter: true, widthGrow: 3 },
            { title: "Descripción", field: "description", sorter: "string", headerFilter: true, widthGrow: 5 },
            {
                title: "Acciones",
                formatter: function(cell, formatterParams, onRendered) {
                    return `<div class="text-center">
                        <button class="btn btn-sm btn-info btn-edit-location" data-id="${cell.getRow().getData().id}">
                            <i class="bi bi-pencil-square"></i>
                        </button>
                        <button class="btn btn-sm btn-danger ms-2 btn-delete-location" data-id="${cell.getRow().getData().id}">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>`;
                },
                headerSort: false,
                hozAlign: "center",
                width: 150
            }
        ],
        ajaxResponse: function(url, params, response) {
            // Procesar la respuesta del servidor
            if (response && response.success && response.data) {
                return response.data;
            }
            return [];
        }
    });
    
    // Event listeners para los botones de acción
    document.addEventListener('click', function(e) {
        if (e.target.closest('.btn-edit-location')) {
            const id = e.target.closest('.btn-edit-location').getAttribute('data-id');
            openEditLocationModal(id);
        } else if (e.target.closest('.btn-delete-location')) {
            const id = e.target.closest('.btn-delete-location').getAttribute('data-id');
            confirmDeleteLocation(id);
        }
    });
}

// Abrir el modal para crear una nueva ubicación
function openCreateLocationModal() {
    document.getElementById('locationModalLabel').textContent = "Nueva Ubicación";
    // No necesitamos establecer el ID, simplemente limpiar el formulario
    document.getElementById('locationId').value = "";
    document.getElementById('locationName').value = "";
    document.getElementById('locationDescription').value = "";
    isEditing = false;
    
    // Mostrar el modal utilizando Bootstrap
    const modal = new bootstrap.Modal(document.getElementById('locationModal'));
    modal.show();
}

// Abrir el modal para editar una ubicación existente
function openEditLocationModal(locationId) {
    fetch(`/Location/GetById?id=${locationId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Error al obtener los datos de la ubicación');
            }
            return response.json();
        })
        .then(response => {
            if (response.success) {
                const location = response.data;
                document.getElementById('locationModalLabel').textContent = "Editar Ubicación";
                document.getElementById('locationId').value = location.id;
                document.getElementById('locationName').value = location.name;
                document.getElementById('locationDescription').value = location.description || "";
                isEditing = true;
                
                // Mostrar el modal utilizando Bootstrap
                const modal = new bootstrap.Modal(document.getElementById('locationModal'));
                modal.show();
            } else {
                showNotification('Error: ' + response.message, 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showNotification('Error al cargar la información de la ubicación', 'error');
        });
}

// Guardar una ubicación (crear o actualizar)
function saveLocation() {
    // Validar el formulario
    const locationForm = document.getElementById('locationForm');
    if (!locationForm.checkValidity()) {
        locationForm.reportValidity();
        return;
    }
    
    // Determinar si estamos creando o editando
    const locationIdField = document.getElementById('locationId');
    const isNew = !locationIdField.value || locationIdField.value === "0" || locationIdField.value === "";
    
    // Preparar los datos según sea una nueva ubicación o una actualización
    let locationData;
    
    if (isNew) {
        // Si es nuevo, no enviamos ID para que la base de datos lo genere automáticamente
        locationData = {
            name: document.getElementById('locationName').value.trim(),
            description: document.getElementById('locationDescription').value.trim()
        };
    } else {
        // Si es actualización, incluimos el ID
        locationData = {
            id: parseInt(locationIdField.value),
            name: document.getElementById('locationName').value.trim(),
            description: document.getElementById('locationDescription').value.trim()
        };
    }
    
    const url = isNew ? "/Location/Create" : "/Location/Update";
    const method = "POST";
    
    fetch(url, {
        method: method,
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(locationData)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Error en la solicitud');
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            // Cerrar el modal
            bootstrap.Modal.getInstance(document.getElementById('locationModal')).hide();
            
            // Mostrar mensaje de éxito
            showNotification(isNew ? 'Ubicación creada con éxito.' : 'Ubicación actualizada con éxito.', 'success');
            
            // Recargar los datos de la tabla
            locationsTable.setData("/Location/GetAll");
        } else {
            showNotification('Error: ' + data.message, 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification('Error al guardar los datos. Por favor, intente de nuevo.', 'error');
    });
}

// Confirmar la eliminación de una ubicación
function confirmDeleteLocation(locationId) {
    Swal.fire({
        title: '¿Está seguro?',
        text: "¿Desea eliminar esta ubicación? Esta acción no se puede deshacer.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            deleteLocation(locationId);
        }
    });
}

// Eliminar una ubicación
function deleteLocation(locationId) {
    fetch(`/Location/Delete?id=${locationId}`, {
        method: 'DELETE'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Error en la solicitud');
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            // Mostrar mensaje de éxito
            showNotification('Ubicación eliminada con éxito.', 'success');
            
            // Recargar los datos de la tabla
            locationsTable.setData("/Location/GetAll");
        } else {
            showNotification('Error: ' + data.message, 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification('Error al eliminar los datos. Por favor, intente de nuevo.', 'error');
    });
}

// Mostrar notificaciones con SweetAlert2
function showNotification(message, type) {
    Swal.fire({
        title: type === 'error' ? 'Error' : type === 'warning' ? 'Advertencia' : 'Éxito',
        text: message,
        icon: type,
        confirmButtonColor: '#43a047',
        confirmButtonText: 'Aceptar'
    });
}