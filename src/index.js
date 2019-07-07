#! /usr/bin/env node
//声明node文件
const path = require('path');

const fs = require('fs')

//运行时候的项目根路径
//console.log(require(path.resolve('./kkb.config.js')))

console.log('123 kkbpack 执行了')

//设置默认配置项目
const defaultConfig = {
    entry:'index.js',
    output:{
        filename:'bundle.js'
    }
}

const config = {...defaultConfig,...require(path.resolve('./kkb.config.js'))}
class Kkbpack{
    constructor(){
        this.config = config;

        this.entry = this.config.entry;
        //获取当前正在执行该脚本的文件目录
        this.rootPath = process.cwd();
        //依赖模块拆分
        this.modules = {}
    }
    parse(code,parentPath){
        let requireReg = /require\((.*)\)/g;
        //保存该文件所需的依赖外部文件
        let deps = [];
        code = code.replace(requireReg,function(match,arg){
            let relativePath = path.join(parentPath,arg.replace(/'|"/g,''));
            deps.push(relativePath);
            return `__kkbpack__require__('./${relativePath}')`;
        })
        return {code,deps};
    }
    getLoaderCode(modulePath){
        let content = fs.readFileSync(modulePath,'utf-8');
        this.config.modules.rules.forEach(rule=>{
            if(rule.test.test(modulePath)){
                let loader = require(path.resolve(rule.use))
                content = loader(content)
            }
        })

        return content;
    }
    //moduleId 模块相对路
    createModule(modulePath,moduleId){
        let moduleCode = this.getLoaderCode(modulePath);
        //解析代码里面的require 替换成 __kkbpack__require__
        let {code,deps} = this.parse(moduleCode,path.dirname(moduleId))

        this.modules[moduleId] = `
            function(module,exports,__kkbpack__require__){
                eval(\`${code}\`)
            }
        `;
        deps.forEach((dep)=>{
            this.createModule(path.join(this.rootPath,'./'+dep),'./'+dep)
        })

        //console.log(moduleCode)
    }
    generateModule(){
        let tpl = '';
        Object.keys(this.modules).forEach(moduleName=>{
            tpl+=`"${moduleName}":${this.modules[moduleName]},`
        })
        return tpl;
    }
    generateFile(){
        let template = fs.readFileSync(path.resolve(__dirname,'./template.js'),'utf-8');
        // console.log('--------------file-resolve-path------------')
        // console.log(path.resolve(__dirname,'./src/template.js'))
        // console.log('--------------file-join-path------------')
        // console.log(path.resolve(__dirname,'./template.js')  )      
        // console.log('--------------filepath------------')
        this.template = template.replace('__entry__',this.entry).replace('__content__',this.generateModule(this.modules));
        fs.writeFileSync('./dist/'+this.config.output.filename,this.template)
    }
    start(){
        //console.log(this.rootPath,this.entry)
        //console.log(path.resolve(this.rootPath,this.entry))
        let modulePath = path.resolve(this.rootPath,this.entry);
        //console.log('parent path---------------------',path.dirname(this.entry))
        this.createModule(modulePath,this.entry)

        //根据模版代码生成可执行代码
        this.generateFile();
    }
}

const kkbpack = new Kkbpack();

kkbpack.start();