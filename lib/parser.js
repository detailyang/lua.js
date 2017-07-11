/*
* @Author: detailyang
* @Date:   2017-06-25 21:13:19
* @Last Modified by:   detailyang
* @Last Modified time: 2017-07-11 22:20:22
*/

'use strict';


const AST = require("./ast");
const Token = require("./token");


const OP = {
    "or":   {prec:1, left:1, binary:1},
    "and":  {prec:2, left:1, binary:1},
    "<":    {prec:3, left:1, binary:1}, ">":  {prec: 3, left:1, binary:1}, "<=": {prec:3, left:1, binary:1}, ">=": {prec:3, left:1, binary:1}, "==":   {prec:3, left:1, binary:1}, "~=": {prec:3, left:1, binary:1},
    "..":   {prec:4, left:0, binary:1},
    "+":    {prec:5, left:1, binary:1}, "-":  {prec:5, left:1, binary:1},
    "*":    {prec:6, left:1, binary:1}, "/":  {prec:6, left:1, binary:1}, "%": {prec:4, left:1, binary:1},
    "not":  {prec:7, left:1, binary:0}, "#":  {prec:7, left:1, binary:0}, "u-": {prec:7, left:1, binary:0},
    "^":    {prec:8, left:0, binary:1},
};


class Parser {
    constructor(lexer, visitor) {
        this.lexer = lexer;
        this.cur_token = null;
        this.ast = new AST((node) => {
            if (visitor) {
                visitor(node);
            }
            return node;
        });
        this.location = [];
    }

    croak(msg) {
        throw new SyntaxError(msg);
    }

    next() {
        let token = this.cur_token;
        this.cur_token = this.lexer.scan()

        return token;
    }

    match(t, v) {
        if (t) {
            if (v) {
                if (this.cur_token.type == t && this.cur_token.val == v) {
                    let cur_token = this.cur_token;
                    this.next();

                    return cur_token;

                }
            }

            if (this.cur_token.type == t) {
                let cur_token = this.cur_token;
                this.next();

                return cur_token;
            }
        }

        this.croak();
    }

    consume(t, v) {
        if (t) {
            if (v) {
                if (this.cur_token.type == t && this.cur_token.value == v) {
                    let cur_token = this.cur_token;
                    this.next();

                    return cur_token;
                }
            }

            if (this.cur_token.type == t) {
                let cur_token = this.cur_token;
                this.next();

                return cur_token;
            }
        }

        return this.cur_token;
    }

    anchor() {
        this.location.push({
            line: this.cur_token.line,
            column: this.cur_token.column
        });
    }

    parse() {
        this.next();
        this.anchor();
        return this.ast.program(this.parse_chunk());
    }

    parse_chunk() {
        /*
            chunk       ::=   {<stat> [`;`]}
         */

        let stats = [];

        while (!this.is_block_follow()) {
            if (this.cur_token.value == 'return') {
                stats.push(this.parse_stat());
                this.consume(Token.SEMICOLON);
                break;
            }

            let stat = this.parse_stat();
            this.consume(Token.SEMICOLON);
            stats.push(stat);
        }

        return this.ast.chunk(stats);
    }

    parse_block() {
        /*
            block ::= chunk
         */

        return this.parse_chunk();
    }

    parse_stat() {
        /*
            stat        ::=   <do_stat>
                          |   <break_stat>
                          |   <return_stat>
                          |   <expr_stat>
                          |   <func_stat>
                          |   <local_stat>
                          |   <if_stat>
                          |   <for_stat>
                          |   <while_stat>
                          |   <repeat_stat>
         */

        switch(this.cur_token.value) {
            case 'do':
                return this.parse_do_stat();
            case 'break':
                return this.parse_break_stat();
            case 'return':
                return this.parse_return_stat();
            case 'function':
                return this.parse_func_stat();
            case 'local':
                return this.parse_local_stat();
            case 'if':
                return this.parse_if_stat();
            case 'for':
                return this.parse_for_stat();
            case 'while':
                return this.parse_while_stat();
            case 'repeat':
                return this.parse_repeat_stat();
            default:
                return this.parse_expr_stat();
        }
    }

    parse_do_stat() {
        /*
            do_stat     ::=  `do` <block> `end`
         */

        this.match(Token.KEYWORD, 'do');
        let do_stat = this.ast.block(this.parse_block());
        this.match(Token.KEYWORD, 'end');

        return do_stat;
    }

    parse_break_stat() {
        /*
            break_stat  ::=  `break`
         */

        this.match(Token.KEYWORD, "break");

        return this.ast.break_stat();
    }

    parse_return_stat() {
        /*
            return_stat  ::=  `return` <explist>
         */

        this.next();
        const explist = this.parse_explist1()

        return this.ast.return_stat(explist);
    }

