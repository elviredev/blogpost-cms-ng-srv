const express = require('express');
const app = express();
const bodyParser = require('body-parser');
// import du router
const api = require('./api/v1/index');
const auth = require('./auth/routes');

const cors = require('cors');
// mongoose
const mongoose = require('mongoose');
const connection = mongoose.connection;

app.set('port', (process.env.port || 3000));

// utilisation des middlewares dans l'ordre
// middlewares : body-parser, cors, api, page non trouvée, express.static
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors({ credentials: true, origin: 'http://localhost:4200' }));

/* **********************
 ****** PASSPORT ****** 
 ************************/
const passport = require('passport');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const Strategy = require('passport-local').Strategy;
const User = require('./auth/models/user');

// middlewares
app.use(cookieParser());
app.use(session({
	secret: 'my super secret',
	resave: true,
	saveUninitialized: true, 
	name: 'whisky-cookie'
}));
app.use(passport.initialize());
app.use(passport.session());

// serialisation/deserialisation de user
passport.serializeUser((user, cb) => {
	cb(null, user);
});

passport.deserializeUser((user, cb) => {
	cb(null, user);
});

// implementation strategy Local
passport.use(new Strategy({
	usernameField: 'username',
	passwordField: 'password'
}, (name, pwd, cb) => {
	User.findOne({ username: name }, (err, user) => {
		if(err){
			console.error(`could not find ${name} in MongoDB`, err);
		} else if(user && user.password !== pwd) {
			console.log(`wrong password for ${name}`);
			cb(null, false);
		} else if(!user) {
			console.log(`user is null for name ${name}`);
			cb(err, false);
		} else {
			console.log(`${name} found in MongoDB and authenticated`);
			cb(null, user);
		}
	});
}));

/* ************************
 ****** END PASSPORT ****** 
 **************************/

const uploadsDir = require('path').join(__dirname, '/uploads');
console.log('uploadsDir', uploadsDir);
app.use(express.static(uploadsDir));

app.use('/api/v1', api);
app.use('/auth', auth);

app.use((req, res) => {
	const err = new Error();
	err.status = 404;
	res.json({msg: '404 - Not found !!!!!', err: err});
});

// fix depreciation warning de findByIdAndUpdate() et findOneAndDelete()
mongoose.set('useFindAndModify', false);

// MongoDB connect
mongoose.connect('mongodb://localhost:27017/whiskycms', { useNewUrlParser: true });
connection.on('error', (err) => {
	console.error(`Connection to MongoDB error : ${err.message}`);
});

connection.once('open', () => {
	console.log('Connected to MongoDB.');

	app.listen(app.get('port'), () => {
		console.log(`express server listening on PORT ${app.get('port')} :-) `);
	});
});


