let SERVER = 'theconversation.social'
var SHOW_SUBCATEGORY_WHEN_CUSTOM_TOOLTIPS = true;
var EXT_URL = `chrome-extension://${chrome.runtime.id}`
const $ = window['$']
window['listeners_on'] = false;
let myRoots = []
var twitterIdsList = {};
// This options allows to choose whether to verify current
// twitter ID with the available twitter IDs list for tooltip
// data in twitter cards.
var VERIFY_TWITTER_ID = true;
const TOOLTIP_CATEGORY_USERS_CACHE_SIZE = 1000;
const TOOLTIP_CATEGORY_USERS_SAVE_TO_STORAGE_PERIOD_MS = 7200000;
const TOOLTIP_CATEGORY_USERS_SAVE_TO_STORAGE_FIRST_TIME_AFTER_MS = 120000;
const TOOLTIP_CATEGORY_USERS_INVALIDATION_PERIOD_MS = 7 * 24 * 60 * 60 * 1000;

var TW_BACKGROUND = 'rgb(255, 255, 255)'
var TW_TITLE_COLOR = 'rgb(91, 112, 131)'

function sleep (time) {
  return new Promise((resolve) => {
    setTimeout(resolve, time)
  })
}

async function get_tw_bg_color(){
  await sleep(2000)
  var style_w = document.body.style //.querySelector('body').style.getPropertyValue("background-color")
  if (style_w.backgroundColor){
    TW_BACKGROUND = style_w.backgroundColor
    chrome.storage.local.set({ 'tw_backgroundColor': style_w.backgroundColor });
    if (TW_BACKGROUND !== 'rgb(255, 255, 255)') {
      if (TW_BACKGROUND == 'rgb(0, 0, 0)') {
        TW_TITLE_COLOR = 'rgb(110, 118, 125)'
      } else {
        TW_TITLE_COLOR = 'rgb(136, 153, 166)'
      }
    }    
  }
}

if( window.location.href.includes('twitter.com/') ){
  get_tw_bg_color()
}

function createLookupDict (data) {
  var lookupDict = {}
  for (var i = 0; i < data.length; i++) {
    lookupDict[data[i].toLowerCase()] = true;
  }
  return lookupDict
}

// #twittercardsturnoff - modify in background.js
// Background.js has a setting "USE_TOOLTIPS" which is the only one to be modified
// for TRUE/FALSE to allow tooltips (custom or twitter cards) on or off with admin override.
// Please do not modify setting below, it is a fallback that should always be set to false
// in case there is a problem with background.js
var USE_TOOLTIPS = false;
// Should also be modified in backround.js only.
var USE_DEFAULT_TWITTER_TOOLTIP = true;

var recipientsCache = new DLL.DoublyLinkedList(TOOLTIP_CATEGORY_USERS_CACHE_SIZE);
chrome.storage.local.get({categorycachearray : null}, (items) => {
  if (items.categorycachearray !== null) {
    let numRead = recipientsCache.fromarray(JSON.parse(items.categorycachearray));
    console.log("Category cache: read " + numRead + " entries from local storage");
  }
  else {
    // For the first time - flush cache after 2 mins
    setTimeout(function() {
      chrome.storage.local.set({categorycachearray: JSON.stringify(recipientsCache.toarray())});
    }, TOOLTIP_CATEGORY_USERS_SAVE_TO_STORAGE_FIRST_TIME_AFTER_MS);
  }
});

// Timeout fo flushing category cache
setInterval(function() {
  chrome.storage.local.set({categorycachearray: JSON.stringify(recipientsCache.toarray())});
}, TOOLTIP_CATEGORY_USERS_SAVE_TO_STORAGE_PERIOD_MS);

function checkValidRecipientCached(twitterId) {
  let cachedEntry = recipientsCache.get(twitterId);
  if (cachedEntry === null
      || cachedEntry.update_time + TOOLTIP_CATEGORY_USERS_INVALIDATION_PERIOD_MS < Date.now()) {
    let res = twitterIdsList.hasOwnProperty(twitterId.toLowerCase());
    recipientsCache.put(twitterId, {valid: res, value: null, update_time: Date.now()});
    return res;
  }

  return cachedEntry.valid;
}

var i_icon;
chrome.storage.local.get({usetooltips : null, defaulttwittooltip : null}, (items) => {
  if (!chrome.runtime.lastError) {
    USE_TOOLTIPS = items.usetooltips;
    USE_DEFAULT_TWITTER_TOOLTIP = items.defaulttwittooltip;

    if (USE_TOOLTIPS) {
      chrome.storage.local.get({twitterIds: null, updateDate: null}, (items) => {
      if (items.twitterIds) {
        twitterIdsList = createLookupDict(JSON.parse(items.twitterIds));
      }
      else {
        console.log("Cannot fetch username list from local storage");
      }
      });

      i_icon = $(htmlTooltipOnTwitterNNN('right:20px'));
    }
  }
})

function htmlTooltipOnTwitter (twitterId, oldNewDesign = '') {

  const bioHtml = `
      <div style="display: none; padding: 5px; font-size: 75%; letter-spacing: .3px; font-family: muli, mulish, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Ubuntu, Helvetica Neue, sans-serif !important;">
        <div style="text-align: center; margin-bottom: 5px;">
          <strong>SOCIAL INTELLIGENCE BRIEF</strong>
          <img  class="qtip-close" style="float: right; cursor: pointer;width:16px !important; height:16pxpx !important;" width="16px" height="16px"
                src="${EXT_URL + '/close.png'}">
          </img>
        </div>
        <div class="image"></div>
        <div class="bio"></div>
        <div class="category"></div>
        <div class="tags"></div>
        <div class="followers"></div>
        <div class="home-page"></div>
        <div class="related-companies"></div>
        <div class="related-people"></div>
        <div class="nationalities"></div>
        <div class="date-of-birth"></div>
          <span class="csv-data"></span>
      </div>`
  const infoIconHtml = `
      <span class="hasTooltip" data-twitter-id="${twitterId}">
        <img style="${oldNewDesign};position: absolute; margin-bottom: 2px;padding-left: 2px;" src="${EXT_URL + '/information-2-16.png'}"/>
      </span>`
  const result = `
      <div style="float: right;color: #fff;font-size: 11px;text-transform: uppercase;margin-right: -4px;font-weight: 600;padding-left: 0px;padding-right: 0px;">
        ${infoIconHtml + bioHtml}
      </div>`
  return result
}

function htmlTooltipOnTwitterNNN (oldNewDesign = '') {
  const bioHtml = `
      <div style="display: none; padding: 5px; font-size: 11.9px; letter-spacing: .3px; font-family: Mulish, sans-serif;">
        <div style="text-align: center; margin-bottom: 5px;">
          <strong>SOCIAL INTELLIGENCE BRIEF</strong>
          <img  class="qtip-close" style="float: right; cursor: pointer;width:16px !important; height:16pxpx !important;" width="16px" height="16px"
                src="${EXT_URL + '/close.png'}">
          </img>
        </div>
        <div class="image"></div>
        <div class="bio"></div>
        <div class="category"></div>
        <div class="tags"></div>
        <div class="followers"></div>
        <div class="home-page"></div>
        <div class="related-companies"></div>
        <div class="related-people"></div>
        <div class="nationalities"></div>
        <div class="date-of-birth"></div>
          <span class="csv-data"></span>
      </div>`
  // Intentionally breaking icon that appears beside category tooltip until we decide we want icon to appear again
  const infoIconHtml = `
      <span class="hasTooltip">
        <!--<img style="${oldNewDesign};position: absolute; margin-bottom: 2px;padding-left: 2px;" src="${EXT_URL + '/information-2-16.png'}"/>-->
      </span>`
  const result = `
      <div class='iicon' style="float: right;color: #fff;font-size: 11px;text-transform: uppercase;margin-right: -4px;font-weight: 600;padding-left: 0px;padding-right: 0px;">
        ${infoIconHtml + bioHtml}
      </div>`
  return result
}

function relatedConversation (oldNewDesign = '') {
  // Dov might have been an intentional break
  const infoIconHtml = `
      <div style="display: flex;" class="related-button">
        <img src="${EXT_URL + '/c-icon.png'}" style="width: 15px;height: 15px;margin-top: 4px;">
        <dov style="color: grey;margin-top: 4px;text-transform: none;margin-left: 3px; font-family:system-ui;font-weight:100;">
        Related Conversation
        </dov>
      </div>`
  const result = `
      <div style="width:140px; float: right;color: #fff;font-size: 11px;text-transform: uppercase;margin-right: -4px;font-weight: 600;padding-left: 0px;padding-right: 0px;height: 20px;cursor: pointer;">
        ${infoIconHtml}
      </div>`

      // btnId++;
  // window['$'](result).bind("click", function () {
  //   alert('CLICK !!!')
  // })
  
  return result
}

