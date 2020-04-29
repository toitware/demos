var TrackDevices = function() {

  this.sideNav = new SideNav('.side-nav','.viewport','.side-nav-show','.side-nav-hide');
  this.deviceView = new DeviceView("#device-view","#main", ".device-view-hide");
  this.deviceView.onClose(this._onHideDeviceView.bind(this));
  this.loaderElement = document.querySelector('.loader');
  this.centerLocation = {lat: 56.1508469, lng: 10.2128301};
  this.mapElement = document.querySelector('#map');
  this.request;
  this.devices = {};
  this.shownDevice = null;

  this.markerClusterer;
  this.pathPolyline;
  this.pathMarkers = [];
  this.map;

  this.selector = new Selector('.selector', "SHOW ALL");
  this.selector.onChanges(this.showDeviceView.bind(this));
}

TrackDevices.prototype.onMapLoaded = function() {
  this.map = new google.maps.Map(this.mapElement, {
    zoom: 14,
    navigationControl: false,
    mapTypeControl: false,
    streetViewControl: false,
    zoomControl: true,
    scaleControl: true,
    mapTypeId: google.maps.MapTypeId.ROADMAP,
    center: this.centerLocation
  });
  this.map.addListener('bounds_changed', eventStaller(this._onMapBoundsChanged.bind(this), 300));
  this.markerClusterer = new MarkerClusterer(this.map, [], {
    imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m',
    calculator: function(markers, styleCount) {
      return {
        index: 1,
        text: markers.length,
        title: markers.map(function(m) { return m.title }).join("\n"),
      }
    },
  });
  this.pathPolyline = new google.maps.Polyline({
    strokeColor: '#000000',
    strokeOpacity: 1.0,
    strokeWeight: 3
  });

  // extend polyline with getBounds.
  google.maps.Polyline.prototype.getBounds = function() {
    var bounds = new google.maps.LatLngBounds();
    this.getPath().forEach(function(item, index) {
        bounds.extend(new google.maps.LatLng(item.lat(), item.lng()));
    });
    return bounds;
  };
}

TrackDevices.prototype._loading = function(bool) {
  if (bool)
    this.loaderElement.classList.add('active');
  else
    this.loaderElement.classList.remove('active');
}

TrackDevices.prototype._handleRequestError = function(e) {
  this._loading(false);
  console.log("failed to load", arguments);
  this.request = null;
}

TrackDevices.prototype._handleListDevicesRequestSuccess = function(data) {
  this.request = null;
  var devices = JSON.parse(data);
  var self = this;
  devices = devices.map(function(device){
    if (device.location) {
      var marker = new google.maps.Marker({
        position: {lat: device.location.lat, lng: device.location.lon},
        title: device.name || device.id,
      })
      device.mapMarker = marker;
      marker.addListener('click', function() {
        self.selector.toggleOnly(device.id);
      });
    }

    return device;
  });

  this._mergeDevices(devices);
  this._loading(false);
}

TrackDevices.prototype.showDeviceView = function(device_id) {
  if (device_id != this.selector.showAllValue) {
    if (!this.devices[device_id]) {
      return
    }
    this.shownDevice = this.devices[device_id];
    if (this.shownDevice.fully) {
      this._displayDeviceInfo();
    } else {
      this._getDevice(device_id);
    }
  } else {
    this.deviceView.hide();
  }
}

TrackDevices.prototype._showDeviceHistory = function(device) {
  // Remove marks and map
  this._hideViewedDevices();
  var self = this;
  var markers = device.locations.map(function(l) {
    if (l.mapMarker) {
      l.mapMarker.setMap(self.map);
      return l.mapMarker;
    }
    return l.mapMarker = new google.maps.Marker({
      position: {lat: l.lat, lng: l.lon},
      title: l.created_at,
      map: self.map,
    })
  })
  this.markerClusterer.addMarkers(markers);
  this.markerClusterer.setMap(this.map);
  this.pathPolyline.setPath(markers.map(function(m) { return m.position; }));
  this.pathPolyline.setMap(this.map);
  this.map.fitBounds(this.pathPolyline.getBounds());
}

