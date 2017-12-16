var express = require('express');
var http = require('http');
var ent = require('ent'); // Permet de bloquer les caractères HTML (sécurité équivalente à htmlentities en PHP)
var fs = require('fs');

var session = require('cookie-session'); // Charge le middleware de sessions
var bodyParser = require('body-parser'); // Charge le middleware de gestion des paramètres
var urlencodedParser = bodyParser.urlencoded({ extended: false });



var app = express();
var server = http.createServer(app);
// Chargement de socket.io
var io = require('socket.io').listen(server);

// Par defaut, il y a 2 elements dans la liste
var todolist = ['Task 1', 'Task 2'];

/* On utilise les sessions */
app.use(session({secret: 'todotopsecret'}))

/* On affiche la todolist et le formulaire */
.get('/todo', function(req, res) {
    res.render('todo.ejs', {todolist: todolist});
})

/* On redirige vers la todolist si la page demandée n'est pas trouvée */
.use(function(req, res, next){
    res.redirect('/todo');
});

io.sockets.on('connection', function (socket, pseudo) {

    // Dès qu'on nous donne un pseudo, on le stocke en variable de session
    socket.on('petit_nouveau', function(pseudo) {
        socket.pseudo = pseudo;
        console.log('Client connecté ' + pseudo);
    });

    // Reception d'un nouvel element dans la Todo List
    socket.on('newItem', function (newItem) {
        // On récupère le pseudo de celui qui demande l'ajout de l'item
        console.log(socket.pseudo + ' me demande de rajouter un item : ' + newItem);

        // ajout de l'item dans la todo pour les clients qui vont se connecter plus tard
        var itemId = todolist.push(newItem) - 1;

        // On emet l'evenement d'ajout d'item
        socket.emit('newItem', newItem, itemId);

        // On signale aux autres clients qu'il y a un nouvel item
        socket.broadcast.emit('newItem', newItem, itemId);
    });

    // Reception d'un element a supprimer dans la Todo List
    socket.on('deleteItem', function (itemToDelete) {
        // On récupère le pseudo de celui qui demande la suppression de l'item
        console.log(socket.pseudo + ' me demande de supprimer un item : ' + itemToDelete);

        // suppression de l'item dans la todo pour les clients qui vont se connecter plus tard
        todolist.splice(itemToDelete, 1);
        console.log(todolist);

        // On emet l'evenement de suppression d'item
        //socket.emit('deleteItem', itemToDelete);

        // On signale aux autres clients qu'il y a un item supprimé
        socket.broadcast.emit('deleteItem', itemToDelete);
    });
});

server.listen(8080);
