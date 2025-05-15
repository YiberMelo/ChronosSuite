const btnShowModalVistor = document.getElementById('btnShowModalVistor');
const modalVistor = new bootstrap.Modal(document.getElementById('modalVistor'));

const photoContainer = document.getElementById('photoContainer');

const companySelector = document.getElementById('companySelector');
const genderSelector = document.getElementById('genderSelector');
const bloodTypeSelector = document.getElementById('bloodTypeSelector');

const frmVisitor = document.getElementById('frmVisitor');
const btnSaveVisitor = document.getElementById('btnSaveVisitor');
const btnUpdateVisitor = document.getElementById('btnUpdateVisitor');

initSingleVirtualSelect('#companySelector', 'Seleccionar Empresa');
initSingleVirtualSelect('#genderSelector', 'Seleccionar el genero');
initSingleVirtualSelect('#bloodTypeSelector', 'Seleccionar uno');

let idVisitor = {};

async function getImageBase64(imgElement) {
    const src = imgElement?.src;

    if (!src) throw new Error("La imagen no tiene una fuente válida");

    // Si ya es Base64
    if (src.startsWith('data:image/')) {
        return src.split(",")[1];
    }

    // Convertir imagen desde URL
    const response = await fetch(src);
    if (!response.ok) {
        throw new Error('No se pudo cargar la imagen');
    }

    const blob = await response.blob();

    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result.split(",")[1];
            resolve(base64String);
        };
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(blob);
    });
}

function selectors() {
    var optionsGender = [
        { label: "MASCULINO", value: "MASCULINO" },
        { label: "FEMENINO", value: "FEMENINO" },
        { label: "PREFIERO NO DECIR", value: "PREFIERO NO DECIR" }
    ]

    genderSelector.setOptions(optionsGender);

    var optionsBloodType = [
        { label: "O+", value: "O+" },
        { label: "O-", value: "O-" },
        { label: "A+", value: "A+" },
        { label: "A-", value: "A-" },
        { label: "B+", value: "B+" },
        { label: "B-", value: "B-" },
        { label: "AB+", value: "AB+" },
        { label: "AB-", value: "AB-" }
    ];

    bloodTypeSelector.setOptions(optionsBloodType);
}

function GetListCompany() {
    $.ajax({
        url: '/Company/GetList',
        method: 'GET',
        dataType: 'json',
        success: function (data) {
            companySelector.setOptions(data);
        },
    });
}

