// Generated automatically by nearley, version 2.16.0
// http://github.com/Hardmath123/nearley
(function () {
function id(x) { return x[0]; }
var grammar = {
    Lexer: undefined,
    ParserRules: [
    {"name": "Block", "symbols": ["Prop", {"literal":","}, "Block"], "postprocess": d => [d[0], ...d[2]]},
    {"name": "Block$ebnf$1", "symbols": ["Prop"], "postprocess": id},
    {"name": "Block$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "Block", "symbols": ["Block$ebnf$1"], "postprocess": d => d[0] ? d : []},
    {"name": "Prop", "symbols": ["Key", {"literal":":"}, "Val"], "postprocess": d => ({type:'property', key: d[0], val: d[2]})},
    {"name": "Key$ebnf$1", "symbols": [/[a-z]/]},
    {"name": "Key$ebnf$1", "symbols": ["Key$ebnf$1", /[a-z]/], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "Key", "symbols": ["Key$ebnf$1"], "postprocess": d => d[0].join("")},
    {"name": "Val$ebnf$1", "symbols": [/[a-z]/]},
    {"name": "Val$ebnf$1", "symbols": ["Val$ebnf$1", /[a-z]/], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "Val", "symbols": ["Val$ebnf$1"], "postprocess": d => d[0].join("")},
    {"name": "Val", "symbols": [{"literal":"("}, "Block", {"literal":")"}], "postprocess": d => d[1]}
]
  , ParserStart: "Block"
}
if (typeof module !== 'undefined'&& typeof module.exports !== 'undefined') {
   module.exports = grammar;
} else {
   window.grammar = grammar;
}
})();
