const STATUS_LIST = {
	pending: "pending",
	fulfilled: "fulfilled",
	rejected: "rejected",
};

class MyPromise {
	constructor(callback) {
		// 初始化状态
		this.status = STATUS_LIST.pending;
		// 保存成功的数据
		this.value = "";
		// 保存失败的原因
		this.reason = "";
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
			this.reject.call(this, values);
		}
	}
	resolve(values) {
		if (this.status === STATUS_LIST.pending) {
			this.status = STATUS_LIST.fulfilled;
			this.value = values;
		}
	}
	reject(values) {
		if (this.status === STATUS_LIST.pending) {
			this.status = STATUS_LIST.rejected;
			this.reason = values;
		}
	}
	then(onFulfilled, onRejected) {
		// 成功状态后调用
		if (this.status === STATUS_LIST.fulfilled) {
			onFulfilled(this.value);
		}
		// 失败状态后调用
		if (this.status === STATUS_LIST.rejected) {
			onRejected(this.reason);
		}
	}
}
let mypromise = new MyPromise((resolve, reject) => {
	setTimeout(() => {
		resolve(123);
	});
});
mypromise.then((res) => {
	console.log(222, res);
});

Promise.resolve(
	new Promise((resolve, reject) => {
		setTimeout(() => {
			resolve(500);
		}, 500);
	})
).then((data) => {
	console.log(data, "success");
});
