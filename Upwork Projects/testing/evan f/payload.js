////////////////////////////// Methods for iframe  ////////////////////////////////////////////////////////
if (typeof(list) === 'undefined') {
  list = []
}

var _collectionPageHeaderSelector = "main h2[role=heading][dir=ltr]" // created 12.3.22 when previous header selector changed

// these need to be vars as twitter is an SPA site and const will say it has already been declared
var ENABLE_TWITTER_NAV_HIDING = true;
var MAX_POLLING_REQUESTS_FOR_TWITTER = 50; // this is used in createCollection which polls every 2 seconds at the moment
var INSERT_TITLES_ON_TWEETS = true

var TW_BACKGROUND = "rgb(255, 255, 255)"
var TW_FONT_COLOR = "#000000"
var TW_THEME = "light"
                                          
// https://github.com/wpdevs/browser_extension/issues/180 <-- screenshot of class                                      
var TWITTER_INNER_TEXT_SELECTOR_WHITE = '.css-901oao.r-18jsvk2.r-37j5jr.r-a023e6.r-16dba41.r-rjixqe.r-bcqeeo.r-bnwqim.r-qvutc0'
var TWITTER_INNER_TEXT_SELECTOR_DARK = '.css-901oao.r-jwli3a.r-37j5jr.r-a023e6.r-16dba41.r-rjixqe.r-bcqeeo.r-bnwqim.r-qvutc0'
var TWITTER_INNER_TEXT_SELECTOR_DARKEST = '.css-901oao.r-1fmj7o5.r-37j5jr.r-a023e6.r-16dba41.r-rjixqe.r-bcqeeo.r-bnwqim.r-qvutc0'

var TWITTER_INNER_TEXT_SELECTOR = TWITTER_INNER_TEXT_SELECTOR_WHITE

  chrome.storage.local.get('tw_backgroundColor', async function (result) {
   TW_BACKGROUND = result.tw_backgroundColor
   if (TW_BACKGROUND != "rgb(255, 255, 255)"){
      TW_FONT_COLOR = "#FFFFFF"
      TW_THEME = "dark"
      TWITTER_INNER_TEXT_SELECTOR = TWITTER_INNER_TEXT_SELECTOR_DARK
      if (TW_BACKGROUND == "rgb(0, 0, 0)"){
          TW_FONT_COLOR = "#D9D9D9"
          TWITTER_INNER_TEXT_SELECTOR = TWITTER_INNER_TEXT_SELECTOR_DARKEST 
      }
    }
  })

// Fixing the white page issue on url change
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {

  if (request.message === 'DOM_URL_CHANGED_EVENT') {
    if( window.location.href.includes('twitter.com/') ){
      window['$'](document).off('newTweetsLoad') // remove previous new tweets listener if one exists (twitter.com is an spa site and they can add on each navigation)
      if( window.location.href.match('/timelines/[(0-9)]') ){

        console.log( 'In addCustomStylingForCollectionFix ')
        addCustomStylingForCollectionFix();
        emptyCollectionTitleTwitterLoad()
        replaceCollectionTitleTwitterLoad();
      }else{
        jQuery('#style-addCustomStylingForCollectionFix').remove()
        jQuery('.gl-share-button-div').remove()
        $(window).off("scroll")
      }
    }
  }
});

function addTwitterStyles() {
  var style = document.getElementById('extension-style');

  if (!style) {
    style = document.createElement('style');
    style.id = 'extension-style';

    document.head.appendChild(style);
  }

  var animationTime = '.5s';

  style.innerHTML = `
        @media (min-width: 0) and (max-width: 1900px) {
          [role="banner"] a[href="/compose/tweet"],
          body header[role="banner"],
          [role="banner"] [role="navigation"] a[role="link"]:not([href="/compose/tweet"]) [dir="auto"],
          [role="banner"] [aria-haspopup="true"] [dir="auto"],
          [role="banner"] a[href="/compose/tweet"] > div > span,
          [role="banner"] a[href="/compose/tweet"] > div > svg:not(.extension-svg),
          header[role="banner"] > div:first-child,
          header[role="banner"] > div:first-child > div:first-child,
          header[role="banner"] > div:first-child > div:first-child > div:first-child {
            transition: all ${animationTime} ease !important;
          }
          
          .body-collapsed [aria-labelledby="modal-header"][aria-modal="true"] {
            transform: translateX(-50%);
          }
          
          @keyframes resizeTweetButton {
            99% {
            }
            100% {
              width: 49px;
            }
          }
    
          .body-collapsed [role="banner"] a[href="/compose/tweet"] {
           min-width: 49px !important;
           min-height: 49px !important;
           height: 49px !important;
           padding: 2px !important;
           animation: resizeTweetButton ${animationTime} ease forwards;
          }
          
          @keyframes hidetext {
            99% {
            }
            100% {
              width: 0;
              overflow: hidden;
            }
          }
          
          .body-collapsed [role="banner"] [role="navigation"] a[role="link"]:not([href="/compose/tweet"]) [dir="auto"],
          .body-collapsed [role="banner"] a[href="/compose/tweet"] > div > span,
          .body-collapsed [role="banner"] [aria-haspopup="true"] [dir="auto"],
          .body-collapsed [role="banner"] a[href="/compose/tweet"] > div > svg:not(.extension-svg) {
            margin: 0 !important;
            padding: 0 !important;
            opacity: 0 !important;
            animation: hidetext ${animationTime} ease forwards;
          }
          
          .body-collapsed [role="banner"] [role="navigation"] {
            padding-left: 2px !important;
          }
          
          .body-collapsed [aria-labelledby="modal-header"][aria-modal="true"] {
            transform: translateX(-50%) !important;
          }
          
          .body-collapsed header[role="banner"] {
            flex-grow: 0 !important;
          }
          
          .body-collapsed header[role="banner"] > div:first-child > div:first-child {
            overflow: hidden !important;
          }
          
          .body-collapsed header[role="banner"] > div:first-child,
          .body-collapsed header[role="banner"] > div:first-child > div:first-child > div:first-child {
            width: 135px !important;
          }
          
          .body-collapsed header[role="banner"] > div:first-child > div:first-child > div:first-child {
            padding-left: 40px !important;;
          }
        }
    `;
}

