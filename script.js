/**
 * ==========================================
 * PARTE 1: DADOS E ESTRUTURA (MODEL)
 * Tema 1 deve focar aqui para adicionar novos locais.
 * ==========================================
 */
// Array com todas as estradas do vilarejo no formato "Local1-Local2"
// Define a conectividade entre os locais
const roads = [
    "Alice's House-Bob's House", "Alice's House-Cabin",
    "Alice's House-Post Office", "Bob's House-Town Hall",
    "Daria's House-Ernie's House", "Daria's House-Town Hall",
    "Ernie's House-Grete's House", "Grete's House-Farm",
    "Grete's House-Shop", "Marketplace-Farm",
    "Marketplace-Post Office", "Marketplace-Shop",
    "Marketplace-Town Hall", "Shop-Town Hall"
];

// Coordenadas visuais para desenhar no Canvas (X, Y)
// Mapeia cada local para coordenadas (x,y) no canvas
// Usado para posicionamento visual dos elementos
const locations = {
    "Alice's House": { x: 50, y: 100 },
    "Bob's House": { x: 200, y: 50 },
    "Cabin": { x: 50, y: 300 },
    "Post Office": { x: 200, y: 200 },
    "Town Hall": { x: 350, y: 100 },
    "Daria's House": { x: 500, y: 100 },
    "Ernie's House": { x: 650, y: 250 },
    "Grete's House": { x: 550, y: 400 },
    "Farm": { x: 350, y: 450 },
    "Shop": { x: 350, y: 300 },
    "Marketplace": { x: 200, y: 350 }
};

function buildGraph(edges) {
    // Constrói um grafo de conexões a partir do array de estradas
    // Entrada: array de strings no formato "Local1-Local2"
    // Saída: objeto onde cada local tem um array de locais conectados

    let graph = Object.create(null);
    function addEdge(from, to) {
        // Adiciona uma conexão bidirecional ao grafo
        if (graph[from] == null) {
            graph[from] = [to];
        } else {
            graph[from].push(to);
        }
    }
    for (let [from, to] of edges.map(r => r.split("-"))) {
        addEdge(from, to);
        addEdge(to, from); // Torna o grafo bidirecional
    }
    return graph;
}

const roadGraph = buildGraph(roads); // Constróio o Grafo de conectividade (estradas)

/**
 * ==========================================
 * PARTE 2: ESTADO DO MUNDO (STATE)
 * Tema 2 deve entender a imutabilidade aqui.
 * ==========================================
 */

class VillageState {
    // Representa o estado atual da simulação
    constructor(place, parcels) {
        this.place = place;    // Local atual do robô
        this.parcels = parcels; // Array de encomendas pendentes
    }

    move(destination) {
        // Move o robô para um novo local e atualiza o estado das encomendas
        // Retorna novo estado (imutabilidade) ou estado atual se movimento inválido
        if (!roadGraph[this.place].includes(destination)) {
            return this; // Movimento inválido
        } else {
            let parcels = this.parcels.map(p => {
                if (p.place != this.place) return p;
                return { place: destination, address: p.address }; // Move encomendas com o robô
            }).filter(p => p.place != p.address); // Remove encomendas entregues
            return new VillageState(destination, parcels);
        }
    }
}


// Método estático para gerar estado inicial aleatório
// Gera um estado aleatório com 5 encomendas
VillageState.random = function (parcelCount = 5) {
    // Gera estado inicial com número especificado de encomendas
    let parcels = [];
    for (let i = 0; i < parcelCount; i++) {
        let address = randomPick(Object.keys(roadGraph)); // Destino aleatório
        let place;
        do {
            place = randomPick(Object.keys(roadGraph)); // Origem aleatória
        } while (place == address); // Garante que origem ≠ destino
        parcels.push({ place, address });
    }
    return new VillageState("Post Office", parcels); // Robô começa no correio
};

/**
         * ==========================================
         * PARTE 3: ALGORITMOS DOS ROBÔS (AI)
         * Temas 3, 4, 5 e 6 analisam esta parte.
         * ==========================================
         */

function randomPick(array) {
    // Seleciona elemento aleatório de um array
    let choice = Math.floor(Math.random() * array.length);
    return array[choice];
}

// --- ROBÔ 1: ALEATÓRIO (Tema 3) ---
function randomRobot(state) {
    // Robô que sempre escolhe direção aleatória
    // Entrada: estado atual | Saída: {direction, memory}

    return { direction: randomPick(roadGraph[state.place]) };
}

// --- ROBÔ 2: ROTA FIXA (Tema 4) ---

// Rota predefinida que o robô segue ciclicamente
const mailRoute = [
    "Alice's House", "Cabin", "Alice's House", "Bob's House",
    "Town Hall", "Daria's House", "Ernie's House",
    "Grete's House", "Shop", "Grete's House", "Farm",
    "Marketplace", "Post Office"
];

