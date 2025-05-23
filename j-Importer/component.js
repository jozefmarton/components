COMPONENT('importer', function(self, config) {

	var init = false;
	var clid = null;
	var pending = false;
	var skip = false;
	var content = '';
	var singletonkey;
	var isplugin = false;

	var replace = function(value) {
		return !config.adapt && self.scope ? self.makepath(value) : value.replace(/\?/g, config.path || config.if);
	};

	var replace2 = function(value) {
		isplugin = value ? value.includes('<ui-plugin') : false;
		return value ? ADAPT(config.path || config.if, config.id, value) : value;
	};

	self.readonly();

	self.make = function() {

		if (config.singleton) {

			if (!W.$importercache)
				W.$importercache = {};

			singletonkey = HASH(config.path + '|' + config.id + '|' + config.url).toString(36);

			if (W.$importercache[singletonkey]) {
				skip = true;
				setTimeout(() => self.remove(), 10);
				return;
			}
		}

		var scr = self.find('script');
		content = (scr.length ? scr.html() : '');

		if (content)
			content = content.replace(/SCR/g, 'scr' + 'ipt');

		if (config.parent) {
			var parent = self.parent(config.parent);
			if (parent && parent.length)
				parent[0].appendChild(self.dom);
		}

	};

	var wait = function() {
		if (isplugin) {
			var name = config.path || config.if;
			WAIT(() => PLUGINS[name], self.reload);
		} else
			self.reload();
	};

	self.reload = function(recompile) {

		if (config.singleton)
			W.$importercache[singletonkey] = 1;

		config.reload && EXEC(replace(config.reload));
		recompile && COMPILE();
		setTimeout(function() {
			pending = false;
			init = true;
		}, 1000);
	};

	self.setter = function(value) {

		if (pending || skip)
			return;

		if (config.if !== value) {
			if (config.cleaner && init && !clid)
				clid = setTimeout(self.clean, config.cleaner * 60000);
			return;
		}

		pending = true;

		if (clid) {
			clearTimeout(clid);
			clid = null;
		}

		if (init) {
			self.reload();
			return;
		}

		if (content) {
			self.html(replace2(content));
			setTimeout(self.reload, 50, true);
		} else {
			if (M.is20)
				self.import(config.url + ' @prepend', wait, replace2);
			else
				self.import(config.url, wait, true, replace2);
		}
	};

	self.clean = function() {
		config.clean && EXEC(replace(config.clean));
		setTimeout(function() {
			self.empty();
			init = false;
			clid = null;
		}, 1000);
	};
});