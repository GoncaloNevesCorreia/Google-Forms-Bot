const questionsWeight = require("./questions.json");

module.exports = class Bot {
    constructor({ page, formUrl, index, mode }) {
        this.page = page;
        this.formUrl = formUrl;
        this.timeout = 3000;
        this.pageInfo = {};
        this.formsSubmitted = 0;
        this.botNumber = index;
        this.mode = mode;
        this.validModes = {
            random: "random",
            weighted: "weighted",
        };
    }

    async start() {
        await this.preparePageForTests();

        while (true) {
            await this.answerForm();
        }
    }

    async answerForm(page) {
        await this.page.goto(this.formUrl);

        await this.page.waitForTimeout(this.timeout);

        while (!(await this.hasSubmitButton())) {
            await this.answerPageQuestions();
            await this.nextPage();
        }

        // Responde a ultima pagina
        await this.answerPageQuestions(page);

        await this.submitForm(page);
    }

    async hasSubmitButton() {
        const submitButtonSelector =
            "div.uArJ5e.UQuaGc.Y5sE8d span.l4V7wb.Fxmcue";
        const button = await this.page.$(submitButtonSelector);

        return !!button;
    }

    async answerPageQuestions() {
        this.pageInfo = await this.getPageInfo();

        const questions = await this.getPageQuestions();

        questions.radioQuestions.forEach((question, index) =>
            this.answerRadioQuestion(question, index)
        );
        questions.checkBoxQuestions.forEach((question, index) =>
            this.answerCheckBoxQuestion(question, index)
        );
        questions.scaledQuestions.forEach((question, index) =>
            this.answerScaledQuestion(question, index)
        );

        await this.page.waitForTimeout(this.timeout);
    }

    async getPageInfo() {
        const selector = "#lpd4pf";
        const pageInfo = await this.page.$eval(selector, (element) => {
            return {
                currentPage: parseInt(element.textContent.slice(7, 9).trim()),
                totalPages: parseInt(element.textContent.slice(-2).trim()),
            };
        });
        return pageInfo;
    }

    async getPageQuestions() {
        const radioQuestions = await this.getRadioQuestions();
        const checkBoxQuestions = await this.getCheckBoxQuestions();
        const scaledQuestions = await this.getScaledQuestions();

        return {
            radioQuestions,
            checkBoxQuestions,
            scaledQuestions,
        };
    }

    async getRadioQuestions() {
        return await this.page.$$("span.H2Gmcc.tyNBNd");
    }

    async answerRadioQuestion(question, index) {
        const selector = "div.nWQGrd.zwllIb > label";
        const options = await question.$$(selector);

        if (!options.length) return;

        let answer = null;

        if (this.mode === this.validModes.weighted) {
            const pageNumber = this.pageInfo.currentPage;
            const weights = questionsWeight[pageNumber]["radio"][index + 1];
            answer = this.weightedRandom(weights);
        } else {
            answer = this.randomIntFromInterval(0, options.length - 1);
        }

        await options[answer].evaluate((b) => {
            b.click();
        });
    }

    async getCheckBoxQuestions() {
        return await this.page.$$("div.Y6Myld");
    }

    async answerCheckBoxQuestion(question, index) {
        const selector = "div.eBFwI > label";
        const options = await question.$$(selector);

        if (!options.length) return;

        const toAnswer = this.randomIntFromInterval(1, options.length - 1);
        for (let i = 0; i < toAnswer; i++) {
            let answer = null;

            if (this.mode === this.validModes.weighted) {
                const pageNumber = this.pageInfo.currentPage;
                const weights =
                    questionsWeight[pageNumber]["checkbox"][index + 1];
                answer = this.weightedRandom(weights);
            } else {
                answer = this.randomIntFromInterval(0, options.length - 1);
            }

            await options[answer].evaluate((b) => {
                b.click();
            });
        }
    }

    async getScaledQuestions() {
        return await this.page.$$("div.PY6Xd div.N9Qcwe");
    }

    async answerScaledQuestion(question, index) {
        const selector = "div.Od2TWd.hYsg7c";
        const options = await question.$$(selector);

        if (!options.length) return;

        let answer = null;

        if (this.mode === this.validModes.weighted) {
            const pageNumber = this.pageInfo.currentPage;
            const weights = questionsWeight[pageNumber]["scale"][index + 1];
            answer = this.weightedRandom(weights);
        } else {
            answer = this.randomIntFromInterval(0, options.length - 1);
        }

        await options[answer].evaluate((b) => {
            b.click();
        });
    }

    async nextPage() {
        const selector = "[jsname=OCpkoe]";
        const button = await this.page.$(selector);
        await button.evaluate((b) => {
            b.click();
        });

        await this.page.waitForTimeout(this.timeout);
    }

    async submitForm() {
        const selector = "div.uArJ5e.UQuaGc.Y5sE8d span.l4V7wb.Fxmcue";
        const button = await this.page.$(selector);
        await button.evaluate((b) => {
            b.click();
        });

        this.formsSubmitted++;

        await this.page.waitForTimeout(this.timeout);
    }

    getProgress() {
        const percentage =
            (100 * this.pageInfo.currentPage) / this.pageInfo.totalPages;

        return {
            percentage: percentage ? `${percentage.toFixed(2)}%` : "Loading...",
            formsSubmitted: this.formsSubmitted,
            botNumber: this.botNumber,
        };
    }

    async preparePageForTests() {
        // Pass the User-Agent Test.
        const userAgent =
            "Mozilla/5.0 (X11; Linux x86_64)" +
            "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.39 Safari/537.36";
        await this.page.setUserAgent(userAgent);
    }

    weightedRandom(spec) {
        var i,
            sum = 0,
            r = Math.random();
        for (i in spec) {
            sum += spec[i];
            if (r <= sum) return i;
        }
    }

    randomIntFromInterval(min, max) {
        // min and max included
        return Math.floor(Math.random() * (max - min + 1) + min);
    }
};
