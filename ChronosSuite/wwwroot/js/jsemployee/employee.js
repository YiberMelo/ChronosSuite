function getAllEmployees() {
    const columnsEmployees = [
        { field: 'id', title: 'ID', sortable: true, filterControl: 'input', align: 'center' },
        { field: 'firstName', title: 'Nombre', sortable: true, filterControl: 'input', align: 'center' },
        { field: 'lastName', title: 'Apellido', sortable: true, filterControl: 'input', align: 'center' },
        { field: 'position', title: 'Cargo', sortable: true, filterControl: 'input', align: 'center' },
        { field: 'email', title: 'Email', sortable: true, filterControl: 'input', align: 'center' },
        { field: 'phoneNumber', title: 'Teléfono', sortable: true, filterControl: 'input', align: 'center' },
        { field: 'company', title: 'Empresa', sortable: true, filterControl: 'input', align: 'center' }
    ];

    $('#tbAllEmployees').bootstrapTable({
        locale: 'es-MX',
        url: '/Employee/GetAll',
        method: 'post',
        columns: columnsEmployees,
        pagination: true,
        sidePagination: 'server',
        showRefresh: true,
        showExport: true,
        showToggle: true,
        showFullscreen: true,
        showColumns: true,
        showColumnsToggleAll: true,
        pageSize: 18,
        pageList: [18, 25, 50, 100],
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
                filter: getFilters('tbAllEmployees')
            };
        },
        responseHandler: function (res) {
            console.log('JSON recibido:', res);
            return res;
        }
    });
}

document.addEventListener('DOMContentLoaded', function () {
    getAllEmployees();
});