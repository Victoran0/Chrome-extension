const EXT_URL = `chrome-extension://${chrome.runtime.id}`

// const url = 'https://publish.twitter.com/oembed?url=https://twitter.com/speakerpelosi/status/1367292989215813634';

// 'patsajak', '1475903936246816780'
// const know_active_tweet = (twitter_id, tweet_id) => {
//     let url = `https://publish.twitter.com/oembed?url=https://twitter.com/${twitter_id}/status/${tweet_id}`;
//     fetch(url)
//     .then(async (data) => {
//         if (data.ok) {
//             data = await data.json()
//             console.log("got the data:", data)
//         } else {
//             console.log('caught error 404')
//         }
//     })
// }

const show_tooltip = (tooltip) => {
    return new Promise((resolve, reject) => {
            setTimeout(() => {
                resolve(tooltip.style.visibility = 'visible')
            }, 350)
    })
}

const FETCH_DATA = async (twitter_id) => {
    const url = `https://theconversation.social/recipient/get_data_by_twitter_id/${twitter_id.toLowerCase()}/?related_curations=true`
    const options = {method: 'GET', credentials: 'include'}
    const response = await fetch(url, options)
    const data = await response.json()
    return data
}
const FETCH_DATA_SUMMARIZED = async (twitter_id) => {
    const url = `https://theconversation.social/recipient/get_data_by_twitter_id/${twitter_id.toLowerCase()}/?related_curations=true&summarize_statements=true`
    const options = {method: 'GET', credentials: 'include'}
    const response = await fetch(url, options)
    const data = await response.json()
    return data
}
// FETCH_DATA_SUMMARIZED('repadamschiff').then((r) => console.log('summarized:', r))

const FETCH_DATA_TWITTER = async (curation_to_check) => {
    const url = `https://publish.twitter.com/oembed?url=https://twitter.com/${curation_to_check.user_account}/status/${curation_to_check.tweet_id}`
    return fetch(url, options).then(async (response) => {
        if (response.ok) {
            response = await response.json()
            // console.log('response: ',response)
            return response
        } else {
            console.log('caught error 404')
        }
    })
}
// FETCH_DATA_TWITTER('elonmusk').then((r) => console.log('THE DATA:', r))
    
// get message from background.js that page is fully loaded and check for ROOT_ELEMENT
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.message === 'PAGE_FULLY_LOADED') {
        const ROOT_ELEMENT = document.getElementById('ROOT_ELEMENT')
    }
})

const TOOL_TIP = document.createElement('div')
TOOL_TIP.classList.add('tool-tip')

const short_desc_ele = (short_desc) => {
    return `<p>${short_desc}</p>`
}

const image_ele = (image) => {
    return `<img style="width: 40px; height: 60px;" src=${image} >`
}

const date_to_num = (tweet_date) => {
    const date = tweet_date.slice(0,tweet_date.length-3)
    let b = ''
    for (let i=0; i<date.length; i++) {
        let c = +date[i]
        if (c || date[i] === '0') {
            b += date[i]
        }
    }
    return +b
}

const date_display = (date) => {
    const dateArr = date.split('-')
    const display_fmt = `${dateArr[1]}/${dateArr[2]}/${dateArr[0].slice(2)}`
    return display_fmt
};

