document.addEventListener('DOMContentLoaded', () => {
    // --- Elements ---
    const uploadView = document.getElementById('upload-view');
    const editorView = document.getElementById('editor-view');
    const imageUpload = document.getElementById('image-upload');
    const imageWorkspace = document.getElementById('image-workspace');
    const btnBack = document.getElementById('btn-back');
    const btnExport = document.getElementById('btn-export');
    const brightnessSlider = document.getElementById('brightness-slider');
    const brightnessVal = document.getElementById('brightness-val');

    // --- State ---
    let cropper = null;
    let currentFileName = 'edited_image.jpg';

    // --- View Navigation ---
    const showEditor = () => {
        uploadView.classList.remove('active');
        editorView.classList.add('active');
    };

    const showUpload = () => {
        editorView.classList.remove('active');
        uploadView.classList.add('active');
        if (cropper) {
            cropper.destroy();
            cropper = null;
        }
        imageUpload.value = '';
        brightnessSlider.value = 100;
        updateBrightnessUI(100);
    };

    // --- Brightness Logic ---
    const updateBrightnessUI = (val) => {
        // Display value mapped to -100 to +100 for user friendliness
        const displayVal = val - 100;
        brightnessVal.textContent = displayVal > 0 ? `+${displayVal}` : displayVal;
        
        // Apply filter to the cropper elements so user sees real-time preview
        // Cropper.js generates .cropper-canvas and .cropper-view-box
        const cropperCanvas = document.querySelector('.cropper-canvas');
        const cropperViewBox = document.querySelector('.cropper-view-box');
        
        if (cropperCanvas) cropperCanvas.style.filter = `brightness(${val}%)`;
        if (cropperViewBox) cropperViewBox.style.filter = `brightness(${val}%)`;
    };

    brightnessSlider.addEventListener('input', (e) => {
        updateBrightnessUI(e.target.value);
    });

    // --- File Upload ---
    imageUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Save original filename to use later
        const nameParts = file.name.split('.');
        nameParts.pop(); // remove ext
        currentFileName = `${nameParts.join('.')}_4x5.jpg`;

        const reader = new FileReader();
        reader.onload = (event) => {
            imageWorkspace.src = event.target.result;
            
            // Wait for image to load before cropping
            imageWorkspace.onload = () => {
                showEditor();
                initCropper();
            };
        };
        reader.readAsDataURL(file);
    });

    // --- Cropper Initialization ---
    const initCropper = () => {
        cropper = new Cropper(imageWorkspace, {
            aspectRatio: 4 / 5,
            viewMode: 1, // Restrict crop box not to exceed size of canvas
            dragMode: 'move', // Allow moving the image inside the cropper
            autoCropArea: 1,
            restore: false,
            guides: true,
            center: true,
            highlight: false,
            cropBoxMovable: true,
            cropBoxResizable: true,
            toggleDragModeOnDblclick: false,
            ready() {
                // Initialize brightness on ready
                updateBrightnessUI(brightnessSlider.value);
            }
        });
    };

    // --- Actions ---
    btnBack.addEventListener('click', showUpload);

    btnExport.addEventListener('click', () => {
        if (!cropper) return;

        // Get the cropped canvas
        const croppedCanvas = cropper.getCroppedCanvas({
            imageSmoothingEnabled: true,
            imageSmoothingQuality: 'high',
        });

        if (!croppedCanvas) return;

        // Apply brightness to the final image
        const finalCanvas = document.createElement('canvas');
        finalCanvas.width = croppedCanvas.width;
        finalCanvas.height = croppedCanvas.height;
        const ctx = finalCanvas.getContext('2d');

        const brightness = brightnessSlider.value;
        ctx.filter = `brightness(${brightness}%)`;
        ctx.drawImage(croppedCanvas, 0, 0);

        // Convert to blob and download
        finalCanvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = currentFileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 'image/jpeg', 0.9);
    });
});
