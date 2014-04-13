// @const
var POS_INFINITY = Infinity;

// 主程序入口
function init(edges /*nodePos*/, vetextNum, options) {    
    /** 参数
     *
     * power决定聚类数目, 越大聚类越多
     * lamda 决定迭代次数, 越大迭代次数越多 
     */
    var maxits = options && options.maxits || 1000,  // 最大迭代次数
        convits = options && options.convits || 100,
        lamda = options && options.lamda || 0.9,  // 阻尼系数(0.5 - 1)
        power = options && options.power || 1;

    var iterationCounter = 0,
        centerCounter = 0, // iterationCounter, centerCounter迭代计数器
        num = vetextNum, 
        
        oldR, oldA,
        R = initArray(num, 0),
        A = initArray(num, 0),
        
        ret, belong,
        centerSet = [], 
        centerSetPrev;

    // Step1: 计算相似矩阵, 基于距离
    // var S = calulateSimilarity(nodePos, power);
    // Step1: 计算相似矩阵, 基于图
    var S = calulateSimilarityGaph(edges, num, power);

    while ((iterationCounter++) < maxits) {
        // console.log('第' + i + '次迭代');
        oldR = copyArray(R);
        oldA = copyArray(A);
        centerSetPrev = copyArray(centerSet);

        // Step2: 迭代R, A, 寻找聚类中心
        updateRA(num, S, R, A, oldR, oldA, lamda);

        // Step3: 划分数据 max{r(i, k) + a(i, k)}
        // ret = belongOne(R, A);
        // centerSet = ret.centerSet;

        // Step3: 划分数据 r(k, k) + a(k, k) > 0
        centerSet = centerCluster(R, A);
        ret = partionCluster(num, S, centerSet);
        
        // 簇中心在convits内不发生变化, 结束迭代
        arrEqual(centerSet, centerSetPrev) ? centerCounter++ : centerCounter = 0;
        if (centerCounter > convits) break;
    }

    // Step3:  max{r(i, k) + a(i, k)}
    /** 
     * 对zachary划分4组：
     * [1,2,3,4,5,6,7,8,9,11,12,13,14,18,20,22](多了一个9), 
     * [17]
     * [25,26,32],
     * [10,15,16,19,21,23,24,27,28,29,30,31,33,34]
     */ 
    // Step3: r(k, k) + a(k, k) > 0
    /**
     * 对zachary划分3组：
     * [1,2,3,4,5,6,7,8,9,11,12,13,14,17,18,20,22](多了一个9),
     * [25,26,29,32,33],
     * [10,15,16,19,21,23,24,27,28,30,31,34]
     */

    ret.club = getClub(ret.belong);
    ret.iteration = iterationCounter - 1;
    return ret;
}

/*************************** 工具函数 ********************************************/

function arrEqual(arr1, arr2) {
    if (arr1.length != arr2.length) return false;
    
    for (var i = 0; i < arr1.length; i++) {
        if (arr1[i] != arr2[i]) return false;
    }
    return true;
}

function getClub(belong) {
    var club = {};
    
    for (var i = 0; i < belong.length; i++) {
        club[belong[i]] = club[belong[i]] ? club[belong[i]] : [];
        club[belong[i]].push(i + 1);
    }

    return club;
}

function initArray(n, value) {
    var arr = [],
        i, j;
    for (i = 0; i < n; i++) {
        arr[i] = [];
        
        for (j = 0; j < n; j++) {
            arr[i][j] = value;
        }
    }

    return arr;
}

function copyArray(arr) {
    var copy = [],
        i, j, 
        n = arr.length;
    
    for (i = 0; i < n; i++) {
        copy[i] = [];
        
        for (j = 0; j < n; j++) {
            copy[i][j] = arr[i][j];
        }
    }

    return copy;
}

/************************ Step 3 ***********************************************/

//  r(k, k) + a(k, k) > 0
function centerCluster(R, A) {
    var centerSet = [];
    for (var i = 0, len = R.length; i < len; i++) {
        if (R[i][i] + A[i][i] > 0) {
            centerSet.push(i + 1);
        } 
    }

    return centerSet;
}
/**
 * 根据聚类中心点划分聚类集合 
 *
 * @param {number} num 节点个数
 * @param {Array} S 二维数组, 邻接矩阵
 * @param {Array} centerSet 聚类中心点
 */
