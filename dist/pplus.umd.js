(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = global || self, global.pplus = factory());
}(this, function () { 'use strict';

  function eventTarget() {
      var port1 = new MessageChannel().port1;
      return {
          dispatchEvent: port1.dispatchEvent.bind(port1),
          addEventListener: port1.addEventListener.bind(port1)
      };
  }
  //# sourceMappingURL=eventTarget.js.map

  var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

  function createCommonjsModule(fn, module) {
  	return module = { exports: {} }, fn(module, module.exports), module.exports;
  }

  var umd = createCommonjsModule(function (module, exports) {
  (function (global, factory) {
  	module.exports = factory();
  }(commonjsGlobal, (function () {
  var isMergeableObject = function isMergeableObject(value) {
  	return isNonNullObject(value)
  		&& !isSpecial(value)
  };

  function isNonNullObject(value) {
  	return !!value && typeof value === 'object'
  }

  function isSpecial(value) {
  	var stringValue = Object.prototype.toString.call(value);

  	return stringValue === '[object RegExp]'
  		|| stringValue === '[object Date]'
  		|| isReactElement(value)
  }

  // see https://github.com/facebook/react/blob/b5ac963fb791d1298e7f396236383bc955f916c1/src/isomorphic/classic/element/ReactElement.js#L21-L25
  var canUseSymbol = typeof Symbol === 'function' && Symbol.for;
  var REACT_ELEMENT_TYPE = canUseSymbol ? Symbol.for('react.element') : 0xeac7;

  function isReactElement(value) {
  	return value.$$typeof === REACT_ELEMENT_TYPE
  }

  function emptyTarget(val) {
  	return Array.isArray(val) ? [] : {}
  }

  function cloneUnlessOtherwiseSpecified(value, options) {
  	return (options.clone !== false && options.isMergeableObject(value))
  		? deepmerge(emptyTarget(value), value, options)
  		: value
  }

  function defaultArrayMerge(target, source, options) {
  	return target.concat(source).map(function(element) {
  		return cloneUnlessOtherwiseSpecified(element, options)
  	})
  }

  function getMergeFunction(key, options) {
  	if (!options.customMerge) {
  		return deepmerge
  	}
  	var customMerge = options.customMerge(key);
  	return typeof customMerge === 'function' ? customMerge : deepmerge
  }

  function mergeObject(target, source, options) {
  	var destination = {};
  	if (options.isMergeableObject(target)) {
  		Object.keys(target).forEach(function(key) {
  			destination[key] = cloneUnlessOtherwiseSpecified(target[key], options);
  		});
  	}
  	Object.keys(source).forEach(function(key) {
  		if (!options.isMergeableObject(source[key]) || !target[key]) {
  			destination[key] = cloneUnlessOtherwiseSpecified(source[key], options);
  		} else {
  			destination[key] = getMergeFunction(key, options)(target[key], source[key], options);
  		}
  	});
  	return destination
  }

  function deepmerge(target, source, options) {
  	options = options || {};
  	options.arrayMerge = options.arrayMerge || defaultArrayMerge;
  	options.isMergeableObject = options.isMergeableObject || isMergeableObject;

  	var sourceIsArray = Array.isArray(source);
  	var targetIsArray = Array.isArray(target);
  	var sourceAndTargetTypesMatch = sourceIsArray === targetIsArray;

  	if (!sourceAndTargetTypesMatch) {
  		return cloneUnlessOtherwiseSpecified(source, options)
  	} else if (sourceIsArray) {
  		return options.arrayMerge(target, source, options)
  	} else {
  		return mergeObject(target, source, options)
  	}
  }

  deepmerge.all = function deepmergeAll(array, options) {
  	if (!Array.isArray(array)) {
  		throw new Error('first argument should be an array')
  	}

  	return array.reduce(function(prev, next) {
  		return deepmerge(prev, next, options)
  	}, {})
  };

  var deepmerge_1 = deepmerge;

  return deepmerge_1;

  })));
  });

  var Events;
  (function (Events) {
      Events["Init"] = "init";
      Events["ShowOverflow"] = "showOverflow";
      Events["HideOverflow"] = "hideOverflow";
      Events["ItemsChanged"] = "itemsChanged";
  })(Events || (Events = {}));
  function createEvent(name, payload) {
      if (payload === void 0) { payload = {}; }
      return new CustomEvent(name, {
          detail: payload
      });
  }
  function createShowOverflowEvent() {
      return createEvent(Events.ShowOverflow);
  }
  function createHideOverflowEvent() {
      return createEvent(Events.HideOverflow);
  }
  function createInitEvent() {
      return createEvent(Events.Init);
  }
  function createItemsChangedEvent(_a) {
      var overflowCount = _a.overflowCount;
      return createEvent(Events.ItemsChanged, { overflowCount: overflowCount });
  }
  //# sourceMappingURL=createEvent.js.map

  var El;
  (function (El) {
      El["Wrapper"] = "wrapper";
      El["PrimaryNavWrapper"] = "primary-nav-wrapper";
      El["PrimaryNav"] = "primary-nav";
      El["OverflowNav"] = "overflow-nav";
      El["ToggleBtn"] = "toggle-btn";
      El["NavItems"] = "nav-item";
  })(El || (El = {}));
  var StateModifiers;
  (function (StateModifiers) {
      StateModifiers["ButtonVisible"] = "is-showing-toggle";
      StateModifiers["OverflowVisible"] = "is-showing-overflow";
      StateModifiers["PrimaryHidden"] = "is-hiding-primary";
  })(StateModifiers || (StateModifiers = {}));
  function pplus(targetElem, userOptions) {
      var _a, _b, _c;
      var eventChannel = eventTarget();
      var itemMap = new Map();
      var defaultOptions = {
          innerToggleTemplate: 'More',
          classNames: (_a = {},
              _a[El.Wrapper] = ['p-plus'],
              _a[El.PrimaryNavWrapper] = ['p-plus__primary-wrapper'],
              _a[El.PrimaryNav] = ['p-plus__primary'],
              _a[El.OverflowNav] = ['p-plus__overflow'],
              _a[El.ToggleBtn] = ['p-plus__toggle-btn'],
              _a)
      };
      var options = umd(defaultOptions, userOptions, { arrayMerge: function (_, source) { return source; } });
      var classNames = options.classNames;
      var el = {
          primary: (_b = {},
              _b[El.Wrapper] = undefined,
              _b[El.PrimaryNav] = undefined,
              _b[El.NavItems] = undefined,
              _b[El.OverflowNav] = undefined,
              _b[El.ToggleBtn] = undefined,
              _b),
          clone: (_c = {},
              _c[El.Wrapper] = undefined,
              _c[El.NavItems] = undefined,
              _c[El.ToggleBtn] = undefined,
              _c)
      };
      var getElemMirror = (function () {
          var cache = new Map();
          return function getMirror(keyArr, valueArr) {
              if (!cache.get(keyArr)) {
                  cache.set(keyArr, new Map(Array.from(keyArr).reduce(function (acc, item, i) { return (acc.concat([[item, valueArr[i]]])); }, [])));
              }
              return cache.get(keyArr);
          };
      })();
      function processTemplate(input, args) {
          if (args === void 0) { args = {}; }
          if (typeof input === 'string')
              return input;
          return input(args);
      }
      function cn(key) {
          return classNames[key].join(' ');
      }
      function dv(key) {
          return "data-" + key;
      }
      function createMarkup() {
          return "\n      <div " + dv(El.Wrapper) + " class=\"" + cn(El.Wrapper) + "\">\n        <div class=\"" + cn(El.PrimaryNavWrapper) + "\">\n          <" + targetElem.tagName + "\n            " + dv(El.PrimaryNav) + "\n            class=\"" + cn(El.PrimaryNav) + "\"\n          >\n            " + Array.from(targetElem.children).map(function (elem) { return ("<li " + dv(El.NavItems) + ">" + elem.innerHTML + "</li>"); }).join('') + "\n          </" + targetElem.tagName + ">\n        </div>\n        <button\n          " + dv(El.ToggleBtn) + "\n          class=\"" + cn(El.ToggleBtn) + "\"\n          aria-expanded=\"false\"\n        >" + processTemplate(options.innerToggleTemplate) + "</button>\n        <" + targetElem.tagName + "\n          " + dv(El.OverflowNav) + "\n          class=\"" + cn(El.OverflowNav) + "\"\n          aria-hidden=\"true\"\n        >\n        </" + targetElem.tagName + ">\n      <div>\n    ";
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
          el.clone[El.Wrapper] = cloned.querySelector("[" + dv(El.Wrapper) + "]");
          el.clone[El.NavItems] = Array.from(cloned.querySelectorAll("[" + dv(El.NavItems) + "]"));
          el.clone[El.ToggleBtn] = cloned.querySelector("[" + dv(El.ToggleBtn) + "]");
          el.clone[El.Wrapper].setAttribute('aria-hidden', true);
          el.clone[El.Wrapper].classList.add(classNames[El.Wrapper] + "--clone");
          el.clone[El.Wrapper].classList.add(classNames[El.Wrapper] + "--" + StateModifiers.ButtonVisible);
          container.appendChild(original);
          container.appendChild(cloned);
          // By default every item belongs in the primary nav, since the intersection
          // observer will run on-load anyway.
          el.clone[El.NavItems].forEach(function (item) { return itemMap.set(item, El.PrimaryNav); });
          targetElem.parentNode.replaceChild(container, targetElem);
      }
      function updateBtnDisplay(show) {
          if (show === void 0) { show = true; }
          el.primary[El.Wrapper].classList[show ? 'add' : 'remove'](classNames[El.Wrapper] + "--" + StateModifiers.ButtonVisible);
          if (typeof options.innerToggleTemplate !== 'string') {
              // We need to do it for both, as layout is affected
              [el.primary[El.ToggleBtn], el.clone[El.ToggleBtn]].forEach(function (btn) {
                  btn.innerHTML = processTemplate(options.innerToggleTemplate, {
                      toggleCount: el.primary[El.OverflowNav].children.length,
                      totalCount: el.clone[El.NavItems].length
                  });
              });
          }
      }
      function generateNav(navType) {
          var newNav = el.primary[navType].cloneNode();
          // Always use the clone as the base for our new nav,
          // since the order is canonical and it is never filtered.
          el.clone[El.NavItems]
              .filter(function (item) { return itemMap.get(item) === navType; })
              .forEach(function (item) {
              newNav.appendChild(getElemMirror(el.clone[El.NavItems], el.primary[El.NavItems]).get(item));
          });
          return newNav;
      }
      function updateNav(navType) {
          var newNav = generateNav(navType);
          // Replace the existing nav element in the DOM
          el.primary[navType].parentNode.replaceChild(newNav, el.primary[navType]);
          // Update our reference to it
          el.primary[navType] = newNav;
      }
      // Updates our references
      function onIntersect(_a) {
          var target = _a.target, intersectionRatio = _a.intersectionRatio;
          itemMap.set(target, intersectionRatio < 1 ? El.OverflowNav : El.PrimaryNav);
      }
      function intersectionCallback(events) {
          events.forEach(onIntersect);
          [El.PrimaryNav, El.OverflowNav].forEach(updateNav);
          eventChannel.dispatchEvent(createItemsChangedEvent({
              overflowCount: el.primary[El.OverflowNav].children.length
          }));
      }
      function setOverflowNavOpen(open) {
          if (open === void 0) { open = true; }
          var openClass = classNames[El.Wrapper] + "--" + StateModifiers.OverflowVisible;
          el.primary[El.Wrapper].classList[open ? 'add' : 'remove'](openClass);
          el.primary[El.OverflowNav].setAttribute('aria-hidden', open ? 'false' : 'true');
          el.primary[El.ToggleBtn].setAttribute('aria-expanded', open ? 'true' : 'false');
          eventChannel.dispatchEvent(open ? createShowOverflowEvent() : createHideOverflowEvent());
      }
      function toggleOverflowNav() {
          var openClass = classNames[El.Wrapper] + "--" + StateModifiers.OverflowVisible;
          setOverflowNavOpen(!el.primary[El.Wrapper].classList.contains(openClass));
      }
      function setPrimaryHidden(hidden) {
          if (hidden === void 0) { hidden = true; }
          var hiddenClass = classNames[El.Wrapper] + "--" + StateModifiers.PrimaryHidden;
          el.primary[El.Wrapper].classList[hidden ? 'add' : 'remove'](hiddenClass);
          el.primary[El.PrimaryNav].setAttribute('aria-hidden', hidden);
      }
      function onToggleClick(e) {
          e.preventDefault();
          toggleOverflowNav();
      }
      function onItemsChanged(_a) {
          var overflowCount = _a.detail.overflowCount;
          updateBtnDisplay(overflowCount > 0);
          if (overflowCount === 0) {
              setOverflowNavOpen(false);
          }
          setPrimaryHidden(overflowCount === el.clone[El.NavItems].length);
      }
      function bindListeners() {
          var observer = new IntersectionObserver(intersectionCallback, {
              root: el.clone[El.Wrapper],
              rootMargin: '0px 0px 0px 0px',
              threshold: [1]
          });
          el.clone[El.NavItems].forEach(function (elem) { return observer.observe(elem); });
          el.primary[El.ToggleBtn].addEventListener('click', onToggleClick);
          eventChannel.addEventListener(Events.ItemsChanged, onItemsChanged);
      }
      function on(eventType, cb) {
          return eventChannel.addEventListener(eventType, cb);
      }
      (function init() {
          setupEl();
          bindListeners();
          eventChannel.dispatchEvent(createInitEvent());
      }());
      return {
          on: on
      };
  }
  //# sourceMappingURL=pplus.js.map

  return pplus;

}));
