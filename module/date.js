const moment  = require("moment");
const validate = require('../module/validate');

module.exports.time= function(){

  let hour = moment().hours();
  let minute = moment().minute();

  let reg_hour = "";
  let reg_minute = "";

  reg_hour = validate.time(hour);
  reg_minute = validate.time(minute);

  let reg_time = reg_hour + ":" + reg_minute;

  return reg_time;
}
