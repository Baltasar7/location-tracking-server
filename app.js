let express = require('express');
//let bodyParser = require('body-parser');
let multer = require('multer');
let app = express();
let upload = multer();
let pg = require('pg');

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
  }
  else
  {
    let pool = pg.Pool({
      database: 'location_tracking_service',
      user: 'master',
      password: 'misokatu',
      host: 'localhost',
      port: 5432,
      idleTimeoutMillis: 15000,
      connectionTimeoutMillis: 15000,
    });
    pool.connect((err, client) => {
      if(err) {
        console.log(err);
      }
      else {
        client.query(
          'SELECT lat, lon FROM location WHERE location.id = req.body.sign_up_id_number',
          (err, result) => {
            if(result.rowCount < 1) {
              res.json({ "searched_lat": "undefined", "searched_lon": "undefined" });
              console.log('id not registration');
            }
            else if (result.rowCount > 1) {
              res.json({ "searched_lat": "multiple registration", "searched_lon": "multiple registration" });
              console.log('id multiple registration');
            }
            else 
            {
              res.json({ "searched_lat": result.rows[0].lat, "searched_lon": result.rows[0].lon });
              console.log(result);
            }
        });
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
  res.send('登録成功');
})

const PORT = process.env.PORT || 1234;
let server = app.listen(PORT, () => {
  console.log('Listen...');
})