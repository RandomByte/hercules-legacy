# hercules
MQTT+Node.js based hub for home automation

Current status: Test-running it in my flat. There are motion detectors in every room (except the bathroom). All the light bulbs got replaced with Phillips Hue ones. Plus, there's one light sensor (LDR) in one of the rooms.
A central Raspberry Pi running hercules retrieves all the sensor data and decides when to turn on or off which light. 


## My Setup
### Central server
There is one central server, running the MQTT broker **[Mosquitto](https://mosquitto.org/)** and hercules.

Currently that's a Raspberry Pi A+ with a WiFi dongle. It was just a leftover from another project, so I rould rather recommend a B one (or any other computer running some kind of Debian).

You need to have a Node.js version above 4. 

### Motion Detectors
Find the corresponding project here: [github.com/RandomByte/mqtt-nodemotion](https://github.com/RandomByte/mqtt-nodemotion)

![Rubik's Cube for scale](resources/motion-detector.png)

I'm using **HC-SR501 PIR** Motion Detectors. Citing from the [spec](https://www.mpja.com/download/31227sc.pdf) they run with 5V and have a range up to 7 meters. I have them set to *repeat trigger mode*, *full sensing distance* and *shortest delay*.

In my case each motion detector is connected to an [Onion Omega](https://onion.io/) which runs OpenWRT. The linux is actually the only reason why they are running Node.js for this job. Feel free to do this in C with the same or any other microcontroller as long as it can provide the neccessary 5V and has some sort of connectivity.

### Light sensor
Find the corresponding project here: [github.com/RandomByte/esp8266-mqtt-light-sensor](https://github.com/RandomByte/esp8266-mqtt-light-sensor)

![](resources/ldr.png)

That's a simple ESP8266 (NodeMCU) with an LDR soldered to it.

## Installation
1. Clone repo
2. Do `npm install --only=production`
3. Copy over `config.example.json` to `config.json` and change it as needed
4. Run with `node index.js`

Steps for deamonized autorun will follow when it gets more stable.

## Contributing
- Use [ESLint](http://eslint.org/) and make sure to install all development dependencies using `npm install` (without the production flag)

## Architecture
hercules can handle multple sites which each multiple rooms. Sensors can be on site level (like a light sensor) or on room level (like motion detectors).


````
Site 1..n Room
Room 1..n Sensor
Site 1..n Sensor

````

### MQTT Channel-structure
`Site -> Room -> Sensor` or `Site -> Sensor`

**Examples:**  
`/Home/Kitchen/Temperature`  
`/Work/Hallway/Motion`  
`/Home/Light`

