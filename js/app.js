/*global m */
'use strict';

// module loader helper
var asyncModule = function(name) {
	var path = 'js/controllers/';
    return {
        controller: function() {
            m.startComputation()

            require([path+name], function(module) {
                this.controller = new module.controller()
                this.view = module.view

                m.endComputation()
            }.bind(this))
        },
        view: function(ctrl) {
            return ctrl.view(ctrl.controller)
        }
    }
}
// --

m.route.mode = 'hash';
m.route(document.getElementById('todoapp'), '/', {
	'/': asyncModule('todo'),
	'/:filter': asyncModule('todo')
});
