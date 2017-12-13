(function () {

    let web3 = new Web3(Web3.givenProvider || "http://localhost:8545");
    const JUNK_ITEMS = ["10 Ball", "13 Ball", "2 Ball", "5 Ball", "8 Ball", "Acoustic Guitar (Unique Item)", "Ashtray", "Baseball", "Baseball Glove", "Bent Tin Can*", "Bonesaw", "Butter Knife", "Camera", "Carton of Cigarettes (Used in Dead Money)", "Chessboard", "Cigarette", "Clipboard", "Coffee Mug", "Coffee Pot", "Conductor", "Counterfeit Bottle Caps", "Crutch", "Cue Ball", "Cup", "Damaged Garden Gnome", "Dinner Plate", "Dog Bowl", "Drinking Glass", "Earnings Clipboard", "Empty Nuka-Cola Bottle", "Empty Sunset Sarsaparilla Bottle", "Empty Whiskey Bottles", "Evil Gnome", "Finance Clipboard", "Firehose Nozzle", "Food Sanitizer", "Fork", "Glass Pitcher", "Green Plate", "Hammer", "Harmonica", "Hot Plate", "Intact Garden Gnome", "Iron", "Large Burned Book", "Large Destroyed Book", "Large Ruined Book", "Large Scorched Book", "Large Whiskey Bottle", "Lawn Mower Blade", "Leaf Blower", "Medical Clipboard", "Metal Cooking Pan", "Metal Cooking Pot", "Metal Spoon", "Milk Bottle", "Motorcycle Gas Tank", "Motorcycle Handbrake", "Ophthalmoscope", "Pack of Cigarettes", "Paint Gun", "Paperweight", "Pencil", "Plunger", "Pre-War Book", "Pre-war Money", "Rake", "Red Plate", "Scissors", "Sheet Music Book (Unique Item)", "Shot glass", "Small Burned Book", "Small Destroyed Book", "Small Ruined Book", "Small Scorched Book", "Spatula", "Steam Guage Assembly*", "Sunset Sarsaparilla Deputy Badge*", "Teddy Bear", "Tin Plate", "Toaster", "Toy Car", "Triangle", "Tweezers", "Vacuum Cleaner", "Whet Stone", "White Plate", "Wood Chipper"];
    const NETWORK_IDENTIFIER = "1513193707639";
    const MY_ADDRESS = "0xba723bae5b6427766152777a28739db0df1bc45f";
    let contractAddress;

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
                        from: MY_ADDRESS
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
                    from: MY_ADDRESS,
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
                    from: MY_ADDRESS,
                    to: contractAddress,
                    value: value
                })
                .then(res => {
                    console.log(res)
                    return res;
                });
        }
    }

    function seed() {
        return app.getTotalItems()
            .then(items => {
                if (items > 0) {
                    console.log("skipping seed, total items:", items);
                    throw `seed not needed`;
                }
                return items;
            })
            .then((items) => {
                let numToSeed = JUNK_ITEMS.length;
                let dumpedItemsPromises = [];
                for (let i = 1; i <= numToSeed; i++) {
                    dumpedItemsPromises.push(app.dumpInJunkyard(i, Math.ceil(Math.random() * 10000))
                        .then((res) => {
                            console.log("inserted", res)
                        })
                        .catch(err => console.log("failed to dump")))
                }
                return Promise.all(dumpedItemsPromises);
            })
            .catch(err => console.log(err));
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
                console.log("following are the retrieved items", items);
                return items;
            })
    }

    window.onload = function () {
        app.initContract()
            .then(seed)
            .then(refreshUI)
            // .then(() => app.getItemByIndex(2))
            // .then(item => {
            //     console.log("item id is ", item.id, "value is", item.value, "owner is", item.owner);
            //     return item;
            // })
            //.then((item) => buy(item.id, item.value))
            //.then(getContractBalance)
            .catch(err => console.log(err))
    }

})();