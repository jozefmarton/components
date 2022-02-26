COMPONENT('searchdata', 'class:hidden;delay:50;key:name;splitwords:1', function(self, config, cls) {

	self.readonly();

	self.configure = function(key, value) {
		if (key === 'datasource')
			self.datasource(value, self.search);
	};

	self.searchforce = function() {

		var value = self.get();
		var datasource = GET(self.makepath(config.datasource)) || EMPTYARRAY;

		if (!value) {
			self.rclass2(cls + '-');
			config.output && self.SEEX(config.output, datasource);
			return;
		}

		var raw = value.trim();
		var search = raw.toSearch();
		var output = [];
		var is = false;

		if (config.splitwords) {
			search = search.split(' ');
			raw = raw.split(' ');
		}

		self.aclass(cls + '-used');

		for (var item of datasource) {

			var val = item[config.key] || '';
			var fuzzy = val.toSearch();

			if (search instanceof Array) {

				for (var j = 0; j < raw.length; j++) {
					if (val.indexOf(raw[j]) === -1) {
						is = true;
						break;
					}
				}

				if (is) {
					is = false;
					for (var j = 0; j < search.length; j++) {
						if (fuzzy.indexOf(search[j]) === -1) {
							is = true;
							break;
						}
					}
				}
			} else
				is = fuzzy.indexOf(search) === -1 && val.indexOf(raw) === -1;

			if (!is)
				output.push(item);
		}

		self.tclass(cls + '-empty', !output.length);
		config.output && self.SEEX(config.output, output);
	};

	self.search = function() {
		setTimeout2(self.ID, self.searchforce, config.delay);
	};

	self.setter = self.search;
});