function replaceButton() {
  function createElementFromHTML(htmlString) {
    var div = document.createElement('div');
    div.innerHTML = htmlString.trim();

    return div.firstChild;
  }

  var svgCode = `
        <svg class="extension-svg" viewBox="0 0 24 24" style="color: rgb(255, 255, 255); height: 1.5em; flex-shrink: 0; user-select: none; vertical-align: text-bottom; position: relative; max-width: 100%; fill: currentcolor; display: inline-block;"><g><path d="M8.8 7.2H5.6V3.9c0-.4-.3-.8-.8-.8s-.7.4-.7.8v3.3H.8c-.4 0-.8.3-.8.8s.3.8.8.8h3.3v3.3c0 .4.3.8.8.8s.8-.3.8-.8V8.7H9c.4 0 .8-.3.8-.8s-.5-.7-1-.7zm15-4.9v-.1h-.1c-.1 0-9.2 1.2-14.4 11.7-3.8 7.6-3.6 9.9-3.3 9.9.3.1 3.4-6.5 6.7-9.2 5.2-1.1 6.6-3.6 6.6-3.6s-1.5.2-2.1.2c-.8 0-1.4-.2-1.7-.3 1.3-1.2 2.4-1.5 3.5-1.7.9-.2 1.8-.4 3-1.2 2.2-1.6 1.9-5.5 1.8-5.7z"></path></g></svg>
    `;

  var btn = document.querySelector('a[href="/compose/tweet"]');
  var btnInner = document.querySelector('a[href="/compose/tweet"] > div[dir="ltr"]');

  var svg = btn.querySelector('.extension-svg');

  if (!svg) {
    var svg = createElementFromHTML(svgCode);
    btnInner.appendChild(svg);
  }
}

function twitterHideLeftPanel() {
  replaceButton();
  document.body.classList.add('body-collapsed');
}

function createIframe (rootElement, statusId) {
  let WIDTH
  if (window.location.hostname === 'twitter.com') {
    WIDTH = 620
  } else {
    WIDTH = 661
  }
  const iframe = document.createElement('iframe')
  iframe.src = `${EXT_URL + '/widget/index.html?parent_host_name=' + window.location.hostname + '&status_id=' + statusId}`
  iframe.setAttribute('allowTransparency', 'true');
  iframe.setAttribute("class", "main-iframe"); /* |Vyacheslav Shvets| add line */
  iframe.setAttribute('style', `position: fixed;
        top: 0;
        display: block;
        right: -${WIDTH}px;
        width: ${WIDTH}px;
        border: none;
        height: 100%;
        z-index: 2147483646;
		//*-webkit-box-shadow: -12px 0 48px 0 rgba(50,50,50,.20);*//
        //*-moz-box-shadow: 0px 0px 20px 9px rgba(0,0,0,0*//
	`)
  // window['$'](iframe).hide()
  rootElement.appendChild(iframe)
  setWidthToMainIframe();  /* |Vyacheslav Shvets| add line */
  return iframe
}

/* |Vyacheslav Shvets| Start */
function setWidthToMainIframe() {
  if ($(".main-iframe") === null) {
    return true;
  }

  let margin = 40;
  let width = 620;
  let twitterSidebarColumn = $("div[data-testid='sidebarColumn']");

  if (window.location.hostname === 'twitter.com') {
    let banner = document.querySelector('header[role="banner"]');

    if (window.innerWidth < 1480 && twitterSidebarColumn.length > 0) {
      width = window.innerWidth + margin - twitterSidebarColumn.offset().left;
      if (ENABLE_TWITTER_NAV_HIDING) {
        width += $(banner).width() - 140;
      }
    } else if (window.innerWidth >= 1600 && window.innerWidth <= 1900) {
      width = window.innerWidth - twitterSidebarColumn.get(0).getBoundingClientRect().x + margin + $(banner).width() - 140;
    } else {
      width = window.innerWidth - twitterSidebarColumn.get(0).getBoundingClientRect().x + margin;
    }
  } else {
    width = 661;
  }

  $(".main-iframe").css("width", width + "px");

  return true;
}

/**
 * Window resize event - Invoke setWidthToMainIframe function if unit is not animated
 * Unit is animated when positioned at the cented of the screen - iframe/unit has class "animated"
 *
 */
$(window).resize(function(){
  if(!jQuery("#overlay_Div1 iframe").hasClass("animated")){
    setWidthToMainIframe();
  }
});
/* |Vyacheslav Shvets| End */

function openWidget(statusId) {
  let iframe = document.querySelector('#overlay_Div1 iframe')
  if (!iframe || iframe == null) {

    addWidget(statusId)
    if (ENABLE_TWITTER_NAV_HIDING) {
      twitterHideLeftPanel();
    }
    iframe = document.querySelector('#overlay_Div1 iframe')
    shouldBeOpen = true
  }
  // const progress = window['$']('#curate_button_id').attr('data-progress-real') || 0
  // if (progress) {
  //   shouldBeOpen = false
  //   window['$'](iframe).animate({ 'right': '0' }, 'slow')
  // }
}

function addWidget (statusId) {
  var ov = document.createElement('div')
  ov.setAttribute('id', 'overlay_Div1')
  document.body.appendChild(ov)
  var styleEl = document.createElement('style')
  styleEl.innerHTML = '@keyframes move{' +
             'from{transform: translateX(0); opacity : 1;-webkit-box-shadow: 2px 2px 5px #D3D3D3;animation-duration: 0.15s;}' +
             'to{transform: translate(4px, 4px);' +
             '-webkit-box-shadow: px px 0px #D3D3D3;animation-duration: 0.3s;}' +
             '}'
  document.head.appendChild(styleEl)
  var g = document.querySelector('#overlay_Div1')
  const iframe = document.querySelector('#overlay_Div1 iframe')
  if (!iframe || iframe == null) {
    createIframe(g, statusId)
    // initClockAnimation()
  }
}

// function initClockAnimation () {
//   // Interval JOB
//   clearInterval(Progress.interval)
//   Progress.interval = setInterval(() => {
//     const nextTic = Progress.current + Progress.step
//     console.log('Timer tic', Progress.current, Progress.step)
//     Progress.current = Math.min(100, nextTic)
//     console.log('\tRESULT', Progress.current, nextTic)
//     // window['$']('#curate_button_id').attr('data-progress', Progress.current)
//     if (Progress.current === 100) {
//       loadingFinised()
//     }
//   }, Progress.stepTime)
// }

// function loadingFinised () {
//   clearInterval(Progress.interval)
//   console.log('\tcurrentPercentage STPOP')
//   Progress.interval = null
// }

////////////////////////////////////////////////////////////////////////////////////

