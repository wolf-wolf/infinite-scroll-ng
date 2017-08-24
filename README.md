# infinite-scroll
==========
AngularJS 1中使用的大量数据滚动指令

支持
-----------
* 浏览器支持Chrome，其他暂未做测试
* 展示数据为树形结构和列表结构
* 非树形结构在Chrome下支持100W条
* 仅支持节点高度相同的树形结构和列表

安装
-----------

使用说明
-----------
| properties        | type       | Required | detail                            | example |
| ----------------- | ---------- | -------- | --------------------------------- | ------- |
| dataList          | Array      | yes      | 数据列表                           | list:$scope.dataList = [{id:1,txt:'test'},{id:2,txt:'test2'}]， tree:$scope.dataList = [{id:1,txt:'level1',level:0,children:[{...}]]|
| viewList          | Array      | yes      | 展示列表                           | $scope.viewList = [] |
| itemHeight        | Number     | yes      | 单个节点的高度                      | 30 |
| toggleHandler     | Function   | no       | 【树形结构】用于展开子节点的方法        | $scope.toggleHandler = new Function(); |
| getChildNodeApi   | Function   | no       | 【树形结构】获取子节点数据的方法        | $scope.getChildNodeApi = function(param){...}; // param的结构{id:id} |
| isGetChildFromApi | String     | no       | 【树形结构】是否通过方法拉取子节点数据   | 1 |
| isTree            | String     | no       | 【树形结构】是否是属性结构             | 1 |
| showCount         | Number     | no       | 固定的展示数量                       | 100  |
| propList          | Object     | no       | 需要在每个node节点中绑定的属性         | {id: 'id',fullname: 'txt',level: 'level',parentIds: 'parentIds',isExpand: 'isExpand'} |
