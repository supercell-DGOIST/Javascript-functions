type callbackFn = (params?: any) => any;
type callback = callbackFn | undefined;

type contextCallback = (resolve?: callback, reject?: callback) => any;
type context = contextCallback | undefined;
