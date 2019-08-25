let express = require('express');
//let bodyParser = require('body-parser');
let multer = require('multer');
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

app.get('/', (req, res) => {
  console.log('---GET Request---');
  console.log('検索識別番号：' + req.query.search_id_number);
  res.header('Content-Type', 'application/json; charset=utf-8');
  res.json({ "searched_lat": "12.345", "searched_lon": "678.90" });
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