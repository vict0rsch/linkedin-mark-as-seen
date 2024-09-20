const getPeopleEls = () => {
    return [...document.querySelectorAll(".reusable-search__result-container")];
};

const getImDiv = (li) => {
    return li.querySelector(".entity-result__universal-image");
};

const getName = (li) => {
    return li
        .querySelector(".entity-result__title-text span")
        .innerText.split("\n")[0];
};

const lightgreen = "rgb(187, 245, 187)";
const lightyellow = "rgb(243, 243, 183)";

const recordButton = (imDiv, name) => {
    imDiv.style.position = "relative";
    const button = document.createElement("button");
    button.innerText = "+";
    button.style.position = "absolute";
    button.style.bottom = "0px";
    button.style.left = "0px";
    button.style.width = "100%";
    button.style.background = lightgreen;
    button.style.color = "black";
    button.style.border = "none";
    button.style.padding = "5px";
    button.style.fontSize = "12px";
    button.style.cursor = "pointer";
    button.style.borderRadius = "4px";
    button.classList.add("lmas-record-button");
    button.addEventListener("click", async () => {
        const state = await getState();
        if (!state.projects[state.active].known[name]) {
            state.projects[state.active].known[name] = {};
        }
        state.projects[state.active].known[name].status = "recorded";
        await setState(state);
        imDiv.parentElement.style.background = lightgreen;
        button.remove();
        console.info("Recorded " + name);
    });
    return button;
};

const addRecordButtons = (names, imDivs, activeProject) => {
    for (const k in imDivs) {
        if (!imDivs.hasOwnProperty(k)) continue;
        if (activeProject.known[names[k]]) continue;
        const imDiv = imDivs[k];
        const name = names[k];
        const button = recordButton(imDiv, name);
        imDiv.appendChild(button);
    }
};

const addRecordAll = (names, lis) => {
    const dividers = document.querySelectorAll(".entity-result__divider");
    const divider = dividers[dividers.length - 1];
    const button = document.createElement("button");
    button.innerText = "Record All";
    button.style.position = "absolute";
    button.style.bottom = "0px";
    button.style.left = "0px";
    button.style.width = "100%";
    button.style.background = lightgreen;
    button.style.color = "black";
    button.style.border = "none";
    button.style.padding = "5px";
    button.style.fontSize = "12px";
    button.style.cursor = "pointer";
    button.style.borderRadius = "4px";
    button.classList.add("lmas-record-button");
    button.id = "lmas-record-all";
    button.addEventListener("click", async () => {
        const state = await getState();
        let k = 0;
        for (const name of names) {
            if (!state.projects[state.active].known[name]) {
                state.projects[state.active].known[name] = {};
            }
            state.projects[state.active].known[name].status = "recorded";
            lis[k].style.background = lightgreen;
            k++;
        }
        await setState(state);
        console.info("Recorded All.");
        document
            .querySelectorAll(".lmas-record-button")
            .forEach((b) => b.remove());
    });
    divider.insertAdjacentElement("beforebegin", button);
};

// Main
(async () => {
    const state = await getState();
    if (!state.active) return;
    const activeProject = state.projects[state.active];

    let allPeople = new Set();
    const projects = Object.values(state.projects);
    for (const p of projects) {
        const ppl = new Set(Object.keys(p.known));
        allPeople = new Set([...allPeople, ...ppl]);
    }

    let peopleEls = null;

    while (!peopleEls || !getPeopleEls().length) {
        await sleep(100);
        peopleEls = getPeopleEls();
    }
    const imDivs = peopleEls.map(getImDiv);
    const names = peopleEls.map(getName);

    let n = 0;
    let unknowns = false;
    for (const name of names) {
        if (activeProject.known[name]) {
            console.log("I know " + name);
            if (activeProject.known[name].status === "recorded") {
                peopleEls[n].style.background = lightgreen;
            }
        } else {
            unknowns = true;
            if (allPeople.has(name)) {
                peopleEls[n].style.background = lightyellow;
            }
        }
        n++;
    }
    addRecordButtons(names, imDivs, activeProject);
    unknowns && addRecordAll(names, peopleEls);
    setState(state);
})();
