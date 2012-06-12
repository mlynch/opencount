
var App = new function() {
  return {
    Refs: {
      RESOURCES_LIST: 'resources/list',
      RESOURCES_LOOKUP: 'resources/lookup'
    },
    initialize: function() {
      this._fdb = new Firebase('http://gamma.firebase.com/opencountmadison/');
      this._resourcesList = this._fdb.child(this.Refs.RESOURCES_LIST);
      this._resourcesLookup = this._fdb.child(this.Refs.RESOURCES_LOOKUP);

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
        $('#add-form').get(0).reset();

        $('#success-edit').show();
        setTimeout(function() {
          $('#success-edit').hide();
        }, 3000);
      });

      $(document).bind('resource.oneAdded', function(event, resource) {
        self._renderResource(resource);
      });
      
      $(document).bind('resource.noSuchResource', function(event, resource) {
        $('#errors-edit').show();
      });
    },

    _bindDataEvents: function() {
      this._resourcesList.on('child_added', function(resourceSnapshot) {
        $(document).trigger('resource.oneAdded', resourceSnapshot.val());
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
      this._resourcesLookup.child(tag).transaction(function(currentEntry) {
        if(currentEntry === null) {
          return {
            t: 1
          };
        }
      }, function(success) {
        if(!success) {
          $(document).trigger('resource.alreadyExists', resourceData);
        } else {
          // Add it to the list of resources
          self._resourcesList.push(resourceData);

          $(document).trigger('resource.created', resourceData);
        }
      });
    },

    _editResource: function(tag, max, count) {

      // Check if it exists
      this._resourcesLookup.child(tag).transaction(function(currentEntry) {
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
          $(document).trigger('resource.edited', resourceData);
        }
      });
    },

    _renderResource: function(resourceData) {
      var list = $('#resources');

      var modifiedDate = new Date(resourceData.last_modified);

      list.append('<li data-theme="c"><a href="#" data-resourcetag="' + resourceData.tag + '" data-transition="slide">' + resourceData.name + '<span class="ui-li-count">' + resourceData.count + '</span><p class="ui-li-aside"><strong>' + modifiedDate + '</strong>PM</p></a></li>');

      list.listview('refresh');
    }
  };
};

App.initialize();