function htmlTooltipOnTwitterCards (twitterId, oldNewDesign = '') {
  console.log(twitterId)
  const bioHtml = `
      <div style="display: none; padding: 5px; font-size: 75%; letter-spacing: .3px; font-family: muli, mulish, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Ubuntu, Helvetica Neue, sans-serif !important;">
        <div style="text-align: center; margin-bottom: 5px;">
          <strong>SOCIAL INTELLIGENCE BRIEF</strong>
          <img  class="qtip-close" style="float: right; cursor: pointer;width:16px !important; height:16pxpx !important;" width="16px" height="16px"
                src="${EXT_URL + '/close.png'}">
          </img>
        </div>
        <div class="image"></div>
        <div class="bio"></div>
        <div class="category"></div>
        <div class="tags"></div>
        <div class="followers"></div>
        <div class="home-page"></div>
        <div class="related-companies"></div>
        <div class="related-people"></div>
        <div class="nationalities"></div>
        <div class="date-of-birth"></div>
        <span class="csv-data"></span>
      </div>`
  const infoIconHtml = `
      <a href="${twitterId}" target="_blank">
        <img style="${oldNewDesign};position: absolute; margin-bottom: 2px;padding-left: 2px;" src="${EXT_URL + '/icon-16.png'}"/>
      </a>`
  const result = `
      <div style="float: right;color: #fff;font-size: 11px;text-transform: uppercase;margin-right: -4px;font-weight: 600;padding-left: 0px;padding-right: 0px;">
        ${infoIconHtml + bioHtml}
      </div>`
  return result
}

function htmlTooltipBesideTwitterID (twitterId) {
  const bioHtml = `
      <div style="display: none; padding: 5px; font-size: 75%; letter-spacing: .3px; font-family:  muli, mulish, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Ubuntu, Helvetica Neue,Helvetica,Arial,sans-serif !important;">
        <div style="text-align: center; margin-bottom: 5px;">
          <strong>SOCIAL INTELLIGENCE BRIEF</strong>
          <img class="qtip-close" style="float: right; cursor: pointer;" width="16px" height="16px" src="${EXT_URL + '/close.png'}"></img>
        </div>
        <div class="image"></div>
        <div class="bio"></div>
        <div class="category"></div>
        <div class="tags"></div>
        <div class="followers"></div>
        <div class="home-page"></div>
        <div class="related-companies"></div>
        <div class="related-people"></div>
        <div class="nationalities"></div>
        <div class="date-of-birth"></div>
        <span class="csv-data"></span>
      </div>`
  // Intentionally breaking icon that appears beside category tooltip until we decide we want icon to appear again
  const infoIconHtml = `
    <!--<img style="margin-bottom: -2px;padding-left: 2px;" class="hasTooltip" data-twitter-id="${twitterId}" src="${EXT_URL + '/information-2-12.png'}"/>-->
  `
  const result = infoIconHtml + bioHtml
  return result
}

function htmlTooltipOnDefaultTwitterCard (twitterId) {
  const bioHtml = `
      <div style="display: none; padding: 5px 16px; font-size: 11.9px; letter-spacing: .3px; font-family: Mulish, sans-serif !important;">
        <div style="text-align: center; margin-bottom: 10px;">
          <strong>SOCIAL INTELLIGENCE BRIEF</strong>
          <img style="float: right;" width="0px" height="0px"></img>
        </div>
        <div class="image"></div>
        <div class="bio"></div>
        <div class="category"></div>
        <div class="tags"></div>
        <div class="followers"></div>
        <div class="home-page"></div>
        <div class="related-companies"></div>
        <div class="related-people"></div>
        <div class="nationalities"></div>
        <div class="date-of-birth"></div>
        <span class="csv-data"></span>
      </div>`
  const infoIconHtml = `
    <img style="margin-bottom: -2px;padding-left: 2px;" class="hasTooltip" data-twitter-id="${twitterId}" src="${EXT_URL + '/information-2-12.png'}"/>
  `
  const result = infoIconHtml + bioHtml;
  return result;
}

// init
function addToTwitterTooltipListener(evt)
{
    evt.relatedNode.removeEventListener('DOMNodeInserted', addToTwitterTooltipListener);
    addToTwitterTooltip(evt.relatedNode.childNodes[0]);
}
// This functions inserts info into the default twitter tooltip.
// To choose between default/custom tooltips, go to the options.js file.
function addToTwitterTooltip (origEl) {
  el = $(origEl);
  if (el.find('.info-margin').length === 0) {
    contentEl = $('<div/>').addClass('info-margin').css({
      margin: '-5px 0',
      width: el.closest('#insertable-parent-div').width(),
      paddingBottom: '20px'
    }).appendTo(el.children());
  }
  if (el.hasClass('info-added')) {
    return;
  }
  var div = contentEl;
  var twitterId = el.find('a').first().attr('href').replace('/', '').toLowerCase();
  var tooltipDataStatus = 'init'
  var updateTooltip = function () {
    chrome.storage.local.get({'freeTrialCounter': 0}, function (item) {
      chrome.runtime.sendMessage({ method: 'checkLoggedIn' }, function (status) {
        if (true|| status.result === true || item.freeTrialCounter > 0) {
          if (tooltipDataStatus === 'loaded') {
            div.waitForImages(() => {
              adjustImageWidthHeight(div);
              $('#loading-in-tooltip').hide();
              div.show();
              adjustToViewportPosition(el[0], contentEl);
              if (item.freeTrialCounter > 0) {
                chrome.storage.local.set({'freeTrialCounter': item.freeTrialCounter - 1})
              }
            })
          } else if (tooltipDataStatus === 'failed') {
            $('#loading-in-tooltip').hide();
            div.html(div.html() + "<br>We have most users' bios in our database, but this one we seem to have left out. Please contact us so it may be added. We apologize and sorry for any inconvenience.");
            div.show();
            adjustToViewportPosition(el[0], contentEl);
          }
        } else {
          // login
          // todo: use components?
          $('#loading-in-tooltip').hide();
          var $loginDiv = $('<div>Please <a href="#">Login</a> to view the tooltip.</div>')
          $loginDiv.find('a').click(function () {
            chrome.runtime.sendMessage({ method: 'login' })
          })
          div.html($loginDiv);
          div.show();
        }
      })
    })
  }
  // Do i need this?
  el.addClass('info-added')
  //TODO: make displayData global????
  var displayData = function (r) {
    if (r.image) {
      div.children('.image').html('<img width="100" id="tooltipImg" onError="this.onerror=null;this.src=information-2-12.png;" style="float: left; width: auto;margin-right: 13px;"/>');
      document.getElementById('tooltipImg').addEventListener("load", function(e) {
        adjustToViewportPosition(e.srcElement.parentElement.parentElement.parentElement, contentEl);
      });
      document.getElementById('tooltipImg').src = r.image;
    }
    if (r.related_companies) {
      div.children('.related-companies').html('<span><strong>Related Companies</strong>: ' + r.related_companies.join(', ') + '</span>')
    }
    if (r.related_people) {
      div.children('.related-people').html('<span><strong>Related People</strong>: ' + r.related_people.join(', ') + '</span>')
    }
    if (r.date_of_birth) {
      div.children('.date-of-birth').html('<span><strong>Date of Birth</strong>: ' + r.date_of_birth + '</span>')
    }
    if (r.nationalities) {
      let nationalities = r.nationalities.join(', ')
      if (nationalities) {
        div.children('.nationalities').html('<span><strong>Localities</strong>: ' + nationalities + '</span>')
      }
    }
    if (r.tags) {
      let tags = r.tags.join(', ')
      if (tags) {
        div.children('.tags').html('<span><strong>Tags</strong>: ' + tags + '</span>')
      }
    }
    if (r.short_desc) {
      div.children('.bio').html(r.short_desc)
    }
    if (r.category || r.subcategory) {
      var category = r.category ? r.category : ''
      var subcategory = r.subcategory ? r.subcategory : ''
      div.children('.category').html('<span><strong>Category</strong>: ' + capitalizeFirstLetter(category) + ((category && subcategory) ? ' > ' : '') + capitalizeFirstLetter(subcategory) + '</span>')
    }
    if (r.home_page) {
      div.children('.home-page').html('<span><strong>Homepage</strong>: <a href="' + r.home_page + '" target="_blank">' + r.home_page + '</a></span>')
    }
    if (r.followers) {
      div.children('.followers').html('<span><strong>Followers</strong>: ' + r.followers + '</span>')
    }
    if (r.csv_data) {
      const csvHtml = r.csv_data.map(function (data) {
        const fieldsHtml = data.fields.map(function (field) {
          return field.link ? '<a href="' + field.link + '" target="_blank">' + field.data + '</a>'
            : field.data
        }).join(', ')
        return '<div class="imdb-' + data.label.toLowerCase().replace(/ /g, '-') + '"><span><strong>' + data.label + '</strong>: ' + fieldsHtml + '</span></div>'
      }).join('')
      div.children('.csv-data').html(csvHtml)
    }
  }
  if (!VERIFY_TWITTER_ID || checkValidRecipientCached(twitterId)) {
    //TODO: refactor
    loadingDiv = document.createElement('div');
    loadingDiv.id = "loading-in-tooltip";
    let loadingMsg = '<div class="loading-message" style="margin-top: 5px; text-align: center;font-family: Mulish, sans-serif !important;font-size: 85%;">Fetching data. One moment...'
    loadingMsg += '<div style="text-align:center; margin-top: 5px;"><img src="' + EXT_URL + '/ajax-loader-transparent.gif" alt="Loading..." style="width: 16px; height:16px" /></div></div>'
    loadingDiv.innerHTML = loadingMsg;
    // add horizontal
    infoDiv = document.createElement('div');
    infoDiv.id = 'data-in-tooltip';
    infoDiv.innerHTML = htmlTooltipOnDefaultTwitterCard(twitterId);
    div = $($(infoDiv).children()[1]);
    let color = $($(el.children()[2]).children()[0]).css("color");
    div.css({'color': color});
    contentEl[0].appendChild(loadingDiv);
    contentEl[0].appendChild(div[0]);
    adjustToViewportPosition(el[0]);
    chrome.runtime.sendMessage({ method: 'fetchRecipientProfile', twitterId: twitterId }, function (response) {
      if (el[0] === $(origEl)[0]) {
        if (response.success) {
          displayData(response.data);
          tooltipDataStatus = 'loaded';
        } else {
          tooltipDataStatus = 'failed';
        }
        updateTooltip();
      }
    })
  }
}

