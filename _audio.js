function Tone(audioController, audioContext, freq, length, x, y, z) {
  x = x / 1024;
  y = y / 1024;
  z = z / audioController.controller.maxDepth;

  this.frequency = freq;
  this.source = audioContext.createOscillator();
  this.source.type = 'sine'; // sine wave
  this.source.frequency.value = this.frequency;

  this.source2 = audioContext.createOscillator();
  this.source2.type = 'square'; // square wave

  this.source2.frequency.value = this.frequency * 2 * 0.99;

  this.source3 = audioContext.createOscillator();
  this.source3.type = 'square'; // square wave

  this.source3.frequency.value = this.frequency * 0.5 * 0.99;

  this.filter = audioContext.createBiquadFilter();
  this.filter.type = 'lowpass'; // Low-pass filter. See BiquadFilterNode docs
  this.filter.frequency.value = audioController.controller.mapRange(
    z,
    0,
    1,
    500,
    10000
  );

  this.panner = audioContext.createPanner();
  this.panner.setPosition(x - 0.5, y - 0.5, 0 - z);

  this.compressor = audioContext.createDynamicsCompressor();
  //this.compressor.threshold.value = -40;
  //this.compressor.knee.value = 40;

  this.volume = audioContext.createGain();
  this.volume.gain.value = 1.0;

  this.source.connect(this.panner);
  this.source2.connect(this.panner);
  this.source3.connect(this.panner);
  this.panner.connect(this.filter);
  this.filter.connect(this.compressor);
  this.compressor.connect(this.volume);
  this.volume.connect(audioController.wet);
  this.volume.connect(audioController.dry);

  this.startTime = audioContext.currentTime + 0;
  this.currentTime = this.startTime + 0;
  this.length = length;
  this.endTime = this.startTime + this.length * 1.5;
  this.elapsedTime = 0;
  this.timeCompleted = 0;
  this.easedCompleted = 0;

  this.source.start(0);
  this.source2.start(0);
  this.source3.start(0);
  this.source.stop(this.endTime);
  this.source2.stop(this.endTime);
  this.source3.stop(this.endTime);
}

Tone.prototype.update = function(elapsedTime) {
  this.currentTime += elapsedTime;
  this.elapsedTime += elapsedTime;

  this.timeCompleted = this.elapsedTime / this.length;
  this.easedCompleted = EasingFunctions.easeOutCubic(this.timeCompleted);

  this.volume.gain.value = 1.0 - this.easedCompleted;
};

function EarthtoneAudio(controller) {
  this.loaded = false;
  this.controller = controller;

  this.audioContext = new AudioContext();

  this.convolver = this.audioContext.createConvolver();
  this.setReverbImpulseResponse('/assets/audio/linear.wav');

  this.wet = this.audioContext.createGain();
  this.wet.gain.value = 1.0;
  this.wet.connect(this.convolver);

  this.dry = this.audioContext.createGain();
  this.dry.gain.value = 0.5;
  this.dry.connect(this.audioContext.destination);

  this.cMinor = [261.63, 293.66, 311.13, 349.23, 392, 415.3];
  this.octaves = [2.0, 1.0, 0.5, 0.25];
  this.fullScale = [];
  this.tones = [];

  for (var i = 0; i < this.octaves.length; i++) {
    for (var j = this.cMinor.length - 1; j >= 0; j--) {
      this.fullScale.push(this.cMinor[j] * this.octaves[i]);
    }
  }

  this.magShift = this.controller.minMagnitude;
  this.minimum = this.controller.minMagnitude - this.magShift;
  this.maximum = this.controller.maxMagnitude - this.magShift;

  this.currentTime = this.audioContext.currentTime + 0;

  this.string1 = this.audioContext.createOscillator();
  this.string1.type = 'sine'; // sine wave
  this.string1.frequency.value = 264;

  this.string2 = this.audioContext.createOscillator();
  this.string2.type = 'square'; // sine wave
  this.string2.frequency.value = 264 * 0.75 * 0.99;

  this.string3 = this.audioContext.createOscillator();
  this.string3.type = 'sine'; // sine wave
  this.string3.frequency.value = 264 * 1.25 * 0.99;

  this.compressor = this.audioContext.createDynamicsCompressor();
  this.compressor.threshold.value = -40;
  this.compressor.knee.value = 40;

  this.volume = this.audioContext.createGain();
  this.volume.gain.value = 0.15;

  this.string1.connect(this.compressor);
  this.string2.connect(this.compressor);
  // this.string3.connect(this.convolver);
  this.compressor.connect(this.volume);
  this.volume.connect(this.audioContext.destination);

  this.toneCount = 0;

  var self = this;
  this.loopId = window.setTimeout(function() {
    self.update();
  }, 75);
}

EarthtoneAudio.prototype.setReverbImpulseResponse = function(url) {
  var self = this;
  var request = new XMLHttpRequest();
  request.open('GET', url, true);
  request.responseType = 'arraybuffer';

  request.onload = function() {
    self.audioContext.decodeAudioData(request.response, function(buffer) {
      self.convolver.buffer = buffer;
      self.convolver.connect(self.audioContext.destination);
      self.loaded = true;
    });
  };

  request.send();
};

EarthtoneAudio.prototype.updateStrings = function(freq) {
  this.string1.frequency.value = freq;
  this.string2.frequency.value = this.string1.frequency.value * 2 * 0.99; //this.string1.frequency.value * 0.75 * 0.99;
  this.string3.frequency.value = this.string1.frequency.value * 0.75 * 0.99;

  this.string1.start(0);
  this.string2.start(0);
  //this.string3.start(0);

  /*var now = this.audioContext.currentTime;
	this.volume.gain.cancelScheduledValues( now );
	this.volume.gain.setValueAtTime(this.volume.gain.value, now);
	this.volume.gain.exponentialRampToValueAtTime(0 , now + 8);*/
  //this.string3.start(0);
};

EarthtoneAudio.prototype.playTone = function(mag, x, y, z) {
  var octave = this.controller.mapRangeInt(
    mag,
    this.controller.minMagnitude,
    this.controller.maxMagnitude,
    0,
    this.fullScale.length - 1
  );
  var freq = this.fullScale[octave];
  this.tones.push(new Tone(this, this.audioContext, freq, mag, x, y, z));

  //if (this.toneCount % 4 == 0) this.tones.push(new Tone(this, this.audioContext, freq * 0.5, 10, x, y, z));
  this.toneCount++;
};

EarthtoneAudio.prototype.update = function() {
  var self = this;
  var elapsedTime = this.audioContext.currentTime - this.currentTime;

  // remove dead notes
  for (var i = 0; i < this.tones.length; i++) {
    if (this.tones[i].source.playbackState == 3) {
      this.tones.splice(i, 1);
      i--;
    }
  }

  // update still playing notes
  for (var i = 0; i < this.tones.length; i++) {
    this.tones[i].update(elapsedTime);
  }

  this.currentTime += elapsedTime;
  this.loopId = window.setTimeout(function() {
    self.update();
  }, 75);
};
