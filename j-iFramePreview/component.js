COMPONENT('iframepreview', function(self, config, cls) {

	var iframe;
	var ready = false;
	var writetimeout;

	self.readonly();
	self.nocompile && self.nocompile();

	self.make = function() {
		self.aclass(cls);
		self.html('<iframe src="about:blank" frameborder="0" scrolling="no"></iframe>');
		iframe = self.find('iframe');

		var isready = () => ready = true;
		var timeout = null;

		iframe.on('load', function() {
			timeout && clearTimeout(timeout);
			timeout = setTimeout(isready, 150);
		});

		timeout = setTimeout(isready, 1000);
	};

	self.destroy = function() {
		iframe = null;
	};

	self.write = function(content) {

		writetimeout && clearTimeout(writetimeout);
		writetimeout = null;

		if (!ready) {
			writetimeout = setTimeout(self.write, 200, content);
			return;
		}

		var win = iframe && iframe[0] ? iframe[0].contentWindow : null;
		if (win) {

			var is = false;
			var offset = '<div id="IFPOFFSET"></div>';

			content = content.replace(/<\/body>/i, function() {
				is = true;
				return offset + '</body>';
			});

			if (!is)
				content += offset;

			var doc = win.document;
			doc.open();
			doc.write(content);
			doc.close();
			self.resize();
			setTimeout(self.resize, 500);
			setTimeout(self.resize, 1000);
			setTimeout(self.resize, 2000);
			setTimeout(self.resize, 3000);
		}
	};

	self.resize = function() {
		var win = iframe && iframe[0] ? iframe[0].contentWindow : null;
		if (win) {
			var el = $(win.document.getElementById('IFPOFFSET'));
			if (el.length) {
				var offset = el.offset();
				if (offset) {
					self.element.css('height', offset.top);
					if (offset.top == 0)
						setTimeout(self.resize, 1000);
				}
			}
		}
	};

	self.setter = function(value) {
		if (value)
			self.write(value);
		else
			iframe.attr('src', 'about:blank');
	};
});