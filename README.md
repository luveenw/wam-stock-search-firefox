# We Animals Media Stock Search for Firefox

![Video demo of We Animals Media Stock Search for Firefox](https://github.com/luveenw/wam-stock-search-firefox/blob/c01de6a07e63d20e9193093d01d6df4884eb8652/Extension%20Demo.gif)

## Install
[Download from Mozilla Addons](https://addons.mozilla.org/firefox/downloads/file/3950054/14dbb4c41de64b1792f4-0.1.xpi)

## Usage Context
I freelance for [We Animals Media](https://www.weanimalsmedia.org) (WAM), an animal photojournalism nonprofit. I am responsible for ensuring valid attribution of their visuals (images and videos) by organizations who download them for use in various media including web / social media, print, and video.

When analyzing the usage of several thousand images each month, it becomes cumbersome to navigate to the WAM stock website and enter search terms for each of them. This Firefox extension allows users to enter their search terms in a popup, and be taken directly to the search results page on wenanimalsmedia.org when they click the Search button.

When looking for an organization's visuals use online, an onerous extra step involves searching for each of the websites and social media platforms where the organization posts regularly. To address this, the extension also includes a curated Rolodex-style directory of organizations that use WAM's stock visuals. It includes links to their websites and social media pages. The directory will be regularly updated as the WAM team curates links for more organizations. The Rolodex in the extension will update automatically as directory updates occur.

## Implementation Details
1. The extension requires an Internet connection to work. At startup, the version listed in [`data_version.json`](https://github.com/luveenw/wam-stock-search-firefox/blob/main/popup/data/data_version.json) is checked against the version number in local storage. The extension determines that a Rolodex update is available if the remote version number is greater than the local version, and it downloads this update automatically in the background.
2. At present, three different search types are supported - any terms, all terms, and exact match.
3. The extension performs super basic search query sanitization by trimming extraneous spaces.
