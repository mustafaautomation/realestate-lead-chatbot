(function () {
  var script = document.currentScript || document.querySelector("script[src*='widget.js']");
  var origin = script && script.src ? new URL(script.src, window.location.href).origin : window.location.origin;
  var title = (script && script.getAttribute("data-title")) || "Ask Summit Ridge";
  var brokerage = (script && script.getAttribute("data-brokerage")) || "summit-ridge";
  var open = false;
  var button = document.createElement("button");
  button.type = "button";
  button.textContent = title;
  button.setAttribute("aria-label", title);
  button.setAttribute("aria-expanded", "false");
  button.setAttribute("aria-controls", "summit-ridge-widget");
  button.style.cssText = "position:fixed;right:16px;bottom:16px;z-index:99999;border:0;border-radius:999px;background:#234236;color:#F6F1E7;padding:12px 16px;font:600 14px/1.2 Georgia,serif;cursor:pointer;";
  var frame = document.createElement("iframe");
  frame.id = "summit-ridge-widget";
  frame.title = title + " chat";
  frame.src = origin + "/embed?brokerage=" + encodeURIComponent(brokerage);
  frame.style.cssText = "position:fixed;right:16px;bottom:68px;z-index:99999;width:min(400px,calc(100vw - 32px));height:min(640px,calc(100vh - 96px));border:0;border-radius:16px;box-shadow:0 16px 40px rgba(0,0,0,.2);display:none;background:#F6F1E7;";
  function setOpen(next) {
    open = next;
    frame.style.display = open ? "block" : "none";
    button.setAttribute("aria-expanded", open ? "true" : "false");
  }
  button.addEventListener("click", function () {
    setOpen(!open);
  });
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && open) {
      setOpen(false);
      button.focus();
    }
  });
  document.body.appendChild(frame);
  document.body.appendChild(button);
})();
