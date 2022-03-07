const SEARCH_INPUT_SELECTOR = '#searchtext';

/**
 * Listen for clicks on the buttons, and send the appropriate message to
 * the content script in the page.
 */
function listenForClicks() {

    /**
     * Just log the error to the console.
     */
    function reportError(error) {
        console.error(`Could not search: ${error}`);
    }

    document.addEventListener("click", (e) => {
        if (e.target.classList.contains("submit")) {
            /**
             * send a "search" message to the content script in the active tab.
             */
            let searchString = document.querySelector(SEARCH_INPUT_SELECTOR).value;
            browser.tabs.sendMessage(tabs[0].id, { command: 'search', searchString })
                .catch(reportError);
        }

    });
}

/**
 * There was an error executing the script.
 * Display the popup's error message, and hide the normal UI.
 */
function reportExecuteScriptError(error) {
    document.querySelector("#popup-content").classList.add("hidden");
    document.querySelector("#error-content").classList.remove("hidden");
    console.error(`Failed to execute beastify content script: ${error.message}`);
}

/**
* When the popup loads, inject a content script into the active tab,
* and add a click handler.
* If we couldn't inject the script, handle the error.
*/
browser.tabs.executeScript({ file: "/content_scripts/input_image_search.js" })
    .then(listenForClicks)
    .catch(reportExecuteScriptError);