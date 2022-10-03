COMPONENT('detach', function(self, config) {

	self.readonly();

	var children = [];
	var detached = false;

	self.destroy = function() {
		config.remove && self.EXEC(config.remove, children, self.element);
	};

	self.setter = function(value) {
		if (value === true) {
			if (!detached) {
				detached = true;
				children.length = 0;
				for (var i = 0; i < self.dom.children.length; i++)
					children.push(self.dom.children[i]);
				self.EXEC(config.detach, children, self.element);
			}
		} else {
			if (detached) {
				self.EXEC(config.attach, children, self.element);
				detached = false;
				children.length = 0;
			}
		}
	};

});