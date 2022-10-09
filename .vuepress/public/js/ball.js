
function setColor() {
    let arr = ['#'];
    let color = ['A','B','C','D','E','F'];
    for(var i = 0; i < 6; i++) {
        let Rand = Math.random();
        let num = Math.round(Rand * 15); //四舍五入
        if(num >= 10) {
            num = color[num-10];
        }
        arr.push(num)
    }
    return arr.join('');
}

function getRandom(min, max) {
    let range = max - min;
    let rand = Math.random();
    let num = min + Math.round(rand * range); 
    return num;
}

function setStyle(obj) {
    console.log(obj)
    let styleObj = {
        'pointer-events':'none',
        'position': 'fixed', 
        'top': 0,
        'left': 0,
        'display': 'block',
        'box-sizing': 'border-box',
        'z-index': 9999
    };
    let str = '';
    Object.keys(styleObj).forEach(item => {
        str += item + ':' + styleObj[item] + ';';
    })
    if(!obj) return str; 
    if(typeof obj == 'string') {
        return str + obj;
    }else if(typeof obj == 'object') {
        Object.keys(obj).forEach(item => {
            str += item + ':' + obj[item] + ';';
        })
        return str;
    }
}

function initCanvas(obj) {
    obj = obj || {};
    this.canvas = {
        ballArr: []
    };
    if(obj.dom) {
        this.canvas.dom = document.querySelector(obj.dom);
    }else {
        this.canvas.dom = document.createElement('canvas');
        this.canvas.dom.setAttribute('id', 'myCanvas');
        document.body.appendChild(this.canvas.dom);
    }
    this.canvas.dom.style.cssText = setStyle(obj.style);
    this.canvas.dom.width = obj.width || document.documentElement.clientWidth;
    this.canvas.dom.height = obj.height || document.documentElement.clientHeight;
    this.canvas.ctx = this.canvas.dom.getContext('2d');
    return this
}

initCanvas.prototype.drawBall = function(obj) {
    obj = obj || {};
    let boll = {};
   
    boll.color = obj.color || setColor();
    boll.radius = obj.radius || 10;
    boll.x = obj.x || parseInt(getRandom(boll.radius, this.canvas.dom.width - boll.radius));
    boll.y = obj.y || parseInt(getRandom(boll.radius, this.canvas.dom.height - boll.radius));
    // 方向x
    boll.dx = obj.dx || parseInt(Math.random() * 10) - 5;
    // 方向y
    boll.dy = obj.dy || parseInt(Math.random() * 10) - 5;

    boll.alpha = obj.alpha || Math.random().toFixed(2);
    this.canvas.ballArr.push(boll);
    this.render(boll);
}

initCanvas.prototype.clearRect = function() {
    this.canvas.ctx.clearRect(0, 0, this.canvas.dom.width, this.canvas.dom.height);
    this.canvas.bollAnimation && cancelAnimationFrame(this.canvas.bollAnimation);
}

initCanvas.prototype.render = function(boll) {
    this.canvas.ctx.beginPath();
    this.canvas.ctx.arc(boll.x,boll.y,boll.radius,0,Math.PI * 2);
    this.canvas.ctx.fillStyle = boll.color;
    this.canvas.ctx.globalAlpha = boll.alpha;
    this.canvas.ctx.fill();
    this.canvas.ctx.closePath();
}

initCanvas.prototype.moveBoll = function(index) {
    this.canvas.ballArr[index].x += this.canvas.ballArr[index].dx;
    this.canvas.ballArr[index].y += this.canvas.ballArr[index].dy;
    if(this.canvas.ballArr[index].x<=this.canvas.ballArr[index].radius || this.canvas.ballArr[index].x>=this.canvas.dom.width-this.canvas.ballArr[index].radius) {
        this.canvas.ballArr[index].dx = -this.canvas.ballArr[index].dx;
    }
    if(this.canvas.ballArr[index].y<=this.canvas.ballArr[index].radius || this.canvas.ballArr[index].y>=this.canvas.dom.height-this.canvas.ballArr[index].radius) {
        this.canvas.ballArr[index].dy = -this.canvas.ballArr[index].dy;
    }
}

initCanvas.prototype.updateBoll = function() {
    this.clearRect();
    for(var i=0; i<this.canvas.ballArr.length; i++) {
        this.moveBoll(i);
        this.render(this.canvas.ballArr[i]);
    }
    this.canvas.bollAnimation = requestAnimationFrame(this.updateBoll.bind(this))
}

initCanvas.prototype.initBoll = function(obj) {
    obj = obj || {};
    obj.number = obj.number || 20;
    for(var i = 0; i < obj.number; i++) {
        this.drawBall(obj);
    }
    let _this = this;
    this.updateBoll();
    // setInterval(() => {
    //     for(var i=0; i<this.canvas.ballArr.length; i++) {
    //         _this.updateBoll(i);
    //     }
    // }, 20);
}

export function startCanvas(obj) {
    let canvas = new initCanvas(obj);
    canvas.initBoll(obj);
    return canvas;
}

