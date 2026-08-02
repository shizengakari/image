document.addEventListener('DOMContentLoaded', () => {
    // --- Elements ---
    const uploadView = document.getElementById('upload-view');
    const editorView = document.getElementById('editor-view');
    const completeView = document.getElementById('complete-view');
    
    const imageUpload = document.getElementById('image-upload');
    const imageWorkspace = document.getElementById('image-workspace');
    const container = document.getElementById('cropper-container');
    const cropBoxEl = document.getElementById('crop-box');
    
    const btnBack = document.getElementById('btn-back');
    const btnExport = document.getElementById('btn-export');
    const btnRestart = document.getElementById('btn-restart');
    
    const progressIndicator = document.getElementById('progress-indicator');
    const brightnessSlider = document.getElementById('brightness-slider');
    const brightnessVal = document.getElementById('brightness-val');
    const toast = document.getElementById('toast');

    // --- Queue State ---
    let imageFiles = [];
    let currentFileIndex = 0;

    // --- Cropper State ---
    const ASPECT_RATIO = 4 / 5;
    let currentFileName = 'edited_image.jpg';
    let imageNaturalWidth = 0;
    let imageNaturalHeight = 0;
    
    let imgRect = { x: 0, y: 0, w: 0, h: 0 }; 
    let cropBox = { x: 0, y: 0, w: 0, h: 0 }; 

    // Interaction State
    let isDragging = false;
    let dragType = null; 
    let startX = 0;
    let startY = 0;
    let initialCropBox = null;

    // --- View Navigation ---
    const showView = (viewEl) => {
        [uploadView, editorView, completeView].forEach(v => v.classList.remove('active'));
        viewEl.classList.add('active');
    };

    const resetApp = () => {
        showView(uploadView);
        imageUpload.value = '';
        imageFiles = [];
        currentFileIndex = 0;
        imageWorkspace.src = '';
        brightnessSlider.value = 100;
        updateBrightnessUI(100);
    };

    const showToast = (message) => {
        toast.textContent = message;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 2000);
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

    // --- File Upload & Loading ---
    const loadCurrentImage = () => {
        const file = imageFiles[currentFileIndex];
        if (!file) return;

        const nameParts = file.name.split('.');
        nameParts.pop();
        currentFileName = `${nameParts.join('.')}_4x5.jpg`;

        // Update UI
        if (imageFiles.length > 1) {
            progressIndicator.textContent = `${currentFileIndex + 1} / ${imageFiles.length}`;
            progressIndicator.style.display = 'block';
            btnExport.textContent = currentFileIndex < imageFiles.length - 1 ? '次へ' : '完了';
        } else {
            progressIndicator.style.display = 'none';
            btnExport.textContent = '保存';
        }

        // Reset state
        brightnessSlider.value = 100;
        updateBrightnessUI(100);

        const reader = new FileReader();
        reader.onload = (event) => {
            imageWorkspace.src = event.target.result;
            imageWorkspace.onload = () => {
                imageNaturalWidth = imageWorkspace.naturalWidth;
                imageNaturalHeight = imageWorkspace.naturalHeight;
                initCustomCropper();
            };
        };
        reader.readAsDataURL(file);
    };

    imageUpload.addEventListener('change', (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;
        
        imageFiles = files;
        currentFileIndex = 0;
        
        showView(editorView);
        loadCurrentImage();
    });

    // --- Custom Cropper Logic ---
    const initCustomCropper = () => {
        const contW = container.clientWidth;
        const contH = container.clientHeight;

        const scaleX = contW / imageNaturalWidth;
        const scaleY = contH / imageNaturalHeight;
        const scale = Math.min(scaleX, scaleY) * 0.95; 

        imgRect.w = imageNaturalWidth * scale;
        imgRect.h = imageNaturalHeight * scale;
        imgRect.x = (contW - imgRect.w) / 2;
        imgRect.y = (contH - imgRect.h) / 2;

        imageWorkspace.style.width = `${imgRect.w}px`;
        imageWorkspace.style.height = `${imgRect.h}px`;
        imageWorkspace.style.left = `${imgRect.x}px`;
        imageWorkspace.style.top = `${imgRect.y}px`;

        const maxCropW = imgRect.w;
        const maxCropH = maxCropW / ASPECT_RATIO;
        
        if (maxCropH <= imgRect.h) {
            cropBox.w = maxCropW;
            cropBox.h = maxCropH;
        } else {
            cropBox.h = imgRect.h;
            cropBox.w = cropBox.h * ASPECT_RATIO;
        }

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
        
        e.preventDefault(); 
        
        if (e.target.classList.contains('handle')) {
            dragType = e.target.getAttribute('data-dir');
        } else if (e.target.closest('#crop-box')) {
            dragType = 'move';
        } else {
            return; 
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
            let newW = initialCropBox.w;
            let newH = initialCropBox.h;
            let newX = initialCropBox.x;
            let newY = initialCropBox.y;

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

            if (newW < 100) {
                newW = 100;
                newH = newW / ASPECT_RATIO;
                if (dragType === 'sw' || dragType === 'nw') newX = initialCropBox.x + initialCropBox.w - newW;
                if (dragType === 'nw' || dragType === 'ne') newY = initialCropBox.y + initialCropBox.h - newH;
            }

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

    container.addEventListener('touchstart', onPointerDown, { passive: false });
    document.addEventListener('touchmove', onPointerMove, { passive: false });
    document.addEventListener('touchend', onPointerUp);
    
    container.addEventListener('mousedown', onPointerDown);
    document.addEventListener('mousemove', onPointerMove);
    document.addEventListener('mouseup', onPointerUp);

    container.addEventListener('dragstart', e => e.preventDefault());

    // --- Actions ---
    btnBack.addEventListener('click', resetApp);
    btnRestart.addEventListener('click', resetApp);

    btnExport.addEventListener('click', () => {
        const originalText = btnExport.textContent;
        btnExport.textContent = '処理中...';
        btnExport.disabled = true;

        setTimeout(() => {
            const scale = imageNaturalWidth / imgRect.w;
            const cropX = (cropBox.x - imgRect.x) * scale;
            const cropY = (cropBox.y - imgRect.y) * scale;
            const cropW = cropBox.w * scale;
            const cropH = cropBox.h * scale;

            const finalCanvas = document.createElement('canvas');
            finalCanvas.width = cropW;
            finalCanvas.height = cropH;
            const ctx = finalCanvas.getContext('2d');

            ctx.filter = `brightness(${brightnessSlider.value}%)`;
            
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
                
                showToast('保存しました');

                setTimeout(() => {
                    if (currentFileIndex < imageFiles.length - 1) {
                        currentFileIndex++;
                        loadCurrentImage();
                    } else {
                        showView(completeView);
                    }
                }, 400);

            }, 'image/jpeg', 0.9);
        }, 50);
    });
});
