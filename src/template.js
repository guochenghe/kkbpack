!function start(modules){
    const installModule = {};

    function __kkbpack__require__ (moduleId){
        if(installModule[moduleId]){
            return installModule[moduleId]
        }

        const module = installModule[moduleId] = {
            exports:{}
        }
        modules[moduleId].call(module.exports,module,module.exports,__kkbpack__require__);

        return module.exports;

    }

    //添加入口文件首次执行
    return __kkbpack__require__('__entry__');
}({__content__})
