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
3. Go through yield + function* (generator) of EcmaScript6 (https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Iterators_and_Generators).
4. Scan through the code of interpreter from the function evaluate(input_text,stmt,env).

To understand more about the Debugger Demo, it is recommended to go through:
ace.editor (https://ace.c9.io/#nav=embedding)

More information about files:
1. ace.html: a web-page to test the debugger.<br />
2. interpreter.js: the interpreter.<br />
    a) list.js.<br />
    b) misc.js.<br />
    c) object.js.<br />
    d) stream.js.<br />
3. debugger.js: the debugger.<br />

Specific information about each file:
1. ace.html:<br />
    a) Embedding Ace editor. (https://ace.c9.io/#nav=embedding)<br />
    b) Add / remove breakpoints. <br />
        i) Add / remove breakpoints by clicking on the margin(http://stackoverflow.com/questions/16864236/how-to-mark-line-numbers-in-javascript-ace-editor).<br />
        ii) Store breakpoints as a set of line number. (https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set) <br />
    c) Illustrating method:<br />
        i) runButton():<br />
          > Run the program.<br />
          > Send the code and breakpoints to the debugger.<br />
          > If there is breakpoints, then will stop at the breakpoints (debug mode on).<br />
          > Else execute the whole program.<br />
        ii) next():<br />
          > Only work if it is in debug mode.<br />
          > Run the next statement - However, sometimes need to next() many times to go to next statement.<br />
        iii) resetBreakpoints():<br />
          > Clear all breakpoints<br />
        iv) resume():<br />
          > Only work if it is in debug mode.<br />
          > Run to the next breakpoint.<br />
          > Or finish if there is no breakpoint.<br />
2. debugger.js:<br />
    a) Global variables:<br />
        i) debug_on: check debug mode whether it is on or not.<br />
        ii) debugger_result: contain the status of the program. It is a generator if it has not finished executing, else it is the result to the console.<br />
        iii) debugger_marker: marker on the debugging line. (https://ace.c9.io/#nav=api&api=edit_session for further understanding.<br />
    b) Functions:<br />
        i) make_debugger: function that connects the code on the editor with the interpreter.<br />
        ii) debugger_next: function that associates with next() in the editor.<br />
            a) Debug mode off: Execute until find a breakpoint, else execute the whole program.<br />
            b) Debug mode on: Go to next statement, However, sometimes need to next() many times to go to next statement.<br />
            *** Reason: To take the return value of a generator, we need to run next until done = true, the corresponding value is the result. However, with a lot of generator relates to each other, taking the return value leads to more next. ***<br />
        iii) watch: return the value associated with the input variable in the nearest frame.<br />
        iv) line_to_mark: get the current line number which the generator stops.<br />
        v) get_current_val: return debugger_result.<br />
        vi) on_debug/off_debug: mark on/off debug mode.<br />
        vii) variables_table: create the variable - value table of the current frame.<br />
3. interpreter.js:<br />
    a) Structure: similar to the original interpreter in SICP.<br />
    b) Changes:<br />
        i) Syntax: suitable for Esprima Parser.<br />
        ii) EcmaScript6 : declare local variables by "let".<br />
        iii) Functions to evaluate each kind of statement have become generator.<br />
        iV) More gloabal functions to associate with debugger.js.<br />
    c) Generator: 2 ways of dealing.<br />
        i) Just care about the result: use a while generator.done != true loop do generator.next() until generator.done == true then result = generator.value. (However, if there is a breakpoint then it will work like ii) from the breakpoint.<br />
        ii) Want to run next by next: use a while generator.done != true loop do (yield; generator.next()) until generator.done == true then result = generator.value.<br />
        
