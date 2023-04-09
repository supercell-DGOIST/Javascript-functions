// 实例状态
const PENDING = 'pending';
const FULFILLED = 'fulfilled';
const REJECTED = 'rejected';

export class _Promise {
  private status: string;
  private value: any;
  private readonly fulfilledQueue: any[];
  private readonly rejectedQueue: any[];

  constructor(context: context) {
    // 缓存状态
    this.status = PENDING;
    // 缓存值
    this.value = undefined;
    // 缓存fulfilled队列
    this.fulfilledQueue = [];
    // 缓存rejected队列
    this.rejectedQueue = [];

    // resolve通知
    const resolve = (value: any): void => {
      const run = (): void => {
        // 非Pending状态不执行
        if (this.status !== PENDING) return;
        // 修改成fulfilled状态
        this.status = FULFILLED;
        // 缓存响应值
        this.value = value;

        // 执行缓存fulfilled队列，并传递响应值
        while (this.fulfilledQueue.length > 0) {
          const callback = this.fulfilledQueue.shift();
          callback(value);
        }
      };
      // 确保异步执行
      setTimeout(run);
    };

    // reject通知
    const reject = (reason: any): void => {
      const run = (): void => {
        // 非Pending状态不执行
        if (this.status !== PENDING) return;
        // 修改成rejected状态
        this.status = REJECTED;
        // 缓存响应值
        this.value = reason;

        // 执行缓存rejected队列，并传递响应值
        while (this.rejectedQueue.length > 0) {
          const callback = this.rejectedQueue.shift();
          callback(reason);
        }

        // 抛出响应错误
        throw new Error(`(in promise) ${reason}`);
      };
      // 确保异步执行
      setTimeout(run);
    };

    context != null && context(resolve, reject);
  }

  // 通过then收集onResolve, onRejectFn
  then(onResolve?: callback, onRejectFn?: callback): _Promise {
    // onResolve非函数时做预设
    if (typeof onResolve !== 'function') {
      onResolve = (value) => value;
    }
    // onRejectFn非函数时做预设
    if (typeof onRejectFn !== 'function') {
      onRejectFn = (reason) => {
        throw new Error(reason instanceof Error ? reason.message : reason);
      };
    }

    // 通过返回新的promise实例达到链式调用的效果
    return new _Promise((resolve, reject) => {
      const fulfilled = (value: any): void => {
        try {
          const x = onResolve != null && onResolve(value);
          x instanceof _Promise
            ? x.then(resolve, reject)
            : resolve != null && resolve(x);
        } catch (error) {
          reject != null && reject(error);
        }
      };

      const rejected = (value: any): void => {
        try {
          const x = onRejectFn != null && onRejectFn(value);
          x instanceof _Promise
            ? x.then(resolve, reject)
            : resolve != null && resolve(x);
        } catch (error) {
          reject != null && reject(error);
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

  catch(onRejectFn: callback): _Promise {
    return this.then(undefined, onRejectFn);
  }

  finally(callback: callback): _Promise {
    return this.then(
      (value) =>
        _Promise.resolve(callback != null && callback()).then(() => value),
      (reason) =>
        _Promise.resolve(callback != null && callback()).then(() => {
          throw reason;
        }),
    );
  }

  static resolve(value: any): _Promise {
    if (value instanceof _Promise) return value;
    return new _Promise((resolve) => resolve != null && resolve(value));
  }

  static reject(reason: any): _Promise {
    return new _Promise((resolve, reject) => reject != null && reject(reason));
  }

  static all(promiseArr: any[]): _Promise {
    const result: any[] = [];
    return new _Promise((resolve, reject) => {
      promiseArr.forEach((p, i) => {
        _Promise.resolve(p).then(
          (value) => {
            result[i] = value;
            if (result.length === promiseArr.length) {
              resolve != null && resolve(result);
            }
          },
          (reason) => {
            reject != null && reject(reason);
          },
        );
      });
    });
  }

  static race(promiseArr: any[]): _Promise {
    return new _Promise((resolve, reject) => {
      promiseArr.forEach((p) => {
        _Promise.resolve(p).then(
          (value) => resolve != null && resolve(value),
          (reason) => reject != null && reject(reason),
        );
      });
    });
  }

  static allSettled(promiseArr: any[]): _Promise {
    const result: any[] = [];
    return new _Promise((resolve) => {
      promiseArr.forEach((p, i) => {
        _Promise.resolve(p).then(
          (value) => {
            result[i] = {
              status: FULFILLED,
              value,
            };
            if (promiseArr.length === result.length) {
              resolve != null && resolve(result);
            }
          },
          (reason) => {
            result[i] = {
              status: REJECTED,
              value: reason,
            };
            if (promiseArr.length === result.length) {
              resolve != null && resolve(result);
            }
          },
        );
      });
    });
  }

  static any(promiseArr: any[]): _Promise {
    let index = 0;
    return new _Promise((resolve, reject) => {
      promiseArr.forEach((p) => {
        _Promise.resolve(p).then(
          (value) => {
            resolve != null && resolve(value);
          },
          () => {
            if (index === promiseArr.length - 1) {
              reject != null &&
                reject(new AggregateError('All promises were rejected'));
            }
            index++;
          },
        );
      });
    });
  }
}