// REMOVE ALL HTMLS FROM TWEET OBJ
const curations_links = (curations, obj) => {
    curations.sort((a,b) => date_to_num(b.tweet_date) - date_to_num(a.tweet_date))
    // html2.split('</a></blockquote')[0].split('">')[html2.split('</a></blockquote')[0].split('">').length -1]
    return curations.map(c => {
        // console.log('single curation DATE:', c.tweet_date)
        let tweet_text = obj[c.tweet_id].match(/<p.*?>(.*?)<\/p>/)[1]
        
        // if (tweet_text.includes('<a href')) tweet_text = tweet_text.split('<a href')[0]; 
        // console.log('tweet_text after p strip:', tweet_text)
        if (tweet_text.includes('<br>')) tweet_text = tweet_text.replace(/<br>/g, ".");

        if (tweet_text.includes('<a href')) { 
            text2 = tweet_text.replace(/<a.*?>/g, "")
            tweet_text = text2.replace(/<\/a>/g, "")
        }
        // console.log('tweet text before slice by 90:', tweet_text)
        if (tweet_text.length > 90) tweet_text = tweet_text.slice(0,90) + '...' ;
        // console.log('tweet id value in obj:', obj[c.tweet_id], obj[c.tweet_id].match(/<p.*?>(.*?)<\/p>/)[1])
        if (c.link_title && c.link_title !== "") {
            let link_title = c.link_title ;
            if (link_title.length > 50) link_title = link_title.slice(0,50) + '...' ;
            return (`<li class='related_curations-li'> 
            <a class='related_curations-li-link m0-p0' href='https://twitter.com/${c.user_account.toLowerCase()}/status/${c.tweet_id}'>
            <p class='li_link_title m0-p0'> ${link_title} </p>
            <p class='li_tweet-text m0-p0'>"${tweet_text}" <span> -- ${date_display(c.tweet_date.split('T')[0])}</span></p>
            </a> 
            </li>
            `)
            // <p>${obj[c.tweet_id].match(/<p.*?>(.*?)<\/p>/)[1].split('<a href')[0].slice(0,200)`...`} ${obj[c.tweet_id].split('</a></blockquote')[0].split('">')[obj[c.tweet_id].split('</a></blockquote')[0].split('">').length - 1]}</p>
        }
        }).join("")
    }

