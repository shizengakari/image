document.addEventListener('DOMContentLoaded', () => {
    // --- Elements ---
    const uploadView = document.getElementById('upload-view');
    const editorView = document.getElementById('editor-view');
    const resultView = document.getElementById('result-view');
    const completeView = document.getElementById('complete-view');
    
    const btnTriggerUpload = document.getElementById('btn-trigger-upload');
    const imageUpload = document.getElementById('image-upload');
    const imageWorkspace = document.getElementById('image-workspace');
    const container = document.getElementById('cropper-container');
    const cropBoxEl = document.getElementById('crop-box');
    
    const btnBack = document.getElementById('btn-back');
    const btnResultBack = document.getElementById('btn-result-back');
    const btnProcess = document.getElementById('btn-process');
    const btnNextImage = document.getElementById('btn-next-image');
    const btnRestart = document.getElementById('btn-restart');
    
    const progressIndicator = document.getElementById('progress-indicator');
    
    const brightnessSlider = document.getElementById('brightness-slider');
    const brightnessVal = document.getElementById('brightness-val');
    
    const contrastSlider = document.getElementById('contrast-slider');
    const contrastVal = document.getElementById('contrast-val');
    
    const saturationSlider = document.getElementById('saturation-slider');
    const saturationVal = document.getElementById('saturation-val');
    
    const resultImage = document.getElementById('result-image');

    // --- Queue & State ---
    let imageFiles = [];
    let currentFileIndex = 0;
    let imageStates = []; // Stores crop and filter settings for each image

    // --- Cropper Math State ---
    const ASPECT_RATIO = 4 / 5;
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
        [uploadView, editorView, resultView, completeView].forEach(v => v.classList.remove('active'));
        viewEl.classList.add('active');
    };

    const resetApp = () => {
        showView(uploadView);
        imageUpload.value = '';
        imageFiles = [];
        currentFileIndex = 0;
        imageStates = [];
        imageWorkspace.src = '';
    };

    // --- State Management ---
    const saveCurrentState = () => {
        imageStates[currentFileIndex] = {
            cropBox: { ...cropBox },
            brightness: brightnessSlider.value,
            contrast: contrastSlider.value,
            saturation: saturationSlider.value,
        };
    };

    // --- Slider UI & Filter Logic ---
    const formatDisplayValue = (val) => {
        const diff = val - 100;
        if (diff === 0) return '0';
        return diff > 0 ? `+${diff}` : diff;
    };

    const updateSliderUI = (slider) => {
        const val = ((slider.value - slider.min) / (slider.max - slider.min)) * 100;
        slider.style.background = `linear-gradient(to right, #111827 ${val}%, #e5e7eb ${val}%)`;
    };

    const updateAllSlidersUI = () => {
        [brightnessSlider, contrastSlider, saturationSlider].forEach(updateSliderUI);
    };

    const updateFilters = (e) => {
        if (e && e.target) updateSliderUI(e.target);

        const b = brightnessSlider.value;
        const c = contrastSlider.value;
        const s = saturationSlider.value;
        
        brightnessVal.textContent = formatDisplayValue(b);
        contrastVal.textContent = formatDisplayValue(c);
        saturationVal.textContent = formatDisplayValue(s);
        
        imageWorkspace.style.filter = `brightness(${b}%) contrast(${c}%) saturate(${s}%)`;
    };

    ['input', 'change'].forEach(evt => {
        brightnessSlider.addEventListener(evt, updateFilters);
        contrastSlider.addEventListener(evt, updateFilters);
        saturationSlider.addEventListener(evt, updateFilters);
    });

    // --- File Upload & Loading ---
    btnTriggerUpload.addEventListener('click', () => {
        imageUpload.click();
    });

    const loadCurrentImage = () => {
        const file = imageFiles[currentFileIndex];
        if (!file) return;

        // Update UI
        if (imageFiles.length > 1) {
            progressIndicator.textContent = `${currentFileIndex + 1} / ${imageFiles.length}`;
            progressIndicator.style.display = 'block';
            btnNextImage.textContent = currentFileIndex < imageFiles.length - 1 ? '次の画像へ' : '完了';
        } else {
            progressIndicator.style.display = 'none';
            btnNextImage.textContent = '完了';
        }

        btnProcess.textContent = '保存';
        btnProcess.disabled = false;

        const reader = new FileReader();
        reader.onload = (event) => {
            imageWorkspace.src = event.target.result;
            imageWorkspace.onload = () => {
                imageNaturalWidth = imageWorkspace.naturalWidth;
                imageNaturalHeight = imageWorkspace.naturalHeight;
                initCustomCropper();
                
                // Restore state if it exists for this image
                const state = imageStates[currentFileIndex];
                if (state) {
                    cropBox = { ...state.cropBox };
                    brightnessSlider.value = state.brightness;
                    contrastSlider.value = state.contrast;
                    saturationSlider.value = state.saturation;
                    renderCropBox();
                } else {
                    brightnessSlider.value = 100;
                    contrastSlider.value = 100;
                    saturationSlider.value = 100;
                }
                
                updateFilters();
                updateAllSlidersUI();
            };
        };
        reader.readAsDataURL(file);
    };

    imageUpload.addEventListener('change', (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;
        
        imageFiles = files;
        currentFileIndex = 0;
        imageStates = [];
        
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
    btnRestart.addEventListener('click', resetApp);
    
    // Main editor Back Button
    btnBack.addEventListener('click', () => {
        saveCurrentState();
        if (currentFileIndex > 0) {
            currentFileIndex--;
            loadCurrentImage();
        } else {
            // Keep files, just hide editor (like pressing 'cancel' to upload different ones)
            showView(uploadView);
        }
    });
    
    // Result View Back Button (Re-edit current image)
    btnResultBack.addEventListener('click', () => {
        showView(editorView);
        btnProcess.textContent = '保存';
        btnProcess.disabled = false;
    });

    // Process & Save
    btnProcess.addEventListener('click', () => {
        saveCurrentState(); // Save state before moving on
        btnProcess.textContent = '処理中...';
        btnProcess.disabled = true;

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

            const b = brightnessSlider.value;
            const c = contrastSlider.value;
            const s = saturationSlider.value;
            ctx.filter = `brightness(${b}%) contrast(${c}%) saturate(${s}%)`;
            
            ctx.drawImage(
                imageWorkspace,
                cropX, cropY, cropW, cropH,
                0, 0, cropW, cropH
            );

            resultImage.src = finalCanvas.toDataURL('image/jpeg', 0.9);
            showView(resultView);
        }, 50);
    });

    btnNextImage.addEventListener('click', () => {
        if (currentFileIndex < imageFiles.length - 1) {
            currentFileIndex++;
            showView(editorView);
            loadCurrentImage();
        } else {
            showView(completeView);
        }
    });
});
