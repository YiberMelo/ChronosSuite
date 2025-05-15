const cameraButton = document.getElementById('btnCamera');
const captureButton = document.getElementById('btnCapturePhoto');
const uploadButton = document.getElementById('btnUploadPhoto');
const photoInput = document.getElementById('photoInput');
const video = document.getElementById('camera');
const canvas = document.getElementById('photoCanvas');
let stream = null;

document.addEventListener('DOMContentLoaded', function () {
    cameraButton.addEventListener('click', async function () {
        try {
            stream = await navigator.mediaDevices.getUserMedia({ video: true });
            video.srcObject = stream;
            video.play();
            video.classList.remove('d-none');
            captureButton.classList.remove('d-none');
            cameraButton.classList.add('d-none');
            photoContainer.classList.add('d-none'); // OCULTA la imagen de perfil
        } catch (err) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudo acceder a la cámara: ' + err.message
            });
        }
    });

    // Capturar la foto
    captureButton.addEventListener('click', function () {
        const context = canvas.getContext('2d');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Detener la cámara
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }

        const photoData = canvas.toDataURL('image/png');
        photoContainer.src = photoData;

        video.classList.add('d-none');
        captureButton.classList.add('d-none');
        cameraButton.classList.remove('d-none');
        photoContainer.classList.remove('d-none'); // VUELVE A MOSTRAR la imagen
        Swal.fire({
            icon: 'success',
            title: 'Foto capturada',
            text: 'Se ha capturado la foto exitosamente.'
        });
    });

    // Subir una foto desde archivos
    uploadButton.addEventListener('click', function () {
        photoInput.click();
    });

    // Manejar archivo subido
    photoInput.addEventListener('change', function (event) {
        const file = event.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function (e) {
                photoContainer.src = e.target.result;
                photoContainer.classList.remove('d-none'); // Asegura que se vea
            };
            reader.readAsDataURL(file);
            Swal.fire({
                icon: 'success',
                title: 'Imagen subida',
                text: 'La imagen se cargó correctamente.'
            });
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Archivo no válido',
                text: 'Por favor seleccione un archivo de imagen (jpg o png).'
            });
        }
    });
});