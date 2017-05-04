# CP3108-Debugger
Building Debugger for The Source (DEMO) - Using esprima.parse for parser and ace editor for editor.
How to test the debugger?
1. Download all files.
2. Download src-noconflict - https://github.com/ajaxorg/ace-builds/ (this is for the editor).
3. Put Ace.html outside with src_noconflict.
4. Put all other files into src_noconflict.
5. Run Ace and test.

To understand more about the interpreter, it is recommended to go through:
1. Understand Metacircular Evaluator (http://www.comp.nus.edu.sg/~cs1101s/sicp/). 
2. esprima.parser - since esprima.parser will be used, it is recommended to experiment with esprima parser to understand how the syntax will be dealt in the interpreter (http://esprima.org/demo/parse.html#).
3. Go through yield + function* (generator) of EcmaScript6 (https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Iterators_and_Generators) .

To understand more about the Debugger Demo, it is recommended to go through:
ace.editor (https://ace.c9.io/#nav=embedding)

More information about files:
1. ace.html: a web-page to test the debugger.
2. interpreter.js: the interpreter.
    a) list.js.
    b) misc.js.
    c) object.js.
    d) stream.js.
3. debugger.js: the debugger.

Specific information about each file:
1. ace.html:
    a) Embedding Ace editor. (https://ace.c9.io/#nav=embedding)
    b) Add / remove breakpoints. 
        i) Add / remove breakpoints by clicking on the margin(http://stackoverflow.com/questions/16864236/how-to-mark-line-numbers-in-javascript-ace-editor).
        ii) Store breakpoints as a set of line number. (https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set) 
    c) Illustrating method:
        i) runButton():
          > Run the program.
          > Send the code and breakpoints to the debugger.
          > If there is breakpoints, then will stop at the breakpoints (debug mode on).
          > Else execute the whole program.
        ii) next():
          > Only work if it is in debug mode.
          > Run the next statement - However, sometimes need to next() many times to go to next statement.
        iii) resetBreakpoints():
          > Clear all breakpoints
        iv) resume():
          > Only work if it is in debug mode.
          > Run to the next breakpoint.
          > Or finish if there is no breakpoint.
2. debugger.js:
