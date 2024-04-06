//Entité Contact
const mongoose = require('mongoose');
const {Schema, model} = mongoose;

const ContactSchema = new Schema({
    Nom:String,
    Prenom:String,
    Numero:String,
    Cover:String,
    Favori: { type: Boolean },
    Author:{type:Schema.Types.ObjectId, ref:'User'},
    groupes: [{ type: Schema.Types.ObjectId, ref: 'Group' }]

});

const ContactModel = model('Contact', ContactSchema);

module.exports = ContactModel;





