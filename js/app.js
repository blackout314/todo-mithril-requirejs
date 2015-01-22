/*global m */
'use strict';

// module loader helper
var asyncModule = function(name) {
    return {
        controller: function() {
            m.startComputation()

            require(['js/controllers/'+name], function(module) {
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
