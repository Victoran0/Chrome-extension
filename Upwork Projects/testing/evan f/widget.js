(function (global) {
  // now all code is inside function initWidget like this:
  // global.initWidget = function() {
  // <here all the code>
  // }
  // later when using on server it is needed to move code outside this function
  // and remove this function
  // or leave it but user after setting configuration needs to use initWidget() in html file
  var scrollTimer = null;
  var CURATION_FINISHED = false;
  const SERVER = 'theconversation.social'
  const EXTENSION_TYPE = 'private_demo_for_twitter'
  const MAX_ARTICLES = 12;
  let ACTIVE_ITEM = 'all'; //twitter, instagram, tiktok, youtube, podcast, ai summary
  let ACTIVE_AI_ITEM = ''; //social, data, article, question, outcome, custom
  const DEFAULT_AI_SUMMARY = 'social-summary';
  let ai_summary = [];

  //for testing
  var test_mode = false
  // var test_url = "https://people.com/pat-sajak-reacts-ryan-seacrest-named-new-wheel-of-fortune-host-7554568";
  // var test_url = "https://www.usatoday.com/videos/news/politics/2023/08/16/george-santos-campaigner-indicted-after-posing-kevin-mccarthy-aide/8358972001/"
  var test_url = "https://www.espn.com/soccer/story/_/id/38205019/transfer-talk-liverpool-eye-endo-caicedo-lavia-snubs"
  // var test_url = "https://www.espn.com/nfl/story/_/id/38203104/bucs-wr-russell-gage-carted-serious-knee-injury"

  global.initVideoClickHadler = (data) => {
    $('.video_link').unbind(`click`);
    $('.video_link').on('click', () => {
      chrome.tabs.getCurrent(function(currTab) {
        if (currTab) {
          chrome.tabs.sendMessage(currTab.id, {message: 'CLICK_VIDEO_LINK', data: data})
        }
      });
    });
  }

  //auto scrolling when slide the item
  (function() {
    const parentElement = document.querySelector(".custom-scroll");
    const childElements = document.querySelectorAll(".custom-scroll .nav-item");
    let isMouseDown = false;
    let startX, scrollLeft;

    childElements.forEach((liElement) => {
      liElement.addEventListener("mousedown", (e) => {
        isMouseDown = true;
        startX = e.pageX - liElement.offsetLeft;
        scrollLeft = parentElement.scrollLeft;
      });

      liElement.addEventListener("mouseleave", () => {
        isMouseDown = false;
      });

      liElement.addEventListener("mouseup", () => {
        isMouseDown = false;
      });

      liElement.addEventListener("mousemove", (e) => {
        if (!isMouseDown) return;
        e.preventDefault();
        const x = e.pageX - liElement.offsetLeft;
        const walk = x - startX;
        parentElement.scrollLeft = scrollLeft - walk;
      });
    });
  })();

  global.initWidget = function (options, URL, Ajax) {
    for (var option in options) {
      var key = 'social_curation_' + option
      if (global[key] !== undefined) {
        options[option] = global[key]
      }
    }

    for (var option in options) {
      var key = 'social_curation_' + option
      if (global[key] !== undefined) {
        options[option] = global[key]
      }
    }

    var element = document.getElementById(options.id)
    if (!element) {
      throw Error('Unable to find element with id', options.id)
    }

    var cssId = 'social-curation-css-file'
    if (!document.getElementById(cssId)) {
      var head = document.getElementsByTagName('head')[0]
      var link = document.createElement('link')
      link.id = cssId
      link.rel = 'stylesheet'
      link.type = 'text/css'
      link.href = options.css_file
      link.media = 'all'
      head.appendChild(link)
    }

    var getClosest = function (elem, selector) {
      // Element.matches() polyfill
      if (!Element.prototype.matches) {
        Element.prototype.matches =
                        Element.prototype.matchesSelector ||
                        Element.prototype.mozMatchesSelector ||
                        Element.prototype.msMatchesSelector ||
                        Element.prototype.oMatchesSelector ||
                        Element.prototype.webkitMatchesSelector ||
                        function (s) {
                          var matches = (this.document || this.ownerDocument).querySelectorAll(s),
                            i = matches.length
                          while (--i >= 0 && matches.item(i) !== this) {}
                          return i > -1
                        }
      }

      // Get closest match
      for (; elem && elem !== document; elem = elem.parentNode) {
        if (elem.matches(selector)) return elem
      }

      return null
    }

    var get = function (obj, key) {
      if (key === '') { return obj }
      key = key.split('.')
      var currKey = key.shift()
      key = key.join('.')

      if (!isNaN(currKey)) { currKey = parseInt(currKey) }

      if (currKey === '*') {
        var ret = []
        if (obj.length) {
          for (var i = 0; i < obj.length; i++) {
            ret.push(get(obj[i], key))
          }
        } else if (Object.keys(obj).length) {
          for (var _k in obj) {
            ret.push(get(obj[_k], key))
          }
        }
        if (ret.constructor === Array) {
          ret = [].concat.apply([], ret)
        }
        return ret
      }
      if (typeof obj[currKey] == 'undefined' || obj[currKey] === null) {
        return obj[currKey]
      } else {
        return get(obj[currKey], key)
      }
    }

    var reorder = function (list, key) {
      if (list.length) {
        list.sort(function (a, b) {
          if (get(a, key) > get(b, key)) {
            return -1
          }
          else if (get(a, key) < get(b, key)) {
            return 1
          }
          return 0
        })
      }
    }
    
    var time_ago = function (time) {
      switch (typeof time) {
        case 'number':
          break
        case 'string':
          time = +new Date(time)
          break
        case 'object':
          if (time.constructor === Date) time = time.getTime()
          break
        default:
          time = +new Date()
      }
      var time_formats = [
        [60, 'seconds', 1], // 60
        [120, '1 minute ago', '1 minute from now'], // 60*2
        [3600, 'minutes', 60], // 60*60, 60
        [7200, '1 hour ago', '1 hour from now'], // 60*60*2
        [86400, 'hours', 3600], // 60*60*24, 60*60
        [172800, 'Yesterday', 'Tomorrow'], // 60*60*24*2
        [604800, 'days', 86400], // 60*60*24*7, 60*60*24
        [1209600, 'Last week', 'Next week'], // 60*60*24*7*4*2
        [2419200, 'weeks', 604800], // 60*60*24*7*4, 60*60*24*7
        [4838400, 'Last month', 'Next month'], // 60*60*24*7*4*2
        [29030400, 'months', 2419200], // 60*60*24*7*4*12, 60*60*24*7*4
        [58060800, 'Last year', 'Next year'], // 60*60*24*7*4*12*2
        [2903040000, 'years', 29030400], // 60*60*24*7*4*12*100, 60*60*24*7*4*12
        [5806080000, 'Last century', 'Next century'], // 60*60*24*7*4*12*100*2
        [58060800000, 'centuries', 2903040000] // 60*60*24*7*4*12*100*20, 60*60*24*7*4*12*100
      ]
      var seconds = (+new Date() - time) / 1000,
        token = 'ago',
        list_choice = 1

      if (seconds == 0) {
        return 'Just now'
      }
      if (seconds < 0) {
        seconds = Math.abs(seconds)
        token = 'from now'
        list_choice = 2
      }
      var i = 0, format
      while (format = time_formats[i++]) {
        if (seconds < format[0]) {
          if (typeof format[2] == 'string') {
            return format[list_choice]
          } else {
            return Math.floor(seconds / format[2]) + ' ' + format[1] + ' ' + token
          }
        }
      }
      return time
    }

    var formatDate = function (date) {
      var getMonth = function (month) {
        return ['Jan','Feb','Mar','Apr','May','June','July','Aug','Sep', 'Oct','Nov','Dec'][parseInt(month)]
      }
      var time = new Date(date)
      var ampm = (time.getHours() >= 12) ? 'PM' : 'AM'
      var hours = (time.getHours() >= 12) ? time.getHours() - 12 : time.getHours()
      var timeText = hours + ':' + time.getMinutes() + ' ' + ampm + ' - ' + time.getDate() + ' ' + getMonth(time.getMonth()) + ' ' + time.getFullYear()
      return timeText
    }

    var apiurl = 'https://' + SERVER + '/social_curation/'

    url = apiurl + '?url=' + encodeURIComponent(URL) + '&fabric_source=' + EXTENSION_TYPE
    pageurl = URL
    if (options.defaultaimode) {
      url += "&fabric_summarization=true&ai_modes=social-summary"
    }
    if (options.speaker_types.news_comments) {
      url += '&newscomments=true'
    }
    if (options.showOtherNetwork) {
      url += '&show_network=all';
    } else {
      url += '&show_network=twitter';
    }
    if (test_mode) {
      var  url = "https://theconversation.social/social_curation/?url=" + test_url + '&fabric_summarization=true&ai_modes=social-summary'
      // ,ai_modes=article-generation,data-visualization,probable-outcomes,poll-questions
    }

    var timesQueried = 0

    var request = function (success) {
      console.log('request url:', url)
      Ajax.request({
        url: url,
        method: 'get'
      }, function (data) {
        if (data) {
          success(data)
        }
      })
    }

  // Personalized read recommendations using site domain
    function extractHostname(url) {
      var hostname;
      //find & remove protocol (http, ftp, etc.) and get hostname
  
      if (url.indexOf("//") > -1) {
          hostname = url.split('/')[2];
      }
      else {
          hostname = url.split('/')[0];
      }
  
      //find & remove port number
      hostname = hostname.split(':')[0];
      //find & remove "?"
      hostname = hostname.split('?')[0];
  
      return hostname;
  }

    var getCurrentTabUrl = () => {  
      var queryInfo = {
        active: true, 
        currentWindow: true
      };
    
      return new Promise((res, rej)=>{
        chrome.tabs.query(queryInfo, function(tabs) {
          var tab = tabs[0]; 
          var url = tab.url;
          res(url);
        });
      })
    }

    var readDomainName = async () => {
      var url = await getCurrentTabUrl()
      var hostName = extractHostname(url)
      var domain = hostName;
    
      if (hostName != null) {
          var parts = hostName.split('.').reverse();
          
          if (parts != null && parts.length > 1) {
              domain = parts[1] + '.' + parts[0];
          }
      }
      return domain.toUpperCase()
    }
    function convertTitleToId(title) {
      return title.replace(/\s+/g, '-').toLowerCase();
    }
    //////////////////////////////

    async function save_collection_info(data, tw_share_link){
      // saving collection info to local storage so we can use the data on the collection page 
      var collection_info = {"Public Figures Involved": null, "Notable People & Influencers": null, "Commentators & Journalists": null, "General Public": null}
      // don't do public figures header because it is too high and close to page header, plus
      // user sees the header inserted
      //if (data.public_figures_involved.tweets[0]){
      //  collection_info["Public Figures Involved"] = data.public_figures_involved.tweets[0]['id']
      //}
      // we check if public_figures_involved array exists; if it does, others will as well. 
      if (data.public_figures_involved){
        if ((data.notable_people_and_orgs.tweets[0]) && (data.public_figures_involved.tweets[0])){
          collection_info["Notable People & Influencers"] = data.notable_people_and_orgs.tweets[0]['id']
        }
        if ((data.media.tweets[0]) && ((data.public_figures_involved.tweets[0]) || (data.notable_people_and_orgs.tweets[0]))){
          collection_info["Commentators & Journalists"] = data.media.tweets[0]['id']
        }
        if ((data.general_public.tweets[0]) && ((data.public_figures_involved.tweets[0]) || (data.notable_people_and_orgs.tweets[0]) || (data.media.tweets[0]))){
          collection_info["General Public"] = data.general_public.tweets[0]['id']
        }
      }
      collection_info["link_id"] = data.link_id
      collection_info["link_text_share_url"] = tw_share_link
      collection_info["collection_id"] = /[^/]*$/.exec(data.collection_url)[0]
      chrome.storage.local.set({"collection_page_info": collection_info}, function () {
      });
    }

    function setLenghtBadge(arr) {
      if (!options.showOtherNetwork) {
        arr = {
          all: 0,
          twitter: arr.twitter,
          instagram: 0,
          tiktok: 0,
          youtube: 0,
          podcast: 0,
          facebook: 0
        };
      }
        var cc = 0;
        // $('#media_tabs').removeClass('hidden');
        for (const [key, value] of Object.entries(arr)) {
          if (value) {
            cc ++;
            $(`[data-item="${key}"]`).parent().removeClass('hidden');
            $(`[data-item="${key}"]`).children('.badge').text(value);
          } else {
            $(`[data-item="${key}"]`).parent().addClass('hidden');
          }
        }
        $(`[data-item="ai"]`).parent().removeClass('hidden');
        if (cc > 4) {
          $('.d-name').addClass('hidden');
        } else {
          $('.d-name').removeClass('hidden');
        }
    }

    function media_events(data){
       let redirect_link
       if (!data.collection_url){
         redirect_link = `https://${SERVER}/c/${data.link_id}`
     } else {
         redirect_link = data.collection_url
       }
       let tw_share_link = redirect_link
       if(is_left_bar) {
         $('.leftside_bar_js').css({'display': 'flex'})
       }

       $('.spinner').hide() // ONLY FOR DEMO
       $('.no_result').show()
       $(`[data-item="ai"]`).parent().addClass('hidden');

       if(data.article_summary){
         if(!data.collection_url){
           tw_share_link = `https://twitter.com/compose/tweet?text=@TheConversocial%20on%20${data.article_summary.title}%0A%0Ahttps://theconversation.social/c/${data.link_id}`
           $('.link_text_share').attr('href', tw_share_link)
         } else {
           tw_share_link = `https://twitter.com/compose/tweet?text=@TheConversocial%20on%20${data.article_summary.title}%0A%0A${data.collection_url}`
           $('.link_text_share').attr('href', tw_share_link)
         }
       }

       $('.link_text').text(redirect_link);
       $('.bottom_link_redirect').attr('href', redirect_link);
       $('#fullPageTweets-view').attr('href', redirect_link);
       // now add click handlers
       $('.bottom_link_redirect').on("click", function(){
           save_collection_info(data, tw_share_link)
         });
       $('#fullPageTweets-view').on("click", function(){
           save_collection_info(data, tw_share_link)
         });
       global.initVideoClickHadler(data);
    }

    var scrollTop = 0
    var timesShown = 1
    var ulId = 'ROOT_ELEMENT_UL'
    var ulElement = null
    var currentSlide = 0
    var refresh_tweets = true;
    var tweets_count = 0;
    var ai_background_task = false;
    var is_summary_show = true;
    var fullPageTweets = document.getElementById('fullPageTweets');
    var fullPageTweetsCounter = document.getElementById('fullPageTweets-count');
    var expandPageTweets = document.getElementById('fullPageTweets-expand');
    var query = function (refresh_tweets) {
      request(function (data) {
        timesQueried += 1

        console.log('Times queried ', timesQueried, '/', options.max_queries_before_stop)
        if (timesQueried > options.max_queries_before_stop || data.link_id === null || !data.link_id || 
          ((data.errors) && (JSON.stringify(data.errors).includes('1003')))) {
          global.interval.clearAsyncInterval();
          
        }

        if (data['status'] === 'pending') {
          return ;
        }
        if (data['status'] === 'incomplete') {

          // Illia start
          media_events(data)
          if(refresh_tweets && tweets_count < data.stats.total_tweets && data.stats.tweets_count_added_in_last_update > 0) {
            $('.refresh_js').text(`${data.stats.tweets_count_added_in_last_update} tweets added`);
            tweets_count = data.stats.total_tweets
          }
          setTimeout(() => {
            $('.refresh_js').text('');
          }, 2500);
          // Illia end
          parseData(data);
        }
        if (data['status'] === 'finished') {
          if (ai_background_task) {
            console.log('social summary polling ...', ai_background_task)
            var social_summary = data['summarization']?.find((item) => item.title==='Social Summary');
            if (social_summary && social_summary['content']) {
              ai_background_task = false;
              global.interval.clearAsyncInterval();
              
              // Update the content of social summary
              updateSummaryContent('social-summary', [social_summary['content']]);

              //do something with social summary
              showSummaryBox();
            }
            
            //   //for only test
            // if (timesQueried > 5) {
            //   updateSummaryContent('social-summary', `This is test social summary. \n This is test social summary. This is test social summary. This is test social summary \n This is test social summary. End temporary content. \n `);
            //   showSummaryBox();
            //   global.interval.clearAsyncInterval();
            // }
          } else {
            console.log('finished polling')
            media_events(data)
            setTimeout(() => {
              $('.refresh_js').text('')
            }, 2500);
            // Illia end
            parseData(data);
            if (options.defaultaimode) {
              ai_background_task = true;
            } else {
              global.interval.clearAsyncInterval();
            }
          }
        }
      })
    }
    var onceShowedSummaryBox = false;
    var showSummaryBox = function () {
      if (ACTIVE_ITEM === 'ai' || !options.defaultaimode) return ;
      var content = findSummaryContent('social-summary');
      ulElement = document.getElementById(ulId);
      var summaryBox = document.getElementsByClassName('summary-box');
      if (!is_summary_show || !content || !ulElement || summaryBox.length > 0) return ;
 
      if (content.startsWith("\n\n")) content = content.slice(2);
      var child = `
        <div class="summary-box box" style="background-color: #fff; ${onceShowedSummaryBox?"opacity: 1;":""}">
          <div class="box-header">
            <h3 class="box-title font-20">Social Summary</h3>
            <button type="button" class="close" aria-label="Close">
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
          <div class="box-content" id="typedtext">
          ${content.replace(/\n/g, "<br />")}
          </div>
        </div>
      `;

      $(element).parent().parent().scrollTop(0);
      ulElement.insertAdjacentHTML('afterbegin', child);
      updateMediaItems();
      setTimeout(function() {
        if (!onceShowedSummaryBox) $('.summary-box').addClass('fade-in');
        // if (!onceShowedSummaryBox) typingContent(content);
        onceShowedSummaryBox  = true;

        updateMediaItems();
        $('.summary-box .close').click(function() {
          $('.summary-box').remove();
          is_summary_show = false;
          updateMediaItems();
        })
      }, 500);
    }
    global.interval = new AsyncInterval(async function () {
      //console.log('Times queried', timesQueried, 'max_queries_before_stop', options.max_queries_before_stop)
      // sleep before the second request (api call) to give the server time to handle the init request
      if (timesQueried == 1) {
       await sleep(1.5);
      }
      $('.refresh_js').text('') // removing "Refreshing..." because it is distracting
      query(refresh_tweets)
    }, options.query_frequency_seconds * 1000)
    query()

    var parseData = async function (data) {
      var filter_tweets = function (tweet_list, key, value, exclude = false) {
        return filter_many_tweets(tweet_list, [key], value, exclude)
      }
      var filter_many_tweets = function (tweet_list, keys, values, exclude = false) {
        values = values.split(',')
        var ret = []
        for (var i = 0; i < tweet_list.length; i++) {
          var cond = exclude
          for (var j = 0; j < keys.length; j++) {
            var tweetVal = get(tweet_list[i], keys[j])
            if (values.indexOf(tweetVal) !== -1) {
              cond = !exclude
            } else if (tweetVal && tweetVal.constructor === Array) {
              for (var k = 0; k < tweetVal.length; k++) {
                if (values.indexOf(tweetVal[k]) !== -1) {
                  cond = !exclude
                }
              }
            }
          }

          if (cond) ret.push(tweet_list[i])
        }
        return ret
      }

      var filter_category_tags = function (tweet_list) {
        if (options.category_tags_whitelist.length === 0) {
          return tweet_list
        }
        var keys = [
          'twitter_category.category',
          'twitter_category.subcategory',
          'category.category',
          'category.subcategory',
          'tags'
        ]
        return filter_many_tweets(tweet_list, keys,
          options.category_tags_whitelist)
      }

      var remove_duplicate_id = function (list) {
        var ids = []
        var res = []

        for (var i = 0; i < list.length; i++) {
          if (ids.indexOf(list[i]['id']) === -1) {
            res.push(list[i])
            ids.push(list[i]['id'])
          }
        }
        return res
      }

      var remove_widelyreported_duplicates = function (list) {
        var keys = {} // key -> pos
        var res = []

        for (var i = 0; i < list.length; i++) {
          if (list[i]['media_section'] != 'widelyreported') {
            res.push(list[i])
            continue
          }

          var pos = keys[list[i]['cluster_id']]
          if (pos !== undefined && res[pos]['followers'] < list[i]['followers']) {
            res[pos] = list[i]
            continue
          }

          res.push(list[i])
          keys[list[i]['cluster_id']] = res.length - 1
        }
        return res
      }

      var standardPosts = function (posts, type, params={}) {
        var new_posts = [];
        if (!posts) return new_posts;
        console.log({type,params,posts})

        var count = Math.min(posts.length, MAX_ARTICLES)
        if (type === 'tiktok') {
          for (var i = 0; i < count; i++) {
            let created_at = new Date(posts[i].created_time * 1000);
            var video_iframe = "<br><br>" +  ` 
              <div style="height: 576px;min-height:30px; width: 100%" data-tiktok="${posts[i].id}">
              </div>
            `
            new_posts.push({
              id: posts[i].id,
              itemType: 'tiktok',
              profile_image_url: posts[i].author.avatar,
              user_name: posts[i].author.nickname,
              text: posts[i].description,
              from_full_url: 'tiktok.com',
              date: created_at.toISOString(),
              bio: posts[i].author?.bio,
              account_url: posts[i].author.userhandle?`https://www.tiktok.com/@${posts[i].author.userhandle}`:undefined,
              user_account: posts[i].author.userhandle,
              likes_count: posts[i]?.stats?.diggCount || 0,
              tw_media_html: {
                  compact_mode:video_iframe,
                  full_mode: video_iframe
              },      
              overall_relevance: ((posts[i]?.stats?.playCount || 0) * 1.0 + 1.0 - 1.0)/1.0,
              ...params
            })
          }
        } else if (type === 'instagram') {
          for (var i = 0; i < count; i++) {
            var image_iframe =  `<div id="tweetimage" style="background-image:url(${posts[i].image_url})"> </div>`
           
            new_posts.push({
              itemType: 'instagram',
              id: posts[i].id,
              profile_image_url: posts[i].image_url,
              user_name: posts[i].user_name,
              text: posts[i].text,
              from_full_url: 'instagram.com',
              likes_count: posts[i].likes,
              account_url: `https://www.instagram.com/${posts[i].user_handle}`,
              user_account: posts[i].user_handle,
              tw_media_html: {
                  compact_mode:image_iframe,
                  full_mode: image_iframe
              },   
              overall_relevance: ((posts[i].likes || 0) * 1.0 + 1.0 - 1.0)/1.0,
              ...params
            })
          }
        } else if (type === 'youtube') {
          for (var i = 0; i < count; i++) {
            new_posts.push({
              itemType: 'youtube',
              id: posts[i].id,
              profile_image_url: posts[i].thumbnail,
              user_name: posts[i].uploader,
              text: posts[i].title +
                      "<br><br>" +  ` 
                <div style="height: 232px; min-height:30px;" data-video="${posts[i].id}"></div>
              `,
              from_full_url: "https://www.youtube.com/watch?v=" + posts[i].id,
              likes_count: 0,
              date: posts[i].dateUploaded
            })
          }
        } else if (type === 'podcast') {
          for (var i = 0; i < count; i++) {
            new_posts.push({
              itemType: 'podcast',
              id: posts[i].id,
              profile_image_url: posts[i].image_url,
              user_name: posts[i].author_name,
              text: posts[i].title + 
                  "<br><br>" +  `
                    <div style="height: 60px; min-height:30px;" data-podcast="${posts[i].id}"></div>
                    `,
              from_full_url: posts[i].itunes_episode_url,
              streaming_url: posts[i].streaming_url,
              likes_count: 0,
              date: posts[i].publishedat
            })     
          }
        }else if (type === 'facebook') {
          //rajat start
          for (var i = 0; i < count; i++) {
            const embed_url=`https://www.facebook.com/plugins/post.php?href=${posts[i].url}&show_text=true`
            const iframe=  `<div style="text-align:center;">
                                <iframe src=${embed_url} frameborder="0" allowtransparency="true" width="100%" height="530px"></iframe>
                              </div>`
            new_posts.push({
              itemType: 'facebook',
              from_full_url: 'facebook.com',
              id: posts[i].id,
              profile_image_url: posts[i].image_url || "https://www.google.com/s2/favicons?domain_url=facebook.com",
              user_name: posts[i].user_name,
              text: posts[i].text,
              likes_count: 0,
              tw_media_html: {
                compact_mode:iframe,
                full_mode: iframe
            },
              date:posts[i].date || ''
            })     
          }
          //rajat end
        }else if(type === 'linkedin'){	
          //rajat start	
          for (var i = 0; i < count; i++) {	
            const default_profile_image_url = "https://www.google.com/s2/favicons?domain_url=linkedin.com"	
            // const embed_url =`"https://www.linkedin.com/embed/feed/update/urn:li:activity:${posts[i].id}"`	
            // const iframeImage= `<div style="text-align:center;"><iframe src=${embed_url}  type="text/html" frameborder="0" allowtransparency="true" width="80%" scrolling="no" height="400px"></iframe></div>`	
            new_posts.push({	
              itemType: 'linkedin',	
              from_full_url: 'linkedin.com',	
              id: posts[i].id,	
              profile_image_url: posts[i].image_url || default_profile_image_url,	
              user_name: posts[i].user_name,	
              text: posts[i].text,	
              likes_count: 0,	
              user_account: posts[i].user_handle,	
              date:posts[i].date || '',	
              // tw_media_html: {	
              //   compact_mode:iframeImage,	
              //   full_mode: iframeImage	
              // },	
            })     	
          }	
          //rajat end
        }else {
          for (var i = 0; i < posts.length; i++) {
            const post = {...posts[i], itemType: type};
            new_posts.push(post)     
          }
        }
        return new_posts;
      }

      var tweets = []
      var post_tweets_section = function (name, tw, max_items = 0) {
        if (tw.length) {
          if (max_items > 0) {
            tw = tw.slice(0, max_items)
          }
          tweets.push({section: name, tweets: tw})
        }
      }
      
      // Personalization Section - Topical Tweets from People you follow
      if (true) {
        var tw = []

        tw.push.apply(tw, standardPosts(get(data, 'personalization.topical_tweets_from_people_you_follow'), 'twitter'))

        tw = remove_duplicate_id(tw)

        post_tweets_section('From Friends & People You Follow', tw, 10)
        // if (options.required_speaker_types.other_public_figures && !tw.length) {
        //   console.log('Other public figures required but empty')
        //   return
        // }
      }
      // End Personalization Section - Topical Tweets from People you follow

      // Publisher Section - Tweets from Publisher Staff/Journalists
      if (true) {
                var tw = []
                tw.push.apply(
                    tw,
                    standardPosts(get(
                        data,
                        'media.pub_staff'
                    ), 'twitter')
                )
                tw = remove_duplicate_id(tw)
                if (tw.length > 0) {
                    var domainName = await readDomainName()
                    post_tweets_section(
                        'From ' + domainName + ' ' + 'Journalists',
                        tw,
                        10
                    )
                }
            }
      // End - Publisher Section - Tweets from Publisher Staff/Journalists
    
      if (options.speaker_types.public_figures) {
        var tw = []

        // public figures involved
        // before
        tw.push.apply(tw, standardPosts(get(data, 'public_figures_involved.tweets'), 'twitter'))        
        tw.push.apply(tw, standardPosts(get(data, 'public_figures_involved.facebook_posts'), 'twitter'))

        
        
        tw = filter_category_tags(tw)

        var section_title = options.display_top_section_header ? 'Public figures involved' : '&nbsp;'
        post_tweets_section(section_title, tw, options.max_results_per_section.public_figures)
        if (options.required_speaker_types.public_figures && !tw.length) {
          console.log('Public figures required but empty')
          return
        }
      }
      if (options.speaker_types.other_public_figures) {
        var tw = []

        // More public figures
        tw.push.apply(tw, standardPosts(get(data, 'notable_people_and_orgs.tweets'), 'twitter'))

        // EVAN: WHAT IS THIS DOING????????? FILTERING OUT COMMENTATOR AND REPORTER? FROM WHERE ???????
        // p = get(data, 'fb-posts')
        // if(p) p = filter_many_tweets(p, ['category.category'], 'commentator,reporter', true);
        // tw.push.apply(tw, p);

        tw.push.apply(tw, standardPosts(get(data, 'notable_people_and_orgs.tiktok_posts'), 'tiktok'))
        tw.push.apply(tw, standardPosts(get(data, 'notable_people_and_orgs.instagram_posts'), 'instagram'))

         //RAJAT START	
         tw.push.apply(tw, standardPosts(get(data, 'notable_people_and_orgs.facebook_posts'), 'facebook'))	
         tw.push.apply(tw, standardPosts(get(data, 'notable_people_and_orgs.linkedin_posts'), 'linkedin'))	
         //RAJAT END

        // REMOVE 7/28  Related people
        // REMOVE 7/28  var rtw = [];
        // REMOVE 7/28  rtw.push.apply(rtw, get(data, 'related-peoples.valid_fb_posts.*'));
        // REMOVE 7/28  delete Related people tweets with news category
        // REMOVE 7/28  rtw = filter_tweets(rtw, 'twitter_category.category', 'news', true);
        // REMOVE 7/28  tw.push.apply(tw, rtw);

        // EVAN OPTIMIZATION: Only needed if we want to filter by category??????????????????
        //tw = filter_category_tags(tw);

        // EVAN: do we need to dedupe??????????????????
        tw = remove_duplicate_id(tw)

        post_tweets_section('Notable People', tw, options.max_results_per_section.other_public_figures)
        if (options.required_speaker_types.other_public_figures && !tw.length) {
          console.log('Other public figures required but empty')
          return
        }
      }
      if (options.speaker_types.media) {
        // media
        var tw = []
        tw.push.apply(tw, standardPosts(get(data, 'media.tweets'), 'twitter'))

        // EVAN: Is this needed???????????????? COMMENTED OUT FOR NOW AS IT BROKE WIDGET
        // if(p) p = filter_tweets(p, 'media_category', 'news_organization');
        // tw.push.apply(tw, p);

        // EVAN: Is this needed???????????????? COMMENTED OUT FOR NOW AS IT BROKE WIDGET
        // p = get(data, 'fb-posts');
        // console.log('P: ', p, data);

        // EVAN: Is this needed???????????????? COMMENTED OUT FOR NOW AS IT BROKE WIDGET
        // if(p) p = filter_many_tweets(p, ['category.category'], 'commentator,reporter');

        // //for (var i=0; i < p.length; i++) {
        // //    p[i].overall_relevance = p[i].likes_count;
        // //    var m = {'commentator': 'commentators', 'reporter': 'reporter'};
        // //    p[i].media_section = m[p[i].category.category];
        // //}
        // EVAN: Is this needed???????????????? COMMENTED OUT FOR NOW AS IT BROKE WIDGET
        // //tw.push.apply(tw, p);

        var allow_news = 'commentators,reporter,notprinted'
        allow_news += ',' + options.allow_news

        // //tw = filter_many_tweets(tw, ['media_section'], allow_news)

        if (tw.length) {
          tw = remove_widelyreported_duplicates(tw)

          // for (var k1 = 0; k1 < tw.length; k1++) {
          //   switch (tw[k1].media_section) {
          //     case 'commentators':
          //       tw[k1].overall_relevance += 5000000
          //       break
          //     case 'reporter':
          //       tw[k1].overall_relevance += 4000000
          //       break
          //     case 'storydevelopmet':
          //       if (options.storydevlopment_prefer_date) {
          //         tw[k1].overall_relevance = parseFloat(tw[k1].minutes_old)
          //       }
          //       tw[k1].overall_relevance += 3000000
          //       break
          //     case 'notprinted':
          //       tw[k1].overall_relevance += 2000000
          //       break
          //     case 'widelyreported':
          //       tw[k1].overall_relevance += 1000000
          //       break
          //     default:
          //       break
          //   }
          // }

          const sortMedia = (list, sortOptions, orderValue = null) => {
            if (list.length && orderValue) {
              // Sort by media_section_api
              const sortByObject = orderValue.reduce(
                (obj, item, index) => ({
                    ...obj,
                    [item]: index
                }), {})
              list.sort((a, b) => sortByObject[a[sortOptions.group]] - sortByObject[b[sortOptions.group]])

              //Group by media_section_api
              var groupedTweets = {}
              orderValue.forEach(value => {
                groupedTweets[value] = list.filter(function(tweet) {
                  if(tweet[sortOptions.group] == value) {
                    return tweet
                  }
                })
              });

              //Catch when no group or not listed in sortOptions
              // uncomment this if you want others to appear with nonlisted subsection
              // groupedTweets['others'] = list.filter(function(tweet) {
              //   if(tweet[sortOptions.group] == undefined || !(tweet[sortOptions.group] in orderValue)) {
              //     return tweet
              //   }
              // });
              // groupedTweets['others'].sort(sortByRelevance(sortOptions))

              //Sort by relevance after being grouped by media_section_api
              orderValue.forEach(value => {
                groupedTweets[value].sort(sortByRelevance(sortOptions))
              });

              //Merge sorted results
              list = Object.keys(groupedTweets).reduce(function (r, k) {
                return r.concat(groupedTweets[k]);
              }, []);
              return list;
            }
          }

          const sortByRelevance = function(key) {
            return function(a, b) {
              if (a[key.key] < b[key.key]) return key.order == 'desc' ? 1 : -1; // will be 1 if DESC
              else return key.order == 'desc' ? -1 : 1; // will be -1 if DESC
            }
          }

          const sortOptions = {
            group: 'media_section_api', // grouping or subsection field
            key: 'overall_relevance', // sort field after grouping
            order: 'desc' // sorting order with the key (overall_relevance), use "asc" or "desc"
          }

          const orderValue = [
            'commentators_opinion',
            'reporters_opinion',
            'reporters_storydevelopments'
          ] // Add your media_section_api here in order you want

          tw = sortMedia(tw, sortOptions, orderValue)

          if (options.max_results_per_section.media > 0) {
            tw = tw.slice(0, options.max_results_per_section.media)
          }

          tw.push.apply(tw, standardPosts(get(data, 'media.youtube_videos'), 'youtube'))
          tw.push.apply(tw, standardPosts(get(data, 'media.podcast_episodes'), 'podcast'))
          tw.push.apply(tw, standardPosts(get(data, 'media.tiktok_posts'), 'tiktok'))
          tw.push.apply(tw, standardPosts(get(data, 'media.instagram_posts'), 'instagram'))

            //RAJAT START	
            tw.push.apply(tw, standardPosts(get(data, 'media.facebook_posts'), 'facebook'))	
            tw.push.apply(tw, standardPosts(get(data, 'media.linkedin_posts'), 'linkedin'))	
            //RAJAT END
          
          tweets.push({
            section: 'Media',
            tweets: tw
          })
        }

        if (options.required_speaker_types.media && !tw.length) {
          console.log('Media required but empty')
          return
        }
      }
      if (options.speaker_types.the_public) {
        // the public
        var tw = []
        tw.push.apply(tw, standardPosts(get(data, 'general_public.tweets'), 'twitter'))
        tw.push.apply(tw, standardPosts(get(data, 'general_public.tiktok_posts'), 'tiktok'))
        tw.push.apply(tw, standardPosts(get(data, 'general_public.instagram_posts'), 'instagram'))
        //RAJAT START	
        tw.push.apply(tw, standardPosts(get(data, 'general_public.facebook_posts'), 'facebook'))	
        tw.push.apply(tw, standardPosts(get(data, 'general_public.linkedin_posts'), 'linkedin'))	
        //RAJAT END

        post_tweets_section('The public', tw, options.max_results_per_section.the_public)
        if (options.required_speaker_types.the_public && !tw.length) {
          console.log('The public required but empty')
          return
        }
      }

      // Personalized Section - Reads from Same Domain Publisher Sharing
      if (true) {
        var tw = []

        tw.push.apply(tw, get(data, 'personalization.same_publisher_tweets_from_people_you_follow'))

        tw = remove_duplicate_id(tw)

        if (tw.length > 0) {
          var domainName = await readDomainName()
          post_tweets_section('What Your Friends Are Reading On ' + domainName, tw, 10)
        }
        // if (options.required_speaker_types.other_public_figures && !tw.length) {
        //   console.log('Other public figures required but empty')
        //   return
        // }
      }
      // End - Personalized Section - Reads from Same Domain Publisher Sharing

      // web comments -- simplified
      var comments = []
      //if (data.general_public.news_comments) {
      //      comments = data.general_public.news_comments
      //}
      //if (data.general_public.news_comments) {
            // comments.concat(data.general_public.facebook_comments)
      //}
      
      // web comments -- some deleted code below for normalizing fb_comments and checking is_eligible for all comments
                      // // roundabout way to add the source_url
                      // var source_url = data['news_comments'][i].from_full_url
                      // if (commentType == 'fb_comments') { source_url = 'facebook.com'}
                      // data['news_comments'][i][commentType][k].from_full_url = source_url

                      //  if (data['news_comments'][i][commentType][k].is_eligible) {


      //for summarization
      if (ai_summary.length === 0) {
        const titleArray = {
          "social-summary": 'Can you give me a <b style="font-weight: 900;">summary</b> of the social conversation?',
          "poll-questions": 'What are good <b style="font-weight: 900;">questions for a poll</b>, & how are people reacting?',
          "probable-outcomes": 'What are <b style="font-weight: 900;">probable outcomes</b> based on similar events?',
          "article-generation": 'Write a <b style="font-weight: 900;">story</b> based on the social data.',
          "custom-prompt": 'Ask a custom question (write your own prompt).',
        }
          // "article-generation": 'Write a <b style="font-weight: 900;">news articles</b> based on the social data',
          // "data-visualization": 'Can you generate <b style="font-weight: 900;">a chart or data visualization</b> based on the social data?',
        for (var t in titleArray) {
          ai_summary.push({
            title: titleArray[t],
            content: [],
            id: t
          })
        }
        if (data['summarization'] && data['summarization'].length > 0) {
          for (var i = 0; i < data['summarization'].length; i++) {
            const temp_id = convertTitleToId(data['summarization'][i]['title']);
            const exist = ai_summary.findIndex(a => a.id === temp_id);
            if (exist === -1) continue;
            ai_summary[exist]['content'].push(data['summarization'][i]['content'])
          }
        }
      }

      // podcasts
      var podcasts = []
      // if (data.media && data.media.podcast_episodes) {
      //      podcasts = data.media.podcast_episodes
      // }

      // youtube_videos
      var youtube_videos = []
      // if (data.media && data.media.youtube_videos) {
      //      youtube_videos = data.media.youtube_videos
      // }

      // tiktok_posts
      var tiktok_posts = []

      // instagram_posts
      var instagram_posts = []

      var tweetsToShow = [];
      var tiktok_videos = [];
      var length_arr = {
        all: 0,
        twitter: 0,
        instagram: 0,
        tiktok: 0,
        youtube: 0,
        podcast: 0,
         //rajat start	
         facebook: 0,	
         linkedin: 0,	
         //rajat end
      };
      for (var i = 0; i < tweets.length; i++) {
        var tw = []
        for (var i1 = 0; i1 < tweets[i]['tweets'].length; i1++) {
          length_arr[tweets[i]['tweets'][i1]['itemType']] += 1;
          length_arr['all'] += 1;

          if (tweets[i]['tweets'][i1].is_low_confidence && !options.allow_low_confidence) {
            continue
          }
          if (tweets[i]['tweets'][i1]['itemType'] !== 'twitter') {
            tw.push(tweets[i]['tweets'][i1])
          } else if (tweets[i]['tweets'][i1].followers >= options.min_popularity) {
            tw.push(tweets[i]['tweets'][i1])
          }
        }
        if (tw.length) {
          tw.sort(function (a, b) {
            if (a.overall_relevance > b.overall_relevance) {
              return -1
            }
            if (a.overall_relevance < b.overall_relevance) {
              return 1
            }
            return 0
          })
          for (var k = 0; k < tw.length; k++) {
            tw[k]['SECTION'] = tweets[i]['section']
            tweetsToShow.push(tw[k])
          }
        }
      }
      setLenghtBadge(length_arr);
      $('.media_tab_link').click(function(e) {
        $(this).parent().addClass('active').siblings('.active').removeClass('active');
        ACTIVE_ITEM = $(this).data('item');
        showFull(tweetsToShow, undefined, comments, podcasts, youtube_videos, [], [], [])
        updateMediaItems()
      })
      fullPageTweetsCounter.innerText = data.stats.total_tweets;
      if (data.stats.total_tweets > 30 && button_shown_count < 2) {
        $('#fullPageTweets-expand').show();
        expandPageTweets.onclick = function(event) {
          event.preventDefault();
          event.stopPropagation();
          if(!animation_lock) {
            var animate = jQuery("#expand-trigger").hasClass("animate");

            if(animate) {
              jQuery("#expand-trigger").removeClass("animate");
              $('#fullPageTweets').css('display', 'none');
              $('#fullPageTweets-expand').text('Click to Collapse');
              parent.postMessage("animate", "*");
              resetAnimation();
              intervalExecution(50, 2000, (i)=>{updateMediaItems()});//!
              setAnimationCSS();

            } else {
              $('#fullPageTweets-expand').text('Click to Expand');
              jQuery("#expand-trigger").css({"transform": "rotate(360deg)"});
              jQuery("#expand-trigger").addClass("animate");
              parent.postMessage("do_not_animate", "*");
              resetAnimation();
              intervalExecution(50, 2000, (i)=>{updateMediaItems()});//!
              unsetAnimationCSS();
            }
            animation_lock = true;
          }
        }
        if (data.stats.total_tweets > 100) {
          $('#fullPageTweets-pips').show();
          $('#fullPageTweets-view').show();
          $('#fullPageTweets-view').css('font-weight','bold');
        } else {
          document.getElementById('fullPageTweets').onclick = () =>document.getElementById('fullPageTweets-expand').click();
          document.getElementById('fullPageTweets').style.cursor = 'pointer';
          document.getElementById('fullPageTweets').style.color = '#337ab7'
        }
        $('#fullPageTweets').css('display','block');
        $('#fullPageTweets').css('text-align','center');
      } else {
        $('#fullPageTweets').css('display','none');
      }
      switch (options.display_mode) {
        case 'suggestions':
          showSuggestions(tweetsToShow, comments, podcasts, youtube_videos)
          break
        case 'compact':
          showCompact(tweetsToShow, comments, podcasts, youtube_videos)
          break
        case 'full':
          showFull(tweetsToShow, undefined, comments, podcasts, youtube_videos, tiktok_posts, instagram_posts, tiktok_videos)
          break
        case 'slideshow':
          showSlideshow(tweetsToShow, comments, podcasts, youtube_videos)
          break
      }

      if (ulElement) {
        ulElement.removeEventListener('scroll', scrollHandler)
      }
      ulElement = document.getElementById(ulId)
      ulElement.addEventListener('scroll', scrollHandler)


      if (options.display_mode === 'full' || options.display_mode === 'compact' || options.display_mode === 'suggestions') {
        var items = ulElement.querySelectorAll('* > li')
        var maxElements = options.max_results * timesShown
        if (options.display_mode === 'compact') maxElements = 3
        console.log('Show up to', maxElements)
        for (var i = 0; i < maxElements; i++) {
          if (items[i] !== undefined) {
            items[i].classList.remove('social-curation__hidden')
          }
        }
        updateMediaItems();//!
        if (ulElement.querySelectorAll('li.social-curation__hidden').length === 0) {
          var more = ulElement.querySelectorAll('.social-curation__more')
          if (more && more[0]) {
            more[0].style['display'] = 'none'
          }
        }
        ulElement.scrollTop = scrollTop
      } else if (options.display_mode === 'slideshow') {
        var items = ulElement.querySelectorAll('* > li')
        var length = items.length
        if (currentSlide < length && length > 0 && currentSlide != 0) { // currentSlide is 0-based
          console.log('Redraw slide', currentSlide, 'of', length, 'slides')
          items[currentSlide].classList = 'social-curation__current'
          items[0].classList = 'social-curation__hidden'
        }
      }
    }

    function getDataScriptTag(htmlDoc, scriptId='') {
      var scripts = '';
      var nodes = htmlDoc.querySelectorAll('script');
      for (var i = 0; i < nodes.length; i++) {
        var node = nodes[i];
        if (node.text) {
          scripts += node.text;
        }
      }
      if (scriptId) {
        var exist = document.getElementById(scriptId);
        if (exist) {
          exist.parentNode.removeChild(exist);
        }
      }
      var chartScriptTag = document.createElement('script');
      chartScriptTag.id = scriptId;      
      chartScriptTag.textContent = scripts;      
      return chartScriptTag;
    }

    function getDataHtml(htmlDoc) {
      // Remove all the script nodes from the parsed DOM object
      htmlDoc.querySelectorAll('script').forEach(function(el) {
        el.parentNode.removeChild(el);
      });
      // Extract the remaining HTML nodes as a string
      return htmlDoc.querySelector('body').innerHTML;
    }

    var getHeader = function (mode, isAll, header=null) {
      var opts = {}
      opts.className = 'social-curation social-curation__' + mode
      opts.className += ' pt-40'
      opts.ulId = ulId
      opts.isAll = isAll
      opts.header = header || options.header
      opts.mode = mode
      var tmpl = '<ul class="<%this.className%>" id="<%this.ulId%>">' +
                    '<%if (this.header && this.isAll) {%>' +
                        '<h4 class="social-curation__header"><%this.header%>' +
                            '<%if (this.mode==="full") {%>' +
                                '' +
                            '<% } %>' +
                        '</h4>' +
                    '<% } %>'
      return TemplateEngine(tmpl, opts)
    }

    var scrollHandler = function () {
      if (ulElement && ulElement.scrollTop !== undefined) {
        scrollTop = ulElement.scrollTop
      }
    }

    var footer = '</ul>'

    var fadeIn = function (el, time) {
      el.style.opacity = 0;
    
      var last = +new Date();
      var tick = function() {
        el.style.opacity = +el.style.opacity + (new Date() - last) / time;
        last = +new Date();
    
        if (+el.style.opacity < 1) {
          (window.requestAnimationFrame && requestAnimationFrame(tick)) || setTimeout(tick, 16);
        }
      };
    
      tick();
    }

    var slideDown = function (el, height, occurence) {
      let s = el.style
      if(occurence < 1) {
        s.transition = "height .5s ease"
        s.height = 0
        s.overflow = "hidden"
        s.display = "block"
        s.zIndex = 5
        setTimeout(function() {
          s.height = height
        }, 1)
      }else {
        s.opacity = 0
        setTimeout(function() {
          s.opacity = 1
        }, 500)
      }
    }
    var nextHandler = function () {
      var list = getClosest(this, '.social-curation')
      var items = list.querySelectorAll('li')
      var next = false
      var current = false
      for (var i = 0; i < items.length; i++) {
        if (items[i].classList.contains('social-curation__current')) {
          next = i + 1
          current = i
          break
        }
      }
      if (next !== false) {
        if (next >= items.length) {
          next = 0
        }
        currentSlide = next
        console.log('current slide', currentSlide)
        items[current].classList = 'social-curation__hidden'
        items[next].classList = 'social-curation__current'
      }
    }

    var prevHandler = function () {
      var list = getClosest(this, '.social-curation')
      var items = list.querySelectorAll('li')
      var prev = false
      var current = false
      for (var i = 0; i < items.length; i++) {
        if (items[i].classList.contains('social-curation__current')) {
          prev = i - 1
          current = i
          break
        }
      }
      if (prev !== false) {
        if (prev < 0) {
          prev = items.length - 1
        }
        currentSlide = prev
        console.log('current slide', currentSlide)
        items[current].classList = 'social-curation__hidden'
        items[prev].classList = 'social-curation__current'
      }
    }

    var moreTweets = function () {
      var list = document.querySelector('.social-curation')
      var items = list.querySelectorAll('li.social-curation__hidden')
      clearTimeout(scrollTimer);
      scrollTimer = null;
      let scrollPosition = document.body.scrollTop
      spinner_visible = items.length > 0;
      for (var i = 0; i < options.max_results; i++) {
        if (items[i] !== undefined) {
          items[i].classList.remove('social-curation__hidden')
          // use below for a fade in effect of the tweets on pagination.  comment slideDown out.
          fadeIn(items[i], 1000) // this is the time the fade occurs
          // use below for a slide down effect of the tweets on pagination.   comment fadeIn out.
          // slideDown(items[i], items[i].offsetHeight, i)
        }
      }
      updateMediaItems();//!
      if (list.querySelectorAll('li.social-curation__hidden').length === 0) {
        //this.style['display'] = 'none'
      }
      timesShown += 1;
      spinner.classList.add('hidden');
      if (list.querySelectorAll('li.social-curation__hidden').length === 0) {
        spinner.classList.add('end');
      }

      // Delay after pagination when scroll timer still working without scrolling.
      afterPaginationTimeout = setTimeout(() => {
        // Stop calling the function at the end of the new tweets loading.
        if(checkWhileLoadTimer) clearInterval(checkWhileLoadTimer);
        // Start 'time without scrolling' timer again when new tweets have finished loading.
        if(tweets_count > 30 || button_shown_count < 2) // Same conditions as in the 'onScroll' handler.
        {
          startTimeTimer = setTimeout(() => { 
            startTime = null;
          },575) // grace period for pauses in scroll
        }
      }, 950); // Delay after pagination ends when scroll timer still working without scrolling.
    }

    // The function responsible for displaying the button 'Show full tweets'.
    // This is a copy of a piece of code from 'onScroll' handler.
    var checkScrollingTime = function()
    {
      if ((startTime.getTime() + 2250 < new Date().getTime()) && fullPageTweets.classList.contains('fullPageTweets_hidden')) {
        if (button_shown_count < 2){
          fullPageTweets.classList.remove('fullPageTweets_hidden');
          button_shown_count ++;
        }
        clearTimeout(afterPaginationTimeout); // Clear the timeout after pagination.
        clearInterval(checkWhileLoadTimer); // Stop the function that check scrolling time.
      }

      if (timeoutWillBeHidden) clearTimeout(timeoutWillBeHidden);
      timeoutWillBeHidden = setTimeout(() => {
        if (!fullPageTweets.classList.contains('fullPageTweets_hidden')) {
           // button_shown_count++ originally was here but it was redone and removed as it was not counting properly. 
        }
        fullPageTweets.classList.add('fullPageTweets_hidden');
      }, 2700) // amount of time the button stays up before disappearing if no interaction with it and no continued scroll
    }

    var spinner_visible = true
    /** @type {HTMLElement} */
    var spinner;
    var addSpinner = function () {
      if (!spinner) {
        spinner = document.getElementById('spinner-more');
      };
      if (spinner_visible && document.querySelector('.social-curation').querySelectorAll('li.social-curation__hidden').length > 0) {
        spinner.classList.remove('hidden');
      }
    }

    var user_prompt = ''; // save custom prompt
    var rendered = false;
    var addPrompt = function () {
        if ($("#user_prompt").length === 0) {
          var html = `
            <div class="input-group mt-25">
              <textarea 
                class="form-control" 
                aria-label="With textarea" 
                style="
                  width: 100%;
                  height:200px; 
                  background-color:#E6E6F5; 
                  font-size:20px;
                  border: 1px solid #5bc0de;
                "
                maxlength="3600" 
                placeholder="Ask a custom question (write your own prompt)" 
                name="user_prompt" 
                id="user_prompt" 
              >${user_prompt}</textarea>
              <div class="input-group-append" style="padding-left: 5px; margin: 20px 0 20px 0; width: 100%; display: flex; justify-content: right;">
                <span class="input-group-text user_prompt_submit" style="font-size: 13px; border: 1px solid #5bc0de; color: #337ab7">Submit</span>
              </div>
            </div>
          `;
          var aiNav = $('#ai-nav')[0]; // Get the parent element
          var lastChild = aiNav.lastElementChild; // Get the last child element
          lastChild.insertAdjacentHTML("afterend", html);
          //add eventlistner
          $('.user_prompt_submit').click(function() {
            var prompt = $('#user_prompt').val();
            user_prompt = prompt;
            if (!prompt) return ;
            rendered = false;
            initedSummary['custom-prompt'] = false;
            $('#ai-nav').nextAll().remove();
            setSummaryInterval(prompt);
          })
        }
    }
    var requestSummary = '';
    var summaryQuery = function() {
      console.log('Summary polling...')
      request(function(data) {
        timesQueried += 1

        console.log('Times queried', timesQueried, 'max_queries_before_stop', options.max_queries_before_stop)
        if (timesQueried > options.max_queries_before_stop || data.link_id === null || !data.link_id || 
          ((data.errors) && (JSON.stringify(data.errors).includes('1003')))) {
          global.summaryInterval.clearAsyncInterval();
        }

        if (data['status'] === 'pending') {
          return
        }
        if (data['status'] === 'finished') {
          const arr = {};
          data['summarization'].map(item => {
            const ti = convertTitleToId(item.title);
            if (arr[ti]) {
              arr[ti].push(item.content)
            }else {
              arr[ti] = [item.content]
            }
          })
          for (var item in arr) {
            updateSummaryContent(item, arr[item])
          }
          if (arr[ACTIVE_AI_ITEM]) {
            showSummary();
            global.summaryInterval.clearAsyncInterval();
          }
        }
      })
    }
    var initedSummary = {}
    var typing = '';
    var showSummary = function() {
      if (ACTIVE_ITEM === 'ai') {
        var content = findSummaryContent(ACTIVE_AI_ITEM);
        if (!content) {
          if (ACTIVE_AI_ITEM !== 'custom-prompt') {
            setSummaryInterval();
          }
        } else {
          if (typing !== ACTIVE_AI_ITEM && !rendered) {
            $('#ai-nav').nextAll().remove();
            if ($('#typedtext').length === 0) {
              $('#ai-nav')[0].insertAdjacentHTML("afterend", '<div class="" id="typedtext"></div>');
            }
            rendered = true;
            if (initedSummary[ACTIVE_AI_ITEM]) {

              $('#ai-nav')[0].insertAdjacentHTML("afterend", `<div class="" id="typedtext">${content.replace(/\n/g, '<br />')}</div>`);
            } else {
              setTimeout(function() {
                initedSummary[ACTIVE_AI_ITEM] = true;
                typingContent(content);
              }, 500);
            }
          }
        }
      }
    }
    var typingContent = function (content) {
      typing = ACTIVE_AI_ITEM;
      //set up text to print, each item in array is new line

      var aText = content.split('\n');
      var iSpeed = 15; // time delay of print out
      var iIndex = 0; // start printing array at this posision
      var iArrLength = aText[0].length; // the length of the text array
      var iScrollAt = 99999; // start scrolling up at this many lines
      var height = 0;
       
      var iTextPos = 0; // initialise text position
      var sContents = ''; // initialise contents variable
      var iRow; // initialise current row
      function typewriter()
      {
        if (typing !== ACTIVE_AI_ITEM || ACTIVE_ITEM !== 'ai') return ;
        sContents =  ' ';
        iRow = Math.max(0, iIndex-iScrollAt);
        var destination = document.getElementById("typedtext");
        if (ACTIVE_ITEM !== 'ai' && destination.clientHeight > height) {
          height = destination.clientHeight;
          updateMediaItems();
        }
        if (!destination) {
          setTimeout(function() {typewriter()}, 500);
          return ;
        }
        while ( iRow < iIndex ) {
          sContents += aText[iRow++] + '<br />';
        }
        destination.innerHTML = sContents + aText[iIndex].substring(0, iTextPos) + " |";
        
        if ( iTextPos++ == iArrLength ) {
          iTextPos = 0;
          iIndex++;
          if ( iIndex != aText.length ) {
            iArrLength = aText[iIndex].length;
            setTimeout(function() {typewriter()}, 200);
          }
        } else {
          setTimeout(function() {typewriter()}, iSpeed);
        }
      }
      typewriter();
    }
    var setSummaryInterval = function(prompt) {
      var loading = `
        <div align="center" id="swirl" style="margin-top: 30px; font-size: 14px; display: block;">
            <img src="../../spinner_96.svg" alt=""><br>Generating result in about 30 seconds...
        </div>
      `;
      if (document.querySelectorAll('#swirl').length > 0) {

      } else {
        $('#ai-nav')[0].insertAdjacentHTML("afterend", loading);
      }

      url = apiurl + '?url=' + encodeURIComponent(URL) + '&fabric_summarization=true&ai_modes=' + ACTIVE_AI_ITEM
      if (test_mode) {
        url = "https://theconversation.social/social_curation/?url=" + test_url + '&fabric_summarization=true&ai_modes='+ACTIVE_AI_ITEM
      }
      // url = 'data.json';
      if (prompt) {
        url += '&ai_custom_prompt=' + encodeURIComponent(prompt);
      }
      if (global.summaryInterval) {
        global.summaryInterval.clearAsyncInterval();
      }
      requestSummary = ACTIVE_AI_ITEM;
      timesQueried = 0;
      global.summaryInterval = new AsyncInterval(async function () {
        if (timesQueried == 1) {
         await sleep(1.5);
        }
        summaryQuery();
      }, options.query_frequency_seconds * 3000);
    }

    var findSummaryContent = function(summary_id) {
      var data = ai_summary.find((item)=>item.id===summary_id);
      if (data && data['content'].length > 0) {
        return data['content'].join('\n\n');
      } else return null;
    }
    var updateSummaryContent = function(summary_id, content) {
      var index = ai_summary.findIndex((item)=>item.id===summary_id);
      if (content && index !== -1){ 
        ai_summary[index]['content'] = content
      }
    }
    var findSummaryTitle = function(summary_id) {
      var data = ai_summary.find((item)=>item.id===summary_id);
      if (data && data['title']) return data['title'];
      else return null;
    }
    var addFooter = function (html, index, max_results, scriptTag) {
      if (index > max_results) {
         html += "<li id='spinner-more' class='social-curation__more--wrapper hidden'>"
         html += "<a class='social-curation__more' href='#'>"
         html += "<img src='"
         html += `chrome-extension://${chrome.runtime.id}`
         html += "/spinner_200.svg'"
         html += "style='width: 70px;height: 70px;margin-top: -22px;margin-bottom: -15px;filter: grayscale(.75);' />"
         html += '</li>';
         spinner_visible = true
       }
       spinner_visible = index >= max_results;
      html += footer
      var anchors = document.getElementsByClassName('social-curation__more')
      for (var i = 0; i < anchors.length; i++) {
        var current = anchors[i]
        // current.removeEventListener('click', clickHandler)
      }

      element.innerHTML = html;
      // Append the script tag to the DOM
      if (scriptTag) document.body.appendChild(scriptTag);
      if (is_summary_show && ACTIVE_ITEM !== 'ai') showSummaryBox();
      $(element).parent().parent().scrollTop(0);
      const images = document.querySelector('.social-curation__picture');
      if (images) {
        images.addEventListener('error', function() {
          this.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAACXBIWXMAAAsTAAALEwEAmpwYAAADYklEQVR4nO2aTU9TQRSGHyLSGoxIoeJSlgaj/gUXKigquEORlQY3IkG3KmtkRUKCf8GligSNGhI14gfKRkVkpbIw4s4CQVNz4ttkEtvSj+ntLeFNJrlw5p45587MmTPvKWxi4yIGdAA3gXHgI/ATWFWz5w+SWZ9TQD0hQRQ4BzwA/gDJPNtvYBLoBiLlcGAbcAVYdIxaAR4D1zQze/XFt6rV638muw480Tup978BA/o4geA4sOAY8Ao4D9QVoGsncAF47ej7DLRRQtiXGnMGfAMc8ai/FXjr6B8txezsluE2wC/gErDF9yD803kZSDiz3eRLebOmO6mos4/SYz8wpzHnZUNRiDsKXwKNBId64KnGXtCqKAhRZzk9B2oJHrXAC2eZFbRnxpzlZIddudDgrAoLAHmH2NTGDmJP5LJnErLJolvOh13qnLDoFBb0O5s/pyV21Tknig2xPcBttRNF6qoG3sk2cyorIkoVrPNhiod7gA560HdMuhbXm5VuJ0IQQkeqnEh6JlvHh+pkuVMYHTH0St8EGRBTWr1SYAIYlCP1ut+sZbKzUwM+wh9K4YhhSjrTBpBhCe0+EXZHBqVzKJ1wXMKTFeBIp3TeSSf8JKHd4sLuSIt0Gi/wH5YkjFWAI43S+T2dcFXCmgpwJOLwBBvXkaUKWlrxbEtrw2z2exIaA+gzTN5SOxRU+B2W0MizsGMw24HYIaGxhWHHlGxtz5SMpZJGYwDDipiTNO7I1GlSnhqN6QPuDdGefeCibLyfrdNZdTIu1nfUsmcfF6sZ6eta76D5qo5HQ+hIu3R9yaUMMaDOM57Jhx4P5MOsbOvL5YWow/UaoRwWDMimuXyKQm16KSFyrNw4CCzLprxLGaPOFzDaslyIi5QzW0YKURAVLZQUkVwOEns7MC0bpoupM8aVmKXKCvZ3kAffM6ccV3TBp9mZWltmBwhmT8xrTMvK9/hS3OQss4S4VwuHvlGt6LTsLKddvgeJOgEgKULZV/W1SqWMWUf/SKlr763OtKdY+94Cf8UQU+6USjuSWko+q8Xrzk6/k84klZFaen1DF58Whe0atQYVjU6rz5TDE6TSjr5y/QIiIlZ8QleAZJ5tTcRgV7kcSIc6cbF2a7ur2uMP50c19vxe19Mh9c14n9gEFY6/S5pIcXWvli0AAAAASUVORK5CYII=';
        });
      }
      spinner = document.getElementById('spinner-more');
      document.addEventListener('scroll', onScroll);
      var anchors = document.getElementsByClassName('social-curation__more')
      for (var i = 0; i < anchors.length; i++) {
        var current = anchors[i]
        // current.addEventListener('click', clickHandler, false)
      }

      //for A.I. summary
      if (ACTIVE_ITEM === 'ai') {
        rendered = false;
        showSummary(); 
        $('.ai_tab_link').click(function() {
          var type  = $(this).data('ai');
          if (ACTIVE_AI_ITEM === type) {
            return;
          } else {
            $('#ai-nav').nextAll().remove();
            ACTIVE_AI_ITEM = type;
          }
          $('#ai-nav li.active').removeClass('active');
          $(this).parent().addClass('active');

          if (ACTIVE_AI_ITEM === 'custom-prompt') {
            addPrompt()
          } else {
            rendered = false;
            typing = '';
            $("#user_prompt").parent().remove();
          }
          showSummary();
        })
      }
    }
    var button_shown_count = 0;
    var timeoutWillBeHidden;
    var startTime;
    var startTimeTimer;
    fullPageTweets.onmouseenter = function () {
      if (timeoutWillBeHidden) clearTimeout(timeoutWillBeHidden);
      fullPageTweets.classList.remove('fullPageTweets_hidden');
    }
    fullPageTweets.onmouseleave = function () {
      timeoutWillBeHidden = setTimeout(() => {
        fullPageTweets.classList.add('fullPageTweets_hidden');
      }, 3000)
    }

    var checkWhileLoadTimer; // Interval for function that checks scroll timer while pagination happening
    var afterPaginationTimeout; // 700ms custom timeout after pagination when scroll time still checking.
    var onScroll = function (e) {
    var browserZoomLevel = 1;
    if (window.devicePixelRatio){
      browserZoomLevel = window.devicePixelRatio
    }
      // var scrollSize = document.body.scrollHeight - document.body.scrollTop;
      // console.log(scrollSize, document.body.offsetHeight);
      // if (scrollSize < document.body.offsetHeight) moreTweets();
      // // setTimeout(moreTweets, 500);
      if(afterPaginationTimeout) clearTimeout(afterPaginationTimeout); // Clear the timeout after pagination.
      if(checkWhileLoadTimer) clearInterval(checkWhileLoadTimer); // Stop the function that check scrolling time.

      if (tweets_count > 30 || button_shown_count < 2){
        if (!startTime) startTime = new Date();
        // 2250 -- amount of consecutive scroll time to pull up message
        if ((startTime.getTime() + 2250 < new Date().getTime()) && fullPageTweets.classList.contains('fullPageTweets_hidden')) {
          if (button_shown_count < 2){ 
            fullPageTweets.classList.remove('fullPageTweets_hidden');
            button_shown_count ++;
          }
        }
        if (timeoutWillBeHidden) clearTimeout(timeoutWillBeHidden);
        timeoutWillBeHidden = setTimeout(() => {
          if (!fullPageTweets.classList.contains('fullPageTweets_hidden')) {
            // button_shown_count++ originally was here but it was redone and removed as it was not counting properly. 
          }
          fullPageTweets.classList.add('fullPageTweets_hidden');
        }, 2700) // amount of time the button stays up before disappearing if no interaction with it and no continued scroll
        if(startTimeTimer)clearTimeout(startTimeTimer);
        startTimeTimer = setTimeout(() => {
          startTime = null;
        },575) // grace period for pauses in scroll
      }
      if (browserZoomLevel * (window.innerHeight + window.pageYOffset) >= document.body.offsetHeight && scrollTimer == null && document.querySelector('.social-curation').querySelectorAll('li.social-curation__hidden').length > 0) {
        clearTimeout(startTimeTimer); // Stop the timer when pagination starts and spinner appears.

        addSpinner();
        scrollTimer = setTimeout(moreTweets,500);
        
        // Call function with an interval to check if it's time to show the button while loading is going.
        if(tweets_count > 30 || button_shown_count < 2) // Same conditions as above, because we dont need the timer if we dont need to display the button.
        {
          // Change '150' if you want to change the frequency of the function call.
          checkWhileLoadTimer = setInterval(checkScrollingTime, 150);
        }
      }
    }

    var clickHandler = function (e) {
      e.preventDefault()
      moreTweets();
    }


    var generateListItem = function (tweet, settings, mode) {
      tweet.tw_media_html = tweet.tw_media_html || {};
      var opts = {
        itemType: tweet.itemType,
        profile_image_url: '',
        username: '',
        user_account: '',
        account_url: '',
        is_user_verified: tweet.is_user_verified,
        tweet_url: tweet.tweet_url,
        profile_url: tweet.profile_url,
        bio: '',
        text: tweet.text,
        date: '',
        social_link: '',
        show_community_feedback: options.show_community_feedback,
        retweets: tweet.retweets,
        favorites: tweet.favorites,
        likes_count: tweet.likes_count,
        id: tweet.id,
        pageurl: pageurl,
        tw_media_html: (options.fullmode? tweet.tw_media_html.full_mode: tweet.tw_media_html.compact_mode) || "",
        from_full_url: tweet.from_full_url
      }
      if (tweet.tw_media_html.yt_id && options.fullmode){   
    opts.tw_media_html =  "<br><br>" +  `       
                <iframe id="ytplayer" allowfullscreen style="height: 232px; min-height:30px;" type="text/html" width=430px height=232px
                src="https://www.youtube.com/embed/${tweet.tw_media_html.yt_id}?modestbranding=1"
                frameborder="0"></iframe>
    `
    }
      if (tweet.tw_media_html.preview_image && !(CURATION_FINISHED)){
        opts.tw_media_html = tweet.tw_media_html.compact_mode
    }
      opts.tw_media_html = opts.tw_media_html.replace('id=','class=');

      // profile image
      if (tweet.profile_image_url) {
        opts.profile_image_url = tweet.profile_image_url
      } else if (tweet.picture) {
        opts.profile_image_url = tweet.picture
      } else if (tweet.profile_url) {
        var fbId = tweet.id.split('_')[0]
        opts.profile_image_url = 'https://graph.facebook.com/' + fbId + '/picture?type=square'
      }

      // username
      if (tweet.user_name) {
        opts.username = tweet.user_name
      } else if (tweet.full_name) {
        opts.username = tweet.full_name
      } else {
        opts.username = tweet.username
      }

      opts.user_account = tweet.user_account

      // account_url
      if (tweet.user_account) {
        if (tweet.tweet_url) {
          opts.account_url = 'https://twitter.com/' + tweet.user_account
        } else if (tweet.profile_url) {
          opts.account_url = tweet.profile_url
        } else {
          opts.profile_url = ''
        }
      }

      // bio
      if (options.bio === 'original' && tweet.bio_from_twitter) {
        opts.bio = tweet.bio_from_twitter
      }
      if (options.bio === 'wikipedia' && tweet.bio) {
        opts.bio = tweet.bio
      }

      if (options.bio === 'category') {
        var twitter_bio = get(tweet, 'twitter_category.subcategory')
        if (!twitter_bio) twitter_bio = get(tweet, 'twitter_category.category')
        if (!twitter_bio) twitter_bio = get(tweet, 'category.subcategory')
        if (!twitter_bio) twitter_bio = get(tweet, 'category.category')

        opts.bio = twitter_bio
        if (opts.bio) opts.bio = opts.bio.charAt(0).toUpperCase() + opts.bio.substring(1)
      }


      // date
      var created_date = tweet.date ? tweet.date : tweet.created
      if(created_date !== undefined) {
        created_date = created_date.split('+')[0]
        created_date = created_date.replace(' ', 'T')
        if (settings && settings.date_format === 'since') {
          opts.date = time_ago(created_date)
        } else if (settings && settings.date_format === 'hour_date') {
          opts.date = formatDate(created_date)
        } else {
          opts.date = tweet.date
        }
      }

      // social link
      if (tweet.tweet_url) {
        opts.social_link = tweet.tweet_url
      }
      if (tweet.post_url) {
        opts.social_link = tweet.post_url
      }

      var tmpl = '' +
                    '<div class="social-curation__left">' +
                    '<%if (this.account_url) {%> ' + 
                         '<a href="<% this.account_url %>">'  +
                    ' <% } else { %>' + '' +
                    ' <% } %>' +
                        '<% if (this.profile_image_url) { %>' +
                            `<img class="social-curation__picture" src="<% this.profile_image_url %>" onerror="handleImageError(this)">` +
                        '<% } %>' +
                    '<%if (this.account_url) {%> ' + 
                         '</a>'  +
                    ' <% } else { %>' + '' +
                    ' <% } %>' +
                    '</div>' +
                    '<div class="social-curation__right">' +
                        '<h3 class="social-curation__person">' +
                        '<%if (this.account_url) {%> ' + 
                            '<a href="<% this.account_url %>" style="color: #000000;text-decoration: none;">'  +
                        ' <% } else { %>' + '' +
                        ' <% } %>' +
                            '<% this.username %>' +
                            '<%if (this.account_url) {%> ' + 
                                '</a>'  +
                            ' <% } else { %>' + '' +
                            ' <% } %>' +
                            '<%if (this.is_user_verified) {%> <div class="twitter-icon-verified"></div> <% } %>' +
                            '<%if (this.user_account) {%> ' +
                                ' <i class="social-curation__person-link">' +
                                    '<%if (this.account_url) {%> ' +
                                        '<a href="<% this.account_url %>" style="color: #8899A6;text-decoration: none;">@<% this.user_account %></a>' +
                                    ' <% } else { %>' +
                                        '<a href="https://twitter.com/<% this.user_account %>" style="color: #8899A6;text-decoration: none;">@<% this.user_account %></a>' +
                                    ' <% } %>' +
                                '</i>' +
                            ' <% } %>' +
                        '</h3>' +

                        '<%if (this.tweet_url) {%> ' +
                            '<div class="twitter-icon"></div>' +
                        '<%} else if (this.profile_url || this.from_full_url === "facebook.com") {%>' +
                            '<div class="facebook-icon"></div>' +
                        '<%} else if (this.from_full_url) {%>' +
                            '<img class="domain-icon" src="https://www.google.com/s2/favicons?domain_url=<%this.from_full_url%>">' +
                        '<%} else {%>' +
                            '<img class="domain-icon" src="https://www.google.com/s2/favicons?domain_url=<%this.pageurl%>">' +
                        '<%}%>' +

                        //'<%if (this.bio) {%> ' +
                            '<div class="social-curation__bio"> <% this.bio %> </div>' +
                        //'<%}%>' +

                        '<div class="social-curation__message <% this.itemType %>"> <% this.text %> <% this.tw_media_html %> </div>' +
                        '<div class="social-curation__bottom">' +
                            '<div class="social-curation__date"> <a href="' + '<% this.tweet_url %>' + '" style="color: #eaeaea"><% this.date %></a> </div>' +
                            '<%if (this.social_link) {%> ' +
                                '<div class="social-curation__link"> <% this.social_link %> </div>' +
                            '<%}%>' +
                            '<%if (this.show_community_feedback) {%> ' +
                                '<%if (this.retweets) {%> ' +
                                    '<div class="social-curation__retweets">' +
                                        '<a href="https://twitter.com/intent/retweet?tweet_id=' + '<% this.id %>' + '" style="color: #808080;text-decoration: none;"><div class="twitter-icon-retweet"></div> <% this.retweets %></a>' +
                                    '</div>' +
                                '<%}%>' +
                                '<%if (this.favorites) {%> ' +
                                    '<div class="social-curation__likes">' +
                                        '<a href="https://twitter.com/intent/like?tweet_id=' + '<% this.id %>' + '" style="color: #808080;text-decoration: none;"><div class="twitter-icon-favorite"></div> <% this.favorites %></a>' +
                                    '</div>' +
                                '<%}%>' +
                                '<%if (this.likes_count || !this.favorites) {%> ' +
                                    '<div class="social-curation__retweets">' +
                                        '<% this.likes_count %> <div class="facebook-like-icon"></div>' +
                                    '</div>' +
                                '<%}%>' +
                            '<%}%>' +
                        '</div>' +
                    '</div>'

      return TemplateEngine(tmpl, opts)
    }

    var placeholderCount = 0
    var addPlaceholder = function (html, max_items, index = 0) {
      var max_items_to_show = max_items !== undefined ? max_items : options.max_results
      if (options.placeholder_frequency > 0) {
        placeholderCount++
        var start = '<li>'
        if (index + 1 > max_items_to_show) {
          start = "<li class='social-curation__hidden'>"
        }

        if (placeholderCount % options.placeholder_frequency === 0) {
          return start + options.placeholder_html + '</li>'
        }
      }
      return ''
    }

    var showFull = function (tweets, max_items, comments, podcasts, youtube_videos, tiktok_posts, instagram_posts, tiktok_videos, mode) {
      if (!options.showOtherNetwork && ACTIVE_ITEM !== 'ai') ACTIVE_ITEM = 'twitter';
      let filtered_tweets = [];
      if (ACTIVE_ITEM !== 'all') filtered_tweets = Object.values(tweets).filter(obj => obj.itemType === ACTIVE_ITEM);
      else filtered_tweets = tweets;
      var html = getHeader('full', ACTIVE_ITEM === 'all')
      if (mode !== undefined) {
        var html = getHeader(mode, ACTIVE_ITEM === 'all')
      } else {
        mode = 'full'
      }

      //For test
      if (ACTIVE_ITEM === 'ai') {
        var count = 1;
        var max_results = 1;
        var html = getHeader('full', 'all', ACTIVE_ITEM==='ai'?'<b>Ask with A.I.</b><img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAAAXNSR0IArs4c6QAABShJREFUaEO9md2r5VMYxz/LGNOE42VCGaapUYiGKCImUc5p5g8wppRIcyMyuRkXMlFOeSkx5UKhTFy5EcNMEQdxvCR3cyE04uCI8do4svTs37P3Xr/fev/tPdbNrv171vP6fV7WWobsMoDNUJXQZAUlCOL85ctojcmmp5DLKc81T9G1smXAJD6a1t46EwxRA2KMagW48KvbW+aSCIR0cyPxeGALsBlYk2c7FTX/AD4APsFgUymYg9AsmL1gNw1iZTPKVYSt0MxF4A7g85jjHAOU5ZjzduAFYFWJsArdw7rEs/134AZgsXEiw58BHz8CDdG5wCEMazV8H2HYh+XbPIQmq7iq4yZgJ7BRtf0KuADD0bwBjfxHgHtVlZeBm4B/2qrV+7wkkiO3Wk4G3sWwWZ14K/B8sow6Aj4DLlHrNwCHWxsDoSyJTNLk8MetwKvKW+B8i2dAGHpmCexZwI/AmXnlin2bZ9VuqyL7e/3rLeD6fCNrdFkG1qnnJQLtzAn/EejoFfq2Kvdo3wxwRMUv2KacO6vVyFpebBlwLPwbNs2TNDIAWNB+5KE5xGvZwDrbYL+JQHIFTIyXRY9TjNTAjNUIVBswgJDhMJYNk0Rgkr1AMAJdg4MRcHOg2Jn1lTWZXl4EDFu6Y4XfyBpz/CTOJG7J5xwQA99nMBxRpetywIVQD8HxLXWYUgMGmxZwI+D0ojiENAdi2gx41Ck0KpbekBnmk88Bb1+sD7gYKVE6SRPPqs62Qgj5wgrKaMYKb9wosdqLdf8+EKtCiQa0GljptOwTgH87g+AqGBySjuZya/I+kGlkY5+aHWCfBT4ErlOlLwPeBH4FrgCWgNMxLGKROWsWeH9kRABV/QxI5kDUZy8C23V6lQFMhsBdwGOa6NuwvKajwNvK5X7gwTbHKY4S+WGuJfoi4CHgPTCP6kFehsEndBi7B/hbTnfNWcOsN9i7bRMVZ5UZUN2Jk2U0MNmMS2Rt4tYaEL1WMctgR+N0rRq1c1+CPjNOh87EDbdvgPXAb8CpmpQ9pgWvlgZ0TbpnI/ClbjqAYbbbOWOzkCTa8PBwTYPtyVekaaYYy8H+aSXYC9zZJY4YYO4CKwko6xCwDfgicCyrsirm68j/V+l5+DQVIlcrUpa9tA8psVYvk87Tj38B7wBfV2ncPon+bOBxCz8EeNwGXKkOOg44H7haq5aQv2Fgrrkjb5sbg5BQXggcAM6JKd0jueWG7VptbkO2lwMfh2Qo/0/B3Aj2pxhNyqnSlB4AdgCnpAjDxkiZ8642DyokVxp+Zg7sfg8XdnAzIviXO6o/x9/bXSCWA86jxmCDzDlyW3ZiLYSU/gzgJccJMnbcrkLmDOzXJ5TngKeAX7T6yBzlLe3ug1m+MaAiu3rAZshfZqTXMazRE5ZEdk8nAvPA7honpXKgho+ioXv56pl7M7DPcZkk75ITgf/XgF7RABni9mjkV7A8aWCXQihtQKCR+BHoqVUYqNEgPqM50CEw82B7QGicFbGUmQKcWixWG3jFNmcCd80b2B16E02laVC5fCDiLAsP7HJ9Ls3xUqeQHMMciM1lSUuzbjhb38LkQUXWw8B95eHOldEkoNoNJf8YHlXrYkCuzmXq3WrgYO5Z3eUULaNZ33XTL/ieX8xF4HQS8F2yL6lMN2Wr+0De73GlA1VwgsCNW08Wcm7rnlhiN/41eIlAevR3fqIohoQb7KyDehEMi0p7MEo8iuet66VHyntJuDpVMXvQyuM+pntwnA4T9wqu4T8rWrlIoOZMigAAAABJRU5ErkJggg==" width="32" height="32" style="float: right;">':null)
        
        if (!ACTIVE_AI_ITEM) ACTIVE_AI_ITEM = ai_summary[0]['id'];
        html +=  '<div id="ai-nav"><ul class="nav nav-tabs" style="">'
        for (var i = 0; i < ai_summary.length; i++) {
          html += `
            <li class="nav-item ${ai_summary[i]['id']===ACTIVE_AI_ITEM?'active':''}">
              <a class="nav-link ai_tab_link" data-ai="${ai_summary[i]['id']}"><span>${ai_summary[i]['title']}</span></a>
            </li>
          `
        }
        html += '</ul></div>';
        html += '<div class="social_curation" id="typedtext"></div>';

        addFooter(html, count, max_results);
        return ;
      }

      var i = 0
      var max_items_to_show = max_items !== undefined ? max_items : options.max_results
      // var max_items_to_show = filtered_tweets.length;
      var sectionHeader = ''
      var mediaContainer = document.getElementById("MEDIA_CONTAINER");//!
    
      // YOUTUBE VIDEOS HIGHEST IN SIDEBAR
      if (youtube_videos.length) {
        if (i + 1 > max_items_to_show) {
          html += "<li class='social-curation__section social-curation__hidden'>"
        } else {
          html += "<li class='social-curation__section'>"
        }
        html += 'From YouTube'
        html += '</li>'
      }

      for (var k = 0; k < youtube_videos.length; k++) {
        var youtube = youtube_videos[k]
        if (k + i + 1 > max_items_to_show) {
          html += "<li class='social-curation__hidden'>"
        } else {
          html += '<li>'
        }

        // map podcast object from api response object
        let yt_id = youtube.id
        var modified = {
          itemType: 'youtube',
          profile_image_url: youtube.thumbnail,
          user_name: youtube.uploader,
          text: youtube.title +
                  "<br><br>" +  ` 
            <div style="height: 232px; min-height:30px;" data-video="${k}"></div>
          `,
          from_full_url: "https://www.youtube.com/watch?v=" + youtube.id,
          likes_count: 0,
          date: youtube.dateUploaded
        }

        html += generateListItem(modified, {
          date_format: 'since'
        }, mode)

        html += '</li>'
  
        html += addPlaceholder(html, max_items, i);
        if(!mediaContainer.querySelector(`[data-video="${k}"]`)){//!
          mediaContainer.insertAdjacentHTML('beforeend', 
          `<div class="media-container__item" data-video="${k}">
                  <iframe id="ytplayer" allowfullscreen style="height: 232px; min-height:30px;" type="text/html" width=430px height=232px
                  src="https://www.youtube.com/embed/${yt_id}?modestbranding=1"
                  frameborder="0"></iframe>
          </div>`);
        }
      }

      // TIKTOK VIDEOS HIGHEST IN SIDEBAR
      if (tiktok_posts.length) {
        if (i + 1 > max_items_to_show) {
          html += "<li class='social-curation__section social-curation__hidden'>"
        } else {
          html += "<li class='social-curation__section'>"
        }
        html += 'From Tiktok'
        html += '</li>'
      }

      for (var k = 0; k < tiktok_posts.length; k++) {
        var tiktok = tiktok_posts[k]
        if (k + i + 1 > max_items_to_show) {
          html += "<li class='social-curation__hidden'>"
        } else {
          html += '<li>'
        }
        tiktok.text += "<br><br>" +  ` 
            <div style="height: 576px; min-height:30px;" data-tiktok="${k}"></div>
          `

        html += generateListItem(tiktok, {
          date_format: 'since'
        }, mode)

        html += '</li>'
  
        html += addPlaceholder(html, max_items, i);
        if(!mediaContainer.querySelector(`[data-tiktok="${k}"]`)){//!
          mediaContainer.insertAdjacentHTML('beforeend', 
          `<div style="height: 576px;min-height:30px;" data-tiktok="${k}">
            <div class="media-container__item" style="display: flex;justify-content: center;">
                <iframe 
                height="576px"
                frameborder="0"
                allowfullscreen="true" 
                scrolling="no"
                src="https://www.tiktok.com/embed/v2/${tiktok.id}?lang=en-US"
                frameborder="0"></iframe>
            </div>
          </div>`);
        }     
      }

      // INSTAGRAM VIDEOS HIGHEST IN SIDEBAR
      if (instagram_posts.length) {
        if (i + 1 > max_items_to_show) {
          html += "<li class='social-curation__section social-curation__hidden'>"
        } else {
          html += "<li class='social-curation__section'>"
        }
        html += 'From Instagram'
        html += '</li>'
      }

      for (var k = 0; k < instagram_posts.length; k++) {
        var instagram = instagram_posts[k]
        if (k + i + 1 > max_items_to_show) {
          html += "<li class='social-curation__hidden'>"
        } else {
          html += '<li>'
        }

        html += generateListItem(instagram, {
          date_format: 'since'
        }, mode)

        html += '</li>'
  
        html += addPlaceholder(html, max_items, i);
      }

      // PODCASTS SECOND HIGHEST IN SIDEBAR
      if (podcasts.length) {
        if (i + 1 > max_items_to_show) {
          html += "<li class='social-curation__section social-curation__hidden'>"
        } else {
          html += "<li class='social-curation__section'>"
        }
        html += 'Podcasts'
        html += '</li>'
      }

      for (var k = 0; k < podcasts.length; k++) {
        var podcast = podcasts[k]
        if (k + i + 1 > max_items_to_show) {
          html += "<li class='social-curation__hidden'>"
        } else {
          html += '<li>'
        }
        // map podcast object from api response object
        var modified = {
          itemType: 'podcast',
          profile_image_url: podcast.image_url,
          user_name: podcast.author_name,
          text: podcast.title + 
              "<br><br>" +  `
                <div style="height: 60px; min-height:30px;" data-podcast="${k}"></div>
                `,
          from_full_url: podcast.itunes_episode_url,
          likes_count: 0,
          date: podcast.publishedat
        }

        html += generateListItem(modified, {
          date_format: 'since'
        }, mode);

        html += '</li>'

        html += addPlaceholder(html, max_items, i);
      if(!mediaContainer.querySelector(`[data-podcast="${k}"]`)){//!
          mediaContainer.insertAdjacentHTML('beforeend', 
          `<div class="media-container__item" data-podcast="${k}">
          <audio controls src="${podcast.streaming_url}">
          </audio>
          </div>`);
        }
        
      }
    
      for (i = 0; i < filtered_tweets.length; i++) {
        var tweet = filtered_tweets[i]
        var blank_class = tweet.SECTION === '&nbsp;' ? 'blank': ''
        if (tweet.SECTION !== sectionHeader) {
          if (options.category_section_headers) {
            if (i + 1 > max_items_to_show) {
              html += "<li class='social-curation__section social-curation__hidden'>"
            } else {
              html += "<li class='social-curation__section " + blank_class + "'>"
            }
            sectionHeader = tweet.SECTION
            html += sectionHeader
            html += '</li>'
          }
        }
        if (i + 1 > max_items_to_show) {
          html += "<li class='social-curation__hidden'>"
        } else {
          html += '<li>'
        }

        html += generateListItem(tweet, {
          date_format: 'since'
        }, mode)

        html += '</li>'

        html += addPlaceholder(html, max_items_to_show, i)
      } // loop end

      if (comments.length) {
        if (i + 1 > max_items_to_show) {
          html += "<li class='social-curation__section social-curation__hidden'>"
        } else {
          html += "<li class='social-curation__section'>"
        }
        html += 'News comments'
        html += '</li>'
      }

      for (var k = 0; k < comments.length; k++) {
        var comment = comments[k]
        if (k + i + 1 > max_items_to_show) {
          html += "<li class='social-curation__hidden'>"
        } else {
          html += '<li>'
        }

        var modified = {
          itemType: 'comment',
          profile_image_url: comment.author_pic_url,
          user_name: comment.author_name,
          text: comment.comment,
          from_full_url: comment.from_full_url,
          likes_count: comment.likes,
          date: comment.created
        }

        html += generateListItem(modified, {
          date_format: 'since'
        }, mode)

        html += '</li>'

        html += addPlaceholder(html, max_items, i)
      }
      for (var j = 0; j < filtered_tweets.length; j++) {
        // for podcast within media_container
        if (filtered_tweets[j]['itemType'] === 'podcast') {
          if(!mediaContainer.querySelector(`[data-podcast="${filtered_tweets[j].id}"]`)){//!
              mediaContainer.insertAdjacentHTML('beforeend', 
              `<div class="media-container__item" data-podcast="${filtered_tweets[j].id}">
              <audio controls src="${filtered_tweets[j].streaming_url}">
              </audio>
              </div>`);
          }
        }
        // //for youtube within media_container
        if (filtered_tweets[j]['itemType'] === 'youtube') {
          if(!mediaContainer.querySelector(`[data-video="${filtered_tweets[j].id}"]`)){//!
            mediaContainer.insertAdjacentHTML('beforeend', 
            `<div class="media-container__item" data-video="${filtered_tweets[j].id}">
                    <iframe id="ytplayer" allowfullscreen style="height: 232px; min-height:30px;" type="text/html" width=430px height=232px
                    src="https://www.youtube.com/embed/${filtered_tweets[j].id}?modestbranding=1"
                    frameborder="0"></iframe>
            </div>`);
          }
        }

        // //for tiktok within media_container
        if (filtered_tweets[j]['itemType'] === 'tiktok') {
          if(!mediaContainer.querySelector(`[data-tiktok="${filtered_tweets[j].id}"]`)){//!
            mediaContainer.insertAdjacentHTML('beforeend', 
            `
              <div class="media-container__item" data-tiktok="${filtered_tweets[j].id}" style="height: 576px;min-height:30px;">
                <div  style="display: flex;justify-content: center;">
                  <iframe 
                  height="576px"
                  frameborder="0"
                  allowfullscreen="true" 
                  scrolling="no"
                  src="https://www.tiktok.com/embed/v2/${filtered_tweets[j].id}?lang=en-US"
                  frameborder="0"></iframe>
                </div>
              </div>`);
          }        
        }
      }

      var count = i
      var max_results = options.max_results
      if (max_items !== undefined) {
        count = 0
        max_results = 0
      }
      if ((filtered_tweets.length + comments.length + podcasts.length + youtube_videos.length) > 0) {
        addFooter(html, count, max_results);

      }
    }

    var showSuggestions = function (tweets, comments, podcasts, youtube_videos) {
      var html = getHeader('suggestions')
      var i = 0
      var sectionHeader = ''
      for (i = 0; i < tweets.length; i++) {
        var tweet = tweets[i]
        if (tweet.SECTION !== sectionHeader) {
          if (options.category_section_headers) {
            if (i + 1 > options.max_results) {
              html += "<li class='social-curation__section social-curation__hidden'>"
            } else {
              html += "<li class='social-curation__section'>"
            }
            sectionHeader = tweet.SECTION
            html += sectionHeader
            html += '</li>'
          }
        }
        if (i + 1 > options.max_results) {
          html += "<li class='social-curation__hidden'>"
        } else {
          html += '<li>'
        }

        html += "<div class='social-curation__suggestion'>"

        html += "<span class='social-curation__suggestion__person'>"
        if (tweet.user_name) {
          html += tweet.user_name
        } else if (tweet.full_name) {
          html += tweet.full_name
        } else {
          html += tweet.username
        }
        html += '</span>'

        if (tweet.tags && tweet.tags[0]) {
          html += ", <span class='social-curation__suggestion__category'>"
          html += tweet.tags[0]
          html += ',</span>'
        } else if (tweet.twitter_category && tweet.twitter_category.subcategory) {
          html += ", <span class='social-curation__suggestion__category'>"
          html += tweet.twitter_category.subcategory
          html += ',</span>'
        }

        html += ' said: "' + tweet.text + '"'

        html += " <span class='social-curation__suggestion__link'>"
        if (tweet.tweet_url) {
          html += '<a href=\'' + tweet.tweet_url + '\'>Link</a>'
        } else if (tweet.post_url) {
          html += '<a href=\'' + tweet.post_url + '\'>Link</a>'
        }
        html += '</span>'

        html += '</div>'

        html += '</li>'
      } // loop end

      if (comments.length) {
        if (i + 1 > options.max_results) {
          html += "<li class='social-curation__section social-curation__hidden'>"
        } else {
          html += "<li class='social-curation__section'>"
        }
        html += 'News comments'
        html += '</li>'
      }

      for (var k = 0; k < comments.length; k++) {
        var comment = comments[k]

        if (k + i + 1 > options.max_results) {
          html += "<li class='social-curation__hidden'>"
        } else {
          html += '<li>'
        }

        html += "<div class='social-curation__suggestion'>"

        html += "<span class='social-curation__suggestion__person'>"
        html += comment.author_name
        html += '</span>'

        html += ' said: "' + comment.comment + '"'

        html += '</div>'

        html += '</li>'
      }
      if ((tweets.length + comments.length) > 0) {
        addFooter(html, i, options.max_results)
      }
    }

    var showCompact = function (tweets, comments, podcasts, youtube_videos) {
      return showFull(tweets, 3, comments, 'compact')
    }

    var showSlideshow = function (tweets, comments, podcasts, youtube_videos) {
      var html = getHeader('slideshow')
      for (var i = 0; i < tweets.length; i++) {
        var tweet = tweets[i]
        if (i > 0) {
          html += "<li class='social-curation__hidden'>"
        } else {
          html += "<li class='social-curation__current'>"
        }
        html += generateListItem(tweet, {
          date_format: 'hour_date'
        }, 'slideshow')
        html += '</li>'
      } // loop end

      for (var k = 0; k < comments.length; k++) {
        var comment = comments[k]
        if (k + i > 0) {
          html += "<li class='social-curation__hidden'>"
        } else {
          html += "<li class='social-curation__current'>"
        }
        var modified = {
          profile_image_url: comment.author_pic_url,
          user_name: comment.author_name,
          text: comment.comment,
          from_full_url: comment.from_full_url,
          likes_count: comment.likes,
          date: comment.created
        }
        html += generateListItem(modified, {
          date_format: 'hour_date'
        }, 'slideshow')
        html += '</li>'
      }

      if (tweets.length > 1) {
        html += '<div class="social-curation__next">'

        html += '</div>'
        html += '<div class="social-curation__prev">'

        html += '</div>'
      }

      html += footer

      var anchors = document.getElementsByClassName('social-curation__next')
      for (var i = 0; i < anchors.length; i++) {
        var current = anchors[i]
        current.removeEventListener('click', nextHandler)
      }

      var anchors = document.getElementsByClassName('social-curation__prev')
      for (var i = 0; i < anchors.length; i++) {
        var current = anchors[i]
        current.removeEventListener('click', prevHandler)
      }

      if ((tweets.length + comments.length) > 0) {
        console.log('Showing html for ' + (tweets.length + comments.length))
        element.innerHTML = html
      }

      var anchors = document.getElementsByClassName('social-curation__next')
      for (var i = 0; i < anchors.length; i++) {
        var current = anchors[i]
        current.addEventListener('click', nextHandler, false)
      }

      var anchors = document.getElementsByClassName('social-curation__prev')
      for (var i = 0; i < anchors.length; i++) {
        var current = anchors[i]
        current.addEventListener('click', prevHandler, false)
      }

      return html
    }

    var TemplateEngine = function (html, opt) {
      // from http://krasimirtsonev.com/blog/article/Javascript-template-engine-in-just-20-line
      var re = /<%([^%>]+)?%>/g, reExp = /(^( )?(if|for|else|switch|case|break|{|}))(.*)?/g, code = 'var r=[];\n', cursor = 0, match
      var add = function (line, js) {
        js ? (code += line.match(reExp) ? line + '\n' : 'r.push(' + line + ');\n') :
          (code += line != '' ? 'r.push("' + line.replace(/"/g, '\\"') + '");\n' : '')
        return add
      }
      while (match = re.exec(html)) {
        add(html.slice(cursor, match.index))(match[1], true)
        cursor = match.index + match[0].length
      }
      add(html.substr(cursor, html.length - cursor))
      code += 'return r.join("");'
      return new Function(code.replace(/[\r\t\n]/g, '')).apply(opt)
    }
  }


  // class we added so we could sleep before second api request -- note this only 
  // applies to places where custom widget (not twitter one is used)
  class AsyncInterval {
    constructor(cb, interval) {
      this.asyncIntervals = [];
      this.intervalIndex = this.asyncIntervals.length;
      this.setAsyncInterval(cb, interval);
    }

    setAsyncInterval(cb, interval) {
      if (cb && typeof cb === "function") {
        this.asyncIntervals.push(true);
        this._runAsyncInterval(cb, interval, this.intervalIndex);
        return this.intervalIndex;
      } else {
        throw new Error('Callback must be a function');
      }
    }

    clearAsyncInterval() {
      if (this.asyncIntervals[this.intervalIndex]) {
        this.asyncIntervals[this.intervalIndex] = false;
      }
    }

    async _runAsyncInterval(cb, interval, intervalIndex) {
      await cb();
      if (this.asyncIntervals[this.intervalIndex]) {
        setTimeout(() => this._runAsyncInterval(cb, interval, this.intervalIndex), interval);
      }
    }

  }
  // sleep function for sleeping before something is done (we use this to sleep before second api request)
  function sleep(sec) {
    return new Promise(resolve => setTimeout(resolve, sec * 1000));
  }

  // sharing
  const is_left_bar = false; //Choose if you need lefside bar or bottom bar for custom widget

  function copyToClipboard(element) {
    var $temp = $("<input>");
    $("body").append($temp);
    $temp.val($(element).text()).select();
    document.execCommand("copy");
    $temp.remove();
  }

  $('.link_text_copy').click(function(e){
    e.preventDefault();
    copyToClipboard(this);
    $(this).addClass('copiedInfo');
    setTimeout(() => $(this).removeClass('copiedInfo'), 1500);
  })

  // Show/hide bottom bar on scroll event
  $.fn.scrollStopped = function(callback) {
    var that = this, $this = $(that);
    $this.scroll(function(ev) {
      $('.bottom_bar').fadeOut('fast');
      clearTimeout($this.data('scrollTimeout'));
      $this.data('scrollTimeout', setTimeout(callback.bind(that), 250, ev));
    });
  };

    if(!is_left_bar){
      // Show bottom bar if coursos is over the widget
      // $(window).scrollStopped(() =>{
      //   if($('.widget_body').find("#ROOT_ELEMENT:hover").length){
      //     $('.bottom_bar').css({'display': 'flex'})
      //   }
      // });

      // Show/hide bottom bar if cursor is over the widget
      // $( ".widget_body" ).mouseleave(() => {
      //   $( ".bottom_bar" ).css({'display': 'none'})
      // });
      // $( ".widget_body" ).mouseenter(() => {
      //   $( ".bottom_bar" ).css({'display': 'flex'})
      // });
    }
  // for checking if user is on twitter.com -- whether to show the widget side buttons
    function findGetParameter(parameterName) {
      var result = null,
          tmp = [];
      location.search
          .substr(1)
          .split("&")
          .forEach(function (item) {
            tmp = item.split("=");
            if (tmp[0] === parameterName) result = decodeURIComponent(tmp[1]);
          });
      return result;
    }
    $('.left_side_bar').hover(function() {
      if (findGetParameter('parent_host_name') === "twitter.com") {
        $( this ).fadeTo( 500, 1 ); // speed of fade of side buttons actually is controlled in style.css .left_side_bar transition
      } else {
        $( this ).hide();
      }
    }, function() {
      $( this ).fadeTo( 500, 0 );
    })
    
}(window))



// Video Play Button Start //
$(document).ready(function() {
  $('body').on('click', '.video-wrap', function(){

    const video = $(this).find('video').get(0);
    const playButton = $(this).find('.play-btn');
    video.controls = false;

    if (video.paused || video.ended) {
        video.play();
        playButton.hide()
    } else {
        video.pause();
        playButton.show();
    }

    video.onended = function() {
      playButton.show();
      video.controls = false;
    };

    video.onplay = function() {
      video.controls = true;
    };

    video.onpause = function() {
      playButton.show();
    };

  });
});
// Video Play Button End // 
