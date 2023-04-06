const asyncAndAwait = function (genf) {
	return new Promise((resolve, reject) => {
		let g = genf();
		function step(nextF) {
			let next;
			try {
				next = nextF();
			} catch (error) {
				return reject(error);
			}
			if (next.done) {
				return resolve(next.value);
			}
			Promise.resolve(next.value).then(
				(value) => {
					step(() => g.next(value));
				},
				(reason) => {
					step(() => g.throw(reason));
				}
			);
		}

		step(() => g.next(undefined));
	});
};
