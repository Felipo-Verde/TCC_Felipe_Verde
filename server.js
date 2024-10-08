const express = require('express');
const mysql = require('mysql');
const formidable = require('formidable');
const fs = require('fs');
const crypto = require('crypto');
const path = require('path');
var session = require('express-session');
const bcrypt = require("bcrypt");
const { render } = require('ejs');
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
    database: "barulhometro"
});

con.connect(function (err) {
    if (err) throw err;
    console.log("Conectado!");
});



app.get('/', function (req, res) {
    res.render('landpg.ejs', { mensagem: "", logado: req.session.logado, result: 0, imagem: req.session.imagem, email: req.session.email, tipo: req.session.tipo });
});


// ------------- USUARIO -------------

// CADASTRO USUARIO
app.get('/cadastro_usuario', function (req, res) {
    res.render('cadastro_usuario.ejs', { mensagem: "", result: 0, logado: req.session.logado, imagem: req.session.imagem });
});

app.post('/cadastro_usuario', function (req, res) {
    var form = new formidable.IncomingForm();

    form.parse(req, (err, fields, files) => {

        var sql = "SELECT * FROM tb_usuario where email_usuario  = ?"
        var email = fields['email'];
        con.query(sql, email, function (err, result) {
            if (err) throw err;
            // verificação se o email ja foi cadastrado
            if (result.length > 0) {
                res.render('cadastro_usuario.ejs', { mensagem: "Email já Cadastrado", result: 0, logado: req.session.logado, imagem: req.session.imagem });
            }
            // email válido
            else {
                var oldpath = files.imagem.filepath;
                var hash = crypto.createHash('md5').update(Date.now().toString()).digest('hex');
                var nomeimg = hash + '.' + files.imagem.mimetype.split('/')[1]
                var newpath = path.join(__dirname, 'public/images/', nomeimg);
                fs.rename(oldpath, newpath, function (err) {
                    if (err) throw err;
                });
                bcrypt.hash(fields['senha'], saltRounds, function (err, hash) {
                    var sql = "INSERT INTO tb_usuario (email_usuario, nome_usuario, senha_usuario, foto_usuario, tipo_usuario) VALUES ?";
                    var values = [[fields['email'], fields['nome'], hash, nomeimg, fields['tipo']]];
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
    res.render('login.ejs', { mensagem: "", result: 0, logado: req.session.logado, imagem: req.session.imagem });
});

app.post('/login', function (req, res) {
    var senha = req.body['senha'];
    var email = req.body['email']

    var sql = "SELECT * FROM tb_usuario where email_usuario = ?";
    con.query(sql, [email], function (err, result) {
        if (err) throw err;
        if (result.length) {
            bcrypt.compare(senha, result[0]['senha_usuario'], function (err, resultado) {
                if (err) throw err;
                if (resultado) {
                    req.session.logado = true;
                    req.session.username = result[0]['nome_usuario'];
                    req.session.imagem = result[0]['foto_usuario'];
                    req.session.email = result[0]['email_usuario'];
                    req.session.tipo = result[0]['tipo_usuario'];
                    res.redirect('/escolas');
                }
                else { res.render('login', { mensagem: "Senha inválida", result: 0, logado: req.session.logado, imagem: req.session.imagem }) }
            });
        }
        else { res.render('login.ejs', { mensagem: "E-mail não encontrado", result: 0, logado: req.session.logado, imagem: req.session.imagem }) }
    });
});

app.get('/logout', function (req, res) {
    req.session.destroy(function (err) {

    })
    res.render('login', { logado: false, result: 0, imagem: '' });
});




//-------------------------------------------------------------------------------------------------------




// ------------- ESCOLAS -------------

app.get('/escolas', function (req, res) {
    var sql = "SELECT * FROM tb_escola"
    con.query(sql, function (err, result, fields) {
        if (err) throw err;
        res.render('escolas.ejs', { mensagem: "", logado: req.session.logado, escolas: result, imagem: req.session.imagem, email: req.session.email, tipo: req.session.tipo });
    });
});



// CADASTRO
app.get('/cadastro_escola', function (req, res) {
    // se logado
    if (req.session.logado) {
        if (req.session.tipo == "professor") { // se for professor
            var sql = "SELECT * FROM tb_escola"
            con.query(sql, function (err, result, fields) {
                if (err) throw err;
                res.render('escolas.ejs', { mensagem: "Você não é administrador", logado: req.session.logado, escolas: result, imagem: req.session.imagem, email: req.session.email, tipo: req.session.tipo });
            });
        } else { // se for administrador
            res.render('cadastro_escola', { mensagem: "", result: 0, logado: req.session.logado, imagem: req.session.imagem, email: req.session.email, tipo: req.session.tipo });
        }
    } else { // se não estiver logado
        res.render('login', { mensagem: "Realize o login", logado: req.session.logado, result: 0, imagem: req.session.imagem });
    }

});

app.post('/cadastro_escola', function (req, res) {
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
            var sql = "INSERT INTO tb_escola (nome_escola, endereco_escola, foto_escola, administrador_email_escola) VALUES ?";
            var values = [[fields['nome'], fields['endereco'], nomeimg, fields['id_adm']]];
            con.query(sql, [values], function (err, result) {
                if (err) throw err;
                console.log("Numero de registros inseridos: " + result.affectedRows);
                res.redirect('/escolas');
            });
        });
    });
});



// DELETAR
app.get('/deletar_escola/:id', function (req, res) {
    // se logado
    if (req.session.logado) {
        if (req.session.tipo == "professor") { // se for professor
            var sql = "SELECT * FROM tb_escola"
            con.query(sql, function (err, result, fields) {
                if (err) throw err;
                res.render('escolas.ejs', { mensagem: "Você não é administrador", logado: req.session.logado, escolas: result, imagem: req.session.imagem, email: req.session.email, tipo: req.session.tipo });
            })
        }

        var sql = "SELECT * FROM tb_escola WHERE administrador_email_escola = ? AND id_escola = ?;"
        var values = [
            [req.session.email],
            [req.params.id]
        ];
        con.query(sql, values, function (err, result) {
            if (err) throw err;
            if (!result.length) { // se não for o administrador da escola
                var sql = "SELECT * FROM tb_escola"
                con.query(sql, function (err, result, fields) {
                    if (err) throw err;
                    res.render('escolas.ejs', { mensagem: "Você não é administrador desta escola!", logado: req.session.logado, escolas: result, imagem: req.session.imagem, email: req.session.email, tipo: req.session.tipo });
                })
            } else if (req.session.email == result[0]['administrador_email_escola']) { // se for o administrador correto
                var id = req.params.id;
                var sql = "SELECT * FROM tb_escola where id_escola=?"
                // busca o nome do arquivo e apaga ele
                con.query(sql, id, function (err, result, fields) {
                    if (err) throw err;
                    const img = path.join(__dirname, 'public/imagens/', result[0]['foto_escola']);
                    fs.unlink(img, (err) => {
                    });
                });
                var sql = "DELETE FROM tb_escola WHERE id_escola = ?;";
                con.query(sql, id, function (err, result) {
                    if (err) throw err;
                    console.log("Numero de registros Apagados: " + result.affectedRows);
                });
                res.redirect('/escolas');
            }
        })
    }
});



// EDITAR

app.get('/editar_escola/:id', function (req, res) {
    // se logado
    if (req.session.logado) {
        if (req.session.tipo == "professor") { // se for professor
            var sql = "SELECT * FROM tb_escola"
            con.query(sql, function (err, result, fields) {
                if (err) throw err;
                res.render('escolas.ejs', { mensagem: "Você não é administrador", logado: req.session.logado, escolas: result, imagem: req.session.imagem, email: req.session.email, tipo: req.session.tipo });
            })
        }

        var sql = "SELECT * FROM tb_escola WHERE administrador_email_escola = ? AND id_escola = ?;"
        var values = [
            [req.session.email],
            [req.params.id]
        ];
        con.query(sql, values, function (err, result) {
            if (err) throw err;
            if (!result.length) { // se não for o administrador da escola
                var sql = "SELECT * FROM tb_escola"
                con.query(sql, function (err, result, fields) {
                    if (err) throw err;
                    res.render('escolas.ejs', { mensagem: "Você não é administrador desta escola!", logado: req.session.logado, escolas: result, imagem: req.session.imagem, email: req.session.email, tipo: req.session.tipo });
                })
            } else if (req.session.email == result[0]['administrador_email_escola']) { // se for o administrador correto
                var sql = "SELECT * FROM tb_escola where id_escola=?"
                var id = req.params.id;
                con.query(sql, id, function (err, result, fields) {
                    if (err) throw err;
                    res.render('editar_escola.ejs', { escola: result, mensagem: "", logado: req.session.logado, imagem: req.session.imagem, email: req.session.email });
                });
            }
        })


    } else { // se não estiver logado
        res.render('login.ejs', { mensagem: "Realize o Login", logado: req.session.logado, imagem: req.session.imagem });
    }
});

app.post('/editar_escola/:id', function (req, res) {

    if (req.session.logado) {
        if (req.session.tipo == "professor") {
            var sql = "SELECT * FROM tb_escola"
            con.query(sql, function (err, result, fields) {
                if (err) throw err;
                res.render('escolas.ejs', { mensagem: "Você não é administrador", logado: req.session.logado, escolas: result, imagem: req.session.imagem, email: req.session.email, tipo: req.session.tipo });
            })
        } else {
            var sql = "SELECT * FROM tb_escola"
            con.query(sql, function (err, result, fields) {
                if (err) throw err;
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
                        var sql = "UPDATE tb_escola SET nome_escola = ?, endereco_escola = ?, foto_escola = ? WHERE id_escola = ?";
                        var values = [
                            [fields['nome']],
                            [fields['endereco']],
                            [nomeimg],
                            [id]
                        ];
                        con.query(sql, values, function (err, result) {
                            if (err) throw err;
                            console.log("Numero de registros alterados: " + result.affectedRows);
                            res.redirect('/escolas');
                        });
                    });
                })
            })
        }
    } else {
        res.render('login.ejs', { mensagem: "Realize o Login", logado: req.session.logado, imagem: req.session.imagem });
    }
});




