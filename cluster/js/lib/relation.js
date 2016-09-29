/**
 * @file 使用svg制作关系图表
 * @author wxp
 */

/**
 * 关系构造函数
 * 
 * @constructor
 * 
 * @param {Object} data 节点 
 * @param {Object} rel 节点间关系
 * @param {Object} options 可配置的属性
 */
var Relation = function (data, options) {
    data = data || {};
    options = options || {};
    
    this.options = _.defaults({}, options, this.defaults);
    this.cid = _.uniqueId('rel');
    this._reset();
    this.shapes = this.options.shapes || {};
    this.colors = [];

    for (var i = 0; i < this.options.clubNum; i++) {
      var r = Math.round(Math.random() * 255);
      var g = Math.round(Math.random() * 255);
      var b = Math.round(Math.random() * 255);
      this.colors[i] = 'rgb(' + r + ',' + g + ',' + b + ')';

    }
    this.initialize(data);
};

_.extend(Relation.prototype, 
    /** @lends Relation.prototype */{
        defaults: {
            wrap: 'body', // css选择符或者jquery对象
            width: $(window).width(),
            height: $(window).height(),

            // 全局的圆的属性配置,可以在drawNode()中通过options属性更改
            circleStyle: {
                fill: '#94CFF6',
                stroke: '#94CFF6',
                'stroke-width': 1
            }, 

            // 全局的文字属性配置,可以在drawNode()中通过options属性更改
            textStyle: {
                'font-size': '14px',
                'font-family': 'Arial',
                fill: '#fff'
            },
            // 默认是1个社团
            clubNum: 1
        },
        
        _reset: function () {
            this.lines = [];
            this.shapes = {};
            this.svgObjs = {};
        },
    
        initialize: function (data) {
            var opt = this.options;
            var wrap = opt.wrap;
            var w = opt.width;
            var h = opt.height;
            
            var cid = this.cid;

            // 绘制图形时的参考位置、基准半径大小
            this.baseX = Math.round(w / 2);
            this.baseY = Math.round(h / 2);
            this.baseRadius = Math.round(Math.min(w, h) / 20);

            // 构建svg
            $('<div id="' + cid + '"></div>').appendTo(wrap);
            this.paper = Raphael(cid, w, h);
            this.paper.setViewBox(0, 0, w, h);
            
            this.render(data);
            this.handleEvents();
        },
        
        /**
         * 核心函数，构造关系图
         *
         * @public
         * @param {Object} data
         */
        render: function (data) {            
            var lists = _.isArray(data) ? data : [data];
            var item, list;
            if (_.isEmpty(data)) return;

            this.data = data;
            while ((list = lists.splice(0, 1)).length != 0) {
                while (item = list.shift()) {
                    var nodes = item.childNodes;
                    // 绘制根节点
                    if (item.parent == undefined) {
                        var x = this.baseX * Math.random();
                        var y = this.baseY *  Math.random();;
                        var r = this.baseRadius;

                        this.drawNode(
                            item,
                            {
                                pos: { x: x, y: y, r: r },
                                textStyle: item.textStyle,
                                circleStyle: {
                                    fill: this.colors[item.belong],
                                    stroke: this.colors[item.belong]
                                }
                            }
                        );
                    }
                    // 绘制子节点
                    this._drawChild(nodes);

                    list = list.concat(nodes);
                }
            }
        },
        
        /**
         * 配置子节点的属性：位置、大小、样式
         * 
         * @private
         * @param {Array} nodes 子节点对象数组
         */
        _drawChild: function (nodes) {
            var shapes = this.shapes;
            var lines = this.lines;
          
            var len = nodes.length; // 子节点数
            var theta = 2 * Math.PI / (len > 6 ? len : 6); // 小于6个子节点, 每60deg画一个子节点; 否则角度平分
            var r = this.baseRadius;
            
            if (!len) return;
            
            for (var i = 0; i < len; i++) {
                var polar = r * (3 + i * 0.2);
                var node = nodes[i];
                var id = node.id;
                var parentId = node.parent;
                
                // 使用极坐标 x' = x + polar * cos(theta), y' = y + polar * sin(theta)
                var x = Math.round(shapes[parentId].x + polar * Math.cos(theta * i));
                var y = Math.round(shapes[parentId].y + polar * Math.sin(theta * i));          
                
                if (shapes[parentId].x < this.baseX) {
                  x = Math.round(shapes[parentId].x - polar * Math.cos(theta * i));
                  y = Math.round(shapes[parentId].y - polar * Math.sin(theta * i));
                }

                shapes[id] || (shapes[id] = { x: x, y: y,r: r });
                // 画节点
                this.drawNode(node, {
                    textStyle: node.textStyle,
                    circleStyle:  {
                        fill: this.colors[node.belong],
                        stroke: this.colors[node.belong]
                    }
                });
                lines.push(this.connect(parentId, id));
            }
        },

        /**
         * 绘制节点
         * 
         * @public
         * @param {Object} node
         * @param {Object} options
         */
        
        drawNode: function (node, options) {
            var id = node.id;
            var pos = this.shapes[id] || (this.shapes[id] = options && options.pos || {});
            var textStyle = options && options.textStyle 
                && _.defaults({}, options.textStyle, this.options.textStyle) 
                || this.options.textStyle;
            
            var circleStyle = options && options.circleStyle 
                && _.defaults({}, options.circleStyle, this.options.circleStyle)
                || this.options.circleStyle;

            var x = pos.x || 0;
            var y = pos.y || 0;
            var r = pos.r || this.baseRadius;
          
            
            if (!this.svgObjs[id]) {
              this.svgObjs[id] = this.paper.set().push(
                  this.paper.rect(x - r/2, y - r/2, r, r).attr(circleStyle),
                  this.paper.text(x, y, node.title).attr(textStyle)
              ).attr({ cursor: 'move' }).data('id', id);
            }
        },
        
        /**
         * 绘制节点间的连线
         * 
         * @public
         * @param {(Object | string)} obj1 可以是节点对象或者节点的ID
         * @param {(Object | string)} obj2 可以是节点对象或者节点的ID
         * @return {Object} 返回一个对象，保存连线的相关信息，如线的起点和终点
         */
        connect: function (obj1, obj2) {
            var shapes = this.shapes;
            var wire, obj1Id, obj2Id;

            if (obj1.line) {
                wire = obj1;
                obj1 = wire.from;
                obj2 = wire.to;
            } 

            obj1Id = _.isObject(obj1) ? obj1.id : obj1;
            obj2Id = _.isObject(obj2) ? obj2.id : obj2;
            
            var posObj1 = shapes[obj1Id];
            var posObj2 = shapes[obj2Id];

            var x1 = posObj1.x;
            var y1 = posObj1.y;
            var x2 = posObj2.x;
            var y2 = posObj2.y;
            var path = 'M' + x1 + ',' + y1 + 'L' + x2 +',' + y2;

            var ret = null;

            if (wire) {
                wire.line.toBack().attr({ path: path });
            } else {
                ret = {
                    line: this.paper.path(path).toBack().attr({ stroke: '#c6d9ec', 'stroke-width': '2' }),
                    from: obj1,
                    to: obj2
                };
            }
            return ret;
        },

        /**
         * 当节点位置变化，重新绘制连线
         * 
         * @private
         */
        _reLine: function () {
            var paths = this.lines;

            for (var i = 0, len = paths.length; i < len; i++) {
                this.connect(paths[i]);
            }
        },

        /**
         * 恢复图表的原始位置
         *
         * @public
         */
        recover: function () {
            this.clear();
            this._reset();
            this.render(this.data);
        },

        destroy: function () {
            this.paper.remove();
            $('#' + this.cid).remove();

            this._reset();
            delete this;
        },
        
        /**
         * 清除画布
         * 
         * @public
         */
        clear: function () {
            this.paper.clear();
        },

        
        clone: function () {
            return new this.constructor(this.data, { shapes: this.shapes });
        },

        /**
         * 实现图表的拖拽
         * 
         * @private
         */
        _dragger: function () {
            var self = this;
            
            var svgObjs  = self.svgObjs;
            var shapes = self.shapes;
            
            var shape;
            var svgObj;
            var tempX;
            var tempY;
              
            var flag = false;

            function move(dx, dy) {
                if (flag) {
                  var finalX =  Math.round(tempX + dx);
                  var finalY =  Math.round(tempY + dy);
                  shape.x = finalX + svgObj[0].attrs.width / 2;
                  shape.y = finalY + svgObj[0].attrs.height / 2;
                  
                  svgObj[0].attr({ x: finalX, y: finalY});
                  svgObj[1].attr({ x: shape.x, y: shape.y});
                  
                  // 重新绘制连线
                  self._reLine();
                }
            }
            // 拖拽过程中，需要更新shapes中每个svg对象的位置x,y
            // 更新svgObjs中的对象，实现真正的移动，包括{x: ,y: ,cx: ,cy: }，其中x,y是文本位置，cx,cy是圆的位置
            function start() {
                var id = this.data('id');
                shape = shapes[id];
                svgObj = svgObjs[id];
                
                flag = true;

                var dimension = svgObj.getBBox();
                tempX = dimension.x;
                tempY = dimension.y;
            }
            
            function end() {
                flag = !flag;
            }
            return {
                start: start,
                move: move,
                end: end
            }
        },

        /**
         * 实现事件绑定
         * 
         * @public
         */
        handleEvents: function () {
            var self = this;
           
            _.each(this.svgObjs, function (obj) {
                var dragger = self._dragger();
                obj.drag(dragger.move, dragger.start, dragger.end);
            });

            /**
             * up,right,left,down键实现视口切换
             *
             * @event
             * @param {Object} event
             */
            $('body').keydown(function (event) {
                var svg = self.paper.canvas;
                var viewBoxValue = svg.getAttribute('viewBox').split(' ');
                var spin = 10;

                viewBoxValue[0] = +viewBoxValue[0];
                viewBoxValue[1] = +viewBoxValue[1];
                
                switch (event.keyCode) {
                    case 37: // left
                        viewBoxValue[0] += spin;
                        break;
                   
                    case 38: // up
                        viewBoxValue[1] += spin;
                        break;
                   
                    case 39: // right
                        viewBoxValue[0] -= spin;
                        break;
                   
                    case 40: // down
                        viewBoxValue[1] -= spin;
                        break;
                }
                svg.setAttribute('viewBox', viewBoxValue.join(' '));
            });
        }
});