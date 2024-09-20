const queryAll = (q) => Array.from(document.querySelectorAll(q));
const query = (q) => document.querySelector(q);
const getEl = (queryOrElement) =>
    typeof queryOrElement === "string" ? query(queryOrElement) : queryOrElement;
const getValue = (queryOrElement) => {
    const element = getEl(queryOrElement);

    if (!element) return null;
    if (element.tagName === "INPUT" && element.type === "checkbox")
        return element.checked;
    if (element.tagName === "INPUT") return element.value;
    if (element.tagName === "SELECT")
        return element.options[element.selectedIndex].value;
    if (element.tagName === "TEXTAREA") return element.value;
};
const setValue = (queryOrElement, value) => {
    const element = getEl(queryOrElement);
    if (element.tagName === "INPUT" && element.type === "checkbox")
        element.checked = Boolean(value);
    else {
        element.value = value;
    }
};
const getState = async () => {
    const { state } = await chrome.storage.local.get("state");
    if (!state) return {};
    return state;
};
const setState = async (state) => {
    await chrome.storage.local.set({ state });
};
const show = (queryOrElement, display) => {
    if (!display) display = "block";
    const element = getEl(queryOrElement);
    element.style.display = display;
};
const sleep = (t) =>
    new Promise((resolve, reject) => {
        setTimeout(resolve, t);
    });

const addCSS = (css) => {
    const style = document.createElement("style");

    if (style.styleSheet) {
        style.styleSheet.cssText = css;
    } else {
        style.appendChild(document.createTextNode(css));
    }

    document.getElementsByTagName("head")[0].appendChild(style);
};
