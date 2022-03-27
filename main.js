const puppeteer = require("puppeteer");
const prompt = require("prompt-sync")({ sigint: true });
const { Table } = require("console-table-printer");
const Bot = require("./Bot.js");

const SHOW_INTERFACE = false;

const modes = {
    random: "random",
    weighted: "weighted",
};

let bots = [];

(async () => {
    const formUrl = getFormURL();
    const mode = getMode();
    const numberOfBots = getNumberOfBots();
    start(formUrl, mode, numberOfBots);
})();

function getFormURL() {
    let formUrl = null;

    do {
        console.clear();
        formUrl = prompt("Insert the Google Forms URL: ");
    } while (!isValidURL(formUrl));

    return formUrl;
}

function isValidURL(string) {
    var res = string.match(
        /(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g
    );
    return res !== null;
}

function getMode() {
    let mode = null;
    do {
        console.clear();
        console.log("Press '1' to enter Random Mode");
        console.log("Press '2' to enter Weighted Mode");
        mode = prompt("Chose Mode: ");
    } while (mode != 1 && mode != 2);

    return mode == 1 ? modes.random : modes.weighted;
}

function getNumberOfBots() {
    let numberOfBots = null;
    do {
        console.clear();

        numberOfBots = prompt("Insert the number of bots: ");
    } while (numberOfBots < 1 && numberOfBots > 25);

    return parseInt(numberOfBots);
}

async function start(formUrl, mode, numberOfBots) {
    const browser = await puppeteer.launch({
        headless: !SHOW_INTERFACE,
    });

    for (let i = 0; i < numberOfBots; i++) {
        const page = await browser.newPage();

        const payload = {
            page,
            formUrl: formUrl,
            index: i + 1,
            mode,
        };

        const bot = new Bot(payload);
        bot.start();
        bots.push(bot);
    }

    setInterval(function () {
        const table = new Table({
            columns: [
                {
                    name: "bot_num",
                    title: "Bot Nº",
                    alignment: "left",
                    color: "blue",
                },
                {
                    name: "forms_submited",
                    title: "Forms Submited",
                    alignment: "right",
                },
                { name: "percentage", title: "Percentage", alignment: "right" },
            ],
        });

        console.clear();

        let totalFormsSubmitted = 0;

        console.log("Automatic Google Forms Responder");

        console.log("\n==============================\n");

        bots.forEach(function (bot) {
            const info = bot.getProgress();
            totalFormsSubmitted += info.formsSubmitted;

            table.addRow({
                bot_num: info.botNumber,
                forms_submited: info.formsSubmitted,
                percentage: info.percentage,
            });
        });

        table.printTable();

        console.log("\n==============================\n");

        console.log(`Total of Forms Submitted ${totalFormsSubmitted}`);
    }, 1000);
}
