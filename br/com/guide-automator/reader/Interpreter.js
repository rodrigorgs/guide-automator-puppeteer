const fs = require('fs');
const InterpreterProxy = require('main/reader/InterpreterProxy')
const Automator = require('main/automation/Automator');
const Util = require('main/libs/Util');

class Interpreter extends InterpreterProxy{
    
    codeMarker = "```"

    constructor() {
        super();
        this.mdFile = null;
        this.mdContent = null;
        this.outputFolder = './'
        this.outputFileName = 'output.pdf'
        this.resourcesFolder = './resources'
    }

    async run(argv) {
        this.instance = await Automator.instance();
        this.readParameters(argv);
        await this.parseFile();
        await this.instance.makePDF(this.mdContent);
    }

    readParameters(argv){
        for(let i = 2; i < argv.length; i++) {
            this.parametersInterpreter(argv[i++], argv[i]);
        }
    }

    async parseFile() {
        let stack = [];
        this.mdContent = fs.readFileSync(this.mdFile, 'utf8');
        for(let i = 0; i < this.mdContent.length; i++){
            
            const j = i + this.codeMarker.length;

            let substring = this.mdContent.substring(i, j);

            if(substring === this.codeMarker) {
                if(stack.length == 0){
                    stack.push(i);
                } else {
                    const start = stack.pop();
                    const code = this.mdContent.substring(start+this.codeMarker.length, i);

                    let output = await this.runCommand(code);

                    this.mdContent = Util.replaceAt(start, j, this.mdContent, output);

                    i = start;
                }
            }
        }
    }

    async runCommand(code) {
        let output = 'TESTE 123';
        const lines = code.split('\n');
        for(let line of lines) {
            const params = line.split(/\s+/g);
            console.log(`PARAMS: ${JSON.stringify(params)}`)
            switch(params[0]) {
                case 'go-to-page':
                    await this.instance.goToPage(params[1]);
                    break;
                case 'screenshot':
                    await this.instance.screenshot(
                        params[1] === 'null' ? null : params[1], params[2]);
                    output = `![${params[1]} ${params[2]}]`
                    console.log(`OUTPUT: ${output}`)
                    break;
                case 'fill-field':
                    await this.instance.fillField(params[1], params.slice(2).join(' '));
                    break;
                case 'submit-form':
                    await this.instance.submitForm(params[1]);
                    break;
                case 'click-button':
                    break;
                case 'make-pdf':
                    // console.log(this.mdContent)
                    // await this.instance.makePDF(this.mdContent);
                    break;
                default:
                    break;
            }
        }
        return output;
    }

    parametersInterpreter(key, val) {
        switch(key) {
            case '-i':
                this.mdFile = val;
                console.log(`MD file name: ${this.mdFile}`);
                return
            case '-f':
                this.outputFileName = val;
                console.log(`Output file name: ${this.outputFileName}`);
                return
            case '-o':
                this.outputFolder = val;
                console.log(`Output folder: ${this.outputFolder}`);
                return;
            case '-r':
                this.resourcesFolder = val;
                console.log(`Resources folder: ${this.resourcesFolder}`);
                return;
            default:
                throw new Error(`Parameter \'${key}\' wasn\'t recognized`);
        }
    }
}
module.exports = Interpreter;