COMPONENT('keyvalue', 'maxlength:100', function(self, config, cls) {

	var cls2 = '.' + cls;
	var container, content = null;
	var cempty = cls + '-empty';
	var skip = false;
	var empty = {};

	var modify = function(val) {
		// Is >19?
		if (self.modify) {
			self.modify(val, 2);
		} else {
			self.set(val, 2);
			self.change(true);
		}
	};

	self.nocompile && self.nocompile();
	self.template = Tangular.compile('<div class="{0}-item"><div class="{0}-item-remove"><i class="ti ti-times"></i></div><div class="{0}-item-key"><input type="text" name="key" maxlength="{{ max }}"{{ if disabled }} disabled="disabled"{{ fi }} placeholder="{{ placeholder_key }}" value="{{ key }}" autocomplete="new-password" /></div><div class="{0}-item-value"><input type="text" maxlength="{{ max }}" placeholder="{{ placeholder_value }}" value="{{ value }}" autocomplete="new-password" /></div></div>'.format(cls));

	self.binder = function(fn) {
		self.binder2 = fn;
	};

	self.binder2 = function(type, value) {
		return value;
	};

	self.configure = function(key, value, init, prev) {
		if (init)
			return;

		var redraw = false;

		switch (key) {
			case 'disabled':
				self.tclass('ui-disabled', value);
				self.find('input').prop('disabled', value);
				empty.disabled = value;
				break;
			case 'maxlength':
				self.find('input').prop('maxlength', value);
				break;
			case 'placeholderkey':
				self.find('input[name="key"]').prop('placeholder', value);
				break;
			case 'placeholdervalue':
				self.find('input[name="value"]').prop('placeholder', value);
				break;
			case 'icon':
				if (value && prev)
					self.find('i').rclass2('ti').aclass(value.indexOf(' ') === -1 ? ('ti ti-' + value) : value);
				else
					redraw = true;
				break;
			case 'label':
				redraw = true;
				break;
		}

		if (redraw) {
			self.redraw();
			self.refresh();
		}
	};

	self.redraw = function() {

		var icon = config.icon;
		var label = config.label || content;

		if (icon)
			icon = '<i class="{0}"></i>'.format(self.icon(icon));

		empty.value = '';

		self.html((label ? '<div class="' + cls + '-label">{1}{0}:</div>'.format(label, icon) : '') + '<div class="' + cls + '-items"></div>' + self.template(empty).replace('-item"', '-item ' + cls + '-base"'));
		container = self.find(cls2 + '-items');
	};

	self.make = function() {

		empty.max = config.maxlength;
		empty.placeholder_key = config.placeholderkey;
		empty.placeholder_value = config.placeholdervalue;
		empty.value = '';
		empty.disabled = config.disabled;

		content = self.html();

		self.aclass(cls);
		self.disabled && self.aclass('ui-disabled');
		self.redraw();

		self.event('click', '.ti-times', function() {

			if (config.disabled)
				return;

			var el = $(this);
			var parent = el.closest(cls2 + '-item');
			var inputs = parent.find('input');
			var obj = self.get();
			!obj && (obj = {});
			var key = inputs[0].value;
			parent.remove();
			delete obj[key];
			modify(obj);
		});

		self.event('focus', 'input', function() {
			config.autocomplete && self.EXEC(config.autocomplete, $(this), self);
		});

		self.event('change keydown', 'input', function(e) {

			if (config.disabled || (e.type === 'keydown' && e.which !== 13))
				return;

			var el = $(this);
			var inputs = el.closest(cls2 + '-item').find('input');
			var key = self.binder2('key', inputs[0].value);
			var value = self.binder2('value', inputs.get(1).value);

			if (!key || !value)
				return;

			var base = el.closest(cls2 + '-base').length > 0;
			if (base) {
				var tmp = self.get();
				!tmp && (tmp = {});
				tmp[key] = value;
				modify(tmp);
				inputs.val('');
				inputs.eq(0).focus();
				return;
			}

			var keyvalue = {};
			var k;

			var arr = container.find('input');
			for (var m of arr) {
				if (m.name === 'key') {
					k = m.value.trim();
				} else if (k) {
					keyvalue[k] = m.value.trim();
					k = '';
				}
			}

			skip = true;
			modify(keyvalue);
		});
	};

	self.setter = function(value) {

		if (skip) {
			skip = false;
			return;
		}

		if (!value) {
			container.empty();
			self.aclass(cempty);
			return;
		}

		var builder = [];
		var keys = Object.keys(value);

		for (var i = 0; i < keys.length; i++) {
			empty.key = keys[i];
			empty.value = value[empty.key];
			builder.push(self.template(empty));
		}

		self.tclass(cempty, !builder.length);
		container.empty().append(builder.join(''));
	};
});