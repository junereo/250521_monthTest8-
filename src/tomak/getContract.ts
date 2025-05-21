import Web3 from 'web3';
import { AbiItem } from 'web3-utils';
import TomakNFT from '../../truffle/build/contracts/TomakNFT.json';

const getContract = () => {
  const tomakNftTokenAddress = '0x7204a101b6a6ebd994770df40e5c30f1fa6cfe41';
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