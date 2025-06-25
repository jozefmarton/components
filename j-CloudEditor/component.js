COMPONENT('cloudeditor', 'parent:auto;autosave:1;realtime:0;margin:0;url://cdn.componentator.com/editor/1.min.html', function(self, config) {

	var iframe;
	var savetimeout;
	var callbacks = {};
	var callbackid = 1;
	var init = false;

	var save = function() {
		savetimeout = null;
		send({ TYPE: 'body' }, function(msg) {
			var model = self.get();
			model.body = msg.value;
			self.bind('@modified @touched', model);
		});
	};

	var send = function(msg, callback) {

		if (callback) {
			var id = (callbackid++) + '';
			msg.callbackid = id;
			callbacks[id] = callback;
		}

		msg.id = self.ID;
		iframe[0].contentWindow.postMessage(STRINGIFY(msg), '*');
	};

	var onmessage = function(e) {

		if (e.originalEvent.source !== iframe[0].contentWindow)
			return;

		var msg = e.originalEvent ? e.originalEvent.data : '';

		if (typeof(msg) === 'string') {
			if (msg.indexOf('"totaleditor"') === -1 || msg.indexOf('"id":"' + self.ID +'"') === -1)
				return;
			msg = PARSE(msg);
		} else if (!msg)
			return;

		if (msg.totaleditor !== 1 || msg.id !== self.ID)
			return;

		if (msg.callbackid) {
			var fn = callbacks[msg.callbackid];
			if (fn) {
				delete callbacks[msg.callbackid];
				fn(msg);
			}
			return;
		}

		switch (msg.TYPE) {
			case 'click':
			case 'shortcut':
			case 'errors':
			case 'change':
				config.event && self.SEEX(config.event, msg.TYPE, msg.value);
				break;
			case 'menu':
			case 'contextmenu':
				var offset = self.element.offset();
				msg.x += offset.left;
				msg.y += offset.top;
				msg.instance = self;
				config.contextmenu && self.SEEX(config.contextmenu, msg);
				break;
			case 'cursor':
				config.event && self.SEEX(config.event, msg.TYPE, msg.value);
				if (config.autosave) {
					savetimeout && clearTimeout(savetimeout);
					savetimeout = setTimeout(save, 500);
				}
				break;
			case 'init':
				init = true;
				break;
		}
	};

	self.make = function() {
		var protocol = location.protocol;
		if (protocol === 'file:')
			protocol = 'http:';
		self.append('<iframe src="{1}{2}?id={0}" frameborder="0" scrolling="no" allowtransparency="true" allow="geolocation *; microphone *; camera *; midi *; encrypted-media *" style="width:100%;overflow:hidden;display:block"></iframe>'.format(self.ID, protocol, config.url));
		iframe = self.find('iframe');
		self.resize();
		$(W).on('message', onmessage);
	};

	self.destroy = function() {
		$(W).off('message', onmessage);
	};

	self.replace = function(text, to) {
		send({ TYPE: 'replace', value: text, to: to });
	};

	self.readonly = function(is) {
		send({ TYPE: 'readonly', value: is });
	};

	self.search = function(text, callback) {
		send({ TYPE: 'search', value: text }, callback);
	};

	self.select = function(from, to) {
		send({ TYPE: 'select', from: from, to: to });
	};

	self.goto = function(pos) {
		send({ TYPE: 'goto', value: pos });
	};

	self.clear = function() {
		send({ TYPE: 'clear' });
	};

	self.replaceselections = function(val) {
		send({ TYPE: 'replaceselections', value: val });
	};

	self.replaceselection = function(val) {
		send({ TYPE: 'replaceselection', value: val });
	};

	self.replacerange = function(val, from, to) {
		send({ TYPE: 'replacerange', value: val, from: from, to: to });
	};

	self.change = function(arr) {
		send({ TYPE: 'change', value: arr });
	};

	self.focus = function() {
		iframe.focus();
		send({ TYPE: 'focus' });
	};

	self.command = function(value) {
		send({ TYPE: 'command', value: value });
	};

	self.exec = function(a, b, c) {
		send({ TYPE: 'exec', a: a, b: b, c: c });
	};

	self.insert = function(value) {
		send({ TYPE: 'insert', value: value });
	};

	self.save = function(callback) {
		send({ TYPE: 'body' }, function(msg) {
			send({ TYPE: 'clear' });
			if (callback) {
				callback(msg.value);
			} else {
				var model = self.get();
				model.body = msg.value;
				self.bind('@modified', model)
			}
		});
	};

	self.send = send;

	self.resize = function() {
		var parent = self.parent(config.parent);
		var w = parent.width();
		var h = parent.height() - config.margin;

		if (config.minheight && h < config.minheight)
			h = config.minheight;

		iframe.css({ width: w, height: h });
	};

	self.marker = function(name, from, to, color) {
		send({ TYPE: 'marker', from: from, to: to, value: name, color: color });
	};

	self.darkmode = function() {
		send({ TYPE: 'darkmode', value: $('body').hclass('ui-dark') });
	};

	var settertimeout;

	self.setter = function() {
		if (init) {
			settertimeout = null;
			var model = self.get();
			model && send({ TYPE: 'init', linenumbers: model.linenumbers, realtime: config.realtime, readonly: config.readonly, mode: model.type || 'clientside', value: model.body, keywords: model.keywords || config.keywords, darkmode: $('body').hclass('ui-dark') });
		} else {
			settertimeout && clearTimeout(settertimeout);
			settertimeout = setTimeout(self.setter, 100);
		}

	};

});