/*
 * This file is part of Node-CMD-Conf.
 * 
 * Node-CMD-Conf is distributed under the terms of the 
 * GNU General Public License version 3.0.
 * 
 * Node-CMD-Conf is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */


function cmdConf(cmd){
	var that = this;
	var command = {
		itemList: cmd.slice(0),
		cmdStr: '',
		args: cmd.slice(2)
	};
	command.cmdStr = command.itemList.join(' ');
	
	var conf = {
		processed: false,
		regexp: /^(-{1,2})([a-zA-Z]+)$/,
		key: {},
		shortKey: {}
	};
	var parameters = {
			parameters: [],
			arguments: command.args,
			commandStr: command.cmdStr
	};
	

	
	
	/**
	 * Configure the command analyser.
	 */
	that.configure = function(config){
		
		conf.processed = false;
		parameters = {
			arguments: [],
			cmdArguments: command.args,
			cmdStr: command.cmdStr
		};
		
		if(typeof config == "string"){
			config = getConfigFromFile(config);
		}
		
		for(var name in config){
			var values = config[name];
			
			values.name = name;
			values.key = values.key ? values.key : name;
			
			conf.key[values.key] = values;
			if(values.shortKey)	conf.shortKey[values.shortKey] = values;
			
			
			if(values.defaultValue !== undefined) setParam(name, values.defaultValue);
		}
		
		return that;
	};
	
	/**
	 * @return an object whith the catched parameter assotiate whith their key 
	 */
	that.getParameters = function(){
		if(!conf.processed) process();
		
		return parameters;
	};
	
	function process(){
		var args = command.args.slice(0);
		for(var i in args){
			var arg = args[i];
			if(conf.regexp.test(arg)){
				var catchWord = RegExp.$2;
				switch(RegExp.$1){
					case '-': 
						processShortKey(catchWord, i, args);
						break;
					case '--':
						processKey(catchWord, i, args);
						break;
				}
			} else {
				addArgument(arg);
			}
		}
		conf.processed = true
	}
	
	function processKey(word, position, args){
		var option = conf.key[word];
		if(!option) return;
		
		option.position = parseInt(position);
		processOption(option, args);
	}
	
	function processShortKey(word, position, args){
		var option = conf.shortKey[word];
		if(!option) return;
		
		option.position = parseInt(position);
		processOption(option, args);
	}
	
	function processOption(option, args){
		var name = option.name;
		var action = option.action;
		switch(action){
			case 'get':
				var params = getCmdParam(option.position+1, option.number, args);
				setParam(name,params);
				break;
			case 'set':
				var value = (option.value) ? option.value : undefined;
				setParam(name,value);
				break;
			default:
				break;
		}
	}
	
	function getCmdParam(start, num, args){
		var params = args.splice(start,num);
		for(var i in params){
			var param = params[i];
			if(/^[0-9]+(?:(\.)[0-9]+)?$/.test(param)){
				params[i] = (RegExp.$1 == '.')? parseFloat(param) : parseInt(param); 
			}
		}
		return num == 1 ? params[0] : params;
	}
	
	function setParam(key, value){
		parameters[key] = value;
	}
	
	function addArgument(value){
		parameters.arguments.push(value);
	}
	
	function getConfigFromFile(filePath){
		console.info('Read cmd-conf configurtion from '+filePath);
		var fs = require('fs');
		var path = require('path');
		try{
			filePath = path.resolve(process.cwd,filePath);
			var content = fs.readFileSync(filePath).toString();
		} catch(err){
			console.error(err.name+': Can\'t read file \''+filePath+'\'');
			return;
		}
		try{
			content = JSON.parse(content);
		} catch (err){
			console.error(err.name+': The JSON file is\'nt correctly formed');
			return;
		}
		return content;
	}
}

module.exports = new cmdConf(process.argv);
