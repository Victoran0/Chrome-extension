// const obj = {
//     "id": 105348, 
//     "image": "https://s3.amazonaws.com//writepublic-uploads/validrecipientimages/original/8/8d/President_Barack_Obama.jpg", 
//     "related_companies": ["Harvard Law School", "Occidental College", "Columbia University"], 
//     "nationalities": ["White House", "Chicago, Illinois", "Hawaii", "Honolulu"], 
//     "tags": ["attorney", "politician", "author", "artist", "state-senator"], 
//     "related_people": ["Ann Dunham", "Michelle Obama", "Peter Fitzgerald (politician)", "Alice Palmer (politician)", "George W. Bush", "Kwame Raoul", "Barack Obama, Sr.", "Roland Burris"], 
//     "date_of_birth": "August 03, 1961", 
//     "short_desc": "Barack Hussein Obama II is the 44th and current President of the United States, and the first African American to hold the office. Born in Honolulu, Hawaii, Obama is a graduate of Columbia University and Harvard Law School, where he served as president of the &quot;Harvard Law Review&quot;. He was a community organizer in Chicago before earning his law degree. He worked as a civil rights attorney and taught constitutional law at the University of Chicago Law School from 1992 to 2004. He served three terms representing the 13th District in the Illinois Senate from 1997 to 2004, running unsuccessfully for the United States House of Representatives in 2000.", 
//     "category": "government", 
//     "subcategory": "politician", 
//     "csv_data": [
//         {"label": "Employer", "fields": [
//             {"data": "University of Chicago"}, 
//             {"data": "Sidley Austin"}, 
//             {"data": "Business International Corporation"}, 
//             {"data": "New York Public Interest Research Group"}, 
//             {"data": "Gamaliel Foundation"}]}, 
//         {"label": "Religion", "fields": [
//             {"data": "congregational church"}, 
//             {"data": "Congregationalist polity"}, 
//             {"data": "Protestantism"}, 
//             {"data": "United Church of Christ"}]}, 
//         {"label": "Ethnic Group", "fields": [
//             {"data": "African Americans"}]}, 
//         {"label": "Books Authored", "fields": [
//             {"link": "https://en.wikipedia.org/wiki/Of_Thee_I_Sing_(book)", "data": "Of Thee I Sing"}, 
//             {"link": "https://en.wikipedia.org/wiki/Dreams_from_My_Father", "data": "Dreams from My Father"}, 
//             {"link": "https://en.wikipedia.org/wiki/The_Audacity_of_Hope", "data": "The Audacity of Hope"}]}, 
//         {"label": "Musicbrainz Profile", "fields": [
//             {"link": "https://musicbrainz.org/artist/0de4d19f-05c8-4562-a3c0-7abdc144f1d5", "data": "https://musicbrainz.org/artist/0de4d19f-05c8-4562-a3c0-7abdc144f1d5"}, 
//             {"link": "https://musicbrainz.org/artist/0de4d19f-05c8-4562-a3c0-7abdc144f1d5", "data": "https://musicbrainz.org/artist/0de4d19f-05c8-4562-a3c0-7abdc144f1d5"}]}, 
//         {"label": "Albums", "fields": [
//             {"link": "http://www.discogs.com/artist/1252891", "data": "http://www.discogs.com/artist/1252891"}, 
//             {"link": "http://www.discogs.com/artist/1252891", "data": "http://www.discogs.com/artist/1252891"}]}, 
//         {"label": "Positions", "fields": [ {"data": "President of the United States"}]}, 
//         {"label": "Political Party", "fields": [{"data": "Democratic Party"}]}, 
//         {"label": "Statement Truthfulness", "fields": [{"link": "http://www.politifact.com/personalities/barack-obama", "data": "Poltifact Profile"}]}, 
//         {"label": "On TV", "fields": [{"link": "http://www.c-span.org/person/?barackobama", "data": "CSPAN Appearances"}]}, 
//         {"label": "N.Y. Times:", "fields": [{"link": "http://www.nytimes.com/topic/person/barack-obama", "data": "News Coverage"}]}, 
//         {"label": "Schools", "fields": [
//             {"data": "Occidental College"}, 
//             {"data": "State Elementary School Menteng 01"}, 
//             {"data": "Punahou School"}, 
//             {"data": "Harvard Law School"}, 
//             {"data": "Noelani Elementary School"}, 
//             {"data": "Columbia University"}]}, 
//         {"label": "Awards", "fields": [
//             {"data": "Grammy Award for Best Spoken Word Album"}, 
//             {"data": "NAACP Image Award \u00e2\u0080\u0093 Chairman's Award"}, 
//             {"data": "NAACP Image Award for Outstanding Literary Work, Nonfiction"}, 
//             {"data": "Nobel Peace Prize"}, 
//             {"data": "Presidential Medal of Distinction"}, 
//             {"data": "Time Person of the Year"}]}
//         ]
//     }

// const EXT_URL = `chrome-extension://${chrome.runtime.id}`

const FETCH_DATA = async (twitter_id) => {
    const url = `https://theconversation.social/recipient/get_data_by_twitter_id/${twitter_id}/`
    const options = {method: 'GET', credentials: 'include'}
    const response = await fetch(url, options)
    const data = await response.json()
    return data
}
    
