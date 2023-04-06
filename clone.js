const arrayTag = '[object Array]';
const objectTag = '[object Object]';
const mapTag = '[object Map]';
const setTag = '[object Set]';
const argsTag = '[object Arguments]';

const symbolTag = '[object Symbol]';
const functionTag = '[object Function]';
const regexpTag = '[object RegExp]';
const dateTag = '[object Date]';

const deepTags = [arrayTag, objectTag, mapTag, setTag, argsTag];

const getType = (target) => {
	return Object.prototype.toString.call(target);
};

const isObject = (target) => {
	const type = typeof target;
	return target !== null && (type === 'object' || type === 'function');
};

const getInit = (target) => {
	return new target.constructor();
};

const forEach = (target, callback) => {
	let index = 0;
	let length = target.length;
	while (index < length) {
		callback(target[index], index, target);
		index++;
	}
};

const cloneSymbol = (target) => {
	return Object(Symbol.prototype.valueOf.call(target));
};

const cloneRegExp = (target) => {
	const reFlags = /\w*$/;
	const result = new target.constructor(target, reFlags.exec(target));
	result.lastIndex = target.lastIndex;
	return result;
};

const cloneFunction = (target) => {
	const bodyReg = /(?<={)(.|\n)+(?=})/m;
	const paramReg = /(?<=\().+(?=\)\s+{)/;
	const funStr = target.toString();
	if (target.prototype) {
		const param = paramReg.exec(funStr);
		const body = bodyReg.exec(funStr);
		if (body) {
			if (param) {
				const paramArr = param[0].split(',');
				return new Function(...paramArr, body[0]);
			} else {
				return new Function(body[0]);
			}
		} else {
			return new Function();
		}
	} else {
		return eval(funStr);
	}
};

const cloneOtherType = (target, type) => {
	switch (type) {
		case dateTag:
			return new target.constructor(target);
		case symbolTag:
			return cloneSymbol(target);
		case regexpTag:
			return cloneRegExp(target);
		case functionTag:
			return cloneFunction(target);
		default:
			return null;
	}
};

const clone = (target, map = new WeakMap()) => {
	if (!isObject(target)) {
		return target;
	}
	const type = getType(target);
	let cloneTarget;
	if (deepTags.includes(type)) {
		cloneTarget = getInit(target);
	} else {
		return cloneOtherType(target, type);
	}

	if (map.get(target)) {
		return target;
	}
	map.set(target, cloneTarget);

	if (type === setTag) {
		target.forEach((value) => {
			cloneTarget.add(clone(value, map));
		});
		return cloneTarget;
	}

	if (type === mapTag) {
		target.forEach((value, key) => {
			cloneTarget.set(key, clone(value, map));
		});
		return cloneTarget;
	}

	const keys = type === arrayTag ? undefined : Object.keys(target);
	forEach(keys || target, (value, key) => {
		if (keys) {
			key = value;
		}
		cloneTarget[key] = clone(target[key], map);
	});

	return cloneTarget;
};
