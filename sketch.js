let imgObj = null;

function setup() {
  // create a modest canvas; will be resized when an image is loaded
  const c = createCanvas(1100,800);
  c.id('p5canvas');
  background(50);
}

function draw() {
  if (imgObj) {
    // draw the loaded image scaled to the canvas
    image(imgObj, 0, 0, width, height);
  }
}

// Expose a global handler that the DOM script will call with a File object
window.handleFile = function(file) {
  if (!file) return;
  const url = URL.createObjectURL(file);
  loadImage(url,
    function(loaded){
      imgObj = loaded;
      // scale image so its height is 500px (width kept proportional)
      const targetH = 500;
      const ratio = targetH / loaded.height;
      const w = Math.max(1, Math.floor(loaded.width * ratio));
      const h = Math.max(1, Math.floor(loaded.height * ratio));
      resizeCanvas(w, h);
      URL.revokeObjectURL(url);
    },
    function(err){
      console.error('Failed to load image', err);
      URL.revokeObjectURL(url);
    }
  );
};