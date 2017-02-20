// list.js: Supporting lists in the Scheme style, using pairs made
// list.js: Supporting lists in the Scheme style, using pairs made
//          up of two-element JavaScript array (vector)

// Author: Martin Henz

// array test works differently for Rhino and
// the Firefox environment (especially Web Console)
function array_test(x) {
    if (Array.isArray === undefined) {
        return x instanceof Array;
    } else {
        return Array.isArray(x);
    }
}

// pair constructs a pair using a two-element array
// LOW-LEVEL FUNCTION, NOT JEDISCRIPT
function pair(x, xs) {
    return [x, xs];
}

// is_pair returns true iff arg is a two-element array
// LOW-LEVEL FUNCTION, NOT JEDISCRIPT
function is_pair(x) {
    return array_test(x) && x.length === 2;
}

// head returns the first component of the given pair,
// throws an exception if the argument is not a pair
// LOW-LEVEL FUNCTION, NOT JEDISCRIPT
function head(xs) {
    if (is_pair(xs)) {
        return xs[0];
    } else {
        throw new Error("head(xs) expects a pair as "
            + "argument xs, but encountered "+xs);
    }
}

// tail returns the second component of the given pair
// throws an exception if the argument is not a pair
// LOW-LEVEL FUNCTION, NOT JEDISCRIPT
function tail(xs) {
    if (is_pair(xs)) {
        return xs[1];
    } else {
        throw new Error("tail(xs) expects a pair as "
            + "argument xs, but encountered "+xs);
    }

}

// is_empty_list returns true if arg is []
// LOW-LEVEL FUNCTION, NOT JEDISCRIPT
function is_empty_list(xs) {
    if (array_test(xs)) {
        if (xs.length === 0) {
            return true;
        } else if (xs.length === 2) {
            return false;
        } else {
            throw new Error("is_empty_list(xs) expects empty list " +
                "or pair as argument xs, but encountered "+xs);
        }
    } else {
        return false;
    }
}

// is_list recurses down the list and checks that it ends with the empty list []
// does not throw any exceptions
// LOW-LEVEL FUNCTION, NOT JEDISCRIPT
function is_list(xs) {
    for ( ; ; xs = tail(xs)) {
		if (is_empty_list(xs)) {
			return true;
		} else if (!is_pair(xs)) {
            return false;
        }
    }
}

// list makes a list out of its arguments
// LOW-LEVEL FUNCTION, NOT JEDISCRIPT
function list() {
    var the_list = [];
    for (let i = arguments.length - 1; i >= 0; i--) {
        the_list = pair(arguments[i], the_list);
    }
    return the_list;
}

// list_to_vector returns vector that contains the elements of the argument list
// in the given order.
// list_to_vector throws an exception if the argument is not a list
// LOW-LEVEL FUNCTION, NOT JEDISCRIPT
function list_to_vector(lst){
    var vector = [];
    while (!is_empty_list(lst)){
        vector.push(head(lst));
        lst = tail(lst);
    }
    return vector;
}

// vector_to_list returns a list that contains the elements of the argument vector
// in the given order.
// vector_to_list throws an exception if the argument is not a vector
// LOW-LEVEL FUNCTION, NOT JEDISCRIPT
function vector_to_list(vector) {
    if (vector.length === 0) {
        return [];
    }

    var result = [];
    for (var i = vector.length - 1; i >= 0; i = i - 1) {
        result = pair(vector[i], result);
    }
    return result;
}

// returns the length of a given argument list
// throws an exception if the argument is not a list
function length(xs) {
    for (var i = 0; !is_empty_list(xs); ++i) {
		xs = tail(xs);
    }
    return i;
}

// map applies first arg f to the elements of the second argument,
// assumed to be a list.
// f is applied element-by-element:
// map(f,[1,[2,[]]]) results in [f(1),[f(2),[]]]
// map throws an exception if the second argument is not a list,
// and if the second argument is a non-empty list and the first
// argument is not a function.
function map(f, xs) {
    return (is_empty_list(xs))
        ? []
        : pair(f(head(xs)), map(f, tail(xs)));
}

// build_list takes a non-negative integer n as first argument,
// and a function fun as second argument.
// build_list returns a list of n elements, that results from
// applying fun to the numbers from 0 to n-1.
function build_list(n, fun) {
    function build(i, fun, already_built) {
        if (i < 0) {
            return already_built;
        } else {
            return build(i - 1, fun, pair(fun(i),
                        already_built));
        }
    }
    return build(n - 1, fun, []);
}

// for_each applies first arg fun to the elements of the list passed as
// second argument. fun is applied element-by-element:
// for_each(fun,[1,[2,[]]]) results in the calls fun(1) and fun(2).
// for_each returns true.
// for_each throws an exception if the second argument is not a list,
// and if the second argument is a non-empty list and the
// first argument is not a function.
function for_each(fun, xs) {
    if (!is_list(xs)) {
        throw new Error("for_each expects a list as argument xs, but " +
            "encountered " + xs);
    }
    for ( ; !is_empty_list(xs); xs = tail(xs)) {
        fun(head(xs));
    }
    return true;
}

// list_to_string returns a string that represents the argument list.
// It applies itself recursively on the elements of the given list.
// When it encounters a non-list, it applies toString to it.
function list_to_string(l) {
    if (array_test(l) && l.length === 0) {
        return "[]";
    } else {
        if (!is_pair(l)){
            return l.toString();
        }else{
            return "["+list_to_string(head(l))+","+list_to_string(tail(l))+"]";
        }
    }
}

