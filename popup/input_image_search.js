const SEARCH_INPUT_SELECTOR = '#searchtext';
const ORG_SELECT_SELECTOR = '#orgs-select';
const SEARCH_SUBMIT_SELECTOR = '#search-submit';
const SEARCH_TYPE_SELECT_SELECTOR = '#search-type-select';
const SEARCH_TYPE_OPTION_TEMPLATE_SELECTOR = "#search-type-row";
const ORG_OPTION_TEMPLATE_SELECTOR = "#org-select-row";
const ORG_LINKS_SELECTOR = "#org-links";
const ORG_LINK_TEMPLATE_SELECTOR = "#org-link-row";
const ERROR_CONTENT_SELECTOR = "#error-content";
const POPUP_CONTENT_SELECTOR = "#popup-content";


const SEARCH_INPUT = document.querySelector(SEARCH_INPUT_SELECTOR);
const ORG_SELECT = document.querySelector(ORG_SELECT_SELECTOR);
const SEARCH_SUBMIT = document.querySelector(SEARCH_SUBMIT_SELECTOR);
const SEARCH_TYPE_SELECT = document.querySelector(SEARCH_TYPE_SELECT_SELECTOR);
const SEARCH_TYPE_OPTION_TEMPLATE = document.querySelector(SEARCH_TYPE_OPTION_TEMPLATE_SELECTOR);
const ORG_OPTION_TEMPLATE = document.querySelector(ORG_OPTION_TEMPLATE_SELECTOR);
const ORG_LINKS = document.querySelector(ORG_LINKS_SELECTOR);
const ORG_LINK_TEMPLATE = document.querySelector(ORG_LINK_TEMPLATE_SELECTOR);
const ERROR_CONTENT = document.querySelector(ERROR_CONTENT_SELECTOR);
const POPUP_CONTENT = document.querySelector(POPUP_CONTENT_SELECTOR);


const SPLIT_STR = " ";
const ANY_JOIN_STR = "+OR+";
const ALL_JOIN_STR = "+AND+";
const EXACT_JOIN_STR = "+";
const SEARCH_TYPES = {
    "any terms": ANY_JOIN_STR,
    "all terms": ALL_JOIN_STR,
    "exact match": EXACT_JOIN_STR
};

let ORGS_DATA = null;
let DATA_VERSION = null;

async function registerHandlers() {
    SEARCH_INPUT.addEventListener('input', async function (e) { await saveDataToStorage('searchString', e.target.value); });
    SEARCH_INPUT.addEventListener('keyup', e => {
        if (e.keyCode === 13) {
            handleSearchSubmit();
        }
    });
    SEARCH_SUBMIT.addEventListener('click', handleSearchSubmit);
    ORG_SELECT.addEventListener('change', handleOrgSelect);
}

/**
 * open a new tab with results of the search input.
 */
async function handleSearchSubmit() {
    let searchString = sanitize(SEARCH_INPUT.value);
    if (searchString) {
        await saveDataToStorage('searchString', searchString);
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
        await saveDataToStorage('searchType', searchType);
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
        removeAllChildrenIn(ORG_LINKS);
        console.log('Links for', selectedValue, ': ', links);
        for (let link of links) {
            console.log('Adding link', link, '...');
            let clone = ORG_LINK_TEMPLATE.content.cloneNode(true);
            let a = clone.querySelector("a");
            a.href = link;
            a.innerText = link;
            ORG_LINKS.append(clone);
        }
    }
}

async function loadSavedSearchData() {
    loadSavedSearch();
    loadSavedSearchType();
    // loadSavedOrgSelect();
}

async function loadSavedSearch() {
    console.log('Loading saved search...');
    let { searchString } = await loadDataFromStorage('searchString');
    console.log(`Saved search string: ${searchString}`);
    if (!searchString) {
        searchString = '';
    }
    SEARCH_INPUT.value = searchString;
    //saveSearch(searchString);
}

async function loadSavedSearchType() {
    console.log('Loading saved search type...');
    let { searchType } = await loadDataFromStorage('searchType');
    console.log(`Saved search type: ${searchType}`);
    if (!searchType) {
        searchType = ANY_JOIN_STR;
    }
    SEARCH_TYPE_SELECT.value = searchType;
}