function partionCluster(num, S, centerSet) {
    var diff = 0; // 簇内变差
    var belong = [],
        d, min;

    for (var i = 0; i < num; i++) {
        min = Infinity;
        
        for (var j = 0; j < centerSet.length; j++) {
            // 如果是聚类中心点本身, 距离为0, 跳出循环
            if (i == centerSet[j] - 1) {
                belong[i] = i + 1;
                j = centerSet.length;
                min = 0;
            }

            d = -S[i][centerSet[j] - 1];
            if (i > centerSet[j] - 1) {
                d = -S[centerSet[j] - 1][i]; 
            }
            
            if (d < min) {
                min = d; 
                belong[i] = centerSet[j];
            }
        }

        diff += min;
    }
    
    return {
        belong: belong,
        diff: diff,
        centerSet: centerSet
    };
}

// max{r(i, k) + a(i, k)}
function belongOne (R, A) {
    var r, a, 
        max, type, 
        belong = [], centerSet = [];

    for (var i = 0, len = R.length; i < len; i++) {
        r = R[i];
        a = A[i];
        max = -Infinity;
        
        for (var j = 0, len = R.length; j < len; j++) {
            if (r[j] + a[j] > max) {
                max = r[j] + a[j];
                type = j + 1;
            }
        }
        
        belong[i] = type;
        if (centerSet.indexOf(type) == -1) {
            centerSet.push(type);
        }
    }

    return {
        belong: belong,
        centerSet: centerSet
    };
}


/**************************** Step 2 *******************************************/

/**
 * 更新 R, A
 */
function updateRA(num, S, R, A, oldR, oldA, lamda) {
    var i, j, k,
        temp, STemp,
        dMax, dSum;
    var AS = initArray(num, 0);

    /* 先计算R
     * R(i, j) = S(i, j) - max{A(i, k) + S(i, k)}
     */

    // AS(i, j) = A(i, j) + S(i, j)
    for (i = 0; i < num; i++) {
        for (j = 0; j < num; j++) {
            STemp = i > j ? S[j][i] : S[i][j];
            AS[i][j] = A[i][j] + STemp;
        }
    }
    
    for (i = 0; i < num; i++) { // i
        for (j = 0; j < num; j++) {  // j
            // 用公式R(k, k) = S(k, k) - max{S(i, k')}, k'不等于k
            if (j == i) {
                temp = [];
                dMax = 0;
                for (k = 0; k < num; k++) {
                    if (k == j) continue;
                    temp.push(i > k ? S[k][i] : S[i][k]);
                }
                dMax = Math.max.apply(Math, temp);
                R[j][j] = S[j][j] - dMax; // S(k,k) - max{S(i,k')}
                continue;
            }
            
            dMax = -Infinity;
            // 确定最大值 max{A(i, j) + S(i, j)}
            for (k = 0; k < AS[i].length; k++) {
                if (k == j) continue;
                
                if (AS[i][k] > dMax) {
                    dMax = AS[i][k];
                }
            }
            
            // 确定S(i, k)
            R[i][j] = (i > j ? S[j][i] : S[i][j]) - dMax;
        }
    }
    
    for (i = 0; i < num; i++) {
        for (j = 0; j < num; j++) {
            R[i][j] = R[i][j] * (1 - lamda);

            R[i][j] += lamda * oldR[i][j];
        }
    }
    
    /* 计算A
     * A(i, j) = min{0, R(j, j) + sum{max{0, R(k, j)}} k != i && k != j
     */
    for (i = 0; i < num; i++) { // i
        for (j = 0; j < num; j++) {  // j
            
            // A(k, k)= sum(max{0,R(i',k)}), i'不等于k
            if (j == i) {
                dMax = 0;
                for (k = 0; k < num; k++) {
                    if (k == j) continue;
                    
                    if (R[k][j] > 0) {
                        dMax += R[k][j];
                    }
                }
                A[j][j] = dMax;
                continue;
            }
            
            dSum = 0;
            for (k = 0; k < num; k++) {
                if (k == i || k == j) continue;
                dSum += R[k][j] && R[k][j] > 0 ? R[k][j] : 0;
            }
            dSum += R[j][j]; // 即 R(j, j) + sum{max{0, R(k, j)}

            if (dSum < 0) {
                A[i][j] = dSum;
            }
        }
    }
    // 迭代A
    for (i = 0; i < num; i++) {
        for (j = 0; j < num; j++) {
            A[i][j] *= (1 - lamda);
            A[i][j] += lamda * oldA[i][j];
        }
    }
}

/***************************** Step 1 ******************************************/

/**
 * 计算相似度, 使用距离表示, 对角值取中值的一半
 *
 * @param {Array} nodePos, 二维数组包含点的二维(x, y)坐标信息，如:
 * [[0.1, 0.4], [0.6, 0.2]...]
 *
 * @return {Array} 返回S[][], 一个二维数组
 */
