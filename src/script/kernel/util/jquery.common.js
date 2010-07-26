$.each(['all', 'any', 'first'], function(i, name)
{
	$[name] = function()
	{
		var args = [].slice.call(arguments);
		if($.isFunction(args[args.length - 2])) {
			var callback = args.pop();
		}
		var checker = args.pop();
		var ret = { all: true, any: false, first: null }[name];
		var props;

		$.digEach.apply(null, args.concat(function()
		{
			var result = checker.apply(this, arguments);
			if(name === 'all' ? !result : result) {
				props = arguments;
				ret = name === 'first' ? result : !ret;
				return false;
			}
		}));

		if(!$.isGarbage(ret) && callback) {
			name === 'all' ? $.digEach.apply(null, args.concat(callback)) : callback.apply(null, props);
		}

		return ret;
	};
});

$.extend({
	permute: function()
	{
		var args = [].slice.call(arguments);
		var callback = args.pop();
		var ret = [];

		(function recurse(argsIndex, params)
		{
			if(argsIndex !== args.length) {
				$.each(args[argsIndex], function(i, value)
				{
					recurse(argsIndex + 1, params.concat(value));
				});
			}
			else {
				ret.push(callback.apply(null, params));
			}
		})(0, []);

		return ret;
	},

	cookie: function(name, val, topLevel)
	{
		if(!name) {
			var
			match,
			cookieSet = {},
			cookies = document.cookie,
			regex = /\b([^=]+)=([^;]*)/g;

			while(match = regex.exec(cookies)) {
				cookieSet[match[1]] = match[2];
			}

			if(name === null) {
				for(var key in cookieSet) {
					$.cookie(key, null);
				}
			}
			else {
				return cookieSet;
			}
		}
		else if(typeof val === 'undefined') {
			var match = document.cookie.match(new RegExp("\\b" + name + "=([^;]*)"));
      return match && match[1];
		}
		else {
			var cookie = $.format('{0}={1}; path=/', name, val || '');
			var expire = (new Date(val === null ? '1999' : '2999')).toUTCString();

			if(val !== null) {
				document.cookie = $.format('{0}; expires={1}; domain={2}', cookie, expire, topLevel ? $.uriSet().domain : location.hostname);
			}
			else {
				cookie = $.format('{0}; expires={1}', cookie, expire);

				document.cookie = $.format('{0}; domain={1}', cookie, location.hostname);
				document.cookie = cookie;
				document.cookie = $.format('{0}; domain={1}', cookie, $.uriSet().domain);
			}
		}
	},

	// deep extend with array replacing
	copy: function(target)
	{
		var name, src, copy;
		$.each([].slice.call(arguments, 1), function(i, options)
		{
			for(name in options) {
				src = target[name];
				copy = options[name];
				if(typeof copy !== 'undefined') {
					target[name] = copy && typeof copy === 'object' ? $.copy($.isPlainObject(src) ? src : $.isArray(copy) ? [] : {}, copy) : copy;
				}
			}
		});
		return target;
	},

	dig: function(obj)
	{
		if(arguments.length === 1 && $.isArrayLike(obj)) {
			return $.dig.apply(null, obj);
		}

		for(var i=1; i<arguments.length; ++i) {
			if($.isGarbage(obj)) {
				return;
			}
			obj = obj[arguments[i]];
		}
		return obj;
	},

	digEach: function(target)
	{
		if(!target) {
			return null;
		}

		var args = [].slice.call(arguments, 1);
		var callback = args.pop();
		var len = args.length;
		if(len === 0) {
			args[len++] = null;
		}

		(function dig(target, argIndex, ids)
		{
			if(argIndex === len) {
				ids.push(target);
				return callback.apply(target, ids);
			}

			var digIds = args[argIndex++];
			if(digIds !== null) {
				digIds = [].concat(digIds);
			}
			var ret;
			$.each(target, function(id, prop)
			{
				if(digIds === null || $.inArray(id, digIds) !== -1) {
					return (ret = dig(prop, argIndex, ids.concat(id)));
				}
			});
			return ret;
		})(target, 0, []);

		return target;
	},

	isArrayLike: function(target)
	{
		return !!target && ($.isArray(target) || typeof target.callee === 'function' && typeof target.length === 'number' && $.size(target) === 0);
	},

	isNumber: function(target)
	{
		return /^(?:string|number)$/.test(typeof target) && !isNaN(+target);
	},

	isWord: function(target)
	{
		return typeof target === 'string' || $.isNumber(target);
	},

	isGarbage: function(target)
	{
		return target == null || typeof target === 'number' && isNaN(target);
	},

	size: function(target)
	{
		var size = 0;
		for(var name in target) {
			++size;
		}
		return size;
	},

	make: function()
	{
		var args = [].slice.call(arguments);
		var overwrite = typeof args === 'boolean' ? args.shift() : false;
		var obj = args.shift();

		while(args.length > 1) {
			var name = args.shift();
			obj = !(args.length === 1 && overwrite) && obj[name] || (obj[name] = args.length === 1 || overwrite ? args[0] : {});
		}

		return obj;
	},

	range: function()
	{
		var args = [].slice.call(arguments);
		var start = args.length === 1 ? 0 : args.shift();
		var end = args.shift();
		var step = args[0] || 1;
		var ret = [];
		for(var i=start; i<=end; i+=step) {
			ret.push(i);
		}
		return ret;
	},

	typeOf: function(target, type)
	{
		return target === null && 'null'
		|| (type = typeof target) !== 'object' && type
		|| /Array|Function/.test(type = Object.prototype.toString.call(target).replace(/^[^ ]+ |\]$/g, '')) && type.toLowerCase()
		|| 'object';
	}
});

