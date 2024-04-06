const express = require('express');
const cors = require('cors');
const mongoose = require("mongoose");
const User = require('./models/User');
const Contact = require('./models/Contact');
const Group_Model = require('./models/Group');
const bcrypt = require('bcryptjs');
const app = express();
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const multer = require('multer');
const uploadMiddleware = multer({dest:'uploads/'});
const fs = require ('fs');
const { group } = require('console');
const { ObjectId } = require('mongoose').Types;

const salt = bcrypt.genSaltSync(10);
const secret = 'asdfe45we45w345wegw345werjktjwertkj';

app.use(cors({credentials:true,origin:'http://localhost:3000'}));
app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(__dirname + '/uploads'));

//Connexion à la page de donnée
mongoose.connect('mongodb+srv://samsamcoste:mXekpE51GJnG5bF8@cluster0.xjc6mfs.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0');

//Création d'un utilisateur
app.post('/register', async (req,res) => {
  const {username,password} = req.body;
  try{
    const userDoc = await User.create({
      username,
      password:bcrypt.hashSync(password,salt),
    });
    res.json(userDoc);
  } catch(e) {
    console.log(e);
    res.status(400).json(e);
  }
});

//Connexion d'un utilisateur, on vérifie si le password donnée est le bon
app.post('/login', async (req,res) => {
  const {username,password} = req.body;
  const userDoc = await User.findOne({username});
  const passOk = bcrypt.compareSync(password, userDoc.password);
  if (passOk) {
    // logged in
    jwt.sign({username,id:userDoc._id}, secret, {}, (err,token) => {
      if (err) throw err;
      res.cookie('token', token).json({
        id:userDoc._id,
        username,
      });
    });
  } else {
    res.status(400).json('wrong credentials');
  }
});

app.get('/profile', (req,res) => {
  const {token} = req.cookies;
  jwt.verify(token, secret, {}, (err,info) => {
    if (err) throw err;
    res.json(info);
  });
});

//Quand on fait logout, on détruit le cookie de l'utilisateur, ce qui entraîne une modification du header
app.post('/logout', (req,res) => {
  res.cookie('token', '').json('ok');
});

//Création d'un contact
app.post('/post', uploadMiddleware.single('file'), async (req, res) => {
  //Gestion du fichier photo
  const { originalname, path } = req.file;
  const parts = originalname.split('.');
  const ext = parts[parts.length - 1];
  const newPath = path + '.' + ext;
  fs.renameSync(path,newPath);

  const { token } = req.cookies;
  jwt.verify(token, secret, {}, async (err, info) => {
      if (err) {
          console.error('Erreur lors de la vérification du token JWT :', err);
          return res.status(401).json('Unauthorized');
      }

      const { Nom, Prenom, Numero, selectedGroupes } = req.body;

      try {
          const groupIds = JSON.parse(selectedGroupes); 

          const postDoc = await Contact.create({
              Nom,
              Prenom,
              Numero,
              Cover: newPath,
              Favori: false,
              Author: info.id,
              groupes: groupIds  
          });

          res.json(postDoc);
      } catch (error) {
          console.error('Erreur lors de la création du contact :', error);
          res.status(500).json('Erreur lors de la création du contact');
      }
  });
});

//Modification d'un contact
app.put('/post', uploadMiddleware.single('file'), async (req, res) => {
  let newPath = null;
  if (req.file) {
    const { originalname, path } = req.file;
    const parts = originalname.split('.');
    const ext = parts[parts.length - 1];
    newPath = path + '.' + ext;
    fs.renameSync(path, newPath);
  }

  const { token } = req.cookies;
  jwt.verify(token, secret, {}, async (err, info) => {
    if (err) throw err;
    const { id, Nom, Prenom, Numero,selectedGroups } = req.body;
    const groupIds = JSON.parse(selectedGroups);
    try {
      const contact = await Contact.findById(id);
      if (!contact) {
        return res.status(404).json('Contact not found');
      }
      if (contact.Author.toString() !== info.id) {
        return res.status(400).json('You are not the author');
      }

      contact.Nom = Nom;
      contact.Prenom = Prenom;
      contact.Numero = Numero;
      contact.Favori = contact.Favori;
      contact.Cover = newPath ? newPath : contact.Cover;
      contact.groupes = groupIds;

      await contact.save();

      res.json(contact);
    } catch (error) {
      console.error('Error updating contact:', error);
      res.status(500).json('Server error');
    }
  });
});

//Création d'un groupe 
app.post('/group', async (req, res) => {
  const { token } = req.cookies;
  jwt.verify(token, secret, {}, async (err, info) => {
    if (err) {
      console.error('Erreur lors de la vérification du token JWT :', err);
      return res.status(401).json('Unauthorized');
    }

    try {
      const { name } = req.body; 

      const group = await Group_Model.create({
        name: name,
        createdBy: info.id,
      });

      res.status(201).json(group);
    } catch (error) {
      console.error('Erreur lors de la création du groupe :', error);
      res.status(500).json('Erreur lors de la création du groupe');
    }
  });
});

