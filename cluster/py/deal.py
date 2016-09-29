fileName = raw_input('input file name: ')
url = fileName + '/' + fileName

f = open(url + '.txt', 'r')
fw = open(url + '-deal.txt', 'w')

lines = f.readlines()
arr = lines.pop(0).strip('\n').split(' ')
N = arr[0]
lamda = arr[1]
fw.write(N + ' ' + lamda + '\n');

adjM = []
for i in range(int(N)):
    adjM.append([None] * int(N))


for line in lines:
        arr = line.strip('\n').split(' ')
        adjM[int(arr[0])][int(arr[1])] = 1
        adjM[int(arr[1])][int(arr[0])] = 1

for n in adjM:
    for index, value in enumerate(n):
        if (value == 1):
            fw.write(str(index) + ' ')
    fw.write('\n')
        
f.close()
fw.close()
