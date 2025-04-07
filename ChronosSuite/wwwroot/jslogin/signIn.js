const pswd = document.getElementById('pswd');
const togglePasswordButton = document.getElementById('toggle-password');
const togglePasswordIcon = togglePasswordButton.querySelector('i');

const btnSignIn = document.getElementById('btnSignIn');
const frmLogin = document.getElementById('frmLogin');

document.addEventListener('DOMContentLoaded', function () {
    btnSignIn.addEventListener('click', () => {
        const loginData = {};
    
        frmLogin.querySelectorAll('input, select, textarea').forEach((element) => {
            if (element.name && element.name.trim() !== "") {
                loginData[element.name] = element.value.trim();
            }
        });
    
        Swal.fire({
            title: 'Cargando...',
            text: 'Por favor, espere mientras validamos los datos',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });
    
        $.ajax({
            type: "POST",
            url: '/Login/SignIn',
            data: JSON.stringify(loginData),
            contentType: "application/json",
            dataType: "json",
            success: function (response) {
                if (response.success && response.require2fa) {
                    const username = response.user;
    
                    Swal.fire({
                        title: 'Autenticación en dos pasos',
                        html: `
                            <p>Ingresa el código de 6 dígitos de Google Authenticator</p>
                            <input id="authCodeInput" type="text" class="swal2-input" maxlength="6" placeholder="123456">
                        `,
                        showCancelButton: true,
                        confirmButtonText: 'Verificar código',
                        cancelButtonText: 'Cancelar',
                        preConfirm: () => {
                            const code = document.getElementById('authCodeInput').value;
                            if (!code || code.length !== 6) {
                                Swal.showValidationMessage('Ingresa un código válido de 6 dígitos');
                                return false;
                            }
                            return code;
                        }
                    }).then(result => {
                        if (result.isConfirmed) {
                            const code = result.value;
    
                            $.ajax({
                                type: "POST",
                                url: "/Login/VerifyCode",
                                data: { username, code },
                                success: function (res) {
                                    if (res.success) {
                                        const dataWithSkip2FA = {
                                            ...loginData,
                                            SkipTwoFactor: true
                                        };
    
                                        $.ajax({
                                            type: "POST",
                                            url: '/Login/SignIn',
                                            data: JSON.stringify(dataWithSkip2FA),
                                            contentType: "application/json",
                                            dataType: "json",
                                            success: function (finalRes) {
                                                if (finalRes.success) {
                                                    Swal.fire({
                                                        icon: 'success',
                                                        title: 'Sesión iniciada',
                                                        text: 'Verificación 2FA exitosa',
                                                        showConfirmButton: false,
                                                        timer: 2000
                                                    }).then(() => window.location.reload());
                                                } else {
                                                    Swal.fire({
                                                        icon: 'error',
                                                        title: 'Error',
                                                        text: finalRes.message || 'Ocurrió un problema al iniciar sesión.'
                                                    });
                                                }
                                            },
                                            error: function () {
                                                Swal.fire({
                                                    icon: 'error',
                                                    title: 'Error',
                                                    text: 'Hubo un error al completar la autenticación.'
                                                });
                                            }
                                        });
                                    } else {
                                        Swal.fire({
                                            icon: 'error',
                                            title: 'Código incorrecto',
                                            text: res.message || 'El código ingresado no es válido.'
                                        });
                                    }
                                },
                                error: function () {
                                    Swal.fire({
                                        icon: 'error',
                                        title: 'Error',
                                        text: 'No se pudo verificar el código. Inténtalo de nuevo.'
                                    });
                                }
                            });
                        }
                    });
    
                } else if (response.success) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Bienvenido',
                        text: 'Sesión iniciada con éxito',
                        showConfirmButton: false,
                        timer: 2000
                    }).then(() => {
                        window.location.reload();
                    });
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: response.message || 'Credenciales incorrectas.'
                    });
                }
            },
            error: function () {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Hubo un problema al iniciar sesión. Por favor, inténtelo de nuevo.'
                });
            }
        });
    });
        
    togglePasswordButton.addEventListener('click', () => {
        const type = pswd.getAttribute('type') === 'password' ? 'text' : 'password';
        pswd.setAttribute('type', type);

        togglePasswordIcon.classList.toggle('bi-eye-fill');
        togglePasswordIcon.classList.toggle('bi-eye-slash-fill');
    });
})