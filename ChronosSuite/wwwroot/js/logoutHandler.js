/**
 * Script para manejar el cierre de sesión en ChronosSuite
 * Este script se encarga de eliminar el token JWT almacenado en localStorage
 * cuando el usuario cierra sesión.
 */
function handleLogout() {
    // Eliminar el token JWT del localStorage
    localStorage.removeItem('chronos_token');
    
    // Redireccionar a la página de login directamente
    window.location.href = '/Login';
}

// Inicializar los event listeners cuando el DOM esté cargado
document.addEventListener('DOMContentLoaded', function() {
    // Buscar todos los enlaces de cierre de sesión
    const logoutLinks = document.querySelectorAll('#logout-link');
    
    // Agregar el event listener a cada enlace
    logoutLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault(); // Prevenir la navegación predeterminada
            
            // Eliminar el token JWT y otros datos de sesión
            handleLogout();
            
            // Hacer una petición al servidor para cerrar la sesión en el lado del servidor
            fetch('/Login/SignOut', {
                method: 'GET',
                credentials: 'include'
            }).then(() => {
                // Redireccionar a la página de login
                window.location.href = '/Login';
            }).catch(() => {
                // Si hay un error, redireccionar de todos modos
                window.location.href = '/Login';
            });
        });
    });
});