ROOT_ELEMENT.addEventListener('mouseover', async (e) => {
    e.preventDefault();
    // console.log('bottom of hover:', e.pageY)
    if (e.target.parentElement.className === 'social-curation__person-link' && e.target !== TOOL_TIP) {
        show_tooltip(TOOL_TIP)
        TOOL_TIP.style.top = '-25px'
        // TOOL_TIP.style.left = '0px'
        const loading_tooltip = `<div style="margin: 20px; width: 160px; background-color: white;">
        <div class="loading-message" style="margin-top: 5px; text-align: center;font-family: Mulish, sans-serif !important;font-size: 85%;">Fetching data. One moment...</div>
        </div>`
        TOOL_TIP.innerHTML = loading_tooltip

        
        
        let bioData;
        
        const PARENT_TO_ID = e.target.parentElement
        PARENT_TO_ID.style.position = 'relative'
        if (PARENT_TO_ID.firstElementChild !== TOOL_TIP) {
            PARENT_TO_ID.prepend(TOOL_TIP)
        }
        
        const twitter_id = e.target.href.split('.com/')[1]
        
        const r = await FETCH_DATA(twitter_id)
        
        let img;
        const img_container = PARENT_TO_ID.parentElement.parentElement.previousSibling.firstElementChild
        
        if (img_container.className === 'social-curation__picture') {
            img = img_container
        }else  if (img_container.firstElementChild.className === 'social-curation__picture') {
            img = img_container.firstElementChild
        }
        
        const PARENT_TO_PARENT = PARENT_TO_ID.parentElement

        let name;
        if (PARENT_TO_PARENT.firstElementChild.tagName !== 'A') {
            name = PARENT_TO_PARENT.innerHTML.split('<i class=')[0].trim()
        } else if (PARENT_TO_PARENT.firstElementChild.tagName === 'A') {
            name = PARENT_TO_PARENT.firstElementChild.textContent.trim()
        }

        const bio = PARENT_TO_ID.parentElement.parentElement.children.item(2).textContent        
                
            if (r.id !== undefined || r.related_curations !== undefined && r.related_curations.length > 0 || r.category !== undefined && r.category.length > 0) {
                let nationalities; let tags; let category; let subcategory; let csvHtml; const curations = []; const obj = {}; let sorted_curations = []; let sorted_curations10 = []; let sorted_by_ids; let summary = ''
                
                if (r.nationalities) nationalities = r.nationalities.join(', ')
                if (r.tags) tags = r.tags.join(', ')
                
                if (r.category !== '') {
                category = r.category
                }
                if (r.subcategory !== '') {
                    subcategory = r.subcategory
                }
                if (r.csv_data) {
                    csvHtml = r.csv_data.map(function (data) {
                    const fieldsHtml = data.fields.map(function (field) {
                    return field.link ? '<a href="' + field.link + '" target="_blank">' + field.data + '</a>'
                    : field.data
                    }).join(', ')
                    return '<div class="imdb-' + data.label.toLowerCase().replace(/ /g, '-') + '"><span><strong>' + data.label + '</strong>: ' + fieldsHtml + '</span></div>'
                }).join('')
            }

            
            if (r.related_curations && r.related_curations.length > 0) {
                // console.log('user related_curations:', r.related_curations)
                if (r.related_curations.length === 1) {
                    sorted_curations10.push(r.related_curations[0])
                    sorted_curations = sorted_curations10
                } else {
                    sorted_by_ids = r.related_curations.sort((a,b) => (b.tweet_id) - (a.tweet_id))
                    for (let i = 0; i< sorted_by_ids.length; i++) {
                        if (i > 0 && sorted_by_ids[i-1].tweet_id === sorted_by_ids[i].tweet_id) continue;
                        sorted_curations.push(sorted_by_ids[i])
                    }
                    sorted_curations = sorted_curations.sort((a,b) => date_to_num(b.tweet_date) - date_to_num(a.tweet_date))
                    sorted_curations10 = sorted_curations.slice(0,10)
                } 
                // console.log('SORTED user related_curations:', sorted_curations)
                for (let i = 0; i<sorted_curations10.length; i++) {
                    const  oembed_response = await FETCH_DATA_TWITTER(sorted_curations10[i])
                    // console.log('oembed_response:', oembed_response)
                    // console.log('twitter response:', oembed_response)
                    if (oembed_response !== undefined) {
                        if (!curations.includes(sorted_curations10[i])) {
                            curations.push(sorted_curations10[i])
                            obj[sorted_curations10[i].tweet_id] = oembed_response.html
                        }
                        // console.log('curations:', curations)
                    }


                    if (curations.length > 0) {
                        const list_items = curations_links(curations, obj)
                        bioData = ` 
                <div style="margin-bottom: 10px; width: 450px; max-height: 680px; padding: 15px; font-size: 14px; letter-spacing: .3px; font-family: arial, Helvetica, muli, mulish, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Ubuntu, Helvetica Neue, Arial,sans-serif !important; padding-bottom: 15px; line-height: 2rem; font-weight: 400;">
                <div class="tool-tip_header">
                <img style="width: 40px; height: 40px; border-radius: 50%; margin-right: 10px; margin-left: 0;" src=${img.src} >
                <div style="display: flex; flex-direction: column; margin-right: auto;">
                <h5 style="margin: 0; padding: 0; margin-bottom: 6.5px;> <strong style="">${name}</strong> </h5>
                <h5 style="margin: 0; padding: 0; "> @${twitter_id} </h5>
                </div>
                <img id="qtip-close" class="qtip-close" style="float: right; margin-left: auto; margin-bottom: auto; cursor: pointer;width:16px !important; height:16px; !important;" width="16px" height="16px"
                src="${EXT_URL + '/close.png'}">
                </img>
                </div>
                <div style="text-align: center; margin: 10px;">
                <strong>SOCIAL INTELLIGENCE BRIEF</strong>
                </div>
                <div class="image" style="margin-bottom: 0; padding-bottom: 0;">
                ${r.image ? `<img src=${r.image} id="tooltipimg" style=" width: 70px; float: left; margin-right: 13px;"/>`: ''}
                <span class="bio" >
                ${r.short_desc ? r.short_desc: ''}
                </span>
                </div>
                    <div class="category" >
                        ${category ? `<span><strong>Category</strong>: ${category[0].toUpperCase() + category.slice(1)} ${(subcategory ? ' > ' : '')} ${subcategory ? subcategory[0].toUpperCase() + subcategory.slice(1) : ''} </span>`: ''}
                    </div>
                <div class="tags" >
                    ${tags ? `<span><strong>Tags</strong>: ${tags} </span>`: ''}
                    </div>
                    <div class="followers">
                    ${r.followers ? `<span><strong>Followers</strong>: ${r.followers} </span>` : ''}
                </div>
                <div class="home-page">
                    ${r.home_page ? `<span><strong>Homepage</strong>: <a href=${r.home_page} target="_blank"> ${r.home_page} </a></span>`: ''}
                </div>
                <div class="related-companies">
                            ${r.related_companies ? `<span><strong>Related Companies</strong>: ${r.related_companies.join(', ')} </span>`: ''}
                            </div>
                            <div class="related-people">
                            ${r.related_people ? `<span><strong>Related People</strong>: ${r.related_people.join(', ')} </span>`: ''}
                        </div>
                        <div class="nationalities">
                            ${nationalities ? `<span><strong>Localities</strong>: ${nationalities} </span>`: ''}
                            </div>
                            <div class="date-of-birth">
                            ${r.date_of_birth ? `<span><strong>Date of Birth</strong>: ${r.date_of_birth} </span>`: ''}
                        </div>
                        <span class="csv-data">
                        ${r.csv_data ? csvHtml: ''}
                        </span>
                        <div id="relations-curations" class="relations-curations">
                        <div class='related_curations-header'>
                        <strong style='margin-right: auto;'>RELATED TOPICS:</strong> 
                        <div id='search_container' class='no_display'>
                        <input id='search_curations' placeholder='Search Related Topics' autocomplete="off" type="search" width='100px' />
                        <button class='related_search_cancel m0-p0'>
                        <img src='data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiA/Pjxzdmcgdmlld0JveD0iMCAwIDk2IDk2IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjx0aXRsZS8+PGc+PHBhdGggZD0iTTQ4LDBBNDgsNDgsMCwxLDAsOTYsNDgsNDguMDUxMiw0OC4wNTEyLDAsMCwwLDQ4LDBabTAsODRBMzYsMzYsMCwxLDEsODQsNDgsMzYuMDM5MywzNi4wMzkzLDAsMCwxLDQ4LDg0WiIvPjxwYXRoIGQ9Ik02NC4yNDIyLDMxLjc1NzhhNS45OTc5LDUuOTk3OSwwLDAsMC04LjQ4NDQsMEw0OCwzOS41MTU2bC03Ljc1NzgtNy43NTc4YTUuOTk5NCw1Ljk5OTQsMCwwLDAtOC40ODQ0LDguNDg0NEwzOS41MTU2LDQ4bC03Ljc1NzgsNy43NTc4YTUuOTk5NCw1Ljk5OTQsMCwxLDAsOC40ODQ0LDguNDg0NEw0OCw1Ni40ODQ0bDcuNzU3OCw3Ljc1NzhhNS45OTk0LDUuOTk5NCwwLDAsMCw4LjQ4NDQtOC40ODQ0TDU2LjQ4NDQsNDhsNy43NTc4LTcuNzU3OEE1Ljk5NzksNS45OTc5LDAsMCwwLDY0LjI0MjIsMzEuNzU3OFoiLz48L2c+PC9zdmc+' width='15px' />
                        </button>
                        </div>
                        <button class='related_search_btn m0-p0'>
                        <img src='data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiA/Pjxzdmcgdmlld0JveD0iMCAwIDUxMiA1MTIiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTUwMC4zIDQ0My43bC0xMTkuNy0xMTkuN2MyNy4yMi00MC40MSA0MC42NS05MC45IDMzLjQ2LTE0NC43QzQwMS44IDg3Ljc5IDMyNi44IDEzLjMyIDIzNS4yIDEuNzIzQzk5LjAxLTE1LjUxLTE1LjUxIDk5LjAxIDEuNzI0IDIzNS4yYzExLjYgOTEuNjQgODYuMDggMTY2LjcgMTc3LjYgMTc4LjljNTMuOCA3LjE4OSAxMDQuMy02LjIzNiAxNDQuNy0zMy40NmwxMTkuNyAxMTkuN2MxNS42MiAxNS42MiA0MC45NSAxNS42MiA1Ni41NyAwQzUxNS45IDQ4NC43IDUxNS45IDQ1OS4zIDUwMC4zIDQ0My43ek03OS4xIDIwOGMwLTcwLjU4IDU3LjQyLTEyOCAxMjgtMTI4czEyOCA1Ny40MiAxMjggMTI4YzAgNzAuNTgtNTcuNDIgMTI4LTEyOCAxMjhTNzkuMSAyNzguNiA3OS4xIDIwOHoiLz48L3N2Zz4=' width='15px'/>
                        </button>
                        </div>
                        <div id='related_curations_summarized'></div>
                        <ul id="curations_list" style="margin-left: 10px; padding-left: 0;">
                        ${list_items}
                        <ul/>
                        </div>
                        <p id='no_result' style='display: none;'>No Matches</p>
                        <div style="width: 50%; margin: auto;"> 
                        ${sorted_curations.length !== sorted_curations10.length ? `<button id="curations-btn" class="curations-btn">show more</button>`: ''}
                        </div>
                        </div>
                        `


                    } else {
                        bioData = ` 
                <div style="width: 450px; max-height: 680px; padding: 15px; font-size: 14px; letter-spacing: .3px; font-family: arial, Helvetica, muli, mulish, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Ubuntu, Helvetica Neue, Arial,sans-serif !important; padding-bottom: 15px; line-height: 2rem; font-weight: 400;">
                <div class="tool-tip_header" style="margin-bottom: 10px;">
                <img style="width: 40px; height: 40px; border-radius: 50%; margin-right: 10px; margin-left: 0;" src=${img.src} >
                <div style="display: flex; flex-direction: column; margin-right: auto;">
                <h5 style="margin: 0; padding: 0; margin-bottom: 6.5px;> <strong style="">${name}</strong> </h5>
                <h5 style="margin: 0; padding: 0; "> @${twitter_id} </h5>
                </div>
                <img id="qtip-close" class="qtip-close" style="float: right; margin-left: auto; margin-bottom: auto; cursor: pointer;width:16px !important; height:16px; !important;" width="16px" height="16px"
                src="${EXT_URL + '/close.png'}">
                </img>
                </div>
                ${bio !== undefined ? `<p>${bio}</p>`: ''}
                </div>
                `
                    }

                        if (document.getElementById('curations-btn')){
                            document.getElementById('curations-btn').style.visibility = 'visible'
                        }
                        TOOL_TIP.innerHTML = bioData
                        
                        // console.log('tool Tip Top:', TOOL_TIP.getBoundingClientRect().bottom, twitter_id)
                        // console.log('activate zone:', e)
                        // console.log('windows Height:', window.innerHeight)
                        
                        // if (TOOL_TIP.getBoundingClientRect().bottom > window.innerHeight - 10) {
                        //     TOOL_TIP.style.top = `${window.innerHeight - TOOL_TIP.getBoundingClientRect().bottom - 45}px`
                        // }
                        if (TOOL_TIP.getBoundingClientRect().bottom > window.innerHeight - 10) {
                                TOOL_TIP.style.top = `${window.innerHeight - TOOL_TIP.getBoundingClientRect().bottom - 45}px`
                            }

                        if (document.getElementById('qtip-close')) {
                            document.getElementById('qtip-close').addEventListener('click', (e) => {
                                e.preventDefault();
                                TOOL_TIP.style.visibility = 'hidden'
                                // console.log('bye bye to tool tip')
                            })
                        }

                        if (document.querySelector('.related_search_btn')) {
                            document.querySelector('.related_search_btn').addEventListener('click', (e) => {
                                console.log('search glass clicked');
                                e.preventDefault();
                                e.currentTarget.style.display = 'none'

                                if (document.getElementById('curations-btn')) {
                                    document.getElementById('curations-btn').click()
                                }

                                document.getElementById('search_container').classList.remove('no_display')
                                document.getElementById('search_container').classList.add('search_container')
                                document.getElementById('search_curations').focus()

                            })
                        }
                        
                        if (document.querySelector('.related_search_cancel')) {
                            document.querySelector('.related_search_cancel').addEventListener('click', (e) => {
                                console.log('cancel search clicked');
                                e.preventDefault();
                                document.getElementById('search_curations').value = ''
                                document.getElementById('search_container').classList.remove('search_container')
                                document.getElementById('search_container').classList.add('no_display')

                                document.querySelector('.related_search_btn').style.display = 'inline-block'
                                const curations_list = document.getElementById('curations_list')
                                const allLi = curations_list.getElementsByTagName('li')
                                for (let i = 0; i < allLi.length; i++) {
                                    if (allLi[i].style.display === 'none') {
                                        allLi[i].style.display = 'block'
                                    }
                                }
                            })
                        }

                        if (document.getElementById('tooltipimg')) {
                        document.getElementById('tooltipimg').addEventListener('error', (e) => {
                            e.preventDefault();
                            e.currentTarget.style.display = 'none'
                            // console.log('image error, not displayed' )
                        })
                    }



                    if (document.getElementById('search_curations')) {
                        document.getElementById('search_curations').addEventListener('input', (e) => {
                            e.preventDefault()
                            const search_value = e.target.value.toLowerCase()

                            console.log('search value:', search_value)
                            const curations_list = document.getElementById('curations_list')
                            const allLi = curations_list.getElementsByTagName('li')
                            // for (let i = 0; i < allLi.length; i++) {
                            //     if (allLi[i].style.display === 'none') {
                            //         allLi[i].style.display = 'block'
                            //     }
                            // }
                            
                            for (let i = 0; i < allLi.length; i++) {
                                if (search_value === '') {
                                    if (allLi[i].style.display === 'none') {
                                        allLi[i].style.display = 'block'
                                        // document.getElementById('no_result').style.display = 'block'
                                    }
                                } else if (allLi[i].querySelector('.li_link_title').textContent.toLowerCase().includes(search_value) || allLi[i].querySelector('.li_tweet-text').textContent.toLowerCase().includes(search_value)) {
                                        allLi[i].style.display = 'block'
                                    } else if (!allLi[i].querySelector('.li_link_title').textContent.toLowerCase().includes(search_value) && !allLi[i].querySelector('.li_tweet-text').textContent.toLowerCase().includes(search_value)) {
                                        allLi[i].style.display = 'none'
                                        // if (document.getElementById('no_result')) {
                                            // document.getElementById('no_result').style.display = 'block'
                                        // }
                                    }
                            }
                        })
                    }

                            if (document.getElementById('curations-btn')) {
                        document.getElementById('curations-btn').addEventListener('click', async (e) => {
                            e.preventDefault();
                            console.log('show more clicked!!!')
                            document.getElementById('curations-btn').textContent = 'Loading...'
                            const remaining_sorted_curations = sorted_curations.slice(10)
                            console.log('the remaining sorted curations without first 10:', remaining_sorted_curations)
                            for (let i = 0; i<remaining_sorted_curations.length; i++) {
                                const  oembed_response = await FETCH_DATA_TWITTER(remaining_sorted_curations[i])
                                console.log('twitter response:', oembed_response)
                                if (oembed_response !== undefined) {
                                    if (!curations.includes(remaining_sorted_curations[i])) {
                                        curations.push(remaining_sorted_curations[i])
                                        obj[remaining_sorted_curations[i].tweet_id] = oembed_response.html
                                    }
                                }
                            }
                            document.getElementById('curations_list').innerHTML = await curations_links(curations, obj)
                            document.getElementById('curations-btn').style.visibility = 'hidden'
                        })
                    }

            }
                const res = await FETCH_DATA_SUMMARIZED(twitter_id)
                
                if (curations.length > 0 && res.related_curations_summarized && res.related_curations_summarized.completed_ok === true) {
                    console.log('past_statements_summarized:', res.related_curations_summarized.past_statements_summarized)
                    summary = res.related_curations_summarized.past_statements_summarized
                    if (document.getElementById('related_curations_summarized')) {
                        document.getElementById('related_curations_summarized').innerHTML = `<p class='related_curations_summarized' style='margin: 15px;'>${summary}</p>`
                    }
                }
                console.log('summarized:', res)
                if (TOOL_TIP.getBoundingClientRect().bottom > window.innerHeight - 10) {
                    TOOL_TIP.style.top = `${window.innerHeight - TOOL_TIP.getBoundingClientRect().bottom - 45}px`
                }

            } else {
                bioData = ` 
                <div style="margin-bottom: 10px; width: 450px; max-height: 680px; padding: 15px; font-size: 14px; letter-spacing: .3px; font-family: arial, Helvetica, muli, mulish, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Ubuntu, Helvetica Neue, Arial,sans-serif !important; padding-bottom: 15px; line-height: 2rem; font-weight: 400;">
                <div class="tool-tip_header">
                <img style="width: 40px; height: 40px; border-radius: 50%; margin-right: 10px; margin-left: 0;" src=${img.src} >
                <div style="display: flex; flex-direction: column; margin-right: auto;">
                <h5 style="margin: 0; padding: 0; margin-bottom: 6.5px;> <strong style="">${name}</strong> </h5>
                <h5 style="margin: 0; padding: 0; "> @${twitter_id} </h5>
                </div>
                <img id="qtip-close" class="qtip-close" style="float: right; margin-left: auto; margin-bottom: auto; cursor: pointer;width:16px !important; height:16px; !important;" width="16px" height="16px"
                src="${EXT_URL + '/close.png'}">
                </img>
                </div>
                <div style="text-align: center; margin: 10px;">
                <strong>SOCIAL INTELLIGENCE BRIEF</strong>
                </div>
                <div class="image" style="margin-bottom: 0; padding-bottom: 0;">
                ${r.image ? `<img src=${r.image} id="tooltipimg" style=" width: 70px; float: left; margin-right: 13px;"/>`: ''}
                <span class="bio" >
                ${r.short_desc ? r.short_desc: ''}
                </span>
                </div>
                    <div class="category" >
                        ${category ? `<span><strong>Category</strong>: ${category[0].toUpperCase() + category.slice(1)} ${(subcategory ? ' > ' : '')} ${subcategory ? subcategory[0].toUpperCase() + subcategory.slice(1) : ''} </span>`: ''}
                    </div>
                <div class="tags" >
                    ${tags ? `<span><strong>Tags</strong>: ${tags} </span>`: ''}
                    </div>
                    <div class="followers">
                    ${r.followers ? `<span><strong>Followers</strong>: ${r.followers} </span>` : ''}
                </div>
                <div class="home-page">
                    ${r.home_page ? `<span><strong>Homepage</strong>: <a href=${r.home_page} target="_blank"> ${r.home_page} </a></span>`: ''}
                </div>
                <div class="related-companies">
                            ${r.related_companies ? `<span><strong>Related Companies</strong>: ${r.related_companies.join(', ')} </span>`: ''}
                            </div>
                            <div class="related-people">
                            ${r.related_people ? `<span><strong>Related People</strong>: ${r.related_people.join(', ')} </span>`: ''}
                        </div>
                        <div class="nationalities">
                            ${nationalities ? `<span><strong>Localities</strong>: ${nationalities} </span>`: ''}
                            </div>
                            <div class="date-of-birth">
                            ${r.date_of_birth ? `<span><strong>Date of Birth</strong>: ${r.date_of_birth} </span>`: ''}
                        </div>
                        <span class="csv-data">
                            ${r.csv_data ? csvHtml: ''}
                            </span>
                        </div>
                        `

                        TOOL_TIP.innerHTML = bioData
    
            if (TOOL_TIP.getBoundingClientRect().bottom > window.innerHeight - 10) {
                TOOL_TIP.style.top = `${window.innerHeight - TOOL_TIP.getBoundingClientRect().bottom - 45}px`
            }
    
            if (document.getElementById('qtip-close')) {
                document.getElementById('qtip-close').addEventListener('click', (e) => {
                    e.preventDefault()
                    TOOL_TIP.style.visibility = 'hidden'
                    // console.log('bye bye to tool tip')
                    
                })
            }
            }

                    if (document.getElementById('tooltipimg')) {
                        document.getElementById('tooltipimg').addEventListener('error', (e) => {
                            e.preventDefault()
                            e.currentTarget.style.display = 'none'
                            // console.log('image error, not displayed' )
                        })
                    }
                                        
                } else {
                bioData = ` 
                <div style="width: 450px; max-height: 680px; padding: 15px; font-size: 14px; letter-spacing: .3px; font-family: arial, Helvetica, muli, mulish, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Ubuntu, Helvetica Neue, Arial,sans-serif !important; padding-bottom: 15px; line-height: 2rem; font-weight: 400;">
                <div class="tool-tip_header" style="margin-bottom: 10px;">
                <img style="width: 40px; height: 40px; border-radius: 50%; margin-right: 10px; margin-left: 0;" src=${img.src} >
                <div style="display: flex; flex-direction: column; margin-right: auto;">
                <h5 style="margin: 0; padding: 0; margin-bottom: 6.5px;> <strong style="">${name}</strong> </h5>
                <h5 style="margin: 0; padding: 0; "> @${twitter_id} </h5>
                </div>
                <img id="qtip-close" class="qtip-close" style="float: right; margin-left: auto; margin-bottom: auto; cursor: pointer;width:16px !important; height:16px; !important;" width="16px" height="16px"
                src="${EXT_URL + '/close.png'}">
                </img>
                </div>
                ${bio !== undefined ? `<p>${bio}</p>`: ''}
                </div>
                `

                TOOL_TIP.innerHTML = bioData
    
            if (TOOL_TIP.getBoundingClientRect().bottom > window.innerHeight - 10) {
                TOOL_TIP.style.top = `${window.innerHeight - TOOL_TIP.getBoundingClientRect().bottom - 45}px`
            }
    
            if (document.getElementById('qtip-close')) {
                document.getElementById('qtip-close').addEventListener('click', (e) => {
                    e.preventDefault()
                    TOOL_TIP.style.visibility = 'hidden'
                    console.log('bye bye to tool tip')
                    
                })
            }
                    // console.log('tool Tip Bottom:', TOOL_TIP.getBoundingClientRect(), twitter_id)
                    // console.log('activate zone:', e)
                    // console.log('windows height:', window.innerHeight)
            }


    }
    // if (e.target === TOOL_TIP) {
        //     leave_tool_tip = true
        //     TOOL_TIP.style.visibility = 'visible'
        // }
        if (e.target.parentElement.className !== 'social-curation__person-link' && e.target !== TOOL_TIP && !TOOL_TIP.contains(e.target)) {
            setTimeout(() => {
                TOOL_TIP.style.visibility = 'hidden'
        }, 95)
    }
})
    
