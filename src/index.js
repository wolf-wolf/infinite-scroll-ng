'use strict';

const cssModel = require('./base.scss');
const moduleName = 'wbgComponent';

try {
    angular.module(moduleName);
} catch (error) {
    angular.module(moduleName, ['ngSanitize']);
}

angular.module(moduleName).controller('mainCtrl', function ($scope, $http, $q, utilService) {
    let defer1 = $q.defer();
    let defer2 = $q.defer();
    let _fileName1 = './list.json'; // 获取单纯的list数据
    let _fileName2 = './orgTree.json'; // 获取组织结构树数据

    $scope.orgTree = null; //组织机构树形结构
    $scope.listData = null;

    $http.get(_fileName1)
        .success(function (data) {
            defer1.resolve(data);
        })
        .error(function () {
            defer1.reject('could not find someFile.json');
        });

    $http.get(_fileName2)
        .success(function (data) {
            defer2.resolve(data);
        })
        .error(function () {
            defer2.reject('could not find someFile.json');
        });

    $scope.getNumber = function (count) {
        let ratings = [];

        for (let i = 0; i < count; i++) {
            ratings.push(i)
        }

        return ratings;
    };

    $scope.propMap1 = {id: 'id', fullname: 'txt'};
    $scope.propMap2 = {id: 'id', fullname: 'txt', level: 'level', parentIds: 'parentIds', isExpand: 'isExpand'};

    defer1.promise.then(function (data) {
        $scope.listData = data;
    }, function (err) {
        console.error(err);
        $scope.listData = null;
    });

    defer2.promise.then(function (data) {
        $scope.orgTree = data;
        utilService.tree2Map($scope.orgTree, $scope.orgMap, $scope.propMap2);
    }, function (err) {
        console.error(err);
        $scope.orgTree = null;
    });

    $scope.viewList1 = [];
    $scope.viewList2 = [];

    $scope.toggleHandler = new Function();
    $scope.orgMap = new Map();


    $scope.getChildNodeApi = function (param) {
        let _org = $scope.orgMap.get(param.id);
        let _res = [];

        return new Promise(function (resolve, reject) {
            if (_org.childrenIds) {
                _res = _org.childrenIds.map(id => $scope.orgMap.get(id));
            }
            resolve({children: _res});
        });
    };
});

/**
 * @param {Object} propList - 转换为展示数据时，每个节点所携带的数据属性，eg.{id: 'id',fullname: 'txt',level: 'level',parentIds: 'parentIds',isExpand: 'isExpand'}
 */
