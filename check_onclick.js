const fs = require('fs');
const path = require('path');

function findJSFiles(dir, fileList = []) {
  fs.readdirSync(dir).forEach(file => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      findJSFiles(filePath, fileList);
    } else if (file.endsWith('.js') || file.endsWith('.html')) {
      fileList.push(filePath);
    }
  });
  return fileList;
}

const files = findJSFiles('c:/Users/Tidyco/Documents/GitHub/Tidyco-apqp/portals');
files.push('c:/Users/Tidyco/Documents/GitHub/Tidyco-apqp/index.html');
files.push('c:/Users/Tidyco/Documents/GitHub/Tidyco-apqp/core/js/app.js');

let foundErrors = false;
files.forEach(file => {
  try {
    const content = fs.readFileSync(file, 'utf8');
    // regex to extract strings starting with onclick="..." or onclick='...'
    const rx = /onclick=(["'])(.*?)\1/g;
    let match;
    while ((match = rx.exec(content)) !== null) {
      let code = match[2];
      // strip out ${...} as they are evaluated dynamically
      code = code.replace(/\$\{.*?\}/g, '1');
      try {
        new Function(code);
      } catch(e) {
        if(e.message.includes('Unexpected end of input')) {
          console.log(`ERROR IN FILE: ${file}\nCODE: ${match[2]}`);
          foundErrors = true;
        }
      }
    }
  } catch(e){}
});

if(!foundErrors) console.log("No syntax errors found in onclick handlers.");