//------------------------------------------------------------------------------------------------------------------------





// ------------- TURMAS -------------
app.get('/turmas/:id_escola', function (req, res) {
    var sql = "SELECT tb_turma.*, tb_escola.* FROM tb_turma JOIN tb_escola ON tb_turma.escola_id_turma = tb_escola.id_escola WHERE tb_turma.escola_id_turma = ? ORDER BY `tb_turma`.`nome_turma` ASC"
    var id_escola = req.params.id_escola;
    con.query(sql, id_escola, function (err, result, fields) {
        if (err) throw err;
        if (result.length) { // se tiver turmas cadastradas
            res.render('turmas.ejs', { mensagem: "", logado: req.session.logado, result: result, imagem: req.session.imagem, tipo: req.session.tipo, email: req.session.email });
        } else { // se NÃO tiver turmas cadastradas
            var sql = "SELECT * FROM tb_escola WHERE id_escola = ?"
            var id_escola = req.params.id_escola;
            con.query(sql, id_escola, function (err, result, fields) {
                if (err) throw err;
                res.render('turmas.ejs', { mensagem: "", logado: req.session.logado, result: result, imagem: req.session.imagem, tipo: req.session.tipo, email: req.session.email });
            });
        }
    });
});



// CADASTRO
app.get('/cadastro_turma/:id_escola', function (req, res) {

    if (req.session.logado) { //se logado
        if (req.session.tipo == "professor") { //se professor
            var sql = "SELECT * FROM tb_escola"
            con.query(sql, function (err, result, fields) {
                if (err) throw err;
                res.render('escolas.ejs', { mensagem: "Você não é administrador", logado: req.session.logado, escolas: result, imagem: req.session.imagem, email: req.session.email, tipo: req.session.tipo });
            })
        }

        var sql = "SELECT * FROM tb_escola WHERE administrador_email_escola = ? AND id_escola = ?;"
        var values = [
            [req.session.email],
            [req.params.id_escola]
        ];
        con.query(sql, values, function (err, result) { // se adm
            if (err) throw err;

            res.render('cadastro_turma.ejs', { mensagem: "", logado: req.session.logado, result: result, imagem: req.session.imagem, email: req.session.email, tipo: req.session.tipo });

        })
    }

});


