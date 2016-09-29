<?php  
    set_time_limit(0);

    #global
    $vertexNum;
    $QArr =  array();
    $allQClub = array();
    $Infinity = 9999;

    /**
     * 将要处理的文件内容(边的信息)转换为二维数组存储
     * 形如：[ [1, 2], [1, 3], ....]
     * edges[][]
     */
    function initData($file) {
        $content = file_get_contents($file);
        $temp = preg_split('/\s+/', $content);
        // 存储节点个数
        $GLOBALS['vertexNum'] = $temp[0];
        // 存储边的信息
        $edges = array();
        for ($i = 1; $i < count($temp); $i += 2) {
            $edge = array($temp[$i], $temp[$i + 1]);
            array_push($edges, $edge);
        }
        return $edges;
    }
    
    /**
     * 构建图的邻接矩阵 n * n, 无向、权值为1
     * adjM[][]
     */
    function initAdjM($edges, $vertexNum) {
        $adjM = array();
        $Infinity = $GLOBALS['Infinity'];

        // 初始化
        for ($i = 0; $i < $vertexNum; $i++) {
            $row = array();
            for ($j = 0; $j < $vertexNum; $j++) {
                $row[$j] = $Infinity;
                if ($i == $j) $row[$i] = 0;
            }
            $adjM[$i] = $row;
        }

        // 根据边的信息修改adj(ij) = 1
        for ($k = 0; $k < count($edges); $k++) {
            $edge = $edges[$k];
            $adjM[$edge[0]][$edge[1]] = 1;
            $adjM[$edge[1]][$edge[0]] = 1;
        }
        return $adjM;
    }

    /**
     * 返回节点v的邻居节点集合
     * ret[]
     */
    function getNeighborFrom($v, $adjM) {
        $vInfo = $adjM[$v];
        $ret = array();
        
        foreach ($vInfo as $i => $value) {
            if ($value == 1) {
                array_push($ret, $i);
            }
        }
        return $ret;
    }

    /**
     * {number} sourceV 源点的索引，从0开始
     * {Array} adjMatrix 图的邻接矩阵，是一个二维数组
     * {number} vertexNum 节点个数
     * path[][]
     */
    function dijkstra($sourceV, $adjMatrix, $vertexNum) {
        // set[] 是一个集合，初始是空集，每访问一个点即把点加入集合中
        // path = [] 记录源点v到点d经过的路径，如path[4] = ['0124', '0134']
        // 可能会存在多条最短路径
        $set = array();
        $path = array();
        $dist = array();
        $distCopy = array();    
        $count = 0;
        $Infinity = $GLOBALS['Infinity'];

        // 初始化
        for ($i = 0; $i < $vertexNum; $i++) {
            $distCopy[$i] = $dist[$i] = $Infinity;
            $path[$i] = array();
            $set[$i] = false;
        }
        $distCopy[$sourceV] = $dist[$sourceV] = 0;
        array_push($path[$sourceV], $sourceV);

        while ($count < $vertexNum) {
            $u = array_keys($distCopy, min($distCopy));
            $u = $u[0];
            $set[$u] = true;
            $distCopy[$u] = $Infinity;

            for ($i = 0; $i < $vertexNum; $i++) {
                if (!$set[$i] && (($temp = $dist[$u] + $adjMatrix[$u][$i]) <= $dist[$i])) {
                    if ($temp != $dist[$u] + $Infinity) {
                        $distCopy[$i] = $dist[$i] = $temp;
                        // 如果到点u只有一条最短路径
                        if (count($path[$u]) == 1) {
                            $p = array_merge($path[$u], array($i));
                            array_push($path[$i], implode(',', $p));
                        }
                        // 如果存在多条最短路径到u
                        else {
                            foreach ($path[$u] as $key => $value) {
                                array_push($path[$i], $value . ',' . $i);
                            }
                        }
                    }
                }
            }
            $count += 1;
        }

        return $path;
    }

    /**
     * 计算边介数
     * 
     * {Array} edges 边的信息
     * {Array} adjM 邻接矩阵
     * {number} vertexNum 节点个数
     */
    function edgeBetweenness($edges, $adjM, $vertexNum) {
        $ebt = array();
        $allEbts = array();
        

        // 循环遍历每一个源点
        for ($v = 0; $v < $vertexNum; $v++) {
            $ebtTmp = array();
            
            $paths = dijkstra($v, $adjM, $vertexNum);
            
            // allpath 记录从源点v出发的所有路径
            // dist 记录从源点v出发到其他点的距离
            $allPaths = array();
            $dist = array();
            $distCopy = array();

            for ($j = 0; $j < $vertexNum; $j++) {
                $row = $paths[$j];

                // 两点之间没有路径, 则path[i] = []
                if (count($row) != 0) {
                    // 从v到j的距离
                    $dd = count(preg_split('/,/', $row[0]));
                    $distCopy[$j] = $dist[$j] = ($dd == 1 ? 0 : $dd - 1);
                    $allPaths = array_merge($allPaths, $row);
                }
                else {
                    $distCopy[$j] = $dist[$j] = -9999;
                    $allPaths = array_merge($allPaths, $row);
                }
            }

            while (($maxDist = max($distCopy)) != 0) {
                $maxIndex = array();

                for ($k = 0; $k < count($dist); $k++) {

                    if ($dist[$k] == $maxDist) {
                        $distCopy[$k] = 0;
                        array_push($maxIndex, $k);
                    }
                }
                for ($i = 0; $i < count($maxIndex); $i++) {
                    // $row形如：['0,1,3', '0,2,3']
                    $row = $paths[$maxIndex[$i]];
                    $fromOldArr = array();

                    for ($j = 0; $j < count($row); $j++) {
                        // 获取路径最后的两个节点
                        $line = preg_split('/,/', $row[$j]);
                        $from = $line[count($line) - 2];
                        $to = $line[count($line) - 1];
                        
                        // 如果先前已经计算跳过
                        if (arrayIndex($fromOldArr, $from . ',' .$to) != -1) {
                            continue;
                        }
                        
                        array_push($fromOldArr, $from . ',' .$to);
                        $nextOld = array();
                        $w = 0; // 权重

                        for ($k = 0; $k < count($allPaths); $k++) {
                            $temp = preg_split('/,/', $allPaths[$k]);
                            $toIndex = arrayIndex($temp, $to);
  
                            // 节点to下面还有节点与之相连
                            if ($toIndex != -1 && $toIndex < count($temp) - 1) {
                                $next = $temp[$toIndex + 1];
                                
                                if (arrayIndex($nextOld, $next) == -1) {
                                    array_push($nextOld, $next);
                                    $pos = searchEdge($to, $next, $edges);
                                    $w += $ebtTmp[$pos];
                                }
                            }
                        }

                        $pos = searchEdge($from, $to, $edges);
                        $ebtTmp[$pos] = isset($ebtTmp[$pos]) ? $ebtTmp[$pos] : 0;
                        $ebtTmp[$pos] += ($w + 1) * (count($paths[$from]) / count($paths[$to]));
                    }
                }
            }
            $ebt[$v] = $ebtTmp;
        }
        // 加介数
        for ($i = 0; $i < count($ebt); $i++) {
            $ebtTmp = $ebt[$i];
            for ($j = 0; $j < count($edges); $j++) {
                if (!isset($ebtTmp[$j])) continue;
                
                $allEbts[$j] = isset($allEbts[$j]) ? $allEbts[$j] : 0;
                $allEbts[$j] += $ebtTmp[$j];
            }
        }
        return $allEbts;

    }

    function arrayIndex($arr, $v) {
        for ($i = 0; $i < count($arr); $i++) {
            if ($arr[$i] == $v) {
                return $i;
            }
        }
        return -1;
    }

    function searchEdge($from, $to, $edges) {
        for ($i = 0, $len = count($edges); $i < $len; $i++) {
            $edge = $edges[$i];
            if ($from > $to) {
                $temp = $from;
                $from = $to;
                $to = $temp;
            } 
            if ($edge[0] == $from && $edge[1] == $to) {
                return $i;
            }
        }
        return -1;
    }

    function travel($i, $flag, $belong, $clubnum, $adjM) {
        $queue = array();
        array_push($queue, $i);
        $flag[$i] = 1;

        while (count($queue) != 0) {

            $t = array_shift($queue);
            $belong[$t] = $clubnum - 1;        
        
            $w = getNeighborFrom($t, $adjM);

            foreach ($w as $key => $value) {
                $t = $value;
                if ($flag[$t] == 0) {
                    $flag[$t] = 1;
                    array_push($queue, $t);
                }
            }
        }

        $arr = array('belong' => $belong, 'flag' => $flag);
        return $arr;
    }
    function divide($edges, $adjM, $vertexNum) {
        $ebts = edgeBetweenness($edges, $adjM, $vertexNum);
        $maxIndex = array_keys($ebts, max($ebts));
        $maxIndex = $maxIndex[0];
        
        $removeEdge = array_splice($edges, $maxIndex, 1);
        $removeEdge =  $removeEdge[0];

        $adjM[$removeEdge[0]][$removeEdge[1]] = $GLOBALS['Infinity'];
        $adjM[$removeEdge[1]][$removeEdge[0]] = $GLOBALS['Infinity'];
        
        $arr = array('adjM' => $adjM, 'edges' => $edges);
        
        return $arr;
    }

    /**
     * 核心算法 GN
     */
    function GN($edges, $vertexNum) {
        
        /* flag = [] 标记节点是否已经访问;
         * belong = [] 记录节点属于哪个社团,
         * 如节点1属于社团2(0为起始索引)，则belong[1] = 2;
         *
         * clubnum 划分的社团数
         * current 前一次划分时的社团数
         *
         * club[][] 二维数组社团和社团成员矩阵
         * clubItem  记录编号为n的club[n]中的社团成员, 如club[n] = [0, 3]
         * connect[][] 社团矩阵，用来计算eii, ai, Q
         */
        $flag = array();
        $belong = array();
        $belongCopy = array();

        $clubnum = 1;

        $club = array();
        $connect = array();
        
        $Q = 0;
        $maxQ = 0;
        
        $edgesNum = count($edges);
        $adjM = initAdjM($edges, $vertexNum);
        $adjMCopy = initAdjM($edges, $vertexNum);

        // 删除所有边为止，找Q最大时的社团划分
        while (count($edges) != 0) {
            $current = $clubnum;
            $clubnum = 0;
            $tre = 0;
            $ai = 0;

            $arr = divide($edges, $adjMCopy, $vertexNum);
            $adjMCopy = $arr['adjM'];
            $edges = $arr['edges'];
  
            for ($i = 0; $i < $vertexNum; $i++) {
                $flag[$i] = 0;
                $belong[$i] = 0;
            }

            // 划分社团为clubnum
            $count = 0;
            while ($count < $vertexNum) {
                if ($flag[$count] == 0) {
                    $clubnum++;
                    $temp = travel($count, $flag, $belong, $clubnum, $adjMCopy);
                    $belong = $temp['belong'];
                    $flag = $temp['flag'];
                }
                $count++;
            }

            // 如果有新的社团产生
            if ($clubnum > $current) {
                for ($b = 0; $b <= max($belong); $b++) {
                    $club[$b] = array();
                    for ($n = 0; $n < count($belong); $n++) {
                        if ($belong[$n] == $b) {
                            array_push($club[$b], $n);
                        }
                    }
                }

                for ($i = 0; $i < $clubnum; $i++) {
                    $connect[$i] = array();
                }

                for ($i = 0; $i < $clubnum; $i++) {
                    $connect[$i][$i] = 0;
                    $clubItem = $club[$i];
                    
                    // 计算同一社团
                    for ($j = 0; $j < count($clubItem); $j++) {
                        for ($k = $j + 1; $k < count($clubItem); $k++) {
                            if ($adjM[$clubItem[$j]][$clubItem[$k]] == 1) {
                                $connect[$i][$i]++;
                            }
                        }
                    }

                    $connect[$i][$i] = $connect[$i][$i] / $edgesNum;
                    $tre += $connect[$i][$i];

                    for ($m = $i + 1; $m < $clubnum; $m++) {
                        $connect[$i][$m] = 0;
                        for ($n = 0; $n < count($clubItem); $n++) {
                            for ($p = 0; $p < count($club[$m]); $p++) {
                                if ($adjM[$clubItem[$n]][$club[$m][$p]] == 1) {
                                    $connect[$i][$m]++;
                                }
                            }
                        }
                        $connect[$m][$i] = $connect[$i][$m] = $connect[$i][$m] / $edgesNum / 2;
                    }
                    
                }

                // 计算ai
                for ($i = 0; $i < $clubnum; $i++) {
                    for ($j = 0; $j < $clubnum; $j++) {
                        $temp = 0;
                        for ($k = 0; $k < $clubnum; $k++) {
                            $temp += $connect[$i][$k] * $connect[$k][$j];
                        }
                        $ai += $temp;
                    }
                }
                $Q = $tre - $ai;
                

                if ($Q < 0) $Q = 0;
                
                array_push($GLOBALS['QArr'], array($clubnum => $Q));
                array_push($GLOBALS['allQClub'], array($clubnum => $club));

                if ($Q > $maxQ) {
                    $maxQ = $Q;
                    $belongCopy = array();
                
                    for ($q = 0; $q < count($belong); $q++) {
                        array_push($belongCopy, $belong[$q]);
                    }
                }
            }
        }

        return $belongCopy;
    }

    // 读文件, 聚类处理
    $file = $_POST['dataset'];
    $edges = initData('../data/' . $file . '/' . $file. '.txt');
    $t1 = microtime(true);
    $belong = GN($edges, $vertexNum);
    $t2 = microtime(true);
    $time = round($t2 - $t1, 3);
    
    // 写结果
    $arr = array('edges' => $edges, 'belong' => $belong, 'vertexNum' => $vertexNum, 'Q' => $QArr, 'allQClub' => $allQClub, 'time' => $time);
    $file = fopen('../data/' . $file .'/' . $file . '-done.txt', 'w');
    fwrite($file, json_encode($arr));
    fclose($file);
?>