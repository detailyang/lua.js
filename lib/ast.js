/*
* @Author: detailyang
* @Date:   2017-06-25 22:11:08
* @Last Modified by:   detailyang
* @Last Modified time: 2017-06-26 11:19:04
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

    if_stat(cond, body, _else) {
        return this.visitor({
            cond,
            body,
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

    forlist_stat(left, right, body) {
        return this.visitor({
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

    call_expr(callee, params) {
        return this.visitor({
            callee,
            params,
            type: 'CallExpression',
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

    table_expr(nlist, nrec) {
        return this.visitor({
            nlist,
            nrec,
            type: 'TableExpression',
        });
    }
}


module.exports = AST;
