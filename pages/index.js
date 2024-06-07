import { useState, useEffect } from "react";
import { ethers } from "ethers";
import atm_abi from "../artifacts/contracts/Assessment.sol/Assessment.json";

export default function HomePage() {
  const [ethWallet, setEthWallet] = useState(undefined);
  const [account, setAccount] = useState(undefined);
  const [atm, setATM] = useState(undefined);
  const [balance, setBalance] = useState(undefined);
  const [selectedCoffee, setSelectedCoffee] = useState("");
  const [purchaseTimes, setPurchaseTimes] = useState([]);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);
  const [showPurchases, setShowPurchases] = useState(false);

  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const atmABI = atm_abi.abi;

  const coffeePrices = {
    "Iced Caramel Macchiato": 220,
    "Iced Vanila": 180,
    "Iced Oreo Cheesecake": 170,
    "Hot Americano": 250,
    "Matcha Queen Cappuccino": 100,
    "Brew Special": 150,
    "Coffee Fudge": 200,
  };

  const getWallet = async () => {
    if (window.ethereum) {
      setEthWallet(window.ethereum);
    }

    if (ethWallet) {
      const account = await ethWallet.request({ method: "eth_accounts" });
      handleAccount(account);
    }
  };

  const handleAccount = (account) => {
    if (account) {
      console.log("Account connected: ", account);
      setAccount(account);
    } else {
      console.log("No account found");
    }
  };

  const connectAccount = async () => {
    if (!ethWallet) {
      alert('MetaMask wallet is required to connect');
      return;
    }

    const accounts = await ethWallet.request({ method: 'eth_requestAccounts' });
    handleAccount(accounts);

    // once wallet is set we can get a reference to our deployed contract
    getATMContract();
  };

  const getATMContract = () => {
    const provider = new ethers.providers.Web3Provider(ethWallet);
    const signer = provider.getSigner();
    const atmContract = new ethers.Contract(contractAddress, atmABI, signer);

    setATM(atmContract);
  };

  const getBalance = async () => {
    if (atm) {
      setBalance((await atm.getBalance()).toNumber());
    }
  };

  const deposit = async () => {
    if (atm) {
      let tx = await atm.deposit(1000);
      await tx.wait();
      getBalance();
    }
  };

  const withdraw = async () => {
    if (atm) {
      let tx = await atm.withdraw(300);
      await tx.wait();
      getBalance();
    }
  };

  const getAll = async () => {
    if (atm && balance !== undefined) {
      // Withdraw entire balance
      let tx = await atm.withdraw(balance);
      await tx.wait();
      getBalance();
    }
  };

  const buyCoffee = async () => {
    if (atm && selectedCoffee) {
      const price = coffeePrices[selectedCoffee];
      if (balance >= price) {
        let tx = await atm.withdraw(price);
        await tx.wait();
        getBalance();
        setPurchaseTimes([...purchaseTimes, { time: new Date().toLocaleString(), coffee: selectedCoffee, price: price }]);
        setPurchaseSuccess(true);
        alert(`You have successfully bought ${selectedCoffee}`);
      } else {
        alert("Insufficient balance to buy this coffee.");
      }
    }
  };

  const canBuy = () => {
    const price = coffeePrices[selectedCoffee];
    return balance !== undefined && selectedCoffee && price !== undefined
      ? balance >= price
        ? "You can buy this Coffee"
        : "You cannot buy this Coffee"
      : "";
  };

  const toggleShowPurchases = () => {
    setShowPurchases(!showPurchases);
  };

  const initUser = () => {
    // Check to see if user has Metamask
    if (!ethWallet) {
      return <p>Please install Metamask in order to use this ATM.</p>;
    }

    // Check to see if user is connected. If not, connect to their account
    if (!account) {
      return <button className="button connect" onClick={connectAccount}>Let's Click the button to continue to Adam's Coffee Shop</button>;
    }

    if (balance === undefined) {
      getBalance();
    }

    return (
      <div>
        <p>Your Account: {account}</p>
        <p>Your Balance: {balance}</p>
        <button className="button deposit" onClick={deposit}>Deposit 1000 ETH</button>
        <button className="button withdraw" onClick={withdraw}>Withdraw 300 ETH</button>
        <button className="button getAll" onClick={getAll}>Accumulate all the Tokens</button>
        <div>
          <select className="select-coffee" value={selectedCoffee} onChange={(e) => setSelectedCoffee(e.target.value)}>
            <option disabled value="">Select Coffee</option>
            {Object.keys(coffeePrices).map(coffee => (
              <option key={coffee} value={coffee}>{coffee}</option>
            ))}
          </select>
          {selectedCoffee && (
            <div>
              <p>Price: {coffeePrices[selectedCoffee]} ETH</p>
              <p>{canBuy()}</p>
              <button className="button buy" onClick={buyCoffee}>Buy Coffee</button>
              {purchaseSuccess && (
                <button className="button toggle" onClick={toggleShowPurchases}>
                  {showPurchases ? "Hide Purchases" : "Show Purchases"}
                </button>
              )}
            </div>
          )}
        </div>
        {showPurchases && (
          <div>
            <h2>Purchases</h2>
            <ul className="purchase-times-list">
              {purchaseTimes.map((purchase, index) => (
                <li key={index}>
                  {`Time: ${purchase.time}, Coffee: ${purchase.coffee}, Price: ${purchase.price} ETH`}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  useEffect(() => { getWallet(); }, []);

  return (
    <main className="container">
      <header><h1>Adam's Coffee Shop</h1></header>
      {initUser()}
      <style jsx>{`
        .container {
          text-align: center;
          background: linear-gradient(45deg, #ff6b6b, #f7b42c, #8e44ad, #3498db);
          padding: 20px;
          border-radius: 8px;
          font-family: Arial, sans-serif;
          background-size: 400% 400%;
          animation: gradient 15s ease infinite;
        }

        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        header {
          background: rgba(255, 255, 255, 0.7);
          color: #444;
          padding: 20px;
          border-radius: 8px;
          font-family: Arial, sans-serif;
        }

        .button {
          display: inline-block;
          margin: 10px;
          padding: 10px 20px;
          border-radius: 8px;
          border: none;
          cursor: pointer;
          font-size: 16px;
          background-color: #333;
          color: white;
          transition: background-color 0.3s ease, opacity 0.3s ease;
          font-family: Arial, sans-serif;
        }

        .button:hover {
          opacity: 0.8;
        }

        .purchase-times-list {
          list-style: none;
          padding: 0;
          text-align: center;
          font-family: Arial, sans-serif;
        }

        .select-coffee {
          margin: 10px;
          padding: 5px;
          border-radius: 4px;
          font-family: Arial, sans-serif;
        }

        p {
          color: #333;
          font-family: Arial, sans-serif;
        }

        h1, h2 {
          color: #444;
          font-family: Arial, sans-serif;
        }
      `}
      </style>
    </main>
  );
}
