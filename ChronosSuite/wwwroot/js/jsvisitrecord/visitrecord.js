const btnModalVisitRecord = document.getElementById('btnModalVisitRecord');
const modalVisitRecord = new bootstrap.Modal(document.getElementById('modalVisitRecord'));

const exactHoursContainer = document.getElementById('exactHoursContainer');

const isImmediateVisit = document.getElementById('isImmediateVisit');
const entryTime = document.getElementById('entryTime');
const scheduledEntryTime = document.getElementById('scheduledEntryTime');
const scheduledExitTime = document.getElementById('scheduledExitTime');

const visitorSelector = document.getElementById('visitorSelector');
const visitPurposeSelector = document.getElementById('visitPurposeSelector');
const authorizedEmployeeSelector = document.getElementById('authorizedEmployeeSelector');

const frmVisitRecord = document.getElementById('frmVisitRecord');

const btnSaveVisitRecord = document.getElementById('btnSaveVisitRecord');

initSingleVirtualSelect('#visitorSelector', 'Seleccionar Visitante');
initSingleVirtualSelect('#locationSelector', 'Seleccionar Ubicación');
initSingleDescriptionVirtualSelect('#authorizedEmployeeSelector', 'Seleccionar Empleado Autorizado');
initSingleVirtualSelect('#visitPurposeSelector', 'Seleccionar Motivo de Visita', true);

let idVisitRecord = {};

function GetSelects() {
    const optionsVisitPurpose = [
        { label: 'Reunión', value: 'reunion' },
        { label: 'Entrega', value: 'entrega' },
        { label: 'Mantenimiento', value: 'mantenimiento' },
        { label: 'Consulta', value: 'consulta' },
        { label: 'Entrevista', value: 'entrevista' }
    ];

    visitPurposeSelector.setOptions(optionsVisitPurpose);

    $.ajax({
        url: '/Visitor/GetList',
        method: 'GET',
        dataType: 'json',
        success: function (data) {
            visitorSelector.setOptions(data);
        }
    });

    $.ajax({
        url: '/Location/GetList',
        method: 'GET',
        dataType: 'json',
        success: function (data) {
            locationSelector.setOptions(data);
        }
    });

    $.ajax({
        url: '/Employee/GetList',
        method: 'GET',
        dataType: 'json',
        success: function (data) {
            authorizedEmployeeSelector.setOptions(data);
        }
    });
}