function getAllVisitors() {
    const columnsVisitors = [
        {
            field: 'photo',
            title: 'Foto',
            align: 'center',
            formatter: function (value) {
                return `<img src="data:image/jpeg;base64,${value}" alt="Foto" class="img-fluid rounded-pill" style="width: 50px; height: 50px;" />`;
            },
            width: 100
        },
        { field: 'identification', title: 'Identificación', sortable: true, filterControl: 'input', align: 'center' },
        { field: 'firstName', title: 'Nombre', sortable: true, filterControl: 'input', align: 'center' },
        { field: 'lastName', title: 'Apellido', sortable: true, filterControl: 'input', align: 'center' },
        { field: 'company', title: 'Empresa', sortable: true, filterControl: 'input', align: 'center' },
        { field: 'gender', title: 'Género', sortable: true, filterControl: 'input', align: 'center' },
        { field: 'bloodType', title: 'Tipo de Sangre', sortable: true, filterControl: 'input', align: 'center' },
        { field: 'phoneNumber', title: 'Teléfono', sortable: true, filterControl: 'input', align: 'center' },
        { field: 'email', title: 'Correo Electrónico', sortable: true, filterControl: 'input', align: 'center' },
        { field: 'address', title: 'Dirección', sortable: true, filterControl: 'input', align: 'center' },
        { field: 'dateOfBirth', title: 'Fecha de Nacimiento', sortable: false, align: 'center' },
        {
            field: 'actions',
            title: 'Acciones',
            align: 'center',
            formatter: function (value, row) {
                return `
                    <button class="btn btn-warning btn-sm" onclick="getById('${row.id}')">
                        <i class="bi bi-pencil-fill"></i>
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="deleteVisitor('${row.id}')">
                        <i class="bi bi-trash-fill"></i>
                    </button>
                `;
            },
            searchable: false,
            sortable: false,
            filterControl: false
        }
    ];

    $('#tbAllvisitors').bootstrapTable({
        locale: 'es-MX',
        url: '/Visitor/GetAll',
        method: 'post',
        columns: columnsVisitors,
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
                filter: getFilters('tbAllvisitors')
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
        url: `${'/Visitor/GetById'}?id=${id}`,
        type: 'GET',
        dataType: 'json',
        success: function (data) {
            frmVisitor.reset();
            idVisitor = data.visitor.id;

            photoContainer.src = data.visitor.photo;
            companySelector.setValue(data.visitor.companyId);
            genderSelector.setValue(data.visitor.gender);
            bloodTypeSelector.setValue(data.visitor.bloodType);

            frmVisitor.querySelectorAll("input[name], select[name], textarea[name]").forEach(element => {
                const fieldName = element.name;

                if (data.visitor.hasOwnProperty(fieldName)) {
                    const value = data.visitor[fieldName];
                    if (element.tagName === "SELECT") {
                        element.value = value;
                        element.dispatchEvent(new Event('change'));
                    } else {
                        element.value = value;
                    }
                }
            });

            btnSaveVisitor.classList.add('d-none');
            btnUpdateVisitor.classList.remove('d-none');
            modalVistor.show();
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

function deleteVisitor(id) {
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
                url: `${'/Visitor/Delete'}?id=${id}`,
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
                        $('#tbAllvisitors').bootstrapTable('refresh');
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
    getAllVisitors();
    selectors();
    GetListCompany();

    btnShowModalVistor.addEventListener('click', function () {
        frmVisitor.reset();
        photoContainer.src = '/images/Chronos.png';
        btnSaveVisitor.classList.remove('d-none');
        btnUpdateVisitor.classList.add('d-none');
        modalVistor.show();
    });

    btnSaveVisitor.addEventListener('click', async function () {
        const img = document.getElementById('photoContainer');
        let photo = '';

        try {
            photo = await getImageBase64(img);
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Error al procesar la imagen',
                text: error.message || 'No se pudo convertir la imagen a Base64.'
            });
            return;
        }
        const visitorData = {
            CompanyId: companySelector.value,
            Gender: genderSelector.value,
            BloodType: bloodTypeSelector.value,
            Photo: photo
        };

        frmVisitor.querySelectorAll('input, select, textarea').forEach((element) => {
            if (element.name && element.name.trim() !== "") {
                let value = element.value.trim();

                if (element.name !== 'name' && element.name !== 'email') {
                    value = value.toUpperCase();
                }

                if (value.toLowerCase() === 'true') {
                    value = true;
                } else if (value.toLowerCase() === 'false') {
                    value = false;
                }

                visitorData[element.name] = value;
            }
        });

        Swal.fire({
            title: 'Cargando...',
            text: 'Por favor, espere mientras se crea el visitante.',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        $.ajax({
            type: "Post",
            url: '/Visitor/Save',
            data: JSON.stringify(visitorData),
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

                    $('#tbAllvisitors').bootstrapTable('refresh');
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
                    text: 'Hubo un problema al guardar el visitante. Por favor, inténtelo de nuevo.'
                });
            }
        });
        modalVistor.hide();
    })

    btnUpdateVisitor.addEventListener('click', async function () {
        const img = document.getElementById('photoContainer');
        let photo = '';

        try {
            photo = await getImageBase64(img);
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Error al procesar la imagen',
                text: error.message || 'No se pudo convertir la imagen a Base64.'
            });
            return;
        }
        const visitorData = {
            Id: idVisitor,
            CompanyId: companySelector.value,
            Gender: genderSelector.value,
            BloodType: bloodTypeSelector.value,
            Photo: photo
        };

        frmVisitor.querySelectorAll('input, select, textarea').forEach((element) => {
            if (element.name && element.name.trim() !== "") {
                let value = element.value.trim();

                if (element.name !== 'name' && element.name !== 'email') {
                    value = value.toUpperCase();
                }

                if (value.toLowerCase() === 'true') {
                    value = true;
                } else if (value.toLowerCase() === 'false') {
                    value = false;
                }

                visitorData[element.name] = value;
            }
        });

        Swal.fire({
            title: 'Cargando...',
            text: 'Por favor, espere mientras se acualiza el visitante.',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        $.ajax({
            type: "PUT",
            url: '/Visitor/Update',
            data: JSON.stringify(visitorData),
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

                    $('#tbAllvisitors').bootstrapTable('refresh');
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
                    text: 'Hubo un problema al actualizar el visitante. Por favor, inténtelo de nuevo.'
                });
            }
        });
        modalVistor.hide();
    })
});
