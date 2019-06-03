# Priority Plus

A modern implementation of the [priority plus](https://css-tricks.com/the-priority-navigation-pattern/) navigation pattern.

Instead of measuring the navigation items and calculating if there is enough room to accomodate them, it uses the [IntersectionObserver API](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API), making it more performant and generally snazzier ✨

## How it works

When initited, the library creates a new version of your navigation with the required markup, including a toggle button and a few wrappers.

It also *clones* this version, so there are actually two versions of the new navigation living on the page.

One is the visible navigation that the library will add and remove elements from, and the other is an invisible copy that always retains the full set of nav items (which are forced to overflow horizontally).

As the items overflow, they trigger the IntsersectionObserver set up on the parent. This means we can easily detect when a new nav item clashes with the outer boundary of the navigation.

This is *perfect* for the priority + pattern, as it doesn't require measuring items or fixing widths/heights - all we need to do is ensure that the cloned copy doesn't wrap (which we can use `flexbox` for).

## Methods

The methods available on a new instance.

### getNavElements()

Retrieves an object containing references to each element in the primary generated navigation.

### on(eventType: string, cb: Function)

Sets up an event listener on the instance (not the target element). See [events](#events) for a list of the events that are triggered.

### off(eventType: string, cb: Function)

Destroys an event listener.

### setOverflowNavOpen(open: boolean)

Opens or closes the overflow navigation programatically.

### toggleOverflowNav()

Opens the overflow nav if closed, closes it if open.

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

Classes must be passed as an array.

#### container

**Default:** 'p-plus-container'

This is the wrapper that collects both 'clones' of the navigation. It's purpose is to provide a way to obscure the clone.

#### main

**Default:** 'p-plus'

The class applied to each of the top-level navigation wrappers. Be aware it aplies to both the clone and the visible copy.

#### primary-nav-wrapper

**Default:** 'p-plus__primary-wrapper'

Outer wrapper for the 'primary' (non-overflow) navigation.

#### primary-nav

**Default:** 'p-plus__primary'

Inner wrapper for the 'primary' (non-overflow) navigation.

#### overflow-nav

**Default:** 'p-plus__overflow'

Wrapper for the overflow navigation.

#### toggle-btn

**Default:** 'p-plus__toggle-btn'

Applied to the dropdown menu toggle button.

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
