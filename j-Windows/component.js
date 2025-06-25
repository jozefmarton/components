COMPONENT('windows', 'menuicon:ti ti-navicon;reoffsetresize:0;zindex:5', function(self, config, cls) {

	var cls2 = '.' + cls;
	var cache = {};
	var services = [];
	var events = {};
	var drag = {};
	var prevfocused;
	var serviceid;
	var data = [];
	var lastWW = WW;
	var lastWH = WH;
	var resizer;
	var position = [];

	self.make = function() {

		self.aclass(cls);
		self.append('<div class="{0}-resizer hidden"></div>'.format(cls));
		resizer = self.find(cls2 + '-resizer');

		self.event('click', cls2 + '-control', function() {
			var el = $(this);
			var name = el.attrd('name');
			var item = cache[el.closest(cls2 + '-item').attrd('id')];
			switch (name) {
				case 'close':
					item.setcommand('close');
					break;
				case 'minimize':
					item.setcommand('toggleminimize');
					break;
				case 'maximize':
					item.setcommand('togglemaximize');
					break;
				case 'menu':
					item.meta.menu && item.meta.menu.call(item, el);
					break;
				default:
					item.setcommand(name);
					break;
			}
		});

		self.event('mousedown touchstart', cls2 + '-item', function() {

			if (prevfocused) {
				if (prevfocused[0] == this)
					return;
				prevfocused.rclass(cls + '-focused');
			}

			var el = $(this);
			var id = el.attrd('id');
			prevfocused = el.aclass(cls + '-focused');
			var meta = cache[id];
			if (meta && meta.meta.focus)
				meta.meta.focus();

			var index = position.indexOf(meta);
			position.push(position.splice(index, 1)[0]);
			self.reorder();

		});

		self.event('mousedown touchstart', cls2 + '-title,' + cls2 + '-resize', events.down);
		self.on('resize2', self.resize2);
		serviceid = setInterval(events.service, 5000);
	};

	self.finditem = function(id) {
		return cache[id];
	};

	self.send = function(type, body) {
		for (var i = 0; i < data.length; i++)
			data[i].meta.data(type, body, data[i].element);
	};

	self.destroy = function() {
		clearInterval(serviceid);
	};

	self.resize2 = function() {
		setTimeout2(self.ID, self.resize, 200);
	};

	self.recompile = function() {
		setTimeout2(self.ID + 'compile', COMPILE, 50);
	};

	self.resizeforce = function() {

		self.element.find(cls2 + '-maximized').each(function() {
			cache[$(this).attrd('id')].setcommand('maximize');
		});

		if (config.reoffsetresize) {
			var diffWW = lastWW - WW;
			var diffWH = lastWH - WH;

			var keys = Object.keys(cache);
			for (var i = 0; i < keys.length; i++) {
				var win = cache[keys[i]];
				win.setoffset(win.x - diffWW, win.y - diffWH);
			}

			lastWW = WW;
			lastWH = WH;
		}
	};

	self.resize = function() {
		setTimeout2(self.ID + 'resize', self.resizeforce, 300);
	};

	events.service = function() {
		for (var i = 0; i < services.length; i++) {
			var tmp = services[i];
			if (tmp.$service)
				tmp.$service++;
			else
				tmp.$service = 1;
			tmp.meta.service && tmp.meta.service.call(tmp, tmp.$service, tmp.element);
		}
	};

	events.down = function(e) {

		var E = e;

		if (e.type === 'touchstart') {
			drag.touch = true;
			e = e.touches[0];
		} else
			drag.touch = false;

		if (e.target.nodeName === 'I')
			return;

		var el = $(this);
		var parent = el.closest(cls2 + '-item');

		if (parent.hclass(cls + '-maximized'))
			return;

		drag.resize = el.hclass(cls + '-resize');
		drag.is = false;

		E.preventDefault();
		$('body').aclass(cls + '-prevent');
		self.aclass(cls + '-moving');

		var myoffset = self.element.position();
		var pos;

		if (drag.resize) {
			var c = el.attr('class');
			drag.el = el.closest(cls2 + '-item');
			drag.dir = c.match(/-(tl|tr|bl|br)/)[0].substring(1);
			pos = drag.el.position();
			var m = self.element.offset();
			drag.body = drag.el.find(cls2 + '-body');
			drag.plus = m;
			drag.x = pos.left;
			drag.y = pos.top;
			drag.width = drag.el.width();
			drag.title = drag.el.find(cls2 + '-title').height();
			drag.height = drag.body.height() + drag.title + 2;
			resizer.css({ left: drag.x, top: drag.y, width: drag.width, height: drag.height }).rclass('hidden');
		} else {
			drag.el = el.closest(cls2 + '-item');
			pos = drag.el.position();
			drag.x = e.pageX - pos.left;
			drag.y = e.pageY - pos.top;
		}

		$('body').aclass(cls + '-block');
		drag.offX = myoffset.left;
		drag.offY = myoffset.top;
		drag.item = cache[drag.el.attrd('id')];

		if (drag.item.meta.actions) {
			if (drag.resize) {
				if (drag.item.meta.actions.resize == false)
					return;
				drag.resize = true;
			} else {
				if (drag.item.meta.actions.move == false)
					return;
			}
		}

		drag.el.aclass(cls + '-dragged');
		$(W).on('mousemove touchmove', events.move).on('mouseup touchend', events.up);
	};

	events.move = function(e) {

		var evt = e;
		if (drag.touch)
			evt = e.touches[0];

		var obj = {};
		drag.is = true;

		if (drag.resize) {

			var x = evt.pageX - drag.offX - drag.plus.left;
			var y = evt.pageY - drag.offY - drag.plus.top;
			var off = drag.item.meta.offset;
			var w;
			var h;

			switch (drag.dir) {

				case 'tl':
					obj.left = x;
					obj.top = y;
					w = drag.width - (x - drag.x);
					h = drag.height - (y - drag.y);

					if ((off.minwidth && w < off.minwidth) || (off.minheight && h < off.minheight) || (off.maxwidth && w > off.maxwidth) || (off.maxheight && h > off.maxheight))
						break;

					if (drag.resize === true || drag.resize === 'width') {
						obj.width = w;
						resizer.css(obj);
					}

					if (drag.resize === true || drag.resize === 'height') {
						obj.height = h;
						delete obj.width;
						delete obj.top;
						resizer.css(obj);
					}
					break;

				case 'tr':
					w = x - drag.x;
					h = drag.height - (y - drag.y);

					if ((off.minwidth && w < off.minwidth) || (off.minheight && h < off.minheight) || (off.maxwidth && w > off.maxwidth) || (off.maxheight && h > off.maxheight))
						break;

					if (drag.resize === true || drag.resize === 'width') {
						obj.width = w;
						obj.top = y;
						resizer.css(obj);
					}

					if (drag.resize === true || drag.resize === 'height') {
						obj.height = h;
						delete obj.width;
						delete obj.top;
						resizer.css(obj);
					}

					break;

				case 'bl':

					w = drag.width - (x - drag.x);
					h = y - drag.y;

					if ((off.minwidth && w < off.minwidth) || (off.minheight && h < off.minheight) || (off.maxwidth && w > off.maxwidth) || (off.maxheight && h > off.maxheight))
						break;

					if (drag.resize === true || drag.resize === 'width') {
						obj.left = x;
						obj.width = w;
						resizer.css(obj);
						delete obj.width;
					}

					if (drag.resize === true || drag.resize === 'height') {
						obj.height = h;
						resizer.css(obj);
					}

					break;

				case 'br':
					w = x - drag.x;
					h = y - drag.y;

					if ((off.minwidth && w < off.minwidth) || (off.minheight && h < off.minheight) || (off.maxwidth && w > off.maxwidth) || (off.maxheight && h > off.maxheight))
						break;

					if (drag.resize === true || drag.resize === 'width') {
						obj.width = w;
						resizer.css(obj);
						delete obj.width;
					}

					if (drag.resize === true || drag.resize === 'height') {
						obj.height = h;
						resizer.css(obj);
					}

					break;
			}

			drag.item.ert && clearTimeout(drag.item.ert);
			drag.item.ert = setTimeout(drag.item.emitresize, 100);

		} else {
			obj.left = evt.pageX - drag.x - drag.offX;
			obj.top = evt.pageY - drag.y - drag.offY;

			if (obj.top < 0)
				obj.top = 0;

			drag.el.css(obj);
		}

		if (!drag.touch)
			e.preventDefault();
	};

	events.up = function() {

		self.rclass(cls + '-moving');
		drag.el.rclass(cls + '-dragged');
		$('body').rclass(cls + '-block');
		$(W).off('mousemove touchmove', events.move).off('mouseup touchend', events.up);
		resizer.aclass('hidden', 1);

		if (!drag.is)
			return;

		var item = drag.item;
		var meta = item.meta;
		var pos = drag.resize ? resizer.position() : drag.el.position();

		drag.is = false;
		drag.x = meta.offset.x = item.x = pos.left;
		drag.y = meta.offset.y = item.y = pos.top;

		if (drag.resize) {
			item.width = meta.offset.width = resizer.width();
			item.height = meta.offset.height = resizer.height() - drag.title;
			drag.el.css({ left: drag.x, top: drag.y, width: item.width });
			drag.body.css({ height: item.height });
			meta.resize && meta.resize.call(item, item.width, item.height, drag.body, item.x, item.y);
			self.element.SETTER('*/resize');
		}

		meta.move && meta.move.call(item, item.x, item.y, drag.body);
		self.wsave(item);
		self.change(true);
	};

	var wsavecallback = function(item) {
		var key = 'win_' + item.meta.cachekey;
		var obj = {};
		obj.x = item.x;
		obj.y = item.y;
		obj.width = item.width;
		obj.height = item.height;
		obj.ww = WW;
		obj.wh = WH;
		obj.hidden = item.meta.hidden;
		PREF.set(key, obj, '1 month');
	};

	self.wsave = function(obj) {
		if (obj.meta.actions && obj.meta.actions.autosave)
			setTimeout2(self.ID + '_win_' + obj.meta.cachekey, wsavecallback, 500, null, obj);
	};

	self.reorder = function() {
		for (var index = 0; index < position.length; index++)
			position[index].container.css('z-index', config.zindex + index);
	};

	self.wadd = function(item) {

		var hidden = '';
		var ishidden = false;

		if (!item.cachekey)
			item.cachekey = item.id;

		if (item.cachekey)
			item.cachekey += '' + item.offset.width + 'x' + item.offset.height;

		if (item.actions && item.actions.autosave) {
			pos = PREF['win_' + item.cachekey];
			if (pos) {

				var mx = 0;
				var my = 0;

				var keys = Object.keys(cache);
				var plus = 0;

				for (var i = 0; i < keys.length; i++) {
					if (cache[keys[i]].meta.cachekey === item.cachekey)
						plus += 50;
				}

				if (config.reoffsetresize && pos.ww != null && pos.wh != null) {
					mx = pos.ww - WW;
					my = pos.wh - WH;
				}

				item.offset.x = (pos.x - mx) + plus;
				item.offset.y = (pos.y - my) + plus;
				item.offset.width = pos.width;
				item.offset.height = pos.height;

				if (pos.hidden && (item.hidden == null || item.hidden)) {
					ishidden = true;
					item.hidden = true;
				}
			}
		}

		if (!ishidden)
			ishidden = item.hidden;

		hidden = ishidden ? ' hidden' : '';

		var el = $('<div class="{0}-item{2}" data-id="{id}" style="left:{x}px;top:{y}px;width:{width}px"><span class="{0}-resize {0}-resize-tl"></span><span class="{0}-resize {0}-resize-tr"></span><span class="{0}-resize {0}-resize-bl"></span><span class="{0}-resize {0}-resize-br"></span><div class="{0}-title"><i class="ti ti-times {0}-control" data-name="close"></i><i class="ti ti-maximize {0}-control" data-name="maximize"></i><i class="ti ti-underscore {0}-control" data-name="minimize"></i><i class="{1} {0}-control {0}-lastbutton" data-name="menu"></i><span>{{ title }}</span></div><div class="{0}-body" style="height:{height}px"></div></div>'.format(cls, config.menuicon, hidden).args(item.offset).args(item));
		var body = el.find(cls2 + '-body');
		var pos;

		body.append(item.html);

		if (typeof(item.html) === 'string' && item.html.COMPILABLE())
			self.recompile();

		if (item.actions) {
			if (item.actions.resize == false)
				el.aclass(cls + '-noresize');
			if (item.actions.move == false)
				el.aclass(cls + '-nomove');

			var noclose = item.actions.close == false;
			if (item.actions.hide)
				noclose = false;

			if (noclose)
				el.aclass(cls + '-noclose');
			if (item.actions.maximize == false)
				el.aclass(cls + '-nomaximize');
			if (item.actions.minimize == false)
				el.aclass(cls + '-nominimize');
			if (!item.actions.menu)
				el.aclass(cls + '-nomenu');
		}

		var obj = cache[item.id] = {};
		obj.main = self;
		obj.meta = item;
		obj.element = body;
		obj.container = el;
		obj.x = item.offset.x;
		obj.y = item.offset.y;
		obj.width = item.offset.width;
		obj.height = item.offset.height;
		item.element = el;

		if (item.buttons) {
			var builder = [];
			for (var i = 0; i < item.buttons.length; i++) {
				var btn = item.buttons[i];
				var icon = self.icon(btn.icon);
				builder.push('<i class="ti ti-{1} {0}-control" data-name="{2}"></i>'.format(cls, icon, btn.name));
			}
			builder.length && el.find(cls2 + '-lastbutton').before(builder.join(''));
		}

		item.make && item.make.call(cache[item.id], body);

		obj.emitresize = function() {
			obj.ert = null;
			obj.element.SETTER('*/resize');
		};

		obj.setsize = function(w, h) {
			var t = this;
			var obj = {};

			if (w) {
				obj.width = t.width = t.meta.offset.width = w;
				t.element.parent().css('width', w);
			}

			if (h) {
				t.element.css('height', h);
				t.height = t.meta.offset.height = h;
			}

			t.ert && clearTimeout(t.ert);
			t.ert = setTimeout(t.emitresize, 100);
			self.wsave(t);
		};

		obj.setcommand = function(type) {

			var el = obj.element.parent();
			var c;

			switch (type) {

				case 'toggle':
					obj.setcommand(obj.meta.hidden ? 'show' : 'hide');
					break;

				case 'show':
					if (obj.meta.hidden) {
						obj.meta.hidden = false;
						obj.element.parent().rclass('hidden');
						self.wsave(obj);
						self.resize2();
					}
					break;

				case 'close':
				case 'hide':

					if (type === 'hide' && obj.meta.hidden)
						return;

					if (obj.meta.close) {
						obj.meta.close(function() {
							self.wrem(obj.meta, true);
							self.resize2();
						});
					} else {
						self.wrem(obj.meta, true);
						self.resize2();
					}
					break;

				case 'maximize':

					if (obj.meta.maximize) {
						obj.meta.maximize();
					} else {
						c = cls + '-maximized';

						if (!el.hclass(c)) {
							obj.prevwidth = obj.width;
							obj.prevheight = obj.height;
							obj.prevx = obj.x;
							obj.prevy = obj.y;
							el.aclass(c);
							obj.setcommand('resetminimize');
						}

						var ww = self.element.width() || WW;
						var wh = self.element.height() || WH;
						obj.setoffset(0, 0);
						obj.setsize(ww, wh - obj.element.position().top);
					}
					break;

				case 'resetmaximize':
					if (obj.meta.maximize) {
						obj.meta.maximize('reset');
					} else {
						c = cls + '-maximized';
						if (el.hclass(c)) {
							obj.setoffset(obj.prevx, obj.prevy);
							obj.setsize(obj.prevwidth, obj.prevheight);
							el.rclass(c);
						}
					}
					break;

				case 'togglemaximize':
					if (obj.meta.maximize) {
						obj.meta.maximize('toggle');
					} else {
						c = cls + '-maximized';
						obj.setcommand(el.hclass(c) ? 'resetmaximize' : 'maximize');
					}
					break;

				case 'minimize':
					if (obj.meta.minimize) {
						obj.meta.minimize();
					} else {
						c = cls + '-minimized';
						if (!el.hclass(c))
							el.aclass(c);
					}
					break;

				case 'resetminimize':
					if (obj.meta.minimize) {
						obj.meta.minimize('reset');
					} else {
						c = cls + '-minimized';
						el.hclass(c) && el.rclass(c);
					}
					break;

				case 'toggleminimize':
					if (obj.meta.minimize) {
						obj.meta.minimize('toggle');
					} else {
						c = cls + '-minimized';
						obj.setcommand(el.hclass(c) ? 'resetminimize' : 'minimize');
					}
					break;

				case 'resize':
					obj.setsize(obj.width, obj.height);
					break;

				case 'move':
					obj.setoffset(obj.x, obj.y);
					break;

				case 'focus':

					obj.setcommand('resetminimize');
					prevfocused && prevfocused.rclass(cls + '-focused');
					prevfocused = obj.element.parent().aclass(cls + '-focused');

					if (obj.meta.focus)
						obj.meta.focus();

					var index = position.indexOf(obj);
					var item = position.splice(index, 1)[0];
					position.push(item);
					self.reorder();
					break;
				default:
					if (obj.meta.buttons) {
						var btn = obj.meta.buttons.findItem('name', type);
						if (btn && btn.exec)
							btn.exec.call(obj, obj);
					}
					break;
			}
		};

		obj.settitle = function(title) {
			let t = this;
			let eltitle = t.element.parent().find(cls2 + '-title > span');
			let icon = eltitle.find('i').attr('class');
			eltitle.html((icon ? '<i class="{0}"></i>'.format(icon) : '') + title);
		};

		obj.setoffset = function(x, y) {
			var t = this;
			var obj = {};

			if (x != null)
				obj.left = t.x = t.meta.offset.x = x;

			if (y != null)
				obj.top = t.y = t.meta.offset.y = y;

			t.element.parent().css(obj);
			self.wsave(t);
		};

		obj.meta.service && services.push(obj);
		obj.meta.data && data.push(obj);

		self.append(el);
		position.push(obj);
		item.offset.maximized && obj.setcommand('maximize');
		setTimeout(obj => obj.setcommand('focus'), 100, obj);

		return obj;
	};

	self.wrem = function(item, notify) {
		var obj = cache[item.id];
		if (obj) {

			var main = obj.element.closest(cls2 + '-item');

			if (obj.meta.actions.hide) {
				obj.meta.hidden = true;
				main.aclass('hidden');
				self.wsave(obj);
			} else {

				var index = position.indexOf(obj);
				if (index !== -1)
					position.splice(index, 1);

				obj.meta.destroy && obj.meta.destroy.call(obj);
				main.off('*');
				main.find('*').off('*');
				main.remove();
				delete cache[item.id];

				var index = services.indexOf(obj);
				if (index !== -1)
					services.splice(index, 1);

				index = data.indexOf(obj);
				if (index !== -1)
					data.splice(index, 1);

				var arr = self.get();
				arr.splice(arr.findIndex('id', item.id), 1);
				notify && self.update();
			}
		}
	};

	self.setter = function(value) {

		if (!value)
			value = EMPTYARRAY;

		var updated = {};

		for (var i = 0; i < value.length; i++) {
			var item = value[i];
			if (!cache[item.id])
				cache[item.id] = self.wadd(item);
			updated[item.id] = 1;
		}

		// Remove older windows
		var keys = Object.keys(cache);
		for (var i = 0; i < keys.length; i++) {
			var key = keys[i];
			if (!updated[key])
				self.wrem(cache[key].meta);
		}
	};

	self.toggle = function(id) {
		var item = cache[id];
		item && item.setcommand('toggle');
	};

	self.show = function(id) {
		var item = cache[id];
		item && item.setcommand('show');
	};

	self.title = function(id, title) {
		var item = cache[id];
		item && item.settitle(title);
	};

	self.maximize = function(id) {
		var item = cache[id];
		item && item.setcommand('maximize');
	};

	self.minimize = function(id) {
		var item = cache[id];
		item && item.setcommand('minimize');
	};

	self.focus = function(id) {
		var item = cache[id];
		item && item.setcommand('focus');
	};

	self.hide = function(id) {
		var item = cache[id];
		item && item.setcommand('hide');
	};

	self.close = function(id) {
		var item = cache[id];
		item && item.setcommand('close');
	};

});