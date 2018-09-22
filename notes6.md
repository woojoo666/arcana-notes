
now the concept of functions is pretty much finalized and decided on (see notes5.md), we can go back to brainstorming the other parts of the language

### Local Variables vs Private Variables

note that local variables are different from private variables
because if u had
foo: (localKey. [localKey]: localVal)
localKey is still accessible, and thus, so is localVal

to create a private value, you'd have to do something like
foo: (inputKey => getVal: if inputKey = 1948275 ? return mysecretValue)

in order to figure out what value to pass in, you'd have to inspect the code
but you can't just do something like foo.privateKey to get 1938275, it's not stored in any of the properties

### Assignment Syntax

≔ character used for assignment?
a single character, instead of := separate?
kinda like how we use the … char instead of three dots ...
looks kinda ugly though
even sublime-text doesn't render it properly, renders it as slightly longer than a normal character

[this stackoverflow answer](https://stackoverflow.com/a/7749570/1852456) talks about why Scala uses `=` for assignment instead of `:=`
they said that Java users were used to `=`
and that they didn't find a strong reason to go against convention
however, for the case of Arcana, I think my target audience is beginner programmers
as in, people who have never programmed before
so convention isn't a huge issue
if this language is to be integrated with Cono, it will often be used just to quickly tie together data
so it's better to be intuitive for first-time users, rather than familiar to experienced Java/C++ programmers

### Referencing State Variables

when defining a variable, we use the := char to differentiate between assignment and definition
but when _using_ a variable, how do we differentiate between using the latest value or the "previous" state of the variable?
in a reduce operation, we can think of each stage as a module that modifies a variable
aka, instead of having inputs and ouputs, there is a variable that is both an input and an output
previous state and next state of that variable
this means that, if our module defines the next state of a certain variable
then it only makes sense that inside the module, we are referencing the previous state of that variable

thus, any time you "assign" to a variable, it changes all references to that variable to referencing the previous state of that variable
