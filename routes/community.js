module.exports = function(conn){
    const express = require('express');
    const db = require('../module/db_query');
    const multer = require("multer");
    const multerS3 = require('multer-s3-transform');
    const moment  = require("moment");
    const sharp = require('sharp');
    const validate = require('../module/validate');
    const date = require('../module/date');
    /* AWS 이미지 처리 부분 */
    const AWS = require("aws-sdk");
    AWS.config.region = 'ap-northeast-2';

    var imgname="";
    var brands_name="";
    const maxSize = 2 * 1024 * 1024;

    //bucket name 운영
    const bucketname  = 'hereluxuryboard';
    //bucket name 개발
    //const bucketname  = 'luxuryboard';
    let s3 = new AWS.S3({params: {Bucket:bucketname}});

    //이미지 업로드 필드 두개
    var upload = multer({
      storage: multerS3({
         s3: s3,
         dirname: '/' + brands_name,
         bucket: bucketname,
         cacheControl: 'max-age=31536000',
         acl: 'public-read-write',
         limits: {
            fileSize: maxSize,
            files: 2
         },
         ContentType:'',
         storageClass: 'REDUCED_REDUNDANCY',
         shouldTransform: function (req, file, cb) {
             cb(null, /^image/i.test(file.mimetype))
         },
         transforms: [{
               key: function (req, file, cb) {
                   //let extension = path.extname(file.originalname);
                   //imgname = file.originalname;
                   imgname = moment().format("YYYY-MM-DD") + moment().hours() + "-"  + moment().minute() + "-"  + file.originalname;
                   //console.log("imgname: " + imgname);
                   cb(null, imgname);
               },
               transform: function(req, file, cb) {
                 //Perform desired transformations
                 cb(null, sharp()
                          .jpeg({ quality: 60, force: false })
                          .png({ compressionLevel: 9, force: false })
                          );
               }
         }]
       })
     });

    const router = express.Router();  //router하는 객체를 추출

    router.post('/write', upload.fields([{name:"image_1"}]),function(req,res){
      let imgFile = req.files;
      let product_name = req.body.product_name;
      let community_id = req.body.community_id;
      let brand_name = req.body.brand_name;
      let category_large = req.body.category_large;
      let category_middle = req.body.category_middle;
      let subject = req.body.subject;
      let descript = req.body.descript;
      
      /*product_id
           community_id
           userid
           product_name
           brand_name
           category_large
           category_middel
           subject
           descript
           upd_dttm
           reg_dttm
      */
    });

    router.get('/list/:product_name/:brand_name/:category_large/:category_middle', function(req, res){

    });

    router.get('/select/:community_id/:product_id/:userid', function(req,res){

    });



    return router;

}
