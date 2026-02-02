let imgObj = null;
let animating = false;
let animStart = 0;
const animDur = 1500; // 1 second
let currentScale = 1;
let targetW = 100;
let targetH = 100;

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