// get message from background.js that page is fully loaded and check for ROOT_ELEMENT
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.message === 'PAGE_FULLY_LOADED') {
        const ROOT_ELEMENT = document.getElementById('ROOT_ELEMENT')
        // console.log('Root Element:', ROOT_ELEMENT)
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

ROOT_ELEMENT.addEventListener('mouseover', (e) => {
    e.preventDefault()
    if (e.target.parentElement.className === 'social-curation__person-link') {
        const PARENT_TO_ID = e.target.parentElement
        // PARENT_TO_ID.style.position = 'relative'
        // check if e.target, then if e.target.href
        const twitter_id = e.target.href.split('.com/')[1]
        
        let img;
        const img_container = PARENT_TO_ID.parentElement.parentElement.previousSibling.firstElementChild
        
        if (img_container.className === 'social-curation__picture') {
            img = img_container
        }else  if (img_container.firstElementChild.className === 'social-curation__picture') {
            img = img_container.firstElementChild
        }
        
        const PARENT_TO_PARENT = PARENT_TO_ID.parentElement
        // console.log('PARENT_TO_PARENT:', PARENT_TO_PARENT)
        let name;
        if (PARENT_TO_PARENT.firstElementChild.tagName !== 'A') {
            name = PARENT_TO_PARENT.innerHTML.split('<i class=')[0].trim()
        } else if (PARENT_TO_PARENT.firstElementChild.tagName === 'A') {
            name = PARENT_TO_PARENT.firstElementChild.textContent.trim()
        }
        // console.log('name:', name)
        
        
        const bio = PARENT_TO_ID.parentElement.parentElement.children.item(2).textContent
        // console.log('bio:', bio)
        
        // console.log('bio:', bio === '')
                
        FETCH_DATA(twitter_id).then((r) => {
            if (r.id !== undefined) {
                let nationalities; let tags; let category; let subcategory; let csvHtml;
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

                TOOL_TIP.innerHTML = ` 
                <div style="margin-bottom: 10px; width: 200px; height: 280px; padding: 5px; font-size: 75%; letter-spacing: .3px; font-family:  muli, mulish, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Ubuntu, Helvetica Neue,Helvetica,Arial,sans-serif !important;">
                <h5>
                <span> <img style="width: 40px; height: 40px; border-radius: 50%;" src=${img.src} > </span>
                @${twitter_id}
                </h5> 
                <h6><strong>${name}</strong></h6>
                <div style="text-align: center; margin: 10px;">
                <strong>SOCIAL INTELLIGENCE BRIEF</strong>
                </div>
                <div class="image" style="margin-bottom: 0; padding-bottom: 0;">
                ${r.image ? `<img src=${r.image} onload="console.log('image link:', this.src);" style=" width: 40px; float: left; margin-right: 13px;"/>`: ''}
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
                        <br>
                    </div>
                `

                } else {
                TOOL_TIP.innerHTML = ` 
                    <div style="margin-bottom: 10px; width: 200px; height: 120px; padding: 5px; font-size: 75%; letter-spacing: .3px; font-family:  muli, mulish, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Ubuntu, Helvetica Neue,Helvetica,Arial,sans-serif !important;">
                        <h5>
                        <span> <img style="width: 40px; height: 40px; border-radius: 50%;" src=${img.src} > </span>
                        @${twitter_id}
                        </h5> 
                        <h6><strong>${name}</strong></h6>
                        ${bio !== undefined ? `<p>${bio}</p>`: ''}
                    </div>
                `
            }
        })

        
        setTimeout(() => {
            if (e.target.firstElementChild === null) {
                e.target.append(TOOL_TIP)
            }
            if (!e.target.classList.contains("tool-tip-parent")) {
                e.target.classList.add('tool-tip-parent')
            }
            // console.log('target first child:', e.target.firstElementChild)
            // TOOL_TIP.style.visibility = 'visible'
        }, 200)
        // console.log('user bio:', e.target.parentElement.parentElement.parentElement.children.item(2).textContent)
        
        // console.log('target:',e.target)
    }
    // if (e.target === TOOL_TIP) {
    //     leave_tool_tip = true
    //     TOOL_TIP.style.visibility = 'visible'
    // }
    if (e.target.parentElement.className !== 'social-curation__person-link' && e.target !== TOOL_TIP && !TOOL_TIP.contains(e.target)) {
        setTimeout(() => {
            TOOL_TIP.innerHTML = ''
        }, 100)
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

//  we check the first ten, if any is valid, we show them and show the show more button, on click of the show more button, we show them all

// #############


{"id": 70304, "image": "https://s3.amazonaws.com//writepublic-uploads/validrecipientimages/original/8/82/Elizabeth_Warren--Official_113th_Congressional_Portrait--.jpg", "related_companies": ["Rutgers School of Law\u2013Newark", "George Washington University", "University of Houston"], "nationalities": ["US", "Oklahoma City", "Oklahoma", "Cambridge, Massachusetts"], "tags": ["attorney", "politician", "author", "financial-adviser"], "related_people": ["Scott Brown", "Bruce Mann", "Ted Kaufman"], "date_of_birth": "June 21, 1949", "short_desc": "Elizabeth Ann Warren  is an American academic and politician, who is the senior United States Senator from Massachusetts and a member of the Democratic Party. She was previously a Harvard Law School professor specializing in bankruptcy law. Warren is an active consumer protection advocate whose work led to the conception and establishment of the U.S. Consumer Financial Protection Bureau. She has written a number of academic and popular works, and is a frequent subject of media interviews regarding the American economy and personal finance.", "category": "government", "subcategory": "politician", "csv_data": [{"label": "Contact Page", "fields": [{"link": "https://www.warren.senate.gov/contact/shareyouropinion ; https://elizabethwarren.com/contact-us", "data": "https://www.warren.senate.gov/contact/shareyouropinion ; https://elizabethwarren.com/contact-us"}, {"link": "https://www.warren.senate.gov/contact/shareyouropinion ; https://elizabethwarren.com/contact-us", "data": "https://www.warren.senate.gov/contact/shareyouropinion ; https://elizabethwarren.com/contact-us"}]}, {"label": "Address", "fields": [{"data": "2400 John Fitzgerald Kennedy Federal Building|Boston,MA 02203 Alt address:  1550 Main Street|Springfield,MA 01103 Alt address:  317 Hart Senate Office Building|Washington,DC 20510 "}, {"data": "2400 John Fitzgerald Kennedy Federal Building|Boston,MA 02203 Alt address:  1550 Main Street|Springfield,MA 01103 Alt address:  317 Hart Senate Office Building|Washington,DC 20510 "}]}, {"label": "Phone", "fields": [{"data": "617-565-3170; 413-788-2690; 202-224-4543"}, {"data": "617-565-3170; 413-788-2690; 202-224-4543"}, {"data": "+1-202-224-4543"}]}, {"label": "Employer", "fields": [{"data": "Harvard Law School"}, {"data": "University of Michigan Law School"}, {"data": "Rutgers School of Law\u00e2\u0080\u0093Newark"}, {"data": "University of Houston Law Center"}, {"data": "University of Pennsylvania Law School"}, {"data": "University of Texas School of Law"}]}, {"label": "Religion", "fields": [{"data": "Methodism"}]}, {"label": "Ethnic Group", "fields": [{"data": "White Americans"}]}, {"label": "Positions", "fields": [{"data": "chairperson"}, {"data": "United States senator"}, {"data": "presidential candidate"}, {"data": "special adviser"}]}, {"label": "Political Party", "fields": [{"data": "Democratic Party"}]}, {"label": "Ideology", "fields": [{"data": "liberalism"}]}, {"label": "Statement Truthfulness", "fields": [{"link": "http://www.politifact.com/personalities/elizabeth-warren", "data": "Poltifact Profile"}]}, {"label": "N.Y. Times:", "fields": [{"link": "http://www.nytimes.com/topic/person/elizabeth-warren", "data": "News Coverage"}]}, {"label": "Schools", "fields": [{"data": "George Washington University"}, {"data": "University of Houston"}, {"data": "Rutgers School of Law\u00e2\u0080\u0093Newark"}]}], 
"related_curations": [
    {"user_account": "senwarren", "link_id": 10082, "tweet_id": "754775319429652480", "link_title": "Police say Baton Rouge gunman \u2018was targeting officers\u2019 and ambushed them", "relevance_score": 100492.94112861344, "tweet_date": "2016-07-17T20:30:33"}, 
{"user_account": "senwarren", "link_id": 20782, "tweet_id": "832378200151977985", "link_title": "New EPA chief\u2019s emails reveal coordination with oil interests", "relevance_score": null, "tweet_date": "2017-02-16T23:56:42"}, 
{"user_account": "senwarren", "link_id": 20782, "tweet_id": "832619850551816197", "link_title": "New EPA chief\u2019s emails reveal coordination with oil interests", "relevance_score": null, "tweet_date": "2017-02-17T15:56:56"}, 
{"user_account": "senwarren", "link_id": 21655, "tweet_id": "840936736070987776", "link_title": "New York federal prosecutor Preet Bharara says he was fired by Trump administration", "relevance_score": 3096.8091561538617, "tweet_date": "2017-03-12T14:45:16"}, 
{"user_account": "senwarren", "link_id": 21655, "tweet_id": "840937548969103360", "link_title": "New York federal prosecutor Preet Bharara says he was fired by Trump administration", "relevance_score": 3090.436079230785, "tweet_date": "2017-03-12T14:48:30"}, 
{"user_account": "senwarren", "link_id": 21655, "tweet_id": "840937125336010752", "link_title": "New York federal prosecutor Preet Bharara says he was fired by Trump administration", "relevance_score": 3075.6210609157665, "tweet_date": "2017-03-12T14:46:49"}, 
{"user_account": "senwarren", "link_id": 25254, "tweet_id": "862082755282317314", "link_title": "Sessions issues sweeping new criminal charging policy", "relevance_score": 4644.522229499812, "tweet_date": "2017-05-09T23:12:00"}, 
{"user_account": "senwarren", "link_id": 25376, "tweet_id": "862778385059262464", "link_title": "Don\u2019t Take Anything Trump\u2019s Lawyers Say About His Tax Returns Seriously", "relevance_score": 4713.433141404574, "tweet_date": "2017-05-11T21:16:11"}, 
{"user_account": "senwarren", "link_id": 28251, "tweet_id": "1033483091686379520", "link_title": "Donald Trump Hasn't Scared American Companies Out Of Ditching U.S. Workers", "relevance_score": 5526.116941042102, "tweet_date": "2018-08-25T22:35:44"}, 
{"user_account": "senwarren", "link_id": 30279, "tweet_id": "1349034677705838594", "link_title": "What you need to know about coronavirus on Tuesday, January 12", "relevance_score": 5854.32905100382, "tweet_date": "2021-01-12T16:45:05"}, 
{"user_account": "senwarren", "link_id": 30501, "tweet_id": "1349034677705838594", "link_title": "First two Capitol riot defendants indicted in Washington, including man alleged to have bombs", "relevance_score": 0.0, "tweet_date": "2021-01-12T16:45:05"}, 
{"user_account": "senwarren", "link_id": 31056, "tweet_id": "1349034677705838594", "link_title": "Trump impeachment vote: Live coverage from the House of Representatives", "relevance_score": 0.0, "tweet_date": "2021-01-12T16:45:05"}, 
{"user_account": "senwarren", "link_id": 31152, "tweet_id": "1349034677705838594", "link_title": "Majority of House votes to impeach Trump for inciting deadly Capitol riot", "relevance_score": 0.0, "tweet_date": "2021-01-12T16:45:05"}, 
{"user_account": "senwarren", "link_id": 31202, "tweet_id": "1349034677705838594", "link_title": "Suspicions Build in Capitol Attack as Democrats Call Out White Supremacists in Congress", "relevance_score": 6035.784949488067, "tweet_date": "2021-01-12T16:45:05"}, 
{"user_account": "senwarren", "link_id": 31202, "tweet_id": "1349470916179275785", "link_title": "Suspicions Build in Capitol Attack as Democrats Call Out White Supremacists in Congress", "relevance_score": 5627.092538340285, "tweet_date": "2021-01-13T21:38:33"}, 
{"user_account": "senwarren", "link_id": 31732, "tweet_id": "1349470916179275785", "link_title": "Here's why McConnell does not plan to start the Senate trial before Biden is sworn in", "relevance_score": 70215.77156332575, "tweet_date": "2021-01-13T21:38:33"}, 
{"user_account": "senwarren", "link_id": 40911, "tweet_id": "1354979021377970178", "link_title": "Billionaire blasts 'Robinhood market' as Jon Stewart, others herald GameStop stock rebellion", "relevance_score": 24259.471563325755, "tweet_date": "2021-01-29T02:25:47"}, 
{"user_account": "senwarren", "link_id": 41377, "tweet_id": "1355609615724109831", "link_title": "Tax implications for investors riding the Reddit-fueled stock surges", "relevance_score": 5337.817652495226, "tweet_date": "2021-01-30T20:11:33"}, 
{"user_account": "senwarren", "link_id": 41377, "tweet_id": "1355187260514250754", "link_title": "Tax implications for investors riding the Reddit-fueled stock surges", "relevance_score": 4646.500155014331, "tweet_date": "2021-01-29T16:13:15"}, 
{"user_account": "senwarren", "link_id": 41689, "tweet_id": "1355922935576485892", "link_title": "How Biden's Oil-Lease Moratorium Will Create Jobs", "relevance_score": 5301.327441581833, "tweet_date": "2021-01-31T16:56:34"}, 
{"user_account": "senwarren", "link_id": 42694, "tweet_id": "1355922935576485892", "link_title": "Analysis: Biden faces presidency-defining dilemma over Republican offer on Covid-19 rescue plan", "relevance_score": 5309.440555977768, "tweet_date": "2021-01-31T16:56:34"}, 
{"user_account": "senwarren", "link_id": 44522, "tweet_id": "1354520785822605322", "link_title": "Sen. Elizabeth Warren asks Robinhood to explain why it restricted GameStop trades after hedge funds' losses", "relevance_score": 5523.935269579666, "tweet_date": "2021-01-27T20:04:55"}, 
{"user_account": "senwarren", "link_id": 44522, "tweet_id": "1355609615724109831", "link_title": "Sen. Elizabeth Warren asks Robinhood to explain why it restricted GameStop trades after hedge funds' losses", "relevance_score": 5373.228961119185, "tweet_date": "2021-01-30T20:11:33"}, 
{"user_account": "senwarren", "link_id": 44522, "tweet_id": "1356665516514025473", "link_title": "Sen. Elizabeth Warren asks Robinhood to explain why it restricted GameStop trades after hedge funds' losses", "relevance_score": 3538.5963318807644, "tweet_date": "2021-02-02T18:07:19"}, 
{"user_account": "senwarren", "link_id": 44522, "tweet_id": "1355187260514250754", "link_title": "Sen. Elizabeth Warren asks Robinhood to explain why it restricted GameStop trades after hedge funds' losses", "relevance_score": 2350.6834944118427, "tweet_date": "2021-01-29T16:13:15"}, 
{"user_account": "senwarren", "link_id": 46876, "tweet_id": "1356707805571543045", "link_title": "Opinion | The Senate Has Become a Dadaist Nightmare", "relevance_score": 4670.862806111309, "tweet_date": "2021-02-02T20:55:21"}, 
{"user_account": "senwarren", "link_id": 47100, "tweet_id": "1357411447068897281", "link_title": "Biden is ending support for a grinding 5-year Saudi-led military offensive in Yemen that has deepened suffering in the Arabian peninsula's poorest country. @EllenKnickmeyer reports. \n Ellen Knickmeyer EllenKnickmeyer", "relevance_score": 5322.303365835983, "tweet_date": "2021-02-04T19:31:23"}, 
{"user_account": "senwarren", "link_id": 47100, "tweet_id": "1357411447068897281", "link_title": "Biden is ending support for a grinding 5-year Saudi-led military offensive in Yemen that has deepened suffering in the Arabian peninsula's poorest country. @EllenKnickmeyer reports. \n Ellen Knickmeyer EllenKnickmeyer", "relevance_score": 5322.303365835983, "tweet_date": "2021-02-04T19:31:23"}, 
{"user_account": "senwarren", "link_id": 47495, "tweet_id": "1357406025482125313", "link_title": "BREAKING: Congressional Dems just introduced a resolution calling on Pres. Biden to cancel up to $50,000 in student debt. Thread on why this must happen. /1/", "relevance_score": 5578.163495223944, "tweet_date": "2021-02-04T19:09:50"}, 
{"user_account": "senwarren", "link_id": 52138, "tweet_id": "1358538696077803522", "link_title": "It's not a typical trial. Lawyers in the Trump impeachment case will argue big constitutional questions.", "relevance_score": 5987.939943981077, "tweet_date": "2021-02-07T22:10:40"}, 
{"user_account": "senwarren", "link_id": 52138, "tweet_id": "1358538696857968649", "link_title": "It's not a typical trial. Lawyers in the Trump impeachment case will argue big constitutional questions.", "relevance_score": 5568.36345789971, "tweet_date": "2021-02-07T22:10:40"}, 
{"user_account": "senwarren", "link_id": 52528, "tweet_id": "1359200659053101060", "link_title": "Asked if he will watch former President Trump's trial, President Biden tells us in the Oval that he has a job to do, which is getting people back to work, and the Senate has its job. \"I'm sure they're going to conduct themselves well & that's all I have to say about impeachment.\"", "relevance_score": 0.0, "tweet_date": "2021-02-09T18:01:04"}, 
{"user_account": "senwarren", "link_id": 53182, "tweet_id": "1359297278821998597", "link_title": "February 9, 2021 Trump impeachment trial news", "relevance_score": 465821.0335214625, "tweet_date": "2021-02-10T00:25:00"}, 
{"user_account": "senwarren", "link_id": 53815, "tweet_id": "1359297278821998597", "link_title": "After watching graphic video of the Capitol attack on Wednesday, many Republican senators said they were still inclined to acquit Donald Trump, denouncing the violence while also arguing that his language was similar to the rhetoric from \u201cthe other side.\u201d", "relevance_score": 5600.372257922318, "tweet_date": "2021-02-10T00:25:00"}, 
{"user_account": "senwarren", "link_id": 54203, "tweet_id": "1360707803518808068", "link_title": "February 13, 2021 Trump impeachment trial news", "relevance_score": 466687.8805508771, "tweet_date": "2021-02-13T21:49:55"}, 
{"user_account": "senwarren", "link_id": 54345, "tweet_id": "1360707803518808068", "link_title": "The 7 Republican senators who voted to convict former President Donald Trump explain their rationale", "relevance_score": 5898.081160342621, "tweet_date": "2021-02-13T21:49:55"}, 
{"user_account": "senwarren", "link_id": 55300, "tweet_id": "1360707803518808068", "link_title": "What did Trump's 2nd impeachment accomplish?", "relevance_score": 5947.771841937183, "tweet_date": "2021-02-13T21:49:55"}, 
{"user_account": "senwarren", "link_id": 55300, "tweet_id": "1360707803518808068", "link_title": "What did Trump's 2nd impeachment accomplish?", "relevance_score": 5947.771841937183, "tweet_date": "2021-02-13T21:49:55"}, 
{"user_account": "senwarren", "link_id": 57036, "tweet_id": "1362078956342693889", "link_title": "Biden at odds with Democratic leaders over lawmakers' call to cancel up to $50,000 in federal student debt", "relevance_score": 6127.714916158609, "tweet_date": "2021-02-17T16:38:24"}, 
{"user_account": "senwarren", "link_id": 60804, "tweet_id": "1364023679894622209", "link_title": "Read: Interior secretary nominee Deb Haaland's prepared remarks for her confirmation hearing", "relevance_score": 4367.362751939441, "tweet_date": "2021-02-23T01:26:02"}, 
{"user_account": "senwarren", "link_id": 70589, "tweet_id": "1368253565802864643", "link_title": "Senate passes COVID-19 plan, clearing way for nearly $2 trillion in relief", "relevance_score": 40416.97156332575, "tweet_date": "2021-03-06T17:34:05"}, 
{"user_account": "senwarren", "link_id": 70595, "tweet_id": "1368253565802864643", "link_title": "Senate narrowly passes COVID relief bill after sleepless, tumultuous night", "relevance_score": 40416.97156332575, "tweet_date": "2021-03-06T17:34:05"}, 
{"user_account": "senwarren", "link_id": 75358, "tweet_id": "1371475243777294339", "link_title": "Biden Eyes First Major Tax Hike Since 1993 in Next Economic Plan", "relevance_score": 3538.5963318807644, "tweet_date": "2021-03-15T14:55:53"}, 
{"user_account": "senwarren", "link_id": 80078, "tweet_id": "1375283617341968385", "link_title": "Amazon Is Spending the Last Week of the Union Vote Trying to Come Up With Epic Twitter Owns", "relevance_score": 232241.57156332574, "tweet_date": "2021-03-26T03:09:00"}, 
{"user_account": "senwarren", "link_id": 80078, "tweet_id": "1375189145476288513", "link_title": "Amazon Is Spending the Last Week of the Union Vote Trying to Come Up With Epic Twitter Owns", "relevance_score": 136345.37156332575, "tweet_date": "2021-03-25T20:53:36"}, 
{"user_account": "senwarren", "link_id": 80556, "tweet_id": "1376961738260774915", "link_title": "Biden's infrastructure and climate plan emerges as congressional wrangling begins", "relevance_score": 5062.448516661062, "tweet_date": "2021-03-30T18:17:15"}, 
{"user_account": "senwarren", "link_id": 81126, "tweet_id": "1376961738260774915", "link_title": "Biden Details $2 Trillion Plan to Rebuild Infrastructure and Reshape the Economy", "relevance_score": 5079.925017031664, "tweet_date": "2021-03-30T18:17:15"}, 
{"user_account": "senwarren", "link_id": 86641, "tweet_id": "1385704600733425664", "link_title": "Why Biden's statement recognizing the Armenian genocide is a big deal", "relevance_score": 0.0, "tweet_date": "2021-04-23T21:18:16"}, 
{"user_account": "senwarren", "link_id": 88164, "tweet_id": "1388553682464165891", "link_title": "More than a Million Migrants Expected at Southern Border This Year: US Official", "relevance_score": 5319.7508154866, "tweet_date": "2021-05-01T17:59:30"}, 
{"user_account": "senwarren", "link_id": 89855, "tweet_id": "1397721784837980168", "link_title": "It is with heavy hearts that we share that Eric Carle, author & illustrator of\u00a0The Very Hungry Caterpillar\u00a0and many other beloved classics,\u00a0passed away on May 23rd\u00a0at the age of 91.\n\nThank you for sharing your great talent with generations of young readers.\u00a0#RememberingEricCarle  RememberingEricCarle", "relevance_score": 390988.83548163594, "tweet_date": "2021-05-27T01:10:16"}, 
{"user_account": "senwarren", "link_id": 91024, "tweet_id": "1402377543215464458", "link_title": "Elon Musk Paid $0 in Federal Income Tax in 2018: Report", "relevance_score": 5264.264173994203, "tweet_date": "2021-06-08T21:30:35"}, 
{"user_account": "senwarren", "link_id": 91292, "tweet_id": "1403151463984111617", "link_title": "LAUSD, teachers union strike deal on COVID-19 protocols for 2021-22 year", "relevance_score": 4259.655952863836, "tweet_date": "2021-06-11T00:45:52"}, 
{"user_account": "senwarren", "link_id": 103102, "tweet_id": "1413958713602363395", "link_title": "The Billionaire Playbook: How Sports Owners Use Their Teams to Avoid Millions in Taxes", "relevance_score": 390603.3986082613, "tweet_date": "2021-07-10T20:30:02"}, 
{"user_account": "senwarren", "link_id": 105410, "tweet_id": "1418634152316919810", "link_title": "Senate Republicans Block Vote To Begin Debate On Infrastructure Bill", "relevance_score": 390804.00894330355, "tweet_date": "2021-07-23T18:08:33"}, 
{"user_account": "senwarren", "link_id": 115175, "tweet_id": "1437870416610086913", "link_title": "ROLLUP: Steph Curry & Tom Brady FTX | Crypto Regulation & SEC | Solana & Arbitrum", "relevance_score": 5138.378999310785, "tweet_date": "2021-09-14T20:06:36"}, 
{"user_account": "senwarren", "link_id": 115318, "tweet_id": "1437132655326343171", "link_title": "Elizabeth Warren Bows Out Gracefully, While Trump Spreads Dangerous Coronavirus Misinformation", "relevance_score": 3538.5963318807644, "tweet_date": "2021-09-12T19:15:00"}, 
{"user_account": "senwarren", "link_id": 115318, "tweet_id": "1435709811807690755", "link_title": "Elizabeth Warren Bows Out Gracefully, While Trump Spreads Dangerous Coronavirus Misinformation", "relevance_score": 3538.5963318807644, "tweet_date": "2021-09-08T21:01:07"}, 
{"user_account": "senwarren", "link_id": 123190, "tweet_id": "1445459185513107459", "link_title": "Janet Yellen: Would be a catastrophe if Congress doesn&#39;t raise the debt ceiling", "relevance_score": 5111.58236686276, "tweet_date": "2021-10-05T18:41:39"}, 
{"user_account": "senwarren", "link_id": 126891, "tweet_id": "1450245518584647684", "link_title": "Gay Superman Defeats Climate Change And Racism\u00a0", "relevance_score": 5195.473326473762, "tweet_date": "2021-10-18T23:40:50"}, 
{"user_account": "senwarren", "link_id": 142853, "tweet_id": "1468262366303309825", "link_title": "TRUTH IN RHYTHM Podcast - Kat Dyson (Prince, Cyndi Lauper), Part 2 of 2", "relevance_score": 5123.089834720552, "tweet_date": "2021-12-07T16:53:21"}, 
{"user_account": "senwarren", "link_id": 146139, "tweet_id": "1470415896053227522", "link_title": "Bracing for the Fed's Next Move as Retail Sales Disappoint, Elon Musk Fires Back at Sen. Warren., Plus the Omicron Variant Effect", "relevance_score": 3538.5963318807644, "tweet_date": "2021-12-13T15:30:43"}, 
{"user_account": "senwarren", "link_id": 146153, "tweet_id": "1470415896053227522", "link_title": "Elon Musk calls Elizabeth Warren 'Senator Karen' in fight over taxes", "relevance_score": 3538.5963318807644, "tweet_date": "2021-12-13T15:30:43"}, 
{"user_account": "senwarren", "link_id": 154801, "tweet_id": "1483806059802558469", "link_title": "Kyrsten Sinema's filibuster defense was obliterated before her speech began", "relevance_score": 5295.823376477572, "tweet_date": "2022-01-19T14:18:27"}, 
{"user_account": "senwarren", "link_id": 154810, "tweet_id": "1483616083076653058", "link_title": "Voting Rights", "relevance_score": 5407.723371915349, "tweet_date": "2022-01-19T01:43:33"}, 
{"user_account": "senwarren", "link_id": 154810, "tweet_id": "1482034009366482944", "link_title": "Voting Rights", "relevance_score": 5255.456958426184, "tweet_date": "2022-01-14T16:56:57"}, 
{"user_account": "senwarren", "link_id": 163474, "tweet_id": "1496890560564584449", "link_title": "Russian President Putin announces military operation in Ukraine", "relevance_score": 0.0, "tweet_date": "2022-02-24T16:51:35"}, 
{"user_account": "senwarren", "link_id": 163474, "tweet_id": "1496211402981314569", "link_title": "Russian President Putin announces military operation in Ukraine", "relevance_score": 0.0, "tweet_date": "2022-02-22T19:52:51"}, 
{"user_account": "senwarren", "link_id": 171598, "tweet_id": "1503007974092070913", "link_title": "What\u2019s driving Vladimir Putin and his assault on Ukraine?", "relevance_score": 5419.852184384825, "tweet_date": "2022-03-13T14:00:00"}, 
{"user_account": "senwarren", "link_id": 177023, "tweet_id": "1506686090824069124", "link_title": "The Confirmation Hearing of Ketanji Brown Jackson", "relevance_score": 5313.098677500613, "tweet_date": "2022-03-23T17:35:31"}, 
{"user_account": "senwarren", "link_id": 180784, "tweet_id": "1512133641664712713", "link_title": "Judge Ketanji Brown Jackson", "relevance_score": 5457.019292502058, "tweet_date": "2022-04-07T18:22:08"}, 
{"user_account": "senwarren", "link_id": 183871, "tweet_id": "1513688384069373956", "link_title": "A grande victory for Starbucks workers", "relevance_score": 5260.65219681185, "tweet_date": "2022-04-12T01:20:08"}, 
{"user_account": "senwarren", "link_id": 184400, "tweet_id": "1513688384069373956", "link_title": "Starbucks Prepares to Expand Worker Benefits That Might Exclude Unionized Staff", "relevance_score": 5257.657261315399, "tweet_date": "2022-04-12T01:20:08"}, 
{"user_account": "senwarren", "link_id": 184400, "tweet_id": "1513688384069373956", "link_title": "Starbucks Prepares to Expand Worker Benefits That Might Exclude Unionized Staff", "relevance_score": 5257.657261315399, "tweet_date": "2022-04-12T01:20:08"}, 
{"user_account": "senwarren", "link_id": 189704, "tweet_id": "1518702084048179200", "link_title": "277. Andy & DJ CTI: Elon Musk's Twitter Takeover, Pregnant Inmates In NJ & Police Shooting Ft. Tommy Vext", "relevance_score": 5979.002782433481, "tweet_date": "2022-04-25T21:22:47"}, 
{"user_account": "senwarren", "link_id": 190211, "tweet_id": "1518702084048179200", "link_title": "Five things to watch as Elon Musk acquires Twitter", "relevance_score": 6643.2302846124785, "tweet_date": "2022-04-25T21:22:47"}, 
{"user_account": "senwarren", "link_id": 191114, "tweet_id": "1518702084048179200", "link_title": "Elon Musk Buys Twitter | 4.26.22", "relevance_score": 24712.571563325757, "tweet_date": "2022-04-25T21:22:47"}, 
{"user_account": "senwarren", "link_id": 192322, "tweet_id": "1521301933897756677", "link_title": "Exclusive: Supreme Court has voted to overturn abortion rights, draft opinion shows", "relevance_score": 6092.818927132647, "tweet_date": "2022-05-03T01:33:40"}, 
{"user_account": "senwarren", "link_id": 192384, "tweet_id": "1521301933897756677", "link_title": "Who Gets Abortions in America?", "relevance_score": 5075.343129322236, "tweet_date": "2022-05-03T01:33:40"}, 
{"user_account": "senwarren", "link_id": 192506, "tweet_id": "1521301933897756677", "link_title": "Whoopi Goldberg gives fiery speech after SCOTUS leak: 'Getting an abortion is not easy'", "relevance_score": 24730.971563325755, "tweet_date": "2022-05-03T01:33:40"}, 
{"user_account": "senwarren", "link_id": 192664, "tweet_id": "1521301933897756677", "link_title": "Leaked Supreme Court Ruling Overturns Roe v. Wade | 5.3.22", "relevance_score": 6772.649989687048, "tweet_date": "2022-05-03T01:33:40"}, 
{"user_account": "senwarren", "link_id": 192664, "tweet_id": "1521529779408805890", "link_title": "Leaked Supreme Court Ruling Overturns Roe v. Wade | 5.3.22", "relevance_score": 6021.279693477163, "tweet_date": "2022-05-03T16:39:02"}, 
{"user_account": "senwarren", "link_id": 194328, "tweet_id": "1523653273600724992", "link_title": "Abortion: State by State | 5.7.22", "relevance_score": 5161.844317686679, "tweet_date": "2022-05-09T13:17:03"}, 
{"user_account": "senwarren", "link_id": 194735, "tweet_id": "1521301933897756677", "link_title": "What Gorsuch, Kavanaugh and Barrett Said About Roe at Confirmation Hearings", "relevance_score": 6795.594494373949, "tweet_date": "2022-05-03T01:33:40"}, 
{"user_account": "senwarren", "link_id": 194735, "tweet_id": "1521848215758327808", "link_title": "What Gorsuch, Kavanaugh and Barrett Said About Roe at Confirmation Hearings", "relevance_score": 5502.592422353486, "tweet_date": "2022-05-04T13:44:23"}, 
{"user_account": "senwarren", "link_id": 194887, "tweet_id": "1524116791412281347", "link_title": "How The Fight Over Abortion Will Play Out In Red States", "relevance_score": 5260.921231213068, "tweet_date": "2022-05-10T19:58:54"}, 
{"user_account": "senwarren", "link_id": 194887, "tweet_id": "1523653273600724992", "link_title": "How The Fight Over Abortion Will Play Out In Red States", "relevance_score": 5214.104049566885, "tweet_date": "2022-05-09T13:17:03"}, 
{"user_account": "senwarren", "link_id": 194887, "tweet_id": "1524488356247347200", "link_title": "How The Fight Over Abortion Will Play Out In Red States", "relevance_score": 5137.10308116616, "tweet_date": "2022-05-11T20:35:22"}, 
{"user_account": "senwarren", "link_id": 194892, "tweet_id": "1524116791412281347", "link_title": "How The Fight Over Abortion Will Play Out In Red States", "relevance_score": 5266.176051918272, "tweet_date": "2022-05-10T19:58:54"}, 
{"user_account": "senwarren", "link_id": 194892, "tweet_id": "1524488356247347200", "link_title": "How The Fight Over Abortion Will Play Out In Red States", "relevance_score": 5219.740297596863, "tweet_date": "2022-05-11T20:35:22"}, 
{"user_account": "senwarren", "link_id": 194894, "tweet_id": "1524116791412281347", "link_title": "Senate Democrats push to codify abortion rights into federal law", "relevance_score": 477338.00519384735, "tweet_date": "2022-05-10T19:58:54"}, 
{"user_account": "senwarren", "link_id": 194895, "tweet_id": "1524116791412281347", "link_title": "How The Fight Over Abortion Will Play Out In Red States", "relevance_score": 5189.072455507581, "tweet_date": "2022-05-10T19:58:54"}, 
{"user_account": "senwarren", "link_id": 194902, "tweet_id": "1524116791412281347", "link_title": "How The Fight Over Abortion Will Play Out In Red States", "relevance_score": 5259.19276982767, "tweet_date": "2022-05-10T19:58:54"}, 
{"user_account": "senwarren", "link_id": 194902, "tweet_id": "1524488356247347200", "link_title": "How The Fight Over Abortion Will Play Out In Red States", "relevance_score": 5227.932482091981, "tweet_date": "2022-05-11T20:35:22"}, 
{"user_account": "senwarren", "link_id": 194903, "tweet_id": "1521301933897756677", "link_title": "Ask PolitiFact: Is it illegal to leak a draft Supreme Court opinion?", "relevance_score": 6796.842996023672, "tweet_date": "2022-05-03T01:33:40"}, 
{"user_account": "senwarren", "link_id": 194903, "tweet_id": "1521848215758327808", "link_title": "Ask PolitiFact: Is it illegal to leak a draft Supreme Court opinion?", "relevance_score": 5503.42682177586, "tweet_date": "2022-05-04T13:44:23"}, 
{"user_account": "senwarren", "link_id": 195010, "tweet_id": "1521848215758327808", "link_title": "How The Fight Over Abortion Will Play Out In Red States", "relevance_score": 5467.183676013139, "tweet_date": "2022-05-04T13:44:23"}, 
{"user_account": "senwarren", "link_id": 195010, "tweet_id": "1524116791412281347", "link_title": "How The Fight Over Abortion Will Play Out In Red States", "relevance_score": 5332.6227740018485, "tweet_date": "2022-05-10T19:58:54"}, 
{"user_account": "senwarren", "link_id": 195952, "tweet_id": "1524420860198674432", "link_title": "Beto O'Rourke | Trump Thought China Had a \"Hurricane Gun,\" Senate Blocks Bill to Codify Roe v. Wade: A Closer Look", "relevance_score": 478006.2125786336, "tweet_date": "2022-05-11T16:07:10"}, 
{"user_account": "senwarren", "link_id": 195979, "tweet_id": "1525558567771815937", "link_title": "A Post-Roe America, Part 2: The Abortion Providers", "relevance_score": 5315.579168923235, "tweet_date": "2022-05-14T19:28:00"}, 
{"user_account": "senwarren", "link_id": 197051, "tweet_id": "1526196866400002048", "link_title": "Pro-Choice Demonstrators Turn Out by the Thousands", "relevance_score": 4669.166336179353, "tweet_date": "2022-05-16T13:44:22"}, 
{"user_account": "senwarren", "link_id": 206619, "tweet_id": "1540421395804463107", "link_title": "Roe V. Wade Overturned: Here's When States Will Start Banning Abortion\u2014And Which Already Have", "relevance_score": 5465.673717409615, "tweet_date": "2022-06-24T19:47:35"}, 
{"user_account": "senwarren", "link_id": 206626, "tweet_id": "1540421395804463107", "link_title": "Where The Anti-Abortion Movement Is Heading", "relevance_score": 5428.990408724013, "tweet_date": "2022-06-24T19:47:35"}, 
{"user_account": "senwarren", "link_id": 206633, "tweet_id": "1540700397991432193", "link_title": "Supreme Court Rules in Favor of Gun Owners, Abortion Ruling Next, Kavanaugh's Would-Be Killer Pleads Not Guilty, Airline Lies & More", "relevance_score": 0.0, "tweet_date": "2022-06-25T14:16:14"}, 
{"user_account": "senwarren", "link_id": 206633, "tweet_id": "1540421395804463107", "link_title": "Supreme Court Rules in Favor of Gun Owners, Abortion Ruling Next, Kavanaugh's Would-Be Killer Pleads Not Guilty, Airline Lies & More", "relevance_score": 0.0, "tweet_date": "2022-06-24T19:47:35"}, 
{"user_account": "senwarren", "link_id": 206670, "tweet_id": "1537856446775296001", "link_title": "Where The Anti-Abortion Movement Is Heading", "relevance_score": 5173.667547616415, "tweet_date": "2022-06-17T17:55:23"}, 
{"user_account": "senwarren", "link_id": 206878, "tweet_id": "1540421395804463107", "link_title": "Roe reversal, ending national access to abortion, makes US an ...", "relevance_score": 5447.113264141193, "tweet_date": "2022-06-24T19:47:35"}, 
{"user_account": "senwarren", "link_id": 206878, "tweet_id": "1540371780975693826", "link_title": "Roe reversal, ending national access to abortion, makes US an ...", "relevance_score": 5383.998990500747, "tweet_date": "2022-06-24T16:30:25"}, 
{"user_account": "senwarren", "link_id": 207377, "tweet_id": "1541896502976679937", "link_title": "Biden's Health Secretary: 'No Magic Bullet' for Preserving Abortion Access", "relevance_score": 5240.925888936643, "tweet_date": "2022-06-28T21:29:08"}, 
{"user_account": "senwarren", "link_id": 211332, "tweet_id": "1548764932824596481", "link_title": "Zeldin supported bill with narrow exceptions", "relevance_score": 3545.0963318807644, "tweet_date": "2022-07-17T20:21:49"}, 
{"user_account": "senwarren", "link_id": 211338, "tweet_id": "1548764932824596481", "link_title": "Record Inflation & House Abortion Bills | 7.14.22", "relevance_score": 5129.36465947833, "tweet_date": "2022-07-17T20:21:49"}, 
{"user_account": "senwarren", "link_id": 213890, "tweet_id": "1552650590047444994", "link_title": "Pay growth and prices picked up, keeping the Fed on track for rate increases.", "relevance_score": 5291.8327051299675, "tweet_date": "2022-07-28T13:42:02"}, 
{"user_account": "senwarren", "link_id": 217147, "tweet_id": "1556359510972719104", "link_title": "Senate hopes to vote on $700 billion climate change, inflation bill before recess", "relevance_score": 483125.986537422, "tweet_date": "2022-08-07T19:19:57"}, 
{"user_account": "senwarren", "link_id": 217176, "tweet_id": "1556359510972719104", "link_title": "Five Decades in the Making: Why It Took Congress So Long to Act on Climate", "relevance_score": 483113.59751291684, "tweet_date": "2022-08-07T19:19:57"}, 
{"user_account": "senwarren", "link_id": 226186, "tweet_id": "1562464759294767111", "link_title": "President Joe Biden expected to announce student loan forgiveness", "relevance_score": 5415.177011191295, "tweet_date": "2022-08-24T15:40:02"}, 
{"user_account": "senwarren", "link_id": 226186, "tweet_id": "1562464769176915968", "link_title": "President Joe Biden expected to announce student loan forgiveness", "relevance_score": 5152.739857784303, "tweet_date": "2022-08-24T15:40:04"}, 
{"user_account": "senwarren", "link_id": 226347, "tweet_id": "1562490835039834112", "link_title": "President Joe Biden expected to announce student loan forgiveness", "relevance_score": 5165.30167156126, "tweet_date": "2022-08-24T17:23:39"}, 
{"user_account": "senwarren", "link_id": 226672, "tweet_id": "1562490835039834112", "link_title": "Biden just forgave $10,000 in student loan debt. Elizabeth Warren calls it 'one of the biggest acts of consumer debt relief in American history,' while Mitch McConnell calls it 'socialism'", "relevance_score": 3538.5963318807644, "tweet_date": "2022-08-24T17:23:39"}, 
{"user_account": "senwarren", "link_id": 226672, "tweet_id": "1562225142712786944", "link_title": "Biden just forgave $10,000 in student loan debt. Elizabeth Warren calls it 'one of the biggest acts of consumer debt relief in American history,' while Mitch McConnell calls it 'socialism'", "relevance_score": 3538.5963318807644, "tweet_date": "2022-08-23T23:47:53"}, 
{"user_account": "senwarren", "link_id": 226672, "tweet_id": "1562464759294767111", "link_title": "Biden just forgave $10,000 in student loan debt. Elizabeth Warren calls it 'one of the biggest acts of consumer debt relief in American history,' while Mitch McConnell calls it 'socialism'", "relevance_score": 160.12707182320443, "tweet_date": "2022-08-24T15:40:02"}, 
{"user_account": "senwarren", "link_id": 226672, "tweet_id": "1562553780335525888", "link_title": "Biden just forgave $10,000 in student loan debt. Elizabeth Warren calls it 'one of the biggest acts of consumer debt relief in American history,' while Mitch McConnell calls it 'socialism'", "relevance_score": 52.891304347826086, "tweet_date": "2022-08-24T21:33:46"}, 
{"user_account": "senwarren", "link_id": 226672, "tweet_id": "1562464761379319810", "link_title": "Biden just forgave $10,000 in student loan debt. Elizabeth Warren calls it 'one of the biggest acts of consumer debt relief in American history,' while Mitch McConnell calls it 'socialism'", "relevance_score": 9.944444444444445, "tweet_date": "2022-08-24T15:40:02"}, 
{"user_account": "senwarren", "link_id": 226672, "tweet_id": "1562464769176915968", "link_title": "Biden just forgave $10,000 in student loan debt. Elizabeth Warren calls it 'one of the biggest acts of consumer debt relief in American history,' while Mitch McConnell calls it 'socialism'", "relevance_score": 8.851063829787234, "tweet_date": "2022-08-24T15:40:04"}, 
{"user_account": "senwarren", "link_id": 226672, "tweet_id": "1562528649500573697", "link_title": "Biden just forgave $10,000 in student loan debt. Elizabeth Warren calls it 'one of the biggest acts of consumer debt relief in American history,' while Mitch McConnell calls it 'socialism'", "relevance_score": 4.0, "tweet_date": "2022-08-24T19:53:55"}, 
{"user_account": "senwarren", "link_id": 226672, "tweet_id": "1562464765494308864", "link_title": "Biden just forgave $10,000 in student loan debt. Elizabeth Warren calls it 'one of the biggest acts of consumer debt relief in American history,' while Mitch McConnell calls it 'socialism'", "relevance_score": 4.454545454545455, "tweet_date": "2022-08-24T15:40:03"}, 
{"user_account": "senwarren", "link_id": 226672, "tweet_id": "1561453038967013376", "link_title": "Biden just forgave $10,000 in student loan debt. Elizabeth Warren calls it 'one of the biggest acts of consumer debt relief in American history,' while Mitch McConnell calls it 'socialism'", "relevance_score": 4.0, "tweet_date": "2022-08-21T20:39:49"}, 
{"user_account": "senwarren", "link_id": 226672, "tweet_id": "1562074892983566336", "link_title": "Biden just forgave $10,000 in student loan debt. Elizabeth Warren calls it 'one of the biggest acts of consumer debt relief in American history,' while Mitch McConnell calls it 'socialism'", "relevance_score": 2.0, "tweet_date": "2022-08-23T13:50:51"}, 
{"user_account": "senwarren", "link_id": 226672, "tweet_id": "1561803788046012418", "link_title": "Biden just forgave $10,000 in student loan debt. Elizabeth Warren calls it 'one of the biggest acts of consumer debt relief in American history,' while Mitch McConnell calls it 'socialism'", "relevance_score": 1.0, "tweet_date": "2022-08-22T19:53:34"}, 
{"user_account": "senwarren", "link_id": 226679, "tweet_id": "1562490835039834112", "link_title": "Joe Biden announces $10,000 in student loan forgiveness: full video", "relevance_score": 5192.035074202092, "tweet_date": "2022-08-24T17:23:39"}, 
{"user_account": "senwarren", "link_id": 227146, "tweet_id": "1562490835039834112", "link_title": "Biden announces student loan forgiveness plan l GMA", "relevance_score": 5201.182618339216, "tweet_date": "2022-08-24T17:23:39"}, 
{"user_account": "senwarren", "link_id": 227146, "tweet_id": "1562464759294767111", "link_title": "Biden announces student loan forgiveness plan l GMA", "relevance_score": 3538.5963318807644, "tweet_date": "2022-08-24T15:40:02"}, 
{"user_account": "senwarren", "link_id": 227933, "tweet_id": "1562490835039834112", "link_title": "Joe Biden announces $10,000 in student loan forgiveness: full video", "relevance_score": 5197.411700609548, "tweet_date": "2022-08-24T17:23:39"}, 
{"user_account": "senwarren", "link_id": 242609, "tweet_id": "1570421266754015234", "link_title": "50 migrants relocated to Martha&#39;s Vineyard by Florida Governor Ron DeSantis", "relevance_score": 3538.5963318807644, "tweet_date": "2022-09-15T14:36:21"}, 
{"user_account": "senwarren", "link_id": 247236, "tweet_id": "1572659264560435201", "link_title": "Federal Reserve hikes key interest rate again", "relevance_score": 5354.075576603159, "tweet_date": "2022-09-21T18:49:21"}, 
{"user_account": "senwarren", "link_id": 249507, "tweet_id": "1572659264560435201", "link_title": "Amid High Inflation, Fed Chairman Jerome Powell Announces a 0.75 Percent Rate Rise | WSJ", "relevance_score": 25016.171563325755, "tweet_date": "2022-09-21T18:49:21"}, 
{"user_account": "senwarren", "link_id": 249507, "tweet_id": "1574081781887803392", "link_title": "Amid High Inflation, Fed Chairman Jerome Powell Announces a 0.75 Percent Rate Rise | WSJ", "relevance_score": 25016.171563325755, "tweet_date": "2022-09-25T17:01:56"}, 
{"user_account": "senwarren", "link_id": 249507, "tweet_id": "1571257180187156481", "link_title": "Amid High Inflation, Fed Chairman Jerome Powell Announces a 0.75 Percent Rate Rise | WSJ", "relevance_score": 4254.718723626081, "tweet_date": "2022-09-17T21:57:58"}, 
{"user_account": "senwarren", "link_id": 259624, "tweet_id": "1583954059463360513", "link_title": "Fact check: False claim about criminal penalties for Alabama abortions", "relevance_score": 4029.4337335928444, "tweet_date": "2022-10-22T22:50:50"}, 
{"user_account": "senwarren", "link_id": 259751, "tweet_id": "1583548679532969984", "link_title": "Court temporarily blocks Biden&#39;s student loan forgiveness", "relevance_score": 5116.4578159948915, "tweet_date": "2022-10-21T20:00:00"}, 
{"user_account": "senwarren", "link_id": 259751, "tweet_id": "1584988582166822915", "link_title": "Court temporarily blocks Biden&#39;s student loan forgiveness", "relevance_score": 4309.168483235331, "tweet_date": "2022-10-25T19:21:40"}, 
{"user_account": "senwarren", "link_id": 263399, "tweet_id": "1585632551015960576", "link_title": "Food Prices Soar, and So Do Companies' Profits", "relevance_score": 3539.5963318807644, "tweet_date": "2022-10-27T14:00:34"}, 
{"user_account": "senwarren", "link_id": 270207, "tweet_id": "1589656819299123200", "link_title": "Texas judge blocks Biden student loan forgiveness plan", "relevance_score": 5290.420700889181, "tweet_date": "2022-11-07T16:31:34"}, 
{"user_account": "senwarren", "link_id": 270371, "tweet_id": "1590496981751058432", "link_title": "FTX Group begins voluntary Chapter 11 bankruptcy proceedings", "relevance_score": 41106.97156332575, "tweet_date": "2022-11-10T00:10:05"}, 
{"user_account": "senwarren", "link_id": 270371, "tweet_id": "1591139694666215424", "link_title": "FTX Group begins voluntary Chapter 11 bankruptcy proceedings", "relevance_score": 5192.9520181662865, "tweet_date": "2022-11-11T18:43:59"}, 
{"user_account": "senwarren", "link_id": 270975, "tweet_id": "1591552236571996160", "link_title": "CFPB: 'Pig butchering' and other frauds are the top crypto complaint", "relevance_score": 4398.844318779979, "tweet_date": "2022-11-12T22:03:17"}, 
{"user_account": "senwarren", "link_id": 271626, "tweet_id": "1592181918539317250", "link_title": "'They got nothin': Elizabeth Warren torches Republicans for fighting against student debt relief", "relevance_score": 3539.5963318807644, "tweet_date": "2022-11-14T15:45:25"}, 
{"user_account": "senwarren", "link_id": 271626, "tweet_id": "1590889510510166018", "link_title": "'They got nothin': Elizabeth Warren torches Republicans for fighting against student debt relief", "relevance_score": 3539.5963318807644, "tweet_date": "2022-11-11T02:09:51"}, 
{"user_account": "senwarren", "link_id": 271626, "tweet_id": "1589656819299123200", "link_title": "'They got nothin': Elizabeth Warren torches Republicans for fighting against student debt relief", "relevance_score": 3538.5963318807644, "tweet_date": "2022-11-07T16:31:34"}, 
{"user_account": "senwarren", "link_id": 277080, "tweet_id": "1594459550618353664", "link_title": "Herschel Walker backs efforts that further his goal of banning abortion", "relevance_score": 5133.498517001421, "tweet_date": "2022-11-20T22:35:55"}, 
{"user_account": "senwarren", "link_id": 287284, "tweet_id": "1600943443408457730", "link_title": "Lina Khan, Aiming to Block Microsoft's Activision Deal, Faces a Challenge", "relevance_score": 3539.5963318807644, "tweet_date": "2022-12-08T20:00:35"}, 
{"user_account": "senwarren", "link_id": 288756, "tweet_id": "1602478534693457922", "link_title": "Live updates: Sam Bankman-Fried, FTX founder, charged with fraud", "relevance_score": 5247.453691685187, "tweet_date": "2022-12-13T01:40:29"}, 
{"user_account": "senwarren", "link_id": 289311, "tweet_id": "1603082087485308930", "link_title": "Club Q Survivors Testify Before Congress, Press Lawmakers To Do More", "relevance_score": 5177.241260580954, "tweet_date": "2022-12-14T17:38:48"}, 
{"user_account": "senwarren", "link_id": 292176, "tweet_id": "1605021655213957124", "link_title": null, "relevance_score": 421.4407882505787, "tweet_date": "2022-12-20T02:05:57"}]}