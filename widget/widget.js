(function() {
  var script = document.currentScript;
  var token = script ? script.getAttribute('data-token') || '' : '';
  var botUrl = script && script.src ? new URL(script.src).origin : '';

  var bubble = document.createElement('div');
  bubble.innerHTML = '\uD83D\uDCAC';
  bubble.style.cssText = 'position:fixed;bottom:20px;right:20px;width:56px;height:56px;background:#ec4899;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:24px;box-shadow:0 4px 12px rgba(0,0,0,0.15);z-index:9999;transition:transform 0.2s;';
  bubble.onmouseenter = function() { bubble.style.transform = 'scale(1.1)'; };
  bubble.onmouseleave = function() { bubble.style.transform = 'scale(1)'; };

  var container = document.createElement('div');
  container.style.cssText = 'position:fixed;bottom:88px;right:20px;width:380px;height:520px;border-radius:16px;overflow:hidden;box-shadow:0 8px 30px rgba(0,0,0,0.2);z-index:9999;display:none;';

  var iframe = document.createElement('iframe');
  iframe.src = botUrl + '/widget/chat?token=' + encodeURIComponent(token);
  iframe.style.cssText = 'width:100%;height:100%;border:none;';
  container.appendChild(iframe);

  var open = false;
  bubble.addEventListener('click', function() {
    open = !open;
    container.style.display = open ? 'block' : 'none';
    bubble.innerHTML = open ? '\u2715' : '\uD83D\uDCAC';
  });

  document.body.appendChild(container);
  document.body.appendChild(bubble);
})();
