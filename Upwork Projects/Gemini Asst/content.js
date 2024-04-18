// sending a message
// chrome.runtime.sendMessage({greeting: "hello"}, function(response) {
//     console.log(response.farewell);
// });

// #app-root > side-navigation-v2 > bard-sidenav-container > bard-sidenav-content > div > main > div.content-container.ng-tns-c1097586666-0 > chat-window > div.chat-container.ng-tns-c1234278934-1.ui-v2-enabled.ng-star-inserted.at-least-desktop-small > div.bottom-container.ng-tns-c1234278934-1.ui-v2-enabled.ng-star-inserted > div.input-area-container.ng-tns-c1234278934-1.ng-star-inserted > input-area-v2 > div > div > div.text-input-field_textarea-wrapper.ng-tns-c3265487382-3 > div > div > rich-textarea > div.ql-editor.ql-blank.ui-v2-enabled.textarea

chrome.runtime.onMessage.addListener((obj, sender, response) => {
    if (obj.message === "HOME_PAGE") {
        const input_box = document.querySelector('#app-root > side-navigation-v2 > bard-sidenav-container > bard-sidenav-content > div > main > div.content-container.ng-tns-c1097586666-0 > chat-window > div.chat-container.ng-tns-c1234278934-1.ui-v2-enabled.ng-star-inserted.at-least-desktop-small > div.bottom-container.ng-tns-c1234278934-1.ui-v2-enabled.ng-star-inserted > div.input-area-container.ng-tns-c1234278934-1.ng-star-inserted > input-area-v2 > div > div > div.text-input-field_textarea-wrapper.ng-tns-c3265487382-3 > div > div > rich-textarea > div.ql-editor.ql-blank.ui-v2-enabled.textarea')
        input_box.innerHTML = 'Ready to send any prompt? See the injected prompts firstly'
        const prompts_container = document.querySelector('#chat-history > infinite-scroller > div > zero-state-v2 > div > div')
        prompts_container.innerHTML = `
        <prompt-suggestion-card-v2 _ngcontent-ng-c3860784626=""
        class="suggestion-card ng-tns-c3860784626-2 ng-star-inserted" _nghost-ng-c3608827064="" style="">
            <div _ngcontent-ng-c3608827064="" role="button" tabindex="0" class="prompt-container">
                <p _ngcontent-ng-c3608827064="" class="prompt-text-content">This is a prompt injected to the page using the Chrome Extension</p><!---->
                <div _ngcontent-ng-c3608827064="" class="prompt-icon-container ng-star-inserted"><!----><mat-icon
                        _ngcontent-ng-c3608827064="" role="img"
                        class="mat-icon notranslate google-symbols mat-icon-no-color ng-star-inserted" aria-hidden="true"
                        data-mat-icon-type="font">draw</mat-icon><!----><!----></div><!---->
            </div>
        </prompt-suggestion-card-v2>
        <prompt-suggestion-card-v2 _ngcontent-ng-c3860784626=""
        class="suggestion-card ng-tns-c3860784626-2 ng-star-inserted" _nghost-ng-c3608827064="" style="">
            <div _ngcontent-ng-c3608827064="" role="button" tabindex="0" class="prompt-container">
                <p _ngcontent-ng-c3608827064="" class="prompt-text-content">This is a prompt injected to the page using the Chrome Extension</p><!---->
                <div _ngcontent-ng-c3608827064="" class="prompt-icon-container ng-star-inserted"><!----><mat-icon
                        _ngcontent-ng-c3608827064="" role="img"
                        class="mat-icon notranslate google-symbols mat-icon-no-color ng-star-inserted" aria-hidden="true"
                        data-mat-icon-type="font">draw</mat-icon><!----><!----></div><!---->
            </div>
        </prompt-suggestion-card-v2>
        <prompt-suggestion-card-v2 _ngcontent-ng-c3860784626=""
        class="suggestion-card ng-tns-c3860784626-2 ng-star-inserted" _nghost-ng-c3608827064="" style="">
            <div _ngcontent-ng-c3608827064="" role="button" tabindex="0" class="prompt-container">
                <p _ngcontent-ng-c3608827064="" class="prompt-text-content">This is a prompt injected to the page using the Chrome Extension</p><!---->
                <div _ngcontent-ng-c3608827064="" class="prompt-icon-container ng-star-inserted"><!----><mat-icon
                        _ngcontent-ng-c3608827064="" role="img"
                        class="mat-icon notranslate google-symbols mat-icon-no-color ng-star-inserted" aria-hidden="true"
                        data-mat-icon-type="font">draw</mat-icon><!----><!----></div><!---->
            </div>
        </prompt-suggestion-card-v2>
        <prompt-suggestion-card-v2 _ngcontent-ng-c3860784626=""
        class="suggestion-card ng-tns-c3860784626-2 ng-star-inserted" _nghost-ng-c3608827064="" style="">
            <div _ngcontent-ng-c3608827064="" role="button" tabindex="0" class="prompt-container">
                <p _ngcontent-ng-c3608827064="" class="prompt-text-content">This is a prompt injected to the page using the Chrome Extension</p><!---->
                <div _ngcontent-ng-c3608827064="" class="prompt-icon-container ng-star-inserted"><!----><mat-icon
                        _ngcontent-ng-c3608827064="" role="img"
                        class="mat-icon notranslate google-symbols mat-icon-no-color ng-star-inserted" aria-hidden="true"
                        data-mat-icon-type="font">draw</mat-icon><!----><!----></div><!---->
            </div>
        </prompt-suggestion-card-v2>
        `
    }
})

