export function throttle(method: method, delay: delay): method {
  let preTime: number = Date.now();
  return function (this: any, ...rest) {
    const nowTime = Date.now();
    if (nowTime - preTime >= delay) {
      method.apply(this, rest);
      preTime = Date.now();
    }
  };
}

export function throttleOther(method: method, delay: delay): method {
  let timer: time = null;
  return function (this: any, ...rest) {
    if (timer !== null) return;
    timer = setTimeout(() => {
      method.apply(this, rest);
      timer = null;
    }, delay);
  };
}
