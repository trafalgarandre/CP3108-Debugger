var debug_on;
// debug_on checks whether run line by line or run to next breakpoint

var debugger_result;
var debugger_marker;


/*
  Function relating to RUN in the DEMO
  Parse and evaluating the code. Also Send the interpreter the breakpoints.
  Initialize debug mode is off (have not reached any breakpoint)
*/
function make_debugger(code, _breakpoints) {
	debug_on = false;
	debugger_marker = null;
	return run(code, _breakpoints);	
}

/*
	Function dealing with how the debugger run.
	If there is no breakpoint, then it will execute the whole program (run the generator until it finish)
	Else it will stop there and wait for the next call (NEXT BUTTON)
*/
function debugger_next(_debugger) {	
	// go to next yield of the generator
	let temp = _debugger.next();

	// remove the marker which shade the previous debugging line if existing
	if (debugger_marker != null) editor.session.removeMarker(debugger_marker);
	
	if (!temp.done) {
		if (debug_on) {
			// debugger is currently run line by line.
			debugger_result = temp.value;
			// shade debugging line
                        debugger_marker = editor.session.addMarker(new Range(line_to_mark(), 0, line_to_mark(), 1), "myMarker", "fullLine");
			//update variable table
			variables_table();
			return debugger_result;
		} else {
			//debugger is running either from the beginning (RUN BUTTON) or run to the next breakpoint (RESUME BUTTON)
			while (debug_on == false && !temp.done) {
				if (check_current_line()) {
					// current line has breakpoint
					on_debug();
					// shade debugging line
					debugger_marker = editor.session.addMarker(new Range(line_to_mark(), 0, line_to_mark(), 1), "myMarker", "fullLine");
					// return the value of current yield
					debugger_result = temp.value;
					// update variable table
					variables_table();
					return debugger_result;
				} else {
					debugger_result = temp.value; 
					temp = _debugger.next();
				}
			}
		}
	}
	// when a generator is finish, the value has not been updated
	if (temp.done) {
		if (temp.value != undefined) {
			debugger_result = temp.value; 
		}
		variables_table();
		console.log(debugger_result);
		return debugger_result;
	}
}

// this function can use to look up variable in all environments;
function watch(_variable) {
	console.log("WATCH");
	return check_variable(_variable);
}

// get the line which next is stop at
function line_to_mark() {
	return get_current_line();	
}

// turn debug mode on
function on_debug() {
    debug_on = true;
}

// turn debug mode off
function off_debug() {
    debug_on = false;
}

// make a table of variables - values of the current environment from scratch by iterate the frame of current environment
function variables_table() {
                let variables = head(get_current_env());
                let var_table = document.getElementById("variables");
                var_table.innerHTML = "";
                let table_row;
                let var_name;
                let var_value;
                let name_td;
                let value_td;
                for(let x in variables) {
                    table_row = document.createElement("tr");

                    name_td = document.createElement("td");
                    value_td = document.createElement("td");

                    var_name = document.createTextNode(x);
                    var_value = document.createTextNode(variables[x]);

                    name_td.appendChild(var_name);
                    value_td.appendChild(var_value);

                    table_row.appendChild(name_td);
                    table_row.appendChild(value_td);

                    var_table.appendChild(table_row);
                }
            }

// global function
// return the value of the current statement/ of the whole program if finish
get_current_val = function() {
	return debugger_result;
}
