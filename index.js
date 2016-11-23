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
                // 如果为目录，则接续列出该目录下的所有文件
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
                        eachFile(f,findOne,function(err){
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
