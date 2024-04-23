const express = require('express');
const mysql = require('mysql');
const formidable = require('formidable');
const fs = require('fs');
const crypto = require('crypto');
const path = require('path');
var session = require('express-session');
const bcrypt = require("bcrypt");
const saltRounds = 10;

const app = express();
app.use(express.urlencoded({ extended: true }))
app.set('view engine', 'ejs')
app.use(express.static("public"));

app.use(session({
    secret: '2C44-4D44-WppQ38S',
    resave: false,
    saveUninitialized: true
}));

app.use((req, res, next) => {
    res.locals.mensagem = "";
    next();
});

const con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "pokediario"
});

con.connect(function (err) {
    if (err) throw err;
    console.log("Conectado!");
});



app.get('/', function (req, res) {
    var sql = "SELECT * FROM pokemons"
    con.query(sql, function (err, result, fields) {
        if (err) throw err;
        res.render('home.ejs', { mensagem: "", logado: req.session.logado, pokemons: result, imagem: req.session.imagem });
    });
});



// CADASTRO USUARIO
app.get('/cadastro_usuario', function (req, res) {
    res.render('cadastro_usuario.ejs', { mensagem: "", logado: req.session.logado, imagem: req.session.imagem });
});

app.post('/cadastro_usuario', function (req, res) {
    var form = new formidable.IncomingForm();

    form.parse(req, (err, fields, files) => {

        var sql = "SELECT * FROM usuario where email = ?"
        var email = fields['email'];
        con.query(sql, email, function (err, result) {
            if (err) throw err;
            if (result.length > 0) {
                res.render('cadastro_usuario.ejs', { mensagem: "Email já Cadastrado", logado: req.session.logado, imagem: req.session.imagem });
            } else {
                var oldpath = files.imagem.filepath;
                var hash = crypto.createHash('md5').update(Date.now().toString()).digest('hex');
                var nomeimg = hash + '.' + files.imagem.mimetype.split('/')[1]
                var newpath = path.join(__dirname, 'public/images/', nomeimg);
                fs.rename(oldpath, newpath, function (err) {
                    if (err) throw err;
                });
                bcrypt.hash(fields['senha'], saltRounds, function (err, hash) {
                    var sql = "INSERT INTO usuario (nome, email, senha, imagem) VALUES ?";
                    var values = [[fields['nome'], fields['email'], hash, nomeimg]];
                    con.query(sql, [values], function (err, result) {
                        if (err) throw err;
                        console.log("Numero de registros inseridos: " + result.affectedRows);
                        res.redirect('/login');
                    });
                });
            }
        });
    });
});



//LOGIN USUARIO
app.get('/login', function (req, res) {
    res.render('login.ejs', { mensagem: "", logado: req.session.logado, imagem: req.session.imagem });
});

app.post('/login', function (req, res) {
    var senha = req.body['senha'];
    var email = req.body['email']

    var sql = "SELECT * FROM usuario where email = ?";
    con.query(sql, [email], function (err, result) {
        if (err) throw err;
        if (result.length) {
            bcrypt.compare(senha, result[0]['senha'], function (err, resultado) {
                if (err) throw err;
                if (resultado) {
                    req.session.logado = true;
                    req.session.username = result[0]['nome'];
                    req.session.imagem = result[0]['imagem'];
                    res.redirect('/');
                }
                else { res.render('login', { mensagem: "Senha inválida", logado: req.session.logado, imagem: req.session.imagem }) }
            });
        }
        else { res.render('login.ejs', { mensagem: "E-mail não encontrado", logado: req.session.logado, imagem: req.session.imagem }) }
    });
});

app.get('/logout', function (req, res) {
    req.session.destroy(function (err) {

    })
    res.render('login', { logado: false, imagem: '' });
});



//CADASTRO DE POKÉMON
app.get('/cadastro', function (req, res) {
    if (req.session.logado) {
        res.render('cadastro.ejs', { mensagem: "", logado: req.session.logado, imagem: req.session.imagem });
    } else {
        res.render('login', { mensagem: "Realize o Login", logado: req.session.logado, imagem: req.session.imagem });
    }
});

