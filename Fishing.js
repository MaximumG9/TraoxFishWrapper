module.exports = {
FishingSession: class FishingSession {
        randomUUID() {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
                return v.toString(16);
            });
        }

        async gamble(bet) {
            if(this.loginKey == null) throw new Error('Login key not initialized yet');

            const data = {
                "username": this.username,
                "loginKey": this.loginKey,
                "bet": bet
            };
        
            return await fetch("http://traoxfish.us-3.evennode.com/gamble", {
                    method: 'POST',
                    credentials: "same-origin",
                    headers: {
                        accept: 'application/json',
                    },
                    body: JSON.stringify(data),
                }).then(response => {
                    return response.json();
                }).then(json => {
                    if (json.status == "success") {
                        return json.winnings;
                    } else {
                        return -1;
                    }
                })
        }

        init() {
            if(this.loginKey == null) throw new Error('Login key not initialized yet');
            setInterval(this.keepOnline,666);
        }
        
        constructor(username, password) {
            this.username = username;
            this.password = password;
            this.browserKey = this.randomUUID();
            this.loginKey = this.getLoginKey(username,password,this.browserKey);
        }

        getLoginKey(username, password, browserKey) {
            const data = {
                "username": username,
                "password": password,
                "browserKey": browserKey
            };
            return fetch('https://traoxfish.us-3.evennode.com/login', {
                method: 'POST',
                credentials: "same-origin",
                headers: {
                    accept: 'application/json',
                },
                body: JSON.stringify(data),
            }).then(response => {
                return response.json();
            }).then(json => {
                if (json.status == "success") {
                    return json.key;
                } else {
                    return null;
                }
            });
        }

        keepOnline() {
            const data = {
                "username": username,
                "loginKey": loginKey,
            };
            fetch('https://traoxfish.us-3.evennode.com/online', {
                method: 'POST',
                credentials: "same-origin",
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            }).then(response => {
                return response.json();
            }).then(json => {
        
            });
        }
    }
}