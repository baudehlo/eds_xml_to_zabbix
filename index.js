"use strict";

var ZabbixSender = require('zabbix-sender');
var http = require('http');

var port = parseInt(process.env.PORT || '3000', 10);
var sender       = new ZabbixSender();

/* Example Data:

<owd_DS18B20 Description="Programmable resolution thermometer">
<Name>DS18B20</Name>
<Family>28</Family>
<ROMId>C70000062F00CC28</ROMId>
<Health>7</Health>
<Channel>1</Channel>
<RawData>
93014B467FFF0D1032FF0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
</RawData>
<PrimaryValue>25.1875 Deg C</PrimaryValue>
<Temperature Units="Centigrade">25.1875</Temperature>
<UserByte1 Writable="True">75</UserByte1>
<UserByte2 Writable="True">70</UserByte2>
<Resolution>12</Resolution>
<PowerSource>255</PowerSource>
</owd_DS18B20>

*/

process.on('uncaughtException', function (err) {
    console.error("Uncaught Exception: ", err);
    process.exit(-1);
})

http.createServer(function (req, res) {
    if (req.method == 'POST') {
        var post_data = '';
        req.on('data', function (data) {
            post_data += data;
        });
        req.on('end', function () {
            // console.log("POST data: ", post_data);
            var match, data = {};
            match = /<Temperature([^>]*)>([^<]*)<\/Temperature>/.exec(post_data);
            if (match) {
                data.temperature = match[2];
            }
            match = /<ROMId([^>]*)>([^<]*)<\/ROMId>/.exec(post_data);
            if (match) {
                data.rom_id = match[2];
            }
            match = /<Health([^>]*)>([^<]*)<\/Health>/.exec(post_data);
            if (match) {
                data.health = match[2];
            }
            console.log("Got values: ", data);
            sender.send(data, function (err) {
                if (err) {
                    // Not sure what to do here...
                    res.writeHead(500, {'Content-Type': 'text/plain'});
                    res.end("Error occurred: " + JSON.stringify(err));
                }
                else {
                    res.writeHead(200, {'Content-Type': 'text/plain'});
                    res.end("Thanks");                    
                }
            })
        });
    }
    else {
        res.writeHead(200, {'Content-Type': 'text/plain'});
        res.end("No Thanks");
    }
}).listen(port, function () {
    console.log("Listening on port:", port);
});
