# What fastready.js is?

A MutationObserver-based alternative to document.ready and window.load that streams element load events in real-time

# What can it be used for?

Well, in a nutshell, you don't have to wait until document.ready so you manipulate certain DOM elements.
All you have to do is set-up an event with a selector for your element and done! The moment the element is loaded by the DOM you receive a callback and can already manipulate it.

The library is also compatible with DOM changes made after the page loaded, so you can, for example, react to new elements being added by ajax calls, etc.

## Some use cases:

- Replace image sizes on-the-fly
- Implement image lazy-loading in ajax websites
- Perform translation and localization of dates as they are added to the page
- Many more!

# What it can't be used for?

Commplex CSS queries and selectors aren't recommended, since they may cause performance drops.