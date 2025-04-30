/**
 * Script para manejar la tabla de empleados utilizando Tabulator
 * Este archivo contiene todas las funciones necesarias para la gestión CRUD de empleados
 * Autor: ChronosSuite Team
 * Fecha: 29 de abril de 2025
 */

// Variables globales
let employeeTable;
let isEditing = false;
let companies = []; // Para almacenar las empresas disponibles

// Ejecutar cuando el DOM esté cargado
document.addEventListener('DOMContentLoaded', function() {
    // Cargar las compañías para el selector
    loadCompanies();
    
    // Inicializar la tabla de empleados con Tabulator
    initEmployeeTable();
    
    // Cargar datos de los empleados
    loadEmployees();
    
    // Event listeners
    document.getElementById('quickFilter').addEventListener('keyup', filterTable);
    document.getElementById('btnAddEmployee').addEventListener('click', showAddEmployeeModal);
    document.getElementById('btnSaveEmployee').addEventListener('click', saveEmployee);
});

/**
 * Inicializa la tabla Tabulator para mostrar empleados
 */
function initEmployeeTable() {
    employeeTable = new Tabulator("#employeesTable", {
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
            { title: "ID", field: "id", sorter: "number", headerFilter: true, width: 60 },
            { title: "Nombre", field: "firstName", sorter: "string", headerFilter: true, widthGrow: 2 },
            { title: "Apellido", field: "lastName", sorter: "string", headerFilter: true, widthGrow: 2 },
            { title: "Empresa", field: "companyName", sorter: "string", headerFilter: true, widthGrow: 2 },
            { title: "Cargo", field: "position", sorter: "string", headerFilter: true, widthGrow: 2 },
            { title: "Email", field: "email", sorter: "string", headerFilter: true, widthGrow: 3 },
            { title: "Teléfono", field: "phoneNumber", headerFilter: true, widthGrow: 2 },
            {
                title: "Acciones",
                formatter: function(cell, formatterParams, onRendered) {
                    return `<div class="text-center">
                        <button class="btn btn-sm btn-info btn-edit-employee" data-id="${cell.getRow().getData().id}">
                            <i class="bi bi-pencil-square"></i>
                        </button>
                        <button class="btn btn-sm btn-danger ms-2 btn-delete-employee" data-id="${cell.getRow().getData().id}">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>`;
                },
                headerSort: false,
                hozAlign: "center",
                width: 120
            }
        ],
        rowClick: function(e, row) {
            // Opcional: acciones al hacer clic en una fila
        }
    });
    
    // Event listeners para los botones de acción
    document.addEventListener('click', function(e) {
        if (e.target.closest('.btn-edit-employee')) {
            const id = e.target.closest('.btn-edit-employee').getAttribute('data-id');
            editEmployee(id);
        } else if (e.target.closest('.btn-delete-employee')) {
            const id = e.target.closest('.btn-delete-employee').getAttribute('data-id');
            confirmDeleteEmployee(id);
        }
    });
}

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
            const companySelect = document.getElementById('employeeCompany');
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
 * Carga los empleados desde el servidor
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
            // Procesamos los datos para mostrar el nombre de la empresa en lugar del ID
            const processedData = data.map(employee => {
                const company = companies.find(c => c.id == employee.companyId);
                return {
                    ...employee,
                    companyName: company ? company.name : 'Sin empresa'
                };
            });
            
            employeeTable.setData(processedData);
        })
        .catch(error => {
            console.error('Error al cargar los empleados:', error);
            showNotification('Error al cargar los datos. Por favor, intente de nuevo.', 'error');
        });
}

/**
 * Filtra la tabla según el texto ingresado
 */
function filterTable() {
    const value = document.getElementById('quickFilter').value;
    employeeTable.setFilter([
        [
            { field: "firstName", type: "like", value: value },
            { field: "lastName", type: "like", value: value },
            { field: "companyName", type: "like", value: value },
            { field: "position", type: "like", value: value },
            { field: "email", type: "like", value: value },
            { field: "phoneNumber", type: "like", value: value }
        ]
    ]);
}