function showTooltip (el) {
  if ($(el).hasClass('qtip-added')) {
    el._tippy.show();
    return
  }
  el = $(el)
  var div = el.next('div')
//  var twitterId = el.data('twitter-id') ? el.data('twitter-id') : 'undefined'
    // no longer working  var twitterId = el.parent().parent().parent().parent().find('a').first().attr('href').replace('/', '').toLowerCase();
    // works as of 8.15.2021 var twitterId = el.parent().parent().parent().parent().parent().parent().parent().find('a').first()
    //OLD CODE HERE
    // var twitterId = el
    //   .closest('[data-testid="tweet"]')
    //   .find('a[href][role="link"]')
    //   .first()
    //   .attr("href")
    //   .replace("/", "")
    //   .toLowerCase();
    //NEW CODE HERE, it checks whether we are on the home page and parses for the twiiter Id.
    twitterId = el
        .closest('article')
        .find('[data-testid="User-Names"] a')
        .attr('href')
        .replace('/', '')
        .toLowerCase();
    var tooltipDataStatus = 'init';

  var updateTooltip = function (api) {
    chrome.storage.local.get({'freeTrialCounter': 0}, function (item) {
      chrome.runtime.sendMessage({ method: 'checkLoggedIn' }, function (status) {
        if (status.result === true || item.freeTrialCounter > 0) {
          if (tooltipDataStatus === 'loaded') {
            div.waitForImages(() => {
              adjustImageWidthHeight(div);
              div.find('.loading-message').hide()
              div.find('.qtip-close').click(() => api.hide());
              api.setContent(div.show()[0])
              if (item.freeTrialCounter > 0) {
                chrome.storage.local.set({'freeTrialCounter': item.freeTrialCounter - 1})
              }
            })
          } else if (tooltipDataStatus === 'failed') {
            div.find('.loading-message').hide()
            api.setContent(div.html() + "<br>We have most users' bios in our database, but this one we seem to have left out. Please contact us so it may be added. We apologize and sorry for any inconvenience.")
          }
        } else {
          div.find('.loading-message').hide()
          var $loginDiv = $('<div>Please <a href="#">Login</a> to view the tooltip.</div>')
          $loginDiv.find('a').click(function () {
            chrome.runtime.sendMessage({ method: 'login' })
          })
          api.setContent($loginDiv)
        }
      })
    })
  }

  el.addClass('qtip-added')
  var displayData = function (r) {
    if (r.image) {
      div.children('.image').html('<img width="100" onError="this.onerror=null;this.src=information-2-12.png;" style="float: left; width: auto;margin-right: 13px;" src="' + r.image + '"/>')
    }
    if (r.related_companies) {
      div.children('.related-companies').html('<span><strong>Related Companies</strong>: ' + r.related_companies.join(', ') + '</span>')
    }
    if (r.related_people) {
      div.children('.related-people').html('<span><strong>Related People</strong>: ' + r.related_people.join(', ') + '</span>')
    }
    if (r.date_of_birth) {
      div.children('.date-of-birth').html('<span><strong>Date of Birth</strong>: ' + r.date_of_birth + '</span>')
    }
    if (r.nationalities) {
      let nationalities = r.nationalities.join(', ')
      if (nationalities) {
        div.children('.nationalities').html('<span><strong>Localities</strong>: ' + nationalities + '</span>')
      }
    }
    if (r.tags) {
      let tags = r.tags.join(', ')
      if (tags) {
        div.children('.tags').html('<span><strong>Tags</strong>: ' + tags + '</span>')
      }
    }
    if (r.short_desc) {
      div.children('.bio').html(r.short_desc)
    }
    if (r.category || r.subcategory) {
      var category = r.category ? r.category : ''
      var subcategory = r.subcategory ? r.subcategory : ''
      div.children('.category').html('<span><strong>Category</strong>: ' + capitalizeFirstLetter(category) + ((category && subcategory) ? ' > ' : '') + capitalizeFirstLetter(subcategory) + '</span>')
    }
    if (r.home_page) {
      div.children('.home-page').html('<span><strong>Homepage</strong>: <a href="' + r.home_page + '" target="_blank">' + r.home_page + '</a></span>')
    }
    if (r.followers) {
      div.children('.followers').html('<span><strong>Followers</strong>: ' + r.followers + '</span>')
    }
    if (r.csv_data) {
      const csvHtml = r.csv_data.map(function (data) {
        const fieldsHtml = data.fields.map(function (field) {
          return field.link ? '<a href="' + field.link + '" target="_blank">' + field.data + '</a>'
            : field.data
        }).join(', ')
        return '<div class="imdb-' + data.label.toLowerCase().replace(/ /g, '-') + '"><span><strong>' + data.label + '</strong>: ' + fieldsHtml + '</span></div>'
      }).join('')
      div.children('.csv-data').html(csvHtml)
    }
  }

  const windowMaxWidth = (Math.round(($(window).width() - 721) / 1.75) - 20);
  let instance = window.tippy(el[0], {
    maxWidth: Math.max(300, windowMaxWidth) + 'px',
    content: () => {
      chrome.runtime.sendMessage({ method: 'fetchRecipientProfile', twitterId, }, function (response) {
        // console.log("fetchRecipientProfile = ", response);
        if (response.success) {
          displayData(response.data)
          tooltipDataStatus = 'loaded'
        } else {
          tooltipDataStatus = 'failed'
          // tooltipDataStatus = "We have most users' bios in our database, but this one we seem to have left out. Please contact us so it may be added. We apologize and sorry for any inconvenience.";
        }

        updateTooltip(instance)
      })

      let loadingMsg = '<div class="loading-message">Fetching data. One moment...'
      loadingMsg += '<div style="text-align:center"><img src="' + EXT_URL + '/ajax-loader-transparent.gif" alt="Loading..." style="width: 16px; height:16px" /></div></div>'

      return loadingMsg
    },
    popperOptions: {
      modifiers: [
        {
          name: 'preventOverflow',
          options: {
            padding: 15,
          },
        },
      ],
    },
    onCreate(instance) {
      $(instance.popper).find('.tippy-box').css({
        boxShadow: 'rgb(101 119 134 / 20%) 0px 0px 15px, rgb(101 119 134 / 15%) 0px 0px 3px 1px',
        border: '1px solid lightgray'
      })
    },
    arrow: false,
    allowHTML: true,
    theme: 'light',
    placement: 'right',
    zIndex: 9999999,
    animation: 'none',
    interactive: true,
    triggerTarget: el.parent()[0], //el.closest('article')[0]
    appendTo: document.body,
  });
  instance.show();
}

function putTooltipOnTwitterBySelector (option) {
  if (typeof option.element !== 'undefined') {
    elementSelector = $(option.element);//.find(option.elementSelector).first();//.children(elementSelector)[0];
  }
  else {
    var elementSelector = option.elementSelector;
  }
  var nameSelector = option.nameSelector
  var fnCreateTooltip = option.fnCreateTooltip
  $(elementSelector).each(function () {
    var el = $(this)
    if (!el.hasClass('charlotte-modified')) {
      el.addClass('charlotte-modified')

      var $twitterId = el.find(nameSelector);
      if ($twitterId.length === 0) {
        $twitterId = el.find('a[role="link"] div[dir="ltr"] span');
      }
      var twitterId = $twitterId.first().text().replace('@', '').toLowerCase()
      if (twitterId === '') {
        // twitterId = 'barackobama';
        // if (document.querySelector('.css-1dbjc4n.r-ku1wi2.r-utggzx.r-m611by .css-1dbjc4n.r-18u37iz.r-1wbh5a2 span') != null) {
        //   twitterId = document.querySelector('.css-1dbjc4n.r-ku1wi2.r-utggzx.r-m611by .css-1dbjc4n.r-18u37iz.r-1wbh5a2 span').textContent.replace('@', '').toLowerCase()
        // }
        if (el.find('.css-1dbjc4n.r-18u37iz.r-1wbh5a2.r-13hce6t .css-901oao.css-bfa6kz.r-14j79pv.r-18u37iz.r-1qd0xha.r-a023e6.r-16dba41.r-rjixqe.r-bcqeeo.r-qvutc0 span')[0] != null) {
          twitterId = el.find('.css-1dbjc4n.r-18u37iz.r-1wbh5a2.r-13hce6t .css-901oao.css-bfa6kz.r-14j79pv.r-18u37iz.r-1qd0xha.r-a023e6.r-16dba41.r-rjixqe.r-bcqeeo.r-qvutc0 span')[0].textContent.replace('@', '').toLowerCase()
        // below is an alternative to the above 2 lines
        // if (document.querySelector('.css-1dbjc4n.r-18u37iz.r-1wbh5a2.r-13hce6t .css-901oao.css-bfa6kz.r-14j79pv.r-18u37iz.r-1qd0xha.r-a023e6.r-16dba41.r-rjixqe.r-bcqeeo.r-qvutc0 span') != null) {
        //  twitterId = document.querySelector('.css-1dbjc4n.r-18u37iz.r-1wbh5a2.r-13hce6t .css-901oao.css-bfa6kz.r-14j79pv.r-18u37iz.r-1qd0xha.r-a023e6.r-16dba41.r-rjixqe.r-bcqeeo.r-qvutc0 span').textContent.replace('@', '').toLowerCase()
        } else if (document.querySelector('.css-4rbku5.css-1dbjc4n.r-19yat4t.r-mk0yit.r-wk8lta.r-9qu9m4 .css-1dbjc4n.r-18u37iz.r-thb0q2 .css-1dbjc4n.r-1iusvr4.r-46vdb2.r-1777fci.r-5f2r5o.r-bcqeeo .css-1dbjc4n.r-18u37iz.r-1wbh5a2 .css-901oao.css-16my406.r-1qd0xha.r-ad9z0x.r-bcqeeo.r-qvutc0') != null) {
          twitterId = document.querySelector('.css-4rbku5.css-1dbjc4n.r-19yat4t.r-mk0yit.r-wk8lta.r-9qu9m4 .css-1dbjc4n.r-18u37iz.r-thb0q2 .css-1dbjc4n.r-1iusvr4.r-46vdb2.r-1777fci.r-5f2r5o.r-bcqeeo .css-1dbjc4n.r-18u37iz.r-1wbh5a2 .css-901oao.css-16my406.r-1qd0xha.r-ad9z0x.r-bcqeeo.r-qvutc0').textContent.replace('@', '').toLowerCase()
        }
      }
      if (checkValidRecipientCached(twitterId)) {
        if (fnCreateTooltip) {
          fnCreateTooltip(el, twitterId)
        } else {
          el.after(htmlTooltipBesideTwitterID(twitterId))
        }
      }
    }
  })
}

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

