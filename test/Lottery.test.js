const assert = require('assert');
const ganache = require('ganache-cli');
const Web3 = require('web3');
const web3 = new Web3(ganache.provider());

const { interface, bytecode } = require('../compile');

let lottery, accounts;

beforeEach(async () => {
    accounts = await web3.eth.getAccounts();

    lottery = await new web3.eth.Contract(JSON.parse(interface))
                        .deploy({ data: bytecode })
                        .send({ from: accounts[0], gas: '1000000'});
});

describe('Lottery contract', ()=>{
    it('deploys a contract', () => {
        assert.ok(lottery.options.address);
    });

    it('allows one account to enter', async ()=>{
        await lottery.methods.enter().send({
            from: accounts[1],
            value: web3.utils.toWei('0.2', 'ether')
        });

        const players = await lottery.methods.getPlayers().call();

        assert.equal(accounts[1], players[0]);
        assert.equal(1, players.length);
    });

    it('allows multiple accounts to enter', async ()=>{
        await lottery.methods.enter().send({
            from: accounts[1],
            value: web3.utils.toWei('0.2', 'ether')
        });
        await lottery.methods.enter().send({
            from: accounts[3],
            value: web3.utils.toWei('0.2', 'ether')
        });
        await lottery.methods.enter().send({
            from: accounts[4],
            value: web3.utils.toWei('0.2', 'ether')
        });

        const players = await lottery.methods.getPlayers().call();

        assert.equal(accounts[1], players[0]);
        assert.equal(accounts[3], players[1]);
        assert.equal(accounts[4], players[2]);
        assert.equal(3, players.length);
    });

    it('requires minimum amount from to enter', async() => {
        try {
            await lottery.methods.enter().send({
                from: accounts[2],
                value: web3.utils.toWei('0.0005', 'ether')  // Insufficient amount; the test should pass because I'm asserting for error 
                                                            // in the catch block

                //value: web3.utils.toWei('1', 'ether')     // Sufficient amount, expecting error because I want the test to fail
            });
        } catch (error) {
            assert(error);
            return;
        }

        assert(false);
    });

    it('Only manager picks a winner', async() => {
        const pickWinnerError = 'Expected an error and didn\'t get one!';

        try {
            await lottery.methods.pickWinner().send({
                from: accounts[0]
            });

            throw new Error(pickWinnerError);

        } catch (error) {
            //assert(error);
            // console.log(error);
            assert.notEqual(pickWinnerError, error.message);
        }
    });

    it('sends money to winner and resets player array', async() => {
        await lottery.methods.enter().send({
            from: accounts[8],
            value: web3.utils.toWei('2', 'ether')
        });

        const initialBalance = await web3.eth.getBalance(accounts[8]);

        await lottery.methods.pickWinner().send({ from: accounts[0] });

        const finalBalance = await web3.eth.getBalance(accounts[8]);

        const balDifference = finalBalance - initialBalance;

        assert(balDifference > web3.utils.toWei('1.9', 'ether'));
        
    });
});