app.post('/teste/:id_escola', function (req, res) {

    id = req.params.id_escola
    if (req.session.logado) { // se logado
        if (req.session.tipo == "professor") { // se professor
            var sql = "SELECT * FROM tb_escola"
            con.query(sql, function (err, result, fields) {
                if (err) throw err;
                res.render('escolas.ejs', { mensagem: "Você não é administrador", logado: req.session.logado, escolas: result, imagem: req.session.imagem, email: req.session.email, tipo: req.session.tipo });
            })
        } else { // se adm
            var form = new formidable.IncomingForm();
            form.parse(req, (err, fields, files) => {
                if (err) throw err;
                var sql = "INSERT INTO tb_turma (nome_turma, turno_turma, numalunos_turma, escola_id_turma) VALUES ?";
                var values = [[fields['nome'], fields['turno'], fields['alunos'], id]];
                con.query(sql, [values], function (err, result) {
                    if (err) throw err;
                    console.log("Numero de registros inseridos: " + result.affectedRows);
                    res.redirect('/turmas/' + id)
                });
            })
        }
    } else {
        res.render('login.ejs', { mensagem: "Realize o Login", logado: req.session.logado, imagem: req.session.imagem });
    }
})



// DELETAR
app.get('/deletar_turma/:id', function (req, res) {
    // se logado
    if (req.session.logado) {
        if (req.session.tipo == "professor") { // se for professor
            var sql = "SELECT * FROM tb_escola"
            con.query(sql, function (err, result, fields) {
                if (err) throw err;
                res.render('turma.ejs', { mensagem: "Você não é administrador", logado: req.session.logado, escolas: result, imagem: req.session.imagem, email: req.session.email, tipo: req.session.tipo });
            })
        }
        var sql = "SELECT * FROM tb_turma, tb_escola WHERE tb_turma.escola_id_turma = tb_escola.id_escola AND tb_escola.administrador_email_escola = ? AND tb_turma.id_turma = ?;"
        var values = [
            [req.session.email],
            [req.params.id]
        ];
        con.query(sql, values, function (err, result) {
            if (err) throw err;
            if (!result.length) { // se não for o administrador da escola
                var sql = "SELECT * FROM tb_escola"
                con.query(sql, function (err, result, fields) {
                    if (err) throw err;
                    res.render('escolas.ejs', { mensagem: "Você não é administrador desta escola!", logado: req.session.logado, escolas: result, imagem: req.session.imagem, email: req.session.email, tipo: req.session.tipo });
                })
            } else if (req.session.email == result[0]['administrador_email_escola']) { // se for o administrador correto
                var sql = "SELECT * FROM tb_turma, tb_escola WHERE tb_turma.escola_id_turma = tb_escola.id_escola AND tb_escola.administrador_email_escola = ? AND tb_turma.id_turma = ?;"
                var values = [
                    [req.session.email],
                    [req.params.id]
                ];
                con.query(sql, values, function (err, result) {
                    if (err) throw err;
                    var sql = "DELETE FROM tb_turma WHERE id_turma = ?;";
                    var id = req.params.id
                    var id_escola = result[0]['escola_id_turma']
                    con.query(sql, id, function (err, result) {
                        if (err) throw err;
                        console.log("Numero de registros Apagados: " + result.affectedRows);
                        res.redirect('/turmas/' + id_escola);
                    });
                });
            }
        })
    }
});




