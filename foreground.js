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

const getId = (li) => {
    const aEl = [...li.querySelectorAll("a")].find(
        (a) => a.innerText.split("\n")[0] === getName(li)
    );
    return aEl.href.split(aEl.search)[0].split("/").reverse()[0];
};

const lightgreen = "rgb(187, 245, 187)";
const lightgreener = "rgb(147, 245, 147)";
const lightyellow = "rgb(243, 243, 183)";

const recordButton = (name, id, imDiv) => {
    imDiv.style.position = "relative";
    addCSS(`
    .lmas-record-button{
        width: 100%;
        background: linear-gradient(120deg, #17bdaf, #0574a3);
        color: white;
        border: none;
        padding: 5px;
        font-size: 12px;
        cursor: pointer;
        border-radius: 4px;
        transition: all ease 0.2s;
        height: 30px;
        margin-top: 8px
    }
    .lmas-record-button:hover{
        background: linear-gradient(120deg, #57fdcf, #35a4d3);
    }
    `);
    const button = document.createElement("button");
    button.innerText = "+";
    button.classList.add("lmas-record-button");
    button.title = `Record ${name} (${id}) in the active LMAS project.`;
    button.addEventListener("click", async () => {
        const state = await getState();
        if (!state.projects[state.active].known[id]) {
            state.projects[state.active].known[id] = { name };
        }
        state.projects[state.active].known[id].status = "recorded";
        await setState(state);
        imDiv.parentElement.style.background = lightgreen;
        button.remove();
        console.info(`Recorded ${name} (${id})`);
    });
    return button;
};

const addRecordButtons = (names, ids, imDivs, activeProject) => {
    for (const k in imDivs) {
        if (!imDivs.hasOwnProperty(k)) continue;
        if (activeProject.known[ids[k]]) continue;
        const imDiv = imDivs[k];
        const name = names[k];
        const id = ids[k];
        const button = recordButton(name, id, imDiv);
        imDiv.appendChild(button);
    }
};

const addRecordAll = (names, ids, lis) => {
    const ul = document.querySelector("ul.reusable-search__entity-result-list");
    const button = document.createElement("button");
    button.innerText = "Record All";
    addCSS(`
    #lmas-record-all{
        bottom: 0px;
        left: 0px;
        width: 30%;
        min-width: 100px;
        background: linear-gradient(120deg, #17bdaf, #0574a3);
        color: white;
        border: none;
        padding: 5px;
        font-size: 12px;
        cursor: pointer;
        border-radius: 4px;
        transition: all ease 0.2s;
        margin-top: 10px;
        margin-bottom: 15px;
    }
    #lmas-record-all:hover{
        background: linear-gradient(120deg, #57fdcf, #35a4d3);
    }
    `);
    button.id = "lmas-record-all";
    button.addEventListener("click", async () => {
        const state = await getState();
        let k = 0;
        for (const name of names) {
            const id = ids[k];
            if (!state.projects[state.active].known[id]) {
                state.projects[state.active].known[id] = { name };
            }
            state.projects[state.active].known[id].status = "recorded";
            lis[k].style.background = lightgreen;
            k++;
        }
        await setState(state);
        console.info("Recorded All.");
        document
            .querySelectorAll(".lmas-record-button")
            .forEach((b) => b.remove());
    });
    const div = document.createElement("div");
    div.style.display = "flex";
    div.style.justifyContent = "center";
    div.appendChild(button);
    ul.parentElement.insertAdjacentElement("afterend", div);
};

const main = async () => {
    const state = await getState();
    if (!state.active) {
        console.info("No active project. Stopping.");
        return;
    }
    const activeProject = state.projects[state.active];

    let allPeople = new Set();
    const projects = Object.values(state.projects);
    for (const p of projects) {
        const ppl = new Set(Object.keys(p.known));
        allPeople = new Set([...allPeople, ...ppl]);
    }

    let peopleEls = getPeopleEls();
    if (!peopleEls || !peopleEls.length) {
        setTimeout(main, 100);
    } else {
        const imDivs = peopleEls.map(getImDiv);
        const names = peopleEls.map(getName);
        const ids = peopleEls.map(getId);

        let k = 0;
        let unknowns = false;
        for (const id of ids) {
            if (activeProject.known[id]) {
                console.log("I know " + names[k]);
                if (activeProject.known[id].status === "recorded") {
                    peopleEls[k].style.background = lightgreen;
                }
            } else {
                unknowns = true;
                if (allPeople.has(id)) {
                    peopleEls[k].style.background = lightyellow;
                }
            }
            k++;
        }
        addRecordButtons(names, ids, imDivs, activeProject);
        unknowns && addRecordAll(names, ids, peopleEls);
        setState(state);
    }
};
// Main
(async () => {
    main();
})();
