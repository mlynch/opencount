
var App = new function() {
  return {
    Refs: {
      RESOURCES_LIST: 'resources',
    },
    initialize: function() {
      this._fdb = new Firebase('http://gamma.firebase.com/opencountmadison/');
      this._resources = this._fdb.child(this.Refs.RESOURCES_LIST);

      // HACK: just use Madison for now
      //this._initMap();

      this._bindEvents();

      this._bindDataEvents();
    },

    _initMapDefault: function() {
      this._map = new google.maps.Map(document.getElementById('map_canvas'), {
        zoom: 8,
        center: new google.maps.LatLng(-34.397, 150.644),
        mapTypeId: google.maps.MapTypeId.ROADMAP
      });
    },
    /*
    _initMap: function() {
      var self = this;

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
          self._map = new google.maps.Map(document.getElementById('map'), {
            zoom: 16,
            center: new google.maps.LatLng(position.coords.latitude, position.coords.longitude),
            mapTypeId: google.maps.MapTypeId.ROADMAP
          });
        }, function(msg) {
          // Pass
          self._initMapDefault();
        }, {
          timeout: 60000
        });
      } else {
        self._initMapDefault();
      }
    },
    */

    _bindEvents: function() {
      var self = this;

      $('#add-form').submit(function() {
        var name = $('#name-new').val();
        var tag = $('#tag-new').val();
        var max = $('#max-new').val();
        var current = $('#count-new').val();
        //var loc = $('#location-new').val();

        $('#errors-add').hide();

        self._addResource(tag, name, max, current);//, loc);

        return false;
      });

      $('#edit-form').submit(function() {
        var tag = $('#tag-edit').val();
        var max = $('#max-edit').val();
        var current = $('#count-edit').val();
        
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

      console.log('Adding new resource', resourceData);


      // Check to see if the resource already exists in firebase, otherwise create it
      this._resources.child(tag).transaction(function(currentEntry) {
        if(currentEntry === null) {
          return resourceData;
        }
      }, function(success) {
        if(!success) {
          $(document).trigger('resource.alreadyExists', resourceData);
        } else {
          $(document).trigger('resource.created', resourceData);
        }
      });
    },

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
          return null;
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

    _dateStr: function(date) {

      return date.getHours() + ':' + date.getMinutes() + ' ' + (date.getMonth() + 1) + '/' + date.getDate() + '/' + date.getYear();
    },

    _addAndRenderResource: function(resourceData) {
      var list = $('#resources');
      var newLi = $('<li data-theme="c"></li>');
      this._renderResource(resourceData, newLi);
      list.append(newLi);
      list.listview('refresh');
    },

    _renderResource: function(resourceData, el) {
      var modifiedDate = this._dateStr(new Date(resourceData.last_modified));
      var addedDate = this._dateStr(new Date(resourceData.added));

      el.html('<a href="#" data-resourcetag="' + resourceData.tag + '" data-transition="slide"><p>' + resourceData.name + '</p><p><strong>Current as of <span class="modified">' + modifiedDate + '</span></strong></p><p>First added ' + addedDate + '</p><span class="ui-li-count count">' + resourceData.count + '</span></a>');
    },

    _updateResourceElement: function(resourceData, el) {
      var modifiedDate = this._dateStr(new Date(resourceData.last_modified));
      $('.modified', el).text(modifiedDate);
      $('.count', el).text(resourceData.count);
    }
  };
};

$(document).ready(function() {
  App.initialize();
});
