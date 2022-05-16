const SEARCH_INPUT_SELECTOR = '#searchtext';
const ORG_SELECT_SELECTOR = '#orgs-select';
const SEARCH_SUBMIT_SELECTOR = '#search-submit';
const SEARCH_TYPE_SELECT_SELECTOR = '#search-type-select';
const SPLIT_STR = " ";
const ANY_JOIN_STR = "+OR+";
const ALL_JOIN_STR = "+AND+";
const EXACT_JOIN_STR = "+";
const SEARCH_TYPES = {
    "any terms": ANY_JOIN_STR,
    "all terms": ALL_JOIN_STR,
    "exact match": EXACT_JOIN_STR
};

const SEARCH_INPUT = document.querySelector(SEARCH_INPUT_SELECTOR);
const ORG_SELECT = document.querySelector(ORG_SELECT_SELECTOR);
const SEARCH_SUBMIT = document.querySelector(SEARCH_SUBMIT_SELECTOR);
const SEARCH_TYPE_SELECT = document.querySelector(SEARCH_TYPE_SELECT_SELECTOR);

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
let formatInput = (str) => {
    let joinStr = !!SEARCH_TYPE_SELECT.value && SEARCH_TYPE_SELECT.value || EXACT_JOIN_STR;
    let result = str.split(SPLIT_STR).join(joinStr);
    if (joinStr === EXACT_JOIN_STR) {
        result = `"${result}"`;
    }
    return result;
}

/**
 * Just log the error to the console.
 */
let reportError = (error) => console.error(`Could not search: ${error}`);

async function saveSearch(searchString) {
    console.log(`Saving search string ${searchString}...`);
    await browser.storage.local.set({ searchString });
}

async function saveSearchType(searchType) {
    console.log(`Saving search type ${searchType}...`);
    await browser.storage.local.set({ searchType });
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

async function handleSearchTypeSelect() {
    let searchType = SEARCH_TYPE_SELECT.value;
    if (searchType) {
        saveSearchType(searchType);
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
    loadSavedSearchType();
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

async function loadSavedSearchType() {
    console.log('Loading saved search type...');
    let { searchType } = await browser.storage.local.get('searchType');
    console.log(`Saved search type: ${searchType}`);
    if (!searchType) {
        searchType = ANY_JOIN_STR;
    }
    SEARCH_TYPE_SELECT.value = searchType;
}


async function loadSearchTypes() {
    console.log('Loading search types...');
    // const typeSelect = document.querySelector(SEARCH_TYPE_SELECT_SELECTOR);
    let optionTemplate = document.querySelector("#search-type-row");
    console.log('search type option template:', optionTemplate);
    for (let type of Object.keys(SEARCH_TYPES)) {
        console.log(`Adding search type ${type}...`);
        await addOptionToSelect(SEARCH_TYPE_SELECT, optionTemplate, { value: SEARCH_TYPES[type], innerText: type, title: type });
    };
}

async function loadOrgData() {
    console.log('Loading orgs data...');
    let data = await (await fetch('https://raw.githubusercontent.com/luveenw/wam-stock-search-firefox/main/popup/data.json')).json();
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
    let optionTemplate = document.querySelector("#org-select-row");
    console.log('org option template:', optionTemplate);
    for (let orgName of Object.keys(ORGS_DATA)) {
        await addOptionToSelect(ORG_SELECT, optionTemplate, { value: orgName, innerText: orgName, title: orgName });
    }
}

async function addOptionToSelect(select, optionTemplate, data) {
    let clone = optionTemplate.content.cloneNode(true);
    let option = clone.querySelector("option");
    let { value, title, innerText } = data;
    option.value = value;
    option.innerText = innerText;
    option.title = title;
    select.append(clone);
}

async function loadFixtures() {
    loadSearchTypes();
    await loadOrgData();
}

async function init() {
    await loadFixtures();
    await loadSavedData();
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