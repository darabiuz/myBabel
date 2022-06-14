// 需求改动3：从参数中插入变成了在当前 console.xx 的AST之前插入一个 console.log 的 AST，整体流程还是一样。创建这种较复杂的 AST，我们可以使用 @babel/template包。
// generator改进版

const parser = require('@babel/parser')
const traverse = require('@babel/traverse').default
const generate = require('@babel/generator').default
const types = require('@babel/types')
const template = require('@babel/template')

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

const targetCallName = ['log', 'debug', 'info', 'error'].map(item => `console.${item}`)

// 1. 转换成ast树
const ast = parser.parse(sourceCode, {
    sourceType: 'unambiguous',   //根据内容是否有 import 和 export 来确定是否解析 es module 语法。
    plugins: ['jsx']  //因为源代码部分有jsx
})

// 开始遍历，当遇到callExpression的时候调用visitor
traverse(ast, {
    /**
     * 插入 AST 可以使用 path.insertBefore 的 api， 
     * 而替换整体节点用 path.replaceWith， 
     * 判断是 insertBefore 还是 replaceWith 
     * 要看当前节点是否在 JSXElement 之下，
     * 所以要用path.findParent 方法顺着 path 查找
     * 是否有 JSXElement 节点。
     * replace 的新节点要调用 path.skip 跳过后续遍历。
     * 要跳过新的节点的处理，就需要在节点上加一个标记，如果有这个标记的就跳过。
     */
    CallExpression(path, state) {
        if (path.node.isNew) {//replace 的新节点要调用 path.skip 跳过后续遍历。
            return;
        }
        const calleeName = generate(path.node.callee).code  //使用generator直接把ast变成代码进行比对
        if (targetCallName.includes(calleeName)) {
            const { line, column } = path.node.loc.start;
            const newNode = template.expression(`console.log("filename: (${line}, ${column})")`)();
            newNode.isNew = true;
            if (path.findParent(path => path.isJSXElement())) {
                path.replaceWith(types.arrayExpression([newNode, path.node]))
                path.skip();
            } else {
                path.insertBefore(newNode);
            }
        }
    }
})

// 把ast重新转化为代码字符，并且生成sourcemap
const { code, map } = generate(ast)
console.log(code);