// TOOL_TIP.addEventListener('mouseover', () => {
// })

// TOOL_TIP.firstElementChild.addEventListener('mouseout', () => {
//         setTimeout(() => {
//             TOOL_TIP.innerHTML = ''
//             TOOL_TIP.style.visibility = 'hidden'
//             // leave_tool_tip = false
//         }, 200)
//     console.log('mouse out of the tool tip')
// })

ROOT_ELEMENT.addEventListener('mouseout', (e) => {
    // if (e.target === TOOL_TIP) {
    //     TOOL_TIP.innerHTML = ''
    //     // setTimeout(() => {
    //     // }, 50)
    // }

    // if (e.target.parentElement.className === 'social-curation__person-link') {
    //         setTimeout(() => {
    //             if (!leave_tool_tip) {
    //                 TOOL_TIP.innerHTML = ''
    //                 TOOL_TIP.style.visibility = 'hidden'
    //             }    
    //         }, 200)
    // }
    
    // if (e.target === TOOL_TIP) {
    //     const PARENT_ID = e.target.parentElement.parentElement
    //     console.log('tool tip to person-link:', PARENT_ID)
    //     remove_tool_tip(PARENT_ID)
    //     leave_tool_tip = false
    // }
    
    // if (e.target.parentElement === TOOL_TIP ) {
    //     const PARENT_ID = e.target.parentElement.parentElement.parentElement
    //     console.log('tooltip CHILD to person-link:', PARENT_ID)
    //     remove_tool_tip(PARENT_ID)
    //     leave_tool_tip = false
    // }
    // console.log('leave_tool_tip:', leave_tool_tip)
})

// ROOT_ELEMENT.addEventListener('click', (e) => {
//     console.log('windows width:', window.innerWidth)
//     console.log('clicked position Page:',e.pageX)
//     console.log('clicked position Client:',e.clientX)

// })


// get the twitter class selector
// 