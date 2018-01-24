function EarthtoneLoader(controller) {
  this.controller = controller;

  this.canvas = document.createElement('canvas');
  this.canvas.width = window.innerWidth;
  if (this.canvas.width < 1024) this.canvas.width = 1024;
  this.canvas.height = window.innerHeight;
  if (this.canvas.height < 575) this.canvas.height = 575;
  this.canvas.style.position = 'fixed';
  this.canvas.style.top = '0px';
  this.canvas.style.left = '0px';
  this.canvas.style.zIndex = 1000001;
  this.context = this.canvas.getContext('2d');
  document.body.appendChild(this.canvas);

  this.r = 200;
  this.g = 0;
  this.b = 0;
  this.a = 1.0;
  this.rad = 100;
  this.minRad = 100;
  this.maxRad = 250;
  this.duration = 2000;
  this.startTime = new Date().getTime();
  this.x = this.canvas.width / 2;
  this.y = this.canvas.height / 2;
  this.cycle = 0;

  this.loaded = false;
  this.loadData();
}

EarthtoneLoader.prototype.rgb = function() {
  return (
    'rgb(' +
    parseInt(this.r) +
    ', ' +
    parseInt(this.g) +
    ', ' +
    parseInt(this.b) +
    ')'
  );
};

EarthtoneLoader.prototype.rgba = function() {
  return (
    'rgba(' +
    parseInt(this.r) +
    ', ' +
    parseInt(this.g) +
    ', ' +
    parseInt(this.b) +
    ', ' +
    this.a +
    ')'
  );
};

EarthtoneLoader.prototype.loadData = function() {
  var self = this;
  sendRequest(
    'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson',
    function(req) {
      self.parseData(req);
    }
  );
};

EarthtoneLoader.prototype.parseData = function(req) {
  var payload = JSON.parse(req.responseText);

  var metadata = payload.metadata;
  this.controller.endTime = new Date(metadata.generated);
  this.controller.startTime = new Date(
    this.controller.endTime.getTime() - 1000 * 60 * 60 * 24
  );
  this.controller.timeSpan =
    this.controller.endTime.getTime() - this.controller.startTime.getTime();
  this.controller.timeMultiplier = 1440;
  this.controller.currentTime = this.controller.startTime.getTime();
  this.controller.actualTime = new Date().getTime();
  this.controller.elapsedTime = 0;
  this.controller.totalElapsed = 0;
  this.controller.earthtones = [];
  this.controller.darknessX = 0;
  this.controller.maxDepth = 0;
  this.controller.maxMagnitude = 0;
  this.controller.minMagnitude = 10;

  this.controller.quakes = [];
  for (var i in payload.features) {
    var quake = payload.features[i];
    this.controller.quakes.push(quake);

    var depth = quake.geometry.coordinates[2];
    if (depth > this.controller.maxDepth) this.controller.maxDepth = depth;

    var mag = quake.properties.mag;
    if (mag > this.controller.maxMagnitude) this.controller.maxMagnitude = mag;
    if (mag < this.controller.minMagnitude) this.controller.minMagnitude = mag;
  }

  this.controller.index = this.controller.quakes.length - 1;
  this.loaded = true;
};

EarthtoneLoader.prototype.update = function() {
  if (this.a < 0) {
    this.a = 1.0;
    this.rad = this.minRad;
    this.startTime = new Date().getTime();
    this.cycle++;
  }

  var t = new Date().getTime() - this.startTime;
  var b = this.minRad;
  var c = this.maxRad - this.minRad;
  var d = this.duration;

  this.rad = c * Math.pow(t / d, 2) + b;
  this.a = -1 * Math.pow(t / d, 2) + 1.0;

  if (this.cycle % 2 == 0) this.r = -150 * Math.pow(t / d, 2) + 200;
  else this.r = 150 * Math.pow(t / d, 2) + 50;
  this.b = 255 - this.r;
};

EarthtoneLoader.prototype.render = function() {
  this.canvas.width = this.canvas.width;

  this.context.beginPath();
  this.context.arc(this.x, this.y, this.minRad, 0, 2 * Math.PI, false);
  this.context.fillStyle = this.rgb();
  this.context.fill();

  this.context.beginPath();
  this.context.arc(this.x, this.y, this.rad - 5, 0, 2 * Math.PI, false);
  this.context.strokeStyle = this.rgba();
  this.context.lineWidth = 5;
  this.context.stroke();
};

function sendRequest(url, callback, postData) {
  var req = createXMLHTTPObject();
  if (!req) return;
  var method = postData ? 'POST' : 'GET';
  req.open(method, url, true);
  if (postData)
    req.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
  req.onreadystatechange = function() {
    if (req.readyState != 4) return;
    if (req.status != 200 && req.status != 304) {
      //          alert('HTTP error ' + req.status);
      return;
    }
    callback(req);
  };
  if (req.readyState == 4) return;
  req.send(postData);
}

var XMLHttpFactories = [
  function() {
    return new XMLHttpRequest();
  },
  function() {
    return new ActiveXObject('Msxml2.XMLHTTP');
  },
  function() {
    return new ActiveXObject('Msxml3.XMLHTTP');
  },
  function() {
    return new ActiveXObject('Microsoft.XMLHTTP');
  }
];

function createXMLHTTPObject() {
  var xmlhttp = false;
  for (var i = 0; i < XMLHttpFactories.length; i++) {
    try {
      xmlhttp = XMLHttpFactories[i]();
    } catch (e) {
      continue;
    }
    break;
  }
  return xmlhttp;
}
