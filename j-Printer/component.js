COMPONENT('printer', 'delay:500;delayprint:500;delayclose:1000', function(self, config, cls) {

	self.nocompile();
	self.readonly();
	self.singleton();

	self.make = function() {
		self.aclass(cls);
	};

	self.print = function(title, html) {

		if (html == null) {
			html = title;
			title = '';
		}

		var iframe = $('<ifra' + 'me src="about:blank" frameborder="0" scrolling="no"></ifr' + 'ame>')[0];
		self.dom.appendChild(iframe);

		var win = iframe.contentWindow;

		if (html.indexOf('<body>') === -1)
			html = '<html><head><title>{0}</title><meta charset="utf-8" /></head><body style="font-family:Arial;font-size:14px;margin:0;padding:0;color:#000">{1}</body></html>'.format(title, html);

		setTimeout(function() {

			var doc = win.document;
			doc.open();
			doc.write(html);
			doc.close();

			setTimeout(() => win.print(), config.delayprint);
			setTimeout(() => self.dom.removeChild(iframe), config.delayclose);

		}, config.delay);

	};

});