// reverse reverses the argument list
// reverse throws an exception if the argument is not a list.
function reverse(xs) {
    if (!is_list(xs)) {
        throw new Error("reverse(xs) expects a list as argument xs, but " +
            "encountered " + xs);
    }
    var result = [];
    for ( ; !is_empty_list(xs); xs = tail(xs)) {
        result = pair(head(xs), result);
    }
    return result;
}

// append first argument list and second argument list.
// In the result, the [] at the end of the first argument list
// is replaced by the second argument list
// append throws an exception if the first argument is not a list
function append(xs, ys) {
    if (is_empty_list(xs)) {
        return ys;
    } else {
        return pair(head(xs), append(tail(xs), ys));
    }
}

// member looks for a given first-argument element in a given
// second argument list. It returns the first postfix sublist
// that starts with the given element. It returns [] if the
// element does not occur in the list
function member(v, xs){
    for ( ; !is_empty_list(xs); xs = tail(xs)) {
        if (head(xs) === v) {
            return xs;
        }
    }
    return [];
}

// removes the first occurrence of a given first-argument element
// in a given second-argument list. Returns the original list
// if there is no occurrence.
function remove(v, xs){
    if (is_empty_list(xs)) {
        return [];
    } else {
        if (v === head(xs)) {
            return tail(xs);
        } else {
            return pair(head(xs), remove(v, tail(xs)));
        }
    }
}

// Similar to remove. But removes all instances of v instead of just the first
function remove_all(v, xs) {
    if (is_empty_list(xs)) {
        return [];
    } else {
        if (v === head(xs)) {
            return remove_all(v, tail(xs));
        } else {
            return pair(head(xs), remove_all(v, tail(xs)))
        }
    }
}
// for backwards-compatibility
var removeAll = remove_all;

// equal computes the structural equality
// over its arguments
function equal(item1, item2){
    if (is_pair(item1) && is_pair(item2)) {
        return equal(head(item1), head(item2)) &&
            equal(tail(item1), tail(item2));
    } else if (array_test(item1) && item1.length === 0 &&
           array_test(item2) && item2.length === 0) {
        return true;
    } else {
        return item1 === item2;
    }
}

// assoc treats the second argument as an association,
// a list of (index,value) pairs.
// assoc returns the first (index,value) pair whose
// index equal (using structural equality) to the given
// first argument v. Returns false if there is no such
// pair
function assoc(v, xs){
    if (is_empty_list(xs)) {
        return false;
    } else if (equal(v, head(head(xs)))) {
        return head(xs);
    } else {
        return assoc(v, tail(xs));
    }
}

// filter returns the sublist of elements of given list xs
// for which the given predicate function returns true.
function filter(pred, xs){
    if (is_empty_list(xs)) {
        return xs;
    } else {
        if (pred(head(xs))) {
            return pair(head(xs), filter(pred, tail(xs)));
        } else {
            return filter(pred, tail(xs));
        }
    }
}

// enumerates numbers starting from start,
// using a step size of 1, until the number
// exceeds end.
function enum_list(start, end) {
    if (start > end) {
        return [];
    } else {
        return pair(start, enum_list(start + 1, end));
    }
}

// Returns the item in list lst at index n (the first item is at position 0)
function list_ref(xs, n) {
    if (n < 0) {
        throw new Error("list_ref(xs, n) expects a positive integer as " +
            "argument n, but encountered " + n);
    }

    for ( ; n > 0; --n) {
        xs = tail(xs);
    }
    return head(xs);
}

// accumulate applies given operation op to elements of a list
// in a right-to-left order, first apply op to the last element
// and an initial element, resulting in r1, then to the
// second-last element and r1, resulting in r2, etc, and finally
// to the first element and r_n-1, where n is the length of the
// list.
// accumulate(op,zero,list(1,2,3)) results in
// op(1, op(2, op(3, zero)))

function accumulate(op,initial,sequence) {
    if (is_empty_list(sequence)) {
        return initial;
    } else {
        return op(head(sequence),
                  accumulate(op,initial,tail(sequence)));
    }
}

// set_head(xs,x) changes the head of given pair xs to be x,
// throws an exception if the argument is not a pair
// LOW-LEVEL FUNCTION, NOT JEDISCRIPT

function set_head(xs,x) {
    if (is_pair(xs)) {
        xs[0] = x;
        return undefined;
    } else {
        throw new Error("set_head(xs,x) expects a pair as "
            + "argument xs, but encountered "+xs);
    }
}

// set_tail(xs,x) changes the tail of given pair xs to be x,
// throws an exception if the argument is not a pair
// LOW-LEVEL FUNCTION, NOT JEDISCRIPT

function set_tail(xs,x) {
    if (is_pair(xs)) {
        xs[1] = x;
        return undefined;
    } else {
        throw new Error("set_tail(xs,x) expects a pair as "
            + "argument xs, but encountered "+xs);
    }
}

