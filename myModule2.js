def(['myModule'], function(myModule) {
    // 返回值是个对象
    return {
        getName: myModule[0].getName,
    };
});
