const PENDING = 'pending';
const FULFILLED = 'fulfilled';
const REJECTED = 'rejected';

class _Promise {
	constructor(context) {
		this.status = PENDING;
		this.value = undefined;
		this.resolveQueue = [];
		this.rejectQueue = [];

		let resolve = (value) => {
			const run = () => {
				if (this.status !== PENDING) return;
				this.status = FULFILLED;
				this.value = value;

				while (this.resolveQueue.length) {
					const callback = this.resolveQueue.shift();
					callback(value);
				}
			};
			setTimeout(run);
		};

		let reject = (reason) => {
			const run = () => {
				if (this.status !== PENDING) return;
				this.status = REJECTED;
				this.value = reason;

				while (this.rejectQueue.length) {
					const callback = this.rejectQueue.shift();
					callback(reason);
				}
			};
			setTimeout(run);
		};

		context(resolve, reject);
	}

	then(onResolve, onRejectFn) {
		typeof onResolve !== 'function' ? (onResolve = (value) => value) : null;
		typeof onRejectFn !== 'function'
			? (onRejectFn = (reason) => {
					throw new Error(reason instanceof Error ? reason.message : reason);
			  })
			: null;

		return new _Promise((resolve, reject) => {
			const fulfilled = (value) => {
				try {
					let x = onResolve(value);
					x instanceof _Promise ? x.then(resolve, reject) : resolve(x);
				} catch (error) {
					reject(error);
				}
			};

			const rejected = (value) => {
				try {
					let x = onRejectFn(value);
					x instanceof _Promise ? x.then(resolve, reject) : resolve(x);
				} catch (error) {
					reject(error);
				}
			};

			switch (this.status) {
				case PENDING:
					this.resolveQueue.push(fulfilled);
					this.rejectQueue.push(rejected);
					break;
				case FULFILLED:
					fulfilled(this.value);
					break;
				case REJECTED:
					rejected(this.value);
					break;
			}
		});
	}

	catch(onRejectFn) {
		return this.then(undefined, onRejectFn);
	}

	finally(callback) {
		return this.then(
			(value) => _Promise.resolve(callback()).then(() => value),
			(reason) =>
				_Promise.resolve(callback()).then(() => {
					throw reason;
				})
		);
	}

	static resolve(value) {
		if (value instanceof _Promise) return value;
		return new _Promise((resolve) => resolve(value));
	}

	static reject(reason) {
		return new _Promise((resolve, reject) => reject(reason));
	}

	static all(promiseArr) {
		let index = 0;
		let result = [];
		return new _Promise((resolve, reject) => {
			promiseArr.forEach((p, i) => {
				_Promise.resolve(p).then(
					(value) => {
						result[i] = value;
						if (index === promiseArr.length - 1) {
							resolve(result);
						}
						index++;
					},
					(reason) => {
						reject(reason);
					}
				);
			});
		});
	}

	static race(promiseArr) {
		return new _Promise((resolve, reject) => {
			promiseArr.forEach((p) => {
				_Promise.resolve(p).then(
					(value) => resolve(value),
					(reason) => reject(reason)
				);
			});
		});
	}

	static allSettled(promiseArr) {
		let index = 0;
		let result = [];
		return new Promise((resolve) => {
			promiseArr.forEach((p, i) => {
				_Promise.resolve(p).then(
					(value) => {
						result[i] = {
							status: FULFILLED,
							value,
						};
						if (promiseArr.length - 1 === index) {
							resolve(result);
						}
						index++;
					},
					(reason) => {
						result[i] = {
							status: REJECTED,
							value: reason,
						};
						if (promiseArr.length - 1 === index) {
							resolve(result);
						}
						index++;
					}
				);
			});
		});
	}

	static any(promiseArr) {
		let index = 0;
		return new Promise((resolve, reject) => {
			promiseArr.forEach((p) => {
				_Promise.resolve(p).then(
					(value) => {
						resolve(value);
					},
					() => {
						if (index === promiseArr.length - 1) {
							reject(new AggregateError('All promises were rejected'));
						}
						index++;
					}
				);
			});
		});
	}
}
