const babel = require('@babel/core')
// transformSync函数的第一个参数是需要转换的代码，
// 第二个参数为可选参数，用于设定babel的配置（configuration）。
// 返回一个promise对象，包含生成的代码、源映射和 AST 
const code = "code()"
let optionsObject = {}
let res = babel.transformAsync(code, optionsObject)
res.then(data => {
    console.log(data.code);
})