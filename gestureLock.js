(function(){
    window.GestureLock = function(){
        this.chooseType = Number(window.localStorage.getItem('chooseType')) || 3;
        this.height;
        this.width;
        this.mode;
        this.devicePixelRatio = window.devicePixelRatio || 1;

    };

    GestureLock.prototype.init = function() {
        this.mode = 'setPwd';
        this.initDom();
        this.pswObj = window.localStorage.getItem('passwordxx') ? {
            step: 2,
            spassword: JSON.parse(window.localStorage.getItem('passwordxx'))
        } : {};
        this.lastPoint = [];
        this.touchFlag = false;
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.createCircle();
        this.bindEvent();
    }

    GestureLock.prototype.initDom = function(){
        var wrapper = document.createElement('div');

        wrapper.setAttribute('style','position: absolute;top:0;left:0;right:0;bottom:0;');

        //添加canvas
        var canvas = document.createElement('canvas');
        canvas.setAttribute('id','canvas');
        canvas.style.cssText = 'background-color: #f0f0f2;display: inline-block;margin-top: 3em;';
        wrapper.appendChild(canvas);

        //添加title
        var title = document.createElement('h2');
        title.setAttribute('id', 'title');
        title.setAttribute('class', 'title');
        title.innerHTML = '请输入手势密码';
        wrapper.appendChild(title);

        //添加设置单选框
        var setting = document.createElement('div');
        setting.style.cssText = 'font-size: 1.4em; color: #0AA9B5; margin: 1.3em 0 0 -1em';
        var str = '<input type="radio" name="setting" id="setPwd" value="setPwd" checked>&nbsp;设置密码<br>'
                + '<input type="radio" name="setting" id="verifyPwd" value="verifyPwd"">&nbsp;验证密码';
        setting.innerHTML = str;
        wrapper.appendChild(setting);

        var width = this.width || 300;
        var height = this.height || 300;

        document.body.appendChild(wrapper);

        // 高清屏缩放
        canvas.style.width = width + "px";
        canvas.style.height = height + "px";
        canvas.height = height * this.devicePixelRatio;
        canvas.width = width * this.devicePixelRatio;

    }

    // 创建解锁点的坐标，根据canvas的大小来平均分配半径
    GestureLock.prototype.createCircle = function() {
        var n = this.chooseType;
        var count = 0;
        this.r = this.ctx.canvas.width / (2 + 4 * n);// 公式计算
        this.lastPoint = [];
        this.arr = [];
        this.restPoint = [];
        var r = this.r;
        for (var i = 0 ; i < n ; i++) {
            for (var j = 0 ; j < n ; j++) {
                count++;
                var obj = {
                    x: j * 4 * r + 3 * r,
                    y: i * 4 * r + 3 * r,
                    index: count
                };
                this.arr.push(obj);
                this.restPoint.push(obj);
            }
        }
        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
        for (var i = 0 ; i < this.arr.length ; i++) {
            this.drawCle(this.arr[i].x, this.arr[i].y);
        }
    }

    GestureLock.prototype.bindEvent = function() {
        var self = this;

        this.canvas.addEventListener("touchstart", function (e) {
            e.preventDefault();// 某些 android 的 touchmove 不宜触发，所以增加此行代码
             var po = self.getPosition(e);
             console.log(po);
             for (var i = 0 ; i < self.arr.length ; i++) {
                if (Math.abs(po.x - self.arr[i].x) < self.r && Math.abs(po.y - self.arr[i].y) < self.r) {

                    self.touchFlag = true;
                    self.drawPoint(self.arr[i].x,self.arr[i].y);
                    self.lastPoint.push(self.arr[i]);
                    self.restPoint.splice(i,1);
                    break;
                }
             }
         }, false);
         this.canvas.addEventListener("touchmove", function (e) {
            if (self.touchFlag) {
                self.update(self.getPosition(e));
            }
         }, false);
         this.canvas.addEventListener("touchend", function (e) {
             if (self.touchFlag) {
                 self.touchFlag = false;
                 self.storePass(self.lastPoint);
                 setTimeout(function(){
                    self.reset();
                }, 300);
             }
         }, false);

         document.getElementById('setPwd').addEventListener('click', function() {
            self.updatePassword();
            self.mode = 'setPwd';
         }, false);
         document.getElementById('verifyPwd').addEventListener('click', function() {
            self.mode = 'verifyPwd'
            if (!self.pswObj.spassword) {
                document.getElementById('title').innerHTML = '还未输入手势密码，请先设置密码';
            } else{
                document.getElementById('title').innerHTML = '请绘制解锁图案';
            }
         }, false);

    }

    // 初始化解锁密码面板
    GestureLock.prototype.drawCle = function(x, y) {
        this.ctx.strokeStyle = '#305066';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(x, y, this.r, 0, Math.PI * 2, true);
        this.ctx.closePath();
        this.ctx.stroke();
    }

    // 初始化圆心
    GestureLock.prototype.drawPoint = function() {
        for (var i = 0 ; i < this.lastPoint.length ; i++) {
            this.ctx.fillStyle = '#CFE6FF';
            this.ctx.beginPath();
            this.ctx.arc(this.lastPoint[i].x, this.lastPoint[i].y, this.r / 2, 0, Math.PI * 2, true);
            this.ctx.closePath();
            this.ctx.fill();
        }
    }

    // 初始化状态线条
    GestureLock.prototype.drawStatusPoint = function(type) {
        for (var i = 0 ; i < this.lastPoint.length ; i++) {
            this.ctx.strokeStyle = type;
            this.ctx.beginPath();
            this.ctx.arc(this.lastPoint[i].x, this.lastPoint[i].y, this.r, 0, Math.PI * 2, true);
            this.ctx.closePath();
            this.ctx.stroke();
        }
    }

    // 解锁轨迹
    GestureLock.prototype.drawLine = function(po, lastPoint) {
        this.ctx.beginPath();
        this.ctx.lineWidth = 3;
        this.ctx.moveTo(this.lastPoint[0].x, this.lastPoint[0].y);
        console.log(this.lastPoint.length);
        for (var i = 1 ; i < this.lastPoint.length ; i++) {
            this.ctx.lineTo(this.lastPoint[i].x, this.lastPoint[i].y);
        }
        this.ctx.lineTo(po.x, po.y);
        this.ctx.stroke();
        this.ctx.closePath();
    }

    // 获取touch点相对于canvas的坐标
    GestureLock.prototype.getPosition = function(e) {
        var rect = e.currentTarget.getBoundingClientRect();
        var po = {
            x: (e.touches[0].clientX - rect.left)*this.devicePixelRatio,
            y: (e.touches[0].clientY - rect.top)*this.devicePixelRatio
          };
        return po;
    }

    // 核心变换方法，在touchmove时候调用
    GestureLock.prototype.update = function(po) {
        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

        // 每帧先把面板画出来
        for (var i = 0 ; i < this.arr.length ; i++) {
            this.drawCle(this.arr[i].x, this.arr[i].y);
        }

        this.drawPoint(this.lastPoint);// 每帧花轨迹
        this.drawLine(po , this.lastPoint);// 每帧画圆心

        for (var i = 0 ; i < this.restPoint.length ; i++) {
            if (Math.abs(po.x - this.restPoint[i].x) < this.r && Math.abs(po.y - this.restPoint[i].y) < this.r) {
                this.drawPoint(this.restPoint[i].x, this.restPoint[i].y);
                this.lastPoint.push(this.restPoint[i]);
                this.restPoint.splice(i, 1);
                break;
            }
        }

    }

    // 检测密码
    GestureLock.prototype.checkPass = function(psw1, psw2) {
        var p1 = '',
        p2 = '';
        for (var i = 0 ; i < psw1.length ; i++) {
            p1 += psw1[i].index + psw1[i].index;
        }
        for (var i = 0 ; i < psw2.length ; i++) {
            p2 += psw2[i].index + psw2[i].index;
        }
        return p1 === p2;
    }

    // touchend结束之后对密码和状态的处理
    GestureLock.prototype.storePass = function(psw) {
        if (this.mode === 'setPwd') {
            if (this.pswObj.step == 1) {
                if (this.checkPass(this.pswObj.fpassword, psw)) {
                    this.pswObj.step = 2;
                    this.pswObj.spassword = psw;
                    document.getElementById('title').innerHTML = '密码设置成功';
                    this.drawStatusPoint('#2CFF26');
                    window.localStorage.setItem('passwordxx', JSON.stringify(this.pswObj.spassword));
                    window.localStorage.setItem('chooseType', this.chooseType);
                } else {
                    document.getElementById('title').innerHTML = '两次输入不一致，请重新输入手势密码';
                    this.drawStatusPoint('red');
                    delete this.pswObj.step;
                }
            } else {
                this.pswObj.step = 1;
                if (psw.length > 4) {
                    this.pswObj.fpassword = psw;
                    document.getElementById('title').innerHTML = '请再次输入手势密码';
                } else {
                    this.updatePassword();
                    document.getElementById('title').innerHTML = '密码太短，至少需要5个点';
                }
            }
        } else if (this.mode ==='verifyPwd') {
            if (this.pswObj.step == 2) {
                if (this.checkPass(this.pswObj.spassword, psw)) {
                    document.getElementById('title').innerHTML = '密码正确！';
                    this.drawStatusPoint('#2CFF26');
                } else {
                    this.drawStatusPoint('red');
                    document.getElementById('title').innerHTML = '输入的密码不正确';
                }
            }
        }

    }

    GestureLock.prototype.setChooseType = function(type){
        chooseType = type;
        init();
    }

    GestureLock.prototype.updatePassword = function(){
        window.localStorage.removeItem('passwordxx');
        window.localStorage.removeItem('chooseType');
        this.pswObj = {};
        document.getElementById('title').innerHTML = '请输入手势密码';
        this.reset();
    }

    GestureLock.prototype.reset = function() {
        this.createCircle();
    }

})();
