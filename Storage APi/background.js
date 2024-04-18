// function setDebugMode() { /* ... */ }

// // Watch for changes to the user's options & apply them
// chrome.storage.onChanged.addListener((changes, area) => {
//     if (area === 'sync' && changes.options?.newValue) {
//         const debugMode = Boolean(changes.options.newValue.debug); 
//         console.log('enable debug mode?', debugMode);
//         setDebugMode(debugMode);
//     }
// });

// chrome.storage.onChanged.addListener((changes, namespace) => {
//     for (let [key, {oldValue, newValue}] of Object.entries(changes)) {
//         console.log(
//             `Storage key "${key}" in namespace "${namespace}" changed.`,
//             `Old value was "${oldValue}", new value is "${newValue}".`
//         );
//     }
// });

// Where we will expose all the data we retrieve from storage.sync.
const storageCache = {count: 0};
// Asynchronously retrieve data from storage.sync, then cache it.
const initStorageCache = chrome.storage.sync.get().then((items) => {
    // copy the data retrieved from storage into storageCache.
    Object.assign(storageCache, items);
});

chrome.action.onClicked.addListener(async (tab) => {
    try {
        await initStorageCache;
    } catch (e) {
        // Handle error that occurred during storage initialization.
    }
    
    //  Normal action handler logic.
    storageCache.count++;
    storageCache.lastTabId = tab.id;
    chrome.storage.sync.set(storageCache);
    console.log('action clicked')
})