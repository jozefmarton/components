COMPONENT('choose', 'limit:1;attr:id;key:id;selector:.selection;event:click;class:selected;type:string;uncheck:false', function(self, config, cls) {

	var convert = function(val) {
		switch (config.type) {
			case 'number':
				return val ? val.parseInt() : null;
			default:
				return val;
		}
	};

	self.getter = null;
	self.validate = function(value, init) {
		if (init || config.disabled || !config.required)
			return true;
		return config.limit === 1 ? value != null : value && value.length > 0;
	};

	self.make = function() {

		self.aclass(cls);

		self.event(config.event, config.selector, function(e) {
			e.preventDefault();
			e.stopPropagation();
			self.toggle($(this));
		});

	};

	self.toggle = function(id) {

		if (config.disabled)
			return;

		id = convert(ATTRD(id, config.attr));

		var model = self.get();
		if (model == null) {
			self.rewrite(model);
			self.set(config.limit === 1 ? id : [id]);
		} else {
			if (config.limit === 1) {
				if (model === id) {
					if (config.uncheck)
						self.set(null);
				} else
					self.set(id);
			} else {
				var index = model.indexOf(id);
				if (index === -1)
					model.push(id);
				else
					model.splice(index, 1);
				self.update(true);
			}
		}
		self.change(true);
	};

	self.recalc = function() {
		var arr = self.find(config.selector);
		var model = self.get();
		for (var i = 0; i < arr.length; i++) {
			var el = $(arr[i]);
			var is = false;
			if (config.limit === 1)
				is = model == null ? false : model === convert(el.attrd(config.attr));
			else
				is = model && model instanceof Array && model.length ? model.indexOf(el.attrd(config.attr)) !== -1 : false;
			el.tclass(config.class, is);
		}
	};

	var datasource = function() {
		self.update();
	};

	self.configure = function(key, value) {
		if (key === 'datasource')
			self.datasource(value, datasource);
	};

	self.setter = function() {
		setTimeout2(self.ID, self.recalc, 10);
	};

});