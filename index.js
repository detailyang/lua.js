/*
* @Author: detailyang
* @Date:   2017-06-26 11:23:20
* @Last Modified by:   detailyang
* @Last Modified time: 2017-07-13 23:11:49
*/

'use strict';


const Lua = require("./lib");

const code = `
do
    local x,y = 1,2
    print(-x, (y+1)*2-5/x)
end

local x = {x = 1, y = 2}
print(x.x+x.x);
x.x = 2;
if x.x + 1 > 1000 then
    print("haha")
elseif x.x + 1 > 2000 then
    print("nini")
elseif x.x + 1 > 30000 then
    print("zzzzz")
else
    print("qqqqqq")
end
for i = 0, 5 do
    print(i)
end
for k,v in pairs(x) do
    print(k, v)
end
local y = {4, 5, 6}
for k, v in ipairs(y) do
    print(k, v)
end

local i = 10
while i > 0 do
    print(i)
    i = i - 1
end

repeat
    i = i - 1
    print(-i)
until i < 0

function foo(a)
    return a * a
end

print(foo(3))
`;
const lexer = new Lua.Lexer(code)
const parser = new Lua.Parser(lexer);
const ast = parser.parse();
const env = new Lua.Env();

env.def("print", (...args) => {
    console.log(...args);
});

/*
    pairs and ipairs is not right completely. And we should implement
    the lua table not js table if we want :)
 */

env.def("pairs", (table) => {
    let i = 0;
    const keys = Object.keys(table).filter((key) => {
        if (/\d+/.test(key)) {
            return false;
        }

        return true;
    });
    return () => {
        if (i++ < keys.length) {
            return {
                value: [keys[i-1], table[keys[i-1]]],
                done: false,
            };
        } else {
            return {
                done: true,
            };
        }
    }
});

env.def("ipairs", (table) => {
    let i = 0;
    const keys = Object.keys(table).filter((key) => {
        if (/\d+/.test(key)) {
            return true;
        }

        return false;
    });

    return () => {
        if (i++ < keys.length) {
            return {
                value: [keys[i-1], table[keys[i-1]]],
                done: false,
            };
        } else {
            return {
                done: true,
            };
        }
    };
});

const generator = new Lua.Generator(ast);
const interpreter = new Lua.Interpreter(ast, env);
interpreter.interprete();
console.log(generator.to_js());
