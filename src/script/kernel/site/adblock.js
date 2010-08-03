document.addEventListener && (function()
{
	var keywords = /bmediaasia|pixel-?hk|imrworldwide|googlesyndication|_getTracker|(?:Page|Inline|Google|\b)[Aa]ds?\b/;

	(window.opera || document).addEventListener(window.opera ? 'BeforeScript' : 'beforeload', function(event)
	{
		if(keywords.test(event.url || event.element.src || event.element.text)) {
			event.preventDefault();
		}
	}, true);
})();
