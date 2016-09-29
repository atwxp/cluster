#encoding:utf-8

# 把gml转换为txt
import re
import os

gml = raw_input('input you file(.gml-0): ');
# gml = raw_input('input you file(.gml-1): ');

f = open(gml + '.gml', 'r')
temp = open('temp.txt', 'w')

# 临时存储顶点, vertexNum返回节点个数
vertex = []
vertexNum = 0

for line in f.readlines():
    line = line.strip('\n')
    s = re.match('\s+source\s+(\d+)', line)
    t = re.match('\s+target\s+(\d+)', line)
    v = re.match('\s+id\s+(\d+)', line)
    
    if v:
        vertex.append(int(v.group(1)))
        
        # vertex.append(int(v.group(1)) - 1)
    if s:
        s = s.group(1)
        temp.write(s)

        # s = s.group(1)
        # s = int(s) - 1
        # temp.write(str(s))

    if t:
        t = t.group(1)
        temp.write(' ' + t + '\n')
        
        # t = t.group(1)
        # t = int(t) - 1
        # temp.write(' ' + str(t) + '\n')

vertexNum = vertex.index(max(vertex)) + 1

temp.close()
f.close()

# 按顺序排列
f = open('temp.txt', 'r')
result = open(gml + '.txt', 'w')
arr = []

for i in range(vertexNum):
    arr.append([])

for line in f.readlines():
    line = line.strip('\n')
    item = line.split(' ')
    fr = int(item[0])
    to = int(item[1])
    
    if fr > to:
        temp = fr
        fr = to
        to = temp

    arr[fr].append(to)

# 写入文件
result.write(str(vertexNum))
index = -1
for i in arr:
    index += 1
    temp = sorted(i)
    if len(temp):
        for j in temp:
            result.write('\n' + str(index) + ' ' + str(j))

result.close()
f.close()

os.remove('temp.txt')