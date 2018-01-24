function Earthtone(controller, magnitude, location, x, y, z) {
  this.controller = controller;

  this.lifetime = magnitude * 1000;
  this.age = 0;
  this.lifeCompleted = 0;
  this.startRadius = magnitude * 4;
  this.endRadius = magnitude * 4;
  this.currentRadius = this.startRadius * 1;

  this.locationText = location.split(' of ')[1];
  if (!this.locationText) this.locationText = location;
  this.locationText = this.locationText.replace(', ', '<br />');
  this.magnitudeText = magnitude.toFixed(1);

  this.x = x;
  this.y = y;
  this.z = z;

  this.r = 233;
  this.g = 25;
  this.b = 49;
  this.a = 1.0;

  this.globalAlpha = 1.0;
  this.a = 0.85;
  this.ringCount = Math.round(magnitude) * 2;
  this.alphaIncrementer = 0.75 / this.ringCount;

  this.textContainer = document.createElement('div');
  var magnitudeContainer = document.createElement('div');
  var locationContainer = document.createElement('div');

  this.textContainer.className = 'quake-info';
  this.textContainer.style.top =
    this.controller.offset.y + this.y + this.startRadius + 5 + 'px';
  this.textContainer.style.left = this.controller.offset.x + this.x + 'px';
  magnitudeContainer.className = 'quake-magnitude';
  magnitudeContainer.innerHTML = this.magnitudeText;
  locationContainer.className = 'quake-location';
  locationContainer.innerHTML = this.locationText;

  this.textContainer.appendChild(magnitudeContainer);
  this.textContainer.appendChild(locationContainer);
  document.body.appendChild(this.textContainer);

  this.controller.audio.playTone(magnitude, this.x, this.y, this.z);
}

Earthtone.prototype.rgba = function() {
  return 'rgba(' + this.r + ', ' + this.g + ', ' + this.b + ', ' + this.a + ')';
};

Earthtone.prototype.rgb = function() {
  return 'rgba(' + this.r + ', ' + this.g + ', ' + this.b + ', ' + this.a + ')';
};

Earthtone.prototype.update = function(timeElapsed) {
  // Increment age, but don't let it exceed lifetime
  // or else who knows what will happen . . .
  this.age = Math.min(this.lifetime, this.age + timeElapsed);
  this.lifeCompleted = this.age / this.lifetime;
  this.easedCompleted = EasingFunctions.easeInCubic(this.lifeCompleted);
  this.easedOutCompleted = EasingFunctions.easeOutCubic(this.lifeCompleted);

  this.globalAlpha = 1.0 - this.easedCompleted;
  this.currentRadius =
    this.startRadius + (this.endRadius - this.startRadius) * this.lifeCompleted;
};

Earthtone.prototype.render = function() {
  for (var i = this.ringCount; i >= 0; i--) {
    var amplitude = this.currentRadius;
    var period = Math.PI * 2 / (this.ringCount * 1.33);
    var horizontalShift = this.lifeCompleted * (this.ringCount * 1.33);
    var sinusoid = amplitude * Math.cos(period * i - horizontalShift);
    var radius =
      i == 0
        ? this.endRadius
        : Math.max(i, 1) * this.currentRadius +
          this.currentRadius / 2 +
          Math.max(0, sinusoid);
    var alpha = sinusoid / amplitude; //this.controller.earthtoneContext.lineWidth = 1 + Math.max(0, sinusoid / 2);
    this.controller.earthtoneContext.lineWidth = 1 + alpha;

    //var maxAlpha = 0.5 * Math.cos( (Math.PI * 2) / (this.ringCount * 3) * (i - (this.lifeCompleted * (this.ringCount * 2))) ) + 0.5;
    //var actualAlpha = maxAlpha * this.a; // Math.min(1, (this.age / (this.lifetime / 3))) * maxAlpha;
    //var radius = (i == 0) ? this.endRadius : (Math.max(i, 1) * this.currentRadius) + (this.currentRadius);
    this.controller.earthtoneContext.beginPath();
    this.controller.earthtoneContext.arc(
      this.controller.offset.x + this.x,
      this.controller.offset.y + this.y,
      radius,
      0,
      2 * Math.PI,
      false
    );

    if (i != 0) {
      this.controller.earthtoneContext.strokeStyle =
        'rgba(233, 25, 49, ' + alpha * this.globalAlpha + ')';
      this.controller.earthtoneContext.stroke();
    } else {
      this.controller.earthtoneContext.fillStyle =
        'rgba(233, 25, 49, ' + this.globalAlpha + ')';
      this.controller.earthtoneContext.fill();
    }
  }

  var textAlpha = 1.0 - EasingFunctions.easeInCubic(this.lifeCompleted);
  this.textContainer.style.color = 'rgba(255, 255, 255, ' + textAlpha + ')';
};
