/*
* @Author: detailyang
* @Date:   2017-06-25 22:11:22
* @Last Modified by:   detailyang
* @Last Modified time: 2017-07-13 00:19:11
*/

'use strict';


const OP = {
    "or": function(left, right) {
        return left || right;
    },

    "and": function(left, right) {
        return left && right;
    },

    "<": function(left, right) {
        return left < right;
    },

    ">": function(left, right) {
        return left > right;
    },

    "<=": function(left, right) {
        return left <= right;
    },

    ">=": function(left, right) {
        return left >= right;
    },

    "==": function(left, right) {
        return left == right;
    },

    "~=": function(left, right) {
        return left != right;
    },

    "..": function(left, right) {
        return `${left}${right}`;
    },

    "+": function(left, right) {
        return left + right;
    },

    "-": function(left, right) {
        return left - right;
    },

    "*": function(left, right) {
        return left * right;
    },

    "/": function(left, right) {
        return left / right;
    },

    "^": function(left, rihgt) {
        return math.pow(left, right);
    },

    "#-": function(right) {
        return -right;
    },

    "not": function(right) {
        return !right;
    },

    "#": function(right) {
        if (typeof(right) != "string") {
            throw new Error("attempt to get length of a nonstring value");
        }

        return right.length;
    },
};


class Interpreter {
    constructor(ast, env) {
        this.ast = ast;
        this.env = env;
    }

    interprete() {
        return this.evaluate(this.ast, this.env);
    }

    evaluate(node, env) {
        switch(node.type) {
            case 'Program':
                return this.evaluate(node.body, env);
            case 'Chunk':
                return this.evaluate_chunk(node, env);
            case 'Identifier':
                return this.evaluate_identifier(node, env);
            case 'Literal':
                return this.evaluate_literal(node, env);
            case 'AssignExpression':
                return this.evaluate_assign_expression(node, env);
            case 'LocalStatement':
                return this.evaluate_local_stat(node, env);
            case 'ExpressionStatement':
                return this.evaluate_expression_stat(node, env);
            case 'CallExpression':
                return this.evaluate_call_expression(node, env);
            case 'UnaryExpression':
                return this.evaluate_unary_expression(node, env);
            case 'BinaryExpression':
                return this.evaluate_binary_expression(node, env);
            case 'DoStatement':
                return this.evaluate_do_statment(node, env);
            case 'BreakStatement':
                return this.evaluate_break_statment(node, env);
            case 'ReturnStatement':
                return this.evaluate_return_statment(node, env);
            case 'FunctionDeclaration':
                return this.evaluate_function_declaration(node, env);
            case 'TableExpression':
                return this.evaluate_table_expression(node, env);
            case 'MemberExpression':
                return this.evaluate_member_expression(node, env);
            case 'IfStatement':
                return this.evaluate_if_statement(node, env);
            case 'FornumStatement':
                return this.evaluate_fornum_statement(node, env);
            case 'ForlistStatement':
                return this.evaluate_forlist_statement(node, env);
            case 'WhileStatement':
                return this.evaluate_while_statement(node, env);
            case 'RepeatStatement':
                return this.evaluate_repeat_statement(node, env);
            default:
                throw new Error(`unknow ast node with ${node.type}`);
        }
    }

    evaluate_program(node, env) {
        return this.evaluate(node.body, env);
    }

    evaluate_chunk(node, env) {
        let rv;
        for (let i = 0; i < node.body.length; i++) {
            rv = this.evaluate(node.body[i], env);
        }

        return rv;
    }

    evaluate_table_expression(node, env) {
        let t = {}
        const self = this;
        let i = 1;

        node.fields.map((field) => {
            if (field.type == 'Recfield') {
                // identifier
                let key = field.key.name;
                let value = self.evaluate(field.value, env);
                t[key] = value;
            } else {
                let value = self.evaluate(field.value, env);
                t[i++] = value;
            }
        });

        return t;
    }

    evaluate_literal(node, env) {
        return node.value;
    }

