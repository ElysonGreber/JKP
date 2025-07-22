const contratoEndereco = "0x3bc688b1058164A23C63Af5A5c96af88b9b0BAB5"; // <--- atualize após o deploy
const abi = [{
    "inputs": [],
    "name": "comprar",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
}];

async function comprarToken() {
    if (typeof window.ethereum === 'undefined') {
        alert("MetaMask não está disponível!");
        return;
    }

    const web3 = new Web3(window.ethereum);
    await ethereum.request({ method: 'eth_requestAccounts' });
    const contas = await web3.eth.getAccounts();

    const contrato = new web3.eth.Contract(abi, contratoEndereco);

    try {
        const tx = await contrato.methods.comprar().send({
            from: contas[0],
            value: web3.utils.toWei("0.001", "ether")
        });
        alert("Token comprado com sucesso!");
        console.log(tx);
    } catch (err) {
        console.error(err);
        alert("Erro ao comprar token");
    }
}