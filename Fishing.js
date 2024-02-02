class GamblingResult {
    slots = [0,0,0]
    winnings = 0
    won = false
    netWinnings = 0

    constructor(winnings,bet,slot1,slot2,slot3) {
        if(winnings == -1) {
            this.slots = null
            this.winnings = null
            this.won = null
            this.netWinnings = null
            return
        }
        
        if(winnings == 0) {
            this.netWinnings = -bet
            this.won = false
        } else {
            this.netWinnings = winnings
            this.won = true
        }

        this.slots[0] = slot1
        this.slots[1] = slot2
        this.slots[2] = slot3

        this.winnings = winnings
    }
}

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
                    var winnings = 0
                    if (json.status == "success") {
                        winnings = json.winnings;
                    } else {
                        winnings = -1;
                    }
                    return new GamblingResult(winnings,bet,json.slot1,json.slot2,json.slot3);
                })
        }

        login() {
            this.getLoginKey(this.username,this.password,this.browserKey).then( ret => {
                this.loginKey = ret;
                this.checkIfLoggedIn().then( res => {
                    console.log("logged in? " + res)
                    setInterval(() => {
                        this.keepOnline(this.username,this.loginKey);
                    },666)
                    setInterval(() => {
                        this.checkIfLoggedIn();
                    },666)
                });
            })
        }
        
        constructor(username, password) {
            this.username = username;
            this.password = password;
            this.browserKey = this.randomUUID();
        }

        getLoginKey(username, password, browserKey) {
            const data = {
                "username": username,
                "password": password,
                "browserKey": browserKey
            };
            return fetch('http://traoxfish.us-3.evennode.com/login', {
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

        async checkIfLoggedIn() {
            const data = {
                "username": this.username,
                "loginKey": this.loginKey
            };
            return await fetch('http://traoxfish.us-3.evennode.com/checkkey', {
                method: 'POST',
                credentials: "same-origin",
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            }).then(response => {
                return response.json();
            }).then(json => {
                return json.validKey;
            });
        
        }

        keepOnline(username,loginKey) {
            if(loginKey == null) throw new Error('Login key not initialized yet');
            const data = {
                "username": username,
                "loginKey": loginKey,
            };
            fetch('http://traoxfish.us-3.evennode.com/online', {
                method: 'POST',
                credentials: "same-origin",
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            })
        }
    }
}