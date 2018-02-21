var client_id = getCookie('client_id');

    const login = document.getElementById('login');

    login.addEventListener('click', () => {

        console.log('id: ', client_id);
        client_id = prompt('아이디를 입력해라요!', client_id) || client_id;
        document.cookie = 'client_id=' + client_id + ';path=/;';
        playerLayoutDOM.removeAttribute('saved');
    })

    function getCookie(cname) {
        var name = cname + "=";
        var decodedCookie = decodeURIComponent(document.cookie);
        var ca = decodedCookie.split(';');
        for(var i = 0; i <ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0) == ' ') {
                c = c.substring(1);
            }
            if (c.indexOf(name) == 0) {
                return c.substring(name.length, c.length);
            }
        }
        return "";
    }