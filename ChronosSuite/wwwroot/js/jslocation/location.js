function getAllLocations() {
    const columnsLocations = [
        { field: 'id', title: 'ID', sortable: true, filterControl: 'input', align: 'center' },
        { field: 'name', title: 'Nombre', sortable: true, filterControl: 'input', align: 'center' },
        { field: 'description', title: 'Descripción', sortable: true, filterControl: 'input', align: 'center' }
    ];

    $('#tbAllLocations').bootstrapTable({
        locale: 'es-MX',
        url: '/Location/GetAll',
        method: 'post',
        columns: columnsLocations,
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
                filter: getFilters('tbAllLocations')
            };
        },
        responseHandler: function (res) {
            console.log('JSON recibido:', res);
            return res;
        }
    });
}

document.addEventListener('DOMContentLoaded', function () {
    getAllLocations();
});