app.post('/cadastro', function (req, res) {
    var form = new formidable.IncomingForm();
    form.parse(req, (err, fields, files) => {
        if (err) throw err;
        var file = Object.values(files)[0];
        if (!file) {
            console.error('No file provided');
            return;
        }
        var oldpath = file.filepath;
        var hash = crypto.createHash('md5').update(Date.now().toString()).digest('hex');
        var ext = path.extname(file.originalFilename)
        var nomeimg = hash + ext
        var newpath = path.join(__dirname, 'public/images/', nomeimg);
        fs.rename(oldpath, newpath, function (err) {
            if (err) throw err;
            var sql = "INSERT INTO pokemons (nome, imagem, genero, level, liga) VALUES ?";
            var values = [[fields['nome'], nomeimg, fields['genero'], fields['level'], fields['liga']]];
            con.query(sql, [values], function (err, result) {
                if (err) throw err;
                console.log("Numero de registros inseridos: " + result.affectedRows);
                res.redirect('/');
            });
        });
    });
});

app.get('/deletar/:id', function (req, res) {

    if (req.session.logado) {
        var id = req.params.id;
        var sql = "SELECT * FROM pokemons where id=?"
        // busca o nome do arquivo e apaga ele
        con.query(sql, id, function (err, result, fields) {
            if (err) throw err;
            const img = path.join(__dirname, 'public/imagens/', result[0]['imagem']);
            fs.unlink(img, (err) => {
            });
        });
        var sql = "DELETE FROM pokemons WHERE id = ?";
        con.query(sql, id, function (err, result) {
            if (err) throw err;
            console.log("Numero de registros Apagados: " + result.affectedRows);
        });
        res.redirect('/');
    } else {
        res.render('login.ejs', { mensagem: "Realize o Login", logado: req.session.logado, imagem: req.session.imagem });
    }
});

app.get('/editar/:id', function (req, res) {
    if (req.session.logado) {
        var sql = "SELECT * FROM pokemons where id=?"
        var id = req.params.id;
        con.query(sql, id, function (err, result, fields) {
            if (err) throw err;
            res.render('editar.ejs', { pokemons: result, mensagem: "", logado: req.session.logado, imagem: req.session.imagem });
        });
    } else {
        res.render('login.ejs', { mensagem: "Realize o Login", logado: req.session.logado, imagem: req.session.imagem });
    }
});

app.post('/editar/:id', function (req, res) {

    if (req.session.logado) {
        var form = new formidable.IncomingForm();
        form.parse(req, (err, fields, files) => {
            var file = Object.values(files)[0];
            var oldpath = file.filepath;
            var hash = crypto.createHash('md5').update(Date.now().toString()).digest('hex');
            var ext = path.extname(file.originalFilename)
            var nomeimg = hash + ext
            var newpath = path.join(__dirname, 'public/images/', nomeimg);
            fs.rename(oldpath, newpath, function (err) {

                var id = req.params.id;
                var sql = "UPDATE pokemons SET nome = ?, imagem = ?, genero = ?, level = ?, liga = ? WHERE id = ?";
                var values = [
                    [fields['nome']],
                    [nomeimg],
                    [fields['genero']],
                    [fields['level']],
                    [fields['liga']],
                    [id]
                ];
                con.query(sql, values, function (err, result) {
                    if (err) throw err;
                    console.log("Numero de registros alterados: " + result.affectedRows);
                    res.redirect('/');
                });

            });
        })
    } else {
        res.render('login.ejs', { mensagem: "Realize o Login", logado: req.session.logado, imagem: req.session.imagem });
    }
});

//TESTES
app.get('/ranking', function (req, res) {
    res.render('ranking.ejs', { mensagem: "", logado: req.session.logado, imagem: req.session.imagem });
});

app.get('/aluno', function (req, res) {
    res.render('aluno.ejs', { mensagem: "", logado: req.session.logado, imagem: req.session.imagem });
});

app.get('/professor', function (req, res) {
    res.render('professor.ejs', { mensagem: "", logado: req.session.logado, imagem: req.session.imagem });
});

app.get('/editar_aluno', function (req, res) {
    res.render('editar_aluno.ejs', { mensagem: "", logado: req.session.logado, imagem: req.session.imagem });
});


app.listen(3030, function () {
    console.log("Servidor Escutando na porta 3030");
})
