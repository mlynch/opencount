
var App = {
  Refs: {
    RESOURCES_LIST: 'resources',
  },
  initialize: function() {
    this._fdb = new Firebase('http://gamma.firebase.com/opencountmadison/');
    this._resources = this._fdb.child(this.Refs.RESOURCES_LIST);

    this._bindEvents();
    this._bindDataEvents();
  },

  // Bind interface events
  _bindEvents: function() {
    var self = this;

    $('#add-form').submit(function() {
      var name = $('#name-new').val();
      var tag = $('#tag-new').val();
      var max = parseInt($('#max-new').val());
      var current = parseInt($('#count-new').val());
      //var loc = $('#location-new').val();
      
      if(max < current) {
        alert('Max slots must be >= current slots');
        return false;
      }

      $('#errors-add').hide();

      self._addResource(tag, name, max, current);//, loc);

      return false;
    });

    $('#edit-form').submit(function() {
      var tag = $('#tag-edit').val();
      var max = parseInt($('#max-edit').val());
      var current = parseInt($('#count-edit').val());

      if(max < current) {
        alert('Max slots must be >= current slots');
        return false;
      }
      
      $('#errors-edit').hide();



      self._editResource(tag, max, current);

      return false;
    });

    $(document).bind('resource.alreadyExists', function(event, resourceData) {
      $('#errors-add').show();
      console.log('Resource already exists!', resourceData);
    });
    
    $(document).bind('resource.created', function(event, resourceData) {
      $('#add-form').get(0).reset();

      $('#success-add').show();
      setTimeout(function() {
        $('#success-add').hide();
      }, 3000);
    });
    
    $(document).bind('resource.edited', function(event, resourceData) {
      $('#edit-form').get(0).reset();

      $('#success-edit').show();
      setTimeout(function() {
        $('#success-edit').hide();
      }, 3000);
    });

    $(document).bind('resource.oneAdded', function(event, resource) {
      self._addAndRenderResource(resource);
    });
    
    $(document).bind('resource.noSuchResource', function(event, resource) {
      $('#errors-edit').show();
    });
  },

  // Bind Firebase data events
  _bindDataEvents: function() {
    var self = this;

    this._resources.on('child_added', function(resourceSnapshot) {
      $(document).trigger('resource.oneAdded', resourceSnapshot.val());
    });

    this._resources.on('child_changed', function(resourceSnapshot) {
      var resource = resourceSnapshot.val();
      var el = $('#resources a[data-resourcetag="' + resource.tag + '"]');
      if(el.length) {
        self._updateResourceElement(resource, el);
      }
    });
  },

  // Add a new resource
  _addResource: function(tag, name, max, count) {
    var self = this, now = new Date();
    var resourceData = {
      tag: tag,
      name: name,
      max: max,
      count: count,
      added: now.getTime(),
      last_modified: now.getTime()
    };

    // Check to see if the resource already exists in firebase, otherwise create it
    this._resources.child(tag).transaction(function(currentEntry) {
      if(currentEntry === null) {
        // Return the data we want Firebase to store
        return resourceData;
      }
      // We'll return undefined if the entry already exists
    }, function(success) {
      if(!success) {
        // Did not create it, it already exists
        $(document).trigger('resource.alreadyExists', resourceData);
      } else {
        // We created it
        $(document).trigger('resource.created', resourceData);
      }
    });
  },

  // Edit a resource
  _editResource: function(tag, max, count) {

    // Check if it exists
    this._resources.child(tag).transaction(function(currentEntry) {
      var now = new Date();
      var newData = {
        count: count,
        last_modified: now.getTime()
      };

      if(currentEntry === null) {
        $(document).trigger('resource.noSuchResource', {
          tag: tag
        });
        return;
      }

      if(count > currentEntry.max) {
        alert('The maximum slots is set at "' + currentEntry.max + '." Change it or reduce the current open slot number if needed.');
        return;
      }

      if(max) {
        newData.max = max;
      }

      return $.extend(currentEntry, newData);
    }, function(success) {
      if(!success) {
      } else {
        $(document).trigger('resource.edited');
      }
    });
  },

  // Simple date formatting function
  _dateStr: function(date) {
    return date.getHours() + ':' + date.getMinutes() + ' ' + (date.getMonth() + 1) + '/' + date.getDate() + '/' + date.getYear();
  },

  // Render a single resource list item and add it to the listview
  _addAndRenderResource: function(resourceData) {
    var list = $('#resources');
    var newLi = $('<li data-theme="c"></li>');
    this._renderResource(resourceData, newLi);
    list.append(newLi);
    list.listview('refresh');
  },

  // Render a single resource list item
  _renderResource: function(resourceData, el) {
    var modifiedDate = this._dateStr(new Date(resourceData.last_modified));
    var addedDate = this._dateStr(new Date(resourceData.added));

    el.html('<div data-resourcetag="' + resourceData.tag + '" data-transition="slide"><h3>' + resourceData.name + '</h3><p><strong>Current as of <span class="modified">' + modifiedDate + '</span></strong></p><p>First added ' + addedDate + '</p><span class="ui-li-count count">' + resourceData.count + '/' + resourceData.max + '</span></div>');
  },

  // Update a single resource item
  _updateResourceElement: function(resourceData, el) {
    var modifiedDate = this._dateStr(new Date(resourceData.last_modified));
    $('.modified', el).text(modifiedDate);
    $('.count', el).text(resourceData.count + '/' + resourceData.max);
  }
};

$('#page1').bind('pageinit', function() {
  App.initialize();
});
