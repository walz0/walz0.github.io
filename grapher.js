//Global Variables
var axes = {}; //X and Y axes
var scope = { //Scope of variables within functions
  x: 0,
  t: 0
}
var tree;
var expr; //Default Expression
var color = "rgb(139, 233, 253)"; //Default color
var levelOfDetail = 10;
var drawTickMarks = true;
var time = 0; //Time delta

var panning = false;
var scrubbing = false;

var mousePos = {
  x: 0,
  y: 0
}

var originOffset = {
  x: 0,
  y: 0
}

function startPan() {
  panning = true;
}

function mouseDelta(event) {
  canvas = document.getElementById("canvas");
  mousePos.x = event.clientX;
  mousePos.y = event.clientY;
  if(panning) {
    originOffset.x = mousePos.x - (canvas.width / 2);
    originOffset.y = mousePos.y - (canvas.height / 2);
  }
}

function endPan() {
  panning = false;
}

//----Drag and Drop----
function allowDrop(e) {
  e.preventDefault();
}

function drag(e) {
  e.dataTransfer.setData("Text", e.target.id);
}

function drop(e) {
  var data = e.dataTransfer.getData("Text");
  e.target.appendChild(document.getElementById(data));
  e.preventDefault();
}
//---------------------

//Calling the timedInterval function 60 frames per second
var interval = setInterval(timedInterval, 16.7);
function timedInterval () {
  time += 0.167;
  draw();
}

//Update the color of the curve
function updateColor() {
  color = document.getElementById("colorPicker").value;
}

function clearCanvas() {
  var ctx = document.getElementById("canvas").getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  expr = '';
  document.getElementById("input").value = "";
}

//Set an expression
function setExpr(newExpr){
  expr = newExpr;
}

//Update the current expression
function addFunction() {
  setExpr(document.getElementById("input").value);
}

//Update the current scale of the viewport
function updateScale(increment) {
  var ctx = document.getElementById("canvas").getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  //var viewportScale = document.getElementById("scale").value;
  axes.scale += increment;
  draw();
}

function draw() {
  var canvas = document.getElementById("canvas");
  canvas.width = screen.width;
  canvas.height = screen.height * 1;
  if (null == canvas || !canvas.getContext) return;

  var ctx = canvas.getContext("2d", { alpha: true });
  axes.scale = document.getElementById("scale").value;
  axes.x0 = originOffset.x + .5 * canvas.width;  // x0 pixels from left to x=0
  axes.y0 = originOffset.y + .5 * canvas.height; // y0 pixels from top to y=0
  
  showAxes(ctx, axes);
  plot(ctx, axes, expr, color, 2);

  var derivative = true;
  
  if(derivative)
  { 
    var dydx = math.derivative(expr, "x").toString();
    document.getElementById("derivative").value = dydx;
    xValue = document.getElementById("xText").value;
    yValue = evaluateMathExpr(expr, xValue);

    var m = evaluateMathExpr(dydx, xValue);
    document.getElementById("m").value = m;
    var pointSlope = (-xValue * m) + yValue;
    if(pointSlope < 0){
      var tangentLine = m + "x" + pointSlope;
    }
    else
    {
      var tangentLine = m + "x" + "+" + pointSlope;
    }
    
    document.getElementById("tanLine").value = tangentLine;
    
    plot(ctx, axes, dydx, "rgb(241, 121, 198)", 2); //Tangent line to curve at point x
    plot(ctx, axes, tangentLine, "#FF8000", 2);
    //plotCurve(ctx, axes, math.derivative(expr, "x").toString(), "rgb(241, 121, 198)", 2); //General Derivative Function
  }
}

function pointSlope(m, x, y) {
  var result = (-x * m) + y;
  return result;
}

function pyth(x, y) {
  var result = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
  return result;
}

