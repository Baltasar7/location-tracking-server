'use strict'

require('dotenv').config();
let express = require('express');
//let bodyParser = require('body-parser');
let multer = require('multer');
let pg = require('pg');
let fs = require('fs');

let app = express();
let upload = multer();

let allowCrossDomain = (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'X-Requested-With');
  next();
}
app.use(allowCrossDomain);
// app.use(bodyParser.urlencoded({
//   extended: true
// }));

let pg_config =
  process.env.NODE_EXEC_PLACE === 'heroku' ?
  fs.readFileSync('./config_herokupg.json', 'utf-8') :
  fs.readFileSync('./config_localpg.json', 'utf-8');


app.get('/', (req, res) => {
  console.log('---GET Request---');
  console.log('検索識別番号：' + req.query.search_id_number);
  res.header('Content-Type', 'application/json; charset=utf-8');

  if(req.query.search_id_number === undefined) {
    res.json({ "searched_lat": "none", "searched_lon": "none" });
    console.log('req.query.search_id_number is undefined...');
  }
  else {
    let pg_pool = new pg.Pool(JSON.parse(pg_config));
    pg_pool.connect( err => {
      if(err) {
        console.log('db connect err:\n' + err);
      }
      else {
        console.log('db connect success');
        const fetch_latlon_query = {
          name: 'fetch-latlon',
          text: 'SELECT lat, lon FROM location WHERE id = $1',
          values: [req.query.search_id_number],
        }
        pg_pool
        .query(fetch_latlon_query)
        .then(result => {
          if(result.rowCount < 1) {
            console.log('id not registration');
            res.json({
              "search_result": "検索失敗（ID登録なし)",
              "searched_lat": "undefined",
              "searched_lon": "undefined",
            });
          }
          else if (result.rowCount > 1) {
            console.log('id multiple registration');
            res.json({
              "search_result": "検索失敗（ID複数登録)",
              "searched_lat": "multiple registration",
              "searched_lon": "multiple registration",
            });
          }
          else {
            console.log('検索成功');
            res.json({
              "search_result": "検索成功",
              "searched_lat": result.rows[0].lat,
              "searched_lon": result.rows[0].lon,
            });
          }
        })
        .catch(err => console.error(err.stack))
        .finally(() => {
          pg_pool.release();
          pg_pool.end();
        });
      }
    });
  }
});


app.post('/', upload.none(), (req, res) => {
  console.log('---POST Request---');
  console.log('登録識別番号：' + req.body.sign_up_id_number);
  console.log('緯度：' + req.body.sign_up_lat);
  console.log('経度：' + req.body.sign_up_lon);
  res.header('Content-Type', 'text/plain; charset=utf-8');
//  res.send('登録成功');

  let pg_pool = new pg.Pool(JSON.parse(pg_config));
  pg_pool.connect(err => {
    if(err) {
      console.log('db connect err:\n' + err);
    }
    else {
      console.log('db connect success');

      // Use async/await to arrange query execution order
      ;(async () => {
        let registed_count = 0;
        const count_query = {
          name: 'count',
          //text: 'SELECT COUNT(*) FROM location WHERE id = $1',
          text: 'SELECT * FROM location WHERE id = $1',
          values: [req.body.sign_up_id_number],
        };
        await pg_pool
        .query(count_query)
        .then(result => {
          //registed_count = result.rows[0];
          registed_count = result.rowCount;
        })
        .catch(err => {
          console.error('count_query err:\n' + err.stack);
        });
        console.log('registed_count:' + registed_count);

        if(registed_count < 1) {
          const insert_latlon_query = {
            name: 'insert-latlon',
            text: 'INSERT INTO location VALUES($1, $2, $3)',
            values: [req.body.sign_up_id_number, req.body.sign_up_lat, req.body.sign_up_lon],
          };
          await pg_pool
          .query(insert_latlon_query)
          .then(result => {
            res.send('登録成功');
          })
          .catch(err => console.error('insert_latlon_query err:\n' + err.stack));
        }
        else {
          const update_latlon_query = {
            name: 'update-latlon',
            text: 'UPDATE location SET lat = $1, lon = $2 WHERE id = $3',
            values: [req.body.sign_up_lat, req.body.sign_up_lon, req.body.sign_up_id_number],
          };
          await pg_pool
          .query(update_latlon_query)
          .then(result => {
            res.send('更新成功');
          })
          .catch(err => console.error('update_latlon_query err:\n' + err.stack));
        }
      })()
      .catch(err => console.log('query process err:'  + err.stack))
      .finally(() => {
        pg_pool.release();
        pg_pool.end();
      });
  }
  })
});


const PORT = process.env.PORT || 1234;
let server = app.listen(PORT, () => {
  console.log('Listen...');
  console.log('NODE_EXEC_PLACE=' + process.env.NODE_EXEC_PLACE);
});