function putTooltipOnTwitterBySelectorNew (option) {
  if (typeof option.element !== 'undefined') {
    elementSelector = $(option.element);//.children(elementSelector);
  }
  else {
    var elementSelector = option.elementSelector;
  }
  var nameSelector = option.nameSelector
  var fnCreateTooltip = option.fnCreateTooltip
  // var isNewDesign = document.querySelectorAll('[data-testid="tweet"] [data-testid="reply"]').length > 0
  var isNewDesign = option.isNewDesign;
  $(elementSelector).each(function () {
    var el = $(this)
    if (!el.attr('charlotte-modified-1')) {
      el.attr('charlotte-modified-1',true)
      if(isNewDesign){
        if(!el[0].classList.contains('related-conversation-added')) {
          el[0].classList.add('related-conversation-added');
          fnCreateTooltip(el);
        }
      }
      else fnCreateTooltip(el);
    }
  
  })
}

// for cards

function putTooltipOnTwitterBySelectorCards (option) {
  var elementSelector = option.elementSelector
  var nameSelector = option.nameSelector
  var nameSelectorNum = option.nameSelectorNum
  var fnCreateTooltip = option.fnCreateTooltip
  $(elementSelector).each(function () {
    var el = $(this)
    if (!el.hasClass('charlotte-modified')) {
      el.addClass('charlotte-modified')
      var twitterId = document.querySelectorAll(nameSelector)[nameSelectorNum].href
      let checkdomain = null
      if (document.querySelectorAll('.css-901oao.r-hkyrab.r-1qd0xha.r-1blvdjr.r-16dba41.r-ad9z0x.r-bcqeeo.r-19yat4t.r-bnwqim.r-qvutc0 a')[0]) {
        if (document.querySelectorAll('.css-901oao.r-hkyrab.r-1qd0xha.r-1blvdjr.r-16dba41.r-ad9z0x.r-bcqeeo.r-19yat4t.r-bnwqim.r-qvutc0 a')[0].title) {
          checkdomain = document.querySelectorAll('.css-901oao.r-hkyrab.r-1qd0xha.r-1blvdjr.r-16dba41.r-ad9z0x.r-bcqeeo.r-19yat4t.r-bnwqim.r-qvutc0 a')[0].title.split('.')[0].split('https://')[1]
        }
      } else {
        checkdomain = document.querySelectorAll('.css-1dbjc4n.r-117bsoe.r-mvpalk.r-156q2ks .css-901oao.css-16my406.r-1qd0xha.r-ad9z0x.r-bcqeeo.r-qvutc0')[4].innerText
      }

      // console.log(nameSelector);
      // console.log(twitterId);
      // console.log(el.find(nameSelector).text());
	    
      if(twitterId != '' || twitterId != null || twitterId != undefined) {
          console.log(el.find('.css-901oao.css-16my406.r-1qd0xha.r-ad9z0x.r-bcqeeo.r-qvutc0'));
          fnCreateTooltip(el, twitterId);
      } else {
          el.after(htmlTooltipBesideTwitterID(twitterId));
      }
      twitterId = 'barackobama';
      if(twitterId == "")
      {
          // twitterId = 'barackobama';
         if(document.querySelector('.css-1dbjc4n.r-ku1wi2.r-utggzx.r-m611by .css-1dbjc4n.r-18u37iz.r-1wbh5a2 span') != null){
         twitterId = document.querySelector('.css-1dbjc4n.r-ku1wi2.r-utggzx.r-m611by .css-1dbjc4n.r-18u37iz.r-1wbh5a2 span').textContent.replace('@','').toLowerCase();
          }
          else if(document.querySelector('.css-4rbku5.css-1dbjc4n.r-19yat4t.r-mk0yit.r-wk8lta.r-9qu9m4 .css-1dbjc4n.r-18u37iz.r-thb0q2 .css-1dbjc4n.r-1iusvr4.r-46vdb2.r-1777fci.r-5f2r5o.r-bcqeeo .css-1dbjc4n.r-18u37iz.r-1wbh5a2 .css-901oao.css-16my406.r-1qd0xha.r-ad9z0x.r-bcqeeo.r-qvutc0') != null ){
              twitterId = document.querySelector('.css-4rbku5.css-1dbjc4n.r-19yat4t.r-mk0yit.r-wk8lta.r-9qu9m4 .css-1dbjc4n.r-18u37iz.r-thb0q2 .css-1dbjc4n.r-1iusvr4.r-46vdb2.r-1777fci.r-5f2r5o.r-bcqeeo .css-1dbjc4n.r-18u37iz.r-1wbh5a2 .css-901oao.css-16my406.r-1qd0xha.r-ad9z0x.r-bcqeeo.r-qvutc0').textContent.replace('@','').toLowerCase();
          }
      }
      chrome.runtime.sendMessage({method: 'checkVaildDomain', checkdomain: checkdomain}, function (response) {
        if (response.result === true) {
          if (fnCreateTooltip) {
            fnCreateTooltip(el, twitterId)
          } else {
            el.after(htmlTooltipBesideTwitterID(twitterId))
          }
        }
      })
    }
  })
}

	function processAndSaveToCache(twitterId, response) {
    let displayData = 'Official';
    let category = '';
    let defaultCategory = [
        'reporter',
        'reporter-tech',
        'commentator',
        'commentator-reporter',
        'reporter-commentator',
    ];
    // console.log('check response -- ', response.data);
    if (response.data) {
        //NEW CODE HERE (WORKS FINE)
        if (
            response.data.category &&
            response.data.category.toLowerCase() === 'reporter-tech'
        )
            category = 'media';
        if (response.data.category && response.data.subcategory) {
            displayData = `${
                category || response.data.category?.split('-').join(' ')
            } - ${response.data.subcategory?.split('-').join(' ')}`;
        } else if (response.data.subcategory && !response.data.category) {
            displayData = `${response.data.subcategory?.split('-').join(' ')}`;
            if (response.data.tags && response.data.tags[0])
                displayData += ` - ${response.data.tags[0]
                    ?.split('-')
                    .join(' ')}`;
        } else if (!response.data.subcategory && response.data.category) {
            displayData = `${response.data.category?.split('-').join(' ')}`;
            if (response.data.tags && response.data.tags[0])
                displayData += ` - ${response.data.tags[0]
                    ?.split('-')
                    .join(' ')}`;
        } else if (response.data.tags && response.data.tags.length) {
            for (let i = 0; i < response.data.tags.length; i++) {
                response.data.tags[i] = response.data.tags[i]
                    .split('-')
                    .join(' ');
            }
            displayData = `${response.data.tags.join(' - ')}`;
        } else {
            displayData = 'Official';
        }
        // OLD CODE HERE
        // if (
        //   response.data.category &&
        //   defaultCategory.find((x) => x === response.data.category.toLowerCase())
        // ) {
        //   if (response.data.category.toLowerCase() === "reporter-tech") {
        //     displayData = "media";
        //   } else {
        //     displayData = response.data.category;
        //   }
        // } else if (
        //   response.data.subcategory &&
        //   response.data.subcategory.toLowerCase() !== "digital"
        // ) {
        //   displayData = response.data.subcategory;
        // } else if (response.data.category) {
        //   displayData = response.data.category;
        // } else if (response.data.tags && response.data.tags.length) {
        //   displayData = response.data.tags[0].replace(/-/, " ");
        // } else {
        //   displayData = "Info";
        // }
    }
    recipientsCache.put(twitterId, {
        valid: true,
        value: displayData,
        update_time: Date.now(),
    });
    return displayData;
}

