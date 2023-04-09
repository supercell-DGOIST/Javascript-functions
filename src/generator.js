function gen$(_context) {
  while (true) {
    switch ((_context.prev = _context.next)) {
      case 0:
        _context.next = 2;
        return 'result1';

      case 2:
        _context.next = 4;
        return 'result2';

      case 4:
        _context.next = 6;
        return 'result3';

      case 6:
      case 'end':
        return _context.stop();
    }
  }
}

let context = {
  next: 0,
  prev: 0,
  done: false,
  stop() {
    this.done = true;
  },
};

let gen = function () {
  return {
    next() {
      value = context.done ? undefined : gen$(context);
      done = context.done;
      return {
        value,
        done,
      };
    },
  };
};
