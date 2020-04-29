var AjaxRequest = (function() {

  function callCallbacks(self, cbs, argument) {
    cbs.forEach(function(cb) {
      cb.call(self, argument);
    });
  }

  function onReadyStateChange() {
    if (this.request.readyState === 4) {
      this.finished = true;
      if (this.request.status === 200)
        callCallbacks(this, this._onSuccessCallbacks, this.request.responseText);
      else
        callCallbacks(this, this._onErrorCallbacks, this.request.status);
    }
  }

  function AjaxRequest(method, url) {
    this.request = new XMLHttpRequest();
    this.request.open(method, url, true);
    this.finished = false;
    this.sent = false;
    this.request.onreadystatechange = onReadyStateChange.bind(this);
    this._onErrorCallbacks = [];
    this._onSuccessCallbacks = [];
  }

  AjaxRequest.prototype.send = function(params) {
    if (this.sent)
      return;
    this.sent = true;
    this.request.send(params);
  }

  AjaxRequest.prototype.cancel = function() {
    if (this.finished || !this.sent)
      return;
    this.request.abort();
    this.finished = true;
  }

  AjaxRequest.prototype.onSuccess = function(cb) {
    if (typeof cb === "function")
      this._onSuccessCallbacks.push(cb);
    return this;
  }

  AjaxRequest.prototype.onError = function(cb) {
    if (typeof cb === "function")
      this._onErrorCallbacks.push(cb);
    return this;
  }

  return AjaxRequest;
})();
