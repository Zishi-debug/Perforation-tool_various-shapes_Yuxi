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
    gridLayout,
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
    useBlackPreview
  }) {
    //console.log("DotLayer gridLayout:", gridLayout);
    if (this.radius === 0) return;

    const spacing = this.resolution * PixelToMilimeterRatio;
    const dotSize = this.radius;

    const inv = colorRangeB > colorRangeW;
    const low = Math.min(colorRangeB, colorRangeW);
    const high = Math.max(colorRangeB, colorRangeW);
    const invRange = 1 / Math.max(1e-6, (high - low));

    let dx = spacing;
    let dy

    if (gridLayout === "equilateral") {
      dy = spacing * Math.sqrt(3) / 2;
    } else if (gridLayout === "square") {
      dy = spacing;
    }

    let row = 0;

    for (let y = -diagonal; y < diagonal; y += dy) {
      let rowOffset;

      if (gridLayout === "equilateral") {
        rowOffset = (row % 2) * (spacing / 2);
      } else if (gridLayout === "square") {
        rowOffset = 0;
      }

      for (let x = -diagonal; x < diagonal; x += dx) {
        const baseX = x + rowOffset;
        const baseY = y;

        // Rotate grid by 45 degrees
        let newX, newY;

        if (gridLayout === "square") {
          // square keeps 45° rotation
          newX = centerX + (baseX * cos45 - baseY * sin45);
          newY = centerY + (baseX * sin45 + baseY * cos45);
        } else if (gridLayout === "equilateral") {
          // equilateral has no 45° rotation
          newX = centerX + baseX;
          newY = centerY + baseY;
        }

        if (newX < 0 || newX >= width || newY < 0 || newY >= height) continue;

        const ix = int(constrain(newX, 0, width - 1));
        const iy = int(constrain(newY, 0, height - 1));

        const m = maskMap?.[iy]?.[ix] ?? 1;
        if (random() > m) continue;

        const brRaw = brightnessMap[iy][ix];
        if (brRaw < low || brRaw > high) continue;

        let t01 = (brRaw - low) * invRange;
        if (inv) t01 = 1 - t01;

        // Bucket into 1..4
        let r = floor(t01 * 4) + 1;
        r = constrain(r, 1, 5);

        if (r !== this.targetIndex) continue;

        const jitterX = random(-spacing * randomValue, spacing * randomValue);
        const jitterY = random(-spacing * randomValue, spacing * randomValue);

        const noiseRotation = int(noise(baseX * noiseScale, baseY * noiseScale) * 360 * noiseScale * 10);
        const brightnessRotation = map(brRaw, colorRangeB, colorRangeW, -90, 90) * brightnessInfluence;
        const angle = noiseRotation + brightnessRotation + parseFloat(generalRotation);

        this.dots.push({
          x: newX + jitterX,
          y: newY + jitterY,
          size: dotSize,
          color: useBlackPreview ? [0, 0, 0] : this.color,
          angle,
        });
      }

      row++;
    }

    Dots[this.sizeKey] = this.dots;
  }

}