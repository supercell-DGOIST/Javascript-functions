// 实例状态
const PENDING = 'pending';
const FULFILLED = 'fulfilled';
const REJECTED = 'rejected';

class _Promise {
	constructor(context) {
		// 缓存状态
		this.status = PENDING;
		// 缓存值
		this.value = undefined;
		// 缓存fulfilled队列
		this.fulfilledQueue = [];
		// 缓存rejected队列
		this.rejectedQueue = [];

		// resolve通知
		let resolve = (value) => {
			const run = () => {
				// 非Pending状态不执行
				if (this.status !== PENDING) return;
				// 修改成fulfilled状态
				this.status = FULFILLED;
				// 缓存响应值
				this.value = value;

				// 执行缓存fulfilled队列，并传递响应值
				while (this.fulfilledQueue.length) {
					const callback = this.fulfilledQueue.shift();
					callback(value);
				}
			};
			// 确保异步执行
			setTimeout(run);
		};

		// reject通知
		let reject = (reason) => {
			const run = () => {
				// 非Pending状态不执行
				if (this.status !== PENDING) return;
				// 修改成rejected状态
				this.status = REJECTED;
				// 缓存响应值
				this.value = reason;

				// 执行缓存rejected队列，并传递响应值
				while (this.rejectedQueue.length) {
					const callback = this.rejectedQueue.shift();
					callback(reason);
				}

				// 抛出响应错误
				throw new Error(`(in promise) ${reason}`);
			};
			// 确保异步执行
			setTimeout(run);
		};

		context(resolve, reject);
	}

	// 通过then收集onResolve, onRejectFn
	then(onResolve, onRejectFn) {
		// onResolve非函数时做预设
		typeof onResolve !== 'function' ? (onResolve = (value) => value) : null;
		// onRejectFn非函数时做预设
		typeof onRejectFn !== 'function'
			? (onRejectFn = (reason) => {
					throw new Error(reason instanceof Error ? reason.message : reason);
			  })
			: null;

		// 通过返回新的promise实例达到链式调用的效果
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
					this.fulfilledQueue.push(fulfilled);
					this.rejectedQueue.push(rejected);
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
		let result = [];
		return new _Promise((resolve, reject) => {
			promiseArr.forEach((p, i) => {
				_Promise.resolve(p).then(
					(value) => {
						result[i] = value;
						if (result.length === promiseArr.length) {
							resolve(result);
						}
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
		let result = [];
		return new Promise((resolve) => {
			promiseArr.forEach((p, i) => {
				_Promise.resolve(p).then(
					(value) => {
						result[i] = {
							status: FULFILLED,
							value,
						};
						if (promiseArr.length === result.length) {
							resolve(result);
						}
					},
					(reason) => {
						result[i] = {
							status: REJECTED,
							value: reason,
						};
						if (promiseArr.length === result.length) {
							resolve(result);
						}
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
