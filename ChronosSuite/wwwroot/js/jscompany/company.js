/**
 * Script para manejar la tabla de empresas utilizando Tabulator
 * Este archivo contiene todas las funciones necesarias para la gestión CRUD de empresas
 * Autor: ChronosSuite Team
 * Fecha: 29 de abril de 2025
 */

// Variables globales
let companyTable;
let isEditing = false;

// Ejecutar cuando el DOM esté cargado
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar la tabla de empresas con Tabulator
    initCompanyTable();
    
    // Cargar datos de las empresas
    loadCompanies();
    
    // Event listeners
    document.getElementById('quickFilter').addEventListener('keyup', filterTable);
    document.getElementById('btnAddCompany').addEventListener('click', showAddCompanyModal);
    document.getElementById('btnSaveCompany').addEventListener('click', saveCompany);
});

/**
 * Inicializa la tabla Tabulator para mostrar empresas
 */
function initCompanyTable() {
    companyTable = new Tabulator("#companiesTable", {
        height: "450px",
        layout: "fitColumns",
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
            {
                title: "Acciones",
                formatter: function(cell, formatterParams, onRendered) {
                    return `<div class="text-center">
                        <button class="btn btn-sm btn-info btn-edit-company" data-id="${cell.getRow().getData().id}">
                            <i class="bi bi-pencil-square"></i>
                        </button>
                        <button class="btn btn-sm btn-danger ms-2 btn-delete-company" data-id="${cell.getRow().getData().id}">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>`;
                },
                headerSort: false,
                hozAlign: "center",
                width: 150
            }
        ],
        rowClick: function(e, row) {
            // Opcional: acciones al hacer clic en una fila
        }
    });
    
    // Event listeners para los botones de acción
    document.addEventListener('click', function(e) {
        if (e.target.closest('.btn-edit-company')) {
            const id = e.target.closest('.btn-edit-company').getAttribute('data-id');
            editCompany(id);
        } else if (e.target.closest('.btn-delete-company')) {
            const id = e.target.closest('.btn-delete-company').getAttribute('data-id');
            confirmDeleteCompany(id);
        }
    });
}

/**
 * Carga las empresas desde el servidor
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
            companyTable.setData(data);
        })
        .catch(error => {
            console.error('Error al cargar las empresas:', error);
            showNotification('Error al cargar los datos. Por favor, intente de nuevo.', 'error');
        });
}

/**
 * Filtra la tabla según el texto ingresado
 */
function filterTable() {
    const value = document.getElementById('quickFilter').value;
    companyTable.setFilter([
        { field: "name", type: "like", value: value }
    ]);
}

/**
 * Muestra el modal para agregar una nueva empresa
 */
function showAddCompanyModal() {
    document.getElementById('companyModalLabel').textContent = 'Nueva Empresa';
    document.getElementById('companyId').value = '0';
    document.getElementById('companyName').value = '';
    isEditing = false;
    
    const modal = new bootstrap.Modal(document.getElementById('companyModal'));
    modal.show();
}

/**
 * Muestra el modal para editar una empresa existente
 * @param {string} id - ID de la empresa a editar
 */
function editCompany(id) {
    const company = companyTable.getData().find(c => c.id == id);
    if (company) {
        document.getElementById('companyModalLabel').textContent = 'Editar Empresa';
        document.getElementById('companyId').value = company.id;
        document.getElementById('companyName').value = company.name;
        isEditing = true;
        
        const modal = new bootstrap.Modal(document.getElementById('companyModal'));
        modal.show();
    }
}

/**
 * Guarda una empresa (crear o actualizar)
 */
function saveCompany() {
    const id = parseInt(document.getElementById('companyId').value) || 0;
    const name = document.getElementById('companyName').value.trim();
    
    if (!name) {
        showNotification('El nombre de la empresa es obligatorio.', 'warning');
        return;
    }
    
    const company = {
        id: id,
        name: name
    };
    
    const url = isEditing ? '/Company/Edit' : '/Company/Create';
    const method = isEditing ? 'PUT' : 'POST';
    
    fetch(url, {
        method: method,
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(company)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Error en la solicitud: ' + response.status);
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            bootstrap.Modal.getInstance(document.getElementById('companyModal')).hide();
            showNotification(isEditing ? 'Empresa actualizada con éxito.' : 'Empresa creada con éxito.', 'success');
            loadCompanies();
        } else {
            showNotification('Error: ' + data.message, 'error');
        }
    })
    .catch(error => {
        console.error('Error al guardar la empresa:', error);
        showNotification('Error al guardar los datos. Por favor, intente de nuevo.', 'error');
    });
}

/**
 * Confirma la eliminación de una empresa
 * @param {string} id - ID de la empresa a eliminar
 */
function confirmDeleteCompany(id) {
    Swal.fire({
        title: '¿Está seguro?',
        text: '¿Desea eliminar esta empresa? Esta acción no se puede deshacer.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            deleteCompany(id);
        }
    });
}

/**
 * Elimina una empresa
 * @param {string} id - ID de la empresa a eliminar
 */
function deleteCompany(id) {
    fetch(`/Company/Delete?id=${id}`, {
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
            showNotification('Empresa eliminada con éxito.', 'success');
            loadCompanies();
        } else {
            showNotification('Error: ' + data.message, 'error');
        }
    })
    .catch(error => {
        console.error('Error al eliminar la empresa:', error);
        showNotification('Error al eliminar los datos. Por favor, intente de nuevo.', 'error');
    });
}

/**
 * Muestra notificaciones al usuario (usando SweetAlert2)
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