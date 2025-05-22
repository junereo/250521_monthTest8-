const TomakNFT = artifacts.require("TomakNFT");

module.exports = function (deployer) {
  deployer.deploy(TomakNFT, "TomakNFT", "TMK");
};
