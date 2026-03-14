const contractAddress = "ThrincsDemoSBT";

const contractABI = [
  "function mintCertificate(address student, string metadataURI, string documentHash) external returns (uint256)",
  "function certificates(uint256) view returns (string metadataURI, string documentHash, address issuer, uint256 issuedAt)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function tokenURI(uint256 tokenId) view returns (string)",
  "event CertificateMinted(uint256 indexed tokenId, address indexed student, address indexed issuer, string metadataURI, string documentHash)"
];

const HARDHAT_CHAIN_ID_HEX = "0x7a69";
const HARDHAT_NETWORK_PARAMS = {
  chainId: HARDHAT_CHAIN_ID_HEX,
  chainName: "Hardhat Local",
  nativeCurrency: {
    name: "ETH",
    symbol: "ETH",
    decimals: 18
  },
  rpcUrls: ["http://127.0.0.1:8545"],
  blockExplorerUrls: []
};

let provider;
let signer;
let contract;
let connectedAccount = null;

const connectBtn = document.getElementById("connectBtn");
const walletStatus = document.getElementById("walletStatus");
const mintBtn = document.getElementById("mintBtn");
const mintStatus = document.getElementById("mintStatus");

const certificateResult = document.getElementById("certificateResult");
const certImage = document.getElementById("certImage");
const certName = document.getElementById("certName");
const certDescription = document.getElementById("certDescription");
const certTokenId = document.getElementById("certTokenId");
const certOwner = document.getElementById("certOwner");
const certIssuer = document.getElementById("certIssuer");
const certHash = document.getElementById("certHash");
const certMetadata = document.getElementById("certMetadata");
const certTx = document.getElementById("certTx");
const certAttributes = document.getElementById("certAttributes");
const verifyLink = document.getElementById("verifyLink");

connectBtn.addEventListener("click", async () => {
  try {
    if (!window.ethereum) {
      walletStatus.innerHTML = '<span class="error">MetaMask no detectado</span>';
      return;
    }

    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: HARDHAT_CHAIN_ID_HEX }]
      });
    } catch (switchError) {
      if (switchError.code === 4902) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [HARDHAT_NETWORK_PARAMS]
        });

        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: HARDHAT_CHAIN_ID_HEX }]
        });
      } else {
        throw switchError;
      }
    }

    provider = new ethers.BrowserProvider(window.ethereum);
    const accounts = await provider.send("eth_requestAccounts", []);
    signer = await provider.getSigner();
    connectedAccount = accounts[0];

    const network = await provider.getNetwork();
    if (Number(network.chainId) !== 31337) {
      walletStatus.innerHTML = '<span class="error">MetaMask no está en Hardhat Local</span>';
      return;
    }

    contract = new ethers.Contract(contractAddress, contractABI, signer);

    walletStatus.innerHTML = `
      <span class="success">Wallet conectada:</span><br>
      ${connectedAccount}<br>
      <span class="success">Red:</span> Hardhat Local
    `;
  } catch (error) {
    walletStatus.innerHTML = `<span class="error">${error.shortMessage || error.message}</span>`;
  }
});

mintBtn.addEventListener("click", async () => {
  try {
    if (!contract) {
      mintStatus.innerHTML = '<span class="error">Primero conecta tu wallet</span>';
      return;
    }

    const network = await provider.getNetwork();
    if (Number(network.chainId) !== 31337) {
      mintStatus.innerHTML = '<span class="error">Cambia MetaMask a Hardhat Local antes de mintear</span>';
      return;
    }

    const studentAddress = document.getElementById("studentAddress").value.trim();
    const metadataURI = document.getElementById("metadataURI").value.trim();
    const documentHash = document.getElementById("documentHash").value.trim();

    if (!studentAddress || !metadataURI || !documentHash) {
      mintStatus.innerHTML = '<span class="error">Completa todos los campos</span>';
      return;
    }

    mintStatus.innerHTML = "Enviando transacción...";
    const tx = await contract.mintCertificate(studentAddress, metadataURI, documentHash);
    const receipt = await tx.wait();

    let tokenId = null;
    for (const log of receipt.logs) {
      try {
        const parsed = contract.interface.parseLog(log);
        if (parsed && parsed.name === "CertificateMinted") {
          tokenId = parsed.args.tokenId.toString();
          break;
        }
      } catch (e) {}
    }

    if (!tokenId) {
      const latestGuess = receipt.logs.length;
      tokenId = String(latestGuess || 1);
    }

    const certData = await contract.certificates(tokenId);
    const owner = await contract.ownerOf(tokenId);
    const tokenUri = await contract.tokenURI(tokenId);

    const metadataRes = await fetch(tokenUri);
    const metadata = await metadataRes.json();

    certImage.src = metadata.image;
    certName.textContent = metadata.name || "Thrincs Certificate";
    certDescription.textContent = metadata.description || "";
    certTokenId.textContent = tokenId;
    certOwner.textContent = owner;
    certIssuer.textContent = certData.issuer;
    certHash.textContent = certData.documentHash;
    certMetadata.href = tokenUri;
    certMetadata.textContent = tokenUri;
    certTx.textContent = tx.hash;
    verifyLink.href = `/verify.html?tokenId=${tokenId}`;

    certAttributes.innerHTML = "";
    if (metadata.attributes && metadata.attributes.length) {
      metadata.attributes.forEach((attr) => {
        const item = document.createElement("div");
        item.className = "meta-item";
        item.innerHTML = `
          <strong>${attr.trait_type}</strong>
          <div>${attr.value}</div>
        `;
        certAttributes.appendChild(item);
      });
    }

    certificateResult.style.display = "block";

    mintStatus.innerHTML = `
      <span class="success">NFT creado correctamente ✅</span><br>
      TX: ${tx.hash}<br>
      Token ID: ${tokenId}
    `;
  } catch (error) {
    mintStatus.innerHTML = `<span class="error">${error.shortMessage || error.message}</span>`;
  }
});