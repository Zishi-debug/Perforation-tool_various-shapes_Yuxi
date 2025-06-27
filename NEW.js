/* Various pattern Perforation tools

This is a handy tool designed for changing any patterns/images into perforatable files, which can be used in production. 
There are four different sizes of perforation holes set in this sketch, and the Dot sizes are controlled by the brightness of the loaded image.

Any questions, please contact Yuxi Chen: yuxi.chen@rolls-roycemotorcars.com

*/

//___________________________________ Parameters you can play with __________________________________________

let PixelToMilimeterRatio = 2.835; // Please check pixel-to-millimeter ratio in your Illustrator file
let img;

let dis1 = 2.69; // Distance for size1
let dis2 = 2.69; // Distance for size2
let dis3 = 2.69; // Distance for size3
let dis4 = 2.69; // Distance for size4


let brightnessInfluence = 1; // Adjust this value to control how much brightness affects rotation


let size1 = 0.8; // Blue dots, change the dot radius
let size2 = 0.5; // Green dots, change the dot radius
let size3 = 0.3; // Red dots, change the dot radius
let size4 = 0.1; // Grey dots, change the dot radius

let colorRangeB = 0; // Black threshold for brightness mapping
let colorRangeW = 90; // White threshold for brightness mapping
let randomValue = 0; // Switch from 0 to 0+ to randomize dot positions
let generalRotation = 50;
let Dots = { size1: [], size2: [], size3: [], size4: [] };


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

const customShapes = {
  buthole1: "M7.55,3.35H1.72c-.73,0-1.33.51-1.33,1.13v.31c0,.62.6,1.13,1.33,1.13h5.83c.74,0,1.34-.51,1.34-1.13v-.31c0-.62-.6-1.13-1.34-1.13Z",
  buthole2: "M3.49,1.52h2.25c1.72,0,3.12,1.4,3.12,3.12v0c0,1.72-1.4,3.12-3.12,3.12h-2.25c-1.72,0-3.12-1.4-3.12-3.12v0c0-1.72,1.4-3.12,3.12-3.12Z"
};


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

//___________________________________ Canvas Setup __________________________________________

function setup() {
  let canvas = createCanvas(img.width, img.height, SVG);
  canvas.parent('sketch-holder');
  noLoop();
  img.loadPixels();
  setupPerforation();
}

//___________________________________ Main Perforation Logic __________________________________________

