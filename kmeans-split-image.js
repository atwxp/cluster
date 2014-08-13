    ;(function () {
    
    /**
     * @description 工具函数
     */
    var $ = function (id, parent, all) {
        parent = parent || document;
        return all ? parent.querySelectorAll(id) : parent.querySelector(id);
    };
    
    function copy(obj) {
        var o = {};
    
        for (var key in obj) {
            if (obj.hasOwnProperty(key)) {
                o[key] = obj[key];
            }
        }
        return o;
    }
    
    var options = {
        canvas: '#old',
        newCanvas: '#new',
        src: 'mini.jpg',
        k: 40
    };
    
    /**
     * @global
     */
    var dataset = [],
        center = [],
        centerSum = [];
    
    function readPixel() {
        var x, y, r, g, b, a;
    
        for (var i = 0; i < imgData.width; i++) {
            for (var j = 0; j < imgData.height; j++) {
                x = i;
                y = j;
                r = pixels[(j * imgData.width + i) * 4];
                g = pixels[(j * imgData.width + i) * 4 + 1];
                b = pixels[(j * imgData.width + i) * 4 + 2];
                a = pixels[(j * imgData.width + i) * 4 + 3];
                
                dataset.push({x: x, y: y, r: r, g: g, b: b, a: a});
            }
        }
    
        for (var i = 0; i < options.k; i++) {
            x = Math.floor(Math.random() * imgData.width);
            y = Math.floor(Math.random() * imgData.height);
            center[i] = copy(dataset[x * imgData.height + y]);
            console.log('x: ' + center[i].x + ', y: ' + center[i].y);
        }
    }
    
    function writePixel() {
        var newCanvas = $(options.newCanvas),
            newCtx = newCanvas.getContext('2d'),
            pos;
        
        // newCanvas.width = imgData.width;
        // newCanvas.height = imgData.height;
    
        for (var i = 0, len = dataset.length; i < len; i++) {
            item = dataset[i];
            index = item.group;
            
            pos = ((i % imgData.height) * imgData.width 
                    + Math.floor(i / imgData.width)) * 4;
          
            // pixels[pos] = center[index].r;
            // pixels[pos + 1] = center[index].g;
            // pixels[pos + 2] = center[index].b;
            // pixels[pos + 3] = center[index].a;

            pixels[pos] = 255 - center[index].r;
            pixels[pos + 1] = 255 - center[index].g;
            pixels[pos + 2] = 255 - center[index].b;
            pixels[pos + 3] = center[index].a;
        }
        newCtx.putImageData(imgData, 0, 0);
    }
    
    function loadImage() {
        var canvas = $(options.canvas),
            ctx = canvas.getContext('2d');
    
        var img = new Image();
        img.src = options.src;
    
        img.onload = function () {
            // canvas.width = img.width;
            // canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
    
            imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            pixels = imgData.data;
            
            readPixel();
            kmeans();
            writePixel();
        };
    }
    
    function kmeans() {
        var sum = 0,
            j = 0;
    
        while (sum !== options.k) {
            j++;
            setCluster();
            sum = updateCenter();
        }
        console.log(j + '次迭代');
    }
    
    function setCluster() {
        var item, 
            index,
            temp, d;
    
        for (var j = 0; j < center.length; j++) {
            centerSum[j] = {
                x: 0,
                y: 0,
                r: 0,
                g: 0,
                b: 0,
                a: 0,
                total: 0
            };
        }
    
        for (var i = 0, len = dataset.length; i < len; i++) {
            index = 0;
            item = dataset[i];
            temp = distance(item, center[0]);
            
            for (var j = 1; j < center.length; j++) {
                d = distance(item, center[j]);
                if (temp > d) {
                    index = j;
                    temp  = d;
                }
            }
    
            item.group = index;
            centerSum[index]['x'] += item.x;
            centerSum[index]['y'] += item.y;
            centerSum[index]['r'] += item.r;
            centerSum[index]['g'] += item.g;
            centerSum[index]['b'] += item.b;
            centerSum[index]['a'] += item.a;
            centerSum[index]['total'] +=  1;
        }
    }
    function updateCenter() {
        var sum = 0,
            x, y, r, g, b, a;
    
        for (var i = 0; i < center.length; i++) {
            x = Math.floor(centerSum[i].x / centerSum[i]['total']);
            y = Math.floor(centerSum[i].y / centerSum[i]['total']);
            r = Math.floor(centerSum[i].r / centerSum[i]['total']);
            g = Math.floor(centerSum[i].g / centerSum[i]['total']);
            b = Math.floor(centerSum[i].b / centerSum[i]['total']);
            a = Math.floor(centerSum[i].a / centerSum[i]['total']);
    
            if (center[i].x === x
                && center[i].y === y
                && center[i].r === r
                && center[i].g === g
                && center[i].b === b
                && center[i].a === a) {
                sum++;
            }
            else {
                center[i].x = x;
                center[i].y = y;
                center[i].r = r;
                center[i].g = g;
                center[i].b = b;
                center[i].a = a;
            }
    
        }
        return sum++;
    }
    
    function distance(k, c) {
        var sum = 0;
    
        sum += (k.x - c.x) * (k.x - c.x);
        sum += (k.y - c.y) * (k.y - c.y);
        sum += (k.r - c.r) * (k.r - c.r);
        sum += (k.g - c.g) * (k.g - c.g);
        sum += (k.b - c.b) * (k.b - c.b);
        sum += (k.a - c.a) * (k.a - c.a);
    
        return Math.floor(Math.sqrt(sum));
    }
    
    window.addEventListener('load', loadImage, false);
    }());
