var list = document.querySelectorAll('li.item');

[].map.call(list, elem => {
    elem.addEventListener('click', selectItem);
    elem.addEventListener('mousedown', mousedown);
    elem.addEventListener('mouseup', mouseup);
})

/**
 * Toggle Select Mode
 */
var isSelectMode = false,
    isFirstClickAfterSelectModeOn = false,
    selectedItems = 0,
    toggleSelectModeTimer;

function mousedown() {
    toggleSelectModeTimer = window.setTimeout(toggleSelectMode, 1000);
}
function mouseup() {
    window.clearTimeout(toggleSelectModeTimer);
}
function toggleSelectMode() {
    isSelectMode = !isSelectMode;
    if (isSelectMode) {
        document.body.setAttribute('select-mode', '');
        isFirstClickAfterSelectModeOn = true;
        
    } else {
        document.body.removeAttribute('select-mode');
        // Reset
        [].map.call(list, elem => {
            if (elem.hasAttribute('selected')) {
                elem.removeAttribute('selected');
            }
        })
        selectedItems = 0;
    }
}


/**
 * Toggle item Select
 */
const headerSelectedItems = document.querySelector('.selected-items');
function selectItem(evt) {
    let e = evt.currentTarget;

    if (!isSelectMode) {
        if (isFirstClickAfterSelectModeOn) {
            isFirstClickAfterSelectModeOn = false;
            return;
        }

        location.assign(location.href + e.getAttribute('path'));
        return;
    }

    if (e.hasAttribute('selected')) {
        e.removeAttribute('selected');
        selectedItems--;
    } else {
        e.setAttribute('selected', '');
        selectedItems++;
    }

    headerSelectedItems.innerHTML = `${selectedItems} Selected`;
}

const dynamicIcon = document.querySelector('.dynamic-icon');
dynamicIcon.addEventListener('click', evt => {
    if (!isSelectMode) {
        return;
    }

    let e = evt.currentTarget;

    if (selectedItems === 0) {
        e.setAttribute('select-all', '');
        e.removeAttribute('select-none');
        e.removeAttribute('select-part');

        [].map.call(list, elem => {
            if (!elem.hasAttribute('selected')) {
                elem.setAttribute('selected', '');
            }
        })
        selectedItems = list.length;
        headerSelectedItems.innerHTML = `${selectedItems} Selected`;
    } else {
        e.removeAttribute('select-all');
        e.removeAttribute('select-part');
        e.setAttribute('select-none', '');
        // Reset
        [].map.call(list, elem => {
            if (elem.hasAttribute('selected')) {
                elem.removeAttribute('selected');
            }
        })
        selectedItems = 0;
        headerSelectedItems.innerHTML = `${selectedItems} Selected`;
    }
})