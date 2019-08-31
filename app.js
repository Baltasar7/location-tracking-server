'use strict'

let express = require('express');
//let bodyParser = require('body-parser');
let multer = require('multer');
let pg = require('pg');
let fs = require('fs');

let app = express();
let upload = multer();
let db_config = fs.readFileSync('./config_herokupg.json', 'utf-8');

let allowCrossDomain = (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'X-Requested-With');
  next();
}
app.use(allowCrossDomain);

// app.use(bodyParser.urlencoded({
//   extended: true
// }));


app.get('/', (req, res) => {
  console.log('---GET Request---');
  console.log('検索識別番号：' + req.query.search_id_number);
  res.header('Content-Type', 'application/json; charset=utf-8');
  //res.json({ "searched_lat": "12.345", "searched_lon": "678.90" });

  if(req.query.search_id_number === undefined) {
    res.json({ "searched_lat": "none", "searched_lon": "none" });
    console.log('req.query.search_id_number is undefined...');
  }
  else
  {
    let pool = pg.Pool(JSON.parse(db_config));
    pool.connect((err, client) => {
      if(err) {
        console.log('connect:' + err);
      }
      else {
        console.log('db connect success!!');
        const fetch_latlon_query = {
          name: 'fetch-latlon',
          text: 'SELECT lat, lon FROM location WHERE id = $1',
          values: [req.query.search_id_number],
        }
        client
        .query(fetch_latlon_query)
        .then(result => {
          if(result.rowCount < 1) {
            res.json({
              "search_result": "検索失敗（ID登録なし)",
              "searched_lat": "undefined",
              "searched_lon": "undefined",
            });
            console.log('id not registration');
          }
          else if (result.rowCount > 1) {
            res.json({
              "search_result": "検索失敗（ID複数登録)",
              "searched_lat": "multiple registration",
              "searched_lon": "multiple registration",
            });
            console.log('id multiple registration');
          }
          else
          {
            res.json({
              "search_result": "検索成功",
              "searched_lat": result.rows[0].lat,
              "searched_lon": result.rows[0].lon,
            });
            console.log(result);
          }
        })
        .catch(err => console.error(err.stack));
      }
    });
  }
})


app.post('/', upload.none(), (req, res) => {
  console.log('---POST Request---');
  console.log('登録識別番号：' + req.body.sign_up_id_number);
  console.log('緯度：' + req.body.sign_up_lat);
  console.log('経度：' + req.body.sign_up_lon);
  res.header('Content-Type', 'text/plain; charset=utf-8');
//  res.send('登録成功');
  let pool = pg.Pool(JSON.parse(db_config));
  pool.connect((err, client) => {
    if(err) {
      console.log('connect:' + err);
    }
    else {
      console.log('db connect success!!');
      const insert_latlon_query = {
        name: 'insert-latlon',
        text: 'INSERT INTO location VALUES($1, $2, $3)',
        values: [req.body.sign_up_id_number, req.body.sign_up_lat, req.body.sign_up_lon],
      }
      client
      .query(insert_latlon_query)
      .then(result => res.send('登録成功'))
      .catch(err => console.error(err.stack));
    }
  });
})


const PORT = process.env.PORT || 1234;
let server = app.listen(PORT, () => {
  console.log('Listen...');
  console.log('db_config:' + db_config);
})
