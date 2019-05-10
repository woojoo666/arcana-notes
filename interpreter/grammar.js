// Generated automatically by nearley, version 2.16.0
// http://github.com/Hardmath123/nearley
(function () {
function id(x) { return x[0]; }

const lexerWrapper = (typeof module === 'object' && module.exports)
						? require('./lexerWrapper.js')
						: window.lexerWrapper;
console.log(lexerWrapper);
var grammar = {
    Lexer: lexerWrapper,
    ParserRules: [
    {"name": "Block$ebnf$1", "symbols": ["Params"], "postprocess": id},
    {"name": "Block$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "Block$ebnf$2", "symbols": []},
    {"name": "Block$ebnf$2$subexpression$1$subexpression$1", "symbols": [{"literal":","}]},
    {"name": "Block$ebnf$2$subexpression$1$subexpression$1", "symbols": [{"literal":"\n"}]},
    {"name": "Block$ebnf$2$subexpression$1", "symbols": ["Statement", "Block$ebnf$2$subexpression$1$subexpression$1"]},
    {"name": "Block$ebnf$2", "symbols": ["Block$ebnf$2", "Block$ebnf$2$subexpression$1"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "Block$ebnf$3", "symbols": ["Statement"], "postprocess": id},
    {"name": "Block$ebnf$3", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "Block", "symbols": ["Block$ebnf$1", "Block$ebnf$2", "Block$ebnf$3"]},
    {"name": "Params", "symbols": ["VarList", {"literal":">>"}]},
    {"name": "VarList$ebnf$1", "symbols": []},
    {"name": "VarList$ebnf$1$subexpression$1$ebnf$1", "symbols": [{"literal":","}], "postprocess": id},
    {"name": "VarList$ebnf$1$subexpression$1$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "VarList$ebnf$1$subexpression$1", "symbols": [(lexerWrapper.has("identifier") ? {type: "identifier"} : identifier), "VarList$ebnf$1$subexpression$1$ebnf$1"]},
    {"name": "VarList$ebnf$1", "symbols": ["VarList$ebnf$1", "VarList$ebnf$1$subexpression$1"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "VarList", "symbols": ["VarList$ebnf$1", (lexerWrapper.has("identifier") ? {type: "identifier"} : identifier)]},
    {"name": "Statement", "symbols": [(lexerWrapper.has("identifier") ? {type: "identifier"} : identifier), {"literal":":"}, "Expression"]},
    {"name": "Statement", "symbols": [{"literal":"["}, (lexerWrapper.has("identifier") ? {type: "identifier"} : identifier), {"literal":"]"}, {"literal":":"}, "Expression"]},
    {"name": "Statement$ebnf$1", "symbols": ["SpacedItem"]},
    {"name": "Statement$ebnf$1", "symbols": ["Statement$ebnf$1", "SpacedItem"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "Statement", "symbols": ["Statement$ebnf$1"]},
    {"name": "Statement", "symbols": ["SpacedUnary"]},
    {"name": "Statement", "symbols": [{"literal":"tag"}, (lexerWrapper.has("tag") ? {type: "tag"} : tag)]},
    {"name": "Statement", "symbols": ["Object", (lexerWrapper.has("propAccess") ? {type: "propAccess"} : propAccess), (lexerWrapper.has("tag") ? {type: "tag"} : tag), {"literal":":"}, "Expression"]},
    {"name": "Statement", "symbols": ["Object", {"literal":"<:"}, "Expression"]},
    {"name": "Statement$ebnf$2$subexpression$1", "symbols": [{"literal":"else"}, "BracedBlock"]},
    {"name": "Statement$ebnf$2", "symbols": ["Statement$ebnf$2$subexpression$1"], "postprocess": id},
    {"name": "Statement$ebnf$2", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "Statement", "symbols": [{"literal":"if"}, "Expression", {"literal":":"}, "BracedBlock", "Statement$ebnf$2"]},
    {"name": "Statement", "symbols": [{"literal":"for"}, "VarList", {"literal":"in"}, "Expression", {"literal":":"}, "BracedBlock"]},
    {"name": "Statement", "symbols": [{"literal":"=>"}, "Expression"]},
    {"name": "BracedBlock", "symbols": [{"literal":"("}, "Block", {"literal":")"}], "postprocess": d => d[1]},
    {"name": "BracedBlock", "symbols": [{"literal":"{"}, "Block", {"literal":"}"}], "postprocess": d => d[1]},
    {"name": "SpacedItem", "symbols": ["Ternary"]},
    {"name": "SpacedItem", "symbols": [(lexerWrapper.has("identifier") ? {type: "identifier"} : identifier), (lexerWrapper.has("period") ? {type: "period"} : period)]},
    {"name": "SpacedItem", "symbols": [(lexerWrapper.has("identifier") ? {type: "identifier"} : identifier), {"literal":"^^"}]},
    {"name": "SpacedItem$subexpression$1", "symbols": [{"literal":"..."}]},
    {"name": "SpacedItem$subexpression$1", "symbols": [{"literal":"…"}]},
    {"name": "SpacedItem", "symbols": ["SpacedItem$subexpression$1", "Object"]},
    {"name": "Expression", "symbols": ["Ternary"]},
    {"name": "Expression", "symbols": ["SpacedUnary"]},
    {"name": "Ternary", "symbols": ["Or", {"literal":"?"}, "Ternary", {"literal":"else"}, "Ternary"]},
    {"name": "Ternary", "symbols": ["Or"]},
    {"name": "Or", "symbols": ["Or", {"literal":"|"}, "And"]},
    {"name": "Or", "symbols": ["And"]},
    {"name": "And", "symbols": ["And", {"literal":"&"}, "Eq"]},
    {"name": "And", "symbols": ["Eq"]},
    {"name": "Eq$subexpression$1", "symbols": [{"literal":"=="}]},
    {"name": "Eq$subexpression$1", "symbols": [{"literal":"="}]},
    {"name": "Eq$subexpression$1", "symbols": [{"literal":"!=="}]},
    {"name": "Eq$subexpression$1", "symbols": [{"literal":"!="}]},
    {"name": "Eq", "symbols": ["Eq", "Eq$subexpression$1", "Compare"]},
    {"name": "Eq", "symbols": ["Compare"]},
    {"name": "Compare$subexpression$1", "symbols": [{"literal":"<="}]},
    {"name": "Compare$subexpression$1", "symbols": [{"literal":">="}]},
    {"name": "Compare$subexpression$1", "symbols": [{"literal":"<"}]},
    {"name": "Compare$subexpression$1", "symbols": [{"literal":">"}]},
    {"name": "Compare", "symbols": ["Compare", "Compare$subexpression$1", "Sum"]},
    {"name": "Compare", "symbols": ["Sum"]},
    {"name": "Sum$subexpression$1", "symbols": [{"literal":"+"}]},
    {"name": "Sum$subexpression$1", "symbols": [{"literal":"-"}]},
    {"name": "Sum", "symbols": ["Sum", "Sum$subexpression$1", "Product"]},
    {"name": "Sum", "symbols": ["Product"]},
    {"name": "Product$subexpression$1", "symbols": [{"literal":"*"}]},
    {"name": "Product$subexpression$1", "symbols": [{"literal":"/"}]},
    {"name": "Product$subexpression$1", "symbols": [{"literal":"%"}]},
    {"name": "Product", "symbols": ["Product", "Product$subexpression$1", "Exp"]},
    {"name": "Product", "symbols": ["Exp"]},
    {"name": "Exp", "symbols": ["Unary", {"literal":"**"}, "Exp"]},
    {"name": "Exp", "symbols": ["Unary"]},
    {"name": "Unary", "symbols": [(lexerWrapper.has("unary_op") ? {type: "unary_op"} : unary_op), "Unary"]},
    {"name": "Unary", "symbols": ["Object"]},
    {"name": "SpacedUnary$ebnf$1", "symbols": []},
    {"name": "SpacedUnary$ebnf$1", "symbols": ["SpacedUnary$ebnf$1", (lexerWrapper.has("unary_op") ? {type: "unary_op"} : unary_op)], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "SpacedUnary$ebnf$2", "symbols": []},
    {"name": "SpacedUnary$ebnf$2", "symbols": ["SpacedUnary$ebnf$2", (lexerWrapper.has("unary_op") ? {type: "unary_op"} : unary_op)], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "SpacedUnary", "symbols": ["SpacedUnary$ebnf$1", (lexerWrapper.has("spaced_unary") ? {type: "spaced_unary"} : spaced_unary), "SpacedUnary$ebnf$2", "Object"]},
    {"name": "Object", "symbols": [{"literal":"("}, "Block", {"literal":")"}]},
    {"name": "Object$ebnf$1", "symbols": [{"literal":"template"}], "postprocess": id},
    {"name": "Object$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "Object$ebnf$2", "symbols": ["Params"], "postprocess": id},
    {"name": "Object$ebnf$2", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "Object", "symbols": ["Object$ebnf$1", "Object$ebnf$2", {"literal":"{"}, "Block", {"literal":"}"}]},
    {"name": "Object", "symbols": ["Object", {"literal":"("}, "Block", {"literal":")"}]},
    {"name": "Object", "symbols": ["Object", {"literal":"("}, "Block", {"literal":")"}, {"literal":"->"}]},
    {"name": "Object$ebnf$3", "symbols": [{"literal":"template"}], "postprocess": id},
    {"name": "Object$ebnf$3", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "Object", "symbols": ["Object", "Object$ebnf$3", {"literal":"{"}, "Block", {"literal":"}"}]},
    {"name": "Object", "symbols": ["Object", (lexerWrapper.has("propAccess") ? {type: "propAccess"} : propAccess), (lexerWrapper.has("identifier") ? {type: "identifier"} : identifier)]},
    {"name": "Object", "symbols": ["Object", (lexerWrapper.has("propAccess") ? {type: "propAccess"} : propAccess), (lexerWrapper.has("tag") ? {type: "tag"} : tag)]},
    {"name": "Object", "symbols": ["Object", {"literal":"["}, "Block", {"literal":"]"}]},
    {"name": "Object", "symbols": [{"literal":"..."}]},
    {"name": "Object", "symbols": [(lexerWrapper.has("identifier") ? {type: "identifier"} : identifier)]},
    {"name": "Object", "symbols": [(lexerWrapper.has("string") ? {type: "string"} : string)]},
    {"name": "Object", "symbols": [(lexerWrapper.has("number") ? {type: "number"} : number)]}
]
  , ParserStart: "Block"
}
if (typeof module !== 'undefined'&& typeof module.exports !== 'undefined') {
   module.exports = grammar;
} else {
   window.grammar = grammar;
}
})();
