(function() {
  // Prevent duplicate widget instances
  if (document.getElementById('dulcechat-bubble')) return;

  var script = document.currentScript;
  var token = script ? script.getAttribute('data-token') || '' : '';
  // Derive base URL from script src: /dulcechat/widget.js -> /dulcechat
  var botUrl = '';
  if (script && script.src) {
    var u = new URL(script.src);
    botUrl = u.origin + u.pathname.replace(/\/widget\.js$/, '');
  }

  var chatIcon = '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2C6.5 2 2 6.5 2 12c0 2.3.8 4.4 2.1 6.1L3 22l3.9-1.1C8.6 21.8 10.2 22.4 12 22.4c5.5 0 10-4.5 10-10S17.5 2 12 2z"/><path d="M8 12h.01M12 12h.01M16 12h.01"/></svg>';
  var closeIcon = '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';

  var bubble = document.createElement('div');
  bubble.id = 'dulcechat-bubble';
  bubble.innerHTML = chatIcon;
  bubble.style.cssText = 'position:fixed;bottom:80px;right:16px;width:52px;height:52px;background:#ec4899;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,0.15);z-index:9999;transition:transform 0.2s;';
  bubble.onmouseenter = function() { bubble.style.transform = 'scale(1.1)'; };
  bubble.onmouseleave = function() { bubble.style.transform = 'scale(1)'; };

  var container = document.createElement('div');
  var isMobile = window.innerWidth <= 640;
  container.style.cssText = isMobile
    ? 'position:fixed;bottom:5%;left:5%;width:90%;height:85%;border-radius:16px;overflow:hidden;box-shadow:0 8px 30px rgba(0,0,0,0.2);z-index:9999;display:none;'
    : 'position:fixed;bottom:140px;right:16px;width:380px;height:480px;border-radius:16px;overflow:hidden;box-shadow:0 8px 30px rgba(0,0,0,0.2);z-index:9999;display:none;';

  var iframe = document.createElement('iframe');
  iframe.src = botUrl + '/widget/chat?token=' + encodeURIComponent(token);
  iframe.style.cssText = 'width:100%;height:100%;border:none;';
  container.appendChild(iframe);

  var open = false;
  bubble.addEventListener('click', function() {
    open = !open;
    container.style.display = open ? 'block' : 'none';
    bubble.innerHTML = open ? closeIcon : chatIcon;
  });

  document.body.appendChild(container);
  document.body.appendChild(bubble);
})();