function routeRobot(state, memory) {
    // Robô que segue rota fixa
    // memory: array com próximos destinos na rota

    if (memory.length == 0) {
        memory = mailRoute; // Reinicia rota se acabou
    }
    return { direction: memory[0], memory: memory.slice(1) };
}

// --- ROBÔ 3: INTELIGENTE / PATHFINDER (Tema 5 e 6) ---
function findRoute(graph, from, to) {
    // Algoritmo de busca em largura para encontrar rota mais curta
    // Entrada: grafo, origem, destino | Saída: array com rota

    let work = [{ at: from, route: [] }]; // Fila de trabalho
    for (let i = 0; i < work.length; i++) {
        let { at, route } = work[i];
        for (let place of graph[at]) {
            if (place == to) return route.concat(place); // Rota encontrada
            if (!work.some(w => w.at == place)) { // Evita revisitar
                work.push({ at: place, route: route.concat(place) });
            }
        }
    }
}

function goalOrientedRobot({ place, parcels }, route) {
    // Robô inteligente que busca e entrega encomendas eficientemente
    // route: memória com rota atual a seguir

    if (route.length == 0) {
        let parcel = parcels[0]; // Foca na primeira encomenda
        // Se a encomenda não está comigo, vou buscar. Se está, vou entregar.
        if (parcel.place != place) {
            // Busca encomenda: calcula rota até local da encomenda
            route = findRoute(roadGraph, place, parcel.place);
        } else {
            // Entrega encomenda: calcula rota até destino
            route = findRoute(roadGraph, place, parcel.address);
        }
    }
    return { direction: route[0], memory: route.slice(1) };
}

/**
         * ==========================================
         * PARTE 4: VISUALIZAÇÃO E CONTROLE (VIEW/CONTROLLER)
         * Temas 3, 4, 5, 6 e 7 trabalharão muito aqui.
         * ==========================================
         */

let currentState = null;     // Estado atual do vilarejo
let currentRobot = null;     // Função do robô atual
let robotMemory = [];        // Memória do robô (para alguns algoritmos)
let turnCount = 0;           // Contador de passos
let simulationTimeout = null; // Referência do timeout para controle

// Tema 6: deve tornar isso dinâmico
let animationSpeed = 800;    // Velocidade da animação em ms

// Elementos DOM
const canvas = document.getElementById('villageCanvas');
const ctx = canvas.getContext('2d');
const logContainer = document.getElementById('logContainer');

function init() {
    // Inicializa a simulação: estado aleatório, desenha vilarejo, atualiza UI
    currentState = VillageState.random();
    drawVillage(currentState);
    updateStatusUI();
    logAction("Simulação pronta. Escolha um robô e clique em Iniciar.");
}

function startSimulation() {
    if (simulationTimeout) return; // Evita múltiplas execuções

    const robotType = document.getElementById('robotSelect').value;

    // Seleciona o tipo de algoritmo, ou seja, 
    // configura o algoritmo do robô baseado na seleção do usuário

    if (robotType === 'random') currentRobot = randomRobot;
    else if (robotType === 'route') currentRobot = routeRobot;
    else currentRobot = goalOrientedRobot;

    robotMemory = []; // Reseta memória do robô
    runTurn(); // Inicia loop principal
}

function runTurn() {
    // Executa um turno da simulação (movimento + atualização)

    if (currentState.parcels.length == 0) {
        // Condição de vitória: todas encomendas entregues
        logAction(`<strong>FIM!</strong> Todas as entregas concluídas em ${turnCount} passos.`);
        simulationTimeout = null;
        return;
    }

    // 1. O robô decide
    let action = currentRobot(currentState, robotMemory);

    // 2. O estado atualiza (Imutabilidade)
    let nextState = currentState.move(action.direction);

    // Detecção simples de entrega para log (Tema 2 pode melhorar isso)
    if (nextState.parcels.length < currentState.parcels.length) {
        logAction(`📦 Entrega realizada em: ${action.direction}`);
    } else {
        logAction(`Movendo para: ${action.direction}`);
    }

    // 3. Atualiza variáveis globais
    currentState = nextState;
    robotMemory = action.memory;
    turnCount++;

    // 4. Redesenha e Atualiza UI
    drawVillage(currentState);
    updateStatusUI();

    // 5. Agenda o próximo turno (Loop de animação)
    simulationTimeout = setTimeout(runTurn, animationSpeed);
}

function stopSimulation() {
    // Para a execução da simulação
    clearTimeout(simulationTimeout);
    simulationTimeout = null;
}

