const SEARCH_INPUT_SELECTOR = '#searchtext';
const ORG_SELECT_SELECTOR = '#orgs-select';
const SPLIT_STR = " ";
const JOIN_STR = "+OR+";

let searchInput = document.querySelector(SEARCH_INPUT_SELECTOR);
let orgSelect = document.querySelector(ORG_SELECT_SELECTOR);
let ORGS_DATA = null;

searchInput.addEventListener('input', e => saveSearch(e.target.value));
searchInput.addEventListener('keyup', e => {
    if (e.keyCode === 13) {
        submitSearch();
    }
});

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
let searchString = sanitize(searchInput.value);
async function submitSearch() {
    if (searchString) {
        saveSearch(searchString);
        browser.tabs.create({
            url: `https://stock.weanimalsmedia.org/search/?searchQuery=${formatInput(searchString)}&assetType=default`,
            active: true
        })
            .catch(reportError);
    }
}

async function handleOrgSelect() {
    let selectedValue = orgSelect.value;
    if (selectedValue in ORGS_DATA) {
        let links = ORGS_DATA[selectedValue];
        console.log('Links for', selectedValue, ': ', links);
        for (let link of links) {
            console.log(link);
        }
    }
    // saveOrg(selectedValue);
}

async function removeAllChildrenIn(parent) {
    while (parent.firstChild) {
        parent.removeChild(parent.firstChild);
    }
}

async function handleOrgSubmit() {
    let selectedValue = orgSelect.value;
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

async function listenForClicks() {
    document.addEventListener("click", (e) => {
        let targetId = e.target.id;
        console.log(`event target ID: ${targetId}`);
        switch (targetId) {
            case 'submit':
                submitSearch();
                break;
            case 'orgs-select':
                handleOrgSelect();
                break;
            case 'orgsubmit':
                handleOrgSubmit();
                break;
            default:
                console.log(`Unknown event target ID ${targetId}`);
        }
        /* if (classList.contains("submit")) {
            submitSearch();
        } else if (classList.contains("org-submit")) {
            handleOrgSelected();
        } */
    });
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
    searchInput.value = searchString;
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
    listenForClicks();
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
        orgSelect.value = selectedValue;
    }
}

async function saveOrg(selectedOrg) {
    console.log(`Saving org selection ${selectedOrg}...`);
    await browser.storage.local.set({ selectedOrg });
}