window['Payload'] = (function () {
  console.log('Document ready.')
  console.log(window['SERVER'])
  // #twittercardsturnoff - modify in background.js
  // Background.js has a setting "USE_TOOLTIPS" which is the only one to be modified
  // for TRUE/FALSE to allow tooltips (custom or twitter cards) on or off with admin override.
  // Please do not modify setting below, it is a fallback that should always be set to false
  // in case there is a problem with background.js
  var USE_TOOLTIPS = false;
  // Should also be modified in backround.js only.
  var USE_DEFAULT_TWITTER_TOOLTIP = true;
  if( window.location.href.match('/timelines/[(0-9)]') ){

      console.log( 'In addCustomStylingForCollectionFix ')
      addCustomStylingForCollectionFix();
      emptyCollectionTitleTwitterLoad()
      replaceCollectionTitleTwitterLoad();
  }else{
    jQuery('#style-addCustomStylingForCollectionFix').remove()
    jQuery('.gl-share-button-div').remove()
  }
  // MODES:
  // 0 - insert on each new tweet
  // 1 - insert on mouseover
  // 2 - insert when user is not scrolling
  // 3 - insert on mouseover and user not scrolling
  const INSERT_ICON_AND_CATEGORY_MODE = 0;
  // This is a delay before performing code operations for settings 2 and 3
  // AFTER the scroll has finished
  const SCROLL_TIMER_PERIOD = 200;

  window['listeners_on'] = INSERT_ICON_AND_CATEGORY_MODE == 1 || INSERT_ICON_AND_CATEGORY_MODE == 3;
  var putTooltipOnTweetLoadOptional = function(addedNode) {}
  chrome.storage.local.get({usetooltips : null, defaulttwittooltip : null}, (items) => {
    if (!chrome.runtime.lastError) {
      USE_TOOLTIPS = items.usetooltips;
      USE_DEFAULT_TWITTER_TOOLTIP = items.defaulttwittooltip;

      if (USE_TOOLTIPS) {
        if (INSERT_ICON_AND_CATEGORY_MODE >= 2) {
          addScrollTimer();
        }

        if (USE_DEFAULT_TWITTER_TOOLTIP) {
          observeDefaultTooltip();
        }
        else {
          if(INSERT_ICON_AND_CATEGORY_MODE === 0) {
            putTooltipOnTweetLoadOptional = window['putTooltipOnTwitterPost'];
          }
          else if (INSERT_ICON_AND_CATEGORY_MODE === 1) {
            putTooltipOnTweetLoadOptional = function(addedNode) {
              $(addedNode).on('mouseenter', function () {
                window['putTooltipOnTwitterPost'](addedNode);
              });
              $(addedNode).on('mouseleave', function () {
                window['removeIcons'](addedNode);
              });
            }
          }
          else if (INSERT_ICON_AND_CATEGORY_MODE === 3) {
            putTooltipOnTweetLoadOptional = function(addedNode) {
              $(addedNode).on('mouseenter', function () {
                if (!isScrolling) {
                  window['putTooltipOnTwitterPost'](addedNode);
                }
              });
              $(addedNode).on('mouseleave', function () {
                window['removeIcons'](addedNode);
              });
            }
          }
          else if (INSERT_ICON_AND_CATEGORY_MODE === 2) {
            putTooltipOnTweetLoadOptional = function(addedNode) {
              window['putTooltipOnTwitterPost']();
              putTooltipOnTweetLoadOptional = function(addedNode) {};
            }
          }
        }
      }
    }
  })


  //////////////////////////////////////////////////// Methods for notification ////////////////////////////////////////////////////

  function setHandlerForLinks(){
    console.log('SET HANDLERS FOR LINKS')
    console.log($(".request-elem"))
    let allLinks = $(".request-elem")
    for(let i=0; i < allLinks.length; i++){
      if(allLinks[i].childNodes[5].innerText.startsWith('0 tweets') || allLinks[i].childNodes[5].innerText.includes('ERROR!')) {}
      else {
        var clickListener = function(e){
          const collectionURL = e.target.parentElement.getAttribute('collectionurl') || '';
          chrome.storage.local.set({'lastLinkId': e.target.id, collectionURL}, function() {
            console.log('lastLinkId is set to ', e.target.id );
            openWidget(e.target.parentElement.id.split('-')[0])
            let position = $('#overlay_Div1 iframe').css('right')
            if(position == '-620px') $('#overlay_Div1 iframe').animate({ 'right': '0' }, 'fast')
            removeListItemForClickedElement(e);
          });
        }
        allLinks[i].childNodes[1].addEventListener('click', clickListener);
        allLinks[i].childNodes[5].addEventListener('click', clickListener);
      }
    }
    // $(".request-link").click(function(e){
    //   openWidget()
    //   chrome.storage.local.set({'lastLinkId': e.target.id}, function() {
    //     console.log('lastLinkId is set to ', e.target.id );
    //   });
    //   let position = $('#overlay_Div1 iframe').css('right')
    //   if(position == '-620px') $('#overlay_Div1 iframe').animate({ 'right': '0' }, 'slow')
    // })
  }

  function updatePercentage(htmlId,response,id){
    // todo / note: we don't create list[i]errors if we get at least 1 tweet -- this might affect something else?
    for(let i in list){
      if(list[i].id == htmlId) {
        list[i].finished_with_no_results = false;
        list[i].linkId = id
        if(response.data.errors && !response.data.tweets) list[i].errors = response.data.errors
        else {
          if (response.data.percentage == 100 && !response.data.tweets) list[i].finished_with_no_results = true;
          list[i].percentage = parseInt(response.data.percentage)
          list[i].tweets = response.data.tweets
          list[i].collectionURL = response.data.collectionURL
        }
        // <span class='request-status'>${list[i].errors ? `ERROR!` : `[${list[i].tweets} tweets gathered |${list[i].percentage}%]`}  </span>
        $(`#${htmlId}-elem`).replaceWith(`
          <li id="${htmlId}-elem" class="request-elem" collectionUrl=${list[i].collectionURL}> 
            <span id="${list[i].linkId}" class="request-link">${list[i].text}</span> 
            <span class='request-remove'>X</span>
            <span class='request-status'>${list[i].errors ? `ERROR!` : list[i].finished_with_no_results ? `No Results | ${list[i].percentage}%` : `${list[i].tweets} tweets gathered | ${list[i].percentage}%`}  </span>
          </li>`
        )
      }
    }
  }

  function removeListItemForClickedElement(e) {
    const elemSuffix = '-elem';
        let id = e.target.parentElement.id.substring(0, e.target.parentElement.id.length - elemSuffix.length);
        // if(e.target.parentElement.innerText.includes('ERROR')) text = e.target.parentElement.innerText.replace('X','').trim().split('[')[0].replace('\n','').split('\n')[0]
        // else text = e.target.parentElement.innerText.replace('X','').trim().split('[')[0].replace('\n','')

        for(i in list){
          if(list[i].id === id){
            list.splice(i, 1);
          }
        }
        if(list.length == 0){
          $(".request-elem").fadeTo('fast',0.2)
          $("#notification").
          animate({height:HEIGHT_NOTIFICATION},500, () => {
            $(".request-elem").remove()
            $('#list-notification').hide()
            $('.expand').hide()
          });
          removeNotificationList();
        }
        else renderList()
  }

  function setHandlerRemove(){
    $(".request-remove")
      .click(function(e){
        removeListItemForClickedElement(e);
        e.preventDefault();
        if(list.length == 0 ){
          removeNotificationList();
        }
      });
  }

  function newHeightRender(newHeight,duration){
    $("#notification").animate({height:newHeight},duration, ()=>{
      $(".request-elem").remove()
      // <span class='request-status'>${list[i].errors ? `ERROR!` : `[${list[i].tweets} tweets/${list[i].percentage}%]`}  </span>
      for(let i in list){
        $("#list-notification").append(`
        <li id="${list[i].id}-elem" class="request-elem" collectionUrl=${list[i].collectionURL}> 
          <span id="${list[i].linkId}" class="request-link">${list[i].text}</span>
          <span class='request-remove'>X</span>
          <span class='request-status'>${list[i].errors ? `ERROR!` : list[i].finished_with_no_results ? `No Results | ${list[i].percentage}%` : `${list[i].tweets} tweets gathered | ${list[i].percentage}%`}  </span>
        </li>`)
      }
      $('#list-notification').show()

      setHandlerForLinks()
      setHandlerRemove()
    });
  }

  function renderList(){
    let needHeight = HEIGHT_NOTIFICATION + list.length * HEIGHT_EACH_REQUEST
    $(".request-elem").remove()
    newHeightRender(needHeight,500)
    $("#extensionNotifications").animate({bottom: `${needHeight + 50}px`}, 500);
  }

  function sleep (time) {
    return new Promise((resolve) => {
      setTimeout(resolve, time)
    })
  }

  function updateLogo(htmlId,str){
    // this dov may have intentional been broken
    $(`#${htmlId}`).replaceWith(`<div data-twitter-id="lillyspickup" id="${htmlId}" style="display: flex; float:right;" class="related-button" has-listener="true">
                                          <img src="${EXT_URL}/c-icon.png" style="width: 15px;height: 15px;margin-top: 4px;">
                                          <dov style="color: grey;margin-top: 4px;text-transform: none;margin-left: 3px;font-family:system-ui;font-weight:100;">
                                            ${str}
                                          </dov>
                                        </div>`)
  }


  function createCollection(htmlId,id, countRequest=0) {
    chrome.runtime.sendMessage({
      method: 'createCollection',
      linkId: id,
      countRequest: countRequest
    }, async (response) => {
      console.log('RESPONSE !!!')
      console.log(response)
      if(response.data.errors && !response.data.tweets){
        if (!response.data.errors[0].message.includes('aborted')){
          countRequest = 0
          updatePercentage(htmlId,response,id)
          updateLogo(htmlId,'Failed')
          requests.queue.pop()
          requests.failed.push(1)
        } else {
            console.log('brad printing 403 error', response.data.errors[0])
            // this is usually when server has gone down, and we have no response so we timeout -- abort request. we have no error in error array.
            // it is the catch error at the end of the background.js createCollection function.
            countRequest ++
            if (countRequest < MAX_POLLING_REQUESTS_FOR_TWITTER){
              await sleep(10000) // 10 seconds sleep before doing a new one. give server more time to recover
              createCollection(htmlId,id,countRequest)
            }
        }
      }
      else{
        if(!response.success && countRequest < MAX_POLLING_REQUESTS_FOR_TWITTER) {
          countRequest++
          // updatePercentage(htmlId,response,id)
          if(response.data.percentage == 100) {
            requests.queue.pop()
            requests.failed.push(1)
			if (!response.data.tweets){
			    updatePercentage(htmlId,response,id)
			    updateLogo(htmlId,'No Results')
			}
			else {
			    updatePercentage(htmlId,response,id)
			    updateLogo(htmlId,'Success but with errors')
			    setHandlerForLinks()
			}
            countRequest = 0
          }
          else{
            updatePercentage(htmlId,response,id)
            //if(countRequest == 9 && response.data.collectionURL != "") countRequest = 0 // This logic is causing the loop to begin again on count 9. Commenting out.
            setHandlerForLinks();
            await sleep(2000)
            createCollection(htmlId,id,countRequest)
          }
          setHandlerForLinks();
        }
        // over the `80 max retry limit and no tweets
        else if(!response.success && countRequest >= MAX_POLLING_REQUESTS_FOR_TWITTER && !response.data.tweets) {
          for(let i in list){
            if(list[i].id == htmlId) list[i].percentage = 0
          }
          countRequest = 0
          requests.queue.pop()
          requests.failed.push(1)
          updateLogo(htmlId,'No Tweets and Timed Out In Polling')
        }
        // over the 180 max retry limit but at least one tweet
        else if(!response.success && countRequest >= MAX_POLLING_REQUESTS_FOR_TWITTER && response.data.tweets) {
          countRequest = 0
          updatePercentage(htmlId,response,id)
          requests.queue.pop()
          requests.success.push(1)
          updateLogo(htmlId,'Success but Timed Out')
          setHandlerForLinks()
        }
        else{
          // Update percentage
          updatePercentage(htmlId,response,id)

          if(response.data.percentage < 100){
            await sleep(2000)
            createCollection(htmlId,id,countRequest)
          }
          else{
            requests.queue.pop()
            requests.success.push(1)
            updateLogo(htmlId,'Success')
            if (countRequest < 3){ 
              const collectionURL = response.data.collection_url || '';
              chrome.storage.local.set({'lastLinkId': id, collectionURL}, function() {
                openWidget(htmlId)
                let position = $('#overlay_Div1 iframe').css('right')
                if(position == '-620px') $('#overlay_Div1 iframe').animate({ 'right': '0' }, 'fast')
              })
            }
          }
          setHandlerForLinks()
          countRequest = 0
        }
      }

      if(document.getElementById('notification').style.display == 'none'){
       updateLogo(htmlId,'Canceled')
        return
      }

      // $("#text-notification").replaceWith(`<span id='text-notification'>${requests.queue.length} requests in process</span>`);
      if(requests.queue.length == 0) $("#text-notification").replaceWith(`<span id='text-notification'>Related conversation ready to view</span>`);
      else  $("#text-notification").replaceWith(`<span id='text-notification'>Still looking</span>`);


      // if(!document.getElementById('result-notification')){
      //   $("#notification").fadeIn("slow")
      //   $('#container-noification').append(`<span id='result-notification'>success: ${requests.success.length},  failed: ${requests.failed.length}</span>`);
      // }
      // else{
      //   $("#result-notification").replaceWith(`<span id='result-notification'>success: ${requests.success.length},  failed: ${requests.failed.length}</span>`);
      // }

      // if(requests.success.length > 1) $('.expand').show()

        // if(!hasHandler){
        //   hasHandler = true
        //   $(".expand").click((e)=>{
        //     let height = $("#notification").height()
        //     if(height != HEIGHT_NOTIFICATION) {
        //       $(".request-elem").fadeTo('fast',0.2)
        //       $("#notification").animate({height:HEIGHT_NOTIFICATION},500, () => {
        //         $(".request-elem").remove()
        //         $('#list-notification').hide()
        //       });
        //     }
        //     else renderList()
        //   })
        // }

    })
  }
  ////////////////////////////////////////////////////////////////////////////////////////////////////////

  //////////////////////////////////////////////////// Create notification ////////////////////////////////////////////////////
  const HEIGHT_NOTIFICATION = 25
  const HEIGHT_EACH_REQUEST = 20

  var requests = {
    queue:[],
    success:[],
    failed:[]
  }
  var hasHandler = false

  const notifContainer = document.createElement('div')
  const secondContainer = document.createElement('div')
  const notifClose = document.createElement('span')
  const listRequests = document.createElement('ul')
  const notifExpand = document.createElement('span')

  notifClose.className = 'close-notif'
  notifClose.innerText = 'x'
  notifExpand.className = 'expand'
  notifExpand.style = 'display: none'
  notifContainer.id = 'notification'
  notifContainer.className = 'ext_conversation_twitter'
  secondContainer.id = 'container-noification'
  listRequests.id = 'list-notification'
  notifContainer.style = 'display: none'
  listRequests.style = `display:none;
                        margin: 0;
                        list-style: none;
                        padding: 0;`
  secondContainer.style = `bottom: 0px;
                          position: absolute;
                          width: 97%;`
  notifContainer.appendChild(secondContainer)
  notifContainer.appendChild(listRequests)
  secondContainer.appendChild(notifClose)
  secondContainer.appendChild(notifExpand)
  document.body.appendChild(notifContainer)

  function removeNotificationList() {
    $("#notification").animate({height:HEIGHT_NOTIFICATION},100, () => {
      $(".expand").off('click')
      $('.expand').hide()
      hasHandler = false
      list = []
      $("#text-notification").remove()
      $(".request-elem").remove()
      $("#result-notification").remove()
      $("#list-notification").hide()
      $("#notification").hide()
    })
    for(field in requests){
      requests[field] = []
    }
  }
  $(".close-notif").click(function(e){
        removeNotificationList();
  });

  $("#notification").click(function(e){
    if (e.target.id != 'text-notification') {
      return;
    }
    if(list.length === 1 && !list[0].errors){
      const collectionURL = list[0].collectionURL || '';
      chrome.storage.local.set({'lastLinkId': list[0].linkId, collectionURL}, function() {
        openWidget(list[0].id)
        let position = $('#overlay_Div1 iframe').css('right')
        if(position == '-620px') $('#overlay_Div1 iframe').animate({ 'right': '0' }, 'fast')
        removeNotificationList();
      });
    }
  });
  $( "#notification" ).off('mouseover');
  $( "#notification" ).mouseover(function() {
    if($("#notification").height() == HEIGHT_NOTIFICATION && list.length > 0){
      renderList()
    }
  });

  $( "#notification" ).off('mouseleave');
  $( "#notification" ).mouseleave(function() {
    let height = $("#notification").height()
    if(height != HEIGHT_NOTIFICATION) {
      $(".request-elem").fadeTo('fast',0.2)
      $("#notification").animate({height:HEIGHT_NOTIFICATION},500, () => {
        $(".request-elem").remove()
        $('#list-notification').hide()
      })
      $("#extensionNotifications").animate({bottom: '70px'}, 500);
    }
  });
// BUGS IN NEW DESIGN!!!
  // document.getElementsByTagName('body')[0].addEventListener("keydown", event => {
  //   console.log($('.css-1dbjc4n section')[0].childNodes[1].firstChild.firstChild)
  //   $('.css-1dbjc4n section')[0].childNodes[1].firstChild.firstChild.style.cssText = 'padding-top:0px !important; padding-bottom: 400px !important;'
  //   console.log($('.css-1dbjc4n section')[0].childNodes[1].firstChild.firstChild)
  // });

/////////////////////////////////////////////////////////////////////////////////////////////

  var isScrolling = false;

  function onScrollingTimer() {
    isScrolling = false;
    if (INSERT_ICON_AND_CATEGORY_MODE === 2) {
      window['putTooltipOnTwitterPost']();
    }
  }

  function addScrollTimer() {
    var scrollTimer = window.setTimeout(onScrollingTimer, SCROLL_TIMER_PERIOD);
    $(window).scroll(function() {
      isScrolling = true;
      clearTimeout(scrollTimer);
      scrollTimer = window.setTimeout(onScrollingTimer, SCROLL_TIMER_PERIOD);
    });
  }


  if (window.location.hostname === window['SERVER']) {
    return
  }
  if (document.location.href.indexOf(window['SERVER'] + '/recipient/') !== -1) {
    return
  }


  if (window.location.hostname === 'twitter.com') {
    window['$'](document).off('newTweetsLoad') // remove previous new tweets listener if one exists (twitter.com is an spa site and they can add on each navigation)
    addTwitterStyles();
    ////////////////////////////  Styles for iframe  ////////////////////////////////////////////////////
    // var g = document.createElement('div')
    // g.setAttribute('id', 'overlay_Div1')
    // document.body.appendChild(g)
    // var styleEl = document.createElement('style')
    // styleEl.innerHTML = '@keyframes move{' +
    //        'from{transform: translateX(0); opacity : 1;-webkit-box-shadow: 2px 2px 5px #D3D3D3;animation-duration: 0.15s;}' +
    //        'to{transform: translate(4px, 4px);' +
    //        '-webkit-box-shadow: px px 0px #D3D3D3;animation-duration: 0.3s;}' +
    //        '}'
    // document.head.appendChild(styleEl)
    ////////////////////////////////////////////////////////////////////////////////////////////////////////

    chrome.runtime.connect().onDisconnect.addListener(function () {
      var needUpdateCharlotteIcons
      window['$'](document).on('newTweetsLoad', function (e, addedNode) {
        needUpdateCharlotteIcons = false
        window['putRelatedConversation'](addedNode)
        if (INSERT_TITLES_ON_TWEETS){
          window['putRelatedTitle'](addedNode)
        }
        putTooltipOnTweetLoadOptional(addedNode);
      })

      if (chrome.runtime.lastError) {
        needUpdateCharlotteIcons = true
        window['$'](document).on('newTweetsLoad', function (e, addedNode) {

          const ourButtons = $('.related-button')//e.target.querySelectorAll('.related-button') || ''

          ////////////////////////////  NEW DESIGN Styles for buttons on each tweet  ////////////////////////////////////////////////////
          if ($('.r-1mdbhws').length > 0) {
            let divs = $('.r-1mdbhws')
            // let shareButtons = $('[data-testid="caret"]').parent()
            // In case the above selector breaks, the above line may allow it to work. also the line below which is for the right corner
            // dropdown also seems to work, though it's not desired to use versus the more specific selector below.
            // let shareButtons = $('.css-1dbjc4n.r-18u37iz.r-1h0z5md.r-1joea0r')
            let shareButtons = $('.css-1dbjc4n.r-18u37iz.r-1wtj0ep.r-156q2ks.r-1mdbhws')
			if (!shareButtons){
				let shareButtons = $('[data-testid="caret"]').parent()	
			}
			if (!shareButtons){
			    let shareButtons = $('.css-1dbjc4n.r-18u37iz.r-1wtj0ep.r-1s2bzr4.r-1mdbhws')	
			}
            for (let i = 0; i < divs.length; i++) {
              if (!divs[i].hasAttribute('expanded')) {
                divs[i].setAttribute('expanded', true)
                divs[i].style.cssText = 'max-width:525px;'
              }
              if (shareButtons[i]){
                 if (!shareButtons[i].hasAttribute('expanded')) {
                   shareButtons[i].setAttribute('expanded', true)
                   // shareButtons[i].style.cssText = 'width:60px'
                 }
			  }
            }
          }
          ////////////////////////////////////////////////////////////////////////////////////////////////////////
          function getStatusId(linkArray) {
            let statusId;
            for (let ind in linkArray) {
              if (linkArray[ind].hasAttribute('href') && linkArray[ind].href.split('status').length > 1) {
                statusId = linkArray[ind].href.split('status')[1].substring(1)
                statusId = statusId.split('/')[0]
                break;
              }
            }
            return statusId
          }


          if (ourButtons.length) {
            for (var i = 0; i < ourButtons.length; i++) {
              if (!ourButtons[i].getAttribute('has-listener')) {
                ourButtons[i].setAttribute('has-listener', true)

                ourButtons[i].addEventListener("click", function (e) {
                  e.preventDefault()
                  let permalink;
                  let text;
                  let el = $(e.target).parent().parent().parent().parent().parent();
                  let statusId;
                  let twitterId;

                  let nameSelector = '.css-901oao.css-bfa6kz.r-18u37iz.r-1qd0xha.r-ad9z0x.r-bcqeeo.r-qvutc0 span';
                  let linkArray = el.find('a').toArray();
                  statusId = getStatusId(linkArray);
                  if (!statusId) {
                    linkArray = el.parent().find('a').toArray();
                    statusId = getStatusId(linkArray);
                  }
                  twitterId = el.find(nameSelector).first().text().replace('@', '').toLowerCase()
                  if (!twitterId){
                    twitterId = 'i'
                  } // todo for permalink page get name selector for that as it will fail with the one above

                  let buttonElement = $(e.target).parent();
                  //TODO: get id; get data-twitter-id
                  permalink = `https://twitter.com/i/status/${statusId}`;
                  //text = buttonElement.closest('article').find('.css-901oao.r-1qd0xha.r-16dba41.r-ad9z0x.r-bcqeeo.r-bnwqim.r-qvutc0')[0].innerText;
                  text = buttonElement.closest('article').find(TWITTER_INNER_TEXT_SELECTOR)
                  if (text[0]){
                    text = text[0].innerText;
                  } else { 
                    // now we begin to handle cases where user has changed their twitter background and hasnt reloaded page (therefore payload has old TWITTER_INNER_TEXT_SELECTOR info)
                    text = buttonElement.closest('article').find(TWITTER_INNER_TEXT_SELECTOR_DARK)
                    if (text[0]){
                      text = text[0].innerText;
                    } else {
                      text = buttonElement.closest('article').find(TWITTER_INNER_TEXT_SELECTOR_WHITE)
                      if (text[0]){
                        text = text[0].innerText;
                      } else {                    
			text = buttonElement.closest('article').find(TWITTER_INNER_TEXT_SELECTOR_DARKEST)
			if (text[0]){
                          text = text[0].innerText;
			} else {         
			  text = buttonElement.closest('article').find('.css-1dbjc4n.r-1s2bzr4')
			  text = text[0].innerText;
			  }
                      }
                    }
                  }
                  if (text.indexOf('More') != -1) {
                    text = text.split('More')[1];
                  }
			  
                  //text = buttonElement.closest('article').find('.css-4rbku5.css-901oao.r-4iw3lz.r-1xk2f4g.r-109y4c4.r-1udh08x.r-wwvuq4.r-u8s1d.r-92ng3h')[0].innerText;
                  if (text.indexOf('More') != -1) {
                    text = text.split('More')[1];
                  }//css-1dbjc4n.r-1loqt21.r-18u37iz.r-1ny4l3l.r-1udh08x.r-1qhn6m8.r-i023vh.r-o7ynqc.r-6416eg

                  // if (document.querySelector('.css-1dbjc4n.r-18u37iz.r-1wtj0ep.r-zl2h9q.charlotte-modified') != null) {
                  //   // e.preventDefault()
                  //   permalink = `${e.path[5].childNodes[1].querySelectorAll('a')[1]}`
                  //   if(!permalink.match(/\\*\/status\/\d+/)) {
                  //     console.warn('Found a permalink without status/1234, scrapping the second a tag')
                  //     permalink = `${e.path[5].childNodes[1].querySelectorAll('a')[2]}`
                  //     console.log('Found: ', permalink)
                  //   }
                  //   text = e.path[5].childNodes[1].querySelectorAll('.css-901oao.r-hkyrab.r-1qd0xha.r-a023e6.r-16dba41.r-ad9z0x.r-bcqeeo.r-bnwqim.r-qvutc0')[0].innerText
                  // } else {
                  //   // permalink = `https://twitter.com${e.path[6].dataset.permalinkPath}`
                  //   text = e.path[5].innerText.split('More')[1]
                  // }
                  if (text.includes('Retweete')) {
                    text = text.split('\n')[4]
                  }

                  text = text.substring(0, 20) + '...';
                  text = text.trim().replace('\n', '');
                  requests.queue.push(1)
                  let kek = statusId;

                  list.push({
                    id: kek,
                    text: text,
                    tweets: 0,
                    percentage: 0,
                    linkId: 0,
                    collectionURL: ''
                  })

                  let height = $("#notification").height()
                  let needHeight = HEIGHT_NOTIFICATION + list.length * HEIGHT_EACH_REQUEST

                  if (height != HEIGHT_NOTIFICATION || list.length == 1) {
                    newHeightRender(needHeight, 100)
                  }

                  if (!document.getElementById('text-notification')) {
                    $("#notification").fadeIn("slow")
                    // $("#container-noification").append(`<span id='text-notification'>${requests.queue.length} requests in process</span>`);
                    $("#container-noification").append(`<span id='text-notification'>Starting to gather related conversation</span>`);
                  } else {
                    // $("#text-notification").replaceWith(`<span id='text-notification'>${requests.queue.length} requests in process</span>`);
                    if (requests.queue.length == 0) $("#text-notification").replaceWith(`<span id='text-notification'>Related conversation ready to view/span>`);
                    else $("#text-notification").replaceWith(`<span id='text-notification'>Still looking</span>`);
                  }

                  let elem = $(this).context
                  $(this).replaceWith(`<div id="${statusId}">
                                          <div id="loader" ">
                                            <div class="swirl-big" style="float:right; background-image: url(${EXT_URL}/spinner_200.svg)"></div>
                                          </div>
                                        </div>`);

                  chrome.runtime.sendMessage({
                        method: 'socialCurationInit',
                        linkTitle: permalink
                      }, (response) => {
                        list[list.length - 1].linkId = response.data
                        console.log('\n\nRESPONSE WITH LINK ID:', response.data)
                        createCollection(statusId, response.data) // <------ REQUEST
                      }
                  )

                });
              }
            }
            // console.log(ourButtons)
          }


          needUpdateCharlotteIcons = true
        })
//        chrome.runtime.sendMessage({
//          method: 'checkShowOnTwitter'
//        }, function (response) {
//          if (response.result) {
//            if (needUpdateCharlotteIcons) {
//              needUpdateCharlotteIcons = false
//              if (window['useDefaultTwitterTooltip']) {
//                if (!isScrolling) {
//                  window['twitterInsertDefaultTooltip']();
//                }
//              }
//              else {
//                window['twitterTooltipEntryPoint']()
//              }
//            }
//            window['putRelatedConversation']()
//          }
//        })
      } else {
        window['$'](document).off('newTweetsLoad')
      }
      needUpdateCharlotteIcons = true
    })
  }
  observeNewTweets();


  // else {
  //   // setInterval(function () {
  //     chrome.runtime.connect().onDisconnect.addListener(function () {
  //       var needUpdateCharlotteIcons
  //       if (chrome.runtime.lastError) {
  //         needUpdateCharlotteIcons = true
  //         window['$'](document).bind('DOMSubtreeModified', function () {
  //           needUpdateCharlotteIcons = true
  //         })
  //         chrome.runtime.sendMessage({
  //           method: 'checkShowForAllWebsite'
  //         }, function (response) {
  //           if (response && response.result) {
  //             var checkArr = response.domainlist
  //             var checkDo = window.location.hostname
  //             for (var i = 0; i < checkArr.length; i++) {
  //               if (checkDo.indexOf(checkArr[i].split('.')[0]) !== -1) {
  //                 if (needUpdateCharlotteIcons) {
  //                   needUpdateCharlotteIcons = false
  //                   window['NewputTooltipOnWebsitePost']()
  //                 }
  //               }
  //             }
  //           }
  //         })
  //       } else {
  //         window['$'](document).unbind('DOMSubtreeModified')
  //       }
  //       window['$'](document).bind('DOMSubtreeModified', function () {
  //         needUpdateCharlotteIcons = false
  //       })
  //     })
  //   // }, 1000)
  //   // ..
  //   // setInterval(function() {
  //   //     chrome.runtime.sendMessage({method: "checkShowForAllWebsite"}, function(response) {
  //   //         console.log(response.result);
  //   //         var needUpdateCharlotteIcons = true;
  //   //         if (response.result) {
  //   //             if (needUpdateCharlotteIcons) {
  //   //                 needUpdateCharlotteIcons = false;
  //
  //   //                 console.log('Update tooltip on Webpage.');
  //   //                 NewputTooltipOnWebsitePost();
  //   //             }
  //   //         }
  //   //     });
  //   // }, 5000);
  //
  //   // setInterval(function() {
  //   //     chrome.runtime.sendMessage({method: "checkShowForAllWebsite"}, function(response) {
  //   //         console.log(response.result);
  //   //         if (response.result) {
  //   //             NewputTooltipOnWebsitePost();
  //   //         }
  //   //     });
  //   // }, 1000);
  // }
})()

