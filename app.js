// --- DATOS INICIALES ---
const cursosBase = [
    "Fundamentos de Acústica",
    "Electrónica Analógica",
    "Procesamiento Digital (DSP)",
    "Técnicas de Grabación",
    "Mezcla y Masterización",
    "Diseño Sonoro",
    "Sonido en Vivo",
    "Psicoacústica",
    "Acústica Arquitectónica",
    "Postproducción de Audio"
];

// --- ESTADO DE LA APP ---
// Almacena rankings separados por "Perfil_Criterio"
// Ejemplo: "estudiante_dificultad": { "Curso A": 1200, ... }
let rankingsDB = {}; 

let currentPair = { a: "", b: "" };
const K_FACTOR = 32; // Factor de cambio ELO

// Elementos del DOM
const elPerfil = document.getElementById("perfil-select");
const elCriterio = document.getElementById("criterio-select");
const elCursoA = document.getElementById("curso-a-name");
const elCursoB = document.getElementById("curso-b-name");
const containerRanking = document.getElementById("ranking-container");

// --- FUNCIONES ELO ---
function getRankingKey() {
    return `${elPerfil.value}_${elCriterio.value}`;
}

function initRankingIfNeeded() {
    const key = getRankingKey();
    if (!rankingsDB[key]) {
        // Inicializar todos en 1000 si no existe
        rankingsDB[key] = {};
        cursosBase.forEach(c => rankingsDB[key][c] = 1000);
    }
}

function getExpectedScore(ra, rb) {
    return 1 / (1 + Math.pow(10, (rb - ra) / 400));
}

function updateElo(winner) {
    const key = getRankingKey();
    const scores = rankingsDB[key];
    
    const ra = scores[currentPair.a];
    const rb = scores[currentPair.b];
    
    const ea = getExpectedScore(ra, rb);
    const eb = getExpectedScore(rb, ra);
    
    const sa = (winner === 'A') ? 1 : 0;
    const sb = (winner === 'B') ? 1 : 0;
    
    scores[currentPair.a] = Math.round(ra + K_FACTOR * (sa - ea));
    scores[currentPair.b] = Math.round(rb + K_FACTOR * (sb - eb));
    
    // Guardar cambios y actualizar UI
    renderRanking();
    nuevoDuelo();
}

// --- INTERFAZ ---

function nuevoDuelo() {
    // Elegir dos cursos al azar
    let a = cursosBase[Math.floor(Math.random() * cursosBase.length)];
    let b = cursosBase[Math.floor(Math.random() * cursosBase.length)];
    
    // Asegurar que no sean el mismo
    while (a === b) {
        b = cursosBase[Math.floor(Math.random() * cursosBase.length)];
    }
    
    currentPair = { a, b };
    
    // Animación simple de texto
    elCursoA.style.opacity = 0;
    elCursoB.style.opacity = 0;
    
    setTimeout(() => {
        elCursoA.innerText = a;
        elCursoB.innerText = b;
        elCursoA.style.opacity = 1;
        elCursoB.style.opacity = 1;
    }, 200);
}

function renderRanking() {
    const key = getRankingKey();
    const scores = rankingsDB[key];
    
    // Convertir objeto a array y ordenar
    const sorted = Object.keys(scores)
        .map(curso => ({ nombre: curso, puntos: scores[curso] }))
        .sort((a, b) => b.puntos - a.puntos)
        .slice(0, 10); // Top 10
        
    containerRanking.innerHTML = "";
    
    sorted.forEach((item, index) => {
        const div = document.createElement("div");
        div.className = "ranking-item";
        div.innerHTML = `
            <span>#${index + 1} ${item.nombre}</span>
            <span class="score">${item.puntos}</span>
        `;
        containerRanking.appendChild(div);
    });
}

function resetCurrentRanking() {
    const key = getRankingKey();
    if(confirm(`¿Seguro que quieres reiniciar el ranking para ${key}?`)) {
        rankingsDB[key] = undefined; // Borrar
        initRankingIfNeeded();
        renderRanking();
        nuevoDuelo();
    }
}

function exportarCSV() {
    const key = getRankingKey();
    const scores = rankingsDB[key];
    let csvContent = "data:text/csv;charset=utf-8,Posicion,Curso,Puntaje\n";
    
    const sorted = Object.keys(scores)
        .map(curso => ({ nombre: curso, puntos: scores[curso] }))
        .sort((a, b) => b.puntos - a.puntos);

    sorted.forEach((item, index) => {
        csvContent += `${index + 1},"${item.nombre}",${item.puntos}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ranking_${key}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// --- LISTENERS ---

document.getElementById("btn-vota-a").addEventListener("click", () => updateElo('A'));
document.getElementById("btn-vota-b").addEventListener("click", () => updateElo('B'));
document.getElementById("btn-nuevo-duelo").addEventListener("click", nuevoDuelo);
document.getElementById("btn-ver-top").addEventListener("click", renderRanking);
document.getElementById("btn-reiniciar").addEventListener("click", resetCurrentRanking);
document.getElementById("btn-exportar").addEventListener("click", exportarCSV);

// Al cambiar perfil o criterio, cambiamos el contexto del ranking
[elPerfil, elCriterio].forEach(el => {
    el.addEventListener("change", () => {
        initRankingIfNeeded();
        renderRanking(); // Muestra el ranking guardado de ese perfil
        nuevoDuelo();
    });
});

// Inicialización
initRankingIfNeeded();
nuevoDuelo();
renderRanking();
