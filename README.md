Node module - **CMD-Conf**
==========================
A command line analyser for Node.JS.
[View NPM registry](https://npmjs.org/package/cmd-conf)

This module analyses the command line syntax to extract parameters 
and return them into an associative array.


# Example
I want to configure my listen port and activate the verbose mode like this :

	$ node server.js -p 80 -v
	or
	$ node server.js --port 80 --verbose

server.js
```javascript

	var cmdConf = require('cmd-conf');
	cmdConf.configure({
		listenPort:{			// Define the 'listenPort' key configuration
			key: 'port',		// Configure command key name (different than param key)
			shortKey: 'p',		// Configure the short key
			action: 'get',		// Define action to get parameters in commande line.
			number: 1			// Define the number of parameters to get. (They must be consecutive)
			defaultValue: 85	// If the parameter not given, use the default value;
		},
		
		verbose:{
			shortKey: 'v',
			action: 'set',		// Set a static value
			value: true			// The value to set
		}
	});
	
	var params = cmdConf.getParameters();
	
	var myPort = params.listenPort;
	var verbose = params.verbose;
```
If you give a simple string to the `configure()` method, witch epresente the path of 
a JSON file, cmd-conf try to resolv path and load config from this file.


-----------------------------------------------------------------
_More information comming soon_