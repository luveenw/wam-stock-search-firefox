(function () {
    console.log('Loading WAM Stock Search content script...')
    /**
     * Check and set a global guard variable.
     * If this content script is injected into the same page again,
     * it will do nothing next time.
     */
    /* if (window.hasRun) {
        console.log('Already loaded WAM Stock Search content script.')
        return;
    }
    window.hasRun = true; */

    const SPLIT_STR = " ";
    const JOIN_STR = "+OR+";

    /**
     * Format input string to fit in the search query for the WAM stock site
     */
    let formatInput = (str) => str.split(SPLIT_STR).join(JOIN_STR);

    /**
    * Given a search string, open a new tab displaying the results of that search string on the WAM stock site
    */
    let searchFor = searchString =>
        browser.tabs.create({
            url: `https://stock.weanimalsmedia.org/search/?searchQuery=${formatInput(searchString)}&assetType=default`,
            active: true
        })
            .catch(e => console.error(`Error creating new tab: ${e}`));


    /**
     * Listen for messages from the background script.
     */
    browser.runtime.onMessage.addListener((message) => {
        if (message.command === 'search') {
            searchFor(message.searchString);
        }
    });

})();
