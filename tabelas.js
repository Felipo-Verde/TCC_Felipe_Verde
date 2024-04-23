var mysql = require("mysql");
var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "pokediario",
});
con.connect(function (err) {
  if (err) throw err;
  console.log("conectado");
  
  var sql = "CREATE TABLE IF NOT EXISTS usuario (id INT AUTO_INCREMENT PRIMARY KEY,nome VARCHAR(255) NOT NULL, email VARCHAR(255) NOT NULL, senha VARCHAR(255) NOT NULL, imagem VARCHAR(255) NOT NULL)";
  con.query(sql, function (err, result) {
    if (err) throw err;
    console.log("Tabela criada");
  });

  var sql = "CREATE TABLE IF NOT EXISTS pokemons (id INT AUTO_INCREMENT PRIMARY KEY,nome VARCHAR(255), imagem VARCHAR(255) NOT NULL, genero VARCHAR(255), level INTEGER(255), liga VARCHAR(255))";
  con.query(sql, function (err, result) {
      if (err) throw err;
      console.log("Tabela criada");
  });

  con.end();
});