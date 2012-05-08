
function cmdConf(cmd){
	var that = this;
	that.cmd = cmd.slice(0);
	that.cmdStr = cmd.concat();
	that.conf = {key: {}, shortKey: {}};
	that.regexp = /^(-{1,2})([a-zA-Z]+)$/;
	
	that.args = cmd.slice(2);
	that.processed = false;
	that.parameters = {arguments: []};

	
	
	/**
	 * Configure the command analyser.
	 */
	that.configure = function(conf){
		for(var name in conf){
			var values = conf[name];
			
			values.name = name;
			values.key = values.key ? values.key : name;
			
			that.conf.key[values.key] = values;
			if(values.shortKey)	that.conf.shortKey[values.shortKey] = values;
			
			
		}
	}
	
	that.getParameters = function(){
		if(!that.processed) process();
		
		return that.parameters;
	}
	
	function process(){
		var args = that.args.slice(0);
		for(var i in args){
			var arg = args[i];
			if(that.regexp.test(arg)){
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
		that.processed = true
	}
	
	function processKey(word, position, args){
		var option = that.conf.key[word];
		if(!option) return;
		
		option.position = parseInt(position);
		processOption(option, args);
	}
	
	function processShortKey(word, position, args){
		var option = that.conf.shortKey[word];
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
		return num == 1 ? params[0] : params;
	}
	
	function setParam(key, value){
		that.parameters[key] = value;
	}
	
	function addArgument(value){
		that.parameters.arguments.push(value);
	}
}

module.exports = new cmdConf(process.argv);