async function loadSearchTypes() {
    console.log('Loading search types...');
    // const typeSelect = document.querySelector(SEARCH_TYPE_SELECT_SELECTOR);
    console.log('search type option template:', SEARCH_TYPE_OPTION_TEMPLATE);
    for (let type of Object.keys(SEARCH_TYPES)) {
        console.log(`Adding search type ${type}...`);
        await addOptionToSelect(SEARCH_TYPE_SELECT, SEARCH_TYPE_OPTION_TEMPLATE, { value: SEARCH_TYPES[type], innerText: type, title: type });
    };
}

async function fetchDataVersion() {
    return (await (await fetch('https://raw.githubusercontent.com/luveenw/wam-stock-search-firefox/main/popup/data/data_version.json')).json()).version;
}

async function checkDataVersion() {
    console.log('Checking data version...')
    let remoteVersion = await fetchDataVersion();
    console.log('remote version:', remoteVersion);

    let localVersion = await browser.storage.local.get('dataVersion');
    console.log('local version:', localVersion['dataVersion']);

    if (!Object.keys(localVersion).length || localVersion['dataVersion'] < remoteVersion) {
        let message = (localVersion['dataVersion'] < 0) ? 'No local version number found' : `Found newer data version ${remoteVersion}`;
        console.log(`${message}. Deleting local copy...`);
        deleteDataFromStorage('orgsData');
    }

    DATA_VERSION = remoteVersion;
}

async function fetchOrgsData() {
    console.log('Fetching orgs data from remote...');
    return (await (await fetch('https://raw.githubusercontent.com/luveenw/wam-stock-search-firefox/main/popup/data/orgs_data.json')).json());
}

async function loadOrgsData() {
    console.log('Loading orgs data...');
    const savedData = await loadDataFromStorage('orgsData');
    let data = !!Object.keys(savedData).length && savedData || (await fetchOrgsData());
    console.log('fetched/retrieved orgs data:', data);
    ORGS_DATA = !!Object.keys(savedData).length && savedData || Object.keys(data).sort().reduce(
        (obj, key) => {
            obj[key] = data[key];
            return obj;
        },
        {}
    );
    console.log('JSON Data:', ORGS_DATA);
    populateOrgsSelect();
    !savedData && (await saveDataToStorage('orgsData', ORGS_DATA));
}

async function populateOrgsSelect() {
    console.log('org option template:', ORG_OPTION_TEMPLATE);
    for (let orgName of Object.keys(ORGS_DATA)) {
        await addOptionToSelect(ORG_SELECT, ORG_OPTION_TEMPLATE, { value: orgName, innerText: orgName, title: orgName });
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
    console.log('Loading fixtures...');
    loadSearchTypes();
    await loadOrgsData();
}

async function init() {
    await checkDataVersion();
    await loadFixtures();
    await saveDataToStorage('dataVersion', DATA_VERSION);
    await loadSavedSearchData();
    registerHandlers();
}

/**
 * There was an error executing the script.
 * Display the popup's error message, and hide the normal UI.
 */
function reportExecuteScriptError(error) {
    POPUP_CONTENT.classList.add("hidden");
    ERROR_CONTENT.classList.remove("hidden");
    console.error(`Failed to execute WAM Stock Search content script: ${error}`);
}

function sanitize(value) {
    //remove leading and trailing spaces
    return value.trim();
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

async function saveDataToStorage(key, data) {
    console.log(`Saving ${key} to local storage with data `, data, '...');
    await browser.storage.local.set({ [key]: data });
}

async function loadDataFromStorage(key) {
    console.log(`Loading ${key} from local storage...`);
    return browser.storage.local.get(key);
}

async function deleteDataFromStorage(key) {
    console.log(`Deleting ${key} from local storage...`);
    await browser.storage.local.remove(key);
}

console.log('Loading WAM Stock Search...')
/**
* When the popup loads, inject a content script into the active tab,
* and add a click handler.
* If we couldn't inject the script, handle the error.
*/
init().catch(reportExecuteScriptError);
