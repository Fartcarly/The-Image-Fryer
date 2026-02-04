let imgObj = null;
let animating = false;
let animStart = 0;
const animDur = 1500; // 1 second
let currentScale = 1;
let targetW = 100;
let targetH = 100;
// Global filterType: 0 = fryer (default), 1 = blender, 2 = coffee, 3 = candle, 4 = green blob, 5 = mechanism
window.filterType = 0;

// Replace current canvas image with a small icon corresponding to filter
window.replaceWithIcon = function(filter) {
  const map = {
    0: 'img/Object Icons/Image Fryer.png',
    1: 'img/Object Icons/blender.png',
    2: 'img/Object Icons/Coffee.png',
    3: 'img/Object Icons/candle2.png',
    4: 'img/Object Icons/Green Blob.png',
    5: 'img/Object Icons/Mechanism.png'
  };
  const path = map[filter];
  if (!path) return;

  // hide the fry button when switching objects
  const fryBtn = document.getElementById('fry-btn');
  if (fryBtn) fryBtn.style.display = 'none';

  // clear current image immediately
  imgObj = null;
  const canvasEl = document.getElementById('p5canvas');
  if (canvasEl) canvasEl.style.display = 'none';

  // load the icon image and animate it into the canvas like a new image
  loadImage(path,
    function(loaded) {
      imgObj = loaded;
      // scale image so its height is 500px (width kept proportional)
      const targetHpx = 500;
      const ratio = targetHpx / loaded.height;
      targetW = Math.max(1, Math.floor(loaded.width * ratio));
      targetH = Math.max(1, Math.floor(loaded.height * ratio));
      resizeCanvas(targetW, targetH);

      // start scale-from-center animation
      currentScale = 0;
      animStart = millis();
      animating = true;

      // place canvas where fryer image was
      const fryerImg = document.getElementById('big-fryer');
      if (fryerImg && canvasEl) {
        const parent = fryerImg.parentNode || document.body;
        parent.appendChild(canvasEl);
        fryerImg.style.display = 'none';
        canvasEl.style.display = 'block';
      } else if (canvasEl) {
        canvasEl.style.display = 'block';
      }
    },
    function(err){ console.error('Failed to load icon', err); }
  );
};

// Apply 'fry' effects to the current image based on filterType
window.applyFry = function() {
  if (!imgObj) {
    console.log('applyFry: no image loaded');
    return;
  }

  // draw the current image into an offscreen graphics buffer at canvas size
  const g = createGraphics(width, height);
  g.pixelDensity(1);
  g.imageMode(CORNER);
  g.push();
  g.background(0);
  g.image(imgObj, 0, 0, width, height);
  g.pop();

  if (window.filterType === 2) {
    // Coffee filter: apply brown tint with multiply blend mode + faint vignette
    g.loadPixels();
    const pix = g.pixels;
    const w = g.width;
    const h = g.height;
    for (let i = 0; i < pix.length; i += 4) {
      const pixelIndex = i / 4;
      const x = pixelIndex % w;
      const y = Math.floor(pixelIndex / w);
      
      const r = pix[i];
      const gr = pix[i + 1];
      const b = pix[i + 2];
      // multiply blend mode: (pixel * color) / 255
      pix[i] = Math.round((r * 139) / 255);
      pix[i + 1] = Math.round((gr * 90) / 255);
      pix[i + 2] = Math.round((b * 53) / 255);
      
      // apply faint vignette (darken edges)
      const distX = Math.abs(x - w / 2) / (w / 2);
      const distY = Math.abs(y - h / 2) / (h / 2);
      const dist = Math.sqrt(distX * distX + distY * distY);
      const vignette = Math.max(0, 1 - dist * 0.4); // faint vignette falloff
      
      pix[i] = Math.round(pix[i] * vignette);
      pix[i + 1] = Math.round(pix[i + 1] * vignette);
      pix[i + 2] = Math.round(pix[i + 2] * vignette);
      // keep alpha (pix[i+3])
    }
    g.updatePixels();
    imgObj = g.get();
    const canvasEl = document.getElementById('p5canvas');
    if (canvasEl) canvasEl.style.display = 'block';
    console.log('Applied coffee filter: brown tint + vignette');
  } else {
    // Default fry (filterType 0): posterize + hue shift
    // posterize with random levels between 2 and 7
    const levels = Math.floor(random(2, 8));
    g.filter(POSTERIZE, levels);

    // random hue shift 0-360
    const hueShift = Math.floor(random(0, 360));

    // apply hue shift by manipulating pixels (RGBA)
    g.loadPixels();
    const pix = g.pixels;
    for (let i = 0; i < pix.length; i += 4) {
      const r = pix[i];
      const gr = pix[i + 1];
      const b = pix[i + 2];
      // convert to HSL, shift hue, convert back
      const hsl = rgbToHsl(r, gr, b);
      const newH = (hsl.h + hueShift) % 360;
      const rgb = hslToRgb(newH, hsl.s, hsl.l);
      pix[i] = rgb.r;
      pix[i + 1] = rgb.g;
      pix[i + 2] = rgb.b;
      // keep alpha (pix[i+3])
    }
    g.updatePixels();

    // replace the displayed image with the fried version
    imgObj = g.get();
    // ensure canvas is visible (in case it was hidden)
    const canvasEl = document.getElementById('p5canvas');
    if (canvasEl) canvasEl.style.display = 'block';
    console.log('Applied fry: posterize=' + levels + ' hueShift=' + hueShift);
  }
};

