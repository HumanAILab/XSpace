import { FlowRouter } from 'meteor/ostrio:flow-router-extra';

// Import needed templates
import '../../ui/home/home.js';
import '../../ui/not-found/not-found.js';
import '../../ui/config/config.js';
import "../../ui/user/user.js";

// Set up all routes in the app
FlowRouter.route('/', {
  name: 'App.home',
  action() {
      this.render('App_home', {});
  },
});

FlowRouter.route('/config', {
    name: 'App.config',
    action() {
        this.render('App_config', {});
    },
});

FlowRouter.route('/user/:_id', {
    name: 'App.user',
    action(params, queryParams) {
        this.render('App_user', params);
    },
});

FlowRouter.notFound = {
  action() {
      this.render('App_not-found', {});
  },
};
