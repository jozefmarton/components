COMPONENT('gps', 'watcher:1', function(self, config) {

	var cache = '';

	self.singleton();
	self.readonly();

	var position = function(pos) {

		var coords = pos.coords;
		var obj = {};
		obj.lat = coords.latitude.floor(6);
		obj.lng = coords.longitude.floor(6);
		obj.speed = coords.speed;
		obj.altitude = coords.altitude;
		obj.accuracy = coords.accuracy;

		if (obj.speed)
			obj.speed = obj.speed.floor(1);

		if (obj.altitude)
			obj.altitude = obj.altitude.floor(2);

		if (obj.accuracy)
			obj.accuracy = obj.accuracy.floor(2);

		obj.pos = obj.lat + ',' + obj.lng;

		var key = obj.pos + ',' + (obj.speed || '0') + ',' + (obj.altitude || '0');
		if (cache && cache === key)
			return;

		cache = key;
		self.emit('gps', obj);
		self.set(obj);
	};

	self.make = function() {
		var geo = navigator.geolocation;
		geo.getCurrentPosition(position);
		config.watcher && geo.watchPosition(position);
	};

});