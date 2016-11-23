'use strict';

var fs=require('fs');
var path = require('path');
var os = require('os');

// 并发线程数
var THREAD_NUM=os.cpus().length;

/**
 * 将数组中的文件转换成完整路径
 * @param {String} dir
 * @param {Array} files
 * @return {Array}
 */
function fullPath(dir,files){
    if(!Array.isArray(files))return [];
    return files.map((file)=>{
        return path.join(dir,file);
    })
}

/**
 * 遍历目录里面的所有文件和目录
 * @param {String} dir 目录名
 * @param {Number} thread_num 线程数
 * @param {Function} findOne 找到每一个文件时候的回调 格式：function(filename,stats,next)
 * @callback {Function} callback 循环完之后的回调 格式：function(err)
 */
function eachFile(dir,thread_num,findOne,callback){
    fs.stat(dir,function(err,stats){
        if(err) return callback(err);

        //findOne的回调
        findOne(dir,stats,function(){
            if(stats.isFile()){
                //如果是文件表示终结
                return callback(null);
            }else if(stats.isDirectory()){
                // 如果为目录，则接续遍历该目录下的所有文件
                fs.readdir(dir,function(err,files){
                    if (err) return callback(err);

                    files = fullPath(dir, files);

                    // 启动多个并发线程
                    var finish=0;
                    var threadFinish=function(){
                        finish++;
                        if(finish>=thread_num) return callback(null);
                    }
                    var next=function(){
                        var f=files.pop();
                        if(!f)return threadFinish();
                        eachFile(f,thread_num,findOne,function(err){
                            if (err) return callback(err);
                            next();
                        })
                    }
                    for(var i=0;i<thread_num;i++){
                        next();
                    }
                })
            }else{
                //未知格式
                return callback(null)
            }
        })
    })
}

/**
 * 遍历目录里面的所有文件和目录
 * @param {String} dir 目录名
 * @param {Number} thread_num 线程数
 * @param {Function} findOne 找到每一个文件时候的回调 格式：function(filename,stats,next)
 * @callback {Function} callback 循环完之后的回调 格式：function(err)
 */
 exports.each=function(dir,callback){
     var thread_num,findOne;
     if(arguments.length<3) return callback(new TypeError('Bad arguments number'));
     if(arguments.length===3){
         thread_num=THREAD_NUM;
         findOne=arguments[1];
         callback=arguments[2];
     }else{
         thread_num=arguments[1];
         findOne=arguments[2];
         callback=arguments[3];
     }

     if(thread_num<=0)return callback(new TypeError('The argument "thread_num" must be number and greater than 0'));
     if(typeof findOne!=='function')return callback(new TypeError('Then argument "findOne" must be a function'));
     if(typeof callback!=='function') return callback(new TypeError('Then argument "callback" must be a function'));

     eachFile(path.resolve(dir),thread_num,findOne,callback);
 }

// -----------------------------------------------------------------------------

/**
* 取each系列的参数
*
* @param {Array} args
* @return {Array}
*/
function getEachArguments(args){
    return Array.prototype.slice.call(args,0,-2);
}
/**
* 取read系列参数
*
* @param {Array} args
* @return {Array}
*/
function getReadArguments(args){
 return Array.prototype.slice.call(args,0,-1);
}
/**
* 取callback参数
*
* @param {Array} args
* @return {Mixed}
*/
function getCallback(args){
  return args[args.length-1]
}
/**
* 取findOne参数
*
* @param {Array} args
* @return {Mixed}
*/
function getFindOne(args){
    return args[args.length-2];
}
/**
 * 取pattern参数
 *
 * @param {Array} args
 * @return {Mixed}
 */
function getPattern(args){
    return args[1];
}
/**
 * 去掉pattern参数
 *
 * @param {Array} args
 * @return {Array}
 */
function stripPattern(args){
    args.splice(1,1);
    return args;
}
/**
 * 规则转为函数
 *
 * @param {RegExp|Function} pattern
 * @return {Function}
 */
function patternToFunction(pattern){
    if(typeof pattern ==='function'){
        return pattern;
    }else if(pattern instanceof RegExp){
        return function(s){
            return pattern.test(s);
        }
    }else{
        return function () {
    	  return false;
    	};
    }
}
/**
* 仅遍历目录下指定规则的所有文件和目录
*
* @param {String} dir
* @param {RegExp|Function} pattern
* @param {Number} thread_num  (optional)
* @param {Function} callback
*/
exports.eachFilter=function(){
    var args=stripPattern(getEachArguments(arguments));
    var findOne=getFindOne(arguments);
    var callback=getCallback(arguments);
    var test=patternToFunction(getPattern(arguments));

    args.push(function(filename,stats,next){
        if(test(filename)){
            findOne.apply(this, arguments);
        }else{
            next();
        }
    });
    args.push(callback);
    return exports.each.apply(this, args);
}

