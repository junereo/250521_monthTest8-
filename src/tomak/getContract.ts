import Web3 from 'web3';
import { AbiItem } from 'web3-utils';
import TomakNFT from '../../truffle/build/contracts/TomakNFT.json';

const getContract = () => {
  const tomakNftTokenAddress = '0xdbE51Fb8B28C4a0C4Ac14168B4cCfd036EC82e2F';
  const web3 = new Web3(window.ethereum);

  const tomakNftTokenContract = new web3.eth.Contract(
    TomakNFT.abi as AbiItem[],
    tomakNftTokenAddress
  );

  return {
    tomakNftTokenAddress,
    tomakNftTokenContract,
  };
};

export default getContract;