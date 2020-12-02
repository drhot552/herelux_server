module.exports = function(conn){
    var express = require('express');
    const google = require('googleapis').google;
    const xml2js = require('xml2js');
    const iconv  = require('iconv-lite');
    const customsearch = google.customsearch('v1');
    const router = express.Router();  //router하는 객체를 추출
    //개발
    var client_id = 'qb4UvpZbIcIPB7AeHsg5';
    var client_secret = 'kzt0l5bWRZ';
    //운영
    //var client_id = 'Vwg5qvZi4T3pagL1ZASv';
    //var client_secret = 'SVmJMveeTU';

    var api_url = "";
    //카테고리 set
    router.get('/',function(req,res, body){

        var body = [];
        body.push(req.query.code);
        body.push(req.query.state);
        console.log(req.query.code,req.query.state);
        res.writeHead(302, {
          'Location': 'http://www.hereluxury.com/callback'

        });
        res.end();
    })
    router.post('/', function(req, res){
      var code = req.body.code;
      var state = req.body.state;
      api_url = 'https://nid.naver.com/oauth2.0/token?grant_type=authorization_code&client_id='
       + client_id + '&client_secret=' + client_secret + '&code=' + code + '&state=' + state;
      var request = require('request');
      var options = {
          url: api_url,
          headers: {'X-Naver-Client-Id':client_id, 'X-Naver-Client-Secret': client_secret}
       };
      request.get(options, function (error, response, body) {
        if (!error && response.statusCode == 200) {
          res.writeHead(200, {'Content-Type': 'text/json;charset=utf-8'});
          res.end(body);
        } else {
          res.status(response.statusCode).end();
          console.log('error = ' + response.statusCode);
        }
      });
    })
    router.post('/member', function (req, res) {
     var api_url = 'https://openapi.naver.com/v1/nid/me';
     var request = require('request');
     var token = req.body.token;
     var header = "Bearer " + token; // Bearer 다음에 공백 추가
     var options = {
         url: api_url,
         headers: {'Authorization': header}
      };
     request.get(options, function (error, response, body) {
       if (!error && response.statusCode == 200) {
         res.writeHead(200, {'Content-Type': 'text/json;charset=utf-8'});
         res.end(body);
       } else {
         console.log('error');
         if(response != null) {
           res.status(response.statusCode).end();
           console.log('error = ' + response.statusCode);
         }
       }
     });
   });
   router.post('/shop', function (req, res) {
     var search = req.body.product;
     var api_url = 'https://openapi.naver.com/v1/search/shop?query=' + encodeURI(search); // json 결과
     //var api_url_test = 'https://openapi.naver.com/v1/search/shop?query=' + encodeURI(search); // json 결과
     //   var api_url = 'https://openapi.naver.com/v1/search/blog.xml?query=' + encodeURI(req.query.query); // xml 결과
      var request = require('request');
      var options = {
          url: api_url,
          headers: {'X-Naver-Client-Id':client_id, 'X-Naver-Client-Secret': client_secret}
       };

      request.get(options, function (error, response, body) {
        //console.log(response);
        if (!error && response.statusCode == 200) {
          res.writeHead(200, {'Content-Type': 'text/json;charset=utf-8'});
          res.end(body);
        } else {
          res.status(response.statusCode).end();
          console.log('error = ' + response.statusCode);
        }
      });
   });
   router.post('/blog', function (req, res) {
     var search = req.body.product;
     var api_url = 'https://openapi.naver.com/v1/search/blog?query=' + encodeURI(search); // json 결과
     //var api_url_test = 'https://openapi.naver.com/v1/search/shop?query=' + encodeURI(search); // json 결과
     //   var api_url = 'https://openapi.naver.com/v1/search/blog.xml?query=' + encodeURI(req.query.query); // xml 결과
      var request = require('request');
      var options = {
          url: api_url,
          headers: {'X-Naver-Client-Id':client_id, 'X-Naver-Client-Secret': client_secret}
       };

      request.get(options, function (error, response, body) {
        //console.log(response);
        if (!error && response.statusCode == 200) {
          res.writeHead(200, {'Content-Type': 'text/json;charset=utf-8'});
          res.end(body);
        } else {
          res.status(response.statusCode).end();
          console.log('error = ' + response.statusCode);
        }
      });
   });
   router.post('/cafe', function (req, res) {
     var search = req.body.product;
     var api_url = 'https://openapi.naver.com/v1/search/cafearticle?query=' + encodeURI(search); // json 결과
     var request = require('request');
     var options = {
          url: api_url,
          headers: {'X-Naver-Client-Id':client_id, 'X-Naver-Client-Secret': client_secret}
       };

      request.get(options, function (error, response, body) {
        //console.log(response);
        if (!error && response.statusCode == 200) {
          res.writeHead(200, {'Content-Type': 'text/json;charset=utf-8'});
          res.end(body);
        } else {
          res.status(response.statusCode).end();
          console.log('error = ' + response.statusCode);
        }
      });
   });
   router.post('/elevenstore', function (req, res) {
     var search = req.body.product;
     var api_url = 'http://openapi.11st.co.kr/openapi/OpenApiService.tmall?key=dcc6d86d34ad0a4702b28c9dbd64b3b1&apiCode=ProductSearch&keyword=' + encodeURI(search); // json 결과
     //var api_url_test = 'https://openapi.naver.com/v1/search/shop?query=' + encodeURI(search); // json 결과
     //   var api_url = 'https://openapi.naver.com/v1/search/blog.xml?query=' + encodeURI(req.query.query); // xml 결과
      var request = require('request');
      var options = {
          url: api_url,
          encoding: null
       };

      request.get(options, function (error, response, body) {
        //console.log(response.body);
        if (!error && response.statusCode == 200) {
          const strContents = Buffer.from(body);
          const html = iconv.decode(strContents, 'euc-kr').toString();
          xml2js.parseString(html, (err, result) => {
              if(err) {
                  throw err;
              }
              const json = JSON.stringify(result, null, 4);
              // log JSON string
              res.setHeader("Content-Type", "application/json; charset=utf-8");
              res.end(json);

          });
        } else {
          res.status(response.statusCode).end();
          console.log('error = ' + response.statusCode);
        }
      });
   });
   return router;
}
