/*
* @Author: detailyang
* @Date:   2017-06-25 22:12:02
* @Last Modified by:   detailyang
* @Last Modified time: 2017-07-10 23:11:30
*/

'use strict';


class Env {
    constructor(parent) {
        this.vars = {};
        this.parent = parent;
    }

    extend() {
        return new Env(this);
    }

    lookup(name) {
        let scope = this;
        while (scope) {
            if (scope.vars.hasOwnProperty(name)) {
                return scope;
            }

            scope = scope.parent;
        }

        return null;
    }

    get(name) {
        let scope = this.lookup(name);
        if (scope) {
            return scope.vars[name];
        }

        throw new Error(`Undefined variable ${name}`);
    }

    set(name, value) {
        let scope = this.lookup(name);
        if (!scope) {
            throw new Error("Undefined variable " + name);
        }

        scope.vars[name] = value;
    }

    def(name, value) {
        return this.vars[name] = value;
    }
}


module.exports = Env;