function fetchCategoryCached(twitterId, callback) {
  let cachedEntry = recipientsCache.get(twitterId);
  if (cachedEntry === null
      || (cachedEntry.valid && cachedEntry.value === null)
      || (cachedEntry.update_time + TOOLTIP_CATEGORY_USERS_INVALIDATION_PERIOD_MS < Date.now())) {
    chrome.runtime.sendMessage({ method: 'fetchRecipientCategory', twitterId: twitterId }, function(response) {
      let displayData = processAndSaveToCache(twitterId, response);
      if (displayData !== '') {
        callback(displayData);
      }
    });
  }
  else if (cachedEntry.valid) {
    callback(cachedEntry.value);
  }
}

function putSubcategory(elem, qtipElem, twitterId) {
  fetchCategoryCached(twitterId, function (displayData) {
    if (displayData !== null) {
      let fontWeight = window['listeners_on'] ? 100 : 100;
      //NEW CODE HERE changes the style of the label position(WORKS FINE)
      $(`<div class='icategory'>
      <img height="15px" width="15px" src="https://ton.twimg.com/onboarding/user_mood_product/verified_stroke_1.png" />
      <div>${displayData}</div>
      </div>`)
        .insertBefore(elem.find('.hasTooltip').parent())
        .each(function () {
          if (!$(this).hasClass('mouseover-subscribed')) {
            $(this).addClass('mouseover-subscribed').on('mouseover', function () {
              showTooltip(qtipElem);
            });
          }
        });
    }
  });
}

function removeIcons(twitNode) {
    $(twitNode).find('.icategory').remove();
    $(twitNode).find('.iicon').remove();
}

function putTooltipOnTwitterPost (addedNode) {
  var newDesignRight = 'right:20px'
  var oldDesignRight = 'right: 30px;padding-top: 3px;'
  var newUerRight = 'right: 20px;     bottom: 20px;'
  var embNew = 'position: inherit !important;bottom: 1px; margin-right: 4px;    padding-left: 6px !important;'
  var oldPerRight = 'padding-top: 2px;'
  // https://twitter.com/
  if (false) {// (document.querySelector('.stream-item-header') != null) {
    putTooltipOnTwitterBySelector({
      elementSelector: '.stream-item-header',
      nameSelector: '.account-group .username b',
      fnCreateTooltip: function (el, twitterId) {
        el.find('.ProfileTweet-action--more').before(htmlTooltipOnTwitter(twitterId, oldDesignRight))
        // el.parent().find('.ProfileTweet-action.ProfileTweet-action--favorite.js-toggleState').after(relatedConversation(twitterId, oldDesignRight))
      }
    })
  }
   else {
    putTooltipOnTwitterBySelector({
      elementSelector: 'article',
      element: addedNode,
//      elementSelector: '.css-1dbjc4n.r-18u37iz.r-1wtj0ep',
      // elementSelector: '.css-1dbjc4n.r-18u37iz.r-1wtj0ep.r-156q2ks',
      // old elementSelector: '.css-1dbjc4n.r-18u37iz.r-1wtj0ep.r-zl2h9q',
      // old nameSelector: '.css-76zvg2.css-bfa6kz.r-1re7ezh.r-18u37iz.r-1qd0xha.r-a023e6.r-16dba41.r-ad9z0x.r-bcqeeo.r-qvutc0 span',
      // old nameSelector: '.css-1dbjc4n.r-18u37iz.r-1wbh5a2.r-1f6r7vd .css-901oao.css-bfa6kz.r-1re7ezh.r-18u37iz.r-1qd0xha.r-a023e6.r-16dba41.r-ad9z0x.r-bcqeeo.r-qvutc0 span',
      // nameSelector: '.css-76zvg2.css-bfa6kz.r-1re7ezh.r-18u37iz.r-1qd0xha.r-a023e6.r-16dba41.r-ad9z0x.r-bcqeeo.r-qvutc0 span',      
      // nameSelector: '.css-901oao.css-bfa6kz.r-m0bqgq.r-18u37iz.r-1qd0xha.r-a023e6.r-16dba41.r-rjixqe.r-bcqeeo.r-qvutc0 span',
      // nameSelector: '.css-1dbjc4n.r-1awozwy.r-18u37iz.r-1f6r7vd .css-901oao.css-16my406.css-bfa6kz.r-1re7ezh.r-18u37iz.r-1qd0xha.r-ad9z0x.r-bcqeeo.r-qvutc0 span',
      nameSelector: 'a[role="link"][tabindex="-1"] div[dir="ltr"] span.css-901oao.css-16my406.r-poiln3.r-bcqeeo.r-qvutc0',
      // above line is targetting the @userName tag
      // NOTE: Selecting the username/adding labels might break again and here is a doc link to understand how it was fixed.
      // https://docs.google.com/document/d/1-Oo--8bzKXvoMQsUsOjyPgqj36WNdKoiSGjIIzVs3XU/edit
      fnCreateTooltip: async function (elem, twitterId) {
        await new Promise(resolve => {
          var moreBtnSelector = '.css-1dbjc4n.r-18u37iz.r-1h0z5md';
          if (elem.find('.css-1dbjc4n.r-1joea0r ' + moreBtnSelector).length > 0) {
            resolve();
          }
          var observer = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
              if (mutation.type == 'childList' && $(mutation.addedNodes).find(moreBtnSelector).length > 0) {
                // console.log('addedNodes======', mutation.addedNodes[0]);
                resolve();
              }
            });
          })
          observer.observe(elem[0], {
            attributes: false,
            childList: true,
            subtree: true,
          });
          setTimeout(() => {
            resolve()
          }, 2000);
        })
        // await new Promise(resolve => {
        //   setTimeout(() => {
        //     resolve();
        //   }, 500);
        // })
//        console.log(el.find('.css-1dbjc4n.r-18u37iz.r-1h0z5md.r-1joea0r').before(htmlTooltipOnTwitter(twitterId, newDesignRight)));
          i_icon.clone().insertBefore(elem.find('.css-1dbjc4n.r-1joea0r .css-1dbjc4n.r-18u37iz.r-1h0z5md')).children('.hasTooltip').each(function() {
//          i_icon.clone().insertBefore(elem.find('.css-1dbjc4n.r-18u37iz.r-1h0z5md.r-1joea0r')).children('.hasTooltip').each(function () {
//        In case the above selector breaks, the above line may allow it to work.			  
//        i_icon.clone().insertBefore(elem.find('[data-testid="caret"]')).parent().children('.hasTooltip').each(function () {
          if (!$(this).hasClass('mouseover-subscribed')) {
            $(this).addClass('mouseover-subscribed').on('mouseover', function () {
              showTooltip(this)
            })


                            // 12-4-22: Add labels below the username
                            this.closest('article').querySelector(
                                '[data-testid="User-Names"]'
                            ).style.marginBottom = '27px';
                            // Add label on permalink page to user info section
                            let permalinkPage =
                                this &&
                                this.closest('article') &&
                                this.closest('article').querySelector(
                                    '.css-1dbjc4n.r-18u37iz.r-15zivkp'
                                );
                            if (permalinkPage) {
                                var permalinkLabelChecking = setInterval(() => {
                                    if (
                                        permalinkPage.querySelector(
                                            '.icategory'
                                        )
                                    ) {
                                        permalinkPage.querySelector(
                                            '.icategory'
                                        ).style.marginTop = '24px';
                                        clearInterval(permalinkLabelChecking);
                                    }
                                }, 50);
                            }
                            // add label with user name
                            let labelContainer = this.closest(
                                '.css-1dbjc4n.r-zl2h9q'
                            );
                            if (
                                labelContainer &&
                                labelContainer.children.length > 1
                            ) {
                                if (
                                    labelContainer.children[1].innerText.toLocaleLowerCase() ===
                                    'official'
                                ) {
                                    labelContainer.children[1].remove();
                                } else {
                                    var counter1 = 0;
                                    const interval2 = setInterval(() => {
                                        const data = this.closest(
                                            'article'
                                        ).querySelector('.icategory');
                                        counter1 += 1;
                                        const nameContainer = this.closest(
                                            'article'
                                        ).querySelector(
                                            '[data-testid="User-Names"]'
                                        );
                                        if (data) {
                                            data.remove();
                                            nameContainer.style.marginBottom =
                                                '0px';
                                            clearInterval(interval2);
                                        }
                                        if (counter1 >= 3600)
                                            clearInterval(interval2);
                                    }, 50);
                                }
                            }




            if (SHOW_SUBCATEGORY_WHEN_CUSTOM_TOOLTIPS) {
              putSubcategory(elem, this, twitterId);
            }
          }
        })
      }
    })
  }
  // https://twitter.com/kylegriffin1
//  if (document.querySelector('.ProfileHeaderCard-screennameLink') != null) {
//    putTooltipOnTwitterBySelector({
//      elementSelector: '.ProfileHeaderCard-screennameLink',
//      nameSelector: '.username b'
//    })
//  } else {
//    putTooltipOnTwitterBySelector({
//      elementSelector: '.css-1dbjc4n.r-ku1wi2.r-utggzx.r-m611by .css-1dbjc4n.r-18u37iz.r-1wbh5a2 span',
//      nameSelector: '.css-1dbjc4n.r-18u37iz.r-1wbh5a2 span'
//    })
//  }
  // https://twitter.com/i/profiles/popup?user_id=96951817&wants_hovercard=true&_=1503405298280
