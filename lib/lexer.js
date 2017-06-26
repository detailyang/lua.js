/*
* @Author: detailyang
* @Date:   2017-06-11 15:26:09
* @Last Modified by:   detailyang
* @Last Modified time: 2017-06-26 15:38:02
*/

'use strict';


const Token = require("./token");


class Lexer {
    constructor(source) {
        this.source = source;
        this.size = source.length;
        this.pos = 0;
        this.column = 1;
        this.line = 1;

        this.keywords = {
            "and": 1,
            "break": 1,
            "do": 1,
            "else": 1,
            "elseif": 1,
            "end": 1,
            "false": 1,
            "for": 1,
            "function": 1,
            "if": 1,
            "in": 1,
            "local" : 1,
            "nil": 1,
            "not": 1,
            "or": 1,
            "repeat": 1,
            "return": 1,
            "then": 1,
            "true": 1,
            "until": 1,
            "while": 1,
        };
    }

    is_digit_or_letter(c) {
        return this.is_digit(c) || this.is_letter(c);
    }

    is_digit(c) {
        return !![1,1,1,1,1,1,1,1,1,1][c];
    }

    is_hex(c) {
        return (/^[0-9a-fA-F]$/).test(c);
    }

    is_letter(c) {
        return (/^[a-zA-Z]$/).test(c);
    }

    lookahead(n, eat) {
        if (eat) {
            this.pos += n;
            return this.source[this.pos];
        }

        return this.source[this.pos + n];
    }

    eat(n) {
        this.pos += n;
    }

    croak() {
        throw new Error(`lexer error at ${this.line}:${this.column}`);
    }

    token(lookahead, type, value) {
        this.pos += lookahead;
        this.column += lookahead;
        return new Token(type, value, this.line, this.column);
    }

    scan_integer() {
        let peek;

        peek = this.lookahead(0);
        if (!is_digit(peek)) {
            return this.croak();
        }

        let sum = 0;
        for (;;) {
            if (is_digit(peek)) {
                sum = sum * 10 + parseInt(peek, 10);
            } else {
                return sum;
            }

            peek = this.lookahead(1, true);
        }
    }

    scan_longstring() {
        let comment = [];

        if (this.lookahead(0) != '[') {
            this.croak();
        }

        let peek = this.lookahead(1, true);
        let term = 0;
        if (peek == '=') {
            term ++;
            for (;;) {
                peek = this.lookahead(1, true);
                if (peek == '=') {
                    term++;
                    continue;
                } else if (peek = '[') {
                    break;
                } else {
                    return this.croak();
                }
            }
        } else if (peek != '[') {
            return this.croak();
        }

        for (;;) {
            peek = this.lookahead(1, true);

            /*
             * try to find ]=*]
             */

            if (peek == ']') {
                let i;
                this.eat(1);
                for (i = 0; i < term; i++) {
                    peek = this.lookahead(i);
                    if (peek == '=') {
                        continue;
                    } else if (peek == undefined) {
                        return this.croak();
                    }
                }

                if (i == term) {
                    peek = this.lookahead(term);
                    if (peek == ']') {
                        this.lookahead(2 + term, true);
                        return comment.join("");
                    } else if (peek == undefined) {
                        return this.croak();
                    }
                }
            } else if (peek == undefined) {
                return this.croak();
            }

            comment.push(peek);
        }
    }

