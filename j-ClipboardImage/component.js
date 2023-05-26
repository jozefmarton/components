COMPONENT('clipboardimage', 'quality:90;maxwidth:1024;maxheight:768;type:jpg;output:base64', function(self, config) {

	var ctx, img, canvas = null;

	self.singleton();
	self.readonly();
	self.blind();
	self.nocompile();

	// Source: https://stackoverflow.com/questions/35940290/how-to-convert-base64-string-to-javascript-file-object-like-as-from-file-input-f
	function dataURLtoFile(dataurl, filename) {
		var arr = dataurl.split(',');
		var mime = arr[0].match(/:(.*?);/)[1];
		var bstr = atob(arr[arr.length - 1]);
		var n = bstr.length;
		var u8arr = new Uint8Array(n);
		while (n--)
			u8arr[n] = bstr.charCodeAt(n);
		return new File([u8arr], filename, {type:mime});
	}

	self.make = function() {
		self.aclass('hidden');
		self.append('<canvas></canvas><img src="data:image/png;base64,R0lGODdhAQABAIAAAHnrWAAAACH5BAEAAAEALAAAAAABAAEAAAICTAEAOw==" />');
		canvas = self.find('canvas')[0];
		ctx = canvas.getContext('2d');
		img = self.find('img')[0];

		$(W).on('paste', function(e) {

			if (config.disabled)
				return;

			var item = e.originalEvent.clipboardData.items[0];
			if (item.kind !== 'file' || item.type.substring(0, 5) !== 'image')
				return;
			var blob = item.getAsFile();
			var reader = new FileReader();
			reader.onload = function(e) {
				img.onload = function() {
					self.resize();
				};
				img.src = e.target.result;
			};
			reader.readAsDataURL(blob);
		});
	};

	self.resize = function() {
		var dpr = W.devicePixelRatio;

		if (dpr > 1) {
			canvas.width = img.width / dpr;
			canvas.height = img.height / dpr;
		} else {
			canvas.width = img.width;
			canvas.height = img.height;
		}

		if (canvas.width > config.maxwidth) {
			canvas.width = config.maxwidth;
			canvas.height = (img.height * (config.maxwidth / img.width) >> 0);
		} else if (canvas.height > config.maxheight) {
			canvas.height = config.maxheight;
			canvas.width = (img.width * (config.maxheight / img.height)) >> 0;
		}

		ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
		var data = config.type === 'png' ? canvas.toDataURL('image/png') : canvas.toDataURL('image/jpeg', config.quality * 0.01);

		if (config.output === 'file')
			data = dataURLtoFile(data, 'screenshot.' + config.type);

		config.exec && self.EXEC(config.exec, data);
		EMIT('clipboardimage', data);
	};
});