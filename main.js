document.addEventListener('DOMContentLoaded', () => {
    // --- Views ---
    const uploadView = document.getElementById('upload-view');
    const editorView = document.getElementById('editor-view');
    const resultView = document.getElementById('result-view');
    const completeView = document.getElementById('complete-view');

    // --- Upload Elements ---
    const dropZone = document.getElementById('drop-zone');
    const btnTriggerUpload = document.getElementById('btn-trigger-upload');
    const imageUpload = document.getElementById('image-upload');

    // --- Editor Header Elements ---
    const btnBack = document.getElementById('btn-back');
    const progressIndicator = document.getElementById('progress-indicator');
    const btnApplyAll = document.getElementById('btn-apply-all');
    const btnProcess = document.getElementById('btn-process');

    // --- Workspace & Cropper Elements ---
    const container = document.getElementById('cropper-container');
    const workspaceCanvas = document.getElementById('image-workspace');
    const workspaceCtx = workspaceCanvas.getContext('2d', { willReadFrequently: true });
    const cropBoxEl = document.getElementById('crop-box');
    const btnResetAll = document.getElementById('btn-reset-all');
    const btnCompare = document.getElementById('btn-compare');

    // --- Bottom Dock & Contextual Panel Elements ---
    const activeControlPanel = document.getElementById('active-control-panel');
    const panelSlider = document.getElementById('panel-slider');
    const panelAspect = document.getElementById('panel-aspect');
    const panelTransform = document.getElementById('panel-transform');
    const panelFilters = document.getElementById('panel-filters');

    const activeToolName = document.getElementById('active-tool-name');
    const activeToolVal = document.getElementById('active-tool-val');
    const activeSlider = document.getElementById('active-slider');
    const sliderFill = document.getElementById('slider-fill');
    const sliderCenterTick = document.getElementById('slider-center-tick');
    const btnResetSingle = document.getElementById('btn-reset-single');
    const btnCloseSlider = document.getElementById('btn-close-slider');
    const btnCloseAspect = document.getElementById('btn-close-aspect');
    const btnCloseTransform = document.getElementById('btn-close-transform');
    const btnCloseFilters = document.getElementById('btn-close-filters');

    const aspectPillsContainer = document.getElementById('aspect-pills');
    const btnRotateCCW = document.getElementById('btn-rotate-ccw');
    const btnRotateCW = document.getElementById('btn-rotate-cw');
    const btnFlipH = document.getElementById('btn-flip-h');
    const btnFlipV = document.getElementById('btn-flip-v');
    const straightenSlider = document.getElementById('straighten-slider');
    const straightenVal = document.getElementById('straighten-val');
    const straightenFill = document.getElementById('straighten-fill');
    const btnResetTransform = document.getElementById('btn-reset-transform');

    const filterPillsContainer = document.getElementById('filter-pills');
    const filterSliderWrapper = document.getElementById('filter-slider-wrapper');
    const filterStrengthSlider = document.getElementById('filter-strength-slider');
    const filterStrengthVal = document.getElementById('filter-strength-val');
    const filterFill = document.getElementById('filter-fill');

    const toolMenuBar = document.getElementById('tool-menu-bar');
    const menuScrollLeft = document.getElementById('menu-scroll-left');
    const menuScrollRight = document.getElementById('menu-scroll-right');
    const toolItems = Array.from(document.querySelectorAll('.tool-item'));

    // --- Result & Complete View Elements ---
    const btnResultBack = document.getElementById('btn-result-back');
    const resultTitlePill = document.getElementById('result-title-pill');
    const resultImage = document.getElementById('result-image');
    const btnDownloadImage = document.getElementById('btn-download-image');
    const btnShareImage = document.getElementById('btn-share-image');
    const btnNextImage = document.getElementById('btn-next-image');

    const completeSubtitle = document.getElementById('complete-subtitle');
    const batchGallery = document.getElementById('batch-gallery');
    const btnDownloadAll = document.getElementById('btn-download-all');
    const btnRestart = document.getElementById('btn-restart');
    const toastEl = document.getElementById('toast');

    // --- Adjustment Tool Metadata ---
    const ADJUSTMENT_TOOLS = {
        brightness: { label: '明るさ', min: -100, max: 100, default: 0, bidirectional: true },
        exposure:   { label: '露出', min: -100, max: 100, default: 0, bidirectional: true },
        contrast:   { label: 'コントラスト', min: -100, max: 100, default: 0, bidirectional: true },
        highlights: { label: 'ハイライト', min: -100, max: 100, default: 0, bidirectional: true },
        shadows:    { label: 'シャドウ', min: -100, max: 100, default: 0, bidirectional: true },
        saturation: { label: 'あざやかさ (彩度)', min: -100, max: 100, default: 0, bidirectional: true },
        vibrance:   { label: '自然な彩度', min: -100, max: 100, default: 0, bidirectional: true },
        warmth:     { label: '色温度 (暖かみ)', min: -100, max: 100, default: 0, bidirectional: true },
        tint:       { label: '色合い', min: -100, max: 100, default: 0, bidirectional: true },
        sharpness:  { label: 'シャープ', min: 0, max: 100, default: 0, bidirectional: false },
        fade:       { label: 'フェード', min: 0, max: 100, default: 0, bidirectional: false },
        vignette:   { label: 'ビネット (周辺光量)', min: -100, max: 100, default: 0, bidirectional: true }
    };

    const DEFAULT_ASPECT_MODE = '0.8'; // 4:5

    const createDefaultState = () => ({
        aspectMode: DEFAULT_ASPECT_MODE, // '0.8', '1', '1.7777778', '0.5625', '1.3333333', '0.75', 'original', 'free'
        normCrop: null, // { x: 0..1, y: 0..1, w: 0..1, h: 0..1 } relative to oriented image
        rotation90: 0,  // 0, 90, 180, 270
        flipX: false,
        flipY: false,
        straighten: 0,  // -45 to +45
        filter: 'none', // 'none', 'vivid', 'warm', 'cool', 'dramatic', 'film', 'mono', 'sepia'
        filterStrength: 100,
        brightness: 0,
        exposure: 0,
        contrast: 0,
        highlights: 0,
        shadows: 0,
        saturation: 0,
        vibrance: 0,
        warmth: 0,
        tint: 0,
        sharpness: 0,
        fade: 0,
        vignette: 0
    });

    // --- Application State ---
    let imageFiles = [];
    let currentFileIndex = 0;
    let imageStates = [];
    let editedResults = []; // Stores { dataUrl, blob, filename } per index
    let currentSourceImage = null;
    let currentObjectUrl = null;
    let activeTool = null; // Currently selected bottom menu tool
    let isComparing = false;

    // --- Preview Base Cache (for 60fps real-time pixel processing) ---
    const basePreviewCanvas = document.createElement('canvas');
    const basePreviewCtx = basePreviewCanvas.getContext('2d', { willReadFrequently: true });
    let basePreviewImageData = null;
    let workingPreviewImageData = null;
    let previewRafId = null;

    // --- Cropper Display Geometry ---
    let orientedWidth = 0;
    let orientedHeight = 0;
    let imgRect = { x: 0, y: 0, w: 0, h: 0 };
    let cropBox = { x: 0, y: 0, w: 0, h: 0 };

    // --- Pointer / Drag Interaction State ---
    let isDraggingCrop = false;
    let dragType = null;
    let activePointerId = null;
    let dragStartX = 0;
    let dragStartY = 0;
    let initialCropBox = null;

    // --- Utility Functions ---
    const clamp = (val, min, max) => Math.max(min, Math.min(max, val));

    let toastTimer = null;
    const showToast = (message) => {
        if (!toastEl) return;
        toastEl.textContent = message;
        toastEl.classList.add('show');
        if (toastTimer) clearTimeout(toastTimer);
        toastTimer = setTimeout(() => {
            toastEl.classList.remove('show');
        }, 2200);
    };

    const getCurrentState = () => {
        if (!imageStates[currentFileIndex]) {
            imageStates[currentFileIndex] = createDefaultState();
        }
        return imageStates[currentFileIndex];
    };

    const formatSignedValue = (val, suffix = '') => {
        const num = Number(val);
        if (num === 0) return `0${suffix}`;
        return num > 0 ? `+${num}${suffix}` : `${num}${suffix}`;
    };

    const canUseWebShareFiles = () => {
        try {
            if (!navigator.canShare || !navigator.share || typeof File === 'undefined') return false;
            const testFile = new File([new Uint8Array(1)], 'test.jpg', { type: 'image/jpeg' });
            return navigator.canShare({ files: [testFile] });
        } catch (e) {
            return false;
        }
    };

    const dataURLToBlob = (dataURL) => {
        const parts = dataURL.split(',');
        const mimeMatch = parts[0].match(/:(.*?);/);
        const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
        const bstr = atob(parts[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new Blob([u8arr], { type: mime });
    };

    const buildSafeFilename = (originalFile, index) => {
        const rawName = (originalFile && originalFile.name) ? originalFile.name : `photo-${index + 1}`;
        const baseName = rawName.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_\-\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf]/g, '_');
        return `${baseName || 'photo'}_edited.jpg`;
    };

    const triggerBlobDownload = (blob, filename) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 15000);
    };

    // --- View Navigation ---
    const showView = (viewEl) => {
        [uploadView, editorView, resultView, completeView].forEach(v => v.classList.remove('active'));
        viewEl.classList.add('active');
    };

    const resetApp = () => {
        closeActivePanel();
        if (currentObjectUrl) {
            URL.revokeObjectURL(currentObjectUrl);
            currentObjectUrl = null;
        }
        currentSourceImage = null;
        imageUpload.value = '';
        imageFiles = [];
        currentFileIndex = 0;
        imageStates = [];
        editedResults = [];
        showView(uploadView);
    };

    // --- Slider Fill UI Helpers ---
    const updateSliderTrackFill = (sliderEl, fillEl, isBidirectional) => {
        const min = parseFloat(sliderEl.min);
        const max = parseFloat(sliderEl.max);
        const val = parseFloat(sliderEl.value);
        if (isBidirectional) {
            const pct = ((val - min) / (max - min)) * 100;
            const left = Math.min(50, pct);
            const width = Math.abs(pct - 50);
            fillEl.style.left = `${left}%`;
            fillEl.style.width = `${width}%`;
        } else {
            const pct = ((val - min) / (max - min)) * 100;
            fillEl.style.left = '0%';
            fillEl.style.width = `${pct}%`;
        }
    };

    // --- Check Modified State for Dots & Reset Button ---
    const hasPixelAdjustments = (state) => {
        if (!state) return false;
        for (const key of Object.keys(ADJUSTMENT_TOOLS)) {
            if (state[key] !== ADJUSTMENT_TOOLS[key].default) return true;
        }
        if (state.filter !== 'none' && state.filterStrength > 0) return true;
        return false;
    };

    const isAdjustmentsModified = (state) => {
        if (!state) return false;
        if (hasPixelAdjustments(state)) return true;
        if (state.rotation90 !== 0 || state.flipX || state.flipY || state.straighten !== 0) return true;
        if (state.aspectMode !== DEFAULT_ASPECT_MODE) return true;
        return false;
    };

    const updateToolIndicators = () => {
        const state = getCurrentState();
        toolItems.forEach(btn => {
            const tool = btn.getAttribute('data-tool');
            btn.classList.toggle('active', tool === activeTool);

            let modified = false;
            if (tool === 'aspect') {
                modified = state.aspectMode !== DEFAULT_ASPECT_MODE;
            } else if (tool === 'transform') {
                modified = state.rotation90 !== 0 || state.flipX || state.flipY || state.straighten !== 0;
            } else if (tool === 'filters') {
                modified = state.filter !== 'none';
            } else if (ADJUSTMENT_TOOLS[tool]) {
                modified = state[tool] !== ADJUSTMENT_TOOLS[tool].default;
            }
            btn.classList.toggle('modified', modified);
        });

        // Update Reset All button visibility
        btnResetAll.style.display = isAdjustmentsModified(state) ? 'inline-flex' : 'none';

        // Update Aspect Pills
        Array.from(aspectPillsContainer.querySelectorAll('.aspect-pill')).forEach(pill => {
            pill.classList.toggle('active', pill.getAttribute('data-ratio') === state.aspectMode);
        });

        // Update Transform UI
        btnFlipH.classList.toggle('active', state.flipX);
        btnFlipV.classList.toggle('active', state.flipY);
        straightenSlider.value = state.straighten;
        straightenVal.textContent = `${state.straighten > 0 ? '+' : ''}${state.straighten}°`;
        updateSliderTrackFill(straightenSlider, straightenFill, true);

        // Update Filter Pills
        Array.from(filterPillsContainer.querySelectorAll('.filter-pill')).forEach(pill => {
            pill.classList.toggle('active', pill.getAttribute('data-filter') === state.filter);
        });
        if (state.filter === 'none') {
            filterSliderWrapper.style.display = 'none';
            filterStrengthVal.textContent = 'オフ';
        } else {
            filterSliderWrapper.style.display = 'flex';
            filterStrengthSlider.value = state.filterStrength;
            filterStrengthVal.textContent = `${state.filterStrength}%`;
            updateSliderTrackFill(filterStrengthSlider, filterFill, false);
        }

        // Update Active Adjustment Slider if open
        if (activeTool && ADJUSTMENT_TOOLS[activeTool]) {
            const meta = ADJUSTMENT_TOOLS[activeTool];
            const val = state[activeTool];
            activeToolName.textContent = meta.label;
            activeSlider.min = meta.min;
            activeSlider.max = meta.max;
            activeSlider.value = val;
            activeToolVal.textContent = meta.bidirectional ? formatSignedValue(val) : `${val}`;
            sliderCenterTick.style.display = meta.bidirectional ? 'block' : 'none';
            updateSliderTrackFill(activeSlider, sliderFill, meta.bidirectional);
        }
    };

    // --- Bottom Menu & Contextual Bar Open / Close ---
    const openToolPanel = (toolName) => {
        if (activeTool === toolName && activeControlPanel.classList.contains('open')) {
            closeActivePanel();
            return;
        }

        activeTool = toolName;
        panelSlider.style.display = 'none';
        panelAspect.style.display = 'none';
        panelTransform.style.display = 'none';
        panelFilters.style.display = 'none';

        if (toolName === 'aspect') {
            panelAspect.style.display = 'flex';
        } else if (toolName === 'transform') {
            panelTransform.style.display = 'flex';
        } else if (toolName === 'filters') {
            panelFilters.style.display = 'flex';
        } else if (ADJUSTMENT_TOOLS[toolName]) {
            panelSlider.style.display = 'flex';
        }

        updateToolIndicators();
        activeControlPanel.classList.add('open');
        activeControlPanel.setAttribute('aria-hidden', 'false');

        // Smoothly center the selected button in the horizontal menu
        const btn = toolMenuBar.querySelector(`[data-tool="${toolName}"]`);
        if (btn) {
            const scrollTarget = btn.offsetLeft - (toolMenuBar.clientWidth / 2) + (btn.offsetWidth / 2);
            toolMenuBar.scrollTo({ left: scrollTarget, behavior: 'smooth' });
        }
    };

    const closeActivePanel = () => {
        activeTool = null;
        activeControlPanel.classList.remove('open');
        activeControlPanel.setAttribute('aria-hidden', 'true');
        updateToolIndicators();
    };

    toolItems.forEach(btn => {
        btn.addEventListener('click', () => {
            const tool = btn.getAttribute('data-tool');
            openToolPanel(tool);
        });
    });

    [btnCloseSlider, btnCloseAspect, btnCloseTransform, btnCloseFilters].forEach(btn => {
        if (btn) btn.addEventListener('click', closeActivePanel);
    });

    // Horizontal scrolling helpers for desktop mouse wheel & arrow buttons
    const updateMenuScrollButtons = () => {
        const sl = toolMenuBar.scrollLeft;
        const maxSl = toolMenuBar.scrollWidth - toolMenuBar.clientWidth;
        menuScrollLeft.classList.toggle('hidden', sl <= 4);
        menuScrollRight.classList.toggle('hidden', maxSl - sl <= 4);
    };

    toolMenuBar.addEventListener('scroll', updateMenuScrollButtons, { passive: true });
    window.addEventListener('resize', updateMenuScrollButtons);

    [toolMenuBar, aspectPillsContainer, filterPillsContainer].forEach(scrollEl => {
        if (!scrollEl) return;
        scrollEl.addEventListener('wheel', (e) => {
            if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
                e.preventDefault();
                scrollEl.scrollLeft += e.deltaY;
            }
        }, { passive: false });
    });

    menuScrollLeft.addEventListener('click', () => {
        toolMenuBar.scrollBy({ left: -180, behavior: 'smooth' });
    });

    menuScrollRight.addEventListener('click', () => {
        toolMenuBar.scrollBy({ left: 180, behavior: 'smooth' });
    });

    // --- Cross-Browser Pixel Processing Engine (Zero dependency on ctx.filter) ---
    const buildColorLUTs = (state) => {
        const lutR = new Uint8Array(256);
        const lutG = new Uint8Array(256);
        const lutB = new Uint8Array(256);

        const expFactor = Math.pow(2, state.exposure / 55);
        const brightOffset = (state.brightness / 100) * 0.42;
        const contrastFactor = state.contrast >= 0
            ? 1 + (state.contrast / 100) * 1.25
            : 1 + (state.contrast / 100) * 0.68;
        const shadowAmt = (state.shadows / 100) * 0.38;
        const highlightAmt = (state.highlights / 100) * 0.38;
        const fadeLift = (state.fade / 100) * 0.22;

        // Warmth & Tint channel offsets
        const wR = state.warmth * 0.42;
        const wG = state.warmth * 0.08;
        const wB = -state.warmth * 0.42;

        const tR = state.tint * 0.22;
        const tG = -state.tint * 0.38;
        const tB = state.tint * 0.22;

        for (let i = 0; i < 256; i++) {
            let x = i / 255;

            // 1. Exposure
            if (state.exposure !== 0) {
                x = x * expFactor;
            }

            // 2. Brightness (smooth curve + offset)
            if (state.brightness !== 0) {
                x = x + brightOffset * (1 - x * 0.25);
            }

            x = clamp(x, 0, 1);

            // 3. Shadows & Highlights
            if (state.shadows !== 0) {
                const sMask = Math.pow(1 - x, 1.7) * (x + 0.15);
                x += shadowAmt * sMask;
            }
            if (state.highlights !== 0) {
                const hMask = Math.pow(x, 1.7) * (1.15 - x);
                x += highlightAmt * hMask;
            }

            x = clamp(x, 0, 1);

            // 4. Contrast
            if (state.contrast !== 0) {
                x = (x - 0.5) * contrastFactor + 0.5;
            }

            x = clamp(x, 0, 1);

            // 5. Fade (black point lift)
            if (state.fade > 0) {
                x = fadeLift + x * (1 - fadeLift);
            }

            const base255 = x * 255;
            lutR[i] = clamp(Math.round(base255 + wR + tR), 0, 255);
            lutG[i] = clamp(Math.round(base255 + wG + tG), 0, 255);
            lutB[i] = clamp(Math.round(base255 + wB + tB), 0, 255);
        }

        return { lutR, lutG, lutB };
    };

    const applySharpnessPass = (data, width, height, amount) => {
        if (amount <= 0) return;
        const mix = (amount / 100) * 0.85;
        const src = new Uint8ClampedArray(data);
        const stride = width * 4;

        for (let y = 1; y < height - 1; y++) {
            const rowOffset = y * stride;
            for (let x = 1; x < width - 1; x++) {
                const idx = rowOffset + x * 4;
                for (let c = 0; c < 3; c++) {
                    const center = src[idx + c];
                    const neighbors = (
                        src[idx - stride + c] +
                        src[idx + stride + c] +
                        src[idx - 4 + c] +
                        src[idx + 4 + c]
                    ) * 0.25;
                    const sharpened = center + (center - neighbors) * 2.2 * mix;
                    data[idx + c] = sharpened < 0 ? 0 : (sharpened > 255 ? 255 : sharpened);
                }
            }
        }
    };

    const applyPixelAdjustments = (imageData, state, normCropForVignette) => {
        const data = imageData.data;
        const width = imageData.width;
        const height = imageData.height;

        // Effective state combining user sliders + preset filter
        const eff = { ...state };
        const fStrength = (state.filter !== 'none') ? (state.filterStrength / 100) : 0;

        if (fStrength > 0) {
            if (state.filter === 'vivid') {
                eff.contrast = clamp(eff.contrast + 18 * fStrength, -100, 100);
                eff.saturation = clamp(eff.saturation + 28 * fStrength, -100, 100);
                eff.vibrance = clamp(eff.vibrance + 20 * fStrength, -100, 100);
            } else if (state.filter === 'warm') {
                eff.warmth = clamp(eff.warmth + 38 * fStrength, -100, 100);
                eff.brightness = clamp(eff.brightness + 6 * fStrength, -100, 100);
                eff.saturation = clamp(eff.saturation + 12 * fStrength, -100, 100);
            } else if (state.filter === 'cool') {
                eff.warmth = clamp(eff.warmth - 38 * fStrength, -100, 100);
                eff.tint = clamp(eff.tint - 8 * fStrength, -100, 100);
                eff.contrast = clamp(eff.contrast + 10 * fStrength, -100, 100);
            } else if (state.filter === 'dramatic') {
                eff.contrast = clamp(eff.contrast + 38 * fStrength, -100, 100);
                eff.shadows = clamp(eff.shadows - 22 * fStrength, -100, 100);
                eff.highlights = clamp(eff.highlights - 15 * fStrength, -100, 100);
                eff.saturation = clamp(eff.saturation - 18 * fStrength, -100, 100);
                eff.vignette = clamp(eff.vignette + 25 * fStrength, -100, 100);
            } else if (state.filter === 'film') {
                eff.fade = clamp(eff.fade + 38 * fStrength, 0, 100);
                eff.contrast = clamp(eff.contrast + 12 * fStrength, -100, 100);
                eff.warmth = clamp(eff.warmth + 14 * fStrength, -100, 100);
                eff.saturation = clamp(eff.saturation - 12 * fStrength, -100, 100);
            }
        }

        const { lutR, lutG, lutB } = buildColorLUTs(eff);

        const satVal = eff.saturation / 100;
        const vibVal = eff.vibrance / 100;
        const hasSatOrVib = satVal !== 0 || vibVal !== 0;
        const isMono = state.filter === 'mono' && fStrength > 0;
        const isSepia = state.filter === 'sepia' && fStrength > 0;
        const vigAmt = eff.vignette / 100;
        const hasVignette = vigAmt !== 0;

        const nc = normCropForVignette || { x: 0, y: 0, w: 1, h: 1 };
        const cropCenterX = (nc.x + nc.w * 0.5) * width;
        const cropCenterY = (nc.y + nc.h * 0.5) * height;
        const invRadiusX = 1 / Math.max(1, nc.w * width * 0.5);
        const invRadiusY = 1 / Math.max(1, nc.h * height * 0.5);

        for (let y = 0; y < height; y++) {
            const dy = (y - cropCenterY) * invRadiusY;
            const dy2 = dy * dy;
            const rowOffset = y * width * 4;

            for (let x = 0; x < width; x++) {
                const i = rowOffset + x * 4;

                let r = lutR[data[i]];
                let g = lutG[data[i + 1]];
                let b = lutB[data[i + 2]];

                if (hasSatOrVib || isMono || isSepia) {
                    const lum = 0.299 * r + 0.587 * g + 0.114 * b;

                    if (hasSatOrVib) {
                        let boost = 1 + satVal;
                        if (vibVal !== 0) {
                            const maxC = r > g ? (r > b ? r : b) : (g > b ? g : b);
                            const minC = r < g ? (r < b ? r : b) : (g < b ? g : b);
                            const curSat = (maxC - minC) / 255;
                            boost *= (1 + vibVal * (1 - curSat * curSat));
                        }
                        r = lum + (r - lum) * boost;
                        g = lum + (g - lum) * boost;
                        b = lum + (b - lum) * boost;
                    }

                    if (isMono) {
                        r = r + (lum - r) * fStrength;
                        g = g + (lum - g) * fStrength;
                        b = b + (lum - b) * fStrength;
                    } else if (isSepia) {
                        const sr = Math.min(255, lum * 1.08 + 22);
                        const sg = Math.min(255, lum * 0.92 + 8);
                        const sb = Math.max(0, lum * 0.74 - 12);
                        r = r + (sr - r) * fStrength;
                        g = g + (sg - g) * fStrength;
                        b = b + (sb - b) * fStrength;
                    }
                }

                if (hasVignette) {
                    const dx = (x - cropCenterX) * invRadiusX;
                    const distSq = dx * dx + dy2;
                    if (distSq > 0.25) {
                        const vFactor = Math.min(1, (distSq - 0.25) / 1.15);
                        const smoothV = vFactor * vFactor;
                        if (vigAmt > 0) {
                            const mult = 1 - smoothV * vigAmt * 0.78;
                            r *= mult;
                            g *= mult;
                            b *= mult;
                        } else {
                            const lift = smoothV * (-vigAmt) * 0.75 * 255;
                            r += lift;
                            g += lift;
                            b += lift;
                        }
                    }
                }

                data[i] = r < 0 ? 0 : (r > 255 ? 255 : r);
                data[i + 1] = g < 0 ? 0 : (g > 255 ? 255 : g);
                data[i + 2] = b < 0 ? 0 : (b > 255 ? 255 : b);
            }
        }

        if (eff.sharpness > 0) {
            applySharpnessPass(data, width, height, eff.sharpness);
        }
    };

    // --- Geometry Drawing Helper (Rotation 90°, Flip, Straighten with Auto-Zoom) ---
    const computeStraightenAutoZoom = (w, h, angleDeg) => {
        if (!angleDeg) return 1;
        const rad = (Math.abs(angleDeg) * Math.PI) / 180;
        const cosT = Math.cos(rad);
        const sinT = Math.sin(rad);
        const scaleW = cosT + sinT * (h / w);
        const scaleH = cosT + sinT * (w / h);
        return Math.max(scaleW, scaleH);
    };

    const drawTransformedSource = (ctx, img, targetW, targetH, state) => {
        ctx.save();
        ctx.translate(targetW / 2, targetH / 2);

        const autoZoom = computeStraightenAutoZoom(targetW, targetH, state.straighten);
        const sx = (state.flipX ? -1 : 1) * autoZoom;
        const sy = (state.flipY ? -1 : 1) * autoZoom;
        ctx.scale(sx, sy);

        if (state.straighten !== 0) {
            ctx.rotate((state.straighten * Math.PI) / 180);
        }

        if (state.rotation90 !== 0) {
            ctx.rotate((state.rotation90 * Math.PI) / 180);
        }

        const isSwapped = (state.rotation90 % 180) !== 0;
        const drawW = isSwapped ? targetH : targetW;
        const drawH = isSwapped ? targetW : targetH;
        ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
        ctx.restore();
    };

    // --- Rebuild Base Preview Buffer & Render Live Workspace ---
    const rebuildPreviewBase = () => {
        if (!currentSourceImage) return;
        const state = getCurrentState();
        const isSwapped = (state.rotation90 % 180) !== 0;
        orientedWidth = isSwapped ? currentSourceImage.naturalHeight : currentSourceImage.naturalWidth;
        orientedHeight = isSwapped ? currentSourceImage.naturalWidth : currentSourceImage.naturalHeight;

        const maxPreviewDim = 920;
        const pScale = Math.min(1, maxPreviewDim / Math.max(orientedWidth, orientedHeight));
        const pW = Math.max(1, Math.round(orientedWidth * pScale));
        const pH = Math.max(1, Math.round(orientedHeight * pScale));

        basePreviewCanvas.width = pW;
        basePreviewCanvas.height = pH;
        basePreviewCtx.clearRect(0, 0, pW, pH);
        drawTransformedSource(basePreviewCtx, currentSourceImage, pW, pH, state);
        basePreviewImageData = basePreviewCtx.getImageData(0, 0, pW, pH);
        workingPreviewImageData = workspaceCtx.createImageData(pW, pH);

        workspaceCanvas.width = pW;
        workspaceCanvas.height = pH;

        schedulePreviewRender();
    };

    const renderPreviewNow = () => {
        previewRafId = null;
        if (!basePreviewImageData || !workingPreviewImageData) return;

        const state = getCurrentState();
        workingPreviewImageData.data.set(basePreviewImageData.data);

        if (!isComparing && hasPixelAdjustments(state)) {
            applyPixelAdjustments(workingPreviewImageData, state, state.normCrop);
        }

        workspaceCtx.putImageData(workingPreviewImageData, 0, 0);
    };

    const schedulePreviewRender = () => {
        if (previewRafId) return;
        previewRafId = requestAnimationFrame(renderPreviewNow);
    };

    // --- Cropper Layout & Normalized Crop Mapping ---
    const getNumericAspectRatio = (aspectMode) => {
        if (aspectMode === 'free') return null;
        if (aspectMode === 'original') {
            return orientedWidth && orientedHeight ? (orientedWidth / orientedHeight) : 0.8;
        }
        return parseFloat(aspectMode) || 0.8;
    };

    const resetNormCropForAspect = (aspectMode) => {
        const state = getCurrentState();
        if (!orientedWidth || !orientedHeight) return;

        const ratio = getNumericAspectRatio(aspectMode);
        if (!ratio) {
            // Free mode: 90% centered box
            state.normCrop = { x: 0.05, y: 0.05, w: 0.9, h: 0.9 };
            return;
        }

        const imgAspect = orientedWidth / orientedHeight;
        let nw, nh;
        if (ratio >= imgAspect) {
            nw = 0.92;
            nh = (nw * imgAspect) / ratio;
        } else {
            nh = 0.92;
            nw = (nh * ratio) / imgAspect;
        }
        state.normCrop = {
            x: (1 - nw) / 2,
            y: (1 - nh) / 2,
            w: nw,
            h: nh
        };
    };

    const syncCropBoxFromNorm = () => {
        const state = getCurrentState();
        if (!state.normCrop) {
            resetNormCropForAspect(state.aspectMode);
        }
        const nc = state.normCrop;
        cropBox.x = imgRect.x + nc.x * imgRect.w;
        cropBox.y = imgRect.y + nc.y * imgRect.h;
        cropBox.w = nc.w * imgRect.w;
        cropBox.h = nc.h * imgRect.h;
        renderCropBoxDOM();
    };

    const syncNormFromCropBox = () => {
        const state = getCurrentState();
        if (imgRect.w <= 0 || imgRect.h <= 0) return;
        state.normCrop = {
            x: clamp((cropBox.x - imgRect.x) / imgRect.w, 0, 1),
            y: clamp((cropBox.y - imgRect.y) / imgRect.h, 0, 1),
            w: clamp(cropBox.w / imgRect.w, 0.05, 1),
            h: clamp(cropBox.h / imgRect.h, 0.05, 1)
        };
    };

    const renderCropBoxDOM = () => {
        cropBoxEl.style.left = `${cropBox.x}px`;
        cropBoxEl.style.top = `${cropBox.y}px`;
        cropBoxEl.style.width = `${cropBox.w}px`;
        cropBoxEl.style.height = `${cropBox.h}px`;
    };

    const relayoutWorkspace = () => {
        if (!currentSourceImage || !orientedWidth || !orientedHeight) return;
        const contW = container.clientWidth;
        const contH = container.clientHeight;
        if (contW <= 0 || contH <= 0) return;

        const padX = 28;
        const padY = 28;
        const availW = Math.max(80, contW - padX * 2);
        const availH = Math.max(80, contH - padY * 2);

        const scale = Math.min(availW / orientedWidth, availH / orientedHeight);
        imgRect.w = orientedWidth * scale;
        imgRect.h = orientedHeight * scale;
        imgRect.x = (contW - imgRect.w) / 2;
        imgRect.y = (contH - imgRect.h) / 2;

        workspaceCanvas.style.width = `${imgRect.w}px`;
        workspaceCanvas.style.height = `${imgRect.h}px`;
        workspaceCanvas.style.left = `${imgRect.x}px`;
        workspaceCanvas.style.top = `${imgRect.y}px`;

        syncCropBoxFromNorm();
    };

    // Observe workspace size changes (window resize, orientation change, bottom panel toggle)
    if (typeof ResizeObserver !== 'undefined') {
        const ro = new ResizeObserver(() => {
            if (editorView.classList.contains('active')) {
                relayoutWorkspace();
            }
        });
        ro.observe(container);
    } else {
        window.addEventListener('resize', () => {
            if (editorView.classList.contains('active')) {
                relayoutWorkspace();
            }
        });
    }

    // --- Interactive Crop Box Dragging (Unified Pointer Events with Corner Anchor Math) ---
    const getEventClientPos = (e) => {
        if (e.touches && e.touches.length > 0) {
            return { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }
        return { x: e.clientX, y: e.clientY };
    };

    const onCropDown = (e) => {
        if (!editorView.classList.contains('active')) return;
        if (e.target.closest('.workspace-floating-bar')) return;

        const handleEl = e.target.closest('.handle');
        if (handleEl) {
            dragType = handleEl.getAttribute('data-dir');
        } else if (e.target.closest('#crop-box')) {
            dragType = 'move';
        } else {
            return;
        }

        if (e.cancelable) e.preventDefault();

        isDraggingCrop = true;
        activePointerId = e.pointerId !== undefined ? e.pointerId : null;
        if (activePointerId !== null && container.setPointerCapture) {
            try { container.setPointerCapture(activePointerId); } catch (_) {}
        }

        const pos = getEventClientPos(e);
        dragStartX = pos.x;
        dragStartY = pos.y;
        initialCropBox = { ...cropBox };
        cropBoxEl.classList.add('dragging');
    };

    const onCropMove = (e) => {
        if (!isDraggingCrop || !initialCropBox) return;
        if (activePointerId !== null && e.pointerId !== undefined && e.pointerId !== activePointerId) return;
        if (e.cancelable) e.preventDefault();

        const pos = getEventClientPos(e);
        const dx = pos.x - dragStartX;
        const dy = pos.y - dragStartY;

        const state = getCurrentState();
        const lockedRatio = getNumericAspectRatio(state.aspectMode);
        const minSide = 44;

        if (dragType === 'move') {
            cropBox.x = clamp(initialCropBox.x + dx, imgRect.x, imgRect.x + imgRect.w - initialCropBox.w);
            cropBox.y = clamp(initialCropBox.y + dy, imgRect.y, imgRect.y + imgRect.h - initialCropBox.h);
            cropBox.w = initialCropBox.w;
            cropBox.h = initialCropBox.h;
        } else if (!lockedRatio) {
            // Freeform resize
            let left = initialCropBox.x;
            let top = initialCropBox.y;
            let right = initialCropBox.x + initialCropBox.w;
            let bottom = initialCropBox.y + initialCropBox.h;

            if (dragType.includes('w')) {
                left = clamp(left + dx, imgRect.x, right - minSide);
            }
            if (dragType.includes('e')) {
                right = clamp(right + dx, left + minSide, imgRect.x + imgRect.w);
            }
            if (dragType.includes('n')) {
                top = clamp(top + dy, imgRect.y, bottom - minSide);
            }
            if (dragType.includes('s')) {
                bottom = clamp(bottom + dy, top + minSide, imgRect.y + imgRect.h);
            }

            cropBox.x = left;
            cropBox.y = top;
            cropBox.w = right - left;
            cropBox.h = bottom - top;
        } else {
            // Fixed Aspect Ratio Resize with exact corner/edge anchoring
            const R = lockedRatio; // width / height
            const minW = Math.max(minSide, minSide * R);

            if (dragType === 'se' || dragType === 'sw' || dragType === 'ne' || dragType === 'nw') {
                const anchorX = (dragType === 'se' || dragType === 'ne')
                    ? initialCropBox.x
                    : initialCropBox.x + initialCropBox.w;
                const anchorY = (dragType === 'se' || dragType === 'sw')
                    ? initialCropBox.y
                    : initialCropBox.y + initialCropBox.h;

                const maxAvailW = (dragType === 'se' || dragType === 'ne')
                    ? (imgRect.x + imgRect.w) - anchorX
                    : anchorX - imgRect.x;
                const maxAvailH = (dragType === 'se' || dragType === 'sw')
                    ? (imgRect.y + imgRect.h) - anchorY
                    : anchorY - imgRect.y;

                const limitW = Math.min(maxAvailW, maxAvailH * R);
                const signX = (dragType === 'se' || dragType === 'ne') ? 1 : -1;
                const signY = (dragType === 'se' || dragType === 'sw') ? 1 : -1;

                const deltaFromX = signX * dx;
                const deltaFromY = signY * dy * R;
                const rawW = initialCropBox.w + (Math.abs(deltaFromX) > Math.abs(deltaFromY) ? deltaFromX : deltaFromY);

                const newW = clamp(rawW, Math.min(minW, limitW), limitW);
                const newH = newW / R;

                cropBox.w = newW;
                cropBox.h = newH;
                cropBox.x = (signX === 1) ? anchorX : anchorX - newW;
                cropBox.y = (signY === 1) ? anchorY : anchorY - newH;
            } else if (dragType === 'e' || dragType === 'w') {
                const anchorX = (dragType === 'e') ? initialCropBox.x : initialCropBox.x + initialCropBox.w;
                const centerY = initialCropBox.y + initialCropBox.h / 2;
                const maxAvailW = (dragType === 'e') ? (imgRect.x + imgRect.w) - anchorX : anchorX - imgRect.x;
                const maxAvailH = Math.min(centerY - imgRect.y, (imgRect.y + imgRect.h) - centerY) * 2;
                const limitW = Math.min(maxAvailW, maxAvailH * R);

                const signX = (dragType === 'e') ? 1 : -1;
                const newW = clamp(initialCropBox.w + signX * dx, Math.min(minW, limitW), limitW);
                const newH = newW / R;

                cropBox.w = newW;
                cropBox.h = newH;
                cropBox.x = (signX === 1) ? anchorX : anchorX - newW;
                cropBox.y = centerY - newH / 2;
            } else if (dragType === 'n' || dragType === 's') {
                const anchorY = (dragType === 's') ? initialCropBox.y : initialCropBox.y + initialCropBox.h;
                const centerX = initialCropBox.x + initialCropBox.w / 2;
                const maxAvailH = (dragType === 's') ? (imgRect.y + imgRect.h) - anchorY : anchorY - imgRect.y;
                const maxAvailW = Math.min(centerX - imgRect.x, (imgRect.x + imgRect.w) - centerX) * 2;
                const limitW = Math.min(maxAvailW, maxAvailH * R);

                const signY = (dragType === 's') ? 1 : -1;
                const newW = clamp(initialCropBox.w + signY * dy * R, Math.min(minW, limitW), limitW);
                const newH = newW / R;

                cropBox.w = newW;
                cropBox.h = newH;
                cropBox.x = centerX - newW / 2;
                cropBox.y = (signY === 1) ? anchorY : anchorY - newH;
            }
        }

        renderCropBoxDOM();
        syncNormFromCropBox();
        if (state.vignette !== 0) {
            schedulePreviewRender();
        }
    };

    const onCropUp = () => {
        if (!isDraggingCrop) return;
        isDraggingCrop = false;
        dragType = null;
        activePointerId = null;
        cropBoxEl.classList.remove('dragging');
    };

    if (window.PointerEvent) {
        container.addEventListener('pointerdown', onCropDown);
        window.addEventListener('pointermove', onCropMove, { passive: false });
        window.addEventListener('pointerup', onCropUp);
        window.addEventListener('pointercancel', onCropUp);
    } else {
        container.addEventListener('touchstart', onCropDown, { passive: false });
        window.addEventListener('touchmove', onCropMove, { passive: false });
        window.addEventListener('touchend', onCropUp);
        window.addEventListener('touchcancel', onCropUp);
        container.addEventListener('mousedown', onCropDown);
        window.addEventListener('mousemove', onCropMove);
        window.addEventListener('mouseup', onCropUp);
    }
    window.addEventListener('blur', onCropUp);
    container.addEventListener('dragstart', e => e.preventDefault());

    // --- Adjustment Sliders & Controls Wiring ---
    const onActiveSliderInput = () => {
        if (!activeTool || !ADJUSTMENT_TOOLS[activeTool]) return;
        const state = getCurrentState();
        const meta = ADJUSTMENT_TOOLS[activeTool];
        const val = parseInt(activeSlider.value, 10) || 0;
        state[activeTool] = val;
        activeToolVal.textContent = meta.bidirectional ? formatSignedValue(val) : `${val}`;
        updateSliderTrackFill(activeSlider, sliderFill, meta.bidirectional);
        updateToolIndicators();
        schedulePreviewRender();
    };

    activeSlider.addEventListener('input', onActiveSliderInput);
    activeSlider.addEventListener('change', onActiveSliderInput);

    // Double-click or Reset button on single slider
    const resetActiveSingleTool = () => {
        if (!activeTool || !ADJUSTMENT_TOOLS[activeTool]) return;
        const state = getCurrentState();
        const meta = ADJUSTMENT_TOOLS[activeTool];
        state[activeTool] = meta.default;
        activeSlider.value = meta.default;
        onActiveSliderInput();
    };
    btnResetSingle.addEventListener('click', resetActiveSingleTool);
    activeSlider.addEventListener('dblclick', resetActiveSingleTool);

    // Aspect Ratio Selection
    aspectPillsContainer.addEventListener('click', (e) => {
        const pill = e.target.closest('.aspect-pill');
        if (!pill) return;
        const ratioMode = pill.getAttribute('data-ratio');
        const state = getCurrentState();
        state.aspectMode = ratioMode;
        resetNormCropForAspect(ratioMode);
        syncCropBoxFromNorm();
        updateToolIndicators();
        if (state.vignette !== 0) schedulePreviewRender();
    });

    // Transform Controls (Rotate 90°, Flip H/V, Straighten)
    btnRotateCCW.addEventListener('click', () => {
        const state = getCurrentState();
        state.rotation90 = (state.rotation90 + 270) % 360;
        resetNormCropForAspect(state.aspectMode);
        rebuildPreviewBase();
        relayoutWorkspace();
        updateToolIndicators();
    });

    btnRotateCW.addEventListener('click', () => {
        const state = getCurrentState();
        state.rotation90 = (state.rotation90 + 90) % 360;
        resetNormCropForAspect(state.aspectMode);
        rebuildPreviewBase();
        relayoutWorkspace();
        updateToolIndicators();
    });

    btnFlipH.addEventListener('click', () => {
        const state = getCurrentState();
        state.flipX = !state.flipX;
        rebuildPreviewBase();
        updateToolIndicators();
    });

    btnFlipV.addEventListener('click', () => {
        const state = getCurrentState();
        state.flipY = !state.flipY;
        rebuildPreviewBase();
        updateToolIndicators();
    });

    const onStraightenInput = () => {
        const state = getCurrentState();
        state.straighten = parseFloat(straightenSlider.value) || 0;
        straightenVal.textContent = `${state.straighten > 0 ? '+' : ''}${state.straighten}°`;
        updateSliderTrackFill(straightenSlider, straightenFill, true);
        rebuildPreviewBase();
        updateToolIndicators();
    };
    straightenSlider.addEventListener('input', onStraightenInput);
    straightenSlider.addEventListener('change', onStraightenInput);

    btnResetTransform.addEventListener('click', () => {
        const state = getCurrentState();
        const rotChanged = state.rotation90 !== 0;
        state.rotation90 = 0;
        state.flipX = false;
        state.flipY = false;
        state.straighten = 0;
        if (rotChanged) resetNormCropForAspect(state.aspectMode);
        rebuildPreviewBase();
        relayoutWorkspace();
        updateToolIndicators();
    });

    // Filter Presets & Strength
    filterPillsContainer.addEventListener('click', (e) => {
        const pill = e.target.closest('.filter-pill');
        if (!pill) return;
        const filterName = pill.getAttribute('data-filter');
        const state = getCurrentState();
        state.filter = filterName;
        updateToolIndicators();
        schedulePreviewRender();
    });

    const onFilterStrengthInput = () => {
        const state = getCurrentState();
        state.filterStrength = parseInt(filterStrengthSlider.value, 10) || 0;
        filterStrengthVal.textContent = `${state.filterStrength}%`;
        updateSliderTrackFill(filterStrengthSlider, filterFill, false);
        schedulePreviewRender();
    };
    filterStrengthSlider.addEventListener('input', onFilterStrengthInput);
    filterStrengthSlider.addEventListener('change', onFilterStrengthInput);

    // Compare (Hold to see original) & Reset All
    const startCompare = (e) => {
        if (e && e.cancelable) e.preventDefault();
        isComparing = true;
        btnCompare.classList.add('comparing');
        schedulePreviewRender();
    };
    const endCompare = () => {
        if (!isComparing) return;
        isComparing = false;
        btnCompare.classList.remove('comparing');
        schedulePreviewRender();
    };
    btnCompare.addEventListener('mousedown', startCompare);
    btnCompare.addEventListener('touchstart', startCompare, { passive: false });
    window.addEventListener('mouseup', endCompare);
    window.addEventListener('touchend', endCompare);
    window.addEventListener('touchcancel', endCompare);

    btnResetAll.addEventListener('click', () => {
        const state = getCurrentState();
        const prevAspect = state.aspectMode;
        const prevCrop = state.normCrop ? { ...state.normCrop } : null;
        const rotWasSwapped = (state.rotation90 % 180) !== 0;

        imageStates[currentFileIndex] = createDefaultState();
        imageStates[currentFileIndex].aspectMode = prevAspect;
        if (!rotWasSwapped && prevCrop) {
            imageStates[currentFileIndex].normCrop = prevCrop;
        }

        rebuildPreviewBase();
        relayoutWorkspace();
        updateToolIndicators();
        showToast('補正をリセットしました');
    });

    // Batch Apply Settings to All Images
    btnApplyAll.addEventListener('click', () => {
        if (imageFiles.length <= 1) return;
        const current = getCurrentState();
        for (let i = 0; i < imageFiles.length; i++) {
            if (i === currentFileIndex) continue;
            const target = imageStates[i] || createDefaultState();
            for (const key of Object.keys(ADJUSTMENT_TOOLS)) {
                target[key] = current[key];
            }
            target.filter = current.filter;
            target.filterStrength = current.filterStrength;
            target.aspectMode = current.aspectMode;
            target.normCrop = null; // Recompute crop cleanly when that image loads
            imageStates[i] = target;
        }
        showToast(`全${imageFiles.length}枚に同じ補正・比率を適用しました`);
    });

    // --- File Loading (Button, Drag & Drop, Clipboard Paste) ---
    btnTriggerUpload.addEventListener('click', (e) => {
        e.stopPropagation();
        imageUpload.click();
    });

    dropZone.addEventListener('click', (e) => {
        if (e.target === btnTriggerUpload || btnTriggerUpload.contains(e.target)) return;
        imageUpload.click();
    });

    const handleSelectedFiles = (fileList) => {
        const validFiles = Array.from(fileList).filter(f => f.type.startsWith('image/') || /\.(jpe?g|png|webp|gif|bmp|avif|heic|heif)$/i.test(f.name));
        if (validFiles.length === 0) {
            showToast('対応している画像ファイルを選択してください');
            return;
        }

        imageFiles = validFiles;
        currentFileIndex = 0;
        imageStates = validFiles.map(() => createDefaultState());
        editedResults = new Array(validFiles.length).fill(null);

        showView(editorView);
        loadCurrentImage();
    };

    imageUpload.addEventListener('change', (e) => {
        if (e.target.files && e.target.files.length > 0) {
            const selected = Array.from(e.target.files);
            imageUpload.value = '';
            handleSelectedFiles(selected);
        }
    });

    // Drag & Drop support
    ['dragenter', 'dragover'].forEach(evtName => {
        window.addEventListener(evtName, (e) => {
            e.preventDefault();
            if (uploadView.classList.contains('active')) {
                dropZone.classList.add('drag-over');
            }
        });
    });

    ['dragleave', 'drop'].forEach(evtName => {
        window.addEventListener(evtName, (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-over');
        });
    });

    window.addEventListener('drop', (e) => {
        if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleSelectedFiles(e.dataTransfer.files);
        }
    });

    // Paste image from clipboard support
    window.addEventListener('paste', (e) => {
        if (!uploadView.classList.contains('active')) return;
        if (e.clipboardData && e.clipboardData.files && e.clipboardData.files.length > 0) {
            handleSelectedFiles(e.clipboardData.files);
        }
    });

    const loadCurrentImage = () => {
        const file = imageFiles[currentFileIndex];
        if (!file) return;

        // Update Header Progress & Multi-image Controls
        progressIndicator.textContent = `${currentFileIndex + 1} / ${imageFiles.length}`;
        btnApplyAll.style.display = imageFiles.length > 1 ? 'inline-flex' : 'none';
        btnNextImage.textContent = currentFileIndex < imageFiles.length - 1 ? '次の画像へ進む' : 'すべての編集を完了';
        btnProcess.textContent = '完了';
        btnProcess.disabled = false;

        if (currentObjectUrl) {
            URL.revokeObjectURL(currentObjectUrl);
            currentObjectUrl = null;
        }

        const img = new Image();
        img.onload = () => {
            currentSourceImage = img;
            const state = getCurrentState();

            const isSwapped = (state.rotation90 % 180) !== 0;
            orientedWidth = isSwapped ? img.naturalHeight : img.naturalWidth;
            orientedHeight = isSwapped ? img.naturalWidth : img.naturalHeight;

            if (!state.normCrop) {
                resetNormCropForAspect(state.aspectMode);
            }

            rebuildPreviewBase();
            relayoutWorkspace();
            updateToolIndicators();
            updateMenuScrollButtons();
        };

        img.onerror = () => {
            // Fallback to FileReader if ObjectURL fails
            const reader = new FileReader();
            reader.onload = (ev) => {
                img.src = ev.target.result;
            };
            reader.readAsDataURL(file);
        };

        currentObjectUrl = URL.createObjectURL(file);
        img.src = currentObjectUrl;
    };

    // --- High-Resolution Export Engine (Safe for iOS 16.7MP limit & All Browsers) ---
    const renderFinalExport = (img, state, originalFile, index) => {
        const isSwapped = (state.rotation90 % 180) !== 0;
        const fullOrientedW = isSwapped ? img.naturalHeight : img.naturalWidth;
        const fullOrientedH = isSwapped ? img.naturalWidth : img.naturalHeight;

        const nc = state.normCrop || { x: 0, y: 0, w: 1, h: 1 };
        const rawCropW = Math.max(1, Math.round(fullOrientedW * nc.w));
        const rawCropH = Math.max(1, Math.round(fullOrientedH * nc.h));

        // Cap maximum export dimension at 3200px (~10MP) so iOS Safari never hits the 16.7MP canvas limit
        const MAX_EXPORT_DIM = 3200;
        const exportScale = Math.min(1, MAX_EXPORT_DIM / Math.max(rawCropW, rawCropH));
        const outW = Math.max(1, Math.round(rawCropW * exportScale));
        const outH = Math.max(1, Math.round(rawCropH * exportScale));

        const finalCanvas = document.createElement('canvas');
        finalCanvas.width = outW;
        finalCanvas.height = outH;
        const ctx = finalCanvas.getContext('2d', { willReadFrequently: true });

        // Fill white background (for JPEGs)
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, outW, outH);

        // Draw transformed source shifted by normalized crop offset
        const virtualFullW = outW / nc.w;
        const virtualFullH = outH / nc.h;
        ctx.save();
        ctx.translate(-nc.x * virtualFullW, -nc.y * virtualFullH);
        drawTransformedSource(ctx, img, virtualFullW, virtualFullH, state);
        ctx.restore();

        // Apply identical pixel adjustments across all browsers/OSes
        if (hasPixelAdjustments(state)) {
            const exportImageData = ctx.getImageData(0, 0, outW, outH);
            applyPixelAdjustments(exportImageData, state, { x: 0, y: 0, w: 1, h: 1 });
            ctx.putImageData(exportImageData, 0, 0);
        }

        const dataUrl = finalCanvas.toDataURL('image/jpeg', 0.92);
        const blob = dataURLToBlob(dataUrl);
        const filename = buildSafeFilename(originalFile, index);

        return { dataUrl, blob, filename };
    };

    // --- Navigation & Saving Actions ---
    btnBack.addEventListener('click', () => {
        if (currentFileIndex > 0) {
            currentFileIndex--;
            loadCurrentImage();
        } else {
            resetApp();
        }
    });

    btnResultBack.addEventListener('click', () => {
        showView(editorView);
        btnProcess.textContent = '完了';
        btnProcess.disabled = false;
        requestAnimationFrame(relayoutWorkspace);
    });

    btnProcess.addEventListener('click', () => {
        if (!currentSourceImage) return;
        btnProcess.textContent = '処理中...';
        btnProcess.disabled = true;

        setTimeout(() => {
            try {
                const state = getCurrentState();
                const file = imageFiles[currentFileIndex];
                const res = renderFinalExport(currentSourceImage, state, file, currentFileIndex);
                editedResults[currentFileIndex] = res;

                resultImage.src = res.dataUrl;
                resultTitlePill.textContent = imageFiles.length > 1
                    ? `完成画像 (${currentFileIndex + 1} / ${imageFiles.length})`
                    : '完成画像';

                // Show native share button if supported (iOS / Android / Windows Share)
                btnShareImage.style.display = canUseWebShareFiles() ? 'inline-flex' : 'none';

                showView(resultView);
            } catch (err) {
                console.error(err);
                showToast('画像の処理中にエラーが発生しました');
            } finally {
                btnProcess.textContent = '完了';
                btnProcess.disabled = false;
            }
        }, 30);
    });

    // One-Click Direct Save Button
    btnDownloadImage.addEventListener('click', () => {
        const res = editedResults[currentFileIndex];
        if (!res) return;
        triggerBlobDownload(res.blob, res.filename);
        showToast('画像を保存しました');
    });

    // Native Share / Save to Photos Button (for iPhone / Android / supported browsers)
    btnShareImage.addEventListener('click', async () => {
        const res = editedResults[currentFileIndex];
        if (!res) return;
        try {
            const shareFile = new File([res.blob], res.filename, { type: 'image/jpeg' });
            await navigator.share({
                files: [shareFile],
                title: res.filename
            });
        } catch (err) {
            if (err && err.name !== 'AbortError') {
                triggerBlobDownload(res.blob, res.filename);
                showToast('画像を保存しました');
            }
        }
    });

    // Next Image or Complete View
    btnNextImage.addEventListener('click', () => {
        if (currentFileIndex < imageFiles.length - 1) {
            currentFileIndex++;
            showView(editorView);
            loadCurrentImage();
        } else {
            renderCompleteView();
            showView(completeView);
        }
    });

    const renderCompleteView = () => {
        const validResults = editedResults.filter(Boolean);
        batchGallery.innerHTML = '';

        if (validResults.length > 1) {
            completeSubtitle.textContent = `全${validResults.length}枚の編集が完了しました`;
            batchGallery.style.display = 'grid';
            btnDownloadAll.style.display = 'inline-flex';

            validResults.forEach((res, idx) => {
                const card = document.createElement('div');
                card.className = 'batch-item';

                const imgEl = document.createElement('img');
                imgEl.src = res.dataUrl;
                imgEl.alt = `編集済み画像 ${idx + 1}`;

                const saveBtn = document.createElement('button');
                saveBtn.type = 'button';
                saveBtn.className = 'batch-item-btn';
                saveBtn.textContent = `保存 (${idx + 1})`;
                saveBtn.addEventListener('click', () => {
                    triggerBlobDownload(res.blob, res.filename);
                    showToast(`画像 ${idx + 1} を保存しました`);
                });

                card.appendChild(imgEl);
                card.appendChild(saveBtn);
                batchGallery.appendChild(card);
            });
        } else {
            completeSubtitle.textContent = '画像の編集と出力が完了しました';
            batchGallery.style.display = 'none';
            btnDownloadAll.style.display = 'none';
        }
    };

    btnDownloadAll.addEventListener('click', () => {
        const validResults = editedResults.filter(Boolean);
        validResults.forEach((res, idx) => {
            setTimeout(() => {
                triggerBlobDownload(res.blob, res.filename);
            }, idx * 250);
        });
        showToast(`${validResults.length}枚の画像を順次保存しています`);
    });

    btnRestart.addEventListener('click', resetApp);
});
