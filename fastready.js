/**
 * fastready.js
 * A MutationObserver-based alternative to document.ready and window.load that streams element load events in real-time
 */

window.fastready = function fastready (element, queryString) {
    var static = window.fastready;
    var $this = {};

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
                // Only execute if the mutation contains this event
                if (mutation[event.event] !== undefined) {
                    if (!$this.isWatchingElement || ($this.isWatchingElement && $this.isMatchingElement(mutation.target, event.fullSelector))) {
                        var mutationEvent = mutation[event.event];
                        // Check if our event is some sort of array
                        if (typeof mutationEvent[Symbol.iterator] === 'function') {
                            // If array, loop through it
                            for (var iSubMutation = 0, submutation; submutation = mutationEvent[iSubMutation++];) {
                                // Test if we are dealing with a tag, if so test it against the selector
                                if (submutation.tagName && $this.isMatchingElement(submutation, event.fullSelector)) {
                                    event.callback.call(submutation, submutation, event);
                                }
                            }
                        } else {
                            // If not array, just return the result
                            event.callback.call(mutationEvent, mutationEvent, event);
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
        
        // Add to our mutation events
        $this._observerCallbackList.push({
            id: id,
            event: event,
            selector: selector,
            fullSelector: fullSelector,
            callback: callback
        });

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