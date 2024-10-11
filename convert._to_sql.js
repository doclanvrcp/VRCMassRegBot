/*

	This file is for generate SQL insert file from generated accounts to your SQL Database

*/
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const inputFilePath = path.join(__dirname, 'generated.txt');
const outputFilePath = path.join(__dirname, 'accounts.sql');

// VRChat HTTP header contains MAC Address, so we generate random to acts like random person
function macAddressGen() {
  let randomBytes = Array.from({ length: 5 }, () => Math.floor(Math.random() * 255));
  let byteString = String.fromCharCode(...randomBytes);
  let sha1Hash = crypto.createHash('sha1').update(byteString).digest();
  let macAddress = sha1Hash.toString('hex');
  return macAddress;
}

fs.readFile(inputFilePath, 'utf8', (err, data) => {
  if (err) {
    console.error(err);
    return;
  }

  const lines = data.trim().split('\n');
  let sqlStatements = '';

  lines.forEach((line, index) => {
    try {
      const jsonData = JSON.parse(line);

      const email = jsonData.email.replace(/'/g, "''");
      const user = jsonData.username.replace(/'/g, "''");
      const pass = jsonData.password.replace(/'/g, "''");
      
      const sql = `INSERT INTO vrc_session (email, user, pass, macaddr, account_status, authcookie, 2fa) VALUES ('${email}', '${user}', '${pass}', '${macAddressGen()}', 0, '', '');\n`;
      sqlStatements += sql;
    } catch (e) {
      console.error(e);
    }
  });

  fs.writeFile(outputFilePath, sqlStatements, 'utf8', (err) => {
    if (err) {
      console.error(err);
    } else {
      console.log('[good]: ', outputFilePath);
    }
  });
});
