(function () {
  var script = document.currentScript || document.querySelector("script[src*='widget.js']");
  var origin = script && script.src ? new URL(script.src, window.location.href).origin : window.location.origin;
  var title = (script && script.getAttribute("data-title")) || "Ask Summit Ridge";
  var brokerage = (script && script.getAttribute("data-brokerage")) || "summit-ridge";
  var position = (script && script.getAttribute("data-position")) === "left" ? "left" : "right";
  var theme = (script && script.getAttribute("data-theme")) || "system";
  var open = false;
  var side = position === "left" ? "left:16px;right:auto;" : "right:16px;left:auto;";
  var root = document.createElement("div");
  root.style.cssText = "position:fixed;z-index:2147483000;bottom:16px;" + side + "display:flex;flex-direction:column;align-items:" + (position === "left" ? "flex-start" : "flex-end") + ";gap:12px;font-family:Geist,ui-sans-serif,system-ui,sans-serif;";
  var teaser = document.createElement("div");
  teaser.setAttribute("data-testid", "launcher-teaser");
  teaser.textContent = "Want a Highlands showing? I can hold a time today.";
  teaser.style.cssText = "position:relative;max-width:260px;background:#fffcf7;color:#1a2420;border:1px solid #d9d0c2;border-radius:16px;padding:10px 28px 10px 12px;font:500 13px/1.4 Geist,sans-serif;box-shadow:0 8px 24px rgba(15,18,22,.12);display:none;";
  var dismiss = document.createElement("button");
  dismiss.type = "button";
  dismiss.textContent = "×";
  dismiss.setAttribute("aria-label", "Dismiss teaser");
  dismiss.style.cssText = "position:absolute;top:-8px;right:-8px;width:24px;height:24px;border-radius:999px;border:1px solid #d9d0c2;background:#fff;cursor:pointer;";
  teaser.appendChild(dismiss);
  var pills = document.createElement("div");
  pills.style.cssText = "display:flex;flex-direction:column;gap:8px;align-items:" + (position === "left" ? "flex-start" : "flex-end") + ";";
  [["Search listings", "I'm looking for a 3 bed under 650k in Highlands"], ["Book a showing", "Book a showing for SR-2401"]].forEach(function (item) {
    var pill = document.createElement("button");
    pill.type = "button";
    pill.textContent = item[0];
    pill.setAttribute("data-testid", "launcher-nudge");
    pill.style.cssText = "height:36px;padding:0 14px;border-radius:999px;border:1px solid #d9d0c2;background:rgba(255,252,247,.92);color:#1a2420;font:500 13px/1 Geist,sans-serif;cursor:pointer;";
    pill.addEventListener("click", function () {
      setOpen(true);
      frame.contentWindow.postMessage({ type: "summit-ridge:prompt", text: item[1] }, origin);
    });
    pills.appendChild(pill);
  });
  var button = document.createElement("button");
  button.type = "button";
  button.setAttribute("data-testid", "chat-launcher");
  button.setAttribute("aria-label", "Open chat with Summit Ridge desk");
  button.setAttribute("aria-expanded", "false");
  button.setAttribute("aria-controls", "summit-ridge-widget");
  button.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M3.5 16.5 8.2 8.2 12 12.8 16.2 6.8 20.5 16.5" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linejoin="round"/><path d="M4 19h16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/></svg>';
  button.style.cssText = "width:60px;height:60px;border:0;border-radius:999px;background:#2F4A3C;color:#F7F1E6;cursor:pointer;box-shadow:0 8px 24px rgba(47,74,60,.35), inset 0 1px 0 rgba(255,255,255,.25);display:grid;place-items:center;";
  var frame = document.createElement("iframe");
  frame.id = "summit-ridge-widget";
  frame.title = title + " chat";
  frame.src = origin + "/embed?brokerage=" + encodeURIComponent(brokerage);
  frame.style.cssText = "position:fixed;z-index:2147483000;border:0;background:#F7F1E6;display:none;" + (position === "left" ? "left:16px;" : "right:16px;") + "bottom:92px;width:min(400px,calc(100vw - 32px));height:min(680px,calc(100vh - 124px));border-radius:24px;box-shadow:0 18px 50px rgba(15,18,22,.2);";
  function layout() {
    var mobile = window.matchMedia("(max-width: 639px)").matches;
    if (!open) return;
    if (mobile) {
      frame.style.inset = "0";
      frame.style.width = "100dvw";
      frame.style.height = "100dvh";
      frame.style.borderRadius = "0";
      frame.style.bottom = "0";
      button.style.display = "none";
    }
  }
  function setOpen(next) {
    open = next;
    frame.style.display = open ? "block" : "none";
    button.style.display = open && window.matchMedia("(max-width: 639px)").matches ? "none" : "grid";
    button.setAttribute("aria-expanded", open ? "true" : "false");
    button.setAttribute("aria-label", open ? "Close chat" : "Open chat with Summit Ridge desk");
    button.innerHTML = open
      ? '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" fill="none"/></svg>'
      : '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M3.5 16.5 8.2 8.2 12 12.8 16.2 6.8 20.5 16.5" fill="none" stroke="currentColor" stroke-width="1.75"/><path d="M4 19h16" fill="none" stroke="currentColor" stroke-width="1.75"/></svg>';
    pills.style.display = open ? "none" : "flex";
    teaser.style.display = open ? "none" : teaser.style.display;
    if (open) {
      layout();
      if (frame.contentWindow) frame.contentWindow.postMessage({ type: "summit-ridge:theme", theme: theme }, origin);
    }
  }
  button.addEventListener("click", function () { setOpen(!open); });
  dismiss.addEventListener("click", function () {
    teaser.style.display = "none";
    try { localStorage.setItem("summit-ridge-teaser", "off"); } catch { /* private mode */ }
  });
  window.addEventListener("message", function (event) {
    if (!event.data || event.data.type !== "summit-ridge:close") return;
    setOpen(false);
    button.focus();
  });
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && open) {
      setOpen(false);
      button.focus();
    }
  });
  root.appendChild(teaser);
  root.appendChild(pills);
  root.appendChild(button);
  document.body.appendChild(frame);
  document.body.appendChild(root);
  var showTeaser = true;
  try { showTeaser = localStorage.getItem("summit-ridge-teaser") !== "off"; } catch { /* private mode */ }
  window.setTimeout(function () {
    if (showTeaser && !open) teaser.style.display = "block";
  }, 4000);
})();
