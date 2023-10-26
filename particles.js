const canvasSketch = require('canvas-sketch');
const {random} = require("canvas-sketch-util");
const eases  = require('eases')
const math = require('canvas-sketch-util/math');
const colormap = require('colormap');
const {par} = require("colormap/colorScale");
const settings = {
  dimensions: [ 1080, 1080 ],
  animate: true,
};

let elCanvas;
const particles = [];
const cursor = {x: 9999, y: 9999};

const colors = colormap({
  colormap: 'viridis',
  nshades: 20,
})
const sketch = ({width, height, canvas}) => {
  elCanvas = canvas;
  elCanvas.addEventListener('mousedown', onMouseDown);
  let x,y;
  let pos = [];


  let numCircles = 15;
  let cirRadius = 0;
  let dotRadius = 12;

  let fitRadius = dotRadius;
  let gapDot = 4;
  let gapCircle = 8;


  for( let i=0; i< numCircles; i++) {
    const circumference = Math.PI * 2 * cirRadius;
    const numFit = i ? Math.floor(circumference / (fitRadius * 2 + gapDot)) : 1;
    const fitSlice = Math.PI * 2 / numFit;
    for(let j=0; j<numFit; j++) {
      const theta = fitSlice * j;

      x = Math.cos(theta)*cirRadius;
      y = Math.sin(theta)*cirRadius;


      x += width * 0.5;
      y += height * 0.5;

      particles.push( new Particle({x, y, radius: dotRadius}))
    }
    cirRadius += fitRadius * 2 + gapCircle ;
    dotRadius = ( 1 -eases.quadOut( i / numCircles)) * fitRadius;
  }


  return ({ context, width, height }) => {
    context.fillStyle = 'black';
    context.fillRect(0, 0, width, height);

    particles.sort((a,b) => a.scale - b.scale);

    particles.forEach(particle => {
      particle.update();
      particle.draw(context);
    })
  };
};

canvasSketch(sketch, settings);

const onMouseDown = (e) => {
  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)

  onMouseMove(e);
}

const onMouseMove = (e) => {
  const x = (e.offsetX / elCanvas.offsetWidth) * elCanvas.width;
  const y = (e.offsetY / elCanvas.offsetHeight) * elCanvas.height;

  cursor.x = x;
  cursor.y = y;
}

const onMouseUp = () => {
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('mouseup', onMouseUp)
  cursor.x = 9999;
  cursor.y = 9999;
}

class Particle {
  constructor({x, y, radius = 10}) {
    // Positions
    this.x = x;
    this.y = y;

    // Initial Positions
    this.ix = x;
    this.iy = y;

    // Velocity
    this.vx = 0;
    this.vy = 0;

    // Acceleration
    this.ax = 0;
    this.ay = 0;

    this.radius = radius;
    this.scale = 1;
    this.color = colors[0];
    this.minDist = random.range(100, 200);
    this.pushFactor = random.range(0.01, 0.02);
    this.pullFactor = random.range(0.002, 0.006);
    this.dampFactor = random.range(0.90, 0.95);
  }

  update() {
    let dx, dy, dd, distDelta, idxColor;
    // pull force
    dx = this.ix - this.x;
    dy = this.iy - this.y;
    dd = Math.sqrt(dx*dx + dy*dy);

    this.ax = dx * this.pullFactor;
    this.ay = dy * this.pullFactor;

    this.scale = math.mapRange(dd, 0, 200, 1,3);

    idxColor = Math.floor(math.mapRange(dd, 0, 200,1, colors.length-1, true))
    this.color = colors[idxColor];

    this.ax = dx * this.pullFactor;
    dx = this.x - cursor.x;
    dy = this.y - cursor.y;
    dd = Math.sqrt(dx*dx + dy*dy);

    distDelta = this.minDist - dd;
    if (dd < this.minDist) {
      this.ax = (dx / dd) * distDelta * this.pushFactor;
      this.ay = (dy / dd) * distDelta * this.pushFactor;
    }


    this.vx += this.ax;
    this.vy += this.ay;

    this.vx *= this.dampFactor;
    this.vy *= this.dampFactor;

    this.x += this.vx;
    this.y += this.vy;
  }

  draw(context) {
    context.save();
    context.translate(this.x, this.y);
    context.fillStyle = this.color;
    context.beginPath();
    context.arc(0, 0, this.radius * this.scale, 0 , 2 * Math.PI);
    context.fill();

    context.restore();
  }

}
