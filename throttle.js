function throttle(method, delay) {
	let preTime = Date.now();
	return function () {
		let context = this;
		let args = arguments;
		let nowTime = Date.now();
		if (nowTime - preTime >= delay) {
			method.apply(context, args);
			preTime = Date.now();
		}
	};
}

function throttleOther(method, delay) {
	let timer = null;
	return function () {
		if (timer !== null) return;
		let context = this;
		let args = arguments;
		timer = setTimeout(() => {
			method.apply(context, args);
			timer = null;
		}, delay);
	};
}