TrackDevices.prototype._hideDeviceHistory = function() {
  this.pathPolyline.setMap(null);
  this.markerClusterer.setMap(null);
  this.markerClusterer.clearMarkers();
  this.pathMarkers.forEach(function(m) {
    m.setMap(null);
  })
}

TrackDevices.prototype._displayDeviceInfo = function() {
  this.deviceView.show(this.shownDevice);
  this._showDeviceHistory(this.shownDevice);
  this._loading(false);
}

TrackDevices.prototype._handleGetReviceRequestSuccess = function(data) {
  this.request = null;
  info = JSON.parse(data);
  this.shownDevice.locations = info.locations;
  this.shownDevice.thps = info.thps;
  this.shownDevice.fully = true;
  this._displayDeviceInfo();
}

TrackDevices.prototype._onHideDeviceView = function() {
  this.shownDevice = null;
  this.selector.toggleOnly(this.selector.showAllValue);
  this._updateDeviceList();
}

TrackDevices.prototype._mergeDevices = function(devices) {
  var ids = Object.keys(this.devices);
  var self = this;
  devices.forEach(function(device) {
    var index = ids.indexOf(device.id);
    device.fully = false
    //If they allready exists just remove their ids and move on.
    if (index > -1) {
      ids.splice(index, 1);
      return;
    }
    self.devices[device.id] = device;
  });

  //Remove all that was not in the new batch.
  var removeMarks = ids.map(function(id) {
    var device = self.devices[id];
    device.mapMarker.setMap(null);
    delete self.devices[id];
    return device.mapMarker;
  });

  this.markerClusterer.removeMarkers(removeMarks, true);
  this._updateSelectorValues();
  this._updateViewedDevices();
}

TrackDevices.prototype._updateSelectorValues = function() {
  this.selector.updateValues(Object.keys(this.devices));
}

TrackDevices.prototype._updateViewedDevices = function() {
  this._hideDeviceHistory();
  for(var id in this.devices) {
    var device = this.devices[id];
    if (device.mapMarker) {
      if (this.selector.isSelected(device.id)) {
        if (!device.mapMarker.getMap()) {
          device.mapMarker.setMap(this.map);
          this.markerClusterer.addMarker(device.mapMarker, true);
        }
      } else {
        device.mapMarker.setMap(null);
        this.markerClusterer.removeMarker(device.mapMarker, true);
      }
    }
  }

  if (!this.markerClusterer.getMap()) {
    this.markerClusterer.setMap(this.map)
  } else {
    this.markerClusterer.repaint();
  }
}

TrackDevices.prototype._hideViewedDevices = function() {
  this.markerClusterer.setMap(null);
  this.markerClusterer.clearMarkers();
  for(var id in this.devices) {
    if (this.devices[id].mapMarker) {
      this.devices[id].mapMarker.setMap(null);
    }
  }
}

TrackDevices.prototype._updateDeviceList = function() {
  this._loading(true);
  if (this.request)
    this.request.cancel();

  var bounds = this.map.getBounds().toUrlValue().split(',');
  var lat_from = bounds[0];
  var lon_from = bounds[1];
  var lat_to = bounds[2];
  var lon_to = bounds[3];
  this.request = new AjaxRequest("GET", "./api/devices?lat_from="+lat_from+"&lat_to="+lat_to+"&lon_from="+lon_from+"&lon_to="+lon_to);
  this.request.onSuccess( this._handleListDevicesRequestSuccess.bind(this) );
  this.request.onError( this._handleRequestError.bind(this) );
  this.request.send();
}

TrackDevices.prototype._getDevice = function(device_id) {
  this._loading(true);
  if (this.request)
    this.request.cancel();

  var bounds = this.map.getBounds().toUrlValue().split(',');
  var lat_from = bounds[0];
  var lon_from = bounds[1];
  var lat_to = bounds[2];
  var lon_to = bounds[3];
  this.request = new AjaxRequest("GET", "./api/devices/"+device_id);
  this.request.onSuccess( this._handleGetReviceRequestSuccess.bind(this) );
  this.request.onError( this._handleRequestError.bind(this) );
  this.request.send();
}


TrackDevices.prototype._onMapBoundsChanged = function() {
  if (!this.shownDevice) {
    this._updateDeviceList();
  }
}
