COMPONENT('paper', 'readonly:0;margin:0;widgets:https://cdn.componentator.com/paper/db.json;autosave:1', function(self, config, cls) {

	// <??? class="widget" data-widget="NAME__CONFIG__VERSION" data-id="ID">

	self.initd = {};
	self.meta = {};
	self.cmd = {};
	self.format = {};
	self.inlinecss = [];

	var D = document;
	var openeditor;
	var selected;
	var nosync = false;
	var oldcss;
	var pendingwidgets = false;
	var settings = {};
	var skip = false;

	var movement = function(key) {

		var sel = W.getSelection();
		var parent = sel.anchorNode.parentNode;

		if (parent === openeditor.parentNode) {

			var owner = parent.parentNode;
			var count = owner.children.length;
			var index = -1;

			if (sel.anchorNode.getAttribute && sel.anchorNode.getAttribute('contenteditable')) {
				openeditor.key = key;
				openeditor.close();
			} else
				index = NODEINDEXOF(parent);

			// 38: up, 40: down
			if ((key === 38 && index === 0) || (key === 40 && (index === count - 1))) {
				openeditor.key = key;
				openeditor.close();
			}

		} else
			openeditor.parentNode = parent;
	};

	var htmlwidget = function(widget) {

		widget.show();

		widget.save = function() {
			return { html: widget.element.html() };
		};

		var edit = function(e) {

			if (config.readonly)
				return;

			if (e) {

				if (e.target.classList.contains(cls + '-icon'))
					return;

				e.preventDefault();
				e.stopPropagation();
			}

			self.cmd.edit(widget.element, { widget: widget, commands: true, multiline: true }, function(response) {
				if (response.text) {
					widget.change('update');
					widget.end(response.key);
				} else
					widget.remove();
			});
		};

		widget.element.on('click', edit);
		widget.on('focus', edit);

		if (widget.config.html)
			widget.element.html(widget.config.html);

		if (widget.newbie) {
			self.cmd.select(widget);
			setTimeout(edit, 10);
		}

	};

	self.removeselection = function() {
		var arr = document.getSelection().getRangeAt(0).cloneContents().querySelectorAll('*');
		for (var el of arr) {

			var element = el.classList.contains('widget') ? $(el) : $(el).closest('.widget');
			if (element.length) {
				var id = element.attrd('id');
				self.find('.widget[data-id="{0}"]'.format(id)).remove();
			}

		}
	};

	self.format.link = function() {

		var sel = self.getSelection().trim();
		if (!sel)
			return;

		var el = openeditor.element;
		var url = '#' + Date.now().toString(36);
		var mtd = el[0];

		for (var i = 0; i < 5; i++) {
			if (mtd.tagName === 'A')
				return;
			mtd = mtd.parentNode;
			if (!mtd)
				break;
		}

		document.execCommand('CreateLink', false, url);

		var tmp = el.find('a[href="' + url + '"]');
		if (!tmp.length)
			return;

		openeditor && openeditor.close();

		var content = tmp.text();
		var link = {};
		link.element = tmp;
		link.href = '';

		if (content.indexOf('@') !== -1)
			link.href = 'mailto:' + content;
		else if ((/\d+/).test(content))
			link.href = 'tel:' + content;
		else if (content.indexOf(' ') === -1 && content.indexOf(',') === -1 && content.indexOf('.') !== -1)
			link.href = (/http(s):\/\//).test(content) ? content : ('https://' + content);

		link.target = link.href.indexOf('.') !== -1 && link.href.indexOf(location.hostname) === -1 ? '_blank' : '';
		link.widget = self;
		config.link && self.EXEC(config.link, link);
	};

	self.format.bold = function() {
		document.execCommand('Bold', false, null);
	};

	self.format.italic = function() {
		document.execCommand('Italic', false, null);
	};

	self.format.underline = function() {
		document.execCommand('Underline', false, null);
	};

	self.format.icon = function() {

		// Font-Awesome icon
		var tag = openeditor.element[0].nodeName.toLowerCase();
		var icon = '<i class="fa fa-flag {0}-icon"></i>&nbsp;'.format(cls);

		switch (tag) {
			case 'span':
				$(openeditor.element).parent().prepend(icon);
				break;
			default:
				document.execCommand('insertHTML', false, icon);
				break;
		}
	};

	self.cmd.edit = function(el, opt, callback) {

		if (config.readonly)
			return;

		if (!(el instanceof jQuery))
			el = $(el);

		if (!opt)
			opt = {};

		// opt.format {Boolean}
		// opt.bold {Boolean}
		// opt.italic {Boolean}
		// opt.underline {Boolean}
		// opt.link {Boolean}
		// opt.multiline {Boolean}
		// opt.callback {Function}
		// opt.html {String}
		// opt.commands {Boolean}
		// opt.widget {Widget}
		// opt.backslashremove {Boolean}
		// opt.param {Object} a custom parameter
		// opt.parent {Element}

		if (opt.format == null)
			opt.format = true;

		if (callback)
			opt.callback = callback;

		if (openeditor) {
			if (openeditor.element[0] == el[0])
				return;
			openeditor.close();
			setTimeout(self.cmd.edit, 100, el, opt, callback);
			return;
		}

		opt.backup = el.html();
		opt.html && el.html(opt.html);
		el.attr('contenteditable', true);

		openeditor = {};
		openeditor.widget = el.closest('.widget')[0].$widget;
		openeditor.element = el;
		openeditor.dom = el[0];
		openeditor.parent = opt.parent ? opt.parent[0] : openeditor.dom;

		var clickoutside = function(e) {
			if (!(e.target === openeditor.parent || openeditor.parent.contains(e.target)))
				openeditor.close();
		};

		var clickme = function() {
			openeditor.timeout && clearTimeout(openeditor.timeout);
			openeditor.timeout = setTimeout(loadformat, 150);
		};

		var keydown = function(e) {

			opt.keydown && opt.keydown(e);

			openeditor.timeout && clearTimeout(openeditor.timeout);
			openeditor.timeout = setTimeout(loadformat, 150);

			if (e.keyCode === 27) {
				e.preventDefault();
				e.stopPropagation();
				openeditor.key = 27;
				openeditor.close();
				return;
			}

			if (opt.backslashremove && e.keyCode === 8 && !el.text().trim()) {
				openeditor.key = 8;
				openeditor.close();
				return;
			}

			if (e.keyCode === 13) {

				if (!opt.multiline || e.shiftKey || e.metaKey) {
					e.preventDefault();
					e.stopPropagation();
					openeditor.key = 13;
					openeditor.close();
				}

				return;
			}

			if (e.keyCode === 9) {

				e.preventDefault();

				if (opt.tabs) {
					document.execCommand('insertHTML', false, '&#009');
					return;
				}

				if (opt.endwithtab) {
					openeditor.key = 9;
					openeditor.close();
					return;
				}

				e.stopPropagation();
				var widget = openeditor.widget;
				openeditor.key = 9;
				openeditor.close();
				var w = widget.element.parent().next().find('> .widget')[0];
				if (w) {
					w = w.$widget;
					self.cmd.select(w);
					setTimeout(w => w.emit('focus'), 100, w);
				}
				return;
			}

			if (opt.commands && e.keyCode === 191) {

				var cmd = {};
				cmd.element = $(this);

				if (!el.text().trim()) {

					var cache = W.papercache || EMPTYOBJECT;

					cmd.widget = opt.widget;
					cmd.widgets = cache.widgets;
					cmd.remove = function() {
						opt.widget.remove();
					};

					cmd.append = function(name) {
						var w = W.papercache.instances[name];
						var id = Date.now().toString(36);
						settings[id] = w.config;
						opt.widget.element.parent().after('<section><div class="widget paper-{0}" data-widget="{0}" data-id="{1}" data-newbie="1"></div></section>'.format(name, id));
						opt.widget.remove();
						self.cmd.refresh();
					};

					config.command && self.EXEC(config.command, cmd);
				}
				e.preventDefault();
				return;
			}

			openeditor.change = true;

			if (!e.metaKey && !e.ctrlKey)
				return;

			if (e.keyCode === 66) {
				// bold
				if (opt.format && (opt.bold == null || opt.bold == true))
					self.format.bold();
				e.preventDefault();
				e.stopPropagation();
				return;
			}

			if (e.keyCode === 76) {
				// link
				if (opt.format && (opt.link == null || opt.link == true))
					self.format.link();
				e.preventDefault();
				e.stopPropagation();
				return;
			}

			if (e.keyCode === 73) {
				// italic
				if (opt.format && (opt.italic == null || opt.italic == true))
					self.format.italic();
				e.preventDefault();
				e.stopPropagation();
				return;
			}

			if (e.keyCode === 80) {
				self.format.icon();
				e.preventDefault();
				e.stopPropagation();
				return;
			}

			if (e.keyCode === 85) {
				// underline
				if (opt.format && (opt.underline == null || opt.underline == true))
					self.format.underline();
				e.preventDefault();
				e.stopPropagation();
				return;
			}

			if (e.keyCode === 32) {
				document.execCommand('insertHTML', false, '&nbsp;');
				e.preventDefault();
				e.stopPropagation();
				return;
			}

		};

		var keyup = function(e) {
			if (e.keyCode === 40 || e.keyCode === 38)
				movement(e.keyCode);
		};

		el.focus();

		if (opt.cursor === 'end') {
			var range = document.createRange();
			range.selectNodeContents(el[0]);
			range.collapse(false);
			var sel = W.getSelection();
			sel.removeAllRanges();
			sel.addRange(range);
		}

		openeditor.close = function() {
			$(W).off('click', clickoutside);
			el.off('click', clickme);
			el.rattr('contenteditable');
			el.off('keydown', keydown);
			el.off('keyup', keyup);
			if (opt.callback) {
				var arg = {};
				arg.text = el.text();
				arg.html = el.html();
				arg.change = openeditor.change;
				arg.element = openeditor.element;
				arg.dom = openeditor.dom;
				arg.backup = opt.backup;
				arg.key = openeditor.key;
				arg.param = opt.param;
				opt.callback(arg);
			}
			openeditor.timeout && clearTimeout(openeditor.timeout);
			openeditor = null;
			config.format && self.EXEC(config.format, null);
		};

		$(W).on('click', clickoutside);
		el.on('keydown', keydown);
		el.on('click', clickme);
		el.on('keyup', keyup);
	};

	self.cmd.rebuildcss = function() {
		var builder = [];
		for (var item of self.inlinecss)
			builder.push(item.css);

		var tmp = builder.join('');
		if (tmp !== oldcss) {
			oldcss = tmp;
			CSS(tmp, self.ID);
		}
	};

	self.cmd.change = function(widget, type, el) {

		if (nosync)
			return;

		if (el && !(el instanceof jQuery))
			el = $(el);

		var data = {};
		var parent = widget.element.parent();

		data.id = widget.element.attrd('id');
		var clone = parent.clone();
		clone.find('.selected').rclass('selected');
		clone.find('[contenteditable]').rattr('contenteditable');
		data.html = clone.html();
		data.type = type;
		data.widget = widget.name;
		data.indexes = [];

		var arr = self.find('.widget');
		for (var item of arr)
			data.indexes.push(item.getAttribute('data-id'));

		var prev = parent.prev();
		if (prev)
			data.prev = prev.find('> .widget').attrd('id');

		if (el) {
			prev = el ? el.prev() : null;
			data.block = el.attrd('id');
			if (prev.length)
				data.blockprev = prev.attrd('id');
		}

		config.change && self.EXEC(config.change, data);

		if (config.autosave) {
			self.save(function(response) {
				skip = true;
				self.set(response);
			});
		}
	};

	self.cmd.cleaner = function() {
		var arr = self.find('.widget');
		for (var el of arr) {
			var w = el.$widget;
			if (w && (!w.dom.parentNode || !w.dom.innerHTML.trim()))
				w.remove();
		}
	};

	self.cmd.refresh = function() {
		var elements = self.find('.widget');
		for (var el of elements) {

			if (el.$widget)
				continue;

			el.$widget = self.cmd.parse(el);

			var is = false;
			var w = el.$widget;

			if (!self.initd[w.name]) {
				self.initd[w.name] = 1;
				is = true;
			}

			if (w.newbie)
				w.sync = false;

			if (w.name === 'html') {
				htmlwidget(w);
			} else {
				if (config.widget) {
					self.EXEC(config.widget, w, is, W.papercache);
				} else {
					var widget = W.papercache.instances[w.name];
					if (widget) {
						widget.html && w.element.append(widget.html);
						try {
							widget.make(w, w.config, w.element);
						} catch (e) {
							console.error(w.name, w.id, e);
						}
					}
				}
			}

			// w.newbie && self.cmd.change(w, 'append');
		}

	};

	self.cmd.widgets = function() {
		var elements = self.find('.widget');
		var arr = [];
		for (var el of elements)
			el.$widget && arr.push(el.$widget);
		return arr;
	};

	self.cmd.parse = function(el) {

		var id = el.getAttribute('data-id');
		var name = el.getAttribute('data-widget');
		var meta = { id: id, name: name, config: settings[id] || {}, element: $(el), paper: self, readonly: config.readonly, events: {} };

		meta.dom = el;
		meta.newbie = el.getAttribute('data-newbie') === '1';
		meta.newbie && el.removeAttribute('data-newbie');
		meta.widgets = {};

		meta.widgets.save = function(el) {
			return self.save(null, $(el));
		};

		meta.widgets.load = function(el, arr) {

			if (!el || !arr || !(arr instanceof Array) || !arr.length)
				return;

			var builder = [];
			for (var item of arr) {
				settings[item.id] = item.config;
				builder.push('<section><div class="widget paper-{0}" data-widget="{0}" data-id="{1}"></div></section>'.format(item.widget, item.id));
			}
			$(el).html('<section class="{0}-first"></section>'.format(cls) + builder.join(''));
			self.cmd.refresh();
		};

		meta.widgets.append = function(el) {

			if (config.readonly)
				return;

			var id = Date.now().toString(36);
			$(el).append('<section><div class="widget paper-html" data-widget="html" data-id="{0}" data-newbie="1"></div></section>'.format(id));
			self.cmd.refresh();
		};

		meta.next = function() {
			$(el).parent().after('<section><div class="widget paper-html" data-widget="html" data-id="{0}" data-newbie="1"></div></section>'.format(Date.now().toString(36)));
		};

		meta.css = function(val) {
			var index = self.inlinecss.findIndex('id', meta.name);
			if (index === -1) {
				val && self.inlinecss.push({ id: meta.name, css: val });
			} else {
				if (val)
					self.inlinecss[index].css = val;
				else
					self.inlinecss.splice(index, 1);
			}
			setTimeout2(self.ID + 'css', self.cmd.rebuildcss, 200);
		};

		meta.edit = function(el, opt, callback) {
			self.cmd.edit(el, opt, callback);
		};

		meta.upload = function(opt, callback) {
			// opt.accept {String}
			// opt.files {FileList} optional
			// opt.multiple {Boolean}
			// opt.width {Number}
			// opt.height {Number}
			config.upload && self.EXEC(config.upload, opt, callback);
		};

		meta.change = function(type, el) {
			if (!meta.removed) {
				if (!type)
					type = 'update';
				self.cmd.change(meta, type, el);
			}
		};

		meta.show = function() {
			meta.element.parent().rclass('invisible');
		};

		meta.end = function(key) {
			if (key === 38) {
				meta.prev();
			} else if (key === 40) {
				meta.next();
			} else {
				var parent = meta.element.parent();
				setTimeout(parent => parent.trigger('click'), 200, parent);
			}
		};

		meta.beg = function() {
			var parent = meta.element.parent().prev();
			parent && parent.length && setTimeout(parent => parent.trigger('click'), 200, parent);
		};

		meta.prev = function() {
			var parent = meta.element.parent();
			var prev = parent.prev();
			if (prev.length) {
				var widget = prev.find('> .widget')[0];
				if (widget) {
					widget = widget.$widget;
					self.cmd.select(widget);
					setTimeout(widget => widget.emit('focus'), 200, widget);
				}
			} else
				setTimeout(parent => parent.trigger('click'), 200, parent);
		};

		meta.next = function() {
			var parent = meta.element.parent();
			var next = parent.next();
			if (next.length) {
				var widget = next.find('> .widget')[0].$widget;
				self.cmd.select(widget);
				setTimeout(widget => widget.emit('focus'), 200, widget);
			} else
				setTimeout(parent => parent.trigger('click'), 200, parent);
		};

		meta.remove = function() {
			meta.removed = true;
			if (meta.sync !== false)
				self.cmd.change(meta, 'remove');
			meta.element.parent().remove();
		};

		meta.makeid = function() {
			return Date.now().toString(36);
		};

		meta.update = function() {
			if (meta.removed)
				return;
			meta.change('update');
		};

		meta.on = function(name, fn) {
			if (meta.events[name])
				meta.events[name].push(fn);
			else
				meta.events[name] = [fn];
		};

		meta.emit = function(name, a, b, c, d) {
			var arr = meta.events[name];
			if (arr) {
				for (var fn of arr)
					fn.call(meta, a, b, c, d);
			}
		};

		return meta;
	};

	self.cmd.select = function(widget) {

		if (selected === widget)
			return;

		if (selected) {
			selected.emit('unselect');
			selected.element.rclass('selected');
			selected = null;
		}

		if (widget) {
			widget.emit('select');
			widget.element.aclass('selected');
			selected = widget;
		}
	};

	self.eat = function(data) {

		if (data.type === 'remove') {
			var tmp = self.find('.widget[data-id="{0}"]'.format(data.id));
			if (tmp.length) {
				nosync = true;
				tmp[0].$widget.remove();
				nosync = false;
			}
			return;
		}

		var el = $('<section>{0}</section>'.format(data.html));
		el.find('.selected').rclass('selected');

		var wel = self.find('.widget[data-id="{0}"]'.format(data.id));
		if (wel.length) {
			wel.parent().replaceWith(el);
			self.cmd.refresh();
			self.cmd.cleaner();
			return;
		}

		if (data.prev) {
			var prev = self.find('.widget[data-id="{0}"]'.format(data.prev));
			if (prev.length) {
				prev.parent().after(el);
				self.cmd.refresh();
				self.cmd.cleaner();
			} else {
				// sync problem
			}
		} else {
			self.append(el);
			self.cmd.refresh();
			self.cmd.cleaner();
		}

	};

	self.removeselected = function() {
		if (!openeditor) {
			var widgets = self.find('.widget.selected');
			for (var el of widgets)
				el.$widget.remove();
		}
	};

	self.resize = function() {
		config.parent && setTimeout2(self.ID, self.resizeforce, 300);
	};

	self.resizeforce = function() {
		if (config.parent) {
			var parent = self.parent(config.parent);
			self.css('min-height', parent.height() - config.margin);
		}
	};

	self.import = function(arr, callback) {

		if (typeof(arr) === 'string')
			arr = [arr];

		var cache = W.papercache;
		var imports = [];

		if (!cache)
			W.papercache = cache = { imported: {}, instances: {}, widgets: {}, init: false };

		arr.wait(function(url, next) {

			if (cache.imported[url]) {
				next();
				return;
			}

			AJAX('GET ' + url, function(response) {

				cache.imported[url] = true;

				if (typeof(response) === 'object') {

					for (var item of response) {
						new Function('exports', item.js)(item);

						if (cache.instances[item.id])
							WARN('Overwriting paper widget:', item.id);

						cache.instances[item.id] = item;

						item.js = undefined;

						if (item.import) {
							for (var m of item.import)
								imports.push(m);
						}

					}

					next();
					return;
				}

				// meta
				// var index = response.indexOf('<scr' + 'ipt total>');

				var index = response.indexOf('<st' + 'yle>');
				var css = index === -1 ? '' : response.substring(index + 7, response.indexOf('</sty' + 'le>', index + 7)).trim();

				index = response.indexOf('<bo' + 'dy>');
				var html = index === -1 ? '' : response.substring(index + 6, response.indexOf('</bo' + 'dy>', index + 6)).trim();

				index = response.indexOf('<scr' + 'ipt>');
				var js = response.substring(index + 8, response.indexOf('</scr' + 'ipt>', index + 8)).trim();

				var widget = {};
				widget.css = css;
				widget.js = js;
				widget.html = html;

				new Function('exports', js)(widget);

				if (cache.instances[widget.id])
					WARN('Overwriting paper widget:', widget.id);

				cache.instances[widget.id] = widget;

				if (widget.import) {
					for (var m of widget.import)
						imports.push(m);
				}

				next();

			});

		}, function() {
			imports.wait(function(item, next) {
				IMPORT(item, next);
			}, function() {
				cache.init = true;
				self.reimport();
				callback && callback();

				if (pendingwidgets) {
					pendingwidgets = false;
					self.refresh();
				}
			}, 3);
		});

	};

	self.reimport = function() {
		var cache = W.papercache;
		if (cache) {
			var css = [];
			var widgets = [];
			for (var key in cache.instances) {
				var w = cache.instances[key];
				w.css && css.push(w.css);
				widgets.push(w);
			}
			cache.widgets = widgets;
			CSS(css.join('\n'), 'paper');
			UPD('papercache');
		}
	};

	self.save = function(callback, el) {
		var body = $(el || self.element);
		var items = [];
		var arr = body.find('> section > .widget');
		for (var child of arr) {
			var child = $(child);
			var name = child.attrd('widget');
			var id = ATTRD(child);
			var w = child[0].$widget;
			var cfg;
			try {
				cfg = w.save ? w.save() : {};
			} catch (e) {
				console.error(e);
			}
			items.push({ id: id, widget: name, config: cfg || {} });
		}
		callback && callback(items);
		return items;
	};

	self.make = function() {

		self.aclass(cls);
		self.rclass('hidden invisible');

		self.event('click', 'section', function(e) {

			var t = this;

			if (config.readonly)
				return;

			if (e.target.tagName === 'A' || $(e.target).closest('a').length)
				return;

			e.stopPropagation();
			e.preventDefault();

			//t.parentNode === self.dom &&
			if (e.target === t) {

				if (openeditor) {
					openeditor.close();
					return;
				}

				$(t).after('<section><div class="widget whtml" data-widget="html" data-id="{0}" data-newbie="1"></div></section>'.format(Date.now().toString(36)));
				self.cmd.refresh();
			}
		});

		self.event('click', '.widget', function() {

			if (!config.readonly)
				self.cmd.select(this.$widget);
		});

		self.event('click', function(e) {

			if (config.readonly)
				return;

			if (e.target.classList.contains(cls + '-icon')) {

				if (openeditor)
					openeditor.close();

				var opt = {};
				opt.element = $(e.target);

				config.icon && self.EXEC(config.icon, opt, function() {
					opt.element.closest('.widget')[0].$widget.change('update');
				});

				return;
			}

			if (e.target === self.dom) {

				if (openeditor) {
					openeditor.close();
					return;
				}

				self.append('<section><div class="widget whtml" data-widget="html" data-id="{0}" data-newbie="1"></div></section>'.format(Date.now().toString(36)));
				self.cmd.refresh();
			}
		});
	};

	var loadformat = function() {

		if (!openeditor)
			return;

		openeditor.timeout = null;

		var node = self.getNode();
		var toolbar = {};
		var style = {};

		toolbar.node = node;
		toolbar.element = openeditor.element;
		toolbar.widget = openeditor.widget;
		toolbar.style = style;

		while (node) {

			if (node === self.dom || node === openeditor.dom)
				break;

			switch (node.tagName) {
				case 'B':
					style.bold = 1;
					break;
				case 'I':
					style.italic = 1;
					break;
				case 'A':
					style.link = 1;
					break;
				case 'SPAN':
					style.mark = 1;
					break;
				case 'CODE':
					style.code = 1;
					break;
				case 'S':
					style.strike = 1;
					break;
				case 'U':
					style.underline = 1;
					break;
			}

			node = node.parentNode;
		}
		config.format && self.EXEC(config.format, toolbar, self);
	};

	self.getNode = function() {
		var node = D.getSelection().anchorNode;
		if (node)
			return (node.nodeType === 3 ? node.parentNode : node);
	};

	self.getSelection = function(node) {
		if (D.selection && D.selection.type === 'Text')
			return D.selection.createRange().htmlText;
		else if (!W.getSelection)
			return;
		var sel = W.getSelection();
		if (!sel.rangeCount)
			return '';
		var container = D.createElement('div');
		for (var i = 0, len = sel.rangeCount; i < len; ++i)
			container.appendChild(sel.getRangeAt(i).cloneContents());
		return node ? container : container.innerHTML;
	};

	self.configure = function(key, value) {
		switch (key) {
			case 'readonly':
				value && openeditor && openeditor.close();
				self.tclass(cls + '-r readonly', !!value);
				self.tclass(cls + '-w', !value);
				var tmp = self.find('.widget');
				for (var w of tmp)
					w.$widget.readonly = false;
				break;
			case 'widgets':
				value && self.import(value.split(',').trim());
				break;
		}
	};

	self.setter = function(arr) {

		if (skip) {
			skip = false;
			return;
		}

		if (!config.widget) {
			if (!W.papercache || !W.papercache.init) {
				pendingwidgets = true;
				return;
			}
		}

		selected = null;
		settings = {};

		var plus = '<section class="{0}-first"></section>'.format(cls);

		if (arr) {
			var builder = [];
			for (var item of arr) {
				settings[item.id] = item.config;
				builder.push('<section><div class="widget paper-{0}" data-widget="{0}" data-id="{1}"></div></section>'.format(item.widget, item.id));
			}
			self.html(plus + builder.join(''));
			self.cmd.refresh();
		} else {
			self.html(plus);
			self.cmd.refresh();
		}

		setTimeout(self.cmd.cleaner, 2000);
	};

});