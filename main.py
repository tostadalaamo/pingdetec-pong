from microdot import Microdot, send_file
from machine import ADC, Pin

P1 = ADC(Pin(35))  
P2 = ADC(Pin(34))
boton = Pin(12, Pin.IN)

P1.width(ADC.WIDTH_12BIT) 
P1.atten(ADC.ATTN_11DB) 
P2.width(ADC.WIDTH_12BIT)  
P2.atten(ADC.ATTN_11DB)

app = Microdot()

@app.route("/")
async def index(request):
    return send_file("index.html")

@app.route("/style.css")
async def css(request):
    return send_file("style.css")

@app.route("/ping-pomg.js")
async def js(request):
    return send_file("ping-pomg.js")

@app.route("/update")
async def update(request):
    P1_value = P1.read()
    P2_value = P2.read()
    boton_reset = boton.value()

    valores = f"p1={P1_value}&p2={P2_value}&reset={boton_reset}"

    return valores, 200, {"Content-Type": "text/plain"}

@app.route("/input")
async def input_state(request):
    
    return estado, 200, {"Content-Type": "text/plain", "Cache-Control": 'no-store'}

app.run(port=80)