import network
import esp
import gc

esp.osdebug(0)
gc.collect()

ssid = ""
password = ""

wlan = network.WLAN(network.STA_IF)
wlan.active(True)

print(f'Conectando a {ssid}')
wlan.connect(ssid, password)
while not wlan.isconnected():
    pass

print(f'Conexion exitosa.\nIP: {wlan.ifconfig()[0]}')