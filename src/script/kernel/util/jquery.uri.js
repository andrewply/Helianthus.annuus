// part of it is based on parseUri by Steven Levithan
// http://blog.stevenlevithan.com/archives/parseuri

(function($)
{
	var keys = ['source','scheme','authority','userinfo','user','password','host','subdomain','domain','port','relative','path','directory','file','query','fragment'];
	var regex = /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]+)(?::([^:@]*))?)@)?((?:([^:\/?]+?)\.)?([^:\/?.]+\.[^:\/?]+)(?::(\d*))?)))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/;

	function clean(obj)
	{
		for(var key in obj) {
			if(obj[key] === null) {
				delete obj[key];
			}
			else if(typeof obj[key] === 'object') {
				clean(obj[key]);
			}
		}

		return obj;
	}

	function parse(url)
	{
		var uriSet = {}, i = keys.length, arr = regex.exec(unescape(url));

		while(i--) {
			uriSet[keys[i]] = arr[i] || '';
		}

		return clean($.extend(uriSet, { querySet: $.deparam(uriSet.query), fragmentSet: $.deparam(uriSet.fragment) }));
	}

	$.uri = function(url, param)
	{
		if(typeof url !== 'string') {
			param = url;
			url = location.href;
		}

		if(!param) return url;

		var ret = '', uriSet = clean($.copy(parse(url), param)), paramed;

		if(param.host) {
			ret += param.host;
		}
		else {
			if(param.hostname) {
				ret += param.hostname;
			}
			else if(uriSet.domain) {
				ret += (uriSet.subdomain && uriSet.subdomain + '.') + uriSet.domain;
			}

			if(uriSet.port) ret += ':' + uriSet.port;
		}

		if(ret) {
			if(param.authority) {
				ret += param.authority;
			}
			else if(uriSet.user) {
				ret += uriSet.user + (uriSet.password && ':' + uriSet.password) + '@';
			}

			ret = (uriSet.protocol ? uriSet.protocol + '://' : '//') + ret;
		}

		if(param.relative) {
			ret += param.relative;
		}
		else {
			if(param.pathname) {
				ret += param.pathname;
			}
			else if(uriSet.filename) {
				ret += uriSet.directory + uriSet.filename;
			}

			if(param.query) {
				ret += '?' + param.query;
			}
			else if(paramed = $.param(uriSet.querySet)) {
				ret += '?' + paramed;
			}

			if(param.fragment) {
				ret += '#' + param.fragment;
			}
			else if(paramed = $.param(uriSet.fragmentSet)) {
				ret += '#' + paramed;
			}
		}

		return decodeURI(ret);
	};

	$.uriSet = function(url, param)
	{
		if(!url) url = location.href;
		return parse(param ? $.uri(url, param) : url);
	};

	var attrMap = {
		'#document': 'URL',
		a: 'href',
		base: 'href',
		form: 'action',
		iframe: 'src',
		img: 'src',
		input: 'src',
		link: 'href',
		script: 'src'
	};

	$.fn.uriSet = function()
	{
		return this[0] && $.uriSet(this.attr(attrMap[this[0].nodeName.toLowerCase()]));
	};

	$.search = function(url, param)
	{
		if(typeof url !== 'string') {
			param = url;
			url = location.search;
		}

		return param ? '?' + $.uriSet(url, { querySet: param }).query : url;
	};

	$.hash = function(url, param)
	{
		if(typeof url !== 'string') {
			param = url;
			url = location.hash
		}

		return param ? '#' + $.uriSet(url, { fragmentSet: param }).fragment : url;
	};

	$.state = function(name, val)
	{
		if(val === undefined) {
			return name ? $.uriSet().fragmentSet[name] : $.uriSet().fragmentSet;
		}

		var hash, param = { poweredby: null };
		if(name) param[name] = val;
		hash = $.hash(param);

		if(location.hash || hash !== '#') location.hash = hash === '#' ? '#poweredBy=annuus' : hash;
	};
})(jQuery);