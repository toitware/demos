var SideNav = function(sideNavSelector, viewportSelector, sideNavShowSelector, sideNavHideSelector) {
  this.sideNavElement = document.querySelector(sideNavSelector);
  this.viewportElement = document.querySelector(viewportSelector);

  // Rebind to secure proper this
  this.show = this.show.bind(this);
  this.hide = this.hide.bind(this);
  this.onTransitionEndSideNav = this.onTransitionEndSideNav.bind(this);
  this.onTransitionEndViewport = this.onTransitionEndViewport.bind(this);

  //Binds to the buttons.
  document.querySelector(sideNavShowSelector).addEventListener('click', this.show);
  document.querySelector(sideNavHideSelector).addEventListener('click', this.hide);
}

SideNav.prototype.show = function() {
  this.sideNavElement.classList.add('animate');
  this.sideNavElement.classList.add('visible');
  this.sideNavElement.addEventListener('transitionend', this.onTransitionEndSideNav);

  this.viewportElement.classList.add('side-nav-animate');
  this.viewportElement.classList.add('side-nav-visible');
  this.viewportElement.addEventListener('transitionend', this.onTransitionEndViewport);
}

SideNav.prototype.hide = function(){
  this.sideNavElement.classList.add('animate');
  this.sideNavElement.classList.remove('visible');
  this.sideNavElement.addEventListener('transitionend', this.onTransitionEndSideNav);

  this.viewportElement.classList.add('side-nav-animate');
  this.viewportElement.classList.remove('side-nav-visible');
  this.viewportElement.addEventListener('transitionend', this.onTransitionEndViewport);
}

SideNav.prototype.onTransitionEndSideNav = function(){
  this.sideNavElement.classList.remove('animate');
  this.sideNavElement.removeEventListener('transitionend', this.onTransitionEndSideNav);
}

SideNav.prototype.onTransitionEndViewport = function() {
  this.viewportElement.classList.remove('side-nav-animate');
  this.viewportElement.removeEventListener('transitionend', this.onTransitionEndViewport);
}
