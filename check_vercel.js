const https = require('https');

https.get('https://trackingsystem1-yo3k.vercel.app/', (res) => {
  let data = '';
  res.on('data', d => data += d);
  res.on('end', () => {
    const match = data.match(/src="(\/assets\/index-[^\"]+\.js)"/);
    if(match) {
      https.get('https://trackingsystem1-yo3k.vercel.app' + match[1], (res2) => {
        let js = '';
        res2.on('data', d => js += d);
        res2.on('end', () => {
          console.log('Contains localhost:', js.includes('http://localhost:5001'));
          console.log('Contains render:', js.includes('trackingsystem-3mdl.onrender.com'));
        });
      });
    } else {
      console.log('Could not find index.js in HTML');
    }
  });
});
