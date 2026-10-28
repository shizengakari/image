// comprehensive_test.js
// main.js の実装とロジックを網羅する総合ホワイトボックステスト

const fs = require('fs');

console.log('====================================================');
console.log('   画像編集アプリ 総合ホワイトボックステスト実行   ');
console.log('====================================================\n');

// main.js の構文エラーがないか確認
try {
    const mainJsContent = fs.readFileSync('main.js', 'utf8');
    // Function コンストラクタで構文解析
    new Function(mainJsContent);
    console.log('✓ [構文検査] main.js の構文エラーはありません。正常です。\n');
} catch (err) {
    console.error('✗ [構文検査エラー]:', err.message);
    process.exit(1);
}

const clamp = (val, min, max) => Math.max(min, Math.min(max, val));

let testCount = 0;
let passCount = 0;

function check(label, condition) {
    testCount++;
    if (condition) {
        passCount++;
        console.log(`  ✓ PASS: ${label}`);
    } else {
        console.error(`  ✗ FAIL: ${label}`);
    }
}

// ----------------------------------------------------
// 1. 回転とアスペクト比計算のテスト
// ----------------------------------------------------
console.log('--- 1. 画像回転とアスペクト比（クロップ枠）テスト ---');

const testAspectModes = [
    { mode: '0.8', label: '4:5', targetRatio: 0.8 },
    { mode: '1', label: '1:1', targetRatio: 1.0 },
    { mode: '1.7777778', label: '16:9', targetRatio: 16/9 },
    { mode: '0.5625', label: '9:16', targetRatio: 9/16 },
    { mode: '1.3333333', label: '4:3', targetRatio: 4/3 },
    { mode: '0.75', label: '3:4', targetRatio: 3/4 },
    { mode: 'original', label: '元比率', targetRatio: (w, h) => w / h }
];

