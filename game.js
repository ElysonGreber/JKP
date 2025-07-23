const CONTRACT_ADDRESS = "0x86D78297067E2b9c5f1dF7C3Fa30F9CF1f006ab6";
const TOKEN_ADDRESS = "0x5DDED6D293111FD9967ED2835Ce905B1eb2c023E";

const abiContrato = [{
        inputs: [],
        name: "pagarParaJogar",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [{
            internalType: "uint8",
            name: "escolha",
            type: "uint8",
        }, ],
        name: "jogar",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [],
        name: "sacarPremio",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [{
            internalType: "address",
            name: "jogador",
            type: "address",
        }, ],
        name: "verUltimoResultado",
        outputs: [{
            internalType: "uint8",
            name: "",
            type: "uint8",
        }, ],
        stateMutability: "view",
        type: "function",
    },
    {
        anonymous: false,
        inputs: [{
                indexed: true,
                internalType: "address",
                name: "jogador",
                type: "address",
            },
            {
                indexed: false,
                internalType: "uint8",
                name: "jogadorEscolha",
                type: "uint8",
            },
            {
                indexed: false,
                internalType: "uint8",
                name: "contratoEscolha",
                type: "uint8",
            },
            {
                indexed: false,
                internalType: "uint8",
                name: "resultado",
                type: "uint8",
            },
        ],
        name: "JogoRealizado",
        type: "event",
    },
    {
        inputs: [{
            internalType: "address",
            name: "jogador",
            type: "address"
        }],
        name: "verHistorico",
        outputs: [{
            components: [{
                    internalType: "uint8",
                    name: "jogadorEscolha",
                    type: "uint8"
                },
                {
                    internalType: "uint8",
                    name: "contratoEscolha",
                    type: "uint8"
                },
                {
                    internalType: "uint8",
                    name: "resultado",
                    type: "uint8"
                },
                {
                    internalType: "uint256",
                    name: "timestamp",
                    type: "uint256"
                }
            ],
            internalType: "struct PedraPapelTesoura.Jogada[]",
            name: "",
            type: "tuple[]"
        }],
        stateMutability: "view",
        type: "function"
    },
];

const abiERC20 = [{
        constant: false,
        inputs: [{
                name: "spender",
                type: "address",
            },
            {
                name: "value",
                type: "uint256",
            },
        ],
        name: "approve",
        outputs: [{
            name: "",
            type: "bool",
        }, ],
        type: "function",
    },
    {
        constant: true,
        inputs: [{
            name: "owner",
            type: "address",
        }, ],
        name: "balanceOf",
        outputs: [{
            name: "",
            type: "uint256",
        }, ],
        type: "function",
    },
];

let web3, contrato, token, conta;
async function conectar() {
    if (!window.ethereum) {
        alert("Instale o Metamask.");
        return;
    }

    web3 = new Web3(window.ethereum);

    try {
        // Solicita conexão da carteira
        await ethereum.request({ method: "eth_requestAccounts" });

        // Força a rede Sepolia (chainId 11155111 -> 0xaa36a7)
        await ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: "0xaa36a7" }],
        });
    } catch (err) {
        // Se a rede Sepolia ainda não estiver adicionada ao MetaMask
        if (err.code === 4902) {
            try {
                await ethereum.request({
                    method: "wallet_addEthereumChain",
                    params: [{
                        chainId: "0xaa36a7",
                        chainName: "Sepolia Testnet",
                        nativeCurrency: {
                            name: "SepoliaETH",
                            symbol: "ETH",
                            decimals: 18,
                        },
                        rpcUrls: ["https://rpc.sepolia.org"],
                        blockExplorerUrls: ["https://sepolia.etherscan.io"],
                    }],
                });
            } catch (addErr) {
                console.error("Error adding Sepolia network:", addErr);
                return;
            }
        } else {
            console.error("Error switching network:", err);
            return;
        }
    }

    // Continua após conectar e garantir que está na rede correta
    const contas = await web3.eth.getAccounts();
    conta = contas[0];
    document.getElementById("conta").innerText = conta;

    contrato = new web3.eth.Contract(abiContrato, CONTRACT_ADDRESS);
    token = new web3.eth.Contract(abiERC20, TOKEN_ADDRESS);

    await atualizarSaldos();
    await exibirHistoricoJogadas();
    mostrarBotaoHistorico();

}

