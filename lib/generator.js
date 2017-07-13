/*
* @Author: detailyang
* @Date:   2017-06-25 22:12:34
* @Last Modified by:   detailyang
* @Last Modified time: 2017-07-13 23:17:13
*/

'use strict';


class Generator {
    constructor(ast) {
        this.ast = ast;
    }

    to_js() {
        return js(this.ast);

        function js_polyfill() {
           return `

const print = console.log
const ipairs = (table) => {
    let i = 0;
    const keys = Object.keys(table).filter((key) => {
        if (/\\d+/.test(key)) {
            return true;
        }

        return false;
    });

    return () => {
        if (i++ < keys.length) {
            return [keys[i-1], table[keys[i-1]]];
        } else {
            return [undefined, undefined];
        }
    };
}
const pairs = (table) => {
    let i = 0;
    const keys = Object.keys(table).filter((key) => {
        if (/\\d+/.test(key)) {
            return false;
        }

        return true;
    });

    return () => {
        if (i++ < keys.length) {
            return [keys[i-1], table[keys[i-1]]];
        } else {
            return [undefined, undefined];
        }
    };
}
`;
        }

        function js_program(node) {
            return js_polyfill() + js(node.body);
        }

        function js_chunk(node) {
            return node.body.map(js).join("\n");
        }

        function js_local_statement(node) {
            return node.variables.map((variable, i) => {
                return `let ${variable.name} = ${js(node.init[i])}`
            }).join("\n");
        }

        function js_do_statement(node) {
            return `
{

${js(node.body)}

}
`;
        }

        function js_literal(node) {
            /*
                cheating :)
             */

            return JSON.stringify(node.value);
        }

        function js_identifier(node) {
            return node.name;
        }

        function js_call_expression(node) {
            const callee = js(node.callee);
            const params = node.params.map((param) => {
                return js(param);
            }).join(",");
            return `${callee}(${params})`;
        }

        function js_expression_statement(node) {
            return js(node.expression);
        }

        function js_binary_expression(node) {
            return `(${js(node.left)} ${node.op} ${js(node.right)})`;
        }

        function js_unary_map(value) {
            switch(value) {
                case '#-':
                    return '-';
                default:
                    return value;
            }
        }

        function js_unary_expression(node) {
            return `${js_unary_map(node.op)}${js(node.argument)}`;
        }

        function js_break_statement(node) {
            return "break";
        }

        function js_table_expression(node) {
            let list = 0;
            const fields = node.fields.map((field) => {
                if (field.type == 'Recfield') {
                    return `"${js(field.key)}": ${js(field.value)}`;
                } else {
                    return `"${list++}": ${js(field.value)}`;
                }
            }).join(",");
            return `{${fields}}`;
        }

        function js_member_expression(node) {
            return `${js(node.object)}.${js(node.property)}`;
        }

        function js_assign_expression(node) {
            return node.left.map((variable, i) => {
                return `${js(variable)}${node.op}${js(node.right[i])}`;
            }).join("\n");
        }

        function js_fornum_statement(node) {
            return `
            for (let ${js(node.id)} = ${js(node.begin)}; ${js(node.id)} < ${js(node.end)}; ${js(node.id)} += ${js(node.step)}) {
                ${js(node.body)}
            }
`;
        }

        function js_forlist_statement(node) {
            const left = node.left.map((variable, i) => {
                return `let ${js(variable)}=value[${i}]`;
            }).join("\n");

            return `
            for (const iterator = ${js(node.right)};;) {
                let value = iterator();
                if (value[0] == undefined) break

                ${left}
                ${js(node.body)}
            }`
        }

        function js_while_statement(node) {
            return `while(${js(node.cond)}) {
                ${js(node.body)}
            }`;
        }

        function js_repeat_statement(node) {
            return `
                for (;;) {
                    ${js(node.body)}
                    if (${js(node.cond)}) {
                        break
                    }
                }
            `;
        }

        function js_function_declaration(node) {
            const params = node.params.map((param) => {
                return js(param);
            }).join(",");

            return `function ${js(node.id)}(${params}) {
                ${js(node.body)}
            }`;
        }

        function js_return_statement(node) {
            const params = node.params.map((param) => {
                return js(param);
            }).join(",");
            return `return ${params}`;
        }

        function js_if_statement(node) {
            const elseif = node.elseif.map((e) => {
                return `else if (${js(e.cond)}) {
                    ${js(e.body)}
                }`;
            }).join("\n");

            let other = "";
            if (node.else) {
                other = `else {
                    ${js(node.else)}
                }`;
            }


            return `
if (${js(node.cond)}) {
    ${js(node.body)}
}
${elseif}
${other}`;
        }

        function js(node) {
            switch (node.type) {
                case 'Program':
                    return js_program(node);
                case 'Chunk':
                    return js_chunk(node);
                case 'LocalStatement':
                    return js_local_statement(node);
                case 'Literal':
                    return js_literal(node);
                case 'Identifier':
                    return js_identifier(node);
                case 'ExpressionStatement':
                    return js_expression_statement(node);
                case 'CallExpression':
                    return js_call_expression(node);
                case 'BinaryExpression':
                    return js_binary_expression(node);
                case 'UnaryExpression':
                    return js_unary_expression(node);
                case 'DoStatement':
                    return js_do_statement(node);
                case 'BreakStatement':
                    return js_break_statement(node);
                case 'TableExpression':
                    return js_table_expression(node);
                case 'MemberExpression':
                    return js_member_expression(node);
                case 'AssignExpression':
                    return js_assign_expression(node);
                case 'IfStatement':
                    return js_if_statement(node);
                case 'FornumStatement':
                    return js_fornum_statement(node);
                case 'ForlistStatement':
                    return js_forlist_statement(node);
                case 'WhileStatement':
                    return js_while_statement(node);
                case 'RepeatStatement':
                    return js_repeat_statement(node);
                case 'FunctionDeclaration':
                    return js_function_declaration(node);
                case 'ReturnStatement':
                    return js_return_statement(node);
              default:
                throw new Error("Dunno how to generate for " + JSON.stringify(node));
            }
        }
    }
}


module.exports = Generator;
