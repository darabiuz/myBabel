// 把上面的功能改造为一个插件，babel支持transform插件，形式是函数返回一个对象，对象有visitor属性

const { declare } = require('@babel/helper-plugin-utils');
/**
 * 
 * @param {*} api 第一个参数可以拿到 types、template 等常用包的 api，不需要单独引入这些包。
 * @param {*} options 
 * @returns 
 */
const targetCalleeName = ['log', 'info', 'error', 'debug'].map(item => `console.${item}`);
module.exports = function ({ types, template }, options, dirname) {
    return {
        /**
         * 作为插件用的时候，并不需要自己调用 parse转换源代码、traverse、generate转回代码字符，只需要提供一个 visitor 函数，在这个函数内完成转换功能。
         */
        visitor: {
            CallExpression(path, state) { //state 中可以拿到用户配置信息 options 和 file 信息，filename 就可以通过 state.filename 来取。
                if (path.node.isNew) {
                    return;
                }
                const calleeName = path.get('callee').toString();
                if (targetCalleeName.includes(calleeName)) {
                    const { line, column } = path.node.loc.start;
                    const newNode = template.expression(`console.log("${state.filename || 'unkown filename'}: (${line}, ${column})")`)();
                    newNode.isNew = true;

                    if (path.findParent(path => path.isJSXElement())) {
                        path.replaceWith(types.arrayExpression([newNode, path.node]))
                        path.skip();
                    } else {
                        path.insertBefore(newNode);
                    }
                }
            }
        }
    }
}