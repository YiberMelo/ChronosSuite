const btnShowModalCompany = document.getElementById('btnShowModalCompany');
const modalCompany = new bootstrap.Modal(document.getElementById('modalCompany'));
const frmCompany = document.getElementById('frmCompany');
const btnSaveCompany = document.getElementById('btnSaveCompany');
const btnUpdateCompany = document.getElementById('btnUpdateCompany');

let idCompany = 0;

function getAllCompanies() {
    const columnsCompanies = [
        { field: 'id', title: 'ID', sortable: true, filterControl: 'input', align: 'center' },
        { field: 'name', title: 'Nombre', sortable: true, filterControl: 'input', align: 'center' },
        {
            field: 'actions',
            title: 'Acciones',
            align: 'center',
            formatter: function (value, row) {
                return `
                    <button class="btn btn-warning btn-sm" onclick="getById('${row.id}')">
                        <i class="bi bi-pencil-fill"></i>
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="deleteCompany('${row.id}')">
                        <i class="bi bi-trash-fill"></i>
                    </button>
                `;
            },
            searchable: false,
            sortable: false,
            filterControl: false
        }
    ];

    $('#tbAllCompanies').bootstrapTable({
        locale: 'es-MX',
        url: '/Company/GetAll',
        method: 'post',
        columns: columnsCompanies,
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
                filter: getFilters('tbAllCompanies')
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
        url: `${'/Company/GetById'}?id=${id}`,
        type: 'GET',
        dataType: 'json',
        success: function (data) {
            frmCompany.reset();
            idCompany = data.company.id;

            frmCompany.querySelectorAll("input[name], select[name], textarea[name]").forEach(element => {
                const fieldName = element.name;

                if (data.company.hasOwnProperty(fieldName.toLowerCase())) {
                    const value = data.company[fieldName.toLowerCase()];
                    if (element.tagName === "SELECT") {
                        element.value = value;
                        element.dispatchEvent(new Event('change'));
                    } else {
                        element.value = value;
                    }
                }
            });

            btnSaveCompany.classList.add('d-none');
            btnUpdateCompany.classList.remove('d-none');
            modalCompany.show();
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

function deleteCompany(id) {
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
                url: `${'/Company/Delete'}?id=${id}`,
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
                        $('#tbAllCompanies').bootstrapTable('refresh');
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
                        text: 'No se pudo eliminar la empresa. Inténtalo de nuevo.'
                    });
                }
            });
        }
    });
}

document.addEventListener('DOMContentLoaded', function () {
    getAllCompanies();

    btnShowModalCompany.addEventListener('click', function () {
        frmCompany.reset();
        idCompany = 0;
        btnSaveCompany.classList.remove('d-none');
        btnUpdateCompany.classList.add('d-none');
        modalCompany.show();
    });

    btnSaveCompany.addEventListener('click', function () {
        if (!frmCompany.checkValidity()) {
            frmCompany.reportValidity();
            return;
        }

        const companyData = {};

        frmCompany.querySelectorAll('input, select, textarea').forEach((element) => {
            if (element.name && element.name.trim() !== "") {
                let value = element.value.trim();
                companyData[element.name] = value;
            }
        });

        $.ajax({
            type: "POST",
            url: '/Company/Save',
            data: JSON.stringify(companyData),
            contentType: "application/json",
            success: function (response) {
                if (response.success) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Guardado',
                        text: response.message,
                        showConfirmButton: false,
                        timer: 2500
                    });
                    $('#tbAllCompanies').bootstrapTable('refresh');
                    modalCompany.hide();
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
                    text: 'Ha ocurrido un error al guardar los datos. Por favor, inténtelo de nuevo.'
                });
            }
        });
    });

    btnUpdateCompany.addEventListener('click', function () {
        if (!frmCompany.checkValidity()) {
            frmCompany.reportValidity();
            return;
        }

        const companyData = {
            Id: idCompany
        };

        frmCompany.querySelectorAll('input, select, textarea').forEach((element) => {
            if (element.name && element.name.trim() !== "") {
                let value = element.value.trim();
                companyData[element.name] = value;
            }
        });

        $.ajax({
            type: "PUT",
            url: '/Company/Update',
            data: JSON.stringify(companyData),
            contentType: "application/json",
            success: function (response) {
                if (response.success) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Actualizado',
                        text: response.message,
                        showConfirmButton: false,
                        timer: 2500
                    });
                    $('#tbAllCompanies').bootstrapTable('refresh');
                    modalCompany.hide();
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
                    text: 'Ha ocurrido un error al actualizar los datos. Por favor, inténtelo de nuevo.'
                });
            }
        });
    });
});