function observeDefaultTooltip() {
  const callback = function(mutationsList)  {
    for (let mutation of mutationsList) {
      if (mutation.type === 'childList') {
        if (mutation.addedNodes.length > 0) {
          window['addToDefaultTooltip']({srcElement : mutation.addedNodes[0]});
        }
      }
    }
  }

  function addObserverWhenTwitterLoad() {
    //var target = document.querySelector('#react-root > div[data-reactroot] > div > h2 + div');
    var target = document.querySelector('#react-root > div > div > h2 + div');
    if(!target) {
      //The twiiter container node not loaded yet. Wait 500ms and try again
      window.setTimeout(addObserverWhenTwitterLoad,500);
      return;
    }
    const observer = new MutationObserver(callback);
    observer.observe(target, {attributes: false, childList: true, subtree: false});
  }

  addObserverWhenTwitterLoad();
}

function observeNewTweets() {
  var newTweetsEvent = window['$'].Event('newTweetsLoad');
  const callback = function(mutationsList, observer) {
    for (let mutation of mutationsList) {
      if (mutation.type === 'childList'
          && $(mutation.addedNodes).find('article').length > 0
      ) {
        window['$'](document).trigger(newTweetsEvent, $(mutation.addedNodes[0]).find('article')[0]);
      }
    }
  };


  const observer = new MutationObserver(callback);

  function addObserverWhenTwitterLoad() {
    var tmpArt = document.querySelector("main div[data-testid=\"primaryColumn\"] section > div.css-1dbjc4n article");
    if(!tmpArt) {
      //The twiiter container node not loaded yet. Wait 500ms and try again
      window.setTimeout(addObserverWhenTwitterLoad,500);
      return;
    }
    var target = document.querySelector("main div[data-testid=\"primaryColumn\"] section > div.css-1dbjc4n > div");

    const config = {
      attributes: false,
      childList: true,
      subtree: false,
    };
    observer.observe(target, config);

    $('article').each(function () {
      window['$'](document).trigger(newTweetsEvent, $(this)[0]);
    });
  }
  addObserverWhenTwitterLoad();
}


