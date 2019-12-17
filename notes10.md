



nondeterminism and Constraints Programming

can we build a sudoku solver?
what about powerset example?
take a look at previous secion "Prolog Language"




### Comparison With Other Reactive or Actor Model Languages

commparison with other reactive or actor langs
reactive langs are supposed to be functional
	ours is not
problems with multiple update
	we just use synchronization
reactive usually have mechanisms preventing feedback
in my opinion feedback is unavoidable, how do you prevent independent parties from setting up a feedback loop
I could set up a feedback loop with the spotify API if i wanted
we want to model what is possible, don't want to restrict the programmer
also the "delay" solution is ugly
could also be impossible to detect
in private behavior spread across two modules, each which can't see the behavior of eachother




no insertion directly from dynamic keys
otherwise you end up with infinite insertions




### Name Brainstorm April 2019

want to capture the "emergence" idea
and "axis" sounds too generic and centralized

poieta (based on poiesis)
emergence
gaia
hive
swarm
biota
spore
stasis
slime mold
spore
fungi

evolve - highlights how data and behaviors change over time
threads

orchestra
harmony
symphony
choir
blend
meld
ensemble
trio
quartet
rally
huddle
chatter
cluster
troupe
syndicate (actually there is an actor-model language named this already, https://syndicate-lang.org)

bee
beacon  - captures the idea of seeing other signals and broadcasting a signal of your own
firefly
lantern
flare
candlelight
lodestar


revisit 5-5-2019:
* I've decided to stick to Axis because it feels clean and simple, whereas something like Firefly, while it has personality, would probably be better suited for a product and not a language


### Multi-line Braced-Blocks

sometimes you do want to break up a braced block into multiple lines, eg in an `if (...) else` statement
even python, which is indent-sensitive, supports this
talked about in [this SO discussion](https://stackoverflow.com/questions/181530/styling-multi-line-conditions-in-if-statements)

maybe the way it should work is
if you start a braced block using parenthesis `()` or brackets `[]`
all indentation and newlines will be ignored until the end of the braced block

this allows for stuff like

	if    (cond1 == 'val1' & cond2 == 'val2' & 
	       cond3 == 'val3' & cond4 == 'val4')
	    some_expression

notice that if you wanted nested cloning you would have to do it like so:

	foo: firstObject(10, 20, secondObject(
			prop1: 'hello',
			prop2: 'world',
		))

notice that we have to specify the `(` after `secondObject`, because the indented block won't be treated as implicit paranthesis
in addition we have to add commas after every property because newlines will be ignored


though what if we could make it so newlines are still recognized, but binary operators like `&` will ignore any following newlines
but note that [PEP8 discourages breaking after operators](https://www.python.org/dev/peps/pep-0008/#should-a-line-break-before-or-after-a-binary-operator), and instead recommends something like this:

	income = (gross_wages
				+ taxable_interest
				+ (dividends - qualified_dividends)
				- ira_deduction
				- student_loan_interest)

while this does look cleaner, it makes it harder for us to figure out when to ignore newlines and when to use them
maybe binary operators will ignore preceding and following newlines

so something like

	income = (gross_wages
				+ taxable_interest
				+ (dividends - qualified_dividends)
				
				something_else
			)

stands for

	income = ( gross_wages + taxable_interest + (dividends - qualified_dividends), something_else )

it still feels a lot cleaner to have the comma, eg

	income = (gross_wages
				+ taxable_interest
				+ (dividends - qualified_dividends),
				
				something_else
			)

so I think we should still make braced-blocks ignore newlines
we are forced to use commas between properties, but it makes it clearer, now that indentation is ignored



### Modular Parsing - Localizing Syntax Errors

One of the ideas explored in a previous section, "Why Undefined?"
is that we can even treat code with syntax errors, as just an `undefined` block
this way, the rest of the program can still run and display their output

this is called "localizing syntax errors"
and is an important goal we are trying to achieve without our parser

note: later, we call this "modular parsing"

### Parsing - Indented Blocks and Localizing Syntax Errors

with indented blocks, whenever indentation leave and comes back to a certain block level, it immediately terminates the block
this happens even with multi-line braced blocks
eg

	foo: someObject(
			// some code here
		))  // oops, extra bracket

	bar: 10

but since we can immediately terminate the `foo` block because the indentation of `bar` is at the same level or higher
then `bar` will still be display even though `foo` is undefined

this way we can localize syntax errors
it invalidates the block, not the entire program

### Parsing - Exploring Invalid Braced Expressions

(continued from "Parsing - Indented Blocks and Localizing Syntax Errors")

in the previous section we talked about how to handle indented blocks in order to localize syntax errors
but can we do the same with braces?
it is a lot more complicated

say we had

	block1: (block2: (block3: (() ) )

notice that we added an extra open paren `(` on the inside

there are two ways to handle this
we can go left-to-right, and that would mean there is a missing brace on the right-most block, `block1`
or we can go outside-in, and that means there is a missing brace on the innermost block, the one inside `block3`

left-to-right seems the most natural, and also since we type left-to-right, often we will end up with opening braces that we haven't closed yet

but note that whenever we have these mismatched braces, left-to-right will always break the outermost block (`block1` in this case)

whereas outside-in minimizes the damage / localizes the error, and only breaks the innermost block

exploring examples:

	block1: (block2: (10 20 30), (block3: )

notice that in the above example, left-to-right will warn of a missing parenthesis on the right, whereas outside-in will warn of an unclosed parenthesis before `block3`


	(  ( a b )  ( c d )    e f )  )

notice that there are multiple ways for outside-in to evaluate the above example
let's assume that we first consume the outer two parenthesis on both sides, so we are two levels deep on both sides
we use `[` and `]` to show how many levels deep we are on each side

	[[   a b )  ( c d )    e f   ]]

From here, we could move from the left side, consuming a close paren and going back to 1 level deep, then consuming an open paren to get back to 2 levels deep, leaving us with:

	[[   c d )   e f   ]]

then it will warn of an extra parenthesis between `d` and `e`

However, instead of moving from the left side, we could have moved from the right side,
	consuming a close paren and going up to 3 levels deep, then consuming a open paren to get back to 2 levels deep, leaving us with:

	[[   a b)   ]]

this will warn us of an extra parenthesis after `b`

note that if we had even more nested expressions, eg

	( ()   ()   ()   ()   ()    )   ()   ()   ()   ()   ())

then there are many different ways for us to progress inwards, each resulting in a different warning
this ambiguity leads me to believe left-to-right is the right way to parse braced expressions

notice that for the below expression,

	(  ( a b )  ( c d )    e f )  ( g h ) )

if we follow left-to-right traveral, we would end up with one extra parenthesis at the end
even though our intuition tells us that there is a missing parenthesis before `e`


one way we can actually think about this is
if we model parenthesis using slopes
let `(` correspond to an upward slope `/`, and `)` correspond to a downward slope `\`
then something like

	(  ()   ()   )  )

becomes

	 /\/\
	/    \
	      \

and we can see that, since the graph dipped below the start point, we have too many closed parenthesis

but we can delete any one of these closed parenthesis to fix the issue
for example if we deleted the leftmost one, we would be left with

	  /\
	 /  \
	/    \

and now it is balanced

likewise, if we had too many open parenthesis, ending up with a graph like so:

	  /\    /\
	 /  \  /  \
	/    \/

actually in this case, we can't add a closed brace anywhere we want, if we add it to the middle we would end up with

	  /\
	 /  \    /\
	/    \  /  \
	      \/

while it does end at the same level that it starts, in the middle it dips below the starting level
which is invalid

perhaps we could come up with some smart algorithm that minimizes then number of changes needed to make it valid

related leetcode discussions [here](https://leetcode.com/problems/remove-invalid-parentheses/description/) and [here](https://leetcode.com/articles/minimum-add-to-make-parentheses-valid/)

actually note that adding parenthesis to the beginning or end is always optimal (though sometimes there are multiple optimal methods)
because when you add to the beginning or end, you "shift" the graph upwards, pulling large dips out
the amount you need to add is simply: how low the graph goes relative to the left side, and how low the graph goes relative to the right side, added together
eg:

	\
	 \
	  \  /
	   \/

relative to the left side, graph dips -4
relative to the right side, graph dips -2
so in total we need to add 4 to the left side, and 2 to the right side


also notice that another reason why adding parenthesis is better is because if you have an expression like

	( a b ) c d ) e

you can't just remove the parenthesis after `d` because that would merge `c d` and `e`
adding parenthesis to the left doesn't change the structure, only shifts it

adding braces to the very left or very right, doesn't help in terms of localizing the error though...

### Parsing - Braced Blocks and Localizing Syntax Errors

(continued from "Parsing - Exploring Invalid Braced Expressions")

earlier we talked about how the outside-in method can localize the error
which is a property we are trying to bring to braced blocks

however, with invalid parenthesis expressions
there are often multiple ways to remove a parenthesis to make it valid, discussed [here](https://leetcode.com/problems/remove-invalid-parentheses/description/)

one way to think about it is if we had an expression like

	( a ( b ( c ) d ) e ) f )

we can remove any one of the `)` brackets to make it valid

even in an expression like

	( a b ) c d )

we might be tempted to immediately mark the left side `( a b )` as valid, and only invalidate the right side
but it's possible that we left out a brace on the left side, and the expression we were really going for was

	( ( a b ) c d )

the reason why we can localize errors for indented blocks, is that when you indent a block, you implicitly add _both_ opening and closing braces

whereas for something like
	
	( a ( b ( c ) d ) e )

if the user accidentally removed a parenthesis, eg like so:

	( a ( b ( c ) d e )

it is immediately unclear to the interpreter, where the error is, and where a parenthesis is missing


though perhaps we can look at what parts of the code the user is changing, to figure out what block is most likely the cause of the error
in the above example, the user removed the parenthesis between `d` and `e`
which breaks the outermost block
but say, if they had removed the parenthesis between `c` and `d`
then it would only break the middle block, making the middle block undefined and turning the output to

	( a undefined e )

thus we can see how it localizes the error

we explore this more deeply in the next section

### Parsing - Incremental Parsing

(continued from "Parsing - Braced Blocks and Localizing Syntax Errors")

imperative programming languages are executed from top to bottom
so thats why the interpreter/parse does so as well
and if there is any syntax errors, the parser fails and the rest of the script isn't checked

however, our language is unordered
so naturally, it makes sense for parsing to still be able to continue after a syntax error
which is why localizing errors is important
we have to find a different way to "execute" the parser such that, errors in one place won't affect others
modular parsing

instead, we can use the method explored in the previous section
	see section "Parsing - Braced Blocks and Localizing Syntax Errors"

essentially the idea is
we take the latest revision that doesn't have syntax errors
and parse the block structure
then we take the current revision, and diff it with the latest correct revision
and find out which blocks have changed
and for every syntax error, we can figure out which block was affected

another way to think about it, is we only re-parse the blocks that change

### mergesort and nondeterminism

notice that during the merge operation, we can choose any pair to merge
the recursive method forces us to merge the same pair that we split
but being able to choose from a "pool" of sets during each stage, allows for less resource waste
for example, lets say two workers in stage 5, each with a list, split their lists and give it to stage 6
eventually, stage 6 gives back the sorted lists back to stage 5
but let's say so far in the process, stage 6 has only given each worker one sorted list
so both workers are waiting for their second sorted list to start the merge
with the nondeterministic model, one of the workers can take both sorted lists and start merging
while the other worker waits on the other two lists

in fact, we don't even need to think in terms of stages
how we can think about it is
we are given a set of lists
we choose a random list
if it has more than two elements, split it in half (doesn't matter how, just take out a random half and put it in a different set)
if it has two elements, then sort them, and mark the list as `#sorted`
if there are multiple `#sorted` lists, merge them

all these instructions can be executed asynchronously and concurrently through actors


### Smalltalk

* I decided to look into smalltalk (found an article relating to it online), and it is _surprisingly_ similar to my language
* which is interesting because it came out so long ago
* smalltalk follows the actor-model as well
* while it says it uses "messages" to communicate between actors, each method is really more like a function call
* so something like `someObject height.` in smalltalk functions similar to `someObject.height->` in my language
* smalltalk also has this "object as a universal primitive" idea that my language uses
* it also seems like smalltalk could be made "reactive"
* you would have to constantly send messages to the output nodes/objects to get their latest value, but maybe it could work

* I think the main difference is that smalltalk supports variable assignment
* whereas my language uses insertion instead of assignment
* variable assignment is a very "synchronous" way of thinking, like sending instructions
* the problem is that if you want concurrent execution, the order of these messages will be nondeterministic,
	so the order of these assignments will also be unclear
* this makes smalltalk hard to parallelize, as talked about [here](https://stackoverflow.com/questions/35940570/what-is-the-difficulty-in-making-smalltalk-parallel)

* by contrast, insertions do not have an inherent order, and so are conducive to concurrent execution
* state variables are kind of like assignment but require an index or timestamp, so they also play nicely with concurrency

* thus, I think the main difference is that, since smalltalk is so old, it was developed around the idea of synchronous single-threaded execution
* whereas my language is designed around reactive programming and concurrency

### No Isolated Indented Blocks

* you can't do something like

		foo: bar,

			some
			indented
			block

* notice that this is implying the indented block is a list item
* but it's rather confusing
* so we shouldn't allow this
* you have to be more obvious about it, either using a capture block or even something like

		foo: bar,

		()
			some
			indented
			block

* note that it's perfectly valid to do this

		foo: bar,
		(some, indented, block)

* which shows that, in some cases, indented blocks have different syntax restrictions than braced blocks
* this is why we have to use a different token for indented blocks, eg `{` and `}`

### Single Indented List Item - Confusing Syntax

* these indentation rules can also get confusing in other ways
* for example, something like this

		foo:
			(prop: val)

* it might look like `(prop: val)` is the value of `foo`
* but the indentation adds another set of braces, so in reality it is like `foo: ((prop: val))`
* these ambiguities arise because properties (of the form `foo: bar`) and list items (of the form `foo`) look so similar
* perhaps we shouldn't mix properties and list items

* it's not so bad once you have multiple items though, eg

		foo:
			(prop: val)
			anotheritem

* I think maybe we can have a warning if there is only one list item, telling the programmer to use a more explicit syntax like

		foo: ((prop: val))

* or perhaps the IDE can insert dynamic index numbers to each list item


				foo:
		0:			(prop: val)
		1:			anotheritem

### Error Propagation Up Call Stack

* in many languages, eg Java or C++, it is common for errors to propagate up the call-stack
* however, in my language, where errors are represented by `undefined`, it doesn't necessarily work the same way
* by default, if `Alice` clones `Bob` who clones `Cassie`, and cloning `Cassie` fails, then `Bob` will simply set that property to `undefined`, but `Alice` isn't necessarily notified of the error

* in imperative languages, you can `throw` and error to immediately exit out of the function, and notify all callers of the issue (until somebody catches the error)
* perhaps we should have a similar mechanism

* we can have errors be a special type of `undefined` value, that is automatically propagated up callers
* so if `Bob` clones `Cassie` and it returns an error, then `Bob` will become `undefined` as well and return the same error

* how should the syntax for this work though?


### Multiple Dedentation and Partial Dedentation

* notice that multiple dedentations at the same time are legal

		foo:
			val1
				val2
		val3

* this is just the same as `foo: (val1(val2)), val3`
* the indentation of `val3` terminates the blocks for both `val1` and `val2`

* however, notice that if we have syntax like this

		foo:
				val1
				val2
			val3

* this is illegal
* `val3` is dedenting to a level that was never indented to, because the indented block "skipped" that level
* this is called "partial dedentation", and causes a syntax error
* (unless it is in a braced block, discussed in the next section)


### Block Parsing and Multi-Line Expressions - Complications

* first, note that currently our pre-processor replaces indentation with `INDENT` and `DEDENT` tokens, taken from how [python does it](https://stackoverflow.com/questions/27786191/how-to-represent-vertical-alignment-of-syntax-of-code-using-bnf-ebnf-or-etc)
* now take a look at these three examples

example 1

	foo( (1 * 2) +
			5 | bar
		someblock )    // legal, all the same block

example 2

	foo( (1 * 2) +
			5 | bar)
		someblock     // legal, someblock can be parsed separately

example 3

	foo( (1 * 2) )
			5 | bar
		someblock     // illegal, partial dedent


* notice that, without parsing the first line
* we can't figure out whether or not the following indented block is actually a separate block or not
* so we are stuck
* on one hand we want to split into blocks before parsing, in order to do modular parsing
* on the other hand, we need to do at least some parsing in order to split into blocks


* also notice, we can't fully ignore indentation inside braced blocks

			foo( (1 * 2) +
		someblock     // should immediately terminate previous block

* so in our grammar, we can't just ignore all `INDENT` and `DEDENT` tokens inside braces
* (note that we are using `{` and `}` current as indent and dedent tokens)
* (interestingly, python does allow over-dedentation inside braced blocks, which I think is quite ugly)

I can think of two options to handle this
	1. parse blocks first (manually), and then modular parse each block (using a grammar and nearley.js)
	2. somehow create a grammar that ignores stuff inside indented blocks, deferring it for parsing later?

### Block Parsing and Multi-Line Expressions - Context-Free Grammar?

* maybe we can do a complex grammar to parse these complex bracing rules
* we have a special token, like `PARTIALDEDENT`, or `}P` for short, for partial dedentations
	* (partial dedentations was discussed in the previous section, "Multiple Dedentation and Partial Dedentation")
* and these are ignored inside braces
* however, inside braces, `INDENT` and `DEDENT` tokens still have to follow a valid structure
* in order to ensure that we never dedent past the block level

* outside braces, `PARTIALDEDENT` is not allowed

* note that we would have to split our grammar into two parts, one for inside braces, and one for outside braces
* so instead of just having a `Statments` nonterminal, we would need `Statements` and `Statements_in_braces`
* that way for the grammar rules concerning text in braces, we can ignore `PARTIALDEDENT`
* we can also ignore newlines

* note that, we can also design the grammar to "defer" parsing of indented blocks
* we simply have a rule like

		IndentedBlock := INDENT Code DEDENT

* and we create the nonterminal `Code` to capture all text inside the indented block

* however, this actually, won't always work
* the indentation of the braced block doesn't have to end at the same level it began
* the indentation can end at a higher level than it began
* the following indented block has to end one level lower than it began though

		foo( (1 * 2)
				+ b
						+ c
					+ d)

			nestedblock
				bar
			zed

		nextblock

* gets converted to

		foo ( (1*2) { + b { + c } }P  )
			} }P nestedblock { bar } zed nextblock

(I split it into two lines for clarity, first line for the braced block, second line for the nested block)


* actually, notice that even if we didn't have a nested block

		foo( (1 * 2)
				+ b
						+ c
					+ d)

		nextblock

* gets converted to

		foo ( (1*2) { + b { + c } }P  ) } nextblock

* if we focus on the important braces

		( ( ) { { } ) }

* this is actually really complex
* we have a valid `()` structure and a valid `{}` structure interleaved together
* the valid `()` structure is obviously necessary
* but the valid `{}` structure is also necessary to make sure we don't indent below the start, both inside and outside the braces `()`

* is this even possible to achieve using a grammar?

* if we replace `(` with `a`, `{` with `b`, `)` with `c`, and `d` with `d`, this looks sort of like `a^m b^n c^m d^n`, which is not context-free

* but just because a subset of our language is not context free, doesn't mean that the language is not context free

### Block Parsing and Multi-Line Expressions - Proof that it is not Context-Free

* actually, we can prove that our language isn't context-free with [double-pumping lemma](https://en.wikipedia.org/wiki/Pumping_lemma_for_context-free_languages)
* recall how the double-pumping lemma works:

* show that, for all integers $p$, there exists a string $w$ such that, for any any decomposition of $w$ into 5 parts $prefix x1 middle x2 suffix$, with length of $x1 middle x2$ smaller than $p$, then there is always a way to "pump" $x1$ and $x2$ to push the word out of the language, $prefix x1^i middle x2^i suffix \notin L for some i$

* so here, given some $p$, we can create the braced structure

		(^p {^p )^p }^p

* so if $p = 3$ this would look like

		((( {{{ ))) }}}

* note that it is impossible to find a substring smaller than length $p$ that is double-pumpable while keeping the string in the language. In order to keep the string in the language you would either have to pump `(` and `)` at once, or `{` and `}` at once, but both those combinations are more than $p$ characters apart so you can't pump them at the same time.

QED

* thus, interleaved braced structures are impossible to represent using context-free grammars.

* I wonder how python deals with this then?

### Parsing Block Structure During Lexical Analysis

* I think the best option for me is to just parse the braces and indentation first
	* (trivially achievable using two stacks, one to keep track of parenthesis and one for indentation)
* and then use a grammar to parse the rest
* note that parsing the braces and block structure first, also allows me to do modular parsing

* in addition, this method extends nicely into the "Incremental Parsing" idea discussed earlier
	* see section "Parsing - Incremental Parsing"
* because when we generate the structure for modular parsing, we can use the same structure for incremental parsing

