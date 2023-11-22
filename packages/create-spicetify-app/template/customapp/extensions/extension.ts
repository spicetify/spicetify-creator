(function main() {
  if (!Spicetify.showNotification) {
    setTimeout(main, 300);
    return;
  }

  // Show message on start.
  Spicetify.showNotification("Hello!");
})();
