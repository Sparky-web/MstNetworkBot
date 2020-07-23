const fs = require("fs");
const {Builder, By, Key, until} = require('selenium-webdriver');
const easyVK = require("easyvk");
const readline = require("readline");

function random(min, max) {
    return Math.floor(min + Math.random() * (max - min));
}

const wait = sec => new Promise(resolve => setTimeout(() => resolve(), sec * 1000));
const readJsonFile = (path) => JSON.parse(fs.readFileSync(path).toString());
const saveFile = (path, data) => {
    fs.writeFileSync(path, JSON.stringify(data));
    return data
};

async function login(driver, account) {
    await driver.get("https://mstnw.net/");

    let el = await driver.findElement(By.css(".button-a > button:nth-child(1)"));
    await el.click();

    await driver.wait(until.elementLocated(By.css("input.oauth_form_input:nth-child(7)")));
    await wait(1);
    let loginInput = await driver.findElement(By.css("input.oauth_form_input:nth-child(7)"));
    await loginInput.sendKeys(account.login.toString());
    await wait(1);
    let passInput = await driver.findElement(By.css("input.oauth_form_input:nth-child(9)"));
    await passInput.sendKeys(account.password.toString());
    await passInput.sendKeys(Key.ENTER);

    await driver.wait(until.titleContains("MST"), 5000).catch(async ex => {
        const title = await driver.getTitle();
        if (/разрешение доступа/ig.test(title)) {
            const button = await driver.findElement(By.css("button.flat_button:nth-child(1)"));
            await button.click();
            return driver.wait(until.titleContains("MST"));
        } else {
            await driver.wait(until.titleContains("MST"))
        }
    });
    await driver.get("https://mstnw.net/?lk");
}
async function openCard(account) {
    const driver = await new Builder().forBrowser("firefox").build();
    await login(driver, account);

    let el = await driver.findElement(By.css(".mst-card > p:nth-child(2)"));
    let price = await el.getText();
    let canOpen = /бесплатно/ig.test(price);
    if (canOpen) {
        let cards = await driver.findElements(By.css(".mstcard"));
        let card = cards[random(0, 9)];
        await card.click();
        let item = await driver.wait(until.elementLocated(By.css('.mst-card .text-center p:nth-child(5)')), 3000)
            .then(async () => {
                return driver.findElement(By.css(".mst-card .text-center p:nth-child(5)"));
            })
            .catch(async () => {
                return driver.findElement(By.css(".btn-back .text-center p:nth-child(5)"))
            });
        let itemText = await item.getText();
        await driver.quit();
        return {
            ...account,
            lastTimeOpened: new Date().toLocaleString(),
            data: [
                itemText, ...account.data
            ]
        }
    } else if(!canOpen) {
        await driver.quit();
        return account
    }
}
const takeItemsFromOneAccount = (nickname, password, account) => new Promise((resolve, reject) => {
    easyVK({token: account.token, captchaHandler: captchaHandler})
        .then(async vk => {
            try {
                await vk.call("messages.send", {
                    peer_id: -138187251,
                    random_id: easyVK.randomId(),
                    message: "Начать"
                });
                await wait(5);
                await vk.call("messages.send", {
                    peer_id: -138187251,
                    random_id: easyVK.randomId(),
                    message: "!отвязать " + nickname
                });
                await wait(5);
                await vk.call("messages.send", {
                    peer_id: -138187251,
                    random_id: easyVK.randomId(),
                    message: "!привязать " + nickname + " " + password
                });
                await wait(5);

                const driver = await new Builder().forBrowser("firefox").build();
                await login(driver, account);
                for (let e of await driver.findElements(By.css(".content-account button"))) {
                    await e.click();
                    await driver.wait(until.elementLocated(By.css("#cardgifts button")))
                }
                const buttons = await driver.findElements(By.css("#cardgifts button"));
                for (let e of buttons) {
                    await e.click();
                    await wait(3)
                }

                await vk.call("messages.send", {
                    peer_id: -138187251,
                    random_id: easyVK.randomId(),
                    message: "!отвязать " + nickname
                });

                await driver.quit();
                resolve({
                    ...account,
                    data:[]
                })
            } catch (e) {
                throw new Error(JSON.stringify(e))
            }

    })
        .catch(reject);
});

async function openCards(accounts) {
    let newAccounts = [];
    for(let el of accounts) {
        let newAccount = await openCard(el);
        newAccounts.push(newAccount);
        console.log(newAccount.data[0])
    }
    saveFile("./accounts.json", newAccounts);
    return "OK"
}
async function getItems(accounts) {
    const newAccounts = [];
    for(let e of accounts) {
        newAccounts.push(await takeItemsFromOneAccount("здесь логин от мст", "а тут пароль", e))
    }
    return newAccounts
}

const checkAccount = account => new Promise((resolve, reject) => {
    easyVK({token: account.token, captchaHandler: captchaHandler}).then(async vk => {
        await vk.call("wall.get", {
            owner_id: -141959356,
            count: 1
        }).catch(reject);
        resolve()
    }).catch(reject)
});
const checkAccounts = accounts => new Promise(async resolve => {
    const badAccounts = [];
    for(let e of accounts) {
       await checkAccount(e).catch(() => badAccounts.push(e))
    }
    resolve(badAccounts)
});

const captchaHandler = ({captcha_sid, captcha_img, resolve:solve, vk}) => {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    rl.question(`Введите капчу для картинки ${captcha_img} `, (key) => {

        // Когда вводится капча в консоль, пробуем решить капчу
        solve(key).then(() => {

            console.log('Капча решена корректно!')

        }).catch(({err, reCall: tryNewCall}) => {

            // Иначе капча не решена, стоит попробовать снова
            console.log('Капче не решена!!!\nПробуем занова')
            tryNewCall()
        })

    })
};

module.exports = {
    readJsonFile: readJsonFile,
    saveFile: saveFile,
    openCards: openCards,
    getItems: getItems,
    openCard: openCard,
    checkAccounts: checkAccounts,
    takeItemsFromOneAccount: takeItemsFromOneAccount
};