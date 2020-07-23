const express = require("express");
const {readJsonFile, saveFile, openCard, openCards, getItems, checkAccounts, takeItemsFromOneAccount} = require("./index.js");
const app = express();
const cors = require("cors");

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());

app.get("/getData", async (req, res) => {
    const data = readJsonFile("./accounts.json");
    res.send(data)
});
app.get("/getByLogin/:id", (req, res) => {
    const data = readJsonFile("./accounts.json");
    res.send(data.find(e => e.login === req.param("id")))
});
app.get("/openCard/:id", async (req, res) => {
    const id = req.param("id");
    const data = readJsonFile("./accounts.json");
    const newData = await openCard(data.find(el => el.login === id));
    const newJsonData = data.map(el => el.login.toString() === id.toString() ? newData : el);
    saveFile("./accounts.json", newJsonData);
    res.send(newData)
});
app.post("/addAccount", (req, res) => {
   const account = req.body;
   if(account.login && account.password && account.token) {
       const data = readJsonFile("./accounts.json");
       const newData = [...data, account];
       saveFile("./accounts.json",newData);
   }
   res.send("OK")
});
app.get("/deleteAccount/:id", (req, res) => {
    const data = readJsonFile("./accounts.json");
    const newData = data.filter(el => el.login.toString() !== req.param("id").toString());
    saveFile("./accounts.json", newData);
    res.send()
});
app.get("/openCards", (req, res) => {
    const data = readJsonFile("./accounts.json");
    openCards(data).then(() => {
        res.send("OK")
    })
});
app.get("/getItems", (req, res) => {
   const data = readJsonFile("./accounts.json");
   getItems(data).then(e => {
       saveFile("./accounts.json", e);
       res.send("OK")
   })
});
app.get("/checkAccounts", (req, res) => {
    const accounts = readJsonFile("./accounts.json");
    checkAccounts(accounts).then(e => {
        res.send(e)
    })
});
app.post("/getItem", (req, res) => {
    try{
        const data = readJsonFile("./accounts.json");
        const account = data.find(el => el.login.toString() === req.body.login);
        if(account) {
            takeItemsFromOneAccount("vladyxa111", "343370728", account).then(e => {
                const newData = data.map(el => el.login === req.body.login ? {...el, data: []} : el);
                saveFile("./accounts.json", newData);
                res.send("OK")
            }).catch(e => console.error(e))
        }
    } catch (e) {
        console.error(e)
    }

});


app.listen(3001, console.log("started!"));