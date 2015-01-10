"use strict";

var zabbix_options = {
    'zabbix-server': '192.168.36.56',
    'port': 10051,
    'host': 'Zabbix server',
    'realtime': true,
    'with-timestamps': true,
};

var this_host = require('os').hostname();

var sender = require('zbx_sender').createZabbixSender(zabbix_options);
var http = require('http');
var dns = require('dns');

var port = parseInt(process.env.PORT || '3000', 10);

var wanted_keys = [
    'Temperature',
    'Health',
    'Vad',
    'Humidity',
];

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
            if (process.env.LOGPOSTDATA) console.log("POST data: ", post_data);
            var match;
            var data = [];
            var rom_id = 'Unknown_Rom_ID';
            var now = Date.now() / 1000;
            while (match = /<owd_(\w+)([^>]*?)>([\s\S]*?)<\/owd_\1>/.exec(post_data)) {
                var device = match[1];
                var owd_data = match[3];
                post_data = post_data.substring(match.index + owd_data.length);
                match = /<ROMId\b([^>]*)>([^<]*)<\/ROMId>/i.exec(owd_data);
                if (match) {
                    rom_id = match[2];
                }
                wanted_keys.forEach(function (key) {
                    var regexp = new RegExp('<' + key + '([^>]*)>([^<]*)<\/' + key + '>');
                    match = regexp.exec(owd_data);
                    if (match) {
                        data.push({
                            key: key.toLowerCase(),
                            value: match[2],
                            clock: now,
                            host: rom_id,
                        });
                    }
                });
            }
            console.log("Got values: ", data);
            sender.send(data);
            res.writeHead(200, {'Content-Type': 'text/plain'});
            res.end("Thanks");                    
        });
    }
    else {
        res.writeHead(200, {'Content-Type': 'text/plain'});
        res.end("No Thanks");
    }
}).listen(port, function () {
    console.log("Listening on port:", port);
});
