import { useEffect, useState } from 'react';
import getContract from './getContract';
import Web3 from 'web3';
import axios from 'axios';

type TokenInfoResult = {
  tokenIds: string[];
  uris: string[];
};

const Tomak = () => {
  const [account, setAccount] = useState('');
  const [tokenId, setTokenId] = useState('');
  const [web3, setWeb3] = useState<Web3>();
  const [myNfts, setMyNfts] = useState<{ tokenId: string; image: string, itemType:bigint, index:bigint }[]>(
    []
  );
  const [allNfts, setAllNfts] = useState<{ tokenId: string, image: string, itemType:bigint, index:bigint, owner: string }[]>([]);

  const { 
    tomakNftTokenAddress, 
    tomakNftTokenContract 
  } = getContract();

  useEffect(() => {
    if (window.ethereum) {
      const instance = new Web3(window.ethereum);
      setWeb3(instance);
    } else {
      alert('Metamask가 설치되어 있지 않습니다.');
    }
  }, []);

  const connectWallet = async () => {
    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts',
    });
    const selectedAddress = accounts[0];
    setAccount(selectedAddress);
  };

  const minting = async () => {
    if (!web3) return;
    try {
      await tomakNftTokenContract.methods.minting(tokenId, String("")).send({
        from: account
      });
      alert("NFT 발급 완료");
    } catch (error) {
      console.log(error);
    }
  }

  const loadMyNFTsWithoutEnumerable = async() => {
    if(!web3 || !account) return;
    try {

      const maxTokenId:bigint[] = await tomakNftTokenContract.methods.getOwnedTokenIds(account).call();

      console.log("maxTokenId", maxTokenId.length);
      const found: { tokenId:string, image: string, itemType:bigint, index:bigint }[] = [];
      for(let id:number = 0; id < maxTokenId.length; id++) {
        try {
          const owner:string = await tomakNftTokenContract.methods.ownerOf(maxTokenId[id]).call();
          if(owner.toLowerCase() === account.toLowerCase()) {
            const uri:string = await tomakNftTokenContract.methods.tokenURI(maxTokenId[id]).call();
            const metadataUri = uri.replace("ipfs://", "https://ipfs.io/ipfs/");
            const { data } = await axios.get(metadataUri);
            const image = data.image.replace("ipfs://", "https://ipfs.io/ipfs/");
            const { itemType, index } = decodeTokenId(maxTokenId[id]);
            found.push({ tokenId: maxTokenId[id].toString(), image, itemType, index});
          }
        } catch (error) {
          console.log(error);
          continue;
        }
      }
      setMyNfts(found);
    } catch (error) {
      console.log(`내 NFT 조회 오류 : ${error}`);
    }
  }

  
  const loadAllNFTs = async () => {
  if (!web3 || !account) return;

  try {
    const result = await tomakNftTokenContract.methods.getAllTokenInfos().call() as TokenInfoResult;
    const found: { tokenId: string, image: string, itemType:bigint, index:bigint, owner: string }[] = [];
    const tokenIds: bigint[] = result.tokenIds.map((id: string) => BigInt(id));
    const uris: string[] = result.uris;
    console.log("result", result);
    console.log("tokenIds", tokenIds);
    console.log("uris", uris);

    for (let i = 0; i < tokenIds.length; i++) {
      const tokenId = tokenIds[i];
      try {
        const owner:string = await tomakNftTokenContract.methods.ownerOf(tokenId).call();
        const uri:string = await tomakNftTokenContract.methods.tokenURI(tokenId).call();

        const metadataUrl = uri.replace('ipfs://', 'https://ipfs.io/ipfs/');
        const { data } = await axios.get(metadataUrl);
        const image = data.image.replace('ipfs://', 'https://ipfs.io/ipfs/');
        const { itemType, index } = decodeTokenId(tokenId);

        found.push({ tokenId: tokenId.toString(), image, itemType, index, owner});
      } catch (err) {
        console.log(err)
        continue;
      }
    }
      setAllNfts(found);
    } catch (err) {
      console.error('전체 NFT 조회 실패:', err);
    }
  };

  const approveToken = async(tokenId: string) => {
    if(!web3 || !account) return;
    try {
      await tomakNftTokenContract.methods.approve(tomakNftTokenAddress, tokenId)
      .send({ from: account});
      alert("판매 등록 완료(권한 위임 완료)")
    } catch (error) {
      console.log("판매 등록 실패", error);
    }
  }

  const approveAllOwnedTokens = async () => {
    if (!web3 || !account) return;
  
    try {
      const tokenIds: string[] = await tomakNftTokenContract.methods
        .getOwnedTokenIds(account)
        .call();
  
      for (const tokenId of tokenIds) {
        await tomakNftTokenContract.methods
          .approve(tomakNftTokenAddress, tokenId)
          .send({ from: account });
  
        console.log(`Token ID ${tokenId} 승인 완료`);
      }
  
      alert("모든 NFT 개별 승인 완료");
    } catch (error) {
      console.error("일괄 승인 실패", error);
    }
  };

  const purchaseNFT = async(tokenId: string) => {
    if(!web3 || !account) return;
    const price = web3.utils.toWei("0.0001", "ether");
    try {
      await tomakNftTokenContract.methods.purchase(tokenId).send({
        from: account,
        value: price
      })
      alert("구매 완료!");
    } catch (error) {
      console.log(error);
    }
  }

  function decodeTokenId(tokenId: bigint): { itemType: bigint; index: bigint } {
    const shiftBits = 128n;
    const mask = (1n << shiftBits) - 1n;
  
    const itemType = tokenId >> shiftBits;
    const index = tokenId & mask;
  
    return { itemType, index };
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-10 font-sans text-gray-900">
      <h1 className="text-3xl font-bold text-blue-600">Tomak NFT</h1>
  
      {/* 사용자 정보 */}
      <section className="p-4 rounded-xl bg-gray-100 shadow">
        <h2 className="text-lg font-semibold mb-2">👤 사용자 정보</h2>
        <p className="text-sm text-gray-700">
          {account !== '0x...' ? account : '지갑이 연결되지 않았습니다.'}
        </p>
        <button
          className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
          onClick={connectWallet}
        >
          🦊 메타마스크 지갑 연결
        </button>
      </section>
  
      {/* NFT 민팅 */}
      <section className="p-4 rounded-xl bg-gray-100 shadow space-y-3">
        <h2 className="text-lg font-semibold">🛒 NFT 민팅</h2>
        <input
          type="text"
          placeholder="발급할 NFT ID"
          value={tokenId}
          onChange={(e) => setTokenId(e.target.value)}
          className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          onClick={minting}
          className="w-full mt-2 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-indigo-500 text-white hover:bg-indigo-600"
        >
          🎁 NFT 민팅하기
        </button>
      </section>
  
      {/* 내가 가진 NFT들 */}
      <section className="p-4 rounded-xl bg-gray-100 shadow space-y-3">
        <div>
          <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">📦 내 NFT 보유 목록</h2>
          <button
            onClick={loadMyNFTsWithoutEnumerable}
            className="px-3 py-1 rounded-md bg-blue-500 text-white hover:bg-blue-600"
          >
            이미지 가져오기
          </button>
          </div>
          <div>
          {myNfts.length === 0 ? (
              <p className="text-sm text-gray-500">NFT 없음</p>
            ) : (

                <button
                  onClick={() => approveAllOwnedTokens()}
                  className="mt-2 w-full text-sm py-1 px-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                >
                  모두 판매하려고 내놓기
                </button>)}
          </div>
        </div>
  
        {myNfts.length === 0 ? (
          <p className="text-sm text-gray-500">보유한 NFT가 없습니다.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {myNfts.map((nft) => (
              <div key={nft.tokenId} className="bg-white p-3 rounded-lg shadow">
                <img
                  src={nft.image}
                  alt={`NFT ${nft.tokenId}`}
                  className="w-full h-auto rounded-md"
                />
                <p className="mt-2 text-sm font-medium">Token ID: {nft.tokenId}</p>
                <p className="text-sm font-medium">ItemType: {nft.itemType}</p>
                <p className="text-sm font-medium">Mint Number: {nft.index}</p>
                <button
                  onClick={() => approveToken(nft.tokenId)}
                  className="mt-2 w-full text-sm py-1 px-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                >
                  판매하려고 내놓기
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
  
      {/* 전체 NFT 목록 */}
      <section className="p-4 rounded-xl bg-gray-100 shadow space-y-3">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">🌍 전체 NFT 목록</h2>
          <button
            onClick={loadAllNFTs}
            className="px-3 py-1 rounded-md bg-blue-500 text-white hover:bg-blue-600"
          >
            이미지 가져오기
          </button>
        </div>
  
        {allNfts.length === 0 ? (
          <p className="text-sm text-gray-500">NFT 없음</p>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {allNfts.map((nft) => (
              <div key={nft.tokenId} className="bg-white p-3 rounded-lg shadow">
                <img
                  src={nft.image}
                  alt={`NFT ${nft.tokenId}`}
                  className="w-full h-auto rounded-md"
                />
                <p className="mt-2 text-sm font-medium">Token ID: {nft.tokenId}</p>
                <p className="text-sm font-medium">ItemType: {nft.itemType}</p>
                <p className="text-sm font-medium">Mint Number: {nft.index}</p>

                <p className="text-xs text-gray-600">소유자: {nft.owner}</p>
                {nft.owner.toLowerCase() !== account.toLowerCase() && (
                  <button
                    onClick={() => purchaseNFT(nft.tokenId)}
                    className="mt-2 w-full text-sm py-1 px-2 bg-green-500 text-white rounded hover:bg-green-600"
                  >
                    🛒 구매하기
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
  
};

export default Tomak;