// helpers: RGB (0-255) -> HSL (h:0-360, s:0-1, l:0-1)
function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h = h * 60;
  }
  return { h: h, s: s, l: l };
}

// helpers: HSL (h:0-360, s:0-1, l:0-1) -> RGB (0-255)
function hslToRgb(h, s, l) {
  h = (h % 360 + 360) % 360; // normalize
  h /= 360;
  let r, g, b;
  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
}

function setup() {
  // create a modest canvas; will be resized when an image is loaded
  const c = createCanvas(0,0);
  c.id('p5canvas');
  background(0);
  imageMode(CENTER);
}

function draw() {
  background(0);
  if (imgObj) {
    if (animating) {
      const t = constrain((millis() - animStart) / animDur, 0, 1);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - t, 3);
      currentScale = eased;
      if (t >= 1) {
        animating = false;
        currentScale = 1;
      }
    } else {
      currentScale = 1;
    }

    push();
    translate(width / 2, height / 2);
    const drawW = Math.max(1, width * currentScale);
    const drawH = Math.max(1, height * currentScale);
    image(imgObj, 0, 0, drawW, drawH);
    pop();
  }
}

// Expose a global handler that the DOM script will call with a File object
window.handleFile = function(file) {
  if (!file) {
    imgObj = null;
    const canvasEl = document.getElementById('p5canvas');
    if (canvasEl) canvasEl.style.display = 'none';
    const fryerImg = document.getElementById('big-fryer');
    if (fryerImg) fryerImg.style.display = 'block';
    return;
  }
  const url = URL.createObjectURL(file);
  loadImage(url,
    function(loaded){
      imgObj = loaded;
      // scale image so its height is 500px (width kept proportional)
      const targetHpx = 500;
      const ratio = targetHpx / loaded.height;
      targetW = Math.max(1, Math.floor(loaded.width * ratio));
      targetH = Math.max(1, Math.floor(loaded.height * ratio));
      resizeCanvas(targetW, targetH);

      // start scale-from-center animation
      currentScale = 0;
      animStart = millis();
      animating = true;

      // move/hide DOM elements so the canvas replaces the big fryer image
      const fryerImg = document.getElementById('big-fryer');
      const canvasEl = document.getElementById('p5canvas');
      if (fryerImg && canvasEl) {
        const parent = fryerImg.parentNode || document.body;
        parent.appendChild(canvasEl); // place canvas where fryer image was
        fryerImg.style.display = 'none';
        canvasEl.style.display = 'block';
      } else if (canvasEl) {
        canvasEl.style.display = 'block';
      }

      URL.revokeObjectURL(url);
    },
    function(err){
      console.error('Failed to load image', err);
      URL.revokeObjectURL(url);
    }
  );
};