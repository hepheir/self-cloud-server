'use strict';



// ################################### //
/* AJAX */

const xhr = new XMLHttpRequest();

/**
 * Ajax request using POST.
 * 
 * example:
 * 
 *      ajaxPOST(path, xhr => {
 *          // code
 *      })
 * 
 * executes callback function if XMLHttpRequest has sent successfully.
 * @param {String} url 
 * @param {String} data 
 * @param {requestCallback} callback 
 * @return {void}
 */
function ajaxGet(url, callback) {
    xhr.onreadystatechange = () => {
        if (xhr.readyState == 4 && xhr.status == 200) {
            callback(xhr);
        }
    }
    xhr.open('get', url, true);
    xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xhr.send();
}


// ################################### //


// Detect history back.
window.onpopstate = updateDirectoryList(location.pathname);

/**
 * Create an item node for drive list.
 * @param {PathParams} path 
 */
function updateDirectoryList(path) {
    var list = document.querySelector('.list');

    let elemId = 1;

    ajaxGet(`${path}?json`, xhttp => {
        let files = JSON.parse(xhttp.responseText);
        
        files.map(createListElement);
    })
    
    function createListElement(file) {
        let elem = document.createElement('li');
        
        elem.className = 'item';

        if (file.type == 'folder') {
            file.link = file.name + '/';
        } else {
            file.link = file.name;
        }

        if (file.secured) {
            elem.setAttribute('secured', '');
            elem.innerHTML = 
                `<a class="item-layout" href="${file.link}">
                    <img class="type-icon" src="/stat/icon/${file.type}-secured.svg">
                    <span>${file.name}</span>
                </a>`

        } else {
            elem.innerHTML = 
                `<input  id="li_${elemId}" class="hidden" type="checkbox">
                <label for="li_${elemId}" class="item-hitbox">
                    <img class="check-icon" src="/stat/icon/check.svg">
                    <a class="item-layout" href="${file.link}">
                        <img class="type-icon" src="/stat/icon/${file.type}.svg">
                        <span>${file.name}</span>
                    </a>
                </label>`
        }

        list.appendChild(elem);
        elemId++;
    }
}

updateDirectoryList(location.pathname);