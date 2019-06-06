# Priority Plus

A modern implementation of the [priority plus](http://bradfrost.com/blog/post/complex-navigation-patterns-for-responsive-design/#priority-plus) navigation pattern.

## What is it

As Brad explains:

> The Priority+ pattern...exposes what’s deemed to be the most important navigation elements and tucks away less important items behind a “more” link. The less important items are revealed when the user clicks the “more” link.

![Diagram overview](docs/img/explanation.png)

This library implements the pattern by fitting as many navigation items as possible into the 'primary' navigation, and then automatically moving the rest into a dropdown. If more space becomes available, the links are gradually re-instated into the primary navigation.

There are already examples of libraries that follow this behaviour, such as [PriorityNav.js](http://gijsroge.github.io/priority-nav.js/). However most of these were written before the advent of modern browser APIs such as the [`IntersectionObserver`](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API). Instead they usually work by measuring the parent and child elements, then calculating how many can and cannot fit.

Instead, this library uses an `IntersectionObserver` to avoid costly measurements, instead relying on the browser to tell us when an element 'intersects' with the edge of the viewport. The result is faster - and generally snazzier.

## How it works

When initiated, the library creates a new version of your navigation with the required markup, including a toggle button.

It also *clones* this version, so there are actually two versions of the new navigation living on the page. One is the visible navigation that the library will add and remove elements from, and the other is an invisible copy that always retains the full set of nav items (which are forced to overflow horizontally).

![Diagram showing how the clone navigation overflows the wrapper.](docs/img/how-it-works.png)

As the items overflow, they trigger the parent's `IntersectionObserver`. This means we can easily detect when (and in which direction) a new nav item clashes with the outer boundary of the navigation.

Once we detect a collision, we store which navigation it should now belong to (primary or overflow) and update both in the DOM.

## Getting started

You can create a new instance by passing in an `HTMLElement` that is the direct parent of the navigation items:

```html
<nav>
	<ul class="js-p-target">
		<li><a href="/">Home</a></li>
	  <li><a href="/">About</a></li>
	  <li><a href="/">Work</a></li>
	  <li><a href="/">Services longer nav title</a></li>
	  <li><a href="/">Contact</a></li>
  </ul>
</nav>
```

```javascript
import priorityPlus from 'priority-plus';
priorityPlus(document.querySelector('.js-p-target'));
```

It's important that the element is the *immediate* parent, since internally the library iterates over the children as the basis for the new navigation items.

## Methods

The methods available on a new instance, e.g.:

```javascript
const inst = priorityPlus(document.querySelector('.js-p-target'));
```

### `getNavElements(): { [key: string]?: HTMLElement|HTMLElement[] }`

Retrieves an object containing references to each element in the primary generated navigation.

### `on(eventType: string, cb: Function)`

Sets up an event listener on the instance (not the target element). See [events](#events) for a list of the events that are triggered.

Example:
```javascript
inst.on('itemsChanged', () => console.log('Items changed'));
```

### `off(eventType: string, cb: Function)`

Destroys an event listener.

Example:
```javascript
const callback = () => console.log('Items changed');
inst.on('itemsChanged', callback);
// etc
inst.off('itemsChanged', callback);
```

### `setOverflowNavOpen(open: boolean)`

Opens or closes the overflow navigation programatically.

Example:
```javascript
inst.setOverflowNavOpen(true);
```

### `toggleOverflowNav()`

Opens the overflow nav if closed, closes it if open.

Example:
```javascript
inst.toggleOverflowNav();
```

## Options

### Classes
If you'd like to override the default classes, you can pass in a `classNames` object like so:

```javascript
priorityPlus(document.querySelector('.js-p-target'), {
  classNames: {
    // Will override the p-plus class.
    // Other classes will be un-touched.
    wrapper: ['my-p-plus'],
  },
});
```

Each class override must be passed as an array.

| Option | Default  | Explanation |
|--------|----------|-------------|
| `container` | `p-plus-container` | This is the wrapper that collects both 'clones' of the navigation. Its purpose is to provide a way to obscure the clone.
| `main` | `p-plus` | The class applied to each of the top-level navigation wrappers. Be aware it applies to both the clone and the visible copy.
| `primary-nav-wrapper` | `p-plus__primary-wrapper` | Outer wrapper for the 'primary' (non-overflow) navigation.
| `primary-nav` | `p-plus__primary` | Inner wrapper for the 'primary' (non-overflow) navigation.
| `overflow-nav` | `p-plus__overflow` | Wrapper for the overflow navigation.
| `toggle-btn` | `p-plus__toggle-btn` | Applied to the dropdown menu toggle button.

## Templates 

### innerToggleTemplate

**Type:** `String|Function`

**Default:** 'More'

Overrides the inner contents of the 'view more' button. If you pass a string, then it will only render once, but if you pass it a function it will re-render every time the navigation is updated.

The function receives an object containing two parameters, `toggleCount` (the number of items in the overflow) and `totalCount` (which is the total number of navigation items).

Example:

```javascript
priorityPlus(document.querySelector('.js-p-target'), {
  innerToggleTemplate: ({ toggleCount, totalCount }) => `
    Menu${toggleCount && toggleCount !== totalCount ? ` (${toggleCount})` : ''}
  `,
});
```

## Events

### init

**Usage:** Triggered when the lib has loaded and swapped out the nav.

### showOverflow

**Usage:** Triggered when the overflow nav becomes visible.

### hideOverflow

**Usage:** Triggered when the overflow nav becomes invisible.

### itemsChanged

**Arguments:** `overflowCount` (The number of items in the overflow nav)

**Usage:** Triggered when the navigation items are updated (either added/removed).
