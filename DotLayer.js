class DotLayer {
    constructor({ sizeKey, radius, resolution, color, index }) {
      this.sizeKey = sizeKey;
      this.radius = radius;
      this.resolution = resolution;
      this.color = color;
      this.targetIndex = index;
      this.dots = [];
    }
  
    generate({
      PixelToMilimeterRatio,
      brightnessMap,
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
      useBlackPreview
    }) {
      if (this.radius === 0) return;
    
      const spacing = this.resolution * PixelToMilimeterRatio;
      const dotSize = this.radius;
      const verticalSpacing = spacing * Math.sqrt(3) / 2; // height between rows
      const horizontalSpacing = spacing; // even columns
    
      for (let row = 0, y = -diagonal; y < diagonal; row++, y += verticalSpacing) {
        const offsetX = (row % 2 === 0) ? 0 : spacing / 2;
    
        for (let col = 0, x = -diagonal; x < diagonal; col++, x += horizontalSpacing) {
          const newX = centerX + x + offsetX;
          const newY = centerY + y;
    
          if (newX < 0 || newX >= width || newY < 0 || newY >= height) continue;
    
          const ix = int(constrain(newX, 0, width - 1));
          const iy = int(constrain(newY, 0, height - 1));
          const br = brightnessMap[iy][ix];
    
          const r = int(map(br, colorRangeB, colorRangeW, 1, 4));
          if (r !== this.targetIndex) continue;
    
          const jitterX = random(-horizontalSpacing * randomValue, horizontalSpacing * randomValue);
          const jitterY = random(-verticalSpacing * randomValue, verticalSpacing * randomValue);
    
          const noiseRotation = int(noise(x * noiseScale, y * noiseScale) * 360 * noiseScale * 10);
          const brightnessRotation = map(br, colorRangeB, colorRangeW, -90, 90) * brightnessInfluence;
          const angle = noiseRotation + brightnessRotation + parseFloat(generalRotation);
    
          this.dots.push({
            x: newX + jitterX,
            y: newY + jitterY,
            size: dotSize,
            color: useBlackPreview ? [0, 0, 0] : this.color,
            angle,
          });
        }
      }
    
      Dots[this.sizeKey] = this.dots;
    }
    
    
    
    
    
    
  }