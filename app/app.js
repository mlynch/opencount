var App = Backbone.View.extend({
  initialize: function() {
    this.el = $('body');
    this._fdb = new Firebase('http://gamma.firebase.com/codiqa/');
    this._fdb.set('I am now writing data into Firebase LOLZ!');
  },
  render: function() {
  }
});

window.App = new App();
