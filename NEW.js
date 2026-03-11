/* Various pattern Perforation tools

This is a handy tool designed for changing any patterns/images into perforatable files, which can be used in production. 
There are four different sizes of perforation holes set in this sketch, and the Dot sizes are controlled by the brightness of the loaded image.

Any questions, please contact Yuxi Chen: yuxi.chen@rolls-roycemotorcars.com

*/

//___________________________________ Parameters you can play with __________________________________________

let PixelToMilimeterRatio = 2.835; // Please check pixel-to-millimeter ratio in your Illustrator file
let globalSeed = Math.floor(Math.random() * 1e9);

let img;

let gridLayout = "square"; // "square" or "equilateral"

let dis1 = 2.69; // Distance for size1
let dis2 = 2.69; // Distance for size2
let dis3 = 2.69; // Distance for size3
let dis4 = 2.69; // Distance for size4
let brightnessMap = [];

let brightnessInfluence = 1; // Adjust this value to control how much brightness affects rotation


let size1 = 0.8; // Blue dots, change the dot radius
let size2 = 0.5; // Green dots, change the dot radius
let size3 = 0.3; // Red dots, change the dot radius
let size4 = 0.1; // Grey dots, change the dot radius

let colorRangeB = 0; // Black threshold for brightness mapping
let colorRangeW = 208; // White threshold for brightness mapping

let originalBrightnessMap = [];  // Store original, untouched brightness data

let randomValue = 0; // Switch from 0 to 0+ to randomize dot positions
let generalRotation = 50;
let Dots = { size1: [], size2: [], size3: [], size4: [] };

let enableWarp = false; // default OFF
let warpIntensity = 8;
let warpScale = 0.01;

let enableMask = false; // default OFF
let maskThreshold = 0.5;     // 0..1  (0 keeps almost all dots, 1 removes almost all)
let maskNoiseScale = 0.02;  // noise frequency for edge blending
let maskMap = [];


let shapeOptions = ["rect", "ellipse", "rhombus", "circle", "buthole1", "buthole2"];
let shapeIcons = {
  rect: "Icons/rectangle-05.png",
  ellipse: "Icons/elipse-03.png",
  rhombus: "Icons/Rhombus-04.png",
  circle: "Icons/circle-06.png",
  buthole1: "Icons/buthole1-07.png",
  buthole2: "Icons/buthole2-08.png"
};

let shapeBySize = {
  size1: "rect",
  size2: "rect",
  size3: "rect",
  size4: "rect"
};

let currentShapeIndex = 0;
let currentShape = shapeOptions[currentShapeIndex].type;



// ___________________________________ Warp cache helpers ___________________________________
let _warpCacheKey = null;
let _warpedBrightnessMap = null;

function warpKey({ enableWarp, warpIntensity, warpScale, img }) {
  return `${enableWarp}|${warpIntensity}|${warpScale}|${img?.width ?? 0}x${img?.height ?? 0}`;
}

function invalidateWarpCache() {
  _warpCacheKey = null;
}

function updateWarpIfNeeded({ enableWarp, warpIntensity, warpScale, img }) {
  if (!enableWarp) {
    brightnessMap = originalBrightnessMap;
    _warpCacheKey = null;
    _warpedBrightnessMap = null;
    return;
  }
  const key = warpKey({ enableWarp, warpIntensity, warpScale, img });

  if (key === _warpCacheKey && _warpedBrightnessMap) {
    brightnessMap = _warpedBrightnessMap;
    return;
  }

  warpBrightnessMap(warpIntensity, warpScale);

  _warpCacheKey = key;
  _warpedBrightnessMap = brightnessMap;
}


// ___________________________________ Mask cache helpers ___________________________________
let _maskCacheKey = null;

function maskKey({ maskThreshold, maskNoiseScale, colorRangeB, colorRangeW, img }) {
  // include image dimensions so a new image invalidates automatically
  return `${maskThreshold}|${maskNoiseScale}|${colorRangeB}|${colorRangeW}|${img?.width ?? 0}x${img?.height ?? 0}`;
}

function invalidateMaskCache() {
  _maskCacheKey = null;
}

