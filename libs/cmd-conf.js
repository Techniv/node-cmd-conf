var logLevel = 1;

/*
 * This file is part of CMD-Conf.
 * 
 * CMD-Conf is distributed under the terms of the M.I.T License.
 * 
 * Copyright © Vincent Peybernes
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in 
 * the Software without restriction, including without limitation the rights 
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
 * of the Software, and to permit persons to whom the Software is furnished to do 
 * so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all 
 * copies or substantial portions of the Software.
 *
 * The Software is provided "as is", without warranty of any kind, express or 
 * implied, including but not limited to the warranties of merchantability, fitness
 * for a particular purpose and noninfringement. In no event shall the authors or 
 * copyright holders be liable for any claim, damages or other liability, whether
 * in an action of contract, tort or otherwise, arising from, out of or in 
 * connection with the software or the use or other dealings in the Software.
 */

/**
 * Node CMD-Conf.
 * Command line analyser for Node.JS.
 * @author Vincent Peybernes [Techniv] <vpeybernes.pro@gmail.com>
 * @version 0.3.0
 */
function cmdConf(cmd){
	var logger = new LightLogger(logLevel);
	var _path = require('path');
	var that = this;
	var command = {
		itemList: cmd.slice(0),
		cmdStr: '',
		args: cmd.slice(2)
	};
	command.cmdStr = command.itemList.join(' ');
	
	var conf = {
		appPath: _path.dirname(global.process.mainModule.filename),
		defaultConfigFile: './config.json',
		processed: false,
		configured: false,
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
	 * @param object config The config object. Can be the path to 
	 * the config JSON file. 
	 */
	that.configure = function(config){
		
		conf.processed = false;
		parameters = {
			arguments: [],
			cmdArguments: command.args,
			cmdStr: command.cmdStr
		};
		
		if(typeof config == 'undefined') config = conf.defaultConfigFile;
		if(typeof config == "string"){
			config = getConfigFromFile(config);
		}
		
		if(config._options){
			options = config.options;
			delete config._options;
		}
		
		for(var name in config){
			var item = config[name];
			
			processConfItem(name, item);
		}
		
		conf.configured = true;
		return that;
	};
	
	/**
	 * Get the parameters. If the module are not configured, it try to 
	 * load the default JSON config file.
	 * @return an object whith the catched parameter assotiate whith their key 
	 */
	that.getParameters = function(){
		if(!conf.processed) process();
		
		return parameters;
	};
	
	function processConfItem(name, item){

		if(typeof item.action == 'string' && typeof item.key == 'string'){

			switch(item.action){
				case 'get':
					if(item.number == undefined){
						logger.error('The number of get action is\' defined for \''+item.name+'\'.');
						return false;
					}
					break;
				case 'set':
					if(item.value == undefined){
						logger.warn('The set value of \''+item.name+' is not defined. Use true.');
						item.value = true;
					}
					break;
				default:
					logger.error('The config property '+item.name+' has no action');
					return false;
					break;
			}
			item.name = name;
			conf.key[item.key] = item;
			if(item.shortKey)	conf.shortKey[item.shortKey] = item;

			if(item.defaultValue !== undefined) setParam(name, item.defaultValue);
		} else {
			setParam(name, item);
		}
		return true;
	}
	
	/**
	 * Fire the command line analyse
	 */
	function process(){
		if (!conf.configured) that.configure();
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
		var params = args.slice(start,start+num);
		var assign = [];
		for(var i in params){
			var param = params[i];
			if(/^-{1,2}/.test(param)) break;
			else{
				if(/^[0-9]+(?:(\.)[0-9]+)?$/.test(param)){
					params[i] = (RegExp.$1 == '.')? parseFloat(param) : parseInt(param); 
				}
				assign.push(params[i]);
			}
		}
		args.splice(start,assign.length);
		return num == 1 ? assign[0] : assign;
	}
	
	function setParam(key, value){
		parameters[key] = value;
	}
	
	function addArgument(value){
		parameters.arguments.push(value);
	}
	
	function getConfigFromFile(filePath){
		logger.info('Read cmd-conf configurtion from '+filePath);
		var fs = require('fs');
		var path = _path;
		filePath = path.resolve(conf.appPath,filePath);
		if(!fs.existsSync(filePath)){
			logger.error('Can\'t find '+filePath);
			return;
		}
		try{
			var content = fs.readFileSync(filePath).toString();
		} catch(err){
			logger.error(err.name+': Can\'t read file \''+filePath+'\'');
			return;
		}
		try{
			content = JSON.parse(content);
		} catch (err){
			logger.error(err.name+': The JSON file is\'nt correctly formed');
			return;
		}
		return content;
	}
}

/**
 * LightLogger using basic console log.
 * LogLevel : 
 * 0 Nothing
 * 1 Error
 * 2 Warning
 * 3 Info
 * 4 Debug
 */
function LightLogger(logLevel){
	logger = global.console;
	
	this.log = function(msg){
		if(logLevel >= 4) logger.log(msg);
	}
	
	this.debbug = function(msg){
		if(logLevel >= 4) logger.log(msg);
	}
	
	this.info = function(msg){
		if(logLevel >= 3) logger.info(msg);
	}
	
	this.warn = function(msg){
		if(logLevel >= 2) logger.warn(msg);
	}
	
	this.error = function(msg){
		if(logLevel >= 1) logger.error(msg);
	}
}

module.exports = new cmdConf(process.argv);
