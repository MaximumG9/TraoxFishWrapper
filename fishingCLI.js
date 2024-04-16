const Fishing = require('./Fishing');
const readline = require('readline');

suppressedErrors = ""

const session = new Fishing.FishingSession(process.env.TRAOX_FISH_GAME_USERNAME,process.env.TRAOX_FISH_GAME_PASSWORD);

console.log(process.env.TRAOX_FISH_GAME_USERNAME)
console.log(session.loginKey)

try {
    session.login()
} catch (err) {
    addSuppressedError(err)
}

var inputRL = null

jackpotslotcount = 0

twoTimesCount = 0
fiveTimesCount = 0
twentyFiveTimesCount = 0
hundredTimesCount = 0
thousandTimesCount = 0

betcount = 0

netWinnings = 0

fishCount = 0

autoFishing = false

autoGambling = false
autoGambleBet = 1
gamblingMinForJackpot = false

chatMode = false

function addSuppressedError(err) {
    if(suppressedErrors.length > 0) {
        suppressedErrors += "\n" + err
    } else {
        suppressedErrors = err.toString()
    }
    console.log("suppressed an error")
}

setInterval(() => {
    if(!autoGambling) return;


    if(gamblingMinForJackpot) {
        session.getData().then(data => {
            const bet = Math.ceil(data.minimumBidForJackpot*1.1); // Add extra amount to bet
            autoGambleBet = bet;
        });
    }

    session.gamble(autoGambleBet).then((result) => {

        var jackpotsThisSpin = 0
        result.slots.forEach(element => {
            if(element == "jackpot") {
                jackpotsThisSpin++;
            }
        });

        if(jackpotsThisSpin == 3) {
            console.log("WON THE JACKPOT!!!!");
        }

        jackpotslotcount += jackpotsThisSpin;

        if(JSON.stringify(result.slots) == "[2,2,2]") {
            twoTimesCount++;
        } else if(JSON.stringify(result.slots) == "[5,5,5]") {
            fiveTimesCount++;
        } else if(JSON.stringify(result.slots) == "[25,25,25]") {
            twentyFiveTimesCount++;
        } else if(JSON.stringify(result.slots) == "[100,100,100]") {
            hundredTimesCount++;
        } else if(JSON.stringify(result.slots) == "[1000,1000,1000]") {
            thousandTimesCount++;
        }
        
        netWinnings += result.netWinnings
        betcount++;
    }).catch((err) => {
        addSuppressedError(err)
    });
}, 2000);

setInterval(() => {
    if(!chatMode) return;
    session.getChat("public").then(chat => {
        var ret = ""
        for(var i = chat.length-1; i >= 0;i--) {
            ret += chat[i] + "\n"
        }
        console.log(ret.substring(0, ret.length-1))
        process.stdout.write(">> " + inputrl.line);
    }).catch( err => addSuppressedError(err) )
}, 1000);

setInterval(() => {
    if(autoFishing) {
        session.fish().then(ret => {
            fishCount = ret
        }).catch( err => addSuppressedError(err) )
    }
}, 300);

function input(query) {
    inputrl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise(resolve => inputrl.question(query, ans => {
        inputrl.close();
        resolve(ans);
    }))
}

