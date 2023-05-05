if (!W.svgiconsinstance)
	W.svgiconsinstance = { pending: [] };

customElements.define('ui-svgicon', class extends HTMLElement {

	get cls() {
		return 'ui-svgicon';
	}

	constructor() {
		super();
		setTimeout(function(node) {
			var read = ['name', 'selected', 'size'];
			var opt = {};
			for (var m of read)
				opt[m] = node.getAttribute(m);
			node.innerHTML = ('<svg><use class="{0}-a"></use>' + (opt.selected ? '<use class="{0}-b"></use>' : '') + '</svg>').format(node.cls);
			node._svg = node.querySelector('svg');
			node.attributeChangedCallback('name', '', opt.name);
			opt.selected && node.attributeChangedCallback('selected', '', opt.selected);

			if (!opt.size) {
				var config = W.svgiconsinstance.config;
				if (config && config.size)
					opt.size = config.size;
			}

			opt.size && node.attributeChangedCallback('size', '', opt.size);
		}, 1, this);
	}

	static get observedAttributes() {
		return ['name', 'selected', 'size'];
	}

	attributeChangedCallback(attr, oldval, newval) {

		var meta = W.svgiconsinstance;
		var node = this;

		if (!meta.config) {
			if (!meta.pending.includes(node))
				meta.pending.push(node);
			return;
		}

		if (oldval === newval)
			return;

		switch (attr) {
			case 'size':
				node._svg.setAttribute('width', newval);
				break;
			case 'name':
			case 'selected':
				var el = node.querySelector('.' + node.cls + '-' + (attr === 'selected' ? 'b' : 'a'));
				el && el.setAttributeNS('http://www.w3.org/1999/xlink', 'href', meta.config.url + '#' + newval);
				break;
		}
	}

});

COMPONENT('svgicons', function(self, config) {

	self.singleton();
	self.readonly();

	self.make = function() {
		var meta = W.svgiconsinstance;
		var read = ['name', 'selected', 'size'];
		meta.config = config;

		while (meta.pending.length) {

			var el = meta.pending.shift();
			var opt = {};

			for (var m of read)
				opt[m] = el.getAttribute(m);

			opt.name && el.attributeChangedCallback('name', '', opt.name);
			opt.selected && el.attributeChangedCallback('selected', '', opt.selected);

			if (!opt.size && config.size)
				opt.size = config.size;

			opt.size && el.attributeChangedCallback('size', '', opt.size);
		}
	};

	self.configure = function(name, value, init) {
		if (!init) {
			if (name === 'url') {
				var arr = document.querySelectorAll('ui-svgicon');
				for (var el of arr) {
					var opt = {};
					opt.name = el.getAttribute('name');
					opt.selected = el.getAttribute('selected');
					opt.name && el.attributeChangedCallback('name', '', opt.name);
					opt.selected && el.attributeChangedCallback('selected', '', opt.selected);
				}
			}
		}
	};

});