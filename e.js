const STATUS_LIST = {
	pending: "pending",
	fulfilled: "fulfilled",
	rejected: "rejected",
};

function resolvePromise(x, resolve, reject) {
	if (x instanceof MyPromise) {
		x.then(
			(value) => {
				resolve(value);
			},
			(err) => {
				reject(err);
			}
		);
	} else {
		resolve(x);
	}
}

class MyPromise {
	constructor(callback) {
		this.status = STATUS_LIST.pending;
		this.value = "";
		this.reason = "";
		this.onResolvedCallback = [];
		this.onRejectedCallback = [];
		try {
			callback(
				(values) => {
					this.resolve.call(this, values);
				},
				(values) => {
					this.reject.call(this, values);
				}
			);
		} catch (e) {
			console.log(e);
			this.reject.call(this, e);
		}
	}
	resolve(values) {
		if (this.status === STATUS_LIST.pending) {
			this.status = STATUS_LIST.fulfilled;
			this.value = values;
			this.onResolvedCallback.forEach((fn) => fn());
		}
	}
	reject(values) {
		if (this.status === STATUS_LIST.pending) {
			this.status = STATUS_LIST.rejected;
			this.reason = values;
			this.onRejectedCallback.forEach((fn) => fn());
		}
	}
	then(onFulfilled, onRejected) {
		return new MyPromise((resolve, reject) => {
			if (this.status === STATUS_LIST.fulfilled) {
				let x = onFulfilled(this.value);
				// resolve(x);
				resolvePromise(x, resolve, reject);
			}
			if (this.status === STATUS_LIST.rejected) {
				let x = onRejected(this.reason);
				// reject(x);
				resolvePromise(x, resolve, reject);
			}
			if (this.status === STATUS_LIST.pending) {
				this.onResolvedCallback.push(() => {
					let x = onFulfilled(this.value);
					// resolve(x);
					resolvePromise(x, resolve, reject);
				});
				this.onRejectedCallback.push(() => {
					let x = onRejected(this.reason);
					// reject(x);
					resolvePromise(x, resolve, reject);
				});
			}
		});
	}
	catch(cb) {
		cb(this.value);
	}
	static race(promises) {
		return new MyPromise((resolve, reject) => {
			for (let i = 0; i < promises.length; i++) {
				promises[i].then(resolve, reject);
			}
		});
	}
	static all(promises) {
		let sum = 0;
		let arr = [];
		return new MyPromise((resolve, reject) => {
			for (let i = 0; i < promises.length; i++) {
				promises[i].then(
					(value) => {
						sum++;
						arr[i] = value;
						if (sum === promises.length) {
							resolve(arr);
						}
					},
					(e) => {
						throw Error("错误请求：", e);
					}
				);
			}
		});
	}
}

const p1 = new MyPromise((resolve, reject) => {
	setTimeout(() => {
		resolve(300);
	}, 3000);
});
const p2 = new MyPromise((resolve, reject) => {
	setTimeout(() => {
		resolve(100);
	}, 1000);
});
const p3 = new MyPromise((resolve, reject) => {
	setTimeout(() => {
		reject(200);
	}, 2000);
});

MyPromise.all([p1, p2, p3]).then((res) => {
	console.log(res);
});

// let mypromise = new MyPromise((resolve, reject) => {
// 	setTimeout(() => {
// 		resolve(123);
// 	}, 500);
// });

// mypromise
// 	.then((res) => {
// 		console.log(res); // 123
// 		return new MyPromise((resolve) => {
// 			resolve(444);
// 		});
// 	})
// 	.then((res) => {
// 		console.log("2:", res); // 2: 444
// 	});
