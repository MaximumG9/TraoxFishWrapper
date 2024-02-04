const Fishing = require('./Fishing');
const readline = require('readline');

const session = new Fishing.FishingSession(process.env.TRAOX_FISH_GAME_USERNAME,process.env.TRAOX_FISH_GAME_PASSWORD);

console.log(process.env.TRAOX_FISH_GAME_USERNAME)
console.log(process.env.TRAOX_FISH_GAME_PASSWORD)

try {
    session.login()
} catch (err) {
    addSupressedError(err)
}

jackpotslotcount = 0

twoTimesCount = 0
fiveTimesCount = 0
twentyFiveTimesCount = 0
hundredTimesCount = 0
thousandTimesCount = 0

betcount = 0

netWinnings = 0

fishCount = 0

suppressedErrors = ""

autoFishing = false

autoGambling = false
autoGambleAmount = 10000

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
    session.gamble(autoGambleAmount).then((result) => {

        result.slots.forEach(element => {
            if(element == "jackpot") {
                jackpotslotcount++;
            }
        });
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
    }).catch( err => addSupressedError(err) )
}, 1000);

setInterval(() => {
    if(autoFishing) {
        session.fish().then(ret => {
            fishCount = ret
        }).catch( err => addSupressedError(err) )
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

        var response = Promise.resolve("Command not recognized")
        if(command.startsWith("!autoGamble")) {
            autoGambling = !autoGambling;
                if(autoGambling) {
                    response = Promise.resolve("Auto Gambling Activated")
                } else {
                    response = Promise.resolve("Auto Gambling Disabled");
                }
        } else if(command.startsWith("!autoGambleInfo")) {
                response = Promise.resolve("Jackpot slots out of # of slots rolled: " + jackpotslotcount + "/" + betcount*3 + "\n"
                + "2Xs:   " + twoTimesCount + "\n"
                + "5Xs:   " + fiveTimesCount + "\n"
                + "25Xs:  " + twentyFiveTimesCount + "\n"
                + "100Xs: " + hundredTimesCount + "\n"
                + "1000Xs:" + thousandTimesCount + "\n"
                + "# of gambles: " + betcount + "\n"
                + "net winnings: " + netWinnings);
        } else if(command.startsWith("!gamble")) {
            const cmd = String(command)
            var bet = ""
            cmd.split(" ").forEach(string => {
                if(!string.startsWith("!gamble")) bet += string
            })
            const gamble = session.gamble(parseInt(bet))
            response = gamble.then( result => {
                if(result.slots == null) return "That's too many fish (or gambling is on cooldown)"
                return result.slots + "\nWon: " + result.winnings
            })
            gamble.catch( err => {
                addSupressedError(err)
            })
        } else if(command.startsWith("!profile")) {
            response = session.getProfile(session.username).then(profile => {return profile})
        } else if(command.startsWith("!chat")) {
            chatMode = true;
            response = Promise.resolve("Switched to chat mode")
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
        }
        response.then( message => {
            console.log(message);
            getNextCommand();
        })
    });
}

getNextCommand();


