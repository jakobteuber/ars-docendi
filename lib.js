const next = function () {
    let counter = 0;
    return () => ++counter;
}();

function show(elementId) {
    document.getElementById(elementId).classList.remove('hidden');
}

function hide(elementId) {
    document.getElementById(elementId).classList.add('hidden');
}

function post(url, load, on_load) {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url, true);
    xhr.onload = () => on_load(xhr);
    if (load) {
        xhr.send(JSON.stringify(load));
    } else {
        xhr.send();
    }
}

function get(url, on_load) {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url, true);
    xhr.onload = () => on_load(xhr);
    xhr.send();
}