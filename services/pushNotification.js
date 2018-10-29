/* eslint-disable no-plusplus,no-await-in-loop,quote-props */
const request = require('request-promise');
const {
  asyncRedisHGetAll,
  asyncRedisHMGet,
  asyncRedisHGet,
} = require('../helpers/redisAsync');

exports.sendPushNotif = async (notifData, group, targetUserId = null) => {
  const res1 = await asyncRedisHGetAll('refresh-tokens');
  const res2 = await asyncRedisHGetAll('ws-presence');
  const allUsers = Object.values(res1 || {});
  const onlineUsers = Object.keys(res2 || {});
  const seen = [];
  const targetUsers = [];

  allUsers.forEach((userId) => {
    if (!seen.includes(userId) && !onlineUsers.includes(userId)) {
      seen.push(userId);
      targetUsers.push(`user:${userId}`);
    }
  });

  console.log('targetUsers:', targetUsers);

  const res3 = [];

  if (targetUserId) {
    for (let i = 0; i < targetUsers.length; ++i) {
      const user = await asyncRedisHMGet(targetUsers[i], '_id', 'deviceToken');
      if (user[0] === targetUserId) {
        res3.push(user[1]);
      }
    }
  } else if (group === 'all') {
    for (let i = 0; i < targetUsers.length; ++i) {
      const deviceToken = await asyncRedisHGet(targetUsers[i], 'deviceToken');
      res3.push(deviceToken);
    }
  } else { // some specific group
    for (let i = 0; i < targetUsers.length; ++i) {
      const user = await asyncRedisHMGet(targetUsers[i], 'group', 'deviceToken');
      if (user[0] === group) {
        res3.push(user[1]);
      }
    }
  }

  if (res3.length > 0) {
    console.log('res3:', res3);
    const payload = JSON.stringify({
      registration_ids: res3,
      data: {
        text: notifData.message,
        ...notifData,
      },
    });

    console.log('payload', payload);
    const res = await request({
      url: 'https://fcm.googleapis.com/fcm/send',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `key=${process.env.FIREBASE_AUTH_KEY}`,
      },
      body: payload,
    });
    console.log('Firebase res:', res);
    return res;
  }

  return null;
};

