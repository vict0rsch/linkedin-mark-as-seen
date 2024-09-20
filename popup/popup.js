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
            <button class="project-card-action-active mx-2">Set Active</button>
            <button class="project-card-action-inactive mx-2">Deactivate</button>
            <button class="project-card-action-delete mx-2">Delete</button>
        </div>
    </div>
    `;

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

// Main
(async () => {
    query("#create-project-form").addEventListener("submit", (e) => {
        e.preventDefault();
        submitNewProject();
    });
    updateProjectsView();
})();
