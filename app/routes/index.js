'use strict';

var path = process.cwd();
var contactFormMailer = require('../controllers/contactFormMailer.js');
var galleryController = require('../controllers/galleryController.js');
var unzip = require('unzip');
var billController = require('../controllers/billController.js');
var userController = require('../controllers/userController.js');

module.exports = function(app, fs) {

	function isLoggedIn(req, res, next) {
		if (req.isAuthenticated()) {
			return next();
		}
		else {
			res.redirect('/login');
		}
	}

	// Authentication and Authorization Middleware
	var auth = function(req, res, next) {
		if (req.session && req.session.user === "admin" && req.session.admin)
			return next();
		else
			return res.redirect('/login');
	};

	app.route('/')
		.get(function(req, res) {
			res.sendFile(path + '/public/index.html');
		})
		.post(function(req, res) {
			//console.log(req.body);
			contactFormMailer.mailOptions["subject"] = 'MESSAGE FROM WEBSITE: ' + contactFormMailer.escapeHtml(req.body["subject"]);
			contactFormMailer.mailOptions["html"] = "<br /><p>" + contactFormMailer.escapeHtml(req.body["message"]) + "</p><br /><span>From :</span><br /><span>  " +
				contactFormMailer.escapeHtml(req.body["name"]) + "</span><br /><span>  " + contactFormMailer.escapeHtml(req.body["email"]) + "</span>";
			res.sendStatus(200);

			//contactFormMailer.sendFeedback();
			//res.redirect('/public/index.html');
		});
	app.route('/gallery')
		.get(function(req, res) {
			res.sendFile(path + '/public/gallery.html');
		});
	app.route('/team')
		.get(function(req, res) {
			res.sendFile(path + '/public/team.html');
		});
	app.route('/images')
		.get(function(req, res) {
			res.send(galleryController.readDir());
		});
	app.route('/login')
		.get(function(req, res) {
			res.sendFile(path + '/public/login.html');
		})
		.post(function(req, res) {
			if (!req.body.username || !req.body.password) {
				res.send('login failed');
			}
			else if (req.body.username === "admin" && req.body.password === "admin") {
				req.session.user = "admin";
				req.session.admin = true;
				res.redirect('/admin');
			}
			else {
				res.send('login failed');
			}
		});
	app.route('/admin')
		.get(auth, function(req, res) {
			res.sendFile(path + '/public/admin.html');
		});
	app.route('/logout')
		.get(function(req, res) {
			req.session.destroy();
			res.redirect('/login');
		});
	app.route('/pics')
		.post(auth, function(req, res) {
			if (Object.keys(req.files).length === 0 && req.files.constructor === Object)
				return res.status(400).send('No files were uploaded.');
			req.files.file.mv(path + '/public/img/events/uploaded', function(err) {
				if (err)
					return res.status(500).send(err);
				fs.createReadStream(path + '/public/img/events/uploaded').pipe(unzip.Extract({ path: path + '/public/img/events/' }));
				res.send('File uploaded!');
			});
		});
	app.route('/bills')
		.post(auth, function(req, res) {
			if (Object.keys(req.files).length === 0 && req.files.constructor === Object)
				return res.status(400).send('No files were uploaded.');
			req.files.bill.mv(path + '/public/bills/' + req.body.event + '_' + req.files.bill.name, function(err) {
				if (err)
					return res.status(500).send(err);
				billController.addBill(req.body, '/bills/' + req.body.event + '_' + req.files.bill.name);
				res.send('Bill uploaded!');
			});
		})
		.get(auth, function(req, res) {
			billController.allBills().then(function(docs) {
				res.send(docs);
			});
		});
	app.route('/update')
		.get(auth, function(req, res) {
			billController.deleteBill(req.query.id);
			res.send("deleted...");
		})
		.post(auth, function(req, res) {
			billController.updateBill(req.body.bill_id);
			res.send("updated...");
		});

	app.route('/users')
		.get(auth, function(req, res) {
			userController.allUsers().then(function(docs) {
				res.send(docs);
			});
		})
		.post(auth, function(req, res) {
			userController.addUser(req.body);
			res.send("new user creted");
		});
	app.route('/user_del')
		.get(auth, function(req, res) {
			userController.deleteUser(req.query.id);
			res.send("deleted...");
		});
};
