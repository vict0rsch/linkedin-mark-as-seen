const setFeedback = ({ error, message, form, timeout = 2000 }) => {
    const feedback = query(`#${form}-feedback`);
    feedback.innerText = message;
    feedback.style.color = error ? "red" : "green";
    setTimeout(() => {
        feedback.innerText = "";
    }, timeout);
};
const hide = (queryOrElement) => show(queryOrElement, "none");

const newId = (state) => {
    const pids = Object.values(state.projects).map((p) => p.id);
    return Math.max(...pids) + 1;
};

const submitNewProject = async () => {
    const name = getValue("#project-name");
    const query = getValue("#project-query");
    const state = await getState();
    if (!name || !query)
        return setFeedback({
            error: true,
            message: "Please fill in all fields",
            form: "create-project-form",
        });

    if (!state.projects) state.projects = {};
    if (state.projects[name])
        return setFeedback({
            error: true,
            message: "Project already exists",
            form: "create-project-form",
        });
    state.projects[name] = {
        query,
        known: {},
        id: newId(state),
    };
    state.active = name;
    await setState(state);
    await updateProjectsView();

    setValue("#project-name", "");
    setValue("#project-query", "");

    setFeedback({
        error: false,
        message: "Project created!",
        form: "create-project-form",
    });
};

const makeProjectCard = (name, data) => `
    <div class="project-card">
        <div class="project-card-id" title="Project ID">${data.id}</div>
        <div class="project-card-header">
            <h3 class="mt-3 mb-3">${name}</h3>
        </div>
        <div class="project-card-body mt-2">
            <p>Candidates Seen: ${Object.keys(data.known).length}</p>
            <p class="query-display">${data.query}</p>
        </div>
        <div class="project-card-action d-flex justify-content-center mb-3">
            <button class="project-card-action-show-candidate mx-2">Show candidates</button>
            <button class="project-card-action-active mx-2">Set Active</button>
            <button class="project-card-action-inactive mx-2">Deactivate</button>
            <button class="project-card-action-delete mx-2">Delete</button>
        </div>
    </div>
    `;

const showCandidates = (known, project) => {
    const knownHTML = Object.entries(known)
        .map(
            ([id, p], i) =>
                `<div class="candidate-item">
                    <a class="candidate-link" href="https://linkedin.com/in/${id}" data-id="${id}">${p.name}</a>
                    <div class="delete-candidate" data-id="${id}">Delete</div>
                </div>`
        )
        .join("");
    getEl("#candidates-list").dataset.project = project;
    getEl("#candidates-list").innerHTML = knownHTML;
    getEl("#candidates-modal").scrollTop = 0;
    getEl("#candidates-modal").style.display = "block";
    queryAll(".candidate-link").forEach((link) => {
        link.addEventListener("click", async (e) => {
            e.preventDefault();
            const href = e.target.href;
            chrome.tabs.create({ url: href });
        });
    });
};

const normalizeString = (str) =>
    str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

const searchCandidates = async (query) => {
    const normalize = normalizeString(query) === query;
    const state = await getState();
    const project = getEl("#candidates-list").dataset.project;
    const known = state.projects[project].known;
    const q = query.toLowerCase();
    const selected = Object.fromEntries(
        Object.entries(known).filter(([id, p], i) => {
            let name = p.name.toLowerCase();
            if (normalize) name = normalizeString(name);
            const candidates = name.split(" ");
            return candidates.some((c) => c.includes(q));
        })
    );
    showCandidates(selected, project);
};

const setActive = (name) => {
    const projectCards = queryAll(".project-card");
    projectCards.forEach((card) => {
        card.classList.remove("active");
        show(card.querySelector(".project-card-action-active"));
        hide(card.querySelector(".project-card-action-inactive"));
        if (card.querySelector("h3").innerText === name) {
            card.classList.add("active");
            hide(card.querySelector(".project-card-action-active"));
            show(card.querySelector(".project-card-action-inactive"));
        }
    });
};

const updateProjectsView = async () => {
    const state = await getState();
    let projectHTMLs = [];
    let activeProjectHTML = null;
    for (const p in state.projects) {
        if (state.active === p)
            activeProjectHTML = makeProjectCard(p, state.projects[p]);
        else projectHTMLs.push(makeProjectCard(p, state.projects[p]));
    }
    projectHTMLs = [activeProjectHTML, ...projectHTMLs];
    query("#project-list").innerHTML = projectHTMLs.join("");
    queryAll(".project-card-action-active").forEach((button) => {
        button.addEventListener("click", async () => {
            const projectName =
                button.parentElement.parentElement.querySelector(
                    "h3"
                ).innerText;
            const state = await getState();
            state.active = projectName;
            await setState(state);
            setActive(projectName);
        });
    });
    queryAll(".project-card-action-inactive").forEach((button) => {
        button.addEventListener("click", async () => {
            const state = await getState();
            state.active = "";
            await setState(state);
            setActive();
        });
    });
    queryAll(".project-card-action-delete").forEach((button) => {
        button.addEventListener("click", async () => {
            if (button.innerText == "Delete") {
                button.innerText = "Sure?";
                setTimeout(() => {
                    if (button) button.innerText = "Delete";
                }, 2000);
                return;
            }
            const projectName =
                button.parentElement.parentElement.querySelector(
                    "h3"
                ).innerText;
            const state = await getState();
            delete state.projects[projectName];
            if (state.active === projectName) {
                delete state.active;
                const nextActive = Object.keys(state.projects)[0];
                if (nextActive) state.active = nextActive;
            }
            await setState(state);
            await updateProjectsView();
        });
    });
    setActive(state.active);
};

const candidatesNonActive = (state) => {
    getEl("#show-known-candidates").checked = Boolean(
        state?.alwaysShowCandidates
    );
    getEl("#show-known-candidates").addEventListener("click", async () => {
        const state = await getState();
        const val = getValue("#show-known-candidates");
        state.alwaysShowCandidates = val;
        await setState(state);
        console.log(`Show known candidates: ${val}`);
    });
};

// Main
(async () => {
    const state = await getState();
    query("#create-project-form").addEventListener("submit", (e) => {
        e.preventDefault();
        submitNewProject();
    });
    await updateProjectsView();
    candidatesNonActive(state);
    queryAll(".project-card-action-show-candidate").forEach((button) => {
        console.log("project-card-action-show-candidate");
        button.addEventListener("click", async (e) => {
            const el = e.target.parentElement.parentElement;
            const state = await getState();
            const id = el.querySelector(".project-card-id").innerText;
            const project = Object.values(state.projects).find(
                (p) => p.id == id
            );
            const name = el.querySelector("h3").innerText;
            console.log("id :", id);
            console.log("state :", state);
            console.log("project :", project);
            showCandidates(project.known, name);
        });
    });
    getEl("#close-modal-button").addEventListener("click", () => {
        getEl("#candidates-modal").style.display = "none";
    });
    getEl("#search-candidates").addEventListener("change", (e) => {
        searchCandidates(getValue("#search-candidates"));
    });
})();
