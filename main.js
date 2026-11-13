document.addEventListener('DOMContentLoaded', () => {
    // --- Views ---
    const uploadView = document.getElementById('upload-view');
    const editorView = document.getElementById('editor-view');
    const completeView = document.getElementById('complete-view');

    // --- Upload Elements ---
    const btnTriggerUpload = document.getElementById('btn-trigger-upload');
    const imageUpload = document.getElementById('image-upload');

    // --- Editor Header Elements ---
    const btnBack = document.getElementById('btn-back');
    const progressNav = document.getElementById('progress-nav');
    const btnPrevImage = document.getElementById('btn-prev-image');
    const progressIndicator = document.getElementById('progress-indicator');
    const btnNextEdit = document.getElementById('btn-next-edit');
    const btnUndo = document.getElementById('btn-undo');
    const btnRedo = document.getElementById('btn-redo');
    const btnProcess = document.getElementById('btn-process');
    const btnProcessLabel = document.getElementById('btn-process-label');
    const iconProcessCheck = document.getElementById('icon-process-check');
    const iconProcessNext = document.getElementById('icon-process-next');

    // --- Workspace & Cropper Elements ---
    const container = document.getElementById('cropper-container');
    const workspaceCanvas = document.getElementById('image-workspace');
    const workspaceCtx = workspaceCanvas.getContext('2d', { willReadFrequently: true });
    const cropBoxEl = document.getElementById('crop-box');
    const btnToggleZoom = document.getElementById('btn-toggle-zoom');
    const iconZoomOut = document.getElementById('icon-zoom-out');
    const iconZoomIn = document.getElementById('icon-zoom-in');
    const zoomToggleLabel = document.getElementById('zoom-toggle-label');
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
    const btnStepMinus = document.getElementById('btn-step-minus');
    const btnStepPlus = document.getElementById('btn-step-plus');
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
    const btnStraightenMinus = document.getElementById('btn-straighten-minus');
    const btnStraightenPlus = document.getElementById('btn-straighten-plus');

    const filterPillsContainer = document.getElementById('filter-pills');
    const filterSliderWrapper = document.getElementById('filter-slider-wrapper');
    const filterStrengthSlider = document.getElementById('filter-strength-slider');
    const filterStrengthVal = document.getElementById('filter-strength-val');
    const filterFill = document.getElementById('filter-fill');
    const btnFilterMinus = document.getElementById('btn-filter-minus');
    const btnFilterPlus = document.getElementById('btn-filter-plus');

    const toolMenuBar = document.getElementById('tool-menu-bar');
    const toolItems = Array.from(document.querySelectorAll('.tool-item'));

    // --- Complete & Save View Elements ---
    const btnCompleteBack = document.getElementById('btn-complete-back');
    const completeTitlePill = document.getElementById('complete-title-pill');
    const btnRestartTop = document.getElementById('btn-restart-top');
    const singleResultWrap = document.getElementById('single-result-wrap');
    const singleResultImage = document.getElementById('single-result-image');
    const batchGallery = document.getElementById('batch-gallery');

    const formatPillsContainer = document.getElementById('format-pills');
    const exportTotalSize = document.getElementById('export-total-size');
    const btnDownloadAll = document.getElementById('btn-download-all');
    const btnDownloadAllLabel = document.getElementById('btn-download-all-label');

    // --- Lightbox & Loading Overlay ---
    const lightboxModal = document.getElementById('lightbox-modal');
    const lightboxCounter = document.getElementById('lightbox-counter');
    const lightboxBody = document.getElementById('lightbox-body');
    const lightboxImage = document.getElementById('lightbox-image');
    const btnLightboxClose = document.getElementById('btn-lightbox-close');
    const btnLightboxPrev = document.getElementById('btn-lightbox-prev');
    const btnLightboxNext = document.getElementById('btn-lightbox-next');
    const btnLightboxEdit = document.getElementById('btn-lightbox-edit');
    const renderLoading = document.getElementById('render-loading');
    const renderLoadingText = document.getElementById('render-loading-text');

    const toastEl = document.getElementById('toast');

    // --- Adjustment Tool Metadata ---
    const ADJUSTMENT_TOOLS = {
        brightness: { label: '明るさ', min: -100, max: 100, default: 0, bidirectional: true },
        exposure:   { label: '露出', min: -100, max: 100, default: 0, bidirectional: true },
        contrast:   { label: 'コントラスト', min: -100, max: 100, default: 0, bidirectional: true },
        highlights: { label: 'ハイライト', min: -100, max: 100, default: 0, bidirectional: true },
        shadows:    { label: 'シャドウ', min: -100, max: 100, default: 0, bidirectional: true },
        saturation: { label: '彩度', min: -100, max: 100, default: 0, bidirectional: true },
        warmth:     { label: '色温度', min: -100, max: 100, default: 0, bidirectional: true },
        tint:       { label: '色合い', min: -100, max: 100, default: 0, bidirectional: true },
        sharpness:  { label: 'シャープ', min: 0, max: 100, default: 0, bidirectional: false },
        fade:       { label: 'フェード', min: 0, max: 100, default: 0, bidirectional: false },
        vignette:   { label: 'ビネット', min: -100, max: 100, default: 0, bidirectional: true }
    };

    const FORMAT_META = {
        'image/jpeg': { ext: 'jpg', label: 'JPEG', hasQuality: true },
        'image/png':  { ext: 'png', label: 'PNG',  hasQuality: false },
        'image/webp': { ext: 'webp', label: 'WebP', hasQuality: true }
    };

    const DEFAULT_ASPECT_MODE = '0.8'; // 4:5
    const MAX_HISTORY_STEPS = 50;

    const createDefaultState = () => ({
        aspectMode: DEFAULT_ASPECT_MODE,
        normCrop: null,
        rotation90: 0,
        flipX: false,
        flipY: false,
        straighten: 0,
        filter: 'none',
        filterStrength: 100,
        brightness: 0,
        exposure: 0,
        contrast: 0,
        highlights: 0,
        shadows: 0,
        saturation: 0,
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
    let imageHistories = [];
    let renderedStateSignatures = [];
    let thumbUrls = [];
    let encodedOutputs = [];
    let isReeditingFromComplete = false;
    let currentSourceImage = null;
    let currentObjectUrl = null;
    let activeTool = null;
    let isComparing = false;

    // --- Export Options State (Always Maximum Quality) ---
    let exportFormat = 'image/jpeg';
    const EXPORT_QUALITY = 1.0;
    let encodeGeneration = 0;
    let lightboxIndex = -1;

    // --- Preview Base Cache ---
    const basePreviewCanvas = document.createElement('canvas');
    const basePreviewCtx = basePreviewCanvas.getContext('2d', { willReadFrequently: true });
    let basePreviewImageData = null;
    let workingPreviewImageData = null;
    let previewRafId = null;

    // --- Cropper Display & Zoom Geometry ---
    // viewMode: 'full' shows entire image; 'crop' maximizes the cropped area to fill screen
    let viewMode = 'full';
    let orientedWidth = 0;
    let orientedHeight = 0;
    let imgRect = { x: 0, y: 0, w: 0, h: 0 };
    let cropBox = { x: 0, y: 0, w: 0, h: 0 };
    let layoutAnimTimer = null;

    // --- Pointer / Drag / Pinch Interaction State ---
    const activePointers = new Map();
    let isDraggingCrop = false;
    let isPinching = false;
    let dragType = null; // 'move' | 'pan-image' | 'nw'|'ne'|'sw'|'se'|'n'|'s'|'e'|'w'
    let activePointerId = null;
    let dragStartX = 0;
    let dragStartY = 0;
    let initialCropBox = null;
    let initialImgRect = null;
    let gestureSnapshot = null;
    let pinchStartDist = 0;
    let pinchStartMid = { x: 0, y: 0 };
    let pinchStartNormCrop = null;
    let pinchStartImgRect = null;
    let lastTapTime = 0;
    let lastTapPos = { x: 0, y: 0 };
    let wheelSnapshot = null;
    let wheelCommitTimer = null;
    let pendingSliderSnapshot = null;

    // --- Utility Functions ---
    const clamp = (val, min, max) => Math.max(min, Math.min(max, val));

    const supportsWebPEncode = (() => {
        try {
            const c = document.createElement('canvas');
            c.width = 1;
            c.height = 1;
            return c.toDataURL('image/webp').startsWith('data:image/webp');
        } catch (_) {
            return false;
        }
    })();

    const webpPill = formatPillsContainer ? formatPillsContainer.querySelector('[data-format="image/webp"]') : null;
    if (webpPill && !supportsWebPEncode) {
        webpPill.disabled = true;
        webpPill.title = 'このブラウザではWebP出力に対応していません';
    }

    let toastTimer = null;
    const showToast = (message) => {
        if (!toastEl) return;
        toastEl.textContent = message;
        toastEl.classList.add('show');
        if (toastTimer) clearTimeout(toastTimer);
        toastTimer = setTimeout(() => {
            toastEl.classList.remove('show');
        }, 1800);
    };

    const formatBytes = (bytes) => {
        if (!bytes || bytes < 0) return '0 B';
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    };

    const getCurrentState = () => {
        if (!imageStates[currentFileIndex]) {
            imageStates[currentFileIndex] = createDefaultState();
        }
        return imageStates[currentFileIndex];
    };

    const cloneState = (s) => ({
        ...s,
        normCrop: s.normCrop ? { ...s.normCrop } : null
    });

    const statesEqual = (a, b) => {
        if (!a || !b) return false;
        const keys = [
            'aspectMode', 'rotation90', 'flipX', 'flipY', 'straighten',
            'filter', 'filterStrength', ...Object.keys(ADJUSTMENT_TOOLS)
        ];
        for (const k of keys) {
            if (a[k] !== b[k]) return false;
        }
        if (!!a.normCrop !== !!b.normCrop) return false;
        if (a.normCrop && b.normCrop) {
            const eps = 1e-4;
            if (
                Math.abs(a.normCrop.x - b.normCrop.x) > eps ||
                Math.abs(a.normCrop.y - b.normCrop.y) > eps ||
                Math.abs(a.normCrop.w - b.normCrop.w) > eps ||
                Math.abs(a.normCrop.h - b.normCrop.h) > eps
            ) {
                return false;
            }
        }
        return true;
    };

    const getHistoryForIndex = (idx = currentFileIndex) => {
        if (!imageHistories[idx]) {
            imageHistories[idx] = { undo: [], redo: [] };
        }
        return imageHistories[idx];
    };

    const updateHistoryButtons = () => {
        const hist = getHistoryForIndex(currentFileIndex);
        if (btnUndo) btnUndo.disabled = hist.undo.length === 0;
        if (btnRedo) btnRedo.disabled = hist.redo.length === 0;
    };

    const pushHistorySnapshot = (prevState, prevViewMode = viewMode, idx = currentFileIndex) => {
        const current = imageStates[idx];
        if (!prevState || !current || statesEqual(prevState, current)) return false;
        const hist = getHistoryForIndex(idx);
        hist.undo.push({
            state: cloneState(prevState),
            viewMode: prevViewMode
        });
        if (hist.undo.length > MAX_HISTORY_STEPS) {
            hist.undo.shift();
        }
        hist.redo = [];
        if (idx === currentFileIndex) {
            updateHistoryButtons();
        }
        return true;
    };

    const applySnapshotEntry = (entry) => {
        const prev = getCurrentState();
        const next = cloneState(entry.state);
        const transformChanged = (
            prev.rotation90 !== next.rotation90 ||
            prev.flipX !== next.flipX ||
            prev.flipY !== next.flipY ||
            prev.straighten !== next.straighten
        );
        imageStates[currentFileIndex] = next;
        viewMode = entry.viewMode || 'full';
        updateOrientedDimensions();
        if (transformChanged) {
            rebuildPreviewBase();
        } else {
            schedulePreviewRender();
        }
        relayoutWorkspace(true);
        updateToolIndicators();
        updateHistoryButtons();
    };

    const performUndo = () => {
        const hist = getHistoryForIndex(currentFileIndex);
        if (hist.undo.length === 0) return;
        const currentEntry = { state: cloneState(getCurrentState()), viewMode };
        const prevEntry = hist.undo.pop();
        hist.redo.push(currentEntry);
        applySnapshotEntry(prevEntry);
    };

    const performRedo = () => {
        const hist = getHistoryForIndex(currentFileIndex);
        if (hist.redo.length === 0) return;
        const currentEntry = { state: cloneState(getCurrentState()), viewMode };
        const nextEntry = hist.redo.pop();
        hist.undo.push(currentEntry);
        applySnapshotEntry(nextEntry);
    };

    const formatSignedValue = (val, suffix = '') => {
        const num = Number(val);
        if (num === 0) return `0${suffix}`;
        return num > 0 ? `+${num}${suffix}` : `${num}${suffix}`;
    };

    const buildSafeFilename = (originalFile, index, format = exportFormat) => {
        const meta = FORMAT_META[format] || FORMAT_META['image/jpeg'];
        const rawName = (originalFile && originalFile.name) ? originalFile.name : `photo_${index + 1}`;
        const baseName = rawName.replace(/\.[^/.]+$/, '').replace(/[\\/:*?"<>|]/g, '_');
        return `${baseName || `photo_${index + 1}`}_edited.${meta.ext}`;
    };

    const triggerBlobDownload = (blob, filename) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    };

    const revokeEncodedUrls = () => {
        encodedOutputs.forEach(item => {
            if (item && item.objectUrl) {
                URL.revokeObjectURL(item.objectUrl);
            }
        });
        encodedOutputs = [];
    };

    const revokeThumbUrls = () => {
        thumbUrls.forEach(url => {
            if (url) URL.revokeObjectURL(url);
        });
        thumbUrls = [];
    };

    const showView = (viewEl) => {
        [uploadView, editorView, completeView].forEach(v => {
            if (v) v.classList.toggle('active', v === viewEl);
        });
    };

    const resetExportOptionsToDefault = () => {
        exportFormat = 'image/jpeg';
        if (formatPillsContainer) {
            Array.from(formatPillsContainer.querySelectorAll('.format-pill')).forEach(p => {
                p.classList.toggle('active', p.getAttribute('data-format') === exportFormat);
            });
        }
    };

    const resetApp = () => {
        closeActivePanel();
        closeLightbox();
        if (currentObjectUrl) {
            URL.revokeObjectURL(currentObjectUrl);
            currentObjectUrl = null;
        }
        revokeEncodedUrls();
        revokeThumbUrls();
        renderedStateSignatures = [];
        isReeditingFromComplete = false;
        currentSourceImage = null;
        imageUpload.value = '';
        imageFiles = [];
        currentFileIndex = 0;
        imageStates = [];
        imageHistories = [];
        viewMode = 'full';
        resetExportOptionsToDefault();
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

    // --- Check Modified State ---
    const hasPixelAdjustments = (state) => {
        if (!state) return false;
        for (const key of Object.keys(ADJUSTMENT_TOOLS)) {
            if (state[key] !== ADJUSTMENT_TOOLS[key].default) return true;
        }
        if (state.filter !== 'none' && state.filterStrength > 0) return true;
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

        Array.from(aspectPillsContainer.querySelectorAll('.aspect-pill')).forEach(pill => {
            pill.classList.toggle('active', pill.getAttribute('data-ratio') === state.aspectMode);
        });

        btnFlipH.classList.toggle('active', state.flipX);
        btnFlipV.classList.toggle('active', state.flipY);
        straightenSlider.value = state.straighten;
        straightenVal.textContent = `${state.straighten > 0 ? '+' : ''}${state.straighten}°`;
        updateSliderTrackFill(straightenSlider, straightenFill, true);

        Array.from(filterPillsContainer.querySelectorAll('.filter-pill')).forEach(pill => {
            pill.classList.toggle('active', pill.getAttribute('data-filter') === state.filter);
        });
        if (state.filter === 'none') {
            filterSliderWrapper.style.display = 'none';
            filterStrengthVal.style.display = 'none';
        } else {
            filterSliderWrapper.style.display = 'flex';
            filterStrengthVal.style.display = 'inline-block';
            filterStrengthSlider.value = state.filterStrength;
            filterStrengthVal.textContent = `${state.filterStrength}%`;
            updateSliderTrackFill(filterStrengthSlider, filterFill, false);
        }

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

        updateHistoryButtons();
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
    };

    const closeActivePanel = () => {
        activeTool = null;
        activeControlPanel.classList.remove('open');
        activeControlPanel.setAttribute('aria-hidden', 'true');
        updateToolIndicators();
    };

    // --- Direct One-Finger / Pointer Horizontal Scroll Support ---
    const enableHorizontalScroll = (scrollEl) => {
        if (!scrollEl) return;
        let isDown = false;
        let startX = 0;
        let startScrollLeft = 0;
        let moved = false;

        scrollEl.addEventListener('pointerdown', (e) => {
            if (e.pointerType === 'touch') return;
            isDown = true;
            moved = false;
            startX = e.clientX;
            startScrollLeft = scrollEl.scrollLeft;
        });

        window.addEventListener('pointermove', (e) => {
            if (!isDown || e.pointerType === 'touch') return;
            const dx = e.clientX - startX;
            if (Math.abs(dx) > 5) moved = true;
            if (moved) {
                scrollEl.scrollLeft = startScrollLeft - dx;
            }
        });

        const endDrag = () => {
            isDown = false;
        };
        window.addEventListener('pointerup', endDrag);
        window.addEventListener('pointercancel', endDrag);

        scrollEl.addEventListener('click', (e) => {
            if (moved) {
                e.preventDefault();
                e.stopPropagation();
                moved = false;
            }
        }, true);

        scrollEl.addEventListener('wheel', (e) => {
            if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
                e.preventDefault();
                scrollEl.scrollLeft += e.deltaY;
            }
        }, { passive: false });
    };

    [toolMenuBar, aspectPillsContainer, filterPillsContainer].forEach(enableHorizontalScroll);

    toolItems.forEach(btn => {
        btn.addEventListener('click', () => {
            const tool = btn.getAttribute('data-tool');
            openToolPanel(tool);
        });
    });

    [btnCloseSlider, btnCloseAspect, btnCloseTransform, btnCloseFilters].forEach(btn => {
        if (btn) btn.addEventListener('click', closeActivePanel);
    });

    // --- Cross-Browser Pixel Processing Engine ---
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

        const wR = state.warmth * 0.42;
        const wG = state.warmth * 0.08;
        const wB = -state.warmth * 0.42;

        const tR = state.tint * 0.22;
        const tG = -state.tint * 0.38;
        const tB = state.tint * 0.22;

        for (let i = 0; i < 256; i++) {
            let x = i / 255;

            if (state.exposure !== 0) {
                x = x * expFactor;
            }
            if (state.brightness !== 0) {
                x = x + brightOffset * (1 - x * 0.25);
            }
            x = clamp(x, 0, 1);

            if (state.shadows !== 0) {
                const sMask = Math.pow(1 - x, 1.7) * (x + 0.15);
                x += shadowAmt * sMask;
            }
            if (state.highlights !== 0) {
                const hMask = Math.pow(x, 1.7) * (1.15 - x);
                x += highlightAmt * hMask;
            }
            x = clamp(x, 0, 1);

            if (state.contrast !== 0) {
                x = (x - 0.5) * contrastFactor + 0.5;
            }
            x = clamp(x, 0, 1);

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

        const eff = { ...state };
        const fStrength = (state.filter !== 'none') ? (state.filterStrength / 100) : 0;

        if (fStrength > 0) {
            if (state.filter === 'vivid') {
                eff.contrast = clamp(eff.contrast + 18 * fStrength, -100, 100);
                eff.saturation = clamp(eff.saturation + 32 * fStrength, -100, 100);
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
        const hasSat = satVal !== 0;
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

                if (hasSat || isMono || isSepia) {
                    const lum = 0.299 * r + 0.587 * g + 0.114 * b;

                    if (hasSat) {
                        const boost = 1 + satVal;
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

    // --- Geometry Drawing Helper ---
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

    // --- Update Oriented Dimensions & Normalized Crop Helper ---
    const updateOrientedDimensions = () => {
        if (!currentSourceImage) return;
        const state = getCurrentState();
        const isSwapped = (state.rotation90 % 180) !== 0;
        orientedWidth = isSwapped ? currentSourceImage.naturalHeight : currentSourceImage.naturalWidth;
        orientedHeight = isSwapped ? currentSourceImage.naturalWidth : currentSourceImage.naturalHeight;
    };

    const rotateNormCrop = (clockwise = true) => {
        const state = getCurrentState();
        if (!state.normCrop) return;
        const { x, y, w, h } = state.normCrop;
        if (clockwise) {
            state.normCrop = {
                x: clamp(1 - (y + h), 0, 1),
                y: clamp(x, 0, 1),
                w: clamp(h, 0.05, 1),
                h: clamp(w, 0.05, 1)
            };
        } else {
            state.normCrop = {
                x: clamp(y, 0, 1),
                y: clamp(1 - (x + w), 0, 1),
                w: clamp(h, 0.05, 1),
                h: clamp(w, 0.05, 1)
            };
        }
    };

    // --- Rebuild Base Preview Buffer & Render Live Workspace ---
    const rebuildPreviewBase = () => {
        if (!currentSourceImage) return;
        updateOrientedDimensions();
        const state = getCurrentState();

        const maxPreviewDim = 1440;
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

    // --- Cropper Layout, Zoom-to-Crop & Normalized Crop Mapping ---
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

    const renderWorkspaceCanvasDOM = () => {
        workspaceCanvas.style.width = `${imgRect.w}px`;
        workspaceCanvas.style.height = `${imgRect.h}px`;
        workspaceCanvas.style.left = `${imgRect.x}px`;
        workspaceCanvas.style.top = `${imgRect.y}px`;
    };

    const renderCropBoxDOM = () => {
        cropBoxEl.style.left = `${cropBox.x}px`;
        cropBoxEl.style.top = `${cropBox.y}px`;
        cropBoxEl.style.width = `${cropBox.w}px`;
        cropBoxEl.style.height = `${cropBox.h}px`;
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
        const w = clamp(cropBox.w / imgRect.w, 0.04, 1);
        const h = clamp(cropBox.h / imgRect.h, 0.04, 1);
        state.normCrop = {
            x: clamp((cropBox.x - imgRect.x) / imgRect.w, 0, 1 - w),
            y: clamp((cropBox.y - imgRect.y) / imgRect.h, 0, 1 - h),
            w,
            h
        };
    };

    const updateZoomToggleUI = () => {
        if (!btnToggleZoom) return;
        const isCropMode = viewMode === 'crop';
        btnToggleZoom.classList.toggle('active', isCropMode);
        if (iconZoomOut) iconZoomOut.style.display = isCropMode ? 'block' : 'none';
        if (iconZoomIn) iconZoomIn.style.display = isCropMode ? 'none' : 'block';
        if (zoomToggleLabel) zoomToggleLabel.textContent = isCropMode ? '全体' : '拡大';
        btnToggleZoom.setAttribute('aria-label', isCropMode ? '全体表示に切替' : '切り抜き部分を最大表示');
    };

    const clearLayoutAnimation = () => {
        if (layoutAnimTimer) {
            clearTimeout(layoutAnimTimer);
            layoutAnimTimer = null;
        }
        workspaceCanvas.classList.remove('animate-layout');
        cropBoxEl.classList.remove('animate-layout');
    };

    const relayoutWorkspace = (animate = false) => {
        if (!currentSourceImage || !orientedWidth || !orientedHeight) return;
        const contW = container.clientWidth;
        const contH = container.clientHeight;
        if (contW <= 0 || contH <= 0) return;

        const state = getCurrentState();
        if (!state.normCrop) {
            resetNormCropForAspect(state.aspectMode);
        }
        const nc = state.normCrop;

        const padX = 24;
        const padY = 24;
        const availW = Math.max(80, contW - padX * 2);
        const availH = Math.max(80, contH - padY * 2);

        if (animate) {
            clearLayoutAnimation();
            workspaceCanvas.classList.add('animate-layout');
            cropBoxEl.classList.add('animate-layout');
            layoutAnimTimer = setTimeout(() => {
                workspaceCanvas.classList.remove('animate-layout');
                cropBoxEl.classList.remove('animate-layout');
                layoutAnimTimer = null;
            }, 300);
        } else {
            clearLayoutAnimation();
        }

        if (viewMode === 'crop') {
            const cropOrientedW = Math.max(1e-4, nc.w) * orientedWidth;
            const cropOrientedH = Math.max(1e-4, nc.h) * orientedHeight;
            const scale = Math.min(availW / cropOrientedW, availH / cropOrientedH);

            cropBox.w = cropOrientedW * scale;
            cropBox.h = cropOrientedH * scale;
            cropBox.x = (contW - cropBox.w) / 2;
            cropBox.y = (contH - cropBox.h) / 2;

            imgRect.w = orientedWidth * scale;
            imgRect.h = orientedHeight * scale;
            imgRect.x = cropBox.x - nc.x * imgRect.w;
            imgRect.y = cropBox.y - nc.y * imgRect.h;

            renderWorkspaceCanvasDOM();
            renderCropBoxDOM();
        } else {
            const scale = Math.min(availW / orientedWidth, availH / orientedHeight);
            imgRect.w = orientedWidth * scale;
            imgRect.h = orientedHeight * scale;
            imgRect.x = (contW - imgRect.w) / 2;
            imgRect.y = (contH - imgRect.h) / 2;

            renderWorkspaceCanvasDOM();
            syncCropBoxFromNorm();
        }

        updateZoomToggleUI();
    };

    if (typeof ResizeObserver !== 'undefined') {
        const ro = new ResizeObserver(() => {
            if (editorView.classList.contains('active')) {
                relayoutWorkspace(false);
            }
        });
        ro.observe(container);
    } else {
        window.addEventListener('resize', () => {
            if (editorView.classList.contains('active')) {
                relayoutWorkspace(false);
            }
        });
    }

    const toggleViewMode = () => {
        viewMode = (viewMode === 'crop') ? 'full' : 'crop';
        relayoutWorkspace(true);
    };

    if (btnToggleZoom) {
        btnToggleZoom.addEventListener('click', toggleViewMode);
    }

    // --- Zoom / Pinch Helper (aspect-ratio safe) ---
    const applyZoomToNormCrop = (baseNormCrop, scaleRatio, panNormDx = 0, panNormDy = 0) => {
        const state = getCurrentState();
        if (!orientedWidth || !orientedHeight) return;
        const nc = baseNormCrop || state.normCrop;
        const lockedRatio = getNumericAspectRatio(state.aspectMode);
        const imgAspect = orientedWidth / orientedHeight;

        const minNorm = Math.max(0.05, 44 / Math.min(orientedWidth, orientedHeight));
        let nw, nh;

        if (lockedRatio) {
            const maxW = Math.min(1, lockedRatio / imgAspect);
            const minW = Math.max(minNorm, minNorm * (lockedRatio / imgAspect));
            nw = clamp(nc.w / scaleRatio, Math.min(minW, maxW), maxW);
            nh = (nw * imgAspect) / lockedRatio;
            if (nh > 1) {
                nh = 1;
                nw = (nh * lockedRatio) / imgAspect;
            }
        } else {
            const maxFactor = Math.min(1 / nc.w, 1 / nc.h);
            const minFactor = Math.max(minNorm / nc.w, minNorm / nc.h);
            const factor = clamp(1 / scaleRatio, Math.min(minFactor, maxFactor), maxFactor);
            nw = nc.w * factor;
            nh = nc.h * factor;
        }

        const cx = nc.x + nc.w / 2 + panNormDx;
        const cy = nc.y + nc.h / 2 + panNormDy;
        const nx = clamp(cx - nw / 2, 0, 1 - nw);
        const ny = clamp(cy - nh / 2, 0, 1 - nh);

        state.normCrop = { x: nx, y: ny, w: nw, h: nh };
    };

    // --- Interactive Crop Box Dragging, Image Panning & Pinch Zoom ---
    const getEventClientPos = (e) => {
        if (e.touches && e.touches.length > 0) {
            return { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }
        return { x: e.clientX, y: e.clientY };
    };

    const getTwoPointerMetrics = () => {
        const pts = Array.from(activePointers.values());
        if (pts.length < 2) return null;
        const dx = pts[1].x - pts[0].x;
        const dy = pts[1].y - pts[0].y;
        return {
            dist: Math.hypot(dx, dy),
            mid: { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 }
        };
    };

    const normCropChanged = (a, b) => {
        if (!a || !b) return true;
        const eps = 1e-4;
        return (
            Math.abs(a.x - b.x) > eps ||
            Math.abs(a.y - b.y) > eps ||
            Math.abs(a.w - b.w) > eps ||
            Math.abs(a.h - b.h) > eps
        );
    };

    const onCropDown = (e) => {
        if (!editorView.classList.contains('active')) return;
        if (e.target.closest('.workspace-floating-bar')) return;

        const pos = getEventClientPos(e);
        const pid = e.pointerId !== undefined ? e.pointerId : 'mouse';
        activePointers.set(pid, { x: pos.x, y: pos.y });

        if (activePointers.size === 2) {
            if (e.cancelable) e.preventDefault();
            clearLayoutAnimation();
            isDraggingCrop = false;
            dragType = null;
            cropBoxEl.classList.remove('dragging', 'panning');

            const state = getCurrentState();
            if (!gestureSnapshot) {
                gestureSnapshot = { state: cloneState(state), viewMode };
            }
            const metrics = getTwoPointerMetrics();
            if (metrics) {
                isPinching = true;
                pinchStartDist = Math.max(10, metrics.dist);
                pinchStartMid = metrics.mid;
                pinchStartNormCrop = { ...state.normCrop };
                pinchStartImgRect = { ...imgRect };
            }
            return;
        }

        if (activePointers.size > 2) return;

        const handleEl = e.target.closest('.handle');
        const insideCropBox = !!e.target.closest('#crop-box');

        // Double-tap / double-click on workspace (not on handle) toggles Full <-> Crop zoom
        if (!handleEl) {
            const now = Date.now();
            const tapDist = Math.hypot(pos.x - lastTapPos.x, pos.y - lastTapPos.y);
            if (now - lastTapTime < 280 && tapDist < 24) {
                if (e.cancelable) e.preventDefault();
                lastTapTime = 0;
                isDraggingCrop = false;
                dragType = null;
                gestureSnapshot = null;
                toggleViewMode();
                return;
            }
            lastTapTime = now;
            lastTapPos = pos;
        }

        if (handleEl) {
            dragType = handleEl.getAttribute('data-dir');
        } else if (viewMode === 'crop') {
            dragType = 'pan-image';
        } else if (insideCropBox) {
            dragType = 'move';
        } else {
            return;
        }

        if (e.cancelable) e.preventDefault();
        clearLayoutAnimation();

        const state = getCurrentState();
        gestureSnapshot = { state: cloneState(state), viewMode };

        isDraggingCrop = true;
        activePointerId = pid;
        if (e.pointerId !== undefined && container.setPointerCapture) {
            try { container.setPointerCapture(e.pointerId); } catch (_) {}
        }

        dragStartX = pos.x;
        dragStartY = pos.y;
        initialCropBox = { ...cropBox };
        initialImgRect = { ...imgRect };
        cropBoxEl.classList.add('dragging');
        if (dragType === 'pan-image') {
            cropBoxEl.classList.add('panning');
        }
    };

    const onCropMove = (e) => {
        const pid = e.pointerId !== undefined ? e.pointerId : 'mouse';
        if (activePointers.has(pid)) {
            const p = getEventClientPos(e);
            activePointers.set(pid, { x: p.x, y: p.y });
        }

        if (isPinching && activePointers.size >= 2) {
            if (e.cancelable) e.preventDefault();
            const metrics = getTwoPointerMetrics();
            if (!metrics || !pinchStartNormCrop || !pinchStartImgRect) return;

            const scaleRatio = metrics.dist / pinchStartDist;
            const panDx = metrics.mid.x - pinchStartMid.x;
            const panDy = metrics.mid.y - pinchStartMid.y;
            const panNormDx = -panDx / Math.max(1, pinchStartImgRect.w * scaleRatio);
            const panNormDy = -panDy / Math.max(1, pinchStartImgRect.h * scaleRatio);

            applyZoomToNormCrop(pinchStartNormCrop, scaleRatio, panNormDx, panNormDy);
            viewMode = 'crop';
            relayoutWorkspace(false);
            if (getCurrentState().vignette !== 0) {
                schedulePreviewRender();
            }
            return;
        }

        if (!isDraggingCrop || !initialCropBox) return;
        if (activePointerId !== null && pid !== activePointerId) return;
        if (e.cancelable) e.preventDefault();

        const pos = getEventClientPos(e);
        const dx = pos.x - dragStartX;
        const dy = pos.y - dragStartY;

        const state = getCurrentState();
        const lockedRatio = getNumericAspectRatio(state.aspectMode);
        const minSide = 44;

        if (dragType === 'pan-image' && initialImgRect) {
            const minX = Math.min(cropBox.x, cropBox.x + cropBox.w - initialImgRect.w);
            const maxX = Math.max(cropBox.x, cropBox.x + cropBox.w - initialImgRect.w);
            const minY = Math.min(cropBox.y, cropBox.y + cropBox.h - initialImgRect.h);
            const maxY = Math.max(cropBox.y, cropBox.y + cropBox.h - initialImgRect.h);

            imgRect.x = clamp(initialImgRect.x + dx, minX, maxX);
            imgRect.y = clamp(initialImgRect.y + dy, minY, maxY);
            renderWorkspaceCanvasDOM();
            syncNormFromCropBox();
            if (state.vignette !== 0) {
                schedulePreviewRender();
            }
            return;
        }

        if (dragType === 'move') {
            cropBox.x = clamp(initialCropBox.x + dx, imgRect.x, imgRect.x + imgRect.w - initialCropBox.w);
            cropBox.y = clamp(initialCropBox.y + dy, imgRect.y, imgRect.y + imgRect.h - initialCropBox.h);
            cropBox.w = initialCropBox.w;
            cropBox.h = initialCropBox.h;
        } else if (!lockedRatio) {
            let left = initialCropBox.x;
            let top = initialCropBox.y;
            let right = initialCropBox.x + initialCropBox.w;
            let bottom = initialCropBox.y + initialCropBox.h;

            if (dragType.includes('w')) left = clamp(left + dx, imgRect.x, right - minSide);
            if (dragType.includes('e')) right = clamp(right + dx, left + minSide, imgRect.x + imgRect.w);
            if (dragType.includes('n')) top = clamp(top + dy, imgRect.y, bottom - minSide);
            if (dragType.includes('s')) bottom = clamp(bottom + dy, top + minSide, imgRect.y + imgRect.h);

            cropBox.x = left;
            cropBox.y = top;
            cropBox.w = right - left;
            cropBox.h = bottom - top;
        } else {
            const R = lockedRatio;
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

    const onCropUp = (e) => {
        const pid = (e && e.pointerId !== undefined) ? e.pointerId : 'mouse';
        if (e && e.type === 'blur') {
            activePointers.clear();
        } else {
            activePointers.delete(pid);
        }

        if (isPinching && activePointers.size < 2) {
            isPinching = false;
            pinchStartNormCrop = null;
            pinchStartImgRect = null;
            const state = getCurrentState();
            if (gestureSnapshot && normCropChanged(gestureSnapshot.state.normCrop, state.normCrop)) {
                pushHistorySnapshot(gestureSnapshot.state, gestureSnapshot.viewMode);
            }
            gestureSnapshot = null;
            relayoutWorkspace(true);
            return;
        }

        if (!isDraggingCrop) return;
        isDraggingCrop = false;
        const finishedDragType = dragType;
        dragType = null;
        activePointerId = null;
        cropBoxEl.classList.remove('dragging', 'panning');

        const state = getCurrentState();
        const changed = gestureSnapshot && normCropChanged(gestureSnapshot.state.normCrop, state.normCrop);
        if (changed) {
            pushHistorySnapshot(gestureSnapshot.state, gestureSnapshot.viewMode);
            if (viewMode === 'crop') {
                relayoutWorkspace(true);
            }
        } else if (finishedDragType === 'pan-image') {
            relayoutWorkspace(false);
        }
        gestureSnapshot = null;
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

    // Mouse Wheel Zoom on Workspace
    container.addEventListener('wheel', (e) => {
        if (!editorView.classList.contains('active') || !currentSourceImage) return;
        if (e.target.closest('.workspace-floating-bar')) return;
        e.preventDefault();

        const state = getCurrentState();
        if (!wheelSnapshot) {
            wheelSnapshot = { state: cloneState(state), viewMode };
        }
        if (wheelCommitTimer) clearTimeout(wheelCommitTimer);

        const zoomFactor = e.deltaY < 0 ? 1.09 : (1 / 1.09);
        applyZoomToNormCrop(state.normCrop, zoomFactor, 0, 0);
        viewMode = 'crop';
        relayoutWorkspace(false);
        if (state.vignette !== 0) {
            schedulePreviewRender();
        }

        wheelCommitTimer = setTimeout(() => {
            if (wheelSnapshot && normCropChanged(wheelSnapshot.state.normCrop, getCurrentState().normCrop)) {
                pushHistorySnapshot(wheelSnapshot.state, wheelSnapshot.viewMode);
            }
            wheelSnapshot = null;
            wheelCommitTimer = null;
        }, 350);
    }, { passive: false });

    // --- Adjustment Sliders & Controls Wiring ---
    const beginSliderGesture = () => {
        if (!pendingSliderSnapshot) {
            pendingSliderSnapshot = { state: cloneState(getCurrentState()), viewMode };
        }
    };

    const commitSliderGesture = () => {
        if (pendingSliderSnapshot) {
            pushHistorySnapshot(pendingSliderSnapshot.state, pendingSliderSnapshot.viewMode);
            pendingSliderSnapshot = null;
        }
    };

    const setupStepButton = (btn, actionFn) => {
        if (!btn) return;
        let timer = null;
        let interval = null;

        const stop = () => {
            if (timer) {
                clearTimeout(timer);
                timer = null;
            }
            if (interval) {
                clearInterval(interval);
                interval = null;
            }
            commitSliderGesture();
        };

        btn.addEventListener('pointerdown', (e) => {
            if (e.button !== 0) return;
            e.preventDefault();
            beginSliderGesture();
            actionFn();
            if (timer) clearTimeout(timer);
            if (interval) clearInterval(interval);
            timer = setTimeout(() => {
                interval = setInterval(() => {
                    actionFn();
                }, 65);
            }, 300);
        });

        btn.addEventListener('pointerup', stop);
        btn.addEventListener('pointerleave', stop);
        btn.addEventListener('pointercancel', stop);

        btn.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                beginSliderGesture();
                actionFn();
                commitSliderGesture();
            }
        });
    };

    const stepActiveSlider = (delta) => {
        if (!activeTool || !ADJUSTMENT_TOOLS[activeTool]) return;
        const meta = ADJUSTMENT_TOOLS[activeTool];
        const currentVal = parseInt(activeSlider.value, 10) || 0;
        const nextVal = clamp(currentVal + delta, meta.min, meta.max);
        if (nextVal !== currentVal) {
            activeSlider.value = nextVal;
            onActiveSliderInput();
        }
    };

    setupStepButton(btnStepMinus, () => stepActiveSlider(-1));
    setupStepButton(btnStepPlus, () => stepActiveSlider(1));

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

    activeSlider.addEventListener('pointerdown', beginSliderGesture);
    activeSlider.addEventListener('mousedown', beginSliderGesture);
    activeSlider.addEventListener('touchstart', beginSliderGesture, { passive: true });
    activeSlider.addEventListener('input', () => {
        beginSliderGesture();
        onActiveSliderInput();
    });
    activeSlider.addEventListener('change', () => {
        onActiveSliderInput();
        commitSliderGesture();
    });
    activeSlider.addEventListener('dblclick', () => {
        if (!activeTool || !ADJUSTMENT_TOOLS[activeTool]) return;
        const snap = { state: cloneState(getCurrentState()), viewMode };
        const meta = ADJUSTMENT_TOOLS[activeTool];
        getCurrentState()[activeTool] = meta.default;
        activeSlider.value = meta.default;
        onActiveSliderInput();
        pushHistorySnapshot(snap.state, snap.viewMode);
    });

    // Aspect Ratio Selection
    aspectPillsContainer.addEventListener('click', (e) => {
        const pill = e.target.closest('.aspect-pill');
        if (!pill) return;
        const ratioMode = pill.getAttribute('data-ratio');
        const state = getCurrentState();
        const prev = { state: cloneState(state), viewMode };

        state.aspectMode = ratioMode;
        resetNormCropForAspect(ratioMode);
        viewMode = 'full';
        pushHistorySnapshot(prev.state, prev.viewMode);

        relayoutWorkspace(true);
        updateToolIndicators();
        if (state.vignette !== 0) schedulePreviewRender();
    });

    // Transform Controls
    btnRotateCCW.addEventListener('click', () => {
        const state = getCurrentState();
        const prev = { state: cloneState(state), viewMode };
        state.rotation90 = (state.rotation90 + 270) % 360;
        updateOrientedDimensions();
        if (state.aspectMode === 'free') {
            rotateNormCrop(false);
        } else {
            resetNormCropForAspect(state.aspectMode);
            viewMode = 'full';
        }
        pushHistorySnapshot(prev.state, prev.viewMode);
        rebuildPreviewBase();
        relayoutWorkspace(true);
        updateToolIndicators();
    });

    btnRotateCW.addEventListener('click', () => {
        const state = getCurrentState();
        const prev = { state: cloneState(state), viewMode };
        state.rotation90 = (state.rotation90 + 90) % 360;
        updateOrientedDimensions();
        if (state.aspectMode === 'free') {
            rotateNormCrop(true);
        } else {
            resetNormCropForAspect(state.aspectMode);
            viewMode = 'full';
        }
        pushHistorySnapshot(prev.state, prev.viewMode);
        rebuildPreviewBase();
        relayoutWorkspace(true);
        updateToolIndicators();
    });

    btnFlipH.addEventListener('click', () => {
        const state = getCurrentState();
        const prev = { state: cloneState(state), viewMode };
        state.flipX = !state.flipX;
        pushHistorySnapshot(prev.state, prev.viewMode);
        rebuildPreviewBase();
        updateToolIndicators();
    });

    btnFlipV.addEventListener('click', () => {
        const state = getCurrentState();
        const prev = { state: cloneState(state), viewMode };
        state.flipY = !state.flipY;
        pushHistorySnapshot(prev.state, prev.viewMode);
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
    straightenSlider.addEventListener('pointerdown', beginSliderGesture);
    straightenSlider.addEventListener('mousedown', beginSliderGesture);
    straightenSlider.addEventListener('touchstart', beginSliderGesture, { passive: true });
    straightenSlider.addEventListener('input', () => {
        beginSliderGesture();
        onStraightenInput();
    });
    straightenSlider.addEventListener('change', () => {
        onStraightenInput();
        commitSliderGesture();
    });

    const stepStraightenSlider = (delta) => {
        const currentVal = parseFloat(straightenSlider.value) || 0;
        const nextVal = clamp(Math.round((currentVal + delta) * 2) / 2, -45, 45);
        if (nextVal !== currentVal) {
            straightenSlider.value = nextVal;
            onStraightenInput();
        }
    };
    setupStepButton(btnStraightenMinus, () => stepStraightenSlider(-0.5));
    setupStepButton(btnStraightenPlus, () => stepStraightenSlider(0.5));

    // Filter Presets & Strength
    filterPillsContainer.addEventListener('click', (e) => {
        const pill = e.target.closest('.filter-pill');
        if (!pill) return;
        const filterName = pill.getAttribute('data-filter');
        const state = getCurrentState();
        const prev = { state: cloneState(state), viewMode };
        state.filter = filterName;
        pushHistorySnapshot(prev.state, prev.viewMode);
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
    filterStrengthSlider.addEventListener('pointerdown', beginSliderGesture);
    filterStrengthSlider.addEventListener('mousedown', beginSliderGesture);
    filterStrengthSlider.addEventListener('touchstart', beginSliderGesture, { passive: true });
    filterStrengthSlider.addEventListener('input', () => {
        beginSliderGesture();
        onFilterStrengthInput();
    });
    filterStrengthSlider.addEventListener('change', () => {
        onFilterStrengthInput();
        commitSliderGesture();
    });

    const stepFilterSlider = (delta) => {
        const currentVal = parseInt(filterStrengthSlider.value, 10) || 0;
        const nextVal = clamp(currentVal + delta, 0, 100);
        if (nextVal !== currentVal) {
            filterStrengthSlider.value = nextVal;
            onFilterStrengthInput();
        }
    };
    setupStepButton(btnFilterMinus, () => stepFilterSlider(-1));
    setupStepButton(btnFilterPlus, () => stepFilterSlider(1));

    // Undo / Redo Buttons & Keyboard Shortcuts
    if (btnUndo) btnUndo.addEventListener('click', performUndo);
    if (btnRedo) btnRedo.addEventListener('click', performRedo);

    window.addEventListener('keydown', (e) => {
        if (!editorView.classList.contains('active')) return;
        if ((e.ctrlKey || e.metaKey) && !e.altKey) {
            const key = e.key.toLowerCase();
            if (key === 'z' && !e.shiftKey) {
                e.preventDefault();
                performUndo();
            } else if ((key === 'z' && e.shiftKey) || key === 'y') {
                e.preventDefault();
                performRedo();
            }
        }
    });

    // Compare With Original (Hold)
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
    if (window.PointerEvent) {
        btnCompare.addEventListener('pointerdown', startCompare);
        window.addEventListener('pointerup', endCompare);
        window.addEventListener('pointercancel', endCompare);
    } else {
        btnCompare.addEventListener('mousedown', startCompare);
        btnCompare.addEventListener('touchstart', startCompare, { passive: false });
        window.addEventListener('mouseup', endCompare);
        window.addEventListener('touchend', endCompare);
        window.addEventListener('touchcancel', endCompare);
    }

    // --- Universal Image Format Decoder (Camera / iPhone / Android / Desktop) ---
    const decodedBlobCache = new WeakMap();
    const externalScriptPromises = new Map();

    const loadExternalScript = (urls) => {
        const key = urls[0];
        if (externalScriptPromises.has(key)) {
            return externalScriptPromises.get(key);
        }
        const promise = new Promise((resolve, reject) => {
            let idx = 0;
            const tryNext = () => {
                if (idx >= urls.length) {
                    externalScriptPromises.delete(key);
                    reject(new Error('Script load failed'));
                    return;
                }
                const script = document.createElement('script');
                script.src = urls[idx++];
                script.async = true;
                script.onload = () => resolve();
                script.onerror = () => {
                    script.remove();
                    tryNext();
                };
                document.head.appendChild(script);
            };
            tryNext();
        });
        externalScriptPromises.set(key, promise);
        return promise;
    };

    const isSupportedImageFile = (file) => {
        if (!file) return false;
        if (file.type && file.type.startsWith('image/')) return true;
        return /\.(jpe?g|jfif|pjpeg|pjp|png|webp|gif|bmp|avif|svg|ico|heic|heif|hif|tif|tiff|dng|raw|cr2|cr3|nef|nrw|arw|srf|sr2|orf|rw2|raf|pef|srw|x3f|3fr|rwl|iiq)$/i.test(file.name || '');
    };

    const loadImageFromBlob = (blob) => {
        return new Promise((resolve, reject) => {
            const url = URL.createObjectURL(blob);
            const img = new Image();
            img.onload = () => {
                URL.revokeObjectURL(url);
                if (img.naturalWidth > 0 && img.naturalHeight > 0) {
                    resolve(img);
                } else {
                    reject(new Error('Zero dimension image'));
                }
            };
            img.onerror = () => {
                URL.revokeObjectURL(url);
                // Fallback via FileReader DataURL for quirky mobile browsers
                const reader = new FileReader();
                reader.onload = (ev) => {
                    const img2 = new Image();
                    img2.onload = () => {
                        if (img2.naturalWidth > 0 && img2.naturalHeight > 0) {
                            resolve(img2);
                        } else {
                            reject(new Error('Zero dimension image'));
                        }
                    };
                    img2.onerror = () => reject(new Error('Image decode failed'));
                    img2.src = ev.target.result;
                };
                reader.onerror = () => reject(new Error('FileReader failed'));
                reader.readAsDataURL(blob);
            };
            img.src = url;
        });
    };

    const sniffFormatFromHeader = (bytes) => {
        if (bytes.length < 12) return 'unknown';
        // ISO-BMFF (HEIC / HEIF / AVIF / CR3)
        if (bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70) {
            const brand = String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]).toLowerCase();
            if (['heic', 'heix', 'hevc', 'hevx', 'mif1', 'msf1', 'heim', 'heis', 'hevm', 'hevs'].includes(brand)) {
                return 'heic';
            }
            if (brand === 'crx ') return 'raw';
        }
        // Fujifilm RAF
        if (bytes[0] === 0x46 && bytes[1] === 0x55 && bytes[2] === 0x4A && bytes[3] === 0x49) {
            return 'raw';
        }
        // TIFF / DNG / CR2 / NEF / ARW / ORF / RW2
        if ((bytes[0] === 0x49 && bytes[1] === 0x49 && (bytes[2] === 0x2A || bytes[2] === 0x55)) ||
            (bytes[0] === 0x4D && bytes[1] === 0x4D && bytes[2] === 0x00 && bytes[3] === 0x2A)) {
            return 'tiff-or-raw';
        }
        return 'unknown';
    };

    // Walk JPEG markers cleanly to extract embedded full-res JPEG previews from RAW/DNG/CR2/CR3/NEF/ARW/RAF
    const findJpegEndOffset = (bytes, start) => {
        let pos = start + 2;
        const len = bytes.length;
        while (pos + 1 < len) {
            if (bytes[pos] !== 0xFF) return -1;
            while (pos < len && bytes[pos] === 0xFF) pos++;
            if (pos >= len) return -1;
            const marker = bytes[pos++];

            if (marker === 0xD9) return pos; // EOI
            if (marker === 0x00 || marker === 0x01 || (marker >= 0xD0 && marker <= 0xD8)) {
                continue;
            }
            if (pos + 1 >= len) return -1;
            const segLen = (bytes[pos] << 8) | bytes[pos + 1];
            if (segLen < 2 || pos + segLen > len) return -1;
            pos += segLen;

            if (marker === 0xDA) { // SOS: scan entropy-coded data until non-stuffed marker
                while (pos + 1 < len) {
                    if (bytes[pos] === 0xFF) {
                        const next = bytes[pos + 1];
                        if (next !== 0x00 && !(next >= 0xD0 && next <= 0xD7) && next !== 0xFF) {
                            if (next === 0xD9) return pos + 2;
                            break;
                        }
                    }
                    pos++;
                }
            }
        }
        return -1;
    };

    const extractLargestEmbeddedJpeg = async (bytes) => {
        const candidates = [];
        for (let i = 0; i < bytes.length - 4; i++) {
            if (bytes[i] === 0xFF && bytes[i + 1] === 0xD8 && bytes[i + 2] === 0xFF) {
                const end = findJpegEndOffset(bytes, i);
                if (end > i + 1024) {
                    candidates.push({ start: i, end, size: end - i });
                    i = end - 1;
                }
            }
        }
        candidates.sort((a, b) => b.size - a.size);
        for (const cand of candidates) {
            try {
                const blob = new Blob([bytes.subarray(cand.start, cand.end)], { type: 'image/jpeg' });
                const img = await loadImageFromBlob(blob);
                return { blob, img };
            } catch (_) {}
        }
        return null;
    };

    const decodeHeicBlob = async (file) => {
        if (typeof window.heic2any !== 'function') {
            await loadExternalScript([
                'https://cdn.jsdelivr.net/npm/heic2any@0.0.4/dist/heic2any.min.js',
                'https://unpkg.com/heic2any@0.0.4/dist/heic2any.min.js'
            ]);
        }
        if (typeof window.heic2any !== 'function') {
            throw new Error('heic2any unavailable');
        }
        const converted = await window.heic2any({
            blob: file,
            toType: 'image/jpeg',
            quality: 0.96
        });
        return Array.isArray(converted) ? converted[0] : converted;
    };

    const decodeTiffBlob = async (bytes) => {
        if (typeof window.UTIF === 'undefined') {
            await loadExternalScript([
                'https://cdn.jsdelivr.net/npm/utif@3.1.0/UTIF.min.js',
                'https://unpkg.com/utif@3.1.0/UTIF.min.js'
            ]);
        }
        if (typeof window.UTIF === 'undefined') {
            throw new Error('UTIF unavailable');
        }
        const buf = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
        const ifds = window.UTIF.decode(buf);
        if (!ifds || ifds.length === 0) throw new Error('Empty TIFF');
        // Pick largest IFD page
        let bestIfd = ifds[0];
        for (const ifd of ifds) {
            window.UTIF.decodeImage(buf, ifd);
            if ((ifd.width * ifd.height) > ((bestIfd.width || 0) * (bestIfd.height || 0))) {
                bestIfd = ifd;
            }
        }
        const rgba = window.UTIF.toRGBA8(bestIfd);
        const c = document.createElement('canvas');
        c.width = bestIfd.width;
        c.height = bestIfd.height;
        const ctx = c.getContext('2d');
        const imgData = new ImageData(new Uint8ClampedArray(rgba), bestIfd.width, bestIfd.height);
        ctx.putImageData(imgData, 0, 0);
        return new Promise((resolve, reject) => {
            c.toBlob((b) => (b ? resolve(b) : reject(new Error('TIFF toBlob failed'))), 'image/png');
        });
    };

    const loadDecodedImageForFile = async (file, onStatus) => {
        if (decodedBlobCache.has(file)) {
            return await loadImageFromBlob(decodedBlobCache.get(file));
        }

        const name = (file.name || '').toLowerCase();
        const isRawExt = /\.(dng|raw|cr2|cr3|nef|nrw|arw|srf|sr2|orf|rw2|raf|pef|srw|x3f|3fr|rwl|iiq)$/i.test(name);

        // 1. Try native browser decode first (handles JPEG, PNG, WebP, AVIF, GIF, BMP, SVG, and Safari HEIC/TIFF/DNG)
        try {
            const nativeImg = await loadImageFromBlob(file);
            // Guard against browsers that decode only a tiny EXIF thumbnail for large RAW files
            if (!(isRawExt && file.size > 500000 && Math.max(nativeImg.naturalWidth, nativeImg.naturalHeight) < 480)) {
                return nativeImg;
            }
        } catch (_) {}

        // 2. Inspect binary header for specialized formats
        const buf = await file.arrayBuffer();
        const bytes = new Uint8Array(buf);
        const sniff = sniffFormatFromHeader(bytes);
        const isHeic = /\.(heic|heif|hif)$/i.test(name) || sniff === 'heic' || (file.type && /heic|heif/i.test(file.type));
        const isTiff = /\.(tif|tiff)$/i.test(name) || (file.type && /tiff/i.test(file.type));

        if (isHeic) {
            if (onStatus) onStatus('HEIC/HEIF画像を変換しています...');
            const jpegBlob = await decodeHeicBlob(file);
            decodedBlobCache.set(file, jpegBlob);
            return await loadImageFromBlob(jpegBlob);
        }

        if (isRawExt || sniff === 'raw' || sniff === 'tiff-or-raw') {
            if (onStatus) onStatus('カメラ画像を読み込んでいます...');
            const extracted = await extractLargestEmbeddedJpeg(bytes);
            if (extracted) {
                decodedBlobCache.set(file, extracted.blob);
                return extracted.img;
            }
        }

        if (isTiff || sniff === 'tiff-or-raw') {
            if (onStatus) onStatus('TIFF画像を変換しています...');
            const pngBlob = await decodeTiffBlob(bytes);
            decodedBlobCache.set(file, pngBlob);
            return await loadImageFromBlob(pngBlob);
        }

        throw new Error('Unsupported or corrupted image format');
    };

    // --- File Loading & Multi-Image Editor Navigation ---
    btnTriggerUpload.addEventListener('click', () => {
        imageUpload.click();
    });

    const handleSelectedFiles = (fileList) => {
        const validFiles = Array.from(fileList).filter(isSupportedImageFile);
        if (validFiles.length === 0) {
            showToast('対応している画像が見つかりませんでした');
            return;
        }

        imageFiles = validFiles;
        currentFileIndex = 0;
        imageStates = validFiles.map(() => createDefaultState());
        imageHistories = validFiles.map(() => ({ undo: [], redo: [] }));
        renderedStateSignatures = [];
        isReeditingFromComplete = false;
        revokeEncodedUrls();
        revokeThumbUrls();
        viewMode = 'full';

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

    ['dragenter', 'dragover'].forEach(evtName => {
        window.addEventListener(evtName, (e) => {
            e.preventDefault();
            if (uploadView.classList.contains('active')) {
                btnTriggerUpload.classList.add('drag-over');
            }
        });
    });

    ['dragleave', 'drop'].forEach(evtName => {
        window.addEventListener(evtName, (e) => {
            e.preventDefault();
            btnTriggerUpload.classList.remove('drag-over');
        });
    });

    window.addEventListener('drop', (e) => {
        if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleSelectedFiles(e.dataTransfer.files);
        }
    });

    window.addEventListener('paste', (e) => {
        if (!uploadView.classList.contains('active')) return;
        if (e.clipboardData && e.clipboardData.files && e.clipboardData.files.length > 0) {
            handleSelectedFiles(e.clipboardData.files);
        }
    });

    const updateEditorHeaderForMulti = () => {
        const isMulti = imageFiles.length > 1;
        const isLast = currentFileIndex >= imageFiles.length - 1;
        const showCompleteCheck = isLast || isReeditingFromComplete;

        if (progressNav) progressNav.style.display = isMulti ? 'inline-flex' : 'none';
        if (progressIndicator) progressIndicator.textContent = `${currentFileIndex + 1} / ${imageFiles.length}`;
        if (btnPrevImage) btnPrevImage.disabled = currentFileIndex <= 0;
        if (btnNextEdit) btnNextEdit.disabled = isLast;

        if (!showCompleteCheck) {
            btnProcess.classList.remove('icon-only');
            btnProcessLabel.style.display = 'inline';
            btnProcessLabel.textContent = '次へ';
            iconProcessNext.style.display = 'block';
            iconProcessCheck.style.display = 'none';
            btnProcess.setAttribute('aria-label', '次の画像へ');
        } else {
            btnProcess.classList.add('icon-only');
            btnProcessLabel.style.display = 'none';
            iconProcessNext.style.display = 'none';
            iconProcessCheck.style.display = 'block';
            btnProcess.setAttribute('aria-label', '編集を完了');
        }
    };

    const setRenderLoading = (open, text = '画像を読み込んでいます...') => {
        if (!renderLoading) return;
        if (renderLoadingText) renderLoadingText.textContent = text;
        renderLoading.classList.toggle('open', open);
        renderLoading.setAttribute('aria-hidden', open ? 'false' : 'true');
    };

    const loadCurrentImage = async () => {
        const file = imageFiles[currentFileIndex];
        if (!file) return;
        const targetIndex = currentFileIndex;

        updateEditorHeaderForMulti();
        btnProcess.disabled = true;

        if (currentObjectUrl) {
            URL.revokeObjectURL(currentObjectUrl);
            currentObjectUrl = null;
        }

        let loadingShown = false;
        const loadingTimer = setTimeout(() => {
            loadingShown = true;
            setRenderLoading(true, '画像を読み込んでいます...');
        }, 180);

        try {
            const img = await loadDecodedImageForFile(file, (msg) => {
                loadingShown = true;
                setRenderLoading(true, msg);
            });
            clearTimeout(loadingTimer);
            if (loadingShown) setRenderLoading(false);

            if (targetIndex !== currentFileIndex) return;
            currentSourceImage = img;
            const state = getCurrentState();

            const isSwapped = (state.rotation90 % 180) !== 0;
            orientedWidth = isSwapped ? img.naturalHeight : img.naturalWidth;
            orientedHeight = isSwapped ? img.naturalWidth : img.naturalHeight;

            if (!state.normCrop) {
                resetNormCropForAspect(state.aspectMode);
            }

            viewMode = 'full';

            rebuildPreviewBase();
            relayoutWorkspace(false);
            updateToolIndicators();
            btnProcess.disabled = false;
        } catch (err) {
            clearTimeout(loadingTimer);
            if (loadingShown) setRenderLoading(false);
            console.error(err);
            btnProcess.disabled = false;
            showToast('この画像形式を読み込めませんでした');
        }
    };

    if (btnPrevImage) {
        btnPrevImage.addEventListener('click', () => {
            if (currentFileIndex > 0) {
                currentFileIndex--;
                loadCurrentImage();
            }
        });
    }

    if (btnNextEdit) {
        btnNextEdit.addEventListener('click', () => {
            if (currentFileIndex < imageFiles.length - 1) {
                currentFileIndex++;
                loadCurrentImage();
            }
        });
    }

    // --- High-Resolution Export Engine (Format-Independent Canvas + Async Encoder) ---
    const renderFinalCanvas = (img, state, originalFile, index) => {
        const isSwapped = (state.rotation90 % 180) !== 0;
        const fullOrientedW = isSwapped ? img.naturalHeight : img.naturalWidth;
        const fullOrientedH = isSwapped ? img.naturalWidth : img.naturalHeight;

        const nc = state.normCrop || { x: 0, y: 0, w: 1, h: 1 };
        const rawCropW = Math.max(1, Math.round(fullOrientedW * nc.w));
        const rawCropH = Math.max(1, Math.round(fullOrientedH * nc.h));

        const MAX_EXPORT_DIM = 3200;
        const exportScale = Math.min(1, MAX_EXPORT_DIM / Math.max(rawCropW, rawCropH));
        const outW = Math.max(1, Math.round(rawCropW * exportScale));
        const outH = Math.max(1, Math.round(rawCropH * exportScale));

        const finalCanvas = document.createElement('canvas');
        finalCanvas.width = outW;
        finalCanvas.height = outH;
        const ctx = finalCanvas.getContext('2d', { willReadFrequently: true });

        const virtualScale = outW / (fullOrientedW * nc.w);
        const virtualFullW = fullOrientedW * virtualScale;
        const virtualFullH = fullOrientedH * virtualScale;
        ctx.save();
        ctx.translate(-nc.x * virtualFullW, -nc.y * virtualFullH);
        drawTransformedSource(ctx, img, virtualFullW, virtualFullH, state);
        ctx.restore();

        if (hasPixelAdjustments(state)) {
            const exportImageData = ctx.getImageData(0, 0, outW, outH);
            applyPixelAdjustments(exportImageData, state, { x: 0, y: 0, w: 1, h: 1 });
            ctx.putImageData(exportImageData, 0, 0);
        }

        return { canvas: finalCanvas, width: outW, height: outH, originalFile, index };
    };

    const createThumbnailBlob = (canvas, maxDim = 480) => {
        return new Promise((resolve) => {
            const maxSide = Math.max(canvas.width, canvas.height);
            const scale = maxSide > maxDim ? (maxDim / maxSide) : 1;
            const tw = Math.max(1, Math.round(canvas.width * scale));
            const th = Math.max(1, Math.round(canvas.height * scale));
            const tc = document.createElement('canvas');
            tc.width = tw;
            tc.height = th;
            const tctx = tc.getContext('2d');
            tctx.fillStyle = '#f1f5f9';
            tctx.fillRect(0, 0, tw, th);
            tctx.imageSmoothingEnabled = true;
            tctx.imageSmoothingQuality = 'high';
            tctx.drawImage(canvas, 0, 0, tw, th);

            const finish = (blob) => {
                tc.width = 0;
                tc.height = 0;
                resolve(blob);
            };

            if (tc.toBlob) {
                tc.toBlob((blob) => finish(blob), 'image/jpeg', 0.85);
            } else {
                try {
                    const dataUrl = tc.toDataURL('image/jpeg', 0.85);
                    const bstr = atob(dataUrl.split(',')[1]);
                    let n = bstr.length;
                    const u8arr = new Uint8Array(n);
                    while (n--) u8arr[n] = bstr.charCodeAt(n);
                    finish(new Blob([u8arr], { type: 'image/jpeg' }));
                } catch (_) {
                    finish(null);
                }
            }
        });
    };

    const encodeCanvasToBlob = (canvas, format, quality) => {
        return new Promise((resolve, reject) => {
            let opaqueCanvas = null;
            let sourceCanvas = canvas;
            // JPEG has no alpha channel; composite onto black background cleanly
            if (format === 'image/jpeg') {
                opaqueCanvas = document.createElement('canvas');
                opaqueCanvas.width = canvas.width;
                opaqueCanvas.height = canvas.height;
                const octx = opaqueCanvas.getContext('2d');
                octx.fillStyle = '#000000';
                octx.fillRect(0, 0, opaqueCanvas.width, opaqueCanvas.height);
                octx.drawImage(canvas, 0, 0);
                sourceCanvas = opaqueCanvas;
            }

            const releaseTemp = () => {
                if (opaqueCanvas) {
                    opaqueCanvas.width = 0;
                    opaqueCanvas.height = 0;
                    opaqueCanvas = null;
                }
            };

            const qArg = (format === 'image/png') ? undefined : quality;
            if (sourceCanvas.toBlob) {
                sourceCanvas.toBlob((blob) => {
                    releaseTemp();
                    if (blob) {
                        resolve(blob);
                    } else {
                        reject(new Error('Canvas encoding failed'));
                    }
                }, format, qArg);
            } else {
                try {
                    const dataUrl = sourceCanvas.toDataURL(format, qArg);
                    releaseTemp();
                    const parts = dataUrl.split(',');
                    const mimeMatch = parts[0].match(/:(.*?);/);
                    const mime = mimeMatch ? mimeMatch[1] : format;
                    const bstr = atob(parts[1]);
                    let n = bstr.length;
                    const u8arr = new Uint8Array(n);
                    while (n--) u8arr[n] = bstr.charCodeAt(n);
                    resolve(new Blob([u8arr], { type: mime }));
                } catch (err) {
                    releaseTemp();
                    reject(err);
                }
            }
        });
    };

    const enterReeditAtIndex = (targetIdx) => {
        isReeditingFromComplete = true;
        currentFileIndex = targetIdx;
        showView(editorView);
        loadCurrentImage();
    };

    const reencodeAllAndRenderCompleteView = async ({ reuseThumbs = false, loadingPrefix = '仕上げ中' } = {}) => {
        const gen = ++encodeGeneration;
        const nextOutputs = [];
        const nextThumbUrls = reuseThumbs ? thumbUrls.slice() : new Array(imageFiles.length).fill(null);
        const nextSignatures = new Array(imageFiles.length).fill('');
        const previousUrlSet = new Set(encodedOutputs.map(o => o && o.objectUrl).filter(Boolean));
        const previousThumbSet = new Set(thumbUrls.filter(Boolean));
        const newlyCreatedUrls = [];
        const newlyCreatedThumbs = [];
        let totalBytes = 0;

        for (let i = 0; i < imageFiles.length; i++) {
            const state = imageStates[i] || createDefaultState();
            const sig = JSON.stringify(state) + '|' + exportFormat;
            const prevOut = encodedOutputs[i];

            if (prevOut && renderedStateSignatures[i] === sig) {
                nextOutputs.push(prevOut);
                nextThumbUrls[i] = prevOut.thumbUrl || thumbUrls[i] || null;
                nextSignatures[i] = sig;
                totalBytes += prevOut.blob.size;
                continue;
            }

            if (imageFiles.length > 1) {
                setRenderLoading(true, `${loadingPrefix} (${i + 1} / ${imageFiles.length})...`);
            }
            // Yield to UI thread so spinner/progress stays responsive
            await new Promise(r => setTimeout(r, 10));
            if (gen !== encodeGeneration) {
                newlyCreatedUrls.forEach(u => URL.revokeObjectURL(u));
                newlyCreatedThumbs.forEach(u => URL.revokeObjectURL(u));
                return;
            }

            const img = (i === currentFileIndex && currentSourceImage)
                ? currentSourceImage
                : await loadDecodedImageForFile(imageFiles[i]);
            if (gen !== encodeGeneration) {
                newlyCreatedUrls.forEach(u => URL.revokeObjectURL(u));
                newlyCreatedThumbs.forEach(u => URL.revokeObjectURL(u));
                return;
            }

            const rendered = renderFinalCanvas(img, state, imageFiles[i], i);

            let thumbUrl = nextThumbUrls[i] || null;
            if ((!reuseThumbs || !thumbUrl) && imageFiles.length > 1) {
                const thumbBlob = await createThumbnailBlob(rendered.canvas, 480);
                if (thumbBlob) {
                    thumbUrl = URL.createObjectURL(thumbBlob);
                    newlyCreatedThumbs.push(thumbUrl);
                }
                nextThumbUrls[i] = thumbUrl;
            }

            const blob = await encodeCanvasToBlob(rendered.canvas, exportFormat, EXPORT_QUALITY);
            // Immediately free full-res canvas backing store to stay well under mobile WebKit RAM caps
            rendered.canvas.width = 0;
            rendered.canvas.height = 0;

            if (gen !== encodeGeneration) {
                newlyCreatedUrls.forEach(u => URL.revokeObjectURL(u));
                newlyCreatedThumbs.forEach(u => URL.revokeObjectURL(u));
                return;
            }

            const objectUrl = URL.createObjectURL(blob);
            newlyCreatedUrls.push(objectUrl);
            const filename = buildSafeFilename(rendered.originalFile, rendered.index, exportFormat);
            totalBytes += blob.size;
            nextSignatures[i] = sig;
            nextOutputs.push({
                index: rendered.index,
                blob,
                objectUrl,
                thumbUrl,
                filename,
                width: rendered.width,
                height: rendered.height
            });
        }

        if (gen !== encodeGeneration) {
            newlyCreatedUrls.forEach(u => URL.revokeObjectURL(u));
            newlyCreatedThumbs.forEach(u => URL.revokeObjectURL(u));
            return;
        }

        const keptUrls = new Set(nextOutputs.map(o => o.objectUrl));
        previousUrlSet.forEach(u => {
            if (!keptUrls.has(u)) URL.revokeObjectURL(u);
        });
        const keptThumbs = new Set(nextThumbUrls.filter(Boolean));
        previousThumbSet.forEach(u => {
            if (!keptThumbs.has(u)) URL.revokeObjectURL(u);
        });

        thumbUrls = nextThumbUrls;
        renderedStateSignatures = nextSignatures;
        encodedOutputs = nextOutputs;

        const isSingle = encodedOutputs.length === 1;
        if (completeTitlePill) {
            completeTitlePill.textContent = isSingle ? '編集完了' : `${encodedOutputs.length}枚 編集完了`;
        }
        if (btnDownloadAllLabel) {
            btnDownloadAllLabel.textContent = isSingle ? '保存' : 'すべて保存';
        }

        const totalSizeText = isSingle ? formatBytes(totalBytes) : `合計 ${formatBytes(totalBytes)}`;
        if (exportTotalSize) exportTotalSize.textContent = totalSizeText;

        if (isSingle && encodedOutputs[0]) {
            const out = encodedOutputs[0];
            singleResultWrap.style.display = 'flex';
            batchGallery.style.display = 'none';
            batchGallery.classList.remove('batch-gallery--dense');
            singleResultImage.src = out.objectUrl;
        } else {
            singleResultWrap.style.display = 'none';
            batchGallery.style.display = 'grid';
            batchGallery.classList.toggle('batch-gallery--dense', encodedOutputs.length >= 5);
            batchGallery.innerHTML = '';

            encodedOutputs.forEach((out) => {
                const card = document.createElement('div');
                card.className = 'batch-item';

                const thumbWrap = document.createElement('div');
                thumbWrap.className = 'batch-item-thumb';
                thumbWrap.addEventListener('click', () => openLightbox(out.index));

                const imgEl = document.createElement('img');
                imgEl.loading = 'lazy';
                imgEl.decoding = 'async';
                imgEl.src = out.thumbUrl || out.objectUrl;
                imgEl.alt = out.filename;

                thumbWrap.appendChild(imgEl);

                const actions = document.createElement('div');
                actions.className = 'batch-item-actions';

                const editBtn = document.createElement('button');
                editBtn.type = 'button';
                editBtn.className = 'batch-item-btn';
                editBtn.textContent = '編集';
                editBtn.addEventListener('click', () => {
                    enterReeditAtIndex(out.index);
                });

                actions.appendChild(editBtn);

                card.appendChild(thumbWrap);
                card.appendChild(actions);
                batchGallery.appendChild(card);
            });
        }

        // Update Lightbox if open
        if (lightboxModal && lightboxModal.classList.contains('open')) {
            updateLightboxDisplay();
        }
    };

    const finishAllEditing = async () => {
        if (imageFiles.length === 0) return;
        closeActivePanel();
        btnProcess.disabled = true;
        setRenderLoading(true, imageFiles.length > 1 ? `仕上げ中 (1 / ${imageFiles.length})...` : '画像を仕上げています...');

        try {
            await reencodeAllAndRenderCompleteView({ reuseThumbs: false, loadingPrefix: '仕上げ中' });
            isReeditingFromComplete = false;
            showView(completeView);
            const completeBodyEl = completeView ? completeView.querySelector('.complete-body') : null;
            if (completeBodyEl) completeBodyEl.scrollTop = 0;
        } catch (err) {
            console.error(err);
            showToast('画像の仕上げ中にエラーが発生しました');
        } finally {
            setRenderLoading(false);
            btnProcess.disabled = false;
        }
    };

    // --- Lightbox Modal Controls ---
    const updateLightboxDisplay = () => {
        const pos = encodedOutputs.findIndex(o => o.index === lightboxIndex);
        const out = pos >= 0 ? encodedOutputs[pos] : null;
        if (!out) return;
        lightboxImage.src = out.objectUrl;
        const multi = encodedOutputs.length > 1;
        if (lightboxCounter) {
            lightboxCounter.textContent = multi ? `${pos + 1} / ${encodedOutputs.length}` : '';
            lightboxCounter.style.display = multi ? 'inline-flex' : 'none';
        }
        if (btnLightboxPrev) {
            btnLightboxPrev.style.display = multi ? 'inline-flex' : 'none';
            btnLightboxPrev.disabled = pos <= 0;
        }
        if (btnLightboxNext) {
            btnLightboxNext.style.display = multi ? 'inline-flex' : 'none';
            btnLightboxNext.disabled = pos >= encodedOutputs.length - 1;
        }
    };

    const stepLightbox = (delta) => {
        const pos = encodedOutputs.findIndex(o => o.index === lightboxIndex);
        if (pos < 0) return;
        const nextPos = pos + delta;
        if (nextPos < 0 || nextPos >= encodedOutputs.length) return;
        lightboxIndex = encodedOutputs[nextPos].index;
        updateLightboxDisplay();
    };

    const openLightbox = (index) => {
        const out = encodedOutputs.find(o => o.index === index);
        if (!out || !lightboxModal) return;
        lightboxIndex = index;
        updateLightboxDisplay();
        lightboxModal.classList.add('open');
        lightboxModal.setAttribute('aria-hidden', 'false');
    };

    const closeLightbox = () => {
        if (!lightboxModal) return;
        lightboxIndex = -1;
        lightboxModal.classList.remove('open');
        lightboxModal.setAttribute('aria-hidden', 'true');
    };

    if (btnLightboxClose) btnLightboxClose.addEventListener('click', closeLightbox);
    if (btnLightboxPrev) btnLightboxPrev.addEventListener('click', () => stepLightbox(-1));
    if (btnLightboxNext) btnLightboxNext.addEventListener('click', () => stepLightbox(1));

    if (lightboxBody) {
        let lbSwipeX = null;
        let lbSwipeY = null;
        let lbActivePid = null;
        let lbSuppressClickClose = false;

        if (lightboxImage) {
            lightboxImage.setAttribute('draggable', 'false');
            lightboxImage.addEventListener('dragstart', (e) => e.preventDefault());
        }

        const resetLbDragVisual = () => {
            if (lightboxImage) {
                lightboxImage.style.transition = '';
                lightboxImage.style.transform = '';
                lightboxImage.style.opacity = '';
            }
        };

        const finishLbSwipe = (clientX, clientY) => {
            if (lbSwipeX === null) return;
            const dx = clientX - lbSwipeX;
            const dy = clientY - lbSwipeY;
            lbSwipeX = null;
            lbSwipeY = null;
            lbActivePid = null;

            if (encodedOutputs.length > 1 && Math.abs(dx) > 42 && Math.abs(dx) > Math.abs(dy) * 1.1) {
                lbSuppressClickClose = true;
                setTimeout(() => { lbSuppressClickClose = false; }, 120);
                resetLbDragVisual();
                stepLightbox(dx < 0 ? 1 : -1);
                return;
            }
            if (Math.abs(dx) > 8) {
                lbSuppressClickClose = true;
                setTimeout(() => { lbSuppressClickClose = false; }, 120);
            }
            resetLbDragVisual();
        };

        if (window.PointerEvent) {
            lightboxBody.addEventListener('pointerdown', (e) => {
                if (e.button && e.button !== 0) return;
                lbSwipeX = e.clientX;
                lbSwipeY = e.clientY;
                lbActivePid = e.pointerId;
                if (lightboxImage) {
                    lightboxImage.style.transition = 'none';
                }
            });
            lightboxBody.addEventListener('pointermove', (e) => {
                if (lbSwipeX === null || e.pointerId !== lbActivePid || encodedOutputs.length <= 1) return;
                const dx = e.clientX - lbSwipeX;
                const dy = e.clientY - lbSwipeY;
                if (Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy)) {
                    const clamped = Math.max(-110, Math.min(110, dx));
                    if (lightboxImage) {
                        lightboxImage.style.transform = `translate3d(${clamped}px, 0, 0)`;
                    }
                }
            });
            lightboxBody.addEventListener('pointerup', (e) => {
                if (e.pointerId !== lbActivePid) return;
                finishLbSwipe(e.clientX, e.clientY);
            });
            lightboxBody.addEventListener('pointercancel', () => {
                lbSwipeX = null;
                lbSwipeY = null;
                lbActivePid = null;
                resetLbDragVisual();
            });
        } else {
            lightboxBody.addEventListener('touchstart', (e) => {
                if (!e.touches || !e.touches[0]) return;
                lbSwipeX = e.touches[0].clientX;
                lbSwipeY = e.touches[0].clientY;
            }, { passive: true });
            lightboxBody.addEventListener('touchend', (e) => {
                if (!e.changedTouches || !e.changedTouches[0]) return;
                finishLbSwipe(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
            });
        }

        if (lightboxModal) {
            lightboxModal.addEventListener('click', (e) => {
                if (lbSuppressClickClose) {
                    lbSuppressClickClose = false;
                    return;
                }
                if (e.target === lightboxModal || e.target === lightboxBody) {
                    closeLightbox();
                }
            });
        }
    } else if (lightboxModal) {
        lightboxModal.addEventListener('click', (e) => {
            if (e.target === lightboxModal || e.target.classList.contains('lightbox-body')) {
                closeLightbox();
            }
        });
    }

    window.addEventListener('keydown', (e) => {
        if (!lightboxModal || !lightboxModal.classList.contains('open')) return;
        if (e.key === 'ArrowRight') {
            e.preventDefault();
            stepLightbox(1);
        } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            stepLightbox(-1);
        } else if (e.key === 'Escape') {
            e.preventDefault();
            closeLightbox();
        }
    });

    if (btnLightboxEdit) {
        btnLightboxEdit.addEventListener('click', () => {
            if (lightboxIndex < 0) return;
            const targetIdx = lightboxIndex;
            closeLightbox();
            enterReeditAtIndex(targetIdx);
        });
    }
    // --- Format Selection ---
    if (formatPillsContainer) {
        formatPillsContainer.addEventListener('click', async (e) => {
            const pill = e.target.closest('.format-pill');
            if (!pill || pill.disabled) return;
            const nextFormat = pill.getAttribute('data-format');
            if (!nextFormat || nextFormat === exportFormat) return;
            exportFormat = nextFormat;
            Array.from(formatPillsContainer.querySelectorAll('.format-pill')).forEach(p => {
                p.classList.toggle('active', p.getAttribute('data-format') === exportFormat);
            });
            if (imageFiles.length > 1) {
                setRenderLoading(true, `形式を変換中 (1 / ${imageFiles.length})...`);
            }
            try {
                await reencodeAllAndRenderCompleteView({ reuseThumbs: true, loadingPrefix: '形式を変換中' });
            } finally {
                setRenderLoading(false);
            }
        });
    }

    // --- Navigation & Saving Actions ---
    const handleResetWithConfirm = () => {
        if (imageFiles.length > 0) {
            if (window.confirm('最初の画面に戻りますか？\n（編集内容や処理結果はリセットされます）')) {
                resetApp();
            }
        } else {
            resetApp();
        }
    };

    btnBack.addEventListener('click', () => {
        if (isReeditingFromComplete) {
            isReeditingFromComplete = false;
            showView(completeView);
            return;
        }
        if (currentFileIndex > 0) {
            currentFileIndex--;
            loadCurrentImage();
        } else {
            handleResetWithConfirm();
        }
    });

    if (btnCompleteBack) {
        btnCompleteBack.addEventListener('click', () => {
            enterReeditAtIndex(currentFileIndex);
        });
    }

    if (btnRestartTop) {
        btnRestartTop.addEventListener('click', handleResetWithConfirm);
    }

    btnProcess.addEventListener('click', () => {
        if (!currentSourceImage) return;
        if (!isReeditingFromComplete && currentFileIndex < imageFiles.length - 1) {
            currentFileIndex++;
            loadCurrentImage();
        } else {
            finishAllEditing();
        }
    });

    btnDownloadAll.addEventListener('click', () => {
        if (encodedOutputs.length === 0) return;
        encodedOutputs.forEach((out, idx) => {
            setTimeout(() => {
                triggerBlobDownload(out.blob, out.filename);
            }, idx * 250);
        });
        showToast(encodedOutputs.length === 1 ? '保存しました' : `${encodedOutputs.length}枚を保存しています`);
    });

    // --- 誤ってWebサイトを閉じないようにする確認画面 (beforeunload) ---
    window.addEventListener('beforeunload', (event) => {
        if (imageFiles && imageFiles.length > 0) {
            event.preventDefault();
            event.returnValue = '';
        }
    });

    // --- PWA: Service Worker 登録 & 自動アップデート ---
    try {
        if (sessionStorage.getItem('pwa_just_updated') === '1') {
            sessionStorage.removeItem('pwa_just_updated');
            showToast('アプリが最新版に更新されました');
        }
    } catch (_) {}

    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            const hadController = !!navigator.serviceWorker.controller;
            let refreshing = false;

            navigator.serviceWorker.addEventListener('controllerchange', () => {
                if (!hadController || refreshing) return;
                if (imageFiles.length === 0) {
                    refreshing = true;
                    try {
                        sessionStorage.setItem('pwa_just_updated', '1');
                    } catch (_) {}
                    window.location.reload();
                } else {
                    showToast('アプリが最新版に更新されました');
                }
            });

            navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' }).then((registration) => {
                registration.update();
            }).catch((err) => {
                console.log('[PWA] Service Worker 登録エラー:', err);
            });
        });
    }
});
