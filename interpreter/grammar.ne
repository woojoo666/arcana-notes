Block -> Prop "," Block          {% d => [d[0], ...d[2]] %}  # flattens the tree of arrays
	| Prop:?                      {% d => d[0] ? d : [] %}   # if empty, return empty array
Prop -> Key ":" Val              {% d => ({type:'property', key: d[0], val: d[2]}) %}
Key -> [a-z]:+                   {% d => d[0].join("") %}
Val -> [a-z]:+                   {% d => d[0].join("") %}
	| "(" Block ")"               {% d => d[1] %}
	| "{" Block "}"               {% d => d[1] %}            # "{" and "}" are for indented blocks
