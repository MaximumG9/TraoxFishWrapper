function fetchJSON(url,data) {
    var json;
    try {
        json = fetch(url,{
            method: 'POST',
            credentials: "same-origin",
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        }).then(response => {
            return response.text().then((text) => {
                //console.log(text);
                return JSON.parse(text);
            });
        });
    } catch (e) {
        json = Promise.resolve({});
    }
    return json;
}


module.exports = {
createAccount: function createAccount(username, password) {
    const data = {
        "username": username,
        "password": password,
        "browserKey": getCookie("browserKey")
    };
    return fetchJSON(`https://traoxfish.us-3.evennode.com/register`).then( json => {
        if(json.status == "success") {
            return true;
        } else {
            return false;
        }
    });
},
FishingSession: class FishingSession {
        randomUUID() {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
                return v.toString(16);
            });
        }

        async buy(name,amount) {
            const data = {
                "username":this.username,
                "loginKey":this.loginKey,
                "purchaseType":name,
                "quantity":amount
            };

            return fetchJSON('http://traoxfish.us-3.evennode.com/makepurchase', data).then(json => {
                return json.status == "success";
            })
        }

        async getCosts() {
            const data = {
                "username":this.username,
                "loginKey":this.loginKey,
                "rareFishAmount":1,
                "veryRareFishAmount":1,
                "sharkAmount":1,
                "rareSharkAmount":1,
                "fishermanAmount":1,
                "chumAmount":1,
                "fishBucketAmount":1
            }

            return fetchJSON('http://traoxfish.us-3.evennode.com/getcosts',data).then(json => {
                const thing = new Costs(json);
                return thing;
            })
        }

        async getData() {
            const data = {
                "username":this.username,
                "loginKey":this.loginKey
            };
            return fetchJSON('http://traoxfish.us-3.evennode.com/getdata',data);
        }

        async getSpecialFishData() {
            const data = {
                "username":this.username,
                "loginKey":this.loginKey
            };
            return fetchJSON('http://traoxfish.us-3.evennode.com/getspecialfishgraph',data).then(json => {
                return json.graph;
            });
        }

        async buySpecialFish(amount) {
            const data = {
                "username":this.username,
                "loginKey":this.loginKey,
                "purchaseType":"specialFish",
                "quantity":amount
            };

            for(var i=0;i<amount;i++) {
                fetchJSON('http://traoxfish.us-3.evennode.com/makepurchase', data).then(json => {
                    return json.status == "success";
                })
            }
        }

        async getLeaderboard(type) {
            const data = {
                "leaderboardType": type,
                "loginKey": this.loginKey,
                "username": this.username
            }
            return fetchJSON('http://traoxfish.us-3.evennode.com/getleaderboards', data).then(json => {
                for (let index = 0; index < json.leaderboards.length; index++) {
                    if(json.onlineStatus[index]) {
                        json.leaderboards[index] = json.leaderboards[index] + " (Online)"
                    }  
                }
                return json.leaderboards
            })
        }

        async getChat(channel) {
            const data = {
                "username": this.username,
                "loginKey": this.loginKey,
                "channel": channel
            }
            return fetchJSON('http://traoxfish.us-3.evennode.com/getchat/',data).then(json => {
                return json.messages;
            })
        }

        async sendFriendRequest(username) {
            const data = {
                "username": this.username,
                "loginKey": this.loginKey,
                "profile": username,
                "cancel": false
            }
            return fetchJSON('http://traoxfish.us-3.evennode.com/sendfriendrequest',data).then(json => {
                return json.status == "success"
            })
        }

        async getFriends() {
            const data = {
                "username": this.username,
                "loginKey": this.loginKey
            }
            return fetchJSON('http://traoxfish.us-3.evennode.com/getfriends',data).then(json => {
                return new FriendListResult(json)
            })
        }

        async unFriend(username) {
            const data = {
                "username": this.username,
                "loginKey": this.loginKey,
                "profile": username,
                "cancel": true
            }
            return fetchJSON('http://traoxfish.us-3.evennode.com/sendfriendrequest',data).then(json => {
                return json.status == "success"
            })
        }

        async sendChatMessage(message,channel) {
            const data = {
                "username": this.username,
                "loginKey": this.loginKey,
                "channel": channel,
                "message": message
            }
            return fetchJSON('http://traoxfish.us-3.evennode.com/sendchatmessage',data).then(json => {
                return json.status == "success"
            })
        }

        async fish() {
            const data = {
                "username": this.username,
                "loginKey": this.loginKey
            };
            return fetchJSON('http://traoxfish.us-3.evennode.com/fish',data)
            .then(json => {
                if (json.status == "success") {
                    return Number(json.fish)
                } else {
                    return -1
                }
            });
        }

        async getProfile(username) {
            const data = {
                "username": this.username,
                "loginKey": this.loginKey,
                "profile": username
            }
            return fetchJSON('http://traoxfish.us-3.evennode.com/getProfile', data).then(json => new Profile(json));
        }

        async gamble(bet) {
            if(this.loginKey == null) throw new Error('Login key not initialized yet');

            const data = {
                "username": this.username,
                "loginKey": this.loginKey,
                "bet": bet
            };
        
            return await fetchJSON('http://traoxfish.us-3.evennode.com/gamble',data)
                    .then(json => {
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
            return fetchJSON('http://traoxfish.us-3.evennode.com/login',data).then(json => {
                if (json.status == "success") {
                    return String(json.key);
                } else {
                    return String(null);
                }
            });
        }

        async checkIfLoggedIn() {
            const data = {
                "username": this.username,
                "loginKey": this.loginKey
            };
            return fetchJSON('http://traoxfish.us-3.evennode.com/checkKey',data).then(json => {
                return Boolean(json.validKey);
            });
        
        }

        keepOnline(username,loginKey) {
            if(loginKey == null) throw new Error('Login key not initialized yet');
            const data = {
                "username": username,
                "loginKey": loginKey,
            };
            fetchJSON('http://traoxfish.us-3.evennode.com/online',data)
        }
    }
}