$.fn.extend({
	fixScroll: function(selector)
	{
		return this.mousewheel(function(event, delta)
		{
			var target = (selector ? $(event.target).closest(selector) : this)[0];
			if(delta > 0 ? target.scrollTop === 0 : target.scrollTop >= target.scrollHeight - target.clientHeight) {
				event.preventDefault();
			}
		});
	},

	toFlash: function(url, attrSet, paramSet)
	{
		attrSet = $.extend({ width: 0, height: 0, id: this[0].id || 'jquery-flash-' + $.time() }, attrSet);
		paramSet = $.extend({ allowscriptaccess: 'always' }, paramSet);

		if($.browser.msie) {
			attrSet.classid = 'clsid:D27CDB6E-AE6D-11cf-96B8-444553540000';
			paramSet.movie = url;
		}
		else {
			attrSet.data = url;
			attrSet.type = 'application/x-shockwave-flash';
		}

		var attrs = params = '';

		$.each(attrSet, function(name, val)
		{
			attrs += $.format(' {0}="{1}"', name, val);
		});

		$.each(paramSet, function(name, val)
		{
			params += $.format('<param name="{0}" value="{1}" />', name, val);
		});

		var html = $.format('<object{0}>{1}</object>', attrs, params);

		if($.browser.msie) {
			this[0].outerHTML = html;
			return $('#' + attrSet.id);
		}
		else {
			return $(html).replaceAll(this);
		}
	},

	up: function(selector, th)
	{
		if(!th) th = 1;
		return this.map(function()
		{
			var node = this, count = 0;
			while(node.parentNode && node.parentNode.nodeType === 1) {
				node = node.parentNode;
				if(selector && $(node).is(selector) && ++count === th) return node;
			}
			return selector ? null : node;
		});
	},

	root: function()
	{
		return $(document).own(this) ? $(document) : this.up();
	},

	own: function(target)
	{
		return this[0] === (target[0] || target) || this.is(target) || !!this.has(target).length;
	},

	top: function(){ return this.offset().top; },
	right: function(){ return this.offset().left + this.innerWidth(); },
	bottom: function(){ return this.offset().top + this.innerHeight(); },
	left: function(){ return this.offset().left; }
});
