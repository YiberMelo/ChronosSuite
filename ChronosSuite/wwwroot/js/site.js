function getFilters(tableId) {
    let filters = {};
    $('#' + tableId).find('thead input, thead select').each(function () {
        let field = $(this).closest('th').data('field');
        let value = $(this).val();

        if (value === "true") {
            filters[field] = true;
        } else if (value === "false") {
            filters[field] = false;
        } else if (value !== null && value !== "") {
            filters[field] = value;
        }
    });
    return filters;
}

// Inicializar los event listeners cuando el DOM esté cargado
document.addEventListener('DOMContentLoaded', function() {
    // Buscar todos los enlaces de cierre de sesión
    const logoutLinks = document.querySelectorAll('#logout-link');
    
    // Agregar el event listener a cada enlace
    logoutLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            // No prevenimos el comportamiento por defecto para permitir que la navegación continúe
            
            // Eliminamos el token JWT del localStorage antes de navegar
            localStorage.removeItem('chronos_token');
            
            // No necesitamos hacer una redirección manual ya que el controlador se encargará de eso
        });
    });
});

function initSingleVirtualSelect(selector, placeholder,  allowNewOption = false, disabled = false) {
    VirtualSelect.init({
        ele: selector,
        options: [],
        search: true,
        disabled: disabled,
        maxWidth: '100%',
        placeholder: placeholder,
        searchPlaceholderText: "Buscar",
        noSearchResultsText: "Sin resultados",
        noOptionsText: "Sin datos",
        allowNewOption: allowNewOption
    });
}

function initMultipleVirtualSelect(selector, placeholder, disabled = false) {
    VirtualSelect.init({
        ele: selector,
        options: [],
        multiple: true,
        search: true,
        selectAll: true,
        showSelectAll: true,
        showClear: true,
        disabled: disabled,
        maxWidth: '100%',
        placeholder: `Seleccionar ${placeholder}`,
        searchPlaceholderText: "Buscar",
        noSearchResultsText: "Sin resultados",
        noOptionsText: "Sin datos"
    });
}

function initSingleDescriptionVirtualSelect(selector, placeholder, disabled = false) {
    VirtualSelect.init({
        ele: selector,
        data: [],
        search: true,
        disabled: disabled,
        maxWidth: '100%',
        placeholder: placeholder,
        searchPlaceholderText: "Buscar",
        noSearchResultsText: "Sin resultados",
        noOptionsText: "Sin datos",
        hasOptionDescription: true
    });
}

// Script para manejar el toggle del sidebar
document.addEventListener('DOMContentLoaded', function() {
    const toggleBtn = document.getElementById('sidebarToggle');
    const sidebar = document.querySelector('.sidebar');
    const main = document.querySelector('.main');
    
    toggleBtn?.addEventListener('click', function() {
        sidebar.classList.toggle('hidden');
        main.classList.toggle('full-width');
    });
});