angular.module(moduleName).directive('infiniteScrollbar', function ($timeout, DataMechanism, utilService) {
    return {
        restrict: 'A',
        scope: {
            dataList: '=',                          // 数据
            viewList: '=',                      // 展示列表
            toggleHandler: '=?',                // 展开收起属性结构方法
            getChildNodeApi: '&?',              // 获取子列表数据api
            isGetChildFromApi: '@',             // 是否通过api拉取子列表数据
            itemHeight: '@',                    // 每个item的展示高度
            showCount: '@',                     // 固定的展示数量
            isTree: '@',                        // 是否为树形结构
            propList: '=?'                      // 需要在每个node节点中绑定的属性，树形结构默认为[id, fullname, level, parentIds, isExpand]
        },
        link: function (scope, element, attr) {
            // 属性结构必须为数组
            if (!angular.isArray(scope.dataList)) {
                console.trace('tree must be array');
                return false;
            }

            // 节点高度必须为数字
            if (!/[1-9]+/.test(scope.itemHeight)) {
                console.trace('itemHeight must be number');
                return false;
            }

            //设置默认项
            (function () {
                if (angular.isUndefined(scope.propList)) {
                    scope.propList = {
                        id: 'id',
                        fullname: 'txt',
                        level: 'level',
                        parentIds: 'parentIds',
                        isExpand: 'isExpand'
                    }
                }
            })();

            /**
             * @description 计算当前可展示的item数量
             * @returns {number}
             * @private
             */
            function _calShowCount() {
                if (scope.showCount && scope.showCount !== '0') {
                    return Number(scope.showCount);
                } else {
                    return Math.ceil(element.parent().height() / Number(scope.itemHeight) + 6);
                }
            }

            function _setPlaceholderHeight(itemHeight) {
                let _topH = itemHeight * dataMechanism.cursor.start;
                let _bottomH = itemHeight * (dataMechanism.dataList.length - dataMechanism.viewList.length - dataMechanism.cursor.start);

                element.parent().children().first().css('height', _topH);
                element.parent().children().last().css('height', _bottomH);
            }

            let _time = new Date().getTime();                               // 获取当前时间，定义占位符Id
            let _nodeDict = new Map();                                      // 数据字典
            let dataMechanism = new DataMechanism(scope.viewList);          // 定义数据处理机制对象
            let _itemH = Number(scope.itemHeight);                          // 单独一个节点的高度

            element.parent().prepend(`<i id="${'up_p_' + _time + '_' + Math.ceil(Math.random() * 1000)}" style="display: block"></i>`);
            element.parent().append(`<i id="${'down_p_' + _time + '_' + Math.ceil(Math.random() * 1000)}" style="display: block"></i>`);

            function _viewChangeOperate() {
                utilService.safeApply(scope, function () {
                    dataMechanism.setViewData();
                    _setPlaceholderHeight(Number(scope.itemHeight));
                });
            }

            dataMechanism.setShowCount(_calShowCount());                    // 设置展示个数

            if (scope.isTree) {
                utilService.tree2Map(scope.dataList, _nodeDict, scope.propList);    // 将树形结构转换为Map
                dataMechanism.dataList.push(_nodeDict.get(scope.dataList[0].id));   // 添加root节点
                dataMechanism.dataList[0].childrenIds.forEach(id => dataMechanism.dataList.push(_nodeDict.get(id))); // 添加root节点的第一层子节点
            } else {
                dataMechanism.dataList = scope.dataList;
            }
            _viewChangeOperate();

            element.parent().bind('scroll', function (event) {
                if (dataMechanism.dataList.length > dataMechanism.showCount) {      // 若数据展示条数过少，则无需调整
                    let _targetIdx = Math.floor(event.target.scrollTop / _itemH);       // 计算当前需要展示的索引

                    if (Math.abs(_targetIdx - dataMechanism.cursor.start) > dataMechanism.redundancy - 1 || _targetIdx < dataMechanism.redundancy) {
                        dataMechanism.cursor.start = _targetIdx - dataMechanism.redundancy > 0 ? _targetIdx - dataMechanism.redundancy : 0;
                        _viewChangeOperate()
                    }
                }
            });

            /**
             * @description 展开和收起子列表
             * @param id
             */
            scope.toggleHandler = scope.isTree ? function (id) {
                let _curNode = _nodeDict.get(id),    // 当前节点
                    _currIdx = 0;                               // 当前节点在展示列表中的索引

                //计算索引值
                for (let i = 0; i < dataMechanism.dataList.length; i++) {
                    if (id === dataMechanism.dataList[i].id) {
                        _currIdx = i;
                        break;
                    }
                }

                if (_curNode) {
                    if (!_curNode.isExpand) { // 节点未打开时
                        _curNode.isExpand = true;

                        if (scope.isGetChildFromApi) {
                            scope.getChildNodeApi({id: id}).then(function (result) {
                                let _tempArr = [];
                                result.children.forEach(item => _tempArr.push(item));
                                $timeout(function () {
                                    utilService.insertArrToArr.apply(dataMechanism.dataList, [_currIdx, _tempArr]);
                                    _viewChangeOperate()
                                });
                            });
                        } else {
                            if (_curNode.childrenIds) {
                                let _tempArr = [];
                                _curNode.childrenIds.forEach(id => _tempArr.push(_nodeDict.get(id)));
                                utilService.insertArrToArr.apply(dataMechanism.dataList, [_currIdx, _tempArr]);
                                _viewChangeOperate();
                            }
                        }
                    } else { // 节点已经打开
                        _curNode.isExpand = false;

                        let _spliceLen = 0;
                        for (let i = _currIdx + 1; i < dataMechanism.dataList.length; i++) {
                            let _tempItem = dataMechanism.dataList[i];
                            if (_tempItem && _tempItem.level === _curNode.level) {
                                break;
                            }

                            if (_tempItem && _tempItem.level > _curNode.level) {
                                _tempItem.isExpand = false;
                                _spliceLen++;
                            }
                        }

                        dataMechanism.dataList.splice(_currIdx + 1, _spliceLen);
                        _viewChangeOperate();
                    }
                }
            } : null;
        }
    }
});
angular.module(moduleName).service('utilService', function () {
    /**
     * @description 将数组arr在指定位置插入到调用数组中，调用时需要使用apply进行调用
     * @param {Number} idx - 插入位置
     * @param {Array} arr - 要插入的数组
     */
    this.insertArrToArr = function (idx, arr) {
        if (arr) {
            for (let i = 0; i < arr.length; i++) {
                this.splice(idx + 1, 0, arr[i]);
            }
        }
    };

    /**
     * @description 属性结构转换为Map字典
     * @param tree
     * @param treeMap
     * @param propMap
     */
    this.tree2Map = function tree2Map(tree, treeMap, propMap) {
        for (let i = 0; i < tree.length; i++) {
            let _tempObj = {};
            Object.keys(propMap).forEach(key => _tempObj[propMap[key]] = tree[i][key]);

            treeMap.set(tree[i].id, _tempObj);

            if (tree[i].children && tree[i].children.length > 0) {
                treeMap.get(tree[i].id).childrenIds = [];
                for (let j = 0; j < tree[i].children.length; j++) {
                    treeMap.get(tree[i].id).childrenIds.push(tree[i].children[j].id);
                }

                tree2Map(tree[i].children, treeMap, propMap);
            }
        }
    };

    /**
     * @description 安全$apply方法，保证不进行重复的脏检查
     * @param scope
     * @param fn
     */
    this.safeApply = function (scope, fn) {
        let phase = scope.$root.$$phase;
        if (phase === '$apply' || phase === '$digest') {
            if (fn && (typeof(fn) === 'function')) {
                fn();
            }
        } else {
            scope.$apply(fn);
        }
    }

});

angular.module(moduleName).factory('DataMechanism', function () {
    class DataMechanism {
        constructor(viewList) {
            this.viewList = viewList;

            this.showCount = 0;
            this.dataList = [];
            this.cursor = {
                start: 0,
                end: 0
            };

            this.redundancy = 3; // 上下预留的item数量
        }

        setShowCount(showCount) {
            this.showCount = showCount;
        }

        setViewData() {
            this.viewList.length = 0;
            if (this.dataList.length > this.showCount) { //若大于可展示条数则截断展示
                this.dataList.slice(this.cursor.start, this.cursor.start + this.showCount).forEach(item => this.viewList.push(item));
            } else { // 小于可展示条数，全部展示
                this.cursor.start = 0;
                this.dataList.forEach(item => this.viewList.push(item));
            }

            this.cursor.end = this.cursor.start + this.viewList.length - 1;
        }
    }

    return DataMechanism;
});













