function updateMaskIfNeeded({ enableMask, maskThreshold, maskNoiseScale, colorRangeB, colorRangeW, img }) {
  if (!enableMask) {
    maskMap = null;
    _maskCacheKey = null;
    return;
  }

  const key = maskKey({ maskThreshold, maskNoiseScale, colorRangeB, colorRangeW, img });
  if (key === _maskCacheKey) return;

  computeMaskMapSimple(); // heavy
  _maskCacheKey = key;
}

function num(id, fallback = 0) {
  const el = document.getElementById(id);
  const v = el ? parseFloat(el.value) : fallback;
  return Number.isFinite(v) ? v : fallback;
}

function bool(id, fallback = false) {
  const el = document.getElementById(id);
  return el ? !!el.checked : fallback;
}



//___________________________________ Debounce __________________________________________

function debounce(func, wait = 150) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

function toggleShapeForSize(sizeKey) {
  let current = shapeBySize[sizeKey];
  let index = shapeOptions.indexOf(current);
  let nextShape = shapeOptions[(index + 1) % shapeOptions.length];
  shapeBySize[sizeKey] = nextShape;

  // Update icon
  const icon = document.getElementById(`shapeIcon-${sizeKey}`);
  icon.src = shapeIcons[nextShape];

  updatePerforation(); // Redraw with new shape
}

function preload() {
  img = loadImage("Henry_Royce.jpg", function () {
    resizeCanvasToImage();
  }); // Input your own image
}
//___________________________________ Compute Brightness__________________________________________
function computeBrightnessMap() {
  img.loadPixels();
  originalBrightnessMap = [];

  for (let y = 0; y < img.height; y++) {
    let row = [];
    for (let x = 0; x < img.width; x++) {
      let i = 4 * (y * img.width + x);
      let r = img.pixels[i];
      let g = img.pixels[i + 1];
      let b = img.pixels[i + 2];
      let br = (r + g + b) / 3;
      row.push(br);
    }
    originalBrightnessMap.push(row);
  }

  brightnessMap = originalBrightnessMap;  // Also assign to main map initially
}


//___________________________________ Warp/Edge blend __________________________________________

const STEP = 4; // 2 or 4 are good. 4 = much faster.

function warpBrightnessMap(intensity = 10, scale = 0.01) {
  if (!originalBrightnessMap || originalBrightnessMap.length === 0) return;

  const step = STEP; // 4 = 16x fewer pixels processed
  let warped = [];

  // vector noise offsets (independent fields)
  const ox = 10000;
  const oy = 20000;

  for (let y = 0; y < img.height; y++) {
    let row = new Array(img.width);

    for (let x = 0; x < img.width; x++) {
      // Only compute warp at grid points, reuse for the block
      if (x % step !== 0 || y % step !== 0) continue;

      let vx = (noise(x * scale + ox, y * scale + ox) - 0.5) * 2;
      let vy = (noise(x * scale + oy, y * scale + oy) - 0.5) * 2;

      const len = Math.hypot(vx, vy) || 1;
      vx /= len; vy /= len;

      const dx = vx * intensity;
      const dy = vy * intensity;

      const nx = int(constrain(x + dx, 0, img.width - 1));
      const ny = int(constrain(y + dy, 0, img.height - 1));
      const sample = originalBrightnessMap[ny][nx];

      // Fill the whole block with the same warped sample (cheap)
      for (let by = 0; by < step; by++) {
        const yy = y + by;
        if (yy >= img.height) break;
        if (!warped[yy]) warped[yy] = new Array(img.width);
        for (let bx = 0; bx < step; bx++) {
          const xx = x + bx;
          if (xx >= img.width) break;
          warped[yy][xx] = sample;
        }
      }
    }

    // ensure row exists (for safety)
    if (!warped[y]) warped[y] = row;
  }

  brightnessMap = warped;
}



