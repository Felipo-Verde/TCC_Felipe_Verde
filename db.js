var mysql = require('mysql');
var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: ""
});
con.connect(function (err) {
    if (err) throw err;
    console.log("conectado");
    
    var sql = "CREATE DATABASE IF NOT EXISTS barulhometro"
    con.query(sql, function (err, result) {
        if (err) throw err;
        console.log("Banco criado");
    });

    con.end();
});
