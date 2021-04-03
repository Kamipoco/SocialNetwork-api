const express = require('express');
const app = express();
var bodyParser = require('body-parser'); //Chuyển dữ liệu về dạng json để có thể đọc được
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const PORT = 5000;
const { MongoUrl } = require('./keys');

// var corsOptions = {
//     origin: "http://localhost:5000"
//   };

mongoose.set('useFindAndModify', false);

mongoose.connect(MongoUrl,{
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false
    });
mongoose.connection.on('connected', () => {
    console.log('Connect Success Mongodb !');
});
mongoose.connection.on('error', (err) => {
    console.log('Error connecting!');
});

app.use(cors()); //Tương tác qua lại giữa client và server (như upload ảnh), bảo mật dự án
app.use(bodyParser.json());//Kiểu dữ liệu muốn đọc từ người dùng gửi lên đc chuyển sang json
app.use(bodyParser.urlencoded({ extended: true })); //chấp nhận mọi kiểu gửi về server

require('./models/user'); //Tạo các schema để có thể làm việc 
require('./models/post');

app.use(morgan('dev')); //log ra các trạng thái của API và thời gian phản hồi
app.use(helmet()); //Lọc các dữ liệu người dùng gửi lên server tránh DDOS, XSS,...
app.use(require('./routes/auth')); //định tuyến đường đi cho các API 
app.use(require('./routes/post'));
app.use(require('./routes/user'));

app.listen(PORT, () => { 
    console.log('Server is running on', PORT);
});
