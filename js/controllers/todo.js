define(function() {

	'use strict';

	// config
	var app = app || {};
	app.ENTER_KEY = 13;
	app.ESC_KEY = 27;




	// Controllers
	app.controller = function () {

		// Todo collection
		this.list = app.storage.get();

		// Update with props
		this.list = this.list.map(function(item) {
			return new app.Todo(item);
		});

		// Temp title placeholder
		this.title = m.prop('');

		// Todo list filter
		this.filter = m.prop(m.route.param('filter') || '');

		this.add = function () {
			var title = this.title().trim();
			if (title) {
				this.list.push(new app.Todo({title: title}));
				app.storage.put(this.list);
			}
			this.title('');
		};

		this.isVisible = function (todo) {
			switch (this.filter()) {
				case 'active':
					return !todo.completed();
				case 'completed':
					return todo.completed();
				default:
					return true;
			}
		};

		this.complete = function (todo) {
			if (todo.completed()) {
				todo.completed(false);
			} else {
				todo.completed(true);
			}
			app.storage.put(this.list);
		};

		this.edit = function (todo) {
			todo.previousTitle = todo.title();
			todo.editing(true);
		};

		this.doneEditing = function (todo, index) {
			todo.editing(false);
			todo.title(todo.title().trim());
			if (!todo.title()) {
				this.list.splice(index, 1);
			}
			app.storage.put(this.list);
		};

		this.cancelEditing = function (todo) {
			todo.title(todo.previousTitle);
			todo.editing(false);
		};

		this.clearTitle = function () {
			this.title('');
		};

		this.remove = function (key) {
			this.list.splice(key, 1);
			app.storage.put(this.list);
		};

		this.clearCompleted = function () {
			for (var i = this.list.length - 1; i >= 0; i--) {
				if (this.list[i].completed()) {
					this.list.splice(i, 1);
				}
			}
			app.storage.put(this.list);
		};

		this.amountCompleted = function () {
			var amount = 0;
			for (var i = 0; i < this.list.length; i++) {
				if (this.list[i].completed()) {
					amount++;
				}
			}
			return amount;
		};

		this.allCompleted = function () {
			for (var i = 0; i < this.list.length; i++) {
				if (!this.list[i].completed()) {
					return false;
				}
			}
			return true;
		};

		this.completeAll = function () {
			var allCompleted = this.allCompleted();
			for (var i = 0; i < this.list.length; i++) {
				this.list[i].completed(!allCompleted);
			}
			app.storage.put(this.list);
		};
	};




	// Models --
	var STORAGE_ID = 'todos-mithril';
	app.storage = {
		get: function () {
			return JSON.parse(localStorage.getItem(STORAGE_ID) || '[]');
		},
		put: function (todos) {
			localStorage.setItem(STORAGE_ID, JSON.stringify(todos));
		}
	};
	// Todo Model
	app.Todo = function (data) {
		this.title = m.prop(data.title);
		this.completed = m.prop(data.completed || false);
		this.editing = m.prop(data.editing || false);
	};




	// Views
	app.footer = function (ctrl) {
		var amountCompleted = ctrl.amountCompleted();
		var amountActive = ctrl.list.length - amountCompleted;

		return m('footer#footer', [
			m('span#todo-count', [
				m('strong', amountActive), ' item' + (amountActive !== 1 ? 's' : '') + ' left'
			]),
			m('ul#filters', [
				m('li', [
					m('a[href=/]', {
						config: m.route,
						class: ctrl.filter() === '' ? 'selected' : ''
					}, 'All')
				]),
				m('li', [
					m('a[href=/active]', {
						config: m.route,
						class: ctrl.filter() === 'active' ? 'selected' : ''
					}, 'Active')
				]),
				m('li', [
					m('a[href=/completed]', {
						config: m.route,
						class: ctrl.filter() === 'completed' ? 'selected' : ''
					}, 'Completed')
				])
			]), ctrl.amountCompleted() === 0 ? '' : m('button#clear-completed', {
				onclick: ctrl.clearCompleted.bind(ctrl)
			}, 'Clear completed (' + amountCompleted + ')')
		]);
	};

	app.watchInput = function (onenter, onescape) {
		return function (e) {
			if (e.keyCode === app.ENTER_KEY) {
				onenter();
			} else if (e.keyCode === app.ESC_KEY) {
				onescape();
			}
		};
	};

	app.view = (function() {
		var focused = false;

		return function (ctrl) {
			return [
				m('header#header', [
					m('h1', 'todos'), m('input#new-todo[placeholder="What needs to be done?"]', {
						onkeyup: app.watchInput(ctrl.add.bind(ctrl),
							ctrl.clearTitle.bind(ctrl)),
						value: ctrl.title(),
						oninput: m.withAttr('value', ctrl.title),
						config: function (element) {
							if (!focused) {
								element.focus();
								focused = true;
							}
						}
					})
				]),
				m('section#main', {
					style: {
						display: ctrl.list.length ? '' : 'none'
					}
				}, [
					m('input#toggle-all[type=checkbox]', {
						onclick: ctrl.completeAll.bind(ctrl),
						checked: ctrl.allCompleted()
					}),
					m('ul#todo-list', [
						ctrl.list.filter(ctrl.isVisible.bind(ctrl)).map(function (task, index) {
							return m('li', { class: (function () {
								var classes = '';
								classes += task.completed() ? 'completed' : '';
								classes += task.editing() ? ' editing' : '';
								return classes;
							})()
							}, [
								m('.view', [
									m('input.toggle[type=checkbox]', {
										onclick: m.withAttr('checked', ctrl.complete.bind(ctrl, task)),
										checked: task.completed()
									}),
									m('label', {
										ondblclick: ctrl.edit.bind(ctrl, task)
									}, task.title()),
									m('button.destroy', {
										onclick: ctrl.remove.bind(ctrl, index)
									})
								]), m('input.edit', {
									value: task.title(),
									onkeyup: app.watchInput(ctrl.doneEditing.bind(ctrl, task, index),
										ctrl.cancelEditing.bind(ctrl, task)),
									oninput: m.withAttr('value', task.title),
									config: function (element) {
										if (task.editing()) {
											element.focus();
											element.selectionStart = element.value.length;
										}
									},
									onblur: ctrl.doneEditing.bind(ctrl, task, index)
								})
							]);
						})
					])
				]), ctrl.list.length === 0 ? '' : app.footer(ctrl)
			];
		}
	})();




// --
    return app
})
