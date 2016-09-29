function initJSON (edges, belong) {
    var edge,
        fromId,
        fromNode,
        toId,
        toNode,
        nodes = {};
    
    belong = belong || [];
    for (var i = 0, len = edges.length; i < len; i++) {
        edge = edges[i];
        fromId = edge[0];
        toId = edge[1];

        if ((fromNode = nodes[fromId]) == undefined) {
            fromNode = new Node(fromId, belong[fromId]);
            nodes[fromId] = fromNode;
        }
        toNode = new Node(toId, belong[toId]);
        nodes[toId] = toNode;

        toNode.parent = fromId;
        fromNode.childNodes.push(toNode);
    }
    return nodes;
}

function Node(id, belong) {
    this.id = id;
    this.title = id;
    this.parent = undefined;
    this.childNodes = [];
    this.belong = belong || 0;
}
function drawRelation (edges, options, vertexNum, belong) {
    var arr =  [];
    var json = initJSON(edges, belong);

    for (var i = 0; i < vertexNum; i++) {
        if (json[i].parent == undefined) {
            arr.push(json[i]);
        }
    }
    new Relation(arr, options);
}

function drawQ(Q, canvas) {
    var myChart = echarts.init(canvas);
    
    option = {
         backgroundColor: 'rgba(0, 200, 200, 0.3)',
        tooltip : {
            trigger: 'axis'
        },
        title: {
            text: '模块度Q',
            x: 'center',
            textStyle: {color: '#08c'}
        },
        toolbox: {
            show : true,
            feature : {
                mark : {show: true},
                dataView : {show: true, readOnly: false},
                magicType : {show: true, type: ['line', 'bar']},
                restore : {show: true},
                saveAsImage : {show: true}
            }
        },
        calculable : true,
        xAxis : [
            {
                type : 'category',
                boundaryGap : false,
                data: [0]
            }
        ],
        yAxis : [
            {
                type : 'value',
                min: 0,
                max: 1,
                precision: 4,
                splitNumber: 5,
                axisLabel : {
                    formatter: '{value}'
                },
                splitArea : {show : true}
            }
        ],
        series : [
            {
                name:'模块度Q',
                type:'line',
                itemStyle: {
                    normal: {
                        lineStyle: {
                            shadowColor : 'rgba(0,0,0,0.4)',
                            shadowBlur: 5,
                            shadowOffsetX: 3,
                            shadowOffsetY: 3
                        }
                    }
                },
                data: [0],
                markPoint : {
                    data : [
                        {type : 'max', name: '最大值'}
                    ]
                }
            }
        ]
    };

    for (var i = 0, len = Q.length; i < len; i++) {
        var mod = Q[i];
        for (var key in mod) {
            option.series[0]['data'].push(mod[key].toFixed(4));
            option.xAxis[0]['data'].push(key);
        } 
    }
    myChart.setOption(option);
}

/***********************************************/

function visualData(data) {
    var edges = data.edges,
        belong = data.belong,
        vertexNum = data.vertexNum;

    // 初始数据
    drawRelation(edges, {wrap: '.init'}, vertexNum);

    // GN之后
    var clubNum = Math.max.apply(Math, belong) + 1;
    drawRelation(edges, {
        wrap: '.done',
        clubNum: clubNum
    }, vertexNum, belong);
}

$(function () {

    $('#start').click(function (e) {
        e.preventDefault();

        var vertex = {
            zachary: 34,
            football: 115,
            dolphins: 62,
            strike: 24
        };
        var edgeNum = {
            zachary: 78,
            football: 613,
            dolphins: 159,
            strike: 38
        };

        var json = {
            dataset: $('#dataset').val(),
            alg: $('#alg').val(),
            prefrence: $('#prefrence').val(),
            lamda: $('#lamda').val(),
            maxits: $('#maxits').val(),
            convits: $('#convits').val()
        };
        
        $('.init').html('');
        $('.done').html('');
        $('.cluster').html('');

        // GN
        if (json.alg == 'GN') {
            $.post('php/' + json.alg + '-done.php', {dataset: json.dataset})
                .done(function (data) {
                    data = JSON.parse(data);
                    visualData(data);
                    drawQ(data.Q, $('.chart')[0]);
                    
                    // 打印社团划分结果
                    var str = '';
                    var belong = data.belong;
                    var clubNum = Math.max.apply(Math, belong) + 1;
                    for (var j = 0; j < clubNum; j++) {
                        str += ('社团' + j + '：');

                        for (var i = 0, len = belong.length; i < len; i++) {
                            if(j == belong[i]) {
                                str += (i + 1 + ', ');
                            }
                        }
                        str += '<br />';
                    }
                    console.log(data.allQClub);
                    $('.cluster').html(str);
                });
        }
        
        // AP
        else if (json.alg == 'AP') {
            var data = init(apData[json.dataset], vertex[json.dataset], {
                maxits: json.maxits,
                convits: json.convits,
                lamda: json.lamda,
                power: json.prefrence,
                edgeNum: edgeNum[json.dataset]
            });
            
            data.edges = apData[json.dataset];
            data.vertexNum = vertex[json.dataset];
            
            visualData(data);

            // 打印社团划分结果
            var str = '';
            var club = data.club;
            for (var key in club) {
                str += ('簇类中心' + key + '：');
                for (var i = 0; i < club[key].length; i++) {
                    str += club[key][i] + ', '
                }
                str += '<br />';
            }
            $('.cluster').html(str);        
        }
    });

    // 显示参数
    $('#parameter').click(function () {
        var alg = $('#alg').val();
        var $chart = $('.chart');

        if (alg == 'GN') {
            $chart.css('visibility') == 'hidden' 
                ? $chart.css('visibility', 'visible') 
                : $chart.css('visibility', 'hidden');
        }
    });

    $('#alg').change(function () {
        if (this.value == 'AP') {
            $('.apParam').css('visibility', 'visible');
        }
        else {
            $('.apParam').css('visibility', 'hidden');
        }
    });

    // 强制刷新
    $('#restart').click(function (e) {
        e.preventDefault();
        var json = {
            dataset: $('#dataset').val(),
            alg: $('#alg').val(),
            prefrence: $('#prefrence').val(),
            lamda: $('#lamda').val(),
            maxits: $('#maxits').val(),
            convits: $('#convits').val()
        };
        
        $('.init').html('正在计算...');
        $('.done').html('正在计算...');

        $.post('php/' + json.alg + '.php', json).done(function () {
            $('#start').trigger('click');
        });
    });
});