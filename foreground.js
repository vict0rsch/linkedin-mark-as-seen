const getPeopleEls = () => {
    return [
        ...document
            .querySelector(".search-results-container ul[role='list']")
            .querySelectorAll("li"),
    ];
};

const getPersonDivs = (li) =>
    [
        ...li.querySelector("div").querySelector("div").querySelector("div")
            .childNodes,
    ].filter((e) => e.nodeName.toLowerCase().includes("div"));

const getImDiv = (li) => getPersonDivs(li)[0];

const getName = (li) =>
    getPersonDivs(li)[1].querySelector("span").innerText.split("\n")[0] || "";

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
    .limas-record-button{
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
    .limas-record-button:hover{
        background: linear-gradient(120deg, #57fdcf, #35a4d3);
    }
    `);
    const button = document.createElement("button");
    button.innerText = "+";
    button.classList.add("limas-record-button");
    button.title = `Record ${name} (${id}) in the active limas project.`;
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

const makePplToProjects = (state) => {
    const ppl = {};
    for (const p in state.projects) {
        for (const id in state.projects[p].known) {
            if (!ppl[id]) ppl[id] = [];
            ppl[id].push(p);
        }
    }
    return ppl;
};

const addProjects = (pplToProjects, ids, pplEls) => {
    document
        .querySelectorAll(".limas-project-list")
        .forEach((el) => el.remove());
    for (const k in pplEls) {
        const pplEl = pplEls[k];
        const id = ids[k];
        const projects = pplToProjects[id];
        console.log("projects :", projects);
        if (!projects) continue;
        const template = `
            <div class="limas-project-list">
                <strong>limas Projects</strong>
                <br/>
                ${projects
                    .map((p) => (p.length > 30 ? p.slice(0, 30) + "..." : p))
                    .join("<br/>")}
            </div>`;
        const col = getPersonDivs(pplEl)[2];
        col.style.display = "flex";
        col.style.flexDirection = "column";
        col.style.alignItems = "center";
        col?.insertAdjacentHTML("beforeend", template);
    }
    addCSS(
        `
        .limas-project-list{
            margin-top: 8px;
            font-size: 0.9rem;
            font-style: italic;
            font-color: lightgray;
            font-weight: light;
        }
        `
    );
};

const addRecordAll = (names, ids, pplToProjects, lis) => {
    const ul = document.querySelector(
        ".search-results-container ul[role='list']"
    );
    const button = document.createElement("button");
    button.innerText = "Record All";
    addCSS(`
    #limas-record-all{
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
    #limas-record-all:hover{
        background: linear-gradient(120deg, #57fdcf, #35a4d3);
    }
    `);
    button.id = "limas-record-all";
    button.addEventListener("click", async () => {
        const state = await getState();
        let k = 0;
        for (const name of names) {
            const id = ids[k];
            if (!state.projects[state.active].known[id]) {
                state.projects[state.active].known[id] = { name };
                console.info(`Added ${name} (${id}) to ${state.active}`);
            }
            state.projects[state.active].known[id].status = "recorded";
            lis[k].style.background = lightgreen;
            k++;
        }
        await setState(state);
        console.info("Recorded All.");
        document
            .querySelectorAll(".limas-record-button")
            .forEach((b) => b.remove());
        addProjects(makePplToProjects(state), ids, lis);
    });
    const div = document.createElement("div");
    div.style.display = "flex";
    div.style.justifyContent = "center";
    div.appendChild(button);
    ul.parentElement.insertAdjacentElement("afterend", div);
};

const addTitle = (active) => {
    const results = document.querySelector(".search-results-container");
    results.insertAdjacentHTML(
        "afterbegin",
        `<h4 id="limas-title">Current limas Project: ${active}</h4>`
    );
    addCSS(`
        #limas-title{
            background: linear-gradient(120deg, #17bdaf, #0574a3);
            color: white;
            padding: 10px;
            border-radius: 4px;
            margin: 8px 0px;
            font-weight: 100;
        }`);
};

var recCounter = 0;

const main = async () => {
    const state = await getState();
    console.log("LiMAS state :", state);
    if (!state.active) {
        if (!state.alwaysShowCandidates) {
            console.info(
                "No active project and not alwaysShowCandidates. Stopping."
            );
            return;
        }
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
        recCounter++;
        if (recCounter > 100) {
            console.info("No peopleEls found. Stopping.");
            return;
        }
        setTimeout(main, 100);
    } else {
        const imDivs = peopleEls.map(getImDiv);
        const names = peopleEls.map(getName);
        const ids = peopleEls.map(getId);
        const pplToProjects = makePplToProjects(state);

        activeProject && addTitle(state.active);

        let k = 0;
        let unknowns = false;
        for (const id of ids) {
            if (activeProject && activeProject.known[id]) {
                console.log("I know " + names[k]);
                if (activeProject.known[id].status === "recorded") {
                    peopleEls[k].style.background = "#beeeed";
                }
            } else {
                unknowns = true;
                if (allPeople.has(id)) {
                    peopleEls[k].style.background = lightyellow;
                }
            }
            k++;
        }
        activeProject && addRecordButtons(names, ids, imDivs, activeProject);
        addProjects(pplToProjects, ids, peopleEls);
        activeProject &&
            unknowns &&
            addRecordAll(names, ids, pplToProjects, peopleEls);
        setState(state);
    }
};
// Main
async function ready(fn) {
    if (document.readyState !== "loading") {
        await fn();
        return;
    }
    document.addEventListener("DOMContentLoaded", fn);
}
ready(async function () {
    console.log("LiMAS is ready");
    main();
    // enable navigation event listener
    window.navigation.addEventListener("navigate", (event) => {
        const interval = setInterval(() => {
            if (document.querySelector(".search-results-container")) {
                clearInterval(interval);
                main();
            }
        }, 100);
    });
});