function emptyCollectionTitleTwitterLoad() {


    //var collection_decription = document.querySelector("main section[role=\"region\"] > div h1[role=\"heading\"][dir=\"auto\"] + div + div") // retire 12.3.22 
    var target = document.querySelector(_collectionPageHeaderSelector);
    if (!target) {
        //The twiiter container node not loaded yet. Wait 25ms and try again
        window.setTimeout(emptyCollectionTitleTwitterLoad, 25);
        return;
    }
    // var collection_decription = document.querySelector("main section[role=\"region\"] > div h1[role=\"heading\"][dir=\"auto\"] + div + div") // retire 12.3.22
    var collection_decription = document.querySelector(_collectionPageHeaderSelector)
    if( collection_decription ){
      document.querySelector('main section div h1.css-4rbku5.css-901oao').style.color = '#fff';
      document.querySelector('main section div h1.css-4rbku5.css-901oao').style.height = '0px';
      //var collection_selector = document.querySelector("main h2[role=\"heading\"][dir=\"auto\"]").innerHTML = ""; // retire 11.3.22 
      var collection_selector = document.querySelector(_collectionPageHeaderSelector).innerHTML = "";

    }else{
      //document.querySelector("main h2[role=\"heading\"][dir=\"auto\"]").style.display = 'block';
    }
    
    
}

