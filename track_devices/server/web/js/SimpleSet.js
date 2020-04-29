function SimpleSet() {
  this.values = [];
}

SimpleSet.prototype.add = function(value) {
  if (this.contains(value))
    return false;

  this.values.push(value);
  return true;
}

SimpleSet.prototype.contains = function(value) {
  return this.values.indexOf(value) > -1;
}

SimpleSet.prototype.addAll = function(values) {
  if (values instanceof Array) {
    var self = this;
    values.forEach(function(value){
      self.add(value);
    });
  }
}

SimpleSet.prototype.remove = function(value) {
  var index = this.values.indexOf(value);
  if (index === -1)
    return null;

  return this.values.splice(index, 1)[0];
}

SimpleSet.prototype.forEach = function() {
  this.values.forEach.apply(this.values, arguments);
}

SimpleSet.prototype.toArray = function() {
  return this.values.slice();
}

SimpleSet.prototype.isEmpty = function() {
  return this.values.length === 0;
}

SimpleSet.prototype.length = function() {
  return this.values.length;
}

SimpleSet.prototype.empty = function() {
  this.values = [];
}