//Récupérer les groupes 
app.get('/groups', async (req, res) => {
  const { token } = req.cookies;
  jwt.verify(token, secret, {}, async (err, info) => {
    if (err) {
      console.error('Erreur lors de la vérification du token JWT :', err);
      return res.status(401).json('Unauthorized');
    }
    
    try {
      // Récupération des groupes associés à l'utilisateur
      const groups = await Group_Model.find({ createdBy: info.id });
      res.json(groups);
    } catch (error) {
      console.error('Erreur lors de la récupération des groupes :', error);
      res.status(500).json('Erreur lors de la récupération des groupes');
    }
  });
});


//Modification d'un contact
/*
app.post('/post', uploadMiddleware.single('file'), async (req, res) => {
  const { originalname, path } = req.file;
  const parts = originalname.split('.');
  const ext = parts[parts.length - 1];
  const newPath = path + '.' + ext;
  fs.renameSync(path,newPath);


  const { token } = req.cookies;
  jwt.verify(token, secret, {}, async (err, info) => {
      if (err) {
          console.error('Erreur lors de la vérification du token JWT :', err);
          return res.status(401).json('Unauthorized');
      }

      const { Nom, Prenom, Numero, selectedGroupes } = req.body;

      // Convertir les identifiants de groupe en ObjectIds
      

      try {
          const postDoc = await Contact.create({
              Nom,
              Prenom,
              Numero,
              Cover: newPath,
              Favori: false,
              Author: info.id,
             
          });

          res.json(postDoc);
      } catch (error) {
          console.error('Erreur lors de la création du contact :', error);
          res.status(500).json('Erreur lors de la création du contact');
      }
  });
});

*/

//Trouver les contacts d'un utilisateur
app.get('/post', async (req, res) => {
    const {token} = req.cookies;
    if (!token) {
      return res.status(401).json('Unauthorized');
    }
    jwt.verify(token, secret, async (err, info) => {
      if (err) {
        return res.status(401).json('Unauthorized');
      }
      try {
        const contacts = await Contact.find({ Author: info.id });
        res.json(contacts);
      } catch (error) {
        console.error(error);
        res.status(500).json('Server error');
      }
    });
});

//Trouver les contacs par rapport aux groupes
app.post('/filteredContacts', async (req, res) => {
  const { selectedGroups } = req.body;

  try {
      const filteredContacts = await Contact.find({ groupes: { $all: selectedGroups } });

      res.json(filteredContacts);
  } catch (error) {
      console.error('Erreur lors de la récupération des contacts filtrés :', error);
      res.status(500).json('Erreur lors de la récupération des contacts filtrés');
  }
});


//Trouver les contacts favoris d'un utilisateur
app.get('/favorite', async (req, res) => {
  const { token } = req.cookies;
  if (!token) {
    return res.status(401).json('Unauthorized');
  }
  jwt.verify(token, secret, async (err, info) => {
    if (err) {
      return res.status(401).json('Unauthorized');
    }
    try {
      const favoriteContacts = await Contact.find({ Author: info.id, Favori: true });
      res.json(favoriteContacts);
    } catch (error) {
      console.error(error);
      res.status(500).json('Server error');
    }
  });
});

//Supprimer un contact
app.delete('/contact/:id', async (req, res) => {
    const { id } = req.params;
    try {
      await Contact.findByIdAndDelete(id);
      res.status(200).json('Contact supprimé avec succès');
    } catch (error) {
      console.error('Erreur lors de la suppression du contact :', error);
      res.status(500).json('Erreur lors de la suppression du contact');
    }
});

//Supprimer un groupe
app.delete('/deletegroup/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await Group_Model.findByIdAndDelete(id);
    res.status(200).json('Groupe supprimé avec succès');
  } catch (error) {
    console.error('Erreur lors de la suppression du groupe :', error);
    res.status(500).json('Erreur lors de la suppression du groupe');
  }
});

//Trouver les informaitons d'un contact en particulier
app.get('/post/:id', async (req, res) => {
  const contactId = req.params.id;
  try {
      const contact = await Contact.findById(contactId);
      if (!contact) {
          return res.status(404).json('Contact not found');
      }
      res.json(contact);
  } catch (error) {
      console.error('Error fetching contact:', error);
      res.status(500).json('Server error');
  }
});

//Mise à jour du fabori d'un contact
app.put('/contact/:id', async (req, res) => {
  const { id } = req.params;
  const { Favori } = req.body;
  try {
    const contact = await Contact.findById(id);
    if (!contact) {
      return res.status(404).json('Contact not found');
    }

    // Met à jour le champ Favori avec la valeur fournie dans la requête
    contact.Favori = Favori;

    // Sauvegarde les modifications dans la base de données
    await contact.save();

    // Répond avec le contact mis à jour
    res.json(contact);
  } catch (error) {
    console.error('Error updating contact:', error);
    res.status(500).json('Server error');
  }
});

app.listen(4000);
