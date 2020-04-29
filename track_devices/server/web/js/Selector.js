function CallCallbacks(self, cbs, argument) {
  cbs.forEach(function(cb) {
    cb.call(self, argument);
  });
}

var Selector = function() {
  function Selector(elementSelector, showAllValue) {
    this.element = document.querySelector(elementSelector);
    this.showAllValue = showAllValue;
    this.element.innerHTML = "<ul></ul>";
    this.listElement = this.element.querySelector('ul')
    this.listElement.addEventListener('click', this._onItemClicked.bind(this), false);
    this.allSelected = true;
    this.selectedValues = new SimpleSet();
    this.values = new SimpleSet();
    this.changesCallbacks = [];
  }

  Selector.prototype._onItemClicked = function(event) {
    if (event.target && event.target.matches('li .checkbox')) {
      this.toggleOnly(event.target.innerText);
    }
  }



  function handleClassChanges(element, value, add) {
    element = element.querySelector('[data-value="'+value+'"]');
    if (element) {
      if (add) {
        element.classList.add('selected');
        element.children[0].classList.add('active');
      } else {
        element.classList.remove('selected');
        element.children[0].classList.remove('active');
      }
    }
  }

  Selector.prototype.showAll = function() {
    this.selectedValues.toArray().forEach( this.toggleOnly.bind(this) );
  }

  Selector.prototype.toggle = function(value) {
    if (value === this.showAllValue) {
      this.showAll();
      return;
    }

    if(!this.values.contains(value))
      return;

    //Update the selected value
    if (this.selectedValues.contains(value)) {
      this.selectedValues.remove(value);
      handleClassChanges(this.listElement, value, false);
    } else {
      this.selectedValues.add(value);
      handleClassChanges(this.listElement, value, true);
    }

    //Update the all selected.
    if (this.selectedValues.isEmpty() && !this.allSelected) {
      this.allSelected = true;
      handleClassChanges(this.listElement, this.showAllValue, true);
    } else if (!this.selectedValues.isEmpty() && this.allSelected) {
      this.allSelected = false;
      handleClassChanges(this.listElement, this.showAllValue, false);
    }
    CallCallbacks(this, this.changesCallbacks, []);
  }

  Selector.prototype.toggleOnly = function(value) {

    if (value === this.showAllValue) {
      this.showAll();
      return;
    }

    if(!this.values.contains(value))
      return;



    //Update the selected value
    var self = this;
    this.selectedValues.forEach(function(el) {
      if (el != value) {
        handleClassChanges(self.listElement, el, false);
      }
    })
    var contains = this.selectedValues.contains(value);
    this.selectedValues.empty();
    if (!contains || this.allSelected) {
      this.selectedValues.add(value);
      handleClassChanges(this.listElement, value, true);
      this.allSelected = false
      handleClassChanges(this.listElement, this.showAllValue, false);
      CallCallbacks(this, this.changesCallbacks, [value]);
    } else {
      handleClassChanges(this.listElement, value, false);
      this.allSelected = true;
      handleClassChanges(this.listElement, this.showAllValue, true);
      CallCallbacks(this, this.changesCallbacks, [this.showAllValue]);
    }
  }

  Selector.prototype.onChanges = function(cb) {
    this.changesCallbacks.push(cb);
  }

  Selector.prototype.updateValues = function(values) {
    this.values.empty();
    this.values.addAll(values);
    var valueSet = this.values;
    var selectedArray = this.selectedValues.toArray();
    var selectedSet = this.selectedValues;
    selectedSet.empty();

    selectedArray.forEach(function(selectedValue){
      if (valueSet.contains(selectedValue))
        selectedSet.add(selectedValue);
    });

    if (!valueSet.isEmpty() && selectedSet.isEmpty())
      this.allSelected = true;
    else
      this.allSelected = false;

    this.render();
  }

  Selector.prototype.hasOneSelected = function(values) {
    for(var i = 0; i < values.length; i++) {
      if (this.isSelected(values[i]))
        return true;
    }
    return false;
  }

  Selector.prototype.hasAllSelected = function(values) {
    for(var i = 0; i < values.length; i++) {
      if (!this.isSelected(values[i]))
        return false;
    }
    return true;
  }

  Selector.prototype.isSelected = function(value) {
    if (!this.values.contains(value))
      return false;

    if (this.allSelected)
      return true;

    return this.selectedValues.contains(value);
  }


  function createListItem(selected, title,all) {
    if (selected)
      return '<li class="selected" data-value="'+title+'"><span class="checkbox active">'+title+'</span></li>';
    else
      return '<li data-value="'+title+'"><span class="checkbox">'+title+'</span></li>';
  }

  Selector.prototype.render = function() {
    var html = "";
    var values = this.values.toArray();
    if (!values.length) {
      this.listElement.innerHTML = "";
      return;
    }

    html += createListItem(this.allSelected, this.showAllValue);

    var self = this;
    values.sort().forEach(function(value) {
      html += createListItem(self.selectedValues.contains(value), value);
    });

    this.listElement.innerHTML = html;
  }

  return Selector;
}();
