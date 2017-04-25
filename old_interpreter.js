            // global variable
            var inter_breakpoints;
            var inter_current_line;
            var current_environment;


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

        (function(){
            function stmt_line(stmt) {
                return stmt.line;
            }
            
            // a not safe way to check generator
            function check_generator(obj) {
                return typeof(obj) == 'object' && typeof(obj.next) == 'function';           
            }
            
            function evaluate_generator(gen) {
                let next = gen.next();
                while (!next.done) {
                    next = gen.next();            
                }
                return next.value;
            }
                    
            function is_function(stmt) {
                return typeof(stmt) === 'function';
            }
                    
            function is_tagged_object(stmt,the_tag) {
                return stmt !== undefined &&is_object(stmt) &&
                    stmt.type === the_tag;
            }

            function is_tagged_function(stmt,the_tag) {
                return is_function(stmt) &&
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
                return is_tagged_object(stmt, 'BinaryExpression');
            }   
                
            function is_unary_expression(stmt) {
                return is_tagged_object(stmt, 'UnaryExpression');
            }
            
            function is_update_expression(stmt) {
                return is_tagged_object(stmt, 'UpdateExpression');
            }         
                    
            function is_empty_list_statement(stmt) {
                return is_tagged_object(stmt,'EmptyStatement');
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
                return is_tagged_object(stmt,"AssignmentExpression") && is_tagged_object(stmt.left, "Identifier");
            }
            function assignment_variable(stmt) {
                return stmt.left.name;
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
            
            function evaluate_update_expression(input_text,stmt,env) {
                let variable = stmt.argument.name;
                let val = lookup_variable_value(variable, env);
                switch (operator(stmt)) {
                    case '++':
                        val++;
                        break;
                    case '--':
                        val--;
                        break;
                }
                set_variable_value(variable,val,env);
            }
                    
            function evaluate_assignment(input_text,stmt,env) {
                let value = evaluate(input_text,assignment_value(stmt),env);
                if (check_generator(value)) {
                        value = evaluate_generator(value);            
                    } 
                set_variable_value(assignment_variable(stmt),
                    value,
                    env);
                return value;
            }
           
            function is_array_expression(stmt) {
                return is_tagged_object(stmt,"ArrayExpression");
            }

            function array_expression_elements(stmt) {
                return  vector_to_list(stmt.elements);
            }

            function evaluate_array_expression(input_text,stmt, env) {
                let evaluated_elements = map(function(p) {
                        let value =  evaluate(input_text,p,env);
                        if (check_generator(value)) {
                            value = evaluate_generator(value);            
                        }
                        return value;
                    },
                    array_expression_elements(stmt));

                return list_to_vector(evaluated_elements);
            }

            function is_object_expression(stmt) {
                return is_tagged_object(stmt,"ObjectExpression");
            }

            function object_expression_pairs(stmt) {
                return vector_to_list(stmt.properties);
            }

            function evaluate_object_expression(input_text,stmt,env) {
                let evaluated_pairs = map(function(p) {
                        let value = evaluate(input_text,p.value,env);
                        if (check_generator(value)) {
                            value = evaluate_generator(value);            
                        }  
                        return pair(p.key.name,
                            value);
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
                return is_tagged_object(stmt,"AssignmentExpression") && is_tagged_object(stmt.left, "MemberExpression");
            }
                    
            function property_assignment_object(stmt) {
                return stmt.left.object;
            }

            function property_assignment_property(stmt) {
                return stmt.left.property.name;
            }

            function property_assignment_value(stmt) {
                return stmt.right;
            }

            function evaluate_property_assignment(input_text,stmt,env) {
                let obj = evaluate(input_text,property_assignment_object(stmt),env);
                if (check_generator(obj)) {
                    obj = evaluate_generator(obj);            
                }
                let property = property_assignment_property(stmt);
                let value = evaluate(input_text,property_assignment_value(stmt),env);
                if (check_generator(value)) {
                    value = evaluate_generator(value);            
                }
                obj[property] = value;
                return value;
            }

            function is_property_access(stmt) {
                return is_tagged_object(stmt,"MemberExpression");
            }

            function property_access_object(stmt) {
                return stmt.object;
            }

            function property_access_property(stmt) {
                return stmt.property.name;
            }

            /**
             * Evaluates a property access statement.
             */
            function evaluate_property_access(input_text,statement,env) {
                let objec = evaluate(input_text,property_access_object(statement),env);
                if (check_generator(objec)) {
                    objec = evaluate_generator(objec);
                }
                let property = property_access_property(statement);
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
                return stmt.id.name;
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
                    let value = evaluate(input_text,var_definition_value(s),env);
                    if (check_generator(value)) {
                        value = evaluate_generator(value);            
                    }
                            
                    define_variable(var_definition_variable(s),
                    value,
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
                return !is_false(x);
            }
            function is_false(x) {
                return x === false || x === 0 || x === "" || is_undefined_value(x) || x === NaN;
            }

            function is_boolean_operation(stmt) {
                return is_tagged_object(stmt, "LogicalExpression");
            }

            function evaluate_boolean_operation(input_text,stmt, args, env) {
                let lhs = evaluate(input_text,list_ref(args, 0), env);
                if (check_generator(lhs)) {
                    lhs = evaluate_generator(lhs);
                }
                if (operator(stmt) === '||') {
                    if (lhs) {
                        return lhs;
                    } else {
                        let val = evaluate(input_text, list_ref(args, 1), env);
                        if (check_generator(val)) {
                            val = evaluate_generator(val);
                        }
                        return val;
                    }
                } else if (operator(stmt) === '&&') {
                    if (!lhs) {
                        return lhs;
                    } else {
                        let val = evaluate(input_text, list_ref(args, 1), env);
                        if (check_generator(val)) {
                            val = evaluate_generator(val);
                        }
                        return val;
                    }
                } else {
                    throw new Error("Unknown binary operator: " + operator(stmt), stmt_line(stmt));
                }
            }

            function* evaluate_if_statement(input_text,stmt,env) {
                inter_current_line = if_predicate(stmt).loc.start.line - 1;
                yield;
                let predicate = evaluate(input_text,if_predicate(stmt), env);
                if (check_generator(predicate)) {
                    predicate = evaluate_generator(predicate);
                }        
                if (is_true(predicate)) {
                    let consequent = evaluate(input_text,if_consequent(stmt), env);
                    let next = consequent.next();
                    yield;
                    while (!next.done) {
                        yield next = consequent.next();
                    }
                    return next.value;
                } else {
                if(equal(if_alternative(stmt), null)) {
                        return undefined;
                    } else {
                        let alternative = evaluate(input_text,if_alternative(stmt), env);
                        let next = alternative.next();
                        yield;
                        while (!next.done) {
                            yield next = alternative.next();
                        }
                        return next.value;
                    }
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
            //assuming for ternary_statement, predicate, consequent, alternative, each has one statement;
            function evaluate_ternary_statement(input_text,stmt, env) {
                let predicate = evaluate(input_text,ternary_predicate(stmt), env);
                if (check_generator(predicate)) {
                    predicate = evaluate_generator(predicate);
                }
                if (is_true(predicate)) {
                    let consequent = evaluate(input_text,ternary_consequent(stmt), env);
                    if (check_generator(consequent)) {
                        consequent = evaluate_generator(consequent);
                    }
                    return consequent;        
                } else {
                    let alternative = evaluate(input_text,ternary_alternative(stmt), env);
                    if (check_generator(alternative)) {
                        alternative = evaluated_generator(alternative);
                    }
                    return alternative;
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
            function* evaluate_while_statement(input_text,stmt, env) {
                let result = undefined;
                inter_current_line = while_predicate(stmt).loc.start.line - 1;
                let condition = evaluate(input_text,while_predicate(stmt), env);
                if (check_generator(condition)) {
                    condition = evaluate_generator(condition);
                }
                while (is_true(condition)) {
                    yield;
                            
                    let new_result = evaluate(input_text,while_statements(stmt), env);
                    let next_result;        
                    yield next_result = new_result.next();
                    while (!next_result.done) {
                        yield next_result = new_result.next();             
                    }
                    new_result = next_result.value;  
                            
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
                    inter_current_line = while_predicate(stmt).loc.start.line - 1;
                    condition = evaluate(input_text,while_predicate(stmt), env);
                    if (check_generator(condition)) {
                        condition = evaluate_generator(condition);
                    }
                }
                return result;
            }

            function is_for_statement(stmt) {
                return is_tagged_object(stmt, "ForStatement");
            }
            function for_initialiser(stmt) {
                return stmt.init;
            }
            function for_predicate(stmt) {
                return stmt.test;
            }
            function for_finaliser(stmt) {
                return stmt.update;
            }
            function for_statements(stmt) {
                return stmt.body;
            }
            // assuming for statement here is the normal for: for (let i = 0; i < 10; i++)
            function* evaluate_for_statement(input_text,stmt, env) {
                let result = undefined;
                for (evaluate(input_text,for_initialiser(stmt), env);
                    is_true(evaluate(input_text,for_predicate(stmt), env));
                    evaluate(input_text,for_finaliser(stmt), env)) {
                    yield;
                    let new_result = evaluate(input_text,for_statements(stmt), env);
                    let next_result;
                            
                    yield next_result = new_result.next();
                    while (!next_result.done) {
                        yield next_result = new_result.next();             
                    }
                    new_result = next_result.value;
                            
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
                    inter_current_line = for_initialiser(stmt).loc.start.line - 1;
                }
                return result;
            }

            function is_function_definition(stmt) {
                return is_tagged_object(stmt,'FunctionDeclaration');
            }
            function function_definition_name(stmt) {
                return stmt.id.name;
            }
            function function_definition_parameters(stmt) {
                return stmt.params;
            }
            function function_definition_body(stmt) {
                return stmt.body;
            }
            function function_definition_text_location(stmt) {
                return stmt.loc;
            }

            function evaluate_function_definition(input_text,stmt,env) {
                let a = (make_function_value(
                    input_text,
                    function_definition_name(stmt),
                    function_definition_parameters(stmt),
                    function_definition_body(stmt),
                    function_definition_text_location(stmt),
                    env));
                let frame = first_frame(env);
                frame[function_definition_name(stmt)] = a;
                return undefined;
            }

            function params_to_list(params) {
                let s = [];
                let i = 0;
                while(typeof(params[i]) !== 'undefined') {
                    i++;
                }
                for( j = i - 1; j >= 0; j--) {
                    s = pair(params[j].name,s);
                }
                return s;
            }

            function make_function_value(input_text,name,parameters,body,location,env) {
                let result = (new Function("apply", "wrap_native_value",
                "return function " + name + "() {\n\
                    var args = map(wrap_native_value, vector_to_list(arguments));\n\
                    return apply(arguments.callee, args, this);\n\
                }"))(apply, wrap_native_value);
                result.type = 'function_value';
                result.params = params_to_list(parameters);
                result.body = body;
                result.source_text = input_text;
                result.environment = env;
               // console.log(location);
                let text = get_input_text(input_text,location.start.line, location.start.column,
                    location.end.line, location.end.column);
                result.toString = function() {
                    return text;
                };
                result.toSource = result.toString;
                return result;
            }
            function is_compound_function_value(f) {
                return is_tagged_function(f,'function_value');
            }
            function function_value_parameters(value) {
                return value.params;
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
                return is_tagged_object(stmt, "NewExpression");
            }
            function construction_type(stmt) {
                return stmt.callee.name;
            }
            function evaluate_construction_statement(input_text,stmt, env) {
                let typename = construction_type(stmt);
                let type = lookup_variable_value(typename, env);
                let result = undefined;
                let extraResult = undefined;
                if (is_primitive_function(type)) {
                    result = Object.create(primitive_implementation(type).prototype);
                } else {
                    //TODO: This causes some problems because we add more fields to the prototype of the object.
                    result = Object.create(type.prototype);
                }
                
                extraResult = evaluate_generator(apply(type, list_of_values(input_text,operands(stmt),env), result));
                //EcmaScript 5.1 Section 13.2.2 [[Construct]]
                if (is_object(extraResult)) {
                    return extraResult;
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

            function* evaluate_sequence(input_text,stmts,env) {
                while (!empty_stmt(stmts)) {
                            
                    //stop before execute a statement
                    inter_current_line = first_stmt(stmts).loc.start.line - 1;
                    current_environment = env;
                    yield;
                            
                    var statement_result = evaluate(input_text,first_stmt(stmts), env);
                    
                    if (check_generator(statement_result)) {
                        let next = statement_result.next();
                        yield;
                        while (!next.done) {
                            yield next = statement_result.next();          
                        }
                        statement_result = next.value;
                    }
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

            function is_this_expression(stmt) {
                return is_tagged_object(stmt, "ThisExpression");
            }

            function evaluate_this_expression(input_text,stmt,env) {
                return lookup_variable_value("this", env);
            }
            function is_application(stmt) {
                return is_tagged_object(stmt,"CallExpression") && is_tagged_object(stmt.callee, "Identifier");
            }
            function is_object_method_application(stmt) {
                return is_tagged_object(stmt,"CallExpression") && is_tagged_object(stmt.callee, "MemberExpression");
            }
            function  operator(stmt) {
                return stmt.operator;
            }
            function boolean_operands(stmt) {
                return list(stmt.left, stmt.right);            
            }
            function operands(stmt) {
                let s = [];
                let i = 0;
                while(typeof(stmt.arguments[i]) !== 'undefined') {
                    i++;
                }
                for( j = i - 1; j >= 0; j--) {
                    s = pair(stmt.arguments[j],s);
                }
                return s;
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
                return stmt.property.name;
            }

            function is_primitive_function(fun) {
                return is_tagged_function(fun,"primitive");
            }
            function primitive_implementation(fun) {
                return fun;
            }

            // This function is used to map whatever a native JavaScript function returns,
            // and tags it such that the interpreter knows what to do with it.
            // apply_in_underlying_javascript marshals interpreter to native; this handles
            // the other direction.
            function wrap_native_value(val) {
                if (is_function(val) && val.type === undefined) {
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
                return is_tagged_object(stmt, "BreakStatement");
            }

            function make_break_value() {
                return { type: "break_value" };
            }

            function is_break_value(value) {
                return is_tagged_object(value, "break_value");
            }

            function is_continue_statement(stmt) {
                return is_tagged_object(stmt, "ContinueStatement");
            }

            function make_continue_value() {
                return { type: "continue_value" };
            }

            function is_continue_value(value) {
                return is_tagged_object(value, "continue_value");
            }

            function is_return_statement(stmt) {
                return is_tagged_object(stmt,'ReturnStatement');
            }
            function return_statement_expression(stmt) {
                return stmt.argument;
            }

            function make_return_value(content) {
                return { type: 'return_value', content: content };
            }
            function is_return_value(value) {
                return is_tagged_object(value,'return_value');
            }
            function return_value_content(value) {
                return value.content;
            }
            function make_tail_recursive_return_value(fun, args, obj, env) {
                return { type: 'tail_recursive_return_value', fun: fun, args: args, obj: obj, env: env };
            }
            function is_tail_recursive_return_value(value) {
                return is_tagged_object(value, 'tail_recursive_return_value');
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
            function is_function_expression(stmt) {
                return is_tagged_object(stmt, "FunctionExpression");
            }

            function evaluate_function_expression(input_text, stmt, env) {
                
                let a = (make_function_value(
                    input_text,
                    "",
                    function_definition_parameters(stmt),
                    function_definition_body(stmt),
                    function_definition_text_location(stmt),
                    env));
                return a;
            }
                    
            function* apply(fun,args,obj) {
                let result = undefined;
                while (result === undefined || is_tail_recursive_return_value(result)) {
                    if (is_primitive_function(fun)) {
                        let val = apply_primitive_function(fun,args,obj);
                        if (check_generator(val)) val = evaluate_generator(val);
                        return val;
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
                                    
                            let next = result.next();
                            yield;
                            while (!next.done) {
                                yield next = result.next();            
                            }
                            result = next.value;
                                    
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
                    let first = evaluate(input_text,first_operand(exps),env);
                    if (check_generator(first)) {
                        first = evaluate_generator(first);    
                    }
                    return pair(first,
                        list_of_values(input_text,rest_operands(exps),env));
                }
            }

            var primitive_functions = 
                list(
                //Builtin functions
                pair("alert", alert),
                pair("prompt", prompt),
                pair("parseInt", parseInt),
                
                //Stream library functions
                pair("is_stream", is_stream),
                pair("stream_tail", stream_tail),
                pair("list_to_stream", list_to_stream),
                pair("stream_to_list", stream_to_list),
                pair("stream_length", stream_length),
                pair("stream_map", stream_map),
                pair("stream_reverse", stream_reverse),
                pair("stream", stream),
                            
                //List library functions
                pair("pair", pair),
                pair("head", head),
                pair("tail", tail),
                pair("list", list),
                pair("length", length),
                pair("map", map),
                pair("is_empty_list", is_empty_list),
                pair("is_pair", is_pair),

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
                if (primitive_function.type && primitive_function.type !== "primitive") {
                    throw new Error('Cannot tag an already tagged object: ' + JSON.stringify(primitive_function) + '/' + primitive_function + '/' + primitive_function.tag);
                } else {}
                primitive_function.type = "primitive";
                return primitive_function;
            }

            function evaluate_body(stmt) {
                //body in esprima.parse is like an array but we cannot access the length
                let s = [];
                let i = 0;
                while(typeof(stmt.body[i]) !== 'undefined') {
                    i++;
                }
                for(j = i - 1; j >= 0; j--) {
                    s = pair(stmt.body[j],s);
                }
                return s;
            } 
                    
            function evaluate(input_text,stmt,env) {        
                if (stmt.type === 'Program') {
                    stmt = evaluate_body(stmt);
                }   

                if ((new Date()).getTime() > expires) {
                    throw new Error('Time limit exceeded.');
                } else if (is_block_statement(stmt)) {
                    stmt = evaluate_body(stmt);
                    return evaluate(input_text, stmt, env);
                } else if (is_expression(stmt)) {
                    return evaluate(input_text,stmt.expression,env);
                } else if (is_self_evaluating(stmt)) {
                    return stmt.value;
                } else if (is_empty_list_statement(stmt)) {
                    return evaluate_empty_list_statement(input_text,stmt,env);
                } else if (is_variable(stmt)) {
                    return lookup_variable_value(stmt.name,env);
                } else if (is_assignment(stmt)) {
                    return evaluate_assignment(input_text,stmt,env);
                } else if (is_var_definition(stmt)) {
                    return evaluate_var_definition(input_text,stmt,env);
                } else if (is_update_expression(stmt)) {
                    return evaluate_update_expression(input_text,stmt,env);
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
                } else if (is_function_expression(stmt)){
                        return evaluate_function_expression(input_text, stmt, env);
                } else if (is_sequence(stmt)) {
                    return evaluate_sequence(input_text,stmt,env);
                } else if (is_boolean_operation(stmt)) {
                    return evaluate_boolean_operation(input_text,
                        stmt,
                        boolean_operands(stmt),
                        env);
                } else if(is_unary_expression(stmt)) {
                    let argument = evaluate(input_text,stmt.argument,env);
                    if (check_generator(argument)) {
                        argument = evaluate_generator(argument);
                    }
                    switch (operator(stmt)) {
                        case "!":
                            return !argument;
                        case "typeof":
                            return typeof(argument);
                    }
                } else if(is_binary_expression(stmt)) {
                    let left = evaluate(input_text,stmt.left,env);
                    if (check_generator(left)) {
                        left = evaluate_generator(left);
                    }
                    let right = evaluate(input_text,stmt.right,env);
                    if (check_generator(right)) {
                        right = evaluate_generator(right);
                    }
                    switch (operator(stmt)) {
                        case '+': 
                             return left + right;
                        case '-':
                             return left - right;
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
                        case '==':
                             return left == right;
                    }
                } else if (is_application(stmt)) {
                     let fun = evaluate(input_text,stmt.callee,env);
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
                    let obj =  evaluate(input_text,object(stmt.callee),env);
                    if (check_generator(obj)) {
                        obj = evaluate_generator(obj);
                    }
                    if (!is_object(obj)) {
                        throw new Error('Cannot apply object method on non-object');
                    } else {
                        let op = evaluate_object_property_access(obj,
                            object_property(stmt.callee));
                        return apply(op,
                            list_of_values(input_text, operands(stmt), env),
                            obj);
                    }
                } else if(is_this_expression(stmt)) {
                    return evaluate_this_expression(input_text,stmt,env);
                } else if (is_break_statement(stmt)) {
                    return make_break_value();
                } else if (is_continue_statement(stmt)) {
                    return make_continue_value();
                } else if (is_return_statement(stmt)) {
                    
                    //Tail-call optimisation.
                    //Tail-calls are return statements which have no deferred operations,
                    //and they return the result of another function call.
                    if (is_application(return_statement_expression(stmt))) {
                        //Over here, if our return expression is simply an expression, we return
                        //a deferred evaluation. Apply will see these, and run it in a while
                        //loop instead.
                        //
                        //To make Apply homogenous, we need to do some voodoo to evaluate
                        //the operands in the function application, but NOT actually apply
                        //the function.
                        let fun = evaluate(input_text,return_statement_expression(stmt).callee, env);
                        let arguments = list_of_values(input_text,operands(return_statement_expression(stmt)), env);
                        let obj = object(stmt) ? evaluate(input_text,object(return_statement_expression(stmt)), env) : window;
                        return make_tail_recursive_return_value(fun, arguments, obj, env);
                    } else {
                        let val = evaluate(input_text,return_statement_expression(stmt),env);
                        if (check_generator(val)) {
                            val = evaluate_generator(val);
                        }
                        return make_return_value(
                            val);
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
            var the_global_environment = (function() {
                let initial_env = extend_environment(primitive_function_names(),
                    primitive_function_objects(),
                    the_empty_environment);
                define_variable("undefined", make_undefined_value(), initial_env);
                define_variable("NaN", NaN, initial_env);
                define_variable("Math", Math, initial_env);
                define_variable("Infinity", Infinity, initial_env);
                define_variable("window", window, initial_env);
                define_variable("debug", debug_break, initial_env);
                define_variable("debug_resume",
                    make_primitive_function_object(debug_resume),
                    initial_env);
                return initial_env;
            })();
            the_global_environment = enclose_by({}, the_global_environment);
                    /// For initialising /other/ toplevel environments.
            ///
            /// By default this is the global environment. However, if a program forces early
            /// termination, we will install the current environment so that we can evaluate
            /// expressions in the "debug" environment. This allows debugging.
            var environment_stack = [the_global_environment];
            environment_stack.top = function() {
                if (this.length === 0) {
                    return null;
                } else {
                    return this[this.length - 1];
                }
            };
                    
            function reset_environment() {
                the_global_environment = (function() {
                let initial_env = extend_environment(primitive_function_names(),
                    primitive_function_objects(),
                    the_empty_environment);
                define_variable("undefined", make_undefined_value(), initial_env);
                define_variable("NaN", NaN, initial_env);
                define_variable("Math", Math, initial_env);
                define_variable("Infinity", Infinity, initial_env);
                define_variable("window", window, initial_env);
                define_variable("debug", debug_break, initial_env);
                define_variable("debug_resume",
                    make_primitive_function_object(debug_resume),
                    initial_env);
                return initial_env;
                })();
                the_global_environment = enclose_by({}, the_global_environment);
                environment_stack = [the_global_environment];
                environment_stack.top = function() {
                    if (this.length === 0) {
                        return null;
                    } else {
                        return this[this.length - 1];
                    }
                };
            }
            function driver_loop() {
                let program_string = read("Enter your program here: ");
                let program_syntax = esprima.parse(program_string);
                if (is_tagged_object(program_syntax,"exit")) {
                    return "interpreter completed";
                } else {
                    let output = evaluate_toplevel(
                        program_string.replace(new RegExp('\r\n', 'g'), '\n').replace(new RegExp('\r', 'g'), '\n').split('\n'),
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
                reset_environment();
                let result = debug_evaluate_toplevel(
                    string.replace(new RegExp('\r\n', 'g'), '\n').replace(new RegExp('\r', 'g'), '\n').split('\n'),
                    esprima.parse(string, {loc : true}),
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
            
            // Public function relating to debugger
            run = function (code, breakpoints) {
                inter_current_line = -1;
                inter_breakpoints = breakpoints;
                return parse_and_evaluate(code);
            }
            
            // Check whether current line has breakpoint
            check_current_line = function() {
                if (inter_breakpoints.has(inter_current_line)) {
                    return true;
                } else {
                    return false;
                }
            }
            
            // Get the current line
            get_current_line = function() {
                return inter_current_line;
            }
            
            // Look up variable in current environment
            check_variable = function(_variable) {
                return lookup_variable_value(_variable, current_environment);
            }
            
            // Get the current environment
            get_current_env = function() {
                return current_environment;
            }