    parse_func_stat() {
        /*
            func_stat   ::= `function` <funcname> '(' <parlist> ')' <blcok> 'end'
        */

        this.match(Token.KEYWORD, 'function');
        let id = this.parse_funcname();
        this.match(Token.LPATTERN);
        let params = this.parse_parlist();
        this.match(Token.RPATTERN);
        let body = this.parse_block();
        this.match(Token.KEYWORD, 'end');

        return this.ast.func_stat(id, params, body);
    }

    parse_parlist() {
        /*
            parlist     ::= [<param> {',' <param>}]
         */

        let parlist = [];

        if (this.is_param()) {
            parlist.push(this.parse_param());

            while (this.cur_token.value == ',') {
                this.next();
                parlist.push(this.parse_param());
            }
        }

        return parlist;
    }

    parse_param() {
        /*
            param       ::= <NAME>
         */
        return this.parse_name();
    }

    parse_funcname() {
        /*
            funcname    ::= <NAME> {'.' <NAME>} [':' <NAME>]
         */

        let funcname = this.parse_name();

        while (this.cur_token.value == '.') {
            this.next();
            funcname = this.ast.member_expr(funcname, '.', this.parse_name());
        }

        if (this.cur_token.value == ':') {
            this.next();
            funcname = this.ast.member_expr(funcname, ':', this.parse_name());
        }

        return funcname;
    }

    parse_local_stat() {
        /*
            local_stat  ::= `local` <NAME> {',' <NAME>} ['=' <explist1>]
                          | `local` `function` <NAME> '(' <parlist> ')' <blcok> 'end'
         */

        this.match(Token.KEYWORD, "local");
        if (this.cur_token.value == "function") {
            this.next();
            let id = this.parse_name();
            this.match(Token.LPATTERN);
            let params = this.parse_parlist();
            this.match(Token.RPATTERN);
            let block = this.parse_block();
            this.match(Token.KEYWORD, "end");

            return this.ast.call_expr(id, params, block);
        } else {
            let variables = [];
            let init = [];
            variables.push(this.parse_name())

            while(this.cur_token.value == ',') {
                this.next();
                variables.push(this.parse_name())
            }

            if (this.cur_token.value == '=') {
                this.next();
                init = this.parse_explist1();
            }

            return this.ast.local_stat(variables, init);
        }
    }

    parse_if_stat() {
        /*
            if_stat     ::= `if` <cond> `then` <block> {`elseif` <cond> `then` <block>} [`else` <block>] `end`
            <cond>      ::= <expr>
         */

        this.match(Token.KEYWORD, "if");
        let cond = this.parse_cond();
        this.match(Token.KEYWORD, "then");
        let block = this.parse_block();
        let elseif = [];
        let _else = null;

        while (this.cur_token.value == 'elseif') {
            this.next();
            let elsecond = this.parse_cond();
            this.match(Token.KEYWORD, "then");
            let elseblock = this.parse_block();

            elseif.push(this.ast.if_stat(elsecond, elseblock, []));
        }

        if (this.cur_token.value == 'else') {
            this.next();
            _else =  this.parse_block();
        }

        this.match(Token.KEYWORD, "end");

        return this.ast.if_stat(cond, block, elseif, _else);
    }

    parse_cond() {
        /*
            cond ::= <expr>
         */

        return this.parse_expr();
    }

    parse_for_stat() {
        /*
            for_stat    ::= <fornum> | <forlist>
            fornum      ::= <NAME> {',' <NAME>} 'in' <explist1> <forbody> 'end'
            forlist     ::= <NAME> '=' <exp1>, <exp1> [',' <exp1>] <forbody> 'end'
         */

        this.match(Token.KEYWORD, "for");

        let name = this.parse_name();
        if (this.cur_token.value == '=') {
            this.next();
            let begin = this.parse_exp1();
            this.match(Token.COMMA, ",");
            let end = this.parse_exp1();
            let step = this.ast.literal(1);
            if (this.cur_token.value == ',') {
                this.next();
                step = this.parse_exp1();
            }

            let body = this.parse_forbody();
            this.match(Token.KEYWORD, "end");
            return this.ast.fornum_stat(name, begin, end, step, body);

        } else {
            let left = [name];
            while (this.cur_token.value == ',') {
                this.next();
                left.push(this.parse_name());
            }
            this.match(Token.KEYWORD, "in");
            let right = this.parse_exp1();
            let body = this.parse_forbody();
            this.match(Token.KEYWORD, "end");
            return this.ast.forlist_stat(name, left, right, body);
        }
    }

    parse_forbody() {
        /*
            forbody     ::= 'do' <block>
         */

        this.match(Token.KEYWORD, "do");
        let block = this.parse_block();

        return block;
    }

