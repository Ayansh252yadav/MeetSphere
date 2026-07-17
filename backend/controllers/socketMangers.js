const {Server}=require("socket.io");

const connection={};
const message={};
const timeOnline={};
const usernames={}; // NEW: socket.id -> username

const connectToSocket=(server)=>{
    const io=new Server(server,{
        cors:{
            origin:"http://localhost:5173",
            methods:["GET","POST"],
            allowedHeaders:["*"],
            credentials:true
        }
    });

    io.on("connection",(socket)=>{
        // CHANGED: join-call now accepts a second "username" argument
        socket.on("join-call",(path, username)=>{

            if(connection[path]===undefined){
                connection[path]=[];
            }
            connection[path].push(socket.id)
            timeOnline[socket.id]=new Date();

            // NEW: remember this socket's username (fallback if not provided)
            usernames[socket.id] = username || `User-${socket.id.slice(0,5)}`;

            for(let i=0;i<connection[path].length;i++){
                io.to(connection[path][i]).emit("user-joined",socket.id,connection[path])
            }

            // NEW: tell everyone already in the room this new user's name
            connection[path].forEach((clientId)=>{
                if(clientId !== socket.id){
                    io.to(clientId).emit("user-name", socket.id, usernames[socket.id]);
                }
            });

            // NEW: send the new user the names of everyone already present
            connection[path].forEach((clientId)=>{
                if(clientId !== socket.id && usernames[clientId]){
                    io.to(socket.id).emit("user-name", clientId, usernames[clientId]);
                }
            });

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

          // NEW: clean up the username entry
          delete usernames[socket.id];
        })
    })
    return io;
}
module.exports=connectToSocket;