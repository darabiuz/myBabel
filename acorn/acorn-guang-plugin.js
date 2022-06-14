/**
 * 写一个自己的acorn扩展插件，为了实现功能：给 javascript 一个关键字 guang，可以作为 statement 单独使用
 * 
 */
const acorn = require('acorn')
const Parser = acorn.Parser
const tt = acorn.tokTypes
const TokenType = acorn.TokenType


//2. 注册一个新的 token 类型来标识这个新的关键字，这样 acorn 就会在 parse 的时候分出 guang 这个关键字
Parser.acorn.keywordTypes["guang"] = new TokenType("guang", { keyword: "guang" });

/*
 * 自己写一个acorn插件，,扩展插件就是继承这个Parser类，重写一些方法
 * parse的过程就是分词+组装AST（词法语法分析)，只需要实现这两步就可以了 
 */

module.exports = function (Parser) {
    return class extends Parser {
        /**
         * 1. 分词，acorn parser的入口方法是parse，所以需要在这里面设置关键字
         * acorn有keywords属性，是一个正则表达式，用来做关键字拆分，所以我们需要重写keywords属性
         * 并且为新的关键字“guang”注册一个token类型
         */
        parse(program) {
            var newKeywords = "break case catch continue debugger default do else finally for function if return switch throw try var while with null true false instanceof typeof void delete new in this const class extends export import super";
            newKeywords += " guang";// 增加一个关键字
            this.keywords = new RegExp("^(?:" + newKeywords.replace(/ /g, "|") + ")$")

            return (super.parse(program));
        }
        /**
         * 3. 光分出token没用，还需要组装到ast当中
         * acorn在parse到不同类型的节点会调用不同的parseXXX方法，所以这里我们需要重写parseStatement 方法
         * 在里面组装新的statement节点
         */
        parseStatement(context, topLevel, exports) {
            var starttype = this.type;  //当前处理到的token的类型
            if (starttype == Parser.acorn.keywordTypes["guang"]) {
                var node = this.startNode()  //创建一个新的ast节点
                return this.parseGuangStatement(node)
            } else {
                return (super.parseStatement(context, topLevel, exports))  //如果不是我们扩展的 token，则调用父类的 parseStatement 处理。
            }
        }
        parseGuangStatement(node) {
            this.next()  //消费这个token，识别到token类型为guang就组装成一个ast
            return this.finishNode({ value: 'guang' }, 'GuangStatement');//新增加的ssh语句
        };
    }
}