    parse_while_stat() {
        /*
            while_stat  ::= `while` <cond> `do` <block> `end`
         */

        this.match(Token.KEYWORD, "while");
        let cond = this.parse_cond();
        this.match(Token.KEYWORD, "do");
        let block = this.parse_block();
        this.match(Token.KEYWORD, "end");

        return this.ast.while_stat(cond, block);
    }

    parse_repeat_stat() {
        /*
            repeat_stat ::= `repeat` <chunk> `until` <cond>
         */

        this.match(Token.KEYWORD, "repeat");
        let body = this.parse_block();
        this.match(Token.KEYWORD, "until");
        let cond = this.parse_cond();

        return this.ast.repeat_stat(cond, body);
    }

    parse_expr_stat() {
        /*
            expr_stat   ::=  <primaryexp> (<func> | <assignment>)
            if LHS is VCALL then func, otherwise assignment
            for func, LHS is VCALL if funcargs in expression
         */

        let primaryexp = this.parse_primaryexp();

        if (primaryexp.type == 'CallExpression') {
            return this.ast.expr_stat(primaryexp);
        } else {
            let assignment  = this.parse_assignment([primaryexp]);
            return this.ast.expr_stat(assignment);
        }
    }

    parse_assignment(primaryexp) {
        /*
            assignment  ::= ',' <primaryexp> <assignment>
                          | '=' <explist1>
         */

        if (this.cur_token.value == '=') {
            this.next();
            let right = this.parse_explist1();
            return this.ast.assign_expr('=', primaryexp, right);
        }

        this.match(Token.COMMA);
        primaryexp.push(this.parse_primaryexp());
        this.parse_assignment(primaryexp);
    }

    parse_explist1() {
        /*
            explist1    ::= <expr> {',' <expr>}
         */

        let exps = [this.parse_expr()];

        while (this.cur_token.value == ',') {
            this.next();
            exps.push(this.parse_expr());
        }

        return exps;
    }

    parse_expr() {
        /*
            expr        ::= <subexpr>
         */

        return this.parse_subexpr();
    }

    parse_subexpr(min_prec) {
        /*
            subexpr     ::= (<unary> <subexpr> | <simpleexp>) {<binary> <subexpr>}
         */

        min_prec = min_prec || 0;

        let expr;

        if (this.is_unary()) {
            let unary = this.parse_unary();
            let argument = this.parse_subexpr();
            expr = this.ast.unary_expr(unary, argument);
        } else {
            expr = this.parse_simpleexp();
        }

        while (this.is_binary() && OP[this.cur_token.value].prec >= min_prec) {
            let token = this.next();
            let op = OP[token.value];
            let next_prec;

            if (op.left) {
                next_prec = op.prec + 1;
            } else {
                next_prec = op.prec;
            }

            let right = this.parse_subexpr(next_prec);
            expr = this.ast.binary_expr(token.value, expr, right);
        }

        return expr;
    }

    parse_simpleexp() {
        /*
            simpleexp   ::= NUMBER
                          | STRING
                          | NIL
                          | TRUE
                          | FALSE
                          | ...
                          | <constructor>
                          | 'function' '(' <parlist> ')' <blcok> 'end'
                          | <primaryexp>
         */

        if (this.cur_token.type == Token.NUMBER
            || this.cur_token.type == Token.STRING) {
            let cur_token = this.next();
            return this.ast.literal(cur_token.value);
        } else if (this.cur_token.type == Token.KEYWORD){
            switch(this.cur_token.value) {
                case 'nil':
                    this.next();
                    return this.ast.literal(null);
                case 'true':
                    this.next();
                    return this.ast.literal(true);
                case 'false':
                    this.next();
                    return this.ast.literal(false);
                case '...':
                    this.next();
                    return this.ast.literal('...');
                case 'function':
                    const token = this.cur_token;
                    const name = this.ast.literal(`${token.line}:${token.column}`);
                    this.next();
                    this.match(Token.LPATTERN);
                    let params = this.parse_parlist();
                    this.match(Token.RPATTERN);
                    let block = this.parse_block();
                    this.match(Token.KEYWORD, "end");

                    return this.ast.func_stat(name, params, block);
                default:
                    this.croak();
            }
        } else if (this.cur_token.value == '{') {
            return this.parse_constructor();
        } else {
            return this.parse_primaryexp();
        }
    }

