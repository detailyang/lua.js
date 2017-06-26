/*
* @Author: detailyang
* @Date:   2017-06-25 22:12:16
* @Last Modified by:   detailyang
* @Last Modified time: 2017-06-26 15:38:13
*/

'use strict';

class Token {
    constructor(type, value, line, column) {
        this.type = type;
        this.value = value;
        this.line = line;
        this.column = column;
    }
}


Token.EOS = "EOS";
Token.GT = "GT";
Token.GE = "GE";
Token.LE = "LE";
Token.LT = "LT";
Token.ASSIGN = "ASSIGN";
Token.EQ = "EQ";
Token.ELLIPSES = "ELLIPSES";
Token.CONCAT = "CONCAT";
Token.NUMBER = "NUMBER";
Token.KEYWORD = "KEYWORD";
Token.IDENTIFIER = "IDENTIFIER";
Token.STRING = "STRING";
Token.SEMICOLON = "SEMICOLON";
Token.PLUS = "PLUS";
Token.MINUS = "MINUS";
Token.MUL = "MUL";
Token.DIV = "DIV";
Token.MOD = "MOD";
Token.MOD = "POW";
Token.COMMA = "COMMA";
Token.LPATTERN = "LEFT PATTERN";
Token.RPATTERN = "RIGHT PATTERN";
Token.LBRACKET = "LEFT BRACKET";
Token.RBRACKET = "RIGHT BRACKET";
Token.LBRACE = "LEFT BRACE";
Token.RBRACE = "RIGHT BRACE";
Token.COMMENT = "COMMENT";
Token.HASH = "#";


module.exports = Token;
