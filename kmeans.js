   ;(function () {
    /**
     * @description 工具函数
     */
    var $ = function (id, parent, all) {
        parent = parent || document;
        return all ? parent.querySelectorAll(id) : parent.querySelector(id);
    };
    
    function distance(a, b) {
        return (a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y);
    }
    
    /**
     * 配置项
     * dataColor 初始化的数据对象颜色
     * dataW 数据对象的宽度
     * dataH 数据对象的高度
     * clusterR 簇类中心的半径大小
     */
    var options = {
        dataColor: '#f1912f',
        dataW: 5,
        dataH: 5,
        clusterR: 10
    };
    
    /**
     * @global
     * clusterColor 聚类颜色用于区分不同的簇
     * dataset 所有数据 [{x: , y: }, {x: , y: }, ...]
     * clusterCenter 记录簇中心的位置 [{x: , y: }, {x: , y: }, ...]
     * cluster 保存每个簇的数据对象 {0: [index], 1: [index], ...}, 数组记录数据的索引，通过dataset[index]获取数据对象
     */
    var clusterColor = [],
        dataset = [],
        clusterCenter = [],
        cluster = {},
    
        dataNum,
        clusterNum,
        thread;
    
    window.addEventListener('load', init, false);
    
    function init () {
        $('#init').addEventListener('click', initCluster, false);
        $('#run').addEventListener('click', showCluster, false);
    }
    
    /**
     * @description 随机生成数据点和簇类中心点
     */
    function initCluster() {
        var canvas = $('#pass');
        
        dataNum = $('#data').value || 20;
        clusterNum = $('#cluster').value || 3;
        thread = $('#thread').value || 1;
    
        // reset
        for (var i = 0; i < clusterNum; i++) {
            cluster[i] = [];
        }
        clusterCenter = [];
        clusterColor = [];
        dataset = [];
    
        drawData(dataNum, canvas, options);
    }
    /**
     * @description 绘制数据点
     */
    function drawData(num, canvas, options) {
        var ctx = canvas.getContext('2d'),
            cw = canvas.width,
            ch = canvas.height,
    
            w = options.dataW,
            h = options.dataH,
            clusterR = options.clusterR;
    
        var x, y,
            r, g, b, color,
            i, j = 0;;
    
        ctx.clearRect(0, 0, cw, ch);
    
        for (i = 0; i < num; i++) {
            if (i < dataNum - clusterNum) {
                x = Math.random() * (cw - w);
                y = Math.random() * (ch - h);
    
                dataset.push({x: x, y: y});
                drawRect(ctx, {x: x, y: y}, {fillColor: options.dataColor, w: w, h: h});
            }
            
            else {
                r = parseInt(Math.random() * 255);
                g = parseInt(Math.random() * 255);
                b = parseInt(Math.random() * 255);
                color ='rgb(' +  r + ', ' + g + ', ' + b + ')';
                clusterColor[j] = color;
    
                x = Math.random() * (cw - 2 * clusterR) + clusterR;
                y = Math.random() * (ch - 2 * clusterR) + clusterR;
    
                dataset.push({x: x, y: y});
                clusterCenter.push({x: x, y: y});
                cluster[j++].push(i);
                drawCircle(ctx, {x: x, y: y}, {clusterR: clusterR, fillColor: color});
            }
        }
    }
    
    function drawRect(ctx, pos, options) {
            ctx.fillStyle = options.fillColor;
            ctx.beginPath();
            ctx.fillRect(pos.x, pos.y, options.w, options.h);
            ctx.closePath();
    }
    function drawCircle(ctx, pos, options) {
        ctx.fillStyle = options.fillColor;
    
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, options.clusterR, 0, 2 * Math.PI);
        ctx.fill();
        ctx.closePath();
    }
    
    function showCluster() {
        var arr, single,
            canvas = $('#now'),
            ctx = canvas.getContext('2d');
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    
        if (kMeans()) {
            for (var i = 0; i < clusterNum; i++) {
                (function (i) {
                    arr = cluster[i];
                    for (var j = 0; j < arr.length; j++) {
                        single = dataset[arr[j]];
                        drawRect(ctx, single, {w: options.dataW, h: options.dataH, fillColor: clusterColor[i]});
                    }
                })(i);
            }
        }
    }
    
    /**
     * @description k-means算法
     */
    function kMeans() {
        var newE = evalute(), 
            oldE,
            index,
            i;
    
        do {
            for (i = 0; i < clusterNum; i++) {
                cluster[i] = [];
            }
            for (i = 0; i < dataNum; i++) {
                index = minCluster(dataset[i], clusterCenter);
                cluster[index].push(i);
            }
            updateCenter();
            oldE = newE;
            newE = evalute();
        }while (newE - oldE >= thread);
    
        return true;
    }
    
    // 标准测度函数
    function evalute() {
        var arr,
            sum = 0,
            single;
        
        for (var i = 0; i < clusterNum; i++) {
            arr = cluster[i];
            for (var j = 0; j < arr.length; j++) {
                single = dataset[arr[j]];
                sum += distance(single, clusterCenter[i]);
            }
        }
        return sum;
    }
    /**
     * @description 返回数据到所有簇类中心的最小距离的簇类索引
     * @return {number} 返回划分到某个簇的索引
     */
    function minCluster(single, center) {
        var d = Infinity, temp,
            index;
    
        for (var i = 0; i < clusterNum; i++) {
            temp = distance(single, center[i]);
            
            if (temp < d) {
                d = temp;
                index = i;
            }
        }
        return index;
    }
    
    function updateCenter() {
        var clusterItem,
            single,
            x, y;
    
        for (var i = 0; i < clusterNum; i++) {
            clusterItem = cluster[i];
            x = 0;
            y = 0;
            for (var j = 0; j < clusterItem.length; j++) {
                single = dataset[clusterItem[j]];
                x += single.x;
                y += single.y;
            }
            clusterCenter[i] = {
                x: x / clusterItem.length, 
                y: y / clusterItem.length
            };
        }
    }
    
    }());
