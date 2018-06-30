/**
 * fastready.js v0.0.0-dev
 * A MutationObserver-based alternative to document.ready and window.load that streams element load events in real-time
 */

window.fastready = function fastready (element, queryString) {
    var static = window.fastready;
    var $this = {};

    // Preset events, these are shortcuts to Mutation Observer events. Must be array.
    $this.shortcuts = {
        'ready': ['addedNodes']
    };
    $this.shortcutSymbol = '#';

    // This array will hold each of our selectors
    $this._observerCallbackList = [];

    // This unified callback will handle changes and pass to the callbacks
    $this._observerCallback = function _observerCallback (mutations) {
        // Pause before processing the DOM
        $this.pause();

        // Loop through each mutation
        for (var iMutation = 0, mutation; mutation = mutations[iMutation++];) {
            // Now through each registered event
            for (var iEvent = 0, event; event = $this._observerCallbackList[iEvent++];) {
                // Test if our Mutation contain the events we are looking for, if doesn't we can earn some processing cycles here.
                var matchingEvents = $this.isMatchingEvent(event.events, $this.objectKeys(mutation));
                if (matchingEvents === false)
                    continue;

                // Now we call our callback for each matching event
                for (var iEventName = 0, eventName; eventName = matchingEvents[iEventName++];) {
                    // Only execute if the mutation contains this event
                    if (mutation[eventName] !== undefined) {
                        if (!$this.isWatchingElement || ($this.isWatchingElement && $this.isMatchingElement(mutation.target, event.fullSelector))) {
                            var mutationEvent = mutation[eventName];
                            // Check if our event is some sort of array
                            if (typeof mutationEvent[Symbol.iterator] === 'function') {
                                // If array, loop through it
                                for (var iSubMutation = 0, submutation; submutation = mutationEvent[iSubMutation++];) {
                                    // Test if we are dealing with a tag, if so test it against the selector
                                    if (submutation.tagName && $this.isMatchingElement(submutation, event.fullSelector) && event.callback) {
                                        event.callback.call(mutationEvent, submutation, event);
                                    }
                                }
                            } else if (event.callback) {
                                // If not array, just return the result
                                event.callback.call(mutationEvent, null, event);
                            }
                        }
                    }
                }
            }
        }

        // Resume processing the DOM
        $this.start();
    }

    // Starts observing
    $this.start = function start () {
        // Start watching
        $this._observer.observe(element, {
            childList: true,
            subtree: true
        });
    }

    // Pauses observing
    $this.pause = function pause () {
        // Stop watching
        $this._observer.disconnect();
    }

    // Stops observing and frees resources
    $this.stop = function stop () {
        $this.pause();

        delete $this._observer;
        delete $this._observerCallback;
        delete $this._observerCallbackList;
    }

    // Creates events
    $this.on = function on (event, selector, callback) {
        // Test if we have a third argument, if not, our callback will be the second argument
        if (callback === undefined) {
            callback = selector;
            selector = '';
        }

        var fullSelector = $this.querySelector;

        // Test for selector length and append our main query selector
        if (selector.length > 0 && selector[0] != '&') 
            fullSelector += ' ';
        else
            selector = selector.substring(1);
        
        fullSelector += selector;

        // Generate unique id for this event
        var id = event + ';' + selector + ';' + Date.now();

        // Generate events array and apply shortcuts
        var events = $this.applyShortcuts(event);

        // Create our event object
        var eventObject = {
            id: id,
            events: events,
            selector: selector,
            fullSelector: fullSelector,
            callback: callback
        };
        
        // Add to our mutation events
        $this._observerCallbackList.push(eventObject);

        // Run a check for any element already on page matching it
        if ($this.isMatchingEvent(events, [$this.shortcutSymbol + 'ready'])) {
            var matches = document.querySelectorAll(fullSelector);

            for (var iMatch = 0, match; match = matches[iMatch++];) {
                if (callback)
                    callback.call(null, match, eventObject);
            }
        }

        return id;
    }

    // Removes events
    $this.off = function off (eventId) {
        for (var iEvent = 0, event; event = $this._observerCallbackList[iEvent++];) {
            if (event.id == eventId) {
                delete $this._observerCallbackList[iEvent - 1];
                return true;
            }
        }
        return false;
    }

    // Creates events and calls callback only when it has loaded
    $this.onLoad = function onLoad (event, selector, callback) {
        // Test if we have a third argument, if not, our callback will be the second argument
        if (callback === undefined) {
            callback = selector;
            selector = '';
        }

        // Create an standard event, with custom callback. We consider the submutation (first argument) as being an DOM element.
        return $this.on(event, selector, function (element, event) {

            // If we matched something that is not an element, don't do anything
            if (!element || element.onload == undefined) return;

            // Deal with any event handler that was already assigned before
            var previousHandler = element.onload;

            // Store previous context (this)
            var context = this;
            
            // Listen to onload event
            element.onload = function () {
                // Call our previous event handler transparently
                if (previousHandler)
                    previousHandler.apply(this, arguments);

                // Now create our arguments
                var args = [element, event].concat(arguments);

                // Finally, execute callback
                callback.apply(context, arguments);
            }
        });
    }

    // Tests if event should be considered valid
    $this.isMatchingEvent = function isMatchingEvent (targetEvents, eventNames) {
        targetEvents = $this.applyShortcuts(targetEvents);
        eventNames = $this.applyShortcuts(eventNames);

        var matches = [];

        for (var iEvent = 0, event; event = eventNames[iEvent++];) {
            if (~targetEvents.indexOf(event))
                matches.push(event);
        }

        if (matches.length > 0)
            return matches;
        return false;
    }

    // Applies shortcuts to event array
    $this.applyShortcuts = function applyShortcuts (events) {
        var output = [];

        // We must always be supplied an array
        if (!Array.isArray(events))
            events = [events];

        for (var iEvent = 0, event; event = events[iEvent++];) {
            // Ignore empty events
            if (event.length == 0) continue;

            // Test for shortcut selector
            if (event[0] == $this.shortcutSymbol) {
                // Test for empty events
                if (event.length == 1) continue;

                // Get shortcut
                var shortcut = $this.shortcuts[event.substring(1)];

                // If shortcut exists, append it
                if (shortcut)
                    output = output.concat(shortcut);
            } else {
                // Just a normal event
                output.push(event);
            }
        }

        return output;
    }

    // Extract keys from object
    $this.objectKeys = function objectKeys (obj) {
        var keys = [];

        for (var key in obj) {
            keys.push(key);
        }

        return keys;
    }

    // Function to test if certain element matches a query selector
    $this.isMatchingElement = function isMatchingElement (el, selector) {
        if (selector == '') return true;
        return (el.matches && el.matches(selector));
    }

    // Create MutationObserver
    $this._observer = new MutationObserver($this._observerCallback);
    
    // Test for different types of arguments
    switch (typeof element) {
        case 'string':
            // Are we going to watch an query string? So we need to watch the document element for changes.
            queryString = element;
            element = document;
            $this.isWatchingElement = false;
            break;
        case 'object':
            // Are we going to watch an element? So just let it watch.
            $this.isWatchingElement = true;
            break;
        default:
            // Neither, throw error.
            throw 'Invalid element or query string.';
    }

    // Set-up default query string
    $this.querySelector = queryString;

    // Start
    $this.start();

    return $this;
}