//  if (document.querySelector('.ProfileCard-screennameLink') != null) {
//    putTooltipOnTwitterBySelector({
//      elementSelector: '.ProfileCard-screennameLink',
//      nameSelector: '.username b'
//    })
//  } else {
    // putTooltipOnTwitterBySelector({
    //   // elementSelector: ".css-1dbjc4n.r-18u37iz.r-1wbh5a2 .css-901oao.css-16my406.r-1qd0xha.r-ad9z0x.r-bcqeeo.r-qvutc0",
    //   // nameSelector: '.css-1dbjc4n.r-18u37iz.r-1wbh5a2 .css-901oao.css-16my406.r-1qd0xha.r-ad9z0x.r-bcqeeo.r-qvutc0',
    //   // elementSelector: '.css-4rbku5.css-1dbjc4n.r-19yat4t.r-mk0yit.r-wk8lta.r-9qu9m4 .css-1dbjc4n.r-18u37iz.r-thb0q2 .css-1dbjc4n.r-1iusvr4.r-46vdb2.r-1777fci.r-5f2r5o.r-bcqeeo .css-1dbjc4n.r-18u37iz.r-1wbh5a2 .css-901oao.css-16my406.r-1qd0xha.r-ad9z0x.r-bcqeeo.r-qvutc0',
    //   elementSelector: '.css-4rbku5.css-1dbjc4n.r-19yat4t.r-mk0yit.r-wk8lta.r-9qu9m4 .css-1dbjc4n.r-18u37iz.r-thb0q2 .css-1dbjc4n.r-1iusvr4.r-46vdb2.r-1777fci.r-5f2r5o.r-bcqeeo',
    //   nameSelector: '.css-4rbku5.css-1dbjc4n.r-19yat4t.r-mk0yit.r-wk8lta.r-9qu9m4 .css-1dbjc4n.r-18u37iz.r-thb0q2 .css-1dbjc4n.r-1iusvr4.r-46vdb2.r-1777fci.r-5f2r5o.r-bcqeeo .css-1dbjc4n.r-18u37iz.r-1wbh5a2 .css-901oao.css-16my406.r-1qd0xha.r-ad9z0x.r-bcqeeo.r-qvutc0',
    //   fnCreateTooltip: function (el, twitterId) {
    //     el.find('.css-1dbjc4n.r-18u37iz.r-1h0z5md.r-1joea0r').before(htmlTooltipOnTwitter(twitterId, newUerRight))
    //   }
    // })
//  }
  // https://twitter.com/i/moments/898265818974343168
//  putTooltipOnTwitterBySelector({
//    elementSelector: '.css-1dbjc4n.r-1awozwy.r-6koalj.r-18u37iz.r-1wbh5a2.r-vlx1xi.r-156q2ks .css-1dbjc4n.r-18u37iz.r-1wbh5a2.r-1f6r7vd',
//    nameSelector: '.css-901oao.css-16my406.r-1qd0xha.r-ad9z0x.r-bcqeeo.r-qvutc0',
//    fnCreateTooltip: function (el, twitterId) {
//      el.find('.css-901oao.css-16my406.r-1qd0xha.r-ad9z0x.r-bcqeeo.r-qvutc0').before(htmlTooltipOnTwitter(twitterId, embNew))
//    }
//  })
//  putTooltipOnTwitterBySelector({
//    elementSelector: '.MomentCapsuleItemTweet',
//    nameSelector: '.MomentUserByline-username .username b',
//    fnCreateTooltip: function (el, twitterId) {
//      el.find('.ProfileTweet-action--more').before(htmlTooltipOnTwitter(twitterId, oldPerRight))
//      // el.parent().find('.ProfileTweet-action.ProfileTweet-action--favorite.js-toggleState').after(relatedConversation(twitterId, oldDesignRight))
//    }
//  })

  // type card 1
//  if (document.querySelector('.css-901oao.r-hkyrab.r-1qd0xha.r-1blvdjr.r-16dba41.r-ad9z0x.r-bcqeeo.r-19yat4t.r-bnwqim.r-qvutc0 a') != null) {
//    document.querySelectorAll('.css-901oao.r-hkyrab.r-1qd0xha.r-1blvdjr.r-16dba41.r-ad9z0x.r-bcqeeo.r-19yat4t.r-bnwqim.r-qvutc0 a').forEach(function (res, n) {
//      if (res.href.indexOf('https://t.co') !== -1) {
//        putTooltipOnTwitterBySelectorCards({
//          elementSelector: '.css-901oao.r-hkyrab.r-1qd0xha.r-1blvdjr.r-16dba41.r-ad9z0x.r-bcqeeo.r-19yat4t.r-bnwqim.r-qvutc0 a',
//          nameSelectorNum: n,
//          nameSelector: '.css-901oao.r-hkyrab.r-1qd0xha.r-1blvdjr.r-16dba41.r-ad9z0x.r-bcqeeo.r-19yat4t.r-bnwqim.r-qvutc0 a',
//          fnCreateTooltip: function (el, twitterId) {
//            el.find('.css-901oao.css-16my406.r-1qd0xha.r-ad9z0x.r-bcqeeo.r-qvutc0').before(htmlTooltipOnTwitterCards(twitterId, newUerRight))
//          }
//        })
//      }
//    })
//  }
//
//  // type card 2,3
//
//  if (document.querySelector('.css-1dbjc4n.r-117bsoe.r-mvpalk.r-156q2ks a') != null) {
//    document.querySelectorAll('.css-1dbjc4n.r-117bsoe.r-mvpalk.r-156q2ks a').forEach(function (res, n) {
//      if (res.href.indexOf('https://t.co') !== -1) {
//        putTooltipOnTwitterBySelectorCards({
//          elementSelector: '.css-901oao.r-hkyrab.r-1qd0xha.r-1blvdjr.r-16dba41.r-ad9z0x.r-bcqeeo.r-19yat4t.r-bnwqim.r-qvutc0',
//          nameSelectorNum: n,
//          nameSelector: '.css-1dbjc4n.r-117bsoe.r-mvpalk.r-156q2ks a',
//          fnCreateTooltip: function (el, twitterId) {
//            el.find('.css-901oao.css-16my406.r-1qd0xha.r-ad9z0x.r-bcqeeo.r-qvutc0').before(htmlTooltipOnTwitterCards(twitterId, newUerRight))
//          }
//        })
//      }
//    })
//  }

//  $('.hasTooltip').each(function () {
//    if (!$(this).hasClass('mouseover-subscribed')) {
//      $(this).addClass('mouseover-subscribed').on('mouseover', function () {
//        showTooltip(this)
//      })
//    }
//  })
}

// related title -- inserting titles over tweets that map to the api response for that tweet id
var IS_TIMELINE_PAGE = window.location.href.match('/timelines/[(0-9)]')
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {

  if (request.message === 'DOM_URL_CHANGED_EVENT') {
      if( window.location.href.match('/timelines/[(0-9)]') ){
      IS_TIMELINE_PAGE = true
    }else{
      IS_TIMELINE_PAGE = false
    }
  }

});

const tweetArr = []
const uniqueTweetIds=[]

function clearTweets(){
  while (tweetArr.length > 0) {
    tweetArr.pop()
    uniqueTweetIds.pop()
  }
}

async function attachTitle(){
  const tweetArrCopy = [...tweetArr]
  const tweetIds = uniqueTweetIds.join(',')
  clearTweets()
  chrome.runtime.sendMessage({ method: 'getTitle', tweetIds: tweetIds }, res => {
    try{
      tweetArrCopy.map(tweet => {
        const tweetId = tweet.tweetId
        if(tweet.node.getElementsByClassName('related-title').length > 0){
          // if title alreay exist then skip
          return
        }
        if(res[tweetId].title){
          var el = document.createElement('a')
          el.href=res[tweetId].collection_url || `https://theconversation.social/c/${res[tweetId].link_id}`
          el.innerHTML=`<svg style="margin-left: -25px;padding-right: 6px;width: 15px;" viewBox="0 0 24 24" class="r-1re7ezh r-4qtqp9 r-yyyyoo r-1xvli5t r-dnmrzs r-bnwqim r-1plcrui r-lrvibr r-1xzupcd"><g><path d="M18.265 3.314c-3.45-3.45-9.07-3.45-12.52 0-3.45 3.44-3.45 9.06 0 12.51 1.5 1.49 3.43 2.38 5.51 2.56v4.14c0 .31.2.6.5.7.08.03.17.05.25.05.22 0 .44-.1.59-.29l6.49-8.11c2.63-3.49 2.27-8.47-.82-11.56zm-10.56 7.87c0-.41.33-.75.75-.75h4.05c.41 0 .75.34.75.75s-.34.75-.75.75h-4.05c-.42 0-.75-.34-.75-.75zm8.6-3.24c0 .42-.34.75-.75.75h-7.1c-.42 0-.75-.33-.75-.75 0-.41.33-.75.75-.75h7.1c.41 0 .75.34.75.75z"></path></g></svg> `
          el.innerHTML += res[tweetId].title
          el.target='_blank'
          el.className='related-title'
          el.style.cssText = `font-weight:700;padding-left:60px;padding-bottom:10px;padding-top:3px;padding-right:45px;text-decoration:none;color:${TW_TITLE_COLOR};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:inline-block;font-size:13px;font-family:-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;`
          //const nodeToAppend = tweet.node.getElementsByClassName('css-1dbjc4n r-1iusvr4 r-16y2uox r-m611by')[0]
          const nodeToAppend = tweet.node.getElementsByClassName('css-1dbjc4n r-1iusvr4 r-16y2uox r-ttdzmv')[0] // update css class -- see issues/150 in git repo
          nodeToAppend.prepend(el)
        }
      })
    }catch(e){
      console.log(e)
    }
  })
}

