function debounce(method, delay) {
	let timer = null;
	return function () {
		let context = this;
		let args = arguments;
		if (timer !== null) {
			clearTimeout(timer);
			timer = null;
		}
		timer = setTimeout(function () {
			method.apply(context, args);
		}, delay);
	};
}
