class DotLayer {
    constructor({ sizeKey, radius, resolution, color, index }) {
      this.sizeKey = sizeKey;
      this.radius = radius;
      this.resolution = resolution;
      this.color = color;
      this.targetIndex = index;
      this.dots = [];
    }
  
    generate({ PixelToMilimeterRatio, brightnessMap, Dots, width, height, randomValue, colorRangeB, colorRangeW, brightnessInfluence, noiseScale, generalRotation, centerX, centerY, diagonal, cos45, sin45, useBlackPreview }) {
      if (this.radius === 0) return;
  
      let spacing = this.resolution * PixelToMilimeterRatio;
      let dotSize = this.radius ;
  
      for (let y = -diagonal; y < diagonal; y += spacing) {
        for (let x = -diagonal; x < diagonal; x += spacing) {
          let newX = centerX + (x * cos45 - y * sin45);
          let newY = centerY + (x * sin45 + y * cos45);
  
          if (newX < 0 || newX >= width || newY < 0 || newY >= height) continue;
  
          let ix = int(constrain(newX, 0, width - 1));
          let iy = int(constrain(newY, 0, height - 1));
          let br = brightnessMap[iy][ix];
          let r = int(constrain(map(br, colorRangeB, colorRangeW, 1, 4), 1, 4));
  
          if (r === this.targetIndex) {
            let offsetX = random(-spacing * randomValue, spacing * randomValue);
            let offsetY = random(-spacing * randomValue, spacing * randomValue);
  
            let noiseRotation = int(noise(x * noiseScale, y * noiseScale) * 360 * noiseScale * 10);
            let brightnessRotation = map(br, colorRangeB, colorRangeW, -90, 90) * brightnessInfluence;
            let angle = noiseRotation + brightnessRotation + parseFloat(generalRotation);
  
            this.dots.push({
              x: newX + offsetX,
              y: newY + offsetY,
              size: dotSize,
              color: useBlackPreview ? [0, 0, 0] : this.color,
              angle,
            });
          }
        }
      }
  
      Dots[this.sizeKey] = this.dots;
    }
  }