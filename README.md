# ➕PriorityPlus 

An modern implementation of the ['priority +' navigation pattern](https://css-tricks.com/the-priority-navigation-pattern/).

Instead of measuring the navigation items and calculating if there is enough room to accomodate them, it uses the [IntersectionObserver API](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API), making it more performant and generally snazzier ✨

## How it works

When initited, the library creates a new version of your navigation with the required markup, including a toggle button and a few wrappers.

It also *clones* this version, so there are actually two versions of the new navigation living on the page.

One is the visible navigation that the library will add and remove elements from, and the other is an invisible copy that always retains the full set of nav items (which are forced to overflow horizontally).

As the items overflow, they trigger the IntsersectionObserver set up on the parent. This means we can easily detect when a new nav item clashes with the outer boundary of the navigation.

This is *perfect* for the priority + pattern, as it doesn't require measuring items or fixing widths/heights - all we need to do is ensure that the cloned copy doesn't wrap (which we can use `flexbox` for).

## Events

### init
*Usage:* Triggered when the lib has loaded and swapped out the nav.

### showOverflow
*Usage:* Triggered when the overflow nav becomes visible.

### hideOverflow
*Usage:* Triggered when the overflow nav becomes invisible.

### itemsChanged
*Arguments:* `overflowCount` (The number of items in the overflow nav)
*Usage:* Triggered when the navigation items are updated (either added/removed).
