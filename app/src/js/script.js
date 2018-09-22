let req_path = '1) Music/11) 멜론 구매곡';


let xhr = new XMLHttpRequest();

xhr.open("POST", `/file/${req_path}`, true);
xhr.onreadystatechange = evt => {
    let content = xhr.responseText;
    
    document.body.innerHTML = content;
    // content = JSON.parse(content);
};
xhr.send();