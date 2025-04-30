// Please see documentation at https://learn.microsoft.com/aspnet/core/client-side/bundling-and-minification
// for details on configuring this project to bundle and minify static web assets.

// Write your JavaScript code.
/**
 * Script para manejar el cierre de sesión en ChronosSuite
 * Este script se encarga de eliminar el token JWT almacenado en localStorage
 * cuando el usuario cierra sesión.
 */

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