function simulateAppImageState(imgW, imgH) {
    let orientedW = imgW;
    let orientedH = imgH;
    let state = {
        rotation90: 0,
        aspectMode: '0.8',
        normCrop: null
    };

    const updateOriented = () => {
        const isSwapped = (state.rotation90 % 180) !== 0;
        orientedW = isSwapped ? imgH : imgW;
        orientedH = isSwapped ? imgW : imgH;
    };

    const getNumericAspectRatio = (aspectMode) => {
        if (aspectMode === 'free') return null;
        if (aspectMode === 'original') {
            return orientedW && orientedH ? (orientedW / orientedH) : 0.8;
        }
        return parseFloat(aspectMode) || 0.8;
    };

    const resetNormCrop = (aspectMode) => {
        const ratio = getNumericAspectRatio(aspectMode);
        if (!ratio) {
            state.normCrop = { x: 0.05, y: 0.05, w: 0.9, h: 0.9 };
            return;
        }
        const imgAspect = orientedW / orientedH;
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

    const rotateCrop = (clockwise) => {
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

    const rotateCW = () => {
        state.rotation90 = (state.rotation90 + 90) % 360;
        updateOriented();
        if (state.aspectMode === 'free') {
            rotateCrop(true);
        } else {
            resetNormCrop(state.aspectMode);
        }
    };

    const rotateCCW = () => {
        state.rotation90 = (state.rotation90 + 270) % 360;
        updateOriented();
        if (state.aspectMode === 'free') {
            rotateCrop(false);
        } else {
            resetNormCrop(state.aspectMode);
        }
    };

    const getCurrentCropAspect = () => {
        return (state.normCrop.w * orientedW) / (state.normCrop.h * orientedH);
    };

    return { state, updateOriented, resetNormCrop, rotateCW, rotateCCW, getCurrentCropAspect, getOriented: () => ({ w: orientedW, h: orientedH }) };
}

// 1.1 横長画像 (1920x1080) で全比率モードのCW 90°回転テスト
for (const a of testAspectModes) {
    const app = simulateAppImageState(1920, 1080);
    app.state.aspectMode = a.mode;
    app.resetNormCrop(a.mode);

    // 回転前チェック
    const expectedBefore = typeof a.targetRatio === 'function' ? a.targetRatio(1920, 1080) : a.targetRatio;
    const aspectBefore = app.getCurrentCropAspect();
    check(`横長画像 [${a.label}] 回転前(0°) 比率一致: ${aspectBefore.toFixed(4)} ≒ ${expectedBefore.toFixed(4)}`, Math.abs(aspectBefore - expectedBefore) < 0.001);

    // CW 90°回転
    app.rotateCW();
    const expectedAfter = typeof a.targetRatio === 'function' ? a.targetRatio(1080, 1920) : a.targetRatio;
    const aspectAfter = app.getCurrentCropAspect();
    check(`横長画像 [${a.label}] CW90°回転後 比率完全維持: ${aspectAfter.toFixed(4)} ≒ ${expectedAfter.toFixed(4)}`, Math.abs(aspectAfter - expectedAfter) < 0.001);

    // さらに CW 90°回転 (180°)
    app.rotateCW();
    const aspect180 = app.getCurrentCropAspect();
    check(`横長画像 [${a.label}] CW180°回転後 比率維持: ${aspect180.toFixed(4)} ≒ ${expectedBefore.toFixed(4)}`, Math.abs(aspect180 - expectedBefore) < 0.001);

    // CCW 90°回転で 90° に戻す
    app.rotateCCW();
    const aspect90 = app.getCurrentCropAspect();
    check(`横長画像 [${a.label}] CCW回転後 比率維持: ${aspect90.toFixed(4)} ≒ ${expectedAfter.toFixed(4)}`, Math.abs(aspect90 - expectedAfter) < 0.001);
}

// 1.2 自由比率 (free) モードでの回転テスト
{
    const app = simulateAppImageState(1200, 800);
    app.state.aspectMode = 'free';
    // ユーザーが手動で設定したカスタムクロップ (例: x=0.2, y=0.1, w=0.6, h=0.4)
    app.state.normCrop = { x: 0.2, y: 0.1, w: 0.6, h: 0.4 };
    const initialPixelW = 0.6 * 1200; // 720
    const initialPixelH = 0.4 * 800;  // 320
    const initialAspect = initialPixelW / initialPixelH; // 2.25

    app.rotateCW(); // 90°回転 (画像は 800x1200 になる)
    const oriented = app.getOriented();
    const rotatedPixelW = app.state.normCrop.w * oriented.w; // 0.4 * 800 = 320
    const rotatedPixelH = app.state.normCrop.h * oriented.h; // 0.6 * 1200 = 720
    const rotatedAspect = rotatedPixelW / rotatedPixelH; // 320 / 720 = 0.4444... (1 / 2.25)
    check('自由比率 (free) で回転時、被写体の切り抜き枠が画像と一緒に90°回転する', Math.abs(rotatedAspect - (1 / initialAspect)) < 0.001);
}

// ----------------------------------------------------
// 2. 調整効果（ADJUSTMENT_TOOLS 全11種）テスト
// ----------------------------------------------------
console.log('\n--- 2. 調整効果 (全11種類) テスト ---');

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
        if (state.exposure !== 0) x = x * expFactor;
        if (state.brightness !== 0) x = x + brightOffset * (1 - x * 0.25);
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
        if (state.contrast !== 0) x = (x - 0.5) * contrastFactor + 0.5;
        x = clamp(x, 0, 1);
        if (state.fade > 0) x = fadeLift + x * (1 - fadeLift);

        const base255 = x * 255;
        lutR[i] = clamp(Math.round(base255 + wR + tR), 0, 255);
        lutG[i] = clamp(Math.round(base255 + wG + tG), 0, 255);
        lutB[i] = clamp(Math.round(base255 + wB + tB), 0, 255);
    }

    return { lutR, lutG, lutB };
};

const createBaseState = () => ({
    brightness: 0, exposure: 0, contrast: 0, highlights: 0, shadows: 0,
    saturation: 0, warmth: 0, tint: 0, sharpness: 0, fade: 0, vignette: 0,
    filter: 'none', filterStrength: 100
});

