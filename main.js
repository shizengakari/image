document.addEventListener('DOMContentLoaded', () => {
    // --- Elements ---
    const uploadView = document.getElementById('upload-view');
    const editorView = document.getElementById('editor-view');
    const imageUpload = document.getElementById('image-upload');
    const imageWorkspace = document.getElementById('image-workspace');
    const container = document.getElementById('cropper-container');
    const cropBoxEl = document.getElementById('crop-box');
    
    const btnBack = document.getElementById('btn-back');
    const btnExport = document.getElementById('btn-export');
    const brightnessSlider = document.getElementById('brightness-slider');
    const brightnessVal = document.getElementById('brightness-val');

    // --- State ---
    const ASPECT_RATIO = 4 / 5;
    let currentFileName = 'edited_image.jpg';
    let imageNaturalWidth = 0;
    let imageNaturalHeight = 0;
    
    // Geometry
    let imgRect = { x: 0, y: 0, w: 0, h: 0 }; // Image rendered size and position
    let cropBox = { x: 0, y: 0, w: 0, h: 0 }; // Crop box size and position relative to container

    // Interaction State
    let isDragging = false;
    let dragType = null; // 'move', 'nw', 'ne', 'sw', 'se'
    let startX = 0;
    let startY = 0;
    let initialCropBox = null;

    // --- View Navigation ---
    const showEditor = () => {
        uploadView.classList.remove('active');
        editorView.classList.add('active');
    };

    const showUpload = () => {
        editorView.classList.remove('active');
        uploadView.classList.add('active');
        imageUpload.value = '';
        imageWorkspace.src = '';
        brightnessSlider.value = 100;
        updateBrightnessUI(100);
    };

    // --- Brightness Logic ---
    const updateBrightnessUI = (val) => {
        const displayVal = val - 100;
        brightnessVal.textContent = displayVal > 0 ? `+${displayVal}` : displayVal;
        imageWorkspace.style.filter = `brightness(${val}%)`;
    };

    brightnessSlider.addEventListener('input', (e) => {
        updateBrightnessUI(e.target.value);
    });

    // --- File Upload ---
    imageUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const nameParts = file.name.split('.');
        nameParts.pop();
        currentFileName = `${nameParts.join('.')}_4x5.jpg`;

        const reader = new FileReader();
        reader.onload = (event) => {
            imageWorkspace.src = event.target.result;
            imageWorkspace.onload = () => {
                imageNaturalWidth = imageWorkspace.naturalWidth;
                imageNaturalHeight = imageWorkspace.naturalHeight;
                showEditor();
                initCustomCropper();
            };
        };
        reader.readAsDataURL(file);
    });

    // --- Custom Cropper Logic ---
    const initCustomCropper = () => {
        const contW = container.clientWidth;
        const contH = container.clientHeight;

        // Calculate image rendering size (fit within container)
        const scaleX = contW / imageNaturalWidth;
        const scaleY = contH / imageNaturalHeight;
        const scale = Math.min(scaleX, scaleY) * 0.95; // 95% to leave a tiny margin

        imgRect.w = imageNaturalWidth * scale;
        imgRect.h = imageNaturalHeight * scale;
        imgRect.x = (contW - imgRect.w) / 2;
        imgRect.y = (contH - imgRect.h) / 2;

        imageWorkspace.style.width = `${imgRect.w}px`;
        imageWorkspace.style.height = `${imgRect.h}px`;
        imageWorkspace.style.left = `${imgRect.x}px`;
        imageWorkspace.style.top = `${imgRect.y}px`;

        // Calculate initial crop box (max 4:5 area within the image)
        const maxCropW = imgRect.w;
        const maxCropH = maxCropW / ASPECT_RATIO;
        
        if (maxCropH <= imgRect.h) {
            cropBox.w = maxCropW;
            cropBox.h = maxCropH;
        } else {
            cropBox.h = imgRect.h;
            cropBox.w = cropBox.h * ASPECT_RATIO;
        }

        // Slightly smaller for better UX
        cropBox.w *= 0.9;
        cropBox.h *= 0.9;
        
        cropBox.x = imgRect.x + (imgRect.w - cropBox.w) / 2;
        cropBox.y = imgRect.y + (imgRect.h - cropBox.h) / 2;

        renderCropBox();
    };

    const renderCropBox = () => {
        cropBoxEl.style.left = `${cropBox.x}px`;
        cropBoxEl.style.top = `${cropBox.y}px`;
        cropBoxEl.style.width = `${cropBox.w}px`;
        cropBoxEl.style.height = `${cropBox.h}px`;
    };

    const clamp = (val, min, max) => Math.max(min, Math.min(max, val));

    // Pointer Events for Cropping
    const onPointerDown = (e) => {
        if (!editorView.classList.contains('active')) return;
        
        // Prevent default browser behaviors like scrolling
        e.preventDefault(); 
        
        // Determine drag target
        if (e.target.classList.contains('handle')) {
            dragType = e.target.getAttribute('data-dir');
        } else if (e.target.closest('#crop-box')) {
            dragType = 'move';
        } else {
            return; // Clicked outside
        }

        isDragging = true;
        startX = e.clientX || (e.touches && e.touches[0].clientX);
        startY = e.clientY || (e.touches && e.touches[0].clientY);
        initialCropBox = { ...cropBox };
    };

    const onPointerMove = (e) => {
        if (!isDragging) return;
        e.preventDefault();

        const currentX = e.clientX || (e.touches && e.touches[0].clientX);
        const currentY = e.clientY || (e.touches && e.touches[0].clientY);
        
        const dx = currentX - startX;
        const dy = currentY - startY;

        if (dragType === 'move') {
            cropBox.x = clamp(initialCropBox.x + dx, imgRect.x, imgRect.x + imgRect.w - cropBox.w);
            cropBox.y = clamp(initialCropBox.y + dy, imgRect.y, imgRect.y + imgRect.h - cropBox.h);
        } else {
            // Resizing logic keeping 4:5 ratio
            let newW = initialCropBox.w;
            let newH = initialCropBox.h;
            let newX = initialCropBox.x;
            let newY = initialCropBox.y;

            // We use dx to drive the size change, except when dragging vertically makes more sense
            // To make it intuitive, we calculate size change based on the axis they moved most
            let dw = 0;
            
            if (dragType === 'se') {
                dw = Math.max(dx, dy * ASPECT_RATIO);
                newW = initialCropBox.w + dw;
                newH = newW / ASPECT_RATIO;
            } else if (dragType === 'sw') {
                dw = Math.max(-dx, dy * ASPECT_RATIO);
                newW = initialCropBox.w + dw;
                newH = newW / ASPECT_RATIO;
                newX = initialCropBox.x - (newW - initialCropBox.w);
            } else if (dragType === 'ne') {
                dw = Math.max(dx, -dy * ASPECT_RATIO);
                newW = initialCropBox.w + dw;
                newH = newW / ASPECT_RATIO;
                newY = initialCropBox.y - (newH - initialCropBox.h);
            } else if (dragType === 'nw') {
                dw = Math.max(-dx, -dy * ASPECT_RATIO);
                newW = initialCropBox.w + dw;
                newH = newW / ASPECT_RATIO;
                newX = initialCropBox.x - (newW - initialCropBox.w);
                newY = initialCropBox.y - (newH - initialCropBox.h);
            }

            // Min size
            if (newW < 100) {
                newW = 100;
                newH = newW / ASPECT_RATIO;
                // Revert positions if hit min limit
                if (dragType === 'sw' || dragType === 'nw') newX = initialCropBox.x + initialCropBox.w - newW;
                if (dragType === 'nw' || dragType === 'ne') newY = initialCropBox.y + initialCropBox.h - newH;
            }

            // Clamp to image bounds
            if (newX < imgRect.x) {
                const diff = imgRect.x - newX;
                newX = imgRect.x;
                newW -= diff;
                newH = newW / ASPECT_RATIO;
                if (dragType === 'nw' || dragType === 'ne') newY = initialCropBox.y + initialCropBox.h - newH;
            }
            if (newY < imgRect.y) {
                const diff = imgRect.y - newY;
                newY = imgRect.y;
                newH -= diff;
                newW = newH * ASPECT_RATIO;
                if (dragType === 'nw' || dragType === 'sw') newX = initialCropBox.x + initialCropBox.w - newW;
            }
            if (newX + newW > imgRect.x + imgRect.w) {
                newW = imgRect.x + imgRect.w - newX;
                newH = newW / ASPECT_RATIO;
                if (dragType === 'nw' || dragType === 'ne') newY = initialCropBox.y + initialCropBox.h - newH;
            }
            if (newY + newH > imgRect.y + imgRect.h) {
                newH = imgRect.y + imgRect.h - newY;
                newW = newH * ASPECT_RATIO;
                if (dragType === 'nw' || dragType === 'sw') newX = initialCropBox.x + initialCropBox.w - newW;
            }

            cropBox.x = newX;
            cropBox.y = newY;
            cropBox.w = newW;
            cropBox.h = newH;
        }

        renderCropBox();
    };

    const onPointerUp = () => {
        isDragging = false;
        dragType = null;
    };

    // Use touch events for mobile, mouse events for PC
    container.addEventListener('touchstart', onPointerDown, { passive: false });
    document.addEventListener('touchmove', onPointerMove, { passive: false });
    document.addEventListener('touchend', onPointerUp);
    
    container.addEventListener('mousedown', onPointerDown);
    document.addEventListener('mousemove', onPointerMove);
    document.addEventListener('mouseup', onPointerUp);

    // Prevent default drag
    container.addEventListener('dragstart', e => e.preventDefault());

    // --- Actions ---
    btnBack.addEventListener('click', showUpload);

    btnExport.addEventListener('click', () => {
        const originalText = btnExport.textContent;
        btnExport.textContent = '処理中...';
        btnExport.disabled = true;
        btnExport.style.cursor = 'wait';
        btnExport.style.opacity = '0.7';

        setTimeout(() => {
            // Calculate actual crop coordinates on the original image
            const scale = imageNaturalWidth / imgRect.w;
            const cropX = (cropBox.x - imgRect.x) * scale;
            const cropY = (cropBox.y - imgRect.y) * scale;
            const cropW = cropBox.w * scale;
            const cropH = cropBox.h * scale;

            // Apply brightness to the final image
            const finalCanvas = document.createElement('canvas');
            finalCanvas.width = cropW;
            finalCanvas.height = cropH;
            const ctx = finalCanvas.getContext('2d');

            ctx.filter = `brightness(${brightnessSlider.value}%)`;
            
            // Draw cropped area
            ctx.drawImage(
                imageWorkspace,
                cropX, cropY, cropW, cropH,
                0, 0, cropW, cropH
            );

            finalCanvas.toBlob((blob) => {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = currentFileName;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);

                btnExport.textContent = originalText;
                btnExport.disabled = false;
                btnExport.style.cursor = 'pointer';
                btnExport.style.opacity = '1';
            }, 'image/jpeg', 0.9);
        }, 50);
    });
});