function resetSimulation() {
    // Reinicia completamente a simulação
    stopSimulation();
    turnCount = 0;
    logContainer.innerHTML = ''; // Limpa logs
    init(); // Reinicializa
}

function updateStatusUI() {
    // Atualiza contadores na interface
    document.getElementById('stepCount').innerText = turnCount;
    document.getElementById('parcelCount').innerText = currentState.parcels.length;
}

// Função auxiliar de Log (Tema 2 deve melhorar HTML/CSS aqui)
function logAction(message) {
    // Adiciona entrada ao log de ações
    const div = document.createElement('div');
    div.className = 'log-entry';
    div.innerHTML = `Passo ${turnCount}: ${message}`;
    logContainer.prepend(div);  // Adiciona no topo
}

/**
         * ==========================================
         * PARTE 5: DESENHO NO CANVAS
         * Temas 1, 3, 4 e 5: Atenção aqui!
         * ==========================================
         */
function drawVillage(state) {
    // Renderiza todo o vilarejo no canvas

    ctx.clearRect(0, 0, canvas.width, canvas.height); // Limpa o canvas

    // 1. Desenhar Estradas (Linhas)
    ctx.strokeStyle = "#aaa";
    ctx.lineWidth = 4;
    for (let from in roadGraph) {
        for (let to of roadGraph[from]) {
            // Só desenha se ambos os locais tiverem coordenadas definidas
            if (locations[from] && locations[to]) {
                ctx.beginPath();
                ctx.moveTo(locations[from].x, locations[from].y);
                ctx.lineTo(locations[to].x, locations[to].y);
                ctx.stroke();
            }
        }
    }

    // 2. Desenhar Locais (Círculos) - Tema 1 adicionará novos
    for (let loc in locations) {
        const { x, y } = locations[loc];

        // Desenha o "chão" do local
        ctx.fillStyle = "#3b82f6"; // Azul
        ctx.beginPath();
        ctx.arc(x, y, 15, 0, Math.PI * 2);
        ctx.fill();

        // Texto do local
        ctx.fillStyle = "#000";
        ctx.font = "12px Arial";
        ctx.textAlign = "center";
        ctx.fillText(loc, x, y - 25);
    }

    // 3. Desenhar Encomendas (Quadrados Vermelhos) - Tema 3 pode mudar para imagens
    state.parcels.forEach((p, index) => {
        if (locations[p.place]) {
            const { x, y } = locations[p.place];
            const offset = index * 12; // Deslocamento para empilhar

            ctx.fillStyle = "#ef4444"; // Vermelho
            ctx.fillRect(x + 10 + offset, y + 5, 15, 15);

            ctx.strokeStyle = "white";
            ctx.strokeRect(x + 10 + offset, y + 5, 15, 15);
        }
    });

    // 4. Desenhar Robô
    const robotLoc = locations[state.place];
    if (robotLoc) {
        ctx.fillStyle = "#10b981"; // Verde
        ctx.beginPath();
        ctx.arc(robotLoc.x, robotLoc.y, 20, 0, Math.PI * 2);
        ctx.fill();

        ctx.lineWidth = 2;
        ctx.strokeStyle = "#fff";
        ctx.stroke();

        // Letra 'R' no robô
        ctx.fillStyle = "white";
        ctx.font = "bold 16px Arial";
        ctx.fillText("R", robotLoc.x, robotLoc.y + 5);
    }

    // Dica para Tema 5: Desenhar a rota (linha tracejada) aqui
}

// ==========================================
// TEMA 6: EVENT LISTENER PARA O SLIDER
// ==========================================
// Aqui conectamos o slider HTML com a variável JS

const speedSlider = document.getElementById('speedSlider');
const speedDisplay = document.getElementById('speedDisplay');

const roboNormalGif = document.getElementById('rNormal');
const roboRapidoGif = document.getElementById('rRapido');
const roboLentoGif = document.getElementById('rLento');

speedSlider.addEventListener('input', (event) => {
    // Atualiza a variável global de velocidade
    animationSpeed = parseInt(event.target.value);

    // Atualiza o texto na tela para o usuário ver
    speedDisplay.innerText = animationSpeed;

    // Adiciona o style hidden nas imagens do robo
    roboNormalGif.classList.add('hidden');
    roboRapidoGif.classList.add('hidden');
    roboLentoGif.classList.add('hidden');

    // Remove o style hidden das imagens de acordo com velocidade do robo
    if (animationSpeed < 500) { // Se for muito rápido (<500ms)
        roboRapidoGif.classList.remove('hidden');
    } else if (animationSpeed > 1500) { // Se for muito lento (>1500ms)
        roboLentoGif.classList.remove('hidden');
    } else {
        roboNormalGif.classList.remove('hidden');
    }

});

// Inicializa tudo
init();