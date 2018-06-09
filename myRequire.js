'use strict';

(function() {
    //存储已经加载好的模块
    var moduleCache = {};
    var require = function(deps, callback) {
        var params = [];
        var depCount = 0;
        var i,
            len,
            isEmpty = false,
            modName;
        //获取当前正在执行的js代码段
        modName =
            (document.currentScript && document.currentScript.id) ||
            'REQUIRE_MAIN';
        //简单实现，这里未做参数检查，只考虑数组的情况
        if (deps.length) {
            for (i = 0, len = deps.length; i < len; i++) {
                (function(i) {
                    //依赖加一
                    depCount++;
                    //这块回调很关键
                    loadMod(deps[i], function(param) {
                        // param是define函数的回调返回值object {}
                        // 每加载成功一次， depCount-1,到0则调用require的回调函数
                        params[i] = param;
                        depCount--;
                        if (depCount == 0) {
                            saveModule(modName, params, callback);
                        }
                    });
                })(i);
            }
        } else {
            isEmpty = true;
        }
        // 如果没有任何依赖（define([], ()=>{})）的情况
        if (isEmpty) {
            // id=myModule => myModule ƒ () {
            // console.log('modName', modName, callback);
            setTimeout(function() {
                // 这里先调用了, 在saveModule的函数中调用loadMod设置好的回调
                saveModule(modName, null, callback);
            }, 0);
        }
    };

    //考虑最简单逻辑即可
    var _getPathUrl = function(modName) {
        var url = modName;
        //不严谨
        if (url.indexOf('.js') == -1) url = url + '.js';
        return url;
    };

    //模块加载
    var loadMod = function(modName, callback) {
        var url = _getPathUrl(modName),
            fs,
            mod,
            _script;

        //如果该模块已经被加载
        if (moduleCache[modName]) {
            mod = moduleCache[modName];
            // console.log(modName, moduleCache[modName]);
            if (mod.status == 'loaded') {
                console.log('我已经被加载过', mod.export);
                setTimeout(callback(mod.export), 0);
            } else {
                // 测试 把network的网速跳到最低
                //如果正在加载中，直接往onload插入值，在依赖项加载好后会解除依赖
                mod.onload.push(callback);
                // status loading
                // console.log(mod.onload); // 有多个require的callback依赖这个mod
            }
        } else {
            /*
             这里重点说一下Module对象
             status代表模块状态
             onLoad事实上对应requireJS的事件回调，该模块被引用多少次变化执行多少次回调，通知被依赖项解除依赖
             */
            mod = moduleCache[modName] = {
                modName: modName,
                status: 'loading',
                export: null,
                // 在这里加入onload
                onload: [callback],
            };
            // console.log(mod.onload[0]);  f (param) {
            _script = document.createElement('script');
            _script.id = modName;
            _script.type = 'text/javascript';
            _script.charset = 'utf-8';
            _script.async = true;
            _script.src = url;
            fs = document.getElementsByTagName('script')[0];
            fs.parentNode.insertBefore(_script, fs);
        }
    };

    var saveModule = function(modName, params, callback) {
        // console.log(modName, params); // 1.myModule null
        // 2，REQUIRE_MAIN [{…}] define 的回调函数返回的对象
        var mod, fn;

        if (moduleCache.hasOwnProperty(modName)) {
            mod = moduleCache[modName];
            mod.status = 'loaded';
            //输出项
            mod.export = callback ? callback(params) : null;
            //解除父类依赖，这里事实上使用事件监听较好
            console.log('mod.onload', mod.onload[0]);
            while ((fn = mod.onload.shift())) {
                // myModule下载完执行到这里，拿到回调函数的返回对象 mod.export，传入执行结果作为参数并调用fn， 闭包，移除父类的依赖， 在param中保留结果
                //  params[i] = param; depCount--;
                console.log(1);
                fn(mod.export);
            }
            // console.log(callback, modName, 3);
        } else {
            // 1. require的回调函数 callback  f(myModule) var name = myModule.getName();
            // 2. REQUIRE_MAIN没有被缓存
            // console.log(callback, modName, 2);
            callback && callback.apply(window, params);
        }
    };

    window.req = require;
    window.def = require;
})();
