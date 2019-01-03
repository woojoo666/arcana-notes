Loose Ends
-----------

(this place is for dumping **short** questions and concepts that are largely unexplored)

lisp has metaprogramming?

i wonder if versioning is like the state monad in haskell...

unbound vs undefined? whats the value

how does metaprogramming work in javascript? is there metaprogramming in javascript?


lazy evaluation: function vs imperative, forwards vs backwards
graph traversal, `visited` travels forwards, result travels backwards,  possible to lazy evaluate?


context: Muxes, Execution Order, and Infinite Loops
review this^^^ section
analyze how functional languages deal with recursion and lazy evaluation


context: "Arcane as a Distributed Language" and "Global Symbols?"
minimal addressing, how namespaces add prefixes to stay unique
how does this factor into "global" key names?



context: Synchronization and Eventlists
eventlists replaced with state variables and reduce?



context: More Flo Notes.one - Timelines and Event Lists
connecting relationships?
latest input -> last list item 
   automatically generates a chronological list


Metaprogramming Types
context: Metaprogramming Thoughts III
what are all the types of metaprogramming, and give some examples?
that way I can get a better understanding of what exactly I mean by metaprogramming
* generate code, and then modify the generated code
   * when you change the generator, it will try to apply similar modifications
* adding debug statements, or log statements, or progress alerts
* version control
* optimizers (eg fibonacci memoization)
	* write code, and then generate optimized code
	* if you modify the original code, it will still try to apply the same optimizers


Nodes vs S-Expressions?
(this seemed especially relevant when I was using the "mixed nodes" model)



state variables
have a `self` or `this` variable that references the latest value?



dynamic properties vs recursion

	fibo: // dynamic properties
		[n]: [n-1] + [n-2]

	fibo: // recursion
		=> fibo(n-1) + fibo(n-2)



how does cloning aggregators work?
