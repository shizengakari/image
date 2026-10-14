document.addEventListener('DOMContentLoaded', () => {
    // --- Elements ---
    const uploadView = document.getElementById('upload-view');
    const editorView = document.getElementById('editor-view');
    const resultView = document.getElementById('result-view');
    const completeView = document.getElementById('complete-view');
    
    const uploadCard = document.getElementById('upload-card');
    const btnTriggerUpload = document.getElementById('btn-trigger-upload');
    const imageUpload = document.getElementById('image-upload');
    
    const cropperContainer = document.getElementById('cropper-container');
    const imageWorkspace = document.getElementById('image-workspace');
    const cropBoxEl = document.getElementById('crop-box');
    const compareBadge = document.getElementById('compare-badge');
    
    const btnBack = document.getElementById('btn-back');
    const btnRotate = document.getElementById('btn-rotate');
    const btnCompare = document.getElementById('btn-compare');
    const btnEditorCancel = document.getElementById('btn-editor-cancel');
    const btnProcess = document.getElementById('btn-process');
    const progressIndicator = document.getElementById('progress-indicator');
    
    // Tools & Sliders
    const toolTabs = document.querySelectorAll('.tool-tab');
    const currentSliderLabel = document.getElementById('current-slider-label');
    const currentSliderVal = document.getElementById('current-slider-val');
    const activeSlider = document.getElementById('active-slider');
    const btnResetSlider = document.getElementById('btn-reset-slider');
    
    // Result View Elements
    const resultImage = document.getElementById('result-image');
    const btnResultBack = document.getElementById('btn-result-back');
    const btnShareImage = document.getElementById('btn-share-image');
    const btnDownloadImage = document.getElementById('btn-download-image');
    const btnNextImage = document.getElementById('btn-next-image');
    const btnRestart = document.getElementById('btn-restart');

    // --- State Variables ---
    const ASPECT_RATIO = 4 / 5; // 0.8 fixed
    let imageFiles = [];
    let currentFileIndex = 0;
    let imageStates = []; // Cache per file
    let activeTool = 'brightness'; // 'brightness' | 'contrast' | 'saturation'
    let currentBlob = null;
    let resultDataUrl = '';

    // Geometry & Transform State
    let imageNaturalWidth = 0;
    let imageNaturalHeight = 0;
    let rotationAngle = 0; // 0, 90, 180, 270

    // Coordinates relative to cropperContainer
    let contW = 0;
    let contH = 0;
    let imgRect = { x: 0, y: 0, w: 0, h: 0 };
    let cropBox = { x: 0, y: 0, w: 0, h: 0 };

    // Filters
    let filters = {
        brightness: 100, // 0 - 200 (100 is neutral)
        contrast: 100,
        saturation: 100
    };

    // Interaction State
    let isInteracting = false;
    let interactionType = null; // 'nw' | 'ne' | 'sw' | 'se' | 'move' | 'pinch'
    let initialCropBox = null;
    let startPoint = { x: 0, y: 0 };
    let activePointers = new Map();
    let initialPinchDistance = 0;

    // --- View Navigation ---
    const showView = (viewEl) => {
        [uploadView, editorView, resultView, completeView].forEach(v => v.classList.remove('active'));
        viewEl.classList.add('active');
    };

    const resetApp = () => {
        imageFiles = [];
        currentFileIndex = 0;
        imageStates = [];
        imageUpload.value = '';
        imageWorkspace.src = '';
        if (resultDataUrl) {
            try { URL.revokeObjectURL(resultDataUrl); } catch (e) {}
            resultDataUrl = '';
        }
        currentBlob = null;
        showView(uploadView);
    };

    // --- State Persistence ---
    const saveCurrentState = () => {
        imageStates[currentFileIndex] = {
            rotation: rotationAngle,
            cropBox: { ...cropBox },
            filters: { ...filters }
        };
    };

    const restoreCurrentState = () => {
        const state = imageStates[currentFileIndex];
        if (state) {
            rotationAngle = state.rotation;
            filters = { ...state.filters };
        } else {
            rotationAngle = 0;
            filters = { brightness: 100, contrast: 100, saturation: 100 };
        }

        updateFilterVisuals();
        updateSliderVisuals();
    };

    // --- Math & Cropper Layout ---
    const getEffectiveNaturalSize = () => {
        const isRotated = (rotationAngle % 180 !== 0);
        return {
            w: isRotated ? imageNaturalHeight : imageNaturalWidth,
            h: isRotated ? imageNaturalWidth : imageNaturalHeight
        };
    };

    const layoutImageAndCropBox = (restoreBox = true) => {
        contW = cropperContainer.clientWidth;
        contH = cropperContainer.clientHeight;
        if (!contW || !contH || !imageNaturalWidth) return;

        const eff = getEffectiveNaturalSize();

        // Fit image inside container with 16px safety padding
        const pad = 16;
        const availW = Math.max(10, contW - pad * 2);
        const availH = Math.max(10, contH - pad * 2);

        const scale = Math.min(availW / eff.w, availH / eff.h);
        imgRect.w = eff.w * scale;
        imgRect.h = eff.h * scale;
        imgRect.x = (contW - imgRect.w) / 2;
        imgRect.y = (contH - imgRect.h) / 2;

        // Position and transform the image DOM element
        imageWorkspace.style.width = `${imageNaturalWidth}px`;
        imageWorkspace.style.height = `${imageNaturalHeight}px`;
        imageWorkspace.style.left = '50%';
        imageWorkspace.style.top = '50%';
        imageWorkspace.style.transformOrigin = 'center center';
        imageWorkspace.style.transform = `translate(-50%, -50%) rotate(${rotationAngle}deg) scale(${scale})`;

        // Check if cached cropBox should be restored or newly initialized
        const state = imageStates[currentFileIndex];
        if (restoreBox && state && state.cropBox && state.rotation === rotationAngle) {
            cropBox = { ...state.cropBox };
            clampCropBox();
        } else {
            initDefaultCropBox();
        }

        renderCropBox();
    };

    const initDefaultCropBox = () => {
        // Fit 4:5 crop box tightly inside imgRect
        const imgAspect = imgRect.w / imgRect.h;
        if (imgAspect >= ASPECT_RATIO) {
            // Image is wider than 4:5 -> match height, derive width
            cropBox.h = imgRect.h;
            cropBox.w = cropBox.h * ASPECT_RATIO;
        } else {
            // Image is taller than 4:5 -> match width, derive height
            cropBox.w = imgRect.w;
            cropBox.h = cropBox.w / ASPECT_RATIO;
        }

        // Center inside imgRect
        cropBox.x = imgRect.x + (imgRect.w - cropBox.w) / 2;
        cropBox.y = imgRect.y + (imgRect.h - cropBox.h) / 2;

        clampCropBox();
    };

    const renderCropBox = () => {
        cropBoxEl.style.left = `${cropBox.x}px`;
        cropBoxEl.style.top = `${cropBox.y}px`;
        cropBoxEl.style.width = `${cropBox.w}px`;
        cropBoxEl.style.height = `${cropBox.h}px`;
    };

    // Strict boundary enforcement: NEVER go outside imgRect
    const clampCropBox = () => {
        // Minimum allowable size
        const minW = Math.min(60, imgRect.w);
        const minH = minW / ASPECT_RATIO;

        if (cropBox.w < minW) {
            cropBox.w = minW;
            cropBox.h = minH;
        }

        // Maximum allowable size within imgRect
        let maxW = imgRect.w;
        let maxH = maxW / ASPECT_RATIO;
        if (maxH > imgRect.h) {
            maxH = imgRect.h;
            maxW = maxH * ASPECT_RATIO;
        }

        if (cropBox.w > maxW) {
            cropBox.w = maxW;
            cropBox.h = maxH;
        }

        // Position clamping
        if (cropBox.x < imgRect.x) cropBox.x = imgRect.x;
        if (cropBox.y < imgRect.y) cropBox.y = imgRect.y;

        if (cropBox.x + cropBox.w > imgRect.x + imgRect.w) {
            cropBox.x = imgRect.x + imgRect.w - cropBox.w;
        }
        if (cropBox.y + cropBox.h > imgRect.y + imgRect.h) {
            cropBox.y = imgRect.y + imgRect.h - cropBox.h;
        }
    };

    // --- Gesture & Drag / Resize Logic ---
    const onPointerDown = (e) => {
        if (!editorView.classList.contains('active')) return;

        cropperContainer.setPointerCapture(e.pointerId);
        activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

        if (activePointers.size === 2) {
            // Two-finger pinch detected
            interactionType = 'pinch';
            const pts = Array.from(activePointers.values());
            initialPinchDistance = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
            initialCropBox = { ...cropBox };
            isInteracting = true;
            return;
        }

        if (activePointers.size === 1) {
            const handleEl = e.target.closest('.handle');
            const boxEl = e.target.closest('#crop-box');

            if (handleEl) {
                interactionType = handleEl.getAttribute('data-dir'); // 'nw', 'ne', 'sw', 'se'
            } else if (boxEl) {
                interactionType = 'move';
            } else {
                return;
            }

            isInteracting = true;
            startPoint = { x: e.clientX, y: e.clientY };
            initialCropBox = { ...cropBox };
        }
    };

    const onPointerMove = (e) => {
        if (!isInteracting || !activePointers.has(e.pointerId)) return;
        activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

        if (interactionType === 'pinch' && activePointers.size === 2) {
            // Pinch Zoom
            const pts = Array.from(activePointers.values());
            const currentDist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
            if (initialPinchDistance > 10) {
                const ratio = currentDist / initialPinchDistance;
                const newW = initialCropBox.w * ratio;
                const newH = newW / ASPECT_RATIO;

                const centerX = initialCropBox.x + initialCropBox.w / 2;
                const centerY = initialCropBox.y + initialCropBox.h / 2;

                cropBox.w = newW;
                cropBox.h = newH;
                cropBox.x = centerX - newW / 2;
                cropBox.y = centerY - newH / 2;

                clampCropBox();
                renderCropBox();
            }
            return;
        }

        if (activePointers.size === 1) {
            const dx = e.clientX - startPoint.x;
            const dy = e.clientY - startPoint.y;

            if (interactionType === 'move') {
                // Move Box
                cropBox.x = initialCropBox.x + dx;
                cropBox.y = initialCropBox.y + dy;
                clampCropBox();
                renderCropBox();
            } else if (['nw', 'ne', 'sw', 'se'].includes(interactionType)) {
                // Resize using Corner Handles (maintaining 4:5 aspect ratio)
                resizeFromHandle(interactionType, dx, dy);
                clampCropBox();
                renderCropBox();
            }
        }
    };

    const resizeFromHandle = (dir, dx, dy) => {
        const init = initialCropBox;

        if (dir === 'se') {
            // Anchor: Top-Left (init.x, init.y)
            const dw = Math.max(dx, dy * ASPECT_RATIO);
            let w = init.w + dw;
            let h = w / ASPECT_RATIO;

            // Clamp against image bounds
            const maxW = (imgRect.x + imgRect.w) - init.x;
            const maxH = (imgRect.y + imgRect.h) - init.y;
            w = Math.min(w, maxW, maxH * ASPECT_RATIO);
            h = w / ASPECT_RATIO;

            cropBox.w = w;
            cropBox.h = h;
            cropBox.x = init.x;
            cropBox.y = init.y;

        } else if (dir === 'sw') {
            // Anchor: Top-Right (init.x + init.w, init.y)
            const anchorX = init.x + init.w;
            const dw = Math.max(-dx, dy * ASPECT_RATIO);
            let w = init.w + dw;
            let h = w / ASPECT_RATIO;

            const maxW = anchorX - imgRect.x;
            const maxH = (imgRect.y + imgRect.h) - init.y;
            w = Math.min(w, maxW, maxH * ASPECT_RATIO);
            h = w / ASPECT_RATIO;

            cropBox.w = w;
            cropBox.h = h;
            cropBox.x = anchorX - w;
            cropBox.y = init.y;

        } else if (dir === 'ne') {
            // Anchor: Bottom-Left (init.x, init.y + init.h)
            const anchorY = init.y + init.h;
            const dw = Math.max(dx, -dy * ASPECT_RATIO);
            let w = init.w + dw;
            let h = w / ASPECT_RATIO;

            const maxW = (imgRect.x + imgRect.w) - init.x;
            const maxH = anchorY - imgRect.y;
            w = Math.min(w, maxW, maxH * ASPECT_RATIO);
            h = w / ASPECT_RATIO;

            cropBox.w = w;
            cropBox.h = h;
            cropBox.x = init.x;
            cropBox.y = anchorY - h;

        } else if (dir === 'nw') {
            // Anchor: Bottom-Right (init.x + init.w, init.y + init.h)
            const anchorX = init.x + init.w;
            const anchorY = init.y + init.h;
            const dw = Math.max(-dx, -dy * ASPECT_RATIO);
            let w = init.w + dw;
            let h = w / ASPECT_RATIO;

            const maxW = anchorX - imgRect.x;
            const maxH = anchorY - imgRect.y;
            w = Math.min(w, maxW, maxH * ASPECT_RATIO);
            h = w / ASPECT_RATIO;

            cropBox.w = w;
            cropBox.h = h;
            cropBox.x = anchorX - w;
            cropBox.y = anchorY - h;
        }
    };

    const onPointerUp = (e) => {
        if (activePointers.has(e.pointerId)) {
            activePointers.delete(e.pointerId);
            try { cropperContainer.releasePointerCapture(e.pointerId); } catch (err) {}
        }

        if (activePointers.size === 0) {
            isInteracting = false;
            interactionType = null;
            clampCropBox();
            renderCropBox();
        }
    };

    cropperContainer.addEventListener('pointerdown', onPointerDown);
    cropperContainer.addEventListener('pointermove', onPointerMove);
    cropperContainer.addEventListener('pointerup', onPointerUp);
    cropperContainer.addEventListener('pointercancel', onPointerUp);

    // --- Slider & Filter Controls ---
    const updateFilterVisuals = () => {
        imageWorkspace.style.filter = `brightness(${filters.brightness}%) contrast(${filters.contrast}%) saturate(${filters.saturation}%)`;
    };

    const updateSliderVisuals = () => {
        const val = filters[activeTool];
        activeSlider.value = val;

        const diff = val - 100;
        currentSliderVal.textContent = diff === 0 ? '0' : (diff > 0 ? `+${diff}` : `${diff}`);

        const pct = ((val - activeSlider.min) / (activeSlider.max - activeSlider.min)) * 100;
        activeSlider.style.background = `linear-gradient(to right, var(--accent) ${pct}%, var(--surface-3) ${pct}%)`;

        let label = '明るさ';
        if (activeTool === 'contrast') label = 'コントラスト';
        if (activeTool === 'saturation') label = '彩度';
        currentSliderLabel.textContent = label;
    };

    toolTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            activeTool = tab.getAttribute('data-tool');
            toolTabs.forEach(t => t.classList.toggle('active', t === tab));
            updateSliderVisuals();
        });
    });

    activeSlider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        filters[activeTool] = val;
        updateSliderVisuals();
        updateFilterVisuals();
    });

    btnResetSlider.addEventListener('click', () => {
        filters[activeTool] = 100;
        updateSliderVisuals();
        updateFilterVisuals();
    });

    // Rotate Button (Header)
    btnRotate.addEventListener('click', () => {
        rotationAngle = (rotationAngle + 90) % 360;
        layoutImageAndCropBox(false); // recalculate fits and reset cropBox strictly inside new bounds
    });

    // Compare Function (Before / After)
    const startCompare = () => {
        imageWorkspace.style.filter = 'none';
        compareBadge.classList.add('visible');
        btnCompare.classList.add('active');
    };

    const stopCompare = () => {
        updateFilterVisuals();
        compareBadge.classList.remove('visible');
        btnCompare.classList.remove('active');
    };

    btnCompare.addEventListener('pointerdown', startCompare);
    btnCompare.addEventListener('pointerup', stopCompare);
    btnCompare.addEventListener('pointercancel', stopCompare);
    btnCompare.addEventListener('pointerleave', stopCompare);

    // --- File Upload & Loading ---
    const loadCurrentImage = () => {
        const file = imageFiles[currentFileIndex];
        if (!file) return;

        if (imageFiles.length > 1) {
            progressIndicator.textContent = `${currentFileIndex + 1} / ${imageFiles.length}`;
            progressIndicator.style.display = 'block';
            btnNextImage.textContent = currentFileIndex < imageFiles.length - 1 ? '次の写真へ' : 'すべて完了';
        } else {
            progressIndicator.style.display = 'none';
            btnNextImage.textContent = '完了';
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            imageWorkspace.src = e.target.result;
            imageWorkspace.onload = () => {
                imageNaturalWidth = imageWorkspace.naturalWidth;
                imageNaturalHeight = imageWorkspace.naturalHeight;
                restoreCurrentState();
                layoutImageAndCropBox(true);
            };
        };
        reader.readAsDataURL(file);
    };

    btnTriggerUpload.addEventListener('click', (e) => {
        e.stopPropagation();
        imageUpload.click();
    });

    uploadCard.addEventListener('click', () => {
        imageUpload.click();
    });

    imageUpload.addEventListener('change', (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        imageFiles = files;
        currentFileIndex = 0;
        imageStates = [];

        showView(editorView);
        activeTool = 'brightness';
        toolTabs.forEach(t => t.classList.toggle('active', t.getAttribute('data-tool') === 'brightness'));
        loadCurrentImage();
    });

    window.addEventListener('resize', () => {
        if (editorView.classList.contains('active')) {
            layoutImageAndCropBox(true);
        }
    });

    // --- Export & High-Resolution Canvas Rendering ---
    btnProcess.addEventListener('click', () => {
        saveCurrentState();
        btnProcess.disabled = true;
        btnProcess.innerHTML = `<span>書き出し中...</span>`;

        setTimeout(() => {
            renderExportCanvas();
        }, 50);
    });

    const renderExportCanvas = () => {
        const eff = getEffectiveNaturalSize();
        const scale = imgRect.w / eff.w;

        // Relative coordinates within the unrotated/rotated image
        const relX = (cropBox.x - imgRect.x) / scale;
        const relY = (cropBox.y - imgRect.y) / scale;
        const relW = cropBox.w / scale;
        const relH = cropBox.h / scale;

        // 1. Offscreen canvas for rotated image
        const rotCanvas = document.createElement('canvas');
        rotCanvas.width = eff.w;
        rotCanvas.height = eff.h;
        const rotCtx = rotCanvas.getContext('2d');

        rotCtx.translate(eff.w / 2, eff.h / 2);
        rotCtx.rotate((rotationAngle * Math.PI) / 180);
        rotCtx.drawImage(
            imageWorkspace,
            -imageNaturalWidth / 2,
            -imageNaturalHeight / 2,
            imageNaturalWidth,
            imageNaturalHeight
        );

        // 2. Final Output Canvas (Strictly 4:5 Aspect Ratio)
        const outCanvas = document.createElement('canvas');
        outCanvas.width = Math.round(relW);
        outCanvas.height = Math.round(relH);
        const outCtx = outCanvas.getContext('2d');

        // Apply filters
        outCtx.filter = `brightness(${filters.brightness}%) contrast(${filters.contrast}%) saturate(${filters.saturation}%)`;
        outCtx.drawImage(
            rotCanvas,
            relX, relY, relW, relH,
            0, 0, outCanvas.width, outCanvas.height
        );

        outCanvas.toBlob((blob) => {
            currentBlob = blob;
            if (resultDataUrl) {
                try { URL.revokeObjectURL(resultDataUrl); } catch (e) {}
            }
            resultDataUrl = URL.createObjectURL(blob);
            resultImage.src = resultDataUrl;

            btnProcess.disabled = false;
            btnProcess.innerHTML = `<span>書き出し</span><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>`;

            showView(resultView);
        }, 'image/jpeg', 0.94);
    };

    // --- Save & Share Actions ---
    btnShareImage.addEventListener('click', async () => {
        if (!currentBlob) return;

        const filename = `instacrop_${Date.now()}.jpg`;
        const file = new File([currentBlob], filename, { type: 'image/jpeg' });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            try {
                await navigator.share({
                    files: [file],
                    title: 'InstaCrop 4:5',
                    text: 'InstaCropで最適化した写真です'
                });
            } catch (err) {
                if (err.name !== 'AbortError') {
                    triggerDownload();
                }
            }
        } else {
            triggerDownload();
        }
    });

    const triggerDownload = () => {
        if (!currentBlob) return;
        const a = document.createElement('a');
        a.href = resultDataUrl;
        a.download = `instacrop_${Date.now()}.jpg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    btnDownloadImage.addEventListener('click', triggerDownload);

    // Navigation back & next
    btnBack.addEventListener('click', () => {
        saveCurrentState();
        if (currentFileIndex > 0) {
            currentFileIndex--;
            loadCurrentImage();
        } else {
            showView(uploadView);
        }
    });

    btnEditorCancel.addEventListener('click', () => {
        if (confirm('写真の選択画面に戻りますか？')) {
            resetApp();
        }
    });

    btnResultBack.addEventListener('click', () => {
        showView(editorView);
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

    btnRestart.addEventListener('click', resetApp);
});
