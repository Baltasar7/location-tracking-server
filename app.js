'use strict'

require('dotenv').config();
const express = require('express');
//const bodyParser = require('body-parser');
const multer = require('multer');
const pg = require('pg');
const fs = require('fs');

const app = express();
const upload = multer();

const allowCrossDomain = (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'X-Requested-With');
  next();
}
app.use(allowCrossDomain);
// app.use(bodyParser.urlencoded({
//   extended: true
// }));

const pg_config =
  process.env.NODE_EXEC_PLACE === 'heroku' ?
  fs.readFileSync('./config_herokupg.json', 'utf-8') :
  fs.readFileSync('./config_localpg.json', 'utf-8');


app.get('/', (req, res) => {
  console.log('---GET Request---');
  console.log('検索識別番号：' + req.query.search_id_number);
  res.header('Content-Type', 'application/json; charset=utf-8');

  if(req.query.search_id_number === undefined) {
    res.json({ "searched_lat": "none", "searched_lon": "none" });
    return console.log('req.query.search_id_number is undefined...');
  }
  const pg_pool = new pg.Pool(JSON.parse(pg_config));
  pg_pool.connect((err, client, release) => {
    if(err) {
      return console.log('db connect err:\n' + err);
    }
    console.log('db connect success');

    // Use async/await to arrange query execution order
    ;(async () => {
      // TODO this try... statement will replace to Promiss error process
      try {
        const fetch_latlon_query = {
          name: 'fetch-latlon',
          text: 'SELECT lat, lon FROM location WHERE id = $1',
          values: [req.query.search_id_number],
        }
        await pg_pool
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
        .catch(err => console.error(err.stack));
      }
      catch (err) {
        console.log('query process err:'  + err.stack);
        throw err;
      }
      finally {
        console.log('pg_pool.end()');
        client.release();
        await pg_pool.end();
      }
    })()
    .catch(err => console.log('async process err:'  + err.stack));
  });

});


app.post('/', upload.none(), (req, res) => {
  console.log('---POST Request---');
  console.log('登録識別番号：' + req.body.sign_up_id_number);
  console.log('緯度：' + req.body.sign_up_lat);
  console.log('経度：' + req.body.sign_up_lon);
  res.header('Content-Type', 'text/plain; charset=utf-8');
//  res.send('登録成功');

  const pg_pool = new pg.Pool(JSON.parse(pg_config));
  pg_pool.connect((err, client, release) => {
    if(err) {
      return console.log('db connect err:\n' + err);
    }
    console.log('db connect success');

    // Use async/await to arrange query execution order
    ;(async () => {
      // TODO this try... statement will replace to Promiss error process
      try {
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
      }
      catch (err) {
        console.log('query process err:'  + err.stack);
        throw err;
      }
      finally {
        console.log('pg_pool.end()');
        client.release();
        await pg_pool.end();
      }
    })()
    .catch(err => console.log('async process err:'  + err.stack));
  })
});


const PORT = process.env.PORT || 1234;
const server = app.listen(PORT, () => {
  console.log('Listen...');
  console.log('NODE_EXEC_PLACE=' + process.env.NODE_EXEC_PLACE);
});
