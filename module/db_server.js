module.exports = (function() {
	    return {
	        dev: { // localhost
	            host: 'luxurydb.ceuzzas6aewi.ap-northeast-2.rds.amazonaws.com',
	            port: '3306',
	            user: 'root',
	            password: 'alswo5293',
	            database: 'luxury'
	        },
	        real: { // real server db info
	            host: 'luxurydb.cd43xs6awqmk.ap-northeast-2.rds.amazonaws.com',
    				 user : 'root',
    		 password : 'alsskwns!23',
    		 database : 'luxury',
	            port: '3306'
	        }
	    }
	})();