/**
 * Muestra el modal para agregar un nuevo empleado
 */
function showAddEmployeeModal() {
    document.getElementById('employeeModalLabel').textContent = 'Nuevo Empleado';
    document.getElementById('employeeId').value = '0';
    document.getElementById('employeeFirstName').value = '';
    document.getElementById('employeeLastName').value = '';
    document.getElementById('employeePosition').value = '';
    document.getElementById('employeeEmail').value = '';
    document.getElementById('employeePhone').value = '';
    document.getElementById('employeeCompany').value = '';
    isEditing = false;
    
    const modal = new bootstrap.Modal(document.getElementById('employeeModal'));
    modal.show();
}

/**
 * Muestra el modal para editar un empleado existente
 * @param {string} id - ID del empleado a editar
 */
function editEmployee(id) {
    const employee = employeeTable.getData().find(e => e.id == id);
    if (employee) {
        document.getElementById('employeeModalLabel').textContent = 'Editar Empleado';
        document.getElementById('employeeId').value = employee.id;
        document.getElementById('employeeFirstName').value = employee.firstName;
        document.getElementById('employeeLastName').value = employee.lastName;
        document.getElementById('employeePosition').value = employee.position;
        document.getElementById('employeeEmail').value = employee.email;
        document.getElementById('employeePhone').value = employee.phoneNumber;
        document.getElementById('employeeCompany').value = employee.companyId;
        isEditing = true;
        
        const modal = new bootstrap.Modal(document.getElementById('employeeModal'));
        modal.show();
    }
}

/**
 * Guarda un empleado (crear o actualizar)
 */
function saveEmployee() {
    const id = parseInt(document.getElementById('employeeId').value) || 0;
    const firstName = document.getElementById('employeeFirstName').value.trim();
    const lastName = document.getElementById('employeeLastName').value.trim();
    const position = document.getElementById('employeePosition').value.trim();
    const email = document.getElementById('employeeEmail').value.trim();
    const phone = document.getElementById('employeePhone').value.trim();
    const companyId = document.getElementById('employeeCompany').value;
    
    if (!firstName || !lastName) {
        showNotification('El nombre y apellido son obligatorios.', 'warning');
        return;
    }
    
    if (!companyId) {
        showNotification('Debe seleccionar una empresa.', 'warning');
        return;
    }
    
    const employee = {
        id: id,
        firstName: firstName,
        lastName: lastName,
        position: position,
        email: email,
        phoneNumber: phone,
        companyId: parseInt(companyId)
    };
    
    const url = isEditing ? '/Employee/Edit' : '/Employee/Create';
    const method = isEditing ? 'PUT' : 'POST';
    
    fetch(url, {
        method: method,
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(employee)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Error en la solicitud: ' + response.status);
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            bootstrap.Modal.getInstance(document.getElementById('employeeModal')).hide();
            showNotification(isEditing ? 'Empleado actualizado con éxito.' : 'Empleado creado con éxito.', 'success');
            loadEmployees();
        } else {
            showNotification('Error: ' + data.message, 'error');
        }
    })
    .catch(error => {
        console.error('Error al guardar el empleado:', error);
        showNotification('Error al guardar los datos. Por favor, intente de nuevo.', 'error');
    });
}

/**
 * Confirma la eliminación de un empleado
 * @param {string} id - ID del empleado a eliminar
 */
function confirmDeleteEmployee(id) {
    Swal.fire({
        title: '¿Está seguro?',
        text: '¿Desea eliminar este empleado? Esta acción no se puede deshacer.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            deleteEmployee(id);
        }
    });
}

/**
 * Elimina un empleado
 * @param {string} id - ID del empleado a eliminar
 */
function deleteEmployee(id) {
    fetch(`/Employee/Delete?id=${id}`, {
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
            showNotification('Empleado eliminado con éxito.', 'success');
            loadEmployees();
        } else {
            showNotification('Error: ' + data.message, 'error');
        }
    })
    .catch(error => {
        console.error('Error al eliminar el empleado:', error);
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