const playwright = require('playwright');
const { faker } = require('@faker-js/faker');
const { exec, spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');

async function getRandomLine(filePath) {
    try {
        const data = await fs.readFile(filePath, 'utf8');
        const lines = data.split('\n').filter(line => line.trim() !== '');
        if (lines.length === 0) {
            return null;
        }
        const randomIndex = Math.floor(Math.random() * lines.length);
        return lines[randomIndex];
    } catch (error) {
        console.error('Error reading file:', error);
        throw error;
    }
}

const russianAlphabet = [
    'А', 'Б', 'В', 'Г', 'Д', 'Е', 'Ё', 'Ж', 'З', 'И', 'Й', 'К', 'Л', 'М', 'Н', 'О', 'П', 'Р', 'С', 'Т', 'У', 'Ф', 'Х', 'Ц', 'Ч', 'Ш', 'Щ', 'Ь', 'Ы', 'Ь', 'Э', 'Ю', 'Я',
    'а', 'б', 'в', 'г', 'д', 'е', 'ё', 'ж', 'з', 'и', 'й', 'к', 'л', 'м', 'н', 'о', 'п', 'р', 'с', 'т', 'у', 'ф', 'х', 'ц', 'ч', 'ш', 'щ', 'ь', 'ы', 'э', 'ю', 'я'
];
const polishAlphabet = [
    'A', 'Ą', 'B', 'C', 'Ć', 'D', 'E', 'Ę', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'Ł', 'M', 'N', 'Ń', 'O', 'Ó', 'P', 'Q', 'R', 'S', 'Ś', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'Ź', 'Ż',
    'a', 'ą', 'b', 'c', 'ć', 'd', 'e', 'ę', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'ł', 'm', 'n', 'ń', 'o', 'ó', 'p', 'q', 'r', 's', 'ś', 't', 'u', 'v', 'w', 'x', 'y', 'z', 'ź', 'ż'
];

const surnames = [
    '李', '王', '张', '刘', '陈', '杨', '黄', '赵', '吴', '周', '徐', '孙', '马', '朱', '胡', '郭', '何', '高', '林', '罗', '郑', '梁', '谢', '宋', '唐', '韩', '冯', '于', '董', '卢', '曹', '彭', '曾', '潘', '杜', '苏', '魏', '蒋', '蔡', '贾', '丁', '钱', '邹', '喻', '蒲', '邓', '段', '沈', '任', '姚', '姜', '崔', '钟', '雷', '贺', '倪', '唐', '龚', '邵', '熊', '文', '武', '苗', '贺', '习', '黎', '彭', '蒋', '程', '尹', '骆', '闵', '尤', '景', '阮', '邱', '万', '裴', '洪', '陶', '戚', '陆', '宫', '兰', '崔', '习', '方', '傅'
];

function getRandomLetters(arr, num) {
    const shuffled = arr.slice().sort(() => 0.5 - Math.random());
    return shuffled.slice(0, num).join('');
}

function generateRandomName() {
    return faker.internet.userName();  // remove this line to pickup other alphabets for register
    
	// you want acts like different language people so it's like legit user, waste staff's time to figure out
    const languages = ['russian', 'polish', 'chinese', 'english'];
    const selectedLanguage = languages[Math.floor(Math.random() * languages.length)];

    switch (selectedLanguage) {
        case 'russian':
            return getRandomLetters(russianAlphabet, 4);
        case 'polish':
            return getRandomLetters(polishAlphabet, 4);
        case 'chinese':
            return getRandomLetters(surnames, 1);
        case 'english':
            return faker.internet.userName();
        default:
            return faker.internet.userName();
    }
}

async function GenerateVRChatUser() {
    let username = faker.internet.displayName({ firstName: generateRandomName()});
    while(username.length < 4)
    {
        username += '_' + faker.internet.displayName();
    }
    if(username.length > 14)
    {
        username = username.slice(0, 14);
    }
    username = username.replaceAll(".", "-");
    if(Math.random() > 0.5)
    {
        username = username.replaceAll("_", "");
        username = username.replaceAll("-", "");
    }
    let birth = faker.date.birthdate({ min: 19, max: 50, mode: 'age' });

    let email = faker.internet.userName() + '@' + await getRandomLine('mail_list.txt'); // check mail_list.txt for note
    email = email.replace(/\r/g, '');
    return {
      username: username,
      email: email,
      password: faker.internet.password(),
      year: birth.getFullYear(),
      month: birth.getMonth() + 1,
      day: birth.getDate(),
      captchaCode: "",
      subscribe: true,
      acceptedTOSVersion: 9
    };
}

let currentProcess = null;

function SpawnPromise(command, args = [], options = {}) {
    return new Promise(async (resolve, reject) => {
        const proc = spawn(command, args, options);

        let stdout = '';
        let stderr = '';

        proc.stdout.on('data', (data) => {
            stdout += data;
        });

        proc.stderr.on('data', (data) => {
            stderr += data;
        });

        proc.on('close', (code) => {
            if (code === 0) {
                resolve(stdout);
            } else {
                reject(`Process exited with code ${code}: ${stderr}`);
            }
        });

        proc.on('error', (err) => {
            reject(`Process error: ${err.message}`);
        });

        currentProcess = proc;
        await Sleep(7000);
        resolve(0);
    });
}
function Sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

var currentProxy = '';
var bProxyReady = false;
async function ShuffleProxy()
{
    let retrys = 0;
    while(retrys < 5)
    {
        bProxyReady = false;
        try{
			/*
				here is pickup random hysteria2 proxy and enable it, learn more by reading ./hysteria2/README.txt
				you can remove or change this to classic proxy like http(s)/socks5
			*/
            let proxy = await getRandomLine('./hysteria2/proxies.txt');
            currentProxy = proxy;
            let config = `server: ${proxy}
    
http:
    listen: 127.0.0.1:9093`;
    
            let executablePath = path.join(__dirname, 'hysteria2', 'hysteria-windows-amd64_bot.exe');
            let configPath = path.join(__dirname, 'hysteria2', 'config.yaml');
    
            console.log(`Using proxy: ${proxy}`);
            if (currentProcess) {
                currentProcess.kill();
                await new Promise(resolve => currentProcess.on('exit', resolve));
                exec("taskkill /f /im hysteria-windows-amd64_bot.exe"); // just incase
                await Sleep(7000);
            }
            await fs.writeFile(configPath, config, 'utf8');
            try{
                await SpawnPromise(executablePath, ['-c', configPath], { shell: true });
                bProxyReady = true;
                return;
            }
            catch(e)
            {
                console.log("Proxy died with reason: ", e);
                currentProcess = null;
            }
        }
        catch(e)
        {
            console.log("catched: ",e);
        }
        console.log("Retrying proxy...");
        retrys++;
        await Sleep(5000);
    }
    console.log("Max Retry excced with no luck");
    process.exit(1);
}

exec("taskkill /f /im hysteria-windows-amd64_bot.exe");

(async () => {
    // Setup
	// we use firefox
    const browser = await playwright.firefox.launch({ headless: false });
	
	// try generate 20 accounts
    for(let i = 0; i < 20; i++)
    {
        try{
            let user = await GenerateVRChatUser();
            ShuffleProxy();
            const context = await browser.newContext({ proxy: { server: "http://127.0.0.1:9093" } }); // change to ur own proxy
            const page = await context.newPage();
            
			// we can't use await for it
            while(!bProxyReady)
            {
                await Sleep(5000);
            }

            await page.goto('https://vrchat.com/home/register');
            page.setDefaultNavigationTimeout(60000);
            page.setDefaultTimeout(60000); // some proxy node might lagging we give more time
            const hCaptcha = page.locator('iframe[title="Widget containing checkbox for hCaptcha security challenge"]');
            await page.frameLocator('iframe[title="Widget containing checkbox for hCaptcha security challenge"]').getByLabel('hCaptcha checkbox with text \'').click(); // click the captcha so you can manually solve it
            await page.waitForFunction(
                () => {
                const iframe = document.querySelector('iframe');
                if (!iframe) return false;
                const dataResponse = iframe.getAttribute('data-hcaptcha-response');
                return dataResponse && dataResponse.trim() !== '';
                }
            );
            const solved_response = await hCaptcha.getAttribute('data-hcaptcha-response'); // get the valid response token for register
            
            user.captchaCode = solved_response;
            let postbody = user;
			
			// write debug log and request with firefox headers
            await fs.appendFile('generate_attempts.txt', JSON.stringify(postbody) + "\n", 'utf8');
            try{
                let res = await axios.post('https://vrchat.com/api/1/auth/register', 
                    postbody,
                    {
                        proxy: {
                            protocol: 'http',
                            host: '127.0.0.1',
                            port: 9093,
                        },
                        headers: {  
                            "Host": "vrchat.com",
                            "User-Agent": 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36 GLS/100.10.9939.100',
                            "Connection": "keep-alive",
                            "Accept-Encoding": "gzip, deflate, br",
                            "Accept": "*/*",
                            "Content-Type": "application/json",
                            "Origin": "https://vrchat.com",
                            "Referer": "https://vrchat.com/home/register"
                        }
                    }
                );
                console.log(res);
            }
            catch(e)
            {
                console.log("Axios failed, response: " + e.response.data.error.message);
                continue;
            }
            
            delete postbody.captchaCode; // used = dead
            postbody.proxy = currentProxy;
			// write it 
            await fs.appendFile('generated.txt', JSON.stringify(postbody) + "\n", 'utf8');
            
			// wait for next round
            await Sleep(15000);

			// here to verify email by send request to worker
			// that part isnt belongs to us, so i can't make it open-source, but it is very simple.
			// that is just request the complete register link 
            try{
                let res = await axios.get('https://vemfwd.example.com/complete-reg/' + user.email.toLowerCase());
                console.log("Email Verify Successed Passed : ", res);
            }
            catch(e)
            {
                console.log("Axios failed, response: ", e.response.data);
                continue;
            }

            console.log("\n\n\n==================================\nCurrent round successed! going next...\n");

            await context.close();
        }
        catch(e)
        {
            console.log(e);
            process.exit(1);
        }
    }
    await browser.close();
})();
