COMPONENT('validate', 'delay:100;flags:visible;changes:0;strictchanges:0', function(self, config, cls) {

	var elements = null;
	var def = 'button[name="submit"]';
	var flags = null;
	var tracked = false;
	var reset = false;
	var old, track;
	var currentvalue;
	var customvalidation = null;
	var currentpath = '';

	self.readonly();

	self.make = function() {
		elements = self.find(config.selector || def);
		currentpath = self.path.toString();
	};

	self.configure = function(key, value, init) {
		switch (key) {
			case 'selector':
				if (!init)
					elements = self.find(value || def);
				break;
			case 'flags':
				if (value) {
					flags = value.split(',');
					for (var i = 0; i < flags.length; i++)
						flags[i] = '@' + flags[i];
					flags = flags.join(' ');
				} else
					flags = null;
				break;
			case 'track':
				track = value.split(',').trim();
				break;
			case 'if':
				customvalidation = new Function('value', 'path', 'return ' + value);
				break;
		}
	};

	var settracked = function() {
		tracked = 0;
	};

	var backup = null;
	var current = null;

	self.setter = function(value, path, type) {

		currentvalue = value;

		var is = path === currentpath || path.length < currentpath.length;
		var isreset = false;

		if (M.version >= 20) {
			type = type.init || type.reset ? 0 : 1;
			if (!type)
				isreset = true;
			config.modified = !isreset;
			config.touched = !isreset;
		}

		if (config.changes) {
			current = STRINGIFY(value, config.strictchanges != true);
			if (M.version >= 20) {
				if (isreset)
					backup = current;
				else
					is = backup === current;
			} else if (is) {
				backup = current;
				is = true;
			} else
				is = backup === current;
		}

		if (reset !== is) {
			reset = is;
			self.tclass(cls + '-modified', !reset);
		}

		if ((type === 1 || type === 2) && track && track.length) {
			for (var i = 0; i < track.length; i++) {
				if (path.indexOf(track[i]) !== -1) {
					tracked = 1;
					return;
				}
			}
			if (tracked === 1) {
				tracked = 2;
				setTimeout(settracked, config.delay * 3);
			}
		}
	};

	var check = function() {

		var arr = COMPONENTS(self.path + (flags ? (' ' + flags) : ''));
		var disabled = false;
		var modified = false;

		for (var m of arr) {
			if (config.validonly) {
				if (m.config.invalid) {
					disabled = true;
					break;
				}
			} else if (m.config.invalid) {
				disabled = true;
				break;
			} else if (m.config.modified)
				modified = true;
		}

		if (!disabled) {
			if (!config.validonly)
				disabled = modified == false;
		}

		if (!disabled && config.if)
			disabled = !customvalidation(self.get(), '');

		if (!disabled && config.changes && backup === current)
			disabled = true;

		if (HIDDEN(self.element))
			disabled = true;

		if (disabled !== old) {
			elements.prop('disabled', disabled);
			self.tclass(cls + '-ok', !disabled);
			self.tclass(cls + '-no', disabled);
			old = disabled;
			if (!old && config.exec)
				self.SEEX(config.exec, currentvalue);
			config.output && self.SEEX(config.output, !disabled);
		}

	};

	// jComponent v20
	self.state2 = function() {
		setTimeout2(self.ID, check, config.delay);
	};

	self.state = function(type, what) {
		var isreset = jComponent.is20 ? (!config.modified && !config.touched) : (type === 3 || what === 3);
		if (isreset) {
			self.rclass(cls + '-modified');
			tracked = 0;
			backup = current;
		}
		setTimeout2(self.ID, check, config.delay);
	};

});