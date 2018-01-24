function EarthtoneMap() {
  var self = this;
  this.canvas = document.getElementById('map-canvas');
  this.tileContainer = document.getElementById('map-tiles');
  this.loaded = false;
  this.loadCount = 0;
  this.tiles = [];

  for (var i = 1; i <= 15; i++) {
    var mapTile = document.createElement('img');
    mapTile.src = '/assets/img/map-tiles/map_' + i + '.png';
    mapTile.width = 256;
    mapTile.height = 256;
    this.tiles.push(mapTile);

    if (mapTile.addEventListener) {
      mapTile.addEventListener('load', function() {
        self.TileLoaded();
      });
    } else {
      mapTile.attachEvent('onload', function() {
        self.TileLoaded();
      });
    }

    this.tileContainer.appendChild(mapTile);
  }
}

EarthtoneMap.prototype.TileLoaded = function() {
  this.loadCount++;

  if (this.loadCount == this.tiles.length) {
    this.loaded = true;
  }
};

EarthtoneMap.prototype.FromLatLngToPoint = function(latitude, longitude) {
  var mapWidth = 1024;
  var mapHeight = 1024;

  var x = (180 + longitude) * (mapWidth / 360);

  // convert from degrees to radians
  var latRad = latitude * Math.PI / 180;

  // get y value
  var mercN = Math.log(Math.tan(Math.PI / 4 + latRad / 2));
  var y = mapHeight / 2 - mapWidth * mercN / (2 * Math.PI);

  return { x: x, y: y };
};
