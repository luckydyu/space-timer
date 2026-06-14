(() => {
  function byId(id) {
    return document.getElementById(id);
  }

  function all(selector, root = document) {
    return Array.from(root.querySelectorAll(selector));
  }

  function closest(target, selector) {
    return target.closest(selector);
  }

  window.SpaceTimerDom = {
    byId,
    all,
    closest
  };
})();
