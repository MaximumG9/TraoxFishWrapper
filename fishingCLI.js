const Fishing = require('./Fishing');
const readline = require('readline');

const session = new Fishing.FishingSession(process.env.TRAOX_FISH_GAME_USERNAME,process.env.TRAOX_FISH_GAME_PASSWORD);

console.log(process.env.TRAOX_FISH_GAME_USERNAME)
console.log(process.env.TRAOX_FISH_GAME_PASSWORD)

session.login()

jackpotslotcount = 0
betcount = 0

netWinnings = 0

fishCount = 0

suppressedErrors = ""

autoFishing = false

autoGambling = false

chatMode = false

function addSupressedError(err) {
    if(suppressedErrors.length > 0) {
        suppressedErrors += "\n" + err
    } else {
        suppressedErrors = err.toString()
    }
}

setInterval(() => {
    if(!autoGambling) return
    session.gamble(1000).then((result) => {
        if(result)
        result.slots.forEach(element => {
            if(element == "jackpot") {
                jackpotslotcount++;
            }
        });
        netWinnings += result.netWinnings
        betcount++;
    }).catch((err) => {
        addSupressedError(err)
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
    })
}, 1000);

setInterval(() => {
    if(autoFishing) {
        session.fish().then(ret => {
            fishCount = ret
        })
    }
}, 300);

function input(query) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise(resolve => rl.question(query, ans => {
        rl.close();
        resolve(ans);
    }))
}

function getNextCommand() {
    input(">> ").then(command => {
        command = String(command)

        if(chatMode) {
            if(command == "!chat") {
                chatMode = false
                console.log("Switched to normal mode");
            }
            session.sendChatMessage(command, "public").then( ret => {
                if(ret) {
                    console.log(command)
                } else {
                    console.log("Message failed to send");
                }
                getNextCommand()
            });
            return
        }

        if(!command.startsWith("!")) {
            getNextCommand();
            return;
        }

        response = Promise.resolve("Command not recognized")
        switch (command) {
            case "!autoGamble":
                autoGambling = !autoGambling;
                if(autoGambling) {
                    response = Promise.resolve("Auto Gambling Activated")
                } else {
                    response = Promise.resolve("Auto Gambling Disabled");
                }
                break;
            case "!autoGambleInfo":
                response = Promise.resolve("Jackpot slots out of # of slots rolled: " + jackpotslotcount + "/" + betcount*3 + "\n"
                + "# of gambles: " + betcount + "\n"
                + "net winnings: " + netWinnings);
                break;
            case "!gamble":
                const gamble = input("bet: ").then( bet => {
                    return session.gamble(parseInt(bet))
                })
                response = gamble.then( result => {
                    if(result.slots == null) return "That's too many fish (or gambling is on cooldown)"
                    return result.slots + "\nWon: " + result.winnings
                })
                gamble.catch( err => {
                    addSupressedError(err)
                })
                break;
            case "!profile":
                response = session.getProfile(session.username).then(profile => {return profile})
                break;
            case "!chat":
                chatMode = true;
                response = Promise.resolve("Switched to chat mode")
                break;
            case "!errors":
                if(suppressedErrors.length > 0) {
                    response = Promise.resolve("Errors:\n" + suppressedErrors)
                    suppressedErrors = ""
                } else {
                    response = Promise.resolve("No errors")
                }
                break;
            case "!autoFish":
                autoFishing = !autoFishing;
                if(autoFishing) {
                    response = Promise.resolve("Auto Fishing Activated")
                } else {
                    response = Promise.resolve("Auto Fishing Disabled");
                }
                break;
            case "!exit":
                process.exit(0);
                break;
            default:
                break;
        }
        response.then( message => {
            console.log(message);
            getNextCommand();
        })
    });
}

getNextCommand();


