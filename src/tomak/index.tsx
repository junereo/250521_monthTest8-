import { useEffect, useState } from 'react';
import getContract from './getContract';
import Web3 from 'web3';
import axios from 'axios';

const Tomak = () => {
  const [account, setAccount] = useState('');
  const [tokenId, setTokenId] = useState('');
  const [itemType, setitemType] = useState('');
  const [web3, setWeb3] = useState<Web3>();
  const [myNfts, setMyNfts] = useState<{ tokenId: string; image: string }[]>(
    []
  );
  const [allNfts, setAllNfts] = useState<{ tokenId: string; image: string; owner: string }[]>([]);

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
      await tomakNftTokenContract.methods.minting(tokenId).send({
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
      // 일단 총 발행량 확인
      // for문을 여기다가 돌리겠습니다.
      const maxTokenId:number = await tomakNftTokenContract.methods.getTotalSupply().call();
      const found: { tokenId:string, image: string}[] = [];
      // 지금 컨트랙트에 있는 NFT는 2개 발행했으니 총 발행량이 2
      for(let id:number = 0; id < maxTokenId; id++) {
        try {
          // 내 NFT니까 ownerOf로 id 전달하여 address를 가져오고 내 상태와 비교
          const owner:string = await tomakNftTokenContract.methods.ownerOf(id).call();
          if(owner.toLowerCase() === account.toLowerCase()) {
            // ipfs://bafybeif4zdkotbumzuh6pxv5fjcvn3f4ajsqn74kiggelsskk6t5iqjsse/0.json
            const uri:string = await tomakNftTokenContract.methods.tokenURI(id).call();
            // https://ipfs.io/ipfs/로 변환 
            const metadataUri = uri.replace("ipfs://", "https://ipfs.io/ipfs/");
            // https://ipfs.io/ipfs/bafybeif4zdkotbumzuh6pxv5fjcvn3f4ajsqn74kiggelsskk6t5iqjsse/0.json
            const { data } = await axios.get(metadataUri);
            const image = data.image.replace("ipfs://", "https://ipfs.io/ipfs/");
            // https://ipfs.io/ipfs/bafybeif4zdkotbumzuh6pxv5fjcvn3f4ajsqn74kiggelsskk6t5iqjsse/0.png
            found.push({ tokenId: id.toString(), image});
          }
        } catch (error) {
          // 해당 맥락은, 해당하는 내 토큰을 못찾았을 때, 다음 토큰을 찾을 수 있게끔 하는 코드
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
    const total: any = await tomakNftTokenContract.methods.getAllTokenIds().call();
    const found: { tokenId: string; image: string; owner: string }[] = [];

    for (let i = 0; i < total.length; i++) {
      const tokenId = total[i];
      try {
        const owner:string = await tomakNftTokenContract.methods.ownerOf(tokenId).call();
        const uri:string = await tomakNftTokenContract.methods.tokenURI(tokenId).call();

        const metadataUrl = uri.replace('ipfs://', 'https://ipfs.io/ipfs/');
        const { data } = await axios.get(metadataUrl);
        const image = data.image.replace('ipfs://', 'https://ipfs.io/ipfs/');
        found.push({ tokenId: tokenId.toString(), image, owner,});
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

  const purchaseNFT = async(tokenId: string) => {
    if(!web3 || !account) return;
    const price = web3.utils.toWei("1", "ether");
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
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">📦 내 NFT 보유 목록</h2>
          <button
            onClick={loadMyNFTsWithoutEnumerable}
            className="px-3 py-1 rounded-md bg-blue-500 text-white hover:bg-blue-600"
          >
            이미지 가져오기
          </button>
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