var model = require('model.js')

require('./topics.tag')

module.exports = function(stateRouter) {

	stateRouter.addState({
		name: 'app.topics',
		route: '/topics',
		defaultChild: 'no-task',
 		template: 'topics',
 		resolve: function(data, parameters, cb) {
 			model.getTopics(function(err, topics) {
 				cb(null, {
	 				topics: topics
	 			})
 			})
 		},
 		activate: function(context) {
 			var tag = context.domApi

 			tag.opts.tasksUndone = {}
 			tag.update()

 			tag.setFocusOnAddTopicEdit = function() {
 				process.nextTick(function() {
 					tag.root.querySelector('.new-topic-name').focus()
 				})
 			}

 			function recalculateTasksLeftToDoInTopic(topicId) {
 				model.getTasks(topicId, function(err, tasks) {
	 				var leftToDo =  tasks.reduce(function(toDo, task) {
	 					return toDo + (task.done ? 0 : 1)
	 				}, 0)

	 				tag.opts.tasksUndone[topicId] = leftToDo
	 				tag.update()
 				})
 			}

 			model.on('tasks saved', recalculateTasksLeftToDoInTopic)

 			tag.opts.topics.forEach(function(topic) {
 				recalculateTasksLeftToDoInTopic(topic.id)
 			})

 			tag.addTopic = function addTopic(newTopicName) {
				var newTopic = model.addTopic(newTopicName)
				tag.opts.topics.push(newTopic)
				recalculateTasksLeftToDoInTopic(newTopic.id)
				stateRouter.go('app.topics.tasks', {
					topicId: newTopic.id
				})
 			}

 			context.on('destroy', function() {
 				model.removeListener('tasks saved', recalculateTasksLeftToDoInTopic)
 			})
 		}
	})

	require('./tasks/tasks')(stateRouter)
}
