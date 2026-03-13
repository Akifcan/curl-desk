export function sidebarHtml(): string {
  return `
<div class="top-section">
  <button class="open-btn" onclick="openPanel()">Open Curl Desk</button>
</div>

<div class="quick-section">
  <div class="qr-url-bar">
    <select class="qr-method" id="qr-method" onchange="qrState.method = this.value; this.style.color = METHOD_COLORS[this.value] || '#abb2bf'">
      <option value="GET">GET</option>
      <option value="POST">POST</option>
      <option value="PUT">PUT</option>
      <option value="DELETE">DELETE</option>
      <option value="PATCH">PATCH</option>
      <option value="HEAD">HEAD</option>
      <option value="OPTIONS">OPTIONS</option>
    </select>
    <div class="qr-url-wrap">
      <div class="qr-url-mirror" id="qr-url-mirror"></div>
      <input class="qr-url" id="qr-url" type="text" placeholder="URL"
        oninput="qrState.url = this.value; updateUrlHighlight()"
        onscroll="document.getElementById('qr-url-mirror').scrollLeft = this.scrollLeft"
        onkeydown="if(event.key==='Enter') sendQuickRequest()" />
    </div>
    <button class="qr-send" id="qr-send-btn" onclick="sendQuickRequest()" title="Send">&#9654;</button>
  </div>
  <div class="qr-tabs">
    <button class="qr-tab active" id="qrtab-headers" onclick="switchQrTab('headers')">Headers</button>
    <button class="qr-tab" id="qrtab-body" onclick="switchQrTab('body')">Body</button>
    <button class="qr-tab" id="qrtab-auth" onclick="switchQrTab('auth')">Auth</button>
  </div>
  <div class="qr-tab-content" id="qr-tab-content"></div>
  <div class="qr-resize-handle" id="qr-resize-handle"></div>
  <div class="qr-response" id="qr-response"></div>
</div>

<div class="tabs">
  <button class="tab active" id="tab-collections" onclick="switchTab('collections')">Collections</button>
  <button class="tab" id="tab-history" onclick="switchTab('history')">History</button>
</div>

<div class="search-box">
  <input class="search-input" type="text" placeholder="Search..." oninput="handleSearch(this.value)" />
</div>

<div class="list" id="list-content">
  <div class="empty">Loading...</div>
</div>
`;
}
