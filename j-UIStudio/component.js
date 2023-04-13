COMPONENT('uistudio', 'css:1;loading:1;inputdelay:20', function(self, config, cls) {

	self.readonly();

	var current = {};
	var parents = [];

	current.origin = location.origin;
	current.query = NAV.query;
	current.ssid = config.ssid || NAV.query.ssid;

	var navigate = function() {

		config.loading && SETTER('loading/show');

		var url = config.url;
		if (current.ssid)
			url = QUERIFY(url, { ssid: current.ssid });

		AJAX('POST {0} ERROR'.format(url), current, function(response) {

			// response.id
			// response.parent
			// response.data
			// response.query
			// response.url

			var issame = current.id === response.id;

			if (response.url) {

				if (issame) {
					if (response.input)
						setTimeout(response => self.app.input(response.input, response.data), config.inputdelay, response);
					SETTER('loading/hide', 500);
					return;
				} else {
					var breadcrumb = CLONE(current);
					breadcrumb.navigate = function() {
						current = this;
						navigate();
					};
					parents.push(breadcrumb);
				}

				current.id = response.id;
				current.data = response.data;

				if (self.app) {
					self.app.remove();
					self.app = null;
				}

				AJAX('GET {url} ERROR'.args(response), function(data) {

					if (!config.css)
						data.css = '';

					data.id = response.id;
					data.query = data.query || current.query || {};
					data.ssid = data.query.ssid || current.ssid;
					data.openplatform = data.query.openplatform;

					UIBuilder.build(self.element, data, function(app) {

						config.loading && SETTER('loading/hide', 500);

						app.breadcrumb = parents;
						self.app = app;
						self.app.component = self;

						// Loads input data
						if (response.input)
							setTimeout(response => self.app.input(response.input, response.data), config.inputdelay, response);

						self.app.on('output', function(meta) {
							if (!meta.processed) {
								current.output = meta.id;
								current.data = meta.data;
								navigate();
							}
						});

					});
				});
			} else {
				if (config.loading)
					SETTER('loading/hide', 500);
			}

		});

	};

	self.make = function() {
		self.aclass(cls);
		navigate();
	};

	self.destroy = function() {
		if (self.app) {
			self.app.remove();
			self.app = null;
		}
	};

}, ['<UIBuilder> https://cdn.componentator.com/uibuilder.min@1.js']);