//function display(str) {
//	var to_show = str;
//    if (is_array(str) && str.length > 2) {
//        to_show = '[' + str.toString() + ']';
//	} else if (is_array(str) && is_empty_list(str)) {
//		to_show = '[]';
//	} else if (is_pair(str)) {
//		to_show = '';
//		var stringize = function(item) {
//			if (is_empty_list(item)) {
//				return '[]';
//			} else if (is_pair(item)) {
//				return '[' + stringize(head(item)) + ', ' + stringize(tail(item)) + ']';
//			} else {
//				return item.toString();
//			}
//		}
//		to_show = stringize(str);
//	}
//	//process.stdout.write(to_show);
//	if (typeof to_show === 'function' && to_show.toString) {
//		console.log(to_show.toString());
//	} else {
//		console.log(to_show);
//	}
//	return str;
//} 

/**
 * Parses the given string and returns the evaluated result.
 *
 * @param String string The string to evaluate.
 * @returns The result of evaluating the given expression/program text.
 */
var parse_and_evaluate = undefined;
/**
 * Registers a native JavaScript function for use within the interpreter.
 *
 * @param String name The name of the function to expose.
 * @param Function func The Function to export.
 */
var parser_register_native_function = undefined;
/**
 * Registers a native JavaScript variable for use within the interpreter.
 * 
 * @param String name The name of the variable to expose.
 * @param Object object The Object to export.
 */
var parser_register_native_variable = undefined;
/**
 * Registers a native JavaScript handler for when a debug context is changed.
 *
 * @param Function handler The callback handling all such requests. This
 *                         callback accepts one argument, the line of the
 *                         call. If this is null, then there is no debug
 *                         context active.
 */
var parser_register_debug_handler = undefined;

