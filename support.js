/*
 * American SMB — standalone runtime for the .dc.html pages (adapted from the European SME design runtime).
 * Lets each page render in any browser (e.g. on GitHub Pages) without the
 * Claude Design canvas: parses the <x-dc> template, runs the page's
 * Component class, and supports {{holes}}, <sc-for>, <sc-if>, <dc-import>,
 * event handlers (onClick / onInput / onChange) and setState re-renders.
 */
(function () {
  'use strict';

  // Hide the raw template while we build the real page.
  document.write('<style>x-dc{display:none!important}</style>');

  var VOID = { area: 1, base: 1, br: 1, col: 1, embed: 1, hr: 1, img: 1, input: 1, link: 1, meta: 1, source: 1, track: 1, wbr: 1 };
  var RAW = { style: 1, script: 1 };
  var SVG_NS = 'http://www.w3.org/2000/svg';

  function DCLogic(props) { this.props = props || {}; this.state = {}; }
  DCLogic.prototype.setState = function (patch) {
    var p = typeof patch === 'function' ? patch(this.state, this.props) : patch;
    this.state = Object.assign({}, this.state, p);
    if (this._rerender) this._rerender();
  };
  DCLogic.prototype.forceUpdate = function () { if (this._rerender) this._rerender(); };
  DCLogic.prototype.renderVals = function () { return {}; };
  window.DCLogic = DCLogic;

  var decoder = document.createElement('textarea');
  function decode(s) {
    if (s.indexOf('&') === -1) return s;
    decoder.innerHTML = s;
    return decoder.value;
  }

  // ---------- tiny HTML parser (for well-formed design markup) ----------
  function parseAttrs(src) {
    var attrs = [];
    var re = /([^\s=\/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g, m;
    while ((m = re.exec(src))) {
      var v = m[2] !== undefined ? m[2] : m[3] !== undefined ? m[3] : m[4] !== undefined ? m[4] : '';
      attrs.push([m[1], decode(v)]);
    }
    return attrs;
  }

  function parse(html) {
    var root = { tag: '#root', attrs: [], children: [] };
    var stack = [root];
    var re = /<!--[\s\S]*?-->|<\/([a-zA-Z][\w:-]*)\s*>|<([a-zA-Z][\w:-]*)((?:\s+[^\s=>\/]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?)*)\s*(\/?)>/g;
    var last = 0, m;
    function text(t) { if (t) stack[stack.length - 1].children.push({ text: decode(t) }); }
    while ((m = re.exec(html))) {
      text(html.slice(last, m.index));
      last = re.lastIndex;
      if (m[0].charAt(1) === '!') continue;
      if (m[1]) {
        var close = m[1];
        for (var i = stack.length - 1; i > 0; i--) {
          if (stack[i].tag === close) { stack.length = i; break; }
        }
        continue;
      }
      var node = { tag: m[2], attrs: parseAttrs(m[3] || ''), children: [] };
      stack[stack.length - 1].children.push(node);
      var lower = m[2].toLowerCase();
      if (RAW[lower]) {
        var end = html.indexOf('</' + m[2], last);
        if (end === -1) end = html.length;
        node.raw = html.slice(last, end);
        var gt = html.indexOf('>', end);
        last = re.lastIndex = gt === -1 ? html.length : gt + 1;
        continue;
      }
      if (!m[4] && !VOID[lower]) stack.push(node);
    }
    text(html.slice(last));
    return root.children;
  }

  // ---------- value lookup ----------
  var WHOLE = /^\s*\{\{\s*([^}]+?)\s*\}\}\s*$/;
  function lookup(expr, scope) {
    expr = expr.trim();
    if (expr === 'true') return true;
    if (expr === 'false') return false;
    if (expr === 'null') return null;
    if (/^-?\d+(\.\d+)?$/.test(expr)) return parseFloat(expr);
    if (/^(['"]).*\1$/.test(expr)) return expr.slice(1, -1);
    var parts = expr.split('.'), v = scope;
    for (var i = 0; i < parts.length; i++) {
      if (v == null) return undefined;
      v = v[parts[i]];
    }
    return v;
  }
  function interp(str, scope) {
    return str.replace(/\{\{\s*([^}]+?)\s*\}\}/g, function (_, e) {
      var v = lookup(e, scope);
      return v == null ? '' : String(v);
    });
  }
  function attrValue(raw, scope) {
    var w = WHOLE.exec(raw);
    return w ? lookup(w[1], scope) : interp(raw, scope);
  }

  // ---------- components ----------
  var defs = {};

  function extract(source) {
    var start = source.indexOf('<x-dc>'), end = source.lastIndexOf('</x-dc>');
    var inner = source.slice(start + 6, end);
    var helmet = '';
    var hm = /<helmet>([\s\S]*?)<\/helmet>/.exec(inner);
    if (hm) { helmet = hm[1]; inner = inner.replace(hm[0], ''); }
    var sm = /<script type="text\/x-dc"[^>]*>([\s\S]*?)<\/script>/.exec(source);
    var code = sm ? sm[1] : 'class Component extends DCLogic {}';
    /* eslint-disable no-new-func */
    var Cls = new Function('DCLogic', code + '\n;return Component;')(DCLogic);
    return { helmet: helmet, nodes: parse(inner), Cls: Cls, source: inner };
  }

  function importsIn(text) {
    var names = [], re = /<dc-import\s+name="([\w-]+)"/g, m;
    while ((m = re.exec(text))) if (names.indexOf(m[1]) === -1) names.push(m[1]);
    return names;
  }

  function loadDef(name) {
    if (defs[name]) return defs[name];
    defs[name] = fetch(name + '.dc.html')
      .then(function (r) { return r.text(); })
      .then(function (src) {
        var def = extract(src);
        defs[name] = def;
        // Child component styles (hover states etc.) go into the page once.
        if (def.helmet && /<style/i.test(def.helmet)) {
          var styles = def.helmet.match(/<style[\s\S]*?<\/style>/gi) || [];
          document.head.insertAdjacentHTML('beforeend', styles.join(''));
        }
        return Promise.all(importsIn(def.source).map(loadDef)).then(function () { return def; });
      });
    return defs[name];
  }

  function camel(s) { return s.replace(/-([a-z])/g, function (_, c) { return c.toUpperCase(); }); }

  // ---------- rendering ----------
  function renderNodes(nodes, scope, parent, svg) {
    for (var i = 0; i < nodes.length; i++) renderNode(nodes[i], scope, parent, svg);
  }

  var renderPass = { counts: {}, cache: {}, mounts: [], redraw: null };
  function renderNode(n, scope, parent, svg) {
    if (n.text !== undefined) {
      parent.appendChild(document.createTextNode(interp(n.text, scope)));
      return;
    }
    var tag = n.tag, lower = tag.toLowerCase(), a = {}, k;
    for (k = 0; k < n.attrs.length; k++) a[n.attrs[k][0]] = n.attrs[k][1];

    if (lower === 'sc-for') {
      var list = attrValue(a.list || '', scope) || [];
      var as = a.as || 'item';
      for (var j = 0; j < list.length; j++) {
        var s2 = Object.create(scope);
        s2[as] = list[j];
        s2.$index = j;
        renderNodes(n.children, s2, parent, svg);
      }
      return;
    }
    if (lower === 'sc-if') {
      if (attrValue(a.value || '', scope)) renderNodes(n.children, scope, parent, svg);
      return;
    }
    if (lower === 'dc-import') {
      var def = defs[a.name];
      if (!def || !def.nodes) return;
      var props = {};
      for (k in a) {
        if (k === 'name' || k.indexOf('hint-') === 0) continue;
        props[camel(k)] = attrValue(a[k], scope);
      }
      // Keep one instance per stateful component slot across redraws so it can
      // hold state and run componentDidMount once. Stateless ones (no
      // componentDidMount) are cheap to recreate.
      var inst, slot = a.name + '#' + (renderPass.counts[a.name] = (renderPass.counts[a.name] || 0) + 1);
      if (def.Cls.prototype.componentDidMount) {
        inst = renderPass.cache[slot];
        if (!inst) {
          inst = new def.Cls(props);
          inst._rerender = function () { if (renderPass.redraw) renderPass.redraw(); };
          renderPass.cache[slot] = inst;
          renderPass.mounts.push(inst);
        } else {
          inst.props = props;
        }
      } else {
        inst = new def.Cls(props);
      }
      var host = document.createElement('div');
      host.style.display = 'contents';
      renderNodes(def.nodes, inst.renderVals() || {}, host, false);
      parent.appendChild(host);
      return;
    }
    if (lower === 'helmet') return;

    var isSvg = svg || lower === 'svg';
    var el = isSvg ? document.createElementNS(SVG_NS, tag) : document.createElement(tag);
    var deferredValue, deferredHtml;
    for (k = 0; k < n.attrs.length; k++) {
      var name = n.attrs[k][0], raw = n.attrs[k][1];
      if (/^on[A-Z]/.test(name)) {
        var fn = attrValue(raw, scope);
        if (typeof fn === 'function') {
          var type = name.slice(2).toLowerCase();
          el.addEventListener(type, fn);
          (el.__dcH || (el.__dcH = {}))[type] = fn;
        }
        continue;
      }
      var val = attrValue(raw, scope);
      if (name === 'dc-html') {
        deferredHtml = val == null ? '' : String(val);
        continue;
      }
      if (name === 'value' && (lower === 'input' || lower === 'select' || lower === 'textarea')) {
        deferredValue = val == null ? '' : String(val);
        if (lower === 'input') el.setAttribute('value', deferredValue);
        continue;
      }
      if (val === false || val == null) continue;
      el.setAttribute(name, val === true ? '' : String(val));
    }
    if (n.raw !== undefined) el.textContent = n.raw;
    else if (deferredHtml !== undefined) el.innerHTML = deferredHtml;
    else renderNodes(n.children, scope, el, isSvg && lower !== 'foreignobject');
    if (deferredValue !== undefined) { el.value = deferredValue; el.__dcV = deferredValue; }
    parent.appendChild(el);
  }

  // ---------- in-place DOM update ----------
  function sameKind(a, b) {
    if (a.nodeType !== b.nodeType) return false;
    if (a.nodeType !== 1) return true;
    return a.tagName === b.tagName && a.namespaceURI === b.namespaceURI &&
      (a.getAttribute('id') || '') === (b.getAttribute('id') || '');
  }

  function syncElement(o, n) {
    var i, attr;
    for (i = o.attributes.length - 1; i >= 0; i--) {
      attr = o.attributes[i].name;
      if (!n.hasAttribute(attr)) o.removeAttribute(attr);
    }
    for (i = 0; i < n.attributes.length; i++) {
      attr = n.attributes[i];
      if (o.getAttribute(attr.name) !== attr.value) o.setAttribute(attr.name, attr.value);
    }
    var oh = o.__dcH || {}, nh = n.__dcH || {}, t;
    for (t in oh) o.removeEventListener(t, oh[t]);
    for (t in nh) o.addEventListener(t, nh[t]);
    o.__dcH = n.__dcH;
    morph(o, n);
    if (n.__dcV !== undefined) {
      o.__dcV = n.__dcV;
      if (o.value !== n.__dcV && document.activeElement !== o) o.value = n.__dcV;
      if (o.tagName === 'SELECT' && o.value !== n.__dcV) o.value = n.__dcV;
    }
  }

  function morph(oldParent, newParent) {
    var incoming = Array.prototype.slice.call(newParent.childNodes);
    for (var i = 0; i < incoming.length; i++) {
      var nn = incoming[i], on = oldParent.childNodes[i];
      if (!on) { oldParent.appendChild(nn); continue; }
      if (!sameKind(on, nn)) { oldParent.replaceChild(nn, on); continue; }
      if (on.nodeType === 1) syncElement(on, nn);
      else if (on.nodeValue !== nn.nodeValue) on.nodeValue = nn.nodeValue;
    }
    while (oldParent.childNodes.length > incoming.length) oldParent.removeChild(oldParent.lastChild);
  }

  function mount() {
    var source = document.documentElement.outerHTML;
    fetch(location.pathname, { cache: 'no-cache' })
      .then(function (r) { return r.ok ? r.text() : source; })
      .catch(function () { return source; })
      .then(function (src) {
        var def = extract(src);
        if (def.helmet) document.head.insertAdjacentHTML('beforeend', def.helmet);
        return Promise.all(importsIn(def.source).map(loadDef)).then(function () { return def; });
      })
      .then(function (def) {
        var root = document.createElement('div');
        root.id = 'dc-root';
        document.body.insertBefore(root, document.body.firstChild);
        var inst = new def.Cls({});
        var draw = function () {
          // Build the new tree off-screen, then update the live page in
          // place, so fields being typed in keep their caret and focus.
          var next = document.createElement('div');
          renderPass.counts = {};
          renderNodes(def.nodes, inst.renderVals() || {}, next, false);
          morph(root, next);
          var mounts = renderPass.mounts.splice(0);
          mounts.forEach(function (c) { c.componentDidMount(); });
        };
        renderPass.redraw = draw;
        inst._rerender = draw;
        if (inst.componentWillMount) inst.componentWillMount();
        draw();
        if (inst.componentDidMount) inst.componentDidMount();
        if (location.hash) {
          var target = document.getElementById(location.hash.slice(1));
          if (target) target.scrollIntoView();
        }
      })
      .catch(function (err) {
        document.body.insertAdjacentHTML('afterbegin', '<p style="font:16px sans-serif;padding:24px">This page could not be loaded. (' + String(err) + ')</p>');
      });
  }

  // ---------- sections, icons, tools ----------
  var SECTIONS = {
    funding: { desc: 'SBA loans, grants and credit', label: 'Funding & Grants', color: '#B45309' },
    money: { desc: 'Cash flow, pricing, taxes', label: 'Money & Taxes', color: '#0F7B6C' },
    people: { desc: 'Hiring, payroll, health benefits', label: 'Hiring & Benefits', color: '#C8102E' },
    marketing: { desc: 'Local SEO, social, email, ecommerce', label: 'Marketing & Sales', color: '#8A3FB8' },
    tech: { desc: 'AI, cybersecurity, software', label: 'AI & Tech', color: '#4338CA' },
    growth: { desc: 'Starting, scaling, buying a business', label: 'Start & Grow', color: '#1E4FA8' },
    policy: { desc: 'Tariffs, trade, SBA and federal rules', label: 'Trade & Policy', color: '#0B2552' }
  };
  // Line icons (24px grid, stroke = currentColor), used by menus, tool cards and tool pages.
  var ICONS = {
    funding: '<ellipse cx="12" cy="6.5" rx="7" ry="3"/><path d="M5 6.5v5c0 1.66 3.13 3 7 3s7-1.34 7-3v-5"/><path d="M5 11.5v5c0 1.66 3.13 3 7 3s7-1.34 7-3v-5"/>',
    growth: '<rect x="4" y="13" width="4" height="7" rx="1"/><rect x="10" y="9" width="4" height="11" rx="1"/><rect x="16" y="4" width="4" height="16" rx="1"/><path d="M2.5 21h19"/>',
    money: '<path d="M3 8h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8z"/><path d="M3 8V6.5A2.5 2.5 0 0 1 5.5 4H16v4"/><path d="M16.5 12H21v4h-4.5a2 2 0 0 1 0-4z"/>',
    marketing: '<path d="M14 5v14l-6-4H5a2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2h3l6-4z"/><path d="M18 9.5a3.5 3.5 0 0 1 0 5M8 15l1.5 5"/>',
    people: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M21.5 20a6.5 6.5 0 0 0-4-6"/>',
    tech: '<rect x="5" y="5" width="14" height="14" rx="2.5"/><rect x="9" y="9" width="6" height="6" rx="1"/><path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3"/>',
    policy: '<path d="M12 3l9 5H3l9-5z"/><path d="M5 10.5v7M9.5 10.5v7M14.5 10.5v7M19 10.5v7M3 21h18M4 18.5h16"/>',
    all: '<rect x="4" y="4" width="7" height="7" rx="2"/><rect x="13" y="4" width="7" height="7" rx="2"/><rect x="4" y="13" width="7" height="7" rx="2"/><rect x="13" y="13" width="7" height="7" rx="2"/>',
    news: '<path d="M4 5h13v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5z"/><path d="M17 9h3v10a2 2 0 0 1-2 2M7.5 9h6M7.5 12.5h6M7.5 16h4"/>',
    guide: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5v-15z"/><path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5M8 7.5h8M8 11h5"/>',
    trend: '<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
    pin: '<path d="M12 21s7-6.1 7-11.5A7 7 0 0 0 5 9.5C5 14.9 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4M8 14h2M14 14h2M8 17h2"/>',
    calculator: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15v3M8 18h4"/>',
    check: '<circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.8 2.8L16.5 9.5"/>',
    invoice: '<path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5M9 12h7M9 16h5"/>',
    percent: '<path d="M19 5L5 19"/><circle cx="7" cy="7" r="2.5"/><circle cx="17" cy="17" r="2.5"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
    shield: '<path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6l8-3z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>',
    hire: '<circle cx="10" cy="8" r="3.5"/><path d="M3.5 20a6.5 6.5 0 0 1 13 0M19 8v6M16 11h6"/>',
    ai: '<path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8L12 3z"/><path d="M18 15l.9 2.1L21 18l-2.1.9L18 21l-.9-2.1L15 18l2.1-.9L18 15z"/>',
    leaf: '<path d="M5 19c0-8 5-13 15-14-1 10-6 15-14 15"/><path d="M5 19l7-7"/>',
    grid: '<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>'
  };
  // Soft fill layer drawn under the outline, giving the topic icons a two-tone look.
  var DUO = {
    funding: '<ellipse cx="12" cy="6.5" rx="7" ry="3"/><path d="M5 11.5c0 1.66 3.13 3 7 3s7-1.34 7-3v5c0 1.66-3.13 3-7 3s-7-1.34-7-3z"/>',
    growth: '<rect x="16" y="4" width="4" height="16" rx="1"/><rect x="10" y="9" width="4" height="11" rx="1"/>',
    money: '<path d="M3 8h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8z"/>',
    marketing: '<path d="M14 5v14l-6-4H5a2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2h3l6-4z"/>',
    people: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0z"/>',
    tech: '<rect x="9" y="9" width="6" height="6" rx="1"/><rect x="5" y="5" width="14" height="14" rx="2.5" opacity=".45"/>',
    policy: '<path d="M12 3l9 5H3l9-5z"/><rect x="4" y="18.5" width="16" height="2.5"/>',
    all: '<rect x="4" y="4" width="7" height="7" rx="2"/><rect x="13" y="13" width="7" height="7" rx="2"/>',
    news: '<path d="M4 5h13v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5z"/>',
    guide: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5v-15z"/>',
    pin: '<path d="M12 21s7-6.1 7-11.5A7 7 0 0 0 5 9.5C5 14.9 12 21 12 21z"/>',
    shield: '<path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6l8-3z"/>',
    globe: '<circle cx="12" cy="12" r="9"/>',
    calendar: '<rect x="3" y="5" width="18" height="5"/>',
    hire: '<circle cx="10" cy="8" r="3.5"/>'
  };
  function icon(name, size, width) {
    var duo = DUO[name] ? '<g fill="currentColor" fill-opacity=".22" stroke="none">' + DUO[name] + '</g>' : '';
    return '<svg aria-hidden="true" width="' + (size || 20) + '" height="' + (size || 20) + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' + (width || 1.8) + '" stroke-linecap="round" stroke-linejoin="round" style="display:block">' + duo + (ICONS[name] || ICONS.grid) + '</svg>';
  }
  // Every tool on the site, in one list, so the header menu, homepage and Tools page stay in step.
  var TOOLS = [
    { key: 'funding', menu: 'Federal, state and local programs', group: 'Find & plan', name: 'Grant & Loan Finder', short: 'SBA loans, real grants and state programs, with deadlines', icon: 'search', href: 'FundingFinder.dc.html', tone: '#0B2552' },
    { key: 'calendar', menu: 'Federal and state due dates', group: 'Find & plan', name: 'Tax Deadline Calendar', short: 'Every federal tax date that applies to your business type', icon: 'calendar', href: 'Compliance.dc.html', tone: '#14181D' },
    { key: 'states', menuName: 'State guides', menu: 'Rules and incentives by state', group: 'Find & plan', name: 'State-by-state guides', short: 'Licences, sales tax and incentives in all 50 states', icon: 'pin', href: 'Countries.dc.html', tone: '#0F7B6C', isNew: true },
    { key: 'tariff', menuName: 'Tariff cost calculator', menu: 'Landed cost on imports', group: 'Check & calculate', name: 'Tariff cost calculator', short: 'Estimate the landed cost of what you import', icon: 'globe', href: 'Calculators.dc.html#tariff', tone: '#C8102E', isNew: true },
    { key: 'size', menuName: 'Am I a small business?', menu: 'SBA size standards check', group: 'Check & calculate', name: 'Am I a “small business”?', short: 'Check the SBA size standard for your industry', icon: 'check', href: 'Checkers.dc.html#size', tone: '#8A3FB8' },
    { key: 'calculators', menuName: 'Calculators', menu: 'Pricing, payroll and loan payments', group: 'Check & calculate', name: 'Owner calculators', short: 'Loan payments, price increases and the true cost of an employee', icon: 'calculator', href: 'Calculators.dc.html', tone: '#1E4FA8' }
  ];

  // ---- News desk, trending and helpers ----
  var COUNTRIES = [], BY_CODE = {};
  function dayStart(offset) { var d = new Date(); d.setHours(9, 0, 0, 0); d.setDate(d.getDate() - offset); return d; }
  function hash(str) { var h = 7; for (var i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) % 100003; return h; }
  function at(d, h, m) { var x = new Date(d + 'T00:00:00'); x.setHours(h, m || 0, 0, 0); return x.getTime(); }
  var NEWS = (window.AMSMB_NEWS || []).map(function (r) {
    var t = at(r.date, r.h || 9, r.m || 0), d = new Date(t);
    return { id: r.id, slug: r.id, section: r.section, sectionLabel: SECTIONS[r.section].label, color: SECTIONS[r.section].color, type: 'news', title: r.title, excerpt: r.excerpt, content: r.content || '', at: t, mins: 2,
      author: 'American SMB News Desk', date: d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      time: d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }), href: 'Post.dc.html?news=' + r.id, country: 'us' };
  });
  function dayLabel(t) {
    var a = dayStart(0), d = new Date(t); d.setHours(9, 0, 0, 0);
    var diff = Math.round((a - d) / 86400000);
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    return new Date(t).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  }
  function groupByDay(list) {
    var out = [], cur = null;
    list.forEach(function (n) {
      var l = dayLabel(n.at);
      if (!cur || cur.label !== l) { cur = { label: l, items: [] }; out.push(cur); }
      cur.items.push(n);
    });
    return out;
  }

  var detectPromise = null;
  function validCode(c) { c = (c || '').toLowerCase(); return BY_CODE[c] ? c : null; }
  function detectCountry() { return Promise.resolve(null); }
  function setCountry(code) {
    try { if (code) localStorage.setItem('esme-country', code); else localStorage.removeItem('esme-country'); } catch (e) { /* storage blocked */ }
    detectPromise = Promise.resolve(code ? { code: code, source: 'saved' } : null);
  }
  var postsPromise = null;
  var DEADLINES = [
    { date: '2026-12-31', day: '31', mon: 'Dec', year: '2026', topic: 'Taxes', title: 'Last day to place equipment in service for 2026 deductions', href: 'Post.dc.html?slug=year-end-tax-moves-2026' },
    { date: '2027-01-15', day: '15', mon: 'Jan', year: '2027', topic: 'Taxes', title: 'Fourth-quarter 2026 estimated tax payment due', href: 'Compliance.dc.html' },
    { date: '2027-02-01', day: '1', mon: 'Feb', year: '2027', topic: 'Payroll', title: 'W-2s and 1099-NECs due to workers and the IRS', href: 'Checkers.dc.html#contractors' },
    { date: '2027-03-15', day: '15', mon: 'Mar', year: '2027', topic: 'Taxes', title: 'S-corporation and partnership returns due', href: 'Compliance.dc.html' }
  ];
  var POSTS = (window.AMSMB_POSTS || []).map(function (p) {
    var B = window.AMSMB_BODIES || {};
    if (B[p.slug] && !p.content) p.content = B[p.slug];
    return p;
  });
  var HOME_POSTS = POSTS.filter(function (p) { return !p.isCover; });
  var COVER = window.AMSMB_COVER || null;
  window.ESME = {
    sections: SECTIONS,
    icons: ICONS, icon: icon, tools: TOOLS.filter(function (t) { return !t.hidden; }), deadlines: DEADLINES, upcoming: function (n) { return DEADLINES.filter(function (d) { return new Date(d.date + 'T23:59:59Z').getTime() >= Date.now(); }).slice(0, n); },
    countries: COUNTRIES, country: function (c) { return BY_CODE[(c || '').toLowerCase()] || null; },
    news: NEWS, newsById: function (id) { return NEWS.filter(function (n) { return n.id === id; })[0] || null; },
    newsFor: function (code) { return NEWS.filter(function (n) { return !code || n.country === code; }); },
    groupByDay: groupByDay, dayLabel: dayLabel,
    // Demo ranking: stands in for real view counts until analytics are connected.
    trending: function (code, posts) {
      var pool = NEWS.filter(function (n) { return n.country === code || n.country === 'eu'; }).concat((posts || []).slice(0, 30));
      return pool.map(function (p) { return { p: p, v: hash((code || 'eu') + (p.id || p.slug)) % 900 + (p.type === 'news' ? 400 : 0) }; })
        .sort(function (a, b) { return b.v - a.v; }).slice(0, 5)
        .map(function (x, i) { return { n: String(i + 1), views: x.v.toLocaleString('en-US') + ' reads', post: x.p }; });
    },
    detectCountry: detectCountry, setCountry: setCountry,
    sectionIcon: function (k) { return icon(k, 18); },
    loadPosts: function () { return Promise.resolve(POSTS); },
    homePosts: function () { return Promise.resolve(HOME_POSTS); },
    posts: function () { return POSTS; },
    site: window.AMSMB_SITE || {},
    forms: (window.AMSMB_SITE || {}).forms || {},
    // Loads the Fillout embed script when a form ID is set (Contact, Advertise, Submit story).
    embedForms: function () {
      if (!document.querySelector('[data-fillout-id]:not([data-fillout-id=""])') || document.getElementById('fillout-embed')) return;
      var sc = document.createElement('script'); sc.id = 'fillout-embed'; sc.src = 'https://server.fillout.com/embed/v1/'; sc.async = true; document.body.appendChild(sc);
    },
    page: function () { var P = window.AMSMB_PAGES || {}; var k = new URLSearchParams(location.search).get('p') || 'not-found'; return P[k] || P['not-found']; },
    pageKey: function () { return new URLSearchParams(location.search).get('p') || 'not-found'; },
    // Newsletter: posts to Mailchimp when its form action is set, otherwise opens an email to the team.
    subscribe: function (email) {
      var S = window.AMSMB_SITE || {};
      if (S.mailchimpAction) {
        var f = document.createElement('form'); f.method = 'post'; f.action = S.mailchimpAction; f.target = '_blank';
        var i = document.createElement('input'); i.type = 'hidden'; i.name = 'EMAIL'; i.value = email; f.appendChild(i);
        document.body.appendChild(f); f.submit(); f.remove(); return 'sent';
      }
      location.href = 'mailto:' + (S.email || '') + '?subject=' + encodeURIComponent('Subscribe me to the Main Street Briefing') + '&body=' + encodeURIComponent('Please add ' + email + ' to the Main Street Briefing.');
      return 'mail';
    },
    cover: function () { return COVER; },
    // Take up to n posts matching test, never reusing one already in `used`.
    take: function (posts, test, n, used) {
      var out = [];
      for (var i = 0; i < posts.length && out.length < n; i++) {
        var p = posts[i];
        if (used[p.id] || p.isCover || (test && !test(p))) continue;
        used[p.id] = true;
        out.push(p);
      }
      return out;
    },
    param: function (name) { return new URLSearchParams(location.search).get(name); }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();