function plotVector(ctx, axes, expr, color, thickness)
{
  var vector = {
    x: 0,
    y: 0
  };

  //Parsing Input and Evaluting Components
  vector.x = evaluateMathExpr(
    expr.substring(expr.indexOf("[") + 1, expr.indexOf(",")), 3
  );
  vector.y = evaluateMathExpr(
    expr.substring(expr.indexOf(",") + 1, expr.indexOf("]")), 3
  );

  var xValue = math.eval(document.getElementById("xText").value);
  document.getElementById("yText").value = vector.y;

  var xx, //The current 'x' value that is being plotted
  yy, //The current 'y' value that is being plotted
  dx = levelOfDetail, //The distance 'x' between each point that is plotted
  scale = axes.scale; //The scale of the viewport
  
  //The range of x values of which to loop through
  var iMax = Math.round((ctx.canvas.width - axes.x0) / dx);
  var iMin = Math.round(-axes.x0 / dx);
  
  ctx.beginPath();
  ctx.lineWidth = thickness;
  ctx.strokeStyle = color;
  
  //Plotting and evaluating the function at each point x
  for (var i = iMin; i <= iMax; i++) {
    xx = vector.x = evaluateMathExpr(
      expr.substring(expr.indexOf("[") + 1, expr.indexOf(",")), 3
    );
    yy = scale * evaluateMathExpr(
      expr.substring(expr.indexOf(",") + 1, expr.indexOf("]")), 3
    );
  }
  
  //Plotting the Vector
  ctx.moveTo(axes.x0, axes.y0); //Move to starting point

  //Drawing line to head of Vector
  ctx.lineTo(
    axes.x0 + vector.x * axes.scale, 
    axes.y0 + vector.y * -axes.scale
  ); 

  //Creating a 'slope' for the Vector
  var m = vector.y / vector.x; 
  var a = 0.1/2; //Wingspan
  var c = 0.131/2; //Length of Wing
  var b = 0.15/2; //Distance from base of Arrow triangle to tip
  var h = pyth(vector.x, vector.y) - b; //Magnitude - b
  var g = pyth(a, h);

  var thetaI = Math.atan(a/h); //Interior Angle
  var thetaB = Math.atan(vector.y / vector.x); //Bottom Angle
  var thetaT = Math.PI/2 - Math.atan(vector.y / vector.x); //Top Angle
  var thetaR = thetaB - thetaI; //Right side Angle
  var thetaL = thetaT - thetaI; //Left side Angle

  var leftBase = {
    x: g * Math.sin(thetaL),
    y: g * Math.cos(thetaL)
  };
  var rightBase = {
    x: g * Math.cos(thetaR),
    y: g * Math.sin(thetaR)
  };
  
  //Drawing Arrow head
  if(vector.x < 0) { //NEGATIVE
    ctx.moveTo(
      axes.x0 + leftBase.x * axes.scale * -1, 
      axes.y0 + leftBase.y * -axes.scale * -1
    ); //Left
    ctx.lineTo(
      axes.x0 + vector.x * axes.scale, 
      axes.y0 + vector.y * -axes.scale
    ); 
    ctx.moveTo(
      axes.x0 + rightBase.x * axes.scale * -1, 
      axes.y0 + rightBase.y * -axes.scale * -1
    ); //Right
    ctx.lineTo(
      axes.x0 + vector.x * axes.scale, 
      axes.y0 + vector.y * -axes.scale
    ); 
  }
  else //POSITIVE
  {
    ctx.moveTo(
      axes.x0 + leftBase.x * axes.scale, 
      axes.y0 + leftBase.y * -axes.scale
    ); //Left
    ctx.lineTo(
      axes.x0 + vector.x * axes.scale, 
      axes.y0 + vector.y * -axes.scale
    );
    ctx.moveTo(
      axes.x0 + rightBase.x * axes.scale, 
      axes.y0 + rightBase.y * -axes.scale
    ); //Right
    ctx.lineTo(
      axes.x0 + vector.x * axes.scale, 
      axes.y0 + vector.y * -axes.scale
    ); 
  }

  ctx.stroke();
}

