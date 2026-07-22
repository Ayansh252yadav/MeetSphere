const {Server}=require("socket.io");

const connection={};
const message={};
const timeOnline={};
const usernames={}; // socket.id -> username
const screenSharing={}; // room path -> socket.id of current presenter (or undefined)

// Finds which room a given socket currently belongs to.
function findRoom(socketId){
    for(const [room, members] of Object.entries(connection)){
        if(members.includes(socketId)){
            return room;
        }
    }
    return null;
}

const connectToSocket=(server)=>{
    const io=new Server(server,{
        cors:{
            origin: process.env.CLIENT_URL,
            methods:["GET","POST"],
            allowedHeaders:["*"],
            credentials:true
        }
    });

    io.on("connection",(socket)=>{
        // join-call accepts a second "username" argument
        socket.on("join-call",(path, username)=>{

            if(connection[path]===undefined){
                connection[path]=[];
            }
            connection[path].push(socket.id)
            timeOnline[socket.id]=new Date();

            // remember this socket's username (fallback if not provided)
            usernames[socket.id] = username || `User-${socket.id.slice(0,5)}`;

            for(let i=0;i<connection[path].length;i++){
                io.to(connection[path][i]).emit("user-joined",socket.id,connection[path])
            }

            // tell everyone already in the room this new user's name
            connection[path].forEach((clientId)=>{
                if(clientId !== socket.id){
                    io.to(clientId).emit("user-name", socket.id, usernames[socket.id]);
                }
            });

            // send the new user the names of everyone already present
            connection[path].forEach((clientId)=>{
                if(clientId !== socket.id && usernames[clientId]){
                    io.to(socket.id).emit("user-name", clientId, usernames[clientId]);
                }
            });

            // if someone in this room is already presenting their
            // screen, let the newly joined user know right away so
            // their UI switches to the full-screen presenter layout.
            if(screenSharing[path]){
                io.to(socket.id).emit("screen-share-status", screenSharing[path], true);
            }

            if(message[path]!=undefined){
                for(let a=0;a<message[path].length;a++){
                    io.to(socket.id).emit("chat-message",message[path][a]['data'],message[path][a]['sender'],message[path][a]['socket-id-sender'])
                }
            }

        });
        socket.on("signal",(toId,message)=>{
            io.to(toId).emit("signal",socket.id,message);
        });

        socket.on("chat-message",(data,sender)=>{

            const[matchingRoom,found]=Object.entries(connection).reduce(([room,isFound],[roomKey,roomValue])=>{
                if(!isFound && roomValue.includes(socket.id)){
                    return [roomKey ,true];
                }
                return [room,isFound];
            },['',false]);
            if(found===true){
                if(message[matchingRoom]===undefined){
                    message[matchingRoom]=[];
                }
                message[matchingRoom].push({'sender':sender ,'data':data,'socket-id-sender':socket.id});

                connection[matchingRoom].forEach(element => {
                    io.to(element).emit("chat-message",data,sender,socket.id)
                });
            }
        })

        // a participant started or stopped sharing their screen.
        // Broadcast it to everyone else in the same room so their
        // client can switch into (or out of) the full-screen
        // presenter layout.
        socket.on("screen-share-status",(isSharing)=>{
            const room=findRoom(socket.id);
            if(!room) return;

            if(isSharing){
                screenSharing[room]=socket.id;
            } else if(screenSharing[room]===socket.id){
                delete screenSharing[room];
            }

            connection[room].forEach((clientId)=>{
                if(clientId!==socket.id){
                    io.to(clientId).emit("screen-share-status", socket.id, isSharing);
                }
            });
        });

        socket.on("disconnect",()=>{
          const diffTime=Math.abs(timeOnline[socket.id]-new Date());
          let key;
          for(const [k,v] of JSON.parse(JSON.stringify(Object.entries(connection)))){
            for(let a=0;a<v.length;a++){
                if(v[a]===socket.id){
                    key =k;
                    for(let i=0;i<connection[key].length;i++){
                        io.to(connection[key][i]).emit("user-left",socket.id)
                    }
                    const index=connection[key].indexOf(socket.id);
                    connection[key].splice(index,1);

                    if(connection[key].length==0){
                        delete connection[key];
                    }
                }
            }
          }

          // if the disconnecting user was presenting, clear that
          // room's presenter so future joiners don't get a stale flag.
          if(key && screenSharing[key]===socket.id){
              delete screenSharing[key];
          }

          // clean up the username entry
          delete usernames[socket.id];
        })
    })
    return io;
}
module.exports=connectToSocket;