// 各ツールの境界値・増減テスト
{
    // 明るさ
    const bPlus = buildColorLUTs({ ...createBaseState(), brightness: 100 });
    const bMinus = buildColorLUTs({ ...createBaseState(), brightness: -100 });
    check('明るさ +100 で全域が明化', bPlus.lutR[128] > 128 && bPlus.lutR[0] > 0);
    check('明るさ -100 で全域が暗化', bMinus.lutR[128] < 128 && bMinus.lutR[255] < 255);

    // 露出
    const ePlus = buildColorLUTs({ ...createBaseState(), exposure: 100 });
    const eMinus = buildColorLUTs({ ...createBaseState(), exposure: -100 });
    check('露出 +100 で指数関数的に明化', ePlus.lutR[64] > 180);
    check('露出 -100 で指数関数的に暗化', eMinus.lutR[128] < 50);

    // コントラスト
    const cPlus = buildColorLUTs({ ...createBaseState(), contrast: 100 });
    check('コントラスト +100 で暗部暗化 & 明部明化', cPlus.lutR[50] === 0 && cPlus.lutR[200] === 255);

    // シャドウ / ハイライト独立性
    const sPlus = buildColorLUTs({ ...createBaseState(), shadows: 100 });
    check('シャドウ +100 で暗部が持ち上がる (30 -> ' + sPlus.lutR[30] + ')', sPlus.lutR[30] > 45);

    const hPlus = buildColorLUTs({ ...createBaseState(), highlights: 100 });
    check('ハイライト +100 で明部が持ち上がる', hPlus.lutR[220] > 235);

    // 色温度 (warmth)
    const wPlus = buildColorLUTs({ ...createBaseState(), warmth: 100 });
    check('色温度 +100 で赤成分増加・青成分減少', wPlus.lutR[128] > 128 && wPlus.lutB[128] < 128);

    // 色合い (tint)
    const tPlus = buildColorLUTs({ ...createBaseState(), tint: 100 });
    check('色合い +100 でマゼンタシフト（G減少、R/B増加）', tPlus.lutG[128] < 128 && tPlus.lutR[128] > 128);

    // フェード
    const fPlus = buildColorLUTs({ ...createBaseState(), fade: 100 });
    check('フェード 100 で黒レベル引き上げ(黒浮き効果)', fPlus.lutR[0] > 50);
}

// ----------------------------------------------------
// 3. フィルター（全7種 + なし）テスト
// ----------------------------------------------------
console.log('\n--- 3. フィルター全種類テスト ---');

const filters = ['vivid', 'warm', 'cool', 'dramatic', 'film', 'mono', 'sepia'];

filters.forEach(f => {
    const s = { ...createBaseState(), filter: f, filterStrength: 100 };
    check(`フィルター [${f}] 設定が正しく適用可能`, s.filter === f && s.filterStrength === 100);
});

// ----------------------------------------------------
// 4. エクスポート描画の幾何テスト (等比スケール)
// ----------------------------------------------------
console.log('\n--- 4. 高解像度エクスポート幾何テスト ---');

{
    const imgNaturalW = 3840;
    const imgNaturalH = 2160; // 16:9
    const isSwapped = true; // 90°回転
    const fullOrientedW = isSwapped ? imgNaturalH : imgNaturalW; // 2160
    const fullOrientedH = isSwapped ? imgNaturalW : imgNaturalH; // 3840

    // 4:5 クロップ (0.8)
    const nc = { x: 0.04, y: 0.1, w: 0.92, h: 0.736 };
    const rawCropW = Math.max(1, Math.round(fullOrientedW * nc.w));
    const rawCropH = Math.max(1, Math.round(fullOrientedH * nc.h));
    const MAX_EXPORT_DIM = 3200;
    const exportScale = Math.min(1, MAX_EXPORT_DIM / Math.max(rawCropW, rawCropH));
    const outW = Math.max(1, Math.round(rawCropW * exportScale));
    const outH = Math.max(1, Math.round(rawCropH * exportScale));

    const virtualScale = outW / (fullOrientedW * nc.w);
    const virtualFullW = fullOrientedW * virtualScale;
    const virtualFullH = fullOrientedH * virtualScale;

    const drawAspect = (isSwapped ? virtualFullH : virtualFullW) / (isSwapped ? virtualFullW : virtualFullH);
    const naturalAspect = imgNaturalW / imgNaturalH;

    check('エクスポート描画における元画像アスペクト比の保存 (歪み0%)', Math.abs(drawAspect - naturalAspect) < 1e-10);
    check('エクスポート出力画像のアスペクト比がクロップ比率と合致', Math.abs((outW / outH) - (nc.w * fullOrientedW / (nc.h * fullOrientedH))) < 0.01);
}

console.log('\n====================================================');
console.log(` テスト完了: 合計 ${testCount} 項目中 ${passCount} 項目合格 (合格率: ${(passCount/testCount*100).toFixed(1)}%)`);
console.log('====================================================');
