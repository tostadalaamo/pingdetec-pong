
var canvas = document.querySelector("canvas");
var ctx = canvas.getContext("2d");

canvas.style.background = "black";

var DocWidth;
var DocHeight;

let dirX = true;
let dirY = true;

var Pad1YPos;
var Pad2YPos;

var Score1 = 0;
var Score2 = 0;

var RequestFrame = false;

let potInitialized = false;
let gameOver = false;

let serialBuffer = "";

function canvasSetup() {
    //posicion inicial en la mitad del lateral eliminado//
    DocHeight = window.innerHeight;
    DocWidth = window.innerWidth;

    canvas.width = DocWidth;
    canvas.height = DocHeight;

    escenario();
}

canvasSetup();

window.onresize = canvasSetup;

class Obj {

    constructor(x, y, radius, height) {

        this.color = "white";
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.height = height;
        this.speed = 8;
    }

    drawBall() {

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();
    }

    drawPad() {

        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y - this.height / 2, this.radius, this.height);
    }

    moveBall() {

        if (dirX) this.x += this.speed;
        else this.x -= this.speed;

        if (dirY) this.y += this.speed;
        else this.y -= this.speed;

        if (this.y + this.radius >= DocHeight) dirY = false;
        if (this.y - this.radius <= 0) dirY = true;

        // puntuaciones//

        if (this.x - this.radius > DocWidth) {
            Score1++;
            ResetBall();
            return;
        }

        if (this.x + this.radius < 0) {
            Score2++;
            ResetBall();
            return;
        }

        checkCollision(this);

        escenario();
        this.drawBall();

        document.querySelector("#Player1").innerHTML = Score1;
        document.querySelector("#Player2").innerHTML = Score2;

        CheckWinner();
    }
}

function DrawPads() {

    if (!potInitialized) return;

    var Pad1 = new Obj(50, Pad1YPos, 25, 100);
    var Pad2 = new Obj(DocWidth - 75, Pad2YPos, 25, 100);

    Pad1.drawPad();
    Pad2.drawPad();
}

function escenario() {

    ctx.clearRect(0, 0, DocWidth, DocHeight);

    ctx.fillStyle = "white";
    ctx.fillRect(DocWidth / 2 - 5, 0, 10, DocHeight);

    DrawPads();
}

async function conectarESP32() {

    try {

        if (!("serial" in navigator)) {
            alert("Conectate a la red Indetec-2026");
            return;
        }

        const port = await navigator.serial.requestPort();

        await port.open({ baudRate: 115200 });

        const reader = port.readable.getReader();
        const decoder = new TextDecoder();

        serialBuffer = "";

        while (true) {

            const { value, done } = await reader.read();

            if (done) break;

            serialBuffer += decoder.decode(value);

            let lines = serialBuffer.split("\n");
            serialBuffer = lines.pop();

            for (let line of lines) {

                let valores = line.trim().split(",");

                if (valores.length !== 2) continue;

                let pot1 = Number(valores[0]);
                let pot2 = Number(valores[1]);

                if (!Number.isFinite(pot1) || !Number.isFinite(pot2)) continue;

                // pasa la posicion de los potenciometros a una posicion en el juego

                Pad1YPos = 50 + (pot1 / 4095) * (DocHeight - 100);
                Pad2YPos = 50 + (pot2 / 4095) * (DocHeight - 100);

                potInitialized = true;

                // reinicia el juego

                if (!RequestFrame) {
                    escenario();
                }
            }
        }

        reader.releaseLock();

    } catch (error) {

        console.error(error);
        alert("Error al conectar la ESP32.");
    }
}

function StartGame() {

    if (RequestFrame || gameOver || !potInitialized) return;

    var ball = new Obj(DocWidth / 2, DocHeight / 2, 10);

    dirX = direccionAzar();
    dirY = direccionAzar();

    RequestFrame = true;

    MoveBallLoop(ball);
}
//forma de iniciar el juego de manera temporal

document.addEventListener("keydown", (e) => {

    if (e.key === "Enter") StartGame();

});

canvas.onclick = StartGame;

function MoveBallLoop(ball) {

    if (!RequestFrame) return;

    ball.moveBall();

    if (RequestFrame) {
        requestAnimationFrame(() => { MoveBallLoop(ball); });
    }
}

function ResetBall() {

    RequestFrame = false;

    escenario();

    var ball = new Obj(DocWidth / 2, DocHeight / 2, 10);

    ball.drawBall();

    document.querySelector("#Player1").innerHTML = Score1;
    document.querySelector("#Player2").innerHTML = Score2;

    CheckWinner();
}

function checkCollision(ball) {
    //colisiones de los pads

    if (!dirX && ball.x - ball.radius <= 75 && ball.x - ball.radius >= 65 && ball.y + ball.radius >= Pad1YPos - 50 && ball.y - ball.radius <= Pad1YPos + 50) {
        dirX = true;
    }

    if (dirX && ball.x + ball.radius >= DocWidth - 75 && ball.x + ball.radius <= DocWidth - 65 && ball.y + ball.radius >= Pad2YPos - 50 && ball.y - ball.radius <= Pad2YPos + 50) {
        dirX = false;
    }
}

//comprueba ganador
function CheckWinner() {

    if (Score1 >= 10 || Score2 >= 10) {

        RequestFrame = false;
        gameOver = true;

        document.querySelector("#WinMsg").style.display = "block";
        document.querySelector("#WinPlayerId").innerHTML = Score1 >= 10 ? 1 : 2;
    }
}

function direccionAzar() {

    return Boolean(Math.floor(Math.random() * 2));
}
