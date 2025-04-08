/* Various pattern Perforation tools

This is a handy tool designed for changing any patterns/images into perforatable files, which can be used in production. 
There are four different sizes of perforation holes set in this sketch, and the Dot sizes are controlled by the brightness of the loaded image.

Any questions, please contact Yuxi Chen: yuxi.chen@rolls-roycemotorcars.com

*/

//___________________________________ Parameters you can play with __________________________________________

let PixelToMilimeterRatio = 2.835; // Please check pixel-to-millimeter ratio in your Illustrator file
let img;

let dis = 2.69; // If you want a specific distance between each dot, replace the value
//let res = dis * PixelToMilimeterRatio; // MK10 density, do not change
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

let shapeOptions = ["rect", "ellipse", "rhombus", "circle"];
let shapeIcons = {
  rect: "Icons/rectangle-05.png",
  ellipse: "Icons/elipse-03.png",
  rhombus: "Icons/Rhombus-04.png",
  circle: "Icons/circle-06.png"
};

let shapeBySize = {
  size1: "rect",
  size2: "rect",
  size3: "rect",
  size4: "rect"
};

let currentShapeIndex = 0;
let currentShape = shapeOptions[currentShapeIndex].type;

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
  let res = dis * PixelToMilimeterRatio; // MK10 density, do not change
  Dots = { size1: [], size2: [], size3: [], size4: [] }; // Clear previous Dots

  size1 = size1 * PixelToMilimeterRatio; // Blue dots, change the dot radius
  size2 = size2 * PixelToMilimeterRatio; // Green dots, change the dot radius
  size3 = size3 * PixelToMilimeterRatio; // Red dots, change the dot radius
  size4 = size4 * PixelToMilimeterRatio; // Grey dots, change the dot radius

  let cos45 = Math.cos(PI / 4);
  let sin45 = Math.sin(PI / 4);
  let centerX = width / 2;
  let centerY = height / 2;
  let step = res;

  for (let y = -2 * height; y < height * 2; y += step) {
    for (let x = -2 * width; x < width * 2; x += step) {
      let newX = centerX + (x * cos45 - y * sin45);
      let newY = centerY + (x * sin45 + y * cos45);
      if (
        newX >= -res &&
        newX <= width + res &&
        newY >= -res &&
        newY <= height + res
      ) {
        let br = brightness(
          img.get(constrain(newX, 0, width - 1), constrain(newY, 0, height - 1))
        );

        let r = int(map(br, colorRangeB, colorRangeW, 1, 4));
        let offsetX = random(-res * randomValue, res * randomValue);
        let offsetY = random(-res * randomValue, res * randomValue);
        let size, color;

        let noiseRotation = int(noise(x * noiseScale, y * noiseScale) * 360 * noiseScale * 10);
        let brightnessRotation =
          map(br, colorRangeB, colorRangeW, -90, 90) * brightnessInfluence;
        let generalRotationD = parseFloat(generalRotation);
        let angle = noiseRotation + brightnessRotation + generalRotationD;
        //console.log("angle:", noiseRotation);

        if (r === 1) {
          size = size1;
          color = [0, 0, 255];
          Dots.size1.push({
            x: newX + offsetX,
            y: newY + offsetY,
            size,
            color,
            angle,
          });
        } else if (r === 2) {
          size = size2;
          color = [0, 255, 0];
          Dots.size2.push({
            x: newX + offsetX,
            y: newY + offsetY,
            size,
            color,
            angle,
          });
        } else if (r === 3) {
          size = size3;
          color = [255, 0, 0];
          Dots.size3.push({
            x: newX + offsetX,
            y: newY + offsetY,
            size,
            color,
            angle,
          });
        } else if (r === 4) {
          size = size4;
          color = [155, 155, 0];
          Dots.size4.push({
            x: newX + offsetX,
            y: newY + offsetY,
            size,
            color,
            angle,
          });
        }
      }
    }
  }
  exportSVGWithLayers();
}
//___________________________________ Update Perforation When Sliders Change __________________________________________

function updatePerforation() {
  // Get input values
  size1 = document.getElementById("size1").value;
  size2 = document.getElementById("size2").value;
  size3 = document.getElementById("size3").value;
  size4 = document.getElementById("size4").value;
  colorRangeB = document.getElementById("colorRangeB").value;
  colorRangeW = document.getElementById("colorRangeW").value;
  dis = document.getElementById("dis").value;
  brightnessInfluence = document.getElementById("brightnessInfluence").value;
  noiseScale = document.getElementById("noiseScale").value;
  generalRotation = document.getElementById("generalRotation").value;
  randomValue = document.getElementById("randomValue").value;

  // Update displayed distance with unit
  document.getElementById("disValue").innerText = `${dis} mm`;


  // Recalculate and draw
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

function drawLayer(svgElement, rectArray, layerName) {
  let layerGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
  layerGroup.setAttribute("id", layerName);

  let sizeKey = layerName.split("_")[1].toLowerCase(); // Extract "size1", etc.
  let shapeType = shapeBySize[sizeKey];

  for (let r of rectArray) {
    let shape;

    if (shapeType === "ellipse") {
      shape = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
      shape.setAttribute("cx", r.x);
      shape.setAttribute("cy", r.y);
      shape.setAttribute("rx", r.size);
      shape.setAttribute("ry", r.size / 1.4);
    } else if (shapeType === "rhombus") {
      shape = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
      let halfW = r.size;
      let halfH = r.size / 2.5;
      let points = [
        [r.x, r.y - halfH],  // top
        [r.x + halfW, r.y],  // right
        [r.x, r.y + halfH],  // bottom
        [r.x - halfW, r.y]   // left
      ].map(p => p.join(",")).join(" ");
      shape.setAttribute("points", points);
    } else if (shapeType === "circle") {
      shape = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      shape.setAttribute("cx", r.x);
      shape.setAttribute("cy", r.y);
      shape.setAttribute("r", r.size); // Radius
    } else {
      shape = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      let rectWidth = r.size * 2;
      let rectHeight = r.size;
      shape.setAttribute("x", r.x - rectWidth / 2);
      shape.setAttribute("y", r.y - rectHeight / 2);
      shape.setAttribute("width", rectWidth);
      shape.setAttribute("height", rectHeight);
    }

    shape.setAttribute("fill", `rgb(${r.color[0]},${r.color[1]},${r.color[2]})`);
    shape.setAttribute("transform", `rotate(${r.angle} ${r.x} ${r.y})`);
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
    dis: document.getElementById("dis").value,
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