    scan() {
        let identifier, base, string, comment, baes, c, peek, peekpeek;

        for (;;) {
            c = this.lookahead(0);
            peek = this.lookahead(1);
            peekpeek = this.lookahead(2);

            switch (c) {
                case undefined:
                    return this.token(0, Token.EOS, Token.EOS);

                case '\f':
                case '\r':
                case ' ':
                case '\t':
                    this.column++;
                    this.lookahead(1, true);
                    continue;
                case '\n':
                    this.line++;
                    this.column = 0;
                    this.lookahead(1, true);
                    continue;
                case ';':
                    return this.token(1, Token.SEMICOLON, ";");
                case '+':
                    return this.token(1, Token.PLUS, "+");
                case '-':
                    if (peek == '-') {
                        if (peekpeek != '[') {
                            peek = this.lookahead(1, true);
                            comment = [];
                            for (;;) {
                                peek = this.lookahead(1, true);
                                if (peek == '\n' || peek == undefined) {
                                    this.column ++;
                                    return this.token(0, Token.COMMENT, comment.join(""));
                                } else {
                                    comment.push(peek);
                                    continue;
                                }
                            }
                        }

                        this.lookahead(2, true);
                        comment = this.scan_longstring();
                        return this.token(0, Token.COMMENT, comment);
                    }

                    return this.token(1, Token.MINUS, "-");
                case '*':
                    return this.token(1, Token.MUL, "*");
                case '/':
                    return this.token(1, Token.DIV, "/");
                case '%':
                    return this.token(1, Token.MOD, "%");
                case '^':
                    return this.token(1, Token.POW, "%");
                case ',':
                    return this.token(1, Token.COMMA, ",");
                case '(':
                    return this.token(1, Token.LPATTERN, "(");
                case ')':
                    return this.token(1, Token.RPATTERN, ")");
                case '[':
                    if (peek == '[' || peek == '=') {
                        string = this.scan_longstring();
                        return this.token(0, Token.STRING, string);
                    }

                    return this.token(1, Token.LBRACKET, "[");
                case ']':
                    return this.token(1, Token.RBRACKET, "]");
                case '{':
                    return this.token(1, Token.LBRACE, "{");
                case '}':
                    return this.token(1, Token.RBRACE, "}");
                case '=':
                    if (peek == '=') {
                        return this.token(2, Token.EQ, "==");
                    }

                    return this.token(1, Token.ASSIGN, "=");

                case '>':
                    if (peek == '=') {
                        return this.token(2, Token.GE, ">=");
                    }

                    return this.token(1, Token.GT, ">");

                case '<':
                    if (peek == '=') {
                        return this.token(2, Token.LE, "<=");
                    }

                    return this.token(1, Token.LT, "<");

                case '~':
                    if (peek == '=') {
                        return this.token(2, Token.NE, "~=");
                    }

                    return this.croak();

                case '.':
                    if (peek == '.') {
                        if (peekpeek == '.') {
                            return this.token(3, Token.ELLIPSES, "...");
                        }

                        return this.token(2, Token.CONCAT, "..");
                    }

                    return this.croak();

                case '\'':
                    string = [];
                    for (;;) {
                        peek = this.lookahead(1, true);
                        if (peek == c) {
                            return this.token(1, Token.STRING, string.join(""));
                        } else if (peek == undefined){
                            return this.croak();
                        } else {
                            string.push(peek);
                        }
                    }

                case '#':
                    return this.token(1, Token.HASH, "#");

                case '\"':
                    string = [];
                    for (;;) {
                        peek = this.lookahead(1, true);
                        if (peek == c) {
                            return this.token(1, Token.STRING, string.join(""));
                        } else if (peek == undefined){
                            return this.croak();
                        } else {
                            string.push(peek);
                        }
                    }

                default:
                    if (this.is_digit(c)) {
                        let num = 0;

                        if (peek == 'x' || peek == 'X') {
                            this.eat(1);
                            peek = this.lookahead(1);
                            if (!this.is_hex(peek)) {
                                return this.croak();
                            }

                            for (;;) {
                                peek = this.lookahead(1, true);
                                if (this.is_hex(peek)) {
                                    num = 16 * num + parseInt(peek, 16);
                                } else {
                                    return this.token(0, Token.NUMBER, num);
                                }
                            }
                        }

                        for (peek = c;;) {
                            num = 10 * num + parseInt(peek, 10);
                            peek = this.lookahead(1, true);
                            if (this.is_digit(peek)) {
                                continue;
                            } else {
                                break;
                            }
                        }

                        if (peek == '.') {
                            base = 1;
                            for (;;) {
                                peek = this.lookahead(1, true);
                                if (this.is_digit(peek)) {
                                    base = base * 0.1
                                    num = base * parseInt(peek, 10) + num;
                                } else {
                                    break;
                                }
                            }
                        }

                        if (peek == 'E' || peek == 'e') {
                            peek = this.lookahead(1, true);
                            if (peek == '-') {
                                this.eat(1);
                                base = -1;
                            } else if (peek == '+') {
                                this.eat(1);
                                base = +1;
                            } else {
                                base = +1;
                            }

                            let integer = base * this.scan_integer()
                            num = num * Math.pow(10, integer);
                        }

                        return this.token(0, Token.NUMBER, num);
                    }

                    if (this.is_letter(c)) {
                        identifier = [c];
                        for (;;) {
                            peek = this.lookahead(1, true);
                            if (!this.is_digit_or_letter(peek)) {
                                identifier = identifier.join("")
                                if (this.keywords[identifier]) {
                                    return this.token(0, Token.KEYWORD, identifier);
                                }

                                return this.token(0, Token.IDENTIFIER, identifier);
                            } else if (peek == undefined) {
                                return this.croak();
                            } else {
                                identifier.push(peek);
                            }
                        }
                    }

                    return this.croak();
            }
        }
    }
}


module.exports = Lexer;
