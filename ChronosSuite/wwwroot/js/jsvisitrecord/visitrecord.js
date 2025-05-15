const btnModalVisitRecord = document.getElementById('btnModalVisitRecord');
const modalVisitRecord = new bootstrap.Modal(document.getElementById('modalVisitRecord'));

const exactHoursContainer = document.getElementById('exactHoursContainer');
const isImmediateVisitContainer = document.getElementById('isImmediateVisitContainer');

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
            formatter: function(value) {
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
            align: 'center'
        },
        {
            field: 'exitTime',
            title: 'Hora de Salida',
            sortable: true,
            filterControl: 'input',
            align: 'center',
        },
        {
            field: 'scheduledEntryTime',
            title: 'Hora de entrada programada',
            sortable: true,
            filterControl: 'input',
            align: 'center',
        },
        {
            field: 'scheduledExitTime',
            title: 'Hora de salida programada',
            sortable: true,
            filterControl: 'input',
            align: 'center',
        },
        {
            field: 'hasEntered',
            title: 'Entró',
            sortable: true,
            filterControl: 'select',
            align: 'center',
            formatter: function (value) {
                return value ? '<span class="badge bg-success fs-6">Sí</span>' : '<span class="badge bg-danger fs-6">No</span>';
            }
        },
        {
            field: 'isImmediateVisit',
            title: 'Visita Inmediata',
            sortable: true,
            filterControl: 'select',
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
                    <button class="btn btn-warning btn-sm" onclick="getById('${row.id}')">
                        <i class="bi bi-pencil-fill"></i>
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="deleteVisitRecord('${row.id}')">
                        <i class="bi bi-trash-fill"></i>
                    </button>
                `;
            },
            searchable: false,
            sortable: false,
            filterControl: false
        }
    ];

    const hasEnteredFilterData = JSON.stringify([
        { value: '', text: 'Todos' },
        { value: 'true', text: 'Sí' },
        { value: 'false', text: 'No' }
    ]);

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
        responseHandler: function (res) {
            console.log('JSON recibido:', res);
            return res;
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
            isImmediateVisitContainer.classList.add('d-none');
            idVisitRecord = data.visit.id;

            visitorSelector.setValue(data.visit.visitorId);
            locationSelector.setValue(data.visit.locationId);
            authorizedEmployeeSelector.setValue(data.visit.authorizedEmployeeId);
            visitPurposeSelector.setValue(data.visit.visitPurpose);

            frmVisitRecord.querySelectorAll("input[name], textarea[name]").forEach(element => {
                const fieldName = element.name;

                if (data.visit.hasOwnProperty(fieldName)) {
                    const value = data.visit[fieldName];
                    element.value = value;
                }
            });

            // btnSaveVisitor.classList.add('d-none');
            // btnUpdateVisitor.classList.remove('d-none');
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

document.addEventListener('DOMContentLoaded', function () {
    GetSelects();
    getAllVisitRecord();

    btnModalVisitRecord.addEventListener('click', function () {
        frmVisitRecord.reset();
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
            VisitPurpose: visitPurposeSelector.value,
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