    evaluate_assign_expression(node, env) {
        for (let i = 0; i < node.left.length; i++) {
            const n = node.left[i];
            if (n.type == 'Identifier') {
                env.def(n.name, this.evaluate(node.right[i], env));
            }
        }
    }

    evaluate_do_statment(node, env) {
        return this.evaluate(node.body, env.extend());
    }

    evaluate_break_statment(node, env) {
    }

    evaluate_return_statment(node, env) {
        const self = this;
        let results = node.params.map((param) => {
            return self.evaluate(param, env);
        });
        return results[results.length - 1];
    }

    evaluate_binary_expression(node, env) {
        const op = OP[node.op];
        const left = this.evaluate(node.left, env);
        const right = this.evaluate(node.right, env);

        return op(left, right);
    }

    evaluate_unary_expression(node, env) {
        const op = OP[node.op];

        return op(this.evaluate(node.argument, env));
    }

    evaluate_fornum_statement(node, env) {
        const scope = env.extend();
        const begin = this.evaluate(node.begin, scope);
        const end = this.evaluate(node.end, scope);
        const step = this.evaluate(node.step, scope);

        scope.def(node.id.name, begin);

        for (let i = begin; i < end; i += step) {
            scope.set(node.id.name, i);
            this.evaluate(node.body, scope);
        }
    }

    evaluate_forlist_statement(node, env) {
        const scope = env.extend();
        const left = node.left;
        const right = this.evaluate(node.right, scope);
        for (let i = 0; i < left.length; i++) {
            scope.def(left[i].name, null);
        }

        let j = 0;

        while (true) {
            const iterator = right();
            if (iterator.done) {
                break;
            } else {
                for (let i = 0; i < left.length; i++) {
                    scope.set(left[i].name, iterator.value[i]);
                }
                this.evaluate(node.body, scope);
            }
        }
    }

    evaluate_while_statement(node, env) {
        const scope = env.extend();
        while (true) {
            const cond = this.evaluate(node.cond, scope);
            if (cond) {
                this.evaluate(node.body, scope);
            } else {
                break;
            }
        }
    }

    evaluate_repeat_statement(node, env) {
        const scope = env.extend();
        while (true) {
            this.evaluate(node.body, scope);
            const cond = this.evaluate(node.cond, scope);
            if (cond == true) {
                break;
            }
        }
    }

    evaluate_identifier(node, env) {
        return env.get(node.name);
    }

    evaluate_call_expression(node, env) {
        const callee = this.evaluate(node.callee, env);
        const self = this;

        return callee.apply(null, node.params.map((arg) => {
            return self.evaluate(arg, env);
        }));
    }

    evaluate_if_statement(node, env) {
        let cond = this.evaluate(node.cond, env);
        if (cond) {
            this.evaluate(node.body, env);
            return true
        } else {
            for (let i = 0; i < node.elseif.length; i++) {
                let elseif = node.elseif[i];
                if (this.evaluate(elseif, env)) {
                    return true;
                }
            }
            if (node.else) {
                this.evaluate(node.else, env);
            }
            return false;
        }
    }

    evaluate_member_expression(node, env) {
        let table, value;
        if (node.sep == '.') {
            table = env.get(node.object.name);
            value = node.property.name;
        }

        return table[value];
    }

    evaluate_expression_stat(node, env) {
        return this.evaluate(node.expression, env);
    }

    evaluate_local_stat(node, env) {
        let variables = node.variables;
        let init = node.init;

        for (let i = 0; i < variables.length; i++) {
            let variable = variables[i];
            let value = init[i];

            env.def(variable.name, this.evaluate(value, env));
        }
    }

    evaluate_function_declaration(node, env) {
        const self = this;

        function lambda(...args) {
            let params = node.params;
            let scope = env.extend();
            for (var i = 0; i < params.length; ++i) {
                scope.def(params[i].name, args[i]);
            }

            return self.evaluate(node.body, scope);
        }

        let name;
        if (node.id.type == 'Identifier') {
            name = node.id.name;
        }
        env.def(name, lambda);

        return lambda;
    }
}


module.exports = Interpreter;
