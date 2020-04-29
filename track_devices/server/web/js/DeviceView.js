var DeviceView = function(deviceViewSelector, mainSelector, hideSelector) {
  this.deviceViewElement = document.querySelector(deviceViewSelector);
  this.mainElement = document.querySelector(mainSelector);
  this.deviceIDSpan = this.deviceViewElement.querySelector(".device-info-id");
  this.deviceLocationTable = this.deviceViewElement.querySelector(".device-locations");
  this.deviceTHPTable = this.deviceViewElement.querySelector(".device-thps");
  this.closeCallbacks = [];

  // Rebind to secure proper this
  this.show = this.show.bind(this);
  this.hide = this.hide.bind(this);
  this.onTransitionEndMainView = this.onTransitionEndMainView.bind(this);
  document.querySelector(hideSelector).addEventListener('click', this.hide);
}

DeviceView.prototype.show = function(device) {
  this.mainElement.classList.add('animate');
  this.mainElement.classList.add('show-device');
  this.mainElement.addEventListener('transitionend', this.onTransitionEndMainView);
  this._showDeviceInfo(device);
}

DeviceView.prototype.hide = function(){
  this.mainElement.classList.add('animate');
  this.mainElement.classList.remove('show-device');
  this.mainElement.addEventListener('transitionend', this.onTransitionEndMainView);
  this._clearDeviceInfo();
  CallCallbacks(this, this.closeCallbacks, []);
}

DeviceView.prototype._showDeviceInfo = function(device) {
  this.deviceIDSpan.innerText = device.id;

  var locationHeader = '<tr class="header"><th>Position</th><th class="right">Created At</th></tr>'
  locationBody = device.locations.map(function(l)  {
    return '<tr class="data"><td>'+l.lat+', '+l.lon+'</td><td class="right">'+l.created_at+'</td></tr>'
  }).join("")
  this.deviceLocationTable.innerHTML = locationHeader + locationBody

  var thpHeader = '<tr class="header"><th>Temperature</th><th>Humidity</th><th>Pressure</th><th class="right">Created At</th></tr>'
  thpBody = device.thps.map(function(thp)  {
    return '<tr class="data"><td>'+thp.temperature+'</td><td>'+thp.humidity+'</td><td>'+thp.pressure+'</td><td class="right">'+thp.created_at+'</td></tr>'
  }).join("")
  this.deviceTHPTable.innerHTML = thpHeader + thpBody
}

DeviceView.prototype._clearDeviceInfo = function() {
  this.deviceLocationTable.innerHTML = ""
  this.deviceTHPTable.innerHTML = ""
  this.deviceIDSpan.innerText = ""
}

DeviceView.prototype.onClose = function(fn) {
  this.closeCallbacks.push(fn);
}

DeviceView.prototype.onTransitionEndMainView = function(){
  this.mainElement.classList.remove('animate');
  this.mainElement.removeEventListener('transitionend', this.onTransitionEnddeviceView);
}
