import { useEffect, useState } from "react";
import {
  connectWallet,
  getCurrentWalletConnected,
  mintNFT
} from "./utils/interact.js";
import axios from 'axios'
const contractABI = require('./contract-abi.json')
const abiDecoder = require('abi-decoder')
abiDecoder.addABI(contractABI);

const Minter = (props) => {

  //State variables
  const [walletAddress, setWallet] = useState("");
  const [status, setStatus] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [url, setURL] = useState("");
  const [tokenURIs, setTokenURIs] = useState([]);

  useEffect(() => {
    getWallet()
}, []);

    const getWallet = async () => {
        const {address, status} = await getCurrentWalletConnected();
        setWallet(address)
        setStatus(status);

        const response = await axios.get({
            url: 'https://api-ropsten.etherscan.io/api',
            params: {
                module: 'account',
                action:'tokenfttx',
                contractaddress: '0x4c4a07f737bf57f6632b6cab089b78f62385acae',
                address: '0xbeea8fb3e2679f591349636ec9165f9a7c42f881',
                startblock: 0,
                endblock: 999999999,
                sort: 'asc',
                apikey: 'DC51XFPUZ5NIRA2QCG9IVKRR4BK42RBS32'
            }
        })
        const tokenURIs = []

        for (const transaction of response.data.result) {
            const transactionDetails = await window.ethereum.request({
                method: 'eth_getTransactionByHash',
                params: [transaction.hash]
            })
            const tokenURI = abiDecoder.decodeMethod(transactionDetails.input).params[1].value;
            const result = (await axios.get(tokenURI)).data
            tokenURIs.push(result)
        }
        setTokenURIs(tokenURIs)
        addWalletListener();
    }

  const connectWalletPressed = async () => {
    const walletResponse = await connectWallet();
    setStatus(walletResponse.status);
    setWallet(walletResponse.address);
  };

  const onMintPressed = async () => {
    const { status } = await mintNFT(url, name, description);
    setStatus(status);
};

  function addWalletListener() {
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", (accounts) => {
        if (accounts.length > 0) {
          setWallet(accounts[0]);
          setStatus("👆🏽 Write a message in the text-field above.");
        } else {
          setWallet("");
          setStatus("🦊 Connect to Metamask using the top right button.");
        }
      });
    } else {
      setStatus(
        <p>
          {" "}
          🦊{" "}
          <a target="_blank" href={`https://metamask.io/download.html`}>
            You must install Metamask, a virtual Ethereum wallet, in your
            browser.
          </a>
        </p>
      );
    }
  }

  return (
    <div className="Minter">
      <button id="walletButton" onClick={connectWalletPressed}>
        {walletAddress.length > 0 ? (
          "Connected: " +
          String(walletAddress).substring(0, 6) +
          "..." +
          String(walletAddress).substring(38)
        ) : (
          <span>Connect Wallet</span>
        )}
      </button>

      <br></br>
      <h1 id="title">🧙‍♂️ Alchemy NFT Minter</h1>
      <p>
        Simply add your asset's link, name, and description, then press "Mint."
      </p>
      <form>
        <h2>🖼 Link to asset: </h2>
        <input
          type="text"
          placeholder="e.g. https://gateway.pinata.cloud/ipfs/<hash>"
          onChange={(event) => setURL(event.target.value)}
        />
        <h2>🤔 Name: </h2>
        <input
          type="text"
          placeholder="e.g. My first NFT!"
          onChange={(event) => setName(event.target.value)}
        />
        <h2>✍️ Description: </h2>
        <input
          type="text"
          placeholder="e.g. Even cooler than cryptokitties ;)"
          onChange={(event) => setDescription(event.target.value)}
        />
      </form>
      <button id="mintButton" onClick={onMintPressed}>
        Mint NFT
      </button>
      <p id="status">
        {status}
      </p>
      <br/>
      <br/>
      <br/>
      <br/>
      <h1>My NFT's:</h1>
        {tokenURIs.filter(uri => !uri.image.startsWith('https://test')).map(uri => <div><h3>{uri.name}</h3><p>Description: {uri.description}</p><img alt="An image of an NFT" src={uri.image} width="500px"/><br/><br/><br/><br/></div>)}
    </div>
  );
};

export default Minter;
