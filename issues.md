Issues relating to debugger:
1.  Have error with Object Inheritance.
2.  Have error with is_stream (as is_stream use stream_tail, hence some errors occur underline the primitive function as many functions
have been modified to be generators).
3.  If in debug mode (debugging)
    a) If only the function is called, it will run line by line in the function.
    b) If the function is going with other component (for example: var x = foo()), then it will pause at the return statement of the 
    function.
    c) Need to press next many times to go to the next statement. (the reason is because there are so many generators stacking)