class Profile {
    guildName = ""
    isOwnerOfGuild = false
    fish = 0
    rareFish = 0
    veryRareFish = 0
    sharks = 0
    rareSharks = 0
    specialFish = 0
    fishermen = 0
    chum = 0
    fishBuckets = 0
    fishingBoatFish = 0
    fishingBoatCapacity = 0
    level = 0
    allTimeFish = 0
    fishGambled = 0
    joinDate = ""
    lastOnlineDate = ""
    profilePicture = ""
    friendShipStatus = ""
    rank = ""
    playtime = ""
    friendUsernames = [""]
    challengeSetting = ""
    fishPerSecond = 0
    fishPerClick = 0


    constructor(json) {
        this.username = json.username

        this.guildName = json.guild
        this.isOwnerOfGuild = json.isOwnerOfGuild

        this.level = json.level
        this.fish = json.fish
        this.rareFish = json.rareFish
        this.veryRareFish = json.veryRareFish
        this.sharks = json.sharks
        this.rareSharks = json.rareSharks
        this.specialFish = json.specialFish
        this.allTimeFish = json.allTimeFish
        this.fishGambled = json.fishGambled
        this.joinDate = json.joinDate
        this.lastOnlineDate = json.lastOnlineDate
        this.profilePicture = json.profilePicture
        this.friendShipStatus = json.friendStatus
        this.rank = json.rank
        this.fishermen = json.fishermen
        this.chum = json.chum
        this.fishBuckets = json.fishBuckets
        this.playtime = json.playtime
        this.friendUsernames = json.friends
        this.challengeSetting = json.challengeSetting
        this.fishPerSecond = json.fishPerSecond
        this.fishPerClick = json.fishPerClick
    }
}

class Costs {
    rareFishCost = 0;
    veryRareFishCost = 0;
    sharkCost = 0;
    rareSharkCost = 0;
    specialFishCost = 0;
    specialFishSellCost = 0;
    whaleCost = 0;
    fishermanCost = 0;
    chumCost = 0;
    fishBucketCost = 0;


    constructor(json) {
        this.rareFishCost = json.rareFishCost;
        this.veryRareFishCost = json.veryRareFishCost
        this.sharkCost = json.sharkCost;
        this.rareSharkCost = json.rareSharkCost;
        this.specialFishCost = json.specialFishCost;
        this.whaleCost = json.whaleCost;
        this.fishermanCost = json.fishermanCost;
        this.chumCost = json.chumCost;
        this.fishBucketCost = json.fishBucketCost;
    }
}

class FriendListResult {
    friendUsernames = [""]
    outgoingRequestUsernames = [""]
    incomingRequestUsernames = [""]

    constructor(json) {
        this.friendUsernames = json.friends     
        this.outgoingRequestUsernames = json.outgoingRequests
        this.incomingRequestUsernames = json.incomingRequests
    }
}

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