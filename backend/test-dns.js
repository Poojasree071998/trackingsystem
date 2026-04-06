const dns = require('dns');
const fs = require('fs');
dns.setServers(['8.8.8.8']); // Google DNS

dns.resolveSrv('_mongodb._tcp.cluster0.fqxbtd7.mongodb.net', (err, addresses) => {
  if (err) {
    fs.writeFileSync('dns.txt', 'SRV Error: ' + err.message);
  } else {
    fs.writeFileSync('dns.txt', 'SRV Records: ' + JSON.stringify(addresses) + '\n');
    dns.resolveTxt('cluster0.fqxbtd7.mongodb.net', (errTxt, txts) => {
       if(errTxt) fs.appendFileSync('dns.txt', 'TXT Error: ' + errTxt.message);
       else fs.appendFileSync('dns.txt', 'TXT Records: ' + JSON.stringify(txts));
    });
  }
});