// UPDATE
app.get('/editar_turma/:id', function (req, res) {
    // se logado
    if (req.session.logado) {
        if (req.session.tipo == "professor") { // se for professor
            var sql = "SELECT * FROM tb_escola"
            con.query(sql, function (err, result, fields) {
                if (err) throw err;
                res.render('escolas.ejs', { mensagem: "Você não é administrador", logado: req.session.logado, escolas: result, imagem: req.session.imagem, email: req.session.email, tipo: req.session.tipo });
            })
        }

        var sql = "SELECT * FROM tb_turma, tb_escola WHERE tb_turma.escola_id_turma = tb_escola.id_escola AND tb_escola.administrador_email_escola = ? AND tb_turma.id_turma = ?;"
        var values = [
            [req.session.email],
            [req.params.id]
        ];

        con.query(sql, values, function (err, result) {
            if (err) throw err;
            if (!result.length) { // se não for o administrador da escola
                var sql = "SELECT * FROM tb_escola"
                con.query(sql, function (err, result, fields) {
                    if (err) throw err;
                    res.render('escolas.ejs', { mensagem: "Você não é administrador desta escola!", logado: req.session.logado, escolas: result, imagem: req.session.imagem, email: req.session.email, tipo: req.session.tipo });
                })
            } else if (req.session.email == result[0]['administrador_email_escola']) { // se for o administrador correto
                res.render('editar_turma.ejs', { mensagem: "", logado: req.session.logado, result: result, imagem: req.session.imagem, email: req.session.email, tipo: req.session.tipo });
            }
        })

    } else { // se não estiver logado
        res.render('login.ejs', { mensagem: "Realize o Login", logado: req.session.logado, imagem: req.session.imagem });
    }
});

