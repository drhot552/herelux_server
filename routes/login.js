module.exports = function(conn){
    const express = require('express');
    const auth = require('./auth');
    const db = require('../module/db_query');
    const date = require('../module/date');
    const moment  = require("moment");
    const router = express.Router();  //router하는 객체를 추출
    //비밀번호
    var bkfd2Password = require('pbkdf2-password'); //비밀번호 암호화
    var hasher = bkfd2Password(); //비밀번호 해쉬

    //event API
    router.post('/', function(req, res){
      const id = req.body.id;
      const password = req.body.password;
      const type = req.body.type;

      const sql =`SELECT id, password, salt
                  FROM luxury.hluser
                  WHERE id = ?
                  and type = ?`;
      // db query commit
      let select_query = db.query(conn, sql, [id, type]);

      select_query.then((data)=>{
        if(!data){
          res.json(500)
        } else {
          if(data.length > 0){
            return hasher({password:password, salt:data[0].salt}, function(err,pass,salt,hash){
                //해쉬값과 패스워드값이 같으면
                if(hash  == data[0].password){
                  const accessToken = auth.signToken(id);
                  res.json({accessToken});
                }
                else{
                  //패스워드가 틀리면
                  console.log('password failure');
                  res.json(302);
                }
            });
          } else{
            //id가 틀릴경우
            console.log('login failure');
            res.json(301);
          }
        }
     });
    })
    router.post('/loginchk',function(req,res){
      const id = req.body.id;
      const type = req.body.type;

      const sql = `select *
                   from luxury.hluser
                   where id = ?
                   and type = ?`;
      let select_query = db.query(conn, sql, [id,type]);
      select_query.then((data)=>{
        if(!data){
          res.json(500)
        } else{
          res.json(data);
        }
      });
    })
    router.post('/snslogin', function(req, res){
      const id = req.body.id;
      const type = req.body.type;
      const token = req.body.token;
      const access_token = req.body.access_token;

      const sql =`SELECT id, password, salt
                  FROM luxury.hluser
                  WHERE id = ?
                  and type = ?`;
      // db query commit
      let select_query = db.query(conn, sql, [id,type]);

      select_query.then((data)=>{
        if(!data){
          res.json(500)
        } else {
          let reg_date = moment().format("YYYY-MM-DD");
          let reg_time = date.time();
          if(data.length > 0){
            const update_sql = `update luxury.hluser
                                set password = ?, salt = ?, upd_date = ?, upd_time = ?
                                where id = ?
                                and type = ?`;
                                //자바스크립트 날짜 시간 set

            let update_query = db.query(conn, update_sql, [token, access_token,  reg_date, reg_time, id, type])
            update_query.then((data)=>{
              if(!data){
                res.json(500)
              } else{
                res.json(201)
              }
            })
          } else {
            const insert_sql = `insert into luxury.hluser(id, type, password, reg_date, salt, reg_time) values (?,?,?,?,?,?)`;
            let insert_query = db.query(conn, insert_sql, [id, type, token, reg_date, access_token, reg_time]);
            insert_query.then((data)=>{
              if(!data){
                res.json(500)
              } else {
                res.json(200)
              }
            })
            //id가 틀릴경우

          }
        }
     });
    })
    router.post('/passwordchg', function(req,res){
        const userid = req.body.id;
        const password = req.body.password;

        //자바스크립트 날짜 시간 set
        let upd_date = moment().format("YYYY-MM-DD");
        let upd_time = date.time();

        //먼저 아이디중복체크를 한다 여기서 중복하는 아이디가 있으면
        const sql_dup = `select count(*) cnt
                         from luxury.hluser
                         where id = ?`;
        let select_query = db.query(conn, sql_dup, userid);
        select_query.then((data)=>{
          if(data[0].cnt == 0){
            res.json(300);
          }
          else{
            //비밀번호 암호화 settings
            hasher({password:password}, function(err, pass, salt, hash){
              const sql =`update luxury.hluser
                          set password = ?, salt =?, upd_date =?, upd_time =?
                          where id = ?`;
              var password_hash = hash;
              var salt = salt;

              if(password_hash){
                var insert_query = db.query(conn, sql, [password_hash,salt,upd_date,upd_time, userid]);
                insert_query.then((data)=>{
                  if(!data) {
                    res.json(500);
                  } else {
                    res.json(200);
                  }
                })
              }
            })
          }
        });
    })
    return router;
}
