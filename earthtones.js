var earthtones;

(function() {
  var lastTime = 0;
  var vendors = ['webkit', 'moz'];
  for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
    window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
    window.cancelAnimationFrame =
      window[vendors[x] + 'CancelAnimationFrame'] ||
      window[vendors[x] + 'CancelRequestAnimationFrame'];
  }

  if (!window.requestAnimationFrame)
    window.requestAnimationFrame = function(callback, element) {
      var currTime = new Date().getTime();
      var timeToCall = Math.max(0, 16 - (currTime - lastTime));
      var id = window.setTimeout(function() {
        callback(currTime + timeToCall);
      }, timeToCall);
      lastTime = currTime + timeToCall;
      return id;
    };

  if (!window.cancelAnimationFrame)
    window.cancelAnimationFrame = function(id) {
      clearTimeout(id);
    };
})();

/*
 * Easing Functions - inspired from http://gizma.com/easing/
 * only considering the t value for the range [0, 1] => [0, 1]
 */
var EasingFunctions = {
  // no easing, no acceleration
  linear: function(t) {
    return t;
  },
  // accelerating from zero velocity
  easeInQuad: function(t) {
    return t * t;
  },
  // decelerating to zero velocity
  easeOutQuad: function(t) {
    return t * (2 - t);
  },
  // acceleration until halfway, then deceleration
  easeInOutQuad: function(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  },
  // accelerating from zero velocity
  easeInCubic: function(t) {
    return t * t * t;
  },
  // decelerating to zero velocity
  easeOutCubic: function(t) {
    return --t * t * t + 1;
  },
  // acceleration until halfway, then deceleration
  easeInOutCubic: function(t) {
    return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
  },
  // accelerating from zero velocity
  easeInQuart: function(t) {
    return t * t * t * t;
  },
  // decelerating to zero velocity
  easeOutQuart: function(t) {
    return 1 - --t * t * t * t;
  },
  // acceleration until halfway, then deceleration
  easeInOutQuart: function(t) {
    return t < 0.5 ? 8 * t * t * t * t : 1 - 8 * --t * t * t * t;
  },
  // accelerating from zero velocity
  easeInQuint: function(t) {
    return t * t * t * t * t;
  },
  // decelerating to zero velocity
  easeOutQuint: function(t) {
    return 1 + --t * t * t * t * t;
  },
  // acceleration until halfway, then deceleration
  easeInOutQuint: function(t) {
    return t < 0.5 ? 16 * t * t * t * t * t : 1 + 16 * --t * t * t * t * t;
  }
};

function EarthtoneController() {
  this.loader = new EarthtoneLoader(this);
  this.map = new EarthtoneMap(this);
  this.timeline = new EarthtoneTimeline(this);
  this.audio = new EarthtoneAudio(this);

  this.Initialize();

  this.fade = 0;

  this.Render();
}

EarthtoneController.prototype.Initialize = function() {
  this.earthtoneCanvas = document.createElement('canvas');
  this.earthtoneCanvas.width = document.body.clientWidth;
  this.earthtoneCanvas.height = document.body.clientHeight;
  this.earthtoneCanvas.style.position = 'absolute';
  this.earthtoneCanvas.style.left = this.earthtoneCanvas.style.top = '0px';
  this.earthtoneContext = this.earthtoneCanvas.getContext('2d');

  var rect = this.map.canvas.getBoundingClientRect();
  this.offset = { x: rect.left, y: rect.top };

  document.body.appendChild(this.earthtoneCanvas);
};

EarthtoneController.prototype.mapRange = function(
  value,
  low1,
  high1,
  low2,
  high2
) {
  return low2 + (high2 - low2) * (value - low1) / (high1 - low1);
};

EarthtoneController.prototype.mapRangeInt = function(
  value,
  low1,
  high1,
  low2,
  high2
) {
  return Math.round(low2 + (high2 - low2) * (value - low1) / (high1 - low1));
};

EarthtoneController.prototype.Render = function() {
  var rect = this.map.canvas.getBoundingClientRect();
  this.offset = { x: rect.left, y: rect.top };

  if (!this.map.loaded || !this.loader.loaded || !this.audio.loaded) {
    this.loader.update();
    this.loader.render();
  } else {
    if (this.fade <= 1) {
      this.fade += 0.025;
      this.map.tileContainer.style.opacity = this.fade;
      this.timeline.canvas.style.opacity = this.fade;
      this.timeline.playCanvas.style.opacity = this.fade;
      this.timeline.timeCanvas.style.opacity = this.fade;
      this.loader.canvas.style.opacity = 1 - this.fade;
    } else {
      this.loader.canvas.style.display = 'none';
    }

    this.timeline.render();

    if (this.playing) {
      var newTime = new Date().getTime();
      var rawElapsed = newTime - this.actualTime;

      // Remove dead earthtones
      // Decrement "i" after deletion since splice will shift the indexes down
      for (var i = 0; i < this.earthtones.length; i++) {
        if (this.earthtones[i].age >= this.earthtones[i].lifetime) {
          document.body.removeChild(this.earthtones[i].textContainer);
          this.earthtones.splice(i, 1);
          i--;
        }
      }

      // Each rendering cycle shouldn't take more than a few ms.
      // Too much elapsed time most likely creates a garbage frame
      // i.e. the user moved to a new tab and back, so we'll "pause"
      if (rawElapsed > 250) {
        rawElapsed = 0;
        this.actualTime = newTime;
      }

      this.elapsedTime = rawElapsed * this.timeMultiplier;
      this.totalElapsed += this.elapsedTime;
      this.currentTime += this.elapsedTime;

      while (
        parseInt(this.quakes[this.index].properties.time) < this.currentTime
      ) {
        var quake = this.quakes[this.index];
        var coordinates = quake.geometry.coordinates;
        var place = quake.properties.place;
        var magnitude = quake.properties.mag;

        var quakePoint = this.map.FromLatLngToPoint(
          coordinates[1],
          coordinates[0]
        );

        this.earthtones.push(
          new Earthtone(
            this,
            magnitude,
            place,
            quakePoint.x,
            quakePoint.y,
            coordinates[2]
          )
        );

        this.index--;
        if (this.index < 0) {
          this.elapsedTime = this.totalElapsed = 0;
          this.currentTime = this.startTime.getTime();
          this.actualTime = new Date().getTime();
          this.index = this.quakes.length - 1;
        }
      }

      this.actualTime = newTime;

      this.earthtoneCanvas.width = document.body.clientWidth;
      this.earthtoneCanvas.height = document.body.clientHeight;

      for (var i in this.earthtones) {
        this.earthtones[i].render();
        this.earthtones[i].update(rawElapsed);
      }

      //this.audio.update();
      this.timeline.update();
    }
  }

  requestAnimationFrame(this.Render.bind(this));
};

window.onload = function() {
  earthtones = new EarthtoneController();
};
