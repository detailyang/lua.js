/*
* @Author: detailyang
* @Date:   2017-06-25 22:11:08
* @Last Modified by:   detailyang
* @Last Modified time: 2017-06-26 17:56:11
*/

'use strict';


class AST {
    constructor(visitor) {
        this.visitor = (node) => {
            if (visitor) {
                visitor(node);
            }
            return node;
        };
    }

    chunk(body) {
        return this.visitor({
            body,
            type: 'Chunk',
        })
    }

    block(body) {
        return this.visitor({
            body,
            type: 'Block',
        })
    }

    do_stat(body) {
        return this.visitor({
            body,
            type: 'DoStatement',
        });
    }

    break_stat() {
        return this.visitor({
            type: 'BreakStatement',
        });
    }

    return_stat(params) {
        return this.visitor({
            params,
            type: 'ReturnStatement',
        });
    }

    expr_stat(expression) {
        return this.visitor({
            expression,
            type: 'ExpressionStatement',
        });
    }

    func_stat(id, params, body) {
        return this.visitor({
            id,
            params,
            body,
            type: 'FunctionDeclaration',
        });
    }

    local_stat(variables, init) {
        return this.visitor({
            init,
            variables,
            type: 'LocalStatement',
        });
    }

    if_stat(cond, body, elseif, _else) {
        return this.visitor({
            cond,
            body,
            elseif,
            else: _else,
            type: 'IfStatement',
        });
    }

    fornum_stat(id, begin, end, step, body) {
        return this.visitor({
            id,
            begin,
            end,
            step,
            body,
            type: 'FornumStatement',
        });
    }

    forlist_stat(id, left, right, body) {
        return this.visitor({
            id,
            left,
            right,
            body,
            type: 'ForlistStatement',
        });
    }

    while_stat(cond, body) {
        return this.visitor({
            cond,
            body,
            type: 'WhileStatement',
        });
    }

    repeat_stat(cond, body) {
        return this.visitor({
            cond,
            body,
            type: 'RepeatStatement',
        });
    }

    identifier(name) {
        return this.visitor({
            name,
            type: 'Identifier',
        });
    }

    literal(value, raw) {
        return this.visitor({
            value,
            raw,
            type: 'Literal',
        })
    }

    unary_expr(op, argument) {
        return this.visitor({
            op,
            argument,
            type: 'UnaryExpression',
        });
    }

    binary_expr(op, left, right) {
        return this.visitor({
            op,
            left,
            right,
            type: 'BinaryExpression',
        });
    }

    call_expr(callee, params) {
        return this.visitor({
            callee,
            params,
            type: 'CallExpression',
        });
    }

    member_expr(object, sep, property) {
        return this.visitor({
            object,
            sep,
            property,
            type: 'MemberExpression',
        });
    }

    assign_expr(op, left, right) {
        return this.visitor({
            op,
            left,
            right,
            type: 'AssignExpression',
        });
    }

    table_expr(fields) {
        return this.visitor({
            fields,
            type: 'TableExpression',
        });
    }

    recfield(key, value) {
        return this.visitor({
            key,
            value,
            type: 'Recfield',
        });
    }

    listfield(value) {
        return this.visitor({
            value,
            type: 'Listfield',
        });
    }

    comment(value) {
        return this.visitor({
            value,
            type: 'Comment'
        })
    }
}


module.exports = AST;