// async function conectar() {
//     if (window.ethereum) {
//         web3 = new Web3(window.ethereum);
//         await ethereum.request({
//             method: "eth_requestAccounts",
//         });
//         const contas = await web3.eth.getAccounts();
//         conta = contas[0];
//         document.getElementById("conta").innerText = conta;

//         contrato = new web3.eth.Contract(abiContrato, CONTRACT_ADDRESS);
//         token = new web3.eth.Contract(abiERC20, TOKEN_ADDRESS);
//     } else {
//         alert("Instale o Metamask.");
//     }
//     contrato = new web3.eth.Contract(abiContrato, CONTRACT_ADDRESS);
//     token = new web3.eth.Contract(abiERC20, TOKEN_ADDRESS);

//     await atualizarSaldos(); // <- chama aqui depois de conectar
// }

async function pagar() {
    const valor = web3.utils.toWei("1", "ether");
    try {
        await token.methods.approve(CONTRACT_ADDRESS, valor).send({
            from: conta,
        });
        await contrato.methods.pagarParaJogar().send({
            from: conta,
        });
        alert("Payment completed. Now play!");
    } catch (e) {
        console.error(e);
        alert("Payment error");
    }
}

async function jogar(escolha) {
    const spinner = document.getElementById("spinner");
    const resultadoEl = document.getElementById("resultado");
    const dueloEl = document.getElementById("duelo");
    const imgJogador = document.getElementById("img-jogador");
    const hashEl = document.getElementById("tx-hash");

    const imagens = ["pedra.png", "papel.png", "tesoura.png"];

    try {
        // Exibe a escolha do jogador imediatamente
        dueloEl.style.display = "block";
        imgJogador.src = imagens[escolha];
        imgJogador.alt = `Escolha do jogador: ${imagens[escolha].split(".")[0]}`;

        spinner.style.display = "block";
        resultadoEl.innerText = "";
        hashEl.innerHTML = "";
        document.getElementById("duelo-texto").innerText = "";

        await contrato.methods
            .jogar(escolha)
            .send({ from: conta })
            .on("receipt", async(tx) => {
                // ✅ Exibe o hash da transação com link pro Etherscan
                const hash = tx.transactionHash;
                hashEl.innerHTML = `Tx Hash: <a href="https://sepolia.etherscan.io/tx/${hash}" target="_blank">Check</a>`;

                let evento = null;

                if (
                    tx.events &&
                    tx.events.JogoRealizado &&
                    tx.events.JogoRealizado.returnValues
                ) {
                    evento = tx.events.JogoRealizado.returnValues;
                }

                if (evento) {
                    const jogadorEscolha = parseInt(evento.jogadorEscolha);
                    const contratoEscolha = parseInt(evento.contratoEscolha);
                    const resultado = parseInt(evento.resultado);

                    atualizarDuelo(jogadorEscolha, contratoEscolha);
                    mostrarResultado(resultado);
                } else {
                    const dados = await buscarUltimoEventoDaConta(conta);
                    if (dados) {
                        atualizarDuelo(dados.jogadorEscolha, dados.contratoEscolha);
                    }
                }

                const resultado = await contrato.methods
                    .verUltimoResultado(conta)
                    .call();

                mostrarResultado(resultado);
                await exibirHistoricoJogadas();

                // Se o jogador venceu (2), saca automaticamente
                if (parseInt(resultado) === 2) {
                    await sacar();
                }
            });
    } catch (e) {
        console.error(e);
        alert("Error playing the game");
    } finally {
        spinner.style.display = "none";
    }
}