function getAllVisitRecord() {
    const columnsVisitRecord = [
        {
            field: 'visitorFullName',
            title: 'Visitante',
            sortable: true,
            filterControl: 'input',
            align: 'center'
        },
        {
            field: 'authorizedEmployeeFullName',
            title: 'Empleado Autorizador',
            sortable: true,
            filterControl: 'input',
            align: 'center'
        },
        {
            field: 'locationName',
            title: 'Localidad',
            sortable: true,
            filterControl: 'input',
            align: 'center'
        },
        {
            field: 'visitPurpose',
            title: 'Propósito de la Visita',
            sortable: true,
            filterControl: 'input',
            align: 'center'
        },
        {
            field: 'carriedObjects',
            title: 'Objetos Transportados',
            sortable: true,
            filterControl: 'input',
            align: 'center',
            formatter: function (value) {
                // Longitud máxima antes de mostrar el botón (ej: 30 caracteres)
                const maxLength = 30;
                const safeValue = value.replace(/'/g, "\\'").replace(/\n/g, '<br>');

                // Si el texto es corto, mostrarlo directamente
                if (value.length <= maxLength) {
                    return `<span>${value}</span>`;
                }
                // Si es largo, mostrar texto truncado + botón
                else {
                    return `
                        <div style="display: flex; align-items: center; justify-content: center; gap: 5px;">
                            <span>${value.substring(0, maxLength)}...</span>
                            <button class="btn btn-sm btn-dark" onclick="
                                Swal.fire({
                                    title: 'Objetos Transportados',
                                    html: '${safeValue}',
                                    confirmButtonColor: '#ff6b6b',
                                    confirmButtonText: 'Cerrar',
                                    width: '50%'
                                });
                                return false;
                            ">
                                <i class="bi bi-eye-fill"></i>
                            </button>
                        </div>
                    `;
                }
            }
        },
        {  
           field: 'entryTime',  
           title: 'Hora de Entrada',  
           sortable: true,  
           filterControl: 'input',  
           align: 'center',  
           formatter: function (value) {  
               if (!value) return '';  
               const date = new Date(value);  
               return date.toLocaleString('es-ES', {  
                   day: '2-digit',  
                   month: '2-digit',  
                   year: 'numeric',  
                   hour: '2-digit',  
                   minute: '2-digit',  
                   hour12: false  
               });  
           }  
        },  
        {  
           field: 'exitTime',  
           title: 'Hora de Salida',  
           sortable: true,  
           filterControl: 'input',  
           align: 'center',  
           formatter: function (value) {  
               if (!value) return '';  
               const date = new Date(value);  
               return date.toLocaleString('es-ES', {  
                   day: '2-digit',  
                   month: '2-digit',  
                   year: 'numeric',  
                   hour: '2-digit',  
                   minute: '2-digit',  
                   hour12: false  
               });  
           }  
        },
        {
            field: 'isImmediateVisit',
            title: 'Visita Inmediata',
            filterControl: 'select',
            filterData: 'json:{"true":"Sí","false":"No"}',
            align: 'center',
            formatter: function (value) {
                return value ? '<span class="badge bg-success fs-6">Sí</span>' : '<span class="badge bg-danger fs-6">No</span>';
            }
        },
        {
            field: 'hasEntered',
            title: 'Entró',
            filterControl: 'select',
            filterData: 'json:{"true":"Sí","false":"No"}',
            align: 'center',
            formatter: function (value) {
                return value ? '<span class="badge bg-success fs-6">Sí</span>' : '<span class="badge bg-danger fs-6">No</span>';
            }
        },
        {
            field: 'hasExited',
            title: 'Salio',
            filterControl: 'select',
            filterData: 'json:{"true":"Sí","false":"No"}',
            align: 'center',
            formatter: function (value) {
                return value ? '<span class="badge bg-success fs-6">Sí</span>' : '<span class="badge bg-danger fs-6">No</span>';
            }
        },
        {
            field: 'actions',
            title: 'Acciones',
            align: 'center',
            formatter: function (value, row) {
                return `  
                    <div class="d-flex justify-content-center gap-2">  
                        <button class="btn btn-info btn-sm" onclick="getById('${row.id}')">  
                            <i class="bi bi-eye-fill"></i>  
                        </button>  
                        <button class="btn btn-warning btn-sm" onclick="reportVisitRecord('${row.id}')">  
                            <i class="bi bi-flag-fill"></i>  
                        </button>  
                        ${!row.hasEntered ? `
                        <button class="btn btn-secondary btn-sm" onclick="markEntry('${row.id}')">  
                            <i class="bi bi-box-arrow-in-right"></i>  
                        </button>` : ''}  
                        ${row.hasEntered && !row.hasExited ? `
                        <button class="btn btn-outline-secondary btn-sm" onclick="markExit('${row.id}')">  
                            <i class="bi bi-box-arrow-left"></i>  
                        </button>` : ''}  
                        <button class="btn btn-danger btn-sm" onclick="deleteVisitRecord('${row.id}')">  
                            <i class="bi bi-trash-fill"></i>  
                        </button>  
                    </div>  
                `;
            },
            searchable: false,
            sortable: false,
            filterControl: false
        }
    ];

    $('#tbAllvisitRecords').bootstrapTable({
        locale: 'es-MX',
        url: '/VisitRecord/GetAll',
        method: 'post',
        columns: columnsVisitRecord,
        pagination: true,
        sidePagination: 'server',
        showRefresh: true,
        showExport: true,
        showToggle: true,
        showFullscreen: true,
        showColumns: true,
        showColumnsToggleAll: true,
        pageSize: 10,
        pageList: [10, 25, 50, 100],
        showPaginationSwitch: true,
        sortable: true,
        filterControl: true,
        filterDatepickerOptions: true,
        queryParams: function (params) {
            return {
                limit: params.limit,
                offset: params.offset,
                sort: params.sort,
                order: params.order,
                search: params.search,
                filter: getFilters('tbAllvisitRecords')
            };
        },
        rowStyle: function (row) {
            if (row.reportFlag) {
                return { classes: 'table-warning' };
            }
            return {};
        }  
    });
}

function markEntry(id) { 
   console.log(id)
   Swal.fire({  
       title: 'Confirmar Entrada',  
       text: '¿Está seguro de que desea marcar la entrada para este registro?',  
       icon: 'warning',  
       showCancelButton: true,  
       confirmButtonColor: '#009b8b',  
       cancelButtonColor: '#ff6b6b',  
       confirmButtonText: 'Sí, marcar entrada',  
       cancelButtonText: 'Cancelar'  
   }).then((result) => {  
       if (result.isConfirmed) {  
           Swal.fire({  
               title: 'Cargando...',  
               text: 'Por favor, espere mientras se procesa la entrada.',  
               allowOutsideClick: false,  
               didOpen: () => {  
                   Swal.showLoading();  
               }  
           });  

           $.ajax({  
               url: `/VisitRecord/MarkEntry?visitRecordId=${id}`,  
               type: 'POST',  
               success: function (response) {  
                   if (response.success) {  
                       Swal.fire({  
                           icon: 'success',  
                           title: 'Éxito',  
                           text: response.message,  
                           showConfirmButton: false,  
                           timer: 2500  
                       });  

                       $('#tbAllvisitRecords').bootstrapTable('refresh');  
                   } else {  
                       Swal.fire({  
                           icon: 'error',  
                           title: 'Error',  
                           text: response.message  
                       });  
                   }  
               },  
               error: function () {  
                   Swal.fire({  
                       icon: 'error',  
                       title: 'Error',  
                       text: 'Hubo un problema al marcar la entrada. Por favor, inténtelo de nuevo.'  
                   });  
               }  
           });  
       }  
   });  
}

function markExit(id) {  
   console.log(id)  
   Swal.fire({  
       title: 'Confirmar Salida',  
       text: '¿Está seguro de que desea marcar la salida para este registro?',  
       icon: 'warning',  
       showCancelButton: true,  
       confirmButtonColor: '#009b8b',  
       cancelButtonColor: '#ff6b6b',  
       confirmButtonText: 'Sí, marcar salida',  
       cancelButtonText: 'Cancelar'  
   }).then((result) => {  
       if (result.isConfirmed) {  
           Swal.fire({  
               title: 'Cargando...',  
               text: 'Por favor, espere mientras se procesa la salida.',  
               allowOutsideClick: false,  
               didOpen: () => {  
                   Swal.showLoading();  
               }  
           });  

           $.ajax({  
               url: `/VisitRecord/MarkExit?visitRecordId=${id}`,  
               type: 'POST',  
               success: function (response) {  
                   if (response.success) {  
                       Swal.fire({  
                           icon: 'success',  
                           title: 'Éxito',  
                           text: response.message,  
                           showConfirmButton: false,  
                           timer: 2500  
                       });  

                       $('#tbAllvisitRecords').bootstrapTable('refresh');  
                   } else {  
                       Swal.fire({  
                           icon: 'error',  
                           title: 'Error',  
                           text: response.message  
                       });  
                   }  
               },  
               error: function () {  
                   Swal.fire({  
                       icon: 'error',  
                       title: 'Error',  
                       text: 'Hubo un problema al marcar la salida. Por favor, inténtelo de nuevo.'  
                   });  
               }  
           });  
       }  
   });  
}

function reportVisitRecord(id) {
    $.get(`/VisitRecord/GetReportStatus?visitRecordId=${id}`, function (response) {
        if (!response.success) {
            Swal.fire('Error', response.message, 'error');
            return;
        }

        if (response.reportFlag) {
            // Ya está reportado, mostrar descripción
            Swal.fire({
                icon: 'info',
                title: 'Ya reportado',
                html: `<strong>Descripción:</strong><br>${response.reportDescription}`,
                confirmButtonColor: '#009b8b',
                confirmButtonText: 'Cerrar'
            });
        } else {
            // Preguntar si desea reportar
            Swal.fire({
                title: 'Confirmar Reporte',
                text: '¿Está seguro de que desea marcar este registro como "En Reporte"?',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#009b8b',
                cancelButtonColor: '#ff6b6b',
                confirmButtonText: 'Sí, reportar',
                cancelButtonText: 'Cancelar'
            }).then((result) => {
                if (result.isConfirmed) {
                    // Mostrar modal para ingresar descripción
                    Swal.fire({
                        title: 'Descripción del Reporte',
                        input: 'textarea',
                        inputPlaceholder: 'Escriba aquí la razón del reporte...',
                        inputAttributes: {
                            'aria-label': 'Descripción del reporte'
                        },
                        showCancelButton: true,
                        confirmButtonText: 'Guardar',
                        cancelButtonText: 'Cancelar',
                        confirmButtonColor: '#009b8b',
                        cancelButtonColor: '#ff6b6b',
                        preConfirm: (desc) => {
                            if (!desc || desc.trim().length < 5) {
                                Swal.showValidationMessage('La descripción debe tener al menos 5 caracteres.');
                            }
                            return desc;
                        }
                    }).then((resultDesc) => {
                        if (resultDesc.isConfirmed) {
                            // Guardar el reporte con descripción
                            $.ajax({
                                url: `/VisitRecord/MarkAsReported`,
                                type: 'POST',
                                data: {
                                    visitRecordId: id,
                                    reportDescription: resultDesc.value
                                },
                                success: function (res) {
                                    if (res.success) {
                                        Swal.fire({
                                            icon: 'success',
                                            title: 'Reportado',
                                            text: res.message,
                                            timer: 2500,
                                            showConfirmButton: false
                                        });
                                        $('#tbAllvisitRecords').bootstrapTable('refresh');
                                    } else {
                                        Swal.fire('Error', res.message, 'error');
                                    }
                                },
                                error: function () {
                                    Swal.fire('Error', 'No se pudo guardar el reporte.', 'error');
                                }
                            });
                        }
                    });
                }
            });
        }
    });
}

function getById(id) {
    $.ajax({
        url: `${'/VisitRecord/GetById'}?id=${id}`,
        type: 'GET',
        dataType: 'json',
        success: function (data) {
            frmVisitRecord.reset();
            exactHoursContainer.classList.remove('d-none');
            idVisitRecord = data.visit.id;

            visitorSelector.setValue(data.visit.visitorId);
            locationSelector.setValue(data.visit.locationId);
            authorizedEmployeeSelector.setValue(data.visit.authorizedEmployeeId);
            visitPurposeSelector.setValue(data.visit.visitPurpose);

            visitorSelector.disable();
            locationSelector.disable();
            authorizedEmployeeSelector.disable();
            visitPurposeSelector.disable();

            frmVisitRecord.querySelectorAll("input[name], textarea[name]").forEach(element => {
                const fieldName = element.name;

                if (data.visit.hasOwnProperty(fieldName)) {
                    const value = data.visit[fieldName];
                    if (element.type === "checkbox") {
                        element.checked = Boolean(value);
                    } else {
                        element.value = value;
                    }
                }
                element.disabled = true;
            });

            btnSaveVisitRecord.classList.add('d-none');
            modalVisitRecord.show();
        },
        error: function () {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Error al cargar datos',
                showConfirmButton: false,
                timer: 2500
            });
        }
    });
}

