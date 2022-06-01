import { ethers } from "ethers";
import React, { useCallback, useEffect, useState } from "react";
import "./App.css";
import abi from "./utils/WavePortalABI.json";

export default function App() {
  const [currentAccount, setCurrentAccount] = useState("");
  const [allWaves, setAllWaves] = useState([]);
  const [msg, setMsg] = useState([]);
  const [totalWaves, setTotalWaves] = useState();

  const contractAddress = "0xd92d79AD8Ecd0744cF0a7CFeF7A83B667eBF7Fa7";
  const contractABI = abi.abi;

  const getWaves = useCallback(() => {
    const getAllWaves = async () => {
      try {
        const { ethereum } = window;
        if (ethereum) {
          const provider = new ethers.providers.Web3Provider(ethereum);
          const signer = provider.getSigner();
          const wavePortalContract = new ethers.Contract(
            contractAddress,
            contractABI,
            signer
          );

          const waves = await wavePortalContract.getAllWaves();
          const count = await wavePortalContract.getTotalWaves();

          setTotalWaves(count.toNumber());

          let wavesCleaned = [];
          waves.forEach((wave) => {
            wavesCleaned.push({
              address: wave.waver,
              timestamp: new Date(wave.timestamp * 1000),
              message: wave.message,
            });
          });

          setAllWaves(wavesCleaned);
        } else {
          console.log("Ethereum object doesn't exist!");
        }
      } catch (error) {
        console.log(error);
      }
    };
    getAllWaves();
  }, [contractABI]);
  const checkIfWalletIsConnected = useCallback(() => {
    const check = async () => {
      try {
        const { ethereum } = window;

        if (!ethereum) {
          console.log("Make sure you have metamask!");
          return;
        } else {
          console.log("ethereum object", ethereum);
        }

        const accounts = await ethereum.request({ method: "eth_accounts" });

        if (accounts.length !== 0) {
          const account = accounts[0];
          console.log("Found an authorized account:", account);
          setCurrentAccount(account);
          getWaves();
        } else {
          console.log("No authorized account found");
        }
      } catch (error) {
        console.log(error);
      }
    };
    check();
  }, [getWaves]);

  useEffect(() => {
    let wavePortalContract;

    const onNewWave = (from, timestamp, message) => {
      console.log("NewWave", from, timestamp, message);
      setAllWaves((prevState) => [
        ...prevState,
        {
          address: from,
          timestamp: new Date(timestamp * 1000),
          message: message,
        },
      ]);
    };

    const onTotalWaves = (total) => {
      console.log("TotalWaves", total);
      setTotalWaves(total.toNumber());
    };

    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      wavePortalContract = new ethers.Contract(
        contractAddress,
        contractABI,
        signer
      );

      wavePortalContract.on("NewWave", onNewWave);
      wavePortalContract.on("TotalWaves", onTotalWaves);
    }

    return () => {
      if (wavePortalContract) {
        wavePortalContract.off("NewWave", onNewWave);
        wavePortalContract.off("TotalWaves", onTotalWaves);
      }
    };
  }, [contractABI]);

  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }

      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });

      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.log(error);
    }
  };

  const wave = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );

        const waveTxn = await wavePortalContract.wave(msg, {
          gasLimit: 300000,
        });
        console.log("Mining...", waveTxn.hash);

        await waveTxn.wait();
        console.log("Mined -- ", waveTxn.hash);
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    checkIfWalletIsConnected();
  }, [checkIfWalletIsConnected]);

  return (
    <div className="mainContainer">
      <div className="dataContainer">
        <div className="header">
          <span role="img" aria-label="bye">
            👋
          </span>
          Hey there!
        </div>

        <div className="bio">
          I am wesley and I'm learning web3 so that's pretty cool right? Connect
          your Ethereum wallet and wave at me!
        </div>

        <div className="contract-link">
          <a
            target="_blank"
            rel="noopener noreferrer"
            href={`https://rinkeby.etherscan.io/address/${contractAddress}`}
          >
            Check the contract at Etherscan.io
          </a>
        </div>

        {totalWaves > 0 && (
          <div className="count">{`Total waves: ${totalWaves}`}</div>
        )}

        <div className="input">
          <input
            name="msg"
            type="text"
            placeholder="type your message here..."
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
          />
        </div>

        {!currentAccount ? (
          <button className="waveButton" onClick={connectWallet}>
            Connect Wallet
          </button>
        ) : (
          <button className="waveButton" onClick={wave}>
            Wave at Me
          </button>
        )}
        {allWaves
          .sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1))
          .map((wave, index) => {
            return (
              <div key={index}>
                <hr className="dashed" />
                <div className="waves">
                  <div>Address: {wave.address}</div>
                  <div>Time: {wave.timestamp.toString()}</div>
                  <div>Message: {wave.message}</div>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