async function buscarUltimoEventoDaConta(conta) {
    try {
        const latestBlock = await web3.eth.getBlockNumber();
        const fromBlock = Math.max(latestBlock - 5000, 0); // últimos 5000 blocos

        const eventos = await contrato.getPastEvents("JogoRealizado", {
            filter: { jogador: conta },
            fromBlock,
            toBlock: "latest",
        });

        if (eventos.length === 0) {
            console.log("No event found.");
            return null;
        }

        const ultimoEvento = eventos[eventos.length - 1];
        const dados = ultimoEvento.returnValues;

        return {
            jogadorEscolha: parseInt(dados.jogadorEscolha),
            contratoEscolha: parseInt(dados.contratoEscolha),
        };
    } catch (e) {
        console.error("Error fetching events:", e);
        return null;
    }
}


async function sacar() {
    try {
        await contrato.methods.sacarPremio().send({
            from: conta,
        });
        alert("Prize withdrawn!");
    } catch (e) {
        console.error(e);
        alert("Error withdrawing prize.");
    }
}

function mostrarResultado(resultado) {
    const r = parseInt(resultado);
    const txt = ["❌ Loss", "🤝 Draw", "🏆 Victory"];
    document.getElementById("resultado").innerText = txt[r];
}

function atualizarDuelo(jogador, contrato) {
    const nomes = ["Pedra", "Papel", "Tesoura"];
    const j = parseInt(jogador);
    const c = parseInt(contrato);
    document.getElementById("duelo").innerText =
        "Você jogou: " + nomes[j] + " | O contrato jogou: " + nomes[c];
}

async function atualizarSaldos() {
    try {
        // Saldo em ETH
        const saldoWei = await web3.eth.getBalance(conta);
        const saldoEth = web3.utils.fromWei(saldoWei, "ether");
        document.getElementById("saldo-eth").innerText = parseFloat(saldoEth).toFixed(4) + " ETH";

        // Saldo do token
        const saldoToken = await token.methods.balanceOf(conta).call();
        const saldoTokenFormatado = web3.utils.fromWei(saldoToken, "ether");
        document.getElementById("saldo-token").innerText = parseFloat(saldoTokenFormatado).toFixed(4) + "  JKP";
    } catch (err) {
        console.error("Erro ao buscar saldos:", err);
    }
}
async function exibirHistoricoJogadas() {
    try {
        const historico = await contrato.methods.verHistorico(conta).call();

        const tabela = document.getElementById("historico");
        tabela.innerHTML = `
            <tr>
                <th>You</th>
                <th>Contract</th>
                <th>Result</th>
                <th>Data</th>
            </tr>
        `;

        if (historico.length === 0) {
            tabela.innerHTML += "<tr><td colspan='4'>Nenhuma jogada registrada.</td></tr>";
            return;
        }

        historico.forEach(jogada => {
            const escolhas = ["Rock", "Paper", "Scissors"];
            const resultados = ["Loss", "Draw", "Victory"];
            const data = new Date(jogada.timestamp * 1000).toLocaleString();

            tabela.innerHTML += `
                <tr>
                    <td>${escolhas[jogada.jogadorEscolha]}</td>
                    <td>${escolhas[jogada.contratoEscolha]}</td>
                    <td>${resultados[jogada.resultado]}</td>
                    <td>${data}</td>
                </tr>
            `;
        });
    } catch (err) {
        console.error("Erro ao buscar histórico:", err);
    }
}

function alternarTabela() {
    const div = document.getElementById("historico-container");
    div.style.display = div.style.display === "none" ? "block" : "none";
}

function mostrarBotaoHistorico() {
    document.getElementById("btn-historico").style.display = "inline-block";
}

function abrirModal() {
    document.getElementById("popupModal").style.display = "block";
}

function fecharModal() {
    document.getElementById("popupModal").style.display = "none";
}