function getNextCommand() {
    input(">> ").then(command => {
        command = String(command)

        if(!(command.startsWith("!") || chatMode)) {
            getNextCommand();
            return;
        }

        var response = Promise.resolve("Command not recognized")
        if(command.startsWith("!autoGambleInfo")) {
                response = Promise.resolve("Jackpot slots out of # of slots rolled: " + jackpotslotcount + "/" + betcount*3 + "\n"
                + "2Xs:   " + twoTimesCount + "\n"
                + "5Xs:   " + fiveTimesCount + "\n"
                + "25Xs:  " + twentyFiveTimesCount + "\n"
                + "100Xs: " + hundredTimesCount + "\n"
                + "1000Xs:" + thousandTimesCount + "\n"
                + "# of gambles: " + betcount + "\n"
                + "time spent betting: " + betcount*2 + "s\n"
                + "net winnings: " + netWinnings);
        } else if(command.startsWith("!autoGambleBet")) {
            const cmd = command.split(" ")
            if(cmd.length > 1) {
                var bet = ""
                cmd.forEach(string => {
                    if(!string.startsWith("!autoGambleBet")) bet += string
                })
                autoGambleBet = parseInt(bet)
                response = Promise.resolve("Auto gamble is now " + autoGambleBet)
            } else {
                response = Promise.resolve("Auto gamble bet is currently " + autoGambleBet)
            }
        } else if(command.startsWith("!gambleMinForJackpot")) {
            gamblingMinForJackpot = !gamblingMinForJackpot
            if(gamblingMinForJackpot) {
                response = Promise.resolve("Jackpot Gambling Activated")
            } else {
                response = Promise.resolve("Jackpot Gambling Disabled");
            }
        } else if(command.startsWith("!shop")) {
            const cmd = command.split(" ")
            if(cmd.length > 1) {
                var name = cmd[1];
                var amount;
                if(cmd[2] != null) {
                    amount = cmd[2];
                } else {
                    amount = 1;
                }
                
                response = session.buy(name, amount).then(result => {
                    if(result) { 
                        return "Successfully bought " + amount + " " + name;
                    } else {
                        return "Wasn't able to buy that"
                    }
                });
            } else {
                response = session.getCosts();
            }
        } else if(command.startsWith("!getData")) {
            response = session.getData();
        } else if(command.startsWith("!fish")) {
            response = session.getData().then(data => {
                return data.fish;
            });
        } else if(command.startsWith("!autoGamble")) {
            autoGambling = !autoGambling;
                if(autoGambling) {
                    response = Promise.resolve("Auto Gambling Activated")
                } else {
                    response = Promise.resolve("Auto Gambling Disabled");
                }
        } else if(command.startsWith("!gamble")) {
            var bet = ""
            command.split(" ").forEach(string => {
                if(!string.startsWith("!gamble")) bet += string
            })
            const gamble = session.gamble(parseInt(bet))
            response = gamble.then( result => {
                if(result.slots == null) return "You can't bet that amount (or gambling is on cooldown)"
                return result.slots + "\nWon: " + result.winnings
            })
            gamble.catch( err => {
                addSuppressedError(err)
            })
        } else if(command.startsWith("!leaderboard")) {
            const cmd = command.split(" ")
            if(cmd.length > 1) {
                response = session.getLeaderboard(cmd.slice(1).join()).then((leaderboard) => {
                    var text = ""
                    for (let i = 0; i < 50; i++) {
                        const string = leaderboard[i];
                        text += i + ". " + string + "\n"
                    }
                    leaderboard.forEach((string) => {
                        
                    })
                    return text
                })
            } else {
                response = session.getLeaderboard("fish").then((leaderboard) => {
                    var text = ""
                    for (let i = 0; i < 50; i++) {
                        const string = leaderboard[i];
                        text += i + ". " + string + "\n"
                    }
                    leaderboard.forEach((string) => {
                        
                    })
                    return text
                })
            }
            
        } else if(command.startsWith("!specialFish")) {
            const cmd = command.split(" ")
            if(cmd.length > 1) {
                var amount = "";
                cmd.forEach(string => {
                    if(!string.startsWith("!specialFish")) amount += string;
                });
                response = session.buySpecialFish(amount).then(result => {
                    return result ? "Bought " + amount + " special fish" : "Failed to buy that amount of Special Fish";
                });
            } else {
                response = session.getCosts().then((data) => {
                    return "Buy Price: " + data.specialFishCost + "\n" +
                            "Sell Price: " + data.specialFishSellCost;
                });
            }
        } else if(command.startsWith("!profile")) {
            const cmd = command.split(" ")
            if(cmd.length > 1) {
                var username = ""
                cmd.forEach(string => {
                    if(!string.startsWith("!profile")) username += string
                })
                response = session.getProfile(username).then(profile => {return profile})
            } else {
                response = session.getProfile(session.username).then(profile => {return profile})
            }
        } else if(command.startsWith("!unfriend")) {
            const cmd = command.split(" ")
            if(cmd.length > 1) {
                var username = ""
                cmd.forEach(string => {
                    if(!string.startsWith("!unfriend")) username += string
                })
                response = session.getProfile(username).then(profile => {
                    return session.unFriend(username)
                }).then( ret => {
                    if(ret) {
                        return "successfully unfriended " + username
                    } else {
                        return "failed to unfriend " + username
                    }
                });
                
            } else {
                response = Promise.resolve("Name someone to unfriend")
            }
        } else if(command.startsWith("!friend")) {
            const cmd = command.split(" ")
            if(cmd.length > 1) {
                var username = ""
                cmd.forEach(string => {
                    if(!string.startsWith("!friend")) username += string
                })
                response = session.sendFriendRequest(username).then( ret => {
                    if(ret) {
                        return "successfully friended " + username
                    } else {
                        return "failed to friend " + username
                    }
                });
            } else {
                response = session.getFriends().then(friends => {
                    return renderFriendList(friends);
                });
            }
        } else if(command.startsWith("!chat")) {
            chatMode = !chatMode;
            if(chatMode) {
                response = Promise.resolve("Switched to chat mode")
            } else {
                response = Promise.resolve("Switched to normal mode")
            }
            
        } else if(command.startsWith("!errors")) {
            if(suppressedErrors.length > 0) {
                response = Promise.resolve("Errors:\n" + suppressedErrors)
                suppressedErrors = ""
            } else {
                response = Promise.resolve("No errors")
            }
        } else if(command.startsWith("!autoFish")) {
            autoFishing = !autoFishing;
            if(autoFishing) {
                response = Promise.resolve("Auto Fishing Activated")
            } else {
                response = Promise.resolve("Auto Fishing Disabled");
            }
        } else if(command.startsWith("!exit")) {
            process.exit(0);
        } else if(chatMode) {
            response = session.sendChatMessage(command, "public").then( ret => {
                if(ret) {
                    return command
                } else {
                    return "Message failed to send";
                }
            });
        }
        response.then( message => {
            console.log(message);
            getNextCommand();
        })
    });
}

