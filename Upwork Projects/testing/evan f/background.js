const SERVER = 'theconversation.social'
const EXPIRE_PERIOD = 3600 * 1000
const FREE_TRIAL_COUNT = 200
const AUTORUN_ERROR_SHOW_TIMEOUT = 3000 // when autorun is true set timeout for showing errors
const EXT_URL = `chrome-extension://${chrome.runtime.id}`
const MAX_REQUEST_ATTEMPTS = 1000; // this is really just a max retry used for initSocialCuration if the request system is busy with another request
const DEFEAULT_REQUEST_TIMEOUT = 15000; // 15 seconds
const EXTENSION_TYPE = 'private_demo_for_twitter'

// #twittercardsturnoff - modify here!
// This USE_TOOLTIPS setting alos appears in file xx and xx but it is a fallback
// in case there is a problem with background.js, and to not modify it from FALSE
// in the other files, the one in background.js is what can be switched from TRUE and FALSE.
const USE_TOOLTIPS_ADMIN = true;
// Set it to true to use twitter cards and to false to use custom tooltips.
const USE_DEFAULT_TWITTER_TOOLTIP = false;

let loggedInUser = ''
let $ = window['$']
let tabForClose = -1;
let onInstalledTab;
let noSubscriptionTab;
let noTwitterTab;

let globalRequest = null
let CURRENT_INIT_REQUEST_URL = 'empty'
var SUBSCRIBED_USER = false

// for news pages, the curation flow / api calls are:
// 1. backendAPIProxy (decides whether to make init url= call or polling link_id= call0
// 2. fireBackendInit (manages init requests for news pages)
// 3. handleBackendInit (actually executes it)
// 4. backendAPIProxy then handles the polling calls after step 3.
// (if the person has twitter rather than custom widget it uses createCollection doing polling 
//  via loadingInfo via enableOfficialTwitterWidgetOnNewsArticle in load_widjet.js)

// for twitter.com, it uses
// 1. initSocialCuration
// 2. createCollection makes call for polling while createCollection in payload.js does the intervals of the calls.  
// note: after 2, i think on click to open by the user of the sidebar it uses loadingInfo via enableOfficialTwitterWidget  in load_widjet.js

// note for all of these we often use a fetchWithTimeout to make actual request -- helps us deal w/ server non-responsiveness.


// get/set default preferences
chrome.storage.local.get({usetooltips: null, defaulttwittooltip: null}, (items) => {
    if (chrome.runtime.lastError) {
        chrome.storage.local.set({
            usetooltips: USE_TOOLTIPS_ADMIN,
            defaulttwittooltip: USE_DEFAULT_TWITTER_TOOLTIP,
            autorun: true
        });
    } else {
        if (items.defaulttwittooltip === null) {
            chrome.storage.local.set({defaulttwittooltip: USE_DEFAULT_TWITTER_TOOLTIP, autorun: true});
        }
        // #twittercardsturnoff
        chrome.storage.local.set({usetooltips: USE_TOOLTIPS_ADMIN, autorun: true});
    }
})

async function saveCurrentInitRequestURL(url) {
    //console.log('brad pritning constant request 0')
    //console.log(CURRENT_INIT_REQUEST_URL)
    CURRENT_INIT_REQUEST_URL = url
    //console.log('brad pritning constant request 1')
    //console.log(CURRENT_INIT_REQUEST_URL)
    //setTimeout(() => {  CURRENT_INIT_REQUEST_URL = 'empty'; }, 5000);
    //console.log('brad pritning constant request 2')
    //setTimeout(() => {  console.log(CURRENT_INIT_REQUEST_URL); }, 5000);
}

const sendRequestFailedMessageToTab = (tabId) => {
    chrome.tabs.query({currentWindow: true, active: true}, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {
            message: 'NOTIFICATION_ERROR',
            data: {'code': 1000, 'message': 'Our servers are currently busy. Please try again later.'}
        })
    });
}

const fetchWithTimeout = (url, options, curation_init_request = false, timeout = DEFEAULT_REQUEST_TIMEOUT) => {
    var curation_request_type
    if (url.includes("social_curation")) {
        curation_request_type = true
    } else {
        curation_request_type = false
    }

    const abortController = new AbortController();
    const signal = abortController.signal;
    options.signal = options.signal || signal;
    const fetchPromise = fetch(url, options);
    let timerId = null;
    const timerPromise = new Promise((_, reject) =>
        timerId = setTimeout(() => {
            abortController.abort();
            if (curation_request_type) {
                sendRequestFailedMessageToTab(options.tabId)
            }
            // reject(new Error("Request timeout"));
        }, timeout)
    );
    fetchPromise.then(() => clearTimeout(timerId))

    fetchPromise.catch(error => {
        if (curation_request_type) {
            sendRequestFailedMessageToTab(options.tabId);
        }
    })

    return Promise.race([
        fetchPromise,
        timerPromise
    ]);
};