app.post('/editar_turma/:id', function (req, res) {

    // se logado
    if (req.session.logado) {
        if (req.session.tipo == "professor") { // se for professor
            var sql = "SELECT * FROM tb_escola"
            con.query(sql, function (err, result, fields) {
                if (err) throw err;
                res.render('turma.ejs', { mensagem: "Você não é administrador", logado: req.session.logado, escolas: result, imagem: req.session.imagem, email: req.session.email, tipo: req.session.tipo });
            })
        }
        var sql = "SELECT * FROM tb_turma, tb_escola WHERE tb_turma.escola_id_turma = tb_escola.id_escola AND tb_escola.administrador_email_escola = ? AND tb_turma.id_turma = ?;"
        var values = [
            [req.session.email],
            [req.params.id]
        ];

        console.log(values);
        

        con.query(sql, values, function (err, result) {
            if (err) throw err;

            console.log(result);
            
            if (!result.length) { // se não for o administrador da escola
                var sql = "SELECT * FROM tb_escola"
                con.query(sql, function (err, result, fields) {
                    if (err) throw err;
                    res.render('escolas.ejs', { mensagem: "Você não é administrador desta escola!", logado: req.session.logado, escolas: result, imagem: req.session.imagem, email: req.session.email, tipo: req.session.tipo });
                })
            } else if (req.session.email == result[0]['administrador_email_escola']) { // se for o administrador correto

                var sql = "SELECT * FROM `tb_turma` WHERE id_turma = ?;"
                var id = req.params.id
                con.query(sql, id, function (err, result, fields) {
                    if (err) throw err;
                    var id_escola = result[0]['escola_id_turma']
                    var form = new formidable.IncomingForm();
                    form.parse(req, (err, fields, files) => {

                        var id = req.params.id;
                        var sql = "UPDATE tb_turma SET nome_turma = ?, turno_turma = ?, numalunos_turma = ? WHERE id_turma = ?";
                        var values = [
                            [fields['nome']],
                            [fields['turno']],
                            [fields['alunos']],
                            [id]
                        ];
                        con.query(sql, values, function (err, result) {
                            if (err) throw err;
                            console.log("Numero de registros alterados: " + result.affectedRows);
                            res.redirect('/turmas/' + id_escola);
                        });

                    })
                })
            }
        })
    }
});





//----------------------------------------------------------------------------------------------------------------------






// ------------- DISCIPLINAS -------------
app.get('/disciplinas/:id_turma', function (req, res) {
    var sql = "SELECT *, COUNT(tb_advertencia.id_advertencia) AS num_advertencias FROM tb_disciplina, tb_advertencia, tb_turma, tb_escola WHERE tb_turma.escola_id_turma = tb_escola.id_escola AND tb_disciplina.turma_id_disciplina = tb_turma.id_turma AND tb_advertencia.disciplina_id_advertencia = tb_disciplina.id_disciplina AND tb_turma.id_turma = ? GROUP BY tb_disciplina.id_disciplina ORDER BY tb_turma.nome_turma ASC;"
    var id_turma = req.params.id_turma;
    con.query(sql, id_turma, function (err, result, fields) {
        if (err) throw err;
        if (result.length) { // se tiver turmas cadastradas
            res.render('disciplina.ejs', { mensagem: "", logado: req.session.logado, result: result, imagem: req.session.imagem, tipo: req.session.tipo, email: req.session.email }); 
        } else { // se NÃO tiver turmas cadastradas
            var sql = "SELECT * FROM tb_escola, tb_turma WHERE tb_escola.id_escola = tb_turma.escola_id_turma AND tb_turma.id_turma = ?"
            var id_turma = req.params.id_turma;
            con.query(sql, id_turma, function (err, result, fields) {
                if (err) throw err; 
                res.render('disciplina.ejs', { mensagem: "", logado: req.session.logado, result: result, imagem: req.session.imagem, tipo: req.session.tipo, email: req.session.email });
            });
        }
    });
});


// CADASTRO 





//------------------------------------------------------------------------------------------------------------------------






// ------------- RANKINGS -------------