    parse_primaryexp() {
        /*
            primaryexp  ::= <prefixexp> {'.' <NAME> | '[' <expr> ']'  | ':' <NAME> <funcargs> | <funcargs> }
         */

        let prefixexp = this.parse_prefixexp();
        let property;

         while (true) {
            switch(this.cur_token.value) {
                case '.':
                    this.next();
                    property = this.parse_name();
                    prefixexp = this.ast.member_expr(prefixexp, ".", property);
                    break;
                case '[':
                    this.next();
                    property = this.parse_expr();
                    prefixexp = this.ast.member_expr(prefixexp, "[", property);
                    this.match(Token.RBRACKET);
                    break;
                case ':':
                    this.next();
                    property = this.parse_expr();
                    prefixexp = this.ast.member_expr(prefixexp, ":", property);
                    let params = this.parse_funcargs();
                    prefixexp = this.ast.call_expr(prefixexp, params);
                    break;
                default:
                    break;
            }

            if (this.cur_token.value == '('
                || this.cur_token.value == '{'
                || this.cur_token.type == Token.STRING) {

                let params = this.parse_funcargs();
                prefixexp = this.ast.call_expr(prefixexp, params);
                continue;
            }

            return prefixexp;
        }
    }

    parse_funcargs() {
        /*
            funcargs    ::= '(' [<explist1>] ')'
                          | constructor
                          | STRING
         */

        let params = [];

        if (this.cur_token.value == '(') {
            this.next();
            if (this.cur_token.value != ')') {
                params = this.parse_explist1();
            }
            this.match(Token.RPATTERN);

            return params;
        } else if (this.cur_token.type == Token.STRING) {
            return this.ast.literal(this.cur_token.value);
        } else {
            return this.parse_constructor();
        }
    }

    parse_constructor() {
        /*
            constructor ::=  '{' [<field> {<fieldsep> <field>} [<fieldsep>] ] '}'
         */

        let fields = [];

        this.match(Token.LBRACE);
        if (this.cur_token.value != '}') {
            fields.push(this.parse_field());

            while (this.is_fieldsep()) {
                this.parse_fieldsep();
                fields.push(this.parse_field());
            }

            if (this.is_fieldsep()) {
                this.parse_fieldsep();
            }
        }

        this.match(Token.RBRACE);

        return this.ast.table_expr(fields);
    }

    parse_fieldsep() {
        /*
            fieldsep    ::= ','
                          | ';'
         */

        if (this.cur_token.value == ','
            || this.cur_token.value == ';') {
            let cur_token = this.next();
            return this.ast.literal(cur_token.value);
        }

        this.croak();
    }

    parse_field() {
        /*
            field       ::= <recfield>
                          | <listfield>
         */

        if (this.cur_token.value == '[' || this.cur_token.type == Token.IDENTIFIER) {
            return this.parse_recfield();
        } else {
            return this.parse_listfield();
        }
    }

    parse_recfield() {
        /*
            recfield    ::= ( <NAME> | '[' exp1 ']' ) = exp1
         */

        let key, value

        if (this.cur_token.value == '[') {
            key = this.parse_exp1();
            this.match(Token.RBRACKET);
        } else {
            key = this.parse_name();
        }

        this.match(Token.ASSIGN);

        value = this.parse_exp1();

        return this.ast.recfield(key, value);
    }

    parse_listfield() {
        /*
            listfield   ::= <expr>
        */

        return this.ast.listfield(this.parse_expr());
    }

    parse_prefixexp() {
        /*
            prefixexp   ::= <NAME>
                         | '(' <expr> ')'
         */

        if (this.cur_token.value == '(') {
            this.match(Token.LPATTERN);
            let expr = this.parse_expr();
            this.match(Token.RPATTERN);
            return expr;
        } else {
            return this.parse_name();
        }
    }

    parse_exp1() {
        /*
            exp1        ::= <expr>
         */

        return this.parse_expr();
    }

    parse_unary() {
        /*
            unary ::= '#'
                    | 'not'
                    | '-'
         */

        const token = this.next();

        switch(token.value) {
            case '-':
                return '#-';
            default:
                return token.value;
        }
    }

    parse_name() {
        /*
            name ::= IDENTIFIER
         */

        return this.ast.identifier(this.match(Token.IDENTIFIER).value);
    }

    is_unary() {
        switch(this.cur_token.value) {
            case '#':
            case '-':
            case 'not':
                return true;
            default:
                return false;
        }
    }

    is_fieldsep() {
        switch(this.cur_token.value) {
            case ',':
            case ';':
                return true;
            default:
                return false;
        }
    }

    is_binary() {
        if (OP[this.cur_token.value] && OP[this.cur_token.value].binary) {
            return true;
        } else {
            return false;
        }
    }

    is_param() {
        if (this.cur_token.type == Token.IDENTIFIER) {
            return true;
        }

        return false;
    }

    is_block_follow() {
        switch (this.cur_token.value) {
            case 'else':
            case 'elseif':
            case 'end':
            case 'until':
            case 'EOS':
                return true;
        }

        return false;
    }
}


module.exports = Parser;
