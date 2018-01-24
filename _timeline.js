function EarthtoneTimeline(controller) {
  this.controller = controller;

  this.timeCanvas = document.getElementById('current-time');
  this.canvas = document.createElement('canvas');
  this.canvas.setAttribute('id', 'timeline-canvas');
  this.canvas.width = 400;
  this.canvas.height = 50;
  this.canvas.style.position = 'absolute';
  this.canvas.style.bottom = '10px';
  this.canvas.style.right = '10px';
  this.context = this.canvas.getContext('2d');
  document.body.appendChild(this.canvas);

  this.playCanvas = document.createElement('canvas');
  this.playCanvas.setAttribute('id', 'playControl-canvas');
  this.playCanvas.width = 100;
  this.playCanvas.height = 50;
  this.playCanvas.style.position = 'absolute';
  this.playCanvas.style.bottom = '10px';
  this.playCanvas.style.right = '420px';
  this.playContext = this.playCanvas.getContext('2d');
  document.body.appendChild(this.playCanvas);

  this.line = {};
  this.line.width = this.canvas.width;
  this.line.segments = 8;
  var margin = parseInt((this.canvas.width - this.line.width) / 2) - 0.5;
  this.line.origin = { x: 0, y: this.canvas.height / 2 };

  this.playHead = {};
  this.playHead.rad = 8;
  this.playHead.pos = { x: 0, y: this.canvas.height / 2 };

  var self = this;
  this.controller.playing = false;

  this.playButton = {};
  this.playButton.text = 'PLAY';
  this.playCanvas.addEventListener(
    'click',
    function() {
      self.playButtonClicked();
    },
    false
  );
}

EarthtoneTimeline.prototype.playButtonClicked = function() {
  if (this.controller.playing) {
    this.controller.playing = false;
    this.playButton.text = 'PLAY';
  } else {
    this.controller.playing = true;
    this.playButton.text = 'PAUSE';
  }
};

EarthtoneTimeline.prototype.update = function() {
  var percentComplete = this.controller.totalElapsed / this.controller.timeSpan;
  this.playHead.pos.x = this.line.origin.x + this.line.width * percentComplete;
};

EarthtoneTimeline.prototype.render = function() {
  this.timeCanvas.innerText = new Date(this.controller.currentTime).format(
    'dddd, mmmm dS, yyyy, h:MM TT'
  );

  this.canvas.width = this.canvas.width;
  this.context.fillStyle = 'rgba(0, 0, 0, 0.25)';
  this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);

  this.playCanvas.width = this.playCanvas.width;

  this.playContext.fillStyle = this.controller.playing
    ? 'rgba(0, 0, 0, 0.25)'
    : 'rgba(233, 25, 49, 0.65)';
  this.playContext.fillRect(
    0,
    0,
    this.playCanvas.width,
    this.playCanvas.height
  );
  this.playContext.font =
    "normal 16px 'Gotham Narrow SSm A', 'Gotham Narrow SSm B'";
  this.playContext.textBaseline = 'middle';
  this.playContext.textAlign = 'center';
  this.playContext.fillStyle = '#fff';
  this.playContext.fillText(
    this.playButton.text,
    this.playCanvas.width / 2,
    this.playCanvas.height / 2
  );

  this.context.strokeStyle = 'rgb(0, 0, 0)';
  this.context.lineWidth = 2;

  for (var i = 1; i < this.line.segments; i++) {
    var x = this.line.width / this.line.segments * i + this.line.origin.x;
    var yMod =
      i % 2 == 0 ? this.canvas.height * 0.33 : this.canvas.height * 0.2;
    this.context.beginPath();
    this.context.moveTo(x, this.line.origin.y - yMod);
    this.context.lineTo(x, this.line.origin.y + yMod - 0.5);
    this.context.stroke();
  }

  this.context.fillStyle = 'rgba(200, 0, 20, 1)';
  this.context.strokeStyle = this.controller.playing
    ? 'rgba(233, 25, 49, 0.65)'
    : 'rgba(255, 255, 255, 0.15)';

  this.context.beginPath();
  this.context.moveTo(this.line.origin.x, this.line.origin.y);
  this.context.lineTo(this.playHead.pos.x, this.playHead.pos.y);
  this.context.lineWidth = this.canvas.height;
  this.context.stroke();
};

/*
 * Date Format 1.2.3
 * (c) 2007-2009 Steven Levithan <stevenlevithan.com>
 * MIT license
 *
 * Includes enhancements by Scott Trenda <scott.trenda.net>
 * and Kris Kowal <cixar.com/~kris.kowal/>
 *
 * Accepts a date, a mask, or a date and a mask.
 * Returns a formatted version of the given date.
 * The date defaults to the current date/time.
 * The mask defaults to dateFormat.masks.default.
 */

