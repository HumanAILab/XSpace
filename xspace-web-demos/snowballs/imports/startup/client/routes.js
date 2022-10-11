import { FlowRouter } from 'meteor/ostrio:flow-router-extra';

// Import needed templates
import '../../ui/home/home.js';
import '../../ui/not-found/not-found.js';

import '../../ui/config/config.js';
import '../../ui/player/player.js';

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

FlowRouter.route('/player/:_id/:_file/', {
  name: 'App.player',
  action(params, queryParams) {
    this.render('App_player', params);
  },
});

FlowRouter.notFound = {
  action() {
    this.render('App_not-found', {});
  },
};
