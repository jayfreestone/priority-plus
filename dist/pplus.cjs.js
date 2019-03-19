'use strict';

var El;
(function (El) {
    El["Wrapper"] = "wrapper";
    El["PrimaryNavWrapper"] = "primary-nav-wrapper";
    El["PrimaryNav"] = "primary-nav";
    El["OverflowNav"] = "overflow-nav";
    El["ToggleBtn"] = "toggle-btn";
    El["NavItems"] = "nav-item";
})(El || (El = {}));
function eventTarget() {
    var port1 = new MessageChannel().port1;
    return {
        dispatchEvent: port1.dispatchEvent.bind(port1),
        addEventListener: port1.addEventListener.bind(port1)
    };
}
function pplus(targetElem, options) {
    var _a, _b, _c;
    var eventChannel = eventTarget();
    var el = {
        primary: (_a = {},
            _a[El.Wrapper] = undefined,
            _a[El.PrimaryNav] = undefined,
            _a[El.NavItems] = undefined,
            _a[El.OverflowNav] = undefined,
            _a[El.ToggleBtn] = undefined,
            _a),
        clone: (_b = {},
            _b[El.Wrapper] = undefined,
            _b[El.NavItems] = undefined,
            _b[El.ToggleBtn] = undefined,
            _b)
    };
    var classNames = (_c = {},
        _c[El.Wrapper] = ['p-plus'],
        _c[El.PrimaryNavWrapper] = ['p-plus__primary-wrapper'],
        _c[El.PrimaryNav] = ['p-plus__primary'],
        _c[El.OverflowNav] = ['p-plus__overflow'],
        _c[El.ToggleBtn] = ['p-plus__toggle-btn'],
        _c);
    var getElemMirror = (function () {
        var cache = new Map();
        return function getMirror(keyArr, valueArr) {
            if (!cache.get(keyArr)) {
                cache.set(keyArr, new Map(Array.from(keyArr).reduce(function (acc, item, i) { return (acc.concat([[item, valueArr[i]]])); }, [])));
            }
            return cache.get(keyArr);
        };
    })();
    function cn(key) {
        return classNames[key].join(' ');
    }
    function dv(key) {
        return "data-" + key;
    }
    function createMarkup() {
        return "\n      <div " + dv(El.Wrapper) + " class=\"" + cn(El.Wrapper) + "\">\n        <div class=\"" + cn(El.PrimaryNavWrapper) + "\">\n          <" + targetElem.tagName + " \n            " + dv(El.PrimaryNav) + "\n            class=\"" + cn(El.PrimaryNav) + "\"\n          >\n            " + Array.from(targetElem.children).map(function (elem) { return ("<li " + dv(El.NavItems) + ">" + elem.innerHTML + "</li>"); }).join('') + "\n          </" + targetElem.tagName + ">\n        </div>\n        <" + targetElem.tagName + " \n          " + dv(El.OverflowNav) + "\n          class=\"" + cn(El.OverflowNav) + "\"\n        >\n        </" + targetElem.tagName + ">\n        <button\n          " + dv(El.ToggleBtn) + "\n          class=\"" + cn(El.ToggleBtn) + "\"\n        >More</button>\n      <div>\n    ";
    }
    function setupEl() {
        var markup = createMarkup();
        var container = document.createDocumentFragment();
        var original = document.createRange().createContextualFragment(markup);
        var cloned = original.cloneNode(true);
        el.primary[El.Wrapper] = original.querySelector("[" + dv(El.Wrapper) + "]");
        el.primary[El.PrimaryNav] = original.querySelector("[" + dv(El.PrimaryNav) + "]");
        el.primary[El.NavItems] = original.querySelectorAll("[" + dv(El.NavItems) + "]");
        el.primary[El.OverflowNav] = original.querySelector("[" + dv(El.OverflowNav) + "]");
        el.primary[El.ToggleBtn] = original.querySelector("[" + dv(El.ToggleBtn) + "]");
        el.primary[El.ToggleBtn].style.display = 'none';
        el.clone[El.Wrapper] = cloned.querySelector("[" + dv(El.Wrapper) + "]");
        el.clone[El.NavItems] = Array.from(cloned.querySelectorAll("[" + dv(El.NavItems) + "]"));
        el.clone[El.ToggleBtn] = cloned.querySelector("[" + dv(El.ToggleBtn) + "]");
        container.appendChild(original);
        container.appendChild(cloned);
        targetElem.parentNode.replaceChild(container, targetElem);
    }
    function onIntersect(_a) {
        var target = _a.target, intersectionRatio = _a.intersectionRatio;
        var targetElem = getElemMirror(el.clone[El.NavItems], el.primary[El.NavItems]).get(target);
        var navToPopulate = intersectionRatio < 1 ? El.OverflowNav : El.PrimaryNav;
        if (!targetElem)
            return;
        targetElem.remove();
        el.primary[navToPopulate].appendChild(targetElem);
        updateBtnDisplay();
    }
    function updateBtnDisplay() {
        [el.primary[El.ToggleBtn], el.clone[El.ToggleBtn]].forEach(function (btn) {
            btn.style.display = el.primary[El.OverflowNav].children.length > 0 ? 'block' : 'none';
        });
    }
    function intersectionCallback(e) {
        e.forEach(onIntersect);
        eventChannel.dispatchEvent(new CustomEvent('intersect'));
    }
    function bindListeners() {
        var observer = new IntersectionObserver(intersectionCallback, {
            root: el.clone[El.Wrapper],
            rootMargin: '0px 0px 0px 0px',
            threshold: [0, 1]
        });
        el.clone[El.NavItems].forEach(function (elem) { return observer.observe(elem); });
    }
    function on(eventType, cb) {
        return eventChannel.addEventListener(eventType, cb);
    }
    (function init() {
        setupEl();
        bindListeners();
        eventChannel.dispatchEvent(new CustomEvent('init'));
    }());
    return {
        on: on
    };
}

module.exports = pplus;