function calulateSimilarity(nodePos, power) {
    var len = nodePos.length,
        i, j,        
        dist,
        tmp = [], size,
        medium,
        S = initArray(len, 0);

    for (i = 0; i < len; i++) {
        row = [];
        
        for (j = i + 1; j < len; j++) {
            dist = euclidDistance(nodePos[i], nodePos[j]);
            S[i][j] = S[j][i] = dist;
            tmp.push(dist);
        }
    }

    // 求中值
    tmp.sort(function (a, b) {return a - b;});
    medium = (size = tmp.length) % 2 == 0 
        ? (tmp[size / 2] + tmp[size / 2 - 1]) / 2 
        : tmp[Math.floor(size / 2)];
    
    for (i = 0; i < len; i++) {
        S[i][i] = medium * power;
    }

    return S;
}

/**
 * 计算欧式距离 sqrt( (xi - xj) ^2 + (yi - yj) ^ 2 )
 * x, y必须是同维数的, 如果有一个点不在某一维，那么值要设置为0, 如三维坐标：
 * x = [1, 2, 0], y = [3, 4, 2]
 * 
 * @param {Array} x 每一维的坐标
 * @param {Array} y 每一维的坐标
 */
function euclidDistance(x, y) {
    var dist = 0,
        i, len;

    for (i = 0, len = x.length; i < len; i++) {
        dist += (x[i] - y[i]) * (x[i] - y[i]);
    }
    
    return -Math.sqrt(dist);
}


/**
 * 基于图的相似度，使用最短路径的负数
 *
 * @param {Array} edges 二维数组, 存储边的信息, 如：
 *      [[0, 1], [0, 2]...], 表示点0和点1、点2相连, 点的索引从0开始
 * @param {number} num 节点个数
 */
function calulateSimilarityGaph(edges, num, power) {
    var paths = [], path;
    var flat = [], medium;
    var adjMatrix = initAdjM(edges, num);
    
    for (var i = 0; i < num; i++) {
        path = dijkstra(i, adjMatrix);

        for (var j = i + 1; j < path.length; j++) {
            path[j] = -path[j];
            flat.push(path[j]);
        }
        paths[i] = path;
    }

    flat.sort(function (a, b) {return a - b;});
    if (flat.length % 2 == 0) {
        medium = (flat[flat.length / 2] + flat[flat.length / 2 - 1]) / 2;
    }
    else {
        medium = flat[Math.floor(flat.length / 2)];
    }
    for (var i = 0; i < num; i++) {
        paths[i][i] = medium * power;
    }
    
    return paths;
}

/**
 * 构建无向无权图的邻接矩阵
 * 
 * @param {Array} edges 二维数组, 存储边的信息, 如：
 *      [[0, 1], [0, 2]...], 表示点0和点1、点2相连, 点的索引从0开始
 * @param {number} vertxtNum 节点个数
 *
 * @return {Array} 返回邻接矩阵
 */
function initAdjM(edges, vertexNum) {
    var edge,
        adjM = [];

    for (var i = 0; i < vertexNum; i++) {
        adjM[i] = [];
        for (var j = 0; j < vertexNum; j++) {
            adjM[i][j] = POS_INFINITY; // POS_INFINITY = Infinity
            if (i == j) adjM[i][j] = 0;
        }
    }

    for (var i = 0; i < edges.length; i++) {
        edge = edges[i];
        adjM[edge[0]][edge[1]] = 1;
        adjM[edge[1]][edge[0]] = 1;
    }
    return adjM;
}

/**
 * dijkstra算法
 *
 * @param {number} sourceV 源点, 从0开始索引
 * @param {Array} adjMatrix 二维数组, 图的邻接矩阵
 *
 * @return {Array} dist 返回源点到其他各点的最短距离
 */
function dijkstra(sourceV, adjMatrix) {
    var set = [],
        dist = [],
        distCopy = [],
        vertexNum = adjMatrix.length;

    var temp, u,
        count = 0;

    // 初始化
    for (var i = 0; i < vertexNum; i++) {
        distCopy[i] = dist[i] = POS_INFINITY;
        set[i] = false;
    }
    distCopy[sourceV] = dist[sourceV] = 0;

    while (count < vertexNum) {
        u = distCopy.indexOf(Math.min.apply(Math, distCopy));
        set[u] = true;
        distCopy[u] = POS_INFINITY;

        for (var i = 0; i < vertexNum; i++) {
            if (!set[i] && ((temp = dist[u] + adjMatrix[u][i]) < dist[i])) {
                distCopy[i] = dist[i] = temp;
            }
        }
        count++;
    }

    return dist;
}