exports.deleteRoom = (io, roomName) => {
  const room = io.sockets.adapter.rooms[roomName];
  if (room && room.sockets) { // room.sockets.forEach is not a function
    room.sockets.forEach((s) => {
      s.leave(room);
    });
  }
};