app.get('/ranking_turmas/:id_escola', function (req, res) {
    var sql = "SELECT t.id_turma, t.nome_turma, e.nome_escola, t.escola_id_turma, d.turma_id_disciplina, COUNT(a.id_advertencia) AS total_advertencias FROM tb_turma t LEFT JOIN tb_escola e ON t.escola_id_turma = e.id_escola LEFT JOIN tb_disciplina d ON t.id_turma = d.turma_id_disciplina LEFT JOIN tb_advertencia a ON d.id_disciplina = a.disciplina_id_advertencia WHERE t.escola_id_turma = 1 GROUP BY t.id_turma, t.nome_turma, e.nome_escola, t.escola_id_turma, d.turma_id_disciplina ORDER BY total_advertencias ASC;"
    var id_escola = req.params.id_escola;
    console.log(id_escola);
    con.query(sql, id_escola, function (err, result, fields) {
        if (err) throw err;
        if (result.length) { // se tiver turmas cadastradas
            res.render('ranking_turmas.ejs', { mensagem: "", logado: req.session.logado, result: result, imagem: req.session.imagem, tipo: req.session.tipo, email: req.session.email }); 
        } else { // se NÃO tiver turmas cadastradas
            var sql = "SELECT * FROM tb_escola WHERE id_escola = ?"
            var id_escola = req.params.id_escola;
            con.query(sql, id_escola, function (err, result, fields) {
                if (err) throw err;
                res.render('ranking_turmas.ejs', { mensagem: "", logado: req.session.logado, result: result, imagem: req.session.imagem, tipo: req.session.tipo, email: req.session.email }); 
            });
        }
    });
})

app.get('/ranking_disciplinas/:id_escola', function (req, res) {
    var sql = "SELECT e.nome_escola, t.nome_turma, d.nome_disciplina, d.turma_id_disciplina, t.escola_id_turma, COUNT(a.id_advertencia) AS total_advertencias FROM tb_escola e JOIN tb_turma t ON e.id_escola = t.escola_id_turma JOIN tb_disciplina d ON t.id_turma = d.turma_id_disciplina LEFT JOIN tb_advertencia a ON d.id_disciplina = a.disciplina_id_advertencia WHERE e.id_escola = 1 GROUP BY e.nome_escola, t.nome_turma, d.nome_disciplina, d.turma_id_disciplina, t.escola_id_turma ORDER BY total_advertencias ASC;"
    var id_escola = req.params.id_escola;
    console.log(id_escola);
    con.query(sql, id_escola, function (err, result, fields) {
        if (err) throw err;
        if (result.length) { // se tiver turmas cadastradas
            res.render('ranking_disciplinas.ejs', { mensagem: "", logado: req.session.logado, result: result, imagem: req.session.imagem, tipo: req.session.tipo, email: req.session.email }); 
        } else { // se NÃO tiver turmas cadastradas
            var sql = "SELECT * FROM tb_escola WHERE id_escola = ?"
            var id_escola = req.params.id_escola;
            con.query(sql, id_escola, function (err, result, fields) {
                if (err) throw err;
                res.render('ranking_disciplinas.ejs', { mensagem: "", logado: req.session.logado, result: result, imagem: req.session.imagem, tipo: req.session.tipo, email: req.session.email }); 
            });
        }
    });
})

app.get('/ranking_disciplinas_turmas/:id_escola', function (req, res) {
    var sql = "SELECT t.nome_turma, d.nome_disciplina, d.turma_id_disciplina, t.escola_id_turma, COUNT(a.id_advertencia) AS total_advertencias FROM tb_disciplina d JOIN tb_turma t ON d.turma_id_disciplina = t.id_turma LEFT JOIN tb_advertencia a ON d.id_disciplina = a.disciplina_id_advertencia WHERE t.id_turma = 1 GROUP BY t.nome_turma, d.nome_disciplina, d.turma_id_disciplina, t.escola_id_turma ORDER BY total_advertencias ASC;"
    var id_escola = req.params.id_escola;
    console.log(id_escola);
    con.query(sql, id_escola, function (err, result, fields) {
        if (err) throw err;
        if (result.length) { // se tiver turmas cadastradas
            res.render('ranking_disciplinas_turmas.ejs', { mensagem: "", logado: req.session.logado, result: result, imagem: req.session.imagem, tipo: req.session.tipo, email: req.session.email }); 
        } else { // se NÃO tiver turmas cadastradas
            var sql = "SELECT * FROM tb_escola WHERE id_escola = ?"
            var id_escola = req.params.id_escola;
            con.query(sql, id_escola, function (err, result, fields) {
                if (err) throw err;
                res.render('ranking_disciplinas_turmas.ejs', { mensagem: "", logado: req.session.logado, result: result, imagem: req.session.imagem, tipo: req.session.tipo, email: req.session.email }); 
            });
        }
    });
})



app.listen(3030, function () {
    console.log("Servidor Escutando na porta 3030");
})
