'use strict';

(function() {
    // 一个对象集合
    const moduleCache = {};
    const require = function(deps, callback) {
        // 存储这个require的callback函数需要的参数
        const params = [];
        let depCount = 0;
        let i;
        // 存储依赖的长度
        let len;
        // 表示这个回调函数不依赖任何代码，可以直接执行
        let isEmpty = false;
        // 关键 ： document.currentScript 使得在执行define代码的时候直到是哪个模块在执行
        let modName =
            (document.currentScript && document.currentScript.id) ||
            'REQUIRE_MAIN';
        if (deps.length) {
            for (let index = 0, len = deps.length; index < len; index += 1) {
                (function(index) {
                    depCount += 1;
                    loadMod(deps[index], function(param) {
                        // 这个函数会在模块加载完毕后执行
                        // param是mod.export，是define函数的回调返回值object类型
                        // 存入当前require的params数组中，这个数组是要传递给require的callback函数的实参
                        //    params和depCount是闭包项
                        params[index] = param;
                        depCount--;
                        // 如果这个require的依赖完全加载完毕
                        if (depCount === 0) {
                            // 那么执行这个require的回调函数
                            saveModule(modName, params, callback);
                        }
                    });
                })(index);
            }
        } else {
            // 碰到没有任何依赖的情况，比如define([], function () {})
            isEmpty = true;
        }
        // 如果没有任何依赖（define([], ()=>{})）的情况
        if (isEmpty) {
            // id=myModule => myModule ƒ () {
            // console.log('modName', modName, callback);
            setTimeout(function() {
                // 执行define中的回调函数
                saveModule(modName, null, callback);
            }, 0);
        }
    };
    //考虑最简单逻辑即可
    let _getPathUrl = function(modName) {
        let url = modName;
        //不严谨
        if (url.indexOf('.js') == -1) url = url + '.js';
        return url;
    };
    const loadMod = function(modName, callback) {
        console.log(modName);
        const url = _getPathUrl(modName);
        let fs;
        let mod;
        let _script;
        // 如果已经为这个模块采用jsonp方式
        if (moduleCache[modName]) {
            if (mod.status === 'loaded') {
                // 拿到加载好的模块的export
                console.log('我已经被加载过', mod.export);
                // mod.export是define回调函数返回的值
                setTimeout(callback(mod.export), 0);
            } else {
                // 如果正在加载中，直接往onload插入值， 即有多个require都依赖这个模块的情况
                mod.onload.push(callback);
            }
        } else {
            // 如果还没有为这个模块采用jsonp方式
            mod = moduleCache[modName] = {
                modName,
                status: 'loading',
                export: null,
                // 第一次在这里加入onload
                //   params[i] = param;  depCount--; if（depCount === 0）
                onload: [callback],
            };
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
    const saveModule = function(modName, params, callback) {
        let mod, fn;
        if (moduleCache.hasOwnProperty(modName)) {
            mod = moduleCache[modName];
            mod.status = 'loaded';
            // 执行define的回调
            mod.export = callback ? callback(params) : null;
            console.log('mod.onload', mod.onload[0]);
            // 将依赖这个模块的callback拿出来
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
            // 关于require的整体代码的回调（非模块的回调），直接由window执行
            callback && callback.apply(window, params);
        }
    };
    window.req = require;
    window.def = require;
})();
