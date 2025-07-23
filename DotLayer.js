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
    
      const spacing = this.resolution * PixelToMilimeterRatio;
      const dotSize = this.radius;
    
      const verticalSpacing = spacing * Math.sqrt(3) / 2;
    
      for (let row = 0; row * verticalSpacing < diagonal * 2; row++) {
        const y = -diagonal + row * verticalSpacing;
        const offset = (row % 2 === 0) ? 0 : spacing / 2;
    
        for (let col = 0; col * spacing < diagonal * 2; col++) {
          const x = -diagonal + col * spacing + offset;
    
          const newX = centerX + (x * cos45 - y * sin45);
          const newY = centerY + (x * sin45 + y * cos45);
    
          if (newX < 0 || newX >= width || newY < 0 || newY >= height) continue;
    
          const ix = int(constrain(newX, 0, width - 1));
          const iy = int(constrain(newY, 0, height - 1));
          const br = brightnessMap[iy][ix];
    
          const r = int(map(br, colorRangeB, colorRangeW, 1, 4));
          if (r !== this.targetIndex) continue;
    
          const offsetX = random(-spacing * randomValue, spacing * randomValue);
          const offsetY = random(-spacing * randomValue, spacing * randomValue);
    
          const noiseRotation = int(noise(x * noiseScale, y * noiseScale) * 360 * noiseScale * 10);
          const brightnessRotation = map(br, colorRangeB, colorRangeW, -90, 90) * brightnessInfluence;
          const angle = noiseRotation + brightnessRotation + parseFloat(generalRotation);
    
          this.dots.push({
            x: newX + offsetX,
            y: newY + offsetY,
            size: dotSize,
            color: useBlackPreview ? [0, 0, 0] : this.color,
            angle,
          });
        }
      }
    
      Dots[this.sizeKey] = this.dots;
    }
  }