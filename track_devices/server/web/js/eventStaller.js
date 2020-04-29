function eventStaller(listener, ms) {
  var timer;
  var lastThis;
  var lastArguments;

  function onDelay() {
    listener.apply(lastThis, lastArguments);
    timer = undefined;
  }

  return function() {
    if (timer)
      clearTimeout(timer);
    lastThis = this;
    lastArguments = arguments;
    timer = setTimeout(onDelay, ms);
  }
}