var dateFormat = (function() {
  var token = /d{1,4}|m{1,4}|yy(?:yy)?|([HhMsTt])\1?|[LloSZ]|"[^"]*"|'[^']*'/g,
    timezone = /\b(?:[PMCEA][SDP]T|(?:Pacific|Mountain|Central|Eastern|Atlantic) (?:Standard|Daylight|Prevailing) Time|(?:GMT|UTC)(?:[-+]\d{4})?)\b/g,
    timezoneClip = /[^-+\dA-Z]/g,
    pad = function(val, len) {
      val = String(val);
      len = len || 2;
      while (val.length < len) val = '0' + val;
      return val;
    };

  // Regexes and supporting functions are cached through closure
  return function(date, mask, utc) {
    var dF = dateFormat;

    // You can't provide utc if you skip other args (use the "UTC:" mask prefix)
    if (
      arguments.length == 1 &&
      Object.prototype.toString.call(date) == '[object String]' &&
      !/\d/.test(date)
    ) {
      mask = date;
      date = undefined;
    }

    // Passing date through Date applies Date.parse, if necessary
    date = date ? new Date(date) : new Date();
    if (isNaN(date)) throw SyntaxError('invalid date');

    mask = String(dF.masks[mask] || mask || dF.masks['default']);

    // Allow setting the utc argument via the mask
    if (mask.slice(0, 4) == 'UTC:') {
      mask = mask.slice(4);
      utc = true;
    }

    var _ = utc ? 'getUTC' : 'get',
      d = date[_ + 'Date'](),
      D = date[_ + 'Day'](),
      m = date[_ + 'Month'](),
      y = date[_ + 'FullYear'](),
      H = date[_ + 'Hours'](),
      M = date[_ + 'Minutes'](),
      s = date[_ + 'Seconds'](),
      L = date[_ + 'Milliseconds'](),
      o = utc ? 0 : date.getTimezoneOffset(),
      flags = {
        d: d,
        dd: pad(d),
        ddd: dF.i18n.dayNames[D],
        dddd: dF.i18n.dayNames[D + 7],
        m: m + 1,
        mm: pad(m + 1),
        mmm: dF.i18n.monthNames[m],
        mmmm: dF.i18n.monthNames[m + 12],
        yy: String(y).slice(2),
        yyyy: y,
        h: H % 12 || 12,
        hh: pad(H % 12 || 12),
        H: H,
        HH: pad(H),
        M: M,
        MM: pad(M),
        s: s,
        ss: pad(s),
        l: pad(L, 3),
        L: pad(L > 99 ? Math.round(L / 10) : L),
        t: H < 12 ? 'a' : 'p',
        tt: H < 12 ? 'am' : 'pm',
        T: H < 12 ? 'A' : 'P',
        TT: H < 12 ? 'AM' : 'PM',
        Z: utc
          ? 'UTC'
          : (String(date).match(timezone) || [''])
              .pop()
              .replace(timezoneClip, ''),
        o:
          (o > 0 ? '-' : '+') +
          pad(Math.floor(Math.abs(o) / 60) * 100 + Math.abs(o) % 60, 4),
        S: ['th', 'st', 'nd', 'rd'][
          d % 10 > 3 ? 0 : ((d % 100 - d % 10 != 10) * d) % 10
        ]
      };

    return mask.replace(token, function($0) {
      return $0 in flags ? flags[$0] : $0.slice(1, $0.length - 1);
    });
  };
})();

// Some common format strings
dateFormat.masks = {
  default: 'ddd mmm dd yyyy HH:MM:ss',
  shortDate: 'm/d/yy',
  mediumDate: 'mmm d, yyyy',
  longDate: 'mmmm d, yyyy',
  fullDate: 'dddd, mmmm d, yyyy',
  shortTime: 'h:MM TT',
  mediumTime: 'h:MM:ss TT',
  longTime: 'h:MM:ss TT Z',
  isoDate: 'yyyy-mm-dd',
  isoTime: 'HH:MM:ss',
  isoDateTime: "yyyy-mm-dd'T'HH:MM:ss",
  isoUtcDateTime: "UTC:yyyy-mm-dd'T'HH:MM:ss'Z'"
};

// Internationalization strings
dateFormat.i18n = {
  dayNames: [
    'Sun',
    'Mon',
    'Tue',
    'Wed',
    'Thu',
    'Fri',
    'Sat',
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday'
  ],
  monthNames: [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
  ]
};

// For convenience...
Date.prototype.format = function(mask, utc) {
  return dateFormat(this, mask, utc);
};