* looking at the description of python's lexical analysis description,
* the [section about line joining](https://docs.python.org/3.3/reference/lexical_analysis.html#implicit-line-joining) talks about how it ignores newlines inside parenthesis or braces
* since this is described in the lexical analysis, I am assuming they are parsing brace structure before doing the actual parsing
* which is what I was planning on doing too!

### Actor Model vs Functional - Modifications and State

https://fsharpforfunandprofit.com/posts/railway-oriented-programming-carbonated/

chest example
	see section "Combiners, Insertion and Privacy"
if you want to have an object that you can modify and interact with, eg a card deck
you can either use "register" pattern or "pipeline" pattern
* register pattern: receiver has to explicitly register every actor
	* eg in `foo: [alice,bob,cassie].map(x => x.getInsertions)`, if somebody new wants to insert, they have to be added to the list
* pipeline pattern: the receiver is passed from actor to actor, and each actor applies their modification to the receiver
	* eg in `foo: alice(bob(cassie( initial object )))`, if somebody new wants to insert, they have to be explicitly added to the pipeline

functional forces you to modify the code of the object in order to accept modifications from new people
imperative/actor model allows an object to accept modifications from any source
makes it much more flexible

this is further shown by how [haskell handles IO](https://www.haskell.org/tutorial/io.html)
notice how IO operations have to explicitly return IO objects
and that is just for doing IO operations, like modifying the filesystem
what if you want to modify arbitrary objects?
you have to return your actions/modifications as objects
and then the object you are modifying, has to explicitly accept those modifications


axis introduces a default "global state" object that is passed into and returned from every object
recall from the section "Combiners, Insertion and Privacy", we can generalize this using the simple function

		combiner(caller, arguments, allInsertions) => result + insertions

this allows an actor to modify a receiver actor, without needing the receiver to be explicitly aware
this is more conducive to the live,persistent, reactive model of axis
because you can construct new objects that interact with existing objects
without having to change the code and re-deploy those receiver objects

eg, Bob can deploy a server that accepts song requests
and anybody can create a program that sends a request, without Bob needing to rewrite his server to explicitly accept that request

essentially introduces the concept of an "environment" that every object can read from and interact with
note that a parent object can still control the environment of it's child objects, so there is still a sense of control
but this default global state makes it much easier to write in a dynamic, constructional style

### Referential Transparency

* even though Axis has side effects
* it still preserves referential transparency!
* this is because of two main factors

1. unordered modifications via insertion
2. overdefinition is handled via `overdefined` error

* so you can be sure that, everyone that references an object will see the same value

* but the [wiki page](https://en.wikipedia.org/wiki/Referential_transparency) for referential transparency says that a function has to be pure
* "the expression value must be the same for the same inputs and its evaluation must have no side effects"

* our language achieves both because the side effects _are_ inputs
* if you declare an object to be a collector, you have to account for all insertions to it
* that's the whole point of a collector

revisit 6/3/2019
* actually, there is an important aspect of referential transparency we are missing
* we should be able to replace a reference with its value and obtain the same behavior
* however, this is not true, because referencing an object is different from nesting an object
* see previous section "Defining Behavior That Should be Duplicated"
* in addition, see the later section "Referential Transparency II - Referencing vs Nesting" for more

### Multi-Line Expressions Allow for Imperative-Style Braced Blocks

* notice a major implication for ignoring indentation inside braced blocks
* they allow for imperative-style declaration of objects

	foo: (
		prop1: 10
		prop2: 20
	)

* before, this would evaluate to `foo: ( ( prop1: 10, prop2: 20 ) )`
* but now that indentation is ignored, it goes back to being a single block, `foo: ( prop1: 10, prop2: 20 )`

* this can be confusing
* this is why it's important for the IDE to subtly show implicit parenthesis, maybe by inserting slightly transparent braces before and after the block
* that way the programmer knows exactly where the blocks are

### Grouping and Unary Operators

what if we wanted to do

	(foo | bar)[10]

this creates an object and extracts property `10` from it, not what we want

maybe we can do

	(foo | bar)...[10]

or maybe abuse call operator

	(foo | bar)->[10]

or just use call operator normally

	(=> foo | bar)->[10]

we tried to solve it earlier for arithmetic expressions
	// TODO: FIND REFERENCED SECTION

	foo: (a + b) + c

but note that this doesn't work if we want to use a unary operator, like `.` or `[]`, on the parenthesized expression

maybe we should use `{}` for objects, and `()` for operator precedence

	foo: { a: 10, b: 20 }  // an object
	bar: (x | y)[0]        // operator precedence shorthand, equivalent to or(x,y)[0]


or maybe we _can_ make it so that unary operators also "strip away parenthesis" for singleton objects
if you want to for some reason do `or(x, y)[0]` using the `|` operator, we could simply do

	bar: (0: x | y)[0]

note that to help make this "parenthesis stripping" obvious, we should leverage syntax highlighting
when the parenthesis are "stripped", they should be highlighted the same color as mathematical operators like `+` or `|`
that way it's obvious that they are only being used for operator precedence, not object creation
it also has to be something that happens statically, determined during parsing
it's a syntax thing, not a runtime thing

### Parsing and Line Numbers Example - the power of tagging primitives

when writing the parser, i encountered the following problem

* moo lexer will take the raw code, and break it into tokens and identifiers, along with line numbers
* then I parse for blocks, and merge the tokens of each block into a "blockstring", into then pass each blockstring to the nearley parser
* the nearley parser will parse the blockstring, and if it finds any errors, will return the line number of the error

notice that because the text given to nearley isn't the same as the text given to the moo lexer, the line numbers returned by each won't match
so my middle block parsing step, has to provide a mapping between line numbers of the blockstring, to line numbers in the raw code

so in all three steps, there is a mapping
moo processes the raw code and spits out tokens and identifiers
i process the tokens and spit out blockstrings
nearley parses the blockstrings and spits out the line numbers of syntax errors

in each of these steps, we have to keep track of the line numbers

there is another method

we "tag" each character of the raw code with its line number
so as long as each processing step is returning those same characters, then I can look at the characters spit out at the very end, and see what line they came from

for example we can do

	taggedCode: rawCode.map(char => char(lineNumber: <calculate line number here>))
	tokens: mooLexer(taggedCode)
	blockstrings: blockParsing(tokens)

	for block in blockstring:
		parseResult: nearleyParser(block)
		if (parseResult.syntaxError)
			invalidChar: parseResult.syntaxError.faultyText[0]    // get the first character of the text that caused the error
			console.log( invalidChar.lineNumber )                 // get the lineNumber property that we added in the beginning

it doesn't matter if we add more parsing steps in the beginning
those characters will persistently carry around those tags

notice that even if the parsing steps create copies of the string, the copies will still carry around those tags

however, something to keep in mind
if you have a lot of tags, then every copy has to create a copy of each of those tags as well
so it can get memory intensive
another way we can do this tagging is

	tag #lineNumber

	taggedCode: rawCode.map(char => char())  // create an empty copy of each character
	for char in taggedCode:
		char.#lineNumber: <calculate line number here>

we create a copy of each character, but don't add any tags, this is just so that every character has a unique memory address/reference
then we can use an external hashmap, leveraging the `tag` and virtual property syntax

this way, no matter how many tags you have, they don't bloat the character objects


something to keep in mind is we don't want these modified character primitives leaving our parsing pipeline
so if we do want to output any of these strings or characters, we should sanitize them first
basically, replace them with their original character counterparts, without the tags

### Proxies and Data Processing

* this actually reminds me of one of the original motivations between tagging, and the language itself actually
* I often ran into this pattern
* where I had some complex pipeline
* and I might have a giant set of data
* but I only want to filter and analyzes certain items
* but I still want to keep track of the context of those items within the larger dataset


* in some cases you can just use a hashmap

		images >>
		sizes: hashmap()

		for (image in images)
			area: image.width * image.height
			if (area > 10000)
				sizes.put(image, "big")
			else
				sizes.put(image, "small")

* and eventually, that is what tagging, aka the `#` syntax, evolved into

* but sometimes a hashmap doesn't work
* for example, in the `lineNumber` example in the previous section
	* see section "Parsing and Line Numbers Example"
* in a more generalized sense
* if you have some large array that contains duplicates
* and you want to do data processing on a subset of that array
* while keeping track of the indices of those items
* the `lineNumber` example from earlier is a good example of this
* but here is a simpler example

		chunk: array.sliceSpecial(size: 10)      // use third party api to slice a certain part of the array
		specialItems: findSpecialItems(chunk)    // use third party api to extract certain items
		firstSpecialItem: ???                    // how do we get the first item, when we have lost the indice information?

* the hashmap method doesn't work here because the array contains duplicates
* so if you tag an item with it's corresponding index, it may end up with multiple indices attached

* note that we can't just modify the third party api, and even if it wasn't a third party function,
* it's inconvenient to have two versions of every function, one version that preserves indices and one that doesn't

* one method is to clone items, so every element of the array contains a unique clone of the source item
* this is the method we used in the `lineNumber` example
* this way, because every item is unique, we can tag them without worry

* however, this won't always work, if the source items have behavior that you don't want to clone
* eg if they call external APIs, you don't want to duplicate those calls just because you want to add a small "index" tag

* the most robust method is to use wrappers

		wrapped: array.map((v, i) => (index: i, value: v))

* however, often wrappers can get ugly
* because now we have to extract the values every time
* so we wouldn't be able to use the third party apis like `sliceSpecial` and `findSpecialItems`, which operate on the values directly
* we would have to modify the api functions to extract the value first

* proxies are basically wrappers that make it "feel" like you are working with the source items

		foo: (val: 10)
		fooProxy: proxy(foo)->
		console.log(fooProxy.val)    // will print "10"

* this way, we can proxy values and before tagging them, so each tag will correspond to a unique proxy object (no collisions)

		tag #index
		proxiedArray: array.map(( obj, i >> obj#index: i => proxy(v) ))
		
		chunk: proxiedArray.sliceSpecial(size: 10)
		specialItems: findSpecialItems(chunk)
		firstSpecialItem: specialItems.sortBy(#index)[0]

* then we can extract the original item using a symbol property

		originalItem: firstSpecialItem[proxy.sourceKey]

* property access is automatically forwarded to the source item
* and they leverage symbol properties, to ensure that proxy-specific properties don't collide with properties of the source item

* proxy implementation

		proxy: source >>
			sourceKey.
			=>
				[key]: if (key = sourceKey) source else source[key]

* note that if the source item is a proxy, you might have to worry about collisions

		p1: proxy("hi")->
		p2: proxy(p1)->
		p2[proxy.sourceKey]   // ambiguous, are you trying to get the source of p1 or p2?

* according to the implementation of proxies, this example would return the source of `p2`, but then how would you access the `sourceKey` property of `p1`?
* you can easily solve this by providing your own `sourceKey` to resolve this ambiguity

		sourceKey1.
		sourceKey2.
		p1: proxy("hi", sourceKey: sourceKey1)->
		p2: proxy(p1, sourceKey: sourceKey2)->
		p2[proxy.sourceKey1]   // forwards the property access to p1, and retrieves the source

* however, you have to be careful with proxies, because sometimes you don't want them to "leave" the pipeline
* but it isn't always clear what functions are part of the pipeline and which ones aren't
* so you have to explicitly specify when you want to send the proxy, and when you want to send the source object
* for example

		items: sourceItems.map(x => proxy(x)->)
		subset: items.filter(x => fn(x)).map(x => gn(x))   // here we want to pass the proxies to these external functions

		someExternalAPI(subset)   // here we don't

* this might be a good place to use firewalls actually

* you "fence out" exactly what functions you want inside the firewall
* and scope all proxies to the firewall
* so any proxies leaving the firewall will automatically extract the source
* or maybe just become undefined



### modular parsing - syntax errors vs output errors


currently the idea behind modular parsing is
when writing a program, you will have a "live" view of the output of your program
and if there are any syntax errors, it will just make the enclosing block show up as `undefined` along with an error message
so if you had some code like

	foo:
		bar: 10
		zed: 20
		bla: % some syntax error %

so in the output window, you might see something like

	foo: (bar: 10, zed: 20, bla: undefined(error: "syntax error on line 4") )


however, what if the code looked like this

	foo:
		bar: 10
		list: 1 2 3
		list.forEach(% syntax error %)->

notice that the syntax error is in the object being passed to `forEach`, who is responsible for creating clones of that object
but `foo` doesn't actually contain any references to the faulty object
it declares and defines the object, but doesn't have any properties pointing to it
its an "anonymous" child object

thus, in the output view, we wouldn't see any problems with the `foo` object
we would simply see

	foo: (bar: 10, list: 1 2 3, true)     // note that forEach always returns true

only if we inspect the `forEach` call, might we see the errors
though that also depends on how `forEach` was implemented
if it was implemented like so

	List:
		forEach: fn >>
			fn(List.head())
			if (List.next)
				List.next.forEach(fn)     // recursive call

			=> true

then all children are anonymous as well

we might be tempted to just "bubble up" the syntax error so the caller fails as well
and so does its caller, all the way up the chain
but at that point you are basically just having the entire program fail, so that's not modular parsing anymore

the problem is our output isn't a one-to-one mapping with the code
even though it looks very close
but the IDE shows the raw code, whereas the output shows the evaluated values

in the IDE, show where the syntax error is
in the output, only show syntax errors in the object that contains it
and any object that references that failed object, will just see `undefined`
this way, in a distributed web, a server can go down due to a syntax error, but everybody trying to read from the server just sees `undefined`, they don't see what caused the outage

so the programmer can see in the IDE where the code has errors
but if the programmer still wants to continue evaluating and see what the output is, they can

syntax errors are indicated in the code, they only make sense in context of the code
but when you evaluate them, they become `undefined` values in the output




### scope and insertion and firewalling

maybe insertion and scope are linked
the only way you can "firewall" stuff and prevent signals from getting out via insertion or cloning
is to override the scope
the parent can always override the child's scope
control the child's environment
even if the parent is cloning another object, they can control the environment
override the scope
so if that object has private behavior, or references private variables, then it will immediately stop working
eg

	foo:
		_private: 10
		collect: collector
		bar:
			zed: _private * 3
			collect <: "bla"

	firewalled:
		_scope: ()   // override scope
		child: foo.bar()    // clone using the new scope

note that in `firewalled.child`, `zed` will be undefined and no insertions will be made to `collect`

it is essentially like a surface copy, a psuedo-clone
only copies the public behavior

anytime you override scope with a blank slate, aka `_scope: ()`, then it's like a surface copy
but you can override it with whatever scope you want

note however, that in this case, `foo.bar.zed` references private behavior
once `firewalled` overrides the scope, then the child loses all access to this private behavior

so firewalling is a double-edged sword
it prevents data from getting out, but it also prevents clones from accessing private behavior
which makes sense
if you want access to private behavior, you have to permit communication between the source and the clone


### errors pII


in Java, anybody in call stack can catch the error and prevent it from propagating
this makes sense
when you call another function, you delegate behavior to it
and it is allows to act however it wants
if it chooses the catch the error so that you don't see it, then that's its perogative

so perhaps we should do the same thing
errors propagate up the call/clone stack until somebody captures it


however this idea of a "call stack" feels very procedural,
and does not really fit in with the "everything is data" philosophy

so why is it so convenient?
check out the code for the parser, specifically the functions `getBlockIterator` or `indentationProcessing`


note that another way we can do errors, is just use a collector

	foo:
		errors: collectors
		bar: someFunction(
				if (someError) errors <: "error message"
			)->

this isn't the same though, because it goes directly to the collector, there is no propagation up a call stack
so intermediate functions can't "capture" it
note that this is also completely possible in imperative languages, they would just use assignment, eg

	errors = new Array();
	myArray.forEach(x => {
			if (someError) {
				errors.push("error message");
			}
		});

but the call-stack propagation method, allows for a more systematic way of handling errors
the "control flow" of a program is made up of all it's sub-calls and statements
and throwing errors is an easy way to break out of the entire flow, now matter how many layers deep the method calls are

you can think of the procedure of a program, as like a slowly growing tree of statements and function calls
and throwing errors is like exiting out of the entire tree
but you can also "catch" errors, basically isolating out a tree branch so any issues in that branch don't spread to the rest of the tree

it does feel very hierarchal though





`foo(x => x*x)` vs `foo((x => x*x))`



	extractBlocks: text, blockBoundaries >>
		var blockStack: list
		var current: blockStack.last

		for (index in range) { @index
			if (index % 2 = 0 && current is prime)
				blockStack.push(someVal)
			else
				blockStack.pop

notice how `current` is reactive
in imperative, every time we push or pop to blockstack we would have to manually update `current`
this is rather hard to think about though
it might be intuitive to want to simply declare `current: blockStack.last`
it might not be clear why `current` has to be a state variable





how would we replicate the following JS code

	let arr = [];
	for (timestamp of timestamps) {
		if (timestamp % 2 == 0)
			arr.push("even");
		else
			for (index = 0; index < 3; index++)
				arr.push("odd " + index);
	}

mixing indexes

	var arr

	for (timestamp in timestamps) @timestamp
		if (timestamp % 2 = 0)
			arr.push("even")
		else
			for (0 < index < 3) @timestamp,index    // notice: compound index
				arr.push("odd " + index)

notice that we are mixing compound indexes with regular indexes



### Javascript Import System vs Axis

module system is extremely annoying
especially because node.js and ES6 use different module systems
so basically you can't have javascript files that work across both
because if you use `module.exports` and `require`, it won't work with ES6
and if you use ES6 modules, while they do work with experimental versions of Node.js, most libraries are written in Node.js
eg Jasmine testing framework

javascript creates strong separation between files
which makes it hard to split code amongst multiple files
HTML allows you to just append multiple javascript files into the same runtime/environment
but Node.js sandboxes each file and forces you to expose variables using `module.exports`, and import variables using `require`

the HTML method is quick and easy, but ugly, often results in polluting the global namespace
the Node.js method is annoying to work with, and also makes files unusable in the browser / client-side


in Axis, files are treated like templates
remember that every file contains a "block"
eg

	name >>

	greeting: "Hello, my name is " + name
	informal_greeting: "Whats up, Im " + name

let's say this block was stored in `person.axis`
then it is the same as declaring

	person: template
		name >>
		greeting: "Hello, my name is " + name
		informal_greeting: "Whats up, Im " + name

so if you were in a different file, say, in the same directory, you could do

	bob: directory.person(name: "Bob")   // directory is a variable provided by the environment, by default it points to the current directory
	console.log(bob.greeting)            // will print "Hello, my name is Bob"

we can use the provided `directory` variable in many ways

	x: directory.root.Users.Foo.Documents    // absolute path, equivalent to "/Users/Foo/Documents"
	x: directory.parent
	x: directory.someFolder['some file with spaces.axis']
	x: directory.root['Program Files/nodejs/node.exe']     // absolute path, using path string

note that any folder accessed inside Axis will have these methods/properties available
whereas any file accessed inside Axis will be treated as a module template, at least if it has the `axis` extension


notice how we can easily control what variables are passed in, the environment, without using `import` or `require` statements
because it works via cloning, no special syntax required
and we can also easily access variables declared in other files, because it works just like property access


the filesystem should be viewed as just another data structure
a tree structure, with folders pointing to other folders and files
so just like you might access a url or web node, and traverse to another web node, eg `SpotifyAPI.artists.TaylorSwift`
you can do the same thing for the file system









if we have modules that automatically propagate errors
eg array.indexoutofbounds
isn't that now the same thing as having regular errors
before we were using undefined for everything, and then you can explicitly return an error if you want
a whitelist system
but now it sounds like we are moving towards modules that can throw errors that automatically propagate
and you can capture the error if you want
a blacklist system

maybe we can have a `collector` of errors that automatically gets passed upwards
anytime you have an error, you return undefined, and insert to the error collector



snapshot
you can include/import data from other people's servers and use it
for example, importing a library
but when you "commit" the code, you may want to snapshot it
so that you know what version of each library that you are using
snapshot works the same as capturing and state variables
external libraries are just state variables




* environment fragmentation
* if people are constantly "snapshotting" libraries and such
* eg something like

		environment:
			someLib: ^someLib.version['1.1.2']

		myModule: template
			foo: someLib.bar * 10

		result: myModule(...environment)

* it can get confusing if all of these objects were split amongst multiple files
* which is actually pretty common in programming nowadays
* eg for Node.js, you have the library mappings defined in `package.json`,
* and then you'd have a function defined in a commonjs module,
* and Node.js would automatically use the `package.json` mappings to provide the correct version of each library to your module

* the reason this can get confusing is
* if `myModule` was defined in a separate file
* it isn't immediately clear what version of `someLib` you are using
* at least in Node.js, we know that the mapping is defined in `package.json`
* but in Axis, if we just looked at `myModule`, we are not sure what version of `someLib` it is meant to be used with
* and we might get unexpected behavior if we use `myModule` with the wrong environment

* I guess this sorta makes sense though
* when we write a module, we are defining semantic relationships between inputs
* for example, if I said `foo: => sum(a,b)`
* I could technically call `foo` with the environment mapping `sum: product`
* which would return the product of `a` and `b`, even though `foo` was originally defined to return the sum





config files are ugly




with babelJS, we generate files
eg we can take ES6 modules and convert them to commonJS modules
but we would want to ignore these generated files in git
but this behavior would actually come naturally in Axis
because in dataflow languages, you only need to track the inputs
everything else can be re-generated

so you would do something like
	
	commonJS_modules: babel(ES6_modules)

and then the generated files would just be a caching step
an optimization





es6 module imports are ugly
https://stackoverflow.com/questions/55673389/jest-babel-cannot-find-modules-without-the-path-prefix/55674558#55674558
regular specifiers use file paths
bare specifiers are resolved by the environment, eg browser or Node.js
	can differ by environment

thus, some imports are determined by the file
and some imports ane determined by the environment
very ugly

Axis, on the other hand, doesn't have this inconsistency
because modules and imports are achieved through regular cloning
so it's always up to the environment to provide variables





testing framework
would be cool if failed tests stay "alive"
so that you can inspect them in the browser or something
inspect failed objects



### Iterables and Generators

* one really useful feature of javascript is Iterators or [Generators](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function*)

* you can take an in-order traversal of a tree
* and then use continuations/yield to create an iterable

		function * inOrderIterable (tree) {

			function traversal (node) {
				if (!node) return;
				traversal(node.left);
				yield node.value;
				traversal(node.right);
			}

			inOrderTraversal(tree);
		}

* I used this pattern in `preprocessor.js`, in the function `getBlockIterable()`

* can we replicate this abstraction pattern in Axis?
* it is difficult because it is a pattern inherently rooted in "execution order"

* actually I can think of two ways of doing it
* one is to just create a list

		inOrderTraversal: node >>
			if (node = undefined) => ()
			else => (
				...inOrderTraversal(node.left)->,
				node.value,
				...inOrderTraversal(node.right)->,
			)

* we would have to make liberal use of lazy-evaluation optimizations in the background though

* another method is to use _order as an input_

		inOrderIterable(tree, callback)

			inOrderTraversal: node, index >>
				if (node = undefined) => index

				leftReturnIndex: inOrderTraversal(node.left, index)
				callback(leftReturnIndex, node.value)
				rightReturnIndex: inOrderTraversal(node.right, leftReturnIndex+1)

				=> rightReturnIndex

			inOrderTraversal(tree, 0)

* a lot of keeping track of one-off errors though

* perhaps instead of formatting the result like an array, using indexes
* maybe we can instead format it like a linkedlist, using `next` properties
* that way we don't have to keep track raw numerical indexes
* we use `next` the same way we use `yield` in iterators
* to specify the "next" value of the iteration
* how would we do this....

* or maybe, we can leverage feedback
* recall the `treeHeight` example, where we defined the relationship between the `height` of each node
* here, we want to define the relationship between the `order` of each node

* somehow we want to say: in each node, our value comes "after" the traversal of `node.left`, and "before" the traversal of `node.right`


* one way we can think about iterables is
* every iterable is a sequence of statements
* each statement either executes an action or yields a value
* note that an action can also be a sequence of statements
* so we get this recursive structure
* eg, with the `inOrderTraversal`, we do
	1. traverse node.left
	2. yield node.value
	3. traverse node.right

* so we need to replicate this pattern in Axis
* maybe we can use the `do` keyword

		inOrderTraversal: do
			inOrderTraversal(node.left)
			yield node.value
			inOrderTraversal(node.right)

* `do` basically defines a sequence of actions
* `inOrderTraversal` extends `do`, so it returns a sequence of actions
* in the body of the `do`, we have two recursive calls to itself, each returning a sequence of actions
* the `do` keyword is responsible for appending those two sequences in order

* wait but if `do` is just for defining sequence, what if we just defined a sequence directly, using lists
* then we basically just come back to the method defined earlier

		inOrderTraversal:
			...inOrderTraversal(node.left)
			node.value
			...inOrderTraversal(node.right)

* I guess ultimately it does just come back to lazy evaluation
* if we want to code at high-level by "defining relationships", we have to rely on lazy-evaluation to optimize the execution

* I guess maybe we can use a keyword to specify the optimization

		inOrderTraversal: Iterable
			...inOrderTraversal(node.left)
			node.value
			...inOrderTraversal(node.right)

* I guess this can get ugly if there are a huge number of statements
* you wouldn't want to put a `...` in front of every single one
* it's much easier to put a `yield` in front of the values instead
* for example, take a look at the `getBlockIterator()` function in `preprocessor.js`

* perhaps `Iterable()` will actually, by default, concatenate all arguments
* so the above example becomes

		inOrderTraversal: Iterable
			inOrderTraversal(node.left)
			( node.value )
			inOrderTraversal(node.right)

* notice that we don't have to put `...` in front of the statements, but we do have to wrap the values



* I wonder if this has any implications for state variables
* we introduced the `do` keyword because we wanted to define ordered statements for state variables
	// TODO: FIND REFERENCED SECTION
* but we just showed that `do` is un-necessary

* state variables were for defining the timeline of value
* so if we had multiple event listeners modifying the same variable


* another method is perhaps instead of concatenating a bunch of lists
* instead, we create a system for passing the index forward
* eg, in something like

		foo: Iterable
			yield "hello"
			yield "world"

* `yield` will automatically insert the value into the Iterable's `collect` collector, but with a dynamic index
* so "hello" will be inserted with index `0` and "world" will be inserted with index `1`
* if you have recursive iterables like

		inOrderTraversal: Iterable
			inOrderTraversal(node.left)
			yield node.value
			inOrderTraversal(node.right)

* then it will figure out the indexes appropriately, even in deeply nested `yield` statements


### Iterables and inversion of control

* I was listening to [this talk](https://frontendmasters.com/courses/rethinking-async-js/callback-problems-inversion-of-control/) about how callbacks create an inversion of control
* for example, if you did something like

		thirdPartyAPI.inOrderTraversal(tree, callback)

* then you are trusting that the `thirdPartyAPI` isn't going to do anything stupid
* like call the callback more than necessary

* ES6 generators/iterables were designed to [eliminate these problems](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function*#Description)

* it sorta makes sense
* instead of giving the function to the third party API to call
* the third party API yields, giving "control" back to you, so you can choose what to do at every iteration
* in a way, its like, instead of giving a function to the third party, the third party gives the data to you

* however, this actually really isn't any different
* you are still defining a behavior that is repeated for every item
* before, we had to worry about the third party calling the callback too many times
* now, we have to worry about the third party returning too many items

* I guess the only difference is that, with Iterables, you can `break` or `return` out of the iteration
* eg

		// returns the first number divisible by 5
		for (let val of list) {
			if (val % 5 == 0)
				return val;    // immediately breaks out of the iteration
		}
		
* whereas with `forEach` and `reduce` functions, no matter what you did, the function would still iterate through every item
* even if we simply ignored subsequent items like so:

		// returns the first number divisible by 5
		var result = list.reduce((acc, val) => {
				if (acc != undefined) return acc;
				if (val % 5 == 0) return val;
				else return undefined;
			})
		return result;

* notice that after finding the first number divisible by 5, we ignore all subsequence numbers,
	* but `reduce` will continue going through the entire list
* this makes Iterables seem useful for infinite streams

* however, this benefit becomes unnecessary once you have lazy evaluation
* iterables are pretty much just lazy-evaluated lists


### Lazy Evaluation Revisited - Insertion and Feedback

* notice that we can't have infinite streams if there is insertion
* insertion naturally "observes" everybody else
* so in the context of lazy-evaluation, where things are only evaluated when accessed
* we can think of collectors as constantly accessing all insertions
* so any insertions automatically have to be evaluated
* but of course, only if the collector is being accessed

* thus, we can bring insertion into the framework of lazy evaluation
* we can write our interpreter such that everything is lazy evaluated
* but we also need to keep track of insertions
* such that once you access a collector, it will automatically access and evaluate its insertions

* note that this means that, for any object/module that contains insertions
* you have to track all the instances/clones of it
* though you don't have to evaluate the values inside those clones, until the collector is accessed


* does this mean that if you have an infinite stream that inserts to a collector
* that the program won't have any issues
* until you try to access the collector, at which it runs into an infinite loop trying to evaluate all the insertions?
* I guess this kinda makes sense
* the value of that collector is "infinity"
* so when you try to access it, the program hangs

* property access is starting to feel like function calls
* kinda like how SmallTalk works


* feedback breaks lazy-evaluation though
* think back to the `shortestDistance` example
* when the output is observed, then it will backtrack looking for everything that needs to be evaluated
* but with feedback, nodes will be stuck in a deadlock, each node waiting for the other nodes to evaluate first
* in addition, it wouldn't be enough to just look at the current value of the input
* because feedback can create behavior that is dependent on past values of the inputs
	* see section "Latches and Feedback"

* in addition, feedback can be really hard to detect if it is across multiple servers
	* see section "Distributed Feedback"
* if there are public variables or "externally facing nodes", then we don't know if they are in feedback or not

### Pruning Unobserved Nodes, Dont-Call-By-Dont-Need

* so it seems really difficult to figure out if something is "needed"
* but perhaps we can do the opposite
* we can figure out if something definitely isn't needed
* for example, if an output property isn't being used, and isn't being referenced anywhere, then it definitely isn't needed
	* notice that if a property is in a feedback loop, it would be referenced
* visually, if a node has no outgoing edges, then it isn't needed
* but we can work backwards from these "unobserved" nodes to find more unobserved nodes
* so to generalize, a node is "unobserved" if:
	1. it has no references
	2. the only nodes referencing it, are unobserved nodes

* this is really similar to normal lazy evaluation
* where we look at what nodes are needed, and traverse backwards to figure out what nodes need to be evaluated
* but this is the opposite
* we look at what nodes are _not_ needed, and traverse backwards to figure out what nodes _don't_ need to be evaluated
* it is like the [inverse](https://en.wikipedia.org/wiki/Inverse_(logic)) of [call-by-need](https://en.wikipedia.org/wiki/Evaluation_strategy#Call_by_need)
* which is why I call this method "dont-call-by-dont-need"

* in essence, instead of having all nodes start out as unneeded, and then figuring out which ones are needed
* all nodes start as needed, and then we figure out which ones aren't needed

* this takes care of feedback, because by default all nodes are needed
* and when we go through the graph pruning out unneeded ones, nodes that are in feedback won't be pruned out

* how does this handle externally facing nodes, where we don't know if there is feedback or not
* well, perhaps we can simply assume that externally facing nodes are being observed
* so public variables always have to be evaluated
* unless we know for sure that it isn't being observed
* eg if an HTML element isn't on the screen, and isn't referenced in the program, then we know it isn't being used


* all this kinda reminds me of [abstract interpretation](https://en.wikipedia.org/wiki/Abstract_interpretation), a concept I saw on reddit
* the concept is basically saying that, even though some "yes/no" questions may be uncomputable, eg the halting problem
* we can still gain useful information by factoring in uncertainty and instead asking the question "yes/maybe/no"
* so while we might not have a generalized algorithm for determining if a program will halt or not
* we can use certain algorithms to detect _certain_ cases where a program is guaranteed to halt, or guaranteed to not halt
* 	eg, if the program is a finite state machine, we can for sure answer that the program will halt

* likewise, in our language, we cannot always determine if a feedback loop depends on transient behavior or not
	* eg, the latch example depends on transient behavior, but the `#shortestDistance` example does not
	* note: I haven't actually proved whether or not this is possible, I am just guessing
* so for feedback loops, we can't determine if we can lazy-evaluate them or not
* however, there are still places where we _can_ use lazy-evaluation
* as outlined above

### Dont-Call-By-Dont-Need Problems

(continued from section)

* actually, there are issues with the issue outlined earlier
* in order to find which nodes aren't observed, we have to evaluate the entire graph first!
* because we never know if a node will eventually end up observing a given node

* only after we do an initial pass, constructing all the bindings
* can we start pruning nodes out
* so really all we are doing is finding nodes that don't need to be updated
* but it seems like we still do have to evaluate the entire graph


so what about a stream of infinite insertions
that is really what we are trying to optimize here


note that with public nodes, we can detect if they are unobserved
only when an external nodes "asks" for a certain value
then it becomes observed





### Relational Expression / Comparison Shorthands

chaining relational operators:

	a < b < c  is equivalent to  (a < b) & (b < c)

note that [python, perl6, and mathematica all have this already](https://stackoverflow.com/questions/4090845/language-support-for-chained-comparison-operators-x-y-z)


parallelism?

	if (someObj = 5 | = 10 | .length > 0 & [foo] != undefined | = 15)

	is equivalent to

	if (someObj = 5 | someObj = 10 | someObj.length > 0 & someObj[foo] != undefined | someObj = 15)

notice that it should follow short circuit evaluation


maybe we can leverage this short-circuit evaluation to get ternary operators

	x: cond & option1 | option2

maybe you could leverage it for `if-else` like chaining as well

	size: 250;

	console.log('size is ' +
	          size < 10   & 'tiny'
	        | size < 100  & 'small'
	        | size < 500  & 'medium'
	        | size < 1000 & 'large'
	        |               'enormous')

actually, note that ternary and short-circuit are different in javascript

```js
console.log(options && undefined || 'else');  // will print 'else'
console.log(options ?  undefined :  'else');  // will print undefined
```

see [this answer](https://stackoverflow.com/questions/51051571/what-is-the-difference-between-using-and-over-a-ternary-operator/51051784) for more details

likewise, I don't think we can equate ternary and short-circuit evaluation in Axis
I think we should still use the `?` syntax explored earlier


	x: cond ? option1 else option2

	size: 250;

	console.log('size is ' +
	             size < 10   ? 'tiny'
	        else size < 100  ? 'small'
	        else size < 500  ? 'medium'
	        else size < 1000 ? 'large'
	        else               'enormous')

	

### Isolating Error Handling

this was kinda talked about in metaprogramming sections
	// TODO: FIND REFERENCED SECTIONS

notice how complex code can get when you have to account for errors throughout the code

```js
for (let match of matches) {
	let matchText = match[0];
	let endOfInput = match[0].length == 0;
	let blockType = parenRegex.test(matchText) ? 'Braces' : 'Indent';
	let direction = null;  // "start" to indicate block start, "end" for end of a block
	let offset = match.index;
	let offsetLast = match.index + matchText.length;

	if (blockType == 'Braces') {
		let direction = (matchText == '(')? 'start' : 'end';
		bracesLevel += (direction == 'start')? +1 : -1;
		if (bracesLevel < 0)
			throw Error('Pre-processing error, extra closed brace at offset ' + offset);

		yield { direction, blockType, offset, matchText };

	} else {
		let indentLevel = endOfInput ? baseIndent : self.indentLength(match[1]);

		if (bracesLevel > 0) { // If we are inside a braced block,
			if (indentLevel < prevLevel()) { // make sure indentation stays above the block's base level,
				throw Error('dedented below base indentation, offset ' + offset);
			}
			continue; // but otherwise ignore the indentation
		}

		if (indentLevel > prevLevel()) { // indentation increased
			indentStack.push(indentLevel);

			yield { direction: 'start', blockType, offset, matchText };
		
		} else if (indentLevel < prevLevel()) { // indentation decreased
			while (indentLevel < prevLevel()) { // pop levels from stack until indentation level matches
				indentStack.pop();
				if (indentStack.length == 0) {
					throw Error("Pre-processing error, dedented below enclosing braces, offset " + offset);
				}
				yield { direction: 'end', blockType, offset, matchText };
			}
			if (indentLevel != prevLevel()) {
				throw Error('Pre-processing error, bad indentation at offset ' + offset);
			}
		}
	}
	if (endOfInput) break;
}
if (bracesLevel > 0) {
	throw Error('Pre-processing error, unclosed braces');
}
```
look how much simpler it could be if we didn't have to worry about these errors

```js
for (let match of matches) {
	let matchText = match[0];
	let endOfInput = match[0].length == 0;
	let blockType = parenRegex.test(matchText) ? 'Braces' : 'Indent';
	let direction = null;  // "start" to indicate block start, "end" for end of a block
	let offset = match.index;
	let offsetLast = match.index + matchText.length;

	if (blockType == 'Braces') {
		let direction = (matchText == '(')? 'start' : 'end';
		bracesLevel += (direction == 'start')? +1 : -1;
		yield { direction, blockType, offset, matchText };

	} else { // indent type is "Indent"
		let indentLevel = endOfInput ? baseIndent : self.indentLength(match[1]);

		// If we are inside a braced block, ignore the indentation
		if (bracesLevel > 0) continue;

		if (indentLevel > prevLevel()) { // indentation increased
			indentStack.push(indentLevel);

			yield { direction: 'start', blockType, offset, matchText };
		
		} else if (indentLevel < prevLevel()) { // indentation decreased
			while (indentLevel < prevLevel()) { // pop levels from stack until indentation level matches
				indentStack.pop();
				yield { direction: 'end', blockType, offset, matchText };
			}
		}
	}
	if (endOfInput) break;
}
```
Axis allows for abstracting away error detection from the main process

	block1:
		var indentStack(index: iteration)
		block2:
			block3:
		block4:
			block5:
				do while (indentLevel < prevLevel()) { @iteration
					indentStack.pop();
					yield { direction: 'end', blockType, offset, matchText };

	errors: collector
	errorDetection:
		if (block2.indentLevel = undefined) errors <: 'indentlevel undefined'
		for iteration in block5[0]: @iteration
			if (indentStack.length = undefined):
				errors <: 'Pre-processing error, dedented below enclosing braces, offset " + block5[0][iteration].offset




### Bracket blocks

what happens if you do `foo[a: 10]`
what happens if you do `foo[...bar]`
what happens if you do `foo[bar <: 10]`

I think all of these should be illegal

what about `foo[bar(10)]`

### Unary Operators and Ambiguity

 * `a-b` can be interpreted as:
	* two list items with one unary operator: `a, -b`
	* one item created from a binary operator: `a - b`

* intuitively:
	* `a-b` should be interpreted as a single item
	* `a -b` should be interpreted as two items
	* `a - b` should be interpreted as a single item

* actually, this is how matlab/octave handles it (using [octave-online](https://octave-online.net/) to test:

```matlab
x = [1-2]    % result: [-1]
x = [1 -2]   % result: [1, -2]
x = [1 - 2]  % result: [-1]

x = [1--2]     % error
x = [1- -2]    % result: [3]
x = [1- - 2]   % result: [3]
x = [1 - - 2]  % result: [3]

x = [1 - - - 2]    % result: [-1]
x = [1 - - - - 2]  % result: [3]
```

* matlab also briefly mentions its spacing rules [here](https://www.mathworks.com/help/matlab/matlab_prog/case-and-space-sensitivity.html) and [here](https://www.mathworks.com/help/matlab/matlab_prog/command-vs-function-syntax.html)

* maybe I should just classify an operator as a unary operator if it:
	* is the operator `!`, `!!`, `+`, or `-`
	* is preceded by whitespace or comma
	* is followed by a word character `\w`, or an open brace `(`
* then I can just modify the lexer to catch unary operators before they are passed to the grammar

### Unary Operators and Ambiguity II - Matlab/Octave Analysis

(continued from section "Unary Operators and Ambiguity")

* more observations, using [octave-online](https://octave-online.net/):

```matlab
x = [2*-3]   % result: [-6]
x = [2*- 3]  % result: [-6]
x = [2 *3]   % result: [ 6]
x = [2 * *3] % error
x = [2 **3]  % 8
x = [2** 3]  % 8


x = [2 + - + - +1] % result: [3]
x = [2 + - ! - !1] % result: [1]

x = [2 ! !1] % result: [2, 1]
x = [2 - -1] % result: [3]

x = [2- -1] % result: [3]
x = [2! !1] % error

x = [2!]    % error
x = [2! 1]  % error
x = [2 ! 1] % result: [2, 0]

y = 5
x = [y---3] % result: [2] (note: octave has "--" decrement op)
x = [y---3] % result: [1]
x = [1+-+2] % result: [-1]

x = [x -+]
```

* I think the way it works is there are a set of binary operators, `+,-,**,*,/,%,&&,||,<,>,<=,>=,=,==`
* and a set of unary operators `!,+,-`

* the lexer consumes as many operator characters as it can, the first largest-valid operator, and creates an operator token

then the token is parsed via these rules:
	1. if the operator token has no leading whitespace, eg `x- y` or `x-y`, it is considered a binary operator (which is why `[2! 1]` fails)
	2. else, if it has trailing whitespace, eg `x - y`, then it is first considered a binary operator, and if that fails, it is considered a unary operator
	3. else, it must look like `x -y`, and it is considered a unary operator first, and if that fails, it is considered a binary operator

* if there are multiple operator tokens, the first is determined by the rules above, all the rest are considered unary operators


* hmm that means something like `[1 -+2]` would be interpreted like `[1, -2]`
* and it is! tested with octave-online

* what about `[1 -+ 2]`? this is also interpreted like `[1, -2]`, as predicted
* because the first largest-valid operator, `-`, has no whitespace after, so it is considered a unary operator
* and since `+` is the second successive operator it is automatically considered a unary operator

* what about `[2 *- 3]`? as predicted, it is interpreted as `[-6]`, because even though `*` has no trailing whitespace,
* 	it can't be a unary operator, so it is interpreted as a binary op

* what about `[2!1]`? as predicted, it gives an error, since `!` has no leading whitespace it is considered a binary op, which fails

* in summary

```matlab
x = [1 -+2]  % result: [1, -2]
x = [1 -+ 2] % result: [1, -2]
x = [2 *- 3] % result: [-6]
x = [2!1]    % error
```

* So it seems like we have decoded the rules behind octave (at least, octave-online)

### Unary Operators and Ambiguity III - My Rules to Resolve Ambiguity

(continued from section "Unary Operators and Ambiguity II - Matlab/Octave Analysis")

* I personally want to make my rules a bit simpler than Octave's
* the way mine will work is

for the first largest-valid operator:
	1. if the operator token has leading whitespace, but no trailing whitespace, then it is considered a unary operator first (and if that fails it is considered binary)
	2. otherwise, the operator is considered a binary operator first (and if that fails it is considered unary)

* the only difference this has with the octave rules is, if the operator has no leading whitespace, eg `[2!1]`
* with octave's rules, it must be a binary op, so `[2!1]` will fail
* with my rules, it is first considered a binary op but if that fails it is tried as a unary op, so `[2!1]` will return `[2, 0]`

* these rules are also quite easy to represent using regex
* in the moo lexer

### Unary Operators and Ambiguity IV

* actually how do we account for something like `foo: 1 -2`
* should it be parsed as a property and a list item, `foo: 1, -2`
* or should it be parsed as `foo: (1-2)`

* how does matlab/octave handle it?

```matlab
x = 1-2   % result: x = -1
x = 1, -2 % result: x = 1, ans = -2
x = 1 -2  % result: x = -1

x = [y=5 -2]  % result: x = [5, -2], y = 5
y=5 -2        % result: y = 3
```

* so the rules change if it isn't in an array declaration

* actually, according to our rules, properties have to be preceded and followed by commas or newlines
* so `foo: 1 -2` has to be parsed as a single property

* it can still be confusing if we have expressions in space-delimited lists, aka "spaced lists"

		x: (1 * (2-3) -4 *5)

* if we followed matlab/octave rules, this would be equivalent to

		x: (1*(2-3), -4*5)    // result: (-1, -20)

* clearly very confusing


* perhaps the rule we should use is,
* spaced lists can only contain objects or unary expressions, eg

		x: (1 2 -3 4 -5)

* you can also do property access and all that

		x: (1 2 -3 foo.bar zed[test])

* but it cannot contain normal expressions, aka ones that contain binary operators, eg `2 * 3`
* this means that for something like

		foo(1 |2 -3)

* the inside of the brackets will be parsed as a single expression
* because it uses the binary operator `|`, so it can't be parsed as a list of unary expressions
* whereas something like

		foo(1 -2 -3)

* can be parsed as a list of unary expressions, so it is parsed as 3 separate items


* or maybe we should make it illegal to mix spaces and commas
* eg `foo: combine(10 20 30, x: "hello", y: "world")`
* or maybe we should make it so you can only have one spaced list

* or maybe we should just use brackets `[]` for lists
* this would free up braces `()` for grouping
* however, it would prevent one from mixing list items and properties

* or maybe if you want to use binary ops in spaced lists, you can't use spaces
* eg
	
		(1*2 3+4 -5)

### Unary Operators and Ambiguity V - Revised Rules to Resolve Ambiguity

* actually I think no matter how we design these rules it will be sorta confusing
* whether we allow binary operators in spaced lists, or not
* or if the presence of a binary op automatically makes the entire thing an expression

* either way, what's important is that it's always possible to make it unambiguous and not confusing
* just use commas, and don't use uneven spacing like `a -b`
* instead of doing

		(1 * (2-3) -4 *5)

* do

		( 1 * (2-3), -4*5 )

* this is clear and unambiguous

* when it comes to spaced lists, I think I'll just use octave's rules
* with a few small tweaks

* something I don't like about octave's rules is that it depends on the operator

```matlab
[1 -2]    % "-" evaluated as unary due to spacing rules
[1 *2]    % "*" evaluated as binary because doesn't exist as unary op
[1 - 2]   % "-" evaluated as binary due to spacing rules
[1 ! 2]   % "!" evaluated as unary because doesn't exist as binary op
```

* the only exception is if there is no leading whitespace, where it is forced to be a binary op, so something like `[x!y]` would throw an error

* I think if we want it to depend on spacing, we shouldn't depend on the operator as well
* so the way I want to design it is

1. if the operator token has leading whitespace, but no trailing whitespace, then it is considered a unary operator first (and if that fails it is considered binary)
2. otherwise it is evaluated as a binary op

* thus:

		(1 -2)    // "-" evaluated as unary due to spacing rules
		(1 *2)    // error, "*" evaluated as unary
		(1 - 2)   // "-" evaluated as binary due to spacing rules
		(1 ! 2)   // error, "!" evaluated as unary
		(1!2)     // error, "!" evaluated as unary
		(1! 2)    // error, "!" evaluated as unary

* what if you have multiple operators?
* recall that matlab/octave treats every operator after the first one as a unary operator
* this makes sense, as you can't have multiple binary operators anyways

* however, I think it looks confusing if you have these "spaced unary operators", that look like binary ops
* again, I think if it depends on spacing, it shouldn't depend on anything else
* so if you have leading and trailing whitespace then it is a binary op
* something like `1 !!2`, the first `!` op is unary because leading but no trailing, and all following ops also have no trailing whitespace
* the only time you are allowed spaces after unary ops, is at the beginning of a statement/expression
* eg

		1, ! ! 2, 3
		4 + (! ! 5)   // enclose in parenthesis so now ! ops are at beginning of statement (note that + will strip the parenthesis)

		x: ! ! 5      // can be at the beginning of an Expression too

* note that the statement can only contain one object though
		
		! true | true    // illegal

* this is because we can see how confusing it can get, it looks almost as if the `|` operator will go first, and the answer would be `false`
* but in fact, since `!` has precedence, the answer will be `true`
* thus, to prevent this confusion, you are only allowed to have a single unary object if you want to add spaces after an unary
* these are called **spaced-unary expressions**
* this also makes the grammar much simpler, since it gets hard to encode rules for the "beginning of a statement" while maintaining unary operator precedence
	* because a "beginning of a statement" rule would be towards the root of the tree, but unary operators are at the leaves, so trying to do both is ugly
	* put another way, when we parse unary operators at the leaves of the parse tree, it's hard to tell if we are at the beginning or middle of an expression
* if you want a binary expression with spaced unary operators, you have to use braces

		(! true) | true    // legal, and less confusing

### Spaced Lists vs Comma/Newline Delimited Lists

* notice that spaced-unary expressions are the only difference between space-delimited lists, and comma/newline delimited lists
* in comma/newline delimited lists, you can have spaced-unary expressions

		(- 10, - 20, - 30)

* in space-delimited lists, you cannot

		(- 10 - 20 - 30)   // illegal, first operator is interpreted as binary, but has no left-hand-side
		( -10  -20  -30)   // legal



### type casting?


type casting

unlike javascript, does not convert `0` to `false`
only `undefined` is converted to `false`

however type casting works for boolean->string or number->string
eg `"x" + y()'`




### Dynamic Overriding

notice the difference between the two lines below

	foo(a b c)   // passes 3 arguments
	foo(0: a, 1: b, 2: c)   // sets three properties

this is different from object creation, where they are the same

	(a b c) = (0: a, 1: b, 2: c)


slightly related: how would we override multiple properties of array at once, eg override range 0-10
or how would we override multiple properties of object at once, eg a dynamic set of keys?

two ways are

	source(...object)   // override source with all properties in input object

	source.apply(object)  // equivalent to the line above

note that if you have static set of keys in scope that you want to pass in, you can do

	key1: ...
	key2: ...
	key3: ...

	source(key1^^ key2^^ key3^^ )   // the ^^ operator is the same as object property shorthand in javascript

### Typing - Static vs Ducktyping

* i was looking at [Bosque language](https://www.theregister.co.uk/AMP/2019/04/18/microsoft_bosque_programming_language/) and they talk about reference equality problems
* how ambiguities can arise if two references point to the same memory

* there is one case in my language that seems similar
* alias variables, eg `foo: (cond) ? a else b`
* somewhere you have to be worried about changing types as well


* type systems force people to know what types are accepted beforehand
* eg if you do

		ArrayList<Toy> toys = new ArrayList<>();

* then you can only insert items that are of type `Toy` or extend `Toy`
* then there is a static set of types that can be used
* reminds me of the chest example
	* see section "Combiners, Insertion and Privacy"

* wheras with ducktyping, as long as you implement the correct methods/properties, it will work
* this allows people to dynamically create "new types", and use them
* the source doesn't have a pre-defined list of compatible types
* its dynamic

* actually this is wrong, even in statically typed languages, you can dynamically create a new compatible type
* like in Java, you can dynamically create an anonymous class that extends `Toy`, and it will work

* static typing seems to be more about,
* running some basic checks on the input objects beforehand
* so when you create `function (Toy t)`, it won't just accept any old object
* it makes sure that the object has type `Toy`
* and there is a set of rules on how an object's `type` property is determined (you can't just set it yourself, you have to "extend" the parent object)

* maybe we can do something similar



mixins
can you combine objects to so that the result object has multiple types?
I guess you are guaranteed no collisions if the objects use symbol properties
what if the parent objects have private behavior
does this violate privacy/security somehow?

### Making the Case for Reference Equality

* I looked a bit more into [Bosque's arguments against reference equality](https://github.com/Microsoft/BosqueLanguage/blob/master/docs/language/overview.md#011-equality-and-representation)
* it seems like they are really just pushing for [more useful equality comparisons](https://github.com/Microsoft/BosqueLanguage/blob/master/docs/language/overview.md#5.21-Equality-Comparison)
* basically it seems like they are saying that, many places that use reference equality would be better suited to use something else, like value comparison
* for example, if you were comparing two arrays, its more useful to compare the values in the array, then check if they are the same "reference"
* the idea is that, when you inspect or compare an object, you shouldn't think in terms of memory locations or addresses or other computer-hardware concepts
* you should define some concept of "value"
* so that even if two objects have different addresses, as long as they have the same value, they are "equal"
* basically it seems like Bosque forces you to define a "value" property for all custom classes/objects

* I personally don't think of "references" as memory locations
* I think of them as a way to represent or capture a concept
* when I create an object `foo: (...)`, I am creating a new concept called `foo`
* and I can prescribe whatever relationships I want between `foo` and other objects
* including a "value" property, if I wish
* but by default, I can use reference equality to see if somebody is pointing to my `foo` object

* I could use some sort of "deep value equality" algorithm to do comparisons
* traverse through both objects, looking for primitive values and discarding circular references
* but I don't think this should be the default
* especially when, in a reactive language like mine, objects are constantly changing
* you don't want two objects to be unequal one moment, and then equal the next
	* just because some internal property changed

* in addition, I don't create a distinction between primitives and other objects
* whereas it seems like Bosque seems to treat primitives as some sort of fundamental source of equality
* I treat primitives like any another object
* they just happen to have predefined equality functions
* but ultimately, those equality functions are rooted in reference equality as well
* for example, take the numbers `1`, `2` and `3`
* these objects exist as distinct concepts
* it's up to us to define the relationships between them, that `1 + 2 = 3`

* we sorta talked about this in "Objects as Property Keys II"
* also, functional langs represent numbers and primitives using functions, similar concept

* I think we also talked about similar ideas when talking about Symbols
* because languages like Lisp allows creation of primitive Symbols
* that represent abstract concepts, and use reference equality, just like objects in my language

* the philosophy is, when you define a new object, you are by default creating a "new unique concept"
* and you shouldn't worry about whether your new object might happen to contain the same primitive values as some other object in the world
* every created object starts out as distinct
* just like in the real world, where every physical object is different, even if they may look the same
* whether or not we _treat_ them the same is up to us to define,
	* and can be achieved by overriding the hash or equality operators of the objects


* note: another way we can think of "deep equality" is
* we look at the properties of the two objects, and compare
* if a property points to the same address for both objects, then we continue
* if the property points to different addresses, then we do a deep equality comparison on those two addresses
* basically recurses whenever it sees unequal references
* however, if two references are unequal, but at least one of the references points to an empty object (no properties)
* then the original two objects are determined to be unequal
* because remember, we use these empty objects to represent "primitive" concepts
* like, `1` and `2` are both just empty objects

* but here we can see how deep equality can be a problem
* because what if we have private behavior
* it would be a security/privacy concern if you could compare private behavior, that you can't see
* you can take an arbitrary object, and check if it "equals" `3`, even if you can't see its value
* so yet another reason why deep equality should not be the default

### synchronization, external calls, and timeouts

how can you synchronize a module if it contains an external call
maybe it passes a collector
you don't know how many times the external actor will insert into that collector
maybe you pass a callback, you don't know how many times the external actor will call that callback
maybe you are simply calling an external library function, but you don't know if the result might change
	eg if there is private behavior, after you extract the result of the function call, it might still change after some time

this seems related to the "inversion of control" problem with callbacks,
	discussed earlier in the section "Iterables"

perhaps we can leverage timeouts
after a certain amount of time, you stop listening to changes
perhaps this doesn't even need to be a special built-in mechanism
if you do something like

	foo: timestamp >>

		collect: collector
		externalApi1(collect)
		externalApi2(collect)

		=> collect.filter(insertion => insertion.timestamp < timestamp + 100))  // only return items that were inserted within 100 seconds

then the interpreter can detect that insertions after 100 seconds will be ignored
so it can return the synchronized result after 100 seconds
kinda like how with iterables, since items are lazy evaluated, if you break out of a `for...of` loop it ignores all the rest of the elements
	and they don't need to be computed

is this even possible to detect?


### Unary Operators and Spaced Unary Ops - Mechanism Brainstorm

(continued from section "Unary Operators and Ambiguity V - Revised Rules to Resolve Ambiguity")

* to summarize, there are two places we can have unary operators

* inside an expression, an unary operator must:
	1. be preceded by a whitespace or operator
	2. have zero trailing whitespace

* eg `1 -2 !!3` is interpreted as `1, -2, !(!3)`

* for a "spaced-unary object", you can use spaced unary operators if there is only a single operand, eg

		! ! true

* for expressions, we have to detect that in the lexer, as it depends on whitespace
* luckily it is not too hard to do so, we can use the following regex (explained in the next paragraph):

```js
unary_op: /(?<=^|\s|[!+\-*/%<=>&|])(?<!\-\>)[!+-](?=\S)/
```

* basically, use first lookahead to make sure it is after whitespace/operator, and second lookahead to make sure it _isnt_ after the `->` operator,
* however, lookbehind isn't properly supported in many browsers, so there is another method,
	* that is perhaps even more robust but requires some postprocessing in the lexer
* basically, every time the lexer reaches an operator token, check if the previous token was a whitespace or operator
* this is more robust than using a regex because we already have a well-defined set of operators in the `operators` regex of the lexer
* we don't have to do the weird double look-behind thing

* as for spaced-unary expressions, we can check that easily in the grammar
* just use a rule like `Expression -> Unary`

* though hmm I can actually detect it in the lexer using regexes
* just check if the previous non-whitespace token was an open brace (`(` `[` or `{`), a colon `:`, a comma, a `<:`, or a newline (for non-braced blocks)
	* actually there are a few more cases where `Expression` shows up in the grammar, check `grammar.ne`
* being able to detect it using simple regex is advantageous, because many syntax highlighters use regex

* note that with this rule, I can also easily detect spaced unary operators at the beginning of an expression, even if the expression has binary operators
* eg something like

		! true & true

* we talked earlier about how such a thing can be confusing, but I also don't want to restrict the programmer too much

* actually, one major complication is if-statements, because they are formatted like `if (Expression) Expression else Expression`
* notice how here, we have an expression after a closed brace, so we could do
	
		if (cond) ! ! foo

* but normally, after a closed brace, you are not allowed to have unary operators with trailing whitespace

		(1 + 2) ! foo   // illegal, unary operator with trailing whitespace in the middle of an expression

* this is a big challenge because we have to start detecting brace level

		if ((((((...)))))) ! ! foo    // legal or illegal? did we close all the braces?

* surprisingly, it seems like sublime-text's syntax highlighting is robust enough to tell the difference

```js
if (1+(2)) -3;   // -3 detected as a unary operator and number
if (1+(2)  -3;   // -3 detected as a binary operator and number
```

* I checked the documentation for [syntax highlighting in sublime](http://www.sublimetext.com/docs/3/syntax.html),
* and it seems like they use a stack method for pushing/popping "contexts", eg the "string context" or "if-else context"
* thus, this is pretty much the same as using a grammar (since push-down automata and grammars are equivalent)

* thus, it seems like I do have to use a grammar if I want to support spaced unary operators for all `Expression`s
* however, that isn't a problem when it comes to syntax highlighting, because syntax highlighters seem to support context-free languages

* still leaves the question of whether or not to allow spaced unary operators in front of any expression, or just single operand expressions
* while it is a bit complicated to parse spaced unary operators in front of any expression, we don't want to restrict the programmer
* what happens with something like this:

		(- 2 -3)

* is it a list of two items? but then it wouldn't be an expression, so you wouldn't be allowed to have spaced unary operators right?
* what about something like

		(- 2 - 3)

* ambiguous, this can be interpreted as `(Unary Unary)` or `(Unary Binop Object)`
* it gets complicated because, with our current grammar, a `Statement` can be made up of multiple `Item`s, and an `Item` can be an expression
* so you can have multiple spaced expressions
* and if each one of them can have spaced unary operators, you end up with ambiguity, as shown above

### Unary Operators - Spaced Expressions vs Spaced Unary Ops

* so I think we have to change the rules a bit
* first, parsing spaced unary operators in front of expressions with binary operators, gets too complicated
	* we can't do it in the lexer because of if-statements
	* and doing it in the grammar is ugly, as mentioned earlier
* in addition, we have to distinguish between the `Expression` objects in spaced lists, and the `Expression` objects everywhere else
* because in spaced lists, you can have multiple spaced expressions, but they aren't allowed to turn into spaced-unary expressions
* but everywhere else, you can turn an `Expression` into a spaced-unary object
* thus, for spaced lists we introduce a `SpacedExpr` non-terminal
	* these are not allowed to have spaced unary operators
* `Statement` objects are allowed to turn into a single `SpacedUnary`, or multiple `SpacedExpr` (for lists)
* `Expression` objects in if-statements and property definitions and such, are allowed to turn into a single `SpacedUnary` or a single `SpacedExpr`

* in a `SpacedExpr`, all unary operators must:
	1. be preceded by a whitespace or operator
	2. have zero trailing whitespace

* in a `SpacedUnary`, there can only be a single operand, but it can have spaced unary operators

* notice that a single operand with no spaced unary operators, can be interpreted as both a `SpacedExpr` and a `SpacedUnary`

		(-30)     // can be a SpacedExpr because the unary follows spacing rules, but can also be a SpacedUnary because there are no binary operators

* technically it doesn't matter, especially because Nearley grammars are allowed to be ambiguous, but I'd still like to keep it unambiguous

```
-30+1   // Expression
-30     // SpacedUnary or Expression
- -30   // SpacedUnary
- -30+1 // illegal
```

* two ways to resolve the ambiguity
	1. separate into `UnaryExpr` (expression with one operand) and `BinExpr` (expression with multiple operands)
	2. separate into `SpacedUnary` (has at least one spaced unary operator) and `Expression` (no spaced unary operators)

* I prefer the second option, because spaced unary operators is an extra feature, so I want to keep it as separate as possible

### Unary Operators - Detecting the First Unary Operator

* imagine if we didn't have spaced unary operators, and let's just focus on normal unary operators
* what happens with

		if (cond)-30+1 else (5 - 1)

* this is technically valid
* but the `-` will be interpreted as a binary op
* but in the grammar we have

		Unary -> %unary_op Unary | Object

* we can't just change it to 

		Unary -> %unary_op Unary | ("!"|"+"|"-") Unary | Object

* because now, while it will capture that leading binary `-` as an unary,
	* it might also capture the second `-` as unary, and interpret `(5 - 1)` as `(5, -1)`

* maybe we can just enforce leading spaces in this case as well

		if (cond) -30+1 else (5 - 1)

* but I think its key to note that, as of now our rules are _not_ ambiguous
* from spacing rules, we can determine whether ops are unary or binary, and can figure out the grouping of list items, eg:

		2 -3 -4 * 5 - 6 +7

* becomes

		{2}  {-3}  {{-4*5}-6}  {+7}

* the only complication is with unary operators on the very first operand
* even if we ignore spaced unary operators, the first unary operator doesn't have to follow spacing rules
* it can have zero leading whitespace
* as shown in the if-statement example earlier in this section
* in most cases, we can check if it is at the beginning of an expression by checking for the preceding character
* if it's not preceded by whitespace, it can be preceded by `:`, `<:`, `,`,`in`, any open bracket, or a newline
* the only case that is not accounted for is if-statements, where the expression can directly follow the conditional block
* the problem is, the lexer can't distinguish between a conditional block `(cond)`, and an object `(object definition)`
* eg

		if (cond)-30   // "-" is unary, start of expression
		(1+2)-30       // "-" is binary, not start of expression

* I am actually considering making conditional blocks like

		if cond ? trueBranch else falseBranch

* in that case, we can just check if the preceding operator is `?`
	* sidenote: you can also use a similar syntax for ternaries, eg `someProp: cond ? trueBranch else falseBranch`

* however, it's also important to note that we _can_ check if an operand is the first operand of an expression, without relying on preceding operators
* we can do it in the grammar
* it is just a bit ugly
* basically, for every binary op rule that looks something like:

			And -> And "&" Eq | Eq

* we would have to change it to

			FirstAnd -> FirstAnd & Eq | FirstEq
			And -> And "&" Eq | Eq

* in essence, we split every non-terminal into two, one that represents the beginning of the expression, and one for everywhere else
* it is designed such that no matter how you expand `Expression` into these non-terminals,
* you will always have exactly one `First___` non-terminal on the leftmost side

* there is actually one final option for parsing `if (...) Expression` statements
* because nested blocks are extracted and parsed separately (due to modular parsing), we are actually guaranteed that all braced blocks are only one level deep
* so it will actually look something like

		if ( BLOCK_19 ) Expression

* I didn't want to leverage this fact because I wanted my grammar to be compatible with non-modular parsing (which would have arbitrarily deeply nested block)
* however it seems like for now, this is the cleanest way to do it
* which is important because the syntax may change, and I don't want to complicate things this early

* thus, we can use a simple regex to check if the current operator is preceded by an if-statement, eg this regex `/if\s*\(.+\)/`
* we can also check this in the lexer, by keeping track of the previous few tokens if they match the structure of an if-statement

* note that we could also use this to detect spaced unary operators and convert them to regular unarys
* this would allow us to handle leading spaced unarys even for binary expressions, eg `! ! x | y`
* however, I still don't like the idea of the rules for unary operators changing when at the beginning vs middle of an expression
* for now I'll still restrict spaced unary operators to single operand expressions
* and we can always relax that restriction later
* it's better to start with a restriction and relax it later
* than add restrictions later (because it could prevent backward compatibility)

### If Statements vs Ternary Expressions

(continued from previous section, "Unary Operators - Detecting the First Unary Operator")

* actually, I don't think there is a problem with detecting the first unary operator in if-statements
* because actually, I think if-statements should be made up of `Statement`s, not `Expression`s
* so the grammar rule would look like

		Statement ::= if (Expression) Statement else Statement

* whereas ternary expressions do use `Expression`s

		Expression ::= Expression ? Expression else Expression

* thus, if we had an object like so:

		conditionals: cond >>
			if (cond) foo: 10 else foo: 20  // legal
			if (cond) 10      else 20       // resolves to statements (0: 10) or (0: 20)
			bar: if (cond) 10 else 20       // illegal

		ternaries: cond >>
			cond ? foo: 10 else foo: 20     // illegal
			cond ? 10      else 20          // resolves to list items
			bar: cond ? 10 else 20          // legal

* notice that `if (cond) 10 else 20` resolves into `if (cond) 0: 10 else 0: 20`, before inserting those statements into the parent object
* whereas the ternary `cond ? 10 else 20` just returns those values to the parent object, who will assign the index dynamically like any other list item

* in addition, because `if (cond) 10 else 20` is valid syntax, we can see that it actually doesn't solve our issue with detecting first unary operators
* because you can still have `if (cond)-10`

* maybe we should make it illegal to put anonymous values/expressions in if-statements, because it is frankly very confusing
* this: `if (cond) 10 else 20`, turning into this: `if (cond) 0: 10 else 0: 20`, is very unintuitive behavior...

* actually I think we should make if-statement be like the spread operator
* so something like

		if (cond1):                 // note: a colon ":" in an if-statement is for specifying a block of statements, not just a single statement
			x: 10
			some, list, items
		if (cond2):
			y: 20
			more, list, items

* is the same as doing

		...(cond1 ? (x: 10, some, list, items) else () )
		...(cond2 ? (y: 20, more, list, items) else () )

* notice that since we are using spread operator, the anonymous values are now being dynamically indexed
* also notice that this means these two statements are equivalent
		
		if (cond) 10 else 20
		cond ? 10 else 20

* this introduces a bit of ambiguity...

### If Statements vs Ternary Expressions II

* to make if-statements and ternary expressions a bit more distinct, I think if-statements should only be used for blocks of statements
* so:

		if cond1:
			x: 10
			some, list, items

		if cond2: (y: 20, more, list, items)

		if cond: 10 else 20   // illegal

* notice also that, we now always require a colon `:` after the condition, and the condition isn't wrapped in braces anymore
* this actually now matches the syntax of python almost exactly
* this also solves our problems with leading unary operators, because we don't need to detect them in if-statements anymore,
	* because if-statements are for statement blocks, not expressions
* it is also more consistent with for-loops, which also use a colon `:` and expect a block of statements

		for x in list:
			collector <: x

* though it's interesting to note that [scala and ruby allow if-statements to be expressions too](https://stackoverflow.com/questions/160218/to-ternary-or-not-to-ternary)
* I don't think it would be hard to just swap the keywords of a ternary statement though, just switch the grammar rule from this:

		Ternary	::= Or "?" Ternary "else" Ternary        // right associative

* into this:

		Ternary	::= "if" "(" Ternary ")" Ternary "else" Ternary     // doesn't need associativity

* one possible complication is, if you want multi-line conditionals (which is very common), then you need to wrap it in braces
* eg (taken from my `lexer.js` code, modified for Axis)

		if { expressionStartTokens.includes(first.value)  // first token must indicate start of expression
				& second.type = 'all_ops'                 // second token must be an operator
				& third.type != 'WS' }:                   // third token cannot be whitespace
			newToken: second(type: unary_op)

* right now we are using `{}` for grouping, but grouping syntax isn't finalized yet
* ideally I thought we wouldn't need grouping at all but I am finding more and more cases where it seems necessary

* another solution is to have `if` statements to act like operators, and strip the parenthesis around conditionals as well
* which sorta makes sense,
* because using a single-item list like `(a & b)` inside an if-statement `if (a & b):` doesn't really make sense anyways
* because obviously the single-item list would be evaluated as `true`, no matter what `a` and `b` are
* this is explored more in the later section "Grouping and Multi-Line Syntax"

### Detecting Spaced Unary Operators

* notice that, now that if-statements have a `:` after the operator, this also makes it easier to detect spaced unarys
* we can actually detect it in the preprocessor, at the same time we are detecting regular spaced unary ops
* just do a look-behind and see if it is the start of an expression (skip over operators to account for cases with multiple spaced operators)
* note that there is nothing stopping us from allowing spaced unary operators in front of expressions with binary operators
* earlier we discussed how if-statements make it difficult to detect in the lexer
	* see section "Unary Operators - Spaced Expressions vs Spaced Unary Ops"
* but now that isn't a problem
* we can even start detecting spaced unary ops _inside_ expressions,
* just make it so any operator after a binary op is an unary op, regardless if it has spaces or not
* however, that doesn't change how ambiguous and confusing the syntax can become
	* discussed in section "Unary Operators and Spaced Unary Ops - Mechanism Brainstorm"
* for example:

		(- a - b)    // even though both operators have spaces, first is detected as unary, second is detected as binary
		(! a | b)    // ! operator has precedence so evaluated first, which might be confusing
		(a - - b)    // first operator is detected as binary, so this becomes (a - -b)
		(a --  b)    // first operator is detected as unary (no trailing whitespace), so this becomes (a, --b)

* thus, we will stick to restricting spaced unary operators to single-operand expressions

### Inverse If Statements

* maybe we can have a different format for If-statements, something like

		school: "open" if (not snowing) else "closed"

* this feels more natural, since in english we would say "the school is open if it is not snowing, otherwise it is closed"
* notice how it puts focus on the "default" state of `open`
* normally, we might do something like

		school: snowing ? "closed" else "open"

* we put `closed` first because that was we don't need to negate `snowing`
* however, intuitively, the default state is actually `open`
* so we should put focus on that, by inverting the `snowing` condition and putting it afterwards to get what we had previously:

		school: "open" if (not snowing) else "closed"

* this idea of putting focus on the default state, and then relegating alternate states, was an idea also explored with metaprogramming
* in the section "Metaprogramming and Version Control, Mods, Plugins, etc",
* we talk about how metaprogramming can be used to abstract away edge cases

* so in this case, in the top-level overview of the program, you only see

		school: "open"

* everything else, the condition and the "else" branch, is hidden

* this could look better with chained statements too

		tempSummary: "hot" 		if (temp > 95) else
					"warm" 		if (temp > 75) else
					"room temp" if (temp > 65) else
					"chilly" 	if (temp > 55) else
					"cold"

* actually, [python uses this style](https://stackoverflow.com/questions/23387929/why-is-the-ternary-operator-in-python-if-else-and-not-if-then-else),
* so it might not be as weird as I thought
* the only difference is I wrap the condition in braces, which I actually think is better
* discussed in the later section "If-Expressions and Ternary"

### Partial Evaluation and Partial Application

* what would be cool is, if you provide some inputs for a function/object, but not all of them
* then the result object evaluates as much as it can, and displays how the behavior depends on remaining inputs that you haven't provided yet
* kinda like "partial evaluation"
* for example, lets say you defined an object `weatherCond` and then extended it with the object `today`

		weatherCond: snowing, temp >>
			school: not snowing ? "open" else "closed"
			students: school = "closed" ? "happy" else "sad"

			tempSummary: temp > 95 ? "hot"
					else temp > 75 ? "warm"
					else temp > 65 ? "room temp"
					else temp > 55 ? "chilly"
					else             "cold"

		today: weatherCond
			location >>
			snowing: false
			temp: location = "indoors" ? 75 else 50     // indoor temperature is room temperature

* then if you try to "inspect" or "print" `today`, you will see

		today: location >>
			school: "open"
			students: "sad"

			tempSummary: location = "indoors" ? "room temp" else "cold"

* note that since Axis is prototypal, `today` is an object not a template,
* and `location` has a value of `undefined`
* so if you try to access `today.tempSummary`, it will return `"cold"` because `location = "indoors"` will evaluate to false

* also note that this is different from the currying, partial application, and how Nylo handles incomplete arguments
	* see section "Currying and Returns"
	* also see [partial application](https://en.wikipedia.org/wiki/Partial_application)
* because the behavior of the function isn't dependent on what values are provided
	* this concept is discussed in section "Choosing Default Values Over Currying"
* with currying, if some arguments are undefined, the function returns another function ( a partially evaluated version )
* so that you can provide the remaining arguments
* eg

		fn: a b >>
			=> a+b

		x: fn(3 5)  // extracts the return value, and returns 3+5, aka 8
		y: fn(3)    // incomplete arguments, so returns a function
		z: y(5)     // extracs the return value, and returns 8

* however in the case we are discussing, calling the function always extracts the return value, but in some cases the return value is undefined
* and if you wanted to provide more arguments, you would have to call/clone the original function, not the extracted return value
* though...maybe you could? cloning the extracted return value and providing arguments, could be like overriding a nested level and providing arguments
	* mentioned in section "Implicit Inputs/Functions and Bounding Scope II"
* eg:

		foo:
			bar:
				result: fn(a,b)

		foo(a: 10, b: 20).bar.result   // this works
		foo.bar(a: 10, b: 20).result   // this works

		foo.bar.result(a: 10, b: 20)   // so what about this?

* no, you can see why it doesn't work
* difference between function and value
	* mentioned in a previous section, "Program vs Data"
* `result` points to the value of `fn(a,b)`
	* when you clone `result` you clone the value
* `foo.bar` contains the behavior of the expression `fn(a,b)`
	* when you clone `foo.bar` you clone the behavior, you are cloning the function call, not the function result

### Partial Application and handling `undefined`

(continued from previous section, "Partial Evaluation and Partial Application")

* recall that in the `weatherCond` example of the previous section, we had the snippet

		tempSummary: location = "indoors" ? "room temp" else "cold"

* `location` is unbound, and thus `undefined`, so `location = "indoors"` will evaluate to false, and `tempSummary` will evaluate to `"cold"`
* but it feels weird for `tempSummary` to have the value `"cold"`, even though we haven't provided a `location` yet
* maybe we should make any function/operator that depends on `undefined`, to be undefined as well
* this includes `=`
* so if one input is undefined, it spreads throughout the rest of the network
* the only way to stop the propagation is to "capture" it with a special statement `if (x = undefined)` or maybe `if (x exists)`
* kinda like catching errors in imperative languages

* we actually talked about this wayyy earlier
* see section "no binding means undefined value" and "Undefined Inputs"
* we even talked about it as early as section "Dangling Deep Property Bindings and Entry Nodes"
	* I think the idea was, in a network of bindings, if a conditional binding block is disabled, then you might end up with "dangling nodes"
	* aka nodes whose inputs aren't bound to anything, a disjoint graph
	* by default, all of these nodes and values in this graph, would instantly become `undefined`
	* unless there was an `if undefined` module, which can create a defined value from an undefined input

* i mean this idea sort of makes sense
* we can't evaluate `x = "something"` if `x` is undefined, because when we do end up defining`x`, we could give it the value `"something"`
* a function doesn't know how to handle `undefined` inputs, unless it specifically addresses  `undefined` values, eg using an `if undefined` block

* though at the same time, it does feel like `=` and equality is sort of special
* if `x` is undefined, then there is no way it can `=` something that is defined
* but what about two things that are undefined? are they equal?

* in the early section "Undefined Inputs" we concluded that `undefined` should be treated like any other symbol
* so when you do `x: undefined`, it creates a pointer to the symbol `undefined`
* and if you do `if (x = undefined)` it simply checks for reference equality, makes sure it's pointing to the same address as `undefined`

* it seems like there are two ways of thinking about `undefined` variables
* one, is to simply treat them as a value
* so for:

		tempSummary: location = "indoors" ? "room temp" else "cold"

* if you print `tempSummary`, it will print `cold` because `location` is not equal to `"indoors"`
* but the other way is to treat them as a _potential_ value, and see what potential behaviors can come as a result
* to treat them as a variable that doesn't have a value _yet_
* in that case, if you print out `tempSummary`, it will print out the entire behavior `location = "indoors" ? "room temp" else "cold"`

* though if you think about it, values don't have to be undefined for us to speculate about potential behavior
* eg from the `weatherCond` example in section "Partial Evaluation and Partial Application", if we wanted to we could display `today` as

		today: location >>
			school: "open"
			students: school = "closed" ? "happy" else "sad"
			tempSummary: location = "indoors" ? "room temp" else "cold"

* this shows the different behaviors that can occur if we override `today.school`
* so displaying potential behavior is not dependent on which inputs are defined and which aren't
* which inputs to evaluate, and which to keep unevaluated, is rather arbitrary

### Partial Application and Symbolic Execution

(continued from previous section, "Partial Application and handling `undefined`")

* if you want to display potential behavior, you have to specify which variables are inputs/parameters, and will be overridden in future calls/clones
* and instead of using the values for those variables, or using `undefined` for unbound variables, it treats the variables as "symbolic",
	and doesn't evaluate expressions that depend on them
* it's natural to treat all unbound variables as symbolic, but as shown in the example above, even defined values can be specified as parameters
	* after all, any language like Axis that allows default values for parameters, shouldn't really make a distinction between defined/undefined arguments

* to conclude, this is really just a neat way of displaying objects
* the simplest two ways of displaying objects are:
	1. the source code (don't evaluate anything)
	2. the value (evaluate everything)
* because Axis is prototypal, it doesn't make the distinction between defined and undefined variables, or bound/unbound variables
* during evaluation, every variable has a value, no variable is symbolic
* while in the source code, every variable is symbolic
* partial application allows for some variables to be specified as symbolic, while the rest are evaluated, in order to create new source code

* actually, a quick bit of research revealed that a very similar idea exists, called [Symbolic Execution](https://en.wikipedia.org/wiki/Symbolic_execution)
* it's very similar to what I have been talking about
* instead of evaluating a program based on values, it evaluates it based on symbols, and figures out which parts of the program are dependent on which symbols

### exploring parameter declaration syntax

* what if we use `::` so that we can separate the parent object that we are cloning, from the parameters

		current: someModule :: location >>
			snowing: false
			temp: location == "inside" ? 75 else 50     // inside temperature is room temperature

* this way you can put it on the top line while cloning
* maybe we don't need both `::` and `>>`

		current: someModule :: location >>
			snowing: false
			temp: location == "inside" ? 75 else 50     // inside temperature is room temperature

### Grouping and Multi-Line Syntax

* note that most language use parenthesis for grouping, eg `3 * (1 + 2)` or `(foo.items || []).length`
* however I use `()` for defining objects
* originally I thought a special syntax for grouping would be unnecessary, and we could handle all cases using parenthesis stripping
	* // TODO: FIND REFERENCED SECTION
* it's usually rather obvious if parenthesis is used for grouping, because the parse tree for the expression inside the braces,
	* will contain an operator at the top level
	* eg `if (a | b)` contains an operator `|` at the the top-level, so the braces are being used for grouping
	* whereas `if (a: 10)` does not, so the braces are being used for object creation
* this was discussed in section "Grouping and Unary Operators"
* however, we are now also using parenthesis as a way to do multi-line expressions

* thus, recently I have been finding grouping parenthesis more and more useful
	* eg in the section "If Statements vs Ternary Expressions II"
* and I have been using `{}` for grouping
* which is a little unintuitive, because now I use `()` for defining objects and `{}` for grouping
* whereas most languages do the exact opposite, `{}` for objects/classes and `()` for grouping

* is there a way we can somehow leverage `()` for grouping?
* I don't think `...()` will work because `...` is an operator so intuitively it should strip the paren, so if you do `...(a | b)` it will turn into

		a ? ...a else ...b

maybe use `+()`?


but what if we have a really long expression in a ternary expression, how would we break it up

		foo: cond ? some + really + long + expression + inside + the + truth + branch + of + the + ternary else false

note that `cond ? (a) else b` is totally valid and different from `cond ? a else b`, so we can't really use parenthesis stripping here

		if (a) ...a else ...b


`...` for line continuation?
eg

	a & b & c ...
		& d & e

if single-line, then it's clear what the parenthesis is being used for

if no operators and no ternary (which can be considered an operator), it's also unambiguous, even for multi-line statements

		or(
			a + b
			)

* it's only when you have both operators and multi-line that it becomes ambiguous

		cond ? trueBranch else (some
			& multiline
			& false
			& branch)

* the braces could be interpretted as creating a single-item list, equivalent to:

		cond ? trueBranch else (some + multiline + false + branch)

* or the braces could be interpretted as purely for multi-line expression declaration, in which case it would be equivalent to:

		cond ? trueBranch else some + multiline + false + branch

* perhaps we can make it so that if line starts with an operator, it continues to the next line
* though python doesn't do this, i wonder why

* maybe use `...` as a line continuation indicator if it is at the end of a line
	* [matlab does this](https://www.mathworks.com/help/matlab/matlab_prog/continue-long-statements-on-multiple-lines.html)
* though could this be confusing if you want a capture block at the end of a line

* don't forget about the `with` keyword which can help

		foo: cond ? trueBranch else falseBranch with
			trueBranch: ...
				some
				& multiline
				& true
				& branch
			falseBranch: ...
				some
				& multiline
				& false
				& branch

### If-Expressions and Ternary

i'm starting to lean back towards if-statement style for ternary
it feels natural to write

		if (cond) trueBranch else falseBranch

* perhaps it is because I am used to that syntax from imperative languages
* but I think it is because of two reasons
* first, wrapping the condition in parenthesis, helps separate it from the trueBranch and falseBranch
* whereas with ternaries, `a ? b else c`, everything is at the same level, so it can feel a little more confusing
* second, the keyword `if` feels more like natural english language
* and we can see from the rise of [fluent programming](https://en.wikipedia.org/wiki/Fluent_interface) that natural language constructs are very important
* when you see `if (sunny) goOutside else stayIndoors`, you immediately think "if it is sunny, go outside, otherwise stay indoors"
* but with `sunny ? goOutside else stayIndoors`, it feels a lot less natural and a lot more structural,
	* feels like "check the boolean `sunny`, and then pick one of the branches"

I think wrapping the condition with braces should be required even for inverse if-statements

		result: trueBranch if (cond) else falseBranch

* this is actually how I was already doing it (see section "Inverse If Statements")
* and this distinguishes it from Python style, which doesn't use braces around the condition for ternaries


* however, switching back to 

		if (cond) trueBranch else falseBranch

* brings back a lot of the old issues we had with detecting leading unary operators
	// TODO: FIND REFERENCED SECTION

* lets look at what types of if-statements and if-expressions we have explored

		// if-statement block
		if (longcondition):
			x: somelooooooooooongexpression
		else:
			x: anotherlongexpression

		// ternary
		x: {longcondition ?
				somelooooooooooongexpression
				else anotherlongexpression }

		// regular if expression
		x: if (longcondition)
			somelooooooooooongexpression
			else anotherlongexpression

		// inverse if expression
		x: {somelooooooooooongexpression
				if (longcondition)
			else anotherlongexpression }

* note that inverse if is nice for else-if chaining

		foo: someLongValue
				if (someLongCondition)
			else someLongValue
				if (someLongCondition)
			else someLongValue

* though what are the rule for breaking an expression into multiple lines like this, do we need braces?
* maybe we can have operators do implicit line joining
* aka, if a line starts with an operator, it automatically interprets the current line as a continuation of the previous line
* though note that python only does implicit line-joining for braced blocks, doesn't care about operators
* I wonder why...

* I think maybe we should allow three methods of defining conditionals:

		// 1. for statements blocks
		if (foo):
			block of statements

		// 2. for natural english, with a more prominent default case
		x: trueBranch if (cond) else falseBranch

		// 3. for structural shorthand
		x: cond ? trueBranch else falseBranch

* note that python doesn't have implicit line joining based on if a line starts/end with an operator
* python implicit line joining only happens for braced expressions

* note that inverse if-expressions help for implicit line joining

		foo: someLongValue
				if (someLongCondition)
			else someLongValue
				if (someLongCondition)
			else someLongValue

* notice how every line starts with an operator, `if` or `else`
* whereas with regular if-expressions

		foo: if (someLongCondition)
				someLongValue
			else if (someLongCondition)
				someLongValue
			else
				someLongValue

* where every other line doesn't start with an operator, so implicit line joining wouldn't work here
* at least, not based purely on operators, though we could just detect that the if-expression is "incomplete" and implicitly join the next line

* note that you can't have both regular and inverse if-expressions
* becomes ambiguous
* for example, in the code below:

		someValue
		if (cond)
		anotherValue

* if we interpret it as a regular if-expression, it becomes `someValue,   if (cond) anotherValue` (someValue becomes a list item)
* taken as an inverse if-expression, it becomes `someValue if (cond),   anotherValue` (anotherValue becomes a list item)

### If-Expressions and Nesting

* note that inverse if-expressions don't work well with nesting
* eg what if you wanted to convert this regular if-expression:

		foo: if (condition1)
				if (condition2)
					someLongValue
				else
					someLongValue
			else
				if (condition3)
					someLongValue
				else
					someLongValue

* if we try to invert it:

		foo:
			someLongValue
				if (condition2)
			else someLongValue
				if (condition1)
			else
				someLongValue
					if (condition3)
				else someLongValue

* notice that `condition1` gets pushed to the middle
* the order is really confusing, and there isn't a clear rule for how to indent this

* exploration...

		(
			someLongValue
				if (condition2)
			else someLongValue
		)
			if (condition1)
		else (someLongValue if (condition3) else someLongValue)

		condition1 ?
			someLongValue
				if (condition2)
			else someLongValue
		else
			someLongValue
				if (condition3)
			else someLongValue

* note that sometimes using an if-statement-blocks instead of if-expressions can help solve these problems
* for example, instead of doing

		result:
			input % 3 = 0 ?
				input % 5 = 0 ?
					'fizzbuzz'
				else
					'fizz'
			else 
				input % 5 = 0 ?
					'buzz'
				else
					input

* you can instead do
	
		if (input % 3 = 0):
			if (input % 5 = 0):
				result: 'fizzbuzz'
			else
				result: 'fizz'
		else 
			if (input % 5 = 0):
				result: 'buzz'
			else
				result: input

* note that with regular (not inverse) if-expressions, we use double-indentation if the condition has a nested if-expression

		x: if (if (some long condition)
				somevalue
				else anothervalue)
			somevalue
			else anothervalue

* however even this can get confusing with more complex structures, eg if we nested an expression inside one of the values:

		x: if (if (some long condition)
				somevalue
				else anothervalue)
			if (some long condition)
				somevalue
				else anothervalue
			else anothervalue

* notice how confusing it gets
* this is because, normally with cloning/calling, every nested block adds a single level of indentation
* so the syntax forms a visual tree

		fn1
			fn2
				arg1
				arg2
			fn3
				arg3

* even when we add binary operators, binary operators can just continue onto the next line
	* implicit line joining
* they don't increase indentation, so it still looks relatively clean

		fn1
			fn2
				arg1
				arg2
		& fn3
			arg3

* (note that instead of operators we can also use `any` or `all` or other functions, which make the hierarchy more clear)
* but if-expressions are special because they are like a three-operand operator, but they also use indentation
	* indentation used to separate condition from branches
* thus, it gets confusing because visually, it is hard to tell if the indentation is for the condition, or for a nested block in a branch
* it can be confusing even if we use double-indentation for the condition block, as shown earlier

* thus, perhaps it is better if we don't indent the conditional at all
* and we can also use `... ? ... else ...` ternary syntax, which separates the operands more simply
	* so that we can leverage implicit line joining
* so the earlier example would become

		x: (
				some long condition
				? somevalue
				else anothervalue
			) ? (
				some long condition
				? somevalue
				else anothervalue
			) else anothervalue

* hmm this is still confusing, maybe `if ... then ... else ...` would be better?

		x: if (
				if some long condition
				then somevalue
				else anothervalue
			) then (
				if some long condition
				then somevalue
				else anothervalue
			) else anothervalue

* well this is a little cleaner and more understandable

* note that we can also use the `with` keyword

		x: if (condition) trueBranch else falseBranch with
			condition: ...
				if (some long condition)
					then somevalue
					else anothervalue
			trueBranch: ...
				if (some long condition)
					then somevalue
					else anothervalue
			falseBranch: anothervalue

* notice that we actually indented the `then` and `else` statements more than the `if` statement this time
* in this case, it improved readability and isn't confusing
* so depending on the case, it can make sense to use indentation in multi-line if-expressions
		
		

		if ()
			then 
		else if ()
			then
		else
			then		
		

		... if ()
		... if ()
		... otherwise

* actually this is ambiguous, can be interpretted as either list items, or a single chain of if-else
* instead we have to go back to

		... if ()
		else ... if ()
		else ...

* remember that this does not work well for nesting though


* `then` and promises
* if we do use a `if then else` structure, then note that it may conflict with other uses for `then`, eg in promises


* I think we should gear our if-expressions to expressions where the condition is on a single line
* we shouldn't worry about multi-line conditions
* if you want a multi-line condition, put it in a separate variable, or `with` keyword


* I think for now, we should just stick to `... ? ... else ...` ternary syntax,
* and we will think about adding if-expressions or inverse if-expressions later

### revisiting local/scoped insertion and collectors

* something I noticed is that, even though if-statements and for-loops declare statement blocks
* in if-statements, those statement blocks get spread out into the parent object
* whereas for for-loops, those statement blocks are local

* in fact, in for-loops you can only clone and insert
* can't define properties
* what if you want to do define lists and stuff in parent
* but too complex to use a simple map
* you don't want to have to use multiple maps for multiple lists
* why not a single for-loop
* at the same time though, you don't want to use collector because that would expose it to insertion from the outside

* you want to create like, a local collector
* that accepts insertions from inside
* but looks like a regular object from outside
* this can be achieve through both a private collector, and a public mirror of that collector
* but it seems like local collectors seem common enough that they should be the default

* in fact, maybe all collectors should be local?
* if you think about it, like a foreach function that does an insertion

		range(1, 10).foreach x >>
			localCollector <: 10

* you don't need that to be a public collector
* the function passed to the foreach fn, has private access to the local collector

* however, in a way, the function passed to the foreach fn has just as much power as direct insertion
* if the foreach function was malicious, and passed around the function, it could do arbitrary insertions

* so using a public api to insert, has the same security concerns as having a public collector
* so making all collectors local, just adds unnecessary restriction
* though...i guess it could make sense
* it isn't trying to pretend it is more secure
* instead, making local collectors the default, would encourage scoped insertion
* even if you pass around a function that inserts, you are explicitly passing it, explicitly public
* whereas if all collectors were public by default, it's more implicit, implicitly public

* local collectors create a difference between read and write permissions
* public read, scoped writes

* if you think about it, variable assignment in imperative languages is normally scoped
* however, the variables also aren't public
	* so it's more akin to a private property in my language
* if an imperative variable is declared in a scope, you can only assign to it within the scope, but you can also only read from it in the scope
* if you declare a public member variable, it can be read and assigned to publically
* so I guess public/private variable declaration in imperative also doesn't distinguish between read and write permission

### Switch Statements and Cases Syntax

* inverse-if looks good because it puts the values in front
* often the conditions can be implied by the values, or they aren't as important
* math uses this "inverse" notation when defining cases, eg [here](https://tex.stackexchange.com/questions/9065/large-braces-for-specifying-values-of-variables-by-condition)
	* I couldn't find a formal name for this so I call it "cases notation"
* though perhaps that is more analogous to a switch statement, because each case is unordered and specifies the full condition, no else-if mechanics
* but it does seem like inverse if-statements can be useful for putting values in front
* recall our weather example from earlier

		tempSummary: "hot" 		if (temp > 95) else
					"warm" 		if (temp > 75) else
					"room temp" if (temp > 65) else
					"chilly" 	if (temp > 55) else
					"cold"

* recall that instead of switch statements, we can use objects,
	* eg in the coffee examples in sections "Symbol Properties - Syntax Brainstorm" and "Matchers II"
* something like

		coffee: size >>
			capacityOptions:
				small: 10
				medium: 40
				large: 90
			capacity: capacityOptions[size]

* though this is slightly different because the expressions are eagerly evaluated
* which makes a difference if we are doing clone/calling behavior inside the case statements
* eg:

		capacityOptions:
			small: fn1()->
			medium: fn2()->
			large: fn3()->
		capacity: capacityOptions[size]

* notice how with our example, all the functions are immediately called and evaluated, even though only one is accessed
* wherease in a switch statement, only one of the functions would be called and evaluated, whichever one is being accessed
* we can solve this like so:

		capacityOptions:
			small: fn1
			medium: fn2
			large: fn3
		capacity: capacityOptions[size]()->

* but this starts to get a bit more confusing

* I also think it would be nice if we had values in front and conditionals after, like in mathematical cases notation
* something like

		capacityOptions: size >>
			10    if size = small
			40    if size = medium
			90    if size = large


### Dynamic Properties and "otherwise"

* note that right now, for dynamic properties, they are retrieved only if none of the other matchers match
* and you can only define one dynamic property
* // TODO: FIND REFERENCED SECTION

* thus, it works like the "otherwise" clause of [cases notation](https://tex.stackexchange.com/questions/9065/large-braces-for-specifying-values-of-variables-by-condition)
* or like the `default` case of a switch statement

* is this too restrictive?
* maybe we should allow any number of dynamic properties
* but if multiple dynamic properties match, then it returns `overdefined`
* but we would also not want dynamic properties to be called if a static property matches
* so this could get confusing


* is `(...): ...` syntax used for destructuring, or dynamic keys?

### Truth Tables and FizzBuzz

* is there a cleaner way to represent truth tables?
* eg the fizzbuzz example has 4 different states
* traditionally it is represented by

		if (x % 3 == 0) {
			if (x % 5 == 0) {

			} else {

			}
		} else {
			if (x % 5 == 0) {

			} else {
			
			}
		}

* but notice the duplication of `x % 5 == 0`

* if we flatten it it looks like:		

		divBy3: x % 3 = 0

		divBy5: x % 5 = 0

		if ( divBy3 &  divBy5)
		if ( divBy3 & !divBy5)
		if (!divBy3 &  divBy5)
		if (!divBy3 & !divBy5)

hmm...

### Operators and Function Equivalents

* many operators have function equivalents
* we mentioned earlier how. unlike operators, functions always look very clear and unambiguous
* because the syntax forms clear visual tree hierarchies
	// TODO: FIND REFERENCED SECTION

* `|` and `&` and other binary operators can start to get ugly as they wrap onto multiple lines
* we can use `any` or `all` operator functions to turn `|` and `&` into tree hierarchies
* eg instead of 

		(someLongCondition | anotherLongCondition)
		& aThirdLongCondition
		| aFourthLongCondition & aFifthLongCondition

* we can do

		any
			all
				someLongCondition | anotherLongCondition
				aThirdLongCondition
			aFourthLongCondition & aFifthLongCondition

* `with` keyword can also be an alternative

		((first | second) & third) | (fourth & fifth) with
			first: someLongCondition
			second: anotherLongCondition)
			third: aThirdLongCondition
			fourth: aFourthLongCondition
			fifth: aFifthLongCondition

* `any`, `all`, `sum`, and other operator functions syntactically would be easier to use cloning, but mechanically makes more sense as functions
* as in, it looks nice to be able to do `any(firstCond, secondCond)`, especially when `firstCond` and `secondCond` are too long to fit on one line, eg

		any
			someLongCondition
			anotherLongCondition

* however, the `any` function should act like the `|` operator, it takes in two booleans, and returns a third boolean
* the returned boolean is distinct from the input two booleans, so `any` is more of a function than an object, just like `add` or `multiply`
* thus, we would actually use `any` like so: `any(firstCond, secondCond)->`
* however, that is far uglier when we want to use multiple lines
* we would have to do something like

		operatorFn(...)->
			arg1
			arg2

* maybe we can have alternate syntax

		<-someFn
			arg1
			arg2

* note that, we could technically design `any` and `all` to actually be boolean objects themselves, instead of returning booleans
* and they would store the two boolean inputs as private variables, and set themselves according to those inputs
* that way, instead of calling and extracting the return value, you could just clone the `any` or `all` objects
* instead of 

		any: a, b >>
			=> a | b

* it would look like

		any: boolean
			_a, _b >>
			_boolean_value: _a | _b

* this feels rather ugly and hacky though
* it simply makes more sense to make operator functions act like functions
* it is syntactically uglier though

* though actually, if we think about imperative code nowadays
* it is rather rare to see function arguments wrap to multiple lines
* most times, function arguments fit on the same line
* so perhaps it isn't that necessary to worry about special syntax for operator functions

### If-Statements vs If-Expressions, and Conditional Binds vs Multiplexors

* interestingly enough, if-statement blocks vs ternary expressions, actually correspond to conditional binds vs multiplexors
	* discussed all the way back in section "Two Types of Dynamic Bindings: Conditional Binds and Dynamic-Memory-Location Binds"
* a if-statement block can be though of as "enabling" a set of bindings, eg

		parentObj:
			if (cond):
				foo: "hello world"

* can be thought of as a conditional bind, which binds `parentObj.foo` to `"hello world"` when `cond` is true
* though if-statement blocks are a little more restrictive than conditional bindings
* because they only bind properties of the parent object
* whereas conditional binds would be able to bind anything

* on the other hand, ternary expressions correspond to multiplexors pretty much exactly
* eg

		foo: cond ? a else b

* is the exact same as a multiplexor, or a dynamic-memory-location binding

		_mux:
			true: a
			false: b
		foo: _mux[cond]

### Conditionals and Information Efficiency

* if statements and if expressions are actually rather long compared to other expressions
* for example, `foo: 1+2+3` and `foo: fn(10, somevalue)` are actually more expressive than the large expression:

		foo: if (somecondition)
				somevalue
			else
				anothervalue

* if you think about it, `foo: 1+2+3` is actually an infinite amount of if-statements
* so even though it is way shorter and more concise, it represents a larger amount of information

* with if-statements, it is a very small amount of information, a simple switch mechanism (multiplexor) with two states
* very low level

* real life systems are often not so crude
* real life functions are continuous, not bi-state
* state-based systems, eg TCP protocol, can be modeled as a state machine with behaviors tied to each state
* a multi-dimensional state space
* not as low-level as an if-statement

* if-statements are good in the beginning, for quickly prototyping code and behaviors
* but as the program gets more developed, we should strive to minimize the number of if-statements
* and opt for more expressive constructs* 

### Lexing Rules for Operators

* currently the lexing rules for operators are:
	* unary_op:     no trailing whitespace, preceded by operator or whitespace or start of expression
	* spaced_unary: trailing whitespace, first non-whitespace to the left is an operator or start of expression
	* operator:     anything else

* put another way:

	    [whitespace or operator or expressionstart] [unary_op] [anything but whitespace]

	    [operator or expressionstart] [whitespace]* [spaced_unary] [whitespace]

* notice that unary and spaced_unary operator detection is not based on the operator character,
* purely based on whitespace rules and preceding tokens

* so something in something like `! !! !1 * - 2`, the operators types will be `spaced_unary, unary_op, spaced_unary, unary_op, operator, spaced_unary`
* recall that currently, we don't allow spaced unary operators inside expressions, so `1 * - 2` is illegal
	// TODO: FIND REFERENCED SECTION
* we only allow spaced unary operators if there is a single operand, so something like `! !! !1` is legal

* you can find the implementation in `Lexer.js`

### Type System is just a form of Constraint System

* types are just a way of enforcing constraints
* but types are a specific type of constraint, a hierarchal tree form

* but you can have many different types of constraint systems
* eg CSS constrains HTML elements to 2D space
	* and you can make elements align to their container, or stack side by side (flexbox), etc

* Axis tries to avoid tree hierarchies, which are often unnecessarily restricting approximations
* Axis treats all constraint systems the same, and doesn't enforce any of them by default

### Anatomy of a Module II - Insertions as Backward References

* objects are defined solely by the child objects that they create
* properties are just references to child objects
	* they let an external object read from a child object
* and insertions are just backward-references to child objects
	* they send a child object to an external object

* this is different from what we defined earlier in "Anatomy of a Module"
* because in that section, we said that the "behavior" of a module includes the child objects, and the insertions
* but now I realize that insertions are just backward references

* this is important because, before, I thought about insertions almost like cloning
* as if there was an `insert()` function
* recall that, for cloning, if it fails, it returns `undefined`
* even if you had something like

		foo:
			console.log("hello")

* if `console` didn't exist, the whole thing would return `undefined`, and it would appear as an `undefined` list item
* I thought that insertion might work the same way, every insertion would also be a list item, and if it failed it would return `undefined`
	* though I don't think I wrote this thought down anywhere
* however, if we think about insertions as backward references, then it doesn't make sense to have them be list-items as well
* they should act like properties, and properties aren't list items

* shows how symmetric properties and insertions are

* previously we talked about how insertions and properties are different, asymmetric
* eg insertions are unnamed, properties are named, etc
	// TODO: FIND REFERENCED SECTION
* but maybe we could imagine an even more symmetric system/language
* where every object only has one reference, one property (like functional langs, where functions have a single return value)
* that way, when you reference an object, you can only retrieve one value, so reads are unnamed
* for every object, you can only clone it (and provide "arguments"), or read the value
* this would turn property access and dynamic properties, into syntax shorthand for a special argument, eg `_return`
* so instead of:

		someObject.someProperty

* you would do something like

		someObject(_return: "someProperty")->

* this sorta makes sense, because after all, after we added dynamic properties, property access started acting like function calling

* actually we already sort of talked about these concepts in "Asymmetry Between Property Access and Insertion II - named reads vs anonymous writes"
* insertions are "named" as well, because the collectors are named
* naming is just a way for the programmer to specify bindings

* how does cloning and combining and merging fit into this
* if there are no properties, how does combining work?
* how do you specify "arguments"? what even are "arguments"?

### Combiners and Symmetry

using diagram-syntax, it is a lot more intuitive to represent cloning in terms of a source + arguments
but in the interpreter, it seems cleaner to implement it using a combiner, source1, and source2 (treat arguments as another source)

the same is true for functional
it is intuitive to represent it syntactically as fn(arg)

cloning is kinda like gene splicing (mentioned earlier // TODO: FIND REFERENCED SECTION)
functions aren't symmetric though
but is cloning really symmetric?
cloning arguments are passed to the source
but it's not like the source passes arguments to the arguments

actually clone arguments aren't some secret data passed to the source like previously thought
// TODO: FIND REFERENCED SECTION
they are passed to the combiner
so only the child object can see it
though the child object can pass it back to the source (if that is part of it's behavior)

however it can be made symmetric
we could design it so you can specify parameters in the arguments
eg `srcObj(a b >> result: a+b)`
and it pulls them from the source (from the source's list items)
however that is pretty weird and unintuitive syntactically
but it does show that it can be symmetric

in addition, the fact that the arguments override the source (and not the other way around) makes it asymmetric
but we discussed this issue, along with possible ways to make it symmetric, in a previous section
// TODO: FIND REFERENCED SECTION

can functional be made symmetric too?
in a sense, if you had a function `plus3()` and the argument `5`
`5` is a function as well, in church numerals
if we think in terms of concepts/relationships
`plus3` is just as much of a "concept" as `5`
so when you combine the concept of `plus3` and `5`, it doesn't matter what order you combine them
however, you do have to specify _how_ they are being combined
for example, for `divide => a => b => result`, the first argument goes to the numerator, the second argument goes to the denominator
they have to go to specified locations for the function to make sense
we can imagine two N-dimensional spaces, with a value `a` at point P in the first space, and value `5` at the same point P in the second space, so when they collide the value `5` overrides `a`
also sort of like meiosis and gene splicing, where the two sides have to combine at specific places
also like how in my language, you have to specify what properties each argument goes to

it's also rather fitting that an actor-model language, one that mimics independent organisms
uses a mechanism similar to meiosis when creating new objects

### interpreter mechanism and implementation brainstorm

* everything is eagerly evaluated for now,
	* except for conditional branches, which are lazy evaluated
* for a given node, child nodes can be created and evaluated in any order,
* but it is most efficient to create them from the leaves and recurse to higher nodes.
* So for `x: mult(sum(a,b),div(c,d))`, the child nodes are `mult`, `sum`, and `div`,
* and we should create `sum` and `div` before `mult`

* first let's look at functional, which is a bit simpler
* also, for now doesn't have to be reactive or persistent, just evaluate every call/clone once

* for functional, the way it works is:
* first, recall that all functions are defined at root level,
* so first build the scope, a list of all function names and their ASTs
* then start from the program's return value (should be a single function call), and work backwards
* for every function call, first evaluate the parameters
* then, after getting the parameters, evaluate the body of the function (the AST)

* for my language, every property in a block needs to be evaluated
* there is no "start" point, that we can start from and work backwards like functional
* however, there's also no order we need to follow when evaluating properties
* so just choose any property and start evaluating
* when you're done, choose one of the remaining properties and evaluate, and so on

* start from root block
* add all property names to scope
* start from first property, and start evaluating the value
* every time you evaluate something, you create a new `Node`
* for every object clone, first evaluate the arguments object
	* but while doing so, inherit the scope of the source object
	* so if it encounters a scoped var, first look for it in arguments object scope,
	* but then look for it in source scope
	* and lastly check the cloner's surrounding scope
* when you encounter a scoped var that has a `Node` and is done evaluating, just get it's value
* when you encounter a scoped var that doesn't have a `Node`, create one and evaluate it
* if you encounter a scoped var that has a `Node`, but isn't finished evaluating, register a listener
* this should take care of feedback

* to turn it into reactive/persistent, instead of retrieving values instead attach listeners

* note that we might be able to treat property access `.` as a binary operation
* in other words, the `MemberAccessNode` should extend `BinopNode`

### Ancestry Graph and Feedback

* note that it seems like, since for every clone we first evaluate the arguments object
* but that arguments object could also be a clone of something, eg `result: fn.apply(args), args: x(10)`
* so it will keep recursing deeper until it finds an object that isn't a clone of anything, no ancestors
* a "root" object, almost like the Adam and Eve of the program
* but what if there are no root objects? eg:

		a: clone(src: b, args: c)
		b: clone(src: c, args: a)
		c: clone(src: a, args: b)

* even something like

		a: b(c)
		b: c(a)
		c: a(b)

* I don't think this works
* nothing is defined, because the definitions are cyclic
* you aren't allowed to have feedback in the ancestry graph
* even though you can have feedback in the dependency graph
* eg in the feedback examples shown earlier (// TODO: FIND REFERENCED SECTION)

		output: input | output

* notice that this is equivalent to

		output: or(input, output)->

* so the ancestry graph doesn't have feedback, `output` is defined in terms of `or`, which is already defined
* none of the earlier examples of feedback had ancestry feedback either
* eg the units example (// TODO: FIND REFERENCED SECTION)
			
		distance:
			km: m*1000
			m: km/1000 | cm*100 | mm*1000
			cm: m/100
			mm: m/1000

* notice how all ancestors are `*`, `/` and `|`, so no ancestry feedback

###  interpreter mechanism and implementation brainstorm II

* note that a node listens to another node only if it:
	1. is a clone of that node
	2. gets its value from that node, eg `bar: (x: a+b), foo: bar.x` will make `foo` listen to the `+` node of `a+b`
		* notice that `foo` listens directly to `a+b`, not to `bar` or `bar.x`, this is similar to the idea of alias binding
			// TODO: FIND REFERENCED SECTION

* it gets a little complicated with if-statement blocks
* because listeners get attached/detached depending on if a conditional block is enabled
* instead, we can convert if-statement blocks to ternary expressions
* eg something like

		if (cond):
			foo: "hello"
			bar: 20
		else:
			foo: "world"

* gets converted into

		foo: cond ? "hello" else "world"
		bar: cond ? 20 else undefined

* this way we don't have to worry about attaching or detaching listeners
* anybody reading/cloning foo, just had to listen to the ternary node
* I call this **conditional-block-transform**


* can we find a simpler, less "dynamic" way of creating and evaluating all the nodes
* instead of recursing deeper and deeper and slowly growing our graph, and dynamically creating nodes if they aren't created yet
* it's important to note that, even during runtime, we may have to create new nodes
	* eg, if a ternary switches to a branch that calls a function
* however, it doesn't seem like during runtime, we ever have to clone a node that hasn't been created yet
* creating nodes seems like more of a set-up thing
* so can we do all the node creation in an initial pass, and then all the evaluation follows the same mechanism that it does during runtime?

* case study:

		a: b.c
		b: (c: 10)

* first, we evaluate `a` because it is the first property of the root block
* it references `b.c`, both of which haven't been created yet
* hmm, maybe we can create all the root nodes, without evaluating them yet
* then, we first evaluate `a`, which attaches a listener to `memberAccess(b, "c")`
* then, we evaluate `b`, which creates `(c: 10)`
* this also updates all listeners to `memberAccess(b, "c")`, which updates `a`

* so it seems like what we need to do, is simply, for each block (starting from root block)
	1. create nodes for all the properties
	2. evaluate all properties from first to last
	3. if any properties create a new block, do the same thing
* and this process is followed during runtime as well

* notice that we have slightly changed the way we treat member access, compared to what we talked about earlier in this section
* earlier we said that, in `bar: (x: a+b), foo: bar.x`, `foo` will listen to the `+` node of `a+b`
* however, it now seems like `foo` should listen to `memberAccess(bar, "x")`, which then listens to the `+` node

* but note that these `memberAccess` nodes actually only get updated once
* initially `memberAccess(bar,"x")` will give undefined, but when it is evaluated it will return the `+` node
* and then it will never change
* (conditional blocks can cause `memberAccess` nodes to update, but not if we do conditional-block-transform mentioned earlier)
* so maybe it would be better to just skip these `memberAccess` nodes
* after all, properties are static, they don't change, so there's no need to treat it as dynamic like the other nodes
* however, this means that for something like `foo: a.b.c.d`, we would have to start evaluating `a` to figure out what `.b` points to,
* and then start evaluating `b` to figure out what `.c` points to, etc
* so we can't do this block-by-block create-then-evaluate mechanism anymore
* if there are deep property accesses, we would need to eagerly start evaluating them

* also note that `memberAccess` could change due to dynamic properties...
* also important to note that, often numeric indices are from dynamic properties
* eg, in something like `foo: (...inputArray, 10, 20), bar: foo[3]`
* we have no idea what `foo[3]` is going to be unless we evaluate `inputArray` first, and count how many list items `inputArray` has
* which kinda shows that spread operator has to use dynamic properties to work

###  interpreter mechanism and implementation brainstorm III - Statically Resolving Member Access

(continued from previous section)

* how did we implement the reactive "interpreter" back when we were implementing `Wijit`?
* if you look at the very first section, "Structure", as well as `databindingtests - DOMstate.html`, you can see that we used two structures
* the first, `values`, just stored the values of each object, eg `foo.bar` would be stored at `values.foo.bar`
* the second, `bindings`, stored the listeners and their eval functions for each object
	* so if `foo.bar` updates `x.y`, then `bindings.foo.bar` stores the evaluation function for `x.y`, and if `foo.bar` changes,
	* it triggers this eval function, and re-evaluates `x.y` (which in turn triggers the eval functions stored at `bindings.x.y`, and so on)
* hmm what happens if we have multiple paths that resolve to the same object?
* eg, if we have `bind(DOMstate.root, 'x = a ? b : c');`
* then if `a` is true, `x` and `b` point to the same thing
* so if `b` changes, will `x` change to reflect it?
* yes, because the expression `x = a ? b : c` will cause `x` to be re-evaluated if `a`,`b`, or `c` change
* even if `b.prop` changes, `x` will change since it is just a pointer to `b`

* but what if we did `bind(DOMstate.root, 'x = a.b.c');`?
* if you look at `followPath(path, obj, createifneeded)`, it seems like it will follow the path `a.b.c`,
* and dynamically create nodes in `bindings` if they don't exist yet
* so this seems like the dynamic recursive method
* though actually, all it does is create the path and then attach listeners, but it doesn't start evaluating `a` or `a.b` or `a.b.c`
* so later if you bind `a` or `a.b`. or `a.b.c`, that is when it will evaluate those values, and trigger the listener
* so maybe it is more similar to the block-by-block method, where you attach listeners to `memberAccess` nodes,
	* that get triggered when the node is finally evaluated?
* except it's not creating `memberAccess` nodes, it's just directly creating the nodes under `a` and `a.b`

* so I guess the way it works is
* for every block, queue all the properties for creation + evaluation
* when creating + evaluating a property, if the property is already created, start evaluation
* during evaluation, if we reference properties that don't exist yet, create them as empty nodes
* though is this necessary? why not just return `undefined`, why create these empty nodes
* what if we do `x: a.b.c` but `a` is never defined, then we will perpetually have these empty nodes wasting memory
* well they aren't exactly empty, they store listeners, the triggers to re-evaluate `x`
* but if we listen to `memberAccess` nodes, then when `a` gets defined, it will re-evaluate `x` to listen for `a.b`,
	* and then when `b` gets defined, it will listen for `a.b.c`, etc
* for `memberAccess` method, we would have 3 stacked listeners, `memberAccess(memberAccess(memberAccess(scope, "a"), "b"), "c")`
* which is pretty similar to listening for `a.b.c` directly, attaching a listener to the empty path "a.b.c" 
* because if you listen for "a.b.c", you will have to listen for `a`, `a.b`, and `a.b.c` anyways

* only at the beginning do we have to parse ASTs
* during runtime, we only deal with nodes
* perhaps we should parse all ASTs first, and then queue clones and creations for runtime

* while parsing the ASTs, we can directly create nodes for each property
* so if we have something like

		{type: "property", key: "foo", value: {
			type: "ternary",
			condition: { type: "reference", name: "a" },
			trueBranch: { type: "reference", name: "b" },
			falseBranch: { type: "reference", name: "c" }
			}
		}

* then it would turn into

		PropertyNode { key: "foo", value: Ternary { 
			condition: Node { key: "a" value: ... },           <--- also resolve references using nodes from scope
			trueBranch: Node { key: "b" value: ... },
			falseBranch: Node { key: "c" value: ... },
			}}

* note that there is no evaluation
* we are just converting all ASTs to nodes, and resolving scope references
* because we need to resolve scope references, we need to go block-by-block
* the only time we can't go block by block is when it comes to these member accesses, which we are trying to resolve ahead of time
* hmm but what if the object we are accessing is a clone

		foo: a.b.c
		a: sourceObj(b: (c: 10))

* we can't resolve the member acceses without evaluating
* well I guess we kind of can, we can see from the arguments that `a.b.c` will be `10`
* is this always possible?
* what about

		foo: a.b.c
		a: cond ? x else y

* it seems like we do have to evaluate the ternary, in order to resolve `a.b.c`
* the tree looks like `memberAccess(memberAccess(ternary(cond,x,y), "b"), "c")`
* so `ternary` needs to be resolved first
* and every time `ternary` changes, `memberAccess` will change as well
* so this seems like a case where `memberAccess` might update multiple times

* ternary and if-statements shouldn't be anything special though
* recall from our exploration of functional langs, that if-expressions can be represented using functional
	// TODO: FIND REFERENCED SECTION
* to use the same method, we turn something like

		cond ? trueBranch else falseBranch

* turns into

		// define booleans in terms of functions
		True: trueFn, falseFn >>
			result: trueFn
		False: trueFn, falseFn >>
			result: falseFn

		ternaryOp: cond, trueBranch, falseBranch >>
			=> cond(trueBranch, falseBranch).result

* now ternaries are reduced to cloning and property access
* which means everything (ignoring insertion) can be reduced to cloning and property access
* so as long as we can implement both of those without `memberAccess` nodes, then we never need `memberAccess` nodes
* and we already talked about how to do it
* any time we access a member of a clone, we can analyze whether that property is coming from the source or the arguments object
* however, at that point, aren't we basically evaluating the cloning operation?

* also, if we want to statically resolve the property access of `cond(trueBranch, falseBranch).result` (from the ternary example above)
* then we have to know what `cond` is, we have to evaluate `cond`
* for example, if we had `cond: isPrime(3**7+5)`, then we have to evaluate it to figure out what `cond` is, so we can analyze the cloning 

* not to mention, if `cond` is an input to the program, we can't evaluate it statically beforehand

* this sort of starts to show that the functional, recursive way of interpretting a program,
* relies strongly on evaluating a function's dependencies before evaluating the function
* we would be able to skip these `memberAccess` nodes, if we could fully evaluate the source/parent of the member access
* in fact, we could skip all nodes, and store nothing in memory, and just spit out the result, if we could fully evaluate all dependencies
* however, the only time an object's members can be statically resolved, is if it is a root object (not a clone of anything)
* eg in the example from earlier, `bar: (x: a+b), foo: bar.x`, where `bar` is a root object so `bar.x` can be statically resolved
* actually, some clones can be statically resolved as well, eg if it is a clone of a root object
* `bar: (x: a+b), zed: bar(x: 10), foo: zed.x`
* in fact, it seems like what is happening, is that as long as the source of the clone is not dependent on program inputs, aka static, then it can be statically resolved
* which seems pretty obvious in retrospect
* essentially what we are doing, is doing static analysis of the program, evaluating as much as we can beforehand (like removing `memberAccess` nodes) to save memory

* in functional, we start from output and go backwards, evaluating dependencies first, so that we can discard them after evaluating their values
* but that assumes that we _can_ evaluate dependencies fully
* however, in reactive programming, where inputs can change, we can't always know what the value of a dependency will end up being
* so either, we maintain intermediate values, to speed up re-evaluation (an "incremental" system)
* or we just re-evaluate the entire thing whenever values change

* for now I am going with the incremental model, because that feels more natural for a reactive language
* which basically means, we are storing `memberAccess` nodes
* so the system is
	1. convert ASTs to nodes
	2. evaluate
* we won't worry about optimizing evaluation order yet


### optimization as a property

* you can say

		(1 2 3 4 5 6 7 8 9, _listtype: linkedlist )

* if you aren't doing any indexed accesses
* this is better than using Types as an optimization, eg

		LinkedList(1 2 3 4 5 6 7 8 9)

* because you can only have one type
* but you might want to have multiple optimization

### react stuffs

* was learning react
* one example from [this tutorial at 1:24:28](https://youtu.be/Ke90Tje7VS0?t=5068) was

		class Counter extends Component {
			state = {
				value: this.props.value
			}
			...
		}

		class Counters extends Component {
			state = {
				counters: [
					...
				]
			}

			render() {
				return (
					<div>
						{this.state.counters.map(counter => (
							<Counter key={counter.id} value={counter.value} selected={true} />
						))}
					</div>
				)
			}
		}

* so it seems like what is happening, is that
* we pass in values from `this.state.counters` into the `<Counter>` components via these `key=value` properties
* and then we get the `Counter` component initializes its state by accessing these properties from `this.props`
* but this feels very ugly
* we are going from the javascript domain `this.state.counters`, into the html domain `key=value`
* and then back to the javascript domain `this.props`, and then finally to html in the render function
* but if we are already in the javascript domain, why are we initializing state via the html domain?
* why not use javascript's built-in way to initialize state, constructors?
* eg something like this in the `Counters` component:

		class Counter extends Component {
			constructer (value, selected) {                          // define constructor
				this.state.value = value;
			}
			state = { }
			...
		}

		class Counters extends Component {
			...

			render() {
				return (
					<div>
						{this.state.counters.map(counter => (
							<Counter(counter.value, true) />        // call constructor
						))}
					</div>
				)
			}
		}

* we can even pass in named parameters to be more explicit, eg

		<Counter(value: counter.value, selected: true) />

* because javascript already supports this
* this isn't directly related to Axis, but i just wanted to rant about this issue

### interpreter - scope and resolving references

* first, I think it's important to note that scope is a static thing
* just a convenient way for the programmer to create references to other variables
* but it shouldn't change during runtime, or it can get confusing
* thus, because it is static
* scoping should be resolved before runtime
* and during runtime, there are no scopes, it is just a graph of nodes/actors


* so right now, before runtime, we need to:
* convert AST to nodes, and resolve variables references from scope
* however, note that if we have something like this

		foo:
			a: b+c
			b: 10
			c: 20

* when we are trying to resolve the references in `b+c`, we haven't created the nodes for `b` and `c` yet

		a:
			a1:
				a2: ...
		b:
			b1:
				b2: ...
		c:
			c1:
				c2: ...

* to convert the AST to nodes in a simple recursive way, we simply recurse into nested structures
* so we go `a` -> `a1` -> `a2`
* but in order to resolve references in a nested scope, we have to already have nodes for all properties in the parent scope
* so really, the order has to be
	1. create nodes for `a`, `b`,`c`, put into scope
	2. carry scope and create node for `a1`, and put into scope
	3. carry scope and create node for `a2`, and put into scope
	4. backtrack back to (a,b,c) scope, and carry (a,b,c) scope to `b1`
	5. create node for `b1`, and put into scope
	6. ...etc
* it's not quite depth-first or breadth-first
* notice that, at the first layer, we create nodes for `a` `b` and `c`,
* but then we only go into `a`, and save `b` and `c` for later
* it is a weird sort of recursion, where we start creating the nodes for `b` and `c`, but then we go back to `a` and save `b` and `c` for later

* it's weird because it seems natural to create a node and also resolve references inside that node during its creation
* but instead, we have to first create empty nodes for all siblings, and then go into each sibling and start resolving references

* actually one really simple way to achieve this, is to simply first convert all nodes without resolving any references
* and then do a second pass to resolve references
* in fact, we actually might be able to create nodes directly inside the grammar post-processor, instead of creating syntax object intermediates
	* eg instead of creating `{type: binop, ...}` we create `BinopNode(...)`

* another way is to do two passes in each scope, eg
		
		function createNodes(block, oldScope):
			propNodes = []
			for (property in block)
				propNodes += new Node(property)
			scope = oldScope + propNodes
			for (propNode in propNodes)
				...convert syntax nodes to interpreter nodes...
				...and resolve references while doing so...
				if (syntaxNode is 'create' or 'clone')
					nestedBlock = new Node(syntaxNode)
					createNodes(nestedBlock, scope)      // for nested blocks, recursive call

* what's ironic is that it might actually be cleaner to implement this in Axis
* because we wouldn't have to worry about this weird execution order

* I like the first method better, where we do two giant passes
* one to turn the AST into nodes, and one to resolve references
* because while the second method is more modular and decentralized, the first method feels simpler
* and I'd also like to be able to see the entire node graph, before references are resolved
	* for debugging purposes

### Member Access Nodes and Alias Bindings

* I think these member access nodes are actually analogous to the alias bindings idea I had earlier


// TODO: FINISH THIS

### Interpreter Implementation - Cloning

* for cloning, we want to create a clone of all nested nodes
* not just direct children
* for example, take a look at

		foo: list >>
			a: 5, b: 6
			x: concat((1 2) list (a b))
		bar: foo(list: (3 4), a: 10)

* notice that we aren't just creating a clone of `concat`
* we are also cloning `(a b)`, because the values for `a` and `b` changed
* so we need to create a new `(a b)` that points to the new `a` and `b`

* we also want to clone these nodes in terms of the new scope

* put in terms of the interpreter
* we take the source node, and traverse through nested children, cloning every one
* until we get to a reference node, where we clone the reference node and stop
* then, we do a second pass to resolve these references in terms of the new scope

* notice that the reference nodes are the "leaves" of the source object graph
* they represent where the cloning stops

* so apply this to the example above, when we do `foo(list: (3 4), a: 10)`:
* it will clone `concat`, `(1 2)`, `list`, `(a b)`, and the arguments object `((1 2) list (a b))`
* it will create a new scope, with the new `a`,`b`,`x`, and `list`
* lastly, it will resolve the cloned objects with the new scope

### Resolving References and the Initialization Pass

* the last thing the interpreter has to do,
* is after converting the AST and creating all the bindings and resolving references,
* it has to initialize all nodes to their initial values
* an initialization pass
* now as long as the listeners and bindings are attached correctly,
* we can just call update() on all the nodes in any order we want,
* and the bindings will ensure that the graph will always converge to the same value
	* assuming no complex feedback
* however, to avoid extraneous updates, we would want to only update constants
	* Numbers, Strings, etc
* which will propagate the update throughout the rest of the graph
	* note that nodes are initialized with value `undefined`,
	* so if the update doesn't reach them, that means their value doesn't depend on any values,
	* so their value should stay `undefined`
	* though what about special things like `properties.length`?

* but actually, we can take advantage of reference resolution
* because we resolve references in a second pass at the end
* we can use that pass to call update() on Number and String nodes

* in addition, note that for cloning, these references are also at the leaves of the cloned graph
* so we should also call update() on reference nodes
* which will trigger the intiailization pass, and propagate it through the cloned graph

* in fact, this makes sense because, Number and String nodes are really just references to core library objects
* recall that in functional, Numbers can be represented using Church Numerals,
	* which are just a bunch of normal functions defined via a "successor" function
* so likewise, we can think of Numbers and Strings as just objects/concepts defined in the global scope that
* that everybody can use

* in addition, when we initially interpret a program, we are actually cloning the entire program
* so cloning and interpretting work the same way
* they both follow this mechanism of (1) create nodes and (2) resolve references + initialize
* only difference is that the interpreter creates nodes from the AST, cloning creates nodes from the source nodes

### Resolving References and the Initialization Pass II

* to summarize the way the initialization pass works is
* because reference resolution happens at the end of cloning / interpretting
* we use it to trigger evaluation, updating all the reference nodes
* and because the Reference nodes are at the "leaves" of the clone
* the updates will ripple all the way through the graph till it reaches the root

* the way the pass works is
* resolveReference() is called on the root
* object nodes (inc. binary, unary, ternary, etc) will propagate resolveReference() to child nodes
* all the way till they reach reference nodes

* reference nodes (inc. number, string, etc) will resolve using the scope,
* and then start an update() pass
* which will traverse backwards until it reaches the root

* notice that it doesn't matter what order the properties are defined
* eg in this example:

		bar: 10
		foo: bar

* the resolution pass will resolve `bar:10` first, then will resolve `foo:bar` with bar's value
* if we reorder the properties:

		foo: bar
		bar: 10

* the resolution pass will resolve `foo:bar` first, but `bar` doesn't have a value yet
* so `foo` will still have `undefined` value
* however, remember that it also attaches listener to `bar`
	* because that's part of reference resolution, `foo` should update every time `bar` updates
* next, the resolution pass will resolve `bar:10` second,
* which will trigger the listener and update `foo:bar`


### Cloning and Resolving References

* take a look at the following example

		sourceScope:
			x: 10
			y: 20
			source:
				result: x+y
				z: 30
		argumentsScope:
			x: 11
			z: 31
			clone: sourceScope.source(y: 21, addedProp: z)

* notice that, the clone contains three references, `x`,`y`, and `z`
* since `x` was not overridden in the cloning, `x` still refers to the original `x` in the source scope
* `y` was overridden, so `y` is updated to refer to the new `y` (and `result` updates accordingly)
* `z` refers to the `z` in the arguments scope, and will continue to do so

* notice that, `source` used to refer to `y` from the source declaration scope, but during cloning it is updated to reference the `y` in the clone
* however, even though the arguments reference `z` from the arguments declaration scope, it is _not updated_ to the `z` in the clone

* at least, this is how I have been thinking about cloning and resolving references up till now

* however, this is actually kind of weird
* because now, the code for the clone references a `z`, which doesn't point to the `z` in the clone
* so if you inspect the clone, it looks really weird
* even weirder, is if you simply override the clone again, providing the same value for `z`, eg:
	
		secondClone: clone(z: clone.z)

* now it will update the reference to the new `z`

* actually, even in Java inheritance, we can refer to methods of the parent class, from the child class
* eg

		class Person {
			public void sayHello() {
				System.out.println("hello");
			}
		}
		class Student extends Person {
			public void greetTeacher() {
				sayHello();
				System.out.println("sensei");
			}
		}

* however, note that in python, you have to use `self`, even if referring to methods in the same class

		class Person:
			def sayHello(self):
				print("hello")
			def sayHello2(self):
				self.sayHello()

		class Student(Person):
			def greetTeacher(self):
				self.sayHello()
				print("sensei")

* javascript works the same way, you have to use `this` to reference methods

* however, in all Java, Python, and Javascript, there is no asymmetry like I currently have in Axis
* method references inside a child class always refer to the methods of that class,
	* regardless of whether they are defined in the child or inherited from the parent
* so perhaps Axis should work the same way
* that is, if a property is defined in the source but not the arguments,
	* and the arguments reference that variable name, 
	* then it will reference that property from the source
* so in the example at the top of the section,
* the reference to `z` inside `combined` will now refer to `combined.z`, not `argumentsScope.z`
* I call this, "child scope for arguments", because it is resolving references in the arguments using the scope of the child (and only resolves the remaining references via argument scope)

* this is a bit weird because now we have to worry about properties in the source, when defining the arguments
* which can be especially confusing if you have a dynamic source:

		fn: cond ? gn else hn
		y: 3
		console.log(fn(x: y*10))   // does gn contain y? does hn contain y?

* on the other hand, note that if we have arguments reference the child scope,
* we only have to worry about direct properties of the source
	* we don't have to worry about variables in the source scope, or nested inside the source
* eg

		sourceScope:
			x: 10
			source:
				nested:
					x: 11
		argumentsScope:
			x: 12
			clone: sourceScope.source(result: x)

* in the above example, even if we used child scope for arguments,
* because `x` isn't a property of `source`,
* the `x` reference will pull from `argumentsScope` instead

* instead of using child scope for arguments, note that we can explicitly reference it like so

		source: (x: 10)
		someclone: source(result: someclone.x * 2)

* the `someclone.x` is analogous to the `self.x` in Python or `this.x` in javascript
* though it results in slightly different behavior than using child scope for arguments
* for example, it prevents overriding in nested scopes

		source: (x: 10)
		someclone: 
			foo:
				bar: someclone.x * 2
		clone1: someclone(x: 10)      // this will change bar
		clone2: someclone.foo(x: 10)  // this will not change bar

* whereas, if we used child scope for arguments, it would allow overriding in nested scopes

* I think while using child scope for arguments might be more symmetric,
* sticking with only arguments scope would be more consistent and less confusing
* after all, when you create objects, you only reference the surrounding scope
* so when cloning, it also feels natural for it to only reference the surrounding scope

* however, maybe we can do both!
* by default, it only uses argument scope for resolving argument references
* but you use a `this` keyword to refer to the child scope

* after all, recall that scoping is an approximation
	// TODO: FIND REFERENCED SECTION
* and it is just a mechanism for specifying bindings
	// TODO: FIND REFERENCED SECTION
* though to fully understand scoping, we have to implement it...(see next section)

* `_parent` object that is inherited
how does cloning work?

### Implementing Scope - Flattening Nested Structures

* to fully understand scoping, we have to implement it
* so first, how would it work if we didn't have scoping?
* instead, we define bindings directly
* this is easy to show in diagram syntax, we just bind objects together
* and we don't need variable names anymore
* however, we do need to specify properties
* these are important for cloning, since the arguments will override the source at these properties
* they define a mapping between values of the arguments and inputs/values of the source
	* mentioned in section "Combiners and Symmetry"

* we also can defined children, child behaviors that are spawned by the module/object
* but aren't these nested objects?
* wouldn't nesting introducing scoping?
* but then how else do we define "child" objects/behaviors?

* in fact, the whole idea of "child" behaviors sort of bothers me
* because these children can only have one parent
* and that naturally introduces a tree-like hierarchy

* actually, maybe we don't need nesting to define "child" behaviors
* and we can have children with multiple parents (sorta, you'll see)
* we only need cloning/combining
* so something like this:

		collector.
		parent:
			x: 10, y: 20
			child:
				collector <: x+y

* can be flattened and converted into this:

		collector.
		childTemplate: template
			collector <: this.x + this.y
		args: template
			x: parent.x, y: parent.y
		parent:
			x: 10, y: 20
			child: combine{childTemplate, args}

* notice how all objects are defined at the root scope
* there are no objects defined within another object
* `child` has been extracted out, and made a template that `parent` can clone
* however, `parent` has to pass in the arguments `x` and `y`
* but it can't do so using `childTemplate(x: 10, y: 20)`,
	* because that would be defining a nested object, the arguments object `(x: 10, y: 20)`
* so instead, we define another object at root scope, `args`, and use that
* thus, every object only contains either references, or clone operations

* notice how, following this method, `childTemplate` can be cloned by other objects too
* so this is the "multiple parents" idea I mentioned earlier
* when you flatten the structure out, there is no hierarchy anymore
* and objects don't have parents anymore

* there is one last thing
* notice the `this.x` and `this.y`
* this is because, we can't just have static references/bindings
* in order for cloning to be useful, we have to have some references rebind to the new object
* combiners need to do two things:
	1. merge properties
	2. rebind references
* the child's behavior should be dependent on its own properties
* think of how useless functions would be if they didn't depend on their arguments
* or how useless reproduction would be if the baby's behavior didn't depend on its own DNA

* thus, we use the `this` keyword to specify dynamic references to the object itself
* `this` is the only reference that the combiner will re-bind after cloning

### Implementing Scope - Resolving References

* now let's implement scoping
* every object can have a `parentScope` property, that specifies a parent scope
* when you create an object, you can optionally provide a parent scope
* and that would be analogous to nesting
* every object also has a `scope` property, that contains the variables in scope
* this `scope` property is generated by combining `parentScope` with the properties of the object
* references to scoped variables, would just pull from this `scope` property
* so something like:

		foo:
			x: 10
			bar:
				zed:
					y: x

* can be flattened into

		foo: (bar: _bar, x: 10)
		_bar: (parentScope: foo.scope, zed: _zed)
		_zed: (parentScope: _bar.scope, y: this.scope.x)

* (note: the `scope` properties are explained later)
* note that `y: x` turns into `y: this.scope.x`
* we don't reference `foo.x` directly, because if `_zed` is every cloned,
* we want to be able to override `x` and have the reference rebind

* also remember that, while it may look like we are using scoping when making references like `foo.scope`
* but these are actually static bindings
* we can get rid of all these variable names if we used a diagram syntax and drew in bindings directly
* but since we are using text syntax, we use variable names instead

* so where are these `scope` properties coming from
* the `scope` property can actually be statically generated
* the interpreter just takes all the static properties of the object, copies them to a set,
* and combines them with the parent scope
* so for something like

		foo: (parentScope: _bar.scope, a: 10, b: 20, c: this.scope.zed)

* it creates something like

		_directProps: (a: foo.a, b: foo.b, c: foo.c)     // generated statically
		_scope: combine{foo.parentScope, _directProps}
		foo: (parentScope: _bar.scope, a: 10, b: 20, c: _scope.zed)

### Implementing Scope - Child Scope vs Arguments Scope

* now what about child scope and arguments scope?
* exploring some examples

		// should order matter?
		(x: 10, y: 20)(result: x+y)
		(result: x+y)(x: 10, y: 20)

* another example:

		x: 10
		args: (y: x*2)
		source: (z: y+2, x: 0)

		args2: args(x: 12)

		clone: combine{source, args}
		clone2: combine{source, args2}

* on one hand, the reference to `x` in `args` should be `this.scope.x`
* that way, `args2` will rebind it correctly
* on the other hand, when we do `combine{source, args}`, if we want arguments scope, then it shouldn't be rebound

* it seems like there needs to be an order when using argument scope

		x: 10
		w: -2
		source: (z: y+2, x: 0, w: 0)
		args1: (y: x*w)
		args2: (x: 12)

		clone: combine{source, args1}
		clone2: combine{clone, args2}

* if you inspect `clone`, the `x` refers `x: 10`, so maybe it looks like a reference to `arguments.scope.x`
	* same with `w`
* however, `y` refers to `this.scope.y`, and thus gets rebound to the value `x*w` aka -20
* if you inspect `clone2`, then `x` now refers to a different `arguments.scope.x`, namely the scope of `args2`
* however, `w` still refers to the old `arguments.scope.w`, namely the scope of `args1`
* `y` refers to the scope of `args1`
* and `z` still refers to the scope of `this.scope.z`
* so now there are two different `arguments`, so perhaps we need to refer to them as `arguments[1]` and `arguments[2]`
* `arguments[1]` is the older one, so that is for `w`, aka `arguments[1].scope.w`
* as for `x`, that refers to `arguments[2].scope.x`
* the way it works is, if a higher level `arguments` object overrides a variable, it rebinds all lower level references to that new variable
* however, higher level references will never reference lower level arguments
* this is quite weird though...


* in addition, remember how in `clone`, `z` refers to `this.scope.z`
* what if we now use `clone` as arguments, aka

		clone3: combine{source, clone}

* in other words

		x: 10
		w: -2
		source: (z: y+2, x: 0, w: 0)

		clone: source(y: x*w)
		clone3: source(...clone)

* what about

		clone: source(y: x*w)
		clone2: clone(...source)

### Implementing Scope - Child Scope vs Arguments Scope II

* actually, perhaps I'm overcomplicating it
* the simple rule for arguments scope is: references from the source get re-bound, references from the arguments don't get re-bound
* in other words, the behavior of properties defined in the arguments, will not change during cloning
* but the behavior of the source might

* earlier when I was talking about argument levels and `arguments[1]` and `arguments[2]`
* that is also not necessary
* during a cloning, for a given property of the source, either it gets overriden or stays the same
* if it gets overriden, all references from the source get re-bound

* I guess whats weird is that, if we go back to the example from earlier (slightly modified)

		x: 10
		w: -2
		source: (z: y+2, x: 0, w: 0)

		clone1: source(y: x*w)
		clone2: clone(x: 12)

* in `clone1`, the `x` refers to the outer `x: 10`, and likewise for the `w`
* they don't refer to the `x: 0` and `w: 0` properties of the clone object itself
* however, in `clone2`, `x` gets overridden to `x: 12`
* so on one hand, in `clone1`, the `x` feels more like a value being passed in,
	* because it references the outer `x` and not the `x` in the object itself
* however, during creation of `clone2`, it acts more like a reference because it is re-bound


* I think this idea of "value" vs "reference" is important
* it's actually more of a distinction between "static" and "dynamic"
* a "dynamic" reference is one that changes when you clone it, a reference to the current scope, that will get re-bound which each clone
* a "static" reference is one that doesn't change when you clone it, a direct reference to the outer scope
	* though note that it changes if you clone the outer scope

* so looking at the last example, the one comparing `clone1` and `clone2`, we can see how it gets confusing when using argument scope for arguments
* because a reference can seem both static and dynamic at the same time
* eg, the reference to `x` in `clone1` is static because it references the outer `x` and not the `x` in the object itself
* but it also seems dynamic because in `clone2` the `x` gets re-bound
* so maybe this is not how it should work

* this implies that we should use child scope for arguments
* dynamic references by default
* and if you want a static reference, you can specify one directly
* eg `clone1: source(y: outer.x * outer.w)`
* you can also explicitly specify a dynamic reference, `clone1: source(y: this.x * this.w)`
* though that is optional
* what you can't do, is have this dual dynamic/static behavior that we were ending up with when using argument scope

### Child Scope vs Arguments Scope - Passing in Values vs Behaviors

* this difference between "static" and "dynamic" is made more clear in the diagram syntax
* if you did something like `foo(a+b)`
* notice that, even this could possibly be affected by properties of `foo`
* eg, if we had

		a: 10, b: 20
		foo: (a: 1, b: 2)
		foo(a+b)    // this would use the a and b of foo's scope, not the outer scope's a and b

* in diagram syntax, the way this would look is, we are adding the behavior `plus(a,b)` to the object `foo`
* the `plus` object would be declared inside `foo`
* whereas, if we only wanted to pass the value of `a+b`, we would declare the `plus` object outside, and then pass only the output value into `foo`
* using text syntax, that would look like

		a: 10, b: 20
		foo: (a: 1, b: 2)
		_sum: a+b
		foo(_sum)    // passes in the value of a+b

* so it seems like the difference is, are we passing in _values_, or extending _behavior_?
* if we are passing in values, it is static, won't change during cloning
* if we are passing in behaviors, it is affected by cloning, and any pre-existing properties of the source scope
* we can think of this as "pass-by-value" vs _"pass-by-behavior"_

* in diagram syntax, distinguishing the two is easy, we either put the `plus` operation outside or inside the arguments
* perhaps we can differentiate the two in text syntax as well, like how imperative languages do it

		foo(a+b)   // pass in values
		foo{result: a+b}  // pass in behavior

* or maybe we can "pre-evaluate" values within behavior definitions, eg

		foo
			x: a+b     // pass in behavior
			y: {a+b}   // pass in values

* this sort of makes sense because we were exploring curly braces for grouping (see section "Grouping and Multi-Line Syntax")
* though using `{}` for both grouping, and pre-evaluation, may run into conflicts

* perhaps we should make anonymous arguments (unnamed arguments) follow pass-by-value by default

* I'll have to explore this more later
* but I think what's important to note is
* passing in values, is something that we can do without a specific syntax for it
* we can do it by directly referencing the outer variable, or using escape operator `^`, as shown in the previous section
* but for a completely equivalent analog, we use something like the form shown earlier:

		_sum: a+b
		foo(_sum)    // passes in the value of a+b, instead of passing in the behavior "a+b"

* I call this "pass-by-value form"

* thus, by default, we should follow pass-by-behavior
* so we should use child scope for arguments
* and we can always emulate argument scope using the pass-by-value form shown above

### Pass-By-Behavior

(continued from previous section)

* I think it's important to clarify what "pass-by-behavior" actually is
* we talked about similar concepts earlier, in section "Defining Behavior That Should be Duplicated"
* where we mentioned how, anything in the arguments is behavior that should be duplicated

* in the previous section "Implementing Scope", we showed what nesting object definitions actually means
* and this applies for arguments as well

		example

* however, it's important to note that it doesn't just clone the template
* it also rebinds it to the current scope
* in essence, it create the behavior within its environment

* in functional, you can either define a function, or call one
* and when you call a function, you can only pass in references to other functions
* but when you define a function, you can call other functions within the body
* in Axis, cloning an object is more akin to defining a function
* you can clone other objects within the cloning operation

### Implementing Scope - Security and Privacy

* let's do some security checks
* can outsiders access private scoped vars?



* what about privacy?
* if you flatten it, it exposes child objects and argument objects to the world?



another one of my concerns
if by default

by default a lot of people will make internal properties public
why not

		someLibFn:
			...
		_myprivatescope:
			a: 10
			b: 20
			publisher <: someLibFn(a, b)

problem is, that is now a possible attack vector
if somebody can guess those property names, they can extract their values by overriding one of your sources
eg

		secretLogger: collector
		someLibFn:
			secretLogger <: a
		_myprivatescope:
			a: 10
			b: 20
			publisher <: someLibFn(input: a+b)


I call this a "rebind attack", because it tries to gain more info by rebinding references
there is no way to fully thwart an attacker
because no matter which nested node you reference
they can always override it
eg if you had

		_myprivatescope:
			foo:
				bar:
					baz:
						a: 10
						b: 20
						publisher <: someLibFn(input: foo.bar.baz.a+foo.bar.baz.b)

		secretLogger: collector
		someLibFn:
			secretLogger <: foo: ...

(tho more useful if you override a collector)

making everything private is a hassle

use `^` to escape, easy way to static
prevent rebind attacks
another way is to reference private vars

still, perhaps arguments scope is a good compromise
seeing as people can still use `this.varname` or `^varname` to either achieve dynamic or static bind explicitly

arguments scope isn't invincible either
for example, even for object creation
can be attacked via cloning

		_myprivatescope:
			foo:
				bar:
					baz:
						a: 10
						b: 20
						publisher <: (input: foo.bar.baz.a+foo.bar.baz.b)

		publisher[0](foo: ...)

// TODO: FIND REFERENCED SECTION

but it's easy to force no-cloning on an item
	// TODO: FIND REFERENCED SECTION
much harder to prevent attacks on child scope
because every cloned 3rd party lib is susceptible

arguments scope is a way of saying
by default, use static scope to prevent attacks
but it gets cloned, they can start using dynamic references


though if you can specify a no-cloning flag
then you can also specify a "escape" flag that escapes all references and makes them static

enforcing no-cloning is a bad way to enforce privacy
sometimes people clone just to add tags and such
as long as all your references are static
then you guarantee prevent information leak


note that using pass-by-value form
mentioned in the previous section, "Child Scope vs Arguments Scope - Passing in Values vs Behaviors"
it is actually fully secure

		foo(result: a+b)   // insecure, prone to rebind attack

		_temp: a+b
		foo(result: _temp) // secure, no way for a rebind attack


### Member Access and Alias Bindings



there are actually only three types of nodes
object/clone nodes
reference nodes
member nodes

every object has three things
child objects
references
property access




cloning
if foo is clone of bar
then if bar.a.b changes
it doesn't need to update entire foo
just foo.a.b
alias bindings?





spread operator, dynamic properties, and multiple inheritance




a: (b: (c: (d: input)))
foo: a.b.c.d


foo: memberAccess(a, "b")
		memberAccess(^, "c")
			memberAccess(^, "d")

static vs dynamic reference

static references are reference nodes, references to scope
resolved at the end of cloning

foo is a dynamic reference
when input changes, it changes foo, and rebinds the dynamic reference
member nodes are dynamic reference nodes


before, the listener graph was static
foo listened to a chain of member access nodes


maybe static references can be implemented as member access as well
memberAccess(scope, key)


note that ternary is like member access
also dynamic reference
in fact, remember that it is short for
cond(trueBranch, falseBranch).result
so it is member access actually

a: (b: (c: cond ? (d: 10) else (d: input)))
foo: a.b.c.d

nodes:
* let a = RefNode(scope, 'a')
* let b = RefNode(a, 'b')
* let c = RefNode(b, 'c')
* let t = ternary(cond, (d: 10), (d: input))
* let d = RefNode(c, 'd')
* let cond = RefNode(scope, 'cond')
* let input = RefNode(scope, 'input')

if `cond` changes, it rebinds RefNode `d`, which re-evaluates foo

if `input` changes, it re-evaluates foo




* member access nodes simply rebind
* they have two listeners,
* one listener listens to source object, and re-evaluates if source changes
* evaluate() resolves the member access, and retrieves the value from the target
* and attaches the second listener to the target
* so if the target changes, it updates the value

* so if source changes, re-binds target
* if target changes, retrieves new value of target




### Interpreter Implementation - Reference Resolution and Initial Pass Revisited

* the core node types should be: Clone Nodes and Member Access Nodes (and possibly insertion nodes when we get to that)
* however we have 4 main nodes: Object Nodes, Clone Nodes, Reference Nodes, and Member Access Nodes

* note that Object Nodes can be thought of as Clone Nodes where the source is `()`
* and Reference nodes can be thought of as Member Access Nodes where the source is `scope`


* right now we are calling update() in every reference node during `resolveReferences()`
* in addition, object nodes never update and never trigger updates
* two problems:
	1. in `foo: (a: ...).a`, the object node needs to trigger the member access node to be evaluated
		* same with something like `foo: (a: 10)(b: 20)`, both object nodes need to trigger the clone node to evaluate
	2. in something like `foo: 10, bar: foo+1`, as long as the reference to `foo` is resolved first, then it doesn't need to call update()
		* because when the reference to `10` is resolved second, it will update `foo` and trigger `bar` to update

* the optimal rules for binding are:
* references to the external scope should trigger the initial evaluation pass
* object creation counts as a reference to the external object `()`
	* because object creation is like cloning `()` with arguments

* in order to convert reference nodes to member access nodes,
* we would need to create persistent scope nodes for every scope,
	* so that the member access nodes can listen to them
* however, note that scoping is static, so reference nodes are bound once and then never need to rebind (unlike many member access nodes)
* so having each object keep a reference to the scope seems unnecessary
* the way we use currently, is in a "resolution pass" we dynamically construct the scope and create bindings, but then the scope is discarded afterwards
* 

* maybe should be based on static
* detect static references and resolve them beforehand

* actually no that doesn't work
* eg `foo: a.b.c` might be static, but we can't resolve it because if we clone the parent of `foo` and overrride `a`
* the overriding won't work properly if `foo` is statically bound to the original `a.b.c`


* object nodes are clone nodes with empty
* so the evaluation function actually handles the reference resolution


* no we still need a separate way of creating/defining objects
* eg if we represented `foo: (a: 10)` with a clone operation `foo: ()(a: 10)`
* notice how we still have object creation for the arguments to the clone op
* and we can continue this expansion infinitely
* eg `(args)` => `()(args)` => `()()(args)` => `()()()(args)` ...
* infinite recursion

* in Axis, you define objects at the top level
* object definitions can contain references to other objects, and 3 operations: cloning, insertion, property access
* scope is built on top of this top level definition system

* this actually does help explain certain things
* if all objects are defined at top level
* then nested object creation is actually a reference to an external object
* so those references would trigger evaluation
* _nested object creation is shorthand for a defining an external object, and cloning it with the current scope_

* this is actually slightly different from the mechanism discussed in section "Implementing Scope - Resolving References"
* because in that section, we turned this:

		foo:
			x: 10
			bar:
				zed:
					y: x

* into this:

		foo: (bar: _bar, x: 10)
		_bar: (parentScope: foo.scope, zed: _zed)
		_zed: (parentScope: _bar.scope, y: this.scope.x)

* however, the problem with this is that, `foo` only contains a reference to `_bar`, and `_bar` contains a direct reference to `foo`
* so if `foo` is cloned, the clone will reference the same `_bar`, which still points to the old `foo`, not the clone
* instead, we want the cloning to create a clone of `_bar` as well, made with the new scope
* so actually, the flattened structure should be more like:

		foo: ( bar: combine{_bar, (parentScope: this.scope)}, x: 10 )
		_bar: ( zed: combine{_zed, (parentScope: this.scope)} )
		_zed: ( y: this.scope.x )

* notice how, instead of having `_bar` and `_zed` reference their parent scopes directly
* instead, the parent scope clones the child and passes its scope in
* so `foo` clones `_bar` and passes its scope in, and `_bar` clones `_zed` and passes its scope in
* this way, if we do `fooClone: foo(x: 12)`, then the cloning operation will clone `_bar` and pass in `fooClone`'s scope

* note that `(parentScope: this.scope)` actually needs to be top-level as well:
* how would we do this?
* maybe

		foo: (bar: combine{_bar, foo_scope}, x: 10)
		foo_scope: (parentScope: foo.scope)

		_bar: (zed: combine{_zed, _bar_scope})
		_bar_scope: (parentScope: _bar.scope)

		_zed: ( y: this.scope.x )

* note that `foo_scope` and `_bar_scope` would be statically generated
* however, this doesn't work
* if `foo` is cloned, it still uses the old `foo_scope`

* actually this isn't specific to scoping
* a simpler example:

		foo:
			bar:
				zed: foo

* how do we ensure that, when `foo` is cloned, the new `zed` will point to the new `foo`?
* if we try to do

		foo: (bar: _bar)
		_bar: (zed: this.scope.foo)

* then when we clone `foo`, even if it somehow clones `_bar` as well, the new `_bar` will point to the old foo

* even something as simple as `sum: (a: 10, b: 20, result: a+b)`
* when you do `a+b`
* in flattened structure, it is created at top-level
* so how do we pass the new `a` and `b` in

* if we think in terms of DNA
* we might have `sum` cell that adds together the data at the `a` and `b` sections of the DNA,
	* and places the result in the `result` section of the DNA
* so if you combined/merged the `sum` cell DNA strand with a `(a: 10, b: 20)` DNA strand
* then the child would have `result: 30` inside its DNA
* however, imagine if we wanted a 3-sum cell, that just chains together two `sum` cells inside
* we would do something like

		3sum: (x y z >> result: sum(a: sum(a: x, b: y).result, b: z))

* notice that we have to take the data at `x` and `y` of the `3sum` DNA,
	* and bind it to the `a` and `b` sections of the inner `sum` arguments
* and then we take the `result` of the inner `sum` and bind it to one argument of the outer `sum`
* this complex binding and mapping does not seem achievable via cloning itself
* we need an operation for defining these mappings


* maybe "creation" has to be another operation that can be used when defining an object
* note that creation is different from defining an object
* when you define an object, you define the behavior of the object, made up of Axis core operations
* "creation" is a core operation, that takes values from the behavior and binds them to properties of a new object
* this special object has no behavior, it is just a container for values

* it seems like creation is really only used for defining arguments for cloning
* it also feels ugly
* especially because, if you want an object with zero behavior, there are two ways of defining it
	1. bind values to object properties directly in the object definition
	2. use creation to create a new object, and return the created object

* creation almost feels like writes, inverse property access
* because we are creating an object by defining its properties from the outside
* but we already have insertion for writes...

* we can think of creation as a way of "mapping domains"
* so in `3sum`, we are mapping the inner sum's `a` and `b` and `result` to the corresponding properties in `3sum`
	* namely, `x`, `y`, and the outer sum's `a`

* maybe these mappings can be clones of static global objects, eg

		mapXtoY: x >>
			result:
				y: x
		foo:
			x: 10
		bar: mapXtoY(foo)   // bar.x will be 10

* so just like we can reference, say, the number `10` in our program
* we can also reference a mapping `mapXtoY` in our program, and clone it to perform a mapping
* without needing a "creation" operation
* so in the `3sum` example, we would clone the mapping `mapABResult_to_XYA`

* but notice that the `mapXtoY` function internally uses nesting...
* in addition, there are infinite mappings, so we might not be able to statically define them as globals
* however, there are infinite numbers, how come we can reference them as globals?
* well, if we think of numbers as Church Numerals, then when we reference numbers we are actually using the successor function
* can we implement the successor function without nesting?

vvvvvvvv TODO: clean this up vvvvvvvvvvvvvvv

		TODO: example: attempt as implementing successor function without nesting

* actually, we can see why we need the creation operation
* without it, we only have cloning, property access, and insertion
	* we can ignore insertion for now
* in order to emulate nesting, we have to find a way for an object to create other objects, that are bound to the parent's values
* cloning needs arguments
* if both those arguments are just external objects, then it's not bound to the parent's values
* but if not, then at least one argument has to come from the parent, be created by the parent
* so that argument has to be a clone created by the parent
* but then we have the same problem: that cloning operation has to have two arguments as well
* ultimately, the parent has to create some object, not a clone

* there is one possibility though
* if the object uses _itself_ as an argument to one of its internal cloning operations
* eg, for `3sum`

		3sum: x y z >>
			self: this
			_map1: combine{map_x_to_a, self}
			_map2: combine{map_y_to_b, self}
			_sum1: combine{sum, combine{_map1, _map2}}

			_map3: combine{map_result_to_a, _sum1}
			_map4: combine{map_z_to_b, self}
			result: combine{sum, combine{_map3, _map4}}

* we still have to implement these mapping functions though

		TODO: attempt at implementing mapping function

* it's important to note that "creation" or "mapping" is different from defining a nested child
* a nested child can contain behavior
* but the "mapping" operation basically creates an object that only contains mappings, no behavior
* so to flatten a nested structure, we lift nested children to top-level templates,
* and then inside the parent, use cloning and mapping to create the children and bind them to the parent's variables
* so something like

		parent:
			num: 10
			child: 
				foo: sum(a: num, b: 1).result

* turns into something like

		_child:
			mapping: map{a: scope.num, b: 1}
			foo: combine{sum, mapping}.result
		parent:
			num: 10
			child: combine{_bar, scope}

* important: notice that the nested `child` object becomes a single top-level definition, plus a single clone in the parent
* by making the distinction between a child's behavior, and its mapping/binding during cloning,
* we are able to solve the issue with infinite recursion when trying to flatten nested structures
* before, when we tried to represent creation as cloning a blank object, we ended up with infinite recursion:
	* `(args)` => `()(args)` => `()()(args)` => `()()()(args)` ...
* and so if we tried to hoist a nested child to the top-level, with a clone operation in the parent,
* the clone operation still seemed to require a nested block to define how the parent's variables were passed to the child
* however, we have shown that this nested block doesn't actually contain behavior
* we hoist the child behavior, but keep the mapping inside the parent

* its also important to note that, mapping is more of a syntactic convenience
* in a diagram syntax, you wouldn't necessarily need these mapping objects,
* you can just draw bindings directly from values inside the caller, to inputs of the clone operation
* (though actually, this doesn't work as nicely as it sounds, we'll have to explore this later)

* to bring this back to the interpreter implementation
* every time we define a nested child object/block (this includes any argument blocks)
* it's internally represented using two Nodes:
* an `ObjectNode`, that contains its properties and behavior
* a `CloneNode` whose purpose is just to resolve the references (aka handle the mappings)
	with the aforementioned ObjectNode as source, and a `(_scope: ...)` object as arguments that just passes in parent scope

* note that, the attempt to represent creation as cloning a blank object, eg `(args)` => `()(args)`
* was a flawed idea to begin with
* it's like trying to represent every number `x` with the expansion `0+x`
* it's true that `x` is the same as `0+x`, but that doesn't mean we can represent numbers using `+`
* numbers are objects, `+` is an operation
* `x` is the same as `0+x` only because `0` is the identity object for the `+` group

* now that we aren't cloning empty `()`
* how do we make it so resolve references initiates evaluation at these root object nodes



still weird though
because with cloning, you combine two objects
	requires two objects
but with creation, you combine an object with a mapping (which we clarified, is not the same as an object, because no behavior)
	only requires one object
so they are still different...



### Dynamic Properties and Eager Evaluation


* now that we have side effects
* how do we deal with infinite lists
* we talked about this earlier
	// TODO: FIND REFERENCED SECTION

* one option is to lazy-evaluate
* but that feels ugly, because that means the behavior might changed based on what properties are accessed
	* eg if certain keys cause the dynamic property to make insertions
* lazy evaluation is an optimization, it doesn't feel like it should affect output
* and anyways, properties are supposed to just be pointers to internal behavior
	* accessing a pointer shouldn't affect behavior

* maybe we should only allow dynamic properties for functions that have no side effects?
* but this is impossible to tell if there is private behavior in the dynamic prop function

* we don't know if a given function will have side effects or not
* we can't, for example, try testing a subset, eg run the dynamic property fn on the key `0`
* because the side effects might only appear for certain keys

* so lazy evaluation doesn't seem like a good idea, very unpredictable
* but eager evaluation is also impossible, because there are infinite keys to loop across
* so we are stuck
* it doesn't seem like dynamic properties are consistent with the rest of my language

* maybe you have to specify a finite range of keys for any dynamic property?

* note that dynamic properties are important because we leverage them for hashmaps
	// TODO: FIND REFERENCED SECTION
* hashmaps are implemented like:

		hashmap: collector
			items >>
			[key]: items.find(key)

* so if we can't have dynamic properties, we can't really have hashmaps
* we would have to start using syntax like `myDict(10)` instead of `myDict[10]` to emulate hashmaps/dictionaries

* it seems like our main issue is that dynamic properties define infinite behavior
* and so lazy evaluation would be inaccurate, and eager evaluation would take forever

* but actually, there is no reason why dynamic properties should have to define infinite behavior
* all we want is an object whose properties are dynamic
* we can still have finite behavior in an object
* and properties are just pointers to sections of that behavior
* we just want to dynamically generate the pointers

* for example, a hashmap does not contain infinite behavior
* it contains a dynamic amount of behavior based on the number of insertions
* and we want the properties to change based on those insertions as well




### state variables and collectors?


* imagine if we had the following javascript code

		function onmouseclick (e) {
			a += 10
			b *= 2
			result = a/b
			output.display(result)
		}

* and we want to convert it to axis

		onmouseclick: e, timestamp >> @timestamp
			a += 10
			b *= 2
			result := a/b
			output.display <: result

* naturally we would want output to only show one insertion
* however, what if `output,display` isn't a state variable
* some 3rd party object





### ML models ..... ?

I've recently been thinking about making a Spaced-Repetition System Kanji learning app
and what would be nice is if there was a giant relational model
that modeled the "similarity" and relationships between Kanji, and multi-kanji words/vocabulary
that way when you are going through the flashcards/quizzes and you are having trouble with certain kanji
it knows that you would also have trouble with words/vocabulary that contain that kanji

what you could do is have a ML model as an object
and then pass in your stats as an input to the ML model
and it would evaluate the weights of the other nodes, based on the nodes you pass in
sort of similar to the `hikeDistance` feedback example
eg

		myKanjiRelations: KanjiRelations(stats)



### Axis and Group Theory

* we can think of cloning as the primary operation in the group of all objects
* it is associative and has identity
* however it is not invertible or commutative

* member access `.` can be thought of as the secondary operation
* but it is not distributive
* aka `combine{a,b}.foo` is not the same as `combine{a.foo, b.foo}`
* because `combine{a,b}` could have side effects that are not executed in `combine{a.foo, b.foo}`
* it then follows that, if Axis was a pure functional language, member access _would_ be distributive


* I need to extensively research category theory, group theory, and its relation to haskell/prolog and other langs
* to fully start understanding where Axis stands in category theory



### 

now that we use child scope for cloning, cloning is now more symmetric
	* see section "Implementing Scope - Child Scope vs Arguments Scope II"
* and the way we think about cloning is more like DNA


* so why is cloning a binary operation?
* it seems logical to generalize cloning to instead just be a way of combining behaviors
* actually we talked about extending cloning to more than two objects before
	TODO: FIND REFERENCED SECTION
* the way we can think about it is
* it is a way of creating a new behavior, by splicing together a bunch of existing behaviors



### Overriding Behavior vs Overriding References

* right now cloning combines two objects
* and overrides the properties of the source with the properties of the arguments
* but one thing we haven't really clarified yet is
* if a property gets overridden, does the behavior also get removed?
* eg if we had

		source: user >>
			song: user.getFavoriteSong()->

		clone: source(song: "10 hours of spongebob saying yeah")

* does `user.getFavoriteSong` still get called?
* on one hand, if we think of properties as just pointers to behavior, then overriding a pointer wouldn't destroy the behavior
* it would just affect anything that is referencing that property
* on the other hand, in this case (and similar cases) it doesn't seem to make sense for the overridden behavior to exist

* note that this is only an issue because cloning objects can have side effects
* in a pure functional language, overriding references is the same as overriding behavior
* if the reference is overridden, then it doesn't matter if the old behavior still exists or not
* if it isn't being referenced or used, then it can be ignored
* whereas in Axis, if a behavior isn't referenced, but still exists, then it matters

* for security purposes, it seems better for overridden behavior to remain
* security-wise, it is easier to maintain if we assume all behavior is permanent, and copied to all clones
* because otherwise people can selectively remove behavior (as long as it is public), eg

		source: user >>
			authKey: authorize(user, currentApp)   // authorize() will notify the user that somebody is trying to access their information
			getPrivateInfo(user, authKey)

		attacker: source(authKey: savedAuthKey) // prevent "authorize" from being called

* though in this case, doesn't seem to be so bad
* there shouldn't be any reason for re-using a saved `authKey`
* `authorize()` only needs to notify a user if a new application is trying to access their information
* but if its from the same application, then there is no need for duplicate calls to `authorize`

* and anyways, if we want behavior to be permanent we can just declare it in a private property (so it can't be overridden)

* in addition, note that, in DNA, sections of DNA dictate behavior
* so if you overwrite a section, it will overwrite that behavior

* another way you can think about it, is for say, a car
* if you swap out certain parts of the car, you are swapping out behaviors
* eg if you swap the engine for a bigger one, you are taking out the original engine's behavior, and putting in new behavior

* also note that, in object-oriented typed languages like Java, when you override a parent class's method, it overrides the behavior
* as in, when you call the child method, it won't call the parent method (unless you explicitly do so using `super()` in Java)
* eg

```javascript
class Person {
	logGreeting () { console.log('Hi im a person'); }
}
class Student extends Person {
	logGreeting () { console.log('Hi im a student'); } // notice that Person.logGreeting won't be called, so this overrides the old behavior
}
```

* I think for now, overriding behavior makes sense
* it is the most intuitive visually
	* since we are overwriting a property, it doesn't make as much sense for the old behavior to exist hidden in the background
* however, if we do end up following this model
* then we have to re-think about what properties are
* because overriding behavior, means that properties aren't just pointers anymore
* they actually capture sections of behavior

* we also have to think about how much behavior is captured by each property
* for example, consider this:

		xyz:
			xy: x*y
			plusz: xy+z
			minusz: xy-z

* the dependency graph of this would have a `*` node (from `x*y`), branching out to a `+` node and a `-` node
* if we do `xyz(plusz: undefined)`, it will overwrite the `+` operation, but it obviously won't affect the `*` operation
* however, consider the two objects below:

		foo:
			result: outer(inner(10))

		bar:
			_temp: inner(10)
			result: outer(_temp)

* these may seem like the same
* but notice what happens if we clone each of them and override `result`
* if we do `foo(result: undefined)`, then presumably, both `outer` and `inner` won't be called
* but if we do `bar(result: undefined)`, then `inner` will still be called
* so how we use intermediate variables, can affect what behavior can/cannot be overridden
* though that seems like too much to micro-manage, a lot for the programmer to worry about

* note that, at least with text syntax, properties can only capture a tree-structure portion of the dependency graph
* and our language philosophy tries to avoid tree hierarchies
	TODO: FIND REFERENCED SECTION

* if we really wanted to have full control over an object
* we could attach a property (private or public) to every single node in the object's behavior graph
* and then that would allow users to selectively overwrite any node in the graph
* this could be considered a generalized form of how overwriting behavior works
* however, it is unreasonable to have so many properties for every object

* in addition, with diagram syntax, it's even weirder
* in diagram syntax we often don't need to use intermediate variables
* eg for the `xyz` example shown earlier, we wouldn't need the `xy` variable
* we would just have the `*` node branch out to the `+` and `-` nodes
* in addition, with diagram syntax, properties literally just look like pointers
* you take a node in the dependency graph, draw an arrow coming out, add a name, and voila! you have a property
* however, if we want properties to also encapsulate behavior
* it's hard to distinguish how much of the dependency graph is "captured" by each property
* is it just the node that the property is connected to?
* or can it capture multiple, eg in the `outer(inner(10))` example earlier

* in fact, for the `foo` and `bar` example from earlier
* in diagram syntax, the only difference between `foo` and `bar` is that
	`bar` has a `_temp` property pointer coming out of the `inner` clone node
* so unlike the text syntax, is isn't intuitive that `foo(result: undefined)` would override `outer` and `inner`,
	* while `bar(result: undefined)`, would only override `outer`
* whereas in text syntax, this seemed intuitive (discussed earlier in this section)

### Referential Transparency II - Referencing vs Nesting 

* I guess this is sort of getting into referential transparency
* `result: outer(inner(10))` is different from `_temp: inner(10), result: outer(_temp)`
* because in the former, `outer` directly contains the `inner` object, aka `inner` is nested inside `outer`
* whereas in the latter, `outer` only contains a reference to the `inner` object
* note that we don't have referential transparency for cloning
	* see section "Referential Transparency" and "Defining Behavior That Should be Duplicated"
* so maybe we also don't have referential transparency for overriding properties
* this means that, for diagram syntax, we would have to distinguish between referencing and nesting

* actually remember that nesting is not the same as referencing
* during the analysis in "Implementing Scope - Flattening Nested Structures",
* we observed that nesting is actually defining an external object, and _cloning_ it (not just referencing it)


* maybe we can make it so property overriding only overrides the behavior/node directly referenced by the property

		example

* this way, we can do the same in diagram syntax
* however what about something like

		foo: fn(args).prop

* in this case the property directly points to the member access node
* so the `fn` call wouldn't be overridden
* but intuitively, it should be
* intuitively, all behavior captured in the property declaration, would get overridden

* but how does this translate to diagram syntax

a branch in diagram syntax
but actually, not exactly
cloning isn't the same as branches in diagrams, cloning has a source and args in text syntax
the restrictions of property declaration in text syntax, isn't very clean or elegant
feels weird to base our language behavior too much on the weird text syntax

### Fusion and Shared Private Keys

when you combine two objects
it only overrides the variables public to you
hmm...but then what happens if somebody in the private scope looks at the child
its possible to see conflicting properties? if two properties have the same private key?


i think private behavior gets overridden
they were declared with a shared private key for a reason
the way they combine is out of your control though
you can think of it as two objects, both containing a black box
when you merge the two objects, the block boxes merge as well
you don't know how the black boxes merge, but they will merge

### Extrapersonal vs Intrapersonal Fusion

but what's still weird is, can you combine two other objects?
before we talked about how you can achieve _____ scoping behavior by combining yourself with other objects
this sorta makes sense
you can only combine yourself with other objects
you can't force other objects to combine
you can only procreate with other objects
you can't force other objects to procreate with eachother

but note how we can achieve this
we combine ourself with the source object (to pass in scope)
and then combine the resulting object with the arguments object
we can do this any number of times, combine any number of objects
this addresses the ugliness we had earlier, where creating an object and cloning and object felt too different
because creating an object only involves one source object, while cloning involves combining two source objects
	// TODO: FIND REFERENCED SECTION
now we can see that, cloning and creation are both extensions of the same thing
where we successively merge objects into the current object

actually, this is still not right though
when we combine the result with arguments, we are combining two "other" objects
called "extrapersonal fusion"
whereas we are trying to only allow "intrapersonal fusion" (combining yourself with another object)

I guess the main question is: can we implement extrapersonal fusion using intrapersonal fusion?
if we can, then that means we only need intrapersonal fusion
if we can't, then that means we should allow extrapersonal fusion (since it is so intuitive and natural, syntactically)

actually, maybe they are the same thing
when we combine the current object with the clone source, we create a new object _within our scope/behavior_
so when we then combine the resulting object with the arguments object, the resulting object is part of the current object
so it is still intrapersonal fusion
the result of the first combining operation is placed in a new namespace/section of our object's behavior
and then the second combining operation occurs in that new namespace
to use an analogy
imagine we want to combine two cars together
the initial cloning/combining is like, bringing in the first car, and allocating a new space in the garage for it
the second cloning, brings in the second car, and then merges it with the first car in the newly allocated space

creating this namespace, and performing the second clone within the namespace, is achieved via mapping
eg

	parent:
		child: source(args)

is like

	parent:
		_new_namespace: combine{this.scope, source}
		child: combine{_new_namespace, args}

### Fusion and Shared Private Keys II

hmmm it feels weird to combine private behaviors during cloning
if combining is always intrapersonal...
then it is like, the current object (initiating object) is the one manually combining properties and behaviors
and since the current object can't see private behavior in the source or arguments
how would the private behavior get fused without knowledge of how to decrypt it

where is the cloning happening? who is responsible for creating the clone?
we talked about this before
if the cloning is happening in the source and arguments object, then it makes sense for all behavior to be cloned (nothing overwritten)
	something we were exploring in an earlier section, "Overriding Behavior vs Overriding References"
if the cloning is happening in the caller, then it doesn't make sense to clone private behavior because the caller doesn't have access to it

### Replacement vs Shadowing, Partitions vs Pointers

there are two conflicting ideas here
when we talked about security concerns in the section "Overriding Behavior vs Overriding References",
where we mentioned how security-wise, it is simpler to assume that all behavior is permanent, and copied to all clones
so that we don't have to worry about bad actors selectively removing sections and creating behaviors that we haven't accounted for
in that sense, we are thinking of property keys as just references
like pointers
each car has a pointer to the engine, a pointer to the wheels, a pointer to the axles, etc
you create clones of the two cars, and hide them, and have a "virtual" car whose parts point to parts of the hidden two cars

but then, in the section "Fusion and Shared Private Keys", we talked about how there's no reason to specifically use a shared private key
unless they are meant to be overriden
in that sense, we are thinking about properties as sections/partitions of behavior that are meant to be overriden
like slots, sections, partitions
each car has a slot for the engine, a slot for the wheels, a slot for the axles, etc
you create clones of the two cars, and then pull out parts and combine them to make the new car


robust vs elegance
the pointer method is more robust, you don't have to account for bad actors creating behaviors you haven't accounted for
the partition method is more elegant (??), makes it easy to create behavior that should be overriden, 
	whereas you can easily create behavior that shouldn't be overridden, by making a new private property for them



remember that the main reason why we make this distinction between overriding behavior vs references
is because Axis has side effects, so it matters if the overridden behavior still exists or not
	discussed in section "Overriding Behavior vs Overriding References"
so let's try an example that uses side effects

mailtruck example (with a "module" for inserting mail)
but that's actually not the same, since if you try to override the mail-insertion-module, you aren't actually overriding behavior
	since the mail-insertion-module is just a template for insertion mail, but doesn't insert mail on its own
so in that case, doesn't matter if the mail-insertion-module is removed, or hidden

insertion feels like an action
whereas overriding is for objects/properties

`1` is an object
`divide` is an object? but contains behavior and generates values
what about insertion?


actually what if you override the mail-insertion-module template


if we only want to override "direct" nodes pointed to by the property key
	mentioned in a previous section TODO: FIND REFERENCED SECTION
properties can be wrapped:

		prop: some(operations).go.here

		prop: _prop.result
		_prop:
			result: some(operations).go.here

however notice that we still need a member access, `_prop.result`, so it's still not overriding the direct node



text-syntax for properties allows a really easy way to section out core operations (clone,insert,member access,mapping)
each section can be private or public
and can be referenced with a single property name/key
this way, when you override a property name/key
you know that all references to that section will be rebound
and the old behavior can be removed

in diagram syntax, it's not so easy to do this


We can use the chat example
Normally the chat client will make an insertion to the activeUsers collector
But we can imagine a "spectator" chat client, that doesn't have an option to insert a username or send messages
One can imagine that maybe you have to be invited to join the actual chat, but otherwise you can simply view the chat
However, we want this spectator chat client to still inherit the chat viewing interface from the normal chat client








text to tree conversion
why do we need a stack?
stack is intermediate between linear structure and tree structure
shows that, at any point during the traversal of the linear structure, we only need to know the ancestors of the current node



builder pattern
often we want to create an object dynamically, and then end up with a immutable output
like, build a Pizza, then cook(), then end up with an immutable Pizza
we can use insertion to build the object
but how do we go from the collector, to an immutable object
can't use cloning, because cloning collectors still results in a collector right?

maybe we can do something like

	builder:
		props: hashmap()
		build: =>
			a: hashmap.a
			b: hashmap.b
	builder.props.put('a', 10)
	builder.props.put('b', 20)
	console.log(builder.build()->)

this takes advantage of nesting, but we know how nesting works now (see earlier sections)




imagine creating a graph visualizer in react
maybe we input the graph using some text-based syntax
we convert from the text-based syntax to a graph-model

do we use factory pattern to convert each node in the graph-model, to a react component?
what if it gets so complex, that the factory blows up
eg, what if we have to start doing some parsing on each node in the graph model, before we can turn it to a react componenent?
what if the `foo` property of nodes can change which componenent to convert to

we can use a factory if there are no structural changes between the graph-model and the react components
a factory is basically a mapping from graph-model to component-tree
if we do have structural changes, we should isolate these structural changes to a new intermediate structure, and then create a new mapping from this intermediate structure to the component-tree
this example shows how mapping != behavior



[javascript computed property names](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Object_initializer#Computed_property_names)

https://github.com/tc39/proposal-object-rest-spread



Two Types of Dynamic Bindings: Conditional Binds and Dynamic-Memory-Location Binds

ternary
behavior still exists?
lazy eval
eager eval



how do you implement rotateTree in Axis?
actions and reducers
redux uses pure functions...so are side effects really necessary?
though notice that "dispatch" (redux state management) is a function with side effects




Reddit postbot {
   Start time, current time, interval
   Posts
   Numposts

Social media postbot
    Reddit postbot
    Facebook postbot
    YouTube postbot

Imagine you don't like reddit anymore, and want to replace it with voat
so you want to replace the reddit post-bot with the voat post-bot



how is cloning/combining represented in diagram syntax
actually, so far we have only represented mapping in diagram syntax
we have only cloned objects with value mappings, not internal behavior

note that we can implement combining, via cloning and value mapping

	foo:
		a: 10
		b: 20
	bar:
		a: 'a'
		c: 'c'

	foobar: // represents combine(foo, bar)
		scope: ...
		_foo: foo(scope) // just passes in the mapping, no combining involved
		_bar: bar(scope) // just passes in the mapping, no combining involved
		a: _bar.a || _foo.a
		b: _bar.b || _foo.b
		c: _bar.c || _foo.c

note that this doesn't overwrite behavior though
follows the "hidden old behavior" model, where old behavior is kept but hidden
if we want to follow the model where behavior is overwritten, we can, but it's more complicated


	FINISH THIS, USE CONDITIONAL BLOCKS TO ENABLE/DISABLE BEHAVIOR WHEN OVERWRITTEN


text-syntax lines represent chains of operations
so replacement would only allow for replacement of chains
not trees or graphs
which is a rather arbitrary line to draw
in diagram syntax, it doesn't make sense to only allow replacement of chains, but not graphs or trees
you might have something like `foo: a(b(c))`, but then what about `a: b(c), foo: a(a)`, why can't that all be replaced in one go?



expressions are not replaceable
but single object creations are
note that cloning counts as a single object creation
so i guess if the last operation is a reference or a member access, not replaceable
if its a clone or creation, then it is replaceable




every text-based expression can be represented using a module with a single `scope` input, and a single output
eg, `foo: a.b + c` can be represented diagramatically as

		scope.a.b ---\
		             (+)-------> foo
		scope.c -----/

which can be abstracted to

		scope ----[ Module ]----> foo

remember that text-based expressions can only form linear/tree structures?
but if we generalize the concept above, we can say that these "expressions" are just modules with a single `scope` input and a single output
so we can make it so, overriding a property will replace the entire expression


DNA corresponds to behavior definition, not value
value would be the values and actions that are defined by the DNA


previously when we said that text-based expressions can only form linear structures,
that is actually wrong
you can do tree structures
and you can actually do graph-like structures as well
using an IIFE:

	foo: (
			x: a+b
			result: x*x
		).result



replacement vs overshadowing

combining, pass-by-behavior, is more like replacement
mapping, pass-by-value, is more like overshadowing

replacement makes it seem like, a variable name corresponds to both behavior and a value
which is sort of like functional
in functional, functions have both a return value, and the behavior in the body of the function
so maybe we can transfer this mindset to Axis
but could it have any unintended implications?

hmm, what about accessing a property then
does it extract the value or the behavior?
if we do
	foo:
		a: someModifier().result
		b: anotherModifier().result
	bar: (foo.a, foo.b)

let's say `someModifier()` and `anotherModifier()` are both impure functions, aka they have side effects
that means the behavior defined in `foo.a` and `foo.b` have side effects
are the behaviors of `foo.a` and `foo.b` imported into `foo`?
or just references to `foo.a` and `foo.b`?
probably just references...
but doesn't that mean `foo.a` refers to the value `foo.a`, not the behavior defined in `foo.a`?



we can think of replacement as like
the cloner, mixing and matching pieces from different sources
to cobble together some new machine
however, remember that the sources could have private behavior
so perhaps replacement doesn't work if the sources contain private behavior?
well, but still, if that private behavior references a public property, and the public property gets replaced
could still make sense
for the cloned private behavior to reference the new public property
and for the old behavior to be discarded
the source has to agree to it though, because the source would be the one cloning the private behavior
and the source could just retain the old public behavior if it wanted to
the source will always be aware of all clones
but does the cloner trust the source to discard old behavior?

though, if the source wants behavior to be retained across clones, it could always just make it private

you can mix and match after you clone them

i suspect there is an inconsistency in how we want the social media post-bot to work (replacement),
	and how the rest of Axis seems to work (overshadowing)
social media post-bot, what if the reddit component inserts into a private var


notice that for the social media postbot
you don't want to replace the `reddit` property with the voat postbot
because the voat postbot should be under the `voat` property
so instead, you should be replacing `reddit` property with undefined
and then defining the `voat` property
however, look at how it works in the code

		social_media_bots:
			bots: collector
			facebook: ...
			reddit: ...
			youtube: ...
			bots <: facebook
			bots <: reddit
			bots <: youtube

		modified_bots: social_media_bots
			reddit: undefined
			voat: ...
			bots <: voat

notice that even though we are setting the `reddit` property to undefined
it is still being inserted into `bots`
so we end up with an `undefined` value inside the `bots` collector
in diagram syntax, when you remove the `reddit` bot, it would naturally remove the insertion as well
	because the insertion is a backwards pointer from the reddit bot to the collector, so removing the bot would detach the pointer
so maybe we should do the same in text syntax?
if you replace a property with `undefined`, and it is being inserted into some collector, the insertion is removed as well?



how does scoping and private variables work
remember that scoping is an approx, only allows for hierarchal structures
we want to be able to support graph structures
for example, if we had a child with two parents
say, each parent has a private variable that the child can access
how would that work?
though what about cloning?
in a typical nested structure, cloning the parent automatically clones the child
but if you have multiple parents, how does that work?

that is the piont of structured cloning?
versus just having a giant parent with the entire directed graph, and every node is a child
so you have to clone the parent to clone the entire graph
remember that the ancestry graph is hierarchal
	TODO: FIND REFERENCED SECTION
actually that isn't related
we aren't talking about ancestry here
we are talking about parents cloning children
but it can have cycles, eg recursion

or `magnitude: (a, b, result: a*a+b*b)`

can we think of an example where you need nesting
actually no
every case can be handled with mapping and top-level clones
actually this was pretty much already proven when we reduced nesting to mapping + cloning

but what about references to private vars
eg:

	parent:
		_a: 10
		child:
			result: _a*_a

* how do we pass `_a` to `child`
if we hoist `child` to the top-level, and use a clone inside `parent`
then we need to pass in `_a` somehow
but notice how `child` should not have any public variables except for `result`
* maybe we can just use parameters and anonymous arguments

		_child: template
			_a >>
			result: _a*_a
		parent:
			_a: 10
			child: _child(_a)



we need a concrete example of multiple parents
imagine we had a multi-parent scoping mechanism
where any object can "adopt" other objects
when an object is adopted, the parent gets added to the scope of the adopted child
so children can have multiple parent scopes
if these parent scopes have colliding properties, every colliding property resolves to an `overdefined` value

	child:
		result: a+b
	parent1:
		a: 10
		adopt{child}
	parent2:
		b: 20
		adopt{child}


partitions vs pointers


remember that cloning something like `foo: a.b` will clone the value, not the expression


value, property, and source code
we used to think if something is public, then the source code is public
eg

		_foo:
			result: a+b
		bar: _foo

if we look at `bar`, we can see that `bar.result` is equal to `a+b`
the value of `_foo` is its source code
and that value is exposed via `bar`

however that line of thinking treats behavior as sectioned by property, like how replacement treats it

private and public source code
remember how even though we treat the source code of an object as its "value"
you can still make certain parts private
eg if we did

		foo:
			a: _b+c
			_b: 10
			c: 20
then the source code for `a` and `c` would be visible, but the code for `_b` would be private
so if you viewed it, it would look like

		foo:
			a: <private>+c
			c: 20
			<private>

* however, notice that this is also splitting behavior into sections, like what Replacement does
* each property has a corresponding section of behavior, a slice of behavior
* and depending on if the property is public/private, determines if we can see the corresponding behavior or not
* this is also more in line with replacement instead of shadowing

* I guess what it comes down to
* the main question is
* do we want source code to be visible, and manipulatable?
* when we handle objects in runtime, should we only access their values and property values?
* or should we allow access to the behavior/source code as well?

* I think I want to allow access to the source code
* people shouldn't have to go to Github.com or something to view the source code of a program
* they should be able to open it up and inspect it
* an object and its source code are, in a sense, one and the same

* for example, in real life, we can take apart a car and see how it works
* some parts might be too complicated, obfuscated (eg the circuitry and wiring)
* and these can be thought of as private behavior
* but other parts, like the engine and axle and wheels, are public
* not only can we see them
* we can swap them out, or modify them

* ideally, I would want to be able to do the same in Axis
* visually, I would want to be able to inspect an object
* and then when cloning it, swap out parts, remove parts, and insert parts
* I should be able to see all the nodes (clone nodes, property-access nodes, etc) that make up the behavior of the object
* and then selectively remove and rewire and replace them

* this might be easy to do using a GUI and visual syntax
* but the text syntax is an approximation of this
* when you declare properties in text-syntax, it partitions the behavior into sections
* then, when cloning, we can replace partitions (or remove them, by replacing them with `undefined`)

* in diagram syntax, we can feasibly imagine a system for the programmer to remove/replace/insert individual behavior nodes
	* eg, the programmer crosses out nodes they don't want, and draws in nodes they want to add
* but in text-syntax, it is much more difficult to design such a system
* so we use partitions as an aid, which makes removing/replacing/inserting nodes intuitive in text-syntax

* notice that, if we wanted to, we could assign a partition to every individual behavior node
* eg we could turn this:

		magnitude: x, y >>
			result: x*x + y*y

* into this:

		magnitude: x, y >>
			_xx: multiply{x,x}
			_yy: multiply{y,y}
			result: add{_xx,_yy}

* (note that the weird `{ }` syntax is to emphasize the fact that each one is an individual behavior node)
* placing every single behavior node into a separate property,
* allows us to individually replace/remove nodes,
* just like how we could theoretically do in the diagram syntax
* so this is another way we can think of it
* in a sense, in diagram syntax, property names are just pointers
* and we have a separate mechanism for replacing nodes
* but in text-syntax, we combine the two, so properties both point to a value, and correspond to a partition
* this allows us to both access the value of a property, and replace a partition, using the same property name




diagram syntax
have to choose whether each behavior node is public or private
but actually, what you are doing
is choosing the key for each node (if its public, use public key, if its private, use private key)
another way of thinking about it is,
you are choosing the location of each partition of behavior
so if you were building a car
you put the main assembly inside the hood of the car to keep it private
but then parts like the wheels, door handles, windows, those are all public and on the surface
(note, by default, nodes are public)
(instead of declaring individual nodes private, it is easier to just create a private container and put objects inside)
(this is sort of like, creating a locked safe in your house and putting objects inside, instead of creating a locked safe for every object)
(another way of thinking about it: instead of putting every item into a different hiding spot, put all the items in a box and just hide the box)





how to do this function

```js
function* getFlavors(config) {
	if (!config.mobile && !config.desktop) {
		config.mobile = true;
		config.desktop = true;
	}
	if (config.mobile) {
		yield 'mobile';
	}
	if (config.desktop) {
		yield 'desktop';
	}
}
```

in Axis?



### State Variables and Data Slicing

state variables are like data slicing
which allows us to specify order when we are processing the data, not when we are defining it
so we can define a nebulous unordered dataset
and then have different actors filter/slice/order it independently
so say, we could have a giant collector full of posts in a social network
and one actor could slice it by time
one actor could slice it by user
etc

### Code / Program Slicing

* code slicing, slice code at certain conditions
* thins like "Chain of Responsibility" pattern, which instead of calling functions, you use a dynamic handler variable that holds a function
* it can get very hard to debug because when you look at the code, you have no idea which function is stored in the handler
* all you know is that the handler is being called
* but with code slicing, you can set certain conditions and then generate a flavor of the code with those conditions
* or you can, during runtime/execution, freeze the program and see what it looks like at a certain point in time

* oh wait actually this exists
* see "Program Slicing" on wikipedia



For debugging, should be possible to reach into "live" objects and modify them
In Axis everything is alive
Compare to OO's Open-Closed principle
in OO, things are "open" to inheritance but "closed" to modification
however, in Axis, objects aren't necessary "closed" to modification, but merely "locked"
those with the right keys _can_ reach in and modify objects




### Documentation by Example

*less about the functionality and more about the intention*
examples show what the programmer was thinking when they were creating the function
so it can also give insight into the optimizations and decisions the programmer made

so somebody who comes later to refactor/optimize the code, can see what the main purpose of the code was
and can see what areas have more leeway, eg if certain edge case handling can be changed without affecting the main intention of the program

also the examples can be used as tests

### Axis is now Firefly, and a new direction for the language

* back in the section "Name Brainstorm April 2019" I mentioned that I chose Axis over Firefly
   * because Axis felt more fitting for a language and Firefly felt better for a product (eg an IDE)
* however, I'm going back on that now for a few reasons:

1. Firefly has more personality
   * many programming languages have quirky names, eg Java or Python or Go
2. Axis is too pretentious
   * when I was researching SmallTalk, they mentioned that it was named that because many other langs at the time had big names but didn't do much
   * I want to pay homage to that, and give a more unassuming name
3. ta new direction for the language
   * or rather, I have honed the goals to be a bit more specific
   * I want the language to be for artists, prototypers, hackers, and live coders
   * it's meant to make small quick apps and microservices that run in swarms and decentralized networks
   * so Firefly is much more fitting to that
4. I already have ideas on how "Firefly" can make for a cool website





an actor can spawn finite actors but infinite updates (feedback)


### Contracts - generalizing insertions and state variables

insertions are just an added global input and output to all vars
state variables are just an added default input to all scoped vars
maybe we can generalize this
contracts: you can create scopes where all variables inside have to conform to certain rules/interfaces
so for insertion, the contract is that all variables have to have a "insertion" input and "outsertion" output
for state variables, the contract is that all variable have an "state input" input



### Restructuring the interpreter - primary and secondary constructs

right now the interpreter is a bit ugly
a lot of the Node types don't feel like they are "core" operations
references and property access feel like they should be the same
the `Node.clone()` function (not to be confused with `CloneNode`) is rather hacky for many nodes

I want to rebuild the interpreter in a simpler, more elegant way
starting from core concepts

references == mappings
every reference is a mapping
for example, `foo+3`, the `foo` might look like a reference, but it's actually a mapping `sum(a: foo, b: 3)`

Primary Constructs

* creation / mapping / combining
* de-reference / property access
* insertion

then we also have secondary constructs, which can be reduced to combinations of primary constructs

* binop -> cloning + property access
* ternary -> cloning + property access



* one of the difficulties I faced with the interpreter is handling feedback
* if we have something like this:

	km: m/1000
	m: km*1000

* in what order should we create the nodes?
* if we create `km` first, then while we are creating `km`, how do we resolve `m`? `m` hasn't been created yet
* same issue arises if we try to create `m` first

* one way to think about this is
* imagine if we were making an interpreter for the old version of Nylo, aka a functional non-reactive language
* evaluation could be done via recursion, backtracking from the output (lazy-evaluation) and making calls as needed
* so let's say we want to evaluate the following

	distance:
		km: m/1000
		m: km*1000
	=> distance(km: 7).m

(in the following, primary constructs are in _italics_)
* in the beginning, nothing is evaluated, not even the `/` or `*` calls inside `distance`
* so no issues with feedback yet
* we start by evaluating `distance(km: 7)`
* in `distance(km: 7)`, all we do is override the `km` property inside `distance`, still no evaluation yet
  * this is just a _mapping_ operation
* when we get to the _property access_ `.m`, now we finally need to do some evaluation
* first, let's represent `/` and `*` with their equivalent functional forms

	distance:
		km: div(m,1000)->
		m: mult(km,1000)->
	=> distance(km: 7).m

* now we can see that when we access the `.m` property, we have to first evaluate `mult(km,1000)`
* the `km` in this case is a reference to the `km: 7` override we made previously, so we resolve that first
  * recall that references are just _property access_ performed on the scope
* then we _map_ `km` and `1000` into the `mult` object
* after that, we _access_ the output `->` property of the `mult` operation (which itself may execute a bunch of internal evaluations)

* thus, everything is reduced to 2 primary constructs: mapping & property access
* for Firefly, we only need to add one more core operation, insertion

* but what if we want a reactive persistent program?
* we can actually reactivity as continuous evaluation
* 

* now how do we go from the AST to the evaluation step?
* we need to somehow link things together to prepare for evaluation
* but we don't want to confuse this with the "mapping" core operation

* maybe all we need to do is create the scopes for each object
* well...no...scope is not a primary construct

* we need to do everything that _isn't_ part of the core operations, anything that isn't part of evaluation
* so basically a bunch of conversions
* convert binops and ternaries into their equivalent forms
* convert scoping into equivalent forms
  * create a `_scope` property in each object
  * nested scopes should inherit parent scopes
  * references to scope should be converted to property access on the `_scope` property
* nested structures should be flattened, nested object definitions should be moved to a template at root level, and a clone operation in the parent object
  * // TODO: FIND REFERENCED SECTION

* is all this necessary?
* can we do it in a simpler way using recursion?

### Restructuring the interpreter - intermediate transformations

* actually i guess what i have already isn't too bad after all
* it just feels so much uglier than interpreters for functional or imperative langs
* for a functional lang, you can just recurse backwards from the output
  * but we can't do that because my lang has to be eagerly evaluated
* in an imperative lang, you just maintain a current execution context and function stack, and go line by line
  * but I can't do that because everything is running at the same time

* though I guess the fact that my interpreter has to work so differently from traditional interpreters
* shows how radically different my lang is :O


* actually I've decided to change one major thing about my interpreter
* I'm going to add an intermediate transformation step between the AST and the interpreter
* this is for transforming any syntax sugar into core operations
* and it will make things easier when I add more syntax sugar later along the road

* for now, these transformations are:
* turning binop and ternary nodes into function calls (aka cloning + prop access)
* flattening nested scopes, implementing scope using cloning



* how do we transform scope into primary forms?
* Normally in imperative languages, it can be transformed during parsing, because the arguments are static
  * as in, if we did `fn(10, 20)`, then we know there are exactly two arguments, and their ordering is set during compile time
* if Firefly had static arguments, we could manually iterate over each argument and override callee properties one by one

### Combining/Merging and Security Issues

* however, what if we had something like javascript's `Function.apply()` method, where the arguments are provided as an object
* I'll call this **merging**, or **combining**
  * we've actually been using `combine{...}` before, see section "Implementing Scope - Flattening Nested Structures"
* in this case, the arguments would be "dynamic"
* the parser doesn't know which properties are being overriden and how many
* in fact, the caller doesn't know either

* usually when you clone, you have to manually provide each argument
* so you can only override private vars if you know them

```
foo(a: 10, b: 20, [sharedKey]: 30)
```

* but if we allow dynamic arguments, then could there be security issues?
* for example, if we had `merge{foo, bar}` or `foo.apply(bar)`
* if `foo` and `bar` had private vars with the same keys, then `foo`'s would be overriden
* even though the caller might not be able to even see those private vars
* the caller is combining private vars without knowing about them

* if two objects have a shared private variable, and an outsider merges them, could cause unknown effects

* one example is, if club members had a private "nickname", visible only to other club members
* an outsider could combine two club members, and override the nickname

* notice how this doesn't happen with static arguments
* if we only allowed static arguments, then you would have to manually pass in each argument

```
foo(x: bar.x, y: bar.y, .....)
```

* and the caller would only be able to pass in arguments that they had keys for
* they can't merge properties that they can't see

* maybe don't allow merging, only allow stuff like `foo(...bar)`
* in this case, `foo(...bar)` expands the properties of `bar` that the caller can see, and gives them to `foo`


* hmm, going back to the club member example from earlier
* what if instead of a shared private property, why not a use a private tag

```
private #nickname
Robert:
	#nickname: Bob
```

* I guess the difference is that during cloning, the tag won't be preserved (if you clone club members)
* we mentioned this in a previous section when talking about the difference between tags and properties
* but, maybe we shouldn't preserve the nickname when cloning club members
* what if we always used tags instead of private vars?

* well what about a private mutator
* eg `someCommunity.postAnnouncement()` should only be available to moderators
* but at the same time, it can't be a tag because you should be able to clone `someCommunity` and carry over the mutator

* simplest safest solution would be to make `foo(...bar)` a shallow copy of bar's properties as arguments, as mentioned earlier
* this is what the syntax of such an expression would suggest anyways

* however, then what about insertions? 
* how do we carry those over?
* are mixins even possible in this method?

* kind of. You can do something like

```
foo(...bar())
```

* what this does is:
  1. creates a clone of `bar` (cloning all insertions and children)
  2. manually copies the properties into the arguments of `foo(  )` before cloning `foo`
* note that in this method, properties of bar can effect foo, but properties of foo won't effect bar
* whereas if we allowed `merge{foo,bar}`, then the behaviors would merge and affect eachother
  * recall the sections "Clones and Calls Declared Inside the Arguments" and "Implementing Scope - Child Scope vs Arguments Scope II"

* I still don't want to fully abandon the concept of merging though
* I'll have to come up with a more concrete example with shared private properties and merging, to further investigate the security implications


### Dynamic Scope

* previously we decided to choose "child scoping" rules (see section "Implementing Scope - Child Scope vs Arguments Scope")
* basically, this means that the behavior of a module is scoped by the module itself first, and afterwards the original caller/callee scope
* to be more precise, in something like

```
foo:
	a: 10
	b: 20
	bar: a+b  // will be 30
	zed: a*b
foo_clone: foo
	b: 5
	bar: a-b  // will be 5
```
* first, note that `foo_clone` inherits `zed`, which references `b`, which resolves to the new value of `b` that `foo_clone` provided
* this normal behavior compared to other languages
* however, also notice how `foo_clone` inherits `a` from `foo`, so `foo_clone.bar`'s reference to `a` resolves to that inherited variable
* normally, in most languages, the `a` in `foo_clone.bar` would be undefined
* this also makes the scoping behavior a bit more symmetric
* inherited behavior can reference new values, and new behavior can reference inherited values

* we called this "child scope" before, to distinguish it from "arguments scope" (which is what I called the mechanism that most other languages used. Perhaps a more apt name would be "caller scope")
* I called it "child scope" because the behavior of a child is scoped to its own properties, instead of being scoped to the parent or the caller

* but perhaps a better name is "dynamic scoping"
* because we can think of an object's scope as "dynamic", because when it is cloned, the new behavior re-binds to the new values/properties it has in its scope


### Denote private behavior using _

* we can use the `_` special keyword anytime we want to denote private behavior

```
foo:
	someFn()   // this is a public list item
	_ someFn() // this is private behavior
```

### Implementing Scope - the static property list

* we have previously talked about implementing scope using primary constructs
  * eg in section "Interpreter Implementation - Reference Resolution and Initial Pass Revisited"

* I guess one of the confusing aspects about implementing scope, is that it is so similar to merging/cloning
  * (note that it's ok to have combining/merging inside the interpreter implemetation, as it is a core operation. The previous section is discussing whether we should expose merging as part of the language as well)
* if we had

```
parent:
	...
	child:
		...
```

* `child`'s scope overshadows `parent`'s scope
* so the properties of `child_scope` override `parent_scope`
* in a way, we can say `child_scope: combine{parent_scope, child}`
* but this seems almost too similar to cloning
* almost seems circular, how we are using `child` to create `child_scope`
* even though `child_scope` should be a part of `child`...

* but actually, it's important to note one distinction between merging scope, and cloning objects
* when merging scope, we don't perform any insertions or side effects
* merging scope just combines a list of properties
* so it's actually more like `child_scope: combine{parent_scope, child_properties}`
* `child_properties` is just a list of properties created alongside the definition of `child`
* this list of properties is just references to the source object's actual properties, sort of like a shallow copy of the object
* eg

```
parent:
	...
	foo:
		a: 10+input
		b: someFn(20, 30)->
		c: b.someProp
	foo_properties:
		a: foo.a
		b: foo.b
		c: foo.c
	foo_scope: combine{parent_scope, foo_properties}
```

* this way, when we merge scopes, we are just overriding references
* we aren't creating any behavior

* in terms of implementation, this is actually rather simple as well
* for cloning, a `CloneNode` can create nested `CloneNode`s, which leads to recursion
* however, while scopes leverages cloning, since each scope is just a list of references, with no nested behavior, then there is no recursion

* however, there's one problem
* inside `foo_properties`, we are referencing `foo`
* but how can we reference `foo` without the concept of scopes??
* references are supposed to be implemented via scope & property access
* but here, we are implementing scope via references
* circular!

* maybe the "references" inside `foo_properties` are not actually references
* they are direct bindings to `foo`, statically created during interpretation
* just like how, in the expression, `a.b.c`, the member access `.c` is directly bound to the result of `a.b`
* so when the parser/interpreter sees the definition for `foo`, it creates this `foo_properties` object, with each property being a direct binding to a corresponding property in `foo`
* then `foo_scope` is also created using a combine operation on `foo_properties` and the parent scope
* thus, these `xxx_properties` and `xxx_scope` objects are static structures created at "compile" time
* aka during the AST transformation



* what's nice is that, this implementation of scope is rather robust
* for example, recall the previous section, "Merging, Dynamic Arguments, and Security Issues"
* we can start safe and not allow merging
* but if we do end up adding it to the language, our implementation of scopes won't have to change
* in fact, implementing scope is what brought up the discussion of merging and security in the first place
* but in the end, that discussion proved irrelevant to our implementation for scopes

### Dynamic Property Lists?

* in the previous section we talked about creating a static `xxx_properties` list alongside any created object
* but what if the object definition was dynamic
* eg if we had something akin to javascript's `Object.fromEntries(entries)`
* if `entries` changes, then the resulting object changes, as well as the property list
* and we can't just dynamically generate the property list, because everything dynamic should happen in the evaluation phase, and everything in the evaluation phase should be implemented using primary constructs

* well let's see how a "polyfill" for this might be written

```
fromEntries: entries >>
	res: Map()
	for ((key, value) in entries):
		res.set(key, value)
	=> res
```

```
fromEntries: entries >>
	res: entries.reduce(...)->
		reducer: acc, entry => template acc([key]: value)
		initial: ()
	=> res()
```

* hmm but reducer method introduces order
* and Map() method uses a secondary form `Map()`, which begs the question, how is `Map` implemented?
* maybe we should provide a primary form for dynamically creating properties
* something like

```
fromEntries: entries >>
	for ((key, value) in entries):
		[key]: value
```

* note that this kind of syntax was previously explored in Readme_old.md section "Dynamic Keys"
* "Implementing Hashmaps and Property Insertion - Dynamic Properties"

using the `combine{...}` primary construct

```
fromEntries: entries >>
	=> combine{...entries.map(fn: ((key, val) => (...)))}
		[key]: value
```

* this is good because it is unordered, unlike the reducer method
* note that this is technically still a static property list
* so this does not violate the scoping transformation mentioned in the previous section, "Implementing Scope - the static property list"
* this is important, I can implement the scoping transformation without worrying about dynamic properties
* and I know it is powerful enough to capture behavior like `fromEntries()`


* the syntax is rather ugly tho
* gah so many parenthesis
* could i extend the for-loop to do something similar?

```
fromEntries: entries >>
	=> ...for ((key, value) in entries):
		[key]: value
```

* i'll have to explore this later

### Dynamic Properties - Matchers vs Computed Properties

* note that we have been mixing up two types of dynamic properties
	1. matchers, eg `[key]: key*key`
	2. dynamically computed keys, eg `[someValFromScope]: 10`

* matchers are pretty much the same as functions, and could technically allow for infinite streams/lists
  * also creates dynamic property lists
* dynamically computed keys would still ensure finite and static property lists (as mentioned in the previous section, "Dynamic Property Lists?"

* computed properties seems like something we should definitely in the language
* matchers...I will have to think more about, since you could always just use a function instead of a matcher

### Arrow Functions vs Pass-By-Behavior

* we discussed a lot earlier about how arrow functions have to be wrapped in parens
* eg `someFn((a,b => a+b))`
* because `someFn(a,b => a+b)` implies that we are overriding the properties `a`, `b`, and `=>` inside `someFn`
* note that passing in functions is a bit cleaner if you specify property name, eg
* `someFn(callback: (a,b => a+b))`
* however, note that due to pass-by-behavior and dynamic scoping
* often, we don't even need to pass in a function
* for example, if we wanted to call a function that makes an async data fetch, and then does something with the data:

javascript:
```javascript
fetchData(data => {
	doSomething(data);
});
```

firefly:
```
fetchData(data >>
	_ doSomething(data)
)
```

* since `data` is a variable that is provided by the `fetchData` module, we can just reference it in the behavior we pass in
