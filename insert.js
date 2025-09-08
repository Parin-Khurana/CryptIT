const mongoose = require('mongoose');
const Answer = require('./solution');

const ans= mongoose.connect('',// add your MongoDB URI here
  {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(async () => {
  await Answer.create({ level: 20, solution: 'parin' });
  console.log('Answer inserted!');
  mongoose.disconnect();
}).catch(err => {
  console.error('Connection error:', err);
});
module.exports=ans