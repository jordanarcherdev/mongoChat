const mongo = require('mongodb').MongoClient;
const io = require('socket.io').listen(4000).sockets;

//Connect to database
mongo.connect('mongodb://127.0.0.1/mongochat', (err, client) => {
  if(err){
    throw err;
  }

  console.log('mongodb connected...');

  //Connect to socket.io
  io.on('connection', (socket) => {
    let chat = client.db('mongochat').collection('chats');

    //Create function to send status
    sendStatus = function(s){
      socket.emit('status', s);
    }

    //Get chats from mongo collection
    chat.find().limit(100).sort({_id:1}).toArray(function(err, res){
      if(err){
        throw err;
      }

      //Emit the messages
      socket.emit('output', res);

    });

    //Handle input events
    socket.on('input', (data) => {
      let name = data.name;
      let message = data.message;

      //Check for name and message
      if(name == '' || message == ''){
        //Send error status
        sendStatus('Please enter a name and message');
      }else{
        //Insert message to database
        chat.insert({name: name, message: message}, () => {
          io.emit('output', [data]);

          //Send status object
          sendStatus({message: 'Message sent', clear: true});
        });
      }

    });
    //Handle clear
    socket.on('clear', (data) => {
      //Remove all chats from collection
      chat.remove({}, () => {
        //Emit cleared
        socket.emit('cleared');
      });
    });
  });
});