getNextCommand();


function renderFriendList(friends) {
    if(friends.friendUsernames == null || friends.incomingRequestUsernames.length == null || friends.outgoingRequestUsernames == null) return "problem while fetching friends"
    var height = 0

    if(friends.friendUsernames.length >= friends.incomingRequestUsernames.length &&
        friends.friendUsernames.length >= friends.outgoingRequestUsernames.length) {
        height = friends.friendUsernames.length
    } else if(friends.incomingRequestUsernames.length >= friends.friendUsernames.length &&
        friends.incomingRequestUsernames.length >= friends.outgoingRequestUsernames.length) {
        height = friends.incomingRequestUsernames.length
    } else if(friends.outgoingRequestUsernames.length >= friends.friendUsernames.length &&
        friends.outgoingRequestUsernames.length >= friends.incomingRequestUsernames.length) {
        height = friends.outgoingRequestUsernames.length
    }

    var maxFriendUsernameLength = 7
    var maxOutgoingRequestUsernameLength = 2
    var maxIncomingRequestUsernameLength = 3

    friends.friendUsernames.forEach( elem => {
        if (elem.length > maxFriendUsernameLength) {
            maxFriendUsernameLength = elem.length
        }
    })

    friends.outgoingRequestUsernames.forEach( elem => {
        if (elem.length > maxOutgoingRequestUsernameLength) {
            maxOutgoingRequestUsernameLength = elem.length
        }
    })

    friends.incomingRequestUsernames.forEach( elem => {
        if (elem.length > maxIncomingRequestUsernameLength) {
            maxIncomingRequestUsernameLength = elem.length
        }
    })

    var resp = `| ${"friends".padEnd(maxFriendUsernameLength," ")} | ${"in".padEnd(maxIncomingRequestUsernameLength," ")} | ${"out".padEnd(maxOutgoingRequestUsernameLength," ")} |\n`
    
    for (let i = 0; i < height; i++) {
        var line = "| "

        if(i < friends.friendUsernames.length) {
            line += friends.friendUsernames[i].padEnd(maxFriendUsernameLength, " ");
        } else {line += "".padEnd(maxFriendUsernameLength," ");}

        line += " | "

        if(i < friends.incomingRequestUsernames.length) {
            line += friends.incomingRequestUsernames[i].padEnd(maxIncomingRequestUsernameLength," ");
        } else {line += "".padEnd(maxIncomingRequestUsernameLength," ");}

        line += " | "

        if(i < friends.outgoingRequestUsernames.length) {
            line += friends.outgoingRequestUsernames[i].padEnd(maxOutgoingRequestUsernameLength," ");
        } else {line += "".padEnd(maxOutgoingRequestUsernameLength," ");}

        line += " |\n"

        resp += line
    }
    return resp
}
