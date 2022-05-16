const SEARCH_INPUT_SELECTOR = '#searchtext';
const ORG_SELECT_SELECTOR = '#orgs-select';
const SEARCH_SUBMIT_SELECTOR = '#search-submit';
const SPLIT_STR = " ";
const JOIN_STR = "+OR+";

let SEARCH_INPUT = document.querySelector(SEARCH_INPUT_SELECTOR);
let ORG_SELECT = document.querySelector(ORG_SELECT_SELECTOR);
let SEARCH_SUBMIT = document.querySelector(SEARCH_SUBMIT_SELECTOR);

let ORGS_DATA = null;

async function registerHandlers() {
    SEARCH_INPUT.addEventListener('input', e => saveSearch(e.target.value));
    SEARCH_INPUT.addEventListener('keyup', e => {
        if (e.keyCode === 13) {
            handleSearchSubmit();
        }
    });
    SEARCH_SUBMIT.addEventListener('click', handleSearchSubmit);
    ORG_SELECT.addEventListener('change', handleOrgSelect);
}

/**
 * Format input string to fit in the search query for the WAM stock site
 */
let formatInput = (str) => str.split(SPLIT_STR).join(JOIN_STR);

/**
 * Just log the error to the console.
 */
let reportError = (error) => console.error(`Could not search: ${error}`);

async function saveSearch(searchString) {
    console.log(`Saving search string ${searchString}...`);
    await browser.storage.local.set({ searchString });
}

function sanitize(value) {
    //remove leading and trailing spaces
    return value.trim();
}

/**
 * open a new tab with results of the search input.
 */
async function handleSearchSubmit() {
    let searchString = sanitize(SEARCH_INPUT.value);
    if (searchString) {
        saveSearch(searchString);
        browser.tabs.create({
            url: `https://stock.weanimalsmedia.org/search/?searchQuery=${formatInput(searchString)}&assetType=default`,
            active: true
        })
            .catch(reportError);
    }
}

async function removeAllChildrenIn(parent) {
    while (parent.firstChild) {
        parent.removeChild(parent.firstChild);
    }
}

async function handleOrgSelect() {
    let selectedValue = ORG_SELECT.value;
    if (selectedValue in ORGS_DATA) {
        let links = ORGS_DATA[selectedValue];
        let orgLinks = document.querySelector("#org-links");
        removeAllChildrenIn(orgLinks);
        let orgLinkTemplate = document.querySelector("#org-link-row");
        console.log('Links for', selectedValue, ': ', links);
        for (let link of links) {
            console.log('Adding link', link, '...');
            let clone = orgLinkTemplate.content.cloneNode(true);
            let a = clone.querySelector("a");
            a.href = link;
            a.innerText = link;
            orgLinks.append(clone);
        }
    }
}

async function loadSavedData() {
    loadSavedSearch();
    // loadSavedOrgSelect();
}

async function loadSavedSearch() {
    console.log('Loading saved search...');
    let { searchString } = await browser.storage.local.get('searchString');
    console.log(`Saved search string: ${searchString}`);
    if (!searchString) {
        searchString = '';
    }
    SEARCH_INPUT.value = searchString;
    //saveSearch(searchString);
}

async function loadOrgData() {
    console.log('Loading orgs data...');
    let data = await (await fetch('./data.json')).json();
    ORGS_DATA = Object.keys(data).sort().reduce(
        (obj, key) => {
            obj[key] = data[key];
            return obj;
        },
        {}
    );
    console.log('JSON Data:');
    console.log(ORGS_DATA);
    populateOrgsSelect();
    // browser.storage.local.set({ orgsData });
}

async function populateOrgsSelect() {
    let select = document.querySelector("#orgs-select");
    let optionTemplate = document.querySelector("#org-select-row");
    for (let orgName of Object.keys(ORGS_DATA)) {
        let clone = optionTemplate.content.cloneNode(true);
        let option = clone.querySelector("option");
        option.value = orgName;
        option.innerText = orgName;
        option.title = orgName;
        select.append(clone);
    }
}

/**
 * Listen for clicks on the buttons, and send the appropriate message to
 * the content script in the page.
 */
async function init() {
    loadOrgData();
    loadSavedData();
    registerHandlers();
    // listenForClicks();
}

/**
 * There was an error executing the script.
 * Display the popup's error message, and hide the normal UI.
 */
function reportExecuteScriptError(error) {
    document.querySelector("#popup-content").classList.add("hidden");
    document.querySelector("#error-content").classList.remove("hidden");
    console.error(`Failed to execute WAM Stock Search content script: ${error}`);
}

console.log('Loading WAM Stock Search...')
/**
* When the popup loads, inject a content script into the active tab,
* and add a click handler.
* If we couldn't inject the script, handle the error.
*/
init().catch(reportExecuteScriptError);

async function loadSavedOrgSelect() {
    console.log('Loading saved org...');
    let { selectedOrg } = await browser.storage.local.get('selectedOrg');
    console.log(`Saved selected org: ${selectedOrg}`);
    if (!!selectedOrg && (selectedOrg in ORGS_DATA)) {
        ORG_SELECT.value = selectedValue;
    }
}

async function saveOrg(selectedOrg) {
    console.log(`Saving org selection ${selectedOrg}...`);
    await browser.storage.local.set({ selectedOrg });
}