function plot (ctx, axes, expr, color, thickness) {
  //Vector
  if(expr.includes("[")) {
    plotVector(ctx, axes, expr, color, 2);
  }
  else { //Function
    var xValue = math.eval(document.getElementById("xText").value);
    var yValue = evaluateMathExpr(expr, document.getElementById("xText").value);
    document.getElementById("yText").value = yValue;

    var xx, //The current 'x' value that is being plotted
    yy, //The current 'y' value that is being plotted
    dx = levelOfDetail, //The distance 'x' between each point that is plotted
    x0 = axes.x0, //The 'x' value of the origin
    y0 = axes.y0, //The 'y' value of the origin
    scale = axes.scale; //The scale of the viewport
  
    //The range of x values of which to loop through
    var iMax = Math.round((ctx.canvas.width - x0) / dx);
    var iMin = Math.round(-x0 / dx);
  
    ctx.beginPath();
    ctx.lineWidth = thickness;
    ctx.strokeStyle = color;
  
    //Plotting and evaluating the function at each point x
    for (var i = iMin; i <= iMax; i++) {
      xx = dx * i;
      yy = scale * evaluateMathExpr(expr, xx / scale);
  
      if (i == iMin) {
        ctx.moveTo(x0 + xx, y0 - yy);
      }
      else {
        ctx.lineTo(x0 + xx, y0 - yy);
      }
    }
    ctx.stroke();
  }
}

function evaluateMathExpr(expr, mathX) {
  // Set values on the scope visible inside the math expression.
  scope.x = mathX;
  scope.t = time;

  // Evaluate the previously parsed math expression with the
  // new values for 'x' and 't' and return it.
  return math.eval(expr, scope);
}

function showAxes(ctx, axes) {
  var x0 = axes.x0
  var w = ctx.canvas.width;

  var y0 = axes.y0
  var h = ctx.canvas.height;

  var xmin = 0;
  
  ctx.beginPath();
  ctx.strokeStyle = "rgb(128, 128, 128)";

  ctx.moveTo(xmin, y0);
  ctx.lineTo(w, y0);  // X axis

  ctx.moveTo(x0, 0);
  ctx.lineTo(x0, h);  // Y axis

  if(drawTickMarks)
  {
    var tickLength = 5 / (100 / axes.scale);

    //Unit markers
    for(var i = 1; i < w; i++) // X axis
    {
      //Right
      ctx.moveTo(x0 + i * axes.scale, y0 + tickLength);
      ctx.lineTo(x0 + i * axes.scale, y0 - tickLength); 
      //Left
      ctx.moveTo(x0 - i * axes.scale, y0 + tickLength);
      ctx.lineTo(x0 - i * axes.scale, y0 - tickLength); 
    }

    //Unit markers
    for(var i = 1; i < w; i++) // X axis
    {
      //Right
      ctx.moveTo(x0 - tickLength, y0 + i * axes.scale);
      ctx.lineTo(x0 + tickLength, y0 + i * axes.scale); 
      //Left
      ctx.moveTo(x0 - tickLength, y0 - i * axes.scale);
      ctx.lineTo(x0 + tickLength, y0 - i * axes.scale); 
    }
  }
  
  ctx.stroke();
}

function openFullscreen() {
  var canvas = document.getElementById("myvideo");
  if (elem.requestFullscreen) {
    elem.requestFullscreen();
  } else if (elem.mozRequestFullScreen) { /* Firefox */
    elem.mozRequestFullScreen();
  } else if (elem.webkitRequestFullscreen) { /* Chrome, Safari & Opera */
    elem.webkitRequestFullscreen();
  } else if (elem.msRequestFullscreen) { /* IE/Edge */
    elem.msRequestFullscreen();
  }
}