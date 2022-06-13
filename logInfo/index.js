const parser = require('@babel/parser')
const traverse = require('@babel/traverse').default
const generate = require('@babel/generator').default
const types = require('@babel/types')

const sourceCode = `
    console.log(1);
    function func() {
        console.info(2);
    }
    export default class Clazz {
        say() {
            console.debug(3);
        }
        render() {
            return <div>{console.error(4)}</div>
        }
    }
`

// 1. 转换成ast树
const ast = parser.parse(sourceCode, {
    sourceType: 'unambiguous',   //根据内容是否有 import 和 export 来确定是否解析 es module 语法。
    plugins: ['jsx']  //因为源代码部分有jsx
})

// 开始遍历，当遇到callExpression的时候调用visitor
traverse(ast, {
    // 当遇到函数表达式的时候
    CallExpression(path, state) {
        if (types.isMemberExpression(path.node.callee)  //属于调用对象中的属性
            && path.node.callee.object.name === 'console'  //调用的函数名是console
            && ['log', 'info', 'error', 'debug'].includes(path.node.callee.property.name)   //console对象里面的任何一个方法都算
        ) {
            const { line, column } = path.node.loc.start;   //获得行列号
            path.node.arguments.unshift(types.stringLiteral(`filename: (${line}, ${column})`))   //行列号从 AST 的公共属性 loc 上取。(log的参数里面加上行列号，不就打印出来了吗)
        }
    }
})

// 把ast重新转化为代码字符，并且生成sourcemap
const { code, map } = generate(ast)
console.log(code);