function deleteVisitRecord(id) {
    Swal.fire({
        title: '¿Estás seguro?',
        text: "No podrás revertir esta acción.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ff6b6b',
        cancelButtonColor: '#006a6a',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            $.ajax({
                type: "delete",
                url: `${'/VisitRecord/Delete'}?id=${id}`,
                contentType: "application/json",
                success: function (response) {
                    if (response.success) {
                        Swal.fire({
                            icon: 'success',
                            title: 'Eliminado',
                            text: response.message,
                            showConfirmButton: false,
                            timer: 2500
                        });
                        $('#tbAllvisitRecords').bootstrapTable('refresh');
                    } else {
                        Swal.fire({
                            icon: 'error',
                            title: 'Error',
                            text: response.message,
                            showConfirmButton: false,
                            timer: 2500
                        });
                    }
                },
                error: function () {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: 'No se pudo eliminar el visitante. Inténtalo de nuevo.'
                    });
                }
            });
        }
    });
}

document.addEventListener('DOMContentLoaded', function () {
    GetSelects();
    getAllVisitRecord();

    btnModalVisitRecord.addEventListener('click', function () {
        frmVisitRecord.reset();
        btnSaveVisitRecord.classList.remove('d-none');
        visitorSelector.enable();
        locationSelector.enable();
        authorizedEmployeeSelector.enable();
        visitPurposeSelector.enable();


        frmVisitRecord.querySelectorAll("input[name], textarea[name]").forEach(element => {
            element.disabled = false;
        });

        exactHoursContainer.classList.add('d-none')
        isImmediateVisit.disabled = false
        scheduledEntryTime.disabled = false;
        modalVisitRecord.show();
    });

    isImmediateVisit.addEventListener('change', function () {
        if (isImmediateVisit.checked) {
            scheduledEntryTime.disabled = true;

            const now = new Date();
            const offset = now.getTimezoneOffset() * 60000;
            const localTime = new Date(now.getTime() - offset);
            const formattedDateTime = localTime.toISOString().slice(0, 16);
            scheduledEntryTime.value = formattedDateTime;

            scheduledExitTime.value = '';
        } else {
            scheduledEntryTime.disabled = false;
            scheduledExitTime.disabled = false;

            scheduledEntryTime.value = '';
        }
    });

    btnSaveVisitRecord.addEventListener('click', function () {
        const visitRecordData = {
            VisitorId: visitorSelector.value,
            LocationId: locationSelector.value,
            AuthorizedEmployeeId: authorizedEmployeeSelector.value,
            VisitPurpose: visitPurposeSelector.value.toUpperCase(),
        };

        frmVisitRecord.querySelectorAll('input, select, textarea').forEach((element) => {
            if (element.name && element.name.trim() !== "") {
                if (element.type === 'checkbox') {
                    visitRecordData[element.name] = element.checked;
                } else if (element.type === 'radio') {
                    visitRecordData[element.name] = element.checked;
                } else {
                    visitRecordData[element.name] = element.value.trim().toUpperCase();
                }
            }
        });

        Swal.fire({
            title: 'Cargando...',
            text: 'Por favor, espere mientras se crea el registro de la visita.',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        $.ajax({
            type: "Post",
            url: '/VisitRecord/Save',
            data: JSON.stringify(visitRecordData),
            contentType: "application/json",
            dataType: "json",
            success: function (response) {
                if (response.success) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Éxito',
                        text: response.message,
                        showConfirmButton: false,
                        timer: 2500
                    })

                    $('#tbAllvisitRecords').bootstrapTable('refresh');
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: response.message,
                    });
                }
            },
            error: function (error) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Hubo un problema al guardar el registro de la visita. Por favor, inténtelo de nuevo.'
                });
            }
        });
        modalVisitRecord.hide();
    });
});