function setupPerforation() {
  let res1 = dis1 * PixelToMilimeterRatio;
  let res2 = dis2 * PixelToMilimeterRatio;
  let res3 = dis3 * PixelToMilimeterRatio;
  let res4 = dis4 * PixelToMilimeterRatio;

  let diagonal = Math.sqrt(width * width + height * height);
  
  Dots = { size1: [], size2: [], size3: [], size4: [] }; // Clear previous Dots

  size1 = size1 * PixelToMilimeterRatio; // Blue dots, change the dot radius
  size2 = size2 * PixelToMilimeterRatio; // Green dots, change the dot radius
  size3 = size3 * PixelToMilimeterRatio; // Red dots, change the dot radius
  size4 = size4 * PixelToMilimeterRatio; // Grey dots, change the dot radius

  let cos45 = Math.cos(PI / 4);
  let sin45 = Math.sin(PI / 4);
  let centerX = width / 2;
  let centerY = height / 2;

  //draw Dot 1
  for (let y = -diagonal; y < diagonal; y += res1) {
    for (let x = -diagonal; x < diagonal; x += res1) {

    let newX = centerX + (x * cos45 - y * sin45);
    let newY = centerY + (x * sin45 + y * cos45);

    // Skip if outside actual canvas bounds
    if (newX < 0 || newX >= width || newY < 0 || newY >= height) continue;

    let br = brightness(
      img.get(constrain(newX, 0, width - 1), constrain(newY, 0, height - 1))
    );

    let r = int(map(br, colorRangeB, colorRangeW, 1, 4));

    // Only calculate and push if r === 1
    if (r === 1) {
      let offsetX = random(-res1 * randomValue, res1 * randomValue);
      let offsetY = random(-res1 * randomValue, res1 * randomValue);

      // Rotation calculations moved inside for performance
      let noiseRotation = int(noise(x * noiseScale, y * noiseScale) * 360 * noiseScale * 10);
      let brightnessRotation = map(br, colorRangeB, colorRangeW, -90, 90) * brightnessInfluence;
      let angle = noiseRotation + brightnessRotation + parseFloat(generalRotation);

      Dots.size1.push({
        x: newX + offsetX,
        y: newY + offsetY,
        size: size1,
        color: window.useBlackPreview ? [0, 0, 0] : [0, 0, 255],
        angle,
      });
    }
  }
}


  //draw Dot 2
  for (let y = -diagonal; y < diagonal; y += res2) {
    for (let x = -diagonal; x < diagonal; x += res2) {
  
      let newX = centerX + (x * cos45 - y * sin45);
      let newY = centerY + (x * sin45 + y * cos45);
  
      // Skip if outside actual canvas bounds
      if (newX < 0 || newX >= width || newY < 0 || newY >= height) continue;
  
      let br = brightness(
        img.get(constrain(newX, 0, width - 1), constrain(newY, 0, height - 1))
      );
  
      let r = int(map(br, colorRangeB, colorRangeW, 1, 4));
  
      // Only calculate and push if r === 1
      if (r === 2) {
        let offsetX = random(-res2 * randomValue, res2 * randomValue);
        let offsetY = random(-res2 * randomValue, res2 * randomValue);
  
        // Rotation calculations moved inside for performance
        let noiseRotation = int(noise(x * noiseScale, y * noiseScale) * 360 * noiseScale * 10);
        let brightnessRotation = map(br, colorRangeB, colorRangeW, -90, 90) * brightnessInfluence;
        let angle = noiseRotation + brightnessRotation + parseFloat(generalRotation);
  
        Dots.size2.push({
          x: newX + offsetX,
          y: newY + offsetY,
          size: size2,
          color: window.useBlackPreview ? [0, 0, 0] : [0, 255, 0],
          angle,
        });
      }
    }
  }

  //draw Dot 3
  for (let y = -diagonal; y < diagonal; y += res3) {
    for (let x = -diagonal; x < diagonal; x += res3) {
  
      let newX = centerX + (x * cos45 - y * sin45);
      let newY = centerY + (x * sin45 + y * cos45);
  
      // Skip if outside actual canvas bounds
      if (newX < 0 || newX >= width || newY < 0 || newY >= height) continue;
  
      let br = brightness(
        img.get(constrain(newX, 0, width - 1), constrain(newY, 0, height - 1))
      );
  
      let r = int(map(br, colorRangeB, colorRangeW, 1, 4));
  
      // Only calculate and push if r === 1
      if (r === 3) {
        let offsetX = random(-res3 * randomValue, res3 * randomValue);
        let offsetY = random(-res3 * randomValue, res3 * randomValue);
  
        // Rotation calculations moved inside for performance
        let noiseRotation = int(noise(x * noiseScale, y * noiseScale) * 360 * noiseScale * 10);
        let brightnessRotation = map(br, colorRangeB, colorRangeW, -90, 90) * brightnessInfluence;
        let angle = noiseRotation + brightnessRotation + parseFloat(generalRotation);
  
        Dots.size3.push({
          x: newX + offsetX,
          y: newY + offsetY,
          size: size3,
          color: window.useBlackPreview ? [0, 0, 0] : [255,0,0],
          angle,
        });
      }
    }
  }

  //draw Dot 4
  for (let y = -diagonal; y < diagonal; y += res4) {
    for (let x = -diagonal; x < diagonal; x += res4) {
  
      let newX = centerX + (x * cos45 - y * sin45);
      let newY = centerY + (x * sin45 + y * cos45);
  
      // Skip if outside actual canvas bounds
      if (newX < 0 || newX >= width || newY < 0 || newY >= height) continue;
  
      let br = brightness(
        img.get(constrain(newX, 0, width - 1), constrain(newY, 0, height - 1))
      );
  
      let r = int(map(br, colorRangeB, colorRangeW, 1, 4));
  
      // Only calculate and push if r === 1
      if (r === 4) {
        let offsetX = random(-res4 * randomValue, res4 * randomValue);
        let offsetY = random(-res4 * randomValue, res4 * randomValue);
  
        // Rotation calculations moved inside for performance
        let noiseRotation = int(noise(x * noiseScale, y * noiseScale) * 360 * noiseScale * 10);
        let brightnessRotation = map(br, colorRangeB, colorRangeW, -90, 90) * brightnessInfluence;
        let angle = noiseRotation + brightnessRotation + parseFloat(generalRotation);
  
        Dots.size4.push({
          x: newX + offsetX,
          y: newY + offsetY,
          size: size4,
          color: window.useBlackPreview ? [0, 0, 0] : [150,0],
          angle,
        });
      }
    }
  }
  exportSVGWithLayers();
}
//___________________________________ Update Perforation When Sliders Change __________________________________________

