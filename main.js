const express = require('express');
const app =  express();
var bodyParser = require('body-parser'); //post를위한 body-parser설정
var cors = require('cors');

//aws S3 서버 구조 서울

//database connect
const database = require('./module/database.js');
const conn = database.conn();

//JSON API
const event = require('./routes/event')(conn);
const video = require('./routes/video')(conn);
const product = require('./routes/product')(conn);
const login = require('./routes/login')(conn);
const register = require('./routes/register')(conn);
const code = require('./routes/code')(conn);
const board = require('./routes/board')(conn);
const comment = require('./routes/comment')(conn);
const search = require('./routes/search')(conn);
const info = require('./routes/info')(conn);
const callback = require('./routes/callback')(conn);
const home = require('./routes/home')(conn);
const plan = require('./routes/plan')(conn);
const community = require('./routes/community')(conn);
const talk = require('./routes/talk')(conn);
const talkcomment = require('./routes/talkcomment')(conn);
const mylist = require('./routes/mylist')(conn);

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));


//App router
app.use('/event', event);
app.use('/video', video);
app.use('/product', product);
app.use('/login', login);
app.use('/register', register);
app.use('/code', code);
app.use('/board', board);
app.use('/comment', comment);
app.use('/search', search);
app.use('/info', info);
app.use('/callback', callback);
app.use('/home', home);
app.use('/plan',plan);
app.use('/community', community);
app.use('/talk', talk);
app.use('/talkcomment', talkcomment);
app.use('/mylist', mylist)

app.listen(4000, function(){
  console.log('Connected luxury Server, 4000 Port');
})
