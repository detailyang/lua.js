/*
* @Author: detailyang
* @Date:   2017-06-26 11:23:20
* @Last Modified by:   detailyang
* @Last Modified time: 2017-06-26 18:22:51
*/

'use strict';


const Lua = require("./lib");

const code = `
local a = 1
`;
const lexer = new Lua.Lexer(code)
const parser = new Lua.Parser(lexer);

console.log(JSON.stringify(parser.parse()));
