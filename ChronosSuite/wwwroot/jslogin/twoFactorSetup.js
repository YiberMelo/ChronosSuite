let generatedSecret = "";
let savedUsername = "";

function GenerateQrAndSecret() {
    $.ajax({
        type: "POST",
        url: "/Login/GenerateQrAndSecret",
        success: function (response) {
            if (response.success) {
                document.getElementById("authQrImg").src = response.qrCodeImage;
                document.getElementById("authCode").textContent = response.manualCode;
                generatedSecret = response.manualCode;
            } else {
                Swal.fire({ icon: 'error', title: 'Error', text: response.message });
            }
        },
        error: function () {
            Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo generar el código QR.' });
        }
    });
}

document.addEventListener("DOMContentLoaded", () => {
    GenerateQrAndSecret();

    // 2. Verificar el código y guardar el secreto si es válido
    document.getElementById("btnSaveQrCode").addEventListener("click", () => {
        const usernameInput = document.querySelector('input[name="UserName"]');
        savedUsername = usernameInput ? usernameInput.value : "";

        if (!savedUsername) {
            Swal.fire({
                icon: 'warning',
                title: 'Falta el usuario',
                text: 'Por favor ingresa el nombre de usuario antes de registrar el QR.'
            });
            return;
        }

        Swal.fire({
            title: 'Verificación de código',
            html: `<p>Ingresa el código de 6 dígitos</p>
                <input id="inputAuthCode" type="text" class="swal2-input" maxlength="6" placeholder="123456">`,
            showCancelButton: true,
            confirmButtonText: 'Verificar',
            cancelButtonText: 'Cancelar',
            preConfirm: () => {
                const code = document.getElementById("inputAuthCode").value;
                if (!code || code.length !== 6) {
                    Swal.showValidationMessage("Ingresa un código válido de 6 dígitos");
                    return false;
                }
                return code;
            }
        }).then(result => {
            if (result.isConfirmed) {
                const code = result.value;

                $.ajax({
                    type: "POST",
                    url: "/Login/VerifyTempCode",
                    data: { code, secret: generatedSecret },
                    success: function (res) {
                        if (res.success) {
                            // 4. Guardar el secreto en el usuario
                            $.ajax({
                                type: "POST",
                                url: "/Login/SaveTwoFactorSecret",
                                data: { username: savedUsername, secret: generatedSecret },
                                success: function (saveRes) {
                                    if (saveRes.success) {
                                        Swal.fire({
                                            icon: 'success',
                                            title: '2FA activado',
                                            text: saveRes.message,
                                            timer: 2000,
                                            showConfirmButton: false
                                        }).then(() => window.location.reload());
                                    } else {
                                        Swal.fire({ icon: 'error', title: 'Error', text: saveRes.message });
                                    }
                                },
                                error: function () {
                                    Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo guardar el secreto.' });
                                }
                            });
                        } else {
                            Swal.fire({ icon: 'error', title: 'Código incorrecto', text: res.message });
                        }
                    },
                    error: function () {
                        Swal.fire({ icon: 'error', title: 'Error', text: 'Error al verificar el código.' });
                    }
                });
            }
        });
    });

});