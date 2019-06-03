!function(e,n){"object"==typeof exports&&"undefined"!=typeof module?module.exports=n():"function"==typeof define&&define.amd?define(n):(e=e||self).pplus=n()}(this,function(){"use strict";var e,n,r,t,a=function(){return(a=Object.assign||function(e){for(var n,r=1,t=arguments.length;r<t;r++)for(var a in n=arguments[r])Object.prototype.hasOwnProperty.call(n,a)&&(e[a]=n[a]);return e}).apply(this,arguments)};function i(e,n){return void 0===n&&(n={}),new CustomEvent(e,{detail:n})}function o(e,n,r){return function(e){return[!(e instanceof Element)&&"Target must be an HTMLElement.",(!e.children||!e.children.length)&&"Target must be the direct parent of the individual nav items."].filter(Boolean)}(e).concat(function(e,n){return Object.keys(e).map(function(e){return n[e]?void 0:"Unrecognised option: "+e}).filter(Boolean)}(n,r))}function l(e,n,r){!function(e){if(e&&e.length)throw new Error("\n- "+e.join("\n- "))}(o(e,n,r))}!function(e){e.Init="init",e.ShowOverflow="showOverflow",e.HideOverflow="hideOverflow",e.ItemsChanged="itemsChanged"}(e||(e={})),function(e){e.Container="container",e.Main="main",e.PrimaryNavWrapper="primary-nav-wrapper",e.PrimaryNav="primary-nav",e.OverflowNav="overflow-nav",e.ToggleBtn="toggle-btn",e.NavItems="nav-item"}(r||(r={})),function(e){e.ButtonVisible="is-showing-toggle",e.OverflowVisible="is-showing-overflow",e.PrimaryHidden="is-hiding-primary"}(t||(t={}));var v={classNames:(n={},n[r.Container]=["p-plus-container"],n[r.Main]=["p-plus"],n[r.PrimaryNavWrapper]=["p-plus__primary-wrapper"],n[r.PrimaryNav]=["p-plus__primary"],n[r.OverflowNav]=["p-plus__overflow"],n[r.ToggleBtn]=["p-plus__toggle-btn"],n),innerToggleTemplate:"More"};return function(n,o){var s,c;void 0===o&&(o={});var u,d,f,m={addEventListener:(u=(new MessageChannel).port1).addEventListener.bind(u),dispatchEvent:u.dispatchEvent.bind(u),removeEventListener:u.removeEventListener.bind(u)},p=new Map,g=a({},v,o,{classNames:a({},v.classNames,o.classNames)}),y=g.classNames,N={clone:(s={},s[r.Main]=void 0,s[r.NavItems]=void 0,s[r.ToggleBtn]=void 0,s),primary:(c={},c[r.Main]=void 0,c[r.PrimaryNav]=void 0,c[r.NavItems]=void 0,c[r.OverflowNav]=void 0,c[r.ToggleBtn]=void 0,c)},h=(d=new Map,function(e,n){return d.get(e)||d.set(e,new Map(Array.from(e).reduce(function(e,r,t){return e.concat([[r,n[t]]])},[]))),d.get(e)});function w(e){return y[e].join(" ")}function M(e){return"data-"+e}function O(e,n){return void 0===n&&(n={}),"string"==typeof e?e:e(n)}function T(){var e,a="\n      <div "+M(r.Main)+' class="'+w(r.Main)+'">\n        <div class="'+w(r.PrimaryNavWrapper)+'">\n          <'+n.tagName+"\n            "+M(r.PrimaryNav)+'\n            class="'+w(r.PrimaryNav)+'"\n          >\n            '+Array.from(n.children).map(function(e){return"<li "+M(r.NavItems)+">"+e.innerHTML+"</li>"}).join("")+"\n          </"+n.tagName+">\n        </div>\n        <button\n          "+M(r.ToggleBtn)+'\n          class="'+w(r.ToggleBtn)+'"\n          aria-expanded="false"\n        >'+O(g.innerToggleTemplate)+"</button>\n        <"+n.tagName+"\n          "+M(r.OverflowNav)+'\n          class="'+w(r.OverflowNav)+'"\n          aria-hidden="true"\n        >\n        </'+n.tagName+">\n      </div>\n    ",i=document.createElement("div");(e=i.classList).add.apply(e,y[r.Container]);var o=document.createRange().createContextualFragment(a),l=o.cloneNode(!0);N.primary[r.Main]=o.querySelector("["+M(r.Main)+"]"),N.primary[r.PrimaryNav]=o.querySelector("["+M(r.PrimaryNav)+"]"),N.primary[r.NavItems]=Array.from(o.querySelectorAll("["+M(r.NavItems)+"]")),N.primary[r.OverflowNav]=o.querySelector("["+M(r.OverflowNav)+"]"),N.primary[r.ToggleBtn]=o.querySelector("["+M(r.ToggleBtn)+"]"),N.clone[r.Main]=l.querySelector("["+M(r.Main)+"]"),N.clone[r.NavItems]=Array.from(l.querySelectorAll("["+M(r.NavItems)+"]")),N.clone[r.ToggleBtn]=l.querySelector("["+M(r.ToggleBtn)+"]"),N.clone[r.Main].setAttribute("aria-hidden","true"),N.clone[r.Main].classList.add(y[r.Main][0]+"--clone"),N.clone[r.Main].classList.add(y[r.Main][0]+"--"+t.ButtonVisible),i.appendChild(o),i.appendChild(l),N.clone[r.NavItems].forEach(function(e){return p.set(e,r.PrimaryNav)}),n.parentNode.replaceChild(i,n)}function b(e){var n=function(e){var n=N.primary[e].cloneNode();return N.clone[r.NavItems].filter(function(n){return p.get(n)===e}).forEach(function(e){n.appendChild(h(N.clone[r.NavItems],N.primary[r.NavItems]).get(e))}),n}(e);N.primary[e].parentNode.replaceChild(n,N.primary[e]),N.primary[e]=n}function E(e){var n=e.target,t=e.intersectionRatio;p.set(n,t<1?r.OverflowNav:r.PrimaryNav)}function C(n){n.forEach(E),[r.PrimaryNav,r.OverflowNav].forEach(b),m.dispatchEvent(function(n){var r=n.overflowCount;return i(e.ItemsChanged,{overflowCount:r})}({overflowCount:N.primary[r.OverflowNav].children.length}))}function I(n){void 0===n&&(n=!0);var a=y[r.Main][0]+"--"+t.OverflowVisible;N.primary[r.Main].classList[n?"add":"remove"](a),N.primary[r.OverflowNav].setAttribute("aria-hidden",n?"false":"true"),N.primary[r.ToggleBtn].setAttribute("aria-expanded",n?"true":"false"),m.dispatchEvent(i(n?e.ShowOverflow:e.HideOverflow))}function B(){var e=y[r.Main][0]+"--"+t.OverflowVisible;I(!N.primary[r.Main].classList.contains(e))}function L(e){e.preventDefault(),B()}function P(e){var n,a=e.detail.overflowCount;void 0===(n=a>0)&&(n=!0),N.primary[r.Main].classList[n?"add":"remove"](y[r.Main][0]+"--"+t.ButtonVisible),"string"!=typeof g.innerToggleTemplate&&[N.primary[r.ToggleBtn],N.clone[r.ToggleBtn]].forEach(function(e){e.innerHTML=O(g.innerToggleTemplate,{toggleCount:N.primary[r.OverflowNav].children.length,totalCount:N.clone[r.NavItems].length})}),0===a&&I(!1),function(e){void 0===e&&(e=!0);var n=y[r.Main][0]+"--"+t.PrimaryHidden;N.primary[r.Main].classList[e?"add":"remove"](n),N.primary[r.PrimaryNav].setAttribute("aria-hidden",String(e))}(a===N.clone[r.NavItems].length)}return l(n,o,v),T(),f=new IntersectionObserver(C,{root:N.clone[r.Main],rootMargin:"0px 0px 0px 0px",threshold:[1]}),N.clone[r.NavItems].forEach(function(e){return f.observe(e)}),N.primary[r.ToggleBtn].addEventListener("click",L),m.addEventListener(e.ItemsChanged,P),m.dispatchEvent(i(e.Init)),{getNavElements:function(){return a({},N.primary)},off:function(e,n){return m.removeEventListener(e,n)},on:function(e,n){return m.addEventListener(e,n)},setOverflowNavOpen:I,toggleOverflowNav:B}}});
