(function () {

    const web3 = new Web3(Web3.givenProvider || "http://localhost:8545");
    const JUNK_ITEMS = ["Acoustic Guitar", "Ashtray", "Baseball", "Baseball Glove", "Bent Tin Can*", "Bonesaw", "Butter Knife", "Camera", "Carton of Cigarettes (Used in Dead Money)", "Chessboard", "Cigarette", "Clipboard", "Coffee Mug", "Coffee Pot", "Conductor", "Counterfeit Bottle Caps", "Crutch", "Cue Ball", "Cup", "Damaged Garden Gnome", "Dinner Plate", "Dog Bowl", "Drinking Glass", "Earnings Clipboard", "Empty Nuka-Cola Bottle", "Empty Sunset Sarsaparilla Bottle", "Empty Whiskey Bottles", "Evil Gnome", "Finance Clipboard", "Firehose Nozzle", "Food Sanitizer", "Fork", "Glass Pitcher", "Green Plate", "Hammer", "Harmonica", "Hot Plate", "Intact Garden Gnome", "Iron", "Large Burned Book", "Large Destroyed Book", "Large Ruined Book", "Large Scorched Book", "Large Whiskey Bottle", "Lawn Mower Blade", "Leaf Blower", "Medical Clipboard", "Metal Cooking Pan", "Metal Cooking Pot", "Metal Spoon"];

    const NETWORK_IDENTIFIER = "1513255990079";
    let junkYardOwner, myAddress, contractAddress;

    let app = {
        junkyard: null,

        getContractABI: function () {
            return fetch("/contracts/Junkyard.json")
                .then(res => res.json())
                .then(meta => {
                    return {
                        abi: meta.abi,
                        address: meta.networks[NETWORK_IDENTIFIER].address
                    }
                });
        },

        initContract: function () {
            return this.getContractABI()
                .then(contractMata => {
                    contractAddress = contractMata.address;
                    let contract = new web3.eth.Contract(contractMata.abi, contractMata.address, {
                        from: myAddress
                    });
                    this.junkyard = contract;
                    return contract;
                })
        },

        getTotalItems: function () {
            return this.junkyard.methods
                .getTotalItems()
                .call();
        },

        dumpInJunkyard: function (itemId, itemValue) {
            return this.junkyard.methods.dump(itemId, itemValue)
                .send({
                    from: junkYardOwner,
                    gas: 500000
                });
        },

        getItemByIndex: function (index) {
            return this.junkyard.methods.getItemByIndex(index)
                .call()
                .then(item => {
                    return {
                        id: item[0],
                        value: item[1],
                        owner: item[2]
                    }
                });
        },

        buy: function (itemId, value) {
            return app.junkyard.methods.buy(itemId)
                .send({
                    from: myAddress,
                    to: contractAddress,
                    value: value
                });
        }
    }

    function seed() {
        return app.getTotalItems()
            .then(items => {
                if (items > 0) {
                    console.log("skipping seed, total items:", items);
                    return;
                }

                let numToSeed = JUNK_ITEMS.length;
                let dumpedItemsPromises = [];
                for (let i = 1; i <= numToSeed; i++) {
                    dumpedItemsPromises.push(app.dumpInJunkyard(i, Math.ceil(Math.random() * 100000))
                        .then((res) => {
                            console.log("inserted", res)
                        })
                        .catch(err => console.log("failed to dump")))
                }
                return Promise.all(dumpedItemsPromises);
            })
            .catch(err => console.error(err));
    }

    function getBalance(address) {
        return web3.eth.getBalance(address)
            .then(balance => {
                console.log(`address ${address} has balance ${balance}`);
                return balance;
            });
    }

    function refreshUI() {
        return app.getTotalItems()
            .then(totalItems => {
                let junkItemsPromises = [];

                for (i = 0; i < totalItems; i++) {
                    junkItemsPromises.push(app.getItemByIndex(i));
                }

                return Promise.all(junkItemsPromises);
            })
            .then(items => {
                return items.map((item, index) => Object.assign({}, item, { title: JUNK_ITEMS[index] }));
            })
            .then(items => {
                return items;
            })
            .then(items => {
                let template = document.querySelector("#template-items").innerHTML;

                return items.map(item => {
                    let content = template.replace(/{{title}}/, item.title)
                        .replace(/{{value}}/g, item.value)
                        .replace(/{{owner}}/, item.owner)
                        .replace(/{{id}}/, item.id);

                    return content;
                }).join("");
            })
            .then((content) => {
                document.querySelector("#items-to-buy").innerHTML = content;
            });
    }

    function displayAccountBalances() {
        return web3.eth.getAccounts()
            .then(accounts => {
                return Promise.all(
                    accounts.map(account => web3.eth.getBalance(account).then(balance => {
                        return {
                            account, balance
                        };
                    })));
            })
            .then(accountBalances => {
                let template = document.querySelector("#template-balances").innerHTML;

                return accountBalances.map(accountBalance => {
                    return template.replace(/{{account}}/, accountBalance.account).replace(/{{balance}}/, accountBalance.balance).replace(/{{class-name}}/, function (className) {
                        if (accountBalance.account.toLowerCase() === myAddress.toLowerCase())
                            return "text-danger";
                        else
                            return "text-primary";
                    });
                }).join("");
            })
            .then((balances) => {
                document.querySelector("#account-balance").innerHTML = balances;
            });
    }

    function wireUpBuyNow() {
        document.querySelectorAll(".buy-btn").forEach(button => {
            button.addEventListener("click", (event) => {
                let itemId = Number(event.target.dataset.id);
                let value = event.target.dataset.value;

                app.buy(itemId, value)
                    .then(refreshUI)
                    .then(displayAccountBalances)
                    .then(wireUpBuyNow)
                    .catch(err => {
                        console.error("are you serious?", err);
                    });
            });
        });
    }

    window.onload = function () {
        let state = sessionStorage.getItem("junkYard");
        if (state) {
            state = JSON.parse(state);
            junkYardOwner = state.junkYardOwner;
        }

        if ((junkYardOwner || (junkYardOwner = prompt("Enter JunkYard Owner Address")))
            && (myAddress = prompt("Enter Your Address"))) {

            sessionStorage.setItem("junkYard", JSON.stringify({
                junkYardOwner
            }));
            
            console.log("junkyard owner is", junkYardOwner);
            console.log("Your address is", myAddress);

            document.querySelector("#jyowner").innerHTML = `JunkYard Owner: ${junkYardOwner}`;
            document.querySelector("#myaddress").innerHTML = `My Address: ${myAddress}`;

            app.initContract()
                .then(seed)
                .then(refreshUI)
                .then(displayAccountBalances)
                .then(wireUpBuyNow)
                .catch(err => console.log(err))
        }
    }

})();