// Set up
window['Module'] = (function () {
    // Disabled in favour of content script "/src/extension/content-link.js"
    // chrome.webNavigation.onBeforeNavigate.addListener(function (info) {
    //   if (info.url && info.frameId === 0) {
    //     checkIfValidDomain(info.url, () => {
    //       fireBackendInit({data: info.url}, 'onBeforeNavigate').then(_ => {})
    //     })
    //   }
    // })

    chrome.runtime.onInstalled.addListener(function (details) {
        if (details.reason == "install") {
            chrome.tabs.create({url: `chrome-extension://${chrome.runtime.id}/pages/popup.html#/carousel`}, function (tab) {
                onInstalledTab = tab
            });
            console.log("This is a first install!");
        } else if (details.reason == "update") {
            //var thisVersion = chrome.runtime.getManifest().version;
            //console.log("Updated from " + details.previousVersion + " to " + thisVersion + "!");
            console.log("Updated Version");
        }
    });
    chrome.webNavigation.onDOMContentLoaded.addListener(function (info) {
        chrome.tabs.executeScript(null, {file: 'payload-before.js'}, _ => {
            //console.log( 'executeScript' )
            let e = chrome.runtime.lastError
            if (e !== undefined) {
                //console.log('execute payload-before.js') // todo: better way to execute this script?
            }
        })
    })

    chrome.tabs.onUpdated.addListener(function (tabId, info, tab) {
        checkIfValidDomain(tab.url, () => {

            if (info.url) {
                chrome.tabs.sendMessage(tabId, {
                    message: 'DOM_URL_CHANGED_EVENT',
                    url: info.url
                })
            }

            if (chrome.runtime.lastError) {
                console.warn('Updated lastError', chrome.runtime.lastError)
            }
            if (info.title && info.title.includes('Twitter')) tabForClose = tabId
            const currentUrl = tab.url
            const checkUrl = 'chrome://extensions'
            let check = true;

            // check currentUrl is not null
            if (currentUrl)
                check = currentUrl.includes(checkUrl) || currentUrl.includes('chrome-extension://')

            if (!check) {
                info.url && console.log('onUpdated', info.url)
                if (info.url === 'https://theconversation.social/social-discovery/' && tabForClose != -1) {
                    refreshLoggedInStatus()
                    // window.loggedInUser = 'sdsdds'
                    chrome.tabs.remove(onInstalledTab.id, function () {
                    })
                }
                if ((info.url && info.url.indexOf('twitter.com') === -1) && (info.url !== CURRENT_INIT_REQUEST_URL)) {
                    saveCurrentInitRequestURL(info.url)
                    fireBackendInit({data: info.url}, 'onUpdated', tabId).then(_ => {
                    })
                }
                if (info.status === 'complete') {
                    chrome.tabs.executeScript(null, {file: 'payload.js'}, _ => {
                        let e = chrome.runtime.lastError
                        if (e !== undefined) {
                            console.log(tabId, _, e.stacktrace, e)
                            console.trace()
                        }
                    })
                }
            }

        })
    })

    function createLookupDict(data) {
        var lookupDict = {}
        for (var i = 0; i < data.length; i++) {
            lookupDict[data[i].toLowerCase()] = true
        }
        return lookupDict
    }

    function loadTwitterIds() {
        //console.log('lookup table expired, request new twitter list...')
        if (globalRequest !== null) return

        globalRequest = fetchWithTimeout(`https://${SERVER}/recipient/get_twitter_ids/`, {
            method: 'GET',
            credentials: 'include'
        }).then(res => res.json())
            .then((data) => {
                if (Array.isArray(data)) {
                    chrome.storage.local.set({twitterIds: JSON.stringify(data), updateDate: Date.now()})
                } else {
                    setTimeout(loadTwitterIds, 15 * 60 * 1000) // try again in 15 minutes
                }
                globalRequest = null
            })
            .catch(function () {
                setTimeout(loadTwitterIds, 15 * 60 * 1000) // try again in 15 minutes
                globalRequest = null
            })
    }

    // for cards

    function loadDomainLists() {
        //console.log('lookup table expired, request new domain list...')
        // fetchWithTimeout('./domainlist.txt', {
        fetchWithTimeout('https://writepublic-uploads.s3.amazonaws.com/domainlist.txt', {
            method: 'GET',
            credentials: 'include'
        }).then(res => res.text())
            .then(data => {
                const arrDomainList = data.split('\n')
                if (data || arrDomainList.length) {
                    chrome.storage.local.set({
                        domainlist: arrDomainList,
                        updateDate_domainLists: Date.now()
                    })
                    //console.log('local storage updated.')
                } else {
                    setTimeout(loadDomainLists, 20 * 1000)
                }
            }).catch(error => {
            //console.log('request error. retry 20 seconds later...', error)
            setTimeout(loadDomainLists, 20 * 1000)
        })
    }

    function refreshLoggedInStatus(sendResponse) {
        fetchWithTimeout(`https://${SERVER}/check_logged_in_status_for_ext_user/?d=${Math.random()}`, {
            credentials: 'include'
        })
            .then(r => r.json())
            .then(resp => {
                if (resp.logged_in) {
                    window.loggedInUser = resp.display_name
                    window.userName = resp.display_name
                } else {
                    window.loggedInUser = ''
                    window.userName = ''
                }
                sendResponse && sendResponse(window.loggedInUser)
            })
    }

    chrome.storage.local.get({updateDate: null}, (items) => {
        //console.log('twitter ids update date: ' + items.updateDate);
        if (items.updateDate === null || items.updateDate + EXPIRE_PERIOD < Date.now()) {
            loadTwitterIds()
        }
    })

    // for cards

    chrome.storage.local.get({domainLists: null, updateDate_domainLists: null}, (items) => {
        //console.log('got domain list from storage.')
        if (items.domainLists === null || items.updateDate_domainLists === null || items.updateDate_domainLists + EXPIRE_PERIOD < Date.now()) {
            loadDomainLists()
        }
    })

    chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
        switch (request.method) {
            case 'fetchRecipientProfile': {
                const url = `https://${SERVER}/recipient/get_data_by_twitter_id/${request.twitterId}/`
                fetchWithTimeout(url, {
                    method: 'GET',
                    credentials: 'include'
                }).then(res => res.json())
                    .then(r => {
                        if (r.errors && r.errors.length > 0) {
                            processErrors(r.errors, sender && sender.tab.id)
                        }
                        if (!r.short_desc || !r.image || !r.followers || !r.home_page) {
                            // if no data return from server, try to fetch user info from twitter.com
                            // console.log(Object.keys(r).length);
                            if (Object.keys(r).length === 3) {
                                if (r.category === '' && r.subcategory === '') {
                                    sendResponse({data: r, success: false})
                                } else {
                                    r.scrape = 'true'
                                    sendResponse({data: r, success: true})
                                }
                            } else {
                                sendResponse({data: r, success: true})
                            }
                        } else {
                            r.scrape = 'false'
                            sendResponse({data: r, success: true})
                        }
                    }).catch(err => {
                    console.error(err)
                    sendResponse({data: {}, success: false})
                })
                break
            }

            case 'fetchRecipientCategory': {
                const url = `https://${SERVER}/recipient/get_data_by_twitter_id/${request.twitterId}/`
                fetchWithTimeout(url, {
                    method: 'GET',
                    credentials: 'include'
                }).then(res => res.json())
                    .then(r => {
                        if (r.errors && r.errors.length > 0) {
                            processErrors(r.errors, sender && sender.tab.id)
                        }
                        if (r.category === '' && r.subcategory === '') {
                            sendResponse({data: r, success: false})
                        } else {
                            sendResponse({data: r, success: true})
                        }
                    }).catch(err => {
                    console.error(err)
                    sendResponse({data: {}, success: false})
                })
                break
            }

            case 'socialCurationInit': {
                checkIfValidDomain(sender.tab.url, () => initSocialCuration(request, sender, sendResponse))
                break
            }
            case 'createCollection': {
                checkIfValidDomain(sender.tab.url, () => createCollection(request, sender, sendResponse))
                break
            }
            case 'getTitle': {
                getTitle(request.tweetIds, sendResponse)
                break
            }
            case 'checkVaildDomain': {
                chrome.storage.local.get({domainlist: null}, (items) => {
                    const checkArr = (typeof (items.domainlist) === 'string' ? JSON.parse(items.domainlist) : items.domainlist) || []
                    for (var i = 0; i < checkArr.length; i++) {
                        if (checkArr[i].indexOf(request.checkdomain) !== -1) {
                            //console.log('true')
                            sendResponse({result: true})
                        } else {
                            sendResponse({result: false})
                            // return false;
                        }
                    }
                })
                break
            }
            case 'checkShowForAllWebsite': {
                chrome.storage.local.get({showforall: true, domainlist: null}, (items) => {
                    const checkArr = (typeof (items.domainlist) === 'string' ? JSON.parse(items.domainlist) : items.domainlist) || []
                    sendResponse({result: items.showforall, domainlist: checkArr})
                })
                break
            }
            case 'checkShowOnTwitter': {
                chrome.storage.local.get({showontwitter: true}, (items) => {
                    sendResponse({result: items.showontwitter})
                })
                break
            }
            case 'checkUseDefaultTwitterTooltip': {
                chrome.storage.local.get({defaulttwittooltip: true}, (items) => {
                    sendResponse({result: items.defaulttwittooltip})
                })
                break
            }
            case 'checkLoggedIn': {
                sendResponse({result: !!loggedInUser})
                break
            }
            case 'refreshLoggedInStatus': {
                refreshLoggedInStatus(sendResponse)
                break
            }
            case 'login': {
                chrome.tabs.create({url: EXT_URL + '/popup.htm'})
                break
            }
        }
    })

    refreshLoggedInStatus()

    function initSocialCuration(request, sender, sendResponse, attempts = 1) {
        // this is used for twitter.com init queries ONLY. non-twitter.com pages use a different flow.  see top of file for explanation.
        console.log('SOCIALCURATION')
        //console.log(request)
        let url = `https://${SERVER}/social_curation/?init=true&url=${request.linkTitle}&fabric_source=${EXTENSION_TYPE}`

        //console.log('Init collection attempt: ', attempts);
        if (globalRequest !== null) {

            if (attempts >= MAX_REQUEST_ATTEMPTS) {
                console.error('Maximum number of attempts reached.');
                sendResponse({data: {}, success: false})
                globalRequest = null
                return;
            }

            setTimeout(() => {
                initSocialCuration(request, sender, sendResponse, attempts + 1)
            }, 1000)
            return
        }

        globalRequest = fetchWithTimeout(url, {
            method: 'GET',
            credentials: 'include'
        }).then(res => res.json())
            .then(r => {
                if (r.errors && r.errors.length > 0) {
                    processErrors(r.errors, sender && sender.tab.id)
                }
                sendResponse({data: r.link_id, success: true})
                globalRequest = null
            }).catch(err => {
                console.error(err)
                sendResponse({data: {}, success: false})
                globalRequest = null
            })
    }

    function sleep(time) {
        return new Promise((resolve) => {
            setTimeout(resolve, time)
        })
    }

    async function createCollection(request, sender, sendResponse, attempts = 1) {
        //console.log(request)
        if (request.countRequest == 0) {
            // currently this sleep is largely not used. the function was converted to async
            // in the event we wanted to throttle after the initial api polling request (our first createCollection after init one)
            // but we have put that throttle in createCollection in payload.js which sends the requests to be executed here.
            await sleep(1500)
        }
        let url = `https://${SERVER}/social_curation/?createcollection=true&link_id=${request.linkId}&fabric_source=${EXTENSION_TYPE}`
        //console.log('Create collection attempt: ', attempts);
        if (globalRequest !== null) {
            if (attempts >= MAX_REQUEST_ATTEMPTS) {
                console.error('Maximum number of attempts reached.');
                sendResponse({data: {}, success: false})
                globalRequest = null
                return
            }
            setTimeout(() => {
                createCollection(request, sender, sendResponse)
            }, 1000)
            return
        }

        globalRequest = fetchWithTimeout(url, {
            method: 'GET',
            credentials: 'include'
        }).then(res => res.json())
            .then(r => {
                //console.log('R!!!')
                //console.log(r)
                //console.log(r.completion_percentage)
                // Block that sends up-to-date info about the number of tweets to the twitter page.
                if (r.stats) {
                    chrome.tabs.sendMessage(sender && sender.tab.id,
                        {
                            message: 'NEW_TOTAL_TWEETS',
                            total_tweets: r.stats.total_tweets,
                            linkid: request.linkId
                        });
                }
                if (r.errors && r.errors.length > 0) {
                    processErrors(r.errors, sender && sender.tab.id)
                }
                if (r.errors && r.errors[0]) {
                    if (r.stats && r.stats.total_tweets) {
                        sendResponse({
                            data: {
                                percentage: r.completion_percentage,
                                tweets: r.stats.total_tweets,
                                collectionURL: r.collection_url,
                                errors: r.errors[0].message
                            }, success: false
                        });
                    } else {
                        sendResponse({data: {errors: r.errors[0].message}, success: false});
                    }
                    console.log('sendResponse with error: ', r.errors)
                    // Set global request to null to prevent infinite recursion
                    globalRequest = null
                    return
                }
                if (r.completion_percentage < 100) {
                    //console.log('CREATE COLLECTION!!!')
                    //console.log(r)
                    sendResponse({
                        data: {
                            percentage: r.completion_percentage,
                            tweets: r.stats.total_tweets,
                            collectionURL: r.collection_url
                        }, success: false
                    })
                } else if (r.completion_percentage == 100 && r.collection_url == '') sendResponse({
                    data: {
                        percentage: r.completion_percentage,
                        tweets: r.stats.total_tweets
                    }, success: false
                })
                else sendResponse({
                        data: {
                            percentage: r.completion_percentage,
                            tweets: r.stats.total_tweets,
                            collectionURL: r.collection_url
                        }, success: true
                    })

                globalRequest = null

                // if(r.collection_url != '') {
                //   sendResponse({data: r, success: true})
                // }
                // else throw error
            })
            .catch(err => {
                console.log('ERROR!!!!')
                console.log(err)
                sendResponse({data: {errors: [{'message': err.message, 'name': err.name,}]}, success: false})
                globalRequest = null
            })
    }


    async function handleBackendInit(request, reason, tabId, is_retry = false, metadata = {}) {
        let url_value
        if (typeof request.data == "string") {
            url_value = request.data
        } else {
            url_value = request.data.href
        }
        // for specific sites, we want to send metadata in our request
        if (url_value.includes('bloomberg.com') || url_value.includes('usnews.com') || url_value.includes('forbes.com') ||
            url_value.includes('gamespot.com') || url_value.includes('washingtonpost.com') || url_value.includes('thestreet.com') ||
            url_value.includes('mcclatchydc.com') || url_value.includes('hollywoodreporter.com') || url_value.includes('miamiherald.com') ||
            url_value.includes('newsweek.com') || url_value.includes('jpost.com')) {
            chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
                chrome.tabs.sendMessage(tabs[0].id, {message: "GET_METADATA"}, async function (response) {
                    console.log('retrying with page metadata in request', response.page_metadata)
                    // call back this function with the new update request object
                    if (!is_retry) {
                        return handleBackendInit(request, reason, tabId, true, metadata = response.page_metadata)
                    }
                })
            });
            if (!is_retry) {
                await sleep(5000)
                return null
            }
        }
        noSubscriptionTab = null;
        noTwitterTab = null;
        return new Promise((resolve, reject) => {
            chrome.storage.local.get({'autorun': false}, storageObj => {
                if ((SUBSCRIBED_USER && storageObj.autorun) || reason === 'manual') {
                    const url = request.data // todo: should this be url_value ?
                    const urlHash = window['md5'](url)
                    let localUrl = localStorage.getItem(urlHash)
                    //console.log('INIT', request, reason, Date.now())
                    if (localUrl && !localUrl.link_id) {
                        localStorage.removeItem(urlHash)
                        localUrl = null;
                    }

                    if (!localUrl) {
                        //console.log('\tINIT', request)
                        let data = JSON.stringify({time: Date.now()})
                        localStorage.setItem(urlHash, data)
                        // todo: look into whether we should use let instead of var
                        var apiurl = `https://${SERVER}/social_curation/?init=true&url=${url}&fabric_source=${EXTENSION_TYPE}`
                        if (is_retry) {
                            var apiurl = `${apiurl}&metadata=true&article_title=${metadata.title}&pretty_url=${metadata.pretty_url}&article_date=${metadata.date}&article_description=${metadata.description}`.slice(0, 2000)
                        }

                        if (globalRequest !== null) {
                            const pendingRequestErrorMessage = 'Pending request. Waiting';
                            console.log(pendingRequestErrorMessage);
                            reject(pendingRequestErrorMessage);
                            return
                        }

                        globalRequest = fetchWithTimeout(apiurl, {credentials: 'include', tabId: tabId}, true)
                            .then(res => res.json())
                            .then(res => {
                                data = JSON.stringify({time: Date.now(), link_id: res.link_id})
                                localStorage.setItem(urlHash, data)
                                if (res.errors && res.errors.length > 0) {
                                    // if it's not a retry attempt and we have gotten a can't scrape metadata error, we will pass metadata in a new request
                                    if (!is_retry && (res.errors[0].code == 1003 || res.errors[0].code == 4003)) {
                                        // tell our content script to send the metadata
                                        chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
                                            chrome.tabs.sendMessage(tabs[0].id, {message: "GET_METADATA"}, function (response) {
                                                console.log('received 1003 or 4003 error response. retrying with page metadata in request')
                                                // call back this function with the new update request object
                                                handleBackendInit(request, reason, tabId, true, metadata = response.page_metadata)
                                            })
                                        });
                                    } else {
                                        processErrors(res.errors, tabId, urlHash)
                                    }
                                }
                                chrome.tabs.sendMessage(tabId, {message: 'API', data: res})
                                resolve(res)
                                globalRequest = null
                            })
                            .catch((e) => {
                                globalRequest = null
                                reject(e)
                            })
                    }
                }
            })
        })
    }

    async function fireBackendInit(request, reason, tabId) {
        let attempts = 0;
        const maxAttempts = 25;

        while (attempts++ < maxAttempts) {
            try {
                const response = await handleBackendInit(request, reason, tabId);
                return response;
            } catch (ex) {
            }
        }

        throw new Error('fireBackendInit failed too many times.');
    }

    function buildHref(url, dataUrl) {
        if (/theconversation.social/.test(url.href)) {
            url.searchParams.delete('url')
            url.searchParams.append('link_id', dataUrl.link_id)
            return url.href
        } else {
            if (dataUrl.link_id) {
                return `https://${SERVER}/social_curation/?link_id=${dataUrl.link_id}&newscomments=true&fabric_source=${EXTENSION_TYPE}`
            }
        }
    }

    function backendAPIProxy(request, sender, sendResponse) {
        let {url} = request.data
        url = new URL(request.data.url)
        if (/theconversation.social/.test(url.href) && url.searchParams.has('link_id') && globalRequest === null) {
            globalRequest = fetchWithTimeout(url.href, {
                method: request.data.method.toUpperCase(),
                credentials: 'include'
            })
                .then(res => res.json())
                .then(res => {
                    if (res.errors && res.errors.length > 0) {
                        processErrors(res.errors, sender && sender.tab.id)
                    }
                    sendResponse(res)
                    chrome.tabs.sendMessage(sender && sender.tab.id, {message: 'API', data: res})
                    globalRequest = null
                })
                .catch((e) => {
                    globalRequest = null
                })
        } else {
            const getUrl = /theconversation.social/.test(url.href) && url.searchParams.has('url') ? url.searchParams.get('url') : url
            const urlHash = window['md5'](getUrl)
            let localUrl = localStorage.getItem(urlHash)
            if (localUrl) {
                localUrl = JSON.parse(localUrl)
                if(!localUrl.hasOwnProperty('link_id')){
                    localStorage.removeItem(urlHash);
                    return;
                }
                const dataUrl = localUrl;
                const href = buildHref(url, dataUrl)

                chrome.tabs.getSelected(null, function (selectedTab) {
                    // don't run on non-active tab
                    if ((selectedTab.id === sender.tab.id && globalRequest === null) && (!href.includes('link_id=undefined'))) {
                        globalRequest = fetchWithTimeout(href, {
                                method: request.data.method.toUpperCase(),
                                credentials: 'include',
                                tabId: sender.tab.id
                            },
                            true)
                            .then(res => res.json())
                            .then(res => {
                                if (res.errors && res.errors.length > 0) {
                                    processErrors(res.errors, sender && sender.tab.id)
                                }
                                if (res.status == 'finished') {
                                    hashRemove(urlHash)
                                }
                                sendResponse(res)
                                chrome.tabs.sendMessage(sender && sender.tab.id, {message: 'API', data: res})
                                globalRequest = null
                            })
                            .catch(() => {
                                globalRequest = null
                            })
                    }
                })
            } else {
                fireBackendInit({data: getUrl}, 'manual', sender && sender.tab.id).then(result => {
                    //console.log('result', result)
                    let skipstorage = false
                    if (!result.errors) {
                        globalRequest = null
                        localUrl = null
                        localStorage.setItem(urlHash, JSON.stringify({time: Date.now(), link_id: result.link_id}))
                        //for (let i in errors) {
                        //if ((i.code === 4001) || (i.code === 4002) || (i.code === 4007))
                        //{skipstorage = true}
                        //}
                    }
                    sendResponse(result)
                }).catch(() => {
                    sendResponse(null);
                })
            }
        }
    }

    chrome.runtime.onInstalled.addListener(function (info) {
        if (info.reason === 'install') {
            chrome.storage.local.set({'freeTrialCounter': FREE_TRIAL_COUNT})
            chrome.storage.local.set({'installed-c': true});
            chrome.storage.local.set({'installed-sidebar': true});
            chrome.storage.local.set({'tw_backgroundColor': 'rgb(255, 255, 255)'});
            indicate_installed()
        }
    })
    chrome.runtime.onMessage.addListener(
        (request, sender, sendResponse) => {
            if (request.message === 'TAB_ID') {
                sendResponse({tabId: sender && sender.tab.id})
                return true
            } else if (request.message === 'COLLECTION_PAGE_ACCESSED') {
                sendResponse(request.linkId);
                return true;
            } else if (request.message === 'READING_LIST_ACCESSED') {
                updatingReadingListMetadata()
            } else if (request.message === 'READING_LIST') {
                chrome.storage.local.set({
                    reading_list: request.reading_list,
                })
                text = ''
                //text = '?readinglist='
                //var i;
                //for (i = 0; i < request.reading_list.length; i++) {
                //text += request.reading_list[i] + "&";
                //}
                // chrome.tabs.create({url: `chrome-extension://${chrome.runtime.id}/widget/reading_list.html${text}`}, function (tab) {
                // openReadingListTab = tab;
                // })
            } else if (request.message === 'RECOMMENDS_LIST') {
                chrome.storage.local.set({
                    recommends_list: request.recommends_list,
                })
            } else if (request.message === 'API') {
                checkIfValidDomain(sender.tab.url, () => {
                    backendAPIProxy(request, sender, sendResponse)
                })
            } else if (request.message == "ARTICLE_CHECK") {
                fetchWithTimeout(request.url, {}).then(res => res.json()).then(res => {
                    if (res && res.link_exists)
                        sendResponse({link_exists: true})
                    else
                        sendResponse({link_exists: false})
                })
            } else if (request.message === 'OPEN_NEW_TAB') {
                chrome.tabs.create({url: request.url})
            } else if ((request.message === 'linkOpen' && request.data.slice(0, 40).indexOf('twitter.com') === -1) && (request.data !== CURRENT_INIT_REQUEST_URL)) {
                checkIfValidDomain(request.data, () => {
                    saveCurrentInitRequestURL(request.data)
                    fireBackendInit(request, 'a.href click', sender && sender.tab.id).then(_ => {
                    })
                })
            }
            return true
        })

    function openNoSubscriptionPage() {
        chrome.tabs.create({url: `https://${SERVER}/ext_complete_registration/`}, function (tab) {
            noSubscriptionTab = tab;
        });
    }

    function openNoTwitterAcctPage() {
        extensionId = chrome.runtime.id;
        chrome.tabs.query({'url': `https://${SERVER}/ext_no_tw_acct/`}, function (tabs) {
            if (tabs.length > 0) {
                chrome.tabs.update(tabs[0].id, {'active': true});
            } else {
                chrome.tabs.create({'url': `https://${SERVER}/ext_no_tw_acct/`});
            }
            noTwitterTab = tab;
        });
    }

    function processErrors(errors, tabId, urlHash = null) {
        const notificationErrorsCodes = [1003, 4004, 4003, 4005, 4007];
        const limitReachedErrorCode = 4002;
        const noSubscriptionErrorCode = 4001;
        const noSubscriptionErrorCode_noTw = 4008;
        const noTwitterAuthenticated = 4007;
        for (let i in errors) {
            if (notificationErrorsCodes.includes(errors[i].code)) {
                chrome.storage.local.get({'autorun': false}, storageObj => {
                    if (storageObj.autorun) {
                        setTimeout(() => chrome.tabs.sendMessage(tabId, {
                            message: 'NOTIFICATION_ERROR',
                            data: errors[i]
                        }), AUTORUN_ERROR_SHOW_TIMEOUT);
                    } else {
                        chrome.tabs.sendMessage(tabId, {message: 'NOTIFICATION_ERROR', data: errors[i]})
                    }

                })
                //chrome.tabs.sendMessage(tabId, {message: 'NOTIFICATION_ERROR', data: errors[i]})
            } else if (errors[i].code === limitReachedErrorCode) {
                chrome.storage.local.get({'autorun': false}, storageObj => {
                    if (storageObj.autorun) {
                        setTimeout(() => {
                            chrome.storage.local.set({'autorun': false});
                            chrome.tabs.sendMessage(tabId, {message: 'LIMIT_REACHED_ERROR', data: errors[i]});
                        }, AUTORUN_ERROR_SHOW_TIMEOUT);

                    } else {
                        chrome.tabs.sendMessage(tabId, {message: 'LIMIT_REACHED_ERROR', data: errors[i]})
                        localStorage.removeItem(urlHash)
                    }

                })
                //chrome.tabs.sendMessage(tabId, {message: 'LIMIT_REACHED_ERROR', data: errors[i]})
            } else if (errors[i].code === noSubscriptionErrorCode) {
                //openNoSubscriptionPage();
                chrome.tabs.sendMessage(tabId, {message: 'NO_SUBSCRIPTION_ERROR', data: errors[i]})
                localStorage.removeItem(urlHash)
            } else if (errors[i].code === noSubscriptionErrorCode_noTw) {
                //openNoSubscriptionPage();
                chrome.tabs.sendMessage(tabId, {message: 'NO_SUBSCRIPTION_NO_TW_ERROR', data: errors[i]})
                localStorage.removeItem(urlHash)
            }
            if (errors[i].code === noTwitterAuthenticated) {
                openNoTwitterAcctPage();
                localStorage.removeItem(urlHash)
            }
        }
    }

    function clearOldData() {
        noSubscriptionTab = null;
        noTwitterTab = null;
        const time = 48 * 60 * 60 * 1000
        const data = Object.entries(localStorage).filter(item => ((Date.now() - item[1].time) > time)).map(item => item[0])
        data.forEach(item => {
            localStorage.removeItem(item)
        })
    }

    // check if string has more than 2 hyphens
    function checkHypen_b(t) {
        return (t.match(/-/g) || []).length >= 2
    }

    // check if string has more than 2 underscores
    function checkUnderscore_b(t) {
        return (t.match(/_/g) || []).length >= 2
    }

    // check if string has number
    function hasNumbers_b(t) {
        var regex = /\d/g;
        return regex.test(t);
    }

    // main function for checking final string of a url after the final slash (or the second to last if no text after last)
    function check_after_slash(str) {
        if (str.includes("user") || str.includes("search") || str.includes("account")) {
            return false
        } else {
            let last_index = str.lastIndexOf("/")
            if (last_index == -1) {
                return false
            } else {
                let target_string_b = str.substring(last_index + 1)
                if ((target_string_b == " ") || !(target_string_b)) {
                    target_string_b = str.split('/');
                    target_string_b = target_string_b[target_string_b.length - 2]
                }
                if (target_string_b.includes("index.html") || checkUnderscore_b(target_string_b) || checkHypen_b(target_string_b) || hasNumbers_b(target_string_b)) {
                    return true
                }
                return false
            }
        }
        return false
    }

    function countSlashCharacters(domainName) {
        const domainNameArray = domainName.split('').filter(item => item === '/')
        var count = domainNameArray.length
        return count
    }

    function countHyphenCharacters(domainName) {
        const domainNameArray = domainName.split('').filter(item => item === '-')
        var count = domainNameArray.length
        return count
    }

    function checkIfValidDomain(targetUrl, callbackFunc) {
        tagrgetUrl = targetUrl ? targetUrl : '';
        chrome.storage.local.get({'domainlist': [], 'autorun': false}, storageObj => {
                if (!storageObj.autorun) {
                    callbackFunc()
                    return
                }
                if (targetUrl.slice(0, 40).indexOf('twitter.com') !== -1) {
                    callbackFunc()
                    return
                }
                if (targetUrl.indexOf('theconversation.social') > -1) {
                    return
                }

                domainlist = storageObj.domainlist || []
                domainlist = domainlist.map(item => item.trim()).filter(item => item)
                // domainlist = domainlist;
                // localStorage.setItem("localStorageKey", JSON.stringify(domainlist));
                // Rules below for domain matching logic:
                // - Removes http:// and https://
                // - Adds . period in front of url
                // - Adds . period in front of domain from domain list
                // - Removes / trailing url domain to get rid of domains-matching in non-domain section.
                let containsSupportedDomain = domainlist.some(domain => {
                    let startPosition = targetUrl.indexOf('/') + 2; // This strips off the protocol
                    let urlWithoutProtocol = targetUrl.substr(startPosition);
                    let origin = urlWithoutProtocol.split('/')[0];
                    strippedProtocol = '.' + origin;
                    return strippedProtocol.indexOf('.' + domain) > -1;
                });

                if (containsSupportedDomain) {
                    if (targetUrl.indexOf('index.html') > -1) {
                        callbackFunc()
                    } else if (countSlashCharacters(targetUrl) >= 4 || countHyphenCharacters(targetUrl) >= 8) {
                        // for nbcnews.com, cbsnews.com, msnbc.com, for foxnews.com
                        if (check_after_slash(targetUrl)) {
                            callbackFunc()
                        }
                    } else if (targetUrl.indexOf('/news/') > -1 && countSlashCharacters(targetUrl) >= 3 && countHyphenCharacters(targetUrl) >= 8) {
                        // for comicbook.com
                        if (check_after_slash(targetUrl)) {
                            callbackFunc()
                        }
                    }
                        // else if (targetUrl.indexOf('comicbook.com') == -1 && targetUrl.indexOf('/news/') > -1 && countSlashCharacters(targetUrl) >= 3 && countHyphenCharacters (targetUrl) >= 8) {
                        //   // for comicbook.com - comment this in and the above rule out if needing domain specific
                        //   if(check_after_slash(targetUrl)){
                        //     callbackFunc()
                        //   }
                    // }
                    else if (targetUrl.indexOf('.html') > -1) {
                        // for nytimes.com, washingtonpost.com, latimes.com
                        callbackFunc()
                    } else if (targetUrl.indexOf('/story/') > -1 || targetUrl.indexOf('/article/') > -1) {
                        // for usatoday.com
                        callbackFunc()
                    } else if (targetUrl.indexOf('/2018/') > -1 || targetUrl.indexOf('/2019/') > -1 || targetUrl.indexOf('/2020/') > -1 || targetUrl.indexOf('/2021/') > -1 || targetUrl.indexOf('/2022/') > -1 || targetUrl.indexOf('/2023/') > -1) {
                        callbackFunc()
                    }
                }
            }
        )
    }

    function getSubscribedStatus(sendResponse) {
        fetchWithTimeout(`https://${SERVER}/check_automated_available_for_ext_user/`, {
            credentials: 'include'
        })
            .then(r => r.json())
            .then(resp => {
                if (resp.can_use_automated_option == true) {
                    chrome.storage.local.set({"user_subscribed": true});
                    SUBSCRIBED_USER = true;
                } else {
                    chrome.storage.local.set({"user_subscribed": false});
                    SUBSCRIBED_USER = false;
                }
                if (resp.set_options) {
                    chrome.storage.local.set(resp.set_options);
                }
            })
    }

    function indicate_installed() {
        fetchWithTimeout(`https://${SERVER}/indicate_installed/`, {
            credentials: 'include'
        })
    }

    function updatingReadingListMetadata(sendResponse) {
        // this simply tells the backend server that the user is accessing the reading list iframe and it will trigger background
        // metadata fetching for the stories in the next time they access the iframe (not the current open).
        fetchWithTimeout(`https://${SERVER}/update_reading_list_metadata/`, {
            credentials: 'include'
        })
            .then(r => r.json())
            .then(resp => {
                // do nothing
            })
    }


    async function getTitle(tweetIds, sendResponse) {
        fetchWithTimeout(`https://${SERVER}/get_mult_tweets_info/?tw_ids=${tweetIds}`, {
            credentials: 'include'
        })
            .then(r => r.json())
            .then(resp => {
                // do nothing
                sendResponse(resp)
            })
    }

    async function hashRemove(urlHash) {
        // remove local storage item for link
        await sleep(55000) // remove after 55 seconds
        chrome.storage.local.get({'autorun': false}, storageObj => {
            if (!storageObj.autorun) {
                localStorage.removeItem(urlHash)
            }
        })
    }

    // Try to clear each run
    clearOldData()
    // Try to clear each 15 minutes
    setInterval(clearOldData, 15 * 60 * 1000)
    // refresh loggged in status and subsribed user status
    setInterval(refreshLoggedInStatus, 1 * 60 * 1000) // every minute
    setInterval(getSubscribedStatus, 12 * 60 * 60 * 1000) // every 12 hours
    setInterval(loadDomainLists, 24 * 60 * 60 * 1000) // every 24 hours
    getSubscribedStatus(); // once on install
})()
window['SERVER'] = SERVER