//___________________________________ Mask map __________________________________________
function smoothstep(edge0, edge1, x) {
  let t = constrain((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

function computeMaskMapSimple() {
  if (!originalBrightnessMap || originalBrightnessMap.length === 0) return;

  // Hard clamp endpoints
  if (maskThreshold <= 0.0001) {
    maskMap = Array.from({ length: img.height }, () => Array(img.width).fill(0));
    return;
  }
  if (maskThreshold >= 0.9999) {
    maskMap = Array.from({ length: img.height }, () => Array(img.width).fill(1));
    return;
  }

  const step = STEP;

  // Prep output (full resolution, but we fill it in blocks)
  maskMap = Array.from({ length: img.height }, () => new Array(img.width));

  // Levels window that can invert when B > W
  const invLevels = colorRangeB > colorRangeW;
  const low = Math.min(colorRangeB, colorRangeW);
  const high = Math.max(colorRangeB, colorRangeW);
  const range = Math.max(1e-6, high - low);

  // Convert your “transition in brightness units” into 0..1 levels space
  const transitionPx = 80;
  const transition01 = constrain(transitionPx / range, 0.001, 0.5);

  const strength = 0.6;
  const noiseGate = constrain(maskThreshold, 0, 1);

  for (let y = 0; y < img.height; y += step) {
    for (let x = 0; x < img.width; x += step) {
      // sample from the top-left of the block
      const brRaw = originalBrightnessMap[y][x];

      // 1) Levels normalize 0..1
      const brClamped = constrain(brRaw, low, high);
      let t01 = (brClamped - low) / range;
      if (invLevels) t01 = 1 - t01;

      // 2) Base mask (non-inverted)
      const base = smoothstep(maskThreshold - transition01, maskThreshold + transition01, t01);

      // 3) Subtract noise, then invert-after-subtract
      const n = noise(x * maskNoiseScale, y * maskNoiseScale); // 0..1
      let m = constrain(base - n * strength * noiseGate, 0, 1);
      m = 1 - m;

      // 4) Fill the whole block with this m
      for (let yy = y; yy < y + step && yy < img.height; yy++) {
        const row = maskMap[yy];
        for (let xx = x; xx < x + step && xx < img.width; xx++) {
          row[xx] = m;
        }
      }
    }
  }
}



//___________________________________ Canvas Setup __________________________________________

function setup() {
  let canvas = createCanvas(img.width, img.height, SVG);
  canvas.parent('sketch-holder');
  noLoop();
  img.loadPixels();
  computeBrightnessMap();
  //computeMaskMapSimple();
  //warpBrightnessMap(warpIntensity, warpScale);
  setupPerforation();
}

//___________________________________ Main Perforation Logic __________________________________________

function setupPerforation() {

  let diagonal = sqrt(width * width + height * height);

  Dots = { size1: [], size2: [], size3: [], size4: [] }; // Clear previous Dots


  size1 = size1 * PixelToMilimeterRatio; // Blue dots, change the dot radius
  size2 = size2 * PixelToMilimeterRatio; // Green dots, change the dot radius
  size3 = size3 * PixelToMilimeterRatio; // Red dots, change the dot radius
  size4 = size4 * PixelToMilimeterRatio; // Grey dots, change the dot radius

  let cos45 = cos(PI / 4);
  let sin45 = sin(PI / 4);
  let centerX = width / 2;
  let centerY = height / 2;

  //draw Dot 1
  new DotLayer({
    sizeKey: "size1",
    radius: size1,
    resolution: dis1,
    color: [0, 0, 255],
    index: 1
  }).generate({
    PixelToMilimeterRatio,
    gridLayout,
    brightnessMap,
    maskMap,
    Dots,
    width,
    height,
    randomValue,
    colorRangeB,
    colorRangeW,
    brightnessInfluence,
    noiseScale,
    generalRotation,
    centerX,
    centerY,
    diagonal,
    cos45,
    sin45,
    useBlackPreview: window.useBlackPreview
  });

  //draw Dot 2
  new DotLayer({
    sizeKey: "size2",
    radius: size2,
    resolution: dis2,
    color: [0, 255, 0],
    index: 2
  }).generate({
    PixelToMilimeterRatio,
    gridLayout,
    brightnessMap,
    Dots,
    maskMap,
    width,
    height,
    randomValue,
    colorRangeB,
    colorRangeW,
    brightnessInfluence,
    noiseScale,
    generalRotation,
    centerX,
    centerY,
    diagonal,
    cos45,
    sin45,
    useBlackPreview: window.useBlackPreview
  });

  //draw Dot 3
  new DotLayer({
    sizeKey: "size3",
    radius: size3,
    resolution: dis3,
    color: [255, 0, 0],
    index: 3
  }).generate({
    PixelToMilimeterRatio,
    gridLayout,
    brightnessMap,
    Dots,
    maskMap,
    width,
    height,
    randomValue,
    colorRangeB,
    colorRangeW,
    brightnessInfluence,
    noiseScale,
    generalRotation,
    centerX,
    centerY,
    diagonal,
    cos45,
    sin45,
    useBlackPreview: window.useBlackPreview
  });
  //draw Dot 4
  new DotLayer({
    sizeKey: "size4",
    radius: size4,
    resolution: dis4,
    color: [150, 0],
    index: 4
  }).generate({
    PixelToMilimeterRatio,
    gridLayout,
    brightnessMap,
    Dots,
    maskMap,
    width,
    height,
    randomValue,
    colorRangeB,
    colorRangeW,
    brightnessInfluence,
    noiseScale,
    generalRotation,
    centerX,
    centerY,
    diagonal,
    cos45,
    sin45,
    useBlackPreview: window.useBlackPreview
  });
  exportSVGWithLayers();
}
//___________________________________ Update Perforation When Sliders Change __________________________________________

function updatePerforation() {
  
  // --- Read UI ---
  gridLayout = document.getElementById("layoutMode").value;
  size1 = num("size1");
  size2 = num("size2");
  size3 = num("size3");
  size4 = num("size4");

  colorRangeB = num("colorRangeB");
  colorRangeW = num("colorRangeW");

  dis1 = max(num("dis1"), 0.50);
  dis2 = max(num("dis2"), 0.50);
  dis3 = max(num("dis3"), 0.50);
  dis4 = max(num("dis4"), 0.50);

  window.useBlackPreview = bool("blackPreviewToggle", false);

  brightnessInfluence = num("brightnessInfluence");
  noiseScale = num("noiseScale");
  generalRotation = num("generalRotation");
  randomValue = num("randomValue");

  // Warp
  const enableWarp = bool("enableWarp", false);
  const warpIntensityUI = num("warpIntensity");
  const warpScaleUI = num("warpScale");
  window.enableWarp = enableWarp;

  // Mask
  const enableMask = bool("enableMask", false);
  maskThreshold = num("maskThreshold", 0.5);
  maskNoiseScale = num("maskNoiseScale", 0.02);
  window.enableMask = enableMask;

  // --- Build maps ---
  //computeBrightnessMap(); // updates originalBrightnessMap

  updateMaskIfNeeded({
    enableMask,
    maskThreshold,
    maskNoiseScale,
    colorRangeB,
    colorRangeW,
    img
  });
  randomSeed(globalSeed);
  noiseSeed(globalSeed);
  
  updateWarpIfNeeded({
    enableWarp,
    warpIntensity: warpIntensityUI,
    warpScale: warpScaleUI,
    img
  });

  //console.log("enableWarp:", enableWarp, "warpIntensity:", warpIntensityUI, "warpScale:", warpScaleUI);

  // --- Generate dots + export ---
  setupPerforation();
}



//___________________________________ Export SVG __________________________________________

function exportSVGWithLayers() {
  clear();
  let svgElement = document.querySelector("svg");
  while (svgElement.firstChild) {
    svgElement.removeChild(svgElement.firstChild);
  }
  drawLayer(svgElement, Dots.size1, "Layer_Size1");
  drawLayer(svgElement, Dots.size2, "Layer_Size2");
  drawLayer(svgElement, Dots.size3, "Layer_Size3");
  drawLayer(svgElement, Dots.size4, "Layer_Size4");
}


// console.log("Selected shape:", shapeBySize.size1); // for debugging

const customShapes = {
  buthole1: "M7.55,3.35H1.72c-.73,0-1.33.51-1.33,1.13v.31c0,.62.6,1.13,1.33,1.13h5.83c.74,0,1.34-.51,1.34-1.13v-.31c0-.62-.6-1.13-1.34-1.13Z",
  buthole2: "M3.49,1.52h2.25c1.72,0,3.12,1.4,3.12,3.12v0c0,1.72-1.4,3.12-3.12,3.12h-2.25c-1.72,0-3.12-1.4-3.12-3.12v0c0-1.72,1.4-3.12,3.12-3.12Z"
};

function drawLayer(svgElement, rectArray, layerName) {
  const NS = "http://www.w3.org/2000/svg";

  const layerGroup = document.createElementNS(NS, "g");
  layerGroup.setAttribute("id", layerName);

  const sizeKey = layerName.split("_")[1].toLowerCase();
  const shapeType = shapeBySize[sizeKey];

  // If black preview is ON, avoid per-dot fill updates
  const blackPreview = !!window.useBlackPreview;
  if (blackPreview) layerGroup.setAttribute("fill", "black");

  const frag = document.createDocumentFragment();

  for (let r of rectArray) {
    let shape;

    if (shapeType === "ellipse") {
      shape = document.createElementNS(NS, "ellipse");
      shape.setAttribute("cx", r.x);
      shape.setAttribute("cy", r.y);
      shape.setAttribute("rx", r.size);
      shape.setAttribute("ry", r.size / 1.4);
      shape.setAttribute("transform", `rotate(${r.angle} ${r.x} ${r.y})`);

    } else if (shapeType === "rhombus") {
      shape = document.createElementNS(NS, "polygon");
      const halfW = r.size;
      const halfH = r.size / 2.5;
      shape.setAttribute(
        "points",
        `${r.x},${r.y - halfH} ${r.x + halfW},${r.y} ${r.x},${r.y + halfH} ${r.x - halfW},${r.y}`
      );
      shape.setAttribute("transform", `rotate(${r.angle} ${r.x} ${r.y})`);

    } else if (shapeType === "circle") {
      shape = document.createElementNS(NS, "circle");
      shape.setAttribute("cx", r.x);
      shape.setAttribute("cy", r.y);
      shape.setAttribute("r", r.size);
   

    } else if (shapeType === "buthole1") {
      shape = document.createElementNS(NS, "path");
      shape.setAttribute("d", customShapes.buthole1);
      const scaleFactor = (r.size * 2) / 8.5;
      shape.setAttribute(
        "transform",
        `translate(${r.x},${r.y}) scale(${scaleFactor}) rotate(${r.angle}) translate(-4.63,-4.63)`
      );

    } else if (shapeType === "buthole2") {
      shape = document.createElementNS(NS, "path");
      shape.setAttribute("d", customShapes.buthole2);
      const scaleFactor = (r.size * 2) / 8.5;
      shape.setAttribute(
        "transform",
        `translate(${r.x},${r.y}) scale(${scaleFactor}) rotate(${r.angle}) translate(-4.62,-4.64)`
      );

    } else {
      shape = document.createElementNS(NS, "rect");
      const rectWidth = r.size * 2;
      const rectHeight = r.size;
      shape.setAttribute("x", r.x - rectWidth / 2);
      shape.setAttribute("y", r.y - rectHeight / 2);
      shape.setAttribute("width", rectWidth);
      shape.setAttribute("height", rectHeight);
      shape.setAttribute("transform", `rotate(${r.angle} ${r.x} ${r.y})`);
    }

    // Only set per-dot fill when NOT in black preview
    if (!blackPreview) {
      shape.setAttribute("fill", `rgb(${r.color[0]},${r.color[1]},${r.color[2]})`);
    }

    frag.appendChild(shape);
  }

  layerGroup.appendChild(frag);
  svgElement.appendChild(layerGroup);
}


function setShapeForSize(sizeKey, shapeType) {
  shapeBySize[sizeKey] = shapeType;
  updatePerforation(); // Refresh the drawing
}


function getRotationAngle(x, y) {
  let gradientX =
    brightness(img.get(constrain(x + 1, 0, width - 1), y)) -
    brightness(img.get(constrain(x - 1, 0, width - 1), y));
  let gradientY =
    brightness(img.get(x, constrain(y + 1, 0, height - 1))) -
    brightness(img.get(x, constrain(y - 1, 0, height - 1)));
  return atan2(gradientY, gradientX) * (180 / PI);
}

function loadNewImage(imageSrc) {
  img = loadImage(imageSrc, function () {
    invalidateMaskCache();
    invalidateWarpCache();
    resizeCanvasToImage();
    computeBrightnessMap();
    updatePerforation();
  });
}


function resizeCanvasToImage() {
  if (img) {
    resizeCanvas(img.width, img.height);
    // Update container size dynamically
    const canvas = document.querySelector('#sketch-holder canvas');
    if (canvas) {
      canvas.style.width = `${img.width}px`;
      canvas.style.height = `${img.height}px`;
    }
    // Update canvas size display
    const sizeDisplay = document.getElementById('canvasSize');
    if (sizeDisplay) {
      sizeDisplay.textContent = `Current Image Size: ${img.width} × ${img.height}`;
    }
  }
}

// ___________________________ Save / Load Settings _______________________________

function saveSettings() {
  const getVal = (id) => document.getElementById(id)?.value;

  const settings = {
    // Dots
    size1: getVal("size1"),
    size2: getVal("size2"),
    size3: getVal("size3"),
    size4: getVal("size4"),

    // Distances
    dis1: getVal("dis1"),
    dis2: getVal("dis2"),
    dis3: getVal("dis3"),
    dis4: getVal("dis4"),

    // Color range
    colorRangeB: getVal("colorRangeB"),
    colorRangeW: getVal("colorRangeW"),

    // Rotation / randomness
    brightnessInfluence: getVal("brightnessInfluence"),
    noiseScale: getVal("noiseScale"),
    generalRotation: getVal("generalRotation"),
    randomValue: getVal("randomValue"),

    // Preview toggles
    blackPreviewToggle: document.getElementById("blackPreviewToggle")?.checked ?? false,

    // Warp (Edge Blend)
    enableWarp: document.getElementById("enableWarp")?.checked ?? false,
    warpIntensity: getVal("warpIntensity"),
    warpScale: getVal("warpScale"),

    // Mask
    enableMask: document.getElementById("enableMask")?.checked ?? false,
    maskThreshold: getVal("maskThreshold"),
    maskNoiseScale: getVal("maskNoiseScale"),

    // Shapes
    shapeBySize
  };

  const blob = new Blob([JSON.stringify(settings, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "perforation-settings.json";
  a.click();
  URL.revokeObjectURL(url);
}


function loadSettings(settings) {
  const setVal = (id, v) => {
    const el = document.getElementById(id);
    if (el != null && v != null) el.value = v;
  };

  const setChecked = (id, v) => {
    const el = document.getElementById(id);
    if (el != null && typeof v === "boolean") el.checked = v;
  };

  // Dots
  setVal("size1", settings.size1);
  setVal("size2", settings.size2);
  setVal("size3", settings.size3);
  setVal("size4", settings.size4);

  // Distances
  setVal("dis1", settings.dis1);
  setVal("dis2", settings.dis2);
  setVal("dis3", settings.dis3);
  setVal("dis4", settings.dis4);

  // Color range
  setVal("colorRangeB", settings.colorRangeB);
  setVal("colorRangeW", settings.colorRangeW);

  // Rotation / randomness
  setVal("brightnessInfluence", settings.brightnessInfluence);
  setVal("noiseScale", settings.noiseScale);
  setVal("generalRotation", settings.generalRotation);
  setVal("randomValue", settings.randomValue);

  // Preview toggles
  setChecked("blackPreviewToggle", settings.blackPreviewToggle);

  // Warp
  setChecked("enableWarp", settings.enableWarp);
  setVal("warpIntensity", settings.warpIntensity);
  setVal("warpScale", settings.warpScale);

  // Mask
  setChecked("enableMask", settings.enableMask);
  setVal("maskThreshold", settings.maskThreshold);
  setVal("maskNoiseScale", settings.maskNoiseScale);

  // Shapes (backwards compatible)
  if (settings.shapeBySize && typeof settings.shapeBySize === "object") {
    shapeBySize = settings.shapeBySize;

    // update icons if they exist
    ["size1", "size2", "size3", "size4"].forEach((k) => {
      const icon = document.getElementById(`shapeIcon-${k}`);
      if (icon && shapeBySize[k] && shapeIcons[shapeBySize[k]]) {
        icon.src = shapeIcons[shapeBySize[k]];
      }
    });
  }

  // Sync the paired number inputs (if you use them)
  // (Optional: only if you want the *Input fields* to update immediately)
  ["colorRangeB", "colorRangeW", "warpIntensity", "warpScale", "maskThreshold", "maskNoiseScale"].forEach((id) => {
    const inp = document.getElementById(id + "Input");
    const sld = document.getElementById(id);
    if (inp && sld) inp.value = sld.value;
  });

  updatePerforation(); // refresh everything
}


function handleFileLoad(event) {
  const file = event.target.files[0];
  const reader = new FileReader();
  reader.onload = function (e) {
    const settings = JSON.parse(e.target.result);
    loadSettings(settings);
  };
  reader.readAsText(file);
}


//___________________________________ Key Press to Save SVG __________________________________________

function saveSVG() {

  save("Perforation_Tool.svg");
}