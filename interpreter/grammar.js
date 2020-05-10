// Generated automatically by nearley, version 2.19.3
// http://github.com/Hardmath123/nearley
function id(x) { return x[0]; }

const lexerWrapper = (typeof module === 'object' && module.exports)
						? require('./lexerWrapper.js')
						: window.lexerWrapper;
let Lexer = lexerWrapper;
let ParserRules = [
    {"name": "Block$ebnf$1", "symbols": ["Params"], "postprocess": id},
    {"name": "Block$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "Block$ebnf$2", "symbols": []},
    {"name": "Block$ebnf$2$subexpression$1$subexpression$1", "symbols": [{"literal":","}]},
    {"name": "Block$ebnf$2$subexpression$1$subexpression$1", "symbols": [{"literal":"\n"}]},
    {"name": "Block$ebnf$2$subexpression$1", "symbols": ["Statement", "Block$ebnf$2$subexpression$1$subexpression$1"]},
    {"name": "Block$ebnf$2", "symbols": ["Block$ebnf$2", "Block$ebnf$2$subexpression$1"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "Block$ebnf$3", "symbols": ["Statement"], "postprocess": id},
    {"name": "Block$ebnf$3", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "Block", "symbols": ["Block$ebnf$1", "Block$ebnf$2", "Block$ebnf$3"], "postprocess": ([parameters,middle,last]) => ({type:'block', parameters, statements: last ? [...middle.map(x=>x[0]),last] : middle.map(x=>x[0])})},
    {"name": "Params", "symbols": ["VarList", {"literal":">>"}], "postprocess": ([varlist]) => varlist},
    {"name": "VarList$ebnf$1", "symbols": []},
    {"name": "VarList$ebnf$1$subexpression$1$ebnf$1", "symbols": [{"literal":","}], "postprocess": id},
    {"name": "VarList$ebnf$1$subexpression$1$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "VarList$ebnf$1$subexpression$1", "symbols": [(lexerWrapper.has("identifier") ? {type: "identifier"} : identifier), "VarList$ebnf$1$subexpression$1$ebnf$1"]},
    {"name": "VarList$ebnf$1", "symbols": ["VarList$ebnf$1", "VarList$ebnf$1$subexpression$1"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "VarList", "symbols": ["VarList$ebnf$1", (lexerWrapper.has("identifier") ? {type: "identifier"} : identifier)], "postprocess": ([middle,last]) => [...middle.map(([x])=>x.value),last.value]},
    {"name": "Statement", "symbols": [(lexerWrapper.has("identifier") ? {type: "identifier"} : identifier), {"literal":":"}, "Expression"], "postprocess": ([token, ,value]) => ({type:'property', key: token.value, value})},
    {"name": "Statement", "symbols": [(lexerWrapper.has("number") ? {type: "number"} : number), {"literal":":"}, "Expression"], "postprocess": ([token, ,value]) => ({type:'property', key: token.value, value, keyType: 'number'})},
    {"name": "Statement", "symbols": [(lexerWrapper.has("boolean") ? {type: "boolean"} : boolean), {"literal":":"}, "Expression"], "postprocess": ([token, ,value]) => ({type:'property', key: token.value, value, keyType: 'boolean'})},
    {"name": "Statement", "symbols": [{"literal":"["}, (lexerWrapper.has("identifier") ? {type: "identifier"} : identifier), {"literal":"]"}, {"literal":":"}, "Expression"]},
    {"name": "Statement$ebnf$1", "symbols": ["SpacedItem"]},
    {"name": "Statement$ebnf$1", "symbols": ["Statement$ebnf$1", "SpacedItem"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "Statement", "symbols": ["Statement$ebnf$1"], "postprocess": ([items]) => ({type:'subList', items})},
    {"name": "Statement", "symbols": ["SpacedUnary"]},
    {"name": "Statement", "symbols": [{"literal":"tag"}, (lexerWrapper.has("tag") ? {type: "tag"} : tag)]},
    {"name": "Statement", "symbols": ["Object", (lexerWrapper.has("propAccess") ? {type: "propAccess"} : propAccess), (lexerWrapper.has("tag") ? {type: "tag"} : tag), {"literal":":"}, "Expression"]},
    {"name": "Statement", "symbols": ["Object", {"literal":"<:"}, "Expression"], "postprocess": ([target, ,value]) => ({type:'insertion', target, value})},
    {"name": "Statement$ebnf$2$subexpression$1", "symbols": [{"literal":"else"}, "BracedBlock"]},
    {"name": "Statement$ebnf$2", "symbols": ["Statement$ebnf$2$subexpression$1"], "postprocess": id},
    {"name": "Statement$ebnf$2", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "Statement", "symbols": [{"literal":"if"}, "Expression", {"literal":":"}, "BracedBlock", "Statement$ebnf$2"]},
    {"name": "Statement", "symbols": [{"literal":"for"}, "VarList", {"literal":"in"}, "Expression", {"literal":":"}, "BracedBlock"]},
    {"name": "Statement", "symbols": [{"literal":"=>"}, "Expression"], "postprocess": ([ ,value]) => ({type:'property', key: '_return', value})},
    {"name": "BracedBlock", "symbols": [{"literal":"("}, "Block", {"literal":")"}], "postprocess": d => d[1]},
    {"name": "BracedBlock", "symbols": [{"literal":"{"}, "Block", {"literal":"}"}], "postprocess": d => d[1]},
    {"name": "SpacedItem", "symbols": ["Ternary"]},
    {"name": "SpacedItem", "symbols": [(lexerWrapper.has("identifier") ? {type: "identifier"} : identifier), (lexerWrapper.has("period") ? {type: "period"} : period)]},
    {"name": "SpacedItem", "symbols": [(lexerWrapper.has("identifier") ? {type: "identifier"} : identifier), {"literal":"^^"}]},
    {"name": "SpacedItem$subexpression$1", "symbols": [{"literal":"..."}]},
    {"name": "SpacedItem$subexpression$1", "symbols": [{"literal":"…"}]},
    {"name": "SpacedItem", "symbols": ["SpacedItem$subexpression$1", "Object"]},
    {"name": "Expression", "symbols": ["Ternary"], "postprocess": id},
    {"name": "Expression", "symbols": ["SpacedUnary"], "postprocess": id},
    {"name": "Ternary", "symbols": ["Or", {"literal":"?"}, "Ternary", {"literal":"else"}, "Ternary"], "postprocess": ([condition, ,trueBranch, ,falseBranch]) => ({type:'ternary',condition,trueBranch,falseBranch})},
    {"name": "Ternary", "symbols": ["Or"], "postprocess": id},
    {"name": "Or", "symbols": ["Or", {"literal":"|"}, "And"], "postprocess": ([left,op,right]) => ({type:'binop',operator: op[0].value,left,right})},
    {"name": "Or", "symbols": ["And"], "postprocess": id},
    {"name": "And", "symbols": ["And", {"literal":"&"}, "Eq"], "postprocess": ([left,op,right]) => ({type:'binop',operator: op[0].value,left,right})},
    {"name": "And", "symbols": ["Eq"], "postprocess": id},
    {"name": "Eq$subexpression$1", "symbols": [{"literal":"=="}]},
    {"name": "Eq$subexpression$1", "symbols": [{"literal":"="}]},
    {"name": "Eq$subexpression$1", "symbols": [{"literal":"!=="}]},
    {"name": "Eq$subexpression$1", "symbols": [{"literal":"!="}]},
    {"name": "Eq", "symbols": ["Eq", "Eq$subexpression$1", "Compare"], "postprocess": ([left,op,right]) => ({type:'binop',operator: op[0].value,left,right})},
    {"name": "Eq", "symbols": ["Compare"], "postprocess": id},
    {"name": "Compare$subexpression$1", "symbols": [{"literal":"<="}]},
    {"name": "Compare$subexpression$1", "symbols": [{"literal":">="}]},
    {"name": "Compare$subexpression$1", "symbols": [{"literal":"<"}]},
    {"name": "Compare$subexpression$1", "symbols": [{"literal":">"}]},
    {"name": "Compare", "symbols": ["Compare", "Compare$subexpression$1", "Sum"], "postprocess": ([left,op,right]) => ({type:'binop',operator: op[0].value,left,right})},
    {"name": "Compare", "symbols": ["Sum"], "postprocess": id},
    {"name": "Sum$subexpression$1", "symbols": [{"literal":"+"}]},
    {"name": "Sum$subexpression$1", "symbols": [{"literal":"-"}]},
    {"name": "Sum", "symbols": ["Sum", "Sum$subexpression$1", "Product"], "postprocess": ([left,op,right]) => ({type:'binop',operator: op[0].value,left,right})},
    {"name": "Sum", "symbols": ["Product"], "postprocess": id},
    {"name": "Product$subexpression$1", "symbols": [{"literal":"*"}]},
    {"name": "Product$subexpression$1", "symbols": [{"literal":"/"}]},
    {"name": "Product$subexpression$1", "symbols": [{"literal":"%"}]},
    {"name": "Product", "symbols": ["Product", "Product$subexpression$1", "Exp"], "postprocess": ([left,op,right]) => ({type:'binop',operator: op[0].value,left,right})},
    {"name": "Product", "symbols": ["Exp"], "postprocess": id},
    {"name": "Exp", "symbols": ["Unary", {"literal":"**"}, "Exp"], "postprocess": ([left,op,right]) => ({type:'binop',operator: op[0].value,left,right})},
    {"name": "Exp", "symbols": ["Unary"], "postprocess": id},
    {"name": "Unary", "symbols": [(lexerWrapper.has("unary_op") ? {type: "unary_op"} : unary_op), "Unary"], "postprocess": ([op,value]) => ({type:'unaryop',operator: op.value,value})},
    {"name": "Unary", "symbols": ["Object"], "postprocess": id},
    {"name": "SpacedUnary$ebnf$1", "symbols": []},
    {"name": "SpacedUnary$ebnf$1", "symbols": ["SpacedUnary$ebnf$1", (lexerWrapper.has("unary_op") ? {type: "unary_op"} : unary_op)], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "SpacedUnary$ebnf$2", "symbols": []},
    {"name": "SpacedUnary$ebnf$2", "symbols": ["SpacedUnary$ebnf$2", (lexerWrapper.has("unary_op") ? {type: "unary_op"} : unary_op)], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "SpacedUnary", "symbols": ["SpacedUnary$ebnf$1", (lexerWrapper.has("spaced_unary") ? {type: "spaced_unary"} : spaced_unary), "SpacedUnary$ebnf$2", "Object"]},
    {"name": "Object", "symbols": [{"literal":"("}, "Block", {"literal":")"}], "postprocess": ([ ,block, ]) => ({type:'create',block})},
    {"name": "Object$ebnf$1", "symbols": [{"literal":"template"}], "postprocess": id},
    {"name": "Object$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "Object$ebnf$2", "symbols": ["Params"], "postprocess": id},
    {"name": "Object$ebnf$2", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "Object", "symbols": ["Object$ebnf$1", "Object$ebnf$2", {"literal":"{"}, "Block", {"literal":"}"}], "postprocess": ([templ,parameters, ,block, ]) => ({type:'create',block,template: !!templ,parameters})},
    {"name": "Object", "symbols": ["Object", {"literal":"("}, "Block", {"literal":")"}], "postprocess": ([source, ,block, ]) => ({type:'clone',source,block})},
    {"name": "Object$ebnf$3", "symbols": [{"literal":"template"}], "postprocess": id},
    {"name": "Object$ebnf$3", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "Object", "symbols": ["Object", "Object$ebnf$3", {"literal":"{"}, "Block", {"literal":"}"}], "postprocess": ([source,templ, ,block, ]) => ({type:'clone',source,block,template: !!templ})},
    {"name": "Object", "symbols": ["Object", {"literal":"->"}], "postprocess": ([source]) => ({type:'callResult',source})},
    {"name": "Object", "symbols": ["Object", (lexerWrapper.has("propAccess") ? {type: "propAccess"} : propAccess), (lexerWrapper.has("identifier") ? {type: "identifier"} : identifier)], "postprocess": ([source, ,token]) => ({type:'memberAccess',source,key:token.value})},
    {"name": "Object", "symbols": ["Object", (lexerWrapper.has("propAccess") ? {type: "propAccess"} : propAccess), (lexerWrapper.has("tag") ? {type: "tag"} : tag)]},
    {"name": "Object", "symbols": ["Object", {"literal":"["}, "Expression", {"literal":"]"}], "postprocess": ([source, ,key, ]) => ({type:'memberAccess',source,key})},
    {"name": "Object", "symbols": [{"literal":"..."}]},
    {"name": "Object", "symbols": [{"literal":"collector"}], "postprocess": ([token]) => ({type:'collector'})},
    {"name": "Object", "symbols": [(lexerWrapper.has("identifier") ? {type: "identifier"} : identifier)], "postprocess": ([token]) => ({type:'reference', name: token.value})},
    {"name": "Object", "symbols": [(lexerWrapper.has("string") ? {type: "string"} : string)], "postprocess": ([token]) => ({type:'string', value: token.value})},
    {"name": "Object", "symbols": [(lexerWrapper.has("number") ? {type: "number"} : number)], "postprocess": ([token]) => ({type:'number', value: token.value})},
    {"name": "Object", "symbols": [(lexerWrapper.has("boolean") ? {type: "boolean"} : boolean)], "postprocess": ([token]) => ({type:'boolean', value: token.value})}
];
let ParserStart = "Block";
export default { Lexer, ParserRules, ParserStart };
