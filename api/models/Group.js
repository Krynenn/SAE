//Entité Group
const mongoose = require('mongoose');
const {Schema, model} = mongoose;

const GroupSchema = new Schema({
  name: { type: String, required: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' } 
});

const GroupModel = model('Group', GroupSchema);

module.exports = GroupModel;