function updatePerforation() {
  // Get and clamp input values
  size1 = parseFloat(document.getElementById("size1").value);
  size2 = parseFloat(document.getElementById("size2").value);
  size3 = parseFloat(document.getElementById("size3").value);
  size4 = parseFloat(document.getElementById("size4").value);
  colorRangeB = parseFloat(document.getElementById("colorRangeB").value);
  colorRangeW = parseFloat(document.getElementById("colorRangeW").value);

  // Clamp dot distances to a minimum of 0.5mm
  dis1 = Math.max(parseFloat(document.getElementById("dis1").value), 0.50);
  dis2 = Math.max(parseFloat(document.getElementById("dis2").value), 0.50);
  dis3 = Math.max(parseFloat(document.getElementById("dis3").value), 0.50);
  dis4 = Math.max(parseFloat(document.getElementById("dis4").value), 0.50);

  let useBlackPreview = document.getElementById("blackPreviewToggle").checked;
  window.useBlackPreview = useBlackPreview; // Store globally

  brightnessInfluence = parseFloat(document.getElementById("brightnessInfluence").value);
  noiseScale = parseFloat(document.getElementById("noiseScale").value);
  generalRotation = parseFloat(document.getElementById("generalRotation").value);
  randomValue = parseFloat(document.getElementById("randomValue").value);

  // Recalculate and draw
  setupPerforation();

  // if (parseFloat(dis1 < 0.50)) {
  //   alert("Minimum dot spacing is 0.5mm to avoid crashes.");
  // }
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

function drawLayer(svgElement, rectArray, layerName) {
  let layerGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
  layerGroup.setAttribute("id", layerName);

  let sizeKey = layerName.split("_")[1].toLowerCase(); // e.g., size1
  let shapeType = shapeBySize[sizeKey];

  // 🔍 Debugging log:
  // console.log(`▶ Drawing layer: ${layerName}`);
  // console.log(`   Shape type: ${shapeType}`);
  // console.log(`   Number of dots: ${rectArray.length}`);

  for (let r of rectArray) {
    let shape;

    if (shapeType === "ellipse") {
      shape = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
      shape.setAttribute("cx", r.x);
      shape.setAttribute("cy", r.y);
      shape.setAttribute("rx", r.size);
      shape.setAttribute("ry", r.size / 1.4);
      shape.setAttribute("transform", `rotate(${r.angle} ${r.x} ${r.y})`);

    } else if (shapeType === "rhombus") {
      shape = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
      let halfW = r.size;
      let halfH = r.size / 2.5;
      let points = [
        [r.x, r.y - halfH],
        [r.x + halfW, r.y],
        [r.x, r.y + halfH],
        [r.x - halfW, r.y]
      ].map(p => p.join(",")).join(" ");
      shape.setAttribute("points", points);
      shape.setAttribute("transform", `rotate(${r.angle} ${r.x} ${r.y})`);

    } else if (shapeType === "circle") {
      shape = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      shape.setAttribute("cx", r.x);
      shape.setAttribute("cy", r.y);
      shape.setAttribute("r", r.size);
      shape.setAttribute("transform", `rotate(${r.angle} ${r.x} ${r.y})`);

    } else if (shapeType === "buthole1") {
      shape = document.createElementNS("http://www.w3.org/2000/svg", "path");
      shape.setAttribute("d", customShapes.buthole1);

      let scaleFactor = (r.size * 2) / 6.5; // width of original buthole1 path is ~6.5
      shape.setAttribute(
        "transform",
        `translate(${r.x},${r.y}) scale(${scaleFactor}) rotate(${r.angle}) translate(-4.63,-4.63)`
      );

    } else if (shapeType === "buthole2") {
      shape = document.createElementNS("http://www.w3.org/2000/svg", "path");
      shape.setAttribute("d", customShapes.buthole2);

      let scaleFactor = (r.size * 2) / 8.5; // original width of rect
      shape.setAttribute(
        "transform",
        `translate(${r.x},${r.y}) scale(${scaleFactor}) rotate(${r.angle}) translate(-4.62,-4.64)`
      );

    }else {
      // Default: rectangle
      shape = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      let rectWidth = r.size * 2;
      let rectHeight = r.size;
      shape.setAttribute("x", r.x - rectWidth / 2);
      shape.setAttribute("y", r.y - rectHeight / 2);
      shape.setAttribute("width", rectWidth);
      shape.setAttribute("height", rectHeight);
      shape.setAttribute("transform", `rotate(${r.angle} ${r.x} ${r.y})`);
    }

    // Set fill color
    if (window.useBlackPreview) {
      shape.setAttribute("fill", "black");
    } else {
      shape.setAttribute("fill", `rgb(${r.color[0]},${r.color[1]},${r.color[2]})`);
    }

    layerGroup.appendChild(shape);
  }

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
    resizeCanvasToImage();
    updatePerforation(); // Refresh with the new image
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
  const settings = {
    size1: document.getElementById("size1").value,
    size2: document.getElementById("size2").value,
    size3: document.getElementById("size3").value,
    size4: document.getElementById("size4").value,
    colorRangeB: document.getElementById("colorRangeB").value,
    colorRangeW: document.getElementById("colorRangeW").value,
    dis1: document.getElementById("dis1").value,
    dis2: document.getElementById("dis2").value,
    dis3: document.getElementById("dis3").value,
    dis4: document.getElementById("dis3").value,
    brightnessInfluence: document.getElementById("brightnessInfluence").value,
    noiseScale: document.getElementById("noiseScale").value,
    generalRotation: document.getElementById("generalRotation").value,
    randomValue: document.getElementById("randomValue").value,
    shapeBySize: shapeBySize
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
  document.getElementById("size1").value = settings.size1;
  document.getElementById("size2").value = settings.size2;
  document.getElementById("size3").value = settings.size3;
  document.getElementById("size4").value = settings.size4;
  document.getElementById("colorRangeB").value = settings.colorRangeB;
  document.getElementById("colorRangeW").value = settings.colorRangeW;
  document.getElementById("dis").value = settings.dis;
  document.getElementById("brightnessInfluence").value = settings.brightnessInfluence;
  document.getElementById("noiseScale").value = settings.noiseScale;
  document.getElementById("generalRotation").value = settings.generalRotation;
  document.getElementById("randomValue").value = settings.randomValue;

  shapeBySize = settings.shapeBySize;

  updatePerforation(); // Refresh everything with loaded settings
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