async function putRelatedTitle(addedNode){
  if(IS_TIMELINE_PAGE || addedNode.getElementsByClassName('related-title').length > 0){
    // if title already exist then skip
    return
  }
  var timeNode = addedNode.getElementsByTagName('time')
  if(timeNode[0]){
    var tweetPermaLink = timeNode[0].parentElement
    var tweetId = getStatusId([tweetPermaLink])
    //console.log('brad printing tweetIds', tweetId)

    if(tweetId){
      if(uniqueTweetIds.includes(tweetId)){
        // if twwetId already exist in arr then skip
        return
      }else{
        tweetArr.push({node:addedNode,tweetId})
        uniqueTweetIds.push(tweetId)
      }
    }
    if(tweetArr.length >= 5){
      attachTitle()
    }
  }
}

// related conversation
var rel_convers = $(relatedConversation('right:20px'));

function putRelatedConversation (addedNode) {
  return // ! temporary removal of related conversation button!!!!!!!!!!!!
  
  var newDesignRight = 'right:20px'
  var oldDesignRight = 'right: 30px;padding-top: 3px;'
  // var newUerRight = 'right: 20px;     bottom: 20px;'
  // var embNew = 'position: inherit !important;bottom: 1px; margin-right: 4px;    padding-left: 6px !important;'
  // var oldPerRight = 'padding-top: 2px;'
  // https://twitter.com/
  if (document.querySelector('.stream-item-header') != null) {   // Selectors for OLD twitter design
    putTooltipOnTwitterBySelectorNew({
      isNewDesign: false,
      elementSelector: '.stream-item-header',
      nameSelector: '.account-group .username b',
      fnCreateTooltip: function (twitterId) {
        el.parent().find('.ProfileTweet-action.ProfileTweet-action--favorite.js-toggleState').after(relatedConversation(oldDesignRight))
      }
    })
  } 
  else if(document.querySelector('[data-testid="tweet"]') != null){  // Selectors for NEW twitter design
    putTooltipOnTwitterBySelectorNew({
      isNewDesign: true,
      element: addedNode, 
      elementSelector: 'article',
      nameSelector: '.css-901oao.css-bfa6kz.r-1re7ezh.r-18u37iz.r-1qd0xha.r-ad9z0x.r-bcqeeo.r-qvutc0 span',
      fnCreateTooltip: function (el) {
        if(el.parent().find('[data-testid="reply"]')[0]!==undefined && el.parent().find('[data-testid="reply"]')[0].parentNode!==undefined) {
          const lastElem = $(el.parent().find('[data-testid="reply"]')[0].parentNode.parentNode).last();
          rel_convers.clone().appendTo(lastElem); // use this instead of IF statement above due to jiggling issue
        }
      }
    })
  }
  // else if(document.querySelector('.css-1dbjc4n.r-18u37iz.r-1wtj0ep.r-zl2h9q.charlotte-modified') != null){  // Selectors for NEW twitter design
  //   putTooltipOnTwitterBySelectorNew({
  //     elementSelector: '.css-1dbjc4n.r-18u37iz.r-1wtj0ep.r-zl2h9q.charlotte-modified',
  //     nameSelector: 'css-901oao.css-16my406.r-1qd0xha.r-ad9z0x.r-bcqeeo.r-qvutc0',
  //     fnCreateTooltip: function (el, twitterId, statusId) {
  //       el.parent().find('.css-1dbjc4n.r-18u37iz.r-1h0z5md.r-1joea0r').after(relatedConversation(twitterId, newDesignRight, statusId))
  //       The above line likely won't work, but may. It is a backup for the line below. We think the below is the Sharebar, above is the right corner arrow.
  //       el.parent().find('.css-1dbjc4n.r-18u37iz.r-1wtj0ep.r-156q2ks.r-1mdbhws').after(relatedConversation(twitterId, newDesignRight, statusId))  
  //     }
  //   })
  // }
  else{

  }
  // https://twitter.com/kylegriffin1
  if (document.querySelector('.ProfileHeaderCard-screennameLink') != null) {
  } else {
  }
  // https://twitter.com/i/profiles/popup?user_id=96951817&wants_hovercard=true&_=1503405298280
  if (document.querySelector('.ProfileCard-screennameLink') != null) {
  } else {
  }
  // https://twitter.com/i/moments/898265818974343168
  // putTooltipOnTwitterBySelector({
  //   elementSelector: '.css-1dbjc4n.r-1awozwy.r-6koalj.r-18u37iz.r-1wbh5a2.r-vlx1xi.r-156q2ks .css-1dbjc4n.r-18u37iz.r-1wbh5a2.r-1f6r7vd',
  //   nameSelector: '.css-901oao.css-16my406.r-1qd0xha.r-ad9z0x.r-bcqeeo.r-qvutc0',
  //   fnCreateTooltip: function (el, twitterId) {
  //     el.find('.css-901oao.css-16my406.r-1qd0xha.r-ad9z0x.r-bcqeeo.r-qvutc0').before(htmlTooltipOnTwitter(twitterId, embNew))
  //   }
  // })
  // putTooltipOnTwitterBySelector({
  //   elementSelector: '.MomentCapsuleItemTweet',
  //   nameSelector: '.MomentUserByline-username .username b',
  //   fnCreateTooltip: function (el, twitterId) {
  //     el.find('.ProfileTweet-action--more').before(htmlTooltipOnTwitter(twitterId, oldPerRight))
  //     el.parent().find('.ProfileTweet-action.ProfileTweet-action--favorite.js-toggleState').after(relatedConversation(twitterId, oldDesignRight))
  //   }
  // })

  // type card 1
  // if (document.querySelector('.css-901oao.r-hkyrab.r-1qd0xha.r-1blvdjr.r-16dba41.r-ad9z0x.r-bcqeeo.r-19yat4t.r-bnwqim.r-qvutc0 a') != null) {
  //   document.querySelectorAll('.css-901oao.r-hkyrab.r-1qd0xha.r-1blvdjr.r-16dba41.r-ad9z0x.r-bcqeeo.r-19yat4t.r-bnwqim.r-qvutc0 a').forEach(function (res, n) {
  //     if (res.href.indexOf('https://t.co') !== -1) {
  //       putTooltipOnTwitterBySelectorCards({
  //         elementSelector: '.css-901oao.r-hkyrab.r-1qd0xha.r-1blvdjr.r-16dba41.r-ad9z0x.r-bcqeeo.r-19yat4t.r-bnwqim.r-qvutc0 a',
  //         nameSelectorNum: n,
  //         nameSelector: '.css-901oao.r-hkyrab.r-1qd0xha.r-1blvdjr.r-16dba41.r-ad9z0x.r-bcqeeo.r-19yat4t.r-bnwqim.r-qvutc0 a',
  //         fnCreateTooltip: function (el, twitterId) {
  //           el.find('.css-901oao.css-16my406.r-1qd0xha.r-ad9z0x.r-bcqeeo.r-qvutc0').before(htmlTooltipOnTwitterCards(twitterId, newUerRight))
  //         }
  //       })
  //     }
  //   })
  // }

  // type card 2,3

  // if (document.querySelector('.css-1dbjc4n.r-117bsoe.r-mvpalk.r-156q2ks a') != null) {
  //   document.querySelectorAll('.css-1dbjc4n.r-117bsoe.r-mvpalk.r-156q2ks a').forEach(function (res, n) {
  //     if (res.href.indexOf('https://t.co') !== -1) {
  //       putTooltipOnTwitterBySelectorCards({
  //         elementSelector: '.css-901oao.r-hkyrab.r-1qd0xha.r-1blvdjr.r-16dba41.r-ad9z0x.r-bcqeeo.r-19yat4t.r-bnwqim.r-qvutc0',
  //         nameSelectorNum: n,
  //         nameSelector: '.css-1dbjc4n.r-117bsoe.r-mvpalk.r-156q2ks a',
  //         fnCreateTooltip: function (el, twitterId) {
  //           el.find('.css-901oao.css-16my406.r-1qd0xha.r-ad9z0x.r-bcqeeo.r-qvutc0').before(htmlTooltipOnTwitterCards(twitterId, newUerRight))
  //         }
  //       })
  //     }
  //   })
  // }

  // $('.hasTooltip').each(function () {
  //   if (!$(this).hasClass('mouseover-subscribed')) {
  //     $(this).addClass('mouseover-subscribed').on('mouseover', function () {
  //       showTooltip(this)
  //     })
  //   }
  // })
}

function NewputTooltipOnWebsitePost () {
  var oldPerRight = 'padding-top: 2px;'
  // https://twitter.com/

  NewputTooltipOnWebsiteBySelector({
    elementSelector: 'twitter-widget',
    nameSelector: 'twitter-widget',
    fnCreateTooltip: function (el, twitterId) {
      el.after(htmlTooltipOnTwitter(twitterId, oldPerRight))
    }
  })

  $('twitter-widget').each(function (n) {
    const domElement = document.querySelectorAll('twitter-widget')[n].shadowRoot.querySelectorAll('.hasTooltip')[0]
    const $element = $(domElement)
    if (!$element.hasClass('mouseover-subscribed')) {
      $($element)
        .addClass('mouseover-subscribed')
        .on('mouseover', function () {
          showTooltip($element, document.querySelectorAll('twitter-widget')[n].shadowRoot)
        })
    }
  })
}