function addHeaders(collection_dict) {
	$("a > time").each(function (i, element) {
		const tweetScanStatus = $(element).attr("tweetscanned");
		const statusURL = $(this).parent("a").attr("href");
		const statusId = statusURL.split("/status/")[1];
		let role = "";
		for (let key in collection_dict) {
			if (collection_dict[key] == statusId) {
				role = key;
			}
		}
		if (!tweetScanStatus && role) {
			const tweetDiv = $(this).closest("article").parent("div");

			let borderStyle = `${$(tweetDiv.parent("div")).css(
				"border-bottom-width"
			)} solid ${$(tweetDiv.parent("div")).css("border-bottom-color")}`;

      let contentClass = "";
      // Dim Theme on Twitter
      if($("h2[aria-level='2']").hasClass("r-jwli3a")){
        contentClass = "r-jwli3a";
      }
      // Lights out Theme on Twitter
      if($("h2[aria-level='2']").hasClass("r-1fmj7o5")){
        contentClass = "r-1fmj7o5";
      }
      // Default Theme on Twitter
      if($("h2[aria-level='2']").hasClass("r-qvutc0")){
        contentClass = "r-qvutc0";
      }
      // console.log($("h2[aria-level='2']").hasClass("r-jwli3a"))
      // console.log($("h2[aria-level='2']").hasClass("r-1fmj7o5"))
      // console.log($("h2[aria-level='2']").hasClass("r-18jsvk2"))
      let bgColor="transparent";
      if(contentClass == "r-1fmj7o5"){
        bgColor="rgb(21, 24, 28)";
      }else if(contentClass == "r-jwli3a"){
        bgColor="rgb(25, 39, 52)";
      }else if(contentClass == "r-18jsvk2"){
        bgColor="rgb(247, 249, 250)";
      }

			$(tweetDiv).before(
				`<div class="" style="
        height: 10px;
        border-bottom: ${borderStyle};
        background-color: ${bgColor};
    "></div>
    <div class="css-1dbjc4n r-1j3t67a r-1w50u8q" style="padding-top:15px; padding-bottom:15px; padding-left: 20px;">
      <div dir="auto" class="css-901oao r-1fmj7o5 r-1qd0xha r-1b6yd1w r-b88u0q r-ad9z0x r-bcqeeo r-qvutc0"><span class="css-901oao css-16my406 r-1qd0xha r-b88u0q r-ad9z0x r-bcqeeo r-qvutc0"><span class="css-901oao css-16my406 r-1qd0xha r-ad9z0x r-bcqeeo r-qvutc0"><span class="css-901oao r-18jsvk2 r-1qd0xha r-adyw6z r-b88u0q r-rjixqe r-bcqeeo ${contentClass}">What ${role} Are Saying </span></span></div>
    </div>
    <div class="" style="
    height: 10px;
    border-top: ${borderStyle};
    border-bottom: ${borderStyle};
    background-color: ${bgColor};
    "></div>`
			);
		}
		$(element).attr("tweetscanned", true);
	});
}



