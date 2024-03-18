const mongoose = require('mongoose');
const {Schema, model} = mongoose;

const ContactSchema = new Schema({
    Nom:String,
    Prenom:String,
    Numero:String,
    Cover:String,
    Author:{type:Schema.Types.ObjectId, ref:'User'}

});

const ContactModel = model('Contact', ContactSchema);

module.exports = ContactModel;