function NewputTooltipOnWebsiteBySelector (option) {
  var elementSelector = option.elementSelector
  var fnCreateTooltip = option.fnCreateTooltip
  $(elementSelector).each(function (n) {
    var el = $(document.querySelectorAll('twitter-widget')[n].shadowRoot.querySelectorAll('.SandboxRoot.env-bp-350 .TweetAuthor.js-inViewportScribingTarget')[0])
    if (!el.hasClass('charlotte-modified')) {
      el.addClass('charlotte-modified')
      var twitterId = document.querySelectorAll('twitter-widget')[n].shadowRoot.querySelectorAll('.SandboxRoot.env-bp-350 .TweetAuthor-nameScreenNameContainer .TweetAuthor-screenName.Identity-screenName')[0].textContent.replace('@', '').toLowerCase()
      // var twitterId = 'barackobama';
      // if(twitterId == "")
      // {
      //    if(document.querySelector('.css-1dbjc4n.r-ku1wi2.r-utggzx.r-m611by .css-1dbjc4n.r-18u37iz.r-1wbh5a2 span') != null){
      //    twitterId = document.querySelector('.css-1dbjc4n.r-ku1wi2.r-utggzx.r-m611by .css-1dbjc4n.r-18u37iz.r-1wbh5a2 span').textContent.replace('@','').toLowerCase();
      //     }
      //     else if(document.querySelector('.css-4rbku5.css-1dbjc4n.r-19yat4t.r-mk0yit.r-wk8lta.r-9qu9m4 .css-1dbjc4n.r-18u37iz.r-thb0q2 .css-1dbjc4n.r-1iusvr4.r-46vdb2.r-1777fci.r-5f2r5o.r-bcqeeo .css-1dbjc4n.r-18u37iz.r-1wbh5a2 .css-901oao.css-16my406.r-1qd0xha.r-ad9z0x.r-bcqeeo.r-qvutc0') != null ){
      //         twitterId = document.querySelector('.css-4rbku5.css-1dbjc4n.r-19yat4t.r-mk0yit.r-wk8lta.r-9qu9m4 .css-1dbjc4n.r-18u37iz.r-thb0q2 .css-1dbjc4n.r-1iusvr4.r-46vdb2.r-1777fci.r-5f2r5o.r-bcqeeo .css-1dbjc4n.r-18u37iz.r-1wbh5a2 .css-901oao.css-16my406.r-1qd0xha.r-ad9z0x.r-bcqeeo.r-qvutc0').textContent.replace('@','').toLowerCase();
      //     }
      // }
      if (checkValidRecipientCached(twitterid)) {
        if (fnCreateTooltip) {
          fnCreateTooltip(el, twitterId)
        } else {
          el.after(htmlTooltipBesideTwitterID(twitterId))
        }
      }
    }
  })
}

function putTooltipBesideTwitterID () {
  function walkThroughTextNodes (node, twId) {
    $(node).find(':not(iframe)')
      .addBack()
      .contents()
      .filter(function () {
        return this.nodeType === Node.TEXT_NODE
      }).each(function () {
        const newNodeValue = this.nodeValue.replace(new RegExp('(' + twId + ')', 'ig'), function (idRef, idName) {
          return idRef + '<charlottetooltip data-twitter-id="' + twId + '" />'
        })
        if (newNodeValue !== this.nodeValue) {
          $(this).replaceWith($('<span>' + newNodeValue + '</span>')[0])
        }
      })
  }

  function walkThroughANodes (node) {
    var nodeName = node.nodeName.toLowerCase()
    if (node.nodeType !== 1 && node.nodeType !== 11) return null
    else if (nodeName === 'style') return null
    else if (nodeName === 'script') return null
    else if (nodeName === 'charlottetooltip') return null
    else if (!node.classList.contains('charlotte-modified')) {
      var href = node.getAttribute('href')
      if (href) {
        var matches = href.match(/^https?:\/\/twitter.com\/(\w+)\/?$/)
        if (matches && matches[1]) {
          node.classList.add('charlotte-modified')
          walkThroughTextNodes(node, matches[1])
        }
      }
    } else {
      for (var i = 0, len = node.childNodes.length; i < len; ++i) {
        walkThroughANodes(node.childNodes[i])
      }
      if (node.shadowRoot) {
        myRoots.push(node)
        walkThroughANodes(node.shadowRoot)
      }
    }
  }

  myRoots = [document.body]
  walkThroughANodes(document.body)
}

function createCharlotteTooltips () {
  myRoots.map(function (root) {
    var nodes = (root.shadowRoot || root).childNodes
    for (const node of nodes) {
      $(node).find('charlottetooltip').each(function () {
        var self = this
        var twitterId = $(self).data('twitter-id')
        if (checkValidRecipientCached(twitterId)) {
          $(self).replaceWith(htmlTooltipBesideTwitterID(twitterId))
        } else {
          $(self).remove()
        }
      })
      $(node).find('.hasTooltip').each(function () {
        if (!$(this).hasClass('mouseover-subscribed')) {
          $(this).addClass('mouseover-subscribed').on('mouseover', function () {
            showTooltip(this, (root.shadowRoot && root))
          })
        }
      })
    }
  })
}

function capitalizeFirstLetter (string) {
  return string.charAt(0).toUpperCase() + string.slice(1)
}

function addToDefaultTooltip(e) {

  // TODO: maybe relatedNode instead??? debug it.
  setTimeout(function() {
    if (e.srcElement.className == 'css-1dbjc4n r-1p0dtai r-1d2f490 r-105ug2t r-u8s1d r-zchlnj r-ipm5af')
    {
      var inEl = e.srcElement;
      // TODO: better locator
      var inTo = inEl.querySelector('div > div > div > div > div > div > div > div > div > div');
      if (inTo.id !== 'insertable-parent-div') {
        var width = inTo.offsetWidth * 1.1;
        $(inTo).css({'width' : width + 'px'});
        $(inTo).children().children().css({'width' : width + 'px'});
      }
      inTo.id = 'insertable-parent-div';
      if ($(inTo).children().length === 0) {
        inTo.addEventListener('DOMNodeInserted', addToTwitterTooltipListener);
      }
      else {
        addToTwitterTooltip(inTo.childNodes[0]);
      }
    }
  }, 50);
}

function adjustImageWidthHeight(el) {
  let img = el.find('.image img');
  if (img.length && img[0].width > img[0].height * 1.3) {
    img.css({
      maxWidth: '100%',
      maxHeight: '100px',
      marginBottom: '10px'
    })
  }
  else {
    img.css({
      maxWidth: '100px',
      maxHeight: '200px'
    })
  }
}

function adjustToViewportPosition(tooltip, contentEl) {
  var tooltipRect = tooltip.getBoundingClientRect();
  const padding = 10;
  var he = $(window).height();
  // to make tooltips #1 taller before scrollbar, change .7 in both lines below:
  if (tooltipRect.height * 0.9 > he * 0.7) {
    $(contentEl).parent().addClass('scrollable').css({
      maxHeight: he * 0.7 + 'px',
      overflowY: 'scroll',
      overflowX: 'hidden'
    });
  }
  tooltipRect = tooltip.getBoundingClientRect();
  if (tooltipRect.top - padding < 0) {
    moveTooltipDown(tooltip, tooltipRect.top - padding);
  }
  else if (tooltipRect.bottom + padding > $(window).height()) {
    // Move tooltip "down" by negative value. Actually goes up
    moveTooltipDown(tooltip, $(window).height() - tooltipRect.bottom - padding);
  }
}

function moveTooltipDown(tooltip, value) {
  var adjustableParent = $(tooltip).parent().parent().parent();
  if (adjustableParent[0].style.top !== '')
  {
    let fromTop = parseFloat(adjustableParent[0].style.top);
    adjustableParent[0].style.top = (fromTop + value) + 'px';
  }
  else if (adjustableParent[0].style.bottom !== '')
  {
    let fromBottom = parseFloat(adjustableParent[0].style.bottom);
    adjustableParent[0].style.bottom = (fromBottom + value) + 'px';
  }
}

window['putTooltipOnTwitterPost'] = putTooltipOnTwitterPost
window['createCharlotteTooltips'] = createCharlotteTooltips
window['putTooltipBesideTwitterID'] = putTooltipBesideTwitterID
window['NewputTooltipOnWebsitePost'] = NewputTooltipOnWebsitePost
window['putRelatedConversation'] = putRelatedConversation
window['putRelatedTitle'] = putRelatedTitle
window['addToDefaultTooltip'] = addToDefaultTooltip
window['removeIcons'] = removeIcons
window['SERVER'] = SERVER
// $('body').on('click', 'related-button', function() {
//   console.log('here')
//   // do something
// });

// var actualCode = `
//   var items = document.querySelectorAll(".related-button");
//   console.log("ITEMS !!!")
//   console.log(items)
//   for (var i = 0; i < items.length; i++) {
//     items[i].addEventListener("click", function (){
//       alert("Hello!"); 
//     });
//   }`
    
// var script = document.createElement('script');
// script.textContent = actualCode;
// (document.head||document.documentElement).appendChild(script);