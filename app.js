const express = require('express');
const app = express();
const http = require('http');
const fs = require('fs');
const bodyParser = require('body-parser');
const server = http.createServer(app);
const { Server, Socket } = require("socket.io");
const io = new Server(server);

app.use(bodyParser.urlencoded({ extended: true }));

app.get('/home', (req, res) => {
  res.sendFile(__dirname + '/home.html');
});

app.get('/admin', (req, res) => {
    res.sendFile(__dirname + '/admin.html');
});

app.get('/login', (req, res) => {
    res.sendFile(__dirname + '/login.html');
});

app.post('/login', (req, res) => {
    if (req.body.username !== "admin"){
        res.send("nome sbagliato");
    }
    else if(req.body.password !== "admin"){
        res.send("password sbagliata");
    }
    else{
        res.redirect('http://localhost:3000/admin');
    }
});

// carichiamo i dati di cronologia sul server
var temperatureData = fs.readFileSync('./logs/temperature.txt', 'utf8');
var velocitaData = fs.readFileSync('./logs/velocita.txt', 'utf8');
var umiditaData = fs.readFileSync('./logs/umidita.txt', 'utf8');
var adminRooms = [];
var adminId;

io.on("connection", (socket) =>{
    console.log(socket.id+" is connected");



    //se ci connettiamo come utente
    socket.on("new user", (tipo) => {
        socket.join(tipo);

        if(tipo === "temperature"){
            socket.emit("upload cronologia", temperatureData);
        }

        if(tipo === "umidita"){
            console.log(umiditaData);
            socket.emit("upload cronologia", umiditaData);
        }

        if(tipo === "velocita"){
            socket.emit("upload cronologia", velocitaData);
        }
    });

    socket.on("send data", (tipo, data) => {
        console.log(data);
        io.to(tipo).emit("receive data", data, tipo);
        uploadLogFiles(tipo, data); //aggiungo ogni dato dentro il file corrispondente


        //per aggionare i dati correnti di cronologia
        if(tipo === "temperature"){
            temperatureData += data;
        }
        if(tipo === "umidita"){
            umiditaData +=data;
        }
        if(tipo === "velocita"){
            velocitaData += data;
        }
    });

    //se ci connettiamo come admin
    socket.on('login admin', () => {
        //l'admin si aggiunge a tutte le room
        adminId = socket.id;
        socket.join("temperature");
        socket.join("umidita");
        socket.join("velocita");

        socket.emit("upload cronologia", temperatureData, umiditaData, velocitaData);

    });

    socket.on("request average", (tipo, date) => {
        io.emit("forward average", tipo, date, socket.id);
    });

    socket.on("response average", (tipo, date, room, media) => {
        io.to(room).emit("final average", tipo, date, media);
    });

    socket.on('disconnect', () => {
    });
});

function uploadLogFiles(tipo, data){
    fs.appendFileSync('./logs/'+tipo+'.txt', '\n'+data, 'utf8');
}



server.listen(3000, () => {
    console.log('listening on *:3000');
});