(() => {
  chrome.runtime.onMessage.addListener(function (request) {
    removePresets();
    chrome.storage.sync.get(["presets"], function (result) {
      if (result.presets === undefined) {
        // Set default value for presets key
        chrome.storage.sync.set({ presets: [] });
      }
    });
    if (request.url === "https://chat.openai.com/chat") {
      const textarea = document.querySelector("textarea");
      addContainers(textarea);
    } else {
      var observer = new MutationObserver(function (mutations) {
        const textarea = document.querySelector("textarea");

        if (textarea) {
          addContainers(textarea);
          observer.disconnect(); // to stop observing the dom
        }
        document.addEventListener("click", () => {
          observer.disconnect(); // to stop observing the dom
        });
      });

      observer.observe(document, {
        childList: true,
        subtree: true, // needed if the node you're targeting is not the direct parent
      });
    }
  });

  function createEditElement(span) {
    const editButton = document.createElement("button");
    editButton.classList.add("chat-presets__button-edit");
    editButton.type = "button";
    editButton.innerHTML = `
    <svg
        stroke="black"
        fill="none"
        stroke-width="2"
        viewBox="0 0 24 24"
        stroke-linecap="round"
        stroke-linejoin="round"
        height="1em"
        width="1em"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M12 20h9"></path>
        <path
          d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"
        ></path>
      </svg>
    `;
    editButton.onclick = () => {
      span.contentEditable = "true";
      span.focus();
    };
    return editButton;
  }

  function createDeleteElement(button, span) {
    const editButton = document.createElement("button");
    editButton.classList.add("chat-presets__button-delete");
    editButton.type = "button";
    editButton.innerHTML = `
    <svg
      stroke="black"
      fill="none"
      stroke-width="2"
      viewBox="0 0 24 24"
      stroke-linecap="round"
      stroke-linejoin="round"
      height="1em"
      width="1em"
      xmlns="http://www.w3.org/2000/svg"
    >
      <polyline points="3 6 5 6 21 6"></polyline>
      <path
        d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
      ></path>
      <line x1="10" y1="11" x2="10" y2="17"></line>
      <line x1="14" y1="11" x2="14" y2="17"></line>
    </svg>
    `;
    editButton.onclick = () => {
      button.remove();
      removeFromStorage(span.dataset.id);
    };
    return editButton;
  }

  function createButtonElement(title, text, textarea, id) {
    const button = document.createElement("button");
    button.classList.add("chat-presets__preset-button");
    button.type = "button";
    const titleSpan = document.createElement("span");
    titleSpan.innerHTML = title;
    titleSpan.contentEditable = "false";
    titleSpan.dataset.id = id;

    const editButton = createEditElement(titleSpan);
    const deleteButton = createDeleteElement(button, titleSpan);

    button.append(titleSpan);
    button.append(editButton);
    button.append(deleteButton);

    titleSpan.onclick = () => {
      if (titleSpan.contentEditable === "false") {
        textarea.value = text + "\n" + textarea.value;
        textarea.style.height = `${Number(textarea.style.height.replace("px", "")) + 24
          }px`;
        textarea.focus();
      }
    };
    titleSpan.onblur = () => {
      titleSpan.contentEditable = "false";
      editStorage(titleSpan.innerHTML, titleSpan.dataset.id, textarea);
    };
    return button;
  }

  function createAddElement(textarea) {
    const button = document.createElement("button");
    button.type = "button";
    button.innerHTML = "Add preset";
    button.classList.add("chat-presets__add-button");
    button.onclick = () => {
      if (textarea.value) {
        createPresetFromTextArea(textarea);
      } else {
        textarea.focus();
      }
    };
    return button;
  }

  function createPresetFromTextArea(textarea) {
    const text = textarea.value;
    const title = "New preset";
    const id = Math.floor(Math.random() * 100) + 1;
    saveToStorage(title, text, id);


    chrome.storage.sync.get(["presets"], function ({ presets }) {
      addElementsFromStorage([...presets, { title, text, id }], textarea)
      let fixedPresets = [];
      if (presets) {
        fixedPresets = [...presets];
      }
    });

    // const newButtonElement = createButtonElement(title, text, textarea, id);
    // document
    //   .querySelector(".chat-presets__presets-container")
    //   .append(newButtonElement);
  }

  function orderPresets(presets) {
    return presets.sort((a, b) => a.title.toLowerCase().localeCompare(b.title.toLowerCase()));
  }


  function addElementsFromStorage(presets, textarea) {
    document.querySelector(".chat-presets__presets-container").innerHTML = "";
    let ordered = orderPresets(presets);
    ordered.forEach((button, i) => {
      const newButtonElement = createButtonElement(
        button.title,
        button.text,
        textarea,
        button.id
      );
      document
        .querySelector(".chat-presets__presets-container")
        .append(newButtonElement);
    });

    if (!document.querySelector('.chat-presets__add-button')) {
      const addButton = createAddElement(textarea);
      document.querySelector(".chat-presets__add-container").append(addButton);
    }
  }

  function addContainers(textarea) {
    const chatPresetsElement = document.createElement("div");
    const addContainerElement = document.createElement("div");
    const presetsContainerElement = document.createElement("div");

    chatPresetsElement.style.overflow = "auto"
    chatPresetsElement.style.height = "100px"
    presetsContainerElement.style.marginBottom = "20px"

    chatPresetsElement.classList.add("chat-presets");
    addContainerElement.classList.add("chat-presets__add-container");
    presetsContainerElement.classList.add("chat-presets__presets-container");

    chatPresetsElement.append(presetsContainerElement);
    chatPresetsElement.append(addContainerElement);
    textarea.parentElement.parentElement.parentElement.parentElement.style.position =
      "relative";
    textarea.parentElement.parentElement.parentElement.parentElement.append(
      chatPresetsElement
    );

    chrome.storage.sync.get(["presets"], function ({ presets }) {
      let fixedPresets = [];
      if (presets) {
        fixedPresets = [...presets];
      }
      addElementsFromStorage(fixedPresets, textarea);
    });
  }

  function removePresets() {
    document.querySelector(".chat-presets")?.remove();
  }

  function saveToStorage(title, text, id) {
    chrome.storage.sync.get(["presets"], function ({ presets }) {
      let newPresets = [];
      if (presets) {
        newPresets = [...presets];
      }

      newPresets.push({ title: title, text: text, id: id });
      chrome.storage.sync.set({ presets: newPresets }, function () { });
    });
  }

  function removeFromStorage(id) {
    chrome.storage.sync.get(["presets"], function ({ presets }) {
      const newPresets = presets.filter((preset) => {
        return preset.id != id;
      });

      chrome.storage.sync.set({ presets: newPresets }, function () { });
    });
  }
  function editStorage(newTitle, id, textarea) {
    chrome.storage.sync.get(["presets"], function ({ presets }) {
      let newPresets = presets;
      presetIndex = newPresets.findIndex((preset) => preset.id == id);
      newPresets[presetIndex].title = newTitle;
      addElementsFromStorage(newPresets, textarea)
      chrome.storage.sync.set({ presets: newPresets }, function () { });
    });
  }
})();
