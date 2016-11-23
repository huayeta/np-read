# np-read
* `each` 遍历目录里面的所有文件和目录 `function(dir[,thread_num],findOne(filename,stats,next),callback(error))`
* `eachFilter` 仅遍历目录下指定规则的所有文件和目录 `function(dir,RegExp,findOne(filename,stats,next),callback(error))`
* `eachFile` 仅遍历目录下的所有文件 `function(dir[,thread_num],findOne(filename,stats,next),callback(error))`
* `eachDir` 仅遍历目录下的所有目录 `function(dir[,thread_num],findOne(filename,stats,next),callback(error))`
* `eachFileFilter` 仅遍历目录下指定规则的所有文件 `function(dir,RegExp,[,thread_num],findOne(filename,stats,next),callback(error))`
* `eachDirFilter` 仅遍历目录下指定规则的所有目录 `function(dir,RegExp,[,thread_num],findOne(filename,stats,next),callback(error))`
* `read` 列出目录下的所有文件和目录 `function(dir[,thread_num],callback(error,files))`
* `readFilter` 列出目录下指定规则的所有文件和目录 `function(dir,RegExp,[,thread_num],callback(error,files))`
* `readFile` 列出目录下所有文件 `function(dir[,thread_num],callback(error,files))`
* `readDir` 列出目录下所有目录 `function(dir[,thread_num],callback(error,files))`
* `readFileFilter` 列出目录下指定规则的所有文件 `function(dir,RegExp[,thread_num],callback(error,files))`
* `readDirFilter` 列出目录下指定规则的所有目录 `function(dir,RegExp[,thread_num],callback(error,files))`