(function() {
function stmt_line(stmt) {
    return stmt.line;
}
	
function is_object(stmt) {
// is_object has not been implemented yet	
    return typeof(stmt) === 'object';
}
	
function is_tagged_object(stmt,the_tag) {
// stmt.tag = underfined
    return is_object(stmt) &&
        stmt.type === the_tag;
}

function is_self_evaluating(stmt) {
// num, String, boolean are literal in esprima.parse
	return is_tagged_object(stmt, 'Literal');
}

function is_block_statement(stmt) {
	return is_tagged_object(stmt, 'BlockStatement');
}	

function is_expression(stmt) {
	return is_tagged_object(stmt, 'ExpressionStatement');
}

function is_binary_expression(stmt) {
	return is_tagged_object(stmt, 'BinaryExpression')
}	
	
function is_unary_expression(stmt) {
	return is_tagged_object(stmt, 'UnaryExpression');
}
	
function is_empty_list_statement(stmt) {
    return is_tagged_object(stmt,[]);
}

function evaluate_empty_list_statement(input_text,stmt,env) {
    return [];
}

function make_undefined_value() {
    return undefined;
}

function is_undefined_value(value) {
    return value === undefined;
}

function is_variable(stmt) {
    return is_tagged_object(stmt,"Identifier");
}

function variable_name(stmt) {
    return stmt.name;
}

function enclosing_environment(env) {
    return tail(env);
}
function first_frame(env) {
    return head(env);
}
var the_empty_environment = [];
function is_empty_environment(env) {
    return is_empty_list(env);
}
function enclose_by(frame,env) {
    return pair(frame,env);
}

function lookup_variable_value(variable,env) {
    function env_loop(env) {
        if (is_empty_environment(env)) {
            throw new Error("Unbound variable: " + variable);
        } else if (has_binding_in_frame(variable,first_frame(env))) {
            return first_frame(env)[variable];
        } else {
            return env_loop(enclosing_environment(env));
        }
    }
    let val = env_loop(env);
    return val;
}

function is_assignment(stmt) {
    return is_tagged_object(stmt,"AssignmentExpression");
}
function assignment_variable(stmt) {
    return stmt.left;
}
function assignment_value(stmt) {
    return stmt.right;
}

function set_variable_value(variable,value,env) {
    function env_loop(env) {
        if (is_empty_environment(env)) {
            throw new Error("Undeclared variable in assignment: " + variable_name(variable));
        } else if (has_binding_in_frame(variable,first_frame(env))) {
            add_binding_to_frame(variable,value,first_frame(env));
        } else {
            env_loop(enclosing_environment(env));
        }
    }
    env_loop(env);
    return undefined;
}

function evaluate_assignment(input_text,stmt,env) {
    let value = evaluate(input_text,assignment_value(stmt),env);
    set_variable_value(assignment_variable(stmt),
        value,
        env);
    return value;
}

function is_array_expression(stmt) {
    return is_tagged_object(stmt,"ArrayExpression");
}

function array_expression_elements(stmt) {
    return stmt.elements;
}

function evaluate_array_expression(input_text,stmt, env) {
    let evaluated_elements = map(function(p) {
            return evaluate(input_text,p,env);
        },
        array_expression_elements(stmt));

    return list_to_vector(evaluated_elements);
}

function is_object_expression(stmt) {
    return is_tagged_object(stmt,"ObjectExpression");
}

function object_expression_pairs(stmt) {
    return stmt.properties;
}

function evaluate_object_expression(input_text,stmt,env) {
    let evaluated_pairs = map(function(p) {
            return pair(evaluate(input_text,head(p),env),
                evaluate(input_text,tail(p),env));
        },
        object_expression_pairs(stmt));
    
    function make_object(pairs_to_handle, constructed_object) {
        if (is_empty_list(pairs_to_handle)) {
            return constructed_object;
        } else {
            constructed_object[head(head(pairs_to_handle))] =
                tail(head(pairs_to_handle));
            return make_object(tail(pairs_to_handle), constructed_object);
        }
    }
    return make_object(evaluated_pairs,{});
}



function is_property_assignment(stmt) {
    return is_tagged_object(stmt,"property_assignment");
}

function property_assignment_object(stmt) {
    return stmt.object;
}

function property_assignment_property(stmt) {
    return stmt.property;
}

function property_assignment_value(stmt) {
    return stmt.value;
}

function evaluate_property_assignment(input_text,stmt,env) {
    let obj = evaluate(input_text,property_assignment_object(stmt),env);
    let property = evaluate(input_text,property_assignment_property(stmt),env);
    let value = evaluate(input_text,property_assignment_value(stmt),env);
    obj[property] = value;
    return value;
}

function is_property_access(stmt) {
    let x = is_tagged_object(stmt,"property_access");
    return x;
}

function property_access_object(stmt) {
    return stmt.object;
}

function property_access_property(stmt) {
    return stmt.property;
}

/**
 * Evaluates a property access statement.
 */
function evaluate_property_access(input_text,statement,env) {
    let objec = evaluate(input_text,property_access_object(statement),env);
    let property = evaluate(input_text,property_access_property(statement),env);
    return evaluate_object_property_access(objec, property);
}

/**
 * Actually does the property access.
 */
function evaluate_object_property_access(object, property) {
    let result = object[property];

    //We need to post-process the return value. Because objects can be native
    //we need to marshal native member functions into our primitive tag.
    return wrap_native_value(result);
}

function is_var_definition(stmt) {
    return is_tagged_object(stmt,"VariableDeclaration");
}
function var_definition_variable(stmt) {
    return stmt.id;
}
function var_definition_value(stmt) {
    return stmt.init;
}

function make_frame(variables,values) {
    if (is_empty_list(variables) && is_empty_list(values)) {
        return {};
    } else {
        let frame = make_frame(tail(variables),tail(values));
        frame[head(variables)] = head(values);
        return frame;
    }
}

function add_binding_to_frame(variable,value,frame) {
    frame[variable] = value;
    return undefined;
}
function has_binding_in_frame(variable,frame) {
    return frame.hasOwnProperty(variable);
}

function define_variable(variable,value,env) {
    let frame = first_frame(env);
    return add_binding_to_frame(variable,value,frame);
}

function evaluate_var_definition(input_text,stmt,env) {
	let i = 0;
	if (stmt.declarations !== undefined) {
	    while(typeof(stmt.declarations[i]) !== 'undefined') {
		i++;
	    }
	}
	for(let j = 0; j < i; j++) {
		let s = stmt.declarations[j];
		define_variable(var_definition_variable(s),
		evaluate(input_text,var_definition_value(s),env),
		env);
	   }
	return undefined;
}

function is_if_statement(stmt) {
    return is_tagged_object(stmt,"IfStatement");
}
function if_predicate(stmt) {
    return stmt.test;
}
function if_consequent(stmt) {
    return stmt.consequent;
}
function if_alternative(stmt) {
    return stmt.alternate;
}

function is_true(x) {
    return ! is_false(x);
}
function is_false(x) {
    return x === false || x === 0 || x === "" || is_undefined_value(x) || x === NaN;
}

function is_boolean_operation(stmt) {
    return is_tagged_object(stmt, "LogicalExpression");
}

function evaluate_boolean_operation(input_text,stmt, args, env) {
    let lhs = evaluate(input_text,list_ref(args, 0), env);
    if (operator(stmt) === '||') {
        if (lhs) {
            return lhs;
        } else {
            return evaluate(input_text,list_ref(args, 1), env);
        }
    } else if (operator(stmt) === '&&') {
        if (!lhs) {
            return lhs;
        } else {
            return evaluate(input_text,list_ref(args, 1), env);
        }
    } else {
        throw new Error("Unknown binary operator: " + operator(stmt), stmt_line(stmt));
    }
}

function evaluate_if_statement(input_text,stmt,env) {
    if (is_true(evaluate(input_text,if_predicate(stmt),env))) {
        return evaluate(input_text,if_consequent(stmt),env);
    } else {
	if(equal(if_alternative(stmt), null)) return undefined;
        return evaluate(input_text,if_alternative(stmt),env);
    }
}

function is_ternary_statement(stmt) {
    return is_tagged_object(stmt, "ConditionalExpression");
}
function ternary_predicate(stmt) {
    return stmt.test;
}
function ternary_consequent(stmt) {
    return stmt.consequent;
}
function ternary_alternative(stmt) {
    return stmt.alternate;
}
function evaluate_ternary_statement(input_text,stmt, env) {
    if (is_true(evaluate(input_text,ternary_predicate(stmt), env))) {
        return evaluate(input_text,ternary_consequent(stmt), env);
    } else {
        return evaluate(input_text,ternary_alternative(stmt), env);
    }
}

function is_while_statement(stmt) {
    return is_tagged_object(stmt, 'WhileStatement');
}
function while_predicate(stmt) {
    return stmt.test;
}
function while_statements(stmt) {
    return stmt.body;
}
function evaluate_while_statement(input_text,stmt, env) {
    let result = undefined;
    while (is_true(evaluate(input_text,while_predicate(stmt), env))) {
        var new_result = evaluate(input_text,while_statements(stmt), env);
        if (is_return_value(new_result) ||
            is_tail_recursive_return_value(new_result)) {
            return new_result;
        } else if (is_break_value(new_result)) {
            break;
        } else if (is_continue_value(new_result)) {
            continue;
        } else {
            result = new_result;
        }
    }
    return result;
}

function is_for_statement(stmt) {
    return is_tagged_object(stmt, "for");
}
function for_initialiser(stmt) {
    return stmt.initialiser;
}
function for_predicate(stmt) {
    return stmt.predicate;
}
function for_finaliser(stmt) {
    return stmt.finaliser;
}
function for_statements(stmt) {
    return stmt.statements;
}
function evaluate_for_statement(input_text,stmt, env) {
    let result = undefined;
    for (evaluate(input_text,for_initialiser(stmt), env);
        is_true(evaluate(input_text,for_predicate(stmt), env));
        evaluate(input_text,for_finaliser(stmt), env)) {
        let new_result = evaluate(input_text,for_statements(stmt), env);

        if (is_return_value(new_result) ||
            is_tail_recursive_return_value(new_result)) {
            return new_result;
        } else if (is_break_value(new_result)) {
            break;
        } else if (is_continue_value(new_result)) {
            continue;
        } else {
            result = new_result;
        }
    }
    return result;
}

function is_function_definition(stmt) {
    return is_tagged_object(stmt,'FunctionDeclaration');
}

function function_definition_name(stmt) {
    return stmt.name;
}
function function_definition_parameters(stmt) {
    return stmt.parameters;
}
function function_definition_body(stmt) {
    return stmt.body;
}
function function_definition_text_location(stmt) {
    return stmt.location;
}

function evaluate_function_definition(input_text,stmt,env) {
    return make_function_value(
        input_text,
        function_definition_name(stmt),
        function_definition_parameters(stmt),
        function_definition_body(stmt),
        function_definition_text_location(stmt),
        env);
}
function make_function_value(input_text,name,parameters,body,location,env) {
    let result = (new Function("apply", "wrap_native_value",
    "return function " + name + "() {\n\
        var args = map(wrap_native_value, vector_to_list(arguments));\n\
        return apply(arguments.callee, args, this);\n\
    }"))(apply, wrap_native_value);
    result.tag = "function_value";
    result.parameters = parameters;
    result.body = body;
    result.source_text = input_text;
    result.environment = env;

    let text = get_input_text(input_text,location.start_line, location.start_col,
        location.end_line, location.end_col);
    result.toString = function() {
        return text;
    };
    result.toSource = result.toString;
    return result;
}
function is_compound_function_value(f) {
    return is_tagged_object(f,"function_value");
}
function function_value_parameters(value) {
    return value.parameters;
}
function function_value_body(value) {
    return value.body;
}
function function_value_environment(value) {
    return value.environment;
}
function function_value_name(value) {
    return value.name;
}
function function_value_source_text(value) {
    return value.source_text;
}

function is_construction(stmt) {
    return is_tagged_object(stmt, "construction");
}
function construction_type(stmt) {
    return stmt.type;
}
function evaluate_construction_statement(input_text,stmt, env) {
    let typename = evaluate(input_text,construction_type(stmt), env);
    let type = lookup_variable_value(typename, env);
    let result = undefined;
    let extraResult = undefined;
    if (is_primitive_function(type)) {
        result = Object.create(primitive_implementation(type).prototype);
    } else {
        //TODO: This causes some problems because we add more fields to the prototype of the object.
        result = Object.create(type.prototype);
    }
    
    extraResult = apply(type, list_of_values(input_text,operands(stmt),env), result);

    //EcmaScript 5.1 Section 13.2.2 [[Construct]]
    if (is_object(extraResult)) {
        return extraResult
    } else {
        return result;
    }
}

function is_sequence(stmt) {
    return is_list(stmt);
}
function empty_stmt(stmts) {
    return is_empty_list(stmts);
}
function last_stmt(stmts) {
    return is_empty_list(tail(stmts));
}
function first_stmt(stmts) {
    return head(stmts);
}
function rest_stmts(stmts) {
    return tail(stmts);
}

function evaluate_sequence(input_text,stmts,env) {
    while (!empty_stmt(stmts)) {
        var statement_result = evaluate(input_text,first_stmt(stmts), env);
        if (last_stmt(stmts)) {
            return statement_result;
        } else if (is_return_value(statement_result) ||
            is_tail_recursive_return_value(statement_result)) {
            return statement_result;
        } else if (is_break_value(statement_result) ||
            is_continue_value(statement_result)) {
            return statement_result;
        } else {
            stmts = rest_stmts(stmts);
        }
    }
}

function is_application(stmt) {
    return is_tagged_object(stmt,"application");
}
function is_object_method_application(stmt) {
    return is_tagged_object(stmt,"object_method_application");
}
function operator(stmt) {
    return stmt.operator;
}
function operands(stmt) {
    return stmt.operands;
}
function no_operands(ops) {
    return is_empty_list(ops);
}
function first_operand(ops) {
    return head(ops);
}
function rest_operands(ops) {
    return tail(ops);
}
function object(stmt) {
    return stmt.object;
}
function object_property(stmt) {
    return stmt.property;
}

function is_primitive_function(fun) {
    return is_tagged_object(fun,"primitive");
}
function primitive_implementation(fun) {
    return fun;
}

// This function is used to map whatever a native JavaScript function returns,
// and tags it such that the interpreter knows what to do with it.
// apply_in_underlying_javascript marshals interpreter to native; this handles
// the other direction.
function wrap_native_value(val) {
    if (is_function(val) && val.tag === undefined) {
        return make_primitive_function_object(val);
    } else {
        return val;
    }
}
function apply_primitive_function(fun,argument_list,object) {
    return wrap_native_value(
        apply_in_underlying_javascript.call(object,primitive_implementation(fun),
            argument_list)
    );
}

function extend_environment(vars,vals,base_env) {
    let var_length = length(vars);
    let val_length = length(vals);
    if (var_length === val_length) {
        let new_frame = make_frame(vars,vals);
        return enclose_by(new_frame,base_env);
    } else if (var_length < val_length) {
        throw new Error("Too many arguments supplied: " + JSON.stringify(vars) +
            JSON.stringify(vals));
    } else {
        throw new Error("Too few arguments supplied: " + JSON.stringify(vars) +
            JSON.stringify(vals));
    }
}

function is_break_statement(stmt) {
    return is_tagged_object(stmt, "break_statement");
}

function make_break_value() {
    return { tag: "break_value" };
}

function is_break_value(value) {
    return is_tagged_object(value, "break_value");
}

function is_continue_statement(stmt) {
    return is_tagged_object(stmt, "continue_statement");
}

function make_continue_value() {
    return { tag: "continue_value" };
}

function is_continue_value(value) {
    return is_tagged_object(value, "continue_value");
}

function is_return_statement(stmt) {
    return is_tagged_object(stmt,"return_statement");
}
function return_statement_expression(stmt) {
    return stmt.expression;
}

function make_return_value(content) {
    return { tag: "return_value", content: content };
}
function is_return_value(value) {
    return is_tagged_object(value,"return_value");
}
function return_value_content(value) {
    return value.content;
}
function make_tail_recursive_return_value(fun, args, obj, env) {
    return { tag: "tail_recursive_return_value", fun: fun, args: args, obj: obj, env: env };
}
function is_tail_recursive_return_value(value) {
    return is_tagged_object(value, "tail_recursive_return_value");
}
function tail_recursive_function(value) {
    return value.fun;
}
function tail_recursive_arguments(value) {
    return value.args;
}
function tail_recursive_object(value) {
    return value.obj;
}
function tail_recursive_environment(value) {
    return value.env;
}

function apply(fun,args,obj) {
    let result = undefined;
    while (result === undefined || is_tail_recursive_return_value(result)) {
        if (is_primitive_function(fun)) {
            return apply_primitive_function(fun,args,obj);
        } else if (is_compound_function_value(fun)) {
            if (length(function_value_parameters(fun)) === length(args)) {
                let env = extend_environment(function_value_parameters(fun),
                        args,
                        function_value_environment(fun));
                if (obj && is_object(obj)) {
                    add_binding_to_frame("this", obj, first_frame(env));
                } else {}

                //We have to pass in the source text we had at the function evaluation
                //time because we might evaluate new functions within and those would
                //require original input (since we hold references to the original
                //source text)
                let result = evaluate(function_value_source_text(fun),function_value_body(fun), env);
                if (is_return_value(result)) {
                    return return_value_content(result);
                } else if (is_tail_recursive_return_value(result)) {
                    fun = tail_recursive_function(result);
                    args = tail_recursive_arguments(result);
                    obj = tail_recursive_object(result);
                    env = tail_recursive_environment(result);
                } else if (is_break_value(result) || is_continue_value(result)) {
                    throw new Error("break and continue not allowed outside of function.");
                } else {
                    return undefined;
                }
            } else {
                throw new Error('Incorrect number of arguments supplied for function ' +
                    function_value_name(fun));
            }
        } else if (fun === undefined) {
            throw new Error("Unknown function type for application: undefined");
        } else {
            throw new Error("Unknown function type for application: " + JSON.stringify(fun),
                stmt_line(fun));
        }
    }
}

function list_of_values(input_text,exps,env) {
    if (no_operands(exps)) {
        return [];
    } else {
        return pair(evaluate(input_text,first_operand(exps),env),
            list_of_values(input_text,rest_operands(exps),env));
    }
}

var primitive_functions = 
    list(
    //Builtin functions
    pair("alert", alert),
    pair("prompt", prompt),
    pair("parseInt", parseInt),

    //List library functions
    pair("pair", pair),
    pair("head", head),
    pair("tail", tail),
    pair("list", list),
    pair("length", length),
    pair("map", map),
    pair("is_empty_list", is_empty_list),

    //Intepreter functions
    pair("parse", esprima.parse),
    pair("error", function(x) {
        throw new Error(x);
    })
    );

function primitive_function_names() {
    return map(function(x) { return head(x); },
        primitive_functions);
}

function primitive_function_objects() {
    return map(
        function(f) {
            if (!is_compound_function_value(tail(f))) {
                return make_primitive_function_object(tail(f));
            } else {
                return tail(f);
            }
        },
        primitive_functions);
}

function make_primitive_function_object(primitive_function) {
    if (primitive_function.tag && primitive_function.tag !== "primitive") {
        throw new Error('Cannot tag an already tagged object: ' + JSON.stringify(primitive_function) + '/' + primitive_function + '/' + primitive_function.tag);
    } else {}
    primitive_function.tag = "primitive";
    return primitive_function;
}

function evaluate_body(stmt) {
    //body in esprima.parse is like an array but we cannot access the length
    let s = [];
    let i = 0;
    while(typeof(stmt.body[i]) !== 'undefined') {
	i++;
    }
    for( j = i - 1; j >= 0; j--) {
	s = pair(stmt.body[j],s);
    }
    return s;
}	
	
var expires = undefined;
function evaluate(input_text,stmt,env) {
    if (stmt.type === 'Program') {
        stmt = evaluate_body(stmt);
    }	
    if ((new Date()).getTime() > expires) {
        throw new Error('Time limit exceeded.');
    } else if (is_block_statement(stmt)) {
	let new_env = extend_environment([], [], env);	
	stmt = evaluate_body(stmt);
	return evaluate(input_text, stmt, new_env);
    } else if (is_expression(stmt)) {
	return evaluate(input_text,stmt.expression,env);
    } else if (is_self_evaluating(stmt)) {
        return stmt.value;
    } else if (is_empty_list_statement(stmt)) {
        return evaluate_empty_list_statement(input_text,stmt,env);
    } else if (is_variable(stmt)) {
        return lookup_variable_value(stmt,env);
    } else if (is_assignment(stmt)) {
        return evaluate_assignment(input_text,stmt,env);
    } else if (is_var_definition(stmt)) {
        return evaluate_var_definition(input_text,stmt,env);
    } else if (is_if_statement(stmt)) {
        return evaluate_if_statement(input_text,stmt,env);
    } else if (is_ternary_statement(stmt)) {
        return evaluate_ternary_statement(input_text,stmt,env);
    } else if (is_while_statement(stmt)) {
        return evaluate_while_statement(input_text,stmt,env);
    } else if (is_for_statement(stmt)) {
        return evaluate_for_statement(input_text,stmt,env);
    } else if (is_function_definition(stmt)) {
        return evaluate_function_definition(input_text,stmt,env);
    } else if (is_sequence(stmt)) {
        return evaluate_sequence(input_text,stmt,env);
    } else if (is_boolean_operation(stmt)) {
        return evaluate_boolean_operation(input_text,
            stmt,
            operands(stmt),
            env);
    } else if(is_unary_expression(stmt)) {
	return !evaluate(stmt.argument);
    } else if(is_binary_expression(stmt)) {
	let left = evaluate(input_text,stmt.left,env);
	let right = evaluate(input_text,stmt.right,env);
	switch (operator(stmt)) {
		case '+': 
			return left + right;
		case '*':
			return left * right;
		case '/':
			return left / right;
		case '%':
			return left % right;
		case '===':
			return left === right;
		case '!==':
			return left !== right;
		case '<':
			return left < right;
		case '>':
			return left > right;
		case '<=':
			return left <= right;
		case '>=':
			return left >= right;		
	}    
    } else if (is_application(stmt)) {
        let fun = evaluate(input_text,operator(stmt),env);
        let args = list_of_values(input_text,operands(stmt),env);
        let context = object(stmt) ? evaluate(input_text,object(stmt),env) : window;

        // We need to be careful. If we are calling debug() then we need
        // to give the environment to throw.
        if (fun === debug_break) {
            debug_break(env, stmt_line(stmt));
            // no return, exception thrown
        } else {
            return apply(fun, args, context);
        }
    } else if (is_object_method_application(stmt)) {
        let obj = object(stmt) ? evaluate(input_text,object(stmt),env) : window;
        if (!is_object(obj)) {
            throw new Error('Cannot apply object method on non-object');
        } else {
            let op = evaluate_object_property_access(obj,
                evaluate(input_text, object_property(stmt), env));
            return apply(op,
                list_of_values(input_text, operands(stmt), env),
                obj);
        }
    } else if (is_break_statement(stmt)) {
        return make_break_value();
    } else if (is_continue_statement(stmt)) {
        return make_continue_value();
    } else if (is_return_statement(stmt)) {
        //Tail-call optimisation.
        //Tail-calls are return statements which have no deferred operations,
        //and they return the result of another function call.
        if (is_application(return_statement_expression(stmt)) &&
                    is_variable(operator(return_statement_expression(stmt)))) {
            //Over here, if our return expression is simply an expression, we return
            //a deferred evaluation. Apply will see these, and run it in a while
            //loop instead.
            //
            //To make Apply homogenous, we need to do some voodoo to evaluate
            //the operands in the function application, but NOT actually apply
            //the function.
            let fun = evaluate(input_text,operator(return_statement_expression(stmt)), env);
            let arguments = list_of_values(input_text,operands(return_statement_expression(stmt)), env);
            let obj = object(stmt) ? evaluate(input_text,object(return_statement_expression(stmt)), env) : window;
            return make_tail_recursive_return_value(fun, arguments, obj, env);
        } else {
            return make_return_value(
                evaluate(input_text,return_statement_expression(stmt),
                env));
        }
    } else if (is_array_expression(stmt)) {
        return evaluate_array_expression(input_text,stmt,env);
    } else if (is_object_expression(stmt)) {
        return evaluate_object_expression(input_text,stmt,env);
    } else if (is_construction(stmt)) {
        return evaluate_construction_statement(input_text,stmt,env);
    } else if (is_property_access(stmt)) {
        return evaluate_property_access(input_text,stmt,env);
    } else if (is_property_assignment(stmt)) {
        return evaluate_property_assignment(input_text,stmt,env);
    } else {
        throw new Error("Unknown expression type: " + JSON.stringify(stmt),
            stmt_line(stmt));
    }
}

function evaluate_toplevel(input_text,stmt,env) {
    let value = evaluate(input_text,stmt,env);
    if (is_return_value(value) || is_tail_recursive_return_value(value)) {
        throw new Error("return not allowed outside of function definition");
    } else if (is_break_value(value) || is_continue_value(value)) {
        throw new Error("break and continue not allowed outside of function.");
    } else {
        return value;
    }
}

/// The top-level environment.
let the_global_environment = (function() {
    let initial_env = extend_environment(primitive_function_names(),
        primitive_function_objects(),
        the_empty_environment);
    define_variable("undefined", make_undefined_value(), initial_env);
    define_variable("NaN", NaN, initial_env);
    define_variable("Infinity", Infinity, initial_env);
    define_variable("window", window, initial_env);
    define_variable("debug", debug_break, initial_env);
    define_variable("debug_resume",
        make_primitive_function_object(debug_resume),
        initial_env);
    return initial_env;
})();

/// For initialising /other/ toplevel environments.
///
/// By default this is the global environment. However, if a program forces early
/// termination, we will install the current environment so that we can evaluate
/// expressions in the "debug" environment. This allows debugging.
let environment_stack = [the_global_environment];
environment_stack.top = function() {
    if (this.length === 0) {
        return null;
    } else {
        return this[this.length - 1];
    }
};

function driver_loop() {
    let program_string = read("Enter your program here: ");
    let program_syntax = esprima.parse(program_string);
    if (is_tagged_object(program_syntax,"exit")) {
        return "interpreter completed";
    } else {
        let output = evaluate_toplevel(
            string.replace(new RegExp('\r\n', 'g'), '\n').replace(new RegExp('\r', 'g'), '\n').split('\n'),
            program_syntax, environment_stack.top());
        write(output);
        return driver_loop();
    }
}

function get_input_text(input_text, start_line, start_col, end_line, end_col) {
    //Fix index-from-line 1
    start_line = start_line - 1;
    end_line = end_line - 1;

    if (start_line === end_line) {
        return input_text[start_line].substr(start_col, end_col - start_col + 1);
    } else {
        let result = '';
        let i = start_line;
        result = result + input_text[start_line].substr(start_col) + '\n';
        
        for (i = i + 1; i < end_line; i = i + 1) {
            result = result + input_text[i] + '\n';
        }
        
        result = result + input_text[end_line].substr(0, end_col + 1);
        return result;
    }
}

/// \section Debugging support
function DebugException(environment, line) {
    this.environment = environment;
    this.line = line;
}

/// The registered debug handler. If this is set, when debug_break is called,
/// this handler will get triggered with the line number of the triggering
/// call.
var debug_handler = null;

/// Breaks the interpreter, throwing the environment to the top level.
function debug_break(env, line) {
    throw new DebugException(env, line);
}

/// Handles the exception generated by debug_break, installing it to
/// the top level.
function debug_handle(exception) {
    environment_stack.push(exception.environment);
    console.warn("Debugger environment initialised.");

    if (debug_handler) {
        debug_handler(exception.line);
    }
}

/// Removes the top environment from the environment stack.
function debug_resume() {
    if (environment_stack.length > 1) {
        environment_stack.pop();
        console.log("Environment restored.");

        if (environment_stack.length === 1 && debug_handler) {
            debug_handler(null);
        }
    } else {
        console.log("No environments to restore.");
    }
}

function debug_evaluate_toplevel() {
    try {
        return evaluate_toplevel.apply(this, arguments);
    } catch (e) {
        if (e instanceof DebugException) {
            debug_handle(e);
        } else {
            throw e;
        }
    }
}

//Public functions
/// Parses and evaluates the given program source text, with an optional timeout
/// where an exception (time limit exceeded) is thrown.
/// \param[in] string The program text string to run as the program code.
/// \param[in] timeout The timeout in milliseconds before code execution is
///                    interrupted.
parse_and_evaluate = function(string, timeout) {
    if (timeout) {
        expires = (new Date()).getTime() + timeout;
    } else {
        expires = undefined;
    }
    
    let result = debug_evaluate_toplevel(
        string.replace(new RegExp('\r\n', 'g'), '\n').replace(new RegExp('\r', 'g'), '\n').split('\n'),
        esprima.parse(string),
        environment_stack.top());

    // Reset the timeout.
    expires = undefined;
    return result;
};

parser_register_native_function = function(name, func) {
    if (!is_function(func) && !is_primitive_function(func)) {
        throw new Error("parser_register_native_function can only be used to register " +
            "functions: " + JSON.stringify(func) + " given.");
    } else if (is_primitive_function(func)) {
        //No need to wrap another layer of indirection
        add_binding_to_frame(name, func,
            first_frame(the_global_environment));
    } else {
        add_binding_to_frame(name, make_primitive_function_object(func),
            first_frame(the_global_environment));
    }
};

parser_register_native_variable = function(name, object) {
    if (is_object(object) && is_function(object)) {
        throw new Error("parser_register_native_variable can only be used to register " +
            "variables.");
    } else {
        define_variable(name, object, the_global_environment);
    }
};

parser_register_debug_handler = function(handler) {
    debug_handler = handler;
}

})();
