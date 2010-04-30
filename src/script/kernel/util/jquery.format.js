(function($)
{
	var radixes = { b:2, o:8, d: 10, x:16, X:16 };

	var convertors = {
		's': function(target)
		{
			return target + '';
		}
	};

	$.each(radixes, function(type, radix)
	{
		convertors[type] = function(target)
		{
			return parseInt(target, radix);
		};
	});

	var formatters = function(target, format)
	{
		format.replace(/^(?:\*(\d+))?(?:(.)?([<>=^]))?([ +-])?(#)?(0)?(\d+)?(,)?(?:.(\d+))?([bcdeEfgGFosxX%])?$/, function($0, repeat, fill, align, sign, _sharp, _0, width, _comma, precision, type)
		{
			var undefined;
			var addSignAtLast = 0;

			if(!type) {
				type = !$.isNumber(target) ? 's' : 'g';
			}

			if(type !== 's') {
				if(sign) {
					if(sign === '-') {
						sign = null;
					}
					else if(target < 0) {
						if(sign === ' ') {
							sign = '-';
						}
						else if(sign === '+') {
							target = -target;
						}
					}
				}

				if(/[bcdoxX]/.test(type)) {
					target = (target * 1).toFixed(0);

					if(type in radixes) {
						target = (target * 1).toString(radixes[type]);
					}
					else if(type === 'c') {
						target = String.fromCharCode(target);
					}
				}
				else {
					if(/e/i.test(type)) {
						target = target.toExponential(precision || undefined);
					}
					else {
						if(type === '%') {
							target = target * 100;
						}
						target = target[/g/i.test(type) ? 'toPrecision' : 'toFixed'](precision || undefined);
					}
				}

				if(/[A-Z]/.test(type)) {
					target = target.toUpperCase();
				}

				if(_comma) {
					target = target.split('.');
					target = target[0].replace(/\d{3}(?!$)/g, '$&,') + target[1];
				}

				if(sign) {
					if(_0 || align === '=') {
						if(_0) {
							fill = '0';
						}
						align = '>';
						addSignAtLast = 1;
					}
					else {
						target = sign + target;
					}
				}
			}

			if(repeat) {
				var temp = target;
				for(var i=1; i<repeat; ++i) {
					target += temp;
				}
			}

			if(width && align) {
				var padding = (type === 's' ? Math.max(width, precision) : width) - target.length - addSignAtLast;
				fill = fill || ' ';

				while(padding-- > 0) {
					if(align === '<' || align === '^' && padding % 2) {
						target += fill;
					}
					else {
						target = fill + target;
					}
				}
			}

			if(addSignAtLast) {
				target = sign + target;
			}
		});

		return target;
	};

	$.format = function(target)
	{
		if(arguments.length === 1) return target;

		var args = $.slice(arguments, 1);

		return target.replace(/{(\d+)((?:[^{}]|(?:{\d[^{}]*}))*)}/g, function(field, index, mods)
		{
			var count = 0;
			do {
				var temp = mods;
				mods = $.format.apply(null, [mods].concat(args));

				if(++count === 10) {
					$.debug(target, mods);
					$.error('jQuery.format: too many recursions!');
				}
			}
			while(mods !== temp);

			return mods.replace(/((?:[[.][^[.|!:]+)*)(?:\|([^:!]+))?(?:!([^:]))?(?::(.+))?/, function($0, props, alt, convert, format)
			{
				var replacement = args[index];

				if(props) {
					$.each(props.replace(/(?:^[.[]|[\]\) ])/g, '').split(/[.[]/), function(i, prop)
					{
						prop = prop.split('(');
						if(prop[1]) {
							replacement = replacement[prop[0]].apply(replacement, prop[1].split(','));
						}
						else {
							replacement = replacement[prop[0]];
						}
					});
				}
				if(alt && !replacement) {
					replacement = alt;
				}
				if(convert && convertors[convert]) {
					replacement = convertors[convert](replacement);
				}
				if(format) {
					replacement = formatters(replacement, format);
				}

				if(!$.isWord(replacement)) {
					$.debug(target, $0, replacement);
					$.error('jQuery.format: replacement is not a string');
				}

				return replacement;
			});
		});
	};
})(jQuery);