/**
 * 仅遍历目录下的所有文件
 *
 * @param {String} dir
 * @param {Number} thread_num  (optional)
 * @param {Function} callback
 */
 exports.eachFile=function(){
     var args = getEachArguments(arguments);
     var findOne = getFindOne(arguments);
     var callback = getCallback(arguments);

     args.push(function(filename,stats,next){
         if(filename.isFile()){
             findOne.apply(this,arguments);
         }else{
             next();
         }
     })
     args.push(callback);
     return exports.each.apply(this,args);
 }
 /**
  * 仅遍历目录下的所有目录
  *
  * @param {String} dir
  * @param {Number} thread_num  (optional)
  * @param {Function} callback
  */
 exports.eachDir=function(){
     var args = getEachArguments(arguments);
     var findOne = getFindOne(arguments);
     var callback = getCallback(arguments);

     args.push(function(filename,stats,next){
         if(filename.isDirectory()){
             findOne.apply(this,arguments);
         }else{
             next();
         }
     })
     args.push(callback);
     return exports.each.apply(this,args);
 }
 /**
  * 仅遍历目录下指定规则的所有文件
  *
  * @param {String} dir
  * @param {RegExp|Function} pattern
  * @param {Number} thread_num  (optional)
  * @param {Function} callback
  */
 exports.eachFileFilter=function(){
     var args = getEachArguments(arguments);
     var findOne = getFindOne(arguments);
     var callback = getCallback(arguments);
     var test=patternToFunction(getPattern(arguments));

     args.push(function(filename,stats,next){
         if(test(filename)){
             findOne.apply(this,arguments);
         }else{
             next();
         }
     })
     args.push(callback);

     return exports.eachFile.apply(this,args);
 }
 /**
  * 仅遍历目录下指定规则的所有目录
  *
  * @param {String} dir
  * @param {RegExp|Function} pattern
  * @param {Number} thread_num  (optional)
  * @param {Function} callback
  */
 exports.eachDirFilter=function(){
     var args = getEachArguments(arguments);
     var findOne = getFindOne(arguments);
     var callback = getCallback(arguments);
     var test=patternToFunction(getPattern(arguments));

     args.push(function(filename,stats,next){
         if(test(filename)){
             findOne.apply(this,arguments);
         }else{
             next();
         }
     })
     args.push(callback);

     return exports.eachDir.apply(this,args);
 }

// -----------------------------------------------------------------------------

/**
 * 列出目录下的所有文件和目录
 * @param {String} dir
 * @param {Number} thread_num
 * @param {Function} callback
 */
 exports.read=function(dir,callback){
     var thread_num;
     if(arguments.length<2) return callback(new TypeError('Bad arguments number'));
     if(arguments.length==2){
         thread_num=THREAD_NUM;
         callback=arguments[1];
     }else{
         thread_num=arguments[1];
         callback=arguments[2];
     }

     if(thread_num<=0)return callback(new TypeError('The argument "thread_num" must be number and greater than 0'));
     if(typeof callback!=='function') return callback(new TypeError('Then argument "callback" must be a function'));

     var files=[];
     eachFile(path.resolve(dir),thread_num,function(filename,stats,next){
         files.push(filename);
         next();
     },function(err){
         callback(err,files);
     })
 }
/**
* 遍历目录下指定规则的所有文件和目录
*
* @param {String} dir
* @param {RegExp|Function} pattern
* @param {Number} thread_num  (optional)
* @param {Function} callback
*/
exports.readFilter=function(){
    var args = getEachArguments(arguments);
    var callback = getCallback(arguments);
    var test=patternToFunction(getPattern(arguments));
    var files=[];
    args.push(function(filename,stats,next){
        if(test(filename)){
            files.push(filename);
        }
        next();
    })
    args.push(function (err) {
      	callback(err, files);
    });

    return exports.each.apply(this,args);
}
/**
 * 列出目录下所有文件
 *
 * @param {String} dir
 * @param {Number} thread_num  (optional)
 * @param {Function} callback
 */
exports.readFile=function(){
    var args = getEachArguments(arguments);
    var callback = getCallback(arguments);
    var files=[];
    args.push(function(filename,stats,next){
        files.push(filename);
        next();
    })
    args.push(function (err) {
      	callback(err, files);
    });

    return exports.eachFile.apply(this,args);
}
/**
 * 列出目录下所有目录
 *
 * @param {String} dir
 * @param {Number} thread_num  (optional)
 * @param {Function} callback
 */
 exports.readDir=function(){
     var args = getEachArguments(arguments);
     var callback = getCallback(arguments);
     var files=[];
     args.push(function(filename,stats,next){
         files.push(filename);
         next();
     })
     args.push(function (err) {
       	callback(err, files);
     });

     return exports.eachDir.apply(this,args);
 }
 /**
  * 列出目录下指定规则的所有文件
  *
  * @param {String} dir
  * @param {RegExp|Function} pattern
  * @param {Number} thread_num  (optional)
  * @param {Function} callback
  */
exports.readFileFilter=function(){
    var args = getEachArguments(arguments);
    var callback = getCallback(arguments);
    var test=patternToFunction(getPattern(arguments));
    var files=[];
    args.push(function(filename,stats,next){
        if(test(filename)){
            files.push(filename);
        }
        next();
    })
    args.push(function (err) {
      	callback(err, files);
    });

    return exports.eachFile.apply(this,args);
}
/**
 * 列出目录下指定规则的所有目录
 *
 * @param {String} dir
 * @param {RegExp|Function} pattern
 * @param {Number} thread_num  (optional)
 * @param {Function} callback
 */
exports.readDirFilter=function(){
    var args = getEachArguments(arguments);
    var callback = getCallback(arguments);
    var test=patternToFunction(getPattern(arguments));
    var files=[];
    args.push(function(filename,stats,next){
        if(test(filename)){
            files.push(filename);
        }
        next();
    })
    args.push(function (err) {
      	callback(err, files);
    });

    return exports.eachDir.apply(this,args);
}