function replaceCollectionTitleTwitterLoad() {

var TW_BACKGROUND = "rgb(255, 255, 255)"
var TW_FONT_COLOR = "#000000"
var TW_THEME = "light"

  chrome.storage.local.get('tw_backgroundColor', async function (result) {
   console.log(result.tw_backgroundColor)
   TW_BACKGROUND = result.tw_backgroundColor
   jQuery(".right-sidebar").css({backgroundColor: TW_BACKGROUND})
   if (TW_BACKGROUND != "rgb(255, 255, 255)"){
      TW_FONT_COLOR = "#FFFFFF"
      TW_THEME = "dark"
      if (TW_BACKGROUND == "rgb(0, 0, 0)"){
          TW_FONT_COLOR = "#D9D9D9"
      }
    }
  })

        var target = document.querySelector(_collectionPageHeaderSelector)

        if (!target) {
            //The twiiter container node not loaded yet. Wait 500ms and try again
            window.setTimeout(replaceCollectionTitleTwitterLoad, 200);
            return;
        }
        // var collection_decription = document.querySelector("main section[role=\"region\"] > div h1[role=\"heading\"][dir=\"auto\"] + div + div") // retired 12.3.22
        var collection_decription = document.querySelector("main section[role=region] h1[role=heading][dir=ltr] span")
        if (!collection_decription) {
          //The twiiter container node not loaded yet. Wait 500ms and try again
          window.setTimeout(replaceCollectionTitleTwitterLoad, 200);
          return;
        }
        if( collection_decription ){
          // var collection_selector = document.querySelector("main h2[role=\"heading\"][dir=\"auto\"]"); // retired 12.3.22
          var collection_selector = document.querySelector(_collectionPageHeaderSelector);
          collection_selector.innerHTML = '<span>' + collection_decription.innerHTML + "</span>";
          // document.querySelector("main h2[role=\"heading\"][dir=\"auto\"]").style.display = 'block'; // retired 12.3.22
          document.querySelector(_collectionPageHeaderSelector).style.display = 'block';
          //jQuery("main .css-1dbjc4n section .css-1dbjc4n.r-k8qxaj.r-utggzx.r-m611by").css({opacity: 1})
          jQuery("main .css-1dbjc4n section .css-1dbjc4n r-k8qxaj.r-1e081e0.r-ttdzmv").css({opacity: 1}) // opacity update 3.24.21
          jQuery("main .css-1dbjc4n.r-1jgb5lz.r-1ye8kvj.r-13qz1uu section.css-1dbjc4n").addClass('ts-loaded')

          setTimeout(function(){
            var collectionPageInfo = chrome.storage.local.get({'collection_page_info': null}, (res) => {
              var share_button_link = res.collection_page_info.link_text_share_url;
              var same_page = false
              addHeaders(res.collection_page_info);
              if(( window.location.href.match('/timelines/[(0-9)]')) && (window.location.href.includes(res.collection_page_info.collection_id) )) {
                same_page = true
              } else {
                  var urlParams2 = new URLSearchParams(window.location.search);
                  let link_id = urlParams2.get('l_id')
                  if (link_id && res.collection_page_info.link_id == link_id){
                    same_page = true   
                  }
				}
              if (same_page){
                $(window).on("scroll", function () {
                  addHeaders(res.collection_page_info);
                });
                if ( share_button_link ){
                  let share_button_html = `<div class="gl-share-button-div" style="position:fixed; right:25px; bottom:75px; background:${TW_BACKGROUND};` 
                  share_button_html += 'width: 400px; height:80px; border:1px solid white; border-radius: 16px;box-shadow: rgba(101, 119, 134, 0.2) 0px 0px 15px, rgba(101, 119, 134, 0.15) 0px 0px 3px 1px;""> <a href="' + share_button_link + '" class="social-share-btn">Share this Page to Followers</a></div>'
                  jQuery('body').append(share_button_html);
                  //document.querySelector("body").innerHTML += '<div style="position:fixed; right:25px; bottom:75px; background:white; width: 400px; height:80px; border:0px solid rgb(29, 161, 242); border-radius: 16px;box-shadow: rgba(101, 119, 134, 0.2) 0px 0px 15px, rgba(101, 119, 134, 0.15) 0px 0px 3px 1px;""> <a href="' + share_button_link + '" class="social-share-btn"> Share this collection</a></div>';
                }
              }
          });  
          }, 2000)
        }else{
          
          jQuery("main .css-1dbjc4n section .css-1dbjc4n.r-k8qxaj.r-utggzx.r-m611by").css({opacity: 1})
          jQuery("main .css-1dbjc4n.r-1jgb5lz.r-1ye8kvj.r-13qz1uu section.css-1dbjc4n").addClass('ts-loaded')
          document.querySelector("main h2[role=\"heading\"][dir=\"auto\"]").style.display = 'block';
          
        }
        setTimeout(function(){
          var styleEl = document.createElement('style');
          styleEl.innerHTML =`
            main .css-1dbjc4n section .css-1dbjc4n.r-k8qxaj.r-utggzx.r-m611by{ opacity: 1 !important}
            
          `;
          document.body.appendChild(styleEl);

        }, 5000)
        //main .css-1dbjc4n.r-1habvwh h2{display:block !important;}

}